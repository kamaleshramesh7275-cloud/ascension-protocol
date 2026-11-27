import 'package:dio/dio.dart';

/// Extracts a human-readable error message from Dio or generic exceptions.
String extractApiError(Object error, [String fallback = 'System communication failed']) {
  if (error is DioException) {
    final data = error.response?.data;
    if (data is Map) {
      final msg = data['error'] ?? data['message'];
      if (msg != null && msg.toString().trim().isNotEmpty) {
        return msg.toString();
      }
    }
    if (data is String && data.trim().isNotEmpty && data.length < 180) {
      return data;
    }
    if (error.message != null && error.message!.trim().isNotEmpty) {
      return error.message!;
    }
  }
  return fallback;
}
