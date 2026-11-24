import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../api/api_client.dart';
import '../api/api_endpoints.dart';
import '../storage/session_storage.dart';
import '../sync/sync_queue.dart';
import '../../models/quest_model.dart';
import '../../models/user_model.dart';
import 'auth_provider.dart';

final questsProvider = StateNotifierProvider<QuestsNotifier, List<QuestModel>>((ref) {
  return QuestsNotifier(ref);
});

class QuestsNotifier extends StateNotifier<List<QuestModel>> {
  final Ref _ref;

  static const List<QuestModel> defaultQuests = [
    QuestModel(
      id: 'default_1',
      title: 'Cellular Hydration Protocol',
      description: 'Infuse your matrix with 1.0L of water + electrolytes.',
      category: 'fitness',
      xp: 35,
      attribute: 'VIT',
      completed: false,
      difficulty: 'E',
    ),
    QuestModel(
      id: 'default_2',
      title: 'Air-Gap Deep Work',
      description: 'Zero distractions for 25 uninterrupted minutes.',
      category: 'productivity',
      xp: 50,
      attribute: 'INT',
      completed: false,
      difficulty: 'D',
    ),
    QuestModel(
      id: 'default_3',
      title: 'Neural Decompression',
      description: '10 minutes of box-breathing or non-sleep deep rest.',
      category: 'mindfulness',
      xp: 25,
      attribute: 'WIL',
      completed: false,
      difficulty: 'E',
    ),
  ];

  QuestsNotifier(this._ref) : super(defaultQuests) {
    loadQuests();
  }

  /// Load quests from API, with persistent cache fallback for offline mode
  Future<void> loadQuests() async {
    try {
      final dio = await ApiClient.getInstance();
      final response = await dio.get(ApiEndpoints.quests);

      if (response.statusCode == 200 && response.data is List && mounted) {
        final list = (response.data as List)
            .map((item) => QuestModel.fromJson(item as Map<String, dynamic>))
            .toList();
        if (list.isNotEmpty && mounted) {
          state = list;
          await SessionStorage.saveCachedQuests(list);
        }
      }
    } on DioException catch (e) {
      if (ApiClient.isOffline(e)) {
        // Load persistent offline cached quests
        final cached = await SessionStorage.getCachedQuests();
        if (cached != null && cached.isNotEmpty && mounted) {
          state = cached;
        }
      }
      // Real server errors (500, 401) are not masked
    } catch (_) {}
  }

  /// Idempotent, race-protected quest completion
  Future<bool> toggleQuest(String questId) async {
    final index = state.indexWhere((q) => q.id == questId);
    if (index == -1) return false;

    final target = state[index];

    // Prevent double-tap race: if already in progress or completed, return
    if (target.isCompleting || target.completed) return false;

    // 1. Optimistic UI update: mark isCompleting: true immediately
    final updatedList = List<QuestModel>.from(state);
    updatedList[index] = target.copyWith(isCompleting: true, completed: true);
    if (mounted) state = updatedList;

    final idempotencyKey = 'quest_${questId}_${DateTime.now().millisecondsSinceEpoch}';

    // 2. Sync to Backend
    try {
      final dio = await ApiClient.getInstance();
      final response = await dio.post(
        ApiEndpoints.completeQuest(questId),
        options: Options(headers: {'idempotency-key': idempotencyKey}),
      );

      if ((response.statusCode == 200 || response.statusCode == 409) && mounted) {
        final data = response.data;

        // Update User progression from backend server payload
        if (data is Map<String, dynamic> && data['user'] != null) {
          final updatedUser = UserModel.fromJson(data['user'] as Map<String, dynamic>);
          _ref.read(authProvider.notifier).updateUser(updatedUser);
        }

        final confirmedList = List<QuestModel>.from(state);
        confirmedList[index] = target.copyWith(isCompleting: false, completed: true);
        if (mounted) state = confirmedList;
        await SessionStorage.saveCachedQuests(state);
        return true;
      }
      return true;
    } on DioException catch (e) {
      // Handle 409 already_completed gracefully (silently accept server state)
      if (e.response?.statusCode == 409) {
        final data = e.response?.data;
        if (data is Map<String, dynamic> && data['user'] != null) {
          final updatedUser = UserModel.fromJson(data['user'] as Map<String, dynamic>);
          _ref.read(authProvider.notifier).updateUser(updatedUser);
        }
        final confirmedList = List<QuestModel>.from(state);
        confirmedList[index] = target.copyWith(isCompleting: false, completed: true);
        if (mounted) state = confirmedList;
        return true;
      }

      // Offline handling: queue operation for background sync
      if (ApiClient.isOffline(e)) {
        await SyncQueueService.enqueue(
          PendingOperation(
            id: idempotencyKey,
            type: SyncOpType.completeQuest,
            endpoint: ApiEndpoints.completeQuest(questId),
            payload: {},
            createdAt: DateTime.now(),
          ),
        );

        // Optimistic local progression while offline
        final currentUser = _ref.read(authProvider).value;
        if (currentUser != null) {
          final newXp = currentUser.xp + target.xp;
          final updatedLocalUser = currentUser.copyWith(
            xp: newXp,
            coins: currentUser.coins + 10,
          );
          _ref.read(authProvider.notifier).updateUser(updatedLocalUser);
        }

        final offlineList = List<QuestModel>.from(state);
        offlineList[index] = target.copyWith(isCompleting: false, completed: true);
        if (mounted) state = offlineList;
        await SessionStorage.saveCachedQuests(state);
        return true;
      }

      // Real server error (4xx/5xx): revert optimistic toggle
      if (mounted) {
        final revertedList = List<QuestModel>.from(state);
        revertedList[index] = target.copyWith(isCompleting: false, completed: false);
        state = revertedList;
      }
      return false;
    } catch (_) {
      if (mounted) {
        final revertedList = List<QuestModel>.from(state);
        revertedList[index] = target.copyWith(isCompleting: false, completed: false);
        state = revertedList;
      }
      return false;
    }
  }
}
