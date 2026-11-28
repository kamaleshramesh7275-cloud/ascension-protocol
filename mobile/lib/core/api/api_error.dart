import 'package:dio/dio.dart';

/// Extracts a human-readable error message from Dio or generic exceptions.
String extractApiError(Object error, [String fallback = 'System communication failed']) {
  if (error is DioException) {
    final data = error.response?.data;
    if (data is Map) {
      final msg = data['error'] ?? data['message'];
      if (msg != null && msg.toString().trim().isNotEmpty) {
        final str = msg.toString().trim();
        if (str.toLowerCase().contains('authorization header') ||
            str.toLowerCase().contains('bearer token required') ||
            str.toLowerCase().contains('invalid firebase token') ||
            str.toLowerCase().contains('token expired')) {
          return 'Authentication required. Please sign in to synchronize.';
        }
        return str;
      }
    }
    if (data is String && data.trim().isNotEmpty && data.length < 180) {
      final str = data.trim();
      if (str.toLowerCase().contains('authorization header') ||
          str.toLowerCase().contains('bearer token required') ||
          str.toLowerCase().contains('invalid firebase token') ||
          str.toLowerCase().contains('token expired')) {
        return 'Authentication required. Please sign in to synchronize.';
      }
      return str;
    }
    if (error.message != null && error.message!.trim().isNotEmpty) {
      return error.message!;
    }
  }
  return fallback;
}
