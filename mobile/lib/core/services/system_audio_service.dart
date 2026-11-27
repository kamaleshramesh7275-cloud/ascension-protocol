import 'dart:async' show unawaited;
import 'package:audioplayers/audioplayers.dart';
import 'package:flutter/services.dart';
import 'package:shared_preferences/shared_preferences.dart';

enum SystemSfxCue {
  ping,
  levelUp,
  alarmRed,
  ariseRumble,
  breachGlitch,
}

enum SystemHapticPattern {
  lightPulse,
  victoryBurst,
  criticalWarning,
}

/// Global Solo Leveling SFX + 3-pattern haptic synthesizer with mute toggle & debounce (#2).
class SystemAudioService {
  static const String _prefMuteKey = 'hunter_sfx_muted';
  static final AudioPlayer _player = AudioPlayer();
  static bool _muted = false;
  static bool _initialized = false;
  static DateTime _lastPlayedAt = DateTime.fromMillisecondsSinceEpoch(0);

  static bool get isMuted => _muted;

  static Future<void> ensureInit() async {
    if (_initialized) return;
    _initialized = true;
    try {
      final prefs = await SharedPreferences.getInstance();
      _muted = prefs.getBool(_prefMuteKey) ?? false;
    } catch (_) {}
  }

  static Future<void> setMuted(bool muted) async {
    _muted = muted;
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setBool(_prefMuteKey, muted);
    } catch (_) {}
  }

  static Future<void> playHaptic(SystemHapticPattern pattern) async {
    try {
      switch (pattern) {
        case SystemHapticPattern.lightPulse:
          await HapticFeedback.selectionClick();
          break;
        case SystemHapticPattern.victoryBurst:
          await HapticFeedback.mediumImpact();
          await Future<void>.delayed(const Duration(milliseconds: 70));
          await HapticFeedback.heavyImpact();
          break;
        case SystemHapticPattern.criticalWarning:
          await HapticFeedback.heavyImpact();
          await Future<void>.delayed(const Duration(milliseconds: 90));
          await HapticFeedback.heavyImpact();
          await Future<void>.delayed(const Duration(milliseconds: 90));
          await HapticFeedback.vibrate();
          break;
      }
    } catch (_) {}
  }

  static String _assetForCue(SystemSfxCue cue) {
    switch (cue) {
      case SystemSfxCue.ping:
        return 'sfx/system_ping.wav';
      case SystemSfxCue.levelUp:
        return 'sfx/level_up.wav';
      case SystemSfxCue.alarmRed:
        return 'sfx/alarm_red.wav';
      case SystemSfxCue.ariseRumble:
        return 'sfx/arise_rumble.wav';
      case SystemSfxCue.breachGlitch:
        return 'sfx/breach_glitch.wav';
    }
  }

  static Future<void> playCue(
    SystemSfxCue cue, {
    SystemHapticPattern? haptic,
  }) async {
    await ensureInit();
    if (haptic != null) {
      // Haptics fire regardless of audio mute for tactile confirmation
      unawaited(playHaptic(haptic));
    }
    if (_muted) return;

    final now = DateTime.now();
    if (now.difference(_lastPlayedAt).inMilliseconds < 400) return;
    _lastPlayedAt = now;

    try {
      await _player.stop();
      await _player.play(AssetSource(_assetForCue(cue)), volume: 0.72);
    } catch (_) {
      // Headless tests or devices without audio sink fall back gracefully to haptics alone
    }
  }
}
