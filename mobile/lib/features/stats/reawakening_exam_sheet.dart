import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/api/api_client.dart';
import '../../core/api/api_endpoints.dart';
import '../../core/api/api_error.dart';
import '../../core/providers/auth_provider.dart';
import '../../core/theme/hunter_theme.dart';
import '../../core/widgets/system_window_dialog.dart';
import '../../models/user_model.dart';
import '../focus/focus_screen.dart';

/// Feature #7 Proctored Reawakening Rank Test Sheet (14d pass / 7d fail cooldown).
class ReawakeningExamSheet extends ConsumerStatefulWidget {
  const ReawakeningExamSheet({super.key});

  static Future<void> show(BuildContext context) {
    return showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => const ReawakeningExamSheet(),
    );
  }

  @override
  ConsumerState<ReawakeningExamSheet> createState() =>
      _ReawakeningExamSheetState();
}

class _ReawakeningExamSheetState extends ConsumerState<ReawakeningExamSheet> {
  final TextEditingController _pushupsCtrl = TextEditingController(text: '20');
  final TextEditingController _deliverableCtrl = TextEditingController();
  bool _busy = false;

  @override
  void dispose() {
    _pushupsCtrl.dispose();
    _deliverableCtrl.dispose();
    super.dispose();
  }

  Future<void> _startExam() async {
    setState(() => _busy = true);
    try {
      final dio = await ApiClient.getInstance();
      final res = await dio.post(ApiEndpoints.reawakeningStart);
      if (res.data is Map<String, dynamic> && res.data['user'] is Map<String, dynamic>) {
        ref.read(authProvider.notifier).updateUser(
              UserModel.fromJson(res.data['user'] as Map<String, dynamic>),
            );
      }
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          backgroundColor: HunterTheme.crimson,
          content: Text(extractApiError(e, 'Cannot begin Reawakening Test right now')),
        ),
      );
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _submitExam() async {
    setState(() => _busy = true);
    try {
      final dio = await ApiClient.getInstance();
      final res = await dio.post(
        ApiEndpoints.reawakeningSubmit,
        data: {
          'pushupsLogged': int.tryParse(_pushupsCtrl.text.trim()) ?? 0,
          'deliverableText': _deliverableCtrl.text.trim(),
        },
      );
      if (res.data is Map<String, dynamic>) {
        final data = res.data as Map<String, dynamic>;
        if (data['user'] is Map<String, dynamic>) {
          ref.read(authProvider.notifier).updateUser(
                UserModel.fromJson(data['user'] as Map<String, dynamic>),
              );
        }
        if (!mounted) return;
        Navigator.of(context).pop();
        if (data['passed'] == true) {
          await SystemWindowDialog.showRankPromotion(
            context,
            newRank: data['awardedRank']?.toString() ?? 'C',
          );
        } else {
          await SystemWindowDialog.show(
            context,
            headerTag: 'REAWAKENING RESULT',
            title: 'REAWAKENING NOT PASSED',
            body: data['verdict']?.toString() ?? 'Retest cooldown active for 7 days.',
            tone: SystemWindowTone.crimson,
            icon: Icons.scanner_rounded,
          );
        }
      }
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          backgroundColor: HunterTheme.crimson,
          content: Text(extractApiError(e, 'Exam requirements incomplete')),
        ),
      );
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final user = ref.watch(authProvider).value;
    final exam = user?.reawakeningState;
    final inProgress = exam?['status'] == 'in_progress';
    final basePushups = (user?.baselineStats?['pushups'] ?? 10);

    return Container(
      decoration: const BoxDecoration(
        color: HunterTheme.surface,
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
        border: Border(top: BorderSide(color: HunterTheme.cyan, width: 1.8)),
      ),
      padding: EdgeInsets.fromLTRB(
        20,
        20,
        20,
        MediaQuery.of(context).viewInsets.bottom + 28,
      ),
      child: SingleChildScrollView(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text(
                  '[ HUNTER ASSOCIATION REAWAKENING ]',
                  style: TextStyle(
                    color: HunterTheme.cyanLight,
                    fontWeight: FontWeight.w900,
                    fontSize: 11.5,
                    letterSpacing: 1.4,
                  ),
                ),
                IconButton(
                  onPressed: () => Navigator.of(context).pop(),
                  icon: const Icon(Icons.close, color: HunterTheme.textMuted),
                ),
              ],
            ),
            const Text(
              'Proctored Rank Scanner Exam',
              style: TextStyle(
                color: HunterTheme.textPrimary,
                fontSize: 18,
                fontWeight: FontWeight.w900,
              ),
            ),
            const SizedBox(height: 4),
            const Text(
              'Cooldown: 14 days after passing • 7 days after failing • 24h exam window.',
              style: TextStyle(color: HunterTheme.textMuted, fontSize: 11.5),
            ),
            const SizedBox(height: 16),
            if (!inProgress) ...[
              Text(
                'Current Authority: ${user?.tier ?? 'D'}-Rank (Lv.${user?.level ?? 1})\nRequired within 24h once opened:\n1. Max pushups >= $basePushups (your Day-1 baseline)\n2. 25m zero-breach Air-Gap Focus session\n3. Shipped concrete deliverable summary',
                style: const TextStyle(color: HunterTheme.textPrimary, fontSize: 12.5, height: 1.45),
              ),
              const SizedBox(height: 16),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton.icon(
                  onPressed: _busy ? null : _startExam,
                  icon: const Icon(Icons.scanner_rounded),
                  label: const Text(
                    'OPEN 24H REAWAKENING SCAN',
                    style: TextStyle(fontWeight: FontWeight.w900),
                  ),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: HunterTheme.cyan,
                    foregroundColor: Colors.black,
                    padding: const EdgeInsets.symmetric(vertical: 14),
                  ),
                ),
              ),
            ] else ...[
              OutlinedButton.icon(
                onPressed: () {
                  Navigator.of(context).pop();
                  Navigator.of(context).push(
                    MaterialPageRoute(
                      builder: (_) => const FocusScreen(
                        initialDurationMinutes: 25,
                        initialTask: 'Reawakening Proctored Zero-Breach Sprint',
                      ),
                    ),
                  );
                },
                icon: const Icon(Icons.timer_rounded, color: HunterTheme.cyanLight),
                label: const Text(
                  'RUN 25M ZERO-BREACH SPRINT NOW',
                  style: TextStyle(color: HunterTheme.cyanLight, fontWeight: FontWeight.bold),
                ),
              ),
              const SizedBox(height: 12),
              TextField(
                controller: _pushupsCtrl,
                keyboardType: TextInputType.number,
                style: const TextStyle(color: HunterTheme.textPrimary),
                decoration: InputDecoration(
                  labelText: 'Max Pushups Completed Today (baseline: $basePushups)',
                  labelStyle: const TextStyle(color: HunterTheme.textMuted, fontSize: 12),
                  filled: true,
                  fillColor: HunterTheme.abyss,
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(10),
                    borderSide: BorderSide.none,
                  ),
                ),
              ),
              const SizedBox(height: 10),
              TextField(
                controller: _deliverableCtrl,
                maxLines: 2,
                style: const TextStyle(color: HunterTheme.textPrimary),
                decoration: InputDecoration(
                  labelText: 'Shipped Deliverable Summary (min 25 chars)',
                  labelStyle: const TextStyle(color: HunterTheme.textMuted, fontSize: 12),
                  filled: true,
                  fillColor: HunterTheme.abyss,
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(10),
                    borderSide: BorderSide.none,
                  ),
                ),
              ),
              const SizedBox(height: 16),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: _busy ? null : _submitExam,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: HunterTheme.gold,
                    foregroundColor: Colors.black,
                    padding: const EdgeInsets.symmetric(vertical: 14),
                  ),
                  child: const Text(
                    'SUBMIT FOR EXAMINER VERDICT',
                    style: TextStyle(fontWeight: FontWeight.w900),
                  ),
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}
