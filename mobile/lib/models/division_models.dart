// Models for Retention Feature #5 Weekly 10-Hunter Rival Divisions.

class DivisionMemberModel {
  final String id;
  final String divisionId;
  final String userId;
  final String userName;
  final String userTier;
  final int weeklyXp;
  final int rank;
  final String zone; // promotion, safe, demotion

  const DivisionMemberModel({
    required this.id,
    required this.divisionId,
    required this.userId,
    required this.userName,
    required this.userTier,
    required this.weeklyXp,
    required this.rank,
    required this.zone,
  });

  factory DivisionMemberModel.fromJson(Map<String, dynamic> json) {
    return DivisionMemberModel(
      id: json['id']?.toString() ?? '',
      divisionId: json['divisionId']?.toString() ?? '',
      userId: json['userId']?.toString() ?? '',
      userName: json['userName']?.toString() ?? 'Hunter',
      userTier: json['userTier']?.toString() ?? 'D',
      weeklyXp: (json['weeklyXp'] as num?)?.toInt() ?? 0,
      rank: (json['rank'] as num?)?.toInt() ?? 1,
      zone: json['zone']?.toString() ?? 'safe',
    );
  }
}

class DivisionOutcomeModel {
  final String id;
  final String weekKey;
  final String divisionTier;
  final int finalRank;
  final String outcome; // promoted, stayed, demoted
  final int rewardCoins;

  const DivisionOutcomeModel({
    required this.id,
    required this.weekKey,
    required this.divisionTier,
    required this.finalRank,
    required this.outcome,
    required this.rewardCoins,
  });

  factory DivisionOutcomeModel.fromJson(Map<String, dynamic> json) {
    return DivisionOutcomeModel(
      id: json['id']?.toString() ?? '',
      weekKey: json['weekKey']?.toString() ?? '',
      divisionTier: json['divisionTier']?.toString() ?? 'Bronze',
      finalRank: (json['finalRank'] as num?)?.toInt() ?? 1,
      outcome: json['outcome']?.toString() ?? 'stayed',
      rewardCoins: (json['rewardCoins'] as num?)?.toInt() ?? 0,
    );
  }
}

class DivisionPodModel {
  final String weekKey;
  final String divisionTier;
  final int podNumber;
  final DateTime? resetsAt;
  final int promotionCount;
  final int demotionCount;
  final String myUserId;
  final int myRank;
  final int xpToNextRank;
  final List<DivisionMemberModel> members;
  final DivisionOutcomeModel? pendingLastWeekOutcome;

  const DivisionPodModel({
    required this.weekKey,
    required this.divisionTier,
    required this.podNumber,
    this.resetsAt,
    required this.promotionCount,
    required this.demotionCount,
    required this.myUserId,
    required this.myRank,
    required this.xpToNextRank,
    required this.members,
    this.pendingLastWeekOutcome,
  });

  factory DivisionPodModel.fromJson(Map<String, dynamic> json) {
    final rawMembers = json['members'] as List? ?? const [];
    return DivisionPodModel(
      weekKey: json['weekKey']?.toString() ?? '',
      divisionTier: json['divisionTier']?.toString() ?? 'Bronze',
      podNumber: (json['podNumber'] as num?)?.toInt() ?? 1,
      resetsAt: json['resetsAt'] != null
          ? DateTime.tryParse(json['resetsAt'].toString())
          : null,
      promotionCount: (json['promotionCount'] as num?)?.toInt() ?? 0,
      demotionCount: (json['demotionCount'] as num?)?.toInt() ?? 0,
      myUserId: json['myUserId']?.toString() ?? '',
      myRank: (json['myRank'] as num?)?.toInt() ?? 1,
      xpToNextRank: (json['xpToNextRank'] as num?)?.toInt() ?? 0,
      members: rawMembers
          .map((e) => DivisionMemberModel.fromJson(e as Map<String, dynamic>))
          .toList(),
      pendingLastWeekOutcome: json['pendingLastWeekOutcome'] is Map<String, dynamic>
          ? DivisionOutcomeModel.fromJson(
              json['pendingLastWeekOutcome'] as Map<String, dynamic>)
          : null,
    );
  }
}
