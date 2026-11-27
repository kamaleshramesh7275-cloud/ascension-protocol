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
import '../../models/user_model.dart';
import '../theme/hunter_theme.dart';

/// Thumb-zone 1-tap System Command Quick-Jump Sheet.
/// Makes every app module reachable in 1-2 taps from any screen without deep scrolling.
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
      initialChildSize: 0.72,
      minChildSize: 0.48,
      maxChildSize: 0.9,
      builder: (ctx, scrollCtrl) => ListView(
        controller: scrollCtrl,
        padding: const EdgeInsets.fromLTRB(20, 12, 20, 28),
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
              const Icon(Icons.grid_view_rounded, color: HunterTheme.cyanLight, size: 20),
              const SizedBox(width: 8),
              const Text(
                'SYSTEM COMMAND // ALL MODULES',
                style: TextStyle(
                  color: HunterTheme.cyanLight,
                  fontWeight: FontWeight.w900,
                  letterSpacing: 1.3,
                  fontSize: 13.5,
                ),
              ),
              const Spacer(),
              IconButton(
                tooltip: 'Close',
                onPressed: () => Navigator.of(ctx).pop(),
                icon: const Icon(Icons.close, color: HunterTheme.textMuted),
              ),
            ],
          ),
          const SizedBox(height: 10),

          _sectionHeader('DAILY GRIND'),
          _grid(ctx, [
            _cmd(ctx, Icons.shield_moon_outlined, HunterTheme.emeraldLight, 'Debrief', () => DebriefScreen(user: user)),
            _cmd(ctx, Icons.auto_stories_rounded, HunterTheme.purple, 'Chronicle', () => const JournalScreen()),
            _cmd(ctx, Icons.map_rounded, HunterTheme.cyanLight, 'Roadmap', () => const RoadmapScreen()),
          ]),
          const SizedBox(height: 16),

          _sectionHeader('PROGRESSION & GEAR'),
          _grid(ctx, [
            _cmd(ctx, Icons.radar, HunterTheme.cyan, 'Stats & ID', () => StatsScreen(user: user)),
            _cmd(ctx, Icons.storefront_rounded, HunterTheme.gold, 'Shop', () => const ShopScreen()),
            _cmd(ctx, Icons.shield_moon_rounded, HunterTheme.purple, 'Shadows', () => const ShadowArmyScreen()),
          ]),
          const SizedBox(height: 16),

          _sectionHeader('SOCIAL & ENDGAME'),
          _grid(ctx, [
            _cmd(ctx, Icons.groups_rounded, HunterTheme.purple, 'Guilds', () => const GuildsScreen()),
            _cmd(ctx, Icons.leaderboard_rounded, HunterTheme.cyan, 'Divisions', () => const RivalDivisionsScreen()),
            _cmd(ctx, Icons.gavel_rounded, HunterTheme.gold, 'Contracts', () => const ContractsArenaScreen()),
            _cmd(ctx, Icons.dark_mode_rounded, HunterTheme.purple, 'Domain 4H', () => const MonarchDomainScreen()),
          ]),
          const SizedBox(height: 16),

          _sectionHeader('SYSTEM'),
          _grid(ctx, [
            _cmd(ctx, Icons.feedback_outlined, HunterTheme.cyan, 'Feedback', () => const FeedbackScreen()),
            _cmd(ctx, Icons.settings_outlined, HunterTheme.textMuted, 'Settings', () => const SettingsScreen()),
          ]),
        ],
      ),
    );
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
      crossAxisCount: 3,
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      mainAxisSpacing: 10,
      crossAxisSpacing: 10,
      childAspectRatio: 1.28,
      children: children,
    );
  }

  Widget _cmd(
    BuildContext context,
    IconData icon,
    Color color,
    String label,
    Widget Function() builder,
  ) {
    return Semantics(
      button: true,
      label: label,
      child: Material(
        color: HunterTheme.abyss,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(14),
          side: BorderSide(color: color.withValues(alpha: 0.3)),
        ),
        clipBehavior: Clip.antiAlias,
        child: InkWell(
          onTap: () {
            HapticFeedback.selectionClick();
            Navigator.of(context).pop();
            Navigator.of(context).push(MaterialPageRoute(builder: (_) => builder()));
          },
          child: ConstrainedBox(
            constraints: const BoxConstraints(minWidth: 48, minHeight: 48),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(icon, color: color, size: 24),
                const SizedBox(height: 6),
                Text(
                  label,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(
                    color: HunterTheme.textPrimary,
                    fontWeight: FontWeight.w800,
                    fontSize: 11.5,
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
