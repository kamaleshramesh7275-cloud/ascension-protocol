import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/providers/content_provider.dart';
import '../../core/theme/hunter_theme.dart';
import 'content_detail_screen.dart';

/// Feature #8 Knowledge Library & Hunter Codex Browse Screen.
class LibraryScreen extends ConsumerStatefulWidget {
  const LibraryScreen({super.key});

  @override
  ConsumerState<LibraryScreen> createState() => _LibraryScreenState();
}

class _LibraryScreenState extends ConsumerState<LibraryScreen> {
  String _selectedCategory = 'all';
  String _selectedType = 'all';

  static const _categories = ['all', 'fitness', 'discipline', 'nutrition', 'mindset'];
  static const _types = ['all', 'article', 'guide', 'video', 'saved'];

  @override
  Widget build(BuildContext context) {
    final libState = ref.watch(contentLibraryProvider);

    final filtered = libState.items.where((item) {
      final catMatch =
          _selectedCategory == 'all' || item.category == _selectedCategory;
      final typeMatch = _selectedType == 'all'
          ? true
          : (_selectedType == 'saved'
              ? libState.bookmarkedIds.contains(item.id)
              : item.type == _selectedType);
      return catMatch && typeMatch;
    }).toList();

    return Scaffold(
      backgroundColor: HunterTheme.abyss,
      appBar: AppBar(
        backgroundColor: HunterTheme.abyss,
        elevation: 0,
        title: const Text(
          'KNOWLEDGE LIBRARY',
          style: TextStyle(
            color: HunterTheme.textPrimary,
            fontWeight: FontWeight.w900,
            letterSpacing: 1.5,
            fontSize: 16,
          ),
        ),
      ),
      body: Column(
        children: [
          SizedBox(
            height: 40,
            child: ListView.separated(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              scrollDirection: Axis.horizontal,
              itemBuilder: (_, i) {
                final c = _categories[i];
                final selected = _selectedCategory == c;
                return ChoiceChip(
                  label: Text(c.toUpperCase()),
                  selected: selected,
                  onSelected: (_) => setState(() => _selectedCategory = c),
                  selectedColor: HunterTheme.cyan,
                  backgroundColor: HunterTheme.surface,
                  labelStyle: TextStyle(
                    color: selected ? Colors.black : HunterTheme.textPrimary,
                    fontSize: 11,
                    fontWeight: FontWeight.bold,
                  ),
                );
              },
              separatorBuilder: (_, _) => const SizedBox(width: 8),
              itemCount: _categories.length,
            ),
          ),
          const SizedBox(height: 8),
          SizedBox(
            height: 36,
            child: ListView.separated(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              scrollDirection: Axis.horizontal,
              itemBuilder: (_, i) {
                final t = _types[i];
                final selected = _selectedType == t;
                return ChoiceChip(
                  label: Text(t == 'saved' ? 'BOOKMARKS' : t.toUpperCase()),
                  selected: selected,
                  onSelected: (_) => setState(() => _selectedType = t),
                  selectedColor: HunterTheme.purple,
                  backgroundColor: HunterTheme.surface,
                  labelStyle: TextStyle(
                    color: selected ? Colors.white : HunterTheme.textMuted,
                    fontSize: 10.5,
                    fontWeight: FontWeight.bold,
                  ),
                );
              },
              separatorBuilder: (_, _) => const SizedBox(width: 8),
              itemCount: _types.length,
            ),
          ),
          const SizedBox(height: 10),
          if (libState.prescribed.isNotEmpty) ...[
            Container(
              margin: const EdgeInsets.fromLTRB(16, 0, 16, 10),
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: HunterTheme.surfaceLight,
                borderRadius: BorderRadius.circular(14),
                border: Border.all(color: HunterTheme.gold.withValues(alpha: 0.45)),
              ),
              child: InkWell(
                onTap: () => Navigator.of(context).push(
                  MaterialPageRoute(
                    builder: (_) =>
                        ContentDetailScreen(initialItem: libState.prescribed.first),
                  ),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'PRESCRIBED FOR YOUR BOTTLENECK',
                      style: TextStyle(
                        color: HunterTheme.gold,
                        fontWeight: FontWeight.w900,
                        fontSize: 10.5,
                        letterSpacing: 1.2,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      libState.prescribed.first.title,
                      style: const TextStyle(
                        color: HunterTheme.textPrimary,
                        fontWeight: FontWeight.bold,
                        fontSize: 13.5,
                      ),
                    ),
                    if (libState.prescribed.first.prescriptionReason != null) ...[
                      const SizedBox(height: 2),
                      Text(
                        libState.prescribed.first.prescriptionReason!,
                        style: const TextStyle(
                          color: HunterTheme.cyanLight,
                          fontSize: 11.5,
                        ),
                      ),
                    ],
                  ],
                ),
              ),
            ),
          ],
          Expanded(
            child: libState.loading && libState.items.isEmpty
                ? const Center(child: CircularProgressIndicator(color: HunterTheme.cyan))
                : RefreshIndicator(
                    onRefresh: () =>
                        ref.read(contentLibraryProvider.notifier).loadContent(),
                    child: filtered.isEmpty
                        ? ListView(
                            children: const [
                              SizedBox(height: 120),
                              Center(
                                child: Text(
                                  'No codex manuscripts match your filters.',
                                  style: TextStyle(color: HunterTheme.textMuted),
                                ),
                              ),
                            ],
                          )
                        : ListView.builder(
                            padding: const EdgeInsets.fromLTRB(16, 4, 16, 20),
                            itemCount: filtered.length,
                            itemBuilder: (_, idx) {
                              final item = filtered[idx];
                              final saved =
                                  libState.bookmarkedIds.contains(item.id);
                              return Container(
                                margin: const EdgeInsets.only(bottom: 12),
                                decoration: BoxDecoration(
                                  color: HunterTheme.surface,
                                  borderRadius: BorderRadius.circular(14),
                                  border: Border.all(
                                      color: HunterTheme.cyan.withValues(alpha: 0.28)),
                                ),
                                child: InkWell(
                                  borderRadius: BorderRadius.circular(14),
                                  onTap: () => Navigator.of(context).push(
                                    MaterialPageRoute(
                                      builder: (_) =>
                                          ContentDetailScreen(initialItem: item),
                                    ),
                                  ),
                                  child: Padding(
                                    padding: const EdgeInsets.all(14),
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        Row(
                                          children: [
                                            Container(
                                              padding: const EdgeInsets.symmetric(
                                                  horizontal: 7, vertical: 2),
                                              decoration: BoxDecoration(
                                                color: HunterTheme.cyan
                                                    .withValues(alpha: 0.16),
                                                borderRadius:
                                                    BorderRadius.circular(5),
                                              ),
                                              child: Text(
                                                '${item.category.toUpperCase()} • ${item.type.toUpperCase()}',
                                                style: const TextStyle(
                                                  color: HunterTheme.cyanLight,
                                                  fontSize: 9.5,
                                                  fontWeight: FontWeight.w900,
                                                ),
                                              ),
                                            ),
                                            const Spacer(),
                                            IconButton(
                                              padding: EdgeInsets.zero,
                                              constraints: const BoxConstraints(
                                                  minWidth: 30, minHeight: 30),
                                              icon: Icon(
                                                saved
                                                    ? Icons.bookmark
                                                    : Icons.bookmark_border,
                                                color: saved
                                                    ? HunterTheme.gold
                                                    : HunterTheme.textMuted,
                                                size: 20,
                                              ),
                                              onPressed: () => ref
                                                  .read(contentLibraryProvider
                                                      .notifier)
                                                  .toggleBookmark(item.id),
                                            ),
                                          ],
                                        ),
                                        const SizedBox(height: 6),
                                        Text(
                                          item.title,
                                          style: const TextStyle(
                                            color: HunterTheme.textPrimary,
                                            fontWeight: FontWeight.w900,
                                            fontSize: 15,
                                          ),
                                        ),
                                        const SizedBox(height: 4),
                                        Text(
                                          item.description,
                                          maxLines: 2,
                                          overflow: TextOverflow.ellipsis,
                                          style: const TextStyle(
                                            color: HunterTheme.textMuted,
                                            fontSize: 12,
                                          ),
                                        ),
                                        const SizedBox(height: 10),
                                        Row(
                                          children: [
                                            Text(
                                              '${item.estimatedReadMinutes} min read',
                                              style: const TextStyle(
                                                color: HunterTheme.gold,
                                                fontSize: 11,
                                                fontWeight: FontWeight.bold,
                                              ),
                                            ),
                                            const SizedBox(width: 14),
                                            const Icon(Icons.favorite_border,
                                                size: 14, color: HunterTheme.crimson),
                                            const SizedBox(width: 4),
                                            Text(
                                              '${item.likes}',
                                              style: const TextStyle(
                                                color: HunterTheme.textMuted,
                                                fontSize: 11,
                                              ),
                                            ),
                                            const SizedBox(width: 14),
                                            const Icon(Icons.visibility_outlined,
                                                size: 14, color: HunterTheme.cyan),
                                            const SizedBox(width: 4),
                                            Text(
                                              '${item.views}',
                                              style: const TextStyle(
                                                color: HunterTheme.textMuted,
                                                fontSize: 11,
                                              ),
                                            ),
                                          ],
                                        ),
                                      ],
                                    ),
                                  ),
                                ),
                              );
                            },
                          ),
                  ),
          ),
        ],
      ),
    );
  }
}
