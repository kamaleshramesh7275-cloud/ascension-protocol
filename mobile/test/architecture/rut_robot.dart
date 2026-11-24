import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

/// Real-User Simulation Robot
/// Simulates physical human taps, text entries, and gesture behavior
class RutRobot {
  final WidgetTester tester;

  RutRobot(this.tester);

  Future<void> tapGuestLogin() async {
    final guestButton = find.text('CONTINUE AS GUEST HUNTER');
    expect(guestButton, findsOneWidget, reason: 'Guest login button must be visible');
    await tester.tap(guestButton);
    await tester.pumpAndSettle();
  }

  Future<void> tapGoogleLogin() async {
    final googleButton = find.text('Sign in with Google');
    expect(googleButton, findsOneWidget, reason: 'Google sign-in button must be visible');
    await tester.tap(googleButton);
    await tester.pumpAndSettle();
  }

  Future<void> switchTab(String label) async {
    final tab = find.text(label);
    expect(tab, findsOneWidget, reason: 'Bottom nav tab "$label" must be present');
    await tester.tap(tab);
    await tester.pumpAndSettle();
  }

  Future<void> tapQuestCheckbox(int index) async {
    final checkboxes = find.byType(InkWell);
    expect(checkboxes, findsWidgets);
    await tester.tap(checkboxes.at(index));
    await tester.pump(); // Immediate frame
  }

  void assertTextVisible(String text) {
    expect(find.text(text), findsOneWidget, reason: 'Expected "$text" to be visible on screen');
  }

  void assertNoRenderOverflow() {
    expect(tester.takeException(), isNull, reason: 'No RenderFlex overflow or unhandled exceptions allowed');
  }
}
