class ApiEndpoints {
  // Configurable base URL: can be overridden via environment or settings
  static const String defaultBaseUrl = 'https://ascension-protocol.replit.app';

  // Auth & Profile
  static const String authGoogle = '/api/auth/google';
  static const String authMe = '/api/auth/me';
  static const String userStats = '/api/user/stats';
  static const String userProfile = '/api/user/profile';

  // Quests & Progression
  static const String quests = '/api/quests';
  static String completeQuest(String id) => '/api/quests/$id/complete';
  static const String dailyTemplates = '/api/quests/templates';

  // Focus & Air-Gap
  static const String focusSessions = '/api/focus/sessions';
  static const String focusStats = '/api/focus/stats';

  // Evening Debrief & Anti-Burnout
  static const String debrief = '/api/debrief';
  static const String restDay = '/api/user/rest-day';
  static const String claimDailyBonus = '/api/user/claim-daily-bonus';

  // Leaderboard & Guilds
  static const String leaderboard = '/api/leaderboard';
  static const String guilds = '/api/guilds';
}
