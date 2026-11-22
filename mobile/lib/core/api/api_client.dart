import 'package:dio/dio.dart';
import 'api_endpoints.dart';
import '../storage/session_storage.dart';

class ApiClient {
  static Dio? _dio;

  static Future<Dio> getInstance() async {
    if (_dio != null) return _dio!;

    final customBaseUrl = await SessionStorage.getCustomBaseUrl();
    final baseUrl = (customBaseUrl != null && customBaseUrl.isNotEmpty)
        ? customBaseUrl
        : ApiEndpoints.defaultBaseUrl;

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
          final token = await SessionStorage.getToken();
          if (token != null && token.isNotEmpty) {
            options.headers['Authorization'] = 'Bearer $token';
          }
          return handler.next(options);
        },
        onError: (DioException e, handler) {
          // Centralized error handling & retry
          return handler.next(e);
        },
      ),
    );

    return _dio!;
  }
}
