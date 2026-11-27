// Models for Feature #6 Accountability Arena:
// Weekly Commitment Contracts, Persistent 1v1 Buddy Covenants, Public Witness Wall, Hall & Wall.

class CommitmentContractModel {
  final String id;
  final String userId;
  final String weekStartDate;
  final String weekEndDate;
  final int targetMissionsCount;
  final int targetFocusMinutes;
  final int stakeAmountCents;
  final String? antiCharityRecipient;
  final String status; // active, fulfilled, breached, forfeited
  final int verifiedMissionsCount;
  final int verifiedFocusMinutes;
  final String? outcomeVerdict;

  const CommitmentContractModel({
    required this.id,
    required this.userId,
    required this.weekStartDate,
    required this.weekEndDate,
    required this.targetMissionsCount,
    required this.targetFocusMinutes,
    this.stakeAmountCents = 0,
    this.antiCharityRecipient,
    required this.status,
    this.verifiedMissionsCount = 0,
    this.verifiedFocusMinutes = 0,
    this.outcomeVerdict,
  });

  factory CommitmentContractModel.fromJson(Map<String, dynamic> json) {
    return CommitmentContractModel(
      id: json['id']?.toString() ?? '',
      userId: json['userId']?.toString() ?? '',
      weekStartDate: json['weekStartDate']?.toString() ?? '',
      weekEndDate: json['weekEndDate']?.toString() ?? '',
      targetMissionsCount: (json['targetMissionsCount'] as num?)?.toInt() ?? 5,
      targetFocusMinutes: (json['targetFocusMinutes'] as num?)?.toInt() ?? 300,
      stakeAmountCents: (json['stakeAmountCents'] as num?)?.toInt() ?? 0,
      antiCharityRecipient: json['antiCharityRecipient']?.toString(),
      status: json['status']?.toString() ?? 'active',
      verifiedMissionsCount: (json['verifiedMissionsCount'] as num?)?.toInt() ?? 0,
      verifiedFocusMinutes: (json['verifiedFocusMinutes'] as num?)?.toInt() ?? 0,
      outcomeVerdict: json['outcomeVerdict']?.toString(),
    );
  }
}

class PeerCovenantModel {
  final String id;
  final String covenantCode;
  final String initiatorId;
  final String initiatorName;
  final int initiatorStreak;
  final String? counterpartyId;
  final String? counterpartyName;
  final int counterpartyStreak;
  final int termsDays;
  final int stakeCoins;
  final String protocolObjective;
  final String status; // pending, active, completed, breached
  final String? winnerId;
  final DateTime? acceptedAt;
  final DateTime? expiresAt;

  const PeerCovenantModel({
    required this.id,
    required this.covenantCode,
    required this.initiatorId,
    required this.initiatorName,
    this.initiatorStreak = 0,
    this.counterpartyId,
    this.counterpartyName,
    this.counterpartyStreak = 0,
    required this.termsDays,
    required this.stakeCoins,
    required this.protocolObjective,
    required this.status,
    this.winnerId,
    this.acceptedAt,
    this.expiresAt,
  });

  factory PeerCovenantModel.fromJson(Map<String, dynamic> json) {
    return PeerCovenantModel(
      id: json['id']?.toString() ?? '',
      covenantCode: json['covenantCode']?.toString() ?? '',
      initiatorId: json['initiatorId']?.toString() ?? '',
      initiatorName: json['initiatorName']?.toString() ?? 'Hunter',
      initiatorStreak: (json['initiatorStreak'] as num?)?.toInt() ?? 0,
      counterpartyId: json['counterpartyId']?.toString(),
      counterpartyName: json['counterpartyName']?.toString(),
      counterpartyStreak: (json['counterpartyStreak'] as num?)?.toInt() ?? 0,
      termsDays: (json['termsDays'] as num?)?.toInt() ?? 7,
      stakeCoins: (json['stakeCoins'] as num?)?.toInt() ?? 250,
      protocolObjective: json['protocolObjective']?.toString() ?? 'Daily Protocol Execution',
      status: json['status']?.toString() ?? 'pending',
      winnerId: json['winnerId']?.toString(),
      acceptedAt: json['acceptedAt'] != null
          ? DateTime.tryParse(json['acceptedAt'].toString())
          : null,
      expiresAt: json['expiresAt'] != null
          ? DateTime.tryParse(json['expiresAt'].toString())
          : null,
    );
  }
}

class PublicCommitmentModel {
  final String id;
  final String userId;
  final String? userName;
  final String declaration;
  final DateTime? targetDeadline;
  final int currentDisciplineScore;
  final int velocityPercent;
  final int witnessesCount;
  final DateTime? createdAt;

  const PublicCommitmentModel({
    required this.id,
    required this.userId,
    this.userName,
    required this.declaration,
    this.targetDeadline,
    required this.currentDisciplineScore,
    required this.velocityPercent,
    required this.witnessesCount,
    this.createdAt,
  });

  factory PublicCommitmentModel.fromJson(Map<String, dynamic> json) {
    return PublicCommitmentModel(
      id: json['id']?.toString() ?? '',
      userId: json['userId']?.toString() ?? '',
      userName: json['userName']?.toString(),
      declaration: json['declaration']?.toString() ?? '',
      targetDeadline: json['targetDeadline'] != null
          ? DateTime.tryParse(json['targetDeadline'].toString())
          : null,
      currentDisciplineScore:
          (json['currentDisciplineScore'] as num?)?.toInt() ?? 700,
      velocityPercent: (json['velocityPercent'] as num?)?.toInt() ?? 70,
      witnessesCount: (json['witnessesCount'] as num?)?.toInt() ?? 1,
      createdAt: json['createdAt'] != null
          ? DateTime.tryParse(json['createdAt'].toString())
          : null,
    );
  }
}

class HallOfAscensionEntry {
  final String id;
  final String userName;
  final String goalTitle;
  final int disciplineScore;
  final int verifiedDeepWorkMinutes;
  final int consecutiveDays;
  final DateTime? inductedAt;

  const HallOfAscensionEntry({
    required this.id,
    required this.userName,
    required this.goalTitle,
    required this.disciplineScore,
    required this.verifiedDeepWorkMinutes,
    required this.consecutiveDays,
    this.inductedAt,
  });

  factory HallOfAscensionEntry.fromJson(Map<String, dynamic> json) {
    return HallOfAscensionEntry(
      id: json['id']?.toString() ?? '',
      userName: json['userName']?.toString() ?? 'Ascendant',
      goalTitle: json['goalTitle']?.toString() ?? '',
      disciplineScore: (json['disciplineScore'] as num?)?.toInt() ?? 800,
      verifiedDeepWorkMinutes:
          (json['verifiedDeepWorkMinutes'] as num?)?.toInt() ?? 0,
      consecutiveDays: (json['consecutiveDays'] as num?)?.toInt() ?? 0,
      inductedAt: json['inductedAt'] != null
          ? DateTime.tryParse(json['inductedAt'].toString())
          : null,
    );
  }
}

class WallOfConsequenceEntry {
  final String id;
  final String userName;
  final String contractTarget;
  final String stakeForfeited;
  final String dishonorReason;
  final String breachType;
  final DateTime? failedDate;

  const WallOfConsequenceEntry({
    required this.id,
    required this.userName,
    required this.contractTarget,
    required this.stakeForfeited,
    required this.dishonorReason,
    required this.breachType,
    this.failedDate,
  });

  factory WallOfConsequenceEntry.fromJson(Map<String, dynamic> json) {
    return WallOfConsequenceEntry(
      id: json['id']?.toString() ?? '',
      userName: json['userName']?.toString() ?? 'Operative',
      contractTarget: json['contractTarget']?.toString() ?? '',
      stakeForfeited: json['stakeForfeited']?.toString() ?? '0',
      dishonorReason: json['dishonorReason']?.toString() ?? '',
      breachType: json['breachType']?.toString() ?? 'contract_default',
      failedDate: json['failedDate'] != null
          ? DateTime.tryParse(json['failedDate'].toString())
          : null,
    );
  }
}
