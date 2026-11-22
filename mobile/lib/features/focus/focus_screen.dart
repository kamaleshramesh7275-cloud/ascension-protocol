import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../../core/theme/hunter_theme.dart';

class FocusScreen extends StatefulWidget {
  const FocusScreen({super.key});

  @override
  State<FocusScreen> createState() => _FocusScreenState();
}

class _FocusScreenState extends State<FocusScreen> {
  int _selectedMinutes = 25;
  int _remainingSeconds = 25 * 60;
  bool _isRunning = false;
  Timer? _timer;

  void _toggleTimer() {
    HapticFeedback.heavyImpact();
    setState(() {
      if (_isRunning) {
        _timer?.cancel();
        _isRunning = false;
      } else {
        _isRunning = true;
        _timer = Timer.periodic(const Duration(seconds: 1), (timer) {
          if (_remainingSeconds > 0) {
            setState(() => _remainingSeconds--);
          } else {
            _timer?.cancel();
            _isRunning = false;
            HapticFeedback.vibrate();
            _showSessionComplete();
          }
        });
      }
    });
  }

  void _resetTimer(int minutes) {
    HapticFeedback.selectionClick();
    _timer?.cancel();
    setState(() {
      _selectedMinutes = minutes;
      _remainingSeconds = minutes * 60;
      _isRunning = false;
    });
  }

  void _showSessionComplete() {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: HunterTheme.surface,
        title: const Text(
          'PROTOCOL COMPLETED',
          style: TextStyle(color: HunterTheme.cyanLight, fontWeight: FontWeight.bold),
        ),
        content: const Text(
          'Air-Gap Focus concluded. Your willpower and intellect have deepened.',
          style: TextStyle(color: HunterTheme.textPrimary),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('CLAIM REWARD', style: TextStyle(color: HunterTheme.cyan)),
          ),
        ],
      ),
    );
  }

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }

  String get _timeDisplay {
    final m = (_remainingSeconds ~/ 60).toString().padLeft(2, '0');
    final s = (_remainingSeconds % 60).toString().padLeft(2, '0');
    return '$m:$s';
  }

  @override
  Widget build(BuildContext context) {
    final totalSeconds = _selectedMinutes * 60;
    final progress = 1.0 - (_remainingSeconds / totalSeconds);

    return Scaffold(
      backgroundColor: HunterTheme.abyss,
      appBar: AppBar(
        backgroundColor: HunterTheme.abyss,
        elevation: 0,
        title: Text(
          'AIR-GAP FOCUS',
          style: Theme.of(context).textTheme.titleLarge?.copyWith(
                letterSpacing: 2,
                fontWeight: FontWeight.w800,
              ),
        ),
      ),
      body: Center(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 24),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              // Immersion Badge
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
                decoration: BoxDecoration(
                  color: HunterTheme.surface,
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(
                    color: _isRunning
                        ? HunterTheme.cyan
                        : HunterTheme.cyan.withValues(alpha: 0.3),
                  ),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(
                      _isRunning ? Icons.shield : Icons.lock_outline,
                      color: _isRunning ? HunterTheme.cyan : HunterTheme.textMuted,
                      size: 16,
                    ),
                    const SizedBox(width: 6),
                    Text(
                      _isRunning ? 'FOCUS PROTOCOL ENGAGED' : 'AIR-GAP STANDBY',
                      style: TextStyle(
                        color: _isRunning ? HunterTheme.cyanLight : HunterTheme.textMuted,
                        fontSize: 11,
                        fontWeight: FontWeight.bold,
                        letterSpacing: 1,
                      ),
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 40),

              // Circular Countdown Visualizer
              Stack(
                alignment: Alignment.center,
                children: [
                  SizedBox(
                    width: 240,
                    height: 240,
                    child: CircularProgressIndicator(
                      value: progress,
                      strokeWidth: 8,
                      backgroundColor: HunterTheme.surface,
                      valueColor: AlwaysStoppedAnimation<Color>(
                        _isRunning ? HunterTheme.cyan : HunterTheme.surfaceLight,
                      ),
                    ),
                  ),
                  Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Text(
                        _timeDisplay,
                        style: const TextStyle(
                          fontSize: 48,
                          fontWeight: FontWeight.bold,
                          color: HunterTheme.textPrimary,
                          letterSpacing: 2,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        _isRunning ? 'DEEP WORK IN PROGRESS' : 'SELECT DURATION',
                        style: const TextStyle(
                          fontSize: 11,
                          color: HunterTheme.textMuted,
                          letterSpacing: 1.2,
                        ),
                      ),
                    ],
                  ),
                ],
              ),

              const SizedBox(height: 40),

              // Duration Presets
              if (!_isRunning) ...[
                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [15, 25, 45, 60].map((m) {
                    final isSel = _selectedMinutes == m;
                    return Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 4),
                      child: OutlinedButton(
                        onPressed: () => _resetTimer(m),
                        style: OutlinedButton.styleFrom(
                          backgroundColor:
                              isSel ? HunterTheme.cyan : HunterTheme.surface,
                          side: BorderSide(
                            color: isSel
                                ? HunterTheme.cyan
                                : HunterTheme.cyan.withValues(alpha: 0.2),
                          ),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12),
                          ),
                        ),
                        child: Text(
                          '${m}m',
                          style: TextStyle(
                            color: isSel ? Colors.black : HunterTheme.textPrimary,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                    );
                  }).toList(),
                ),
              ],

              const SizedBox(height: 30),

              // Big Action Button
              SizedBox(
                width: double.infinity,
                height: 56,
                child: ElevatedButton.icon(
                  onPressed: _toggleTimer,
                  icon: Icon(
                    _isRunning ? Icons.pause : Icons.play_arrow,
                    color: Colors.black,
                  ),
                  label: Text(
                    _isRunning ? 'PAUSE PROTOCOL' : 'ENGAGE AIR-GAP',
                    style: const TextStyle(
                      color: Colors.black,
                      fontWeight: FontWeight.w900,
                      fontSize: 15,
                      letterSpacing: 1,
                    ),
                  ),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: HunterTheme.cyan,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(16),
                    ),
                    elevation: 6,
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
