import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../../core/theme/hunter_theme.dart';
import '../../models/user_model.dart';

class DebriefScreen extends StatefulWidget {
  final UserModel user;
  const DebriefScreen({super.key, required this.user});

  @override
  State<DebriefScreen> createState() => _DebriefScreenState();
}

class _DebriefScreenState extends State<DebriefScreen> {
  final _reflectionController = TextEditingController();
  int _rating = 4;
  bool _submitted = false;

  void _submitDebrief() {
    HapticFeedback.mediumImpact();
    setState(() => _submitted = true);
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        backgroundColor: HunterTheme.surfaceLight,
        content: Text(
          'Evening Debrief Recorded. Mana Shield integrity verified.',
          style: TextStyle(color: HunterTheme.cyanLight, fontWeight: FontWeight.bold),
        ),
      ),
    );
  }

  @override
  void dispose() {
    _reflectionController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: HunterTheme.abyss,
      appBar: AppBar(
        backgroundColor: HunterTheme.abyss,
        elevation: 0,
        title: Text(
          'EVENING DEBRIEF',
          style: Theme.of(context).textTheme.titleLarge?.copyWith(
                letterSpacing: 2,
                fontWeight: FontWeight.w800,
              ),
        ),
      ),
      body: ListView(
        padding: const EdgeInsets.all(20),
        children: [
          // Header Card
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: HunterTheme.surface,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: HunterTheme.cyan.withValues(alpha: 0.3)),
            ),
            child: Row(
              children: [
                const Icon(Icons.nightlight_round, color: HunterTheme.purple, size: 32),
                const SizedBox(width: 14),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: const [
                      Text(
                        'Day Conclusion Protocol',
                        style: TextStyle(
                          color: HunterTheme.textPrimary,
                          fontWeight: FontWeight.bold,
                          fontSize: 15,
                        ),
                      ),
                      SizedBox(height: 2),
                      Text(
                        'Review performance, log friction points, and rest safely.',
                        style: TextStyle(color: HunterTheme.textMuted, fontSize: 12),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),

          const SizedBox(height: 24),

          // Rating Stars
          Text(
            'TODAY\'S DISCIPLINE EVALUATION',
            style: TextStyle(
              color: HunterTheme.textMuted,
              fontWeight: FontWeight.bold,
              fontSize: 11,
              letterSpacing: 1.2,
            ),
          ),
          const SizedBox(height: 8),
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: List.generate(5, (index) {
              final starNum = index + 1;
              return IconButton(
                onPressed: () {
                  HapticFeedback.selectionClick();
                  setState(() => _rating = starNum);
                },
                icon: Icon(
                  starNum <= _rating ? Icons.star : Icons.star_border,
                  color: HunterTheme.gold,
                  size: 36,
                ),
              );
            }),
          ),

          const SizedBox(height: 24),

          // Journal / Friction Field
          Text(
            'FRICTION & WINS (DEBRIEF LOG)',
            style: TextStyle(
              color: HunterTheme.textMuted,
              fontWeight: FontWeight.bold,
              fontSize: 11,
              letterSpacing: 1.2,
            ),
          ),
          const SizedBox(height: 8),
          TextField(
            controller: _reflectionController,
            maxLines: 4,
            style: const TextStyle(color: HunterTheme.textPrimary),
            decoration: InputDecoration(
              hintText: 'What was your highest-friction moment? How did you overcome it?',
              hintStyle: const TextStyle(color: HunterTheme.textMuted),
              filled: true,
              fillColor: HunterTheme.surface,
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(16),
                borderSide: BorderSide(color: HunterTheme.cyan.withValues(alpha: 0.2)),
              ),
              enabledBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(16),
                borderSide: BorderSide(color: HunterTheme.cyan.withValues(alpha: 0.2)),
              ),
              focusedBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(16),
                borderSide: const BorderSide(color: HunterTheme.cyan),
              ),
            ),
          ),

          const SizedBox(height: 30),

          // Submit Button
          SizedBox(
            width: double.infinity,
            height: 52,
            child: ElevatedButton(
              onPressed: _submitted ? null : _submitDebrief,
              style: ElevatedButton.styleFrom(
                backgroundColor: HunterTheme.cyan,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
              ),
              child: Text(
                _submitted ? 'DEBRIEF LOGGED ✓' : 'CONCLUDE TODAY\'S PROTOCOL',
                style: const TextStyle(
                  color: Colors.black,
                  fontWeight: FontWeight.bold,
                  letterSpacing: 1,
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
