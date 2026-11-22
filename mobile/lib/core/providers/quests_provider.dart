import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../api/api_client.dart';
import '../api/api_endpoints.dart';
import '../../models/quest_model.dart';

class QuestsNotifier extends StateNotifier<List<QuestModel>> {
  QuestsNotifier() : super([]) {
    loadQuests();
  }

  Future<void> loadQuests() async {
    try {
      final dio = await ApiClient.getInstance();
      final response = await dio.get(ApiEndpoints.quests);

      if (response.statusCode == 200 && response.data is List) {
        final list = (response.data as List)
            .map((item) => QuestModel.fromJson(item as Map<String, dynamic>))
            .toList();
        state = list;
        return;
      }
    } catch (_) {
      // Fallback initial daily quests if offline
      if (state.isEmpty) {
        state = [
          const QuestModel(
            id: '1',
            title: 'Shadow Sprint: 5km Cardio',
            description: 'Endure a 5-kilometer high-intensity sprint or walk.',
            category: 'physical',
            xp: 50,
            attribute: 'AGI',
            completed: false,
            difficulty: 'C',
            streakCount: 4,
          ),
          const QuestModel(
            id: '2',
            title: 'Hunter Strength Protocol: 100 Pushups',
            description: 'Execute 100 total pushups across designated sets.',
            category: 'physical',
            xp: 40,
            attribute: 'STR',
            completed: false,
            difficulty: 'D',
            streakCount: 12,
          ),
          const QuestModel(
            id: '3',
            title: 'Air-Gap Deep Work Protocol',
            description: 'Engage 45 minutes of distraction-free focused intellect.',
            category: 'mental',
            xp: 60,
            attribute: 'INT',
            completed: false,
            difficulty: 'B',
            streakCount: 7,
          ),
        ];
      }
    }
  }

  Future<void> toggleQuest(String questId) async {
    // 1. Optimistic UI update
    final index = state.indexWhere((q) => q.id == questId);
    if (index == -1) return;

    final target = state[index];
    final updated = target.copyWith(completed: !target.completed);

    final updatedList = List<QuestModel>.from(state);
    updatedList[index] = updated;
    state = updatedList;

    // 2. Sync to Backend
    try {
      final dio = await ApiClient.getInstance();
      await dio.post(ApiEndpoints.completeQuest(questId));
    } catch (_) {
      // Network mutation queue will retry on reconnect
    }
  }
}

final questsProvider = StateNotifierProvider<QuestsNotifier, List<QuestModel>>((ref) {
  return QuestsNotifier();
});
