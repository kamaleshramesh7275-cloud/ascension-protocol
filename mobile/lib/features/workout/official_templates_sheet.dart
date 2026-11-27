import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/providers/workout_provider.dart';
import '../../core/theme/hunter_theme.dart';
import '../../models/workout_models.dart';

/// Bottom sheet displaying official pre-built training split routines (/api/workouts/official-templates).
class OfficialTemplatesSheet extends ConsumerWidget {
  final void Function(OfficialTemplateModel template) onSelectTemplate;

  const OfficialTemplatesSheet({super.key, required this.onSelectTemplate});

  static Future<void> show(
    BuildContext context, {
    required void Function(OfficialTemplateModel template) onSelectTemplate,
  }) {
    return showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      backgroundColor: HunterTheme.abyss,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(22)),
      ),
      builder: (_) => OfficialTemplatesSheet(onSelectTemplate: onSelectTemplate),
    );
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final templates = ref.watch(workoutProvider).officialTemplates;

    return DraggableScrollableSheet(
      expand: false,
      initialChildSize: 0.72,
      maxChildSize: 0.92,
      minChildSize: 0.45,
      builder: (context, scrollController) => Padding(
        padding: const EdgeInsets.fromLTRB(16, 12, 16, 20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Center(
              child: Container(
                width: 44,
                height: 4,
                decoration: BoxDecoration(
                  color: HunterTheme.textMuted.withValues(alpha: 0.4),
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
            ),
            const SizedBox(height: 14),
            Text(
              'OFFICIAL PROTOCOL SPLITS',
              style: TextStyle(
                color: HunterTheme.cyanLight,
                fontWeight: FontWeight.w900,
                letterSpacing: 1.5,
                fontSize: 14,
              ),
            ),
            const SizedBox(height: 4),
            Text(
              'Tap any split to deploy directly into an active workout session.',
              style: TextStyle(color: HunterTheme.textMuted, fontSize: 12),
            ),
            const SizedBox(height: 12),
            Expanded(
              child: templates.isEmpty
                  ? Center(
                      child: Text(
                        'Loading curated split protocols...',
                        style: TextStyle(color: HunterTheme.textMuted),
                      ),
                    )
                  : ListView.builder(
                      controller: scrollController,
                      itemCount: templates.length,
                      itemBuilder: (context, index) {
                        final tpl = templates[index];
                        return Padding(
                          padding: const EdgeInsets.only(bottom: 10),
                          child: Material(
                            color: HunterTheme.surface,
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(14),
                              side: BorderSide(
                                  color: HunterTheme.cyan.withValues(alpha: 0.3)),
                            ),
                            clipBehavior: Clip.antiAlias,
                            child: ListTile(
                            contentPadding: const EdgeInsets.symmetric(
                                horizontal: 14, vertical: 8),
                            title: Row(
                              children: [
                                Expanded(
                                  child: Text(
                                    tpl.name,
                                    style: TextStyle(
                                      color: HunterTheme.textPrimary,
                                      fontWeight: FontWeight.w900,
                                      fontSize: 14,
                                    ),
                                  ),
                                ),
                                Container(
                                  padding: const EdgeInsets.symmetric(
                                      horizontal: 7, vertical: 2),
                                  decoration: BoxDecoration(
                                    color: HunterTheme.purple.withValues(alpha: 0.2),
                                    borderRadius: BorderRadius.circular(6),
                                  ),
                                  child: Text(
                                    tpl.difficulty.toUpperCase(),
                                    style: TextStyle(
                                      color: HunterTheme.purple,
                                      fontSize: 9.5,
                                      fontWeight: FontWeight.w900,
                                    ),
                                  ),
                                ),
                              ],
                            ),
                            subtitle: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                const SizedBox(height: 4),
                                Text(
                                  tpl.description,
                                  maxLines: 2,
                                  overflow: TextOverflow.ellipsis,
                                  style: TextStyle(
                                      color: HunterTheme.textMuted, fontSize: 11.5),
                                ),
                                const SizedBox(height: 6),
                                Text(
                                  '${tpl.exerciseNames.length} Exercises • ${tpl.duration}',
                                  style: TextStyle(
                                    color: HunterTheme.gold,
                                    fontWeight: FontWeight.bold,
                                    fontSize: 11,
                                  ),
                                ),
                              ],
                            ),
                            trailing: Icon(Icons.play_circle_fill,
                                color: HunterTheme.cyan, size: 30),
                            onTap: () {
                              Navigator.of(context).pop();
                              onSelectTemplate(tpl);
                            },
                          ),
                        ),
                      );
                      },
                    ),
            ),
          ],
        ),
      ),
    );
  }
}
