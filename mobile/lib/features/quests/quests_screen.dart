import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../../core/theme/hunter_theme.dart';
import '../../models/user_model.dart';
import '../../models/quest_model.dart';

class QuestsScreen extends StatefulWidget {
  final UserModel user;
  const QuestsScreen({super.key, required this.user});

  @override
  State<QuestsScreen> createState() => _QuestsScreenState();
}

class _QuestsScreenState extends State<QuestsScreen> {
  late List<QuestModel> _quests;
  String _selectedFilter = 'ALL';

  @override
  void initState() {
    super.initState();
    _quests = [
      const QuestModel(
        id: '1',
        title: 'Shadow Sprint: 5km Cardio',
        description: 'Endure a 5-kilometer high-intensity sprint or walk.',
        category: 'physical',
        xp: 50,
        attribute: 'AGI',
        completed: false,
        difficulty: 'C',
        streakCount: 4,
      ),
      const QuestModel(
        id: '2',
        title: 'Hunter Strength Protocol: 100 Pushups',
        description: 'Execute 100 total pushups across designated sets.',
        category: 'physical',
        xp: 40,
        attribute: 'STR',
        completed: true,
        difficulty: 'D',
        streakCount: 12,
      ),
      const QuestModel(
        id: '3',
        title: 'Air-Gap Deep Work Protocol',
        description: 'Engage 45 minutes of distraction-free focused intellect.',
        category: 'mental',
        xp: 60,
        attribute: 'INT',
        completed: false,
        difficulty: 'B',
        streakCount: 7,
      ),
      const QuestModel(
        id: '4',
        title: 'Boss Dungeon: 24h Cold Shower Discipline',
        description: 'Overcome hesitation. Conquer morning thermal discipline.',
        category: 'boss',
        xp: 100,
        attribute: 'WIL',
        completed: false,
        difficulty: 'A',
        streakCount: 2,
      ),
    ];
  }

  void _toggleQuest(int index) {
    HapticFeedback.mediumImpact();
    setState(() {
      _quests[index] = _quests[index].copyWith(
        completed: !_quests[index].completed,
      );
    });

    if (_quests[index].completed) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          backgroundColor: HunterTheme.surfaceLight,
          content: Row(
            children: [
              const Icon(Icons.bolt, color: HunterTheme.cyan),
              const SizedBox(width: 8),
              Text(
                '+${_quests[index].xp} XP Gained! Attribute enhanced.',
                style: const TextStyle(
                  color: HunterTheme.cyanLight,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ],
          ),
          duration: const Duration(seconds: 2),
          behavior: SnackBarBehavior.floating,
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final filteredQuests = _selectedFilter == 'ALL'
        ? _quests
        : _quests.where((q) {
            if (_selectedFilter == 'DAILY') return q.category == 'physical';
            if (_selectedFilter == 'BOSS') return q.category == 'boss';
            if (_selectedFilter == 'INTELLECT') return q.category == 'mental';
            return true;
          }).toList();

    final completedCount = _quests.where((q) => q.completed).length;

    return Scaffold(
      backgroundColor: HunterTheme.abyss,
      appBar: AppBar(
        backgroundColor: HunterTheme.abyss,
        elevation: 0,
        title: Row(
          children: [
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
              decoration: BoxDecoration(
                color: HunterTheme.cyan.withValues(alpha: 0.15),
                borderRadius: BorderRadius.circular(8),
                border: Border.all(color: HunterTheme.cyan.withValues(alpha: 0.4)),
              ),
              child: Text(
                'RANK ${widget.user.tier}',
                style: const TextStyle(
                  color: HunterTheme.cyanLight,
                  fontWeight: FontWeight.w900,
                  fontSize: 13,
                ),
              ),
            ),
            const SizedBox(width: 10),
            Text(
              'HUNTER SYSTEM',
              style: Theme.of(context).textTheme.titleLarge?.copyWith(
                    letterSpacing: 2,
                    fontWeight: FontWeight.w800,
                  ),
            ),
          ],
        ),
        actions: [
          Container(
            margin: const EdgeInsets.only(right: 16),
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
            decoration: BoxDecoration(
              color: HunterTheme.surface,
              borderRadius: BorderRadius.circular(20),
              border: Border.all(color: HunterTheme.gold.withValues(alpha: 0.3)),
            ),
            child: Row(
              children: [
                const Icon(Icons.shield, color: HunterTheme.cyan, size: 16),
                const SizedBox(width: 4),
                Text(
                  '${widget.user.streakShields} SHIELD',
                  style: const TextStyle(
                    color: HunterTheme.textPrimary,
                    fontSize: 11,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
      body: ListView(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        children: [
          // Hunter Progress HUD Card
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              gradient: LinearGradient(
                colors: [
                  HunterTheme.surfaceLight,
                  HunterTheme.surface,
                ],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: HunterTheme.cyan.withValues(alpha: 0.3)),
              boxShadow: [
                BoxShadow(
                  color: HunterTheme.cyan.withValues(alpha: 0.08),
                  blurRadius: 16,
                  offset: const Offset(0, 4),
                ),
              ],
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      'LV. ${widget.user.level} ${widget.user.hunterClass.toUpperCase()}',
                      style: const TextStyle(
                        color: HunterTheme.cyanLight,
                        fontWeight: FontWeight.w900,
                        fontSize: 16,
                        letterSpacing: 1.2,
                      ),
                    ),
                    Text(
                      'STREAK: ${widget.user.streak} DAYS 🔥',
                      style: const TextStyle(
                        color: HunterTheme.gold,
                        fontWeight: FontWeight.bold,
                        fontSize: 13,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                ClipRRect(
                  borderRadius: BorderRadius.circular(8),
                  child: LinearProgressIndicator(
                    value: widget.user.xpProgress,
                    backgroundColor: HunterTheme.abyss,
                    valueColor: const AlwaysStoppedAnimation<Color>(HunterTheme.cyan),
                    minHeight: 8,
                  ),
                ),
                const SizedBox(height: 8),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      'XP: ${widget.user.xp} / ${widget.user.xpForNextLevel}',
                      style: const TextStyle(color: HunterTheme.textMuted, fontSize: 12),
                    ),
                    Text(
                      'Quests Cleared: $completedCount/${_quests.length}',
                      style: const TextStyle(color: HunterTheme.textPrimary, fontSize: 12),
                    ),
                  ],
                ),
              ],
            ),
          ).animate().fadeIn(duration: 400.ms).slideY(begin: 0.1, end: 0),

          const SizedBox(height: 20),

          // Quest Category Filters
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            child: Row(
              children: [
                _buildFilterChip('ALL'),
                _buildFilterChip('DAILY'),
                _buildFilterChip('BOSS'),
                _buildFilterChip('INTELLECT'),
              ],
            ),
          ),

          const SizedBox(height: 16),

          // Quest Cards List
          ...filteredQuests.asMap().entries.map((entry) {
            final index = entry.key;
            final quest = entry.value;

            return Card(
              margin: const EdgeInsets.only(bottom: 12),
              color: quest.completed
                  ? HunterTheme.surface.withValues(alpha: 0.5)
                  : HunterTheme.surface,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(14),
                side: BorderSide(
                  color: quest.completed
                      ? HunterTheme.emerald.withValues(alpha: 0.4)
                      : (quest.category == 'boss'
                          ? HunterTheme.crimson.withValues(alpha: 0.5)
                          : HunterTheme.cyan.withValues(alpha: 0.2)),
                  width: 1.2,
                ),
              ),
              child: InkWell(
                onTap: () => _toggleQuest(index),
                borderRadius: BorderRadius.circular(14),
                child: Padding(
                  padding: const EdgeInsets.all(14),
                  child: Row(
                    children: [
                      // Checkbox
                      Container(
                        width: 28,
                        height: 28,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          color: quest.completed
                              ? HunterTheme.emerald
                              : Colors.transparent,
                          border: Border.all(
                            color: quest.completed
                                ? HunterTheme.emerald
                                : HunterTheme.cyan,
                            width: 2,
                          ),
                        ),
                        child: quest.completed
                            ? const Icon(Icons.check, size: 18, color: Colors.black)
                            : null,
                      ),
                      const SizedBox(width: 14),

                      // Quest Info
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              children: [
                                Container(
                                  padding: const EdgeInsets.symmetric(
                                      horizontal: 6, vertical: 2),
                                  decoration: BoxDecoration(
                                    color: quest.category == 'boss'
                                        ? HunterTheme.crimson.withValues(alpha: 0.2)
                                        : HunterTheme.cyan.withValues(alpha: 0.2),
                                    borderRadius: BorderRadius.circular(4),
                                  ),
                                  child: Text(
                                    '[RANK ${quest.difficulty}]',
                                    style: TextStyle(
                                      color: quest.category == 'boss'
                                          ? HunterTheme.crimson
                                          : HunterTheme.cyanLight,
                                      fontWeight: FontWeight.w900,
                                      fontSize: 10,
                                    ),
                                  ),
                                ),
                                const SizedBox(width: 8),
                                Text(
                                  '+${quest.xp} XP • ${quest.attribute}',
                                  style: const TextStyle(
                                    color: HunterTheme.gold,
                                    fontSize: 11,
                                    fontWeight: FontWeight.w600,
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 4),
                            Text(
                              quest.title,
                              style: TextStyle(
                                color: quest.completed
                                    ? HunterTheme.textMuted
                                    : HunterTheme.textPrimary,
                                fontWeight: FontWeight.bold,
                                fontSize: 15,
                                decoration: quest.completed
                                    ? TextDecoration.lineThrough
                                    : TextDecoration.none,
                              ),
                            ),
                            const SizedBox(height: 2),
                            Text(
                              quest.description,
                              style: const TextStyle(
                                color: HunterTheme.textMuted,
                                fontSize: 12,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ).animate().fadeIn(delay: (index * 60).ms);
          }),
        ],
      ),
    );
  }

  Widget _buildFilterChip(String label) {
    final isSelected = _selectedFilter == label;
    return Padding(
      padding: const EdgeInsets.only(right: 8),
      child: ChoiceChip(
        label: Text(label),
        selected: isSelected,
        onSelected: (_) {
          HapticFeedback.selectionClick();
          setState(() => _selectedFilter = label);
        },
        backgroundColor: HunterTheme.surface,
        selectedColor: HunterTheme.cyan,
        labelStyle: TextStyle(
          color: isSelected ? Colors.black : HunterTheme.textPrimary,
          fontWeight: FontWeight.bold,
          fontSize: 12,
        ),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(10),
          side: BorderSide(
            color: isSelected ? HunterTheme.cyan : HunterTheme.cyan.withValues(alpha: 0.2),
          ),
        ),
      ),
    );
  }
}
