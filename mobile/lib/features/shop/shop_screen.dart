import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/providers/auth_provider.dart';
import '../../core/theme/hunter_theme.dart';

/// Feature #1 Supply Depot Shop — Coming Soon placeholder.
class ShopScreen extends ConsumerWidget {
  const ShopScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final user = ref.watch(authProvider).value;

    return Scaffold(
      backgroundColor: HunterTheme.abyss,
      appBar: AppBar(
        backgroundColor: HunterTheme.abyss,
        elevation: 0,
        title: Text(
          'SUPPLY DEPOT',
          style: TextStyle(
            color: HunterTheme.textPrimary,
            fontWeight: FontWeight.w900,
            letterSpacing: 1.5,
            fontSize: 17,
          ),
        ),
        actions: [
          Container(
            margin: const EdgeInsets.only(right: 14, top: 8, bottom: 8),
            padding: const EdgeInsets.symmetric(horizontal: 12),
            decoration: BoxDecoration(
              color: HunterTheme.gold.withValues(alpha: 0.14),
              borderRadius: BorderRadius.circular(18),
              border: Border.all(color: HunterTheme.gold.withValues(alpha: 0.55)),
            ),
            child: Row(
              children: [
                Icon(Icons.monetization_on, color: HunterTheme.gold, size: 16),
                const SizedBox(width: 5),
                Text(
                  '${user?.coins ?? 0}',
                  style: TextStyle(
                    color: HunterTheme.gold,
                    fontWeight: FontWeight.w900,
                    fontSize: 13,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            // Lock icon with glow
            Container(
              width: 110,
              height: 110,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: HunterTheme.gold.withValues(alpha: 0.1),
                border: Border.all(color: HunterTheme.gold.withValues(alpha: 0.5), width: 2),
                boxShadow: [
                  BoxShadow(
                    color: HunterTheme.gold.withValues(alpha: 0.2),
                    blurRadius: 24,
                    spreadRadius: 4,
                  ),
                ],
              ),
              child: Icon(Icons.lock_clock_rounded, color: HunterTheme.gold, size: 56),
            ),
            const SizedBox(height: 28),
            Text(
              'SUPPLY DEPOT',
              style: TextStyle(
                color: HunterTheme.gold,
                fontWeight: FontWeight.w900,
                fontSize: 22,
                letterSpacing: 3,
              ),
            ),
            const SizedBox(height: 14),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 28, vertical: 10),
              decoration: BoxDecoration(
                color: HunterTheme.gold.withValues(alpha: 0.12),
                borderRadius: BorderRadius.circular(14),
                border: Border.all(color: HunterTheme.gold.withValues(alpha: 0.55)),
              ),
              child: Text(
                '— COMING SOON —',
                style: TextStyle(
                  color: HunterTheme.gold,
                  fontWeight: FontWeight.w900,
                  fontSize: 15,
                  letterSpacing: 4,
                ),
              ),
            ),
            const SizedBox(height: 20),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 48),
              child: Text(
                'The Armory is being forged.\nItems, titles, badges, boosts, and power-ups will drop here soon.',
                textAlign: TextAlign.center,
                style: TextStyle(
                  color: HunterTheme.textMuted,
                  fontSize: 13.5,
                  height: 1.65,
                ),
              ),
            ),
            const SizedBox(height: 32),
            // Teaser chips
            Wrap(
              spacing: 10,
              runSpacing: 8,
              alignment: WrapAlignment.center,
              children: [
                _teaserChip('🛡️ Streak Shield', HunterTheme.cyan),
                _teaserChip('🏷️ Custom Titles', HunterTheme.purple),
                _teaserChip('⚡ XP Boosts', HunterTheme.gold),
                _teaserChip('🏅 Rank Badges', HunterTheme.emeraldLight),
                _teaserChip('🎨 Avatar Frames', HunterTheme.cyanLight),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _teaserChip(String label, Color color) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 7),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: color.withValues(alpha: 0.4)),
      ),
      child: Text(
        label,
        style: TextStyle(color: color, fontSize: 12, fontWeight: FontWeight.bold),
      ),
    );
  }
}
