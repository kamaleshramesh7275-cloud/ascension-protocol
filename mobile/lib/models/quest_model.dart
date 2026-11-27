class QuestModel {
  final String id;
  final String title;
  final String description;
  final String category; // fitness, productivity, mindfulness, physical, mental, weekly, boss, etc.
  final String type; // daily, weekly, boss, campaign, penalty
  final int xp;
  final int coins;
  final String attribute; // STR, AGI, STA, VIT, INT, WIL, CHA
  final bool completed;
  final String difficulty; // E, D, C, B, A, S, or normal, hard
  final int streakCount;
  final bool isBoss;
  final bool isCompleting; // Loading state to prevent double-tap race
  final DateTime? dueAt;
  final String? roadmapTaskId;
  final String executionMode; // checkbox, focus_verified, workout_verified, proof_text
  final int? targetMinutes;
  final String sourceType; // goal, roadmap, bottleneck, recovery, gate, comeback
  final String? content; // Cached 5-minute AI starter micro-step (#5)

  const QuestModel({
    required this.id,
    required this.title,
    required this.description,
    required this.category,
    this.type = 'daily',
    required this.xp,
    this.coins = 10,
    required this.attribute,
    required this.completed,
    required this.difficulty,
    this.streakCount = 0,
    this.isBoss = false,
    this.isCompleting = false,
    this.dueAt,
    this.roadmapTaskId,
    this.executionMode = 'checkbox',
    this.targetMinutes,
    this.sourceType = 'goal',
    this.content,
  });

  bool get isPenalty => type == 'penalty';
  bool get isFocusVerified => executionMode == 'focus_verified';
  bool get isWorkoutVerified => executionMode == 'workout_verified';

  factory QuestModel.fromJson(Map<String, dynamic> json) {
    final xpVal = (json['rewardXP'] as num?)?.toInt() ??
        (json['reward_xp'] as num?)?.toInt() ??
        (json['xp'] as num?)?.toInt() ??
        35;
    final coinsVal = (json['rewardCoins'] as num?)?.toInt() ??
        (json['reward_coins'] as num?)?.toInt() ??
        (json['coins'] as num?)?.toInt() ??
        10;

    String attr = 'STR';
    if (json['rewardStats'] is Map && (json['rewardStats'] as Map).isNotEmpty) {
      final key = (json['rewardStats'] as Map).keys.first.toString().toUpperCase();
      attr = key.length > 3 ? key.substring(0, 3) : key;
    } else if (json['attribute'] != null) {
      attr = json['attribute'].toString().toUpperCase();
      if (attr.length > 3) attr = attr.substring(0, 3);
    } else {
      final cat = json['category']?.toString().toLowerCase() ?? '';
      if (cat.contains('fit') || cat.contains('phys')) {
        attr = 'STR';
      } else if (cat.contains('mind') || cat.contains('prod')) {
        attr = 'INT';
      } else {
        attr = 'WIL';
      }
    }

    final questType = json['type']?.toString().toLowerCase() ?? 'daily';
    final isBossQuest = json['isBoss'] == true || questType == 'boss';

    return QuestModel(
      id: json['id']?.toString() ?? '',
      title: json['title']?.toString() ?? 'Protocol Task',
      description: json['description']?.toString() ?? '',
      category: json['category']?.toString() ?? 'fitness',
      type: questType,
      xp: xpVal,
      coins: coinsVal,
      attribute: attr,
      completed: json['completed'] == true,
      difficulty: json['difficulty']?.toString().toUpperCase() ?? 'D',
      streakCount: (json['streakCount'] as num?)?.toInt() ?? 0,
      isBoss: isBossQuest,
      isCompleting: false,
      dueAt: json['dueAt'] != null ? DateTime.tryParse(json['dueAt'].toString()) : null,
      roadmapTaskId: json['roadmapTaskId']?.toString(),
      executionMode: json['executionMode']?.toString() ?? 'checkbox',
      targetMinutes: (json['targetMinutes'] as num?)?.toInt(),
      sourceType: json['sourceType']?.toString() ?? 'goal',
      content: json['content']?.toString(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'title': title,
      'description': description,
      'category': category,
      'type': type,
      'xp': xp,
      'rewardXP': xp,
      'rewardCoins': coins,
      'attribute': attribute,
      'completed': completed,
      'difficulty': difficulty,
      'streakCount': streakCount,
      'isBoss': isBoss,
      'dueAt': dueAt?.toIso8601String(),
      'roadmapTaskId': roadmapTaskId,
      'executionMode': executionMode,
      'targetMinutes': targetMinutes,
      'sourceType': sourceType,
      'content': content,
    };
  }

  QuestModel copyWith({
    String? id,
    String? title,
    String? description,
    String? category,
    String? type,
    int? xp,
    int? coins,
    String? attribute,
    bool? completed,
    String? difficulty,
    int? streakCount,
    bool? isBoss,
    bool? isCompleting,
    DateTime? dueAt,
    String? content,
  }) {
    return QuestModel(
      id: id ?? this.id,
      title: title ?? this.title,
      description: description ?? this.description,
      category: category ?? this.category,
      type: type ?? this.type,
      xp: xp ?? this.xp,
      coins: coins ?? this.coins,
      attribute: attribute ?? this.attribute,
      completed: completed ?? this.completed,
      difficulty: difficulty ?? this.difficulty,
      streakCount: streakCount ?? this.streakCount,
      isBoss: isBoss ?? this.isBoss,
      isCompleting: isCompleting ?? this.isCompleting,
      dueAt: dueAt ?? this.dueAt,
      roadmapTaskId: roadmapTaskId,
      executionMode: executionMode,
      targetMinutes: targetMinutes,
      sourceType: sourceType,
      content: content ?? this.content,
    );
  }
}
