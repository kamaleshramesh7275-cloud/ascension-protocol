import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import '../../core/providers/appearance_provider.dart';
import '../../core/providers/workout_provider.dart';
import '../../core/storage/session_storage.dart';
import '../../core/theme/hunter_theme.dart';
import '../../models/workout_models.dart';
import 'active_workout_screen.dart';
import 'official_templates_sheet.dart';

/// Feature #3 Full Workout Logger, Official Splits, History & Personal Records Screen.
class WorkoutScreen extends ConsumerStatefulWidget {
  const WorkoutScreen({super.key});

  @override
  ConsumerState<WorkoutScreen> createState() => _WorkoutScreenState();
}

class _WorkoutScreenState extends ConsumerState<WorkoutScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;
  Map<String, dynamic>? _pendingDraft;
  String _exerciseSearch = '';

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
    _checkDraft();
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  Future<void> _checkDraft() async {
    try {
      final raw = await SessionStorage.getWorkoutDraft();
      if (raw != null && raw.isNotEmpty && mounted) {
        final decoded = jsonDecode(raw) as Map<String, dynamic>;
        setState(() => _pendingDraft = decoded);
      }
    } catch (_) {}
  }

  Future<void> _launchSession({
    required String name,
    String? templateId,
    List<ExerciseModel> initialExercises = const [],
    Map<String, dynamic>? restoredDraft,
  }) async {
    await Navigator.of(context).push(
      MaterialPageRoute(
        builder: (_) => ActiveWorkoutScreen(
          workoutName: name,
          templateId: templateId,
          initialExercises: initialExercises,
          restoredDraft: restoredDraft,
        ),
      ),
    );
    _checkDraft();
  }

  void _startOfficialTemplate(OfficialTemplateModel tpl) {
    final wState = ref.read(workoutProvider);
    final resolved = <ExerciseModel>[];
    for (final name in tpl.exerciseNames) {
      final match = wState.findExerciseByName(name);
      if (match != null) resolved.add(match);
    }
    _launchSession(
      name: tpl.name,
      templateId: tpl.id,
      initialExercises: resolved,
    );
  }

  @override
  Widget build(BuildContext context) {
    ref.watch(appearanceProvider);
    final wState = ref.watch(workoutProvider);

    return Scaffold(
      backgroundColor: HunterTheme.abyss,
      appBar: AppBar(
        backgroundColor: HunterTheme.abyss,
        elevation: 0,
        title: Text(
          'COMBAT TRAINING',
          style: TextStyle(
            color: HunterTheme.textPrimary,
            fontWeight: FontWeight.w900,
            letterSpacing: 1.6,
            fontSize: 17,
          ),
        ),
        bottom: TabBar(
          controller: _tabController,
          indicatorColor: HunterTheme.cyan,
          labelColor: HunterTheme.cyanLight,
          unselectedLabelColor: HunterTheme.textMuted,
          labelStyle: const TextStyle(fontWeight: FontWeight.w900, fontSize: 11.5),
          tabs: const [
            Tab(text: 'START / ROUTINES'),
            Tab(text: 'HISTORY'),
            Tab(text: 'EXERCISES & PRs'),
          ],
        ),
      ),
      body: TabBarView(
        controller: _tabController,
        children: [
          _buildRoutinesTab(wState),
          _buildHistoryTab(wState),
          _buildExercisesAndPrsTab(wState),
        ],
      ),
    );
  }

  Widget _buildRoutinesTab(WorkoutState wState) {
    return RefreshIndicator(
      onRefresh: () => ref.read(workoutProvider.notifier).loadAll(),
      child: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          if (_pendingDraft != null) ...[
            Container(
              margin: const EdgeInsets.only(bottom: 14),
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: HunterTheme.gold.withValues(alpha: 0.14),
                borderRadius: BorderRadius.circular(14),
                border: Border.all(color: HunterTheme.gold),
              ),
              child: Row(
                children: [
                  Icon(Icons.restore, color: HunterTheme.gold),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'UNFINISHED WORKOUT DRAFT',
                          style: TextStyle(
                            color: HunterTheme.gold,
                            fontWeight: FontWeight.w900,
                            fontSize: 11.5,
                          ),
                        ),
                        Text(
                          _pendingDraft?['workoutName']?.toString() ?? 'Session Draft',
                          style: TextStyle(
                              color: HunterTheme.textPrimary, fontSize: 12.5),
                        ),
                      ],
                    ),
                  ),
                  TextButton(
                    onPressed: () async {
                      await SessionStorage.clearWorkoutDraft();
                      setState(() => _pendingDraft = null);
                    },
                    child: Text('DISCARD', style: TextStyle(color: HunterTheme.crimson)),
                  ),
                  ElevatedButton(
                    onPressed: () => _launchSession(
                      name: _pendingDraft?['workoutName']?.toString() ?? 'Resumed Session',
                      restoredDraft: _pendingDraft,
                    ),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: HunterTheme.gold,
                      foregroundColor: Colors.black,
                    ),
                    child: const Text('RESUME', style: TextStyle(fontWeight: FontWeight.w900)),
                  ),
                ],
              ),
            ),
          ],

          // Primary Launch Actions
          Row(
            children: [
              Expanded(
                child: ElevatedButton.icon(
                  onPressed: () => _launchSession(name: 'Custom Strength Session'),
                  icon: const Icon(Icons.add),
                  label: const Text(
                    'EMPTY WORKOUT',
                    style: TextStyle(fontWeight: FontWeight.w900, fontSize: 12),
                  ),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: HunterTheme.cyan,
                    foregroundColor: Colors.black,
                    padding: const EdgeInsets.symmetric(vertical: 14),
                    shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12)),
                  ),
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: OutlinedButton.icon(
                  onPressed: () => OfficialTemplatesSheet.show(
                    context,
                    onSelectTemplate: _startOfficialTemplate,
                  ),
                  icon: Icon(Icons.auto_awesome, size: 18, color: HunterTheme.purple),
                  label: Text(
                    'OFFICIAL SPLITS',
                    style: TextStyle(
                      color: HunterTheme.purple,
                      fontWeight: FontWeight.w900,
                      fontSize: 12,
                    ),
                  ),
                  style: OutlinedButton.styleFrom(
                    side: BorderSide(color: HunterTheme.purple),
                    padding: const EdgeInsets.symmetric(vertical: 14),
                    shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12)),
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 10),
          SizedBox(
            width: double.infinity,
            child: OutlinedButton.icon(
              onPressed: _showAiSplitDialog,
              icon: Icon(Icons.psychology_alt_rounded,
                  size: 18, color: HunterTheme.gold),
              label: Text(
                'AI CUSTOM SPLIT GENERATOR',
                style: TextStyle(
                  color: HunterTheme.gold,
                  fontWeight: FontWeight.w900,
                  fontSize: 12,
                  letterSpacing: 0.8,
                ),
              ),
              style: OutlinedButton.styleFrom(
                side: BorderSide(color: HunterTheme.gold.withValues(alpha: 0.7)),
                padding: const EdgeInsets.symmetric(vertical: 13),
                shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12)),
              ),
            ),
          ),

          const SizedBox(height: 20),
          Text(
            'YOUR SAVED TEMPLATES',
            style: TextStyle(
              color: HunterTheme.textMuted,
              fontWeight: FontWeight.bold,
              fontSize: 11.5,
              letterSpacing: 1.2,
            ),
          ),
          const SizedBox(height: 10),

          if (wState.userTemplates.isEmpty)
            Container(
              padding: const EdgeInsets.all(18),
              decoration: BoxDecoration(
                color: HunterTheme.surface,
                borderRadius: BorderRadius.circular(14),
                border: Border.all(color: HunterTheme.cyan.withValues(alpha: 0.2)),
              ),
              child: Text(
                'No custom templates yet. Toggle "Save as template" when finishing any workout, or deploy an Official Split above.',
                style: TextStyle(color: HunterTheme.textMuted, fontSize: 12.5),
              ),
            )
          else
            ...wState.userTemplates.map((tpl) {
              return Padding(
                padding: const EdgeInsets.only(bottom: 10),
                child: Material(
                  color: HunterTheme.surface,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(14),
                    side: BorderSide(color: HunterTheme.cyan.withValues(alpha: 0.3)),
                  ),
                  clipBehavior: Clip.antiAlias,
                  child: ListTile(
                    title: Text(
                      tpl.name,
                      style: TextStyle(
                        color: HunterTheme.textPrimary,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    subtitle: Text(
                      '${tpl.exerciseIds.length} Exercises',
                      style: TextStyle(color: HunterTheme.cyanLight, fontSize: 11.5),
                    ),
                    trailing: Icon(Icons.play_arrow_rounded, color: HunterTheme.cyan),
                    onTap: () {
                      final resolved = tpl.exerciseIds
                          .map(wState.findExerciseById)
                          .whereType<ExerciseModel>()
                          .toList();
                      _launchSession(
                        name: tpl.name,
                        templateId: tpl.id,
                        initialExercises: resolved,
                      );
                    },
                  ),
                ),
              );
            }),
        ],
      ),
    );
  }

  Widget _buildHistoryTab(WorkoutState wState) {
    if (wState.sessions.isEmpty) {
      return Center(
        child: Text(
          'No combat sessions logged yet.',
          style: TextStyle(color: HunterTheme.textMuted),
        ),
      );
    }

    return RefreshIndicator(
      onRefresh: () => ref.read(workoutProvider.notifier).loadAll(),
      child: ListView.builder(
        padding: const EdgeInsets.all(16),
        itemCount: wState.sessions.length,
        itemBuilder: (_, idx) {
          final s = wState.sessions[idx];
          final dateLabel = DateFormat('MMM d, h:mm a').format(s.startedAt.toLocal());
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
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Expanded(
                      child: Text(
                        s.name,
                        style: TextStyle(
                          color: HunterTheme.textPrimary,
                          fontWeight: FontWeight.w900,
                          fontSize: 14.5,
                        ),
                      ),
                    ),
                    Text(
                      '+${s.xpEarned} XP',
                      style: TextStyle(
                        color: HunterTheme.gold,
                        fontWeight: FontWeight.w900,
                        fontSize: 12,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 4),
                Text(
                  '$dateLabel • ${s.totalVolume} kg moved • ${s.totalSets} sets',
                  style: TextStyle(color: HunterTheme.cyanLight, fontSize: 12),
                ),
                if (s.notes != null && s.notes!.isNotEmpty) ...[
                  const SizedBox(height: 4),
                  Text(
                    s.notes!,
                    style: TextStyle(color: HunterTheme.textMuted, fontSize: 11.5),
                  ),
                ],
              ],
            ),
          );
        },
      ),
    );
  }

  Widget _buildExercisesAndPrsTab(WorkoutState wState) {
    final filtered = wState.exercises.where((e) {
      return _exerciseSearch.isEmpty ||
          e.name.toLowerCase().contains(_exerciseSearch.toLowerCase()) ||
          e.muscleGroup.toLowerCase().contains(_exerciseSearch.toLowerCase());
    }).toList();

    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        if (wState.prs.isNotEmpty) ...[
          Text(
            'PERSONAL RECORDS HALL',
            style: TextStyle(
              color: HunterTheme.gold,
              fontWeight: FontWeight.w900,
              fontSize: 12,
              letterSpacing: 1.2,
            ),
          ),
          const SizedBox(height: 8),
          ...wState.prs.take(12).map((pr) {
            final exName = pr.exerciseName ??
                wState.findExerciseById(pr.exerciseId)?.name ??
                'Exercise';
            return Container(
              margin: const EdgeInsets.only(bottom: 8),
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
              decoration: BoxDecoration(
                color: HunterTheme.gold.withValues(alpha: 0.08),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: HunterTheme.gold.withValues(alpha: 0.45)),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          exName,
                          style: TextStyle(
                            color: HunterTheme.textPrimary,
                            fontWeight: FontWeight.bold,
                            fontSize: 13.5,
                          ),
                        ),
                        Text(
                          pr.recordType.toUpperCase(),
                          style: TextStyle(
                              color: HunterTheme.gold, fontSize: 10, fontWeight: FontWeight.w800),
                        ),
                      ],
                    ),
                  ),
                  Text(
                    '${pr.value.toStringAsFixed(1)} KG',
                    style: TextStyle(
                      color: HunterTheme.gold,
                      fontWeight: FontWeight.w900,
                      fontSize: 14,
                    ),
                  ),
                ],
              ),
            );
          }),
          const SizedBox(height: 16),
        ],

        TextField(
          style: TextStyle(color: HunterTheme.textPrimary),
          decoration: InputDecoration(
            hintText: 'Search 79+ exercises by name or muscle...',
            hintStyle: TextStyle(color: HunterTheme.textMuted),
            prefixIcon: Icon(Icons.search, color: HunterTheme.cyan),
            filled: true,
            fillColor: HunterTheme.surface,
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: BorderSide.none,
            ),
          ),
          onChanged: (v) => setState(() => _exerciseSearch = v),
        ),
        const SizedBox(height: 10),
        ...filtered.map(
          (ex) => ListTile(
            contentPadding: const EdgeInsets.symmetric(horizontal: 4),
            title: Text(
              ex.name,
              style: TextStyle(
                color: HunterTheme.textPrimary,
                fontWeight: FontWeight.bold,
              ),
            ),
            subtitle: Text(
              '${ex.muscleGroup.toUpperCase()} • ${ex.equipment.toUpperCase()}',
              style: TextStyle(color: HunterTheme.cyanLight, fontSize: 11),
            ),
          ),
        ),
      ],
    );
  }

  Future<void> _showAiSplitDialog() async {
    String goalFocus = 'Strength & Hypertrophy';
    String equipment = 'gym';
    int durationMinutes = 45;
    int daysPerWeek = 3;
    final constraintCtrl = TextEditingController();
    bool generating = false;

    await showDialog<void>(
      context: context,
      builder: (dialogCtx) => StatefulBuilder(
        builder: (ctx, setDialogState) {
          return AlertDialog(
            backgroundColor: HunterTheme.surface,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(18),
              side: BorderSide(color: HunterTheme.gold.withValues(alpha: 0.5)),
            ),
            title: Row(
              children: [
                Icon(Icons.psychology_alt_rounded, color: HunterTheme.gold),
                SizedBox(width: 8),
                Expanded(
                  child: Text(
                    'AI CUSTOM SPLIT BUILDER',
                    style: TextStyle(
                      color: HunterTheme.gold,
                      fontWeight: FontWeight.w900,
                      fontSize: 14,
                      letterSpacing: 1.0,
                    ),
                  ),
                ),
              ],
            ),
            content: SingleChildScrollView(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('TRAINING FOCUS',
                      style: TextStyle(
                          color: HunterTheme.textMuted,
                          fontSize: 10.5,
                          fontWeight: FontWeight.bold)),
                  const SizedBox(height: 6),
                  DropdownButtonFormField<String>(
                    initialValue: goalFocus,
                    dropdownColor: HunterTheme.surface,
                    style: TextStyle(color: HunterTheme.textPrimary, fontSize: 13),
                    decoration: InputDecoration(
                      filled: true,
                      fillColor: HunterTheme.abyss,
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(10),
                        borderSide: BorderSide.none,
                      ),
                    ),
                    items: const [
                      DropdownMenuItem(
                        value: 'Strength & Hypertrophy',
                        child: Text('Strength & Hypertrophy'),
                      ),
                      DropdownMenuItem(
                        value: 'Fat Loss & Conditioning',
                        child: Text('Fat Loss & Conditioning'),
                      ),
                      DropdownMenuItem(
                        value: 'Athletic Power & Mobility',
                        child: Text('Athletic Power & Mobility'),
                      ),
                    ],
                    onChanged: (v) => setDialogState(() => goalFocus = v ?? goalFocus),
                  ),
                  const SizedBox(height: 12),
                  Text('EQUIPMENT ACCESS',
                      style: TextStyle(
                          color: HunterTheme.textMuted,
                          fontSize: 10.5,
                          fontWeight: FontWeight.bold)),
                  const SizedBox(height: 6),
                  Wrap(
                    spacing: 6,
                    children: [
                      ('gym', 'Full Gym'),
                      ('dumbbells', 'Dumbbells'),
                      ('bodyweight', 'Home / BW'),
                    ].map((opt) {
                      final selected = equipment == opt.$1;
                      return ChoiceChip(
                        label: Text(opt.$2, style: const TextStyle(fontSize: 11.5)),
                        selected: selected,
                        onSelected: (_) => setDialogState(() => equipment = opt.$1),
                        selectedColor: HunterTheme.cyan,
                        labelStyle: TextStyle(
                          color: selected ? Colors.black : HunterTheme.textPrimary,
                          fontWeight: FontWeight.bold,
                        ),
                      );
                    }).toList(),
                  ),
                  const SizedBox(height: 12),
                  Text('SESSION LENGTH & DAYS / WEEK',
                      style: TextStyle(
                          color: HunterTheme.textMuted,
                          fontSize: 10.5,
                          fontWeight: FontWeight.bold)),
                  const SizedBox(height: 6),
                  Wrap(
                    spacing: 6,
                    children: [30, 45, 60].map((mins) {
                      final selected = durationMinutes == mins;
                      return ChoiceChip(
                        label: Text('${mins}m', style: const TextStyle(fontSize: 11.5)),
                        selected: selected,
                        onSelected: (_) => setDialogState(() => durationMinutes = mins),
                        selectedColor: HunterTheme.gold,
                        labelStyle: TextStyle(
                          color: selected ? Colors.black : HunterTheme.textPrimary,
                          fontWeight: FontWeight.bold,
                        ),
                      );
                    }).toList(),
                  ),
                  const SizedBox(height: 6),
                  Wrap(
                    spacing: 6,
                    children: [2, 3, 4].map((d) {
                      final selected = daysPerWeek == d;
                      return ChoiceChip(
                        label: Text('${d}d/wk', style: const TextStyle(fontSize: 11.5)),
                        selected: selected,
                        onSelected: (_) => setDialogState(() => daysPerWeek = d),
                        selectedColor: HunterTheme.purple,
                        labelStyle: TextStyle(
                          color: selected ? Colors.black : HunterTheme.textPrimary,
                          fontWeight: FontWeight.bold,
                        ),
                      );
                    }).toList(),
                  ),
                  const SizedBox(height: 12),
                  TextField(
                    controller: constraintCtrl,
                    style: TextStyle(color: HunterTheme.textPrimary, fontSize: 12.5),
                    decoration: InputDecoration(
                      labelText: 'Constraint or Injury Note (optional)',
                      labelStyle: TextStyle(color: HunterTheme.textMuted, fontSize: 11.5),
                      hintText: 'e.g., Bad knee, avoid deep barbell squats',
                      hintStyle: TextStyle(color: HunterTheme.textMuted, fontSize: 11.5),
                      filled: true,
                      fillColor: HunterTheme.abyss,
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(10),
                        borderSide: BorderSide.none,
                      ),
                    ),
                  ),
                ],
              ),
            ),
            actions: [
              TextButton(
                onPressed: generating ? null : () => Navigator.of(dialogCtx).pop(),
                child: Text('CANCEL', style: TextStyle(color: HunterTheme.textMuted)),
              ),
              ElevatedButton.icon(
                onPressed: generating
                    ? null
                    : () async {
                        setDialogState(() => generating = true);
                        final provider = await ref
                            .read(workoutProvider.notifier)
                            .generateAiSplit(
                              goalFocus: goalFocus,
                              equipment: equipment,
                              durationMinutes: durationMinutes,
                              daysPerWeek: daysPerWeek,
                              constraintNote: constraintCtrl.text,
                            );
                        if (dialogCtx.mounted) {
                          Navigator.of(dialogCtx).pop();
                        }
                        if (mounted) {
                          ScaffoldMessenger.of(context).showSnackBar(
                            SnackBar(
                              backgroundColor: HunterTheme.surface,
                              content: Text(
                                provider != null
                                    ? 'AI custom split saved to Your Saved Templates ($provider).'
                                    : 'Could not generate split right now. Try again.',
                                style: TextStyle(
                                  color: provider != null
                                      ? HunterTheme.cyanLight
                                      : HunterTheme.crimson,
                                ),
                              ),
                            ),
                          );
                        }
                      },
                icon: generating
                    ? const SizedBox(
                        width: 14,
                        height: 14,
                        child: CircularProgressIndicator(strokeWidth: 2, color: Colors.black),
                      )
                    : const Icon(Icons.auto_awesome, size: 16),
                label: const Text('GENERATE SPLIT',
                    style: TextStyle(fontWeight: FontWeight.w900)),
                style: ElevatedButton.styleFrom(
                  backgroundColor: HunterTheme.gold,
                  foregroundColor: Colors.black,
                ),
              ),
            ],
          );
        },
      ),
    );
    constraintCtrl.dispose();
  }
}
