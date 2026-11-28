import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

enum HunterThemeId {
  systemAbyss,
  crimsonGate,
  emeraldCitadel,
}

enum HunterFontId {
  cyberRajdhani,
  tacticalGrotesk,
  terminalMono,
}

class HunterPalette {
  final String name;
  final String subtitle;
  final Color abyss;
  final Color surface;
  final Color surfaceLight;
  final Color cyan; // Primary accent
  final Color cyanLight;
  final Color purple; // Secondary accent
  final Color gold;
  final Color crimson;
  final Color emerald;
  final Color emeraldLight;
  final Color textPrimary;
  final Color textMuted;

  const HunterPalette({
    required this.name,
    required this.subtitle,
    required this.abyss,
    required this.surface,
    required this.surfaceLight,
    required this.cyan,
    required this.cyanLight,
    required this.purple,
    required this.gold,
    required this.crimson,
    required this.emerald,
    required this.emeraldLight,
    required this.textPrimary,
    required this.textMuted,
  });
}

class HunterTheme {
  // Palettes
  static const HunterPalette systemAbyssPalette = HunterPalette(
    name: 'System Blue',
    subtitle: 'Classic Solo Leveling Player HUD (Electric Cyan)',
    abyss: Color(0xFF020617),
    surface: Color(0xFF0B132B),
    surfaceLight: Color(0xFF1C2541),
    cyan: Color(0xFF00D2FF), // Iconic Solo Leveling Electric Cyan
    cyanLight: Color(0xFF67E8F9),
    purple: Color(0xFF3B82F6),
    gold: Color(0xFFEAB308),
    crimson: Color(0xFFEF4444),
    emerald: Color(0xFF10B981),
    emeraldLight: Color(0xFF34D399),
    textPrimary: Color(0xFFF8FAFC),
    textMuted: Color(0xFF94A3B8),
  );

  static const HunterPalette crimsonGatePalette = HunterPalette(
    name: 'Red Gate Survival',
    subtitle: 'Bloodstone Obsidian & Red Gate Alert',
    abyss: Color(0xFF0D0406),
    surface: Color(0xFF1A0B10),
    surfaceLight: Color(0xFF2D141C),
    cyan: Color(0xFFEF4444), // Primary is Crimson/Rose
    cyanLight: Color(0xFFFB7185),
    purple: Color(0xFFD946EF), // Fuchsia / Purple accent
    gold: Color(0xFFF59E0B),
    crimson: Color(0xFFE11D48),
    emerald: Color(0xFF10B981),
    emeraldLight: Color(0xFF34D399),
    textPrimary: Color(0xFFFFF1F2),
    textMuted: Color(0xFFD1A3AC),
  );

  static const HunterPalette emeraldCitadelPalette = HunterPalette(
    name: 'Cartenon Temple',
    subtitle: 'Ancient Basalt Stone & Runic Emerald Flame',
    abyss: Color(0xFF040D09),
    surface: Color(0xFF0A1C14),
    surfaceLight: Color(0xFF132F23),
    cyan: Color(0xFF10B981), // Primary is Emerald
    cyanLight: Color(0xFF34D399),
    purple: Color(0xFF06B6D4), // Cyan accent
    gold: Color(0xFFF59E0B),
    crimson: Color(0xFFEF4444),
    emerald: Color(0xFF10B981),
    emeraldLight: Color(0xFF34D399),
    textPrimary: Color(0xFFF0FDF4),
    textMuted: Color(0xFF86A594),
  );

  // Active theme & font runtime pointers
  static HunterPalette _active = systemAbyssPalette;
  static HunterThemeId _activeThemeId = HunterThemeId.systemAbyss;
  static HunterFontId _activeFontId = HunterFontId.cyberRajdhani;

  static HunterThemeId get activeThemeId => _activeThemeId;
  static HunterFontId get activeFontId => _activeFontId;
  static HunterPalette get activePalette => _active;

  static void applyAppearance(HunterThemeId themeId, HunterFontId fontId) {
    _activeThemeId = themeId;
    _activeFontId = fontId;
    switch (themeId) {
      case HunterThemeId.systemAbyss:
        _active = systemAbyssPalette;
        break;
      case HunterThemeId.crimsonGate:
        _active = crimsonGatePalette;
        break;
      case HunterThemeId.emeraldCitadel:
        _active = emeraldCitadelPalette;
        break;
    }
  }

  // Reactive color getters
  static Color get abyss => _active.abyss;
  static Color get surface => _active.surface;
  static Color get surfaceLight => _active.surfaceLight;
  static Color get cyan => _active.cyan;
  static Color get cyanLight => _active.cyanLight;
  static Color get purple => _active.purple;
  static Color get gold => _active.gold;
  static Color get crimson => _active.crimson;
  static Color get emerald => _active.emerald;
  static Color get emeraldLight => _active.emeraldLight;
  static Color get textPrimary => _active.textPrimary;
  static Color get textMuted => _active.textMuted;

  static ThemeData get darkTheme => buildTheme(_activeThemeId, _activeFontId);

  static String fontDisplayName(HunterFontId font) {
    switch (font) {
      case HunterFontId.cyberRajdhani:
        return 'Cyber Rajdhani';
      case HunterFontId.tacticalGrotesk:
        return 'Space Grotesk';
      case HunterFontId.terminalMono:
        return 'JetBrains Mono';
    }
  }

  static String fontSubtitle(HunterFontId font) {
    switch (font) {
      case HunterFontId.cyberRajdhani:
        return 'System HUD + Orbitron titles';
      case HunterFontId.tacticalGrotesk:
        return 'Clean modern geometric sans';
      case HunterFontId.terminalMono:
        return 'Tactical monospace terminal';
    }
  }

  static HunterPalette paletteFor(HunterThemeId themeId) {
    switch (themeId) {
      case HunterThemeId.crimsonGate:
        return crimsonGatePalette;
      case HunterThemeId.emeraldCitadel:
        return emeraldCitadelPalette;
      case HunterThemeId.systemAbyss:
        return systemAbyssPalette;
    }
  }

  static TextStyle baseTextStyle(
    HunterFontId font, {
    bool isDisplay = false,
    double? fontSize,
    FontWeight? fontWeight,
    Color? color,
    double? letterSpacing,
  }) {
    return _themedStyle(
      font,
      isDisplay: isDisplay,
      fontSize: fontSize,
      fontWeight: fontWeight,
      color: color,
      letterSpacing: letterSpacing,
    );
  }

  static TextStyle _themedStyle(
    HunterFontId font, {
    bool isDisplay = false,
    double? fontSize,
    FontWeight? fontWeight,
    Color? color,
    double? letterSpacing,
  }) {
    if (isDisplay && font == HunterFontId.cyberRajdhani) {
      return GoogleFonts.orbitron(
        fontSize: fontSize,
        fontWeight: fontWeight,
        color: color,
        letterSpacing: letterSpacing,
      );
    }
    switch (font) {
      case HunterFontId.tacticalGrotesk:
        return GoogleFonts.spaceGrotesk(
          fontSize: fontSize,
          fontWeight: fontWeight,
          color: color,
          letterSpacing: letterSpacing,
        );
      case HunterFontId.terminalMono:
        return GoogleFonts.jetBrainsMono(
          fontSize: fontSize,
          fontWeight: fontWeight,
          color: color,
          letterSpacing: letterSpacing,
        );
      case HunterFontId.cyberRajdhani:
        return GoogleFonts.rajdhani(
          fontSize: fontSize,
          fontWeight: fontWeight,
          color: color,
          letterSpacing: letterSpacing,
        );
    }
  }

  static TextTheme _buildTextTheme(
    HunterFontId font,
    HunterPalette palette,
    Brightness brightness,
  ) {
    final baseDark = ThemeData(brightness: brightness).textTheme;
    final TextTheme familyTheme;
    switch (font) {
      case HunterFontId.tacticalGrotesk:
        familyTheme = GoogleFonts.spaceGroteskTextTheme(baseDark);
        break;
      case HunterFontId.terminalMono:
        familyTheme = GoogleFonts.jetBrainsMonoTextTheme(baseDark);
        break;
      case HunterFontId.cyberRajdhani:
        familyTheme = GoogleFonts.rajdhaniTextTheme(baseDark);
        break;
    }

    return familyTheme
        .apply(
          bodyColor: palette.textPrimary,
          displayColor: palette.textPrimary,
        )
        .copyWith(
          displayLarge: _themedStyle(
            font,
            isDisplay: true,
            fontSize: 32,
            fontWeight: FontWeight.bold,
            color: palette.textPrimary,
            letterSpacing: 1.5,
          ),
          displayMedium: _themedStyle(
            font,
            isDisplay: true,
            fontSize: 28,
            fontWeight: FontWeight.bold,
            color: palette.textPrimary,
            letterSpacing: 1.2,
          ),
          displaySmall: _themedStyle(
            font,
            isDisplay: true,
            fontSize: 24,
            fontWeight: FontWeight.bold,
            color: palette.textPrimary,
            letterSpacing: 1.0,
          ),
          headlineLarge: _themedStyle(
            font,
            fontSize: 22,
            fontWeight: FontWeight.w700,
            color: palette.textPrimary,
            letterSpacing: 0.8,
          ),
          headlineMedium: _themedStyle(
            font,
            fontSize: 20,
            fontWeight: FontWeight.w700,
            color: palette.textPrimary,
            letterSpacing: 0.6,
          ),
          headlineSmall: _themedStyle(
            font,
            fontSize: 18,
            fontWeight: FontWeight.w600,
            color: palette.textPrimary,
          ),
          titleLarge: _themedStyle(
            font,
            fontSize: 18,
            fontWeight: FontWeight.w700,
            color: palette.textPrimary,
            letterSpacing: 0.8,
          ),
          titleMedium: _themedStyle(
            font,
            fontSize: 16,
            fontWeight: FontWeight.w600,
            color: palette.textPrimary,
          ),
          titleSmall: _themedStyle(
            font,
            fontSize: 14,
            fontWeight: FontWeight.w600,
            color: palette.textPrimary,
          ),
          bodyLarge: _themedStyle(
            font,
            fontSize: 16,
            fontWeight: FontWeight.w500,
            color: palette.textPrimary,
          ),
          bodyMedium: _themedStyle(
            font,
            fontSize: 14,
            fontWeight: FontWeight.normal,
            color: palette.textMuted,
          ),
          bodySmall: _themedStyle(
            font,
            fontSize: 12,
            fontWeight: FontWeight.normal,
            color: palette.textMuted,
          ),
          labelLarge: _themedStyle(
            font,
            fontSize: 14,
            fontWeight: FontWeight.w600,
            color: palette.textPrimary,
          ),
          labelMedium: _themedStyle(
            font,
            fontSize: 12,
            fontWeight: FontWeight.w500,
            color: palette.textMuted,
          ),
          labelSmall: _themedStyle(
            font,
            fontSize: 10,
            fontWeight: FontWeight.w500,
            color: palette.textMuted,
          ),
        );
  }

  static ThemeData buildTheme(HunterThemeId themeId, HunterFontId fontId) {
    final palette = paletteFor(themeId);
    final textTheme = _buildTextTheme(fontId, palette, Brightness.dark);
    final baseFontFamily = _themedStyle(fontId).fontFamily;

    return ThemeData(
      brightness: Brightness.dark,
      fontFamily: baseFontFamily,
      scaffoldBackgroundColor: palette.abyss,
      primaryColor: palette.cyan,
      canvasColor: palette.abyss,
      cardColor: palette.surface,
      dividerColor: palette.surfaceLight,
      colorScheme: ColorScheme.dark(
        primary: palette.cyan,
        secondary: palette.purple,
        surface: palette.surface,
        error: palette.crimson,
        onPrimary: Colors.black,
        onSurface: palette.textPrimary,
      ),
      textTheme: textTheme,
      appBarTheme: AppBarTheme(
        backgroundColor: palette.abyss,
        foregroundColor: palette.textPrimary,
        elevation: 0,
      ),
      dialogTheme: DialogThemeData(
        backgroundColor: palette.surface,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(18),
          side: BorderSide(color: palette.cyan.withValues(alpha: 0.35)),
        ),
      ),
      bottomSheetTheme: BottomSheetThemeData(
        backgroundColor: palette.surface,
        shape: const RoundedRectangleBorder(
          borderRadius: BorderRadius.vertical(top: Radius.circular(22)),
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: palette.abyss,
        hintStyle: TextStyle(color: palette.textMuted),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide(color: palette.surfaceLight),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide(color: palette.cyan, width: 1.5),
        ),
      ),
      dividerTheme: DividerThemeData(
        color: palette.surfaceLight,
        thickness: 1,
      ),
      cardTheme: CardThemeData(
        color: palette.surface,
        elevation: 4,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16),
          side: BorderSide(
            color: palette.cyan.withValues(alpha: 0.2),
            width: 1,
          ),
        ),
      ),
      bottomNavigationBarTheme: BottomNavigationBarThemeData(
        backgroundColor: palette.abyss,
        selectedItemColor: palette.cyan,
        unselectedItemColor: palette.textMuted,
        type: BottomNavigationBarType.fixed,
        elevation: 8,
      ),
    );
  }
}
