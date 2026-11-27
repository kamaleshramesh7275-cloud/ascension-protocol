import 'dart:async';
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import '../api/api_client.dart';
import '../api/api_endpoints.dart';
import '../storage/session_storage.dart';

/// Handles Firebase Cloud Messaging initialization, Android permission prompts,
/// device token registration/unregistration, and notification tap deep-link routes.
class NotificationService {
  static bool _initialized = false;
  static final StreamController<String> _routeController =
      StreamController<String>.broadcast();

  static Stream<String> get routeStream => _routeController.stream;

  /// Safe one-time initialization (no-ops cleanly in headless test environments).
  static Future<void> initialize() async {
    if (_initialized) return;
    _initialized = true;

    try {
      if (Firebase.apps.isEmpty) {
        await Firebase.initializeApp();
      }

      final messaging = FirebaseMessaging.instance;
      await messaging.requestPermission(
        alert: true,
        badge: true,
        sound: true,
      );

      // Listen for token refresh and keep backend synchronized when logged in
      messaging.onTokenRefresh.listen((newToken) async {
        await _registerTokenOnServer(newToken);
      });

      // Handle notification taps from background / terminated launch
      FirebaseMessaging.onMessageOpenedApp.listen((RemoteMessage message) {
        final route = message.data['route']?.toString();
        if (route != null && route.isNotEmpty) {
          _routeController.add(route);
        }
      });

      final initialMessage = await messaging.getInitialMessage();
      final initialRoute = initialMessage?.data['route']?.toString();
      if (initialRoute != null && initialRoute.isNotEmpty) {
        _routeController.add(initialRoute);
      }
    } catch (_) {
      // Safe fallback when Firebase is unavailable (unit tests / emulators without Play Services)
    }
  }

  /// Sync current device FCM token with the backend after user authentication.
  static Future<void> syncDeviceToken() async {
    try {
      await initialize();
      final token = await FirebaseMessaging.instance.getToken();
      if (token != null && token.isNotEmpty) {
        await _registerTokenOnServer(token);
      }
    } catch (_) {}
  }

  static Future<void> _registerTokenOnServer(String token) async {
    try {
      await SessionStorage.saveFcmToken(token);
      final uid = await SessionStorage.getFirebaseUid();
      if (uid == null || uid.isEmpty) return;

      final dio = await ApiClient.getInstance();
      await dio.post(
        ApiEndpoints.pushRegister,
        data: {'token': token},
      );
    } catch (_) {}
  }

  /// Remove the current device token from the backend on logout.
  static Future<void> unregisterDeviceToken() async {
    try {
      final token = await SessionStorage.getFcmToken();
      if (token == null || token.isEmpty) return;
      final dio = await ApiClient.getInstance();
      await dio.delete(
        ApiEndpoints.pushUnregister,
        data: {'token': token},
      );
    } catch (_) {}
  }
}
