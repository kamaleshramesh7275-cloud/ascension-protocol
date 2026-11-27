import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/providers/feedback_provider.dart';
import '../../core/storage/session_storage.dart';
import '../../core/theme/hunter_theme.dart';

class PostRegistrationFeedbackDialog extends ConsumerStatefulWidget {
  const PostRegistrationFeedbackDialog({super.key});

  /// Returns:
  /// - `null` if feedback popup should not be scheduled or shown
  /// - `Duration.zero` if delay has elapsed and popup should appear immediately
  /// - positive `Duration` remaining until popup should fire
  static Duration? evaluatePopupDelay({
    required int? registrationTimestampMs,
    required bool alreadyShown,
    required int nowMs,
    Duration delay = const Duration(minutes: 10),
  }) {
    if (alreadyShown || registrationTimestampMs == null) return null;
    final elapsedMs = nowMs - registrationTimestampMs;
    final remainingMs = delay.inMilliseconds - elapsedMs;
    if (remainingMs <= 0) return Duration.zero;
    return Duration(milliseconds: remainingMs);
  }

  static Future<void> show(BuildContext context) async {
    await SessionStorage.markPostRegFeedbackShown();
    if (!context.mounted) return;
    await showDialog<void>(
      context: context,
      barrierDismissible: true,
      builder: (_) => const PostRegistrationFeedbackDialog(),
    );
  }

  @override
  ConsumerState<PostRegistrationFeedbackDialog> createState() =>
      _PostRegistrationFeedbackDialogState();
}

class _PostRegistrationFeedbackDialogState
    extends ConsumerState<PostRegistrationFeedbackDialog> {
  int _rating = 0;
  String _selectedSentiment = 'Loving It';
  final TextEditingController _commentController = TextEditingController();
  bool _isSubmitting = false;

  static const List<String> _sentiments = [
    'Loving It',
    'Needs Improvement',
    'Found a Bug',
  ];

  @override
  void dispose() {
    _commentController.dispose();
    super.dispose();
  }

  Future<void> _handleDismiss() async {
    HapticFeedback.selectionClick();
    await SessionStorage.markPostRegFeedbackShown();
    if (mounted) Navigator.of(context).pop();
  }

  Future<void> _handleSubmit() async {
    if (_rating == 0) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          backgroundColor: HunterTheme.surface,
          content: Text(
            'Tap a star rating (1–5) before submitting.',
            style: TextStyle(color: HunterTheme.cyanLight),
          ),
        ),
      );
      return;
    }

    HapticFeedback.mediumImpact();
    setState(() => _isSubmitting = true);

    final type = _selectedSentiment == 'Found a Bug'
        ? 'bug'
        : _selectedSentiment == 'Needs Improvement'
            ? 'suggestion'
            : 'feature';
    final comment = _commentController.text.trim();
    final desc = comment.isNotEmpty
        ? 'Sentiment: $_selectedSentiment\nRating: $_rating/5\nNote: $comment'
        : 'Sentiment: $_selectedSentiment\nRating: $_rating/5 (10-min post-registration check-in)';

    final err = await ref.read(feedbackProvider.notifier).submitFeedback(
          type: type,
          category: 'ui',
          title: 'First-10m Rating: $_rating/5 — $_selectedSentiment',
          description: desc,
          includeDiagnostics: true,
          screenOverride: 'PostRegistrationFeedbackDialog',
        );

    await SessionStorage.markPostRegFeedbackShown();
    if (!mounted) return;

    setState(() => _isSubmitting = false);
    Navigator.of(context).pop();

    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        backgroundColor: HunterTheme.surface,
        content: Text(
          err == null
              ? 'Feedback logged. Thank you for strengthening the System!'
              : 'Saved locally — thanks for rating!',
          style: TextStyle(color: HunterTheme.cyanLight),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Dialog(
      backgroundColor: Colors.transparent,
      insetPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 24),
      child: Container(
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          color: HunterTheme.surface,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(
            color: HunterTheme.cyan.withValues(alpha: 0.75),
            width: 1.5,
          ),
          boxShadow: [
            BoxShadow(
              color: HunterTheme.cyan.withValues(alpha: 0.25),
              blurRadius: 24,
              spreadRadius: 1,
            ),
          ],
        ),
        child: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                    decoration: BoxDecoration(
                      color: HunterTheme.cyan.withValues(alpha: 0.14),
                      borderRadius: BorderRadius.circular(6),
                      border: Border.all(color: HunterTheme.cyan.withValues(alpha: 0.5)),
                    ),
                    child: Text(
                      '[ SYSTEM CHECK-IN ]',
                      style: TextStyle(
                        color: HunterTheme.cyanLight,
                        fontWeight: FontWeight.bold,
                        fontSize: 10.5,
                        letterSpacing: 1.2,
                      ),
                    ),
                  ),
                  const Spacer(),
                  IconButton(
                    icon: Icon(Icons.close, color: HunterTheme.textMuted, size: 20),
                    padding: EdgeInsets.zero,
                    constraints: const BoxConstraints(),
                    onPressed: _isSubmitting ? null : _handleDismiss,
                  ),
                ],
              ),
              const SizedBox(height: 14),
              Text(
                'HUNTER SYSTEM RATING',
                style: TextStyle(
                  color: HunterTheme.textPrimary,
                  fontWeight: FontWeight.w900,
                  fontSize: 18,
                  letterSpacing: 1.0,
                ),
              ),
              const SizedBox(height: 6),
              Text(
                'You have been active for 10 minutes! How has the app felt so far?',
                style: TextStyle(
                  color: HunterTheme.textMuted,
                  fontSize: 13,
                  height: 1.35,
                ),
              ),
              const SizedBox(height: 16),
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: List.generate(5, (index) {
                  final star = index + 1;
                  final active = star <= _rating;
                  return IconButton(
                    onPressed: _isSubmitting
                        ? null
                        : () {
                            HapticFeedback.selectionClick();
                            setState(() => _rating = star);
                          },
                    icon: Icon(
                      active ? Icons.star_rounded : Icons.star_outline_rounded,
                      color: active ? HunterTheme.gold : HunterTheme.textMuted,
                      size: 34,
                    ),
                  );
                }),
              ),
              const SizedBox(height: 10),
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: _sentiments.map((s) {
                  final selected = _selectedSentiment == s;
                  return ChoiceChip(
                    label: Text(
                      s,
                      style: TextStyle(
                        color: selected ? Colors.black : HunterTheme.textPrimary,
                        fontWeight: FontWeight.bold,
                        fontSize: 12,
                      ),
                    ),
                    selected: selected,
                    selectedColor: HunterTheme.cyan,
                    backgroundColor: HunterTheme.abyss,
                    side: BorderSide(
                      color: selected ? HunterTheme.cyan : HunterTheme.surfaceLight,
                    ),
                    onSelected: _isSubmitting
                        ? null
                        : (_) {
                            HapticFeedback.selectionClick();
                            setState(() => _selectedSentiment = s);
                          },
                  );
                }).toList(),
              ),
              const SizedBox(height: 14),
              TextField(
                controller: _commentController,
                enabled: !_isSubmitting,
                maxLines: 3,
                style: TextStyle(color: HunterTheme.textPrimary, fontSize: 13),
                decoration: InputDecoration(
                  hintText: 'Anything you liked, missed, or found confusing? (optional)',
                  hintStyle: TextStyle(color: HunterTheme.textMuted, fontSize: 12),
                  filled: true,
                  fillColor: HunterTheme.abyss,
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12),
                    borderSide: BorderSide(color: HunterTheme.surfaceLight),
                  ),
                ),
              ),
              const SizedBox(height: 18),
              Row(
                children: [
                  Expanded(
                    child: TextButton(
                      onPressed: _isSubmitting ? null : _handleDismiss,
                      child: Text(
                        'MAYBE LATER',
                        style: TextStyle(
                          color: HunterTheme.textMuted,
                          fontWeight: FontWeight.bold,
                          letterSpacing: 0.8,
                          fontSize: 12,
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    flex: 2,
                    child: ElevatedButton(
                      onPressed: _isSubmitting ? null : _handleSubmit,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: HunterTheme.cyan,
                        foregroundColor: Colors.black,
                        padding: const EdgeInsets.symmetric(vertical: 12),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                      ),
                      child: _isSubmitting
                          ? const SizedBox(
                              width: 18,
                              height: 18,
                              child: CircularProgressIndicator(
                                strokeWidth: 2,
                                color: Colors.black,
                              ),
                            )
                          : const Text(
                              'SUBMIT FEEDBACK',
                              style: TextStyle(
                                fontWeight: FontWeight.w900,
                                letterSpacing: 0.8,
                                fontSize: 12,
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
    );
  }
}
