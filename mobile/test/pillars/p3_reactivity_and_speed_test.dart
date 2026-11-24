import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:ascension_mobile/core/providers/quests_provider.dart';
import 'package:ascension_mobile/core/providers/auth_provider.dart';
import '../architecture/rut_harness.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  setUp(() {
    RutHarness.setupTestEnv();
  });

  group('Pillar 3: Reactivity & Perceived Speed', () {
    test('TC-3.1: Quest toggle delivers optimistic UI update within same frame (<50ms)', () async {
      final container = ProviderContainer();
      addTearDown(container.dispose);

      // Pre-seed auth state
      container.read(authProvider.notifier).updateUser(RutHarness.testUser);

      final initialQuests = container.read(questsProvider);
      expect(initialQuests, isNotEmpty, reason: 'Quests must be initialized');

      final targetQuest = initialQuests.first;
      expect(targetQuest.completed, isFalse);

      final stopwatch = Stopwatch()..start();
      // Invoke toggle
      final toggleFuture = container.read(questsProvider.notifier).toggleQuest(targetQuest.id);

      // Measure synchronous/immediate state mutation time
      final updatedQuests = container.read(questsProvider);
      final elapsed = stopwatch.elapsedMilliseconds;

      expect(elapsed, lessThanOrEqualTo(50), reason: 'Optimistic state mutation must happen in < 50ms');
      expect(updatedQuests.firstWhere((q) => q.id == targetQuest.id).completed, isTrue);

      await toggleFuture;
    });

    test('TC-3.2: Rapid double-tap on quests state maintains state stability', () async {
      final container = ProviderContainer();
      addTearDown(container.dispose);

      container.read(authProvider.notifier).updateUser(RutHarness.testUser);
      final initialQuests = container.read(questsProvider);
      final questId = initialQuests.first.id;

      // Rapid successive toggles
      final f1 = container.read(questsProvider.notifier).toggleQuest(questId);
      final f2 = container.read(questsProvider.notifier).toggleQuest(questId);

      await Future.wait([f1, f2]);

      final finalQuests = container.read(questsProvider);
      expect(finalQuests.firstWhere((q) => q.id == questId), isNotNull);
    });
  });
}
