/// Sunday Weekly Hunter Association Evolution Dossier (/api/user/weekly-recap).
class WeeklyRecapModel {
  final String dateRange;
  final int percentile;
  final int deepWorkMinutes;
  final int missionsCompleted;
  final int workoutsLogged;
  final int totalTonnage;
  final int totalSets;
  final int streakDays;
  final String tier;
  final int xpEarned;
  final String archetype;
  final String archetypeTag;
  final String archetypeDescription;
  final String userName;
  final String? referralCode;
  final int roadmapProgressPercent;
  final int? preferredPeakHour;
  final String? bottleneckStat;
  final String? nextWeekRecommendation;
  final String? coachSummary;
  final String? mondayAdjustment;
  final String? dayPatternInsight;
  final int? suggestedDailyMinutes;

  const WeeklyRecapModel({
    required this.dateRange,
    required this.percentile,
    required this.deepWorkMinutes,
    required this.missionsCompleted,
    required this.workoutsLogged,
    required this.totalTonnage,
    required this.totalSets,
    required this.streakDays,
    required this.tier,
    required this.xpEarned,
    required this.archetype,
    required this.archetypeTag,
    required this.archetypeDescription,
    required this.userName,
    this.referralCode,
    this.roadmapProgressPercent = 0,
    this.preferredPeakHour,
    this.bottleneckStat,
    this.nextWeekRecommendation,
    this.coachSummary,
    this.mondayAdjustment,
    this.dayPatternInsight,
    this.suggestedDailyMinutes,
  });

  factory WeeklyRecapModel.fromJson(Map<String, dynamic> json) {
    return WeeklyRecapModel(
      dateRange: json['dateRange']?.toString() ?? '',
      percentile: (json['percentile'] as num?)?.toInt() ?? 50,
      deepWorkMinutes: (json['deepWorkMinutes'] as num?)?.toInt() ?? 0,
      missionsCompleted: (json['missionsCompleted'] as num?)?.toInt() ?? 0,
      workoutsLogged: (json['workoutsLogged'] as num?)?.toInt() ?? 0,
      totalTonnage: (json['totalTonnage'] as num?)?.toInt() ?? 0,
      totalSets: (json['totalSets'] as num?)?.toInt() ?? 0,
      streakDays: (json['streakDays'] as num?)?.toInt() ?? 0,
      tier: json['tier']?.toString() ?? 'D',
      xpEarned: (json['xpEarned'] as num?)?.toInt() ?? 0,
      archetype: json['archetype']?.toString() ?? 'THE TITAN',
      archetypeTag: json['archetypeTag']?.toString() ?? 'BALANCED EXECUTION',
      archetypeDescription: json['archetypeDescription']?.toString() ?? '',
      userName: json['userName']?.toString() ?? 'Hunter',
      referralCode: json['referralCode']?.toString(),
      roadmapProgressPercent: (json['roadmapProgressPercent'] as num?)?.toInt() ?? 0,
      preferredPeakHour: (json['preferredPeakHour'] as num?)?.toInt(),
      bottleneckStat: json['bottleneckStat']?.toString(),
      nextWeekRecommendation: json['nextWeekRecommendation']?.toString(),
      coachSummary: json['coachSummary']?.toString(),
      mondayAdjustment: json['mondayAdjustment']?.toString(),
      dayPatternInsight: json['dayPatternInsight']?.toString(),
      suggestedDailyMinutes: (json['suggestedDailyMinutes'] as num?)?.toInt(),
    );
  }
}
