import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../theme/hunter_theme.dart';

class AppearanceState {
  final HunterThemeId themeId;
  final HunterFontId fontId;

  const AppearanceState({
    required this.themeId,
    required this.fontId,
  });

  AppearanceState copyWith({
    HunterThemeId? themeId,
    HunterFontId? fontId,
  }) {
    return AppearanceState(
      themeId: themeId ?? this.themeId,
      fontId: fontId ?? this.fontId,
    );
  }
}

class AppearanceNotifier extends StateNotifier<AppearanceState> {
  static const String _keyThemeId = 'hunter_appearance_theme_id';
  static const String _keyFontId = 'hunter_appearance_font_id';
  int _mutationEpoch = 0;

  AppearanceNotifier()
      : super(
          AppearanceState(
            themeId: HunterTheme.activeThemeId,
            fontId: HunterTheme.activeFontId,
          ),
        ) {
    _loadSavedAppearance();
  }

  static Future<void> initStatic() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final savedTheme = prefs.getString(_keyThemeId);
      final savedFont = prefs.getString(_keyFontId);

      HunterThemeId themeId = HunterThemeId.systemAbyss;
      if (savedTheme != null) {
        themeId = HunterThemeId.values.firstWhere(
          (t) => t.name == savedTheme,
          orElse: () => HunterThemeId.systemAbyss,
        );
      }

      HunterFontId fontId = HunterFontId.cyberRajdhani;
      if (savedFont != null) {
        fontId = HunterFontId.values.firstWhere(
          (f) => f.name == savedFont,
          orElse: () => HunterFontId.cyberRajdhani,
        );
      }

      HunterTheme.applyAppearance(themeId, fontId);
    } catch (e) {
      debugPrint('[Appearance] Error initializing static appearance: $e');
    }
  }

  Future<void> _loadSavedAppearance() async {
    final startEpoch = _mutationEpoch;
    try {
      final prefs = await SharedPreferences.getInstance();
      if (!mounted || _mutationEpoch != startEpoch) return;

      final savedTheme = prefs.getString(_keyThemeId);
      final savedFont = prefs.getString(_keyFontId);

      var currentTheme = state.themeId;
      var currentFont = state.fontId;

      if (savedTheme != null) {
        currentTheme = HunterThemeId.values.firstWhere(
          (t) => t.name == savedTheme,
          orElse: () => HunterThemeId.systemAbyss,
        );
      }

      if (savedFont != null) {
        currentFont = HunterFontId.values.firstWhere(
          (f) => f.name == savedFont,
          orElse: () => HunterFontId.cyberRajdhani,
        );
      }

      HunterTheme.applyAppearance(currentTheme, currentFont);
      state = AppearanceState(themeId: currentTheme, fontId: currentFont);
    } catch (_) {}
  }

  Future<void> setTheme(HunterThemeId themeId) async {
    _mutationEpoch++;
    HunterTheme.applyAppearance(themeId, state.fontId);
    state = state.copyWith(themeId: themeId);
    try {
      SystemChrome.setSystemUIOverlayStyle(
        SystemUiOverlayStyle(
          statusBarColor: Colors.transparent,
          statusBarIconBrightness: Brightness.light,
          systemNavigationBarColor: HunterTheme.abyss,
          systemNavigationBarIconBrightness: Brightness.light,
        ),
      );
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString(_keyThemeId, themeId.name);
    } catch (_) {}
  }

  Future<void> setFont(HunterFontId fontId) async {
    _mutationEpoch++;
    HunterTheme.applyAppearance(state.themeId, fontId);
    state = state.copyWith(fontId: fontId);
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString(_keyFontId, fontId.name);
    } catch (_) {}
  }
}

final appearanceProvider =
    StateNotifierProvider<AppearanceNotifier, AppearanceState>((ref) {
  return AppearanceNotifier();
});
