import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/providers/feedback_provider.dart';
import '../../core/services/feedback_diagnostics_service.dart';
import '../../core/services/system_audio_service.dart';
import '../../core/theme/hunter_theme.dart';
import '../../core/widgets/system_window_dialog.dart';

class FeedbackScreen extends ConsumerStatefulWidget {
  final String initialType; // 'bug' | 'feature' | 'suggestion'
  const FeedbackScreen({super.key, this.initialType = 'feature'});

  @override
  ConsumerState<FeedbackScreen> createState() => _FeedbackScreenState();
}

class _FeedbackScreenState extends ConsumerState<FeedbackScreen>
    with SingleTickerProviderStateMixin {
  late final TabController _tabController;
  final _formKey = GlobalKey<FormState>();
  final _titleController = TextEditingController();
  final _descController = TextEditingController();

  late String _selectedType;
  String _selectedCategory = 'other';
  bool _includeDiagnostics = true;
  String _popularSort = 'top';

  static const _categories = [
    ('ui', 'UI / UX'),
    ('focus', 'Focus Sanctum'),
    ('workouts', 'Workouts & PRs'),
    ('quests', 'Quests & Roadmap'),
    ('social', 'Guilds & Rivals'),
    ('performance', 'Performance / Crashes'),
    ('other', 'Other'),
  ];

  @override
  void initState() {
    super.initState();
    _selectedType = widget.initialType;
    _includeDiagnostics = widget.initialType == 'bug';
    _tabController = TabController(length: 3, vsync: this);
    WidgetsBinding.instance.addPostFrameCallback((_) {
      ref.read(feedbackProvider.notifier).loadAll(sort: _popularSort);
    });
  }

  @override
  void dispose() {
    _tabController.dispose();
    _titleController.dispose();
    _descController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    HapticFeedback.mediumImpact();

    final err = await ref.read(feedbackProvider.notifier).submitFeedback(
          type: _selectedType,
          category: _selectedCategory,
          title: _titleController.text,
          description: _descController.text,
          includeDiagnostics: _includeDiagnostics,
        );

    if (!mounted) return;
    if (err != null) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          backgroundColor: HunterTheme.crimson,
          content: Text(err, style: const TextStyle(color: Colors.white)),
        ),
      );
      return;
    }

    _titleController.clear();
    _descController.clear();
    await SystemAudioService.playCue(
      SystemSfxCue.ping,
      haptic: SystemHapticPattern.lightPulse,
    );
    if (!mounted) return;

    await SystemWindowDialog.show(
      context,
      headerTag: 'SYSTEM DISPATCH RECEIVED',
      title: _selectedType == 'bug' ? 'ANOMALY LOGGED' : 'TRANSMISSION RECORDED',
      body: _selectedType == 'bug'
          ? 'Your bug report and diagnostics have been transmitted to the System Architects. Track progress under MY REPORTS.'
          : 'Your proposal is now live on the Hunter Council board for community upvoting.',
      tone: _selectedType == 'bug' ? SystemWindowTone.crimson : SystemWindowTone.cyan,
      icon: _selectedType == 'bug' ? Icons.bug_report_rounded : Icons.lightbulb_outline_rounded,
    );

    if (mounted) {
      _tabController.animateTo(1);
    }
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(feedbackProvider);

    return Scaffold(
      backgroundColor: HunterTheme.abyss,
      appBar: AppBar(
        backgroundColor: HunterTheme.abyss,
        elevation: 0,
        title: const Text(
          'SYSTEM FEEDBACK TERMINAL',
          style: TextStyle(
            color: HunterTheme.cyanLight,
            fontWeight: FontWeight.w900,
            letterSpacing: 1.4,
            fontSize: 15,
          ),
        ),
        bottom: TabBar(
          controller: _tabController,
          indicatorColor: HunterTheme.cyan,
          labelColor: HunterTheme.cyanLight,
          unselectedLabelColor: HunterTheme.textMuted,
          labelStyle: const TextStyle(fontWeight: FontWeight.w900, fontSize: 11.5, letterSpacing: 0.8),
          tabs: [
            const Tab(text: 'SUBMIT'),
            Tab(text: 'MY REPORTS (${state.myReports.length})'),
            const Tab(text: 'TOP REQUESTS'),
          ],
        ),
      ),
      body: TabBarView(
        controller: _tabController,
        children: [
          _buildSubmitTab(state),
          _buildMyReportsTab(state),
          _buildPopularTab(state),
        ],
      ),
    );
  }

  Widget _buildSubmitTab(FeedbackState state) {
    final recentErrCount = FeedbackDiagnosticsService.recentErrors.length;
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Form(
        key: _formKey,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'REPORT TYPE',
              style: TextStyle(
                color: HunterTheme.textMuted,
                fontWeight: FontWeight.bold,
                fontSize: 11,
                letterSpacing: 1.2,
              ),
            ),
            const SizedBox(height: 8),
            Row(
              children: [
                _typePill('bug', 'BUG / ERROR', Icons.bug_report_rounded, HunterTheme.crimson),
                const SizedBox(width: 8),
                _typePill('feature', 'NEW FEATURE', Icons.auto_awesome, HunterTheme.cyan),
                const SizedBox(width: 8),
                _typePill('suggestion', 'NEEDS / UX', Icons.edit_note_rounded, HunterTheme.gold),
              ],
            ),
            const SizedBox(height: 16),

            const Text(
              'SYSTEM MODULE',
              style: TextStyle(
                color: HunterTheme.textMuted,
                fontWeight: FontWeight.bold,
                fontSize: 11,
                letterSpacing: 1.2,
              ),
            ),
            const SizedBox(height: 8),
            DropdownButtonFormField<String>(
              initialValue: _selectedCategory,
              dropdownColor: HunterTheme.surface,
              style: const TextStyle(color: HunterTheme.textPrimary, fontSize: 13.5),
              decoration: InputDecoration(
                filled: true,
                fillColor: HunterTheme.surface,
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: BorderSide(color: HunterTheme.cyan.withValues(alpha: 0.3)),
                ),
                enabledBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: BorderSide(color: HunterTheme.cyan.withValues(alpha: 0.25)),
                ),
              ),
              items: _categories
                  .map((c) => DropdownMenuItem(value: c.$1, child: Text(c.$2)))
                  .toList(),
              onChanged: (v) {
                if (v != null) setState(() => _selectedCategory = v);
              },
            ),
            const SizedBox(height: 16),

            TextFormField(
              controller: _titleController,
              maxLength: 120,
              style: const TextStyle(color: HunterTheme.textPrimary),
              decoration: _inputDecoration(
                label: 'SUMMARY TITLE',
                hint: _selectedType == 'bug'
                    ? 'e.g., Focus timer resets when switching tabs'
                    : 'e.g., Add custom rest timer between workout sets',
              ),
              validator: (v) {
                final len = v?.trim().length ?? 0;
                if (len < 4) return 'Enter at least 4 characters';
                return null;
              },
            ),
            const SizedBox(height: 12),

            TextFormField(
              controller: _descController,
              maxLines: 5,
              maxLength: 2000,
              style: const TextStyle(color: HunterTheme.textPrimary),
              decoration: _inputDecoration(
                label: 'DETAILS & EXPECTED BEHAVIOR',
                hint: _selectedType == 'bug'
                    ? 'What happened, steps to reproduce, and what you expected...'
                    : 'Describe what you need and how it would help your daily grind...',
              ),
              validator: (v) {
                final len = v?.trim().length ?? 0;
                if (len < 10) return 'Please provide at least 10 characters of detail';
                return null;
              },
            ),
            const SizedBox(height: 8),

            Container(
              decoration: BoxDecoration(
                color: HunterTheme.surface,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: HunterTheme.surfaceLight),
              ),
              child: CheckboxListTile(
                value: _includeDiagnostics,
                activeColor: HunterTheme.cyan,
                onChanged: (val) => setState(() => _includeDiagnostics = val ?? true),
                title: const Text(
                  'Attach device info & recent error logs',
                  style: TextStyle(color: HunterTheme.textPrimary, fontSize: 13, fontWeight: FontWeight.bold),
                ),
                subtitle: Text(
                  'App v${FeedbackDiagnosticsService.appVersion} • $recentErrCount recent error(s) buffered (no tokens)',
                  style: const TextStyle(color: HunterTheme.textMuted, fontSize: 11),
                ),
              ),
            ),
            const SizedBox(height: 20),

            SizedBox(
              width: double.infinity,
              height: 48,
              child: ElevatedButton.icon(
                onPressed: state.isSubmitting ? null : _submit,
                style: ElevatedButton.styleFrom(
                  backgroundColor: _selectedType == 'bug' ? HunterTheme.crimson : HunterTheme.cyan,
                  foregroundColor: _selectedType == 'bug' ? Colors.white : Colors.black,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                ),
                icon: state.isSubmitting
                    ? const SizedBox(
                        width: 18,
                        height: 18,
                        child: CircularProgressIndicator(strokeWidth: 2, color: Colors.black),
                      )
                    : const Icon(Icons.send_rounded, size: 18),
                label: Text(
                  state.isSubmitting ? 'TRANSMITTING...' : 'TRANSMIT TO SYSTEM',
                  style: const TextStyle(fontWeight: FontWeight.w900, letterSpacing: 1.1),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildMyReportsTab(FeedbackState state) {
    if (state.isLoading && state.myReports.isEmpty) {
      return const Center(child: CircularProgressIndicator(color: HunterTheme.cyan));
    }
    if (state.myReports.isEmpty) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: const [
              Icon(Icons.inbox_outlined, color: HunterTheme.textMuted, size: 42),
              SizedBox(height: 12),
              Text(
                'No transmissions yet.\nReport a bug or propose a feature from the SUBMIT tab.',
                textAlign: TextAlign.center,
                style: TextStyle(color: HunterTheme.textMuted, fontSize: 13),
              ),
            ],
          ),
        ),
      );
    }

    return RefreshIndicator(
      color: HunterTheme.cyan,
      onRefresh: () => ref.read(feedbackProvider.notifier).loadAll(sort: _popularSort),
      child: ListView.builder(
        padding: const EdgeInsets.all(16),
        itemCount: state.myReports.length,
        itemBuilder: (context, idx) {
          final item = state.myReports[idx];
          return Container(
            margin: const EdgeInsets.only(bottom: 12),
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              color: HunterTheme.surface,
              borderRadius: BorderRadius.circular(14),
              border: Border.all(color: _statusColor(item.status).withValues(alpha: 0.35)),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    _chip(item.type.toUpperCase(), _typeColor(item.type)),
                    const SizedBox(width: 6),
                    _chip(item.status.toUpperCase(), _statusColor(item.status)),
                    const Spacer(),
                    Text(
                      item.category.toUpperCase(),
                      style: const TextStyle(color: HunterTheme.textMuted, fontSize: 10.5),
                    ),
                  ],
                ),
                const SizedBox(height: 8),
                Text(
                  item.title,
                  style: const TextStyle(
                    color: HunterTheme.textPrimary,
                    fontWeight: FontWeight.w800,
                    fontSize: 14,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  item.description,
                  maxLines: 3,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(color: HunterTheme.textMuted, fontSize: 12.5),
                ),
                if (item.adminNotes != null && item.adminNotes!.trim().isNotEmpty) ...[
                  const SizedBox(height: 10),
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(10),
                    decoration: BoxDecoration(
                      color: HunterTheme.cyan.withValues(alpha: 0.08),
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(color: HunterTheme.cyan.withValues(alpha: 0.3)),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          'SYSTEM ARCHITECT RESPONSE',
                          style: TextStyle(
                            color: HunterTheme.cyanLight,
                            fontWeight: FontWeight.w900,
                            fontSize: 10,
                            letterSpacing: 1,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          item.adminNotes!,
                          style: const TextStyle(color: HunterTheme.textPrimary, fontSize: 12),
                        ),
                      ],
                    ),
                  ),
                ],
              ],
            ),
          );
        },
      ),
    );
  }

  Widget _buildPopularTab(FeedbackState state) {
    return Column(
      children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(16, 12, 16, 4),
          child: Row(
            children: [
              const Text(
                'HUNTER COUNCIL WISHLIST',
                style: TextStyle(
                  color: HunterTheme.textMuted,
                  fontWeight: FontWeight.bold,
                  fontSize: 11,
                  letterSpacing: 1.1,
                ),
              ),
              const Spacer(),
              ChoiceChip(
                label: const Text('TOP', style: TextStyle(fontSize: 11)),
                selected: _popularSort == 'top',
                selectedColor: HunterTheme.cyan.withValues(alpha: 0.25),
                onSelected: (_) {
                  setState(() => _popularSort = 'top');
                  ref.read(feedbackProvider.notifier).loadAll(sort: 'top');
                },
              ),
              const SizedBox(width: 6),
              ChoiceChip(
                label: const Text('NEW', style: TextStyle(fontSize: 11)),
                selected: _popularSort == 'new',
                selectedColor: HunterTheme.cyan.withValues(alpha: 0.25),
                onSelected: (_) {
                  setState(() => _popularSort = 'new');
                  ref.read(feedbackProvider.notifier).loadAll(sort: 'new');
                },
              ),
            ],
          ),
        ),
        Expanded(
          child: state.isLoading && state.popularRequests.isEmpty
              ? const Center(child: CircularProgressIndicator(color: HunterTheme.cyan))
              : state.popularRequests.isEmpty
                  ? const Center(
                      child: Text(
                        'No community requests yet.\nBe the first to propose a feature!',
                        textAlign: TextAlign.center,
                        style: TextStyle(color: HunterTheme.textMuted, fontSize: 13),
                      ),
                    )
                  : RefreshIndicator(
                      color: HunterTheme.cyan,
                      onRefresh: () => ref.read(feedbackProvider.notifier).loadAll(sort: _popularSort),
                      child: ListView.builder(
                        padding: const EdgeInsets.all(16),
                        itemCount: state.popularRequests.length,
                        itemBuilder: (context, idx) {
                          final item = state.popularRequests[idx];
                          return Container(
                            margin: const EdgeInsets.only(bottom: 10),
                            padding: const EdgeInsets.all(12),
                            decoration: BoxDecoration(
                              color: HunterTheme.surface,
                              borderRadius: BorderRadius.circular(14),
                              border: Border.all(
                                color: item.hasVoted
                                    ? HunterTheme.cyan.withValues(alpha: 0.55)
                                    : HunterTheme.surfaceLight,
                              ),
                            ),
                            child: Row(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                InkWell(
                                  onTap: () {
                                    HapticFeedback.selectionClick();
                                    ref.read(feedbackProvider.notifier).toggleUpvote(item.id);
                                  },
                                  borderRadius: BorderRadius.circular(10),
                                  child: Container(
                                    width: 48,
                                    padding: const EdgeInsets.symmetric(vertical: 8),
                                    decoration: BoxDecoration(
                                      color: item.hasVoted
                                          ? HunterTheme.cyan.withValues(alpha: 0.18)
                                          : HunterTheme.surfaceLight,
                                      borderRadius: BorderRadius.circular(10),
                                      border: Border.all(
                                        color: item.hasVoted
                                            ? HunterTheme.cyan
                                            : Colors.transparent,
                                      ),
                                    ),
                                    child: Column(
                                      children: [
                                        Icon(
                                          Icons.keyboard_arrow_up_rounded,
                                          color: item.hasVoted
                                              ? HunterTheme.cyanLight
                                              : HunterTheme.textMuted,
                                        ),
                                        Text(
                                          '${item.upvoteCount}',
                                          style: TextStyle(
                                            color: item.hasVoted
                                                ? HunterTheme.cyanLight
                                                : HunterTheme.textPrimary,
                                            fontWeight: FontWeight.w900,
                                            fontSize: 12.5,
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                                ),
                                const SizedBox(width: 12),
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Row(
                                        children: [
                                          _chip(item.status.toUpperCase(), _statusColor(item.status)),
                                          const SizedBox(width: 6),
                                          Text(
                                            'by ${item.userName}',
                                            style: const TextStyle(color: HunterTheme.textMuted, fontSize: 11),
                                          ),
                                        ],
                                      ),
                                      const SizedBox(height: 6),
                                      Text(
                                        item.title,
                                        style: const TextStyle(
                                          color: HunterTheme.textPrimary,
                                          fontWeight: FontWeight.w800,
                                          fontSize: 13.5,
                                        ),
                                      ),
                                      const SizedBox(height: 4),
                                      Text(
                                        item.description,
                                        maxLines: 3,
                                        overflow: TextOverflow.ellipsis,
                                        style: const TextStyle(color: HunterTheme.textMuted, fontSize: 12),
                                      ),
                                    ],
                                  ),
                                ),
                              ],
                            ),
                          );
                        },
                      ),
                    ),
        ),
      ],
    );
  }

  Widget _typePill(String type, String label, IconData icon, Color color) {
    final selected = _selectedType == type;
    return Expanded(
      child: InkWell(
        onTap: () {
          HapticFeedback.selectionClick();
          setState(() {
            _selectedType = type;
            if (type == 'bug') _includeDiagnostics = true;
          });
        },
        borderRadius: BorderRadius.circular(12),
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 6),
          decoration: BoxDecoration(
            color: selected ? color.withValues(alpha: 0.18) : HunterTheme.surface,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(
              color: selected ? color : HunterTheme.surfaceLight,
              width: selected ? 1.5 : 1,
            ),
          ),
          child: Column(
            children: [
              Icon(icon, color: selected ? color : HunterTheme.textMuted, size: 20),
              const SizedBox(height: 4),
              Text(
                label,
                textAlign: TextAlign.center,
                style: TextStyle(
                  color: selected ? color : HunterTheme.textMuted,
                  fontWeight: FontWeight.w900,
                  fontSize: 10.5,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  InputDecoration _inputDecoration({required String label, required String hint}) {
    return InputDecoration(
      labelText: label,
      hintText: hint,
      labelStyle: const TextStyle(color: HunterTheme.cyanLight, fontSize: 12, fontWeight: FontWeight.bold),
      hintStyle: const TextStyle(color: HunterTheme.textMuted, fontSize: 12.5),
      filled: true,
      fillColor: HunterTheme.surface,
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: BorderSide(color: HunterTheme.cyan.withValues(alpha: 0.3)),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: BorderSide(color: HunterTheme.cyan.withValues(alpha: 0.25)),
      ),
    );
  }

  Widget _chip(String text, Color color) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.16),
        borderRadius: BorderRadius.circular(6),
        border: Border.all(color: color.withValues(alpha: 0.5)),
      ),
      child: Text(
        text,
        style: TextStyle(color: color, fontSize: 9.5, fontWeight: FontWeight.w900),
      ),
    );
  }

  Color _typeColor(String type) {
    switch (type) {
      case 'bug':
        return HunterTheme.crimson;
      case 'feature':
        return HunterTheme.cyan;
      default:
        return HunterTheme.gold;
    }
  }

  Color _statusColor(String status) {
    switch (status) {
      case 'resolved':
        return HunterTheme.emeraldLight;
      case 'planned':
        return HunterTheme.purple;
      case 'reviewed':
        return HunterTheme.cyan;
      case 'declined':
        return HunterTheme.textMuted;
      default:
        return HunterTheme.gold;
    }
  }
}
