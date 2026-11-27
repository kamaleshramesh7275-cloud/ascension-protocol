import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import 'package:share_plus/share_plus.dart';
import '../../core/api/api_error.dart';
import '../../core/providers/accountability_provider.dart';
import '../../core/providers/auth_provider.dart';
import '../../core/theme/hunter_theme.dart';
import '../../core/widgets/system_window_dialog.dart';
import '../../models/accountability_models.dart';
import 'cartenon_dungeon_sheet.dart';

/// Feature #6 Accountability Arena (Weekly Contracts, SR-4 Buddy Covenant Duels,
/// Public Witness Wall, Hall of Ascension & Wall of Consequence).
class ContractsArenaScreen extends ConsumerStatefulWidget {
  const ContractsArenaScreen({super.key});

  @override
  ConsumerState<ContractsArenaScreen> createState() => _ContractsArenaScreenState();
}

class _ContractsArenaScreenState extends ConsumerState<ContractsArenaScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;

  // Weekly Contract inputs
  int _missionsTarget = 5;
  int _focusTarget = 300;
  final TextEditingController _antiCharityCtrl = TextEditingController();

  // Covenant inputs
  final TextEditingController _covObjectiveCtrl =
      TextEditingController(text: 'Zero Missed Quests');
  final TextEditingController _covCodeInputCtrl = TextEditingController();
  int _covDays = 7;
  int _covStake = 200;

  // Public oath input
  final TextEditingController _oathCtrl = TextEditingController();

  bool _busy = false;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 4, vsync: this);
  }

  @override
  void dispose() {
    _tabController.dispose();
    _antiCharityCtrl.dispose();
    _covObjectiveCtrl.dispose();
    _covCodeInputCtrl.dispose();
    _oathCtrl.dispose();
    super.dispose();
  }

  Future<void> _signContract(AccountabilityState aState) async {
    setState(() => _busy = true);
    try {
      final suggested = aState.suggestedContract ?? {};
      final today = DateTime.now();
      final nextWeek = today.add(const Duration(days: 6));
      await ref.read(accountabilityProvider.notifier).signWeeklyContract(
            weekStartDate: suggested['weekStartDate']?.toString() ??
                DateFormat('yyyy-MM-dd').format(today),
            weekEndDate: suggested['weekEndDate']?.toString() ??
                DateFormat('yyyy-MM-dd').format(nextWeek),
            targetMissionsCount: _missionsTarget,
            targetFocusMinutes: _focusTarget,
            stakeAmountCents: 0,
            antiCharityRecipient: _antiCharityCtrl.text.trim(),
          );
      HapticFeedback.heavyImpact();
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          backgroundColor: HunterTheme.surfaceLight,
          content: Text('Weekly Blood Contract bound by System.'),
        ),
      );
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          backgroundColor: HunterTheme.crimson,
          content: Text(extractApiError(e, 'Failed to establish contract')),
        ),
      );
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _evaluateContract() async {
    setState(() => _busy = true);
    try {
      final res =
          await ref.read(accountabilityProvider.notifier).evaluateWeeklyContract();
      if (!mounted) return;
      final passed = res['passed'] == true;
      await SystemWindowDialog.show(
        context,
        headerTag: 'PERFORMANCE COURT AUDIT',
        title: passed ? 'CONTRACT FULFILLED' : 'CONTRACT BREACHED',
        body: res['verdict']?.toString() ?? 'Audit finalized.',
        tone: passed ? SystemWindowTone.gold : SystemWindowTone.crimson,
        icon: passed ? Icons.gavel : Icons.warning_rounded,
      );
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          backgroundColor: HunterTheme.crimson,
          content: Text(extractApiError(e, 'Audit failed')),
        ),
      );
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _createCovenant() async {
    setState(() => _busy = true);
    try {
      final created = await ref.read(accountabilityProvider.notifier).createCovenant(
            termsDays: _covDays,
            stakeCoins: _covStake,
            protocolObjective: _covObjectiveCtrl.text.trim().isEmpty
                ? 'Daily Protocol Execution'
                : _covObjectiveCtrl.text.trim(),
          );
      ref.read(authProvider.notifier).checkSession();
      if (!mounted) return;
      if (created != null) {
        await SharePlus.instance.share(
          ShareParams(
            text:
                'Accept my $_covDays-Day Ascension Protocol Covenant (${created.covenantCode})! Stake: $_covStake Coins. Objective: ${created.protocolObjective}',
          ),
        );
      }
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          backgroundColor: HunterTheme.crimson,
          content: Text(extractApiError(e, 'Failed to issue covenant')),
        ),
      );
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _acceptCovenant() async {
    final code = _covCodeInputCtrl.text.trim().toUpperCase();
    if (code.isEmpty) return;
    setState(() => _busy = true);
    try {
      await ref.read(accountabilityProvider.notifier).acceptCovenant(code);
      ref.read(authProvider.notifier).checkSession();
      _covCodeInputCtrl.clear();
      if (!mounted) return;
      await SystemWindowDialog.show(
        context,
        headerTag: 'COVENANT AUTHORIZED',
        title: '1V1 CRUCIBLE ACTIVE',
        body: 'Stake matched for $code. Do not break streak before expiry.',
        tone: SystemWindowTone.gold,
        icon: Icons.handshake_rounded,
      );
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          backgroundColor: HunterTheme.crimson,
          content: Text(extractApiError(e, 'Unable to accept covenant')),
        ),
      );
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final aState = ref.watch(accountabilityProvider);

    return Scaffold(
      backgroundColor: HunterTheme.abyss,
      appBar: AppBar(
        backgroundColor: HunterTheme.abyss,
        elevation: 0,
        title: Text(
          'ACCOUNTABILITY ARENA',
          style: TextStyle(
            color: HunterTheme.textPrimary,
            fontWeight: FontWeight.w900,
            letterSpacing: 1.4,
            fontSize: 16,
          ),
        ),
        bottom: TabBar(
          controller: _tabController,
          isScrollable: true,
          indicatorColor: HunterTheme.gold,
          labelColor: HunterTheme.gold,
          unselectedLabelColor: HunterTheme.textMuted,
          labelStyle: const TextStyle(fontWeight: FontWeight.w900, fontSize: 11),
          tabs: const [
            Tab(text: 'CONTRACT'),
            Tab(text: '1V1 COVENANTS'),
            Tab(text: 'WITNESS WALL'),
            Tab(text: 'HALL & WALL'),
          ],
        ),
      ),
      body: TabBarView(
        controller: _tabController,
        children: [
          _buildWeeklyContractTab(aState),
          _buildCovenantsTab(aState),
          _buildWitnessWallTab(aState),
          _buildHallAndWallTab(aState),
        ],
      ),
    );
  }

  Widget _buildWeeklyContractTab(AccountabilityState aState) {
    final c = aState.activeContract;
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        Container(
          margin: const EdgeInsets.only(bottom: 14),
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            color: HunterTheme.crimson.withValues(alpha: 0.1),
            borderRadius: BorderRadius.circular(14),
            border: Border.all(color: HunterTheme.crimson.withValues(alpha: 0.55)),
          ),
          child: Row(
            children: [
              Icon(Icons.temple_hindu_rounded, color: HunterTheme.gold, size: 22),
              const SizedBox(width: 10),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'CARTENON DOUBLE DUNGEON (72H)',
                      style: TextStyle(
                        color: HunterTheme.gold,
                        fontWeight: FontWeight.w900,
                        fontSize: 11.5,
                        letterSpacing: 1.1,
                      ),
                    ),
                    Text(
                      'AI Commandments crafted from your real slip-ups. 1.4x-2.2x coin payout.',
                      style: TextStyle(color: HunterTheme.textMuted, fontSize: 11.5),
                    ),
                  ],
                ),
              ),
              ElevatedButton(
                onPressed: () => CartenonDungeonSheet.show(context),
                style: ElevatedButton.styleFrom(
                  backgroundColor: HunterTheme.gold,
                  foregroundColor: Colors.black,
                ),
                child: const Text('ENTER', style: TextStyle(fontWeight: FontWeight.w900, fontSize: 11.5)),
              ),
            ],
          ),
        ),
        if (c != null) ...[
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: HunterTheme.surface,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: HunterTheme.gold.withValues(alpha: 0.6)),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'ACTIVE WEEKLY CONTRACT (${c.status.toUpperCase()})',
                  style: TextStyle(
                    color: HunterTheme.gold,
                    fontWeight: FontWeight.w900,
                    fontSize: 12,
                    letterSpacing: 1.2,
                  ),
                ),
                const SizedBox(height: 6),
                Text(
                  '${c.weekStartDate} -> ${c.weekEndDate}',
                  style: TextStyle(color: HunterTheme.textMuted, fontSize: 12),
                ),
                const SizedBox(height: 12),
                Text(
                  'Missions Target: ${c.targetMissionsCount} quests (${(c.targetMissionsCount / 7).toStringAsFixed(1)}/day)',
                  style: TextStyle(
                      color: HunterTheme.textPrimary, fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 4),
                Text(
                  'Deep Work Target: ${c.targetFocusMinutes} mins (~${(c.targetFocusMinutes / 7).round()}m/day)',
                  style: TextStyle(
                      color: HunterTheme.textPrimary, fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 8),
                Container(
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    color: HunterTheme.abyss.withValues(alpha: 0.6),
                    borderRadius: BorderRadius.circular(10),
                    border: Border.all(color: HunterTheme.gold.withValues(alpha: 0.25)),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Reward: +150 Coins & +100 XP on fulfillment',
                        style: TextStyle(color: HunterTheme.emeraldLight, fontSize: 11.5, fontWeight: FontWeight.bold),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        'Breach Consequence: ${(c.antiCharityRecipient != null && c.antiCharityRecipient!.isNotEmpty) ? c.antiCharityRecipient : 'Recorded on Wall of Consequence'}',
                        style: TextStyle(color: HunterTheme.textMuted, fontSize: 11.5),
                      ),
                    ],
                  ),
                ),
                if (c.outcomeVerdict != null) ...[
                  const SizedBox(height: 8),
                  Text(
                    c.outcomeVerdict!,
                    style: TextStyle(color: HunterTheme.cyanLight, fontSize: 12),
                  ),
                ],
                const SizedBox(height: 14),
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton.icon(
                    onPressed: _busy ? null : _evaluateContract,
                    icon: const Icon(Icons.gavel),
                    label: const Text(
                      'SUMMON WEEKLY COURT AUDIT',
                      style: TextStyle(fontWeight: FontWeight.w900),
                    ),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: HunterTheme.gold,
                      foregroundColor: Colors.black,
                    ),
                  ),
                ),
              ],
            ),
          ),
        ] else ...[
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: HunterTheme.surface,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: HunterTheme.cyan.withValues(alpha: 0.35)),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'ESTABLISH WEEKLY COMMITMENT CONTRACT',
                  style: TextStyle(
                    color: HunterTheme.cyanLight,
                    fontWeight: FontWeight.w900,
                    fontSize: 12.5,
                  ),
                ),
                const SizedBox(height: 6),
                Text(
                  'Pick a realistic weekly target or customize your own:',
                  style: TextStyle(color: HunterTheme.textMuted, fontSize: 11.5),
                ),
                const SizedBox(height: 10),
                Wrap(
                  spacing: 6,
                  runSpacing: 6,
                  children: [
                    ActionChip(
                      backgroundColor: HunterTheme.surfaceLight,
                      label: Text('Deep Work (5q / 300m)', style: TextStyle(color: HunterTheme.cyanLight, fontSize: 11)),
                      onPressed: () => setState(() {
                        _missionsTarget = 5;
                        _focusTarget = 300;
                        if (_antiCharityCtrl.text.isEmpty) _antiCharityCtrl.text = 'No social media for 48h';
                      }),
                    ),
                    ActionChip(
                      backgroundColor: HunterTheme.surfaceLight,
                      label: Text('Exam / Crunch (10q / 600m)', style: TextStyle(color: HunterTheme.gold, fontSize: 11)),
                      onPressed: () => setState(() {
                        _missionsTarget = 10;
                        _focusTarget = 600;
                        if (_antiCharityCtrl.text.isEmpty) _antiCharityCtrl.text = 'Wake 1h earlier next day';
                      }),
                    ),
                    ActionChip(
                      backgroundColor: HunterTheme.surfaceLight,
                      label: Text('Consistency (7q / 210m)', style: TextStyle(color: HunterTheme.emeraldLight, fontSize: 11)),
                      onPressed: () => setState(() {
                        _missionsTarget = 7;
                        _focusTarget = 210;
                        if (_antiCharityCtrl.text.isEmpty) _antiCharityCtrl.text = '50 burpees penalty';
                      }),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                  decoration: BoxDecoration(
                    color: HunterTheme.abyss.withValues(alpha: 0.55),
                    borderRadius: BorderRadius.circular(10),
                    border: Border.all(color: HunterTheme.cyan.withValues(alpha: 0.25)),
                  ),
                  child: Text(
                    'Daily Pace: ~${(_focusTarget / 7).round()}m focus/day • ${(_missionsTarget / 7).toStringAsFixed(1)} quests/day',
                    style: TextStyle(color: HunterTheme.cyanLight, fontSize: 11.5, fontWeight: FontWeight.bold),
                  ),
                ),
                const SizedBox(height: 12),
                Text(
                  'Weekly Missions Target: $_missionsTarget',
                  style: TextStyle(color: HunterTheme.textPrimary, fontSize: 13),
                ),
                Slider(
                  min: 3,
                  max: 21,
                  divisions: 18,
                  activeColor: HunterTheme.cyan,
                  value: _missionsTarget.toDouble(),
                  onChanged: (v) => setState(() => _missionsTarget = v.round()),
                ),
                Text(
                  'Weekly Deep Work Target: $_focusTarget min',
                  style: TextStyle(color: HunterTheme.textPrimary, fontSize: 13),
                ),
                Slider(
                  min: 60,
                  max: 1200,
                  divisions: 19,
                  activeColor: HunterTheme.gold,
                  value: _focusTarget.toDouble(),
                  onChanged: (v) => setState(() => _focusTarget = v.round()),
                ),
                TextField(
                  controller: _antiCharityCtrl,
                  style: TextStyle(color: HunterTheme.textPrimary),
                  decoration: InputDecoration(
                    labelText: 'Real-World Consequence (If you miss)',
                    hintText: 'e.g. Donate ₹200, 50 burpees, no gaming 48h',
                    hintStyle: TextStyle(color: HunterTheme.textMuted, fontSize: 12),
                    labelStyle: TextStyle(color: HunterTheme.textMuted),
                  ),
                ),
                const SizedBox(height: 8),
                Wrap(
                  spacing: 6,
                  runSpacing: 6,
                  children: [
                    'No social media 48h',
                    '50 burpees penalty',
                    'Donate ₹200 to charity',
                    'Wake 1h earlier',
                  ].map((clause) => ActionChip(
                    backgroundColor: HunterTheme.abyss,
                    label: Text(clause, style: TextStyle(color: HunterTheme.textMuted, fontSize: 10.5)),
                    onPressed: () => setState(() => _antiCharityCtrl.text = clause),
                  )).toList(),
                ),
                const SizedBox(height: 16),
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    onPressed: _busy ? null : () => _signContract(aState),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: HunterTheme.cyan,
                      foregroundColor: Colors.black,
                      padding: const EdgeInsets.symmetric(vertical: 14),
                    ),
                    child: const Text(
                      'SIGN BLOOD CONTRACT',
                      style: TextStyle(fontWeight: FontWeight.w900, letterSpacing: 1.1),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ],
    );
  }

  Widget _buildCovenantsTab(AccountabilityState aState) {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        // Accept friend code card
        Container(
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            color: HunterTheme.surface,
            borderRadius: BorderRadius.circular(14),
            border: Border.all(color: HunterTheme.gold.withValues(alpha: 0.45)),
          ),
          child: Row(
            children: [
              Expanded(
                child: TextField(
                  controller: _covCodeInputCtrl,
                  style: TextStyle(color: HunterTheme.textPrimary),
                  decoration: InputDecoration(
                    hintText: 'Enter Code (e.g. COV-A1B2C3D4)',
                    hintStyle: TextStyle(color: HunterTheme.textMuted, fontSize: 12.5),
                    isDense: true,
                    border: InputBorder.none,
                  ),
                ),
              ),
              ElevatedButton(
                onPressed: _busy ? null : _acceptCovenant,
                style: ElevatedButton.styleFrom(
                  backgroundColor: HunterTheme.gold,
                  foregroundColor: Colors.black,
                ),
                child: const Text('ACCEPT DUEL',
                    style: TextStyle(fontWeight: FontWeight.w900, fontSize: 11.5)),
              ),
            ],
          ),
        ),
        const SizedBox(height: 14),

        // Create New Covenant Card
        Container(
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            color: HunterTheme.surface,
            borderRadius: BorderRadius.circular(14),
            border: Border.all(color: HunterTheme.cyan.withValues(alpha: 0.35)),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'ISSUE 1V1 BUDDY COVENANT',
                style: TextStyle(
                  color: HunterTheme.cyanLight,
                  fontWeight: FontWeight.w900,
                  fontSize: 12,
                ),
              ),
              const SizedBox(height: 8),
              Wrap(
                spacing: 6,
                runSpacing: 6,
                children: [
                  ('7-Day Gym Streak', 7),
                  ('14-Day Zero-Scroll Morning', 14),
                  ('7-Day 1h Deep Work Daily', 7),
                ].map((preset) => ActionChip(
                  backgroundColor: HunterTheme.surfaceLight,
                  label: Text(preset.$1, style: TextStyle(color: HunterTheme.cyanLight, fontSize: 10.5)),
                  onPressed: () => setState(() {
                    _covObjectiveCtrl.text = preset.$1;
                    _covDays = preset.$2;
                  }),
                )).toList(),
              ),
              const SizedBox(height: 8),
              TextField(
                controller: _covObjectiveCtrl,
                style: TextStyle(color: HunterTheme.textPrimary, fontSize: 13),
                decoration: InputDecoration(
                  labelText: 'Duel Objective',
                  labelStyle: TextStyle(color: HunterTheme.textMuted),
                ),
              ),
              const SizedBox(height: 8),
              Row(
                children: [
                  Expanded(
                    child: DropdownButtonFormField<int>(
                      initialValue: _covDays,
                      dropdownColor: HunterTheme.surface,
                      style: TextStyle(color: HunterTheme.textPrimary),
                      decoration: InputDecoration(
                        labelText: 'Duration',
                        labelStyle: TextStyle(color: HunterTheme.textMuted),
                      ),
                      items: const [
                        DropdownMenuItem(value: 7, child: Text('7 Days')),
                        DropdownMenuItem(value: 14, child: Text('14 Days')),
                        DropdownMenuItem(value: 30, child: Text('30 Days')),
                      ],
                      onChanged: (v) => setState(() => _covDays = v ?? 7),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: DropdownButtonFormField<int>(
                      initialValue: _covStake,
                      dropdownColor: HunterTheme.surface,
                      style: TextStyle(color: HunterTheme.textPrimary),
                      decoration: InputDecoration(
                        labelText: 'Coin Stake',
                        labelStyle: TextStyle(color: HunterTheme.textMuted),
                      ),
                      items: const [
                        DropdownMenuItem(value: 100, child: Text('100 Coins')),
                        DropdownMenuItem(value: 200, child: Text('200 Coins')),
                        DropdownMenuItem(value: 500, child: Text('500 Coins')),
                      ],
                      onChanged: (v) => setState(() => _covStake = v ?? 200),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton.icon(
                  onPressed: _busy ? null : _createCovenant,
                  icon: const Icon(Icons.share, size: 16),
                  label: const Text('FORGE & SHARE INVITE CODE',
                      style: TextStyle(fontWeight: FontWeight.w900)),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: HunterTheme.cyan,
                    foregroundColor: Colors.black,
                  ),
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 16),

        Text(
          'YOUR COVENANT DUELS',
          style: TextStyle(
            color: HunterTheme.textMuted,
            fontWeight: FontWeight.bold,
            fontSize: 11.5,
            letterSpacing: 1.2,
          ),
        ),
        const SizedBox(height: 8),
        if (aState.covenants.isEmpty)
          Text(
            'No covenants initiated or accepted yet.',
            style: TextStyle(color: HunterTheme.textMuted, fontSize: 12.5),
          )
        else
          ...aState.covenants.map(_buildCovenantTile),
      ],
    );
  }

  Widget _buildCovenantTile(PeerCovenantModel cov) {
    final active = cov.status == 'active';
    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: HunterTheme.surface,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(
          color: active
              ? HunterTheme.emerald.withValues(alpha: 0.6)
              : HunterTheme.gold.withValues(alpha: 0.4),
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Row(
                children: [
                  Text(
                    cov.covenantCode,
                    style: TextStyle(
                      color: HunterTheme.gold,
                      fontWeight: FontWeight.w900,
                      letterSpacing: 1.1,
                    ),
                  ),
                  const SizedBox(width: 6),
                  InkWell(
                    onTap: () {
                      Clipboard.setData(ClipboardData(text: cov.covenantCode));
                      ScaffoldMessenger.of(context).showSnackBar(
                        SnackBar(
                          backgroundColor: HunterTheme.surfaceLight,
                          content: Text('Copied ${cov.covenantCode} to clipboard.'),
                        ),
                      );
                    },
                    child: Icon(Icons.copy_rounded, size: 15, color: HunterTheme.cyanLight),
                  ),
                ],
              ),
              Text(
                '${cov.status.toUpperCase()} • ${cov.stakeCoins} COINS',
                style: TextStyle(
                  color: active ? HunterTheme.emeraldLight : HunterTheme.cyanLight,
                  fontWeight: FontWeight.bold,
                  fontSize: 11,
                ),
              ),
            ],
          ),
          const SizedBox(height: 4),
          Text(
            cov.protocolObjective,
            style: TextStyle(color: HunterTheme.textPrimary, fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 4),
          Text(
            cov.counterpartyName != null
                ? '${cov.initiatorName} vs ${cov.counterpartyName} (${cov.termsDays}D)'
                : 'Initiator: ${cov.initiatorName} • Awaiting Challenger (${cov.termsDays}D)',
            style: TextStyle(color: HunterTheme.textMuted, fontSize: 12),
          ),
        ],
      ),
    );
  }

  Widget _buildWitnessWallTab(AccountabilityState aState) {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        Container(
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            color: HunterTheme.surface,
            borderRadius: BorderRadius.circular(14),
            border: Border.all(color: HunterTheme.purple.withValues(alpha: 0.45)),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'DECLARE PUBLIC HUNTER OATH',
                style: TextStyle(
                  color: HunterTheme.purple,
                  fontWeight: FontWeight.w900,
                  fontSize: 11.5,
                ),
              ),
              const SizedBox(height: 8),
              Wrap(
                spacing: 6,
                runSpacing: 6,
                children: [
                  'Study 2h daily for 30 days',
                  'No junk food for 14 days',
                  'Workout 4x every week',
                  'Ship my project by Sunday',
                ].map((tpl) => ActionChip(
                  backgroundColor: HunterTheme.surfaceLight,
                  label: Text(tpl, style: TextStyle(color: HunterTheme.cyanLight, fontSize: 10.5)),
                  onPressed: () => setState(() => _oathCtrl.text = tpl),
                )).toList(),
              ),
              const SizedBox(height: 8),
              TextField(
                controller: _oathCtrl,
                maxLines: 2,
                style: TextStyle(color: HunterTheme.textPrimary, fontSize: 13),
                decoration: InputDecoration(
                  hintText: 'State your 30-day objective before fellow Hunters...',
                  hintStyle: TextStyle(color: HunterTheme.textMuted),
                ),
              ),
              const SizedBox(height: 10),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: _busy
                      ? null
                      : () async {
                          final text = _oathCtrl.text.trim();
                          if (text.length < 5) return;
                          setState(() => _busy = true);
                          try {
                            await ref
                                .read(accountabilityProvider.notifier)
                                .declarePublicOath(
                                  declaration: text,
                                  targetDeadline:
                                      DateTime.now().add(const Duration(days: 30)),
                                );
                            _oathCtrl.clear();
                          } finally {
                            if (mounted) setState(() => _busy = false);
                          }
                        },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: HunterTheme.purple,
                    foregroundColor: Colors.white,
                  ),
                  child: const Text('PUBLISH OATH TO WALL',
                      style: TextStyle(fontWeight: FontWeight.w900)),
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 14),
        ...aState.publicCommitments.map((oath) {
          return Container(
            margin: const EdgeInsets.only(bottom: 10),
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              color: HunterTheme.surface,
              borderRadius: BorderRadius.circular(14),
              border: Border.all(color: HunterTheme.cyan.withValues(alpha: 0.25)),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  oath.declaration,
                  style: TextStyle(
                    color: HunterTheme.textPrimary,
                    fontWeight: FontWeight.bold,
                    fontSize: 14,
                  ),
                ),
                const SizedBox(height: 6),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      'Score: ${oath.currentDisciplineScore} • ${oath.witnessesCount} Witnesses',
                      style: TextStyle(color: HunterTheme.cyanLight, fontSize: 11.5),
                    ),
                    OutlinedButton.icon(
                      onPressed: () => ref
                          .read(accountabilityProvider.notifier)
                          .witnessOath(oath.id),
                      icon: const Icon(Icons.visibility, size: 15),
                      label: const Text('WITNESS', style: TextStyle(fontSize: 11)),
                      style: OutlinedButton.styleFrom(
                        foregroundColor: HunterTheme.gold,
                        side: BorderSide(color: HunterTheme.gold.withValues(alpha: 0.6)),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          );
        }),
      ],
    );
  }

  Widget _buildHallAndWallTab(AccountabilityState aState) {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        Text(
          'HALL OF ASCENSION (IMMORTALIZED)',
          style: TextStyle(
            color: HunterTheme.gold,
            fontWeight: FontWeight.w900,
            fontSize: 12,
            letterSpacing: 1.3,
          ),
        ),
        const SizedBox(height: 8),
        if (aState.hallEntries.isEmpty)
          Text('No inductees recorded yet.',
              style: TextStyle(color: HunterTheme.textMuted, fontSize: 12))
        else
          ...aState.hallEntries.map((h) => Container(
                margin: const EdgeInsets.only(bottom: 8),
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: HunterTheme.gold.withValues(alpha: 0.08),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: HunterTheme.gold.withValues(alpha: 0.45)),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      '${h.userName.toUpperCase()} — ${h.disciplineScore} PTS',
                      style: TextStyle(
                          color: HunterTheme.gold, fontWeight: FontWeight.w900),
                    ),
                    Text(
                      '${h.goalTitle} • ${h.consecutiveDays}d Streak',
                      style: TextStyle(
                          color: HunterTheme.textPrimary, fontSize: 12),
                    ),
                  ],
                ),
              )),

        const SizedBox(height: 20),
        Text(
          'WALL OF CONSEQUENCE (CONTRACT BREACHES)',
          style: TextStyle(
            color: HunterTheme.crimson,
            fontWeight: FontWeight.w900,
            fontSize: 12,
            letterSpacing: 1.3,
          ),
        ),
        const SizedBox(height: 8),
        if (aState.wallEntries.isEmpty)
          Text('Zero defaults recorded.',
              style: TextStyle(color: HunterTheme.textMuted, fontSize: 12))
        else
          ...aState.wallEntries.map((w) => Container(
                margin: const EdgeInsets.only(bottom: 8),
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: HunterTheme.crimson.withValues(alpha: 0.08),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: HunterTheme.crimson.withValues(alpha: 0.45)),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      '${w.userName.toUpperCase()} — ${w.breachType.toUpperCase()}',
                      style: TextStyle(
                          color: HunterTheme.crimson, fontWeight: FontWeight.w900),
                    ),
                    Text(
                      'Target: ${w.contractTarget} | ${w.dishonorReason}',
                      style: TextStyle(
                          color: HunterTheme.textMuted, fontSize: 12),
                    ),
                  ],
                ),
              )),
      ],
    );
  }
}
