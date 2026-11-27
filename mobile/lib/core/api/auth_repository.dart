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

        // Prefer long-lived server session token over short-lived 1h Google ID token
        final serverToken = data['token']?.toString();
        await SessionStorage.saveToken(
          (serverToken != null && serverToken.isNotEmpty) ? serverToken : idToken,
        );

        if (data['isNewUser'] == true && !(await SessionStorage.isPostRegFeedbackShown())) {
          final existingTs = await SessionStorage.getRegistrationTimestamp();
          if (existingTs == null) {
            await SessionStorage.saveRegistrationTimestamp();
          }
        }

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
        await SessionStorage.saveRegistrationTimestamp();

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
    int? age,
    int? weight,
    int? height,
    String? gender,
    String? occupation,
    String? experienceLevel,
    String? primaryGoal,
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
          'age': ?age,
          'weight': ?weight,
          'height': ?height,
          'gender': ?gender,
          'occupation': ?occupation,
          'experienceLevel': ?experienceLevel,
          if (primaryGoal != null && primaryGoal.isNotEmpty) 'primaryGoal': primaryGoal,
        },
      );

      if (response.statusCode == 200 && response.data != null) {
        final data = response.data;
        final uid = data['firebaseUid']?.toString() ?? data['userId']?.toString() ?? '';
        await SessionStorage.saveFirebaseUid(uid);
        final token = data['token']?.toString() ?? uid;
        await SessionStorage.saveToken(token);
        await SessionStorage.saveRegistrationTimestamp();

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

  /// Guest authentication backed by signed server JWT
  Future<UserModel?> authenticateGuest(String guestUid) async {
    try {
      final dio = await ApiClient.getInstance();
      final response = await dio.post(
        ApiEndpoints.loginGuest,
        data: {'guestUid': guestUid},
      );

      if (response.statusCode == 200 && response.data != null) {
        final data = response.data;
        final uid = data['firebaseUid']?.toString() ?? guestUid;
        await SessionStorage.saveFirebaseUid(uid);
        final token = data['token']?.toString();
        if (token != null && token.isNotEmpty) {
          await SessionStorage.saveToken(token);
        }
        if (data['user'] is Map<String, dynamic>) {
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

  /// Unified silent token refresh (handles both Guest and Google sessions)
  Future<String?> refreshTokenSilently() async {
    final cached = await SessionStorage.getCachedUser();
    final uid = await SessionStorage.getFirebaseUid();
    final isGuest = (cached != null &&
            (cached.id.startsWith('guest_') ||
                cached.email.endsWith('@ascension.app'))) ||
        (uid != null && uid.startsWith('guest_'));

    if (isGuest) {
      final guestId = (uid != null && uid.startsWith('guest_'))
          ? uid
          : (cached?.id ?? await SessionStorage.getOrCreateGuestUid());
      try {
        await authenticateGuest(guestId);
        return await SessionStorage.getToken();
      } catch (_) {
        return null;
      }
    }

    return await refreshGoogleTokenSilently();
  }

  /// Silent Google token refresh & server JWT exchange if session expired
  Future<String?> refreshGoogleTokenSilently() async {
    try {
      final googleUser = await _googleSignIn.signInSilently();
      if (googleUser != null) {
        final auth = await googleUser.authentication;
        final idToken = auth.idToken;
        if (idToken != null && idToken.isNotEmpty) {
          try {
            final dio = await ApiClient.getInstance();
            final res = await dio.post(
              ApiEndpoints.authGoogle,
              data: {
                'idToken': idToken,
                'displayName': googleUser.displayName ?? 'Hunter',
                'photoUrl': googleUser.photoUrl,
              },
            );
            if (res.statusCode == 200 && res.data != null) {
              final data = res.data;
              final uid = data['firebaseUid']?.toString() ?? googleUser.id;
              await SessionStorage.saveFirebaseUid(uid);
              final serverToken = data['token']?.toString();
              final finalToken =
                  (serverToken != null && serverToken.isNotEmpty) ? serverToken : idToken;
              await SessionStorage.saveToken(finalToken);
              if (data['user'] is Map<String, dynamic>) {
                await SessionStorage.saveCachedUser(
                  UserModel.fromJson(data['user'] as Map<String, dynamic>),
                );
              }
              return finalToken;
            }
          } catch (_) {}

          await SessionStorage.saveToken(idToken);
          await SessionStorage.saveFirebaseUid(googleUser.id);
          return idToken;
        }
      }
    } catch (_) {}
    return null;
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
      if (e.response?.statusCode == 401) {
        // Attempt silent Google refresh in case idToken expired
        final refreshedToken = await refreshGoogleTokenSilently();
        if (refreshedToken != null) {
          try {
            final dio = await ApiClient.getInstance();
            final retryResponse = await dio.get(ApiEndpoints.authMe);
            if (retryResponse.statusCode == 200 && retryResponse.data != null) {
              final user = UserModel.fromJson(retryResponse.data as Map<String, dynamic>);
              await SessionStorage.saveCachedUser(user);
              return user;
            }
          } catch (_) {}
        }
      }

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
