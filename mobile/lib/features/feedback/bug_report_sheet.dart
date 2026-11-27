import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/providers/feedback_provider.dart';
import '../../core/services/feedback_diagnostics_service.dart';
import '../../core/theme/hunter_theme.dart';

/// Compact 2-tap bug report bottom sheet usable from Settings or any error state.
class BugReportSheet extends ConsumerStatefulWidget {
  final String? screenName;
  final String? prefilledError;

  const BugReportSheet({super.key, this.screenName, this.prefilledError});

  static Future<void> show(
    BuildContext context, {
    String? screenName,
    String? prefilledError,
  }) {
    return showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: HunterTheme.surface,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (_) => BugReportSheet(
        screenName: screenName,
        prefilledError: prefilledError,
      ),
    );
  }

  @override
  ConsumerState<BugReportSheet> createState() => _BugReportSheetState();
}

class _BugReportSheetState extends ConsumerState<BugReportSheet> {
  final _formKey = GlobalKey<FormState>();
  final _titleController = TextEditingController();
  late final TextEditingController _descController;

  @override
  void initState() {
    super.initState();
    _descController = TextEditingController(
      text: widget.prefilledError != null ? 'Observed error: ${widget.prefilledError}\n\nSteps: ' : '',
    );
  }

  @override
  void dispose() {
    _titleController.dispose();
    _descController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    final err = await ref.read(feedbackProvider.notifier).submitFeedback(
          type: 'bug',
          category: 'performance',
          title: _titleController.text,
          description: _descController.text,
          includeDiagnostics: true,
          screenOverride: widget.screenName,
        );
    if (!mounted) return;
    if (err != null) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(backgroundColor: HunterTheme.crimson, content: Text(err)),
      );
      return;
    }
    Navigator.of(context).pop();
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        backgroundColor: HunterTheme.surfaceLight,
        content: Text(
          'Bug report & diagnostics transmitted. Thank you, Hunter!',
          style: TextStyle(color: HunterTheme.cyanLight),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final isSubmitting = ref.watch(feedbackProvider).isSubmitting;
    final errCount = FeedbackDiagnosticsService.recentErrors.length;

    return Padding(
      padding: EdgeInsets.fromLTRB(
        20,
        16,
        20,
        MediaQuery.of(context).viewInsets.bottom + 20,
      ),
      child: Form(
        key: _formKey,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                const Icon(Icons.bug_report_rounded, color: HunterTheme.crimson),
                const SizedBox(width: 8),
                const Text(
                  'QUICK ANOMALY REPORT',
                  style: TextStyle(
                    color: HunterTheme.textPrimary,
                    fontWeight: FontWeight.w900,
                    letterSpacing: 1.1,
                    fontSize: 15,
                  ),
                ),
                const Spacer(),
                IconButton(
                  onPressed: () => Navigator.of(context).pop(),
                  icon: const Icon(Icons.close, color: HunterTheme.textMuted),
                ),
              ],
            ),
            Text(
              'Auto-attaching ${widget.screenName ?? FeedbackDiagnosticsService.currentScreen} + $errCount buffered error(s).',
              style: const TextStyle(color: HunterTheme.textMuted, fontSize: 11.5),
            ),
            const SizedBox(height: 12),
            TextFormField(
              controller: _titleController,
              maxLength: 120,
              style: const TextStyle(color: HunterTheme.textPrimary),
              decoration: const InputDecoration(
                labelText: 'WHAT WENT WRONG?',
                labelStyle: TextStyle(color: HunterTheme.cyanLight, fontSize: 12),
              ),
              validator: (v) => (v?.trim().length ?? 0) < 4 ? 'At least 4 characters' : null,
            ),
            const SizedBox(height: 8),
            TextFormField(
              controller: _descController,
              maxLines: 3,
              maxLength: 2000,
              style: const TextStyle(color: HunterTheme.textPrimary),
              decoration: const InputDecoration(
                labelText: 'DETAILS / STEPS TO REPRODUCE',
                labelStyle: TextStyle(color: HunterTheme.cyanLight, fontSize: 12),
              ),
              validator: (v) => (v?.trim().length ?? 0) < 10 ? 'At least 10 characters' : null,
            ),
            const SizedBox(height: 12),
            SizedBox(
              width: double.infinity,
              height: 46,
              child: ElevatedButton(
                onPressed: isSubmitting ? null : _submit,
                style: ElevatedButton.styleFrom(
                  backgroundColor: HunterTheme.crimson,
                  foregroundColor: Colors.white,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                ),
                child: Text(
                  isSubmitting ? 'SENDING...' : 'SEND BUG REPORT',
                  style: const TextStyle(fontWeight: FontWeight.w900, letterSpacing: 1),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
