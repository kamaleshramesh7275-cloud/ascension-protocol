import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

/// Navigation Dead-End Scanner (Pillar 2)
/// Verifies that any screen visited provides at least one forward or backward exit path
class NavigationDeadEndScanner {
  static void scan(WidgetTester tester, {String screenName = 'Screen'}) {
    // 1. Verify screen has interactive action buttons or AppBar leading/back or Dismissible
    final hasElevatedButton = find.byType(ElevatedButton).evaluate().isNotEmpty;
    final hasOutlinedButton = find.byType(OutlinedButton).evaluate().isNotEmpty;
    final hasIconButton = find.byType(IconButton).evaluate().isNotEmpty;
    final hasBackButton = find.byTooltip('Back').evaluate().isNotEmpty || find.byIcon(Icons.arrow_back).evaluate().isNotEmpty;
    final hasInkWell = find.byType(InkWell).evaluate().isNotEmpty;
    final hasBottomNav = find.byType(BottomNavigationBar).evaluate().isNotEmpty;

    final hasExitOrAction = hasElevatedButton || hasOutlinedButton || hasIconButton || hasBackButton || hasInkWell || hasBottomNav;

    expect(
      hasExitOrAction,
      isTrue,
      reason: 'DEAD-END TRAP DETECTED: $screenName has no reachable action, exit, or navigation controls!',
    );
  }
}
