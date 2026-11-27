import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../../features/accountability/contracts_arena_screen.dart';
import '../../features/debrief/debrief_screen.dart';
import '../../features/divisions/rival_divisions_screen.dart';
import '../../features/feedback/feedback_screen.dart';
import '../../features/focus/monarch_domain_screen.dart';
import '../../features/guilds/guilds_screen.dart';
import '../../features/journal/journal_screen.dart';
import '../../features/roadmap/roadmap_screen.dart';
import '../../features/settings/settings_screen.dart';
import '../../features/shadows/shadow_army_screen.dart';
import '../../features/shop/shop_screen.dart';
import '../../features/stats/stats_screen.dart';
import '../../features/stats/weekly_recap_sheet.dart';
import '../../models/user_model.dart';
import '../theme/hunter_theme.dart';
import 'home_widget_bridge.dart';

/// Thumb-zone 1-tap System Command Quick-Jump Sheet.
/// Displays every Hunter module in a balanced 2-column command deck with clear titles & descriptions.
class SystemCommandSheet extends StatelessWidget {
  final UserModel user;
  const SystemCommandSheet({super.key, required this.user});

  static Future<void> show(BuildContext context, UserModel user) {
    return showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: HunterTheme.surface,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(22)),
      ),
      builder: (_) => SystemCommandSheet(user: user),
    );
  }

  @override
  Widget build(BuildContext context) {
    return DraggableScrollableSheet(
      expand: false,
      initialChildSize: 0.88,
      minChildSize: 0.55,
      maxChildSize: 0.95,
      builder: (ctx, scrollCtrl) => ListView(
        controller: scrollCtrl,
        padding: const EdgeInsets.fromLTRB(18, 12, 18, 28),
        children: [
          Center(
            child: Container(
              width: 40,
              height: 4,
              decoration: BoxDecoration(
                color: HunterTheme.textMuted.withValues(alpha: 0.4),
                borderRadius: BorderRadius.circular(2),
              ),
            ),
          ),
          const SizedBox(height: 14),
          Row(
            children: [
              const Icon(Icons.grid_view_rounded, color: HunterTheme.cyanLight, size: 22),
              const SizedBox(width: 10),
              const Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'SYSTEM COMMAND // ALL MODULES',
                      style: TextStyle(
                        color: HunterTheme.cyanLight,
                        fontWeight: FontWeight.w900,
                        letterSpacing: 1.2,
                        fontSize: 13.5,
                      ),
                    ),
                    SizedBox(height: 2),
                    Text(
                      '1-tap jump to any Hunter protocol or Arsenal module',
                      style: TextStyle(color: HunterTheme.textMuted, fontSize: 11),
                    ),
                  ],
                ),
              ),
              IconButton(
                tooltip: 'Close',
                onPressed: () => Navigator.of(ctx).pop(),
                icon: const Icon(Icons.close, color: HunterTheme.textMuted),
              ),
            ],
          ),
          const SizedBox(height: 14),

          _sectionHeader('DAILY GRIND & REVIEW'),
          _grid(ctx, [
            _cmd(
              ctx,
              Icons.shield_moon_outlined,
              HunterTheme.emeraldLight,
              'Evening Debrief',
              'Daily reflection & mood',
              () => _push(ctx, () => DebriefScreen(user: user)),
            ),
            _cmd(
              ctx,
              Icons.auto_stories_rounded,
              HunterTheme.purple,
              'Hunter\'s Chronicle',
              'Private journal & export',
              () => _push(ctx, () => const JournalScreen()),
            ),
            _cmd(
              ctx,
              Icons.map_rounded,
              HunterTheme.cyanLight,
              '30-Day Roadmap',
              '4-week execution phases',
              () => _push(ctx, () => const RoadmapScreen()),
            ),
            _cmd(
              ctx,
              Icons.auto_graph_rounded,
              HunterTheme.emeraldLight,
              'Weekly Dossier',
              'Evolution recap & card',
              () {
                Navigator.of(ctx).pop();
                WeeklyRecapSheet.show(context);
              },
            ),
          ]),
          const SizedBox(height: 16),

          _sectionHeader('PROGRESSION & GEAR'),
          _grid(ctx, [
            _cmd(
              ctx,
              Icons.radar,
              HunterTheme.cyan,
              'Stats & License',
              '7-stat radar & PNG ID',
              () => _push(ctx, () => StatsScreen(user: user)),
            ),
            _cmd(
              ctx,
              Icons.storefront_rounded,
              HunterTheme.gold,
              'Supply Shop',
              'Titles, themes & shields',
              () => _push(ctx, () => const ShopScreen()),
            ),
            _cmd(
              ctx,
              Icons.shield_moon_rounded,
              HunterTheme.purple,
              'Shadow Army',
              'ARISE passives & equip',
              () => _push(ctx, () => const ShadowArmyScreen()),
            ),
            _cmd(
              ctx,
              Icons.widgets_outlined,
              HunterTheme.gold,
              'Pin Quest Widget',
              'Android home screen HUD',
              () async {
                Navigator.of(ctx).pop();
                final ok = await HomeWidgetBridge.requestPinWidget();
                if (!context.mounted) return;
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(
                    backgroundColor: HunterTheme.surfaceLight,
                    content: Text(
                      ok
                          ? 'System Widget pin prompt dispatched.'
                          : 'Add via Android Home Screen -> Widgets -> Ascension Quest HUD.',
                      style: const TextStyle(color: HunterTheme.cyanLight),
                    ),
                  ),
                );
              },
            ),
          ]),
          const SizedBox(height: 16),

          _sectionHeader('SOCIAL & ENDGAME'),
          _grid(ctx, [
            _cmd(
              ctx,
              Icons.groups_rounded,
              HunterTheme.purple,
              'Hunter Guilds',
              'Co-op boss raids & chat',
              () => _push(ctx, () => const GuildsScreen()),
            ),
            _cmd(
              ctx,
              Icons.leaderboard_rounded,
              HunterTheme.cyan,
              'Rival Divisions',
              '10-hunter weekly pod',
              () => _push(ctx, () => const RivalDivisionsScreen()),
            ),
            _cmd(
              ctx,
              Icons.gavel_rounded,
              HunterTheme.gold,
              'Blood Contracts',
              'Staked goals & witness',
              () => _push(ctx, () => const ContractsArenaScreen()),
            ),
            _cmd(
              ctx,
              Icons.dark_mode_rounded,
              HunterTheme.purple,
              'Monarch\'s Domain',
              '4H locked 2x XP sprint',
              () => _push(ctx, () => const MonarchDomainScreen()),
            ),
          ]),
          const SizedBox(height: 16),

          _sectionHeader('SYSTEM & SUPPORT'),
          _grid(ctx, [
            _cmd(
              ctx,
              Icons.feedback_outlined,
              HunterTheme.cyan,
              'Feedback & Bugs',
              'Report bugs & vote ideas',
              () => _push(ctx, () => const FeedbackScreen()),
            ),
            _cmd(
              ctx,
              Icons.settings_outlined,
              HunterTheme.textMuted,
              'System Settings',
              'Hardcore mode & alerts',
              () => _push(ctx, () => const SettingsScreen()),
            ),
          ]),
        ],
      ),
    );
  }

  void _push(BuildContext ctx, Widget Function() builder) {
    Navigator.of(ctx).pop();
    Navigator.of(ctx).push(MaterialPageRoute(builder: (_) => builder()));
  }

  Widget _sectionHeader(String title) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Text(
        title,
        style: const TextStyle(
          color: HunterTheme.textMuted,
          fontWeight: FontWeight.bold,
          fontSize: 11,
          letterSpacing: 1.2,
        ),
      ),
    );
  }

  Widget _grid(BuildContext context, List<Widget> children) {
    return GridView.count(
      crossAxisCount: 2,
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      mainAxisSpacing: 10,
      crossAxisSpacing: 10,
      childAspectRatio: 2.35,
      children: children,
    );
  }

  Widget _cmd(
    BuildContext context,
    IconData icon,
    Color color,
    String title,
    String subtitle,
    VoidCallback onTap,
  ) {
    return Semantics(
      button: true,
      label: '$title. $subtitle',
      child: Material(
        color: HunterTheme.abyss,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(14),
          side: BorderSide(color: color.withValues(alpha: 0.35)),
        ),
        clipBehavior: Clip.antiAlias,
        child: InkWell(
          onTap: () {
            HapticFeedback.selectionClick();
            onTap();
          },
          child: ConstrainedBox(
            constraints: const BoxConstraints(minWidth: 48, minHeight: 58),
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
              child: Row(
                children: [
                  Container(
                    width: 36,
                    height: 36,
                    decoration: BoxDecoration(
                      color: color.withValues(alpha: 0.14),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: Icon(icon, color: color, size: 20),
                  ),
                  const SizedBox(width: 9),
                  Expanded(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          title,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: const TextStyle(
                            color: HunterTheme.textPrimary,
                            fontWeight: FontWeight.w800,
                            fontSize: 12,
                          ),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          subtitle,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: const TextStyle(
                            color: HunterTheme.textMuted,
                            fontSize: 10,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
