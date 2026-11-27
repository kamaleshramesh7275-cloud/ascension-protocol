import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/providers/auth_provider.dart';
import '../../core/theme/hunter_theme.dart';
import '../../core/widgets/home_widget_bridge.dart';
import '../../models/user_model.dart';
import '../accountability/contracts_arena_screen.dart';
import '../divisions/rival_divisions_screen.dart';
import '../focus/monarch_domain_screen.dart';
import '../feedback/feedback_screen.dart';
import '../guilds/guilds_screen.dart';
import '../library/library_screen.dart';
import '../roadmap/roadmap_screen.dart';
import '../settings/settings_screen.dart';
import '../shadows/shadow_army_screen.dart';
import '../shop/shop_screen.dart';
import '../stats/stats_screen.dart';
import '../stats/weekly_recap_sheet.dart';

/// Unified 5th-Tab Arsenal Hub connecting Stats/License, Shadow Army, Supply Depot Shop,
/// Accountability Arena, 30-Day Roadmap, Knowledge Library, & Settings.
class ArsenalHubScreen extends ConsumerWidget {
  final UserModel user;
  const ArsenalHubScreen({super.key, required this.user});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final liveUser = ref.watch(authProvider).value ?? user;

    return Scaffold(
      backgroundColor: HunterTheme.abyss,
      appBar: AppBar(
        backgroundColor: HunterTheme.abyss,
        elevation: 0,
        title: const Text(
          'HUNTER ARSENAL',
          style: TextStyle(
            color: HunterTheme.textPrimary,
            fontWeight: FontWeight.w900,
            letterSpacing: 1.8,
            fontSize: 17,
          ),
        ),
        actions: [
          InkWell(
            onTap: () => Navigator.of(context).push(
              MaterialPageRoute(builder: (_) => const ShopScreen()),
            ),
            borderRadius: BorderRadius.circular(18),
            child: Container(
              margin: const EdgeInsets.only(right: 14, top: 8, bottom: 8),
              padding: const EdgeInsets.symmetric(horizontal: 12),
              decoration: BoxDecoration(
                color: HunterTheme.gold.withValues(alpha: 0.14),
                borderRadius: BorderRadius.circular(18),
                border: Border.all(color: HunterTheme.gold.withValues(alpha: 0.55)),
              ),
              child: Row(
                children: [
                  const Icon(Icons.monetization_on, color: HunterTheme.gold, size: 15),
                  const SizedBox(width: 5),
                  Text(
                    '${liveUser.coins}',
                    style: const TextStyle(
                      color: HunterTheme.gold,
                      fontWeight: FontWeight.w900,
                      fontSize: 12.5,
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          // Quick Identity Header
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              gradient: LinearGradient(
                colors: [HunterTheme.surfaceLight, HunterTheme.surface],
              ),
              borderRadius: BorderRadius.circular(16),
              border: Border.all(
                color: liveUser.inPenaltyZone
                    ? HunterTheme.crimson
                    : HunterTheme.cyan.withValues(alpha: 0.4),
              ),
            ),
            child: Row(
              children: [
                CircleAvatar(
                  radius: 24,
                  backgroundColor: HunterTheme.cyan.withValues(alpha: 0.18),
                  child: Text(
                    liveUser.tier,
                    style: const TextStyle(
                      color: HunterTheme.cyanLight,
                      fontWeight: FontWeight.w900,
                      fontSize: 18,
                    ),
                  ),
                ),
                const SizedBox(width: 14),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        liveUser.name.toUpperCase(),
                        style: const TextStyle(
                          color: HunterTheme.textPrimary,
                          fontWeight: FontWeight.w900,
                          fontSize: 15,
                        ),
                      ),
                      Text(
                        'Lv.${liveUser.level} ${(liveUser.evolvedClass ?? liveUser.hunterClass).toUpperCase()} • ${liveUser.unspentStatPoints} Unspent Pts',
                        style: const TextStyle(
                          color: HunterTheme.cyanLight,
                          fontSize: 12,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 18),

          const Text(
            'SYSTEM & COMBAT PROGRESSION',
            style: TextStyle(
              color: HunterTheme.textMuted,
              fontWeight: FontWeight.bold,
              fontSize: 11,
              letterSpacing: 1.3,
            ),
          ),
          const SizedBox(height: 10),

          _hubTile(
            context: context,
            icon: Icons.radar,
            color: HunterTheme.cyan,
            title: 'HUNTER ATTRIBUTES & LICENSE',
            subtitle: liveUser.unspentStatPoints > 0
                ? '${liveUser.unspentStatPoints} Ability Points ready to allocate • Ghost Radar & PNG Card'
                : 'Ghost Radar, Class Evolution & PNG Hunter Card',
            badge: liveUser.unspentStatPoints > 0 ? '+${liveUser.unspentStatPoints}' : null,
            onTap: () => Navigator.of(context).push(
              MaterialPageRoute(builder: (_) => StatsScreen(user: liveUser)),
            ),
          ),
          _hubTile(
            context: context,
            icon: Icons.storefront_rounded,
            color: HunterTheme.gold,
            title: 'SUPPLY DEPOT SHOP',
            subtitle: liveUser.inPenaltyZone
                ? 'LOCKED — Clear Penalty Survival Quest to trade'
                : 'Titles, Badges, Themes & Mana Shields (${liveUser.coins} Coins)',
            onTap: () => Navigator.of(context).push(
              MaterialPageRoute(builder: (_) => const ShopScreen()),
            ),
          ),
          _hubTile(
            context: context,
            icon: Icons.shield_moon_rounded,
            color: HunterTheme.purple,
            title: 'SHADOW MONARCH ARMY',
            subtitle:
                'ARISE Passives • ${liveUser.equippedShadows.length}/3 Shadows Deployed',
            onTap: () => Navigator.of(context).push(
              MaterialPageRoute(builder: (_) => const ShadowArmyScreen()),
            ),
          ),
          _hubTile(
            context: context,
            icon: Icons.auto_graph_rounded,
            color: HunterTheme.emeraldLight,
            title: 'WEEKLY EVOLUTION DOSSIER',
            subtitle: 'Archetype Classification, Tonnage & Share Card',
            onTap: () => WeeklyRecapSheet.show(context),
          ),

          const SizedBox(height: 18),
          const Text(
            'ACCOUNTABILITY, ROADMAP & CODEX',
            style: TextStyle(
              color: HunterTheme.textMuted,
              fontWeight: FontWeight.bold,
              fontSize: 11,
              letterSpacing: 1.3,
            ),
          ),
          const SizedBox(height: 10),

          _hubTile(
            context: context,
            icon: Icons.leaderboard_rounded,
            color: HunterTheme.cyan,
            title: 'RIVAL DIVISIONS (${liveUser.divisionTier.toUpperCase()})',
            subtitle: 'Weekly 10-Hunter Pod • Top 2 Promote, Bottom 2 Demote',
            onTap: () => Navigator.of(context).push(
              MaterialPageRoute(builder: (_) => const RivalDivisionsScreen()),
            ),
          ),
          _hubTile(
            context: context,
            icon: Icons.groups_rounded,
            color: HunterTheme.purple,
            title: 'HUNTER GUILD & RAIDS',
            subtitle: 'Shared Weekly Guild Boss HP • Roster Output & Invites',
            onTap: () => Navigator.of(context).push(
              MaterialPageRoute(builder: (_) => const GuildsScreen()),
            ),
          ),
          _hubTile(
            context: context,
            icon: Icons.dark_mode_rounded,
            color: HunterTheme.purple,
            title: 'MONARCH\'S DOMAIN (4H LOCK)',
            subtitle: 'Weekly 4-Hour Sovereign Sprint + Workout (2x XP up to +600)',
            onTap: () => Navigator.of(context).push(
              MaterialPageRoute(builder: (_) => const MonarchDomainScreen()),
            ),
          ),
          _hubTile(
            context: context,
            icon: Icons.gavel_rounded,
            color: HunterTheme.gold,
            title: 'ACCOUNTABILITY ARENA',
            subtitle: 'Weekly Blood Contracts, 1v1 Buddy Covenants & Witness Wall',
            onTap: () => Navigator.of(context).push(
              MaterialPageRoute(builder: (_) => const ContractsArenaScreen()),
            ),
          ),
          _hubTile(
            context: context,
            icon: Icons.map_rounded,
            color: HunterTheme.cyanLight,
            title: '30-DAY PROTOCOL ROADMAP',
            subtitle: '4 Sequential Execution Phases & Trajectory Forecast',
            onTap: () => Navigator.of(context).push(
              MaterialPageRoute(builder: (_) => const RoadmapScreen()),
            ),
          ),
          _hubTile(
            context: context,
            icon: Icons.menu_book_rounded,
            color: HunterTheme.purple,
            title: 'KNOWLEDGE LIBRARY',
            subtitle: 'Training Manuals, Mindset Guides & Bookmarks',
            onTap: () => Navigator.of(context).push(
              MaterialPageRoute(builder: (_) => const LibraryScreen()),
            ),
          ),
          _hubTile(
            context: context,
            icon: Icons.feedback_outlined,
            color: HunterTheme.cyan,
            title: 'SYSTEM FEEDBACK & BUGS',
            subtitle: 'Report Bugs, Request New Features & Upvote Community Ideas',
            onTap: () => Navigator.of(context).push(
              MaterialPageRoute(builder: (_) => const FeedbackScreen()),
            ),
          ),
          _hubTile(
            context: context,
            icon: Icons.settings_outlined,
            color: HunterTheme.textMuted,
            title: 'SETTINGS & SYSTEM PROTOCOLS',
            subtitle: 'Hardcore Penalty Mode, Push Alerts & Account Controls',
            onTap: () => Navigator.of(context).push(
              MaterialPageRoute(builder: (_) => const SettingsScreen()),
            ),
          ),
          _hubTile(
            context: context,
            icon: Icons.widgets_outlined,
            color: HunterTheme.gold,
            title: 'PIN HOME-SCREEN QUEST HUD',
            subtitle: '1-Tap Android Widget with Live Quests & Focus Shortcut',
            onTap: () async {
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
        ],
      ),
    );
  }

  Widget _hubTile({
    required BuildContext context,
    required IconData icon,
    required Color color,
    required String title,
    required String subtitle,
    String? badge,
    required VoidCallback onTap,
  }) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: Material(
        color: HunterTheme.surface,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(14),
          side: BorderSide(color: color.withValues(alpha: 0.3)),
        ),
        clipBehavior: Clip.antiAlias,
        child: ListTile(
          contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
          leading: Container(
            width: 42,
            height: 42,
            decoration: BoxDecoration(
              color: color.withValues(alpha: 0.14),
              borderRadius: BorderRadius.circular(11),
            ),
            child: Icon(icon, color: color, size: 22),
          ),
          title: Row(
            children: [
              Expanded(
                child: Text(
                  title,
                  style: const TextStyle(
                    color: HunterTheme.textPrimary,
                    fontWeight: FontWeight.w900,
                    fontSize: 13.5,
                  ),
                ),
              ),
              if (badge != null)
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
                  decoration: BoxDecoration(
                    color: HunterTheme.gold.withValues(alpha: 0.2),
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(color: HunterTheme.gold),
                  ),
                  child: Text(
                    badge,
                    style: const TextStyle(
                      color: HunterTheme.gold,
                      fontSize: 10.5,
                      fontWeight: FontWeight.w900,
                    ),
                  ),
                ),
            ],
          ),
          subtitle: Text(
            subtitle,
            style: const TextStyle(color: HunterTheme.textMuted, fontSize: 11.5),
          ),
          trailing: const Icon(Icons.chevron_right, color: HunterTheme.textMuted),
          onTap: onTap,
        ),
      ),
    );
  }
}
