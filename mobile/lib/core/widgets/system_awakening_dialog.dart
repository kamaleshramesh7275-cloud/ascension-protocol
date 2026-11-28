import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../../core/theme/hunter_theme.dart';
import '../../models/user_model.dart';

class SystemAwakeningDialog extends StatefulWidget {
  final UserModel user;
  final VoidCallback onAccepted;

  const SystemAwakeningDialog({
    super.key,
    required this.user,
    required this.onAccepted,
  });

  static Future<void> show(BuildContext context, UserModel user, VoidCallback onAccepted) {
    return showGeneralDialog(
      context: context,
      barrierDismissible: false,
      barrierColor: Colors.black.withValues(alpha: 0.9),
      transitionDuration: const Duration(milliseconds: 600),
      transitionBuilder: (context, anim1, anim2, child) {
        return Transform.scale(
          scale: Curves.easeOutBack.transform(anim1.value),
          child: Opacity(opacity: anim1.value, child: child),
        );
      },
      pageBuilder: (context, _, _) => SystemAwakeningDialog(
        user: user,
        onAccepted: onAccepted,
      ),
    );
  }

  @override
  State<SystemAwakeningDialog> createState() => _SystemAwakeningDialogState();
}

class _SystemAwakeningDialogState extends State<SystemAwakeningDialog> with SingleTickerProviderStateMixin {
  late AnimationController _pulseController;
  int _displayedTextLength = 0;
  late String _fullMessage;
  bool _typingFinished = false;

  @override
  void initState() {
    super.initState();
    _pulseController = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 2),
    )..repeat(reverse: true);

    final codename = widget.user.name.toUpperCase();
    final goal = widget.user.currentGoal ?? 'SURPASS HUMAN LIMITS & MASTER ABSOLUTE DISCIPLINE';

    _fullMessage = 'Hunter $codename.\n\n'
        'You have qualified for the Secret Quest:\n'
        '"COURAGE OF THE WEAK".\n\n'
        'The System has registered your designated mandate:\n'
        '"$goal"\n\n'
        'You have been chosen as the sole Player. Survival and ascension now depend solely on your daily execution.';

    _startTypewriter();
  }

  void _startTypewriter() async {
    HapticFeedback.heavyImpact();
    for (int i = 0; i <= _fullMessage.length; i++) {
      if (!mounted) return;
      setState(() {
        _displayedTextLength = i;
      });
      if (i % 6 == 0) {
        HapticFeedback.lightImpact();
      }
      await Future.delayed(const Duration(milliseconds: 22));
    }
    if (mounted) {
      setState(() => _typingFinished = true);
      HapticFeedback.mediumImpact();
    }
  }

  @override
  void dispose() {
    _pulseController.dispose();
    super.dispose();
  }

  void _onRefused() {
    HapticFeedback.vibrate();
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        backgroundColor: const Color(0xFF1A0508),
        duration: const Duration(seconds: 3),
        content: Text(
          '[ SYSTEM WARNING ] Refusal is not permitted. Survival requires ascension.',
          style: TextStyle(
            color: HunterTheme.crimson,
            fontWeight: FontWeight.bold,
            letterSpacing: 0.8,
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Material(
        color: Colors.transparent,
        child: Container(
          width: MediaQuery.of(context).size.width * 0.9,
          margin: const EdgeInsets.symmetric(horizontal: 20),
          padding: const EdgeInsets.all(24),
          decoration: BoxDecoration(
            color: const Color(0xFF040A1A),
            borderRadius: BorderRadius.circular(16),
            border: Border.all(
              color: HunterTheme.cyan,
              width: 1.8,
            ),
            boxShadow: [
              BoxShadow(
                color: HunterTheme.cyan.withValues(alpha: 0.35),
                blurRadius: 30,
                spreadRadius: 2,
              ),
            ],
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // Header Badge
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                    decoration: BoxDecoration(
                      color: HunterTheme.cyan.withValues(alpha: 0.15),
                      borderRadius: BorderRadius.circular(6),
                      border: Border.all(color: HunterTheme.cyan.withValues(alpha: 0.6)),
                    ),
                    child: Text(
                      '[ SYSTEM NOTIFICATION ]',
                      style: TextStyle(
                        color: HunterTheme.cyanLight,
                        fontSize: 11,
                        fontWeight: FontWeight.w900,
                        letterSpacing: 1.5,
                      ),
                    ),
                  ),
                  AnimatedBuilder(
                    animation: _pulseController,
                    builder: (context, _) => Container(
                      width: 10,
                      height: 10,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        color: HunterTheme.cyan,
                        boxShadow: [
                          BoxShadow(
                            color: HunterTheme.cyan.withValues(alpha: _pulseController.value),
                            blurRadius: 10,
                            spreadRadius: 3,
                          )
                        ],
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 18),

              // Title
              Text(
                'AWAKENING PROTOCOL INITIATED',
                style: TextStyle(
                  color: HunterTheme.textPrimary,
                  fontSize: 17,
                  fontWeight: FontWeight.w900,
                  letterSpacing: 1.2,
                ),
              ),
              const SizedBox(height: 6),
              Container(
                height: 1,
                color: HunterTheme.cyan.withValues(alpha: 0.3),
              ),
              const SizedBox(height: 16),

              // Text Body
              Container(
                constraints: const BoxConstraints(minHeight: 140),
                child: Text(
                  _fullMessage.substring(0, _displayedTextLength),
                  style: TextStyle(
                    color: Colors.white.withValues(alpha: 0.9),
                    fontSize: 13.5,
                    height: 1.55,
                    letterSpacing: 0.5,
                  ),
                ),
              ),
              const SizedBox(height: 24),

              // Actions
              if (_typingFinished) ...[
                ElevatedButton(
                  onPressed: () {
                    HapticFeedback.heavyImpact();
                    Navigator.of(context).pop();
                    widget.onAccepted();
                  },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: HunterTheme.cyan,
                    foregroundColor: Colors.black,
                    padding: const EdgeInsets.symmetric(vertical: 14),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(10),
                    ),
                    elevation: 8,
                    shadowColor: HunterTheme.cyan.withValues(alpha: 0.6),
                  ),
                  child: const Text(
                    'ACCEPT SYSTEM MANDATE',
                    style: TextStyle(
                      fontSize: 13,
                      fontWeight: FontWeight.w900,
                      letterSpacing: 1.2,
                    ),
                  ),
                ),
                const SizedBox(height: 10),
                TextButton(
                  onPressed: _onRefused,
                  child: Text(
                    'Refuse Awakening',
                    style: TextStyle(
                      color: Colors.white38,
                      fontSize: 11,
                      letterSpacing: 0.8,
                    ),
                  ),
                ),
              ] else
                Center(
                  child: Padding(
                    padding: const EdgeInsets.symmetric(vertical: 16),
                    child: Text(
                      'DECRYPTING SYSTEM RUNES...',
                      style: TextStyle(
                        color: HunterTheme.cyan.withValues(alpha: 0.6),
                        fontSize: 11,
                        letterSpacing: 1.5,
                        fontWeight: FontWeight.bold,
                      ),
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
