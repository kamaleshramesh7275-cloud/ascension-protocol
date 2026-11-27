import 'dart:async';
import 'package:flutter/material.dart';
import '../services/system_audio_service.dart';
import '../theme/hunter_theme.dart';
import 'system_window_dialog.dart';

/// Live ticking HH:MM:SS countdown + 4-Part Daily Quest Ultimatum scorecard (#1).
class DailyCountdownBanner extends StatefulWidget {
  final bool inPenaltyZone;
  final int remainingQuests;
  final int completedParts;
  final int totalParts;
  final bool shieldAbsorbed;
  final bool alertSentToday;
  final String? warningLine;
  final List<Map<String, dynamic>> items;
  final VoidCallback? onUrgentAlertTriggered;

  const DailyCountdownBanner({
    super.key,
    this.inPenaltyZone = false,
    this.remainingQuests = 0,
    this.completedParts = 0,
    this.totalParts = 4,
    this.shieldAbsorbed = false,
    this.alertSentToday = false,
    this.warningLine,
    this.items = const [],
    this.onUrgentAlertTriggered,
  });

  /// Deterministic calculation for midnight remaining duration (tested in unit tests).
  static Duration timeUntilMidnight(DateTime now) {
    final nextMidnight = DateTime(now.year, now.month, now.day + 1);
    final diff = nextMidnight.difference(now);
    return diff.isNegative ? Duration.zero : diff;
  }

  static String formatHms(Duration d) {
    final hours = d.inHours.toString().padLeft(2, '0');
    final minutes = (d.inMinutes % 60).toString().padLeft(2, '0');
    final seconds = (d.inSeconds % 60).toString().padLeft(2, '0');
    return '$hours:$minutes:$seconds';
  }

  @override
  State<DailyCountdownBanner> createState() => _DailyCountdownBannerState();
}

class _DailyCountdownBannerState extends State<DailyCountdownBanner> {
  late Duration _remaining;
  Timer? _timer;
  bool _localAlerted = false;

  @override
  void initState() {
    super.initState();
    _remaining = DailyCountdownBanner.timeUntilMidnight(DateTime.now());
    _checkTMinusOneAlert();
    _timer = Timer.periodic(const Duration(seconds: 1), (_) {
      if (!mounted) return;
      setState(() {
        _remaining = DailyCountdownBanner.timeUntilMidnight(DateTime.now());
      });
      _checkTMinusOneAlert();
    });
  }

  void _checkTMinusOneAlert() {
    final allDone = widget.items.isNotEmpty && widget.completedParts >= widget.totalParts;
    if (!allDone &&
        !widget.inPenaltyZone &&
        !widget.alertSentToday &&
        !_localAlerted &&
        _remaining.inSeconds > 0 &&
        _remaining.inMinutes < 60 &&
        widget.remainingQuests > 0) {
      _localAlerted = true;
      unawaited(SystemAudioService.playCue(
        SystemSfxCue.alarmRed,
        haptic: SystemHapticPattern.criticalWarning,
      ));
      widget.onUrgentAlertTriggered?.call();
    }
  }

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }

  void _openShareCard() {
    final checklistSummary = widget.items.isEmpty
        ? '4/4 Core Directives Cleared before midnight.'
        : widget.items.map((i) => '✓ ${i['label']} (${i['progress']})').join('\n');
    SystemWindowDialog.show(
      context,
      headerTag: 'DAILY ULTIMATUM CLEARED',
      title: 'DAILY QUEST 4/4 SECURED',
      body: '$checklistSummary\n\nZero penalties triggered.',
      tone: SystemWindowTone.gold,
      icon: Icons.verified_rounded,
      primaryLabel: 'CLOSE',
      enableShare: true,
    );
  }

  @override
  Widget build(BuildContext context) {
    final isAllDone = widget.items.isNotEmpty && widget.completedParts >= widget.totalParts;
    final isTMinusOne = !isAllDone && _remaining.inMinutes < 60 && widget.remainingQuests > 0;
    final isUrgent = widget.inPenaltyZone || isTMinusOne;
    final accent = widget.inPenaltyZone
        ? HunterTheme.crimson
        : isAllDone
            ? HunterTheme.emerald
            : (isTMinusOne ? HunterTheme.crimson : HunterTheme.cyan);

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 11),
      decoration: BoxDecoration(
        color: accent.withValues(alpha: 0.08),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: accent.withValues(alpha: 0.45)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(
                isUrgent
                    ? Icons.warning_amber_rounded
                    : (isAllDone ? Icons.verified_rounded : Icons.schedule),
                size: 18,
                color: accent,
              ),
              const SizedBox(width: 10),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      widget.inPenaltyZone
                          ? 'PENALTY ZONE SURVIVAL DEADLINE'
                          : isAllDone
                              ? 'DAILY ULTIMATUM: 4/4 CLEARED'
                              : 'DAILY QUEST ULTIMATUM (${widget.completedParts}/${widget.totalParts})',
                      style: TextStyle(
                        color: accent,
                        fontSize: 10,
                        fontWeight: FontWeight.w900,
                        letterSpacing: 1.2,
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      widget.inPenaltyZone
                          ? 'Shop locked until survival quest or 10m Comeback clears.'
                          : (isTMinusOne && (widget.warningLine ?? '').isNotEmpty
                              ? widget.warningLine!
                              : (isAllDone
                                  ? 'Full day secured. Penalty Zone averted.'
                                  : 'Clear all 4 pillars before 23:59 or enter Penalty Zone.')),
                      style: TextStyle(
                        color: isTMinusOne ? HunterTheme.crimson : HunterTheme.textMuted,
                        fontSize: 11,
                        fontWeight: isTMinusOne ? FontWeight.bold : FontWeight.normal,
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 8),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                decoration: BoxDecoration(
                  color: HunterTheme.abyss,
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: accent.withValues(alpha: 0.5)),
                ),
                child: Text(
                  DailyCountdownBanner.formatHms(_remaining),
                  style: TextStyle(
                    color: isUrgent ? HunterTheme.crimson : HunterTheme.cyanLight,
                    fontWeight: FontWeight.w900,
                    fontSize: 13,
                    letterSpacing: 1.2,
                    fontFeatures: const [FontFeature.tabularFigures()],
                  ),
                ),
              ),
            ],
          ),
          if (widget.shieldAbsorbed) ...[
            const SizedBox(height: 8),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
              decoration: BoxDecoration(
                color: HunterTheme.gold.withValues(alpha: 0.14),
                borderRadius: BorderRadius.circular(6),
                border: Border.all(color: HunterTheme.gold.withValues(alpha: 0.45)),
              ),
              child: Text(
                '🛡️ MANA SHIELD ABSORBED YESTERDAY\'S MISS — STREAK PROTECTED',
                style: TextStyle(
                  color: HunterTheme.gold,
                  fontSize: 9.5,
                  fontWeight: FontWeight.w900,
                  letterSpacing: 0.8,
                ),
              ),
            ),
          ],
          if (widget.items.isNotEmpty) ...[
            const SizedBox(height: 9),
            Wrap(
              spacing: 6,
              runSpacing: 6,
              children: widget.items.map((item) {
                final done = item['done'] == true;
                return Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(
                    color: done
                        ? HunterTheme.emerald.withValues(alpha: 0.16)
                        : HunterTheme.abyss,
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(
                      color: done
                          ? HunterTheme.emerald.withValues(alpha: 0.6)
                          : accent.withValues(alpha: 0.25),
                    ),
                  ),
                  child: Text(
                    '${done ? "✓" : "○"} ${item['label']?.toString().split(' ').take(2).join(' ')} (${item['progress']})',
                    style: TextStyle(
                      color: done ? HunterTheme.emerald : HunterTheme.textMuted,
                      fontSize: 10,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                );
              }).toList(),
            ),
          ],
          if (isAllDone) ...[
            const SizedBox(height: 8),
            Align(
              alignment: Alignment.centerRight,
              child: TextButton.icon(
                onPressed: _openShareCard,
                icon: Icon(Icons.share_rounded, size: 15, color: HunterTheme.gold),
                label: Text(
                  'SHARE 4/4 CARD',
                  style: TextStyle(
                    color: HunterTheme.gold,
                    fontWeight: FontWeight.w900,
                    fontSize: 11,
                  ),
                ),
                style: TextButton.styleFrom(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  minimumSize: Size.zero,
                  tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                ),
              ),
            ),
          ],
        ],
      ),
    );
  }
}
