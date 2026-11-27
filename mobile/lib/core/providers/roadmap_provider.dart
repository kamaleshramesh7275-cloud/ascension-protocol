import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../models/roadmap_models.dart';
import '../api/api_client.dart';
import '../api/api_endpoints.dart';
import '../sync/sync_queue.dart';

class RoadmapState {
  final RoadmapModel? roadmap;
  final RoadmapTrajectoryModel? trajectory;
  final bool loading;

  const RoadmapState({
    this.roadmap,
    this.trajectory,
    this.loading = false,
  });
}

class RoadmapToggleOutcome {
  final bool unlockedNextWeek;
  final bool weekCleared;
  final bool offline;

  const RoadmapToggleOutcome({
    this.unlockedNextWeek = false,
    this.weekCleared = false,
    this.offline = false,
  });
}

final roadmapProvider =
    StateNotifierProvider<RoadmapNotifier, RoadmapState>((ref) {
  return RoadmapNotifier();
});

class RoadmapNotifier extends StateNotifier<RoadmapState> {
  RoadmapNotifier() : super(const RoadmapState()) {
    loadRoadmap();
  }

  Future<void> loadRoadmap() async {
    state = RoadmapState(
      roadmap: state.roadmap,
      trajectory: state.trajectory,
      loading: true,
    );
    try {
      final dio = await ApiClient.getInstance();
      final roadmapRes = await dio.get(ApiEndpoints.roadmap);
      final roadmap = RoadmapModel.fromJson(roadmapRes.data as Map<String, dynamic>);

      RoadmapTrajectoryModel? trajectory;
      try {
        final trajRes = await dio.get(ApiEndpoints.roadmapTrajectory);
        if (trajRes.data is Map<String, dynamic>) {
          trajectory =
              RoadmapTrajectoryModel.fromJson(trajRes.data as Map<String, dynamic>);
        }
      } catch (_) {
        // 404 expected if execution profile is not yet set
      }

      if (mounted) {
        state = RoadmapState(
          roadmap: roadmap,
          trajectory: trajectory,
          loading: false,
        );
      }
    } catch (_) {
      if (mounted) {
        state = RoadmapState(
          roadmap: state.roadmap,
          trajectory: state.trajectory,
          loading: false,
        );
      }
    }
  }

  Future<RoadmapToggleOutcome> toggleTask(String taskId) async {
    final current = state.roadmap;
    if (current != null) {
      final updatedWeeks = current.weeks.map((w) {
        final tasks = w.tasks.map((t) {
          if (t.id == taskId) return t.copyWith(completed: !t.completed);
          return t;
        }).toList();
        return w.copyWith(tasks: tasks);
      }).toList();
      state = RoadmapState(
        roadmap: RoadmapModel(
          id: current.id,
          userId: current.userId,
          status: current.status,
          currentWeek: current.currentWeek,
          weeks: updatedWeeks,
        ),
        trajectory: state.trajectory,
      );
    }

    try {
      final dio = await ApiClient.getInstance();
      final res = await dio.post(ApiEndpoints.roadmapToggleTask(taskId));
      await loadRoadmap();
      if (res.data is Map) {
        return RoadmapToggleOutcome(
          unlockedNextWeek: res.data['unlockedNextWeek'] == true,
          weekCleared: res.data['weekCleared'] == true,
        );
      }
      return const RoadmapToggleOutcome();
    } on DioException catch (e) {
      if (ApiClient.isOffline(e)) {
        await SyncQueueService.enqueue(
          PendingOperation(
            id: 'roadmap_${taskId}_${DateTime.now().millisecondsSinceEpoch}',
            type: SyncOpType.toggleRoadmapTask,
            endpoint: ApiEndpoints.roadmapToggleTask(taskId),
            payload: {},
            createdAt: DateTime.now(),
          ),
        );
        return const RoadmapToggleOutcome(offline: true);
      }
      await loadRoadmap();
      rethrow;
    }
  }

  Future<void> recalibrate({
    String? goalText,
    int? dailyCapacityMinutes,
    String? primaryDistractor,
  }) async {
    state = RoadmapState(
      roadmap: state.roadmap,
      trajectory: state.trajectory,
      loading: true,
    );
    try {
      final dio = await ApiClient.getInstance();
      final res = await dio.post(
        ApiEndpoints.roadmapRecalibrate,
        data: {
          if (goalText != null && goalText.trim().isNotEmpty) 'goalText': goalText.trim(),
          'dailyCapacityMinutes': ?dailyCapacityMinutes,
          'primaryDistractor': ?primaryDistractor,
        },
      );
      if (res.data is Map<String, dynamic>) {
        final updated = RoadmapModel.fromJson(res.data as Map<String, dynamic>);
        if (mounted) {
          state = RoadmapState(
            roadmap: updated,
            trajectory: state.trajectory,
            loading: false,
          );
          return;
        }
      }
    } catch (_) {}
    await loadRoadmap();
  }
}
