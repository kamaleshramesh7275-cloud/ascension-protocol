import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:ascension_mobile/core/storage/session_storage.dart';
import 'package:ascension_mobile/models/user_model.dart';
import 'package:ascension_mobile/core/api/api_client.dart';

/// Reusable Test Harness for Ascension Protocol RUT-Standard Architecture
class RutHarness {
  static const UserModel testUser = UserModel(
    id: 'test_hunter_001',
    name: 'Solo Hunter Test',
    email: 'hunter@test.protocol',
    level: 2,
    xp: 140,
    tier: 'D',
    streak: 5,
    coins: 300,
    hunterClass: 'assassin',
    streakShields: 2,
    activeRecoveryDay: false,
    onboardingCompleted: true,
    strength: 25,
    agility: 35,
    stamina: 20,
    vitality: 22,
    intelligence: 30,
    willpower: 28,
    charisma: 18,
  );

  /// Initializes test environment with in-memory keystore & preferences
  static void setupTestEnv() {
    FlutterSecureStorage.setMockInitialValues({});
    SharedPreferences.setMockInitialValues({});
    ApiClient.reset();

    // Install mock test interceptor to satisfy Flutter TestWidgetsFlutterBinding sandbox
    ApiClient.testInterceptor = InterceptorsWrapper(
      onRequest: (options, handler) {
        if (options.path.contains('/api/user') && options.method == 'GET') {
          return handler.resolve(
            Response(requestOptions: options, statusCode: 200, data: testUser.toJson()),
          );
        }
        if (options.path.contains('/api/quests') && options.method == 'GET') {
          return handler.resolve(
            Response(
              requestOptions: options,
              statusCode: 200,
              data: [
                {
                  'id': 'default_1',
                  'title': 'Cellular Hydration Protocol',
                  'description': 'Infuse your matrix with 1.0L water',
                  'rewardXP': 40,
                  'rewardCoins': 20,
                  'completed': false,
                  'type': 'daily',
                  'category': 'fitness',
                  'difficulty': 'E',
                }
              ],
            ),
          );
        }
        if (options.path.contains('/complete') && options.method == 'POST') {
          return handler.resolve(
            Response(
              requestOptions: options,
              statusCode: 200,
              data: {
                'quest': {'id': 'default_1', 'completed': true},
                'user': {
                  'id': 'sync_user',
                  'name': 'Sync Hunter',
                  'email': 'sync@hunter.app',
                  'level': 2,
                  'xp': 120,
                  'coins': 150,
                  'streak': 3,
                  'hunterClass': 'assassin',
                  'tier': 'D',
                  'strength': 20,
                  'agility': 25,
                  'stamina': 15,
                  'vitality': 18,
                  'intelligence': 20,
                  'willpower': 22,
                  'charisma': 14,
                  'streakShields': 1,
                  'activeRecoveryDay': false,
                  'onboardingCompleted': true,
                },
              },
            ),
          );
        }
        if (options.path.contains('/api/debrief')) {
          return handler.resolve(
            Response(requestOptions: options, statusCode: 200, data: {'success': true}),
          );
        }
        if (options.path.contains('/api/focus')) {
          return handler.resolve(
            Response(requestOptions: options, statusCode: 200, data: {'sessionId': 'test_sess_001', 'xpEarned': 100}),
          );
        }
        return handler.next(options);
      },
    );
  }

  /// Builds a wrapped test widget with custom overrides
  static Widget buildTestApp({
    required Widget child,
    List<Override> overrides = const [],
  }) {
    return ProviderScope(
      overrides: overrides,
      child: MaterialApp(
        debugShowCheckedModeBanner: false,
        home: child,
      ),
    );
  }

  /// Clears in-memory test keystore
  static Future<void> resetStorage() async {
    FlutterSecureStorage.setMockInitialValues({});
    SharedPreferences.setMockInitialValues({});
    await SessionStorage.clearSession();
    ApiClient.reset();
  }
}
