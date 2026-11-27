import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/providers/appearance_provider.dart';
import '../../core/providers/auth_provider.dart';
import '../../core/providers/quests_provider.dart';
import '../../core/providers/roadmap_provider.dart';
import '../../core/providers/system_mechanics_provider.dart';
import '../../core/theme/hunter_theme.dart';
import '../../core/widgets/boss_raid_card.dart';
import '../../core/widgets/daily_countdown_banner.dart';
import '../../core/widgets/system_panel.dart';
import '../../models/user_model.dart';
import '../debrief/debrief_screen.dart';
import '../journal/journal_screen.dart';
import '../roadmap/roadmap_screen.dart';

/// Dedicated Hunter Command Home Screen (Landing Tab 0).
/// Balances 60-70% clean modern overview with 30-40% Solo Leveling System HUD.
class HomeScreen extends ConsumerWidget {
  final UserModel user;
  final void Function(int tabIndex) onNavigateTab;
  final VoidCallback onOpenSystemCommand;

  const HomeScreen({
    super.key,
    required this.user,
    required this.onNavigateTab,
    required this.onOpenSystemCommand,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    ref.watch(appearanceProvider);
    final liveUser = ref.watch(authProvider).value ?? user;
    final quests = ref.watch(questsProvider);
    final ultimatum = ref.watch(ultimatumProvider).valueOrNull ?? liveUser.ultimatumState;
    final activeWeek = ref.watch(roadmapProvider).roadmap?.activeWeek;
    final pendingQuests = quests.where((q) => !q.completed).take(3).toList();

    final xpInLevel = liveUser.xp % 100;
    final accent = liveUser.inPenaltyZone ? HunterTheme.crimson : HunterTheme.cyan;

    return Scaffold(
      backgroundColor: HunterTheme.abyss,
      appBar: AppBar(
        backgroundColor: HunterTheme.abyss,
        elevation: 0,
        titleSpacing: 16,
        title: Row(
          children: [
            RankDiamondBadge(tier: liveUser.tier, size: 34),
            const SizedBox(width: 10),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    liveUser.name.toUpperCase(),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: TextStyle(
                      color: HunterTheme.textPrimary,
                      fontWeight: FontWeight.w900,
                      fontSize: 15,
                      letterSpacing: 1.1,
                    ),
                  ),
                  Text(
                    'LV.${liveUser.level} ${(liveUser.evolvedClass ?? liveUser.hunterClass).toUpperCase()}',
                    style: TextStyle(
                      color: HunterTheme.cyanLight,
                      fontSize: 10.5,
                      fontWeight: FontWeight.w800,
                      letterSpacing: 1.0,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
        actions: [
          Semantics(
            label: 'Open System Command Quick Menu',
            button: true,
            child: IconButton(
              icon: Icon(Icons.grid_view_rounded, color: HunterTheme.cyanLight),
              tooltip: 'System Command Menu',
              onPressed: () {
                HapticFeedback.selectionClick();
                onOpenSystemCommand();
              },
            ),
          ),
        ],
      ),
      body: RefreshIndicator(
        color: HunterTheme.cyan,
        onRefresh: () async {
          await Future.wait([
            ref.read(questsProvider.notifier).loadQuests(),
            ref.read(roadmapProvider.notifier).loadRoadmap(forceRefresh: true),
          ]);
        },
        child: ListView(
          padding: const EdgeInsets.fromLTRB(16, 8, 16, 28),
          children: [
            // 1. Hunter Status Hero (SystemPanel)
            SystemPanel(
              tag: liveUser.inPenaltyZone ? 'PENALTY ZONE' : 'STATUS WINDOW',
              accentColor: accent,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      _statPill(Icons.local_fire_department_rounded, '${liveUser.streak}d Streak', HunterTheme.gold),
                      _statPill(Icons.shield_rounded, '${liveUser.streakShields} Shields', HunterTheme.cyanLight),
                      _statPill(Icons.monetization_on_rounded, '${liveUser.coins} Coins', HunterTheme.gold),
                    ],
                  ),
                  const SizedBox(height: 14),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        'LEVEL ${liveUser.level} PROGRESS',
                        style: TextStyle(color: HunterTheme.textMuted, fontSize: 11, fontWeight: FontWeight.bold),
                      ),
                      Text(
                        '$xpInLevel / 100 XP',
                        style: TextStyle(color: accent, fontSize: 11.5, fontWeight: FontWeight.w900),
                      ),
                    ],
                  ),
                  const SizedBox(height: 6),
                  ClipRRect(
                    borderRadius: BorderRadius.circular(6),
                    child: LinearProgressIndicator(
                      value: xpInLevel / 100.0,
                      minHeight: 7,
                      backgroundColor: HunterTheme.surfaceLight,
                      valueColor: AlwaysStoppedAnimation<Color>(accent),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 14),

            // 2. Daily Quest Ultimatum Countdown
            DailyCountdownBanner(
              inPenaltyZone: liveUser.inPenaltyZone,
              remainingQuests: quests.where((q) => !q.completed).length,
              completedParts: (ultimatum?['completedCount'] as num?)?.toInt() ?? 0,
              totalParts: (ultimatum?['totalParts'] as num?)?.toInt() ?? 4,
              shieldAbsorbed: ultimatum?['shieldAbsorbed'] == true,
              warningLine: ultimatum?['warningLine']?.toString(),
              items: ((ultimatum?['items'] as List?) ?? const [])
                  .whereType<Map<String, dynamic>>()
                  .toList(),
            ),

            // 3. Active Boss Raid HP Bar (if active)
            if (activeWeek != null) ...[
              const SizedBox(height: 12),
              BossRaidCard(week: activeWeek),
            ],

            const SizedBox(height: 18),

            // 4. 2x2 Thumb-Friendly Quick-Launch Grid
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  'QUICK ACTIONS',
                  style: TextStyle(
                    color: HunterTheme.textMuted,
                    fontWeight: FontWeight.bold,
                    fontSize: 11.5,
                    letterSpacing: 1.2,
                  ),
                ),
                TextButton(
                  onPressed: onOpenSystemCommand,
                  child: Text('ALL MODULES >', style: TextStyle(color: HunterTheme.cyanLight, fontSize: 11)),
                ),
              ],
            ),
            const SizedBox(height: 6),
            GridView.count(
              crossAxisCount: 2,
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              mainAxisSpacing: 10,
              crossAxisSpacing: 10,
              childAspectRatio: 2.15,
              children: [
                _quickTile(
                  context: context,
                  icon: Icons.timer_rounded,
                  color: HunterTheme.cyan,
                  label: 'Focus Sprint',
                  sub: 'Air-Gap Timer',
                  onTap: () => onNavigateTab(3),
                ),
                _quickTile(
                  context: context,
                  icon: Icons.fitness_center_rounded,
                  color: HunterTheme.gold,
                  label: 'Log Workout',
                  sub: 'Sets & PRs',
                  onTap: () => onNavigateTab(2),
                ),
                _quickTile(
                  context: context,
                  icon: Icons.shield_moon_outlined,
                  color: HunterTheme.emeraldLight,
                  label: 'Evening Debrief',
                  sub: 'Daily Review',
                  onTap: () => Navigator.of(context).push(
                    MaterialPageRoute(builder: (_) => DebriefScreen(user: liveUser)),
                  ),
                ),
                _quickTile(
                  context: context,
                  icon: Icons.auto_stories_rounded,
                  color: HunterTheme.purple,
                  label: 'Chronicle',
                  sub: 'Private Journal',
                  onTap: () => Navigator.of(context).push(
                    MaterialPageRoute(builder: (_) => const JournalScreen()),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 18),

            // 5. Today's Priority Quests
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  'TODAY\'S PRIORITY QUESTS',
                  style: TextStyle(
                    color: HunterTheme.textMuted,
                    fontWeight: FontWeight.bold,
                    fontSize: 11.5,
                    letterSpacing: 1.2,
                  ),
                ),
                TextButton(
                  onPressed: () => onNavigateTab(1),
                  child: Text('VIEW ALL >', style: TextStyle(color: HunterTheme.cyanLight, fontSize: 11)),
                ),
              ],
            ),
            if (pendingQuests.isEmpty)
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: HunterTheme.surface,
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(color: HunterTheme.surfaceLight),
                ),
                child: Row(
                  children: [
                    Icon(Icons.check_circle_outline, color: HunterTheme.emeraldLight),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'All current quests cleared!',
                            style: TextStyle(color: HunterTheme.textPrimary, fontWeight: FontWeight.bold),
                          ),
                          TextButton(
                            style: TextButton.styleFrom(padding: EdgeInsets.zero, minimumSize: const Size(0, 28)),
                            onPressed: () => Navigator.of(context).push(
                              MaterialPageRoute(builder: (_) => const RoadmapScreen()),
                            ),
                            child: Text('Check 30-Day Roadmap ->', style: TextStyle(color: HunterTheme.cyanLight, fontSize: 12)),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              )
            else
              ...pendingQuests.map((q) => Padding(
                    padding: const EdgeInsets.only(bottom: 8),
                    child: Material(
                      color: HunterTheme.surface,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(14),
                        side: BorderSide(color: HunterTheme.surfaceLight),
                      ),
                      clipBehavior: Clip.antiAlias,
                      child: ListTile(
                      minVerticalPadding: 10,
                      leading: CircleAvatar(
                        radius: 18,
                        backgroundColor: HunterTheme.cyan.withValues(alpha: 0.14),
                        child: Text(
                          q.attribute,
                          style: TextStyle(color: HunterTheme.cyanLight, fontSize: 10, fontWeight: FontWeight.w900),
                        ),
                      ),
                      title: Text(
                        q.title,
                        style: TextStyle(color: HunterTheme.textPrimary, fontWeight: FontWeight.bold, fontSize: 13.5),
                      ),
                      subtitle: Text(
                        '+${q.xp} XP • +${q.coins} Coins',
                        style: TextStyle(color: HunterTheme.gold, fontSize: 11.5),
                      ),
                      trailing: IconButton(
                        tooltip: 'Go to Quests',
                        icon: Icon(Icons.arrow_forward_ios_rounded, size: 16, color: HunterTheme.cyanLight),
                        onPressed: () => onNavigateTab(1),
                      ),
                      onTap: () => onNavigateTab(1),
                    ),
                  ),
                )),
          ],
        ),
      ),
    );
  }

  Widget _statPill(IconData icon, String text, Color color) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: color.withValues(alpha: 0.35)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, color: color, size: 14),
          const SizedBox(width: 5),
          Text(
            text,
            style: TextStyle(color: color, fontWeight: FontWeight.w800, fontSize: 11.5),
          ),
        ],
      ),
    );
  }

  Widget _quickTile({
    required BuildContext context,
    required IconData icon,
    required Color color,
    required String label,
    required String sub,
    required VoidCallback onTap,
  }) {
    return Semantics(
      button: true,
      label: '$label - $sub',
      child: Material(
        color: HunterTheme.surface,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(14),
          side: BorderSide(color: color.withValues(alpha: 0.3)),
        ),
        clipBehavior: Clip.antiAlias,
        child: InkWell(
          onTap: () {
            HapticFeedback.selectionClick();
            onTap();
          },
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
            child: Row(
              children: [
                Container(
                  width: 36,
                  height: 36,
                  decoration: BoxDecoration(
                    color: color.withValues(alpha: 0.15),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: Icon(icon, color: color, size: 19),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        label,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: TextStyle(
                          color: HunterTheme.textPrimary,
                          fontWeight: FontWeight.w800,
                          fontSize: 12.5,
                        ),
                      ),
                      Text(
                        sub,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: TextStyle(color: HunterTheme.textMuted, fontSize: 10.5),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
