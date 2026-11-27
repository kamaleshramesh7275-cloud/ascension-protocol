import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import 'package:share_plus/share_plus.dart';
import '../../core/providers/journal_provider.dart';
import '../../core/theme/hunter_theme.dart';

class JournalScreen extends ConsumerStatefulWidget {
  const JournalScreen({super.key});

  @override
  ConsumerState<JournalScreen> createState() => _JournalScreenState();
}

class _JournalScreenState extends ConsumerState<JournalScreen> {
  String _search = '';
  String? _filterTag;

  static const _moods = ['Locked In', 'Focused', 'Breakthrough', 'Fatigued', 'Struggling'];
  static const _tags = ['Training', 'Focus', 'Mindset', 'Win', 'Lesson'];
  static const _prompts = [
    'What drained your mana today?',
    'What boss or hard task did you conquer?',
    'What is tomorrow\'s #1 non-negotiable?',
    'What distraction broke your focus and how will you counter it?',
  ];

  void _openComposer({String? initialPrompt}) {
    final titleCtrl = TextEditingController();
    final bodyCtrl = TextEditingController();
    String selectedMood = 'Focused';
    final selectedTags = <String>{};
    String? prompt = initialPrompt;

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: HunterTheme.surface,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setModalState) => Padding(
          padding: EdgeInsets.fromLTRB(
            20,
            16,
            20,
            MediaQuery.of(ctx).viewInsets.bottom + 20,
          ),
          child: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    const Icon(Icons.auto_stories_rounded, color: HunterTheme.purple),
                    const SizedBox(width: 8),
                    const Text(
                      'NEW CHRONICLE ENTRY',
                      style: TextStyle(
                        color: HunterTheme.textPrimary,
                        fontWeight: FontWeight.w900,
                        letterSpacing: 1.1,
                      ),
                    ),
                    const Spacer(),
                    IconButton(
                      onPressed: () => Navigator.of(ctx).pop(),
                      icon: const Icon(Icons.close, color: HunterTheme.textMuted),
                    ),
                  ],
                ),
                if (prompt != null) ...[
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(10),
                    margin: const EdgeInsets.only(bottom: 10),
                    decoration: BoxDecoration(
                      color: HunterTheme.purple.withValues(alpha: 0.14),
                      borderRadius: BorderRadius.circular(10),
                      border: Border.all(color: HunterTheme.purple.withValues(alpha: 0.4)),
                    ),
                    child: Text(
                      prompt,
                      style: const TextStyle(color: HunterTheme.cyanLight, fontSize: 12, fontStyle: FontStyle.italic),
                    ),
                  ),
                ],
                TextField(
                  controller: titleCtrl,
                  style: const TextStyle(color: HunterTheme.textPrimary, fontWeight: FontWeight.bold),
                  decoration: const InputDecoration(
                    labelText: 'ENTRY TITLE',
                    labelStyle: TextStyle(color: HunterTheme.cyanLight, fontSize: 12),
                  ),
                ),
                const SizedBox(height: 10),
                TextField(
                  controller: bodyCtrl,
                  maxLines: 5,
                  style: const TextStyle(color: HunterTheme.textPrimary),
                  decoration: const InputDecoration(
                    labelText: 'YOUR THOUGHTS (SAVED ON DEVICE)',
                    hintText: 'Log wins, mental friction, lessons, or tomorrow\'s battle plan...',
                    hintStyle: TextStyle(color: HunterTheme.textMuted, fontSize: 12),
                    labelStyle: TextStyle(color: HunterTheme.cyanLight, fontSize: 12),
                  ),
                ),
                const SizedBox(height: 12),
                const Text('ENERGY / MOOD', style: TextStyle(color: HunterTheme.textMuted, fontSize: 10.5, fontWeight: FontWeight.bold)),
                const SizedBox(height: 6),
                Wrap(
                  spacing: 6,
                  runSpacing: 6,
                  children: _moods.map((m) {
                    final active = selectedMood == m;
                    return ChoiceChip(
                      label: Text(m, style: const TextStyle(fontSize: 11)),
                      selected: active,
                      selectedColor: HunterTheme.cyan.withValues(alpha: 0.25),
                      onSelected: (_) => setModalState(() => selectedMood = m),
                    );
                  }).toList(),
                ),
                const SizedBox(height: 10),
                const Text('TAGS', style: TextStyle(color: HunterTheme.textMuted, fontSize: 10.5, fontWeight: FontWeight.bold)),
                const SizedBox(height: 6),
                Wrap(
                  spacing: 6,
                  children: _tags.map((t) {
                    final active = selectedTags.contains(t);
                    return FilterChip(
                      label: Text(t, style: const TextStyle(fontSize: 11)),
                      selected: active,
                      selectedColor: HunterTheme.purple.withValues(alpha: 0.28),
                      onSelected: (v) => setModalState(() {
                        if (v) {
                          selectedTags.add(t);
                        } else {
                          selectedTags.remove(t);
                        }
                      }),
                    );
                  }).toList(),
                ),
                const SizedBox(height: 16),
                SizedBox(
                  width: double.infinity,
                  height: 46,
                  child: ElevatedButton(
                    onPressed: () async {
                      if (bodyCtrl.text.trim().isEmpty) return;
                      HapticFeedback.mediumImpact();
                      await ref.read(journalProvider.notifier).addEntry(
                            title: titleCtrl.text,
                            body: bodyCtrl.text,
                            mood: selectedMood,
                            tags: selectedTags.toList(),
                            promptUsed: prompt,
                          );
                      if (ctx.mounted) Navigator.of(ctx).pop();
                    },
                    style: ElevatedButton.styleFrom(
                      backgroundColor: HunterTheme.purple,
                      foregroundColor: Colors.white,
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    ),
                    child: const Text('SEAL ENTRY ON DEVICE', style: TextStyle(fontWeight: FontWeight.w900)),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final entries = ref.watch(journalProvider);
    final filtered = entries.where((e) {
      final matchesSearch = _search.trim().isEmpty ||
          e.title.toLowerCase().includes(_search.toLowerCase()) ||
          e.body.toLowerCase().includes(_search.toLowerCase());
      final matchesTag = _filterTag == null || e.tags.contains(_filterTag);
      return matchesSearch && matchesTag;
    }).toList();

    return Scaffold(
      backgroundColor: HunterTheme.abyss,
      appBar: AppBar(
        backgroundColor: HunterTheme.abyss,
        elevation: 0,
        title: const Text(
          'HUNTER\'S CHRONICLE',
          style: TextStyle(
            color: HunterTheme.textPrimary,
            fontWeight: FontWeight.w900,
            letterSpacing: 1.5,
            fontSize: 15.5,
          ),
        ),
        actions: [
          if (entries.isNotEmpty)
            IconButton(
              tooltip: 'Export Journal (Markdown)',
              icon: const Icon(Icons.ios_share_rounded, color: HunterTheme.cyanLight),
              onPressed: () {
                final md = ref.read(journalProvider.notifier).exportAsMarkdown();
                Share.share(md, subject: 'Hunter Chronicle Journal');
              },
            ),
        ],
      ),
      floatingActionButton: FloatingActionButton.extended(
        backgroundColor: HunterTheme.purple,
        foregroundColor: Colors.white,
        onPressed: () => _openComposer(),
        icon: const Icon(Icons.edit_rounded),
        label: const Text('WRITE', style: TextStyle(fontWeight: FontWeight.w900)),
      ),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(16, 8, 16, 88),
        children: [
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: HunterTheme.surface,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: HunterTheme.purple.withValues(alpha: 0.35)),
            ),
            child: Row(
              children: [
                const Icon(Icons.phonelink_lock_rounded, color: HunterTheme.cyanLight, size: 20),
                const SizedBox(width: 10),
                Expanded(
                  child: Text(
                    '100% On-Device Private Journal • ${entries.length} entries stored locally (0 server cost)',
                    style: const TextStyle(color: HunterTheme.textMuted, fontSize: 11.5),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 12),

          // Quick Reflection Prompts
          SizedBox(
            height: 40,
            child: ListView.separated(
              scrollDirection: Axis.horizontal,
              itemCount: _prompts.length,
              separatorBuilder: (_, _) => const SizedBox(width: 8),
              itemBuilder: (_, idx) => ActionChip(
                backgroundColor: HunterTheme.surfaceLight,
                label: Text(_prompts[idx], style: const TextStyle(color: HunterTheme.cyanLight, fontSize: 11)),
                onPressed: () => _openComposer(initialPrompt: _prompts[idx]),
              ),
            ),
          ),
          const SizedBox(height: 12),

          TextField(
            style: const TextStyle(color: HunterTheme.textPrimary, fontSize: 13),
            onChanged: (v) => setState(() => _search = v),
            decoration: InputDecoration(
              prefixIcon: const Icon(Icons.search, color: HunterTheme.textMuted, size: 18),
              hintText: 'Search your chronicle...',
              hintStyle: const TextStyle(color: HunterTheme.textMuted, fontSize: 12.5),
              filled: true,
              fillColor: HunterTheme.surface,
              border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
            ),
          ),
          const SizedBox(height: 10),

          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            child: Row(
              children: [
                ChoiceChip(
                  label: const Text('All', style: TextStyle(fontSize: 11)),
                  selected: _filterTag == null,
                  onSelected: (_) => setState(() => _filterTag = null),
                ),
                const SizedBox(width: 6),
                ..._tags.map((t) => Padding(
                      padding: const EdgeInsets.only(right: 6),
                      child: ChoiceChip(
                        label: Text(t, style: const TextStyle(fontSize: 11)),
                        selected: _filterTag == t,
                        onSelected: (_) => setState(() => _filterTag = _filterTag == t ? null : t),
                      ),
                    )),
              ],
            ),
          ),
          const SizedBox(height: 14),

          if (filtered.isEmpty)
            const Padding(
              padding: EdgeInsets.symmetric(vertical: 48),
              child: Center(
                child: Text(
                  'Your Chronicle is empty.\nTap WRITE or pick a prompt above to log today\'s battle.',
                  textAlign: TextAlign.center,
                  style: TextStyle(color: HunterTheme.textMuted, fontSize: 13),
                ),
              ),
            )
          else
            ...filtered.map((e) => Container(
                  margin: const EdgeInsets.only(bottom: 12),
                  padding: const EdgeInsets.all(14),
                  decoration: BoxDecoration(
                    color: HunterTheme.surface,
                    borderRadius: BorderRadius.circular(14),
                    border: Border.all(color: HunterTheme.purple.withValues(alpha: 0.25)),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                            decoration: BoxDecoration(
                              color: HunterTheme.cyan.withValues(alpha: 0.14),
                              borderRadius: BorderRadius.circular(6),
                            ),
                            child: Text(
                              e.mood.toUpperCase(),
                              style: const TextStyle(color: HunterTheme.cyanLight, fontSize: 10, fontWeight: FontWeight.w900),
                            ),
                          ),
                          const SizedBox(width: 8),
                          Text(
                            DateFormat('MMM d, h:mm a').format(e.createdAt.toLocal()),
                            style: const TextStyle(color: HunterTheme.textMuted, fontSize: 11),
                          ),
                          const Spacer(),
                          IconButton(
                            icon: const Icon(Icons.delete_outline, color: HunterTheme.textMuted, size: 18),
                            onPressed: () => ref.read(journalProvider.notifier).deleteEntry(e.id),
                          ),
                        ],
                      ),
                      Text(
                        e.title,
                        style: const TextStyle(color: HunterTheme.textPrimary, fontWeight: FontWeight.w900, fontSize: 14.5),
                      ),
                      if (e.promptUsed != null) ...[
                        const SizedBox(height: 4),
                        Text(
                          e.promptUsed!,
                          style: const TextStyle(color: HunterTheme.purple, fontSize: 11.5, fontStyle: FontStyle.italic),
                        ),
                      ],
                      const SizedBox(height: 6),
                      Text(
                        e.body,
                        style: const TextStyle(color: HunterTheme.textPrimary, fontSize: 13, height: 1.45),
                      ),
                      if (e.tags.isNotEmpty) ...[
                        const SizedBox(height: 8),
                        Wrap(
                          spacing: 6,
                          children: e.tags
                              .map((t) => Text('#$t', style: const TextStyle(color: HunterTheme.cyanLight, fontSize: 11)))
                              .toList(),
                        ),
                      ],
                    ],
                  ),
                )),
        ],
      ),
    );
  }
}

extension _StringContainsExt on String {
  bool includes(String other) => contains(other);
}
