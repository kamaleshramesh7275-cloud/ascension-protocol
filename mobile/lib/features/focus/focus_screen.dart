import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:dio/dio.dart';
import '../../core/theme/hunter_theme.dart';
import '../../core/api/api_client.dart';
import '../../core/api/api_endpoints.dart';
import '../../core/providers/appearance_provider.dart';
import '../../core/providers/auth_provider.dart';
import '../../core/providers/quests_provider.dart';
import '../../core/providers/roadmap_provider.dart';
import '../../core/services/system_audio_service.dart';
import '../../core/sync/sync_queue.dart';
import '../../core/widgets/system_window_dialog.dart';
import '../../models/quest_model.dart';
import '../../models/user_model.dart';

class FocusScreen extends ConsumerStatefulWidget {
  final String? initialQuestId;
  final String? initialTask;
  final int? initialDurationMinutes;
  final String? initialRoadmapTaskId;

  const FocusScreen({
    super.key,
    this.initialQuestId,
    this.initialTask,
    this.initialDurationMinutes,
    this.initialRoadmapTaskId,
  });

  @override
  ConsumerState<FocusScreen> createState() => _FocusScreenState();
}

class _FocusScreenState extends ConsumerState<FocusScreen>
    with WidgetsBindingObserver {
  int _selectedMinutes = 25;
  int _remainingSeconds = 25 * 60;
  bool _isRunning = false;
  Timer? _timer;
  final Stopwatch _stopwatch = Stopwatch();
  String? _serverSessionId;
  String? _selectedQuestId;
  String? _selectedRoadmapTaskId;
  int _breachCount = 0;
  final TextEditingController _intentionController = TextEditingController();
  final TextEditingController _outputNoteController = TextEditingController();

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    _selectedQuestId = widget.initialQuestId;
    _selectedRoadmapTaskId = widget.initialRoadmapTaskId;
    if (widget.initialDurationMinutes != null) {
      _selectedMinutes = widget.initialDurationMinutes!.clamp(5, 120);
      _remainingSeconds = _selectedMinutes * 60;
    }
    if (widget.initialTask != null && widget.initialTask!.trim().isNotEmpty) {
      _intentionController.text = widget.initialTask!.trim();
    }
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (_isRunning && state == AppLifecycleState.paused) {
      unawaited(SystemAudioService.playCue(
        SystemSfxCue.breachGlitch,
        haptic: SystemHapticPattern.criticalWarning,
      ));
      if (mounted) {
        setState(() => _breachCount++);
      }
    }
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    _timer?.cancel();
    _stopwatch.stop();
    _intentionController.dispose();
    _outputNoteController.dispose();
    super.dispose();
  }

  Future<void> _toggleTimer() async {
    HapticFeedback.heavyImpact();
    if (_isRunning) {
      _stopwatch.stop();
      _timer?.cancel();
      setState(() => _isRunning = false);
    } else {
      // 1. Initialize validated session with server if not already started
      final intention = _intentionController.text.trim().isNotEmpty
          ? _intentionController.text.trim()
          : 'Air-Gap Deep Work Protocol';
      if (_serverSessionId == null) {
        try {
          final dio = await ApiClient.getInstance();
          final startRes = await dio.post(
            ApiEndpoints.focusStart,
            data: {
              'duration': _selectedMinutes,
              'task': intention,
              'backgroundType': 'ambient_cyber',
              if (_selectedQuestId != null) 'questId': _selectedQuestId,
              if (_selectedRoadmapTaskId != null) 'roadmapTaskId': _selectedRoadmapTaskId,
            },
          );
          if (startRes.statusCode == 200 && startRes.data != null) {
            _serverSessionId = startRes.data['sessionId']?.toString();
          }
        } catch (_) {
          // If offline, generate client session ID for sync queue
          _serverSessionId = 'offline_session_${DateTime.now().millisecondsSinceEpoch}';
        }
      }

      // 2. Start monotonic stopwatch
      _stopwatch.start();
      final totalTargetSeconds = _selectedMinutes * 60;
      setState(() => _isRunning = true);

      _timer?.cancel();
      _timer = Timer.periodic(const Duration(seconds: 1), (timer) {
        if (!mounted) {
          timer.cancel();
          return;
        }

        final elapsedSeconds = _stopwatch.elapsed.inSeconds;
        final remaining = totalTargetSeconds - elapsedSeconds;

        if (remaining > 0) {
          setState(() => _remainingSeconds = remaining);
        } else {
          timer.cancel();
          _stopwatch.stop();
          setState(() {
            _remainingSeconds = 0;
            _isRunning = false;
          });
          HapticFeedback.vibrate();
          _showSessionComplete();
        }
      });
    }
  }

  void _resetTimer(int minutes) {
    HapticFeedback.selectionClick();
    _timer?.cancel();
    _stopwatch.reset();
    _stopwatch.stop();
    setState(() {
      _selectedMinutes = minutes;
      _remainingSeconds = minutes * 60;
      _isRunning = false;
      _serverSessionId = null;
      _breachCount = 0;
    });
  }

  Future<void> _claimReward(BuildContext dialogContext) async {
    Navigator.of(dialogContext, rootNavigator: true).pop();
    final earnedXp = (_selectedMinutes ~/ 20) * 100 > 0 ? (_selectedMinutes ~/ 20) * 100 : 50;
    final earnedCoins = _selectedMinutes;
    final sessionId = _serverSessionId ?? 'session_${DateTime.now().millisecondsSinceEpoch}';
    final intention = _intentionController.text.trim().isNotEmpty
        ? _intentionController.text.trim()
        : 'Air-Gap Deep Work Protocol';
    final outputNote = _outputNoteController.text.trim();

    try {
      final dio = await ApiClient.getInstance();
      final response = await dio.post(
        ApiEndpoints.focusComplete,
        data: {
          'sessionId': sessionId,
          'duration': _selectedMinutes,
          'task': intention,
          'backgroundType': 'ambient_cyber',
          'outputNote': outputNote,
          'breachCount': _breachCount,
        },
      );

      if (response.statusCode == 200 && response.data != null) {
        final data = response.data;
        if (data is Map<String, dynamic> && data['user'] != null) {
          final updatedUser = UserModel.fromJson(data['user'] as Map<String, dynamic>);
          ref.read(authProvider.notifier).updateUser(updatedUser);
        }
        await ref.read(questsProvider.notifier).loadQuests();
        await ref.read(roadmapProvider.notifier).loadRoadmap();
        if (data is Map<String, dynamic> && mounted) {
          if (data['penaltyCleared'] == true) {
            await SystemWindowDialog.show(
              context,
              headerTag: 'SURVIVAL CLEARED',
              title: 'PENALTY ZONE ESCAPED',
              body: '15+ minute Focus protocol verified. Shop access restored.',
              tone: SystemWindowTone.cyan,
              icon: Icons.verified_user,
            );
          }
          final shadows = data['newlyUnlockedShadows'] is List
              ? (data['newlyUnlockedShadows'] as List).map((e) => e.toString()).toList()
              : const <String>[];
          if (shadows.isNotEmpty && mounted) {
            await SystemWindowDialog.showShadowArise(context, shadowIds: shadows);
          }
          final aiReview = data['aiReview']?.toString();
          final nextStep = data['nextMicroStep']?.toString();
          final qualityScore = (data['qualityScore'] as num?)?.toInt();
          if (aiReview != null && aiReview.isNotEmpty && mounted) {
            await SystemWindowDialog.show(
              context,
              headerTag: qualityScore != null
                  ? 'COACH REVIEW • $qualityScore/100'
                  : 'COACH DELIVERABLE REVIEW',
              title: 'DELIVERABLE EVALUATED',
              body: nextStep != null && nextStep.isNotEmpty
                  ? '$aiReview\n\nNext Micro-Step:\n$nextStep'
                  : aiReview,
              tone: SystemWindowTone.cyan,
              icon: Icons.auto_awesome,
            );
          }
          if (data['levelUp'] == true && data['newLevel'] != null && mounted) {
            await SystemWindowDialog.showLevelUp(
              context,
              newLevel: (data['newLevel'] as num).toInt(),
            );
          }
        }
      }
    } on DioException catch (e) {
      if (ApiClient.isOffline(e)) {
        // Enqueue to persistent sync queue
        await SyncQueueService.enqueue(
          PendingOperation(
            id: 'focus_${DateTime.now().millisecondsSinceEpoch}',
            type: SyncOpType.completeFocus,
            endpoint: ApiEndpoints.focusComplete,
            payload: {
              'sessionId': sessionId,
              'duration': _selectedMinutes,
            },
            createdAt: DateTime.now(),
          ),
        );

        // Optimistic local progression
        final currentUser = ref.read(authProvider).value;
        if (currentUser != null) {
          final updatedLocalUser = currentUser.copyWith(
            xp: currentUser.xp + earnedXp,
            coins: currentUser.coins + earnedCoins,
          );
          ref.read(authProvider.notifier).updateUser(updatedLocalUser);
        }
      }
    } catch (_) {}

    _resetTimer(_selectedMinutes);
  }

  void _showSessionComplete() {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (dialogCtx) => AlertDialog(
        backgroundColor: HunterTheme.surface,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(20),
          side: BorderSide(color: HunterTheme.cyanLight, width: 1.5),
        ),
        title: Text(
          'PROTOCOL COMPLETED',
          style: TextStyle(
            color: HunterTheme.cyanLight,
            fontWeight: FontWeight.bold,
            letterSpacing: 1.5,
          ),
          textAlign: TextAlign.center,
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(Icons.verified, color: HunterTheme.cyan, size: 54),
            const SizedBox(height: 12),
            Text(
              'Deep work session verified (Interruptions: $_breachCount).\n+$_selectedMinutes Coins  •  +${(_selectedMinutes ~/ 20) * 100 > 0 ? (_selectedMinutes ~/ 20) * 100 : 50} XP',
              textAlign: TextAlign.center,
              style: TextStyle(color: HunterTheme.textPrimary, fontSize: 14, height: 1.4),
            ),
            const SizedBox(height: 14),
            TextField(
              controller: _outputNoteController,
              style: TextStyle(color: HunterTheme.textPrimary, fontSize: 13),
              maxLines: 2,
              decoration: InputDecoration(
                labelText: 'What concrete thing did you finish?',
                labelStyle: TextStyle(color: HunterTheme.cyanLight, fontSize: 12),
                hintText: 'e.g., Finished Ch.4 notes & 15 practice problems',
                hintStyle: TextStyle(color: HunterTheme.textMuted, fontSize: 11.5),
                filled: true,
                fillColor: HunterTheme.surfaceLight,
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(10),
                  borderSide: BorderSide.none,
                ),
              ),
            ),
          ],
        ),
        actions: [
          Center(
            child: ElevatedButton(
              onPressed: () => _claimReward(dialogCtx),
              style: ElevatedButton.styleFrom(
                backgroundColor: HunterTheme.cyan,
                foregroundColor: Colors.black,
                padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 12),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              ),
              child: const Text('CLAIM REWARD', style: TextStyle(fontWeight: FontWeight.bold)),
            ),
          ),
        ],
      ),
    );
  }

  String _formatTime(int totalSeconds) {
    final mins = (totalSeconds ~/ 60).toString().padLeft(2, '0');
    final secs = (totalSeconds % 60).toString().padLeft(2, '0');
    return '$mins:$secs';
  }

  @override
  Widget build(BuildContext context) {
    ref.watch(appearanceProvider);
    final progress = 1.0 - (_remainingSeconds / (_selectedMinutes * 60));

    return Scaffold(
      backgroundColor: HunterTheme.abyss,
      appBar: AppBar(
        backgroundColor: HunterTheme.abyss,
        elevation: 0,
        title: Text(
          'AIR-GAP FOCUS',
          style: TextStyle(
            color: HunterTheme.cyanLight,
            fontWeight: FontWeight.bold,
            letterSpacing: 2,
            fontSize: 18,
          ),
        ),
      ),
      body: LayoutBuilder(
        builder: (context, constraints) => SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 20),
          child: ConstrainedBox(
            constraints: BoxConstraints(minHeight: (constraints.maxHeight - 40).clamp(0.0, double.infinity)),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.spaceEvenly,
              children: [
              // Pre-Session Intention & Linked Quest Selector
              if (!_isRunning) ...[
                Builder(builder: (ctx) {
                  final pendingQuests = ref
                      .watch(questsProvider)
                      .where((q) => !q.completed)
                      .toList();
                  return Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      if (pendingQuests.isNotEmpty)
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 12),
                          decoration: BoxDecoration(
                            color: HunterTheme.surface,
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(
                                color: HunterTheme.cyan.withValues(alpha: 0.3)),
                          ),
                          child: DropdownButtonHideUnderline(
                            child: DropdownButton<String?>(
                              isExpanded: true,
                              dropdownColor: HunterTheme.surface,
                              value: pendingQuests.any((q) => q.id == _selectedQuestId)
                                  ? _selectedQuestId
                                  : null,
                              hint: Text(
                                'Link to a Quest (auto-completes when done)',
                                style: TextStyle(
                                    color: HunterTheme.textMuted, fontSize: 12),
                              ),
                              items: [
                                DropdownMenuItem<String?>(
                                  value: null,
                                  child: Text('Custom Focus Session',
                                      style: TextStyle(
                                          color: HunterTheme.textPrimary,
                                          fontSize: 12.5)),
                                ),
                                ...pendingQuests.map((q) => DropdownMenuItem<String?>(
                                      value: q.id,
                                      child: Text(
                                        q.title,
                                        overflow: TextOverflow.ellipsis,
                                        style: TextStyle(
                                            color: HunterTheme.cyanLight,
                                            fontSize: 12.5),
                                      ),
                                    )),
                              ],
                              onChanged: (qid) {
                                QuestModel? match;
                                for (final q in pendingQuests) {
                                  if (q.id == qid) {
                                    match = q;
                                    break;
                                  }
                                }
                                setState(() {
                                  _selectedQuestId = qid;
                                  _selectedRoadmapTaskId = match?.roadmapTaskId;
                                  if (match != null) {
                                    _intentionController.text = match.title;
                                    if (match.targetMinutes != null) {
                                      _selectedMinutes = match.targetMinutes!;
                                      _remainingSeconds = _selectedMinutes * 60;
                                    }
                                  }
                                });
                              },
                            ),
                          ),
                        ),
                      const SizedBox(height: 10),
                      TextField(
                        controller: _intentionController,
                        style: TextStyle(
                            color: HunterTheme.textPrimary, fontSize: 13),
                        decoration: InputDecoration(
                          labelText: 'Session Target (1 concrete outcome)',
                          labelStyle: TextStyle(
                              color: HunterTheme.cyanLight, fontSize: 12),
                          hintText: 'e.g., Ship API auth module / Solve 10 MCQs',
                          hintStyle: TextStyle(
                              color: HunterTheme.textMuted, fontSize: 12),
                          filled: true,
                          fillColor: HunterTheme.surface,
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(12),
                            borderSide: BorderSide.none,
                          ),
                        ),
                      ),
                      if ((ref.watch(authProvider).value?.nextFocusStep ?? '')
                              .trim()
                              .isNotEmpty &&
                          _intentionController.text.trim() !=
                              ref.watch(authProvider).value?.nextFocusStep?.trim()) ...[
                        const SizedBox(height: 8),
                        ActionChip(
                          avatar: Icon(
                            Icons.auto_awesome,
                            size: 14,
                            color: HunterTheme.gold,
                          ),
                          label: Text(
                            'RESUME NEXT STEP: ${ref.watch(authProvider).value!.nextFocusStep!}',
                            overflow: TextOverflow.ellipsis,
                            style: TextStyle(
                              color: HunterTheme.gold,
                              fontSize: 11,
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                          backgroundColor: HunterTheme.surface,
                          side: BorderSide(
                            color: HunterTheme.gold.withValues(alpha: 0.45),
                          ),
                          onPressed: () {
                            setState(() {
                              _intentionController.text =
                                  ref.read(authProvider).value!.nextFocusStep!;
                            });
                          },
                        ),
                      ],
                    ],
                  );
                }),
                const SizedBox(height: 22),
              ] else ...[
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                  margin: const EdgeInsets.only(bottom: 18),
                  decoration: BoxDecoration(
                    color: HunterTheme.surface,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(
                      color: _breachCount > 0
                          ? HunterTheme.crimson.withValues(alpha: 0.6)
                          : HunterTheme.cyan.withValues(alpha: 0.35),
                    ),
                  ),
                  child: Text(
                    'TARGET: ${_intentionController.text.trim().isEmpty ? "Deep Work" : _intentionController.text.trim()}  •  App Exits: $_breachCount',
                    textAlign: TextAlign.center,
                    style: TextStyle(
                      color: _breachCount > 0 ? HunterTheme.crimson : HunterTheme.cyanLight,
                      fontSize: 12,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
              ],

              // Circular Timer Display
              Stack(
                alignment: Alignment.center,
                children: [
                  SizedBox(
                    width: 240,
                    height: 240,
                    child: CircularProgressIndicator(
                      value: progress.clamp(0.0, 1.0),
                      strokeWidth: 8,
                      backgroundColor: HunterTheme.surfaceLight,
                      valueColor: AlwaysStoppedAnimation<Color>(HunterTheme.cyan),
                    ),
                  ),
                  Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Text(
                        _formatTime(_remainingSeconds),
                        style: TextStyle(
                          fontSize: 48,
                          fontWeight: FontWeight.bold,
                          color: HunterTheme.textPrimary,
                          letterSpacing: 2,
                        ),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        _isRunning ? 'FOCUS AIR-GAP ACTIVE' : 'STANDBY',
                        style: TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.bold,
                          color: _isRunning ? HunterTheme.cyanLight : HunterTheme.textMuted,
                          letterSpacing: 1.5,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
              const SizedBox(height: 40),

              // Duration Presets (includes 5m starter sprint)
              Wrap(
                alignment: WrapAlignment.center,
                spacing: 8,
                runSpacing: 6,
                children: [5, 25, 45, 60, 90].map((mins) {
                  final isSelected = _selectedMinutes == mins;
                  return ChoiceChip(
                    label: Text('${mins}m'),
                    selected: isSelected,
                    onSelected: _isRunning ? null : (_) => _resetTimer(mins),
                    backgroundColor: HunterTheme.surface,
                    selectedColor: HunterTheme.cyan,
                    labelStyle: TextStyle(
                      color: isSelected ? Colors.black : HunterTheme.textPrimary,
                      fontWeight: FontWeight.bold,
                    ),
                  );
                }).toList(),
              ),
              const SizedBox(height: 32),

              // Primary Action Button
              SizedBox(
                width: 200,
                height: 52,
                child: ElevatedButton.icon(
                  onPressed: _toggleTimer,
                  icon: Icon(_isRunning ? Icons.pause : Icons.play_arrow),
                  label: Text(
                    _isRunning ? 'PAUSE PROTOCOL' : 'INITIALIZE FOCUS',
                    style: const TextStyle(fontWeight: FontWeight.bold, letterSpacing: 1.2),
                  ),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: _isRunning ? HunterTheme.crimson : HunterTheme.cyan,
                    foregroundColor: Colors.black,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                  ),
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
