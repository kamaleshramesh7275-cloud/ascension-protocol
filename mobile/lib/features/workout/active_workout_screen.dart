import 'dart:async';
import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/api/api_error.dart';
import '../../core/providers/quests_provider.dart';
import '../../core/providers/roadmap_provider.dart';
import '../../core/providers/workout_provider.dart';
import '../../core/storage/session_storage.dart';
import '../../core/theme/hunter_theme.dart';
import '../../core/widgets/system_window_dialog.dart';
import '../../models/workout_models.dart';

class _ExerciseBlock {
  final ExerciseModel exercise;
  final List<WorkoutSetModel> sets;
  final List<WorkoutSetModel> lastSessionSets;
  final double baseline1RM;
  String? coachTargetHint;
  String? coachMode;

  _ExerciseBlock({
    required this.exercise,
    required this.sets,
    this.lastSessionSets = const [],
    this.baseline1RM = 0.0,
  });

  String? get beatLastHint {
    if (lastSessionSets.isEmpty && baseline1RM <= 0) return null;
    if (lastSessionSets.isNotEmpty) {
      final bestLast = lastSessionSets.reduce(
        (a, b) => a.estimated1RM >= b.estimated1RM ? a : b,
      );
      final target = baseline1RM > bestLast.estimated1RM ? baseline1RM : bestLast.estimated1RM;
      return 'BEAT LAST: ${bestLast.weight.toStringAsFixed(bestLast.weight % 1 == 0 ? 0 : 1)}kg × ${bestLast.reps} (Target > ${target.toStringAsFixed(1)}kg 1RM)';
    }
    return 'PR TARGET: Beat ${baseline1RM.toStringAsFixed(1)}kg Est. 1RM';
  }
}

/// Active Workout Session Logger with Rest Timer, W/N/D/F Set Types, Draft Persistence,
/// & RET-3 "Beat Last Session" Live Epley 1RM PR Detection.
class ActiveWorkoutScreen extends ConsumerStatefulWidget {
  final String workoutName;
  final String? templateId;
  final List<ExerciseModel> initialExercises;
  final Map<String, dynamic>? restoredDraft;

  const ActiveWorkoutScreen({
    super.key,
    required this.workoutName,
    this.templateId,
    this.initialExercises = const [],
    this.restoredDraft,
  });

  /// Deterministic RET-3 PR helper (tested in unit tests).
  static bool isNewPrBreakthrough({
    required double weight,
    required int reps,
    required double previousBest1RM,
  }) {
    if (weight <= 0 || reps <= 0 || previousBest1RM <= 0) return false;
    return WorkoutSetModel.computeEpley1RM(weight, reps) > previousBest1RM;
  }

  @override
  ConsumerState<ActiveWorkoutScreen> createState() => _ActiveWorkoutScreenState();
}

class _ActiveWorkoutScreenState extends ConsumerState<ActiveWorkoutScreen> {
  final List<_ExerciseBlock> _blocks = [];
  final TextEditingController _notesController = TextEditingController();

  String? _sessionId;
  bool _saveAsTemplate = false;
  bool _finishing = false;

  Timer? _elapsedTimer;
  int _elapsedSeconds = 0;

  Timer? _restTimer;
  int _restRemainingSeconds = 0;
  int _defaultRestSeconds = 90;

  static const _setTypes = ['normal', 'warmup', 'dropset', 'failure'];

  @override
  void initState() {
    super.initState();
    _elapsedTimer = Timer.periodic(const Duration(seconds: 1), (_) {
      if (mounted) setState(() => _elapsedSeconds++);
    });

    WidgetsBinding.instance.addPostFrameCallback((_) => _initSession());
  }

  @override
  void dispose() {
    _elapsedTimer?.cancel();
    _restTimer?.cancel();
    _notesController.dispose();
    super.dispose();
  }

  Future<void> _initSession() async {
    if (widget.restoredDraft != null) {
      await _hydrateFromDraft(widget.restoredDraft!);
      return;
    }

    final startedId = await ref.read(workoutProvider.notifier).startSession(
          name: widget.workoutName,
          templateId: widget.templateId,
        );
    if (mounted) {
      setState(() => _sessionId = startedId);
    }

    for (final ex in widget.initialExercises) {
      await _addExercise(ex);
    }
    _persistDraft();
  }

  Future<void> _loadCoachTargets() async {
    if (_blocks.isEmpty) return;
    final ids = _blocks.map((b) => b.exercise.id).toList();
    final resp = await ref.read(workoutProvider.notifier).fetchProgressiveTargets(ids);
    final rawTargets = resp['targets'];
    if (rawTargets is Map && mounted) {
      setState(() {
        for (final b in _blocks) {
          final entry = rawTargets[b.exercise.id];
          if (entry is Map) {
            final rationale = entry['rationale']?.toString();
            final w = entry['targetWeight'];
            final reps = entry['targetReps'];
            final wLabel = w != null ? '${w}kg × ' : '';
            b.coachMode = entry['mode']?.toString();
            b.coachTargetHint = rationale != null
                ? 'TODAY TARGET: $wLabel${reps ?? 10} reps • $rationale'
                : null;
          }
        }
      });
    }
  }

  Future<void> _hydrateFromDraft(Map<String, dynamic> draft) async {
    _sessionId = draft['sessionId']?.toString();
    _elapsedSeconds = (draft['elapsedSeconds'] as num?)?.toInt() ?? 0;
    _notesController.text = draft['notes']?.toString() ?? '';

    final workoutState = ref.read(workoutProvider);
    final rawBlocks = draft['blocks'] as List? ?? const [];
    for (final b in rawBlocks) {
      if (b is! Map) continue;
      final exId = b['exerciseId']?.toString() ?? '';
      final ex = workoutState.findExerciseById(exId);
      if (ex == null) continue;
      final sets = (b['sets'] as List? ?? const [])
          .map((s) => WorkoutSetModel.fromJson(Map<String, dynamic>.from(s as Map)))
          .toList();
      final lastSets = await ref.read(workoutProvider.notifier).fetchLastSets(ex.id);
      final baseline = _computeBaseline1RM(ex.id, lastSets);
      _blocks.add(
        _ExerciseBlock(
          exercise: ex,
          sets: sets.isEmpty ? [_blankSet(ex.id, 1, lastSets)] : sets,
          lastSessionSets: lastSets,
          baseline1RM: baseline,
        ),
      );
    }
    if (mounted) setState(() {});
    await _loadCoachTargets();
  }

  double _computeBaseline1RM(String exerciseId, List<WorkoutSetModel> lastSets) {
    final pr = ref.read(workoutProvider).best1RMForExercise(exerciseId);
    double lastBest = 0.0;
    for (final s in lastSets) {
      if (s.estimated1RM > lastBest) lastBest = s.estimated1RM;
    }
    return pr > lastBest ? pr : lastBest;
  }

  WorkoutSetModel _blankSet(
    String exerciseId,
    int setNumber,
    List<WorkoutSetModel> lastSets,
  ) {
    final hintSet = lastSets.length >= setNumber
        ? lastSets[setNumber - 1]
        : (lastSets.isNotEmpty ? lastSets.last : null);
    return WorkoutSetModel(
      exerciseId: exerciseId,
      setNumber: setNumber,
      weight: hintSet?.weight ?? 0,
      reps: hintSet?.reps ?? 0,
      completed: false,
    );
  }

  Future<void> _addExercise(ExerciseModel exercise) async {
    final lastSets =
        await ref.read(workoutProvider.notifier).fetchLastSets(exercise.id);
    final baseline = _computeBaseline1RM(exercise.id, lastSets);

    if (!mounted) return;
    setState(() {
      _blocks.add(
        _ExerciseBlock(
          exercise: exercise,
          sets: [_blankSet(exercise.id, 1, lastSets)],
          lastSessionSets: lastSets,
          baseline1RM: baseline,
        ),
      );
    });
    _persistDraft();
    await _loadCoachTargets();
  }

  Future<void> _persistDraft() async {
    final payload = {
      'sessionId': _sessionId,
      'workoutName': widget.workoutName,
      'templateId': widget.templateId,
      'elapsedSeconds': _elapsedSeconds,
      'notes': _notesController.text,
      'blocks': _blocks
          .map((b) => {
                'exerciseId': b.exercise.id,
                'sets': b.sets
                    .map((s) => {
                          ...s.toPayloadJson(),
                          'completed': s.completed,
                        })
                    .toList(),
              })
          .toList(),
    };
    await SessionStorage.saveWorkoutDraft(jsonEncode(payload));
  }

  void _startRestTimer([int? seconds]) {
    _restTimer?.cancel();
    setState(() => _restRemainingSeconds = seconds ?? _defaultRestSeconds);
    _restTimer = Timer.periodic(const Duration(seconds: 1), (t) {
      if (!mounted) {
        t.cancel();
        return;
      }
      if (_restRemainingSeconds <= 1) {
        t.cancel();
        HapticFeedback.heavyImpact();
        setState(() => _restRemainingSeconds = 0);
      } else {
        setState(() => _restRemainingSeconds--);
      }
    });
  }

  Future<void> _openExercisePicker() async {
    final exercises = ref.read(workoutProvider).exercises;
    String search = '';
    String muscle = 'all';

    await showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      backgroundColor: HunterTheme.abyss,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setModalState) {
          final filtered = exercises.where((e) {
            final matchesQ =
                search.isEmpty || e.name.toLowerCase().contains(search.toLowerCase());
            final matchesM = muscle == 'all' || e.muscleGroup == muscle;
            return matchesQ && matchesM;
          }).toList();

          return DraggableScrollableSheet(
            expand: false,
            initialChildSize: 0.78,
            maxChildSize: 0.94,
            builder: (_, scroll) => Padding(
              padding: const EdgeInsets.fromLTRB(16, 14, 16, 20),
              child: Column(
                children: [
                  TextField(
                    style: TextStyle(color: HunterTheme.textPrimary),
                    decoration: InputDecoration(
                      hintText: 'Search 79+ exercises...',
                      hintStyle: TextStyle(color: HunterTheme.textMuted),
                      prefixIcon: Icon(Icons.search, color: HunterTheme.cyan),
                      filled: true,
                      fillColor: HunterTheme.surface,
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12),
                        borderSide: BorderSide.none,
                      ),
                    ),
                    onChanged: (v) => setModalState(() => search = v),
                  ),
                  const SizedBox(height: 10),
                  SizedBox(
                    height: 36,
                    child: ListView(
                      scrollDirection: Axis.horizontal,
                      children: [
                        'all',
                        'chest',
                        'back',
                        'legs',
                        'shoulders',
                        'arms',
                        'core'
                      ]
                          .map((m) => Padding(
                                padding: const EdgeInsets.only(right: 6),
                                child: ChoiceChip(
                                  label: Text(m.toUpperCase()),
                                  selected: muscle == m,
                                  onSelected: (_) => setModalState(() => muscle = m),
                                  selectedColor: HunterTheme.cyan,
                                  backgroundColor: HunterTheme.surface,
                                  labelStyle: TextStyle(
                                    color: muscle == m ? Colors.black : HunterTheme.textPrimary,
                                    fontSize: 10.5,
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                              ))
                          .toList(),
                    ),
                  ),
                  const SizedBox(height: 10),
                  Expanded(
                    child: ListView.builder(
                      controller: scroll,
                      itemCount: filtered.length,
                      itemBuilder: (_, idx) {
                        final ex = filtered[idx];
                        return ListTile(
                          title: Text(
                            ex.name,
                            style: TextStyle(
                              color: HunterTheme.textPrimary,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                          subtitle: Text(
                            '${ex.muscleGroup.toUpperCase()} • ${ex.equipment.toUpperCase()}',
                            style: TextStyle(
                              color: HunterTheme.cyanLight,
                              fontSize: 11,
                            ),
                          ),
                          trailing: Icon(Icons.add_circle_outline,
                              color: HunterTheme.cyan),
                          onTap: () {
                            Navigator.of(ctx).pop();
                            _addExercise(ex);
                          },
                        );
                      },
                    ),
                  ),
                ],
              ),
            ),
          );
        },
      ),
    );
  }

  Future<void> _finishWorkout() async {
    final completedSets = <WorkoutSetModel>[];
    for (final b in _blocks) {
      for (final s in b.sets) {
        if (s.completed && (s.weight > 0 || s.reps > 0)) {
          completedSets.add(s);
        }
      }
    }

    if (completedSets.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          backgroundColor: HunterTheme.crimson,
          content: Text('Check off at least 1 working set with weight/reps first.'),
        ),
      );
      return;
    }

    setState(() => _finishing = true);
    try {
      if (_saveAsTemplate && _blocks.isNotEmpty) {
        await ref.read(workoutProvider.notifier).saveTemplate(
              name: widget.workoutName,
              exerciseIds: _blocks.map((b) => b.exercise.id).toList(),
            );
      }

      final outcome = await ref.read(workoutProvider.notifier).finishSession(
            sessionId: _sessionId,
            workoutName: widget.workoutName,
            completedSets: completedSets,
            notes: _notesController.text.trim(),
          );
      await ref.read(questsProvider.notifier).loadQuests();
      await ref.read(roadmapProvider.notifier).loadRoadmap();

      if (!mounted) return;
      await SystemWindowDialog.show(
        context,
        headerTag: 'DUNGEON TRAINING CLEARED',
        title: outcome.offline ? 'WORKOUT SAVED OFFLINE' : '+${outcome.xpEarned} XP EARNED',
        body:
            'Total Volume: ${outcome.totalVolume} kg across ${outcome.totalSets} sets.${outcome.offline ? '\nWill sync automatically when back online.' : ''}',
        tone: SystemWindowTone.gold,
        icon: Icons.fitness_center_rounded,
      );

      if (outcome.newlyUnlockedShadows.isNotEmpty && mounted) {
        await SystemWindowDialog.showShadowArise(
          context,
          shadowIds: outcome.newlyUnlockedShadows,
        );
      }
      if (outcome.levelUp && outcome.newLevel != null && mounted) {
        await SystemWindowDialog.showLevelUp(
          context,
          newLevel: outcome.newLevel!,
        );
      }

      if (mounted) Navigator.of(context).pop(true);
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          backgroundColor: HunterTheme.crimson,
          content: Text(extractApiError(e, 'Failed to save workout session')),
        ),
      );
    } finally {
      if (mounted) setState(() => _finishing = false);
    }
  }

  String _formatElapsed(int totalSeconds) {
    final m = (totalSeconds ~/ 60).toString().padLeft(2, '0');
    final s = (totalSeconds % 60).toString().padLeft(2, '0');
    return '$m:$s';
  }

  String _shortSetType(String setType) {
    switch (setType) {
      case 'warmup':
        return 'W';
      case 'dropset':
        return 'D';
      case 'failure':
        return 'F';
      default:
        return 'N';
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: HunterTheme.abyss,
      appBar: AppBar(
        backgroundColor: HunterTheme.abyss,
        elevation: 0,
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              widget.workoutName.toUpperCase(),
              style: TextStyle(
                color: HunterTheme.textPrimary,
                fontWeight: FontWeight.w900,
                fontSize: 15,
                letterSpacing: 1.1,
              ),
            ),
            Text(
              'ELAPSED ${_formatElapsed(_elapsedSeconds)}',
              style: TextStyle(
                color: HunterTheme.cyanLight,
                fontSize: 11,
                fontWeight: FontWeight.bold,
              ),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: _finishing ? null : _finishWorkout,
            child: Text(
              _finishing ? 'SAVING...' : 'FINISH',
              style: TextStyle(
                color: HunterTheme.emeraldLight,
                fontWeight: FontWeight.w900,
                fontSize: 13.5,
              ),
            ),
          ),
        ],
      ),
      body: Column(
        children: [
          // Rest Countdown Timer Bar
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            decoration: BoxDecoration(
              color: HunterTheme.surface,
              border: Border(
                bottom: BorderSide(color: HunterTheme.cyan.withValues(alpha: 0.25)),
              ),
            ),
            child: Row(
              children: [
                Icon(
                  Icons.timer_outlined,
                  size: 18,
                  color: _restRemainingSeconds > 0
                      ? HunterTheme.gold
                      : HunterTheme.textMuted,
                ),
                const SizedBox(width: 8),
                Text(
                  _restRemainingSeconds > 0
                      ? 'REST: ${_formatElapsed(_restRemainingSeconds)}'
                      : 'REST TIMER READY',
                  style: TextStyle(
                    color: _restRemainingSeconds > 0
                        ? HunterTheme.gold
                        : HunterTheme.textMuted,
                    fontWeight: FontWeight.w900,
                    fontSize: 12,
                  ),
                ),
                const Spacer(),
                for (final preset in [60, 90, 120])
                  Padding(
                    padding: const EdgeInsets.only(left: 6),
                    child: ActionChip(
                      label: Text('${preset}s'),
                      backgroundColor: _defaultRestSeconds == preset
                          ? HunterTheme.cyan.withValues(alpha: 0.22)
                          : HunterTheme.abyss,
                      labelStyle: TextStyle(
                        color: _defaultRestSeconds == preset
                            ? HunterTheme.cyanLight
                            : HunterTheme.textMuted,
                        fontSize: 10.5,
                        fontWeight: FontWeight.bold,
                      ),
                      onPressed: () {
                        setState(() => _defaultRestSeconds = preset);
                        _startRestTimer(preset);
                      },
                    ),
                  ),
                if (_restRemainingSeconds > 0)
                  IconButton(
                    icon: Icon(Icons.close, size: 18, color: HunterTheme.crimson),
                    onPressed: () {
                      _restTimer?.cancel();
                      setState(() => _restRemainingSeconds = 0);
                    },
                  ),
              ],
            ),
          ),

          Expanded(
            child: ListView(
              padding: const EdgeInsets.all(16),
              children: [
                if (_blocks.isEmpty)
                  Container(
                    padding: const EdgeInsets.all(24),
                    decoration: BoxDecoration(
                      color: HunterTheme.surface,
                      borderRadius: BorderRadius.circular(14),
                      border: Border.all(
                          color: HunterTheme.cyan.withValues(alpha: 0.25)),
                    ),
                    child: Column(
                      children: [
                        Icon(Icons.fitness_center, color: HunterTheme.cyan, size: 40),
                        SizedBox(height: 10),
                        Text(
                          'NO EXERCISES QUEUED',
                          style: TextStyle(
                            color: HunterTheme.cyanLight,
                            fontWeight: FontWeight.w900,
                          ),
                        ),
                        SizedBox(height: 4),
                        Text(
                          'Tap "+ ADD EXERCISE" below to start logging sets and tracking 1RM PRs.',
                          textAlign: TextAlign.center,
                          style: TextStyle(color: HunterTheme.textMuted, fontSize: 12),
                        ),
                      ],
                    ),
                  ),

                ..._blocks.asMap().entries.map((blockEntry) {
                  final bIndex = blockEntry.key;
                  final block = blockEntry.value;
                  final hint = block.beatLastHint;

                  return Container(
                    margin: const EdgeInsets.only(bottom: 14),
                    padding: const EdgeInsets.all(14),
                    decoration: BoxDecoration(
                      color: HunterTheme.surface,
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(
                          color: HunterTheme.cyan.withValues(alpha: 0.3)),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Expanded(
                              child: Text(
                                block.exercise.name,
                                style: TextStyle(
                                  color: HunterTheme.cyanLight,
                                  fontWeight: FontWeight.w900,
                                  fontSize: 15,
                                ),
                              ),
                            ),
                            IconButton(
                              icon: Icon(Icons.delete_outline,
                                  size: 18, color: HunterTheme.textMuted),
                              onPressed: () {
                                setState(() => _blocks.removeAt(bIndex));
                                _persistDraft();
                              },
                            ),
                          ],
                        ),
                        if (block.coachTargetHint != null) ...[
                          Container(
                            padding: const EdgeInsets.symmetric(
                                horizontal: 8, vertical: 5),
                            margin: const EdgeInsets.only(bottom: 6),
                            decoration: BoxDecoration(
                              color: block.coachMode == 'deload'
                                  ? HunterTheme.purple.withValues(alpha: 0.16)
                                  : HunterTheme.gold.withValues(alpha: 0.14),
                              borderRadius: BorderRadius.circular(6),
                              border: Border.all(
                                  color: block.coachMode == 'deload'
                                      ? HunterTheme.purple
                                      : HunterTheme.gold.withValues(alpha: 0.5)),
                            ),
                            child: Text(
                              block.coachTargetHint!,
                              style: TextStyle(
                                color: block.coachMode == 'deload'
                                    ? HunterTheme.purple
                                    : HunterTheme.gold,
                                fontSize: 10.5,
                                fontWeight: FontWeight.w900,
                              ),
                            ),
                          ),
                        ],
                        if (hint != null) ...[
                          Container(
                            padding: const EdgeInsets.symmetric(
                                horizontal: 8, vertical: 4),
                            margin: const EdgeInsets.only(bottom: 10),
                            decoration: BoxDecoration(
                              color: HunterTheme.cyan.withValues(alpha: 0.12),
                              borderRadius: BorderRadius.circular(6),
                              border: Border.all(
                                  color: HunterTheme.cyan.withValues(alpha: 0.35)),
                            ),
                            child: Text(
                              hint,
                              style: TextStyle(
                                color: HunterTheme.cyanLight,
                                fontSize: 10.5,
                                fontWeight: FontWeight.w800,
                              ),
                            ),
                          ),
                        ],
                        Row(
                          children: [
                            SizedBox(width: 26, child: Text('SET', style: TextStyle(color: HunterTheme.textMuted, fontSize: 10, fontWeight: FontWeight.bold))),
                            SizedBox(width: 34, child: Text('TYPE', style: TextStyle(color: HunterTheme.textMuted, fontSize: 10, fontWeight: FontWeight.bold))),
                            Expanded(child: Text('KG', style: TextStyle(color: HunterTheme.textMuted, fontSize: 10, fontWeight: FontWeight.bold))),
                            SizedBox(width: 8),
                            Expanded(child: Text('REPS', style: TextStyle(color: HunterTheme.textMuted, fontSize: 10, fontWeight: FontWeight.bold))),
                            SizedBox(width: 44, child: Text('RPE', textAlign: TextAlign.center, style: TextStyle(color: HunterTheme.textMuted, fontSize: 10, fontWeight: FontWeight.bold))),
                            SizedBox(width: 34),
                          ],
                        ),
                        const SizedBox(height: 6),
                        ...block.sets.asMap().entries.map((setEntry) {
                          final sIdx = setEntry.key;
                          final s = setEntry.value;
                          final isPr = ActiveWorkoutScreen.isNewPrBreakthrough(
                            weight: s.weight,
                            reps: s.reps,
                            previousBest1RM: block.baseline1RM,
                          );

                          return Dismissible(
                            key: ValueKey('${block.exercise.id}_${s.setNumber}_$sIdx'),
                            direction: DismissDirection.endToStart,
                            background: Container(
                              alignment: Alignment.centerRight,
                              padding: const EdgeInsets.only(right: 12),
                              color: HunterTheme.crimson.withValues(alpha: 0.3),
                              child: Icon(Icons.delete, color: HunterTheme.crimson, size: 18),
                            ),
                            onDismissed: (_) {
                              setState(() {
                                block.sets.removeAt(sIdx);
                                for (int i = 0; i < block.sets.length; i++) {
                                  block.sets[i] = block.sets[i].copyWith(setNumber: i + 1);
                                }
                              });
                              _persistDraft();
                            },
                            child: Padding(
                              padding: const EdgeInsets.symmetric(vertical: 4),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Row(
                                    children: [
                                      SizedBox(
                                        width: 26,
                                        child: Text(
                                          '${s.setNumber}',
                                          style: TextStyle(
                                            color: HunterTheme.textPrimary,
                                            fontWeight: FontWeight.w900,
                                          ),
                                        ),
                                      ),
                                      InkWell(
                                        onTap: () {
                                          final curIdx = _setTypes.indexOf(s.setType);
                                          final nextType =
                                              _setTypes[(curIdx + 1) % _setTypes.length];
                                          setState(() {
                                            block.sets[sIdx] =
                                                s.copyWith(setType: nextType);
                                          });
                                          _persistDraft();
                                        },
                                        child: Container(
                                          width: 28,
                                          height: 28,
                                          alignment: Alignment.center,
                                          margin: const EdgeInsets.only(right: 6),
                                          decoration: BoxDecoration(
                                            color: HunterTheme.abyss,
                                            borderRadius: BorderRadius.circular(6),
                                            border: Border.all(
                                              color: s.setType == 'failure'
                                                  ? HunterTheme.crimson
                                                  : HunterTheme.cyan.withValues(alpha: 0.4),
                                            ),
                                          ),
                                          child: Text(
                                            _shortSetType(s.setType),
                                            style: TextStyle(
                                              color: s.setType == 'failure'
                                                  ? HunterTheme.crimson
                                                  : HunterTheme.cyanLight,
                                              fontWeight: FontWeight.w900,
                                              fontSize: 11,
                                            ),
                                          ),
                                        ),
                                      ),
                                      Expanded(
                                        child: TextFormField(
                                          initialValue: s.weight > 0
                                              ? s.weight.toStringAsFixed(s.weight % 1 == 0 ? 0 : 1)
                                              : '',
                                          keyboardType: const TextInputType.numberWithOptions(
                                              decimal: true),
                                          style: TextStyle(
                                            color: HunterTheme.textPrimary,
                                            fontSize: 13,
                                            fontWeight: FontWeight.bold,
                                          ),
                                          decoration: InputDecoration(
                                            isDense: true,
                                            contentPadding: const EdgeInsets.symmetric(
                                                horizontal: 8, vertical: 8),
                                            filled: true,
                                            fillColor: HunterTheme.abyss,
                                            border: OutlineInputBorder(
                                              borderRadius: BorderRadius.circular(8),
                                              borderSide: BorderSide.none,
                                            ),
                                          ),
                                          onChanged: (v) {
                                            final parsed = double.tryParse(v) ?? 0;
                                            setState(() {
                                              block.sets[sIdx] = s.copyWith(weight: parsed);
                                            });
                                            _persistDraft();
                                          },
                                        ),
                                      ),
                                      const SizedBox(width: 8),
                                      Expanded(
                                        child: TextFormField(
                                          initialValue: s.reps > 0 ? '${s.reps}' : '',
                                          keyboardType: TextInputType.number,
                                          style: TextStyle(
                                            color: HunterTheme.textPrimary,
                                            fontSize: 13,
                                            fontWeight: FontWeight.bold,
                                          ),
                                          decoration: InputDecoration(
                                            isDense: true,
                                            contentPadding: const EdgeInsets.symmetric(
                                                horizontal: 8, vertical: 8),
                                            filled: true,
                                            fillColor: HunterTheme.abyss,
                                            border: OutlineInputBorder(
                                              borderRadius: BorderRadius.circular(8),
                                              borderSide: BorderSide.none,
                                            ),
                                          ),
                                          onChanged: (v) {
                                            final parsed = int.tryParse(v) ?? 0;
                                            setState(() {
                                              block.sets[sIdx] = s.copyWith(reps: parsed);
                                            });
                                            _persistDraft();
                                          },
                                        ),
                                      ),
                                      SizedBox(
                                        width: 44,
                                        child: TextButton(
                                          onPressed: () {
                                            final nextRpe =
                                                s.rpe == null || s.rpe! >= 10 ? 7 : s.rpe! + 1;
                                            setState(() {
                                              block.sets[sIdx] = s.copyWith(rpe: nextRpe);
                                            });
                                            _persistDraft();
                                          },
                                          child: Text(
                                            s.rpe?.toString() ?? '-',
                                            style: TextStyle(
                                              color: HunterTheme.gold,
                                              fontWeight: FontWeight.bold,
                                              fontSize: 12,
                                            ),
                                          ),
                                        ),
                                      ),
                                      SizedBox(
                                        width: 34,
                                        child: IconButton(
                                          padding: EdgeInsets.zero,
                                          icon: Icon(
                                            s.completed
                                                ? Icons.check_circle
                                                : Icons.radio_button_unchecked,
                                            color: s.completed
                                                ? HunterTheme.emerald
                                                : HunterTheme.textMuted,
                                          ),
                                          onPressed: () {
                                            HapticFeedback.selectionClick();
                                            final nowDone = !s.completed;
                                            setState(() {
                                              block.sets[sIdx] = s.copyWith(
                                                completed: nowDone,
                                                isPersonalRecord: isPr,
                                              );
                                            });
                                            if (nowDone) _startRestTimer();
                                            _persistDraft();
                                          },
                                        ),
                                      ),
                                    ],
                                  ),
                                  if (isPr)
                                    Padding(
                                      padding: const EdgeInsets.only(left: 26, top: 2),
                                      child: Container(
                                        padding: const EdgeInsets.symmetric(
                                            horizontal: 6, vertical: 2),
                                        decoration: BoxDecoration(
                                          color: HunterTheme.gold.withValues(alpha: 0.2),
                                          borderRadius: BorderRadius.circular(4),
                                          border: Border.all(color: HunterTheme.gold),
                                        ),
                                        child: Text(
                                          'NEW PR! Est. 1RM ${s.estimated1RM.toStringAsFixed(1)} kg',
                                          style: TextStyle(
                                            color: HunterTheme.gold,
                                            fontSize: 9.5,
                                            fontWeight: FontWeight.w900,
                                          ),
                                        ),
                                      ),
                                    ),
                                ],
                              ),
                            ),
                          );
                        }),
                        const SizedBox(height: 8),
                        SizedBox(
                          width: double.infinity,
                          child: OutlinedButton.icon(
                            onPressed: () {
                              final prev =
                                  block.sets.isNotEmpty ? block.sets.last : null;
                              setState(() {
                                block.sets.add(
                                  WorkoutSetModel(
                                    exerciseId: block.exercise.id,
                                    setNumber: block.sets.length + 1,
                                    weight: prev?.weight ?? 0,
                                    reps: prev?.reps ?? 0,
                                    completed: false,
                                  ),
                                );
                              });
                              _persistDraft();
                            },
                            icon: const Icon(Icons.add, size: 16),
                            label: const Text('+ ADD SET'),
                            style: OutlinedButton.styleFrom(
                              foregroundColor: HunterTheme.cyanLight,
                              side: BorderSide(
                                  color: HunterTheme.cyan.withValues(alpha: 0.35)),
                            ),
                          ),
                        ),
                      ],
                    ),
                  );
                }),

                // Add Exercise Button
                ElevatedButton.icon(
                  onPressed: _openExercisePicker,
                  icon: const Icon(Icons.add),
                  label: const Text(
                    'ADD EXERCISE',
                    style: TextStyle(fontWeight: FontWeight.w900, letterSpacing: 1.1),
                  ),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: HunterTheme.cyan,
                    foregroundColor: Colors.black,
                    padding: const EdgeInsets.symmetric(vertical: 14),
                    shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12)),
                  ),
                ),

                const SizedBox(height: 16),
                TextField(
                  controller: _notesController,
                  maxLines: 2,
                  style: TextStyle(color: HunterTheme.textPrimary, fontSize: 13),
                  decoration: InputDecoration(
                    labelText: 'Session Notes (Optional)',
                    labelStyle: TextStyle(color: HunterTheme.textMuted),
                    filled: true,
                    fillColor: HunterTheme.surface,
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                      borderSide: BorderSide.none,
                    ),
                  ),
                  onChanged: (_) => _persistDraft(),
                ),
                SwitchListTile(
                  contentPadding: EdgeInsets.zero,
                  title: Text(
                    'Save workout exercises as custom template',
                    style: TextStyle(color: HunterTheme.textMuted, fontSize: 12.5),
                  ),
                  activeThumbColor: HunterTheme.cyan,
                  value: _saveAsTemplate,
                  onChanged: (v) => setState(() => _saveAsTemplate = v),
                ),
                const SizedBox(height: 24),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
