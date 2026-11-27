import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/api/api_error.dart';
import '../../core/providers/appearance_provider.dart';
import '../../core/providers/auth_provider.dart';
import '../../core/providers/divisions_provider.dart';
import '../../core/providers/quests_provider.dart';
import '../../core/providers/roadmap_provider.dart';
import '../../core/providers/system_mechanics_provider.dart';
import '../../core/storage/session_storage.dart';
import '../../core/theme/hunter_theme.dart';
import '../../core/widgets/boss_raid_card.dart';
import '../../core/widgets/daily_countdown_banner.dart';
import '../../core/widgets/system_window_dialog.dart';
import '../../models/quest_model.dart';
import '../../models/user_model.dart';
import '../divisions/rival_divisions_screen.dart';
import '../focus/focus_screen.dart';
import '../home/comeback_gate_sheet.dart';
import '../workout/workout_screen.dart';

class QuestsScreen extends ConsumerStatefulWidget {
  final UserModel user;
  const QuestsScreen({super.key, required this.user});

  @override
  ConsumerState<QuestsScreen> createState() => _QuestsScreenState();
}

class _QuestsScreenState extends ConsumerState<QuestsScreen> {
  String _selectedFilter = 'ALL';
  bool _checkedArrival = false;
  bool _showSystemArrivalBanner = false;
  bool _claimingGate = false;
  bool _clearingPenalty = false;

  String get _todayIso => DateTime.now().toIso8601String().split('T').first;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _runSessionChecks());
  }

  Future<void> _runSessionChecks() async {
    if (!mounted || _checkedArrival) return;
    _checkedArrival = true;

    final user = ref.read(authProvider).value ?? widget.user;

    // 1. Check Surprise Gate spawn if none active or prior claimed
    if (user.activeGateEvent == null || user.activeGateEvent!.claimed) {
      try {
        await SystemMechanicsActions.checkOrSpawnGate(ref);
      } catch (_) {}
    }

    // 1b. Show Comeback Red Gate modal once on boot if active (#10)
    final gate = user.comebackGate;
    if (gate != null && gate['active'] == true && mounted) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (mounted) {
          ComebackGateSheet.show(context, gate);
        }
      });
    }

    // 2. First-open Daily System Arrival Notice (once per local date, non-blocking banner)
    try {
      final lastDate = await SessionStorage.getLastArrivalDate();
      final quests = ref.read(questsProvider);
      if (lastDate != _todayIso && quests.isNotEmpty && mounted) {
        setState(() => _showSystemArrivalBanner = true);
      }
    } catch (_) {}
  }

  Future<void> _dismissArrivalBanner() async {
    await SessionStorage.saveLastArrivalDate(_todayIso);
    if (mounted) setState(() => _showSystemArrivalBanner = false);
  }

  Future<void> _openAnchorPicker(List<QuestModel> quests) async {
    final candidates = quests.where((q) => !q.completed && !q.isPenalty).toList();
    if (candidates.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          backgroundColor: HunterTheme.surfaceLight,
          content: Text('No open quests left to anchor today.'),
        ),
      );
      return;
    }

    await showModalBottomSheet<void>(
      context: context,
      backgroundColor: HunterTheme.surface,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (ctx) => Padding(
        padding: const EdgeInsets.fromLTRB(16, 16, 16, 24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              '[ LOCK MORNING ANCHOR QUEST ]',
              style: TextStyle(
                color: HunterTheme.gold,
                fontSize: 12,
                fontWeight: FontWeight.w900,
                letterSpacing: 1.5,
              ),
            ),
            const SizedBox(height: 6),
            Text(
              'Select 1 non-negotiable priority quest. Completing it protects your core momentum for today.',
              style: TextStyle(color: HunterTheme.textMuted, fontSize: 12),
            ),
            const SizedBox(height: 12),
            ...candidates.take(6).map(
                  (q) => ListTile(
                    contentPadding: EdgeInsets.zero,
                    leading: Icon(Icons.anchor, color: HunterTheme.gold),
                    title: Text(
                      q.title,
                      style: TextStyle(
                        color: HunterTheme.textPrimary,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    subtitle: Text(
                      '+${q.xp} XP • ${q.attribute}',
                      style: TextStyle(color: HunterTheme.cyanLight, fontSize: 11),
                    ),
                    onTap: () async {
                      Navigator.of(ctx).pop();
                      try {
                        await SystemMechanicsActions.setAnchorQuest(ref, q.id);
                        HapticFeedback.heavyImpact();
                        if (!mounted) return;
                        ScaffoldMessenger.of(context).showSnackBar(
                          SnackBar(
                            backgroundColor: HunterTheme.surfaceLight,
                            content: Text('Morning Anchor Locked: ${q.title}'),
                          ),
                        );
                      } catch (e) {
                        if (!mounted) return;
                        ScaffoldMessenger.of(context).showSnackBar(
                          SnackBar(
                            backgroundColor: HunterTheme.crimson,
                            content: Text(extractApiError(e, 'Failed to set anchor')),
                          ),
                        );
                      }
                    },
                  ),
                ),
          ],
        ),
      ),
    );
  }

  Future<void> _claimSurpriseGate() async {
    setState(() => _claimingGate = true);
    try {
      final result = await SystemMechanicsActions.claimGate(ref);
      HapticFeedback.heavyImpact();
      if (!mounted) return;
      final coins = result['coinsAwarded'] ?? 0;
      final wonShield = result['wonShield'] == true;
      await SystemWindowDialog.show(
        context,
        headerTag: 'RELIC VAULT OPENED',
        title: 'DUNGEON GATE CLEARED!',
        body:
            'Earned +$coins Gold Coins${wonShield ? ' and +1 Mana Shield!' : '!'}',
        tone: SystemWindowTone.gold,
        icon: Icons.inventory_2_rounded,
        primaryLabel: 'COLLECT LOOT',
      );
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          backgroundColor: HunterTheme.crimson,
          content: Text(extractApiError(e, 'Gate objective still incomplete')),
        ),
      );
    } finally {
      if (mounted) setState(() => _claimingGate = false);
    }
  }

  Future<void> _verifyClearPenalty() async {
    setState(() => _clearingPenalty = true);
    try {
      final cleared = await SystemMechanicsActions.clearPenalty(ref);
      if (!mounted) return;
      if (cleared) {
        await SystemWindowDialog.show(
          context,
          headerTag: 'SURVIVAL COMPLETE',
          title: 'PENALTY ZONE ESCAPED',
          body: 'Supply Depot Shop and full Hunter privileges restored.',
          tone: SystemWindowTone.cyan,
          icon: Icons.verified_user,
        );
      }
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          backgroundColor: HunterTheme.crimson,
          content: Text(extractApiError(e, 'Complete survival quest first')),
        ),
      );
    } finally {
      if (mounted) setState(() => _clearingPenalty = false);
    }
  }

  Future<void> _toggleQuest(String questId) async {
    HapticFeedback.mediumImpact();
    final outcome =
        await ref.read(questsProvider.notifier).completeQuestWithOutcome(questId);

    if (!mounted) return;

    if (!outcome.success) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          backgroundColor: HunterTheme.crimson,
          content: Text('Failed to sync quest status with System.'),
        ),
      );
      return;
    }

    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        backgroundColor: HunterTheme.surfaceLight,
        content: Row(
          children: [
            Icon(Icons.bolt, color: HunterTheme.cyan),
            const SizedBox(width: 8),
            Text(
              outcome.offline
                  ? 'Quest Cached Offline — Syncing when online.'
                  : '+${outcome.xpAwarded} XP • +${outcome.coinsAwarded} Coins Synchronized.',
              style: TextStyle(
                color: HunterTheme.cyanLight,
                fontWeight: FontWeight.bold,
              ),
            ),
          ],
        ),
        duration: const Duration(seconds: 2),
        behavior: SnackBarBehavior.floating,
      ),
    );

    if (outcome.rankPromoted != null && outcome.rankPromoted!.isNotEmpty) {
      ref.invalidate(rankTrialsProvider);
      await SystemWindowDialog.showRankPromotion(
        context,
        newRank: outcome.rankPromoted!,
      );
    }
    if (!mounted) return;
    if (outcome.newlyUnlockedShadows.isNotEmpty) {
      await SystemWindowDialog.showShadowArise(
        context,
        shadowIds: outcome.newlyUnlockedShadows,
      );
    }
    if (!mounted) return;
    if (outcome.levelUp && outcome.newLevel != null) {
      await SystemWindowDialog.showLevelUp(
        context,
        newLevel: outcome.newLevel!,
        pointsAwarded: outcome.pointsAwarded > 0 ? outcome.pointsAwarded : 3,
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    ref.watch(appearanceProvider);
    final user = ref.watch(authProvider).value ?? widget.user;
    final quests = ref.watch(questsProvider);
    final trialsAsync = ref.watch(rankTrialsProvider);
    final fatigueAsync = ref.watch(fatigueProvider);

    final filteredQuests = _selectedFilter == 'ALL'
        ? quests
        : quests.where((q) {
            if (_selectedFilter == 'DAILY') {
              return q.type == 'daily' ||
                  q.category == 'fitness' ||
                  q.category == 'physical';
            }
            if (_selectedFilter == 'WEEKLY') {
              return q.type == 'weekly' || q.category == 'weekly';
            }
            if (_selectedFilter == 'BOSS') {
              return q.isBoss || q.type == 'boss' || q.category == 'boss';
            }
            if (_selectedFilter == 'PENALTY') {
              return q.isPenalty;
            }
            if (_selectedFilter == 'INTELLECT') {
              return q.category == 'productivity' ||
                  q.category == 'mental' ||
                  q.attribute == 'INT';
            }
            return true;
          }).toList();

    final completedCount = quests.where((q) => q.completed).length;
    final remainingCount = quests.where((q) => !q.completed).length;
    final anchorSetToday = user.anchorDate == _todayIso && user.anchorQuestId != null;

    return Scaffold(
      backgroundColor: HunterTheme.abyss,
      appBar: AppBar(
        backgroundColor: HunterTheme.abyss,
        elevation: 0,
        title: Row(
          children: [
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
              decoration: BoxDecoration(
                color: user.inPenaltyZone
                    ? HunterTheme.crimson.withValues(alpha: 0.2)
                    : HunterTheme.cyan.withValues(alpha: 0.15),
                borderRadius: BorderRadius.circular(8),
                border: Border.all(
                  color: user.inPenaltyZone
                      ? HunterTheme.crimson
                      : HunterTheme.cyan.withValues(alpha: 0.4),
                ),
              ),
              child: Text(
                'RANK ${user.tier}',
                style: TextStyle(
                  color: user.inPenaltyZone
                      ? HunterTheme.crimson
                      : HunterTheme.cyanLight,
                  fontWeight: FontWeight.w900,
                  fontSize: 13,
                ),
              ),
            ),
            const SizedBox(width: 8),
            Expanded(
              child: Text(
                'HUNTER SYSTEM',
                overflow: TextOverflow.ellipsis,
                style: Theme.of(context).textTheme.titleLarge?.copyWith(
                      letterSpacing: 1.4,
                      fontSize: 17,
                      fontWeight: FontWeight.w800,
                    ),
              ),
            ),
          ],
        ),
        actions: [
          Container(
            margin: const EdgeInsets.only(right: 16),
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
            decoration: BoxDecoration(
              color: HunterTheme.surface,
              borderRadius: BorderRadius.circular(20),
              border: Border.all(color: HunterTheme.gold.withValues(alpha: 0.3)),
            ),
            child: Row(
              children: [
                Icon(Icons.shield, color: HunterTheme.cyan, size: 16),
                const SizedBox(width: 4),
                Text(
                  '${user.streakShields} SHIELD',
                  style: TextStyle(
                    color: HunterTheme.textPrimary,
                    fontSize: 11,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: () async {
          await ref.read(questsProvider.notifier).loadQuests();
          ref.invalidate(rankTrialsProvider);
          ref.invalidate(fatigueProvider);
        },
        color: HunterTheme.cyan,
        backgroundColor: HunterTheme.surface,
        child: ListView(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
          children: [
            // SL-1: Daily Holographic System Notice Card (non-blocking)
            if (_showSystemArrivalBanner) ...[
              Container(
                margin: const EdgeInsets.only(bottom: 12),
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: HunterTheme.abyss,
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(color: HunterTheme.cyan, width: 1.4),
                  boxShadow: [
                    BoxShadow(
                      color: HunterTheme.cyan.withValues(alpha: 0.2),
                      blurRadius: 16,
                    ),
                  ],
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          '[ SYSTEM NOTICE // QUEST ASSIGNED ]',
                          style: TextStyle(
                            color: HunterTheme.cyanLight,
                            fontWeight: FontWeight.w900,
                            fontSize: 11,
                            letterSpacing: 1.2,
                          ),
                        ),
                        InkWell(
                          onTap: _dismissArrivalBanner,
                          child: Icon(Icons.close,
                              size: 16, color: HunterTheme.textMuted),
                        ),
                      ],
                    ),
                    const SizedBox(height: 6),
                    Text(
                      'DAILY PREPARATION TO BECOME STRONG — Clear today\'s protocol targets before 00:00.',
                      style: TextStyle(color: HunterTheme.textPrimary, fontSize: 12),
                    ),
                    const SizedBox(height: 8),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.end,
                      children: [
                        TextButton(
                          onPressed: () {
                            _dismissArrivalBanner();
                            SystemWindowDialog.showDailyArrival(
                              context,
                              quests: quests,
                              onSelectAnchor: anchorSetToday
                                  ? null
                                  : () => _openAnchorPicker(quests),
                            );
                          },
                          child: Text(
                            'INSPECT WINDOW',
                            style: TextStyle(
                              color: HunterTheme.cyanLight,
                              fontWeight: FontWeight.w900,
                              fontSize: 11,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ],

            // SL-2: Penalty Zone Emergency Survival Alert
            if (user.inPenaltyZone) ...[
              Container(
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: HunterTheme.crimson.withValues(alpha: 0.14),
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(color: HunterTheme.crimson, width: 1.5),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Icon(Icons.gpp_bad_rounded, color: HunterTheme.crimson, size: 20),
                        SizedBox(width: 8),
                        Text(
                          'PENALTY ZONE ACTIVE',
                          style: TextStyle(
                            color: HunterTheme.crimson,
                            fontWeight: FontWeight.w900,
                            letterSpacing: 1.3,
                            fontSize: 12.5,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 6),
                    Text(
                      'Shop is restricted. Clear your crimson Penalty Quest or complete a 15m Focus session to escape.',
                      style: TextStyle(color: HunterTheme.textPrimary, fontSize: 12),
                    ),
                    const SizedBox(height: 10),
                    Align(
                      alignment: Alignment.centerRight,
                      child: ElevatedButton(
                        onPressed: _clearingPenalty ? null : _verifyClearPenalty,
                        style: ElevatedButton.styleFrom(
                          backgroundColor: HunterTheme.crimson,
                          foregroundColor: Colors.white,
                          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                        ),
                        child: Text(
                          _clearingPenalty ? 'VERIFYING...' : 'VERIFY ESCAPE',
                          style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 11),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 12),
            ],

            // Hunter Progress HUD Card
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: [HunterTheme.surfaceLight, HunterTheme.surface],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: HunterTheme.cyan.withValues(alpha: 0.3)),
                boxShadow: [
                  BoxShadow(
                    color: HunterTheme.cyan.withValues(alpha: 0.08),
                    blurRadius: 16,
                    offset: const Offset(0, 4),
                  ),
                ],
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        'LV. ${user.level} ${(user.evolvedClass ?? user.hunterClass).toUpperCase()}',
                        style: TextStyle(
                          color: HunterTheme.cyanLight,
                          fontWeight: FontWeight.w900,
                          fontSize: 16,
                          letterSpacing: 1.2,
                        ),
                      ),
                      Text(
                        'STREAK: ${user.streak} DAYS 🔥',
                        style: TextStyle(
                          color: HunterTheme.gold,
                          fontWeight: FontWeight.bold,
                          fontSize: 13,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  ClipRRect(
                    borderRadius: BorderRadius.circular(8),
                    child: LinearProgressIndicator(
                      value: user.xpProgress,
                      backgroundColor: HunterTheme.abyss,
                      valueColor: AlwaysStoppedAnimation<Color>(HunterTheme.cyan),
                      minHeight: 8,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        'XP: ${user.xpIntoLevel} / ${user.xpForNextLevel}',
                        style: TextStyle(color: HunterTheme.textMuted, fontSize: 12),
                      ),
                      Text(
                        'Quests Cleared: $completedCount/${quests.length}',
                        style: TextStyle(color: HunterTheme.textPrimary, fontSize: 12),
                      ),
                    ],
                  ),
                ],
              ),
            ).animate().fadeIn(duration: 400.ms).slideY(begin: 0.1, end: 0),

            const SizedBox(height: 12),

            // #10 Comeback Red Gate Active Rescue Banner
            if (user.comebackGate != null && user.comebackGate!['active'] == true)
              Container(
                margin: const EdgeInsets.only(bottom: 12),
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: HunterTheme.crimson.withValues(alpha: 0.14),
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(color: HunterTheme.crimson, width: 1.5),
                ),
                child: Row(
                  children: [
                    Icon(Icons.door_front_door_outlined,
                        color: HunterTheme.crimson, size: 22),
                    const SizedBox(width: 10),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'RED GATE: COMEBACK RESCUE ACTIVE',
                            style: TextStyle(
                              color: HunterTheme.crimson,
                              fontWeight: FontWeight.w900,
                              fontSize: 11,
                              letterSpacing: 1.1,
                            ),
                          ),
                          Text(
                            'Clear 10m Focus + 1 Set to restore ${(user.comebackGate!['restoredFromStreak'] ?? 1)}d streak.',
                            style: TextStyle(
                              color: HunterTheme.textPrimary,
                              fontSize: 11.5,
                            ),
                          ),
                        ],
                      ),
                    ),
                    ElevatedButton(
                      onPressed: () => ComebackGateSheet.show(context, user.comebackGate!),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: HunterTheme.crimson,
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                      ),
                      child: const Text(
                        'ENTER GATE',
                        style: TextStyle(fontWeight: FontWeight.w900, fontSize: 11),
                      ),
                    ),
                  ],
                ),
              ),

            // #1 Daily Quest Ultimatum + Midnight Countdown Timer
            Builder(
              builder: (context) {
                final ult = ref.watch(ultimatumProvider).valueOrNull;
                final items = ult?['items'] is List
                    ? (ult!['items'] as List)
                        .whereType<Map>()
                        .map((m) => Map<String, dynamic>.from(m))
                        .toList()
                    : const <Map<String, dynamic>>[];
                return DailyCountdownBanner(
                  inPenaltyZone: user.inPenaltyZone,
                  remainingQuests: remainingCount,
                  completedParts: (ult?['completedCount'] as num?)?.toInt() ?? 0,
                  totalParts: (ult?['totalCount'] as num?)?.toInt() ?? 4,
                  shieldAbsorbed: ult?['shieldAbsorbed'] == true,
                  alertSentToday: ult?['alertSentToday'] == true,
                  warningLine: ult?['warningLine']?.toString(),
                  items: items,
                  onUrgentAlertTriggered: SystemMechanicsActions.markUltimatumAlerted,
                );
              },
            ),

            const SizedBox(height: 10),

            // Goal & If-Then Implementation Intention Coach Card
            if ((user.currentGoal != null && user.currentGoal!.isNotEmpty) ||
                (user.lastIfThenPlan != null && user.lastIfThenPlan!.isNotEmpty))
              Container(
                margin: const EdgeInsets.only(bottom: 10),
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: HunterTheme.surface,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: HunterTheme.cyan.withValues(alpha: 0.35)),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    if (user.currentGoal != null && user.currentGoal!.isNotEmpty)
                      Text(
                        'GOAL: ${user.currentGoal}',
                        style: TextStyle(
                          color: HunterTheme.cyanLight,
                          fontWeight: FontWeight.w900,
                          fontSize: 11.5,
                        ),
                      ),
                    if (user.lastIfThenPlan != null &&
                        user.lastIfThenPlan!.isNotEmpty) ...[
                      const SizedBox(height: 4),
                      Text(
                        'Coach Rule: ${user.lastIfThenPlan}',
                        style: TextStyle(
                          color: HunterTheme.gold,
                          fontSize: 11.5,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ],
                  ],
                ),
              ),

            // RET-5: Compact Weekly Rival Division Pod Strip
            Builder(
              builder: (context) {
                final pod = ref.watch(divisionsProvider).pod;
                final label = pod != null
                    ? '${pod.divisionTier.toUpperCase()} POD #${pod.podNumber} • RANK #${pod.myRank}'
                    : '${user.divisionTier.toUpperCase()} RIVAL DIVISION';
                return InkWell(
                  onTap: () => Navigator.of(context).push(
                    MaterialPageRoute(builder: (_) => const RivalDivisionsScreen()),
                  ),
                  borderRadius: BorderRadius.circular(12),
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                    decoration: BoxDecoration(
                      color: HunterTheme.surface,
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(
                        color: HunterTheme.purple.withValues(alpha: 0.45),
                      ),
                    ),
                    child: Row(
                      children: [
                        Icon(Icons.leaderboard_rounded,
                            color: HunterTheme.cyanLight, size: 18),
                        const SizedBox(width: 10),
                        Expanded(
                          child: Text(
                            label,
                            overflow: TextOverflow.ellipsis,
                            style: TextStyle(
                              color: HunterTheme.textPrimary,
                              fontWeight: FontWeight.w900,
                              fontSize: 11.5,
                              letterSpacing: 1.0,
                            ),
                          ),
                        ),
                        Text(
                          '10-HUNTER POD >',
                          style: TextStyle(
                            color: HunterTheme.cyanLight,
                            fontWeight: FontWeight.bold,
                            fontSize: 10.5,
                          ),
                        ),
                      ],
                    ),
                  ),
                );
              },
            ),

            const SizedBox(height: 12),

            // #4 & #3 Multi-Day Weekly Boss Raid HP Bar + ARISE Extraction CTA
            Builder(
              builder: (context) {
                final activeWeek = ref.watch(roadmapProvider).roadmap?.activeWeek;
                if (activeWeek == null) return const SizedBox.shrink();
                return BossRaidCard(week: activeWeek, user: user);
              },
            ),

            // SR-1: Morning Anchor Quest Action / Status
            if (!anchorSetToday && quests.any((q) => !q.completed))
              Container(
                margin: const EdgeInsets.only(bottom: 12),
                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                decoration: BoxDecoration(
                  color: HunterTheme.gold.withValues(alpha: 0.08),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: HunterTheme.gold.withValues(alpha: 0.45)),
                ),
                child: Row(
                  children: [
                    Icon(Icons.anchor, color: HunterTheme.gold, size: 20),
                    const SizedBox(width: 10),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'MORNING ANCHOR UNSET',
                            style: TextStyle(
                              color: HunterTheme.gold,
                              fontWeight: FontWeight.w900,
                              fontSize: 11,
                              letterSpacing: 1.1,
                            ),
                          ),
                          Text(
                            'Lock 1 non-negotiable quest for today.',
                            style: TextStyle(color: HunterTheme.textMuted, fontSize: 11.5),
                          ),
                        ],
                      ),
                    ),
                    TextButton(
                      onPressed: () => _openAnchorPicker(quests),
                      child: Text(
                        'LOCK 1 QUEST',
                        style: TextStyle(
                          color: HunterTheme.gold,
                          fontWeight: FontWeight.w900,
                          fontSize: 11.5,
                        ),
                      ),
                    ),
                  ],
                ),
              ),

            // SL-7: Pending 48H Rank Promotion Trial Banner
            trialsAsync.maybeWhen(
              data: (trials) {
                final pending = trials.where((t) => !t.completed).toList();
                if (pending.isEmpty) return const SizedBox.shrink();
                final t = pending.first;
                return Container(
                  margin: const EdgeInsets.only(bottom: 12),
                  padding: const EdgeInsets.all(14),
                  decoration: BoxDecoration(
                    color: HunterTheme.gold.withValues(alpha: 0.12),
                    borderRadius: BorderRadius.circular(14),
                    border: Border.all(color: HunterTheme.gold),
                  ),
                  child: Row(
                    children: [
                      Icon(Icons.workspace_premium_rounded,
                          color: HunterTheme.gold, size: 22),
                      const SizedBox(width: 10),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              '48H RANK PROMOTION TRIAL: TIER ${t.tier}',
                              style: TextStyle(
                                color: HunterTheme.gold,
                                fontWeight: FontWeight.w900,
                                fontSize: 11.5,
                                letterSpacing: 1.1,
                              ),
                            ),
                            Text(
                              t.quest?.title ??
                                  'Clear your Tier ${t.tier} Examination Quest below to ascend.',
                              style: TextStyle(
                                  color: HunterTheme.textPrimary, fontSize: 12),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                );
              },
              orElse: () => const SizedBox.shrink(),
            ),

            // SR-2: Surprise Blue / Red Gate Relic Chest Card
            if (user.activeGateEvent != null && !user.activeGateEvent!.claimed)
              Builder(
                builder: (context) {
                  final gate = user.activeGateEvent!;
                  final gateColor =
                      gate.isRedGate ? HunterTheme.crimson : HunterTheme.cyan;
                  return Container(
                    margin: const EdgeInsets.only(bottom: 12),
                    padding: const EdgeInsets.all(14),
                    decoration: BoxDecoration(
                      color: gateColor.withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(14),
                      border: Border.all(color: gateColor.withValues(alpha: 0.6)),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Expanded(
                              child: Text(
                                gate.title,
                                style: TextStyle(
                                  color: gateColor,
                                  fontWeight: FontWeight.w900,
                                  fontSize: 12,
                                  letterSpacing: 1.1,
                                ),
                              ),
                            ),
                            Text(
                              '+${gate.rewardCoins} COINS',
                              style: TextStyle(
                                color: HunterTheme.gold,
                                fontWeight: FontWeight.w900,
                                fontSize: 11,
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 4),
                        Text(
                          gate.description,
                          style: TextStyle(color: HunterTheme.textMuted, fontSize: 12),
                        ),
                        const SizedBox(height: 10),
                        Row(
                          children: [
                            Expanded(
                              child: ClipRRect(
                                borderRadius: BorderRadius.circular(6),
                                child: LinearProgressIndicator(
                                  value: gate.progress,
                                  backgroundColor: HunterTheme.abyss,
                                  valueColor: AlwaysStoppedAnimation<Color>(gateColor),
                                  minHeight: 7,
                                ),
                              ),
                            ),
                            const SizedBox(width: 10),
                            Text(
                              '${gate.currentValue}/${gate.targetValue}',
                              style: TextStyle(
                                color: HunterTheme.textPrimary,
                                fontWeight: FontWeight.bold,
                                fontSize: 11.5,
                              ),
                            ),
                          ],
                        ),
                        if (gate.isReadyToClaim) ...[
                          const SizedBox(height: 10),
                          SizedBox(
                            width: double.infinity,
                            child: ElevatedButton.icon(
                              onPressed: _claimingGate ? null : _claimSurpriseGate,
                              icon: const Icon(Icons.inventory_2_rounded, size: 16),
                              label: Text(
                                _claimingGate ? 'OPENING CHEST...' : 'OPEN RELIC CHEST',
                                style: const TextStyle(
                                    fontWeight: FontWeight.w900, letterSpacing: 1.1),
                              ),
                              style: ElevatedButton.styleFrom(
                                backgroundColor: HunterTheme.gold,
                                foregroundColor: Colors.black,
                              ),
                            ),
                          ),
                        ],
                      ],
                    ),
                  );
                },
              ),

            // SR-7: Bio-Fatigue Super-Compensation Recovery Alert
            fatigueAsync.maybeWhen(
              data: (fatigue) {
                if (!fatigue.recoveryRecommended) return const SizedBox.shrink();
                return Container(
                  margin: const EdgeInsets.only(bottom: 12),
                  padding: const EdgeInsets.all(14),
                  decoration: BoxDecoration(
                    color: HunterTheme.purple.withValues(alpha: 0.12),
                    borderRadius: BorderRadius.circular(14),
                    border: Border.all(color: HunterTheme.purple),
                  ),
                  child: Row(
                    children: [
                      Icon(Icons.spa_rounded, color: HunterTheme.purple),
                      const SizedBox(width: 10),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'HIGH BIO-FATIGUE DETECTED (${fatigue.fatigueScore}%)',
                              style: TextStyle(
                                color: HunterTheme.purple,
                                fontWeight: FontWeight.w900,
                                fontSize: 11.5,
                              ),
                            ),
                            Text(
                              'Trigger Super-Compensation deload to spawn recovery XP.',
                              style: TextStyle(color: HunterTheme.textMuted, fontSize: 11),
                            ),
                          ],
                        ),
                      ),
                      TextButton(
                        onPressed: () async {
                          await SystemMechanicsActions.activateSuperCompensation(ref);
                          await ref.read(questsProvider.notifier).loadQuests();
                        },
                        child: Text(
                          'DELOAD',
                          style: TextStyle(
                            color: HunterTheme.purple,
                            fontWeight: FontWeight.w900,
                          ),
                        ),
                      ),
                    ],
                  ),
                );
              },
              orElse: () => SizedBox.shrink(),
            ),

            // Quest Category Filters
            SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              child: Row(
                children: [
                  _buildFilterChip('ALL'),
                  _buildFilterChip('DAILY'),
                  _buildFilterChip('WEEKLY'),
                  _buildFilterChip('BOSS'),
                  if (user.inPenaltyZone || quests.any((q) => q.isPenalty))
                    _buildFilterChip('PENALTY'),
                  _buildFilterChip('INTELLECT'),
                ],
              ),
            ),

            SizedBox(height: 16),

            // Quest Cards List
            if (filteredQuests.isEmpty)
              Padding(
                padding: EdgeInsets.symmetric(vertical: 40),
                child: Center(
                  child: Column(
                    children: [
                      Icon(Icons.check_circle_outline, color: HunterTheme.cyan, size: 48),
                      SizedBox(height: 12),
                      Text(
                        'ALL SECTOR QUESTS CLEARED',
                        style: TextStyle(
                          color: HunterTheme.cyanLight,
                          fontWeight: FontWeight.bold,
                          letterSpacing: 1.5,
                        ),
                      ),
                      SizedBox(height: 4),
                      Text(
                        'Rest and recover, Hunter. New missions await at 00:00.',
                        style: TextStyle(color: HunterTheme.textMuted, fontSize: 12),
                      ),
                    ],
                  ),
                ),
              )
            else
              ...filteredQuests.map((quest) {
                final isAnchor =
                    user.anchorDate == _todayIso && user.anchorQuestId == quest.id;
                final isCritical = quest.category == 'boss' || quest.isPenalty;
                return Card(
                  margin: const EdgeInsets.only(bottom: 12),
                  color: quest.completed
                      ? HunterTheme.surface.withValues(alpha: 0.5)
                      : HunterTheme.surface,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(14),
                    side: BorderSide(
                      color: quest.completed
                          ? HunterTheme.emerald.withValues(alpha: 0.4)
                          : (isAnchor
                              ? HunterTheme.gold.withValues(alpha: 0.7)
                              : (isCritical
                                  ? HunterTheme.crimson.withValues(alpha: 0.65)
                                  : HunterTheme.cyan.withValues(alpha: 0.2))),
                      width: isAnchor || quest.isPenalty ? 1.6 : 1.2,
                    ),
                  ),
                  child: InkWell(
                    onTap: quest.isCompleting ? null : () => _toggleQuest(quest.id),
                    borderRadius: BorderRadius.circular(14),
                    child: Padding(
                      padding: const EdgeInsets.all(14),
                      child: Row(
                        children: [
                          Container(
                            width: 28,
                            height: 28,
                            decoration: BoxDecoration(
                              shape: BoxShape.circle,
                              color: quest.completed
                                  ? HunterTheme.emerald
                                  : Colors.transparent,
                              border: Border.all(
                                color: quest.completed
                                    ? HunterTheme.emerald
                                    : (quest.isPenalty
                                        ? HunterTheme.crimson
                                        : HunterTheme.cyan),
                                width: 2,
                              ),
                            ),
                            child: quest.isCompleting
                                ? const Center(
                                    child: SizedBox(
                                      width: 14,
                                      height: 14,
                                      child: CircularProgressIndicator(
                                          strokeWidth: 2, color: Colors.black),
                                    ),
                                  )
                                : (quest.completed
                                    ? const Icon(Icons.check, size: 18, color: Colors.black)
                                    : null),
                          ),
                          const SizedBox(width: 14),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Wrap(
                                  crossAxisAlignment: WrapCrossAlignment.center,
                                  spacing: 8,
                                  runSpacing: 4,
                                  children: [
                                    Container(
                                      padding: const EdgeInsets.symmetric(
                                          horizontal: 6, vertical: 2),
                                      decoration: BoxDecoration(
                                        color: isCritical
                                            ? HunterTheme.crimson.withValues(alpha: 0.2)
                                            : HunterTheme.cyan.withValues(alpha: 0.2),
                                        borderRadius: BorderRadius.circular(4),
                                      ),
                                      child: Text(
                                        quest.isPenalty
                                            ? '[PENALTY SURVIVAL]'
                                            : '[RANK ${quest.difficulty}]',
                                        style: TextStyle(
                                          color: isCritical
                                              ? HunterTheme.crimson
                                              : HunterTheme.cyanLight,
                                          fontWeight: FontWeight.w900,
                                          fontSize: 10,
                                        ),
                                      ),
                                    ),
                                    if (isAnchor)
                                      Container(
                                        padding: const EdgeInsets.symmetric(
                                            horizontal: 6, vertical: 2),
                                        decoration: BoxDecoration(
                                          color: HunterTheme.gold.withValues(alpha: 0.18),
                                          borderRadius: BorderRadius.circular(4),
                                        ),
                                        child: Text(
                                          'ANCHOR',
                                          style: TextStyle(
                                            color: HunterTheme.gold,
                                            fontWeight: FontWeight.w900,
                                            fontSize: 9.5,
                                          ),
                                        ),
                                      ),
                                    Text(
                                      '+${quest.xp} XP • ${quest.attribute}',
                                      style: TextStyle(
                                        color: HunterTheme.gold,
                                        fontSize: 11,
                                        fontWeight: FontWeight.w600,
                                      ),
                                    ),
                                  ],
                                ),
                                const SizedBox(height: 4),
                                Text(
                                  quest.title,
                                  style: TextStyle(
                                    color: quest.completed
                                        ? HunterTheme.textMuted
                                        : HunterTheme.textPrimary,
                                    fontWeight: FontWeight.bold,
                                    fontSize: 15,
                                    decoration: quest.completed
                                        ? TextDecoration.lineThrough
                                        : TextDecoration.none,
                                  ),
                                ),
                                const SizedBox(height: 2),
                                Text(
                                  quest.description,
                                  style: TextStyle(
                                    color: HunterTheme.textMuted,
                                    fontSize: 12,
                                  ),
                                ),
                                if (!quest.completed) ...[
                                  const SizedBox(height: 8),
                                  Wrap(
                                    spacing: 8,
                                    runSpacing: 6,
                                    children: [
                                      if (quest.isFocusVerified || quest.isWorkoutVerified)
                                        ActionChip(
                                          avatar: Icon(
                                            quest.isFocusVerified
                                                ? Icons.timer_rounded
                                                : Icons.fitness_center_rounded,
                                            size: 14,
                                            color: Colors.black,
                                          ),
                                          label: Text(
                                            quest.isFocusVerified
                                                ? 'START ${quest.targetMinutes ?? 25}M FOCUS'
                                                : 'LOG WORKOUT TO COMPLETE',
                                            style: const TextStyle(
                                              color: Colors.black,
                                              fontWeight: FontWeight.w900,
                                              fontSize: 10.5,
                                            ),
                                          ),
                                          backgroundColor: quest.isFocusVerified
                                              ? HunterTheme.cyan
                                              : HunterTheme.emerald,
                                          onPressed: () {
                                            if (quest.isFocusVerified) {
                                              Navigator.of(context).push(
                                                MaterialPageRoute(
                                                  builder: (_) => FocusScreen(
                                                    initialQuestId: quest.id,
                                                    initialTask: quest.title,
                                                    initialDurationMinutes:
                                                        quest.targetMinutes ?? 25,
                                                    initialRoadmapTaskId:
                                                        quest.roadmapTaskId,
                                                  ),
                                                ),
                                              );
                                            } else {
                                              Navigator.of(context).push(
                                                MaterialPageRoute(
                                                  builder: (_) => const WorkoutScreen(),
                                                ),
                                              );
                                            }
                                          },
                                        ),
                                      if (!quest.isWorkoutVerified)
                                        ActionChip(
                                          avatar: Icon(
                                            Icons.bolt_rounded,
                                            size: 14,
                                            color: HunterTheme.gold,
                                          ),
                                          label: Text(
                                            'STUCK? 5M STEP',
                                            style: TextStyle(
                                              color: HunterTheme.gold,
                                              fontWeight: FontWeight.w900,
                                              fontSize: 10.5,
                                            ),
                                          ),
                                          backgroundColor: HunterTheme.surface,
                                          side: BorderSide(
                                            color: HunterTheme.gold.withValues(alpha: 0.5),
                                          ),
                                          onPressed: () => _showUnstickDialog(quest),
                                        ),
                                    ],
                                  ),
                                ],
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                );
              }),
          ],
        ),
      ),
    );
  }

  Future<void> _showUnstickDialog(QuestModel quest) async {
    String? starterAction = quest.content?.trim().isNotEmpty == true ? quest.content : null;
    String encouragement = 'Momentum beats perfection. 5 honest minutes breaks procrastination.';
    bool loading = starterAction == null;

    await showDialog<void>(
      context: context,
      builder: (dialogCtx) => StatefulBuilder(
        builder: (ctx, setDialogState) {
          if (loading) {
            loading = false;
            ref.read(questsProvider.notifier).unstickQuest(quest.id).then((res) {
              if (!ctx.mounted) return;
              setDialogState(() {
                starterAction = res?['starterAction']?.toString() ??
                    'Open what is needed for "${quest.title}" and work on the very first 5-minute action.';
                encouragement = res?['encouragement']?.toString() ?? encouragement;
              });
            });
          }

          return AlertDialog(
            backgroundColor: HunterTheme.surface,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(18),
              side: BorderSide(color: HunterTheme.gold.withValues(alpha: 0.5)),
            ),
            title: Row(
              children: [
                Icon(Icons.bolt_rounded, color: HunterTheme.gold),
                SizedBox(width: 8),
                Expanded(
                  child: Text(
                    '5-MINUTE MICRO-START',
                    style: TextStyle(
                      color: HunterTheme.gold,
                      fontWeight: FontWeight.w900,
                      fontSize: 14,
                      letterSpacing: 1.1,
                    ),
                  ),
                ),
              ],
            ),
            content: starterAction == null
                ? SizedBox(
                    height: 76,
                    child: Center(
                      child: CircularProgressIndicator(color: HunterTheme.gold),
                    ),
                  )
                : Column(
                    mainAxisSize: MainAxisSize.min,
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        starterAction!,
                        style: TextStyle(
                          color: HunterTheme.textPrimary,
                          fontSize: 14,
                          fontWeight: FontWeight.w600,
                          height: 1.4,
                        ),
                      ),
                      const SizedBox(height: 10),
                      Text(
                        encouragement,
                        style: TextStyle(
                          color: HunterTheme.textMuted,
                          fontSize: 12,
                          height: 1.35,
                        ),
                      ),
                    ],
                  ),
            actions: [
              TextButton(
                onPressed: () => Navigator.of(dialogCtx).pop(),
                child: Text('CLOSE', style: TextStyle(color: HunterTheme.textMuted)),
              ),
              if (starterAction != null)
                ElevatedButton.icon(
                  onPressed: () {
                    final taskText = starterAction!;
                    Navigator.of(dialogCtx).pop();
                    Navigator.of(context).push(
                      MaterialPageRoute(
                        builder: (_) => FocusScreen(
                          initialQuestId: quest.id,
                          initialTask: taskText,
                          initialDurationMinutes: 5,
                          initialRoadmapTaskId: quest.roadmapTaskId,
                        ),
                      ),
                    );
                  },
                  icon: const Icon(Icons.play_arrow_rounded, size: 18),
                  label: const Text(
                    'LAUNCH 5M SPRINT',
                    style: TextStyle(fontWeight: FontWeight.w900),
                  ),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: HunterTheme.cyan,
                    foregroundColor: Colors.black,
                  ),
                ),
            ],
          );
        },
      ),
    );
  }

  Widget _buildFilterChip(String label) {
    final isSelected = _selectedFilter == label;
    return Padding(
      padding: const EdgeInsets.only(right: 8),
      child: ChoiceChip(
        label: Text(label),
        selected: isSelected,
        onSelected: (_) {
          HapticFeedback.selectionClick();
          setState(() => _selectedFilter = label);
        },
        backgroundColor: HunterTheme.surface,
        selectedColor: HunterTheme.cyan,
        labelStyle: TextStyle(
          color: isSelected ? Colors.black : HunterTheme.textPrimary,
          fontWeight: FontWeight.bold,
          fontSize: 12,
        ),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(10),
          side: BorderSide(
            color: isSelected
                ? HunterTheme.cyan
                : HunterTheme.cyan.withValues(alpha: 0.2),
          ),
        ),
      ),
    );
  }
}
