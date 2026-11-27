import 'gate_shadow_models.dart';

class UserModel {
  final String id;
  final String name;
  final String email;
  final String? phone;
  final String? avatarUrl;
  final int level;
  final int xp;
  final int xpIntoLevel;
  final int xpForNextLevel;
  final double xpProgress;
  final String tier; // D, C, B, A, S
  final int streak;
  final int coins;
  final String hunterClass; // assassin, tank, ranger, mage, monarch
  final int streakShields; // Mana Shields
  final bool activeRecoveryDay;
  final bool onboardingCompleted;

  // 7 Core Attributes (1-100)
  final int strength;
  final int agility;
  final int stamina;
  final int vitality;
  final int intelligence;
  final int willpower;
  final int charisma;

  // Customization, Progression & Solo Leveling Mechanics
  final String? activeTitle;
  final String? activeBadgeId;
  final String? theme;
  final bool isPremium;
  final int unspentStatPoints;
  final String? statBias;
  final bool inPenaltyZone;
  final DateTime? penaltyExpiresAt;
  final bool penaltyModeEnabled;
  final bool notificationsEnabled;
  final Map<String, int>? baselineStats;
  final String? anchorQuestId;
  final String? anchorDate;
  final GateEventModel? activeGateEvent;
  final List<String> unlockedShadows;
  final List<String> equippedShadows;
  final String? evolvedClass;
  final int prestigeRank;
  final double? lastSleepHours;
  final String divisionTier;
  final String? currentGoal;
  final String? goalDomain;
  final int dailyCapacityMinutes;
  final String? primaryDistractor;
  final String? lastIfThenPlan;
  final String? lastBlockerTag;
  final String? lastCoachSummary;
  final int? preferredPeakHour;
  final Map<String, dynamic>? activeFocusEscrow;
  final String? nextFocusStep;
  final int preBreakStreak;
  final Map<String, dynamic>? ultimatumState;
  final Map<String, dynamic>? comebackGate;
  final Map<String, dynamic>? pendingExtraction;
  final List<Map<String, dynamic>> extractedShadows;
  final Map<String, dynamic>? jobChangeState;
  final Map<String, dynamic>? doubleDungeonState;
  final Map<String, dynamic>? reawakeningState;
  final Map<String, dynamic>? monarchDomainState;
  final String? guildId;

  const UserModel({
    required this.id,
    required this.name,
    required this.email,
    this.phone,
    this.avatarUrl,
    required this.level,
    required this.xp,
    this.xpIntoLevel = 0,
    this.xpForNextLevel = 100,
    this.xpProgress = 0.0,
    required this.tier,
    required this.streak,
    required this.coins,
    required this.hunterClass,
    required this.streakShields,
    required this.activeRecoveryDay,
    this.onboardingCompleted = true,
    required this.strength,
    required this.agility,
    required this.stamina,
    required this.vitality,
    required this.intelligence,
    required this.willpower,
    required this.charisma,
    this.activeTitle,
    this.activeBadgeId,
    this.theme,
    this.isPremium = false,
    this.unspentStatPoints = 0,
    this.statBias,
    this.inPenaltyZone = false,
    this.penaltyExpiresAt,
    this.penaltyModeEnabled = true,
    this.notificationsEnabled = true,
    this.baselineStats,
    this.anchorQuestId,
    this.anchorDate,
    this.activeGateEvent,
    this.unlockedShadows = const [],
    this.equippedShadows = const [],
    this.evolvedClass,
    this.prestigeRank = 0,
    this.lastSleepHours,
    this.divisionTier = 'Bronze',
    this.currentGoal,
    this.goalDomain,
    this.dailyCapacityMinutes = 90,
    this.primaryDistractor,
    this.lastIfThenPlan,
    this.lastBlockerTag,
    this.lastCoachSummary,
    this.preferredPeakHour,
    this.activeFocusEscrow,
    this.nextFocusStep,
    this.preBreakStreak = 0,
    this.ultimatumState,
    this.comebackGate,
    this.pendingExtraction,
    this.extractedShadows = const [],
    this.jobChangeState,
    this.doubleDungeonState,
    this.reawakeningState,
    this.monarchDomainState,
    this.guildId,
  });

  static Map<String, int>? _parseBaselineStats(dynamic raw) {
    if (raw is! Map) return null;
    final out = <String, int>{};
    for (final entry in raw.entries) {
      final v = entry.value;
      if (v is num) {
        out[entry.key.toString()] = v.toInt();
      }
    }
    return out.isEmpty ? null : out;
  }

  static List<String> _parseStringList(dynamic raw) {
    if (raw is! List) return const [];
    return raw.map((e) => e.toString()).toList();
  }

  factory UserModel.fromJson(Map<String, dynamic> json) {
    final rawXp = (json['xp'] as num?)?.toInt() ?? 0;
    final serverXpIntoLevel =
        (json['xpIntoLevel'] as num?)?.toInt() ?? (rawXp % 100);
    final serverXpForNextLevel =
        (json['xpForNextLevel'] as num?)?.toInt() ?? 100;
    final serverXpProgress = (json['xpProgress'] as num?)?.toDouble() ??
        (serverXpIntoLevel / serverXpForNextLevel);

    return UserModel(
      id: json['id']?.toString() ?? '',
      name: json['name']?.toString() ?? 'Hunter',
      email: json['email']?.toString() ?? '',
      phone: json['phone']?.toString(),
      avatarUrl: json['avatarUrl']?.toString(),
      level: (json['level'] as num?)?.toInt() ?? 1,
      xp: rawXp,
      xpIntoLevel: serverXpIntoLevel,
      xpForNextLevel: serverXpForNextLevel,
      xpProgress: serverXpProgress.clamp(0.0, 1.0),
      tier: json['tier']?.toString() ?? 'D',
      streak: (json['streak'] as num?)?.toInt() ?? 0,
      coins: (json['coins'] as num?)?.toInt() ?? 0,
      hunterClass: json['hunterClass']?.toString() ?? 'assassin',
      streakShields: (json['streakShields'] as num?)?.toInt() ?? 1,
      activeRecoveryDay: json['activeRecoveryDay'] == true,
      onboardingCompleted: json['onboardingCompleted'] != false,
      strength: (json['strength'] as num?)?.toInt() ?? 10,
      agility: (json['agility'] as num?)?.toInt() ?? 10,
      stamina: (json['stamina'] as num?)?.toInt() ?? 10,
      vitality: (json['vitality'] as num?)?.toInt() ?? 10,
      intelligence: (json['intelligence'] as num?)?.toInt() ?? 10,
      willpower: (json['willpower'] as num?)?.toInt() ?? 10,
      charisma: (json['charisma'] as num?)?.toInt() ?? 10,
      activeTitle: json['activeTitle']?.toString(),
      activeBadgeId: json['activeBadgeId']?.toString(),
      theme: json['theme']?.toString(),
      isPremium: json['isPremium'] == true,
      unspentStatPoints: (json['unspentStatPoints'] as num?)?.toInt() ?? 0,
      statBias: json['statBias']?.toString(),
      inPenaltyZone: json['inPenaltyZone'] == true,
      penaltyExpiresAt: json['penaltyExpiresAt'] != null
          ? DateTime.tryParse(json['penaltyExpiresAt'].toString())
          : null,
      penaltyModeEnabled: json['penaltyModeEnabled'] != false,
      notificationsEnabled: json['notificationsEnabled'] != false,
      baselineStats: _parseBaselineStats(json['baselineStats']),
      anchorQuestId: json['anchorQuestId']?.toString(),
      anchorDate: json['anchorDate']?.toString(),
      activeGateEvent: json['activeGateEvent'] is Map<String, dynamic>
          ? GateEventModel.fromJson(
              json['activeGateEvent'] as Map<String, dynamic>)
          : null,
      unlockedShadows: _parseStringList(json['unlockedShadows']),
      equippedShadows: _parseStringList(json['equippedShadows']),
      evolvedClass: json['evolvedClass']?.toString(),
      prestigeRank: (json['prestigeRank'] as num?)?.toInt() ?? 0,
      lastSleepHours: (json['lastSleepHours'] as num?)?.toDouble(),
      divisionTier: json['divisionTier']?.toString() ?? 'Bronze',
      currentGoal: json['currentGoal']?.toString(),
      goalDomain: json['goalDomain']?.toString(),
      dailyCapacityMinutes: (json['dailyCapacityMinutes'] as num?)?.toInt() ?? 90,
      primaryDistractor: json['primaryDistractor']?.toString(),
      lastIfThenPlan: json['lastIfThenPlan']?.toString(),
      lastBlockerTag: json['lastBlockerTag']?.toString(),
      lastCoachSummary: json['lastCoachSummary']?.toString(),
      preferredPeakHour: (json['preferredPeakHour'] as num?)?.toInt(),
      activeFocusEscrow: json['activeFocusEscrow'] is Map<String, dynamic>
          ? json['activeFocusEscrow'] as Map<String, dynamic>
          : null,
      nextFocusStep: json['nextFocusStep']?.toString(),
      preBreakStreak: (json['preBreakStreak'] as num?)?.toInt() ?? 0,
      ultimatumState: json['ultimatumState'] is Map<String, dynamic>
          ? json['ultimatumState'] as Map<String, dynamic>
          : null,
      comebackGate: json['comebackGate'] is Map<String, dynamic>
          ? json['comebackGate'] as Map<String, dynamic>
          : null,
      pendingExtraction: json['pendingExtraction'] is Map<String, dynamic>
          ? json['pendingExtraction'] as Map<String, dynamic>
          : null,
      extractedShadows: json['extractedShadows'] is List
          ? (json['extractedShadows'] as List)
              .whereType<Map>()
              .map((m) => Map<String, dynamic>.from(m))
              .toList()
          : const [],
      jobChangeState: json['jobChangeState'] is Map<String, dynamic>
          ? json['jobChangeState'] as Map<String, dynamic>
          : null,
      doubleDungeonState: json['doubleDungeonState'] is Map<String, dynamic>
          ? json['doubleDungeonState'] as Map<String, dynamic>
          : null,
      reawakeningState: json['reawakeningState'] is Map<String, dynamic>
          ? json['reawakeningState'] as Map<String, dynamic>
          : null,
      monarchDomainState: json['monarchDomainState'] is Map<String, dynamic>
          ? json['monarchDomainState'] as Map<String, dynamic>
          : null,
      guildId: json['guildId']?.toString(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'email': email,
      'phone': phone,
      'avatarUrl': avatarUrl,
      'level': level,
      'xp': xp,
      'xpIntoLevel': xpIntoLevel,
      'xpForNextLevel': xpForNextLevel,
      'xpProgress': xpProgress,
      'tier': tier,
      'streak': streak,
      'coins': coins,
      'hunterClass': hunterClass,
      'streakShields': streakShields,
      'activeRecoveryDay': activeRecoveryDay,
      'onboardingCompleted': onboardingCompleted,
      'strength': strength,
      'agility': agility,
      'stamina': stamina,
      'vitality': vitality,
      'intelligence': intelligence,
      'willpower': willpower,
      'charisma': charisma,
      'activeTitle': activeTitle,
      'activeBadgeId': activeBadgeId,
      'theme': theme,
      'isPremium': isPremium,
      'unspentStatPoints': unspentStatPoints,
      'statBias': statBias,
      'inPenaltyZone': inPenaltyZone,
      'penaltyExpiresAt': penaltyExpiresAt?.toIso8601String(),
      'penaltyModeEnabled': penaltyModeEnabled,
      'notificationsEnabled': notificationsEnabled,
      'baselineStats': baselineStats,
      'anchorQuestId': anchorQuestId,
      'anchorDate': anchorDate,
      'activeGateEvent': activeGateEvent?.toJson(),
      'unlockedShadows': unlockedShadows,
      'equippedShadows': equippedShadows,
      'evolvedClass': evolvedClass,
      'prestigeRank': prestigeRank,
      'lastSleepHours': lastSleepHours,
      'divisionTier': divisionTier,
      'currentGoal': currentGoal,
      'goalDomain': goalDomain,
      'dailyCapacityMinutes': dailyCapacityMinutes,
      'primaryDistractor': primaryDistractor,
      'lastIfThenPlan': lastIfThenPlan,
      'lastBlockerTag': lastBlockerTag,
      'lastCoachSummary': lastCoachSummary,
      'preferredPeakHour': preferredPeakHour,
      'activeFocusEscrow': activeFocusEscrow,
      'nextFocusStep': nextFocusStep,
      'preBreakStreak': preBreakStreak,
      'ultimatumState': ultimatumState,
      'comebackGate': comebackGate,
      'pendingExtraction': pendingExtraction,
      'extractedShadows': extractedShadows,
      'jobChangeState': jobChangeState,
      'doubleDungeonState': doubleDungeonState,
      'reawakeningState': reawakeningState,
      'monarchDomainState': monarchDomainState,
      'guildId': guildId,
    };
  }

  UserModel copyWith({
    String? id,
    String? name,
    String? email,
    String? phone,
    String? avatarUrl,
    int? level,
    int? xp,
    int? xpIntoLevel,
    int? xpForNextLevel,
    double? xpProgress,
    String? tier,
    int? streak,
    int? coins,
    String? hunterClass,
    int? streakShields,
    bool? activeRecoveryDay,
    bool? onboardingCompleted,
    int? strength,
    int? agility,
    int? stamina,
    int? vitality,
    int? intelligence,
    int? willpower,
    int? charisma,
    String? activeTitle,
    String? activeBadgeId,
    String? theme,
    bool? isPremium,
    int? unspentStatPoints,
    String? statBias,
    bool? inPenaltyZone,
    DateTime? penaltyExpiresAt,
    bool? penaltyModeEnabled,
    bool? notificationsEnabled,
    Map<String, int>? baselineStats,
    String? anchorQuestId,
    String? anchorDate,
    GateEventModel? activeGateEvent,
    List<String>? unlockedShadows,
    List<String>? equippedShadows,
    String? evolvedClass,
    int? prestigeRank,
    double? lastSleepHours,
    String? divisionTier,
    String? currentGoal,
    String? goalDomain,
    int? dailyCapacityMinutes,
    String? primaryDistractor,
    String? lastIfThenPlan,
    String? lastBlockerTag,
    String? lastCoachSummary,
    int? preferredPeakHour,
    Map<String, dynamic>? activeFocusEscrow,
    String? nextFocusStep,
    int? preBreakStreak,
    Map<String, dynamic>? ultimatumState,
    Map<String, dynamic>? comebackGate,
    Map<String, dynamic>? pendingExtraction,
    List<Map<String, dynamic>>? extractedShadows,
    Map<String, dynamic>? jobChangeState,
    Map<String, dynamic>? doubleDungeonState,
    Map<String, dynamic>? reawakeningState,
    Map<String, dynamic>? monarchDomainState,
    String? guildId,
  }) {
    return UserModel(
      id: id ?? this.id,
      name: name ?? this.name,
      email: email ?? this.email,
      phone: phone ?? this.phone,
      avatarUrl: avatarUrl ?? this.avatarUrl,
      level: level ?? this.level,
      xp: xp ?? this.xp,
      xpIntoLevel: xpIntoLevel ?? this.xpIntoLevel,
      xpForNextLevel: xpForNextLevel ?? this.xpForNextLevel,
      xpProgress: xpProgress ?? this.xpProgress,
      tier: tier ?? this.tier,
      streak: streak ?? this.streak,
      coins: coins ?? this.coins,
      hunterClass: hunterClass ?? this.hunterClass,
      streakShields: streakShields ?? this.streakShields,
      activeRecoveryDay: activeRecoveryDay ?? this.activeRecoveryDay,
      onboardingCompleted: onboardingCompleted ?? this.onboardingCompleted,
      strength: strength ?? this.strength,
      agility: agility ?? this.agility,
      stamina: stamina ?? this.stamina,
      vitality: vitality ?? this.vitality,
      intelligence: intelligence ?? this.intelligence,
      willpower: willpower ?? this.willpower,
      charisma: charisma ?? this.charisma,
      activeTitle: activeTitle ?? this.activeTitle,
      activeBadgeId: activeBadgeId ?? this.activeBadgeId,
      theme: theme ?? this.theme,
      isPremium: isPremium ?? this.isPremium,
      unspentStatPoints: unspentStatPoints ?? this.unspentStatPoints,
      statBias: statBias ?? this.statBias,
      inPenaltyZone: inPenaltyZone ?? this.inPenaltyZone,
      penaltyExpiresAt: penaltyExpiresAt ?? this.penaltyExpiresAt,
      penaltyModeEnabled: penaltyModeEnabled ?? this.penaltyModeEnabled,
      notificationsEnabled: notificationsEnabled ?? this.notificationsEnabled,
      baselineStats: baselineStats ?? this.baselineStats,
      anchorQuestId: anchorQuestId ?? this.anchorQuestId,
      anchorDate: anchorDate ?? this.anchorDate,
      activeGateEvent: activeGateEvent ?? this.activeGateEvent,
      unlockedShadows: unlockedShadows ?? this.unlockedShadows,
      equippedShadows: equippedShadows ?? this.equippedShadows,
      evolvedClass: evolvedClass ?? this.evolvedClass,
      prestigeRank: prestigeRank ?? this.prestigeRank,
      lastSleepHours: lastSleepHours ?? this.lastSleepHours,
      divisionTier: divisionTier ?? this.divisionTier,
      currentGoal: currentGoal ?? this.currentGoal,
      goalDomain: goalDomain ?? this.goalDomain,
      dailyCapacityMinutes: dailyCapacityMinutes ?? this.dailyCapacityMinutes,
      primaryDistractor: primaryDistractor ?? this.primaryDistractor,
      lastIfThenPlan: lastIfThenPlan ?? this.lastIfThenPlan,
      lastBlockerTag: lastBlockerTag ?? this.lastBlockerTag,
      lastCoachSummary: lastCoachSummary ?? this.lastCoachSummary,
      preferredPeakHour: preferredPeakHour ?? this.preferredPeakHour,
      activeFocusEscrow: activeFocusEscrow ?? this.activeFocusEscrow,
      nextFocusStep: nextFocusStep ?? this.nextFocusStep,
      preBreakStreak: preBreakStreak ?? this.preBreakStreak,
      ultimatumState: ultimatumState ?? this.ultimatumState,
      comebackGate: comebackGate ?? this.comebackGate,
      pendingExtraction: pendingExtraction ?? this.pendingExtraction,
      extractedShadows: extractedShadows ?? this.extractedShadows,
      jobChangeState: jobChangeState ?? this.jobChangeState,
      doubleDungeonState: doubleDungeonState ?? this.doubleDungeonState,
      reawakeningState: reawakeningState ?? this.reawakeningState,
      monarchDomainState: monarchDomainState ?? this.monarchDomainState,
      guildId: guildId ?? this.guildId,
    );
  }
}
