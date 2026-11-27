import 'package:flutter_test/flutter_test.dart';
import 'package:ascension_mobile/core/sync/sync_queue.dart';
import 'package:ascension_mobile/core/widgets/daily_countdown_banner.dart';
import 'package:ascension_mobile/core/widgets/home_widget_bridge.dart';
import 'package:ascension_mobile/features/stats/stat_radar_painter.dart';
import 'package:ascension_mobile/features/workout/active_workout_screen.dart';
import 'package:ascension_mobile/models/accountability_models.dart';
import 'package:ascension_mobile/models/content_models.dart';
import 'package:ascension_mobile/models/division_models.dart';
import 'package:ascension_mobile/models/gate_shadow_models.dart';
import 'package:ascension_mobile/models/quest_model.dart';
import 'package:ascension_mobile/models/roadmap_models.dart';
import 'package:ascension_mobile/models/shop_models.dart';
import 'package:ascension_mobile/models/user_model.dart';
import 'package:ascension_mobile/models/weekly_recap_model.dart';
import 'package:ascension_mobile/models/workout_models.dart';

void main() {
  group('Master Plan Phase 1-7 Models & Core System Math', () {
    test('UserModel parses Phase 0 Solo Leveling & Retention fields safely', () {
      final user = UserModel.fromJson({
        'id': 'u_1',
        'name': 'Sung Jin-Woo',
        'email': 'jinwoo@ascensions.in',
        'level': 27,
        'xp': 14200,
        'tier': 'A',
        'streak': 19,
        'coins': 850,
        'hunterClass': 'assassin',
        'streakShields': 2,
        'activeRecoveryDay': false,
        'unspentStatPoints': 6,
        'statBias': 'strength',
        'inPenaltyZone': true,
        'penaltyModeEnabled': false,
        'notificationsEnabled': true,
        'baselineStats': {'strength': 12, 'agility': 14, 'stamina': 10},
        'unlockedShadows': ['igris', 'tank'],
        'equippedShadows': ['igris'],
        'evolvedClass': 'Shadow Assassin',
        'prestigeRank': 1,
        'lastSleepHours': 6.5,
      });

      expect(user.unspentStatPoints, equals(6));
      expect(user.inPenaltyZone, isTrue);
      expect(user.penaltyModeEnabled, isFalse);
      expect(user.baselineStats?['strength'], equals(12));
      expect(user.unlockedShadows, containsAll(['igris', 'tank']));
      expect(user.evolvedClass, equals('Shadow Assassin'));
      expect(user.prestigeRank, equals(1));
      expect(user.lastSleepHours, equals(6.5));
    });

    test('StatRadarPainter computes current & Day-1 baseline coordinates accurately', () {
      const user = UserModel(
        id: 'u',
        name: 'Test',
        email: 't@e.com',
        level: 10,
        xp: 500,
        tier: 'C',
        streak: 4,
        coins: 100,
        hunterClass: 'tank',
        streakShields: 1,
        activeRecoveryDay: false,
        strength: 60,
        agility: 40,
        stamina: 50,
        vitality: 30,
        intelligence: 70,
        willpower: 80,
        charisma: 20,
        baselineStats: {
          'strength': 20,
          'agility': 15,
          'stamina': 15,
          'vitality': 15,
          'intelligence': 25,
          'willpower': 30,
          'charisma': 10,
        },
      );

      final current = StatRadarPainter.normalizeCurrentStats(user);
      final ghost = StatRadarPainter.normalizeBaselineStats(user.baselineStats);

      expect(current.length, equals(7));
      expect(current[0], closeTo(0.60, 0.001));
      expect(ghost, isNotNull);
      expect(ghost![0], closeTo(0.20, 0.001));
      expect(StatRadarPainter.normalizeBaselineStats(null), isNull);
    });

    test('WorkoutSetModel Epley 1RM & Beat Last Session PR breakthrough detection', () {
      final lastSet = WorkoutSetModel.fromJson({
        'exerciseId': 'ex_1',
        'setNumber': 1,
        'weight': '80.00',
        'reps': 8,
        'setType': 'normal',
      });

      // 80 * (1 + 8 / 30) = 101.333...
      expect(lastSet.estimated1RM, closeTo(101.33, 0.05));

      expect(
        ActiveWorkoutScreen.isNewPrBreakthrough(
          weight: 85,
          reps: 8,
          previousBest1RM: lastSet.estimated1RM,
        ),
        isTrue,
      );

      expect(
        ActiveWorkoutScreen.isNewPrBreakthrough(
          weight: 70,
          reps: 5,
          previousBest1RM: lastSet.estimated1RM,
        ),
        isFalse,
      );
    });

    test('DailyCountdownBanner computes midnight delta & HH:MM:SS cleanly', () {
      final evening = DateTime(2026, 11, 27, 22, 30, 15);
      final rem = DailyCountdownBanner.timeUntilMidnight(evening);
      expect(DailyCountdownBanner.formatHms(rem), equals('01:29:45'));
    });

    test('Shop, Covenant, Roadmap, Content, Gate, & Recap models round-trip cleanly', () {
      final shopItem = ShopItemModel.fromJson({
        'id': 'item_1',
        'name': 'Shadow Monarch Title',
        'description': 'Apex title',
        'type': 'title',
        'value': 'Shadow Monarch',
        'cost': 500,
        'rarity': 'legendary',
      });
      expect(shopItem.cost, equals(500));

      final cov = PeerCovenantModel.fromJson({
        'id': 'cov_1',
        'covenantCode': 'COV-1234ABCD',
        'initiatorId': 'u_1',
        'initiatorName': 'Alpha',
        'termsDays': 14,
        'stakeCoins': 250,
        'protocolObjective': 'Zero Misses',
        'status': 'active',
      });
      expect(cov.covenantCode, equals('COV-1234ABCD'));

      final roadmap = RoadmapModel.fromJson({
        'id': 'rm_1',
        'userId': 'u_1',
        'status': 'active',
        'currentWeek': 1,
        'weeks': [
          {
            'id': 'w1',
            'roadmapId': 'rm_1',
            'weekNumber': 1,
            'phaseName': 'Stability',
            'goal': 'Daily execution',
            'description': 'Phase 1',
            'isLocked': false,
            'tasks': [
              {'id': 't1', 'weekId': 'w1', 'dayNumber': 1, 'text': 'Focus', 'completed': true},
              {'id': 't2', 'weekId': 'w1', 'dayNumber': 2, 'text': 'Train', 'completed': false},
            ],
          }
        ],
      });
      expect(roadmap.weeks.first.progress, closeTo(0.5, 0.001));

      final content = ContentItemModel.fromJson({
        'id': '1',
        'title': 'Overload',
        'description': 'Guide',
        'type': 'article',
        'category': 'fitness',
        'content': '# Header\nBody text here.',
        'likes': 10,
      });
      expect(content.estimatedReadMinutes, equals(1));

      final gate = GateEventModel.fromJson({
        'id': 'g1',
        'gateType': 'red_gate',
        'title': 'RED GATE',
        'targetType': 'workouts',
        'targetValue': 2,
        'currentValue': 2,
        'rewardCoins': 200,
      });
      expect(gate.isRedGate, isTrue);
      expect(gate.isReadyToClaim, isTrue);

      final recap = WeeklyRecapModel.fromJson({
        'dateRange': 'NOV 20 — NOV 27, 2026',
        'percentile': 91,
        'deepWorkMinutes': 240,
        'missionsCompleted': 12,
        'workoutsLogged': 4,
        'totalTonnage': 8400,
        'totalSets': 48,
        'streakDays': 14,
        'tier': 'B',
        'xpEarned': 950,
        'archetype': 'THE GLADIATOR',
        'archetypeTag': 'PHYSICAL SUPREMACY',
        'archetypeDescription': 'High tonnage',
        'userName': 'Alpha',
      });
      expect(recap.archetype, equals('THE GLADIATOR'));
    });

    test('SyncQueueService serializes finishWorkout & toggleRoadmapTask operations', () {
      final workoutOp = PendingOperation(
        id: 'op_1',
        type: SyncOpType.finishWorkout,
        endpoint: '/api/workouts/sessions/s1/finish',
        method: 'PUT',
        payload: {'sets': []},
        createdAt: DateTime.utc(2026, 11, 27),
      );
      final restoredWorkout = PendingOperation.fromJson(workoutOp.toJson());
      expect(restoredWorkout.type, equals(SyncOpType.finishWorkout));
      expect(restoredWorkout.method, equals('PUT'));

      final roadmapOp = PendingOperation(
        id: 'op_2',
        type: SyncOpType.toggleRoadmapTask,
        endpoint: '/api/roadmap/tasks/t1/toggle',
        payload: {},
        createdAt: DateTime.utc(2026, 11, 27),
      );
      final restoredRoadmap = PendingOperation.fromJson(roadmapOp.toJson());
      expect(restoredRoadmap.type, equals(SyncOpType.toggleRoadmapTask));
      expect(restoredRoadmap.method, equals('POST'));
    });

    test('HomeWidgetBridge & DivisionPodModel build & parse retention telemetry', () {
      const user = UserModel(
        id: 'u_div',
        name: 'Jin-Woo',
        email: 'j@ascensions.in',
        level: 10,
        xp: 900,
        tier: 'C',
        streak: 12,
        coins: 300,
        hunterClass: 'assassin',
        streakShields: 1,
        activeRecoveryDay: false,
        strength: 25,
        agility: 25,
        stamina: 25,
        vitality: 25,
        intelligence: 25,
        willpower: 25,
        charisma: 25,
        anchorQuestId: 'q_2',
        divisionTier: 'Silver',
      );

      final quests = const [
        QuestModel(
          id: 'q_1',
          title: 'Hydrate',
          description: 'Water',
          category: 'fitness',
          xp: 30,
          attribute: 'VIT',
          completed: true,
          difficulty: 'E',
        ),
        QuestModel(
          id: 'q_2',
          title: '50m Deep Focus',
          description: 'Air-Gap sprint',
          category: 'productivity',
          xp: 50,
          attribute: 'INT',
          completed: false,
          difficulty: 'C',
        ),
      ];

      final hud = HomeWidgetBridge.buildHudPayload(user: user, quests: quests);
      expect(hud['tier'], equals('C'));
      expect(hud['completedCount'], equals(1));
      expect(hud['totalCount'], equals(2));
      expect(hud['streak'], equals(12));
      expect(hud['anchorTitle'], equals('50m Deep Focus'));
      expect(hud['inPenaltyZone'], isFalse);

      final pod = DivisionPodModel.fromJson({
        'weekKey': '2026-W48',
        'divisionTier': 'Silver',
        'podNumber': 2,
        'promotionCount': 2,
        'demotionCount': 2,
        'myUserId': 'u_div',
        'myRank': 2,
        'xpToNextRank': 45,
        'members': [
          {
            'id': 'm1',
            'divisionId': 'd1',
            'userId': 'u_top',
            'userName': 'Cha Hae-In',
            'userTier': 'B',
            'weeklyXp': 320,
            'rank': 1,
            'zone': 'promotion',
          },
          {
            'id': 'm2',
            'divisionId': 'd1',
            'userId': 'u_div',
            'userName': 'Jin-Woo',
            'userTier': 'C',
            'weeklyXp': 276,
            'rank': 2,
            'zone': 'promotion',
          },
        ],
        'pendingLastWeekOutcome': {
          'id': 'm_old',
          'weekKey': '2026-W47',
          'divisionTier': 'Bronze',
          'finalRank': 1,
          'outcome': 'promoted',
          'rewardCoins': 150,
        },
      });

      expect(pod.divisionTier, equals('Silver'));
      expect(pod.podNumber, equals(2));
      expect(pod.members[1].zone, equals('promotion'));
      expect(pod.pendingLastWeekOutcome?.outcome, equals('promoted'));
      expect(pod.pendingLastWeekOutcome?.rewardCoins, equals(150));
    });

    test('Goal-Driven Utility models & HomeWidgetBridge surface If-Then & linked telemetry', () {
      final quest = QuestModel.fromJson({
        'id': 'q_goal_1',
        'title': 'Roadmap Anchor: Ship Auth API',
        'description': 'Advance milestone',
        'category': 'productivity',
        'rewardXP': 45,
        'rewardCoins': 20,
        'executionMode': 'focus_verified',
        'targetMinutes': 45,
        'roadmapTaskId': 'task_99',
        'sourceType': 'roadmap',
      });
      expect(quest.isFocusVerified, isTrue);
      expect(quest.targetMinutes, equals(45));
      expect(quest.roadmapTaskId, equals('task_99'));

      final goalUser = UserModel.fromJson({
        'id': 'u_goal',
        'name': 'Architect',
        'email': 'arch@ascensions.in',
        'level': 5,
        'xp': 420,
        'tier': 'C',
        'streak': 6,
        'coins': 250,
        'hunterClass': 'mage',
        'streakShields': 1,
        'activeRecoveryDay': false,
        'strength': 20,
        'agility': 20,
        'stamina': 20,
        'vitality': 30,
        'intelligence': 55,
        'willpower': 40,
        'charisma': 25,
        'currentGoal': 'Ship SaaS MVP in 30 days',
        'goalDomain': 'career_code',
        'dailyCapacityMinutes': 120,
        'lastIfThenPlan': 'If 09:00 hits, start 45m Focus before inbox.',
        'anchorQuestId': 'q_goal_1',
      });

      final hud = HomeWidgetBridge.buildHudPayload(user: goalUser, quests: [quest]);
      expect(hud['statusLine'], equals('If 09:00 hits, start 45m Focus before inbox.'));

      final roadmap = RoadmapModel.fromJson({
        'id': 'rm_goal',
        'userId': 'u_goal',
        'status': 'active',
        'currentWeek': 1,
        'linkedGoalText': 'Ship SaaS MVP in 30 days',
        'goalDomain': 'career_code',
        'goalProgressPercent': 25,
        'weeks': [
          {
            'id': 'w1',
            'roadmapId': 'rm_goal',
            'weekNumber': 1,
            'phaseName': 'WEEK 1: SCOPE',
            'goal': 'Ship v0.1',
            'targetFocusMinutes': 300,
            'loggedFocusMinutes': 120,
            'targetWorkouts': 2,
            'loggedWorkouts': 1,
            'tasks': const [],
          }
        ],
      });
      expect(roadmap.linkedGoalText, equals('Ship SaaS MVP in 30 days'));
      expect(roadmap.weeks.first.loggedFocusMinutes, equals(120));
      expect(roadmap.weeks.first.loggedWorkouts, equals(1));

      final guide = ContentItemModel.fromJson({
        'id': '2',
        'title': 'The Pomodoro Technique',
        'description': 'Deep work protocol',
        'type': 'article',
        'category': 'productivity',
        'content': 'Body text',
        'prescriptionReason': 'Prescribed to counter focus drift',
        'ctaAction': {
          'label': 'Launch 25m Air-Gap Focus',
          'actionType': 'focus',
          'durationMinutes': 25,
        },
      });
      expect(guide.prescriptionReason, contains('focus drift'));
      expect(guide.ctaActionType, equals('focus'));
      expect(guide.ctaDurationMinutes, equals(25));
    });

    test('Dynamic AI Coaching (#1, #5, #6) parses nextFocusStep, unstick content & weekly audit', () {
      final coachUser = UserModel.fromJson({
        'id': 'u_ai',
        'name': 'Monarch',
        'email': 'monarch@ascensions.in',
        'level': 9,
        'xp': 850,
        'tier': 'B',
        'streak': 4,
        'coins': 320,
        'hunterClass': 'assassin',
        'streakShields': 2,
        'activeRecoveryDay': false,
        'strength': 30,
        'agility': 40,
        'stamina': 35,
        'vitality': 30,
        'intelligence': 60,
        'willpower': 50,
        'charisma': 30,
        'nextFocusStep': 'Write 2 unit tests for refresh token rotation',
      });
      expect(
        coachUser.nextFocusStep,
        equals('Write 2 unit tests for refresh token rotation'),
      );
      expect(
        coachUser.copyWith(nextFocusStep: 'Ship PR').toJson()['nextFocusStep'],
        equals('Ship PR'),
      );

      final stuckQuest = QuestModel.fromJson({
        'id': 'q_stuck',
        'title': 'Finish system design doc',
        'description': 'Draft architecture RFC',
        'category': 'productivity',
        'rewardXP': 40,
        'executionMode': 'focus_verified',
        'content': 'Open blank doc and write 3 bullet headers in 5 minutes',
      });
      expect(
        stuckQuest.content,
        equals('Open blank doc and write 3 bullet headers in 5 minutes'),
      );
      expect(stuckQuest.toJson()['content'], equals(stuckQuest.content));

      final recap = WeeklyRecapModel.fromJson({
        'dateRange': 'NOV 20 — NOV 27, 2026',
        'percentile': 88,
        'deepWorkMinutes': 240,
        'missionsCompleted': 12,
        'workoutsLogged': 3,
        'totalTonnage': 4500,
        'totalSets': 36,
        'streakDays': 7,
        'tier': 'B',
        'xpEarned': 920,
        'archetype': 'THE MONK',
        'archetypeTag': 'COGNITIVE FORTRESS',
        'archetypeDescription': 'High focus density.',
        'userName': 'Monarch',
        'coachSummary': 'Delivered 240m deep work and 3 workouts.',
        'dayPatternInsight': 'Peak momentum hit on Tue; output dipped on Fri.',
        'mondayAdjustment': 'Scale daily cap to 105m starting Monday.',
        'suggestedDailyMinutes': 105,
      });
      expect(recap.coachSummary, contains('240m'));
      expect(recap.dayPatternInsight, contains('Tue'));
      expect(recap.mondayAdjustment, contains('105m'));
      expect(recap.suggestedDailyMinutes, equals(105));
    });

    test('Roadmap v2 (#1-#10) parses Boss Raid HP, Comeback, Extraction, Job Change, Guild & Endgame state', () {
      final week = RoadmapWeekModel.fromJson({
        'id': 'w_boss',
        'roadmapId': 'rm_1',
        'weekNumber': 2,
        'phaseName': 'WEEK 2: CORE LOOP',
        'goal': 'Ship MVP',
        'bossName': 'Baruch of Mid-Week Drift',
        'bossMaxHp': 1000,
        'bossCurrentHp': 650,
        'bossDamageToday': 200,
        'bossDefeated': false,
      });
      expect(week.bossName, equals('Baruch of Mid-Week Drift'));
      expect(week.bossHpFraction, closeTo(0.65, 0.001));
      expect(week.bossDefeated, isFalse);

      final v2User = UserModel.fromJson({
        'id': 'u_v2',
        'name': 'Jin-Woo',
        'email': 'jw@ascensions.in',
        'level': 16,
        'xp': 1550,
        'tier': 'C',
        'streak': 3,
        'coins': 400,
        'hunterClass': 'assassin',
        'streakShields': 1,
        'activeRecoveryDay': false,
        'strength': 40,
        'agility': 42,
        'stamina': 35,
        'vitality': 30,
        'intelligence': 45,
        'willpower': 38,
        'charisma': 20,
        'preBreakStreak': 12,
        'guildId': 'g_1',
        'comebackGate': {'active': true, 'restoredFromStreak': 6},
        'pendingExtraction': {'id': 'ext_1', 'attemptsRemaining': 3},
        'jobChangeState': {'status': 'active', 'steps': const []},
        'doubleDungeonState': {'id': 'dd_1', 'status': 'active'},
        'reawakeningState': {'status': 'passed', 'awardedRank': 'B'},
        'monarchDomainState': {'status': 'active', 'breaches': 0},
      });
      expect(v2User.preBreakStreak, equals(12));
      expect(v2User.guildId, equals('g_1'));
      expect(v2User.comebackGate?['restoredFromStreak'], equals(6));
      expect(v2User.pendingExtraction?['attemptsRemaining'], equals(3));
      expect(v2User.jobChangeState?['status'], equals('active'));
      expect(v2User.doubleDungeonState?['status'], equals('active'));
      expect(v2User.reawakeningState?['awardedRank'], equals('B'));
      expect(v2User.monarchDomainState?['status'], equals('active'));

      final bossHud = HomeWidgetBridge.buildHudPayload(
        user: v2User,
        quests: const [],
        bossLabel: 'Baruch: 650/1000 HP',
      );
      expect(bossHud['statusLine'], equals('Baruch: 650/1000 HP'));
    });
  });
}
