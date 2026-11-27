import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../models/gate_shadow_models.dart';
import '../../models/rank_trial_model.dart';
import '../../models/user_model.dart';
import '../../models/weekly_recap_model.dart';
import '../api/api_client.dart';
import '../api/api_endpoints.dart';
import 'auth_provider.dart';

/// Fetches user's pending and completed 48H Rank Promotion Trials (SL-7).
final rankTrialsProvider = FutureProvider<List<RankTrialModel>>((ref) async {
  final dio = await ApiClient.getInstance();
  final res = await dio.get(ApiEndpoints.rankTrials);
  final list = res.data as List? ?? const [];
  return list
      .map((item) => RankTrialModel.fromJson(item as Map<String, dynamic>))
      .toList();
});

/// Fetches 48H Bio-Fatigue & recovery recommendation telemetry (SR-7).
final fatigueProvider = FutureProvider<FatigueTelemetryModel>((ref) async {
  final dio = await ApiClient.getInstance();
  final res = await dio.get(ApiEndpoints.fatigue);
  return FatigueTelemetryModel.fromJson(res.data as Map<String, dynamic>);
});

/// Fetches Shadow Soldier extraction catalog and equipped state (SR-3).
final shadowsProvider = FutureProvider<List<ShadowCatalogItem>>((ref) async {
  final dio = await ApiClient.getInstance();
  final res = await dio.get(ApiEndpoints.shadows);
  final data = res.data as Map<String, dynamic>;
  final catalog = data['catalog'] as List? ?? const [];
  return catalog
      .map((item) => ShadowCatalogItem.fromJson(item as Map<String, dynamic>))
      .toList();
});

/// Fetches Sunday Hunter Weekly Recap Evolution Dossier (SR-5).
final weeklyRecapProvider = FutureProvider<WeeklyRecapModel>((ref) async {
  final dio = await ApiClient.getInstance();
  final res = await dio.get(ApiEndpoints.weeklyRecap);
  return WeeklyRecapModel.fromJson(res.data as Map<String, dynamic>);
});

/// Fetches live Radar Bottleneck diagnosis + 1-tap corrective action.
final bottleneckProvider = FutureProvider<Map<String, dynamic>>((ref) async {
  final dio = await ApiClient.getInstance();
  final res = await dio.get(ApiEndpoints.bottleneck);
  return Map<String, dynamic>.from(res.data as Map);
});

/// Fetches live 4-part Daily Quest Ultimatum status & adaptive warning (#1).
final ultimatumProvider = FutureProvider<Map<String, dynamic>>((ref) async {
  final dio = await ApiClient.getInstance();
  final res = await dio.get(ApiEndpoints.userUltimatum);
  return Map<String, dynamic>.from(res.data as Map);
});

/// Shared System Mechanics action dispatcher that keeps authProvider in sync.
class SystemMechanicsActions {
  static void _syncUserIfPresent(WidgetRef ref, dynamic data) {
    if (data is Map<String, dynamic> && data['user'] is Map<String, dynamic>) {
      final updated = UserModel.fromJson(data['user'] as Map<String, dynamic>);
      ref.read(authProvider.notifier).updateUser(updated);
    }
  }

  static Future<UserModel?> allocateStats(
    WidgetRef ref,
    Map<String, int> allocations,
  ) async {
    final dio = await ApiClient.getInstance();
    final res = await dio.post(
      ApiEndpoints.allocateStats,
      data: {'allocations': allocations},
    );
    _syncUserIfPresent(ref, res.data);
    return ref.read(authProvider).value;
  }

  static Future<void> setAnchorQuest(WidgetRef ref, String questId) async {
    final dio = await ApiClient.getInstance();
    final res = await dio.post(
      ApiEndpoints.anchorQuest,
      data: {'questId': questId},
    );
    _syncUserIfPresent(ref, res.data);
  }

  static Future<bool> clearPenalty(WidgetRef ref) async {
    final dio = await ApiClient.getInstance();
    final res = await dio.post(ApiEndpoints.penaltyClear);
    _syncUserIfPresent(ref, res.data);
    return res.data is Map && res.data['penaltyCleared'] == true;
  }

  static Future<void> markUltimatumAlerted() async {
    try {
      final dio = await ApiClient.getInstance();
      await dio.post(ApiEndpoints.userUltimatumAlerted);
    } catch (_) {}
  }

  static Future<Map<String, dynamic>> claimBossLoot(WidgetRef ref) async {
    final dio = await ApiClient.getInstance();
    final res = await dio.post(ApiEndpoints.bossClaimLoot);
    _syncUserIfPresent(ref, res.data);
    return Map<String, dynamic>.from(res.data as Map);
  }

  static Future<GateEventModel?> checkOrSpawnGate(WidgetRef ref) async {
    final dio = await ApiClient.getInstance();
    final res = await dio.post(ApiEndpoints.gatesCheckSpawn);
    _syncUserIfPresent(ref, res.data);
    if (res.data is Map && res.data['gate'] is Map<String, dynamic>) {
      return GateEventModel.fromJson(res.data['gate'] as Map<String, dynamic>);
    }
    return null;
  }

  static Future<Map<String, dynamic>> claimGate(WidgetRef ref) async {
    final dio = await ApiClient.getInstance();
    final res = await dio.post(ApiEndpoints.gatesClaim);
    _syncUserIfPresent(ref, res.data);
    return Map<String, dynamic>.from(res.data as Map);
  }

  static Future<void> equipShadows(WidgetRef ref, List<String> equippedIds) async {
    final dio = await ApiClient.getInstance();
    final res = await dio.post(
      ApiEndpoints.shadowsEquip,
      data: {'equippedIds': equippedIds},
    );
    _syncUserIfPresent(ref, res.data);
    ref.invalidate(shadowsProvider);
  }

  static Future<void> activateSuperCompensation(WidgetRef ref) async {
    final dio = await ApiClient.getInstance();
    final res = await dio.post(ApiEndpoints.superCompensation);
    _syncUserIfPresent(ref, res.data);
    ref.invalidate(fatigueProvider);
  }

  static Future<Map<String, dynamic>> evolveClass(
    WidgetRef ref, {
    required String mode, // 'job_change' | 'prestige'
  }) async {
    final dio = await ApiClient.getInstance();
    final res = await dio.post(
      ApiEndpoints.evolveClass,
      data: {'mode': mode},
    );
    _syncUserIfPresent(ref, res.data);
    return Map<String, dynamic>.from(res.data as Map);
  }

  static Future<Map<String, dynamic>> injectBottleneckFix(WidgetRef ref) async {
    final dio = await ApiClient.getInstance();
    final res = await dio.post(ApiEndpoints.bottleneckInject);
    ref.invalidate(bottleneckProvider);
    return Map<String, dynamic>.from(res.data as Map);
  }
}
