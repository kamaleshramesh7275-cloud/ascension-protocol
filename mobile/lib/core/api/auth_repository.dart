import 'package:google_sign_in/google_sign_in.dart';
import 'api_client.dart';
import 'api_endpoints.dart';
import '../storage/session_storage.dart';
import '../../models/user_model.dart';

class AuthRepository {
  // Configured with Ascension Protocol Google Web Client ID
  static final GoogleSignIn _googleSignIn = GoogleSignIn(
    serverClientId: '1077180336436-ah94p7rvqirst2htnsfk91peo3tf8tdc.apps.googleusercontent.com',
    scopes: ['email', 'profile'],
  );

  /// 1-Tap Native Android Google Sign-In
  Future<UserModel?> signInWithGoogle() async {
    try {
      final googleUser = await _googleSignIn.signIn();
      if (googleUser == null) return null; // User cancelled

      final googleAuth = await googleUser.authentication;
      final idToken = googleAuth.idToken;

      if (idToken == null) {
        throw Exception('Failed to obtain Google ID Token.');
      }

      final dio = await ApiClient.getInstance();
      final response = await dio.post(
        ApiEndpoints.authGoogle,
        data: {'idToken': idToken},
      );

      if (response.statusCode == 200 && response.data != null) {
        final data = response.data;
        final token = data['token']?.toString();
        if (token != null) {
          await SessionStorage.saveToken(token);
        }

        final userJson = data['user'] ?? data;
        return UserModel.fromJson(userJson);
      }
      return null;
    } catch (e) {
      rethrow;
    }
  }

  /// Fetch authenticated hunter profile
  Future<UserModel?> getProfile() async {
    try {
      final token = await SessionStorage.getToken();
      if (token == null || token.isEmpty) return null;

      final dio = await ApiClient.getInstance();
      final response = await dio.get(ApiEndpoints.authMe);

      if (response.statusCode == 200 && response.data != null) {
        final userJson = response.data['user'] ?? response.data;
        return UserModel.fromJson(userJson);
      }
      return null;
    } catch (_) {
      return null;
    }
  }

  /// Sign out
  Future<void> signOut() async {
    try {
      await _googleSignIn.signOut();
    } catch (_) {}
    await SessionStorage.clearSession();
  }
}
