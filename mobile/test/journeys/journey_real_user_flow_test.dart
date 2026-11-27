import 'package:flutter/material.dart';
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

    testWidgets(
      'Journey 1: Cold Boot -> Guest Login -> Navigate All 5 Sector Tabs & Arsenal Stats',
      (tester) async {
        tester.view.physicalSize = const Size(540, 960);
        tester.view.devicePixelRatio = 1.0;
        addTearDown(() {
          tester.view.resetPhysicalSize();
          tester.view.resetDevicePixelRatio();
        });

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
        await tester.ensureVisible(find.text('CONTINUE AS GUEST HUNTER'));
        await tester.pumpAndSettle();
        await robot.tapGuestLogin();
        await tester.pumpAndSettle();

        // 3. User lands on Main Navigation Screen
        expect(find.byType(MainNavigationScreen), findsOneWidget);
        robot.assertNoRenderOverflow();

        // 4. Navigate through all 5 Hunter Systems
        // Tab 1: Home (Default) -> Quick Launch to Evening Debrief
        final debriefTile = find.text('Evening Debrief');
        await tester.ensureVisible(debriefTile);
        await tester.pumpAndSettle();
        await tester.tap(debriefTile);
        await tester.pumpAndSettle();
        expect(find.text('EVENING DEBRIEF'), findsOneWidget);
        robot.assertNoRenderOverflow();
        await tester.pageBack();
        await tester.pumpAndSettle();

        // Tab 2: Quests
        await robot.switchTab('QUESTS');
        expect(find.text('HUNTER SYSTEM'), findsOneWidget);
        robot.assertNoRenderOverflow();

        // Tab 3: Workout
        await robot.switchTab('WORKOUT');
        expect(find.text('COMBAT TRAINING'), findsOneWidget);
        robot.assertNoRenderOverflow();

        // Tab 4: Focus
        await robot.switchTab('FOCUS');
        expect(find.text('AIR-GAP FOCUS'), findsOneWidget);
        robot.assertNoRenderOverflow();

        // Tab 5: Arsenal -> Stats Drill-In
        await robot.switchTab('ARSENAL');
        expect(find.text('HUNTER ARSENAL'), findsOneWidget);
        robot.assertNoRenderOverflow();

        final statsCard = find.text('HUNTER ATTRIBUTES & LICENSE');
        await tester.ensureVisible(statsCard);
        await tester.pumpAndSettle();
        await tester.tap(statsCard);
        await tester.pumpAndSettle();
        expect(find.text('HUNTER ATTRIBUTES'), findsOneWidget);
        robot.assertNoRenderOverflow();
      },
    );
  });
}
