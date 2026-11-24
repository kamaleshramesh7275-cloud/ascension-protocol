class QuestModel {
  final String id;
  final String title;
  final String description;
  final String category; // fitness, productivity, mindfulness, physical, mental, weekly, boss, etc.
  final String type; // daily, weekly, boss, campaign
  final int xp;
  final String attribute; // STR, AGI, STA, VIT, INT, WIL, CHA
  final bool completed;
  final String difficulty; // E, D, C, B, A, S, or normal, hard
  final int streakCount;
  final bool isBoss;
  final bool isCompleting; // Loading state to prevent double-tap race

  const QuestModel({
    required this.id,
    required this.title,
    required this.description,
    required this.category,
    this.type = 'daily',
    required this.xp,
    required this.attribute,
    required this.completed,
    required this.difficulty,
    this.streakCount = 0,
    this.isBoss = false,
    this.isCompleting = false,
  });

  factory QuestModel.fromJson(Map<String, dynamic> json) {
    // 1. Map XP from rewardXP (server) or xp (legacy)
    final xpVal = (json['rewardXP'] as num?)?.toInt() ??
        (json['reward_xp'] as num?)?.toInt() ??
        (json['xp'] as num?)?.toInt() ??
        35;

    // 2. Map primary attribute
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
      attribute: attr,
      completed: json['completed'] == true,
      difficulty: json['difficulty']?.toString().toUpperCase() ?? 'D',
      streakCount: (json['streakCount'] as num?)?.toInt() ?? 0,
      isBoss: isBossQuest,
      isCompleting: false,
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
      'attribute': attribute,
      'completed': completed,
      'difficulty': difficulty,
      'streakCount': streakCount,
      'isBoss': isBoss,
    };
  }

  QuestModel copyWith({
    String? id,
    String? title,
    String? description,
    String? category,
    String? type,
    int? xp,
    String? attribute,
    bool? completed,
    String? difficulty,
    int? streakCount,
    bool? isBoss,
    bool? isCompleting,
  }) {
    return QuestModel(
      id: id ?? this.id,
      title: title ?? this.title,
      description: description ?? this.description,
      category: category ?? this.category,
      type: type ?? this.type,
      xp: xp ?? this.xp,
      attribute: attribute ?? this.attribute,
      completed: completed ?? this.completed,
      difficulty: difficulty ?? this.difficulty,
      streakCount: streakCount ?? this.streakCount,
      isBoss: isBoss ?? this.isBoss,
      isCompleting: isCompleting ?? this.isCompleting,
    );
  }
}
