import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';

/// On-device JSON cache with TTL to cut repeated Neon PostgreSQL reads & network transfer.
class LocalCacheService {
  static const _prefix = 'asc_cache_v1_';
  static const _tsPrefix = 'asc_cache_ts_v1_';

  static Future<void> setJson(String key, dynamic data) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString('$_prefix$key', jsonEncode(data));
      await prefs.setInt('$_tsPrefix$key', DateTime.now().millisecondsSinceEpoch);
    } catch (_) {}
  }

  static Future<dynamic> getJson(String key, {Duration maxAge = const Duration(minutes: 10)}) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final ts = prefs.getInt('$_tsPrefix$key');
      final raw = prefs.getString('$_prefix$key');
      if (raw == null || ts == null) return null;
      final ageMs = DateTime.now().millisecondsSinceEpoch - ts;
      if (ageMs > maxAge.inMilliseconds) return null;
      return jsonDecode(raw);
    } catch (_) {
      return null;
    }
  }

  static Future<void> invalidate(String key) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.remove('$_prefix$key');
      await prefs.remove('$_tsPrefix$key');
    } catch (_) {}
  }

  static Future<void> clearAll() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      for (final k in prefs.getKeys().toList()) {
        if (k.startsWith(_prefix) || k.startsWith(_tsPrefix)) {
          await prefs.remove(k);
        }
      }
    } catch (_) {}
  }
}
