import 'package:flutter_test/flutter_test.dart';
import 'package:ascension_mobile/features/auth/login_screen.dart';
import 'package:ascension_mobile/features/quests/quests_screen.dart';
import 'package:ascension_mobile/features/focus/focus_screen.dart';
import 'package:ascension_mobile/features/debrief/debrief_screen.dart';
import 'package:ascension_mobile/features/stats/stats_screen.dart';
import '../architecture/rut_harness.dart';
import '../architecture/scanners/navigation_dead_end_scanner.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  setUp(() {
    RutHarness.setupTestEnv();
  });

  group('Pillar 2: Navigation Topology & Dead-End Scanners', () {
    testWidgets('TC-2.1: LoginScreen has reachable entry actions (No Dead End)', (tester) async {
      await tester.pumpWidget(
        RutHarness.buildTestApp(child: const LoginScreen()),
      );
      await tester.pumpAndSettle();
      NavigationDeadEndScanner.scan(tester, screenName: 'LoginScreen');
    });

    testWidgets('TC-2.2: QuestsScreen provides active tabs and quest cards (No Dead End)', (tester) async {
      await tester.pumpWidget(
        RutHarness.buildTestApp(child: const QuestsScreen(user: RutHarness.testUser)),
      );
      await tester.pumpAndSettle();
      NavigationDeadEndScanner.scan(tester, screenName: 'QuestsScreen');
    });

    testWidgets('TC-2.3: FocusScreen provides duration selector and engagement action', (tester) async {
      await tester.pumpWidget(
        RutHarness.buildTestApp(child: const FocusScreen()),
      );
      await tester.pumpAndSettle();
      NavigationDeadEndScanner.scan(tester, screenName: 'FocusScreen');
    });

    testWidgets('TC-2.4: DebriefScreen provides submit and recovery buttons', (tester) async {
      await tester.pumpWidget(
        RutHarness.buildTestApp(child: const DebriefScreen(user: RutHarness.testUser)),
      );
      await tester.pumpAndSettle();
      NavigationDeadEndScanner.scan(tester, screenName: 'DebriefScreen');
    });

    testWidgets('TC-2.5: StatsScreen renders attribute bars and radar canvas', (tester) async {
      await tester.pumpWidget(
        RutHarness.buildTestApp(child: const StatsScreen(user: RutHarness.testUser)),
      );
      await tester.pumpAndSettle();
      NavigationDeadEndScanner.scan(tester, screenName: 'StatsScreen');
    });
  });
}
