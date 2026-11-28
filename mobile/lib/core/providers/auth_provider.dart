import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../api/api_client.dart';
import '../api/auth_repository.dart';
import '../notifications/notification_service.dart';
import '../storage/session_storage.dart';
import '../../models/user_model.dart';

final authRepositoryProvider = Provider<AuthRepository>((ref) {
  return AuthRepository();
});

class AuthStateNotifier extends StateNotifier<AsyncValue<UserModel?>> {
  final AuthRepository _repo;

  AuthStateNotifier(this._repo) : super(const AsyncValue.loading()) {
    ApiClient.onRefreshToken = _repo.refreshTokenSilently;
    checkSession();
  }

  Future<void> checkSession() async {
    if (!mounted) return;
    state = const AsyncValue.loading();
    try {
      // 1. Instant Cache-First Restore: check local cached user and tokens
      final cachedUser = await SessionStorage.getCachedUser();
      final token = await SessionStorage.getToken();
      final uid = await SessionStorage.getFirebaseUid();

      if (kDebugMode) {
        debugPrint('[AuthPersistence] checkSession: cachedUser=${cachedUser?.id}, token=${token != null}, uid=$uid');
      }

      final isGuest = cachedUser != null &&
          (cachedUser.id.startsWith('guest_') ||
              cachedUser.email.endsWith('@ascension.app') ||
              (uid != null && uid.startsWith('guest_')));

      if (cachedUser != null) {
        // Emit cached user immediately so the UI opens without showing the login screen
        state = AsyncValue.data(cachedUser);

        // If guest session, keep local state permanently until explicit logout,
        // and silently ensure a valid server Bearer token is stored.
        if (isGuest) {
          if (kDebugMode) {
            debugPrint('[AuthPersistence] Restored guest session: ${cachedUser.id}');
          }
          if (token == null || token.isEmpty) {
            final guestUid = (uid != null && uid.startsWith('guest_')) ? uid : cachedUser.id;
            try {
              final freshGuest = await _repo.authenticateGuest(guestUid);
              if (freshGuest != null && mounted) {
                state = AsyncValue.data(freshGuest);
              }
            } catch (_) {}
          }
          return;
        }

        // 2. Silently revalidate against server in the background without logging out on failure
        var activeToken = token;
        if (activeToken == null || activeToken.isEmpty) {
          final refreshed = await _repo.refreshTokenSilently();
          if (refreshed != null && refreshed.isNotEmpty) {
            activeToken = refreshed;
          }
        }

        if (activeToken != null && activeToken.isNotEmpty) {
          NotificationService.syncDeviceToken();
          try {
            final freshUser = await _repo.getProfile();
            if (freshUser != null && mounted) {
              state = AsyncValue.data(freshUser);
            }
          } catch (e) {
            // Keep cached user active across app restarts until explicit logout
            if (kDebugMode) {
              debugPrint('[AuthPersistence] Background revalidation skipped/failed (keeping session): $e');
            }
          }
          return;
        }
        return;
      }

      // No cache, check if token exists to fetch fresh profile
      if (token != null && token.isNotEmpty) {
        final user = await _repo.getProfile();
        if (!mounted) return;
        state = AsyncValue.data(user);
        if (user != null) {
          NotificationService.syncDeviceToken();
        }
      } else {
        if (!mounted) return;
        state = const AsyncValue.data(null);
      }
    } catch (e, st) {
      if (!mounted) return;
      if (kDebugMode) {
        debugPrint('[AuthPersistence] checkSession error: $e');
      }
      // In case of transient network error, try to fallback to cached user
      final cached = await SessionStorage.getCachedUser();
      if (cached != null) {
        state = AsyncValue.data(cached);
      } else {
        state = AsyncValue.error(e, st);
      }
    }
  }

  Future<bool> signInWithGoogle() async {
    if (!mounted) return false;
    try {
      final user = await _repo.signInWithGoogle();
      if (!mounted) return user != null;
      if (user != null) {
        state = AsyncValue.data(user);
        NotificationService.syncDeviceToken();
        return true;
      }
      return false;
    } catch (e) {
      if (!mounted) return false;
      rethrow;
    }
  }

  Future<bool> loginWithPhone(String phone, String password) async {
    if (!mounted) return false;
    try {
      final user = await _repo.loginWithPhone(phone, password);
      if (!mounted) return user != null;
      if (user != null) {
        state = AsyncValue.data(user);
        NotificationService.syncDeviceToken();
        return true;
      }
      return false;
    } catch (e) {
      if (!mounted) return false;
      rethrow;
    }
  }

  Future<bool> registerDirect({
    required String name,
    required String email,
    required String phone,
    required String password,
    String? referralCode,
    int? age,
    int? weight,
    int? height,
    String? gender,
    String? occupation,
    String? experienceLevel,
    String? primaryGoal,
  }) async {
    if (!mounted) return false;
    try {
      final user = await _repo.registerDirect(
        name: name,
        email: email,
        phone: phone,
        password: password,
        referralCode: referralCode,
        age: age,
        weight: weight,
        height: height,
        gender: gender,
        occupation: occupation,
        experienceLevel: experienceLevel,
        primaryGoal: primaryGoal,
      );
      if (!mounted) return user != null;
      if (user != null) {
        state = AsyncValue.data(user);
        NotificationService.syncDeviceToken();
        return true;
      }
      return false;
    } catch (e) {
      if (!mounted) return false;
      rethrow;
    }
  }

  Future<bool> completeProfile({required String phone, String? name}) async {
    if (!mounted) return false;
    try {
      final user = await _repo.completeProfile(phone: phone, name: name);
      if (!mounted) return user != null;
      if (user != null) {
        state = AsyncValue.data(user);
        return true;
      }
      return false;
    } catch (e) {
      if (!mounted) return false;
      rethrow;
    }
  }

  Future<void> loginGuest() async {
    if (!mounted) return;
    state = const AsyncValue.loading();
    try {
      // Ensure persistent guest UID exists
      final guestUid = await SessionStorage.getOrCreateGuestUid();
      await SessionStorage.saveFirebaseUid(guestUid);

      // Authenticate guest on server to obtain a real Bearer JWT token
      UserModel? user;
      try {
        user = await _repo.authenticateGuest(guestUid);
      } catch (_) {
        // Fallback local guest template for offline creation
      }

      user ??= UserModel(
        id: guestUid,
        name: 'Guest Ascendant',
        email: '$guestUid@ascension.app',
        level: 1,
        xp: 0,
        tier: 'D',
        streak: 1,
        coins: 100,
        hunterClass: 'assassin',
        streakShields: 1,
        activeRecoveryDay: false,
        onboardingCompleted: true,
        strength: 15,
        agility: 20,
        stamina: 12,
        vitality: 15,
        intelligence: 18,
        willpower: 25,
        charisma: 14,
      );

      await SessionStorage.saveCachedUser(user);
      if (!mounted) return;
      state = AsyncValue.data(user);
    } catch (e, st) {
      if (!mounted) return;
      state = AsyncValue.error(e, st);
    }
  }

  /// Live synchronous user state mutation (e.g. from quest completion, focus session, level up)
  void updateUser(UserModel updatedUser) {
    if (!mounted) return;
    state = AsyncValue.data(updatedUser);
    SessionStorage.saveCachedUser(updatedUser);
  }

  Future<void> logout() async {
    await NotificationService.unregisterDeviceToken();
    await _repo.signOut();
    if (!mounted) return;
    state = const AsyncValue.data(null);
  }

  Future<void> deleteAccount() async {
    await NotificationService.unregisterDeviceToken();
    await _repo.deleteAccount();
    if (!mounted) return;
    state = const AsyncValue.data(null);
  }
}

final authProvider = StateNotifierProvider<AuthStateNotifier, AsyncValue<UserModel?>>((ref) {
  final repo = ref.watch(authRepositoryProvider);
  return AuthStateNotifier(repo);
});
