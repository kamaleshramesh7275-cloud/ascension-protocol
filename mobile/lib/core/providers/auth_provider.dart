import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../api/auth_repository.dart';
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
    state = const AsyncValue.loading();
    try {
      final user = await _repo.getProfile();
      state = AsyncValue.data(user);
    } catch (e, st) {
      state = AsyncValue.error(e, st);
    }
  }

  Future<bool> signInWithGoogle() async {
    state = const AsyncValue.loading();
    try {
      final user = await _repo.signInWithGoogle();
      state = AsyncValue.data(user);
      return user != null;
    } catch (e, st) {
      state = AsyncValue.error(e, st);
      return false;
    }
  }

  void loginGuest() {
    const guestUser = UserModel(
      id: 'hunter_guest',
      name: 'Hunter Shadow',
      email: 'guest@ascension.app',
      level: 1,
      xp: 0,
      tier: 'E',
      streak: 1,
      coins: 100,
      hunterClass: 'Assassin',
      streakShields: 1,
      activeRecoveryDay: false,
      strength: 15,
      agility: 20,
      stamina: 12,
      vitality: 15,
      intelligence: 18,
      willpower: 25,
      charisma: 14,
    );
    state = const AsyncValue.data(guestUser);
  }

  Future<void> logout() async {
    await _repo.signOut();
    state = const AsyncValue.data(null);
  }
}

final authProvider = StateNotifierProvider<AuthStateNotifier, AsyncValue<UserModel?>>((ref) {
  final repo = ref.watch(authRepositoryProvider);
  return AuthStateNotifier(repo);
});
