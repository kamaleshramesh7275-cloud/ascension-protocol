class QuestModel {
  final String id;
  final String title;
  final String description;
  final String category; // physical, mental, recovery, boss, habits
  final int xp;
  final String attribute; // strength, agility, stamina, etc.
  final bool completed;
  final String difficulty; // E, D, C, B, A, S
  final int streakCount;

  const QuestModel({
    required this.id,
    required this.title,
    required this.description,
    required this.category,
    required this.xp,
    required this.attribute,
    required this.completed,
    required this.difficulty,
    this.streakCount = 0,
  });

  factory QuestModel.fromJson(Map<String, dynamic> json) {
    return QuestModel(
      id: json['id']?.toString() ?? '',
      title: json['title']?.toString() ?? 'Daily Quest',
      description: json['description']?.toString() ?? '',
      category: json['category']?.toString() ?? 'daily',
      xp: (json['xp'] as num?)?.toInt() ?? 25,
      attribute: json['attribute']?.toString() ?? 'strength',
      completed: json['completed'] == true,
      difficulty: json['difficulty']?.toString() ?? 'D',
      streakCount: (json['streakCount'] as num?)?.toInt() ?? 0,
    );
  }

  QuestModel copyWith({bool? completed}) {
    return QuestModel(
      id: id,
      title: title,
      description: description,
      category: category,
      xp: xp,
      attribute: attribute,
      completed: completed ?? this.completed,
      difficulty: difficulty,
      streakCount: streakCount,
    );
  }
}
