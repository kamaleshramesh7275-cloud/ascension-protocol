import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../api/api_client.dart';
import '../api/api_endpoints.dart';
import '../api/api_error.dart';
import '../services/feedback_diagnostics_service.dart';

class FeedbackEntry {
  final String id;
  final String userId;
  final String userName;
  final String type; // bug | feature | suggestion
  final String category;
  final String title;
  final String description;
  final String status; // open | reviewed | planned | resolved | declined
  final String? adminNotes;
  final int upvoteCount;
  final bool hasVoted;
  final DateTime createdAt;

  const FeedbackEntry({
    required this.id,
    required this.userId,
    required this.userName,
    required this.type,
    required this.category,
    required this.title,
    required this.description,
    required this.status,
    this.adminNotes,
    required this.upvoteCount,
    this.hasVoted = false,
    required this.createdAt,
  });

  factory FeedbackEntry.fromJson(Map<String, dynamic> json) {
    return FeedbackEntry(
      id: json['id']?.toString() ?? '',
      userId: json['userId']?.toString() ?? '',
      userName: json['userName']?.toString() ?? 'Hunter',
      type: json['type']?.toString() ?? 'suggestion',
      category: json['category']?.toString() ?? 'other',
      title: json['title']?.toString() ?? '',
      description: json['description']?.toString() ?? '',
      status: json['status']?.toString() ?? 'open',
      adminNotes: json['adminNotes']?.toString(),
      upvoteCount: (json['upvoteCount'] as num?)?.toInt() ?? 0,
      hasVoted: json['hasVoted'] == true,
      createdAt: DateTime.tryParse(json['createdAt']?.toString() ?? '') ?? DateTime.now(),
    );
  }

  FeedbackEntry copyWith({int? upvoteCount, bool? hasVoted}) {
    return FeedbackEntry(
      id: id,
      userId: userId,
      userName: userName,
      type: type,
      category: category,
      title: title,
      description: description,
      status: status,
      adminNotes: adminNotes,
      upvoteCount: upvoteCount ?? this.upvoteCount,
      hasVoted: hasVoted ?? this.hasVoted,
      createdAt: createdAt,
    );
  }
}

class FeedbackState {
  final List<FeedbackEntry> myReports;
  final List<FeedbackEntry> popularRequests;
  final bool isLoading;
  final bool isSubmitting;
  final String? error;

  const FeedbackState({
    this.myReports = const [],
    this.popularRequests = const [],
    this.isLoading = false,
    this.isSubmitting = false,
    this.error,
  });

  FeedbackState copyWith({
    List<FeedbackEntry>? myReports,
    List<FeedbackEntry>? popularRequests,
    bool? isLoading,
    bool? isSubmitting,
    String? error,
  }) {
    return FeedbackState(
      myReports: myReports ?? this.myReports,
      popularRequests: popularRequests ?? this.popularRequests,
      isLoading: isLoading ?? this.isLoading,
      isSubmitting: isSubmitting ?? this.isSubmitting,
      error: error,
    );
  }
}

class FeedbackNotifier extends StateNotifier<FeedbackState> {
  FeedbackNotifier() : super(const FeedbackState());

  Future<void> loadAll({String sort = 'top'}) async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      final dio = await ApiClient.getInstance();
      final results = await Future.wait([
        dio.get(ApiEndpoints.feedbackMine),
        dio.get(ApiEndpoints.feedbackPopular, queryParameters: {'sort': sort}),
      ]);

      final mineRaw = (results[0].data?['items'] as List?) ?? [];
      final popRaw = (results[1].data?['items'] as List?) ?? [];

      state = state.copyWith(
        myReports: mineRaw
            .whereType<Map<String, dynamic>>()
            .map(FeedbackEntry.fromJson)
            .toList(),
        popularRequests: popRaw
            .whereType<Map<String, dynamic>>()
            .map(FeedbackEntry.fromJson)
            .toList(),
        isLoading: false,
      );
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: extractApiError(e, 'Unable to load feedback board'),
      );
    }
  }

  Future<String?> submitFeedback({
    required String type,
    required String category,
    required String title,
    required String description,
    bool includeDiagnostics = true,
    String? screenOverride,
  }) async {
    state = state.copyWith(isSubmitting: true, error: null);
    try {
      final dio = await ApiClient.getInstance();
      final payload = <String, dynamic>{
        'type': type,
        'category': category,
        'title': title.trim(),
        'description': description.trim(),
        if (includeDiagnostics)
          'diagnostics': FeedbackDiagnosticsService.buildPayload(
            screenOverride: screenOverride,
          ),
      };

      final res = await dio.post(ApiEndpoints.feedback, data: payload);
      final created = FeedbackEntry.fromJson(res.data as Map<String, dynamic>);

      final updatedMine = [created, ...state.myReports];
      final updatedPopular = type != 'bug'
          ? [created.copyWith(hasVoted: false), ...state.popularRequests]
          : state.popularRequests;

      state = state.copyWith(
        myReports: updatedMine,
        popularRequests: updatedPopular,
        isSubmitting: false,
      );
      return null;
    } catch (e) {
      final msg = extractApiError(e, 'Failed to submit feedback');
      state = state.copyWith(isSubmitting: false, error: msg);
      return msg;
    }
  }

  Future<void> toggleUpvote(String id) async {
    final idx = state.popularRequests.indexWhere((e) => e.id == id);
    if (idx == -1) return;

    final target = state.popularRequests[idx];
    final nextVoted = !target.hasVoted;
    final nextCount = (target.upvoteCount + (nextVoted ? 1 : -1)).clamp(0, 999999);

    final optimistic = List<FeedbackEntry>.from(state.popularRequests);
    optimistic[idx] = target.copyWith(hasVoted: nextVoted, upvoteCount: nextCount);
    state = state.copyWith(popularRequests: optimistic);

    try {
      final dio = await ApiClient.getInstance();
      final res = await dio.post(ApiEndpoints.feedbackUpvote(id));
      final serverVoted = res.data?['voted'] == true;
      final serverCount = (res.data?['upvoteCount'] as num?)?.toInt() ?? nextCount;

      final synced = List<FeedbackEntry>.from(state.popularRequests);
      final curIdx = synced.indexWhere((e) => e.id == id);
      if (curIdx != -1) {
        synced[curIdx] = synced[curIdx].copyWith(
          hasVoted: serverVoted,
          upvoteCount: serverCount,
        );
        state = state.copyWith(popularRequests: synced);
      }
    } catch (_) {
      // Revert on failure
      final reverted = List<FeedbackEntry>.from(state.popularRequests);
      final curIdx = reverted.indexWhere((e) => e.id == id);
      if (curIdx != -1) {
        reverted[curIdx] = target;
        state = state.copyWith(popularRequests: reverted);
      }
    }
  }
}

final feedbackProvider = StateNotifierProvider<FeedbackNotifier, FeedbackState>(
  (ref) => FeedbackNotifier(),
);
