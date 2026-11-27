import 'package:flutter/material.dart';
import '../theme/hunter_theme.dart';

/// Subtle 30-40% Solo Leveling System container used selectively on hero/status panels.
/// Renders a crisp 1px mana border, 4-corner targeting brackets, and optional [ SYSTEM // TAG ].
class SystemPanel extends StatelessWidget {
  final Widget child;
  final String? tag;
  final Color accentColor;
  final EdgeInsetsGeometry padding;
  final EdgeInsetsGeometry? margin;

  const SystemPanel({
    super.key,
    required this.child,
    this.tag,
    this.accentColor = HunterTheme.cyan,
    this.padding = const EdgeInsets.all(16),
    this.margin,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: margin,
      decoration: BoxDecoration(
        color: HunterTheme.surface,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: accentColor.withValues(alpha: 0.35), width: 1),
        boxShadow: [
          BoxShadow(
            color: accentColor.withValues(alpha: 0.08),
            blurRadius: 16,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: CustomPaint(
        painter: _CornerBracketsPainter(color: accentColor),
        child: Padding(
          padding: padding,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisSize: MainAxisSize.min,
            children: [
              if (tag != null && tag!.isNotEmpty) ...[
                Text(
                  '[ SYSTEM // $tag ]',
                  style: TextStyle(
                    color: accentColor,
                    fontSize: 10,
                    fontWeight: FontWeight.w900,
                    letterSpacing: 1.4,
                  ),
                ),
                const SizedBox(height: 8),
              ],
              child,
            ],
          ),
        ),
      ),
    );
  }
}

class _CornerBracketsPainter extends CustomPainter {
  final Color color;
  const _CornerBracketsPainter({required this.color});

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = color.withValues(alpha: 0.85)
      ..strokeWidth = 2.0
      ..style = PaintingStyle.stroke;

    const len = 10.0;
    const inset = 1.0;
    final w = size.width;
    final h = size.height;

    // Top-left
    canvas.drawPath(
      Path()
        ..moveTo(inset, inset + len)
        ..lineTo(inset, inset)
        ..lineTo(inset + len, inset),
      paint,
    );
    // Top-right
    canvas.drawPath(
      Path()
        ..moveTo(w - inset - len, inset)
        ..lineTo(w - inset, inset)
        ..lineTo(w - inset, inset + len),
      paint,
    );
    // Bottom-left
    canvas.drawPath(
      Path()
        ..moveTo(inset, h - inset - len)
        ..lineTo(inset, h - inset)
        ..lineTo(inset + len, h - inset),
      paint,
    );
    // Bottom-right
    canvas.drawPath(
      Path()
        ..moveTo(w - inset - len, h - inset)
        ..lineTo(w - inset, h - inset)
        ..lineTo(w - inset, h - inset - len),
      paint,
    );
  }

  @override
  bool shouldRepaint(covariant _CornerBracketsPainter oldDelegate) =>
      oldDelegate.color != color;
}

/// Compact Solo Leveling Rank Diamond badge (D, C, B, A, S).
class RankDiamondBadge extends StatelessWidget {
  final String tier;
  final double size;

  const RankDiamondBadge({super.key, required this.tier, this.size = 38});

  Color _tierColor(String t) {
    switch (t.toUpperCase()) {
      case 'S':
        return HunterTheme.gold;
      case 'A':
        return HunterTheme.purple;
      case 'B':
        return HunterTheme.cyan;
      case 'C':
        return HunterTheme.emeraldLight;
      default:
        return HunterTheme.cyanLight;
    }
  }

  @override
  Widget build(BuildContext context) {
    final c = _tierColor(tier);
    return Semantics(
      label: 'Rank $tier Hunter',
      child: SizedBox(
        width: size,
        height: size,
        child: Stack(
          alignment: Alignment.center,
          children: [
            Transform.rotate(
              angle: 0.785398, // 45 degrees
              child: Container(
                width: size * 0.72,
                height: size * 0.72,
                decoration: BoxDecoration(
                  color: c.withValues(alpha: 0.16),
                  borderRadius: BorderRadius.circular(6),
                  border: Border.all(color: c, width: 1.5),
                ),
              ),
            ),
            Text(
              tier.toUpperCase(),
              style: TextStyle(
                color: c,
                fontWeight: FontWeight.w900,
                fontSize: size * 0.42,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
