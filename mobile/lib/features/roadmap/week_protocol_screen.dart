import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/api/api_error.dart';
import '../../core/providers/roadmap_provider.dart';
import '../../core/theme/hunter_theme.dart';
import '../../core/widgets/system_window_dialog.dart';
import '../../models/roadmap_models.dart';

/// Day 1–7 Protocol Tasks & Boss Milestone Execution Screen for a Roadmap Week.
class WeekProtocolScreen extends ConsumerWidget {
  final int weekNumber;

  const WeekProtocolScreen({super.key, required this.weekNumber});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final roadmap = ref.watch(roadmapProvider).roadmap;
    final week = roadmap?.weeks.firstWhere(
      (w) => w.weekNumber == weekNumber,
      orElse: () => const RoadmapWeekModel(
        id: '',
        roadmapId: '',
        weekNumber: 1,
        phaseName: 'Protocol',
        goal: '',
        description: '',
      ),
    );

    if (week == null || week.id.isEmpty) {
      return Scaffold(
        backgroundColor: HunterTheme.abyss,
        appBar: AppBar(backgroundColor: HunterTheme.abyss),
        body: Center(
          child: Text('Week protocol unavailable.',
              style: TextStyle(color: HunterTheme.textMuted)),
        ),
      );
    }

    // Group tasks by dayNumber (1..7)
    final grouped = <int, List<RoadmapTaskModel>>{};
    for (final t in week.tasks) {
      grouped.putIfAbsent(t.dayNumber, () => []).add(t);
    }
    final sortedDays = grouped.keys.toList()..sort();

    return Scaffold(
      backgroundColor: HunterTheme.abyss,
      appBar: AppBar(
        backgroundColor: HunterTheme.abyss,
        elevation: 0,
        title: Text(
          'WEEK ${week.weekNumber}: ${week.phaseName.toUpperCase()}',
          style: TextStyle(
            color: HunterTheme.textPrimary,
            fontWeight: FontWeight.w900,
            fontSize: 15,
            letterSpacing: 1.2,
          ),
        ),
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Container(
            padding: const EdgeInsets.all(14),
            margin: const EdgeInsets.only(bottom: 16),
            decoration: BoxDecoration(
              color: HunterTheme.surface,
              borderRadius: BorderRadius.circular(14),
              border: Border.all(color: HunterTheme.cyan.withValues(alpha: 0.35)),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  week.goal,
                  style: TextStyle(
                    color: HunterTheme.cyanLight,
                    fontWeight: FontWeight.w900,
                    fontSize: 14,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  week.description,
                  style: TextStyle(color: HunterTheme.textMuted, fontSize: 12),
                ),
                const SizedBox(height: 10),
                LinearProgressIndicator(
                  value: week.progress,
                  backgroundColor: HunterTheme.abyss,
                  valueColor: AlwaysStoppedAnimation<Color>(HunterTheme.cyan),
                  minHeight: 7,
                ),
              ],
            ),
          ),

          ...sortedDays.map((day) {
            final dayTasks = grouped[day]!;
            return Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Padding(
                  padding: const EdgeInsets.only(top: 6, bottom: 8),
                  child: Text(
                    'DAY $day',
                    style: TextStyle(
                      color: HunterTheme.gold,
                      fontWeight: FontWeight.w900,
                      letterSpacing: 1.3,
                      fontSize: 11.5,
                    ),
                  ),
                ),
                ...dayTasks.map((task) {
                  return Padding(
                    padding: const EdgeInsets.only(bottom: 8),
                    child: Material(
                      color: HunterTheme.surface,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                        side: BorderSide(
                          color: task.completed
                              ? HunterTheme.emerald.withValues(alpha: 0.5)
                              : (task.isBoss
                                  ? HunterTheme.crimson.withValues(alpha: 0.7)
                                  : HunterTheme.cyan.withValues(alpha: 0.2)),
                        ),
                      ),
                      clipBehavior: Clip.antiAlias,
                      child: CheckboxListTile(
                      value: task.completed,
                      activeColor: HunterTheme.emerald,
                      checkColor: Colors.black,
                      title: Text(
                        task.text,
                        style: TextStyle(
                          color: task.completed
                              ? HunterTheme.textMuted
                              : HunterTheme.textPrimary,
                          fontWeight:
                              task.isBoss ? FontWeight.w900 : FontWeight.w600,
                          fontSize: 13.5,
                          decoration: task.completed
                              ? TextDecoration.lineThrough
                              : TextDecoration.none,
                        ),
                      ),
                      subtitle: task.isBoss
                          ? Text(
                              'BOSS MILESTONE',
                              style: TextStyle(
                                color: HunterTheme.crimson,
                                fontWeight: FontWeight.w900,
                                fontSize: 10,
                              ),
                            )
                          : null,
                      onChanged: (_) async {
                        HapticFeedback.selectionClick();
                        try {
                          final outcome = await ref
                              .read(roadmapProvider.notifier)
                              .toggleTask(task.id);
                          if (!context.mounted) return;
                          if (outcome.unlockedNextWeek) {
                            await SystemWindowDialog.show(
                              context,
                              headerTag: 'PROTOCOL PHASE CLEARED',
                              title: 'WEEK ${week.weekNumber + 1} UNLOCKED!',
                              body:
                                  'All objectives verified. The next 7-day difficulty tier is now open.',
                              tone: SystemWindowTone.gold,
                              icon: Icons.lock_open_rounded,
                            );
                          }
                        } catch (e) {
                          if (!context.mounted) return;
                          ScaffoldMessenger.of(context).showSnackBar(
                            SnackBar(
                              backgroundColor: HunterTheme.crimson,
                              content:
                                  Text(extractApiError(e, 'Failed to update task')),
                            ),
                          );
                        }
                      },
                    ),
                  ),
                );
                }),
              ],
            );
          }),
        ],
      ),
    );
  }
}
