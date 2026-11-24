import 'dart:math';
import 'package:flutter/material.dart';
import '../../core/theme/hunter_theme.dart';
import '../../models/user_model.dart';

class StatRadarPainter extends CustomPainter {
  final UserModel user;
  final double animationValue;

  StatRadarPainter({
    required this.user,
    this.animationValue = 1.0,
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
      final ringRadius = radius * (r / 4.0);
      final path = Path();
      for (int i = 0; i < sides; i++) {
        final angle = -pi / 2 + i * angleStep;
        final x = center.dx + ringRadius * cos(angle);
        final y = center.dy + ringRadius * sin(angle);
        if (i == 0) {
          path.moveTo(x, y);
        } else {
          path.lineTo(x, y);
        }
      }
      path.close();
      canvas.drawPath(path, ringPaint);
    }

    // Draw axes from center to vertices and label vertices
    for (int i = 0; i < sides; i++) {
      final angle = -pi / 2 + i * angleStep;
      final x = center.dx + radius * cos(angle);
      final y = center.dy + radius * sin(angle);
      canvas.drawLine(center, Offset(x, y), axisPaint);

      // Draw Attribute Vertex Name Label
      final labelRadius = radius + 14;
      final lx = center.dx + labelRadius * cos(angle);
      final ly = center.dy + labelRadius * sin(angle);

      final textSpan = TextSpan(
        text: statNames[i],
        style: const TextStyle(
          color: HunterTheme.cyanLight,
          fontSize: 10,
          fontWeight: FontWeight.bold,
          letterSpacing: 1,
        ),
      );
      final textPainter = TextPainter(
        text: textSpan,
        textAlign: TextAlign.center,
        textDirection: TextDirection.ltr,
      )..layout();

      textPainter.paint(
        canvas,
        Offset(lx - (textPainter.width / 2), ly - (textPainter.height / 2)),
      );
    }

    // Prepare stat normalized values (1 to 100)
    final values = [
      user.strength.clamp(1, 100) / 100.0,
      user.agility.clamp(1, 100) / 100.0,
      user.stamina.clamp(1, 100) / 100.0,
      user.vitality.clamp(1, 100) / 100.0,
      user.intelligence.clamp(1, 100) / 100.0,
      user.willpower.clamp(1, 100) / 100.0,
      user.charisma.clamp(1, 100) / 100.0,
    ];

    // Build the user stat polygon
    final polygonPath = Path();
    for (int i = 0; i < sides; i++) {
      final angle = -pi / 2 + i * angleStep;
      final statRadius = radius * values[i] * animationValue;
      final x = center.dx + statRadius * cos(angle);
      final y = center.dy + statRadius * sin(angle);

      if (i == 0) {
        polygonPath.moveTo(x, y);
      } else {
        polygonPath.lineTo(x, y);
      }
    }
    polygonPath.close();

    // Fill with glowing translucent cyan/purple gradient
    final fillPaint = Paint()
      ..shader = RadialGradient(
        colors: [
          HunterTheme.cyan.withValues(alpha: 0.5 * animationValue),
          HunterTheme.purple.withValues(alpha: 0.25 * animationValue),
        ],
      ).createShader(Rect.fromCircle(center: center, radius: radius))
      ..style = PaintingStyle.fill;
    canvas.drawPath(polygonPath, fillPaint);

    // Stroke with neon cyan outline
    final strokePaint = Paint()
      ..color = HunterTheme.cyanLight
      ..style = PaintingStyle.stroke
      ..strokeWidth = 2.5;
    canvas.drawPath(polygonPath, strokePaint);

    // Draw glowing vertex points
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
        oldDelegate.user != user;
  }
}
