import 'dart:convert';
import 'dart:io';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:path_provider/path_provider.dart';

class JournalEntry {
  final String id;
  final String title;
  final String body;
  final String mood; // Locked In | Focused | Fatigued | Struggling | Breakthrough
  final List<String> tags;
  final String? promptUsed;
  final DateTime createdAt;
  final DateTime updatedAt;

  const JournalEntry({
    required this.id,
    required this.title,
    required this.body,
    required this.mood,
    this.tags = const [],
    this.promptUsed,
    required this.createdAt,
    required this.updatedAt,
  });

  factory JournalEntry.fromJson(Map<String, dynamic> json) {
    return JournalEntry(
      id: json['id']?.toString() ?? '',
      title: json['title']?.toString() ?? '',
      body: json['body']?.toString() ?? '',
      mood: json['mood']?.toString() ?? 'Focused',
      tags: (json['tags'] as List?)?.map((e) => e.toString()).toList() ?? const [],
      promptUsed: json['promptUsed']?.toString(),
      createdAt: DateTime.tryParse(json['createdAt']?.toString() ?? '') ?? DateTime.now(),
      updatedAt: DateTime.tryParse(json['updatedAt']?.toString() ?? '') ?? DateTime.now(),
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'title': title,
        'body': body,
        'mood': mood,
        'tags': tags,
        if (promptUsed != null) 'promptUsed': promptUsed,
        'createdAt': createdAt.toUtc().toIso8601String(),
        'updatedAt': updatedAt.toUtc().toIso8601String(),
      };
}

/// 100% On-Device Journaling store (0 Neon storage, 0 network transfer).
class JournalNotifier extends StateNotifier<List<JournalEntry>> {
  JournalNotifier() : super(const []) {
    load();
  }

  static const _fileName = 'hunter_chronicle_journal.json';

  Future<File> _getFile() async {
    final dir = await getApplicationDocumentsDirectory();
    return File('${dir.path}/$_fileName');
  }

  Future<void> load() async {
    try {
      final file = await _getFile();
      if (!await file.exists()) return;
      final raw = await file.readAsString();
      if (raw.trim().isEmpty) return;
      final decoded = jsonDecode(raw);
      if (decoded is List) {
        final entries = decoded
            .whereType<Map<String, dynamic>>()
            .map(JournalEntry.fromJson)
            .toList()
          ..sort((a, b) => b.createdAt.compareTo(a.createdAt));
        state = entries;
      }
    } catch (_) {}
  }

  Future<void> _persist(List<JournalEntry> entries) async {
    try {
      final file = await _getFile();
      await file.writeAsString(jsonEncode(entries.map((e) => e.toJson()).toList()));
    } catch (_) {}
  }

  Future<void> addEntry({
    required String title,
    required String body,
    required String mood,
    List<String> tags = const [],
    String? promptUsed,
  }) async {
    final now = DateTime.now();
    final entry = JournalEntry(
      id: 'j_${now.microsecondsSinceEpoch}',
      title: title.trim().isEmpty ? 'Chronicle Entry' : title.trim(),
      body: body.trim(),
      mood: mood,
      tags: tags,
      promptUsed: promptUsed,
      createdAt: now,
      updatedAt: now,
    );
    final next = [entry, ...state];
    state = next;
    await _persist(next);
  }

  Future<void> deleteEntry(String id) async {
    final next = state.where((e) => e.id != id).toList();
    state = next;
    await _persist(next);
  }

  String exportAsMarkdown() {
    final buf = StringBuffer('# HUNTER\'S CHRONICLE — PERSONAL JOURNAL\n\n');
    for (final e in state) {
      final dateStr = e.createdAt.toLocal().toString().substring(0, 16);
      buf.writeln('## ${e.title}');
      buf.writeln('**Date:** $dateStr | **Mood:** ${e.mood}${e.tags.isNotEmpty ? ' | **Tags:** ${e.tags.join(', ')}' : ''}');
      if (e.promptUsed != null) buf.writeln('> *Prompt: ${e.promptUsed}*');
      buf.writeln();
      buf.writeln(e.body);
      buf.writeln('\n---\n');
    }
    return buf.toString();
  }
}

final journalProvider = StateNotifierProvider<JournalNotifier, List<JournalEntry>>(
  (ref) => JournalNotifier(),
);
