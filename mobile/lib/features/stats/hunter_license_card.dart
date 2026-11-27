import 'dart:io';
import 'dart:ui' as ui;
import 'package:flutter/material.dart';
import 'package:flutter/rendering.dart';
import 'package:flutter/services.dart';
import 'package:path_provider/path_provider.dart';
import 'package:share_plus/share_plus.dart';
import '../../core/theme/hunter_theme.dart';
import '../../models/user_model.dart';

/// Official Hunter Association License Card wrapped in RepaintBoundary for PNG sharing.
class HunterLicenseCard extends StatefulWidget {
  final UserModel user;

  const HunterLicenseCard({super.key, required this.user});

  @override
  State<HunterLicenseCard> createState() => _HunterLicenseCardState();
}

class _HunterLicenseCardState extends State<HunterLicenseCard> {
  final GlobalKey _licenseKey = GlobalKey();
  bool _exporting = false;

  Color _tierColor(String tier) {
    switch (tier.toUpperCase()) {
      case 'S':
        return HunterTheme.gold;
      case 'A':
        return HunterTheme.crimson;
      case 'B':
        return HunterTheme.purple;
      case 'C':
        return HunterTheme.cyan;
      default:
        return HunterTheme.emerald;
    }
  }

  Future<void> _shareLicenseImage() async {
    setState(() => _exporting = true);
    HapticFeedback.mediumImpact();
    try {
      final boundary =
          _licenseKey.currentContext?.findRenderObject() as RenderRepaintBoundary?;
      if (boundary == null) return;
      final image = await boundary.toImage(pixelRatio: 2.5);
      final byteData = await image.toByteData(format: ui.ImageByteFormat.png);
      if (byteData == null) return;

      final dir = await getTemporaryDirectory();
      final file = File(
          '${dir.path}/hunter_license_${DateTime.now().millisecondsSinceEpoch}.png');
      await file.writeAsBytes(byteData.buffer.asUint8List());

      final u = widget.user;
      await SharePlus.instance.share(
        ShareParams(
          files: [XFile(file.path)],
          text:
              'Official Hunter License — ${u.name} | ${u.tier}-Rank Lv.${u.level} ${u.evolvedClass ?? u.hunterClass} (${u.streak}d Streak)',
        ),
      );
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          backgroundColor: HunterTheme.crimson,
          content: Text('License PNG export failed: $e'),
        ),
      );
    } finally {
      if (mounted) setState(() => _exporting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final u = widget.user;
    final tierAccent = _tierColor(u.tier);
    final classDisplay = (u.evolvedClass ?? u.hunterClass).toUpperCase();

    return Column(
      children: [
        RepaintBoundary(
          key: _licenseKey,
          child: Container(
            padding: const EdgeInsets.all(18),
            decoration: BoxDecoration(
              gradient: LinearGradient(
                colors: [
                  HunterTheme.surfaceLight,
                  HunterTheme.surface,
                  HunterTheme.abyss,
                ],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
              borderRadius: BorderRadius.circular(18),
              border: Border.all(color: tierAccent.withValues(alpha: 0.7), width: 1.5),
              boxShadow: [
                BoxShadow(
                  color: tierAccent.withValues(alpha: 0.16),
                  blurRadius: 18,
                  offset: const Offset(0, 4),
                ),
              ],
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Expanded(
                      child: Text(
                        'HUNTER ASSOCIATION // LICENSE',
                        overflow: TextOverflow.ellipsis,
                        style: TextStyle(
                          color: HunterTheme.textMuted,
                          fontSize: 10,
                          fontWeight: FontWeight.w900,
                          letterSpacing: 1.6,
                        ),
                      ),
                    ),
                    const SizedBox(width: 8),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 3),
                      decoration: BoxDecoration(
                        color: tierAccent.withValues(alpha: 0.18),
                        borderRadius: BorderRadius.circular(6),
                        border: Border.all(color: tierAccent),
                      ),
                      child: Text(
                        '${u.tier}-RANK',
                        style: TextStyle(
                          color: tierAccent,
                          fontSize: 11,
                          fontWeight: FontWeight.w900,
                          letterSpacing: 1.2,
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                Row(
                  children: [
                    CircleAvatar(
                      radius: 26,
                      backgroundColor: tierAccent.withValues(alpha: 0.18),
                      child: Text(
                        u.name.isNotEmpty ? u.name[0].toUpperCase() : 'H',
                        style: TextStyle(
                          color: tierAccent,
                          fontSize: 22,
                          fontWeight: FontWeight.w900,
                        ),
                      ),
                    ),
                    const SizedBox(width: 14),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              Flexible(
                                child: Text(
                                  u.name.toUpperCase(),
                                  overflow: TextOverflow.ellipsis,
                                  style: TextStyle(
                                    color: HunterTheme.textPrimary,
                                    fontSize: 18,
                                    fontWeight: FontWeight.w900,
                                  ),
                                ),
                              ),
                              if (u.prestigeRank > 0) ...[
                                const SizedBox(width: 6),
                                Text(
                                  '★${u.prestigeRank}',
                                  style: TextStyle(
                                    color: HunterTheme.gold,
                                    fontWeight: FontWeight.w900,
                                    fontSize: 13,
                                  ),
                                ),
                              ],
                            ],
                          ),
                          Text(
                            'LV.${u.level} • $classDisplay',
                            style: TextStyle(
                              color: HunterTheme.cyanLight,
                              fontSize: 12,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                          if (u.activeTitle != null && u.activeTitle!.isNotEmpty)
                            Text(
                              'TITLE: ${u.activeTitle!.toUpperCase()}',
                              style: TextStyle(
                                color: HunterTheme.gold,
                                fontSize: 10.5,
                                fontWeight: FontWeight.w800,
                              ),
                            ),
                        ],
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 14),
                Divider(color: tierAccent.withValues(alpha: 0.25), height: 1),
                const SizedBox(height: 12),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    _pill('STREAK', '${u.streak}D', HunterTheme.gold),
                    _pill('SHIELDS', '${u.streakShields}', HunterTheme.cyan),
                    _pill('SHADOWS', '${u.equippedShadows.length}/3', HunterTheme.purple),
                    _pill('COINS', '${u.coins}', HunterTheme.emeraldLight),
                  ],
                ),
                if (u.reawakeningState?['examinerVerdict'] != null) ...[
                  const SizedBox(height: 10),
                  Text(
                    'VERIFIED: ${u.reawakeningState!['examinerVerdict']}',
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                    style: TextStyle(
                      color: tierAccent,
                      fontSize: 10,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                ],
              ],
            ),
          ),
        ),
        const SizedBox(height: 10),
        SizedBox(
          width: double.infinity,
          child: OutlinedButton.icon(
            onPressed: _exporting ? null : _shareLicenseImage,
            icon: _exporting
                ? SizedBox(
                    width: 14,
                    height: 14,
                    child: CircularProgressIndicator(
                        strokeWidth: 2, color: HunterTheme.cyan),
                  )
                : Icon(Icons.qr_code_2_rounded, size: 18, color: HunterTheme.cyan),
            label: Text(
              'SHARE HUNTER LICENSE CARD (PNG)',
              style: TextStyle(
                color: HunterTheme.cyanLight,
                fontWeight: FontWeight.bold,
                letterSpacing: 1.1,
                fontSize: 12,
              ),
            ),
            style: OutlinedButton.styleFrom(
              side: BorderSide(color: tierAccent.withValues(alpha: 0.6)),
              padding: const EdgeInsets.symmetric(vertical: 12),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            ),
          ),
        ),
      ],
    );
  }

  Widget _pill(String label, String val, Color c) {
    return Column(
      children: [
        Text(
          label,
          style: TextStyle(
            color: HunterTheme.textMuted,
            fontSize: 9.5,
            fontWeight: FontWeight.w800,
            letterSpacing: 1,
          ),
        ),
        const SizedBox(height: 2),
        Text(
          val,
          style: TextStyle(
            color: c,
            fontSize: 13.5,
            fontWeight: FontWeight.w900,
          ),
        ),
      ],
    );
  }
}
