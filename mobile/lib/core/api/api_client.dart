import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import 'api_endpoints.dart';
import '../storage/session_storage.dart';
import '../services/feedback_diagnostics_service.dart';

class ApiClient {
  static Dio? _dio;
  static String? _cachedBaseUrl;
  static VoidCallback? onAuthenticationRequired;
  static Future<String?> Function()? onRefreshToken;
  static Interceptor? testInterceptor;

  static void reset() {
    _dio?.close();
    _dio = null;
    _cachedBaseUrl = null;
    testInterceptor = null;
  }

  /// Strict offline error discriminator
  /// Only real network transmission/connection failures are treated as offline.
  /// Any HTTP 4xx or 5xx status code is a real server response, NEVER offline.
  static bool isOffline(DioException e) {
    if (e.response != null) return false;
    return e.type == DioExceptionType.connectionTimeout ||
        e.type == DioExceptionType.sendTimeout ||
        e.type == DioExceptionType.receiveTimeout ||
        e.type == DioExceptionType.connectionError;
  }

  static String _getDeviceTimezone() {
    try {
      final name = DateTime.now().timeZoneName;
      if (name.isNotEmpty) return name;
    } catch (_) {}
    return 'UTC';
  }

  static Future<Dio> getInstance() async {
    final customBaseUrl = await SessionStorage.getCustomBaseUrl();
    final baseUrl = (!kReleaseMode && customBaseUrl != null && customBaseUrl.isNotEmpty)
        ? customBaseUrl
        : ApiEndpoints.defaultBaseUrl;

    if (_dio != null && _cachedBaseUrl == baseUrl) {
      return _dio!;
    }

    _cachedBaseUrl = baseUrl;
    _dio = Dio(
      BaseOptions(
        baseUrl: baseUrl,
        connectTimeout: const Duration(seconds: 15),
        receiveTimeout: const Duration(seconds: 15),
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      ),
    );

    _dio!.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) async {
          // 1. Strictly attach Bearer token (x-firebase-uid is eliminated per contract)
          var token = await SessionStorage.getToken();
          if ((token == null || token.isEmpty) && onRefreshToken != null) {
            // Proactively obtain or refresh token before sending request
            token = await onRefreshToken!.call();
          }
          if (token != null && token.isNotEmpty) {
            options.headers['Authorization'] = 'Bearer $token';
          }

          // 2. Attach X-Timezone header
          options.headers['X-Timezone'] = _getDeviceTimezone();

          return handler.next(options);
        },
        onError: (DioException e, handler) async {
          // Record non-sensitive error summary for bug report diagnostics
          FeedbackDiagnosticsService.recordError(
            message: e.message ?? e.type.name,
            endpoint: e.requestOptions.path,
            statusCode: e.response?.statusCode,
          );

          // Handle 401 token expiration or missing token via silent refresh without wiping persistent local session
          if (e.response?.statusCode == 401 &&
              e.requestOptions.extra['retry_count'] == null) {
            final data = e.response?.data;
            final isTokenError = !e.requestOptions.headers.containsKey('Authorization') ||
                (data is Map &&
                    (data['code'] == 'token_expired' ||
                        data['code'] == 'invalid_token' ||
                        (data['error']?.toString().toLowerCase().contains('token') ?? false) ||
                        (data['error']?.toString().toLowerCase().contains('authorization') ?? false) ||
                        (data['message']?.toString().toLowerCase().contains('token') ?? false))) ||
                (data is String &&
                    (data.toLowerCase().contains('token') ||
                        data.toLowerCase().contains('authorization')));

            if ((isTokenError || data == null) && onRefreshToken != null) {
              e.requestOptions.extra['retry_count'] = 1;
              final refreshedToken = await onRefreshToken!.call();
              if (refreshedToken != null && refreshedToken.isNotEmpty) {
                e.requestOptions.headers['Authorization'] = 'Bearer $refreshedToken';
                try {
                  final retryResponse = await _dio!.fetch(e.requestOptions);
                  return handler.resolve(retryResponse);
                } catch (retryError) {
                  if (retryError is DioException) {
                    return handler.next(retryError);
                  }
                }
              }
            }
          }

          return handler.next(e);
        },
      ),
    );

    if (testInterceptor != null) {
      _dio!.interceptors.add(testInterceptor!);
    }

    return _dio!;
  }
}
