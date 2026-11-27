import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../api/api_client.dart';
import '../api/api_endpoints.dart';
import '../storage/session_storage.dart';
import '../sync/sync_queue.dart';
import '../widgets/home_widget_bridge.dart';
import '../../models/quest_model.dart';
import '../../models/user_model.dart';
import 'auth_provider.dart';

class QuestCompletionOutcome {
  final bool success;
  final bool offline;
  final bool levelUp;
  final int? newLevel;
  final int pointsAwarded;
  final String? rankPromoted;
  final bool penaltyCleared;
  final List<String> newlyUnlockedShadows;
  final int xpAwarded;
  final int coinsAwarded;

  const QuestCompletionOutcome({
    required this.success,
    this.offline = false,
    this.levelUp = false,
    this.newLevel,
    this.pointsAwarded = 0,
    this.rankPromoted,
    this.penaltyCleared = false,
    this.newlyUnlockedShadows = const [],
    this.xpAwarded = 0,
    this.coinsAwarded = 0,
  });
}

final questsProvider = StateNotifierProvider<QuestsNotifier, List<QuestModel>>((ref) {
  final notifier = QuestsNotifier(ref);
  ref.listen<AsyncValue<UserModel?>>(authProvider, (prev, next) {
    final prevId = prev?.value?.id;
    final nextId = next.value?.id;
    if (nextId != null && nextId != prevId) {
      notifier.loadQuests();
    } else if (nextId == null && prevId != null) {
      notifier.clearQuests();
    }
  });
  return notifier;
});

class QuestsNotifier extends StateNotifier<List<QuestModel>> {
  final Ref _ref;

  static const List<QuestModel> defaultQuests = [
    QuestModel(
      id: 'default_1',
      title: 'Cellular Hydration Protocol',
      description: 'Drink 1.0L of water with electrolytes today.',
      category: 'fitness',
      xp: 35,
      coins: 15,
      attribute: 'VIT',
      completed: false,
      difficulty: 'E',
    ),
    QuestModel(
      id: 'default_2',
      title: 'Air-Gap Deep Work',
      description: 'Focus with zero distractions for 25 minutes straight.',
      category: 'productivity',
      xp: 50,
      coins: 20,
      attribute: 'INT',
      completed: false,
      difficulty: 'D',
    ),
    QuestModel(
      id: 'default_3',
      title: 'Neural Decompression',
      description: 'Do 10 minutes of deep breathing or quiet rest.',
      category: 'mindfulness',
      xp: 25,
      coins: 10,
      attribute: 'WIL',
      completed: false,
      difficulty: 'E',
    ),
  ];

  QuestsNotifier(this._ref) : super(defaultQuests) {
    if (_ref.read(authProvider).value != null) {
      loadQuests();
    }
  }

  void clearQuests() {
    if (mounted) state = defaultQuests;
  }

  /// Fetch real quests from backend API, seamlessly backed by local cache when offline
  Future<void> loadQuests() async {
    try {
      final cached = await SessionStorage.getCachedQuests();
      if (cached != null && cached.isNotEmpty && mounted) {
        state = cached;
      }

      final dio = await ApiClient.getInstance();
      final response = await dio.get(ApiEndpoints.quests);

      if (response.statusCode == 200 && response.data is List && mounted) {
        final List data = response.data as List;
        final quests = data
            .map((item) => QuestModel.fromJson(item as Map<String, dynamic>))
            .toList();
        state = quests.isNotEmpty ? quests : defaultQuests;
        await SessionStorage.saveCachedQuests(state);
        final u = _ref.read(authProvider).value;
        if (u != null) {
          HomeWidgetBridge.syncFromState(user: u, quests: state);
        }
      }
    } on DioException catch (e) {
      if (ApiClient.isOffline(e) && mounted) {
        final cached = await SessionStorage.getCachedQuests();
        if (cached != null && cached.isNotEmpty) {
          state = cached;
        } else if (state.isEmpty) {
          state = defaultQuests;
        }
      }
    } catch (_) {
      if (mounted && state.isEmpty) {
        state = defaultQuests;
      }
    }
  }

  Future<bool> toggleQuest(String questId) async {
    final outcome = await completeQuestWithOutcome(questId);
    return outcome.success;
  }

  /// Idempotent, race-protected quest completion returning Solo Leveling event telemetry.
  Future<QuestCompletionOutcome> completeQuestWithOutcome(String questId) async {
    final index = state.indexWhere((q) => q.id == questId);
    if (index == -1) return const QuestCompletionOutcome(success: false);

    final target = state[index];
    if (target.isCompleting || target.completed) {
      return const QuestCompletionOutcome(success: false);
    }

    final updatedList = List<QuestModel>.from(state);
    updatedList[index] = target.copyWith(isCompleting: true, completed: true);
    if (mounted) state = updatedList;

    final idempotencyKey =
        'quest_${questId}_${DateTime.now().millisecondsSinceEpoch}';

    try {
      final dio = await ApiClient.getInstance();
      final response = await dio.post(
        ApiEndpoints.completeQuest(questId),
        options: Options(headers: {'idempotency-key': idempotencyKey}),
      );

      if ((response.statusCode == 200 || response.statusCode == 409) && mounted) {
        final data = response.data;
        if (data is Map<String, dynamic> && data['user'] != null) {
          final updatedUser =
              UserModel.fromJson(data['user'] as Map<String, dynamic>);
          _ref.read(authProvider.notifier).updateUser(updatedUser);
        }

        final confirmedList = List<QuestModel>.from(state);
        confirmedList[index] =
            target.copyWith(isCompleting: false, completed: true);
        if (mounted) state = confirmedList;
        await SessionStorage.saveCachedQuests(state);

        if (data is Map<String, dynamic>) {
          final shadows = data['newlyUnlockedShadows'] is List
              ? (data['newlyUnlockedShadows'] as List)
                  .map((e) => e.toString())
                  .toList()
              : const <String>[];
          return QuestCompletionOutcome(
            success: true,
            levelUp: data['levelUp'] == true,
            newLevel: (data['newLevel'] as num?)?.toInt(),
            pointsAwarded: (data['pointsAwarded'] as num?)?.toInt() ?? 0,
            rankPromoted: data['rankPromoted']?.toString(),
            penaltyCleared: data['penaltyCleared'] == true,
            newlyUnlockedShadows: shadows,
            xpAwarded: (data['xpAwarded'] as num?)?.toInt() ?? target.xp,
            coinsAwarded: (data['coinsAwarded'] as num?)?.toInt() ?? target.coins,
          );
        }
        return QuestCompletionOutcome(
          success: true,
          xpAwarded: target.xp,
          coinsAwarded: target.coins,
        );
      }
      return const QuestCompletionOutcome(success: true);
    } on DioException catch (e) {
      if (e.response?.statusCode == 409) {
        final data = e.response?.data;
        if (data is Map<String, dynamic> && data['user'] != null) {
          final updatedUser =
              UserModel.fromJson(data['user'] as Map<String, dynamic>);
          _ref.read(authProvider.notifier).updateUser(updatedUser);
        }
        final confirmedList = List<QuestModel>.from(state);
        confirmedList[index] =
            target.copyWith(isCompleting: false, completed: true);
        if (mounted) state = confirmedList;
        return const QuestCompletionOutcome(success: true);
      }

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

        final currentUser = _ref.read(authProvider).value;
        if (currentUser != null) {
          final newXp = currentUser.xp + target.xp;
          final updatedLocalUser = currentUser.copyWith(
            xp: newXp,
            coins: currentUser.coins + target.coins,
          );
          _ref.read(authProvider.notifier).updateUser(updatedLocalUser);
        }

        final offlineList = List<QuestModel>.from(state);
        offlineList[index] =
            target.copyWith(isCompleting: false, completed: true);
        if (mounted) state = offlineList;
        await SessionStorage.saveCachedQuests(state);
        return QuestCompletionOutcome(
          success: true,
          offline: true,
          xpAwarded: target.xp,
          coinsAwarded: target.coins,
        );
      }

      if (mounted) {
        final currentIndex = state.indexWhere((q) => q.id == questId);
        if (currentIndex != -1) {
          final revertedList = List<QuestModel>.from(state);
          revertedList[currentIndex] =
              target.copyWith(isCompleting: false, completed: false);
          state = revertedList;
        }
      }
      return const QuestCompletionOutcome(success: false);
    } catch (_) {
      if (mounted) {
        final currentIndex = state.indexWhere((q) => q.id == questId);
        if (currentIndex != -1) {
          final revertedList = List<QuestModel>.from(state);
          revertedList[currentIndex] =
              target.copyWith(isCompleting: false, completed: false);
          state = revertedList;
        }
      }
      return const QuestCompletionOutcome(success: false);
    }
  }

  /// Break an intimidating quest into one concrete 5-minute starter micro-step (#5).
  Future<Map<String, dynamic>?> unstickQuest(
    String questId, {
    String? obstacleNote,
  }) async {
    try {
      final dio = await ApiClient.getInstance();
      final res = await dio.post(
        ApiEndpoints.unstickQuest(questId),
        data: {
          if (obstacleNote != null && obstacleNote.trim().isNotEmpty)
            'obstacleNote': obstacleNote.trim(),
        },
      );
      if (res.data is Map<String, dynamic>) {
        final data = res.data as Map<String, dynamic>;
        final starterAction = data['starterAction']?.toString();
        if (starterAction != null && starterAction.isNotEmpty) {
          final index = state.indexWhere((q) => q.id == questId);
          if (index != -1 && mounted) {
            final updated = List<QuestModel>.from(state);
            updated[index] = updated[index].copyWith(content: starterAction);
            state = updated;
          }
        }
        return data;
      }
    } catch (_) {}
    return null;
  }
}
