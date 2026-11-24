import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:ascension_mobile/core/providers/auth_provider.dart';
import 'package:ascension_mobile/core/storage/session_storage.dart';
import '../architecture/rut_harness.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  group('Pillar 1: Access & Identity (Login, Session, Keystore)', () {
    setUp(() async {
      await RutHarness.resetStorage();
    });

    test('TC-1.1: Guest login generates and persists unique guest UID in keystore', () async {
      final guestUid1 = await SessionStorage.getOrCreateGuestUid();
      expect(guestUid1, startsWith('guest_'), reason: 'Guest UID must follow guest_ prefix');

      // Subsequent call must retrieve identical UID (not regenerate)
      final guestUid2 = await SessionStorage.getOrCreateGuestUid();
      expect(guestUid2, equals(guestUid1), reason: 'Guest UID must be durable across checks');

      final activeUid = await SessionStorage.getFirebaseUid();
      expect(activeUid, equals(guestUid1), reason: 'getFirebaseUid must return persistent guest UID');
    });

    test('TC-1.2: authProvider loginGuest generates valid hunter profile', () async {
      final container = ProviderContainer();
      addTearDown(container.dispose);

      final authNotifier = container.read(authProvider.notifier);
      await authNotifier.loginGuest();

      final userState = container.read(authProvider).value;
      expect(userState, isNotNull, reason: 'Guest login must produce a valid UserModel');
      expect(userState!.id, startsWith('guest_'));
      expect(userState.hunterClass, equals('assassin'));
      expect(userState.streakShields, greaterThanOrEqualTo(1));
    });

    test('TC-1.3: Logout cleanly scrubs keystore and returns authState to null', () async {
      final container = ProviderContainer();
      addTearDown(container.dispose);

      final authNotifier = container.read(authProvider.notifier);
      await authNotifier.loginGuest();
      expect(container.read(authProvider).value, isNotNull);

      await authNotifier.logout();
      expect(container.read(authProvider).value, isNull, reason: 'User must be null after logout');

      final token = await SessionStorage.getToken();
      expect(token, isNull, reason: 'Token must be scrubbed from keystore on logout');
    });
  });
}
