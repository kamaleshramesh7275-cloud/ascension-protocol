import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/providers/divisions_provider.dart';
import '../../core/theme/hunter_theme.dart';
import '../../core/widgets/system_window_dialog.dart';

/// Weekly 10-Hunter Rival Divisions Leaderboard & Promotion/Demotion Pod UI.
class RivalDivisionsScreen extends ConsumerStatefulWidget {
  const RivalDivisionsScreen({super.key});

  @override
  ConsumerState<RivalDivisionsScreen> createState() =>
      _RivalDivisionsScreenState();
}

class _RivalDivisionsScreenState extends ConsumerState<RivalDivisionsScreen> {
  Timer? _countdownTimer;
  bool _shownOutcomeDialog = false;

  @override
  void initState() {
    super.initState();
    _countdownTimer = Timer.periodic(const Duration(minutes: 1), (_) {
      if (mounted) setState(() {});
    });
    Future.microtask(() async {
      await ref.read(divisionsProvider.notifier).loadDivision();
      _maybeShowPendingOutcome();
    });
  }

  @override
  void dispose() {
    _countdownTimer?.cancel();
    super.dispose();
  }

  void _maybeShowPendingOutcome() {
    if (!mounted || _shownOutcomeDialog) return;
    final outcome = ref.read(divisionsProvider).pod?.pendingLastWeekOutcome;
    if (outcome == null) return;
    _shownOutcomeDialog = true;

    final promoted = outcome.outcome == 'promoted';
    final demoted = outcome.outcome == 'demoted';
    SystemWindowDialog.show(
      context,
      headerTag: 'WEEKLY POD SETTLEMENT // ${outcome.weekKey}',
      title: promoted
          ? 'DIVISION PROMOTED! (#${outcome.finalRank})'
          : (demoted
              ? 'DIVISION DEMOTED (#${outcome.finalRank})'
              : 'DIVISION STANDING CONFIRMED (#${outcome.finalRank})'),
      body:
          'You placed #${outcome.finalRank} in ${outcome.divisionTier} Pod.${outcome.rewardCoins > 0 ? '\nAwarded +${outcome.rewardCoins} Gold Coins.' : ''}',
      tone: promoted
          ? SystemWindowTone.gold
          : (demoted ? SystemWindowTone.crimson : SystemWindowTone.cyan),
      icon: promoted ? Icons.emoji_events_rounded : Icons.leaderboard_rounded,
      onPrimary: () {
        Navigator.of(context).pop();
        ref.read(divisionsProvider.notifier).acknowledgeOutcome(outcome.id);
      },
    );
  }

  Color _tierColor(String tier) {
    switch (tier) {
      case 'Monarch':
        return HunterTheme.purple;
      case 'Gold':
        return HunterTheme.gold;
      case 'Silver':
        return HunterTheme.cyanLight;
      default:
        return HunterTheme.emeraldLight;
    }
  }

  String _formatResetCountdown(DateTime? resetsAt) {
    if (resetsAt == null) return 'Sunday 20:00 UTC';
    final diff = resetsAt.difference(DateTime.now().toUtc());
    if (diff.isNegative) return 'Settling soon';
    final d = diff.inDays;
    final h = diff.inHours % 24;
    final m = diff.inMinutes % 60;
    return '${d}d ${h}h ${m}m left';
  }

  @override
  Widget build(BuildContext context) {
    final divState = ref.watch(divisionsProvider);
    final pod = divState.pod;

    return Scaffold(
      backgroundColor: HunterTheme.abyss,
      appBar: AppBar(
        backgroundColor: HunterTheme.abyss,
        elevation: 0,
        title: const Text(
          'RIVAL DIVISIONS',
          style: TextStyle(
            color: HunterTheme.textPrimary,
            fontWeight: FontWeight.w900,
            letterSpacing: 1.5,
            fontSize: 16,
          ),
        ),
      ),
      body: divState.loading && pod == null
          ? const Center(child: CircularProgressIndicator(color: HunterTheme.cyan))
          : pod == null
              ? const Center(
                  child: Text(
                    'Unable to load weekly rival pod.',
                    style: TextStyle(color: HunterTheme.textMuted),
                  ),
                )
              : RefreshIndicator(
                  onRefresh: () =>
                      ref.read(divisionsProvider.notifier).loadDivision(),
                  child: ListView(
                    padding: const EdgeInsets.all(16),
                    children: [
                      // Division Header Card
                      Container(
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          gradient: LinearGradient(
                            colors: [HunterTheme.surfaceLight, HunterTheme.surface],
                          ),
                          borderRadius: BorderRadius.circular(16),
                          border: Border.all(
                            color: _tierColor(pod.divisionTier).withValues(alpha: 0.7),
                            width: 1.4,
                          ),
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Text(
                                  '${pod.divisionTier.toUpperCase()} DIVISION // POD #${pod.podNumber}',
                                  style: TextStyle(
                                    color: _tierColor(pod.divisionTier),
                                    fontWeight: FontWeight.w900,
                                    fontSize: 13,
                                    letterSpacing: 1.2,
                                  ),
                                ),
                                Container(
                                  padding: const EdgeInsets.symmetric(
                                      horizontal: 8, vertical: 3),
                                  decoration: BoxDecoration(
                                    color: HunterTheme.abyss,
                                    borderRadius: BorderRadius.circular(8),
                                  ),
                                  child: Text(
                                    _formatResetCountdown(pod.resetsAt),
                                    style: const TextStyle(
                                      color: HunterTheme.gold,
                                      fontSize: 11,
                                      fontWeight: FontWeight.w900,
                                    ),
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 10),
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Text(
                                  'YOUR STANDING: #${pod.myRank} OF ${pod.members.length}',
                                  style: const TextStyle(
                                    color: HunterTheme.textPrimary,
                                    fontWeight: FontWeight.w900,
                                    fontSize: 16,
                                  ),
                                ),
                                if (pod.xpToNextRank > 0)
                                  Text(
                                    '+${pod.xpToNextRank} XP to climb',
                                    style: const TextStyle(
                                      color: HunterTheme.cyanLight,
                                      fontWeight: FontWeight.bold,
                                      fontSize: 12,
                                    ),
                                  ),
                              ],
                            ),
                            const SizedBox(height: 8),
                            Text(
                              pod.promotionCount > 0
                                  ? 'Top ${pod.promotionCount} Promote  •  ${pod.demotionCount > 0 ? 'Bottom ${pod.demotionCount} Demote' : 'No Demotions below Bronze/Small Pods'}'
                                  : 'Top Monarch finisher wins +400 Coins Sunday night.',
                              style: const TextStyle(
                                color: HunterTheme.textMuted,
                                fontSize: 11.5,
                              ),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 18),

                      ...pod.members.map((member) {
                        final isMe = member.userId == pod.myUserId;
                        final zoneColor = member.zone == 'promotion'
                            ? HunterTheme.emeraldLight
                            : (member.zone == 'demotion'
                                ? HunterTheme.crimson
                                : HunterTheme.cyan);
                        return Container(
                          margin: const EdgeInsets.only(bottom: 10),
                          padding: const EdgeInsets.symmetric(
                              horizontal: 14, vertical: 12),
                          decoration: BoxDecoration(
                            color: isMe
                                ? zoneColor.withValues(alpha: 0.14)
                                : HunterTheme.surface,
                            borderRadius: BorderRadius.circular(14),
                            border: Border.all(
                              color: isMe
                                  ? zoneColor
                                  : zoneColor.withValues(alpha: 0.3),
                              width: isMe ? 1.8 : 1.0,
                            ),
                          ),
                          child: Row(
                            children: [
                              Container(
                                width: 32,
                                height: 32,
                                alignment: Alignment.center,
                                decoration: BoxDecoration(
                                  color: zoneColor.withValues(alpha: 0.18),
                                  shape: BoxShape.circle,
                                ),
                                child: Text(
                                  '#${member.rank}',
                                  style: TextStyle(
                                    color: zoneColor,
                                    fontWeight: FontWeight.w900,
                                    fontSize: 12,
                                  ),
                                ),
                              ),
                              const SizedBox(width: 12),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Row(
                                      children: [
                                        Flexible(
                                          child: Text(
                                            member.userName + (isMe ? ' (YOU)' : ''),
                                            overflow: TextOverflow.ellipsis,
                                            style: TextStyle(
                                              color: HunterTheme.textPrimary,
                                              fontWeight: isMe
                                                  ? FontWeight.w900
                                                  : FontWeight.bold,
                                              fontSize: 14,
                                            ),
                                          ),
                                        ),
                                        const SizedBox(width: 6),
                                        Text(
                                          '[${member.userTier}]',
                                          style: const TextStyle(
                                            color: HunterTheme.gold,
                                            fontSize: 11,
                                            fontWeight: FontWeight.bold,
                                          ),
                                        ),
                                      ],
                                    ),
                                    Text(
                                      member.zone == 'promotion'
                                          ? 'PROMOTION ZONE'
                                          : (member.zone == 'demotion'
                                              ? 'DEMOTION DANGER'
                                              : 'SAFE STANDING'),
                                      style: TextStyle(
                                        color: zoneColor,
                                        fontSize: 9.5,
                                        fontWeight: FontWeight.w900,
                                        letterSpacing: 1,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                              Text(
                                '${member.weeklyXp} XP',
                                style: const TextStyle(
                                  color: HunterTheme.cyanLight,
                                  fontWeight: FontWeight.w900,
                                  fontSize: 14,
                                ),
                              ),
                            ],
                          ),
                        );
                      }),
                    ],
                  ),
                ),
    );
  }
}
