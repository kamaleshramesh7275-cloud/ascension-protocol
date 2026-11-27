import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../core/providers/content_provider.dart';
import '../../core/providers/auth_provider.dart';
import '../../core/theme/hunter_theme.dart';
import '../../models/content_models.dart';
import '../debrief/debrief_screen.dart';
import '../focus/focus_screen.dart';
import '../workout/workout_screen.dart';

/// Feature #8 Article / Guide / Video Detail Reader with Native Markdown Styling.
class ContentDetailScreen extends ConsumerStatefulWidget {
  final ContentItemModel initialItem;

  const ContentDetailScreen({super.key, required this.initialItem});

  @override
  ConsumerState<ContentDetailScreen> createState() => _ContentDetailScreenState();
}

class _ContentDetailScreenState extends ConsumerState<ContentDetailScreen> {
  @override
  void initState() {
    super.initState();
    Future.microtask(
      () => ref.read(contentLibraryProvider.notifier).fetchDetail(widget.initialItem.id),
    );
  }

  Future<void> _openVideoUrl(String rawUrl) async {
    final uri = Uri.tryParse(rawUrl);
    if (uri != null && await canLaunchUrl(uri)) {
      await launchUrl(uri, mode: LaunchMode.externalApplication);
    }
  }

  List<Widget> _renderMarkdownLines(String markdown) {
    final lines = markdown.split('\n');
    final widgets = <Widget>[];

    for (final raw in lines) {
      final line = raw.trimRight();
      if (line.isEmpty) {
        widgets.add(const SizedBox(height: 8));
        continue;
      }
      if (line.startsWith('### ')) {
        widgets.add(
          Padding(
            padding: const EdgeInsets.only(top: 12, bottom: 4),
            child: Text(
              line.substring(4),
              style: const TextStyle(
                color: HunterTheme.gold,
                fontWeight: FontWeight.w900,
                fontSize: 15,
              ),
            ),
          ),
        );
      } else if (line.startsWith('## ')) {
        widgets.add(
          Padding(
            padding: const EdgeInsets.only(top: 16, bottom: 6),
            child: Text(
              line.substring(3),
              style: const TextStyle(
                color: HunterTheme.cyanLight,
                fontWeight: FontWeight.w900,
                fontSize: 17,
              ),
            ),
          ),
        );
      } else if (line.startsWith('# ')) {
        widgets.add(
          Padding(
            padding: const EdgeInsets.only(top: 6, bottom: 8),
            child: Text(
              line.substring(2),
              style: const TextStyle(
                color: HunterTheme.textPrimary,
                fontWeight: FontWeight.w900,
                fontSize: 20,
              ),
            ),
          ),
        );
      } else if (line.startsWith('- ') || line.startsWith('* ')) {
        widgets.add(
          Padding(
            padding: const EdgeInsets.only(left: 6, bottom: 5),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('• ',
                    style: TextStyle(
                        color: HunterTheme.cyan, fontWeight: FontWeight.bold)),
                Expanded(child: _richInlineText(line.substring(2))),
              ],
            ),
          ),
        );
      } else {
        widgets.add(
          Padding(
            padding: const EdgeInsets.only(bottom: 6),
            child: _richInlineText(line),
          ),
        );
      }
    }
    return widgets;
  }

  Widget _richInlineText(String text) {
    final parts = text.split('**');
    final spans = <TextSpan>[];
    for (int i = 0; i < parts.length; i++) {
      spans.add(
        TextSpan(
          text: parts[i],
          style: TextStyle(
            color: i.isOdd ? HunterTheme.textPrimary : HunterTheme.textMuted,
            fontWeight: i.isOdd ? FontWeight.bold : FontWeight.normal,
            fontSize: 14.5,
            height: 1.55,
          ),
        ),
      );
    }
    return RichText(text: TextSpan(children: spans));
  }

  @override
  Widget build(BuildContext context) {
    final libState = ref.watch(contentLibraryProvider);
    final item = libState.items.firstWhere(
      (i) => i.id == widget.initialItem.id,
      orElse: () => widget.initialItem,
    );
    final saved = libState.bookmarkedIds.contains(item.id);

    return Scaffold(
      backgroundColor: HunterTheme.abyss,
      appBar: AppBar(
        backgroundColor: HunterTheme.abyss,
        elevation: 0,
        title: Text(
          item.category.toUpperCase(),
          style: const TextStyle(
            color: HunterTheme.cyanLight,
            fontWeight: FontWeight.w900,
            fontSize: 13.5,
            letterSpacing: 1.4,
          ),
        ),
        actions: [
          IconButton(
            icon: Icon(
              saved ? Icons.bookmark : Icons.bookmark_border,
              color: saved ? HunterTheme.gold : HunterTheme.textMuted,
            ),
            onPressed: () {
              HapticFeedback.selectionClick();
              ref.read(contentLibraryProvider.notifier).toggleBookmark(item.id);
            },
          ),
          TextButton.icon(
            onPressed: () {
              HapticFeedback.selectionClick();
              ref.read(contentLibraryProvider.notifier).likeContent(item.id);
            },
            icon: const Icon(Icons.favorite, color: HunterTheme.crimson, size: 18),
            label: Text(
              '${item.likes}',
              style: const TextStyle(color: HunterTheme.textPrimary),
            ),
          ),
        ],
      ),
      body: ListView(
        padding: const EdgeInsets.all(18),
        children: [
          if (item.videoUrl != null && item.videoUrl!.isNotEmpty) ...[
            ElevatedButton.icon(
              onPressed: () => _openVideoUrl(item.videoUrl!),
              icon: const Icon(Icons.play_circle_fill),
              label: const Text(
                'WATCH EXTERNAL TRAINING BRIEFING',
                style: TextStyle(fontWeight: FontWeight.w900),
              ),
              style: ElevatedButton.styleFrom(
                backgroundColor: HunterTheme.crimson,
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(vertical: 12),
              ),
            ),
            const SizedBox(height: 16),
          ],
          ..._renderMarkdownLines(item.content),
          if (item.ctaLabel != null) ...[
            const SizedBox(height: 20),
            SizedBox(
              width: double.infinity,
              height: 48,
              child: ElevatedButton.icon(
                onPressed: () {
                  final u = ref.read(authProvider).value;
                  if (item.ctaActionType == 'workout') {
                    Navigator.of(context).push(
                      MaterialPageRoute(builder: (_) => const WorkoutScreen()),
                    );
                  } else if (item.ctaActionType == 'debrief' && u != null) {
                    Navigator.of(context).push(
                      MaterialPageRoute(builder: (_) => DebriefScreen(user: u)),
                    );
                  } else {
                    Navigator.of(context).push(
                      MaterialPageRoute(
                        builder: (_) => FocusScreen(
                          initialTask: item.title,
                          initialDurationMinutes: item.ctaDurationMinutes ?? 25,
                        ),
                      ),
                    );
                  }
                },
                icon: const Icon(Icons.bolt),
                label: Text(
                  item.ctaLabel!.toUpperCase(),
                  style: const TextStyle(fontWeight: FontWeight.w900),
                ),
                style: ElevatedButton.styleFrom(
                  backgroundColor: HunterTheme.cyan,
                  foregroundColor: Colors.black,
                ),
              ),
            ),
          ],
          const SizedBox(height: 28),
        ],
      ),
    );
  }
}
