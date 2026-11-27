import 'dart:async';
import 'dart:io';
import 'dart:ui' as ui;
import 'package:flutter/material.dart';
import 'package:flutter/rendering.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:path_provider/path_provider.dart';
import 'package:share_plus/share_plus.dart';
import '../../models/quest_model.dart';
import '../services/system_audio_service.dart';
import '../theme/hunter_theme.dart';

enum SystemWindowTone { cyan, gold, crimson, purple }

/// Reusable Holographic Solo Leveling System Window Overlay (#2).
/// Supports FIFO popup queuing, scanline texture, tap-to-skip typewriter text,
/// local synthesized SFX + haptics, and 1-tap PNG share clip export.
class SystemWindowDialog extends StatefulWidget {
  final String headerTag;
  final String title;
  final String body;
  final SystemWindowTone tone;
  final IconData icon;
  final Widget? extraContent;
  final String primaryLabel;
  final VoidCallback? onPrimary;
  final String? secondaryLabel;
  final VoidCallback? onSecondary;
  final bool enableShare;

  const SystemWindowDialog({
    super.key,
    required this.headerTag,
    required this.title,
    required this.body,
    this.tone = SystemWindowTone.cyan,
    this.icon = Icons.auto_awesome,
    this.extraContent,
    this.primaryLabel = 'ACKNOWLEDGE',
    this.onPrimary,
    this.secondaryLabel,
    this.onSecondary,
    this.enableShare = false,
  });

  static Future<void> _dialogQueue = Future.value();

  static Future<void> show(
    BuildContext context, {
    required String headerTag,
    required String title,
    required String body,
    SystemWindowTone tone = SystemWindowTone.cyan,
    IconData icon = Icons.auto_awesome,
    Widget? extraContent,
    String primaryLabel = 'ACKNOWLEDGE',
    VoidCallback? onPrimary,
    String? secondaryLabel,
    VoidCallback? onSecondary,
    bool enableShare = false,
    SystemSfxCue? sfxCue,
  }) {
    final cue = sfxCue ?? _cueForTone(tone);
    final haptic = _hapticForTone(tone);

    // Chain onto FIFO queue so rapid triggers never stack multiple blocking overlays
    final next = _dialogQueue.then((_) async {
      if (!context.mounted) return;
      unawaited(SystemAudioService.playCue(cue, haptic: haptic));
      await showGeneralDialog<void>(
        context: context,
        barrierDismissible: true,
        barrierLabel: 'SystemWindow',
        barrierColor: Colors.black.withValues(alpha: 0.80),
        transitionDuration: 220.ms,
        pageBuilder: (ctx, _, _) => SystemWindowDialog(
          headerTag: headerTag,
          title: title,
          body: body,
          tone: tone,
          icon: icon,
          extraContent: extraContent,
          primaryLabel: primaryLabel,
          onPrimary: onPrimary ?? () => Navigator.of(ctx).pop(),
          secondaryLabel: secondaryLabel,
          onSecondary: onSecondary ?? () => Navigator.of(ctx).pop(),
          enableShare: enableShare,
        ),
      );
    }).catchError((_) {});

    _dialogQueue = next;
    return next;
  }

  static SystemSfxCue _cueForTone(SystemWindowTone tone) {
    switch (tone) {
      case SystemWindowTone.crimson:
        return SystemSfxCue.alarmRed;
      case SystemWindowTone.purple:
        return SystemSfxCue.ariseRumble;
      case SystemWindowTone.gold:
        return SystemSfxCue.levelUp;
      case SystemWindowTone.cyan:
        return SystemSfxCue.ping;
    }
  }

  static SystemHapticPattern _hapticForTone(SystemWindowTone tone) {
    switch (tone) {
      case SystemWindowTone.crimson:
        return SystemHapticPattern.criticalWarning;
      case SystemWindowTone.gold:
      case SystemWindowTone.purple:
        return SystemHapticPattern.victoryBurst;
      case SystemWindowTone.cyan:
        return SystemHapticPattern.lightPulse;
    }
  }

  static Future<void> showLevelUp(
    BuildContext context, {
    required int newLevel,
    int pointsAwarded = 3,
    String? systemLine,
  }) {
    return show(
      context,
      headerTag: 'SYSTEM NOTIFICATION',
      title: 'LEVEL UP! -> LV. $newLevel',
      body: systemLine ??
          'Your vessel capacity has expanded.\n+$pointsAwarded Spendable Ability Points awarded. Allocate them in Stats.',
      tone: SystemWindowTone.gold,
      icon: Icons.bolt_rounded,
      primaryLabel: 'CONFIRM ASCENSION',
      enableShare: true,
      sfxCue: SystemSfxCue.levelUp,
    );
  }

  static Future<void> showRankPromotion(
    BuildContext context, {
    required String newRank,
  }) {
    return show(
      context,
      headerTag: 'HUNTER ASSOCIATION',
      title: 'RANK PROMOTION: [$newRank-RANK]',
      body:
          'Re-awakening examination verified. Your official Hunter License and Authority tier have permanently ascended to $newRank-Rank.',
      tone: SystemWindowTone.gold,
      icon: Icons.workspace_premium_rounded,
      primaryLabel: 'CLAIM AUTHORITY',
      enableShare: true,
      sfxCue: SystemSfxCue.levelUp,
    );
  }

  static Future<void> showShadowArise(
    BuildContext context, {
    required List<String> shadowIds,
    String? customLore,
  }) {
    final formatted = shadowIds.map((e) => e.toUpperCase()).join(', ');
    return show(
      context,
      headerTag: 'MONARCH AUTHORITY',
      title: 'ARISE — SHADOW EXTRACTED',
      body: customLore ??
          'Extraction succeeded: $formatted has pledged loyalty to your Shadow Army. Equip active Shadow buffs from the Shadow Monarch deck.',
      tone: SystemWindowTone.purple,
      icon: Icons.shield_moon_rounded,
      primaryLabel: 'ARISE',
      enableShare: true,
      sfxCue: SystemSfxCue.ariseRumble,
    );
  }

  static Future<void> showPenaltyEntered(BuildContext context) {
    return show(
      context,
      headerTag: 'SYSTEM PENALTY ALERT',
      title: 'PENALTY ZONE ENTERED',
      body:
          'Missed Daily Protocol detected. Supply Depot Shop purchases are locked until you complete your Penalty Survival Quest or finish a 10+ minute Comeback Sprint.',
      tone: SystemWindowTone.crimson,
      icon: Icons.gpp_bad_rounded,
      primaryLabel: 'BEGIN SURVIVAL',
      sfxCue: SystemSfxCue.alarmRed,
    );
  }

  static Future<void> showDailyArrival(
    BuildContext context, {
    required List<QuestModel> quests,
    VoidCallback? onSelectAnchor,
  }) {
    final topQuests = quests.where((q) => !q.completed).take(3).toList();
    return show(
      context,
      headerTag: 'SYSTEM NOTICE // QUEST ASSIGNED',
      title: 'DAILY PREPARATION TO BECOME STRONG',
      body: topQuests.isEmpty
          ? 'Daily Protocol initialized. Review your tactical missions and lock your Morning Anchor.'
          : 'Today\'s core directives:\n${topQuests.map((q) => '• ${q.title}').join('\n')}',
      tone: SystemWindowTone.cyan,
      icon: Icons.terminal_rounded,
      primaryLabel: onSelectAnchor != null ? 'LOCK ANCHOR QUEST' : 'ACCEPT QUESTS',
      onPrimary: () {
        Navigator.of(context).pop();
        onSelectAnchor?.call();
      },
      secondaryLabel: onSelectAnchor != null ? 'LATER' : null,
      sfxCue: SystemSfxCue.ping,
    );
  }

  @override
  State<SystemWindowDialog> createState() => _SystemWindowDialogState();
}

class _SystemWindowDialogState extends State<SystemWindowDialog> {
  final GlobalKey _captureKey = GlobalKey();
  Timer? _typeTimer;
  int _visibleChars = 0;
  bool _sharing = false;

  @override
  void initState() {
    super.initState();
    _startTypewriter();
  }

  void _startTypewriter() {
    final total = widget.body.length;
    if (total <= 24) {
      _visibleChars = total;
      return;
    }
    _visibleChars = 0;
    final step = total > 140 ? 4 : 2;
    _typeTimer = Timer.periodic(const Duration(milliseconds: 16), (t) {
      if (!mounted) {
        t.cancel();
        return;
      }
      setState(() {
        _visibleChars = (_visibleChars + step).clamp(0, total);
        if (_visibleChars >= total) t.cancel();
      });
    });
  }

  void _skipTypewriter() {
    _typeTimer?.cancel();
    if (_visibleChars < widget.body.length) {
      setState(() => _visibleChars = widget.body.length);
    }
  }

  Future<void> _shareWindowCard() async {
    setState(() => _sharing = true);
    try {
      final boundary =
          _captureKey.currentContext?.findRenderObject() as RenderRepaintBoundary?;
      if (boundary == null) return;
      final image = await boundary.toImage(pixelRatio: 2.5);
      final bytes = await image.toByteData(format: ui.ImageByteFormat.png);
      if (bytes == null) return;
      final dir = await getTemporaryDirectory();
      final file = File(
        '${dir.path}/system_window_${DateTime.now().millisecondsSinceEpoch}.png',
      );
      await file.writeAsBytes(bytes.buffer.asUint8List());
      await SharePlus.instance.share(
        ShareParams(
          files: [XFile(file.path)],
          text: '[ASCENSION PROTOCOL] ${widget.title}',
        ),
      );
    } catch (_) {
    } finally {
      if (mounted) setState(() => _sharing = false);
    }
  }

  @override
  void dispose() {
    _typeTimer?.cancel();
    super.dispose();
  }

  Color get _accent {
    switch (widget.tone) {
      case SystemWindowTone.gold:
        return HunterTheme.gold;
      case SystemWindowTone.crimson:
        return HunterTheme.crimson;
      case SystemWindowTone.purple:
        return HunterTheme.purple;
      case SystemWindowTone.cyan:
        return HunterTheme.cyan;
    }
  }

  @override
  Widget build(BuildContext context) {
    final accent = _accent;
    final shownBody = widget.body.substring(0, _visibleChars.clamp(0, widget.body.length));

    return Center(
      child: Material(
        color: Colors.transparent,
        child: RepaintBoundary(
          key: _captureKey,
          child: Container(
            width: MediaQuery.of(context).size.width * 0.89,
            constraints: const BoxConstraints(maxWidth: 420),
            decoration: BoxDecoration(
              color: HunterTheme.abyss.withValues(alpha: 0.96),
              borderRadius: BorderRadius.circular(14),
              border: Border.all(color: accent, width: 1.6),
              boxShadow: [
                BoxShadow(
                  color: accent.withValues(alpha: 0.38),
                  blurRadius: 30,
                  spreadRadius: 2,
                ),
              ],
            ),
            child: ClipRRect(
              borderRadius: BorderRadius.circular(14),
              child: CustomPaint(
                painter: _ScanlinePainter(accent: accent),
                child: Padding(
                  padding: const EdgeInsets.all(20),
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Row(
                        children: [
                          Container(
                            padding: const EdgeInsets.all(6),
                            decoration: BoxDecoration(
                              color: accent.withValues(alpha: 0.16),
                              borderRadius: BorderRadius.circular(8),
                              border: Border.all(color: accent.withValues(alpha: 0.5)),
                            ),
                            child: Icon(widget.icon, color: accent, size: 18),
                          ),
                          const SizedBox(width: 10),
                          Expanded(
                            child: Text(
                              '[ ${widget.headerTag} ]',
                              style: TextStyle(
                                color: accent,
                                fontSize: 11,
                                fontWeight: FontWeight.w900,
                                letterSpacing: 1.8,
                              ),
                            ),
                          ),
                          if (widget.enableShare)
                            IconButton(
                              onPressed: _sharing ? null : _shareWindowCard,
                              tooltip: 'Share System Card',
                              icon: _sharing
                                  ? SizedBox(
                                      width: 15,
                                      height: 15,
                                      child: CircularProgressIndicator(
                                        strokeWidth: 2,
                                        color: accent,
                                      ),
                                    )
                                  : Icon(Icons.share_rounded, color: accent, size: 18),
                            ),
                        ],
                      ),
                      const SizedBox(height: 10),
                      Divider(color: accent.withValues(alpha: 0.35), height: 1),
                      const SizedBox(height: 16),
                      Text(
                        widget.title,
                        textAlign: TextAlign.center,
                        style: const TextStyle(
                          color: HunterTheme.textPrimary,
                          fontSize: 18,
                          fontWeight: FontWeight.w900,
                          letterSpacing: 1.1,
                        ),
                      ),
                      const SizedBox(height: 10),
                      GestureDetector(
                        onTap: _skipTypewriter,
                        child: Text(
                          shownBody,
                          textAlign: TextAlign.center,
                          style: const TextStyle(
                            color: HunterTheme.textMuted,
                            fontSize: 13.5,
                            height: 1.45,
                          ),
                        ),
                      ),
                      if (widget.extraContent != null) ...[
                        const SizedBox(height: 14),
                        widget.extraContent!,
                      ],
                      const SizedBox(height: 20),
                      Row(
                        children: [
                          if (widget.secondaryLabel != null) ...[
                            Expanded(
                              child: OutlinedButton(
                                onPressed: widget.onSecondary,
                                style: OutlinedButton.styleFrom(
                                  foregroundColor: HunterTheme.textMuted,
                                  side: BorderSide(color: accent.withValues(alpha: 0.3)),
                                  padding: const EdgeInsets.symmetric(vertical: 12),
                                  shape: RoundedRectangleBorder(
                                    borderRadius: BorderRadius.circular(10),
                                  ),
                                ),
                                child: Text(
                                  widget.secondaryLabel!,
                                  style: const TextStyle(
                                    fontWeight: FontWeight.bold,
                                    letterSpacing: 1,
                                  ),
                                ),
                              ),
                            ),
                            const SizedBox(width: 10),
                          ],
                          Expanded(
                            child: ElevatedButton(
                              onPressed: () {
                                _skipTypewriter();
                                widget.onPrimary?.call();
                              },
                              style: ElevatedButton.styleFrom(
                                backgroundColor: accent,
                                foregroundColor: accent == HunterTheme.purple ||
                                        accent == HunterTheme.crimson
                                    ? Colors.white
                                    : Colors.black,
                                padding: const EdgeInsets.symmetric(vertical: 12),
                                shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(10),
                                ),
                              ),
                              child: Text(
                                widget.primaryLabel,
                                style: const TextStyle(
                                  fontWeight: FontWeight.w900,
                                  letterSpacing: 1.2,
                                  fontSize: 12.5,
                                ),
                              ),
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ).animate().scale(begin: const Offset(0.92, 0.92), duration: 200.ms).fadeIn(),
        ),
      ),
    );
  }
}

class _ScanlinePainter extends CustomPainter {
  final Color accent;
  const _ScanlinePainter({required this.accent});

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = accent.withValues(alpha: 0.045)
      ..strokeWidth = 1;
    for (double y = 0; y < size.height; y += 5) {
      canvas.drawLine(Offset(0, y), Offset(size.width, y), paint);
    }
  }

  @override
  bool shouldRepaint(covariant _ScanlinePainter oldDelegate) =>
      oldDelegate.accent != accent;
}
