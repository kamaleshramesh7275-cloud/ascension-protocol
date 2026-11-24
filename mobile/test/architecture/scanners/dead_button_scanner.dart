import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

/// Dead Button Scanner (Pillar 4)
/// Scans the widget tree to ensure that buttons are not rendered with null callbacks
class DeadButtonScanner {
  static void scan(WidgetTester tester, {String screenName = 'Screen'}) {
    final elevatedButtons = tester.widgetList<ElevatedButton>(find.byType(ElevatedButton));
    for (final btn in elevatedButtons) {
      expect(
        btn.onPressed,
        isNotNull,
        reason: 'DEAD BUTTON DETECTED in $screenName: ElevatedButton is permanently disabled with onPressed == null',
      );
    }

    final outlinedButtons = tester.widgetList<OutlinedButton>(find.byType(OutlinedButton));
    for (final btn in outlinedButtons) {
      expect(
        btn.onPressed,
        isNotNull,
        reason: 'DEAD BUTTON DETECTED in $screenName: OutlinedButton is permanently disabled with onPressed == null',
      );
    }
  }
}
