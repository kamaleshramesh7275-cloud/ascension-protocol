class ApiEndpoints {
  // Production Domain as requested
  static const String defaultBaseUrl = 'https://ascensions.in';

  // Auth & Profile
  static const String authGoogle = '/api/auth/login-google';
  static const String loginGuest = '/api/auth/login-guest';
  static const String loginPhone = '/api/auth/login-phone';
  static const String registerLocal = '/api/auth/register-local';
  static const String refreshSession = '/api/auth/refresh-session';
  static const String completeProfile = '/api/user/complete-profile';
  static const String authMe = '/api/user';
  static const String updateUser = '/api/user';
  static const String deleteAccount = '/api/user';
  static const String userStats = '/api/user/stats';
  static const String onboarding = '/api/onboarding';
  static const String weeklyRecap = '/api/user/weekly-recap';
  static const String bottleneck = '/api/user/bottleneck';
  static const String bottleneckInject = '/api/user/bottleneck/inject';
  static const String userUltimatum = '/api/user/ultimatum';
  static const String userUltimatumAlerted = '/api/user/ultimatum/alerted';
  static const String comebackComplete = '/api/comeback/complete';

  // Quests, Progression & Solo Leveling System Mechanics
  static const String quests = '/api/quests';
  static String completeQuest(String questId) => '/api/quests/$questId/complete';
  static String unstickQuest(String questId) => '/api/quests/$questId/unstick';
  static const String dailyTemplates = '/api/quests/templates';
  static const String rankTrials = '/api/rank-trials';
  static const String allocateStats = '/api/user/allocate-stats';
  static const String anchorQuest = '/api/user/anchor-quest';
  static const String penaltyClear = '/api/user/penalty/clear';
  static const String gatesCheckSpawn = '/api/gates/check-spawn';
  static const String gatesClaim = '/api/gates/claim';
  static const String shadows = '/api/shadows';
  static const String shadowsEquip = '/api/shadows/equip';
  static const String shadowsExtractAttempt = '/api/shadows/extract/attempt';
  static const String bossClaimLoot = '/api/boss/claim-loot';
  static const String jobChangeStart = '/api/job-change/start';
  static const String jobChangeClaim = '/api/job-change/claim';
  static String guildJoin(String id) => '/api/guilds/$id/join';
  static const String guildLeave = '/api/guilds/leave';
  static const String guildRaidActive = '/api/guilds/raid/active';
  static const String guildRaidClaim = '/api/guilds/raid/claim';
  static const String doubleDungeonOptions = '/api/double-dungeon/options';
  static const String doubleDungeonEnter = '/api/double-dungeon/enter';
  static const String doubleDungeonSettle = '/api/double-dungeon/settle';
  static const String reawakeningStart = '/api/reawakening/start';
  static const String reawakeningSubmit = '/api/reawakening/submit';
  static const String domainStart = '/api/domain/start';
  static const String domainComplete = '/api/domain/complete';
  static const String domainBreach = '/api/domain/breach';
  static const String fatigue = '/api/user/fatigue';
  static const String superCompensation = '/api/user/super-compensation';
  static const String evolveClass = '/api/user/evolve-class';

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

  // Supply Depot Shop & Inventory (#1)
  static const String shop = '/api/shop';
  static const String shopInventory = '/api/shop/inventory';
  static const String shopBuy = '/api/shop/buy';
  static const String shopEquip = '/api/shop/equip';
  static const String shopUse = '/api/shop/use';

  // Workout Logger & PR Tracker (#3)
  static const String workoutExercises = '/api/workouts/exercises';
  static const String workoutTargets = '/api/workouts/targets';
  static const String workoutOfficialTemplates = '/api/workouts/official-templates';
  static const String workoutSessions = '/api/workouts/sessions';
  static String workoutSessionDetail(String id) => '/api/workouts/sessions/$id';
  static String workoutSessionFinish(String id) => '/api/workouts/sessions/$id/finish';
  static const String workoutPrs = '/api/workouts/prs';
  static const String workoutTemplates = '/api/workouts/templates';
  static const String workoutGeneratePlan = '/api/workouts/generate-plan';
  static String workoutExerciseLastSets(String exerciseId) =>
      '/api/workouts/exercises/$exerciseId/last-sets';

  // Accountability Arena (#6) & Buddy Covenant Duels (SR-4)
  static const String commitmentContract = '/api/commitment-contract';
  static const String commitmentContractEvaluate = '/api/commitment-contract/evaluate';
  static const String covenantsCreate = '/api/covenants/create';
  static String covenantByCode(String code) => '/api/covenants/$code';
  static String covenantAccept(String code) => '/api/covenants/$code/accept';
  static const String covenantsActive = '/api/covenants/user/active';
  static const String publicCommitments = '/api/public-commitments';
  static String witnessCommitment(String id) => '/api/public-commitments/$id/witness';
  static const String hallOfAscension = '/api/hall-of-ascension';
  static const String wallOfConsequence = '/api/wall-of-consequence';

  // 30-Day Execution Roadmap (#7)
  static const String roadmap = '/api/roadmap';
  static const String roadmapRecalibrate = '/api/roadmap/recalibrate';
  static String roadmapWeek(String weekId) => '/api/roadmap/weeks/$weekId';
  static String roadmapToggleTask(String taskId) => '/api/roadmap/tasks/$taskId/toggle';
  static const String roadmapTrajectory = '/api/protocol/roadmap/trajectory';


  // Guilds & Rival Divisions
  static const String guilds = '/api/guilds';
  static const String divisionsCurrent = '/api/divisions/current';
  static const String divisionsAcknowledge = '/api/divisions/acknowledge';

  // Push Notifications (RET-1)
  static const String pushRegister = '/api/push/register';
  static const String pushUnregister = '/api/push/unregister';

  // User Feedback, Bug Reports & Feature Requests
  static const String feedback = '/api/feedback';
  static const String feedbackMine = '/api/feedback/mine';
  static const String feedbackPopular = '/api/feedback/popular';
  static String feedbackUpvote(String id) => '/api/feedback/$id/upvote';
}
