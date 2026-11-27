import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/api/api_client.dart';
import '../../core/api/api_endpoints.dart';
import '../../core/api/api_error.dart';
import '../../core/providers/auth_provider.dart';
import '../../core/providers/quests_provider.dart';
import '../../core/providers/system_mechanics_provider.dart';
import '../../core/theme/hunter_theme.dart';
import '../../core/widgets/system_window_dialog.dart';
import '../../models/user_model.dart';
import '../settings/settings_screen.dart';
import '../shadows/shadow_army_screen.dart';
import 'hunter_license_card.dart';
import 'reawakening_exam_sheet.dart';
import 'stat_radar_painter.dart';
import 'weekly_recap_sheet.dart';

class StatsScreen extends ConsumerStatefulWidget {
  final UserModel user;
  const StatsScreen({super.key, required this.user});

  @override
  ConsumerState<StatsScreen> createState() => _StatsScreenState();
}

class _StatsScreenState extends ConsumerState<StatsScreen>
    with SingleTickerProviderStateMixin {
  late AnimationController _animController;
  bool _showGhostBaseline = true;
  final Map<String, int> _pendingAllocations = {};
  bool _allocating = false;
  bool _evolving = false;

  @override
  void initState() {
    super.initState();
    _animController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1200),
    )..forward();
  }

  @override
  void dispose() {
    _animController.dispose();
    super.dispose();
  }

  int get _totalStagedPoints =>
      _pendingAllocations.values.fold<int>(0, (sum, v) => sum + v);

  void _adjustStaged(String key, int delta, int currentVal, int maxAvailable) {
    final existing = _pendingAllocations[key] ?? 0;
    final nextVal = existing + delta;
    if (nextVal < 0) return;
    if (delta > 0 && (_totalStagedPoints >= maxAvailable || currentVal + nextVal > 100)) {
      return;
    }
    HapticFeedback.selectionClick();
    setState(() {
      if (nextVal == 0) {
        _pendingAllocations.remove(key);
      } else {
        _pendingAllocations[key] = nextVal;
      }
    });
  }

  Future<void> _commitAllocations() async {
    if (_totalStagedPoints <= 0) return;
    setState(() => _allocating = true);
    try {
      await SystemMechanicsActions.allocateStats(ref, Map.from(_pendingAllocations));
      HapticFeedback.heavyImpact();
      if (!mounted) return;
      setState(() => _pendingAllocations.clear());
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          backgroundColor: HunterTheme.surfaceLight,
          content: Text(
            'Ability Points permanently imprinted onto Hunter Matrix.',
            style: TextStyle(color: HunterTheme.cyanLight, fontWeight: FontWeight.bold),
          ),
        ),
      );
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          backgroundColor: HunterTheme.crimson,
          content: Text(extractApiError(e, 'Stat allocation failed')),
        ),
      );
    } finally {
      if (mounted) setState(() => _allocating = false);
    }
  }

  Future<void> _triggerEvolution(String mode) async {
    if (mode == 'prestige') {
      final confirm = await showDialog<bool>(
        context: context,
        builder: (ctx) => AlertDialog(
          backgroundColor: HunterTheme.surface,
          title: Text(
            'ASCEND TO SHADOW MONARCH?',
            style: TextStyle(color: HunterTheme.gold, fontWeight: FontWeight.w900),
          ),
          content: Text(
            'Monarch Prestige resets your Level to 1 while permanently branding ★ Prestige Rank and granting +500 Coins and +10 Ability Points.',
            style: TextStyle(color: HunterTheme.textMuted),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(ctx).pop(false),
              child: const Text('CANCEL'),
            ),
            ElevatedButton(
              onPressed: () => Navigator.of(ctx).pop(true),
              style: ElevatedButton.styleFrom(backgroundColor: HunterTheme.gold, foregroundColor: Colors.black),
              child: const Text('ASCEND', style: TextStyle(fontWeight: FontWeight.bold)),
            ),
          ],
        ),
      );
      if (confirm != true) return;
    }

    setState(() => _evolving = true);
    try {
      final res = await SystemMechanicsActions.evolveClass(ref, mode: mode);
      if (!mounted) return;
      final newTitle = res['evolvedClass']?.toString() ?? 'Shadow Ascendant';
      await SystemWindowDialog.show(
        context,
        headerTag: 'CLASS AWAKENING',
        title: newTitle.toUpperCase(),
        body: mode == 'prestige'
            ? 'Sovereign Rebirth completed. +500 Gold Coins and +10 Ability Points granted.'
            : 'Job Change examination cleared! Your permanent class specialization has awakened.',
        tone: mode == 'prestige' ? SystemWindowTone.gold : SystemWindowTone.purple,
        icon: Icons.auto_awesome,
      );
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          backgroundColor: HunterTheme.crimson,
          content: Text(extractApiError(e, 'Class evolution locked')),
        ),
      );
    } finally {
      if (mounted) setState(() => _evolving = false);
    }
  }

  Future<void> _exportDossier(UserModel user) async {
    final dossier = '''
=== ASCENSION PROTOCOL: OPERATIVE DOSSIER ===
Operative: ${user.name}
Class: ${(user.evolvedClass ?? user.hunterClass).toUpperCase()}
Level: ${user.level} (Tier ${user.tier})
Active Streak: ${user.streak} Days
Mana Shields: ${user.streakShields}

--- 7 CORE ATTRIBUTES ---
Strength:     ${user.strength}/100
Agility:      ${user.agility}/100
Endurance:    ${user.stamina}/100
Vitality:     ${user.vitality}/100
Intelligence: ${user.intelligence}/100
Willpower:    ${user.willpower}/100
Charisma:     ${user.charisma}/100
=============================================
''';

    await Clipboard.setData(ClipboardData(text: dossier));
    HapticFeedback.selectionClick();

    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          backgroundColor: HunterTheme.surfaceLight,
          content: Text(
            'Operative Attribute Dossier copied to clipboard.',
            style: TextStyle(color: HunterTheme.cyanLight, fontWeight: FontWeight.bold),
          ),
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final user = ref.watch(authProvider).value ?? widget.user;
    final trialsAsync = ref.watch(rankTrialsProvider);

    final statsConfig = [
      ('strength', 'Strength (STR)', user.strength, HunterTheme.crimson),
      ('agility', 'Agility (AGI)', user.agility, HunterTheme.cyan),
      ('stamina', 'Stamina (STA)', user.stamina, HunterTheme.emerald),
      ('vitality', 'Vitality (VIT)', user.vitality, HunterTheme.gold),
      ('intelligence', 'Intelligence (INT)', user.intelligence, HunterTheme.purple),
      ('willpower', 'Willpower (WIL)', user.willpower, Colors.amber),
      ('charisma', 'Charisma (CHA)', user.charisma, Colors.pinkAccent),
    ];

    return Scaffold(
      backgroundColor: HunterTheme.abyss,
      appBar: AppBar(
        backgroundColor: HunterTheme.abyss,
        elevation: 0,
        title: Text(
          'HUNTER ATTRIBUTES',
          overflow: TextOverflow.ellipsis,
          style: Theme.of(context).textTheme.titleLarge?.copyWith(
                letterSpacing: 1.5,
                fontSize: 17,
                fontWeight: FontWeight.w800,
              ),
        ),
        actions: [
          IconButton(
            icon: Icon(Icons.settings_outlined, color: HunterTheme.cyanLight),
            tooltip: 'Settings & Security',
            onPressed: () {
              Navigator.of(context).push(
                MaterialPageRoute(builder: (_) => const SettingsScreen()),
              );
            },
          ),
          IconButton(
            icon: Icon(Icons.share_outlined, color: HunterTheme.cyanLight),
            tooltip: 'Share Dossier',
            onPressed: () => _exportDossier(user),
          ),
        ],
      ),
      body: ListView(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        children: [
          // SL-7 / RET-2: Official Hunter License Card with PNG Share
          HunterLicenseCard(user: user),
          const SizedBox(height: 16),

          // SL-7: Pending 48H Rank Promotion Exam Banner
          trialsAsync.maybeWhen(
            data: (trials) {
              final pending = trials.where((t) => !t.completed).toList();
              if (pending.isEmpty) return const SizedBox.shrink();
              final t = pending.first;
              return Container(
                margin: const EdgeInsets.only(bottom: 16),
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: HunterTheme.gold.withValues(alpha: 0.12),
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(color: HunterTheme.gold),
                ),
                child: Row(
                  children: [
                    Icon(Icons.workspace_premium, color: HunterTheme.gold),
                    const SizedBox(width: 10),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'PENDING RANK EXAM: ${t.tier}-RANK',
                            style: TextStyle(
                              color: HunterTheme.gold,
                              fontWeight: FontWeight.w900,
                              fontSize: 12,
                            ),
                          ),
                          Text(
                            t.quest?.title ??
                                'Clear the Tier ${t.tier} Exam Quest on the Quests tab to promote.',
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

          // #7 Proctored Reawakening Rank Test CTA (when below S-Rank)
          if (user.tier != 'S')
            Container(
              margin: const EdgeInsets.only(bottom: 16),
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: HunterTheme.cyan.withValues(alpha: 0.08),
                borderRadius: BorderRadius.circular(14),
                border: Border.all(color: HunterTheme.cyan.withValues(alpha: 0.5)),
              ),
              child: Row(
                children: [
                  Icon(Icons.scanner_rounded, color: HunterTheme.cyanLight),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'REAWAKENING RANK TEST (${user.tier}-RANK)',
                          style: TextStyle(
                            color: HunterTheme.cyanLight,
                            fontWeight: FontWeight.w900,
                            fontSize: 12,
                          ),
                        ),
                        Text(
                          user.reawakeningState?['status'] == 'in_progress'
                              ? '24h Exam active — submit pushups, 25m Sprint & Deliverable.'
                              : 'Proctored test day (14d pass / 7d fail cooldown).',
                          style: TextStyle(color: HunterTheme.textMuted, fontSize: 11.5),
                        ),
                      ],
                    ),
                  ),
                  ElevatedButton(
                    onPressed: () => ReawakeningExamSheet.show(context),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: HunterTheme.cyan,
                      foregroundColor: Colors.black,
                    ),
                    child: const Text('TEST', style: TextStyle(fontWeight: FontWeight.w900)),
                  ),
                ],
              ),
            ),

          // #5 Lv.15+ Job Change Questline + Lv.50 Sovereign Monarch Prestige
          if ((user.level >= 15 && user.evolvedClass == null) ||
              user.level >= 50 ||
              user.tier == 'S')
            Builder(
              builder: (context) {
                final jc = user.jobChangeState;
                final jcStatus = jc?['status']?.toString() ?? 'available';
                final steps = jc?['steps'] is List
                    ? (jc!['steps'] as List)
                        .whereType<Map>()
                        .map((m) => Map<String, dynamic>.from(m))
                        .toList()
                    : const <Map<String, dynamic>>[];
                final isPrestige = user.level >= 50 || user.tier == 'S';

                return Container(
                  margin: const EdgeInsets.only(bottom: 16),
                  padding: const EdgeInsets.all(14),
                  decoration: BoxDecoration(
                    color: HunterTheme.purple.withValues(alpha: 0.14),
                    borderRadius: BorderRadius.circular(14),
                    border: Border.all(color: HunterTheme.purple),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Icon(Icons.auto_awesome, color: HunterTheme.purple),
                          const SizedBox(width: 10),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  isPrestige
                                      ? 'MONARCH PRESTIGE READY'
                                      : jcStatus == 'active'
                                          ? 'JOB CHANGE TRIAL ACTIVE (7D WINDOW)'
                                          : 'LV.15+ JOB CHANGE AWAKENING',
                                  style: TextStyle(
                                    color: HunterTheme.purple,
                                    fontWeight: FontWeight.w900,
                                    fontSize: 12,
                                  ),
                                ),
                                Text(
                                  isPrestige
                                      ? 'Rebirth as Shadow Monarch (+500 Coins, +10 Points).'
                                      : jcStatus == 'active'
                                          ? 'Clear all 3 verified steps to evolve into Shadow Class.'
                                          : jcStatus == 'cooldown'
                                              ? '7-day retry cooldown active after expired trial.'
                                              : 'Unlock hidden 7-day NECROMANCER / SHADOW Trial (Lv.15 + Stat >= 35).',
                                  style: TextStyle(
                                      color: HunterTheme.textMuted, fontSize: 11.5),
                                ),
                              ],
                            ),
                          ),
                          ElevatedButton(
                            onPressed: _evolving || jcStatus == 'cooldown'
                                ? null
                                : () async {
                                    if (isPrestige) {
                                      await _triggerEvolution('prestige');
                                      return;
                                    }
                                    setState(() => _evolving = true);
                                    try {
                                      final dio = await ApiClient.getInstance();
                                      if (jcStatus == 'active') {
                                        final res = await dio.post(ApiEndpoints.jobChangeClaim);
                                        if (res.data is Map<String, dynamic> &&
                                            res.data['user'] is Map<String, dynamic>) {
                                          ref.read(authProvider.notifier).updateUser(
                                                UserModel.fromJson(
                                                    res.data['user'] as Map<String, dynamic>),
                                              );
                                        }
                                        if (!context.mounted) return;
                                        final evolved = res.data['evolvedClass']?.toString() ??
                                            'Shadow Awakened';
                                        await SystemWindowDialog.show(
                                          context,
                                          headerTag: 'JOB CHANGE COMPLETE',
                                          title: evolved.toUpperCase(),
                                          body:
                                              'Awakening trial conquered! +5 Ability Points & +150 Gold Coins unlocked.',
                                          tone: SystemWindowTone.purple,
                                          icon: Icons.auto_awesome,
                                          enableShare: true,
                                        );
                                      } else {
                                        final res = await dio.post(ApiEndpoints.jobChangeStart);
                                        if (res.data is Map<String, dynamic> &&
                                            res.data['user'] is Map<String, dynamic>) {
                                          ref.read(authProvider.notifier).updateUser(
                                                UserModel.fromJson(
                                                    res.data['user'] as Map<String, dynamic>),
                                              );
                                        }
                                      }
                                    } catch (e) {
                                      if (!context.mounted) return;
                                      ScaffoldMessenger.of(context).showSnackBar(
                                        SnackBar(
                                          backgroundColor: HunterTheme.crimson,
                                          content: Text(
                                            extractApiError(e, 'Job Change action unavailable'),
                                          ),
                                        ),
                                      );
                                    } finally {
                                      if (mounted) setState(() => _evolving = false);
                                    }
                                  },
                            style: ElevatedButton.styleFrom(
                              backgroundColor: HunterTheme.purple,
                              foregroundColor: Colors.white,
                            ),
                            child: Text(
                              _evolving
                                  ? '...'
                                  : isPrestige
                                      ? 'ASCEND'
                                      : jcStatus == 'active'
                                          ? 'CLAIM'
                                          : 'BEGIN TRIAL',
                            ),
                          ),
                        ],
                      ),
                      if (jcStatus == 'active' && steps.isNotEmpty) ...[
                        const SizedBox(height: 10),
                        ...steps.map((s) {
                          final cur = (s['current'] as num?)?.toInt() ?? 0;
                          final tgt = (s['target'] as num?)?.toInt() ?? 1;
                          final ok = cur >= tgt;
                          return Padding(
                            padding: const EdgeInsets.only(bottom: 4),
                            child: Text(
                              '${ok ? "✓" : "○"} ${s['label']} ($cur/$tgt)',
                              style: TextStyle(
                                color: ok ? HunterTheme.emeraldLight : HunterTheme.textPrimary,
                                fontSize: 11.5,
                              ),
                            ),
                          );
                        }),
                      ],
                    ],
                  ),
                );
              },
            ),

          // RET-2: Stat Balance Radar with 30-Day Baseline Ghost Toggle
          Container(
            padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 12),
            decoration: BoxDecoration(
              color: HunterTheme.surface,
              borderRadius: BorderRadius.circular(20),
              border: Border.all(color: HunterTheme.cyan.withValues(alpha: 0.3)),
            ),
            child: Column(
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Expanded(
                      child: Text(
                        'STAT BALANCE RADAR (7 STATS)',
                        style: TextStyle(
                          color: HunterTheme.cyanLight,
                          fontWeight: FontWeight.bold,
                          letterSpacing: 1.2,
                          fontSize: 12,
                        ),
                      ),
                    ),
                    if (user.baselineStats != null)
                      Row(
                        children: [
                          Text(
                            'GHOST',
                            style: TextStyle(
                              color: HunterTheme.textMuted,
                              fontSize: 10,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                          Switch(
                            value: _showGhostBaseline,
                            activeThumbColor: HunterTheme.cyan,
                            onChanged: (v) => setState(() => _showGhostBaseline = v),
                          ),
                        ],
                      ),
                  ],
                ),
                const SizedBox(height: 8),
                Center(
                  child: AnimatedBuilder(
                    animation: _animController,
                    builder: (context, _) {
                      return CustomPaint(
                        size: const Size(270, 250),
                        painter: StatRadarPainter(
                          user: user,
                          showGhostBaseline: _showGhostBaseline,
                          animationValue: CurvedAnimation(
                            parent: _animController,
                            curve: Curves.easeOutCubic,
                          ).value,
                        ),
                      );
                    },
                  ),
                ),
                const SizedBox(height: 10),
                Wrap(
                  alignment: WrapAlignment.center,
                  spacing: 6,
                  runSpacing: 4,
                  children: [
                    _buildLegendItem('STR', 'Strength'),
                    _buildLegendItem('AGI', 'Agility'),
                    _buildLegendItem('STA', 'Stamina'),
                    _buildLegendItem('VIT', 'Vitality'),
                    _buildLegendItem('INT', 'Intellect'),
                    _buildLegendItem('WIL', 'Willpower'),
                    _buildLegendItem('CHA', 'Charisma'),
                  ],
                ),
                if (user.baselineStats != null && _showGhostBaseline)
                  Padding(
                    padding: EdgeInsets.only(top: 8),
                    child: Text(
                      'Cyan: Live Matrix  •  Dashed Silver: Day-1 Ghost',
                      style: TextStyle(color: HunterTheme.textMuted, fontSize: 10.5),
                    ),
                  ),
              ],
            ),
          ).animate().fadeIn(duration: 500.ms),

          const SizedBox(height: 18),

          // Live Bottleneck Diagnosis Card (turns Radar into Prescription)
          ref.watch(bottleneckProvider).maybeWhen(
                data: (b) => Container(
                  margin: const EdgeInsets.only(bottom: 18),
                  padding: const EdgeInsets.all(14),
                  decoration: BoxDecoration(
                    color: HunterTheme.surface,
                    borderRadius: BorderRadius.circular(14),
                    border: Border.all(color: HunterTheme.crimson.withValues(alpha: 0.45)),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Icon(Icons.radar, color: HunterTheme.crimson, size: 18),
                          const SizedBox(width: 8),
                          Expanded(
                            child: Text(
                              'BOTTLENECK: ${(b['stat'] ?? 'FOCUS').toString().toUpperCase()} (${b['value'] ?? 10})',
                              style: TextStyle(
                                color: HunterTheme.crimson,
                                fontWeight: FontWeight.w900,
                                fontSize: 11.5,
                                letterSpacing: 1.1,
                              ),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 6),
                      Text(
                        b['reason']?.toString() ?? '',
                        style: TextStyle(color: HunterTheme.textMuted, fontSize: 12),
                      ),
                      const SizedBox(height: 10),
                      SizedBox(
                        width: double.infinity,
                        child: OutlinedButton.icon(
                          onPressed: () async {
                            await SystemMechanicsActions.injectBottleneckFix(ref);
                            await ref.read(questsProvider.notifier).loadQuests();
                            if (!context.mounted) return;
                            ScaffoldMessenger.of(context).showSnackBar(
                              SnackBar(
                                backgroundColor: HunterTheme.surfaceLight,
                                content: Text(
                                  'Targeted Bottleneck Fix Quest added to today\'s Quests.',
                                  style: TextStyle(color: HunterTheme.cyanLight),
                                ),
                              ),
                            );
                          },
                          icon: Icon(Icons.add_task, size: 16, color: HunterTheme.cyanLight),
                          label: Text(
                            'INJECT FIX: ${(b['actionTitle'] ?? 'Fix').toString().toUpperCase()}',
                            style: TextStyle(
                              color: HunterTheme.cyanLight,
                              fontWeight: FontWeight.bold,
                              fontSize: 11,
                            ),
                          ),
                          style: OutlinedButton.styleFrom(
                            side: BorderSide(color: HunterTheme.cyan.withValues(alpha: 0.5)),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
                orElse: () => const SizedBox.shrink(),
              ),

          // SL-6: Spendable Ability Points Banner & Breakdown
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Expanded(
                child: Text(
                  'DETAILED ATTRIBUTE BREAKDOWN',
                  overflow: TextOverflow.ellipsis,
                  style: TextStyle(
                    color: HunterTheme.textMuted,
                    fontWeight: FontWeight.bold,
                    fontSize: 12,
                    letterSpacing: 1.2,
                  ),
                ),
              ),
              const SizedBox(width: 8),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: user.unspentStatPoints > 0
                      ? HunterTheme.gold.withValues(alpha: 0.18)
                      : HunterTheme.surface,
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(
                    color: user.unspentStatPoints > 0
                        ? HunterTheme.gold
                        : HunterTheme.textMuted.withValues(alpha: 0.3),
                  ),
                ),
                child: Text(
                  user.unspentStatPoints > 0
                      ? 'POINTS LEFT: ${user.unspentStatPoints - _totalStagedPoints}'
                      : '0 UNSPENT PTS',
                  style: TextStyle(
                    color: user.unspentStatPoints > 0
                        ? HunterTheme.gold
                        : HunterTheme.textMuted,
                    fontSize: 10.5,
                    fontWeight: FontWeight.w900,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 10),

          ...statsConfig.map(
            (cfg) => _buildStatRow(
              statKey: cfg.$1,
              label: cfg.$2,
              value: cfg.$3,
              color: cfg.$4,
              unspentPoints: user.unspentStatPoints,
            ),
          ),

          if (_totalStagedPoints > 0) ...[
            const SizedBox(height: 8),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton.icon(
                onPressed: _allocating ? null : _commitAllocations,
                icon: const Icon(Icons.bolt),
                label: Text(
                  _allocating
                      ? 'ALLOCATING...'
                      : 'CONFIRM +$_totalStagedPoints ABILITY POINTS',
                  style: const TextStyle(fontWeight: FontWeight.w900, letterSpacing: 1.1),
                ),
                style: ElevatedButton.styleFrom(
                  backgroundColor: HunterTheme.gold,
                  foregroundColor: Colors.black,
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                ),
              ),
            ),
          ],

          const SizedBox(height: 16),

          // SR-3 Shadow Extraction Army & SR-5 Weekly Recap Quick Navigation
          Row(
            children: [
              Expanded(
                child: _featureShortcutCard(
                  icon: Icons.shield_moon_rounded,
                  title: 'SHADOW ARMY',
                  subtitle: '${user.equippedShadows.length}/3 Active',
                  color: HunterTheme.purple,
                  onTap: () => Navigator.of(context).push(
                    MaterialPageRoute(builder: (_) => const ShadowArmyScreen()),
                  ),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: _featureShortcutCard(
                  icon: Icons.auto_graph_rounded,
                  title: 'WEEKLY DOSSIER',
                  subtitle: 'Evolution Recap',
                  color: HunterTheme.gold,
                  onTap: () => WeeklyRecapSheet.show(context),
                ),
              ),
            ],
          ),

          const SizedBox(height: 16),

          // Class & Recovery Card
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: HunterTheme.surface,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: HunterTheme.purple.withValues(alpha: 0.3)),
            ),
            child: Row(
              children: [
                Container(
                  width: 44,
                  height: 44,
                  decoration: BoxDecoration(
                    color: HunterTheme.purple.withValues(alpha: 0.2),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Icon(Icons.shield_outlined, color: HunterTheme.purple),
                ),
                const SizedBox(width: 14),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Mana Shield: ${user.streakShields} Available',
                        style: TextStyle(
                          color: HunterTheme.textPrimary,
                          fontWeight: FontWeight.bold,
                          fontSize: 14,
                        ),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        'Absorbs 1 missed daily quest without breaking your streak.',
                        style: TextStyle(color: HunterTheme.textMuted, fontSize: 11),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),

          SizedBox(
            width: double.infinity,
            height: 50,
            child: OutlinedButton.icon(
              onPressed: () => _exportDossier(user),
              icon: Icon(Icons.share, color: HunterTheme.cyan, size: 18),
              label: Text(
                'COPY TEXT ATTRIBUTE DOSSIER',
                style: TextStyle(
                  color: HunterTheme.cyanLight,
                  fontWeight: FontWeight.bold,
                  letterSpacing: 1,
                  fontSize: 12,
                ),
              ),
              style: OutlinedButton.styleFrom(
                side: BorderSide(color: HunterTheme.cyan),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              ),
            ),
          ),
          const SizedBox(height: 20),
        ],
      ),
    );
  }

  Widget _featureShortcutCard({
    required IconData icon,
    required String title,
    required String subtitle,
    required Color color,
    required VoidCallback onTap,
  }) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(14),
      child: Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: HunterTheme.surface,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: color.withValues(alpha: 0.45)),
        ),
        child: Row(
          children: [
            Icon(icon, color: color, size: 22),
            const SizedBox(width: 10),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: TextStyle(
                      color: color,
                      fontWeight: FontWeight.w900,
                      fontSize: 11,
                      letterSpacing: 0.9,
                    ),
                  ),
                  Text(
                    subtitle,
                    style: TextStyle(
                      color: HunterTheme.textMuted,
                      fontSize: 11,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildLegendItem(String tag, String label) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
      decoration: BoxDecoration(
        color: HunterTheme.surfaceLight,
        borderRadius: BorderRadius.circular(6),
      ),
      child: Text(
        tag,
        style: TextStyle(
          color: HunterTheme.cyanLight,
          fontSize: 10,
          fontWeight: FontWeight.bold,
        ),
      ),
    );
  }

  Widget _buildStatRow({
    required String statKey,
    required String label,
    required int value,
    required Color color,
    required int unspentPoints,
  }) {
    final staged = _pendingAllocations[statKey] ?? 0;
    final effective = value + staged;

    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(
                child: Text(
                  label,
                  style: TextStyle(
                    color: HunterTheme.textPrimary,
                    fontWeight: FontWeight.w600,
                    fontSize: 13,
                  ),
                ),
              ),
              if (unspentPoints > 0) ...[
                IconButton(
                  visualDensity: VisualDensity.compact,
                  padding: EdgeInsets.zero,
                  constraints: const BoxConstraints(minWidth: 28, minHeight: 28),
                  icon: Icon(Icons.remove_circle_outline,
                      size: 18, color: HunterTheme.textMuted),
                  onPressed: staged > 0
                      ? () => _adjustStaged(statKey, -1, value, unspentPoints)
                      : null,
                ),
                if (staged > 0)
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 4),
                    child: Text(
                      '+$staged',
                      style: TextStyle(
                        color: HunterTheme.gold,
                        fontWeight: FontWeight.w900,
                        fontSize: 12,
                      ),
                    ),
                  ),
                IconButton(
                  visualDensity: VisualDensity.compact,
                  padding: EdgeInsets.zero,
                  constraints: const BoxConstraints(minWidth: 28, minHeight: 28),
                  icon: Icon(Icons.add_circle_outline,
                      size: 18,
                      color: _totalStagedPoints < unspentPoints && effective < 100
                          ? HunterTheme.gold
                          : HunterTheme.textMuted),
                  onPressed: _totalStagedPoints < unspentPoints && effective < 100
                      ? () => _adjustStaged(statKey, 1, value, unspentPoints)
                      : null,
                ),
                const SizedBox(width: 6),
              ],
              Text(
                '$effective / 100',
                style: TextStyle(
                  color: staged > 0 ? HunterTheme.gold : color,
                  fontWeight: FontWeight.bold,
                  fontSize: 13,
                ),
              ),
            ],
          ),
          const SizedBox(height: 5),
          ClipRRect(
            borderRadius: BorderRadius.circular(6),
            child: LinearProgressIndicator(
              value: (effective / 100.0).clamp(0.0, 1.0),
              backgroundColor: HunterTheme.surface,
              valueColor: AlwaysStoppedAnimation<Color>(color),
              minHeight: 6,
            ),
          ),
        ],
      ),
    );
  }
}
