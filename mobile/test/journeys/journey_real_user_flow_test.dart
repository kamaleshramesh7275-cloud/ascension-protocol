import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:ascension_mobile/main.dart';
import 'package:ascension_mobile/features/home/main_navigation_screen.dart';
import 'package:ascension_mobile/features/auth/login_screen.dart';
import '../architecture/rut_robot.dart';
import '../architecture/rut_harness.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  group('Real-User Journey: First-Time Hunter to Full Operational Protocol', () {
    setUp(() async {
      await RutHarness.resetStorage();
    });

    testWidgets('Journey 1: Cold Boot -> Guest Login -> Navigate All 4 Sector Tabs', (tester) async {
      final robot = RutRobot(tester);

      // 1. Launch Mobile App
      await tester.pumpWidget(
        const ProviderScope(
          child: AscensionMobileApp(),
        ),
      );
      await tester.pumpAndSettle();

      // Verify Login Screen is present
      expect(find.byType(LoginScreen), findsOneWidget);
      robot.assertNoRenderOverflow();

      // 2. Tap Continue as Guest
      await robot.tapGuestLogin();
      await tester.pumpAndSettle();

      // 3. User lands on Main Navigation Screen
      expect(find.byType(MainNavigationScreen), findsOneWidget);
      robot.assertNoRenderOverflow();

      // 4. Navigate through all 4 Hunter Systems
      // Tab 1: Quests (Default)
      expect(find.text('HUNTER SYSTEM'), findsOneWidget);

      // Tab 2: Stats
      await robot.switchTab('STATS');
      expect(find.text('HUNTER ATTRIBUTES'), findsOneWidget);
      robot.assertNoRenderOverflow();

      // Tab 3: Focus
      await robot.switchTab('FOCUS');
      expect(find.text('AIR-GAP FOCUS'), findsOneWidget);
      robot.assertNoRenderOverflow();

      // Tab 4: Debrief
      await robot.switchTab('DEBRIEF');
      expect(find.text('EVENING DEBRIEF'), findsOneWidget);
      robot.assertNoRenderOverflow();
    });
  });
}
