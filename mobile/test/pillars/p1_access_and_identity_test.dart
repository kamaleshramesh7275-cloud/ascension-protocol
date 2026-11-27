import 'package:dio/dio.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:ascension_mobile/core/api/api_client.dart';
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

    test('TC-1.4: Cold restart retains logged-in session without re-prompting login', () async {
      // 1. Session 1: User logs in
      final container1 = ProviderContainer();
      await container1.read(authProvider.notifier).loginGuest();
      final originalUser = container1.read(authProvider).value;
      expect(originalUser, isNotNull);
      container1.dispose();

      // 2. Session 2: Cold boot app startup (new container mimicking app restart)
      final container2 = ProviderContainer();
      addTearDown(container2.dispose);

      // Await checkSession completion via the notifier
      await container2.read(authProvider.notifier).checkSession();
      final restoredState = container2.read(authProvider);
      expect(restoredState.value, isNotNull, reason: 'Cached user must be restored immediately');
      expect(restoredState.value!.id, equals(originalUser!.id));
      expect(restoredState.value!.name, equals('Guest Ascendant'));
    });

    test('TC-1.5: 401 on background API call does not wipe persisted session', () async {
      await SessionStorage.saveToken('local_jwt.sample.sig');
      await SessionStorage.saveFirebaseUid(RutHarness.testUser.id);
      await SessionStorage.saveCachedUser(RutHarness.testUser);

      // Simulate server returning 401 invalid_token without explicit logout
      ApiClient.reset();
      ApiClient.testInterceptor = InterceptorsWrapper(
        onRequest: (options, handler) {
          return handler.reject(
            DioException(
              requestOptions: options,
              type: DioExceptionType.badResponse,
              response: Response(
                requestOptions: options,
                statusCode: 401,
                data: {'code': 'invalid_token', 'error': 'Token expired'},
              ),
            ),
          );
        },
      );

      final container = ProviderContainer();
      addTearDown(container.dispose);

      await container.read(authProvider.notifier).checkSession();
      final user = container.read(authProvider).value;
      expect(user, isNotNull, reason: 'Cached authenticated session must persist across restarts until explicit logout');
      expect(user!.id, equals(RutHarness.testUser.id));
      expect(await SessionStorage.getCachedUser(), isNotNull);
    });
  });
}
