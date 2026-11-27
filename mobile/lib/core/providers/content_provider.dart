import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../models/content_models.dart';
import '../api/api_client.dart';
import '../api/api_endpoints.dart';
import '../storage/session_storage.dart';

class ContentLibraryState {
  final List<ContentItemModel> items;
  final List<ContentItemModel> prescribed;
  final String? bottleneckReason;
  final Set<String> bookmarkedIds;
  final bool loading;

  const ContentLibraryState({
    this.items = const [],
    this.prescribed = const [],
    this.bottleneckReason,
    this.bookmarkedIds = const {},
    this.loading = false,
  });

  ContentLibraryState copyWith({
    List<ContentItemModel>? items,
    List<ContentItemModel>? prescribed,
    String? bottleneckReason,
    Set<String>? bookmarkedIds,
    bool? loading,
  }) {
    return ContentLibraryState(
      items: items ?? this.items,
      prescribed: prescribed ?? this.prescribed,
      bottleneckReason: bottleneckReason ?? this.bottleneckReason,
      bookmarkedIds: bookmarkedIds ?? this.bookmarkedIds,
      loading: loading ?? this.loading,
    );
  }
}

final contentLibraryProvider =
    StateNotifierProvider<ContentLibraryNotifier, ContentLibraryState>((ref) {
  return ContentLibraryNotifier();
});

class ContentLibraryNotifier extends StateNotifier<ContentLibraryState> {
  ContentLibraryNotifier() : super(const ContentLibraryState()) {
    loadContent();
  }

  Future<void> loadContent() async {
    state = state.copyWith(loading: true);
    try {
      final dio = await ApiClient.getInstance();
      final res = await dio.get(ApiEndpoints.content);
      final bookmarkList = await SessionStorage.getBookmarkedContentIds();

      final raw = res.data as List? ?? const [];
      final bookmarks = bookmarkList.toSet();
      final items = raw
          .map((e) => ContentItemModel.fromJson(e as Map<String, dynamic>))
          .toList();

      List<ContentItemModel> prescribed = const [];
      String? bottleneckReason;
      try {
        final preRes = await dio.get(ApiEndpoints.contentPrescribed);
        if (preRes.data is Map<String, dynamic>) {
          final preMap = preRes.data as Map<String, dynamic>;
          final preList = preMap['prescribed'] as List? ?? const [];
          prescribed = preList
              .map((e) => ContentItemModel.fromJson(e as Map<String, dynamic>))
              .toList();
          if (preMap['bottleneck'] is Map) {
            bottleneckReason = preMap['bottleneck']['reason']?.toString();
          }
        }
      } catch (_) {}

      if (mounted) {
        state = ContentLibraryState(
          items: items,
          prescribed: prescribed,
          bottleneckReason: bottleneckReason,
          bookmarkedIds: bookmarks,
          loading: false,
        );
      }
    } catch (_) {
      if (mounted) state = state.copyWith(loading: false);
    }
  }

  Future<ContentItemModel?> fetchDetail(String id) async {
    try {
      final dio = await ApiClient.getInstance();
      final res = await dio.get(ApiEndpoints.contentDetail(id));
      if (res.data is Map<String, dynamic>) {
        final updated =
            ContentItemModel.fromJson(res.data as Map<String, dynamic>);
        _replaceItem(updated);
        return updated;
      }
    } catch (_) {}
    return null;
  }

  Future<void> likeContent(String id) async {
    try {
      final dio = await ApiClient.getInstance();
      final res = await dio.post(ApiEndpoints.contentLike(id));
      if (res.data is Map<String, dynamic>) {
        _replaceItem(
            ContentItemModel.fromJson(res.data as Map<String, dynamic>));
      }
    } catch (_) {}
  }

  Future<void> toggleBookmark(String id) async {
    final next = await SessionStorage.toggleBookmarkedContentId(id);
    if (mounted) state = state.copyWith(bookmarkedIds: next.toSet());
  }

  void _replaceItem(ContentItemModel updated) {
    final next = state.items
        .map((item) => item.id == updated.id ? updated : item)
        .toList();
    if (mounted) state = state.copyWith(items: next);
  }
}
