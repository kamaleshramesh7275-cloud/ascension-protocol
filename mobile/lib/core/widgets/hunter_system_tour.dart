import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../../core/theme/hunter_theme.dart';

class HunterTourStop {
  final String title;
  final String badge;
  final String description;
  final int targetTab;

  const HunterTourStop({
    required this.title,
    required this.badge,
    required this.description,
    required this.targetTab,
  });
}

class HunterSystemTourOverlay extends StatefulWidget {
  final VoidCallback onFinished;
  final void Function(int tabIndex) onSwitchTab;

  const HunterSystemTourOverlay({
    super.key,
    required this.onFinished,
    required this.onSwitchTab,
  });

  static const String keyTourCompleted = 'has_completed_hunter_system_tour';

  static Future<bool> shouldShow() async {
    final prefs = await SharedPreferences.getInstance();
    return !(prefs.getBool(keyTourCompleted) ?? false);
  }

  static Future<void> markCompleted() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool(keyTourCompleted, true);
  }

  @override
  State<HunterSystemTourOverlay> createState() => _HunterSystemTourOverlayState();
}

class _HunterSystemTourOverlayState extends State<HunterSystemTourOverlay> {
  int _currentStep = 0;

  final List<HunterTourStop> _stops = const [
    HunterTourStop(
      badge: 'SYSTEM HUD // MANDATE & ULTIMATUM',
      title: 'PRIMARY GOAL DIRECTIVE',
      description:
          'Your custom 30-day mandate and the daily 4-part quest ultimatum. Complete all 4 pillars before 23:59 or face the Penalty Zone.',
      targetTab: 0,
    ),
    HunterTourStop(
      badge: 'QUEST CODEX // RANK TRIALS',
      title: 'DAILY QUESTS & BLUE GATES',
      description:
          'Rank-tailored daily quests and high-yield dungeon gates. Clearing these fuels your stat growth and grants Hunter XP.',
      targetTab: 1,
    ),
    HunterTourStop(
      badge: 'COMBAT TRAINING // PROGRESSIVE OVERLOAD',
      title: 'WORKOUT LOGGER & SPLITS',
      description:
          'Log your gym sessions and bodyweight sets. Auto-progressive overload tracks your personal records and builds physical stats.',
      targetTab: 2,
    ),
    HunterTourStop(
      badge: 'SANCTUM // ZERO BREACH PROTOCOL',
      title: 'AIR-GAP FOCUS SPRINTS',
      description:
          'Deep work sprints with air-gap phone tracking. Leaving the app triggers breach penalties. Protect your deep work.',
      targetTab: 3,
    ),
    HunterTourStop(
      badge: 'ARSENAL // SHADOW MONARCH ARMY',
      title: 'ATTRIBUTES, SHADOWS & SHOP',
      description:
          'Inspect your 7-Stat Radar, deploy extracted Shadows, purchase titles in the Supply Depot, and compete in Rival Divisions.',
      targetTab: 4,
    ),
  ];

  void _next() {
    HapticFeedback.lightImpact();
    if (_currentStep < _stops.length - 1) {
      setState(() {
        _currentStep++;
      });
      widget.onSwitchTab(_stops[_currentStep].targetTab);
    } else {
      _finish();
    }
  }

  void _finish() async {
    HapticFeedback.heavyImpact();
    await HunterSystemTourOverlay.markCompleted();
    widget.onFinished();
  }

  @override
  Widget build(BuildContext context) {
    final stop = _stops[_currentStep];
    final isLast = _currentStep == _stops.length - 1;

    return Material(
      color: Colors.transparent,
      child: Stack(
        children: [
          // Dimmed backdrop
          Positioned.fill(
            child: GestureDetector(
              onTap: _next,
              child: Container(
                color: Colors.black.withValues(alpha: 0.8),
              ),
            ),
          ),

          // Dialog Box positioned above navigation bar
          Positioned(
            left: 20,
            right: 20,
            bottom: 110,
            child: Container(
              padding: const EdgeInsets.all(22),
              decoration: BoxDecoration(
                color: const Color(0xFF040A1A),
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: HunterTheme.cyan, width: 1.6),
                boxShadow: [
                  BoxShadow(
                    color: HunterTheme.cyan.withValues(alpha: 0.35),
                    blurRadius: 24,
                    spreadRadius: 2,
                  ),
                ],
              ),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Step counter & Badge
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                        decoration: BoxDecoration(
                          color: HunterTheme.cyan.withValues(alpha: 0.15),
                          borderRadius: BorderRadius.circular(5),
                          border: Border.all(color: HunterTheme.cyan.withValues(alpha: 0.5)),
                        ),
                        child: Text(
                          stop.badge,
                          style: TextStyle(
                            color: HunterTheme.cyanLight,
                            fontSize: 10,
                            fontWeight: FontWeight.w900,
                            letterSpacing: 1.2,
                          ),
                        ),
                      ),
                      Text(
                        'STEP ${_currentStep + 1} OF ${_stops.length}',
                        style: TextStyle(
                          color: Colors.white54,
                          fontSize: 10.5,
                          fontWeight: FontWeight.bold,
                          letterSpacing: 1,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),

                  // Stop Title
                  Text(
                    stop.title,
                    style: TextStyle(
                      color: HunterTheme.textPrimary,
                      fontSize: 16,
                      fontWeight: FontWeight.w900,
                      letterSpacing: 1.1,
                    ),
                  ),
                  const SizedBox(height: 8),

                  // Description
                  Text(
                    stop.description,
                    style: TextStyle(
                      color: Colors.white.withValues(alpha: 0.85),
                      fontSize: 13,
                      height: 1.5,
                    ),
                  ),
                  const SizedBox(height: 20),

                  // Action Buttons
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      TextButton(
                        onPressed: _finish,
                        child: const Text(
                          'Skip Tour',
                          style: TextStyle(color: Colors.white38, fontSize: 12),
                        ),
                      ),
                      ElevatedButton(
                        onPressed: _next,
                        style: ElevatedButton.styleFrom(
                          backgroundColor: HunterTheme.cyan,
                          foregroundColor: Colors.black,
                          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(8),
                          ),
                        ),
                        child: Text(
                          isLast ? 'BEGIN ASCENSION' : 'NEXT MODULE >',
                          style: const TextStyle(
                            fontSize: 11.5,
                            fontWeight: FontWeight.w900,
                            letterSpacing: 1,
                          ),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
