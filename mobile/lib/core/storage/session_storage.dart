import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../../models/user_model.dart';
import '../../models/quest_model.dart';

class SessionStorage {
  static const _storage = FlutterSecureStorage();
  static const String _keyToken = 'hunter_jwt_token';
  static const String _keyFirebaseUid = 'hunter_firebase_uid';
  static const String _keyBaseUrl = 'hunter_custom_base_url';
  static const String _keyCachedUser = 'hunter_cached_user';
  static const String _keyCachedQuests = 'hunter_cached_quests';

  // Secure Token
  static Future<void> saveToken(String token) async {
    await _storage.write(key: _keyToken, value: token);
  }

  static Future<String?> getToken() async {
    return await _storage.read(key: _keyToken);
  }

  // Firebase UID
  static Future<void> saveFirebaseUid(String uid) async {
    await _storage.write(key: _keyFirebaseUid, value: uid);
  }

  static Future<String?> getFirebaseUid() async {
    return await _storage.read(key: _keyFirebaseUid);
  }

  // Backward-compatible Guest UID accessor
  static Future<String> getOrCreateGuestUid() async {
    final existing = await getFirebaseUid();
    if (existing != null && existing.isNotEmpty) return existing;
    final guestUid = 'guest_${DateTime.now().millisecondsSinceEpoch}';
    await saveFirebaseUid(guestUid);
    return guestUid;
  }

  // Base URL (Strictly disabled in release mode to prevent MITM/tampering)
  static Future<void> saveCustomBaseUrl(String url) async {
    if (kReleaseMode) return;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_keyBaseUrl, url);
  }

  static Future<void> setCustomBaseUrl(String url) => saveCustomBaseUrl(url);

  static Future<String?> getCustomBaseUrl() async {
    if (kReleaseMode) return null;
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString(_keyBaseUrl);
  }

  // Offline Caching for User Profile
  static Future<void> saveCachedUser(UserModel user) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString(_keyCachedUser, jsonEncode(user.toJson()));
    } catch (_) {}
  }

  static Future<UserModel?> getCachedUser() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final raw = prefs.getString(_keyCachedUser);
      if (raw != null && raw.isNotEmpty) {
        return UserModel.fromJson(jsonDecode(raw) as Map<String, dynamic>);
      }
    } catch (_) {}
    return null;
  }

  // Offline Caching for Quests
  static Future<void> saveCachedQuests(List<QuestModel> quests) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final rawList = quests.map((q) => q.toJson()).toList();
      await prefs.setString(_keyCachedQuests, jsonEncode(rawList));
    } catch (_) {}
  }

  static Future<List<QuestModel>?> getCachedQuests() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final raw = prefs.getString(_keyCachedQuests);
      if (raw != null && raw.isNotEmpty) {
        final decoded = jsonDecode(raw) as List;
        return decoded.map((item) => QuestModel.fromJson(item as Map<String, dynamic>)).toList();
      }
    } catch (_) {}
    return null;
  }

  // Complete Session Cleanup (Logout / Account Deletion)
  static Future<void> clear() async {
    await _storage.deleteAll();
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_keyCachedUser);
    await prefs.remove(_keyCachedQuests);
    if (!kReleaseMode) {
      await prefs.remove(_keyBaseUrl);
    }
  }

  static Future<void> clearSession() => clear();
}
