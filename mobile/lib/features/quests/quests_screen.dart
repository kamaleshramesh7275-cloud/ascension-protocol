import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../../core/theme/hunter_theme.dart';
import '../../models/user_model.dart';
import '../../core/providers/quests_provider.dart';

class QuestsScreen extends ConsumerStatefulWidget {
  final UserModel user;
  const QuestsScreen({super.key, required this.user});

  @override
  ConsumerState<QuestsScreen> createState() => _QuestsScreenState();
}

class _QuestsScreenState extends ConsumerState<QuestsScreen> {
  String _selectedFilter = 'ALL';

  void _toggleQuest(String questId) {
    HapticFeedback.mediumImpact();
    ref.read(questsProvider.notifier).toggleQuest(questId);

    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        backgroundColor: HunterTheme.surfaceLight,
        content: Row(
          children: const [
            Icon(Icons.bolt, color: HunterTheme.cyan),
            SizedBox(width: 8),
            Text(
              'Quest State Synchronized with System.',
              style: TextStyle(
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

  @override
  Widget build(BuildContext context) {
    final quests = ref.watch(questsProvider);

    final filteredQuests = _selectedFilter == 'ALL'
        ? quests
        : quests.where((q) {
            if (_selectedFilter == 'DAILY') {
              return q.type == 'daily' || q.category == 'fitness' || q.category == 'physical';
            }
            if (_selectedFilter == 'WEEKLY') {
              return q.type == 'weekly' || q.category == 'weekly';
            }
            if (_selectedFilter == 'BOSS') {
              return q.isBoss || q.type == 'boss' || q.category == 'boss';
            }
            if (_selectedFilter == 'INTELLECT') {
              return q.category == 'productivity' || q.category == 'mental' || q.attribute == 'INT';
            }
            return true;
          }).toList();

    final completedCount = quests.where((q) => q.completed).length;

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
      body: RefreshIndicator(
        onRefresh: () => ref.read(questsProvider.notifier).loadQuests(),
        color: HunterTheme.cyan,
        backgroundColor: HunterTheme.surface,
        child: ListView(
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
                        'XP: ${widget.user.xpIntoLevel} / ${widget.user.xpForNextLevel}',
                        style: const TextStyle(color: HunterTheme.textMuted, fontSize: 12),
                      ),
                      Text(
                        'Quests Cleared: $completedCount/${quests.length}',
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
                  _buildFilterChip('WEEKLY'),
                  _buildFilterChip('BOSS'),
                  _buildFilterChip('INTELLECT'),
                ],
              ),
            ),

            const SizedBox(height: 16),

            // Quest Cards List
            if (filteredQuests.isEmpty)
              Padding(
                padding: const EdgeInsets.symmetric(vertical: 40),
                child: Center(
                  child: Column(
                    children: const [
                      Icon(Icons.check_circle_outline, color: HunterTheme.cyan, size: 48),
                      SizedBox(height: 12),
                      Text(
                        'ALL SECTOR QUESTS CLEARED',
                        style: TextStyle(
                          color: HunterTheme.cyanLight,
                          fontWeight: FontWeight.bold,
                          letterSpacing: 1.5,
                        ),
                      ),
                      SizedBox(height: 4),
                      Text(
                        'Rest and recover, Hunter. New missions await at 00:00.',
                        style: TextStyle(color: HunterTheme.textMuted, fontSize: 12),
                      ),
                    ],
                  ),
                ),
              )
            else
              ...filteredQuests.map((quest) {
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
                    onTap: quest.isCompleting ? null : () => _toggleQuest(quest.id),
                    borderRadius: BorderRadius.circular(14),
                    child: Padding(
                      padding: const EdgeInsets.all(14),
                      child: Row(
                        children: [
                          // Checkbox / Loading indicator
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
                            child: quest.isCompleting
                                ? const Center(
                                    child: SizedBox(
                                      width: 14,
                                      height: 14,
                                      child: CircularProgressIndicator(strokeWidth: 2, color: Colors.black),
                                    ),
                                  )
                                : (quest.completed
                                    ? const Icon(Icons.check, size: 18, color: Colors.black)
                                    : null),
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
                );
              }),
          ],
        ),
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
