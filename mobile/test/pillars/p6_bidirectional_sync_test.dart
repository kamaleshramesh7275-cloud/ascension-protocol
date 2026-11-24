import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:ascension_mobile/core/providers/auth_provider.dart';
import 'package:ascension_mobile/core/providers/quests_provider.dart';
import 'package:ascension_mobile/models/user_model.dart';
import '../architecture/rut_harness.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  setUp(() {
    RutHarness.setupTestEnv();
  });

  group('Pillar 6: Bidirectional State Synchronization (HUD & Progress)', () {
    test('TC-6.1: Completing a quest immediately increments user XP and levels up HUD', () async {
      final container = ProviderContainer();
      addTearDown(container.dispose);

      // Start user at 80 XP (100 is level up threshold)
      const initialUser = UserModel(
        id: 'sync_user',
        name: 'Sync Hunter',
        email: 'sync@hunter.app',
        level: 1,
        xp: 80,
        tier: 'D',
        streak: 3,
        coins: 100,
        hunterClass: 'assassin',
        streakShields: 1,
        activeRecoveryDay: false,
        onboardingCompleted: true,
        strength: 20,
        agility: 25,
        stamina: 15,
        vitality: 18,
        intelligence: 20,
        willpower: 22,
        charisma: 14,
      );

      container.read(authProvider.notifier).updateUser(initialUser);
      expect(container.read(authProvider).value!.xp, equals(80));
      expect(container.read(authProvider).value!.level, equals(1));

      // Get first quest (worth 40-50 XP)
      final quests = container.read(questsProvider);
      final quest = quests.first;

      // Complete quest
      await container.read(questsProvider.notifier).toggleQuest(quest.id);

      // Verify User state was live-updated
      final updatedUser = container.read(authProvider).value!;
      expect(updatedUser.xp, greaterThan(80), reason: 'User XP must increase after completing quest');
      expect(updatedUser.level, equals(2), reason: 'User should have leveled up from Lv 1 to Lv 2');
      expect(updatedUser.coins, greaterThan(100), reason: 'User coins must increase');
    });
  });
}
