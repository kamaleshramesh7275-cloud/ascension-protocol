import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../../core/theme/hunter_theme.dart';
import '../../models/user_model.dart';
import 'stat_radar_painter.dart';

class StatsScreen extends StatefulWidget {
  final UserModel user;
  const StatsScreen({super.key, required this.user});

  @override
  State<StatsScreen> createState() => _StatsScreenState();
}

class _StatsScreenState extends State<StatsScreen>
    with SingleTickerProviderStateMixin {
  late AnimationController _animController;

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

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: HunterTheme.abyss,
      appBar: AppBar(
        backgroundColor: HunterTheme.abyss,
        elevation: 0,
        title: Text(
          'HUNTER ATTRIBUTES',
          style: Theme.of(context).textTheme.titleLarge?.copyWith(
                letterSpacing: 2,
                fontWeight: FontWeight.w800,
              ),
        ),
      ),
      body: ListView(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        children: [
          // Stat Radar Hexagon Visualization
          Container(
            padding: const EdgeInsets.symmetric(vertical: 20),
            decoration: BoxDecoration(
              color: HunterTheme.surface,
              borderRadius: BorderRadius.circular(20),
              border: Border.all(color: HunterTheme.cyan.withValues(alpha: 0.3)),
            ),
            child: Column(
              children: [
                Text(
                  'STAT BALANCE RADAR',
                  style: TextStyle(
                    color: HunterTheme.cyanLight,
                    fontWeight: FontWeight.bold,
                    letterSpacing: 1.5,
                    fontSize: 12,
                  ),
                ),
                const SizedBox(height: 16),
                Center(
                  child: AnimatedBuilder(
                    animation: _animController,
                    builder: (context, _) {
                      return CustomPaint(
                        size: const Size(260, 240),
                        painter: StatRadarPainter(
                          user: widget.user,
                          animationValue: CurvedAnimation(
                            parent: _animController,
                            curve: Curves.easeOutCubic,
                          ).value,
                        ),
                      );
                    },
                  ),
                ),
                const SizedBox(height: 8),
                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    _buildLegendItem('STR', 'Strength'),
                    _buildLegendItem('AGI', 'Agility'),
                    _buildLegendItem('STA', 'Stamina'),
                    _buildLegendItem('INT', 'Intellect'),
                  ],
                ),
              ],
            ),
          ).animate().fadeIn(duration: 500.ms),

          const SizedBox(height: 20),

          // 7 Core Attribute Bars
          Text(
            'DETAILED ATTRIBUTE BREAKDOWN',
            style: TextStyle(
              color: HunterTheme.textMuted,
              fontWeight: FontWeight.bold,
              fontSize: 12,
              letterSpacing: 1.2,
            ),
          ),
          const SizedBox(height: 10),

          _buildStatRow('Strength (STR)', widget.user.strength, HunterTheme.crimson),
          _buildStatRow('Agility (AGI)', widget.user.agility, HunterTheme.cyan),
          _buildStatRow('Stamina (STA)', widget.user.stamina, HunterTheme.emerald),
          _buildStatRow('Vitality (VIT)', widget.user.vitality, HunterTheme.gold),
          _buildStatRow('Intelligence (INT)', widget.user.intelligence, HunterTheme.purple),
          _buildStatRow('Willpower (WIL)', widget.user.willpower, Colors.amber),
          _buildStatRow('Charisma (CHA)', widget.user.charisma, Colors.pinkAccent),

          const SizedBox(height: 20),

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
                  child: const Icon(Icons.shield_outlined, color: HunterTheme.purple),
                ),
                const SizedBox(width: 14),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Mana Shield: ${widget.user.streakShields} Available',
                        style: const TextStyle(
                          color: HunterTheme.textPrimary,
                          fontWeight: FontWeight.bold,
                          fontSize: 14,
                        ),
                      ),
                      const SizedBox(height: 2),
                      const Text(
                        'Absorbs 1 missed daily quest without breaking your streak.',
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
          const SizedBox(height: 20),
        ],
      ),
    );
  }

  Widget _buildLegendItem(String tag, String label) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 6),
      child: Text(
        tag,
        style: const TextStyle(
          color: HunterTheme.cyanLight,
          fontSize: 11,
          fontWeight: FontWeight.bold,
        ),
      ),
    );
  }

  Widget _buildStatRow(String label, int value, Color color) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                label,
                style: const TextStyle(
                  color: HunterTheme.textPrimary,
                  fontWeight: FontWeight.w600,
                  fontSize: 13,
                ),
              ),
              Text(
                '$value / 100',
                style: TextStyle(
                  color: color,
                  fontWeight: FontWeight.bold,
                  fontSize: 13,
                ),
              ),
            ],
          ),
          const SizedBox(height: 6),
          ClipRRect(
            borderRadius: BorderRadius.circular(6),
            child: LinearProgressIndicator(
              value: (value / 100.0).clamp(0.0, 1.0),
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
