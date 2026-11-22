class UserModel {
  final String id;
  final String name;
  final String email;
  final String? avatarUrl;
  final int level;
  final int xp;
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
    return UserModel(
      id: json['id']?.toString() ?? '',
      name: json['name']?.toString() ?? 'Hunter',
      email: json['email']?.toString() ?? '',
      avatarUrl: json['avatarUrl']?.toString(),
      level: (json['level'] as num?)?.toInt() ?? 1,
      xp: (json['xp'] as num?)?.toInt() ?? 0,
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

  // Next level threshold (gamified XP formula)
  int get xpForNextLevel => level * 100;
  double get xpProgress => (xp % 100) / 100.0;
}
