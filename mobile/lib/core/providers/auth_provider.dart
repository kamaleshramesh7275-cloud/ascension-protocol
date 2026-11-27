import 'package:flutter_riverpod/flutter_riverpod.dart';
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
    checkSession();
  }

  Future<void> checkSession() async {
    if (!mounted) return;
    state = const AsyncValue.loading();
    try {
      final user = await _repo.getProfile();
      if (!mounted) return;
      state = AsyncValue.data(user);
      if (user != null) {
        NotificationService.syncDeviceToken();
      }
    } catch (e, st) {
      if (!mounted) return;
      state = AsyncValue.error(e, st);
    }
  }

  Future<bool> signInWithGoogle() async {
    if (!mounted) return false;
    state = const AsyncValue.loading();
    try {
      final user = await _repo.signInWithGoogle();
      if (!mounted) return user != null;
      state = AsyncValue.data(user);
      if (user != null) {
        NotificationService.syncDeviceToken();
      }
      return user != null;
    } catch (e, st) {
      if (!mounted) return false;
      state = AsyncValue.error(e, st);
      return false;
    }
  }

  Future<bool> loginWithPhone(String phone, String password) async {
    if (!mounted) return false;
    state = const AsyncValue.loading();
    try {
      final user = await _repo.loginWithPhone(phone, password);
      if (!mounted) return user != null;
      state = AsyncValue.data(user);
      if (user != null) {
        NotificationService.syncDeviceToken();
      }
      return user != null;
    } catch (e, st) {
      if (!mounted) return false;
      state = AsyncValue.error(e, st);
      return false;
    }
  }

  Future<bool> registerDirect({
    required String name,
    required String email,
    required String phone,
    required String password,
    String? referralCode,
  }) async {
    if (!mounted) return false;
    state = const AsyncValue.loading();
    try {
      final user = await _repo.registerDirect(
        name: name,
        email: email,
        phone: phone,
        password: password,
        referralCode: referralCode,
      );
      if (!mounted) return user != null;
      state = AsyncValue.data(user);
      if (user != null) {
        NotificationService.syncDeviceToken();
      }
      return user != null;
    } catch (e, st) {
      if (!mounted) return false;
      state = AsyncValue.error(e, st);
      return false;
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
    } catch (e, st) {
      if (!mounted) return false;
      state = AsyncValue.error(e, st);
      return false;
    }
  }

  Future<void> loginGuest() async {
    if (!mounted) return;
    state = const AsyncValue.loading();
    try {
      // Ensure persistent guest UID exists
      final guestUid = await SessionStorage.getOrCreateGuestUid();
      await SessionStorage.saveFirebaseUid(guestUid);

      // Attempt to load profile from backend, with graceful local guest template fallback
      UserModel? user;
      try {
        user = await _repo.getProfile();
      } catch (_) {
        // Fallback local guest template for offline or fresh guest creation
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
      NotificationService.syncDeviceToken();
    } catch (e, st) {
      if (!mounted) return;
      state = AsyncValue.error(e, st);
    }
  }

  /// Live synchronous user state mutation (e.g. from quest completion, focus session, level up)
  void updateUser(UserModel updatedUser) {
    if (!mounted) return;
    state = AsyncValue.data(updatedUser);
  }

  Future<void> logout() async {
    await NotificationService.unregisterDeviceToken();
    await _repo.signOut();
    if (!mounted) return;
    state = const AsyncValue.data(null);
  }
}

final authProvider = StateNotifierProvider<AuthStateNotifier, AsyncValue<UserModel?>>((ref) {
  final repo = ref.watch(authRepositoryProvider);
  return AuthStateNotifier(repo);
});
