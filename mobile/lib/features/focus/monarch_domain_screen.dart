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

/// Feature #9 Monarch's Domain: Weekly 4-hour deep block (2x XP capped +600 XP, 7d cooldown).
class MonarchDomainScreen extends ConsumerStatefulWidget {
  const MonarchDomainScreen({super.key});

  @override
  ConsumerState<MonarchDomainScreen> createState() =>
      _MonarchDomainScreenState();
}

class _MonarchDomainScreenState extends ConsumerState<MonarchDomainScreen> {
  bool _busy = false;
  bool _workoutDone = false;

  Future<void> _startDomain() async {
    setState(() => _busy = true);
    try {
      final dio = await ApiClient.getInstance();
      final res = await dio.post(ApiEndpoints.domainStart);
      if (res.data is Map<String, dynamic> && res.data['user'] is Map<String, dynamic>) {
        ref.read(authProvider.notifier).updateUser(
              UserModel.fromJson(res.data['user'] as Map<String, dynamic>),
            );
      }
      await SystemAudioService.playCue(
        SystemSfxCue.ariseRumble,
        haptic: SystemHapticPattern.victoryBurst,
      );
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          backgroundColor: HunterTheme.crimson,
          content: Text(extractApiError(e, 'Monarch Domain unavailable (7-day cooldown)')),
        ),
      );
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _completeDomain() async {
    setState(() => _busy = true);
    try {
      final dio = await ApiClient.getInstance();
      final res = await dio.post(
        ApiEndpoints.domainComplete,
        data: {'workoutConfirmed': _workoutDone},
      );
      if (res.data is Map<String, dynamic>) {
        final data = res.data as Map<String, dynamic>;
        if (data['user'] is Map<String, dynamic>) {
          ref.read(authProvider.notifier).updateUser(
                UserModel.fromJson(data['user'] as Map<String, dynamic>),
              );
        }
        if (!mounted) return;
        await SystemWindowDialog.show(
          context,
          headerTag: 'MONARCH\'S DOMAIN CLEARED',
          title: '+${data['bonusXp'] ?? 300} 2X BONUS XP!',
          body: data['loreSummary']?.toString() ?? '4-Hour Sovereign Block conquered.',
          tone: SystemWindowTone.purple,
          icon: Icons.dark_mode_rounded,
          enableShare: true,
        );
      }
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          backgroundColor: HunterTheme.crimson,
          content: Text(extractApiError(e, 'Complete 3 sprints + workout first')),
        ),
      );
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final user = ref.watch(authProvider).value;
    final dom = user?.monarchDomainState;
    final status = dom?['status']?.toString() ?? 'idle';
    final steps = dom?['planSteps'] is List
        ? (dom!['planSteps'] as List).map((e) => e.toString()).toList()
        : const <String>[];

    return Scaffold(
      backgroundColor: const Color(0xFF06040D),
      appBar: AppBar(
        backgroundColor: const Color(0xFF06040D),
        elevation: 0,
        title: Text(
          'MONARCH\'S DOMAIN // 4H LOCK',
          style: TextStyle(
            color: HunterTheme.purple,
            fontWeight: FontWeight.w900,
            letterSpacing: 1.5,
            fontSize: 15,
          ),
        ),
      ),
      body: ListView(
        padding: const EdgeInsets.all(20),
        children: [
          Container(
            padding: const EdgeInsets.all(18),
            decoration: BoxDecoration(
              gradient: LinearGradient(
                colors: [
                  HunterTheme.purple.withValues(alpha: 0.25),
                  const Color(0xFF0B0816),
                ],
              ),
              borderRadius: BorderRadius.circular(18),
              border: Border.all(color: HunterTheme.purple, width: 1.5),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  '[ WEEKLY SOVEREIGN FIELD ]',
                  style: TextStyle(
                    color: HunterTheme.purple,
                    fontWeight: FontWeight.w900,
                    fontSize: 11,
                    letterSpacing: 1.4,
                  ),
                ),
                const SizedBox(height: 6),
                Text(
                  status == 'active'
                      ? 'DOMAIN EXPANDED — 2X XP ACTIVE'
                      : status == 'completed'
                          ? 'DOMAIN CONQUERED'
                          : '4-HOUR MONARCH\'S DOMAIN',
                  style: const TextStyle(
                    color: Colors.white,
                    fontWeight: FontWeight.w900,
                    fontSize: 19,
                  ),
                ),
                const SizedBox(height: 6),
                Text(
                  '7-day cooldown • 3 Focus sprints + 1 Workout inside 4h15m • Max +600 Bonus XP • >1 exit breach shatters Domain.',
                  style: TextStyle(color: HunterTheme.textMuted, fontSize: 12, height: 1.4),
                ),
              ],
            ),
          ),
          const SizedBox(height: 18),
          if (status == 'active') ...[
            Text(
              'AI BATTLE PLAN (CONQUER ALL 4 BLOCKS)',
              style: TextStyle(
                color: HunterTheme.cyanLight,
                fontWeight: FontWeight.w900,
                fontSize: 11.5,
                letterSpacing: 1.2,
              ),
            ),
            const SizedBox(height: 10),
            ...steps.asMap().entries.map((e) {
              final isFocus = e.key < 3;
              return Container(
                margin: const EdgeInsets.only(bottom: 10),
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: HunterTheme.surface,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: HunterTheme.purple.withValues(alpha: 0.45)),
                ),
                child: Row(
                  children: [
                    Expanded(
                      child: Text(
                        e.value,
                        style: TextStyle(color: HunterTheme.textPrimary, fontSize: 12.5),
                      ),
                    ),
                    if (isFocus)
                      TextButton(
                        onPressed: () => Navigator.of(context).push(
                          MaterialPageRoute(
                            builder: (_) => FocusScreen(
                              initialDurationMinutes: 45,
                              initialTask: e.value,
                            ),
                          ),
                        ),
                        child: Text(
                          'START 45M',
                          style: TextStyle(color: HunterTheme.cyanLight, fontWeight: FontWeight.w900),
                        ),
                      ),
                  ],
                ),
              );
            }),
            CheckboxListTile(
              value: _workoutDone,
              onChanged: (v) => setState(() => _workoutDone = v ?? false),
              activeColor: HunterTheme.purple,
              contentPadding: EdgeInsets.zero,
              title: Text(
                'Block 4: Completed Domain Workout / Finisher',
                style: TextStyle(color: HunterTheme.textPrimary, fontSize: 13),
              ),
            ),
            const SizedBox(height: 12),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: _busy ? null : _completeDomain,
                style: ElevatedButton.styleFrom(
                  backgroundColor: HunterTheme.purple,
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(vertical: 14),
                ),
                child: const Text(
                  'SEAL & CLAIM 2X DOMAIN BONUS (CAP +600 XP)',
                  style: TextStyle(fontWeight: FontWeight.w900),
                ),
              ),
            ),
          ] else ...[
            if (dom?['loreSummary'] != null) ...[
              Container(
                padding: const EdgeInsets.all(14),
                margin: const EdgeInsets.only(bottom: 14),
                decoration: BoxDecoration(
                  color: HunterTheme.surface,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Text(
                  dom!['loreSummary'].toString(),
                  style: TextStyle(color: HunterTheme.cyanLight, fontSize: 12.5),
                ),
              ),
            ],
            SizedBox(
              width: double.infinity,
              child: ElevatedButton.icon(
                onPressed: _busy ? null : _startDomain,
                icon: const Icon(Icons.dark_mode_rounded),
                label: const Text(
                  'EXPAND MONARCH\'S DOMAIN (4H LOCK)',
                  style: TextStyle(fontWeight: FontWeight.w900),
                ),
                style: ElevatedButton.styleFrom(
                  backgroundColor: HunterTheme.purple,
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(vertical: 15),
                ),
              ),
            ),
          ],
        ],
      ),
    );
  }
}
