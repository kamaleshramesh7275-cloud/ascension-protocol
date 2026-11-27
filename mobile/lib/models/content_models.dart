// Model for Feature #8 Knowledge Library & Content Reader.

class ContentItemModel {
  final String id;
  final String title;
  final String description;
  final String type; // article, video, guide
  final String category; // fitness, discipline, nutrition, mindset
  final String? thumbnailUrl;
  final String? videoUrl;
  final String content; // Markdown / full article text
  final bool isPremium;
  final int views;
  final int likes;
  final String? prescriptionReason;
  final String? ctaLabel;
  final String? ctaActionType;
  final int? ctaDurationMinutes;

  const ContentItemModel({
    required this.id,
    required this.title,
    required this.description,
    required this.type,
    required this.category,
    this.thumbnailUrl,
    this.videoUrl,
    required this.content,
    this.isPremium = false,
    this.views = 0,
    this.likes = 0,
    this.prescriptionReason,
    this.ctaLabel,
    this.ctaActionType,
    this.ctaDurationMinutes,
  });

  /// Approximate reading time at 200 words per minute.
  int get estimatedReadMinutes {
    final words = content.trim().split(RegExp(r'\s+')).length;
    return (words / 200).ceil().clamp(1, 45);
  }

  factory ContentItemModel.fromJson(Map<String, dynamic> json) {
    return ContentItemModel(
      id: json['id']?.toString() ?? '',
      title: json['title']?.toString() ?? 'Hunter Codex',
      description: json['description']?.toString() ?? '',
      type: json['type']?.toString().toLowerCase() ?? 'article',
      category: json['category']?.toString().toLowerCase() ?? 'mindset',
      thumbnailUrl: json['thumbnailUrl']?.toString(),
      videoUrl: json['videoUrl']?.toString(),
      content: json['content']?.toString() ?? '',
      isPremium: json['isPremium'] == true,
      views: (json['views'] as num?)?.toInt() ?? 0,
      likes: (json['likes'] as num?)?.toInt() ?? 0,
      prescriptionReason: json['prescriptionReason']?.toString(),
      ctaLabel: json['ctaAction'] is Map ? json['ctaAction']['label']?.toString() : null,
      ctaActionType: json['ctaAction'] is Map ? json['ctaAction']['actionType']?.toString() : null,
      ctaDurationMinutes: json['ctaAction'] is Map
          ? (json['ctaAction']['durationMinutes'] as num?)?.toInt()
          : null,
    );
  }

  ContentItemModel copyWith({int? views, int? likes}) {
    return ContentItemModel(
      id: id,
      title: title,
      description: description,
      type: type,
      category: category,
      thumbnailUrl: thumbnailUrl,
      videoUrl: videoUrl,
      content: content,
      isPremium: isPremium,
      views: views ?? this.views,
      likes: likes ?? this.likes,
      prescriptionReason: prescriptionReason,
      ctaLabel: ctaLabel,
      ctaActionType: ctaActionType,
      ctaDurationMinutes: ctaDurationMinutes,
    );
  }
}
