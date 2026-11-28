import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../features/shadows/arise_extraction_overlay.dart';
import '../../models/roadmap_models.dart';
import '../../models/user_model.dart';
import '../api/api_error.dart';
import '../providers/roadmap_provider.dart';
import '../providers/system_mechanics_provider.dart';
import '../theme/hunter_theme.dart';
import 'system_window_dialog.dart';

/// Shared Feature #4 & #3 Multi-Day Weekly Boss Raid HP Bar + ARISE Extraction Trigger.
class BossRaidCard extends ConsumerStatefulWidget {
  final RoadmapWeekModel week;
  final UserModel? user;

  const BossRaidCard({super.key, required this.week, this.user});

  @override
  ConsumerState<BossRaidCard> createState() => _BossRaidCardState();
}

class _BossRaidCardState extends ConsumerState<BossRaidCard> {
  bool _claiming = false;

  Future<void> _claimLoot() async {
    setState(() => _claiming = true);
    try {
      final res = await SystemMechanicsActions.claimBossLoot(ref);
      await ref.read(roadmapProvider.notifier).loadRoadmap();
      if (!mounted) return;
      final ext = res['pendingExtraction'] as Map<String, dynamic>?;
      await SystemWindowDialog.show(
        context,
        headerTag: 'BOSS DEFEATED',
        title: '${widget.week.bossName ?? "WEEKLY BOSS"} SLAIN!',
        body: '+${res['coinsAwarded'] ?? 120} Coins and +${res['xpAwarded'] ?? 100} XP secured. A shadowy aura lingers over the corpse.',
        tone: SystemWindowTone.purple,
        icon: Icons.whatshot_rounded,
        primaryLabel: ext != null ? 'PROCEED TO ARISE' : 'CLAIM LOOT',
        enableShare: true,
        onPrimary: () {
          Navigator.of(context).pop();
          if (ext != null && mounted) {
            AriseExtractionOverlay.show(context, ext);
          }
        },
      );
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          backgroundColor: HunterTheme.crimson,
          content: Text(extractApiError(e, 'Unable to claim boss loot')),
        ),
      );
    } finally {
      if (mounted) setState(() => _claiming = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final w = widget.week;
    final pendingExt = widget.user?.pendingExtraction;
    final accent = w.bossDefeated ? HunterTheme.purple : HunterTheme.crimson;

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: HunterTheme.surface,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: accent.withValues(alpha: 0.65), width: 1.4),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      w.bossDefeated
                          ? '[ BOSS SLAIN // WEEK ${w.weekNumber} ]'
                          : '[ DUNGEON BOSS // WEEK ${w.weekNumber} ]',
                      style: TextStyle(
                        color: accent,
                        fontWeight: FontWeight.w900,
                        fontSize: 10.5,
                        letterSpacing: 1.2,
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      w.bossName ?? 'Blood-Red Sentinel',
                      style: TextStyle(
                        color: HunterTheme.textPrimary,
                        fontWeight: FontWeight.w900,
                        fontSize: 15,
                      ),
                    ),
                  ],
                ),
              ),
              Text(
                '${w.bossCurrentHp} / ${w.bossMaxHp} HP',
                style: TextStyle(
                  color: w.bossDefeated ? HunterTheme.purple : HunterTheme.crimson,
                  fontWeight: FontWeight.w900,
                  fontSize: 12,
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          ClipRRect(
            borderRadius: BorderRadius.circular(7),
            child: LinearProgressIndicator(
              value: w.bossHpFraction,
              backgroundColor: HunterTheme.abyss,
              valueColor: AlwaysStoppedAnimation<Color>(accent),
              minHeight: 9,
            ),
          ),
          const SizedBox(height: 8),
          if (w.bossWeaknessRule != null && w.bossWeaknessRule!.isNotEmpty)
            Text(
              'Weakness: ${w.bossWeaknessRule!}',
              style: TextStyle(
                color: HunterTheme.textMuted,
                fontSize: 11,
                height: 1.3,
              ),
            ),
          if (w.bossDefeated && !w.bossLootClaimed) ...[
            const SizedBox(height: 10),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton.icon(
                onPressed: _claiming ? null : _claimLoot,
                icon: _claiming
                    ? const SizedBox(
                        width: 15,
                        height: 15,
                        child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                      )
                    : const Icon(Icons.card_giftcard_rounded, size: 17),
                label: const Text(
                  'CLAIM BOSS LOOT (+120C) AND OPEN ARISE GATE',
                  style: TextStyle(fontWeight: FontWeight.w900, fontSize: 11.5),
                ),
                style: ElevatedButton.styleFrom(
                  backgroundColor: HunterTheme.purple,
                  foregroundColor: Colors.white,
                ),
              ),
            ),
          ] else if (pendingExt != null &&
              ((pendingExt['attemptsRemaining'] as num?)?.toInt() ?? 0) > 0) ...[
            const SizedBox(height: 10),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton.icon(
                onPressed: () => AriseExtractionOverlay.show(context, pendingExt),
                icon: const Icon(Icons.shield_moon_rounded, size: 17),
                label: Text(
                  'ARISE: EXTRACT SHADOW (${pendingExt['attemptsRemaining']} TRIES LEFT)',
                  style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 11.5),
                ),
                style: ElevatedButton.styleFrom(
                  backgroundColor: HunterTheme.purple,
                  foregroundColor: Colors.white,
                ),
              ),
            ),
          ],
        ],
      ),
    );
  }
}
