import 'package:flutter/material.dart';
import '../../core/theme/hunter_theme.dart';
import '../../models/user_model.dart';

class SystemGoalDirectiveCard extends StatelessWidget {
  final UserModel user;
  final VoidCallback? onOpenRoadmap;

  const SystemGoalDirectiveCard({
    super.key,
    required this.user,
    this.onOpenRoadmap,
  });

  @override
  Widget build(BuildContext context) {
    final goalText = (user.currentGoal ?? 'MASTER ABSOLUTE PHYSICAL & MENTAL DISCIPLINE').toUpperCase();
    final deadlineDays = 30; // standard 30-day protocol cycle
    final daysRemaining = 29;

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: const Color(0xFF040A1A),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: HunterTheme.cyan.withValues(alpha: 0.6),
          width: 1.4,
        ),
        boxShadow: [
          BoxShadow(
            color: HunterTheme.cyan.withValues(alpha: 0.18),
            blurRadius: 18,
            spreadRadius: 1,
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Top System Badge & Countdown
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Row(
                children: [
                  Container(
                    width: 7,
                    height: 7,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      color: HunterTheme.cyan,
                    ),
                  ),
                  const SizedBox(width: 8),
                  Text(
                    '[ MANDATE OF THE SYSTEM // 30-DAY TIMELINE ]',
                    style: TextStyle(
                      color: HunterTheme.cyanLight,
                      fontSize: 10,
                      fontWeight: FontWeight.w900,
                      letterSpacing: 1.2,
                    ),
                  ),
                ],
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2.5),
                decoration: BoxDecoration(
                  color: HunterTheme.cyan.withValues(alpha: 0.15),
                  borderRadius: BorderRadius.circular(6),
                  border: Border.all(color: HunterTheme.cyan.withValues(alpha: 0.4)),
                ),
                child: Text(
                  '$daysRemaining DAYS LEFT',
                  style: TextStyle(
                    color: HunterTheme.cyanLight,
                    fontSize: 9.5,
                    fontWeight: FontWeight.w900,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),

          // Primary Goal Statement
          Text(
            goalText,
            style: TextStyle(
              color: HunterTheme.textPrimary,
              fontSize: 15.5,
              fontWeight: FontWeight.w900,
              height: 1.35,
              letterSpacing: 0.6,
            ),
          ),
          const SizedBox(height: 12),

          // Timeline Progress Bar
          ClipRRect(
            borderRadius: BorderRadius.circular(4),
            child: LinearProgressIndicator(
              value: 1 / deadlineDays,
              minHeight: 5,
              backgroundColor: const Color(0xFF13203A),
              valueColor: AlwaysStoppedAnimation<Color>(HunterTheme.cyan),
            ),
          ),
          const SizedBox(height: 12),

          // Sub-HUD Quota & System Trajectory Verdict
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
            decoration: BoxDecoration(
              color: const Color(0xFF071226),
              borderRadius: BorderRadius.circular(10),
              border: Border.all(color: HunterTheme.surfaceLight),
            ),
            child: Row(
              children: [
                Icon(Icons.bolt, color: HunterTheme.cyan, size: 18),
                const SizedBox(width: 8),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'DAILY SYSTEM QUOTA: 45M AIR-GAP EXECUTION',
                        style: TextStyle(
                          color: HunterTheme.cyanLight,
                          fontSize: 10,
                          fontWeight: FontWeight.w900,
                          letterSpacing: 0.8,
                        ),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        'System trajectory: ON TRACK. Maintain daily streak to prevent penalty.',
                        style: TextStyle(
                          color: HunterTheme.textMuted,
                          fontSize: 10.5,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
