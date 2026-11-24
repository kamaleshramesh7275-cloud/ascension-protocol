import 'package:dio/dio.dart';
import 'package:google_sign_in/google_sign_in.dart';
import 'api_client.dart';
import 'api_endpoints.dart';
import '../storage/session_storage.dart';
import '../../models/user_model.dart';

class AuthRepository {
  static final GoogleSignIn _googleSignIn = GoogleSignIn(
    serverClientId: '1077180336436-ah94p7rvqirst2htnsfk91peo3tf8tdc.apps.googleusercontent.com',
    scopes: ['email', 'profile'],
  );

  /// Native Android Google Sign-In with ID Token validation
  Future<UserModel?> signInWithGoogle() async {
    try {
      final googleUser = await _googleSignIn.signIn();
      if (googleUser == null) return null; // User cancelled

      final googleAuth = await googleUser.authentication;
      final idToken = googleAuth.idToken;

      if (idToken == null || idToken.isEmpty) {
        throw Exception("Google Sign-In failed: ID token is missing or null.");
      }

      final dio = await ApiClient.getInstance();
      final response = await dio.post(
        ApiEndpoints.authGoogle,
        data: {
          'idToken': idToken,
          'displayName': googleUser.displayName ?? 'Hunter',
          'photoUrl': googleUser.photoUrl,
        },
      );

      if (response.statusCode == 200 && response.data != null) {
        final data = response.data;
        final uid = data['firebaseUid']?.toString() ?? googleUser.id;
        await SessionStorage.saveFirebaseUid(uid);

        // Store ID token for subsequent Bearer requests
        await SessionStorage.saveToken(idToken);

        if (data['user'] != null) {
          final user = UserModel.fromJson(data['user'] as Map<String, dynamic>);
          await SessionStorage.saveCachedUser(user);
          return user;
        }

        return await getProfile();
      }
      return null;
    } catch (e) {
      rethrow;
    }
  }

  /// Direct Phone + Password Login
  Future<UserModel?> loginWithPhone(String phone, String password) async {
    try {
      final dio = await ApiClient.getInstance();
      final response = await dio.post(
        ApiEndpoints.loginPhone,
        data: {
          'phone': phone,
          'password': password,
        },
      );

      if (response.statusCode == 200 && response.data != null) {
        final data = response.data;
        final uid = data['firebaseUid']?.toString() ?? data['userId']?.toString() ?? '';
        await SessionStorage.saveFirebaseUid(uid);
        final token = data['token']?.toString() ?? uid;
        await SessionStorage.saveToken(token);

        if (data['user'] != null) {
          final user = UserModel.fromJson(data['user'] as Map<String, dynamic>);
          await SessionStorage.saveCachedUser(user);
          return user;
        }

        return await getProfile();
      }
      return null;
    } catch (e) {
      rethrow;
    }
  }

  /// Direct Manual Registration (Name, Email, Phone, Password, Referral)
  Future<UserModel?> registerDirect({
    required String name,
    required String email,
    required String phone,
    required String password,
    String? referralCode,
  }) async {
    try {
      final dio = await ApiClient.getInstance();
      final response = await dio.post(
        ApiEndpoints.registerLocal,
        data: {
          'name': name,
          'username': name,
          'email': email,
          'phone': phone,
          'password': password,
          if (referralCode != null && referralCode.isNotEmpty) 'referralCode': referralCode,
        },
      );

      if (response.statusCode == 200 && response.data != null) {
        final data = response.data;
        final uid = data['firebaseUid']?.toString() ?? data['userId']?.toString() ?? '';
        await SessionStorage.saveFirebaseUid(uid);
        final token = data['token']?.toString() ?? uid;
        await SessionStorage.saveToken(token);

        if (data['user'] != null) {
          final user = UserModel.fromJson(data['user'] as Map<String, dynamic>);
          await SessionStorage.saveCachedUser(user);
          return user;
        }

        return await getProfile();
      }
      return null;
    } catch (e) {
      rethrow;
    }
  }

  /// Complete user profile with mandatory phone and optional name
  Future<UserModel?> completeProfile({
    required String phone,
    String? name,
  }) async {
    try {
      final dio = await ApiClient.getInstance();
      final response = await dio.post(
        ApiEndpoints.completeProfile,
        data: {
          'phone': phone,
          if (name != null && name.isNotEmpty) 'name': name,
        },
      );

      if (response.statusCode == 200 && response.data != null) {
        final data = response.data;
        if (data['user'] != null) {
          final user = UserModel.fromJson(data['user'] as Map<String, dynamic>);
          await SessionStorage.saveCachedUser(user);
          return user;
        }
        return await getProfile();
      }
      return null;
    } catch (e) {
      rethrow;
    }
  }

  /// Anonymous guest authentication
  Future<UserModel?> signInAnonymously() async {
    try {
      // In test or non-production environment, issue a test anonymous token
      final anonToken = 'test_token_anon_${DateTime.now().millisecondsSinceEpoch}';
      await SessionStorage.saveToken(anonToken);
      await SessionStorage.saveFirebaseUid('anon_${DateTime.now().millisecondsSinceEpoch}');

      return await getProfile();
    } catch (e) {
      rethrow;
    }
  }

  /// Get current user profile with offline cache support
  Future<UserModel?> getProfile() async {
    try {
      final dio = await ApiClient.getInstance();
      final response = await dio.get(ApiEndpoints.authMe);

      if (response.statusCode == 200 && response.data != null) {
        final user = UserModel.fromJson(response.data as Map<String, dynamic>);
        await SessionStorage.saveCachedUser(user);
        return user;
      }
      return null;
    } on DioException catch (e) {
      if (ApiClient.isOffline(e)) {
        // Safe offline fallback: return cached user
        final cached = await SessionStorage.getCachedUser();
        if (cached != null) return cached;
      }
      // Re-throw genuine server/HTTP errors (401, 500, etc.)
      rethrow;
    }
  }

  /// In-app Account Deletion (Google Play Compliance & SEC-01)
  Future<void> deleteAccount() async {
    final dio = await ApiClient.getInstance();
    await dio.delete(ApiEndpoints.deleteAccount);
    await signOut();
  }

  /// Clean sign-out
  Future<void> signOut() async {
    try {
      await _googleSignIn.signOut();
    } catch (_) {}
    await SessionStorage.clear();
    ApiClient.reset();
  }
}
