import 'dart:convert';
import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:dio/dio.dart';
import '../api/api_client.dart';

enum SyncOpType {
  completeQuest,
  completeFocus,
  submitDebrief,
}

class PendingOperation {
  final String id; // Unique idempotency UUID
  final SyncOpType type;
  final String endpoint;
  final String method;
  final Map<String, dynamic> payload;
  final DateTime createdAt;

  PendingOperation({
    required this.id,
    required this.type,
    required this.endpoint,
    this.method = 'POST',
    required this.payload,
    required this.createdAt,
  });

  Map<String, dynamic> toJson() => {
    'id': id,
    'type': type.name,
    'endpoint': endpoint,
    'method': method,
    'payload': payload,
    'createdAt': createdAt.toIso8601String(),
  };

  factory PendingOperation.fromJson(Map<String, dynamic> json) => PendingOperation(
    id: json['id'] as String,
    type: SyncOpType.values.byName(json['type'] as String),
    endpoint: json['endpoint'] as String,
    method: json['method'] as String? ?? 'POST',
    payload: Map<String, dynamic>.from(json['payload'] as Map),
    createdAt: DateTime.parse(json['createdAt'] as String),
  );
}

class SyncQueueService {
  static const String _keyQueue = 'pending_operations';
  static bool _isFlushing = false;

  /// Add operation to persistent queue
  static Future<void> enqueue(PendingOperation op) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final list = await getPendingOperations();
      list.add(op);
      final encoded = list.map((item) => item.toJson()).toList();
      await prefs.setString(_keyQueue, jsonEncode(encoded));
    } catch (_) {}
  }

  /// Retrieve all pending operations
  static Future<List<PendingOperation>> getPendingOperations() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final raw = prefs.getString(_keyQueue);
      if (raw != null && raw.isNotEmpty) {
        final decoded = jsonDecode(raw) as List;
        return decoded
            .map((item) => PendingOperation.fromJson(item as Map<String, dynamic>))
            .toList();
      }
    } catch (_) {}
    return [];
  }

  /// Flush pending queue sequentially upon network reconnection
  static Future<void> flushQueue() async {
    if (_isFlushing) return;
    _isFlushing = true;

    try {
      final operations = await getPendingOperations();
      if (operations.isEmpty) {
        _isFlushing = false;
        return;
      }

      final dio = await ApiClient.getInstance();
      final remaining = <PendingOperation>[];

      for (final op in operations) {
        try {
          final options = Options(
            headers: {
              'idempotency-key': op.id,
            },
          );

          Response res;
          if (op.method == 'POST') {
            res = await dio.post(op.endpoint, data: op.payload, options: options);
          } else if (op.method == 'PUT') {
            res = await dio.put(op.endpoint, data: op.payload, options: options);
          } else {
            res = await dio.get(op.endpoint, options: options);
          }

          // 200 or 409 already_completed are treated as successfully synchronized
          if (res.statusCode == 200 || res.statusCode == 409) {
            continue; // Successfully synced, do not keep
          }
        } on DioException catch (e) {
          if (e.response?.statusCode == 409) {
            // Server confirms already completed -> drop from queue
            continue;
          }
          if (ApiClient.isOffline(e)) {
            // Still offline -> keep this and remaining operations
            final currentIdx = operations.indexOf(op);
            remaining.addAll(operations.sublist(currentIdx));
            break;
          }
          // For real 4xx validation failures (not network), drop bad operation to avoid deadlock
          if (e.response != null && e.response!.statusCode! >= 400 && e.response!.statusCode! < 500) {
            continue;
          }
          remaining.add(op);
        } catch (_) {
          remaining.add(op);
        }
      }

      final prefs = await SharedPreferences.getInstance();
      final encoded = remaining.map((item) => item.toJson()).toList();
      await prefs.setString(_keyQueue, jsonEncode(encoded));
    } finally {
      _isFlushing = false;
    }
  }

  /// Listen to connectivity changes to trigger automatic flush
  static void initializeConnectivityListener() {
    Connectivity().onConnectivityChanged.listen((results) {
      final hasConnection = results.any((r) => r != ConnectivityResult.none);
      if (hasConnection) {
        flushQueue();
      }
    });
  }
}
