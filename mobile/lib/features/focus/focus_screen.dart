import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:dio/dio.dart';
import '../../core/theme/hunter_theme.dart';
import '../../core/api/api_client.dart';
import '../../core/api/api_endpoints.dart';
import '../../core/providers/auth_provider.dart';
import '../../core/sync/sync_queue.dart';
import '../../models/user_model.dart';

class FocusScreen extends ConsumerStatefulWidget {
  const FocusScreen({super.key});

  @override
  ConsumerState<FocusScreen> createState() => _FocusScreenState();
}

class _FocusScreenState extends ConsumerState<FocusScreen> {
  int _selectedMinutes = 25;
  int _remainingSeconds = 25 * 60;
  bool _isRunning = false;
  Timer? _timer;
  final Stopwatch _stopwatch = Stopwatch();
  String? _serverSessionId;

  @override
  void dispose() {
    _timer?.cancel();
    _stopwatch.stop();
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
      if (_serverSessionId == null) {
        try {
          final dio = await ApiClient.getInstance();
          final startRes = await dio.post(
            ApiEndpoints.focusStart,
            data: {
              'duration': _selectedMinutes,
              'task': 'Air-Gap Deep Work Protocol',
              'backgroundType': 'ambient_cyber',
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
    });
  }

  Future<void> _claimReward(BuildContext dialogContext) async {
    Navigator.of(dialogContext, rootNavigator: true).pop();
    final earnedXp = (_selectedMinutes ~/ 20) * 100 > 0 ? (_selectedMinutes ~/ 20) * 100 : 50;
    final earnedCoins = _selectedMinutes;
    final sessionId = _serverSessionId ?? 'session_${DateTime.now().millisecondsSinceEpoch}';

    try {
      final dio = await ApiClient.getInstance();
      final response = await dio.post(
        ApiEndpoints.focusComplete,
        data: {
          'sessionId': sessionId,
          'duration': _selectedMinutes,
          'task': 'Air-Gap Deep Work Protocol',
          'backgroundType': 'ambient_cyber',
        },
      );

      if (response.statusCode == 200 && response.data != null) {
        final data = response.data;
        if (data is Map<String, dynamic> && data['user'] != null) {
          final updatedUser = UserModel.fromJson(data['user'] as Map<String, dynamic>);
          ref.read(authProvider.notifier).updateUser(updatedUser);
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
          side: const BorderSide(color: HunterTheme.cyanLight, width: 1.5),
        ),
        title: const Text(
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
            const Icon(Icons.verified, color: HunterTheme.cyan, size: 60),
            const SizedBox(height: 16),
            Text(
              'Deep work session verified.\n+$_selectedMinutes Coins  •  +${(_selectedMinutes ~/ 20) * 100 > 0 ? (_selectedMinutes ~/ 20) * 100 : 50} XP',
              textAlign: TextAlign.center,
              style: const TextStyle(color: HunterTheme.textPrimary, fontSize: 16, height: 1.4),
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
    final progress = 1.0 - (_remainingSeconds / (_selectedMinutes * 60));

    return Scaffold(
      backgroundColor: HunterTheme.abyss,
      appBar: AppBar(
        backgroundColor: HunterTheme.abyss,
        elevation: 0,
        title: const Text(
          'AIR-GAP FOCUS',
          style: TextStyle(
            color: HunterTheme.cyanLight,
            fontWeight: FontWeight.bold,
            letterSpacing: 2,
            fontSize: 18,
          ),
        ),
      ),
      body: Center(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 24),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
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
                      valueColor: const AlwaysStoppedAnimation<Color>(HunterTheme.cyan),
                    ),
                  ),
                  Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Text(
                        _formatTime(_remainingSeconds),
                        style: const TextStyle(
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

              // Duration Presets
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [25, 45, 60, 90].map((mins) {
                  final isSelected = _selectedMinutes == mins;
                  return Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 6),
                    child: ChoiceChip(
                      label: Text('${mins}m'),
                      selected: isSelected,
                      onSelected: _isRunning ? null : (_) => _resetTimer(mins),
                      backgroundColor: HunterTheme.surface,
                      selectedColor: HunterTheme.cyan,
                      labelStyle: TextStyle(
                        color: isSelected ? Colors.black : HunterTheme.textPrimary,
                        fontWeight: FontWeight.bold,
                      ),
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
    );
  }
}
