import 'dart:math';
import 'package:flutter/material.dart';
import '../../core/theme/hunter_theme.dart';
import '../../models/user_model.dart';

class StatRadarPainter extends CustomPainter {
  final UserModel user;
  final double animationValue;
  final bool showGhostBaseline;

  StatRadarPainter({
    required this.user,
    this.animationValue = 1.0,
    this.showGhostBaseline = true,
  });

  static const List<String> statNames = [
    'STR',
    'AGI',
    'STA',
    'VIT',
    'INT',
    'WIL',
    'CHA',
  ];

  static const List<String> baselineKeys = [
    'strength',
    'agility',
    'stamina',
    'vitality',
    'intelligence',
    'willpower',
    'charisma',
  ];

  /// Computes normalized [0.01..1.0] radar coordinates from current user attributes.
  static List<double> normalizeCurrentStats(UserModel user) {
    return [
      user.strength.clamp(1, 100) / 100.0,
      user.agility.clamp(1, 100) / 100.0,
      user.stamina.clamp(1, 100) / 100.0,
      user.vitality.clamp(1, 100) / 100.0,
      user.intelligence.clamp(1, 100) / 100.0,
      user.willpower.clamp(1, 100) / 100.0,
      user.charisma.clamp(1, 100) / 100.0,
    ];
  }

  /// Computes normalized [0.01..1.0] radar coordinates from Day-1 baseline snapshot.
  static List<double>? normalizeBaselineStats(Map<String, int>? baseline) {
    if (baseline == null || baseline.isEmpty) return null;
    return baselineKeys
        .map((k) => (baseline[k] ?? 10).clamp(1, 100) / 100.0)
        .toList();
  }

  Path _buildPolygonPath(
    Offset center,
    double maxRadius,
    List<double> normalizedValues,
    double progress,
  ) {
    const sides = 7;
    const angleStep = (2 * pi) / sides;
    final path = Path();
    for (int i = 0; i < sides; i++) {
      final angle = -pi / 2 + i * angleStep;
      final statRadius = maxRadius * normalizedValues[i] * progress;
      final x = center.dx + statRadius * cos(angle);
      final y = center.dy + statRadius * sin(angle);
      if (i == 0) {
        path.moveTo(x, y);
      } else {
        path.lineTo(x, y);
      }
    }
    path.close();
    return path;
  }

  void _drawDashedPath(Canvas canvas, Path path, Paint paint) {
    for (final metric in path.computeMetrics()) {
      double distance = 0.0;
      const double dashLen = 6.0;
      const double gapLen = 4.0;
      while (distance < metric.length) {
        final double next = min(distance + dashLen, metric.length);
        canvas.drawPath(metric.extractPath(distance, next), paint);
        distance += dashLen + gapLen;
      }
    }
  }

  @override
  void paint(Canvas canvas, Size size) {
    final center = Offset(size.width / 2, size.height / 2);
    final radius = min(size.width, size.height) / 2 * 0.72;
    const sides = 7;
    const angleStep = (2 * pi) / sides;

    final ringPaint = Paint()
      ..color = HunterTheme.cyan.withValues(alpha: 0.15)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1.0;

    final axisPaint = Paint()
      ..color = HunterTheme.cyan.withValues(alpha: 0.25)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1.0;

    // Draw 4 concentric 7-sided polygon rings
    for (int r = 1; r <= 4; r++) {
      final path = _buildPolygonPath(center, radius, List.filled(7, r / 4.0), 1.0);
      canvas.drawPath(path, ringPaint);
    }

    // Draw axes & labels
    for (int i = 0; i < sides; i++) {
      final angle = -pi / 2 + i * angleStep;
      final x = center.dx + radius * cos(angle);
      final y = center.dy + radius * sin(angle);
      canvas.drawLine(center, Offset(x, y), axisPaint);

      final labelRadius = radius + 15;
      final lx = center.dx + labelRadius * cos(angle);
      final ly = center.dy + labelRadius * sin(angle);

      final textPainter = TextPainter(
        text: TextSpan(
          text: statNames[i],
          style: TextStyle(
            color: HunterTheme.cyanLight,
            fontSize: 10,
            fontWeight: FontWeight.bold,
            letterSpacing: 1,
          ),
        ),
        textAlign: TextAlign.center,
        textDirection: TextDirection.ltr,
      )..layout();

      textPainter.paint(
        canvas,
        Offset(lx - (textPainter.width / 2), ly - (textPainter.height / 2)),
      );
    }

    // RET-2: Optional Day-1 Ghost Baseline overlay polygon
    final baselineValues =
        showGhostBaseline ? normalizeBaselineStats(user.baselineStats) : null;
    if (baselineValues != null) {
      final ghostPath = _buildPolygonPath(center, radius, baselineValues, animationValue);
      final ghostFill = Paint()
        ..color = HunterTheme.textMuted.withValues(alpha: 0.10 * animationValue)
        ..style = PaintingStyle.fill;
      final ghostStroke = Paint()
        ..color = HunterTheme.textMuted.withValues(alpha: 0.7)
        ..style = PaintingStyle.stroke
        ..strokeWidth = 1.4;
      canvas.drawPath(ghostPath, ghostFill);
      _drawDashedPath(canvas, ghostPath, ghostStroke);
    }

    // Current attribute polygon
    final values = normalizeCurrentStats(user);
    final polygonPath = _buildPolygonPath(center, radius, values, animationValue);

    final fillPaint = Paint()
      ..shader = RadialGradient(
        colors: [
          HunterTheme.cyan.withValues(alpha: 0.5 * animationValue),
          HunterTheme.purple.withValues(alpha: 0.25 * animationValue),
        ],
      ).createShader(Rect.fromCircle(center: center, radius: radius))
      ..style = PaintingStyle.fill;
    canvas.drawPath(polygonPath, fillPaint);

    final strokePaint = Paint()
      ..color = HunterTheme.cyanLight
      ..style = PaintingStyle.stroke
      ..strokeWidth = 2.5;
    canvas.drawPath(polygonPath, strokePaint);

    final dotPaint = Paint()
      ..color = HunterTheme.cyanLight
      ..style = PaintingStyle.fill;
    for (int i = 0; i < sides; i++) {
      final angle = -pi / 2 + i * angleStep;
      final statRadius = radius * values[i] * animationValue;
      final x = center.dx + statRadius * cos(angle);
      final y = center.dy + statRadius * sin(angle);
      canvas.drawCircle(Offset(x, y), 3.5, dotPaint);
    }
  }

  @override
  bool shouldRepaint(covariant StatRadarPainter oldDelegate) {
    return oldDelegate.animationValue != animationValue ||
        oldDelegate.user != user ||
        oldDelegate.showGhostBaseline != showGhostBaseline;
  }
}
