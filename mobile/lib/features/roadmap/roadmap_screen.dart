import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/providers/auth_provider.dart';
import '../../core/providers/roadmap_provider.dart';
import '../../core/theme/hunter_theme.dart';
import '../../core/widgets/boss_raid_card.dart';
import 'week_protocol_screen.dart';

/// Feature #7 30-Day Execution Roadmap & Trajectory Overview Screen.
class RoadmapScreen extends ConsumerWidget {
  const RoadmapScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final rState = ref.watch(roadmapProvider);
    final roadmap = rState.roadmap;
    final traj = rState.trajectory;

    return Scaffold(
      backgroundColor: HunterTheme.abyss,
      appBar: AppBar(
        backgroundColor: HunterTheme.abyss,
        elevation: 0,
        title: const Text(
          '30-DAY PROTOCOL ROADMAP',
          style: TextStyle(
            color: HunterTheme.textPrimary,
            fontWeight: FontWeight.w900,
            letterSpacing: 1.4,
            fontSize: 16,
          ),
        ),
        actions: [
          IconButton(
            tooltip: 'Recalibrate Goal Plan',
            icon: const Icon(Icons.tune_rounded, color: HunterTheme.cyanLight),
            onPressed: () {
              final ctrl = TextEditingController(
                text: roadmap?.linkedGoalText ?? '',
              );
              showDialog(
                context: context,
                builder: (ctx) => AlertDialog(
                  backgroundColor: HunterTheme.surface,
                  title: const Text(
                    'RECALIBRATE GOAL BLUEPRINT',
                    style: TextStyle(
                      color: HunterTheme.cyanLight,
                      fontWeight: FontWeight.w900,
                      fontSize: 14,
                    ),
                  ),
                  content: TextField(
                    controller: ctrl,
                    style: const TextStyle(color: HunterTheme.textPrimary),
                    decoration: const InputDecoration(
                      labelText: 'Updated Target Outcome',
                      labelStyle: TextStyle(color: HunterTheme.textMuted),
                    ),
                  ),
                  actions: [
                    TextButton(
                      onPressed: () => Navigator.of(ctx).pop(),
                      child: const Text('CANCEL'),
                    ),
                    ElevatedButton(
                      onPressed: () async {
                        Navigator.of(ctx).pop();
                        await ref.read(roadmapProvider.notifier).recalibrate(
                              goalText: ctrl.text,
                            );
                      },
                      style: ElevatedButton.styleFrom(
                        backgroundColor: HunterTheme.cyan,
                        foregroundColor: Colors.black,
                      ),
                      child: const Text('REBUILD PLAN'),
                    ),
                  ],
                ),
              );
            },
          ),
        ],
      ),
      body: rState.loading && roadmap == null
          ? const Center(child: CircularProgressIndicator(color: HunterTheme.cyan))
          : RefreshIndicator(
              onRefresh: () => ref.read(roadmapProvider.notifier).loadRoadmap(),
              child: ListView(
                padding: const EdgeInsets.all(16),
                children: [
                  if (traj != null) ...[
                    Container(
                      padding: const EdgeInsets.all(16),
                      margin: const EdgeInsets.only(bottom: 16),
                      decoration: BoxDecoration(
                        gradient: LinearGradient(
                          colors: [HunterTheme.surfaceLight, HunterTheme.surface],
                        ),
                        borderRadius: BorderRadius.circular(16),
                        border:
                            Border.all(color: HunterTheme.cyan.withValues(alpha: 0.45)),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              const Text(
                                'TRAJECTORY PROJECTION',
                                style: TextStyle(
                                  color: HunterTheme.cyanLight,
                                  fontWeight: FontWeight.w900,
                                  fontSize: 11,
                                  letterSpacing: 1.3,
                                ),
                              ),
                              Text(
                                '${traj.disciplineScore} PTS (${traj.tier})',
                                style: const TextStyle(
                                  color: HunterTheme.gold,
                                  fontWeight: FontWeight.w900,
                                  fontSize: 12,
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 6),
                          Text(
                            traj.targetOutcome,
                            style: const TextStyle(
                              color: HunterTheme.textPrimary,
                              fontWeight: FontWeight.bold,
                              fontSize: 14,
                            ),
                          ),
                          if (traj.projectedDate != null) ...[
                            const SizedBox(height: 4),
                            Text(
                              'Estimated Completion: ${traj.projectedDate}',
                              style: const TextStyle(
                                color: HunterTheme.textMuted,
                                fontSize: 11.5,
                              ),
                            ),
                          ],
                        ],
                      ),
                    ),
                  ],

                  if (roadmap == null || roadmap.weeks.isEmpty)
                    const Center(
                      child: Padding(
                        padding: EdgeInsets.symmetric(vertical: 60),
                        child: Text(
                          'Pull to initialize your 4-Week Ascension Protocol.',
                          style: TextStyle(color: HunterTheme.textMuted),
                        ),
                      ),
                    )
                  else ...[
                    if (roadmap.linkedGoalText != null &&
                        roadmap.linkedGoalText!.isNotEmpty) ...[
                      Container(
                        padding: const EdgeInsets.all(14),
                        margin: const EdgeInsets.only(bottom: 14),
                        decoration: BoxDecoration(
                          color: HunterTheme.surface,
                          borderRadius: BorderRadius.circular(14),
                          border: Border.all(
                              color: HunterTheme.gold.withValues(alpha: 0.45)),
                        ),
                        child: Row(
                          children: [
                            const Icon(Icons.flag_rounded,
                                color: HunterTheme.gold, size: 22),
                            const SizedBox(width: 10),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    'ACTIVE GOAL • ${roadmap.goalProgressPercent}% DONE',
                                    style: const TextStyle(
                                      color: HunterTheme.gold,
                                      fontWeight: FontWeight.w900,
                                      fontSize: 10.5,
                                      letterSpacing: 1.1,
                                    ),
                                  ),
                                  const SizedBox(height: 2),
                                  Text(
                                    roadmap.linkedGoalText!,
                                    style: const TextStyle(
                                      color: HunterTheme.textPrimary,
                                      fontWeight: FontWeight.bold,
                                      fontSize: 13.5,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                    if (roadmap.activeWeek != null)
                      BossRaidCard(
                        week: roadmap.activeWeek!,
                        user: ref.watch(authProvider).value,
                      ),
                    Text(
                      'CURRENT PHASE: WEEK ${roadmap.currentWeek} OF ${roadmap.weeks.length}',
                      style: const TextStyle(
                        color: HunterTheme.textMuted,
                        fontWeight: FontWeight.bold,
                        fontSize: 11.5,
                        letterSpacing: 1.2,
                      ),
                    ),
                    const SizedBox(height: 12),
                    ...roadmap.weeks.map((week) {
                      final locked = week.isLocked;
                      final pct = (week.progress * 100).round();
                      return Container(
                        margin: const EdgeInsets.only(bottom: 14),
                        decoration: BoxDecoration(
                          color: locked
                              ? HunterTheme.surface.withValues(alpha: 0.45)
                              : HunterTheme.surface,
                          borderRadius: BorderRadius.circular(16),
                          border: Border.all(
                            color: locked
                                ? HunterTheme.textMuted.withValues(alpha: 0.25)
                                : (pct == 100
                                    ? HunterTheme.emerald
                                    : HunterTheme.cyan.withValues(alpha: 0.5)),
                          ),
                        ),
                        child: InkWell(
                          onTap: locked
                              ? () {
                                  ScaffoldMessenger.of(context).showSnackBar(
                                    SnackBar(
                                      backgroundColor: HunterTheme.crimson,
                                      content: Text(
                                        'Complete 100% of Week ${week.weekNumber - 1} to unlock Phase ${week.weekNumber}.',
                                      ),
                                    ),
                                  );
                                }
                              : () => Navigator.of(context).push(
                                    MaterialPageRoute(
                                      builder: (_) =>
                                          WeekProtocolScreen(weekNumber: week.weekNumber),
                                    ),
                                  ),
                          borderRadius: BorderRadius.circular(16),
                          child: Padding(
                            padding: const EdgeInsets.all(16),
                            child: Row(
                              children: [
                                SizedBox(
                                  width: 52,
                                  height: 52,
                                  child: Stack(
                                    alignment: Alignment.center,
                                    children: [
                                      CircularProgressIndicator(
                                        value: locked ? 0.0 : week.progress,
                                        backgroundColor: HunterTheme.abyss,
                                        valueColor: AlwaysStoppedAnimation<Color>(
                                          pct == 100
                                              ? HunterTheme.emerald
                                              : HunterTheme.cyan,
                                        ),
                                        strokeWidth: 5,
                                      ),
                                      locked
                                          ? const Icon(Icons.lock,
                                              size: 18, color: HunterTheme.textMuted)
                                          : Text(
                                              '$pct%',
                                              style: const TextStyle(
                                                color: HunterTheme.textPrimary,
                                                fontWeight: FontWeight.w900,
                                                fontSize: 11.5,
                                              ),
                                            ),
                                    ],
                                  ),
                                ),
                                const SizedBox(width: 16),
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Text(
                                        'WEEK ${week.weekNumber} // ${week.phaseName.toUpperCase()}',
                                        style: TextStyle(
                                          color: locked
                                              ? HunterTheme.textMuted
                                              : HunterTheme.cyanLight,
                                          fontWeight: FontWeight.w900,
                                          fontSize: 12,
                                          letterSpacing: 1.1,
                                        ),
                                      ),
                                      const SizedBox(height: 4),
                                      Text(
                                        week.goal,
                                        style: TextStyle(
                                          color: locked
                                              ? HunterTheme.textMuted
                                              : HunterTheme.textPrimary,
                                          fontWeight: FontWeight.bold,
                                          fontSize: 14,
                                        ),
                                      ),
                                      const SizedBox(height: 4),
                                      Text(
                                        '${week.completedCount}/${week.tasks.length} Tasks  •  ${week.loggedFocusMinutes}/${week.targetFocusMinutes}m Focus  •  ${week.loggedWorkouts}/${week.targetWorkouts} Workouts',
                                        style: const TextStyle(
                                          color: HunterTheme.textMuted,
                                          fontSize: 11,
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                                Icon(
                                  locked ? Icons.lock_outline : Icons.chevron_right,
                                  color: locked
                                      ? HunterTheme.textMuted
                                      : HunterTheme.cyanLight,
                                ),
                              ],
                            ),
                          ),
                        ),
                      );
                    }),
                  ],
                ],
              ),
            ),
    );
  }
}
