class ApiEndpoints {
  // Production Domain as requested
  static const String defaultBaseUrl = 'https://ascensions.in';

  // Auth & Profile
  static const String authGoogle = '/api/auth/login-google';
  static const String loginPhone = '/api/auth/login-phone';
  static const String registerLocal = '/api/auth/register-local';
  static const String completeProfile = '/api/user/complete-profile';
  static const String authMe = '/api/user';
  static const String deleteAccount = '/api/user';
  static const String userStats = '/api/user/stats';
  static const String onboarding = '/api/onboarding';

  // Quests & Progression
  static const String quests = '/api/quests';
  static String completeQuest(String questId) => '/api/quests/$questId/complete';
  static const String dailyTemplates = '/api/quests/templates';

  // Focus & Air-Gap
  static const String focusStart = '/api/focus/start';
  static const String focusComplete = '/api/focus/complete';
  static const String focusStats = '/api/focus/stats';
  static const String focusHistory = '/api/focus/history';

  // Evening Debrief & Anti-Burnout
  static const String debrief = '/api/debrief';
  static const String debriefToday = '/api/debrief/today';
  static const String recoveryDay = '/api/user/recovery-day';
  static const String claimDailyBonus = '/api/user/claim-daily-bonus';

  // Leaderboard & Guilds
  static const String leaderboard = '/api/leaderboard';
  static const String guilds = '/api/guilds';
}
