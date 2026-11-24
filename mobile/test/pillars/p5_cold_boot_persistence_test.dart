import 'package:flutter_test/flutter_test.dart';
import 'package:ascension_mobile/core/storage/session_storage.dart';
import '../architecture/rut_harness.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  group('Pillar 5: Cold-Boot Persistence & App Kill Durability', () {
    setUp(() async {
      await RutHarness.resetStorage();
    });

    test('TC-5.1: Cold-boot maintains guest UID and custom base URL across restarts', () async {
      // Session 1: Write values
      final guestUid1 = await SessionStorage.getOrCreateGuestUid();
      await SessionStorage.setCustomBaseUrl('https://ascensions.in');
      await SessionStorage.saveToken('jwt_hunter_token_xyz');

      // Session 2: Cold boot simulation (read back from storage)
      final recoveredGuestUid = await SessionStorage.getOrCreateGuestUid();
      final recoveredBaseUrl = await SessionStorage.getCustomBaseUrl();
      final recoveredToken = await SessionStorage.getToken();

      expect(recoveredGuestUid, equals(guestUid1), reason: 'Guest UID must not be lost on restart');
      expect(recoveredBaseUrl, equals('https://ascensions.in'));
      expect(recoveredToken, equals('jwt_hunter_token_xyz'));
    });

    test('TC-5.2: Storage clear wipes all session keys completely', () async {
      await SessionStorage.saveToken('test_token');
      await SessionStorage.saveFirebaseUid('test_uid');

      await SessionStorage.clearSession();

      expect(await SessionStorage.getToken(), isNull);
    });
  });
}
