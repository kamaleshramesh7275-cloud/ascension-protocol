import 'dart:io';
import 'dart:ui' as ui;
import 'package:flutter/material.dart';
import 'package:flutter/rendering.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:path_provider/path_provider.dart';
import 'package:share_plus/share_plus.dart';
import '../../core/api/api_error.dart';
import '../../core/providers/roadmap_provider.dart';
import '../../core/providers/system_mechanics_provider.dart';
import '../../core/theme/hunter_theme.dart';
import '../../models/weekly_recap_model.dart';

/// SR-5 Sunday Weekly Hunter Association Evolution Dossier sheet with PNG share.
class WeeklyRecapSheet extends ConsumerStatefulWidget {
  const WeeklyRecapSheet({super.key});

  static Future<void> show(BuildContext context) {
    return showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => const WeeklyRecapSheet(),
    );
  }

  @override
  ConsumerState<WeeklyRecapSheet> createState() => _WeeklyRecapSheetState();
}

class _WeeklyRecapSheetState extends ConsumerState<WeeklyRecapSheet> {
  final GlobalKey _captureKey = GlobalKey();
  bool _sharing = false;
  bool _applyingMonday = false;

  Future<void> _applyMondayAdjustment(int suggestedMinutes) async {
    setState(() => _applyingMonday = true);
    try {
      await ref
          .read(roadmapProvider.notifier)
          .recalibrate(dailyCapacityMinutes: suggestedMinutes);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            backgroundColor: HunterTheme.surface,
            content: Text(
              'Monday daily capacity calibrated to ${suggestedMinutes}m.',
              style: const TextStyle(color: HunterTheme.cyanLight),
            ),
          ),
        );
      }
    } catch (_) {
    } finally {
      if (mounted) setState(() => _applyingMonday = false);
    }
  }

  Future<void> _shareDossier(WeeklyRecapModel recap) async {
    setState(() => _sharing = true);
    try {
      final boundary =
          _captureKey.currentContext?.findRenderObject() as RenderRepaintBoundary?;
      if (boundary == null) return;
      final image = await boundary.toImage(pixelRatio: 2.5);
      final byteData = await image.toByteData(format: ui.ImageByteFormat.png);
      if (byteData == null) return;

      final dir = await getTemporaryDirectory();
      final file = File(
          '${dir.path}/hunter_dossier_${DateTime.now().millisecondsSinceEpoch}.png');
      await file.writeAsBytes(byteData.buffer.asUint8List());

      await SharePlus.instance.share(
        ShareParams(
          files: [XFile(file.path)],
          text:
              'Ascension Protocol Weekly Dossier — ${recap.archetype} (Top ${100 - recap.percentile}% Hunter, Tier ${recap.tier})',
        ),
      );
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          backgroundColor: HunterTheme.crimson,
          content: Text('Export failed: $e'),
        ),
      );
    } finally {
      if (mounted) setState(() => _sharing = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final asyncRecap = ref.watch(weeklyRecapProvider);

    return Container(
      margin: const EdgeInsets.only(top: 48),
      decoration: const BoxDecoration(
        color: HunterTheme.abyss,
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      child: asyncRecap.when(
        loading: () => const SizedBox(
          height: 320,
          child: Center(child: CircularProgressIndicator(color: HunterTheme.cyan)),
        ),
        error: (err, _) => Padding(
          padding: const EdgeInsets.all(24),
          child: Text(
            extractApiError(err, 'Failed to compile weekly dossier'),
            style: const TextStyle(color: HunterTheme.crimson),
          ),
        ),
        data: (recap) => SingleChildScrollView(
          padding: const EdgeInsets.fromLTRB(18, 14, 18, 28),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                width: 44,
                height: 4,
                decoration: BoxDecoration(
                  color: HunterTheme.textMuted.withValues(alpha: 0.4),
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
              const SizedBox(height: 16),
              RepaintBoundary(
                key: _captureKey,
                child: Container(
                  padding: const EdgeInsets.all(20),
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
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(color: HunterTheme.gold.withValues(alpha: 0.65), width: 1.5),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text(
                            recap.dateRange,
                            style: const TextStyle(
                              color: HunterTheme.cyanLight,
                              fontSize: 10.5,
                              fontWeight: FontWeight.w900,
                              letterSpacing: 1.4,
                            ),
                          ),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                            decoration: BoxDecoration(
                              color: HunterTheme.gold.withValues(alpha: 0.16),
                              borderRadius: BorderRadius.circular(8),
                              border: Border.all(color: HunterTheme.gold),
                            ),
                            child: Text(
                              '${recap.percentile}TH PERCENTILE',
                              style: const TextStyle(
                                color: HunterTheme.gold,
                                fontSize: 10.5,
                                fontWeight: FontWeight.w900,
                              ),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 16),
                      Text(
                        recap.archetype,
                        style: const TextStyle(
                          color: HunterTheme.textPrimary,
                          fontSize: 28,
                          fontWeight: FontWeight.w900,
                          letterSpacing: 1.5,
                        ),
                      ),
                      Text(
                        '${recap.archetypeTag} • ${recap.userName.toUpperCase()}',
                        style: const TextStyle(
                          color: HunterTheme.purple,
                          fontSize: 12,
                          fontWeight: FontWeight.bold,
                          letterSpacing: 1.2,
                        ),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        recap.archetypeDescription,
                        style: const TextStyle(color: HunterTheme.textMuted, fontSize: 12.5),
                      ),
                      const SizedBox(height: 18),
                      GridView.count(
                        shrinkWrap: true,
                        physics: const NeverScrollableScrollPhysics(),
                        crossAxisCount: 2,
                        mainAxisSpacing: 10,
                        crossAxisSpacing: 10,
                        childAspectRatio: 2.1,
                        children: [
                          _metricTile('DEEP WORK', '${recap.deepWorkMinutes} MIN', HunterTheme.cyan),
                          _metricTile('QUESTS CLEARED', '${recap.missionsCompleted}', HunterTheme.emerald),
                          _metricTile('GYM TONNAGE', '${recap.totalTonnage} KG', HunterTheme.crimson),
                          _metricTile('STREAK DAYS', '${recap.streakDays}D', HunterTheme.gold),
                        ],
                      ),
                      const SizedBox(height: 12),
                      if (recap.roadmapProgressPercent > 0 ||
                          recap.bottleneckStat != null ||
                          recap.coachSummary != null ||
                          recap.mondayAdjustment != null) ...[
                        Container(
                          width: double.infinity,
                          padding: const EdgeInsets.all(10),
                          decoration: BoxDecoration(
                            color: HunterTheme.abyss.withValues(alpha: 0.7),
                            borderRadius: BorderRadius.circular(10),
                            border: Border.all(
                              color: HunterTheme.cyan.withValues(alpha: 0.35),
                            ),
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                'ROADMAP PROGRESS: ${recap.roadmapProgressPercent}%${recap.preferredPeakHour != null ? "  •  PEAK HOUR: ${recap.preferredPeakHour.toString().padLeft(2, '0')}:00" : ""}',
                                style: const TextStyle(
                                  color: HunterTheme.cyanLight,
                                  fontWeight: FontWeight.w900,
                                  fontSize: 10.5,
                                ),
                              ),
                              if (recap.coachSummary != null && recap.coachSummary!.isNotEmpty) ...[
                                const SizedBox(height: 6),
                                Text(
                                  recap.coachSummary!,
                                  style: const TextStyle(
                                    color: HunterTheme.textPrimary,
                                    fontSize: 11.5,
                                    height: 1.35,
                                  ),
                                ),
                              ],
                              if (recap.dayPatternInsight != null &&
                                  recap.dayPatternInsight!.isNotEmpty) ...[
                                const SizedBox(height: 5),
                                Text(
                                  recap.dayPatternInsight!,
                                  style: const TextStyle(
                                    color: HunterTheme.gold,
                                    fontSize: 11,
                                    fontWeight: FontWeight.w600,
                                  ),
                                ),
                              ],
                              if (recap.mondayAdjustment != null &&
                                  recap.mondayAdjustment!.isNotEmpty) ...[
                                const SizedBox(height: 5),
                                Text(
                                  'Monday Rebalance: ${recap.mondayAdjustment!}',
                                  style: const TextStyle(
                                    color: HunterTheme.cyanLight,
                                    fontSize: 11.5,
                                    fontWeight: FontWeight.w600,
                                  ),
                                ),
                              ] else if (recap.nextWeekRecommendation != null) ...[
                                const SizedBox(height: 4),
                                Text(
                                  'Next Week Focus (${recap.bottleneckStat ?? "Core"}): ${recap.nextWeekRecommendation}',
                                  style: const TextStyle(
                                    color: HunterTheme.textPrimary,
                                    fontSize: 11.5,
                                  ),
                                ),
                              ],
                            ],
                          ),
                        ),
                        const SizedBox(height: 12),
                      ],
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text(
                            'RANK TIER: ${recap.tier}-RANK',
                            style: const TextStyle(
                              color: HunterTheme.gold,
                              fontWeight: FontWeight.w900,
                              fontSize: 12,
                            ),
                          ),
                          Text(
                            'STREAK: ${recap.streakDays}D',
                            style: const TextStyle(
                              color: HunterTheme.cyanLight,
                              fontWeight: FontWeight.bold,
                              fontSize: 12,
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ),
              if (recap.suggestedDailyMinutes != null) ...[
                const SizedBox(height: 12),
                SizedBox(
                  width: double.infinity,
                  child: OutlinedButton.icon(
                    onPressed: _applyingMonday
                        ? null
                        : () => _applyMondayAdjustment(recap.suggestedDailyMinutes!),
                    icon: _applyingMonday
                        ? const SizedBox(
                            width: 15,
                            height: 15,
                            child: CircularProgressIndicator(
                              strokeWidth: 2,
                              color: HunterTheme.cyan,
                            ),
                          )
                        : const Icon(Icons.tune_rounded, color: HunterTheme.cyan),
                    label: Text(
                      'APPLY MONDAY ADJUSTMENT (${recap.suggestedDailyMinutes}M/DAY)',
                      style: const TextStyle(
                        color: HunterTheme.cyanLight,
                        fontWeight: FontWeight.w900,
                        letterSpacing: 0.9,
                      ),
                    ),
                    style: OutlinedButton.styleFrom(
                      side: const BorderSide(color: HunterTheme.cyan),
                      padding: const EdgeInsets.symmetric(vertical: 13),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                    ),
                  ),
                ),
              ],
              const SizedBox(height: 12),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton.icon(
                  onPressed: _sharing ? null : () => _shareDossier(recap),
                  icon: _sharing
                      ? const SizedBox(
                          width: 16,
                          height: 16,
                          child: CircularProgressIndicator(strokeWidth: 2, color: Colors.black),
                        )
                      : const Icon(Icons.share_rounded),
                  label: const Text(
                    'EXPORT PNG EVOLUTION DOSSIER',
                    style: TextStyle(fontWeight: FontWeight.w900, letterSpacing: 1.2),
                  ),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: HunterTheme.gold,
                    foregroundColor: Colors.black,
                    padding: const EdgeInsets.symmetric(vertical: 14),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _metricTile(String label, String value, Color accent) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
      decoration: BoxDecoration(
        color: HunterTheme.abyss.withValues(alpha: 0.8),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: accent.withValues(alpha: 0.35)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Text(
            label,
            style: TextStyle(
              color: accent,
              fontSize: 9.5,
              fontWeight: FontWeight.w900,
              letterSpacing: 1.1,
            ),
          ),
          const SizedBox(height: 2),
          Text(
            value,
            style: const TextStyle(
              color: HunterTheme.textPrimary,
              fontSize: 16,
              fontWeight: FontWeight.w900,
            ),
          ),
        ],
      ),
    );
  }
}
