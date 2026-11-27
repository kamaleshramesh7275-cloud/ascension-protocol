import 'quest_model.dart';

/// Represents a 48H Rank Promotion Examination Trial required to advance tiers (D->C->B->A->S).
class RankTrialModel {
  final String id;
  final String userId;
  final String tier;
  final String questId;
  final bool completed;
  final DateTime? completedAt;
  final DateTime? createdAt;
  final QuestModel? quest;

  const RankTrialModel({
    required this.id,
    required this.userId,
    required this.tier,
    required this.questId,
    required this.completed,
    this.completedAt,
    this.createdAt,
    this.quest,
  });

  factory RankTrialModel.fromJson(Map<String, dynamic> json) {
    return RankTrialModel(
      id: json['id']?.toString() ?? '',
      userId: json['userId']?.toString() ?? '',
      tier: json['tier']?.toString() ?? 'C',
      questId: json['questId']?.toString() ?? '',
      completed: json['completed'] == true,
      completedAt: json['completedAt'] != null
          ? DateTime.tryParse(json['completedAt'].toString())
          : null,
      createdAt: json['createdAt'] != null
          ? DateTime.tryParse(json['createdAt'].toString())
          : null,
      quest: json['quest'] is Map<String, dynamic>
          ? QuestModel.fromJson(json['quest'] as Map<String, dynamic>)
          : null,
    );
  }
}
