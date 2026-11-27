// Models for Feature #7 30-Day Execution Protocol Roadmap & Trajectory.

class RoadmapTaskModel {
  final String id;
  final String weekId;
  final int dayNumber;
  final String text;
  final int order;
  final bool isBoss;
  final bool completed;

  const RoadmapTaskModel({
    required this.id,
    required this.weekId,
    required this.dayNumber,
    required this.text,
    this.order = 0,
    this.isBoss = false,
    this.completed = false,
  });

  factory RoadmapTaskModel.fromJson(Map<String, dynamic> json) {
    return RoadmapTaskModel(
      id: json['id']?.toString() ?? '',
      weekId: json['weekId']?.toString() ?? '',
      dayNumber: (json['dayNumber'] as num?)?.toInt() ?? 1,
      text: json['text']?.toString() ?? '',
      order: (json['order'] as num?)?.toInt() ?? 0,
      isBoss: json['isBoss'] == true,
      completed: json['completed'] == true,
    );
  }

  RoadmapTaskModel copyWith({bool? completed}) {
    return RoadmapTaskModel(
      id: id,
      weekId: weekId,
      dayNumber: dayNumber,
      text: text,
      order: order,
      isBoss: isBoss,
      completed: completed ?? this.completed,
    );
  }
}

class RoadmapWeekModel {
  final String id;
  final String roadmapId;
  final int weekNumber;
  final String phaseName;
  final String goal;
  final String description;
  final bool isLocked;
  final int targetFocusMinutes;
  final int loggedFocusMinutes;
  final int targetWorkouts;
  final int loggedWorkouts;
  final String? bossName;
  final String? bossTitle;
  final String? bossWeaknessRule;
  final int bossMaxHp;
  final int bossCurrentHp;
  final int bossDamageToday;
  final bool bossDefeated;
  final bool bossLootClaimed;
  final List<RoadmapTaskModel> tasks;

  const RoadmapWeekModel({
    required this.id,
    required this.roadmapId,
    required this.weekNumber,
    required this.phaseName,
    required this.goal,
    required this.description,
    this.isLocked = false,
    this.targetFocusMinutes = 180,
    this.loggedFocusMinutes = 0,
    this.targetWorkouts = 3,
    this.loggedWorkouts = 0,
    this.bossName,
    this.bossTitle,
    this.bossWeaknessRule,
    this.bossMaxHp = 1000,
    this.bossCurrentHp = 1000,
    this.bossDamageToday = 0,
    this.bossDefeated = false,
    this.bossLootClaimed = false,
    this.tasks = const [],
  });

  int get completedCount => tasks.where((t) => t.completed).length;
  double get progress =>
      tasks.isEmpty ? 0.0 : completedCount / tasks.length;
  double get bossHpFraction =>
      bossMaxHp <= 0 ? 0.0 : (bossCurrentHp / bossMaxHp).clamp(0.0, 1.0);

  factory RoadmapWeekModel.fromJson(Map<String, dynamic> json) {
    final rawTasks = json['tasks'];
    return RoadmapWeekModel(
      id: json['id']?.toString() ?? '',
      roadmapId: json['roadmapId']?.toString() ?? '',
      weekNumber: (json['weekNumber'] as num?)?.toInt() ?? 1,
      phaseName: json['phaseName']?.toString() ?? 'Phase',
      goal: json['goal']?.toString() ?? '',
      description: json['description']?.toString() ?? '',
      isLocked: json['isLocked'] == true,
      targetFocusMinutes: (json['targetFocusMinutes'] as num?)?.toInt() ?? 180,
      loggedFocusMinutes: (json['loggedFocusMinutes'] as num?)?.toInt() ?? 0,
      targetWorkouts: (json['targetWorkouts'] as num?)?.toInt() ?? 3,
      loggedWorkouts: (json['loggedWorkouts'] as num?)?.toInt() ?? 0,
      bossName: json['bossName']?.toString(),
      bossTitle: json['bossTitle']?.toString(),
      bossWeaknessRule: json['bossWeaknessRule']?.toString(),
      bossMaxHp: (json['bossMaxHp'] as num?)?.toInt() ?? 1000,
      bossCurrentHp: (json['bossCurrentHp'] as num?)?.toInt() ?? 1000,
      bossDamageToday: (json['bossDamageToday'] as num?)?.toInt() ?? 0,
      bossDefeated: json['bossDefeated'] == true,
      bossLootClaimed: json['bossLootClaimed'] == true,
      tasks: rawTasks is List
          ? rawTasks
              .map((t) => RoadmapTaskModel.fromJson(t as Map<String, dynamic>))
              .toList()
          : const [],
    );
  }

  RoadmapWeekModel copyWith({
    bool? isLocked,
    List<RoadmapTaskModel>? tasks,
  }) {
    return RoadmapWeekModel(
      id: id,
      roadmapId: roadmapId,
      weekNumber: weekNumber,
      phaseName: phaseName,
      goal: goal,
      description: description,
      isLocked: isLocked ?? this.isLocked,
      targetFocusMinutes: targetFocusMinutes,
      loggedFocusMinutes: loggedFocusMinutes,
      targetWorkouts: targetWorkouts,
      loggedWorkouts: loggedWorkouts,
      bossName: bossName,
      bossTitle: bossTitle,
      bossWeaknessRule: bossWeaknessRule,
      bossMaxHp: bossMaxHp,
      bossCurrentHp: bossCurrentHp,
      bossDamageToday: bossDamageToday,
      bossDefeated: bossDefeated,
      bossLootClaimed: bossLootClaimed,
      tasks: tasks ?? this.tasks,
    );
  }
}

class RoadmapModel {
  final String id;
  final String userId;
  final String status;
  final int currentWeek;
  final String? linkedGoalText;
  final String? goalDomain;
  final int goalProgressPercent;
  final List<RoadmapWeekModel> weeks;

  const RoadmapModel({
    required this.id,
    required this.userId,
    required this.status,
    required this.currentWeek,
    this.linkedGoalText,
    this.goalDomain,
    this.goalProgressPercent = 0,
    this.weeks = const [],
  });

  factory RoadmapModel.fromJson(Map<String, dynamic> json) {
    final rawWeeks = json['weeks'];
    final parsedWeeks = rawWeeks is List
        ? rawWeeks
            .map((w) => RoadmapWeekModel.fromJson(w as Map<String, dynamic>))
            .toList()
        : <RoadmapWeekModel>[];
    parsedWeeks.sort((a, b) => a.weekNumber.compareTo(b.weekNumber));
    return RoadmapModel(
      id: json['id']?.toString() ?? '',
      userId: json['userId']?.toString() ?? '',
      status: json['status']?.toString() ?? 'active',
      currentWeek: (json['currentWeek'] as num?)?.toInt() ?? 1,
      linkedGoalText: json['linkedGoalText']?.toString(),
      goalDomain: json['goalDomain']?.toString(),
      goalProgressPercent: (json['goalProgressPercent'] as num?)?.toInt() ?? 0,
      weeks: parsedWeeks,
    );
  }

  RoadmapWeekModel? get activeWeek {
    if (weeks.isEmpty) return null;
    for (final w in weeks) {
      if (w.weekNumber == currentWeek) return w;
    }
    return weeks.first;
  }
}

class RoadmapTrajectoryModel {
  final int disciplineScore;
  final String tier;
  final String targetOutcome;
  final String? projectedDate;
  final String status;
  final double? dailyHours;

  const RoadmapTrajectoryModel({
    required this.disciplineScore,
    required this.tier,
    required this.targetOutcome,
    this.projectedDate,
    required this.status,
    this.dailyHours,
  });

  factory RoadmapTrajectoryModel.fromJson(Map<String, dynamic> json) {
    final traj = json['trajectory'] as Map<String, dynamic>? ?? const {};
    final profile = json['profile'] as Map<String, dynamic>? ?? const {};
    final score = json['disciplineScore'] as Map<String, dynamic>? ?? const {};
    return RoadmapTrajectoryModel(
      disciplineScore: (score['score'] as num?)?.toInt() ?? 700,
      tier: score['tier']?.toString() ?? 'Practitioner',
      targetOutcome: profile['targetOutcome']?.toString() ??
          traj['targetOutcome']?.toString() ??
          '30-Day Execution',
      projectedDate: traj['projectedCompletionDate']?.toString(),
      status: traj['status']?.toString() ?? 'ON TRACK',
      dailyHours: (traj['requiredDailyHours'] as num?)?.toDouble(),
    );
  }
}
