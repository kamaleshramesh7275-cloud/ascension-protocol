class UserModel {
  final String id;
  final String name;
  final String email;
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

  const UserModel({
    required this.id,
    required this.name,
    required this.email,
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
  });

  factory UserModel.fromJson(Map<String, dynamic> json) {
    final rawXp = (json['xp'] as num?)?.toInt() ?? 0;
    final serverXpIntoLevel = (json['xpIntoLevel'] as num?)?.toInt() ?? (rawXp % 100);
    final serverXpForNextLevel = (json['xpForNextLevel'] as num?)?.toInt() ?? 100;
    final serverXpProgress = (json['xpProgress'] as num?)?.toDouble() ?? (serverXpIntoLevel / serverXpForNextLevel);

    return UserModel(
      id: json['id']?.toString() ?? '',
      name: json['name']?.toString() ?? 'Hunter',
      email: json['email']?.toString() ?? '',
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
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'email': email,
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
    };
  }

  UserModel copyWith({
    String? id,
    String? name,
    String? email,
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
  }) {
    return UserModel(
      id: id ?? this.id,
      name: name ?? this.name,
      email: email ?? this.email,
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
    );
  }
}
