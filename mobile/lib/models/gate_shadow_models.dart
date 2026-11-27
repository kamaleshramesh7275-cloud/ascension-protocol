// Models for Surprise Gate events, Shadow Extraction army, and Bio-Fatigue telemetry.

class GateEventModel {
  final String id;
  final String gateType; // blue_gate, red_gate
  final String title;
  final String description;
  final String targetType; // focus_minutes, workouts, quests
  final int targetValue;
  final int currentValue;
  final DateTime? expiresAt;
  final int rewardCoins;
  final bool claimed;

  const GateEventModel({
    required this.id,
    required this.gateType,
    required this.title,
    required this.description,
    required this.targetType,
    required this.targetValue,
    required this.currentValue,
    this.expiresAt,
    required this.rewardCoins,
    this.claimed = false,
  });

  bool get isRedGate => gateType == 'red_gate';
  bool get isReadyToClaim => !claimed && currentValue >= targetValue;
  double get progress =>
      targetValue > 0 ? (currentValue / targetValue).clamp(0.0, 1.0) : 0.0;

  factory GateEventModel.fromJson(Map<String, dynamic> json) {
    return GateEventModel(
      id: json['id']?.toString() ?? '',
      gateType: json['gateType']?.toString() ?? 'blue_gate',
      title: json['title']?.toString() ?? 'GATE DISCOVERED',
      description: json['description']?.toString() ?? '',
      targetType: json['targetType']?.toString() ?? 'focus_minutes',
      targetValue: (json['targetValue'] as num?)?.toInt() ?? 1,
      currentValue: (json['currentValue'] as num?)?.toInt() ?? 0,
      expiresAt: json['expiresAt'] != null
          ? DateTime.tryParse(json['expiresAt'].toString())
          : null,
      rewardCoins: (json['rewardCoins'] as num?)?.toInt() ?? 100,
      claimed: json['claimed'] == true,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'gateType': gateType,
      'title': title,
      'description': description,
      'targetType': targetType,
      'targetValue': targetValue,
      'currentValue': currentValue,
      'expiresAt': expiresAt?.toIso8601String(),
      'rewardCoins': rewardCoins,
      'claimed': claimed,
    };
  }
}

class ShadowCatalogItem {
  final String id; // igris, tank, iron, beru
  final String name;
  final String epithet;
  final String rank;
  final String perkTitle;
  final String perkDescription;
  final String unlockCondition;
  final bool unlocked;
  final bool equipped;

  const ShadowCatalogItem({
    required this.id,
    required this.name,
    required this.epithet,
    required this.rank,
    required this.perkTitle,
    required this.perkDescription,
    required this.unlockCondition,
    required this.unlocked,
    required this.equipped,
  });

  factory ShadowCatalogItem.fromJson(Map<String, dynamic> json) {
    return ShadowCatalogItem(
      id: json['id']?.toString() ?? '',
      name: json['name']?.toString() ?? 'Shadow Soldier',
      epithet: json['epithet']?.toString() ?? '',
      rank: json['rank']?.toString() ?? 'Knight',
      perkTitle: json['perkTitle']?.toString() ?? '',
      perkDescription: json['perkDescription']?.toString() ?? '',
      unlockCondition: json['unlockCondition']?.toString() ?? '',
      unlocked: json['unlocked'] == true,
      equipped: json['equipped'] == true,
    );
  }
}

class FatigueTelemetryModel {
  final int fatigueScore;
  final bool recoveryRecommended;
  final double lastSleepHours;
  final int workoutsLast48h;
  final int focusMinutesLast48h;
  final bool activeRecoveryDay;

  const FatigueTelemetryModel({
    required this.fatigueScore,
    required this.recoveryRecommended,
    required this.lastSleepHours,
    required this.workoutsLast48h,
    required this.focusMinutesLast48h,
    required this.activeRecoveryDay,
  });

  factory FatigueTelemetryModel.fromJson(Map<String, dynamic> json) {
    return FatigueTelemetryModel(
      fatigueScore: (json['fatigueScore'] as num?)?.toInt() ?? 0,
      recoveryRecommended: json['recoveryRecommended'] == true,
      lastSleepHours: (json['lastSleepHours'] as num?)?.toDouble() ?? 7.5,
      workoutsLast48h: (json['workoutsLast48h'] as num?)?.toInt() ?? 0,
      focusMinutesLast48h: (json['focusMinutesLast48h'] as num?)?.toInt() ?? 0,
      activeRecoveryDay: json['activeRecoveryDay'] == true,
    );
  }
}
