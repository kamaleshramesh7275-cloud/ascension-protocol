import 'package:flutter_test/flutter_test.dart';
import 'package:ascension_mobile/features/quests/quests_screen.dart';
import 'package:ascension_mobile/models/quest_model.dart';
import '../architecture/rut_harness.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  setUp(() {
    RutHarness.setupTestEnv();
  });

  group('Pillar 4: Functional Integrity & Dead Button Scanner', () {
    test('TC-4.1: QuestModel parses backend schema with rewardXP and type cleanly', () {
      final serverJson = {
        'id': 'quest_real_100',
        'title': 'Heavy Deadlift Crucible',
        'description': 'Pull 5 sets of heavy deadlifts.',
        'rewardXP': 80,
        'reward_coins': 40,
        'type': 'boss',
        'category': 'fitness',
        'difficulty': 'hard',
        'isBoss': true,
        'completed': false,
        'rewardStats': {'strength': 3},
      };

      final quest = QuestModel.fromJson(serverJson);
      expect(quest.id, equals('quest_real_100'));
      expect(quest.xp, equals(80), reason: 'Must read rewardXP correctly from server');
      expect(quest.attribute, equals('STR'), reason: 'Must derive STR from rewardStats');
      expect(quest.isBoss, isTrue);
      expect(quest.difficulty, equals('HARD'));
    });

    testWidgets('TC-4.2: Quests Screen filter chips switch without errors', (tester) async {
      await tester.pumpWidget(
        RutHarness.buildTestApp(child: const QuestsScreen(user: RutHarness.testUser)),
      );

      // Verify filter chips exist
      expect(find.text('ALL'), findsOneWidget);
      expect(find.text('DAILY'), findsOneWidget);
      expect(find.text('BOSS'), findsOneWidget);
      expect(find.text('INTELLECT'), findsOneWidget);

      // Tap BOSS chip
      await tester.tap(find.text('BOSS'));
      await tester.pumpAndSettle();

      // Tap INTELLECT chip
      await tester.tap(find.text('INTELLECT'));
      await tester.pumpAndSettle();

      // Tap ALL chip
      await tester.tap(find.text('ALL'));
      await tester.pumpAndSettle();
    });
  });
}
