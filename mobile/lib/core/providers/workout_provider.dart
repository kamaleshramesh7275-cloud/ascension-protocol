import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../models/user_model.dart';
import '../../models/workout_models.dart';
import '../api/api_client.dart';
import '../api/api_endpoints.dart';
import '../storage/local_cache_service.dart';
import '../storage/session_storage.dart';
import '../sync/sync_queue.dart';
import 'auth_provider.dart';

class WorkoutState {
  final List<ExerciseModel> exercises;
  final List<OfficialTemplateModel> officialTemplates;
  final List<WorkoutTemplateModel> userTemplates;
  final List<WorkoutSessionModel> sessions;
  final List<PersonalRecordModel> prs;
  final bool loading;

  const WorkoutState({
    this.exercises = const [],
    this.officialTemplates = const [],
    this.userTemplates = const [],
    this.sessions = const [],
    this.prs = const [],
    this.loading = false,
  });

  ExerciseModel? findExerciseById(String id) {
    for (final e in exercises) {
      if (e.id == id) return e;
    }
    return null;
  }

  ExerciseModel? findExerciseByName(String name) {
    final normalized = name.toLowerCase().trim();
    for (final e in exercises) {
      if (e.name.toLowerCase().trim() == normalized) return e;
    }
    for (final e in exercises) {
      if (e.name.toLowerCase().contains(normalized) ||
          normalized.contains(e.name.toLowerCase())) {
        return e;
      }
    }
    return null;
  }

  /// Highest recorded 1RM or weight PR for a given exercise (used by RET-3 Beat Last Session).
  double best1RMForExercise(String exerciseId) {
    double best = 0.0;
    for (final pr in prs) {
      if (pr.exerciseId == exerciseId &&
          (pr.recordType == '1rm' || pr.recordType == 'best_weight')) {
        if (pr.value > best) best = pr.value;
      }
    }
    return best;
  }
}

class WorkoutCompletionOutcome {
  final bool offline;
  final int totalVolume;
  final int totalSets;
  final int xpEarned;
  final bool levelUp;
  final int? newLevel;
  final List<String> newlyUnlockedShadows;

  const WorkoutCompletionOutcome({
    this.offline = false,
    required this.totalVolume,
    required this.totalSets,
    required this.xpEarned,
    this.levelUp = false,
    this.newLevel,
    this.newlyUnlockedShadows = const [],
  });
}

final workoutProvider = StateNotifierProvider<WorkoutNotifier, WorkoutState>((ref) {
  return WorkoutNotifier(ref);
});

class WorkoutNotifier extends StateNotifier<WorkoutState> {
  final Ref _ref;

  WorkoutNotifier(this._ref) : super(const WorkoutState()) {
    loadAll();
  }

  Future<void> loadAll() async {
    state = WorkoutState(
      exercises: state.exercises,
      officialTemplates: state.officialTemplates,
      userTemplates: state.userTemplates,
      sessions: state.sessions,
      prs: state.prs,
      loading: true,
    );

    try {
      final dio = await ApiClient.getInstance();
      final cachedExercises = await LocalCacheService.getJson(
        'workout_exercises_v1',
        maxAge: const Duration(hours: 24),
      );
      final cachedOfficial = await LocalCacheService.getJson(
        'workout_official_v1',
        maxAge: const Duration(hours: 24),
      );

      final results = await Future.wait([
        cachedExercises is List
            ? Future.value(Response(requestOptions: RequestOptions(), data: cachedExercises))
            : dio.get(ApiEndpoints.workoutExercises).then((r) async {
                if (r.data is List) await LocalCacheService.setJson('workout_exercises_v1', r.data);
                return r;
              }).catchError((_) => Response(requestOptions: RequestOptions(), data: const <dynamic>[])),
        cachedOfficial is List
            ? Future.value(Response(requestOptions: RequestOptions(), data: cachedOfficial))
            : dio.get(ApiEndpoints.workoutOfficialTemplates).then((r) async {
                if (r.data is List) await LocalCacheService.setJson('workout_official_v1', r.data);
                return r;
              }).catchError((_) => Response(requestOptions: RequestOptions(), data: const <dynamic>[])),
        dio.get(ApiEndpoints.workoutTemplates).catchError((_) => Response(
            requestOptions: RequestOptions(), data: const <dynamic>[])),
        dio.get(ApiEndpoints.workoutSessions).catchError((_) => Response(
            requestOptions: RequestOptions(), data: const <dynamic>[])),
        dio.get(ApiEndpoints.workoutPrs).catchError((_) => Response(
            requestOptions: RequestOptions(), data: const <dynamic>[])),
      ]);

      final exercises = (results[0].data as List? ?? const [])
          .map((e) => ExerciseModel.fromJson(e as Map<String, dynamic>))
          .toList();
      final official = (results[1].data as List? ?? const [])
          .map((e) => OfficialTemplateModel.fromJson(e as Map<String, dynamic>))
          .toList();
      final userTpls = (results[2].data as List? ?? const [])
          .map((e) => WorkoutTemplateModel.fromJson(e as Map<String, dynamic>))
          .toList();
      final sessions = (results[3].data as List? ?? const [])
          .map((e) => WorkoutSessionModel.fromJson(e as Map<String, dynamic>))
          .toList();
      final prs = (results[4].data as List? ?? const [])
          .map((e) => PersonalRecordModel.fromJson(e as Map<String, dynamic>))
          .toList();

      if (mounted) {
        state = WorkoutState(
          exercises: exercises,
          officialTemplates: official,
          userTemplates: userTpls,
          sessions: sessions,
          prs: prs,
          loading: false,
        );
      }
    } catch (_) {
      if (mounted) {
        state = WorkoutState(
          exercises: state.exercises,
          officialTemplates: state.officialTemplates,
          userTemplates: state.userTemplates,
          sessions: state.sessions,
          prs: state.prs,
          loading: false,
        );
      }
    }
  }

  /// Fetches last recorded working sets for Beat Last Session target hints (RET-3).
  Future<List<WorkoutSetModel>> fetchLastSets(String exerciseId) async {
    try {
      final dio = await ApiClient.getInstance();
      final res = await dio.get(ApiEndpoints.workoutExerciseLastSets(exerciseId));
      final list = res.data as List? ?? const [];
      return list
          .map((e) => WorkoutSetModel.fromJson(e as Map<String, dynamic>))
          .toList();
    } catch (_) {
      return const [];
    }
  }

  Future<String?> startSession({required String name, String? templateId}) async {
    try {
      final dio = await ApiClient.getInstance();
      final res = await dio.post(
        ApiEndpoints.workoutSessions,
        data: {
          'name': name,
          'templateId': ?templateId,
          'startedAt': DateTime.now().toIso8601String(),
        },
      );
      if (res.data is Map && res.data['id'] != null) {
        return res.data['id'].toString();
      }
    } catch (_) {}
    return null;
  }

  Future<void> saveTemplate({
    required String name,
    required List<String> exerciseIds,
  }) async {
    try {
      final dio = await ApiClient.getInstance();
      await dio.post(
        ApiEndpoints.workoutTemplates,
        data: {
          'name': name,
          'exerciseIds': exerciseIds,
          'isPublic': false,
        },
      );
      await loadAll();
    } catch (_) {}
  }

  Future<WorkoutCompletionOutcome> finishSession({
    required String? sessionId,
    required String workoutName,
    required List<WorkoutSetModel> completedSets,
    String? notes,
  }) async {
    final totalVol = completedSets.fold<int>(
      0,
      (sum, s) => sum + (s.weight * s.reps).round(),
    );

    if (sessionId == null || sessionId.isEmpty) {
      await SessionStorage.clearWorkoutDraft();
      return WorkoutCompletionOutcome(
        offline: true,
        totalVolume: totalVol,
        totalSets: completedSets.length,
        xpEarned: 35,
      );
    }

    final payload = {
      'sets': completedSets.map((s) => s.toPayloadJson()).toList(),
      if (notes != null && notes.isNotEmpty) 'notes': notes,
    };

    try {
      final dio = await ApiClient.getInstance();
      final res = await dio.put(
        ApiEndpoints.workoutSessionFinish(sessionId),
        data: payload,
      );

      await SessionStorage.clearWorkoutDraft();
      final data = res.data;
      if (data is Map<String, dynamic>) {
        if (data['user'] is Map<String, dynamic>) {
          _ref.read(authProvider.notifier).updateUser(
                UserModel.fromJson(data['user'] as Map<String, dynamic>),
              );
        }
        final sessionObj = data['session'] is Map
            ? data['session'] as Map<String, dynamic>
            : data;
        final shadows = data['newlyUnlockedShadows'] is List
            ? (data['newlyUnlockedShadows'] as List).map((e) => e.toString()).toList()
            : const <String>[];

        await loadAll();

        return WorkoutCompletionOutcome(
          totalVolume: (sessionObj['totalVolume'] as num?)?.toInt() ?? totalVol,
          totalSets:
              (sessionObj['totalSets'] as num?)?.toInt() ?? completedSets.length,
          xpEarned: (sessionObj['xpEarned'] as num?)?.toInt() ?? 40,
          levelUp: data['levelUp'] == true,
          newLevel: (data['newLevel'] as num?)?.toInt(),
          newlyUnlockedShadows: shadows,
        );
      }
      await loadAll();
      return WorkoutCompletionOutcome(
        totalVolume: totalVol,
        totalSets: completedSets.length,
        xpEarned: 40,
      );
    } on DioException catch (e) {
      if (ApiClient.isOffline(e)) {
        await SyncQueueService.enqueue(
          PendingOperation(
            id: 'workout_${sessionId}_${DateTime.now().millisecondsSinceEpoch}',
            type: SyncOpType.finishWorkout,
            endpoint: ApiEndpoints.workoutSessionFinish(sessionId),
            method: 'PUT',
            payload: payload,
            createdAt: DateTime.now(),
          ),
        );
        await SessionStorage.clearWorkoutDraft();
        return WorkoutCompletionOutcome(
          offline: true,
          totalVolume: totalVol,
          totalSets: completedSets.length,
          xpEarned: 40,
        );
      }
      rethrow;
    }
  }

  Future<Map<String, dynamic>> fetchProgressiveTargets(List<String> exerciseIds) async {
    if (exerciseIds.isEmpty) return const {};
    try {
      final dio = await ApiClient.getInstance();
      final res = await dio.get(
        ApiEndpoints.workoutTargets,
        queryParameters: {'exerciseIds': exerciseIds.join(',')},
      );
      if (res.data is Map<String, dynamic>) {
        return Map<String, dynamic>.from(res.data as Map);
      }
    } catch (_) {}
    return const {};
  }

  /// Generates and persists personalized workout day templates from DB exercises (#3).
  Future<String?> generateAiSplit({
    required String goalFocus,
    required String equipment,
    required int durationMinutes,
    required int daysPerWeek,
    String? constraintNote,
  }) async {
    try {
      final dio = await ApiClient.getInstance();
      final res = await dio.post(
        ApiEndpoints.workoutGeneratePlan,
        data: {
          'goalFocus': goalFocus,
          'equipment': equipment,
          'durationMinutes': durationMinutes,
          'daysPerWeek': daysPerWeek,
          if (constraintNote != null && constraintNote.trim().isNotEmpty)
            'constraintNote': constraintNote.trim(),
        },
      );
      await loadAll();
      if (res.data is Map<String, dynamic>) {
        return res.data['providerUsed']?.toString() ?? 'deterministic';
      }
      return 'deterministic';
    } catch (_) {
      return null;
    }
  }
}
