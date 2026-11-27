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
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString(_keyToken, token);
    } catch (_) {}
  }

  static Future<String?> getToken() async {
    String? token;
    try {
      token = await _storage.read(key: _keyToken);
    } catch (_) {}
    if (token == null || token.isEmpty) {
      final prefs = await SharedPreferences.getInstance();
      token = prefs.getString(_keyToken);
    }
    return token;
  }

  // Firebase UID
  static Future<void> saveFirebaseUid(String uid) async {
    await _storage.write(key: _keyFirebaseUid, value: uid);
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString(_keyFirebaseUid, uid);
    } catch (_) {}
  }

  static Future<String?> getFirebaseUid() async {
    String? uid;
    try {
      uid = await _storage.read(key: _keyFirebaseUid);
    } catch (_) {}
    if (uid == null || uid.isEmpty) {
      final prefs = await SharedPreferences.getInstance();
      uid = prefs.getString(_keyFirebaseUid);
    }
    return uid;
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
      final userJson = jsonEncode(user.toJson());
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString(_keyCachedUser, userJson);
      // Double check in secure storage as resilient backup
      await _storage.write(key: _keyCachedUser, value: userJson);
      if (kDebugMode) {
        debugPrint('[SessionStorage] Successfully saved cached user: ${user.id}');
      }
    } catch (e) {
      if (kDebugMode) {
        debugPrint('[SessionStorage] Error saving cached user: $e');
      }
    }
  }

  static Future<UserModel?> getCachedUser() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      var raw = prefs.getString(_keyCachedUser);
      if (raw == null || raw.isEmpty) {
        raw = await _storage.read(key: _keyCachedUser);
      }
      if (raw != null && raw.isNotEmpty) {
        if (kDebugMode) {
          debugPrint('[SessionStorage] Successfully retrieved cached user');
        }
        return UserModel.fromJson(jsonDecode(raw) as Map<String, dynamic>);
      }
    } catch (e) {
      if (kDebugMode) {
        debugPrint('[SessionStorage] Error retrieving cached user: $e');
      }
    }
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
    await prefs.remove(_keyToken);
    await prefs.remove(_keyFirebaseUid);
    await prefs.remove(_keyCachedUser);
    await prefs.remove(_keyCachedQuests);
    await prefs.remove(_keyRegTs);
    if (!kReleaseMode) {
      await prefs.remove(_keyBaseUrl);
    }
  }

  static const String _keyWorkoutDraft = 'active_workout_draft';
  static const String _keyBookmarkedContent = 'bookmarked_content_ids';
  static const String _keyLastArrivalDate = 'last_system_arrival_date';
  static const String _keyFcmToken = 'fcm_device_token';
  static const String _keyRegTs = 'hunter_registration_timestamp';
  static const String _keyPostRegFeedbackShown = 'hunter_post_reg_feedback_shown';

  static Future<void> saveRegistrationTimestamp([int? timestampMs]) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setInt(_keyRegTs, timestampMs ?? DateTime.now().millisecondsSinceEpoch);
  }

  static Future<int?> getRegistrationTimestamp() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getInt(_keyRegTs);
  }

  static Future<bool> isPostRegFeedbackShown() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getBool(_keyPostRegFeedbackShown) ?? false;
  }

  static Future<void> markPostRegFeedbackShown() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool(_keyPostRegFeedbackShown, true);
  }

  static Future<void> saveWorkoutDraft(String draftJson) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_keyWorkoutDraft, draftJson);
  }

  static Future<String?> getWorkoutDraft() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString(_keyWorkoutDraft);
  }

  static Future<void> clearWorkoutDraft() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_keyWorkoutDraft);
  }

  static Future<List<String>> getBookmarkedContentIds() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getStringList(_keyBookmarkedContent) ?? const [];
  }

  static Future<List<String>> toggleBookmarkedContentId(String id) async {
    final prefs = await SharedPreferences.getInstance();
    final current = List<String>.from(prefs.getStringList(_keyBookmarkedContent) ?? const []);
    if (current.contains(id)) {
      current.remove(id);
    } else {
      current.add(id);
    }
    await prefs.setStringList(_keyBookmarkedContent, current);
    return current;
  }

  static Future<String?> getLastArrivalDate() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString(_keyLastArrivalDate);
  }

  static Future<void> saveLastArrivalDate(String yyyyMmDd) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_keyLastArrivalDate, yyyyMmDd);
  }

  static Future<void> saveFcmToken(String token) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_keyFcmToken, token);
  }

  static Future<String?> getFcmToken() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString(_keyFcmToken);
  }

  static Future<void> clearSession() => clear();
}
