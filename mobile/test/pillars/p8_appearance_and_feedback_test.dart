import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:ascension_mobile/core/providers/appearance_provider.dart';
import 'package:ascension_mobile/core/providers/quests_provider.dart';
import 'package:ascension_mobile/core/storage/session_storage.dart';
import 'package:ascension_mobile/core/theme/hunter_theme.dart';
import 'package:ascension_mobile/features/feedback/post_registration_feedback_dialog.dart';
import 'package:ascension_mobile/features/settings/settings_screen.dart';
import '../architecture/rut_harness.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  group('Pillar 8: Appearance Themes, Fonts, Simple Copy & 10m Feedback Popup', () {
    setUp(() async {
      await RutHarness.resetStorage();
      HunterTheme.applyAppearance(
        HunterThemeId.systemAbyss,
        HunterFontId.cyberRajdhani,
      );
    });

    test('TC-8.1: Switching themes updates reactive palette & persists across restarts', () async {
      final container1 = ProviderContainer();
      final notifier1 = container1.read(appearanceProvider.notifier);

      expect(HunterTheme.abyss, equals(const Color(0xFF020617)));
      await notifier1.setTheme(HunterThemeId.crimsonGate);

      expect(container1.read(appearanceProvider).themeId, equals(HunterThemeId.crimsonGate));
      expect(HunterTheme.abyss, equals(const Color(0xFF0D0406)));
      expect(HunterTheme.cyan, equals(const Color(0xFFF43F5E)));
      container1.dispose();

      // Simulate cold boot static init + new provider container
      HunterTheme.applyAppearance(HunterThemeId.systemAbyss, HunterFontId.cyberRajdhani);
      await AppearanceNotifier.initStatic();
      final container2 = ProviderContainer();
      addTearDown(container2.dispose);

      expect(HunterTheme.activeThemeId, equals(HunterThemeId.crimsonGate));
      expect(HunterTheme.abyss, equals(const Color(0xFF0D0406)));
      expect(container2.read(appearanceProvider).themeId, equals(HunterThemeId.crimsonGate));

      await container2.read(appearanceProvider.notifier).setTheme(HunterThemeId.emeraldCitadel);
      expect(HunterTheme.abyss, equals(const Color(0xFF040D09)));
      expect(HunterTheme.cyan, equals(const Color(0xFF10B981)));
    });

    testWidgets('TC-8.2: Switching fonts updates ThemeData fontFamily & persists across restarts', (tester) async {
      await tester.pumpWidget(
        ProviderScope(
          child: Consumer(
            builder: (context, ref, _) {
              final appearance = ref.watch(appearanceProvider);
              return MaterialApp(
                theme: HunterTheme.buildTheme(appearance.themeId, appearance.fontId),
                home: Builder(
                  builder: (ctx) => Text(
                    'Font Probe',
                    style: Theme.of(ctx).textTheme.bodyLarge,
                  ),
                ),
              );
            },
          ),
        ),
      );
      await tester.pumpAndSettle();

      final container = ProviderScope.containerOf(
        tester.element(find.byType(MaterialApp)),
      );
      final initialFamily = tester.widget<Text>(find.text('Font Probe')).style?.fontFamily;

      await container.read(appearanceProvider.notifier).setFont(HunterFontId.terminalMono);
      await tester.pumpAndSettle();

      expect(container.read(appearanceProvider).fontId, equals(HunterFontId.terminalMono));
      final monoFamily = tester.widget<Text>(find.text('Font Probe')).style?.fontFamily;
      expect(monoFamily, isNotNull);
      expect(monoFamily, isNot(equals(initialFamily)));

      await container.read(appearanceProvider.notifier).setFont(HunterFontId.tacticalGrotesk);
      await tester.pumpAndSettle();
      final groteskFamily = tester.widget<Text>(find.text('Font Probe')).style?.fontFamily;
      expect(groteskFamily, isNot(equals(monoFamily)));

      HunterTheme.applyAppearance(HunterThemeId.systemAbyss, HunterFontId.cyberRajdhani);
      await AppearanceNotifier.initStatic();
      expect(HunterTheme.activeFontId, equals(HunterFontId.tacticalGrotesk));
    });

    test('TC-8.3: 10-minute post-registration feedback timer & once-only guard', () async {
      const regTs = 1_700_000_000_000;

      expect(
        PostRegistrationFeedbackDialog.evaluatePopupDelay(
          registrationTimestampMs: null,
          alreadyShown: false,
          nowMs: regTs + 600_000,
        ),
        isNull,
        reason: 'Guest sessions without registration timestamp must not trigger popup',
      );

      final remaining = PostRegistrationFeedbackDialog.evaluatePopupDelay(
        registrationTimestampMs: regTs,
        alreadyShown: false,
        nowMs: regTs + 4 * 60 * 1000,
      );
      expect(remaining, equals(const Duration(minutes: 6)));

      final dueNow = PostRegistrationFeedbackDialog.evaluatePopupDelay(
        registrationTimestampMs: regTs,
        alreadyShown: false,
        nowMs: regTs + 10 * 60 * 1000,
      );
      expect(dueNow, equals(Duration.zero));

      expect(
        PostRegistrationFeedbackDialog.evaluatePopupDelay(
          registrationTimestampMs: regTs,
          alreadyShown: true,
          nowMs: regTs + 15 * 60 * 1000,
        ),
        isNull,
        reason: 'Already shown popup must never re-trigger',
      );

      // Verify storage flags
      expect(await SessionStorage.isPostRegFeedbackShown(), isFalse);
      await SessionStorage.saveRegistrationTimestamp(regTs);
      expect(await SessionStorage.getRegistrationTimestamp(), equals(regTs));
      await SessionStorage.markPostRegFeedbackShown();
      expect(await SessionStorage.isPostRegFeedbackShown(), isTrue);
    });

    test('TC-8.4: Default quest content uses plain understandable words', () {
      for (final q in QuestsNotifier.defaultQuests) {
        final lower = q.description.toLowerCase();
        expect(lower.contains('infuse'), isFalse);
        expect(lower.contains('matrix'), isFalse);
      }
      expect(
        QuestsNotifier.defaultQuests.first.description.toLowerCase(),
        contains('drink'),
      );
    });

    testWidgets('TC-8.5: SettingsScreen displays Theme & Font controls and switches live', (tester) async {
      await tester.pumpWidget(
        const ProviderScope(
          child: MaterialApp(
            home: SettingsScreen(),
          ),
        ),
      );
      await tester.pumpAndSettle();

      expect(find.text('SYSTEM THEME & TYPOGRAPHY'), findsOneWidget);
      expect(find.text('Space Grotesk'), findsOneWidget);
      expect(find.text('JetBrains Mono'), findsOneWidget);

      await tester.tap(find.textContaining('Red').first);
      await tester.pumpAndSettle();
      expect(HunterTheme.activeThemeId, equals(HunterThemeId.crimsonGate));

      await tester.tap(find.text('JetBrains Mono'));
      await tester.pumpAndSettle();
      expect(HunterTheme.activeFontId, equals(HunterFontId.terminalMono));
    });

    testWidgets('TC-8.6: PostRegistrationFeedbackDialog renders and marks shown on dismiss', (tester) async {
      await tester.pumpWidget(
        const ProviderScope(
          child: MaterialApp(
            home: Scaffold(body: PostRegistrationFeedbackDialog()),
          ),
        ),
      );
      await tester.pumpAndSettle();

      expect(find.text('HUNTER SYSTEM RATING'), findsOneWidget);
      expect(find.text('Loving It'), findsOneWidget);
      expect(find.text('MAYBE LATER'), findsOneWidget);

      await tester.tap(find.text('MAYBE LATER'));
      await tester.pumpAndSettle();

      expect(await SessionStorage.isPostRegFeedbackShown(), isTrue);
    });
  });
}
