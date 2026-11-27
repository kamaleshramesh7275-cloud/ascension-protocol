import 'dart:collection';
import 'dart:io';

/// Lightweight in-memory diagnostics ring buffer for bug & error reports.
/// Stores only sanitized error summaries and screen breadcrumbs (no tokens/PII).
class FeedbackDiagnosticsService {
  static const String appVersion = '1.0.4+42';
  static const int _maxErrors = 10;

  static String _currentScreen = 'Unknown';
  static final ListQueue<Map<String, dynamic>> _recentErrors = ListQueue<Map<String, dynamic>>();

  static String get currentScreen => _currentScreen;
  static List<Map<String, dynamic>> get recentErrors => _recentErrors.toList(growable: false);

  static void setCurrentScreen(String screenName) {
    if (screenName.trim().isNotEmpty) {
      _currentScreen = screenName.trim();
    }
  }

  static void recordError({
    required String message,
    String? endpoint,
    int? statusCode,
  }) {
    final sanitized = message
        .replaceAll(RegExp(r'Bearer\s+[A-Za-z0-9._-]+', caseSensitive: false), 'Bearer [REDACTED]')
        .trim();
    if (sanitized.isEmpty) return;

    if (_recentErrors.length >= _maxErrors) {
      _recentErrors.removeFirst();
    }
    _recentErrors.addLast({
      'time': DateTime.now().toUtc().toIso8601String(),
      'message': sanitized.length > 280 ? sanitized.substring(0, 280) : sanitized,
      if (endpoint != null && endpoint.isNotEmpty) 'endpoint': endpoint,
      'statusCode': ?statusCode,
    });
  }

  static Map<String, dynamic> buildPayload({String? screenOverride}) {
    String os = 'unknown';
    String osVersion = 'unknown';
    try {
      os = Platform.operatingSystem;
      osVersion = Platform.operatingSystemVersion;
    } catch (_) {}

    return {
      'appVersion': appVersion,
      'os': os,
      'osVersion': osVersion.length > 120 ? osVersion.substring(0, 120) : osVersion,
      'currentScreen': screenOverride ?? _currentScreen,
      'recentErrors': _recentErrors.toList(growable: false),
    };
  }
}
