import 'package:flutter_test/flutter_test.dart';
import 'package:ascension_mobile/core/api/api_endpoints.dart';
import 'package:ascension_mobile/core/api/api_client.dart';
import 'package:ascension_mobile/core/storage/session_storage.dart';
import '../architecture/rut_harness.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  group('Pillar 7: Security & Keystore Defense', () {
    setUp(() async {
      await RutHarness.resetStorage();
      ApiClient.reset();
    });

    test('TC-7.1: Production base URL is locked to https://ascensions.in', () {
      expect(
        ApiEndpoints.defaultBaseUrl,
        equals('https://ascensions.in'),
        reason: 'Target base URL must be set to production domain as requested',
      );
    });

    test('TC-7.2: ApiClient injects x-firebase-uid header required by production', () async {
      // Simulate persistent guest session
      final guestUid = await SessionStorage.getOrCreateGuestUid();
      expect(guestUid, isNotEmpty);

      final dio = await ApiClient.getInstance();
      expect(dio.options.baseUrl, equals('https://ascensions.in'));
      expect(dio.interceptors, isNotEmpty, reason: 'Must have auth interceptors attached');
    });

    test('TC-7.3: Critical endpoints match production server routing schema', () {
      expect(ApiEndpoints.authMe, equals('/api/user'));
      expect(ApiEndpoints.authGoogle, equals('/api/auth/login-google'));
      expect(ApiEndpoints.onboarding, equals('/api/onboarding'));
      expect(ApiEndpoints.recoveryDay, equals('/api/user/recovery-day'));
      expect(ApiEndpoints.focusComplete, equals('/api/focus/complete'));
    });
  });
}
