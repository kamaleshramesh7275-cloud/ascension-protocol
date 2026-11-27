import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/api/api_client.dart';
import '../../core/api/api_endpoints.dart';
import '../../core/api/api_error.dart';
import '../../core/providers/auth_provider.dart';
import '../../core/services/system_audio_service.dart';
import '../../core/theme/hunter_theme.dart';
import '../../core/widgets/system_window_dialog.dart';
import '../../models/user_model.dart';
import '../focus/focus_screen.dart';

/// Feature #10 Red Gate Comeback modal triggered after 3+ inactive days (14d cooldown).
class ComebackGateSheet extends ConsumerStatefulWidget {
  final Map<String, dynamic> gate;

  const ComebackGateSheet({super.key, required this.gate});

  static Future<void> show(BuildContext context, Map<String, dynamic> gate) {
    SystemAudioService.playCue(
      SystemSfxCue.alarmRed,
      haptic: SystemHapticPattern.criticalWarning,
    );
    return showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => ComebackGateSheet(gate: gate),
    );
  }

  @override
  ConsumerState<ComebackGateSheet> createState() => _ComebackGateSheetState();
}

class _ComebackGateSheetState extends ConsumerState<ComebackGateSheet> {
  bool _quickSetDone = false;
  bool _submitting = false;

  Future<void> _claimComeback() async {
    setState(() => _submitting = true);
    try {
      final dio = await ApiClient.getInstance();
      final res = await dio.post(
        ApiEndpoints.comebackComplete,
        data: {'quickSetConfirmed': _quickSetDone},
      );
      if (res.data is Map<String, dynamic>) {
        final data = res.data as Map<String, dynamic>;
        if (data['user'] is Map<String, dynamic>) {
          ref.read(authProvider.notifier).updateUser(
                UserModel.fromJson(data['user'] as Map<String, dynamic>),
              );
        }
        if (mounted) {
          Navigator.of(context).pop();
          await SystemWindowDialog.show(
            context,
            headerTag: 'RED GATE CLEARED',
            title: 'HUNTER. YOU ARE STILL ALIVE.',
            body: data['systemLine']?.toString() ??
                '${data['restoredStreak'] ?? 1}-day streak restored. +50 XP granted.',
            tone: SystemWindowTone.gold,
            icon: Icons.local_fire_department_rounded,
            enableShare: true,
          );
        }
      }
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          backgroundColor: HunterTheme.crimson,
          content: Text(extractApiError(e, 'Complete 10m Focus first to break the Red Gate.')),
        ),
      );
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final brief = widget.gate['aiBrief']?.toString() ??
        'Hunter. You are still alive. Complete one 10m Air-Gap sprint + 1 workout set to reclaim 50% of your streak.';
    final restoreDays = (widget.gate['restoredFromStreak'] as num?)?.toInt() ?? 1;

    return Container(
      decoration: const BoxDecoration(
        color: HunterTheme.surface,
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
        border: Border(top: BorderSide(color: HunterTheme.crimson, width: 2)),
      ),
      padding: const EdgeInsets.fromLTRB(20, 20, 20, 32),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: HunterTheme.crimson.withValues(alpha: 0.16),
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(color: HunterTheme.crimson),
                ),
                child: const Icon(Icons.door_front_door_outlined,
                    color: HunterTheme.crimson, size: 22),
              ),
              const SizedBox(width: 12),
              const Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      '[ RED GATE DETECTED ]',
                      style: TextStyle(
                        color: HunterTheme.crimson,
                        fontWeight: FontWeight.w900,
                        fontSize: 11,
                        letterSpacing: 1.5,
                      ),
                    ),
                    Text(
                      'COMEBACK PROTOCOL',
                      style: TextStyle(
                        color: HunterTheme.textPrimary,
                        fontWeight: FontWeight.w900,
                        fontSize: 18,
                      ),
                    ),
                  ],
                ),
              ),
              IconButton(
                onPressed: () => Navigator.of(context).pop(),
                icon: const Icon(Icons.close, color: HunterTheme.textMuted),
              ),
            ],
          ),
          const SizedBox(height: 14),
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              color: HunterTheme.abyss,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: HunterTheme.crimson.withValues(alpha: 0.4)),
            ),
            child: Text(
              brief,
              style: const TextStyle(
                color: HunterTheme.textPrimary,
                fontSize: 13.5,
                height: 1.45,
              ),
            ),
          ),
          const SizedBox(height: 14),
          Row(
            children: [
              Expanded(
                child: OutlinedButton.icon(
                  onPressed: () {
                    Navigator.of(context).pop();
                    Navigator.of(context).push(
                      MaterialPageRoute(
                        builder: (_) => const FocusScreen(
                          initialDurationMinutes: 10,
                          initialTask: 'Red Gate 10m Comeback Sprint',
                        ),
                      ),
                    );
                  },
                  icon: const Icon(Icons.timer_rounded, color: HunterTheme.cyanLight, size: 18),
                  label: const Text(
                    '1. RUN 10M SPRINT',
                    style: TextStyle(
                      color: HunterTheme.cyanLight,
                      fontWeight: FontWeight.w900,
                      fontSize: 11.5,
                    ),
                  ),
                  style: OutlinedButton.styleFrom(
                    side: const BorderSide(color: HunterTheme.cyan),
                    padding: const EdgeInsets.symmetric(vertical: 12),
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          CheckboxListTile(
            value: _quickSetDone,
            onChanged: (v) => setState(() => _quickSetDone = v ?? false),
            contentPadding: EdgeInsets.zero,
            activeColor: HunterTheme.gold,
            title: const Text(
              '2. Completed 1 workout set (10+ pushups / squats or gym session)',
              style: TextStyle(color: HunterTheme.textPrimary, fontSize: 12.5),
            ),
          ),
          const SizedBox(height: 12),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton.icon(
              onPressed: _submitting ? null : _claimComeback,
              icon: _submitting
                  ? const SizedBox(
                      width: 16,
                      height: 16,
                      child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                    )
                  : const Icon(Icons.bolt_rounded),
              label: Text(
                'BREAK RED GATE (+${restoreDays}D STREAK RESTORED)',
                style: const TextStyle(fontWeight: FontWeight.w900, letterSpacing: 0.8),
              ),
              style: ElevatedButton.styleFrom(
                backgroundColor: HunterTheme.crimson,
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(vertical: 14),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
