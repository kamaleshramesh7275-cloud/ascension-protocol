import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/theme/hunter_theme.dart';

/// Feature #7 30-Day Execution Roadmap — Coming Soon Lock Screen.
class RoadmapScreen extends ConsumerWidget {
  const RoadmapScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {

    return Scaffold(
      backgroundColor: HunterTheme.abyss,
      appBar: AppBar(
        backgroundColor: HunterTheme.abyss,
        elevation: 0,
        title: Text(
          '30-DAY PROTOCOL MAP',
          style: TextStyle(
            color: HunterTheme.textPrimary,
            fontWeight: FontWeight.w900,
            letterSpacing: 1.4,
            fontSize: 16,
          ),
        ),
      ),
      body: Center(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 28),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
                decoration: BoxDecoration(
                  color: HunterTheme.gold.withValues(alpha: 0.14),
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(color: HunterTheme.gold.withValues(alpha: 0.6)),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(Icons.lock_rounded, color: HunterTheme.gold, size: 18),
                    const SizedBox(width: 8),
                    Text(
                      'COMING SOON',
                      style: TextStyle(
                        color: HunterTheme.gold,
                        fontWeight: FontWeight.w900,
                        fontSize: 13,
                        letterSpacing: 3,
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 24),
              Container(
                width: 108,
                height: 108,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: HunterTheme.cyan.withValues(alpha: 0.08),
                  border: Border.all(color: HunterTheme.cyan.withValues(alpha: 0.45), width: 2),
                  boxShadow: [
                    BoxShadow(
                      color: HunterTheme.cyan.withValues(alpha: 0.15),
                      blurRadius: 24,
                      spreadRadius: 4,
                    ),
                  ],
                ),
                child: Icon(Icons.map_rounded, color: HunterTheme.cyan, size: 50),
              ),
              const SizedBox(height: 24),
              Text(
                '30-DAY PROTOCOL MAP',
                style: TextStyle(
                  color: HunterTheme.cyanLight,
                  fontWeight: FontWeight.w900,
                  fontSize: 19,
                  letterSpacing: 2,
                ),
              ),
              const SizedBox(height: 12),
              Text(
                'Your 30-Day Execution Roadmap is locked for now and will unlock in an upcoming update.',
                textAlign: TextAlign.center,
                style: TextStyle(color: HunterTheme.textMuted, fontSize: 13.5, height: 1.6),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
