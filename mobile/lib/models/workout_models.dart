// Models for Strength Workout Logger, Official Split Routines, & Epley 1RM PR Tracking.

double parseNumericDouble(dynamic val, [double fallback = 0.0]) {
  if (val == null) return fallback;
  if (val is num) return val.toDouble();
  return double.tryParse(val.toString()) ?? fallback;
}

int parseNumericInt(dynamic val, [int fallback = 0]) {
  if (val == null) return fallback;
  if (val is num) return val.toInt();
  return int.tryParse(val.toString()) ?? fallback;
}

class ExerciseModel {
  final String id;
  final String name;
  final String category;
  final String muscleGroup;
  final String equipment;
  final String? instructions;
  final bool isCustom;

  const ExerciseModel({
    required this.id,
    required this.name,
    required this.category,
    required this.muscleGroup,
    this.equipment = 'bodyweight',
    this.instructions,
    this.isCustom = false,
  });

  factory ExerciseModel.fromJson(Map<String, dynamic> json) {
    return ExerciseModel(
      id: json['id']?.toString() ?? '',
      name: json['name']?.toString() ?? 'Exercise',
      category: json['category']?.toString() ?? 'strength',
      muscleGroup: json['muscleGroup']?.toString() ?? 'full_body',
      equipment: json['equipment']?.toString() ?? 'bodyweight',
      instructions: json['instructions']?.toString(),
      isCustom: json['isCustom'] == true,
    );
  }
}

class OfficialTemplateModel {
  final String id;
  final String name;
  final String description;
  final String category;
  final String difficulty;
  final String duration;
  final List<String> exerciseNames;

  const OfficialTemplateModel({
    required this.id,
    required this.name,
    required this.description,
    required this.category,
    required this.difficulty,
    required this.duration,
    required this.exerciseNames,
  });

  factory OfficialTemplateModel.fromJson(Map<String, dynamic> json) {
    final rawEx = json['exercises'];
    final names = <String>[];
    if (rawEx is List) {
      for (final item in rawEx) {
        if (item is String) {
          names.add(item);
        } else if (item is Map) {
          final n = item['name']?.toString() ?? item['exerciseName']?.toString();
          if (n != null && n.isNotEmpty) names.add(n);
        }
      }
    }
    return OfficialTemplateModel(
      id: json['id']?.toString() ?? '',
      name: json['name']?.toString() ?? 'Protocol Routine',
      description: json['description']?.toString() ?? '',
      category: json['category']?.toString() ?? 'strength',
      difficulty: json['difficulty']?.toString() ?? 'Intermediate',
      duration: json['duration']?.toString() ?? '45m',
      exerciseNames: names,
    );
  }
}

class WorkoutTemplateModel {
  final String id;
  final String name;
  final String? description;
  final List<String> exerciseIds;

  const WorkoutTemplateModel({
    required this.id,
    required this.name,
    this.description,
    required this.exerciseIds,
  });

  factory WorkoutTemplateModel.fromJson(Map<String, dynamic> json) {
    final raw = json['exerciseIds'];
    return WorkoutTemplateModel(
      id: json['id']?.toString() ?? '',
      name: json['name']?.toString() ?? 'Saved Routine',
      description: json['description']?.toString(),
      exerciseIds: raw is List ? raw.map((e) => e.toString()).toList() : const [],
    );
  }
}

class WorkoutSetModel {
  final String id;
  final String exerciseId;
  final int setNumber;
  final double weight;
  final int reps;
  final int? rpe;
  final String setType; // normal, warmup, dropset, failure
  final bool isPersonalRecord;
  final bool completed;

  const WorkoutSetModel({
    this.id = '',
    required this.exerciseId,
    required this.setNumber,
    required this.weight,
    required this.reps,
    this.rpe,
    this.setType = 'normal',
    this.isPersonalRecord = false,
    this.completed = true,
  });

  /// Standard Epley 1RM formula used to detect live PR breakthroughs in-session.
  static double computeEpley1RM(double weight, int reps) {
    if (weight <= 0 || reps <= 0) return 0;
    if (reps == 1) return weight;
    return weight * (1.0 + reps / 30.0);
  }

  double get estimated1RM => computeEpley1RM(weight, reps);

  factory WorkoutSetModel.fromJson(Map<String, dynamic> json) {
    return WorkoutSetModel(
      id: json['id']?.toString() ?? '',
      exerciseId: json['exerciseId']?.toString() ?? '',
      setNumber: parseNumericInt(json['setNumber'], 1),
      weight: parseNumericDouble(json['weight']),
      reps: parseNumericInt(json['reps']),
      rpe: json['rpe'] != null ? parseNumericInt(json['rpe']) : null,
      setType: json['setType']?.toString() ?? 'normal',
      isPersonalRecord: json['isPersonalRecord'] == true,
      completed: json['completed'] != false,
    );
  }

  Map<String, dynamic> toPayloadJson() {
    return {
      'exerciseId': exerciseId,
      'setNumber': setNumber,
      'weight': weight,
      'reps': reps,
      if (rpe != null) 'rpe': rpe,
      'setType': setType,
    };
  }

  WorkoutSetModel copyWith({
    double? weight,
    int? reps,
    int? rpe,
    String? setType,
    bool? completed,
    bool? isPersonalRecord,
    int? setNumber,
  }) {
    return WorkoutSetModel(
      id: id,
      exerciseId: exerciseId,
      setNumber: setNumber ?? this.setNumber,
      weight: weight ?? this.weight,
      reps: reps ?? this.reps,
      rpe: rpe ?? this.rpe,
      setType: setType ?? this.setType,
      isPersonalRecord: isPersonalRecord ?? this.isPersonalRecord,
      completed: completed ?? this.completed,
    );
  }
}

class WorkoutSessionModel {
  final String id;
  final String userId;
  final String name;
  final String? templateId;
  final DateTime startedAt;
  final DateTime? finishedAt;
  final int durationSeconds;
  final int totalVolume;
  final int totalSets;
  final int xpEarned;
  final String? notes;
  final List<WorkoutSetModel> sets;

  const WorkoutSessionModel({
    required this.id,
    required this.userId,
    required this.name,
    this.templateId,
    required this.startedAt,
    this.finishedAt,
    this.durationSeconds = 0,
    this.totalVolume = 0,
    this.totalSets = 0,
    this.xpEarned = 0,
    this.notes,
    this.sets = const [],
  });

  factory WorkoutSessionModel.fromJson(Map<String, dynamic> json) {
    final rawSets = json['sets'];
    return WorkoutSessionModel(
      id: json['id']?.toString() ?? '',
      userId: json['userId']?.toString() ?? '',
      name: json['name']?.toString() ?? 'Strength Session',
      templateId: json['templateId']?.toString(),
      startedAt: DateTime.tryParse(json['startedAt']?.toString() ?? '') ?? DateTime.now(),
      finishedAt: json['finishedAt'] != null
          ? DateTime.tryParse(json['finishedAt'].toString())
          : null,
      durationSeconds: parseNumericInt(json['durationSeconds']),
      totalVolume: parseNumericInt(json['totalVolume']),
      totalSets: parseNumericInt(json['totalSets']),
      xpEarned: parseNumericInt(json['xpEarned']),
      notes: json['notes']?.toString(),
      sets: rawSets is List
          ? rawSets.map((s) => WorkoutSetModel.fromJson(s as Map<String, dynamic>)).toList()
          : const [],
    );
  }
}

class PersonalRecordModel {
  final String id;
  final String exerciseId;
  final String? exerciseName;
  final String recordType; // 1rm, best_weight, max_reps, best_set_volume
  final double value;
  final DateTime? achievedAt;

  const PersonalRecordModel({
    required this.id,
    required this.exerciseId,
    this.exerciseName,
    required this.recordType,
    required this.value,
    this.achievedAt,
  });

  factory PersonalRecordModel.fromJson(Map<String, dynamic> json) {
    return PersonalRecordModel(
      id: json['id']?.toString() ?? '',
      exerciseId: json['exerciseId']?.toString() ?? '',
      exerciseName: json['exerciseName']?.toString() ??
          (json['exercise'] is Map ? json['exercise']['name']?.toString() : null),
      recordType: json['recordType']?.toString() ?? '1rm',
      value: parseNumericDouble(json['value']),
      achievedAt: json['achievedAt'] != null
          ? DateTime.tryParse(json['achievedAt'].toString())
          : null,
    );
  }
}
