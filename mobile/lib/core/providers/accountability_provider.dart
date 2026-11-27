import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../models/accountability_models.dart';
import '../api/api_client.dart';
import '../api/api_endpoints.dart';

class AccountabilityState {
  final CommitmentContractModel? activeContract;
  final Map<String, dynamic>? suggestedContract;
  final List<PeerCovenantModel> covenants;
  final List<PublicCommitmentModel> publicCommitments;
  final List<HallOfAscensionEntry> hallEntries;
  final List<WallOfConsequenceEntry> wallEntries;
  final bool loading;

  const AccountabilityState({
    this.activeContract,
    this.suggestedContract,
    this.covenants = const [],
    this.publicCommitments = const [],
    this.hallEntries = const [],
    this.wallEntries = const [],
    this.loading = false,
  });
}

final accountabilityProvider =
    StateNotifierProvider<AccountabilityNotifier, AccountabilityState>((ref) {
  return AccountabilityNotifier();
});

class AccountabilityNotifier extends StateNotifier<AccountabilityState> {
  AccountabilityNotifier() : super(const AccountabilityState()) {
    loadAll();
  }

  Future<void> loadAll() async {
    state = AccountabilityState(
      activeContract: state.activeContract,
      suggestedContract: state.suggestedContract,
      covenants: state.covenants,
      publicCommitments: state.publicCommitments,
      hallEntries: state.hallEntries,
      wallEntries: state.wallEntries,
      loading: true,
    );

    try {
      final dio = await ApiClient.getInstance();
      final results = await Future.wait([
        dio.get(ApiEndpoints.commitmentContract),
        dio.get(ApiEndpoints.covenantsActive),
        dio.get(ApiEndpoints.publicCommitments),
        dio.get(ApiEndpoints.hallOfAscension),
        dio.get(ApiEndpoints.wallOfConsequence),
      ]);

      final contractPayload = results[0].data as Map<String, dynamic>? ?? const {};
      final rawContract = contractPayload['contract'];
      final contract = rawContract is Map<String, dynamic>
          ? CommitmentContractModel.fromJson(rawContract)
          : null;
      final suggested = contractPayload['suggested'] is Map
          ? Map<String, dynamic>.from(contractPayload['suggested'] as Map)
          : null;

      final covenants = (results[1].data as List? ?? const [])
          .map((e) => PeerCovenantModel.fromJson(e as Map<String, dynamic>))
          .toList();
      final publics = (results[2].data as List? ?? const [])
          .map((e) => PublicCommitmentModel.fromJson(e as Map<String, dynamic>))
          .toList();
      final hall = (results[3].data as List? ?? const [])
          .map((e) => HallOfAscensionEntry.fromJson(e as Map<String, dynamic>))
          .toList();
      final wall = (results[4].data as List? ?? const [])
          .map((e) => WallOfConsequenceEntry.fromJson(e as Map<String, dynamic>))
          .toList();

      if (mounted) {
        state = AccountabilityState(
          activeContract: contract,
          suggestedContract: suggested,
          covenants: covenants,
          publicCommitments: publics,
          hallEntries: hall,
          wallEntries: wall,
          loading: false,
        );
      }
    } catch (_) {
      if (mounted) {
        state = AccountabilityState(
          activeContract: state.activeContract,
          suggestedContract: state.suggestedContract,
          covenants: state.covenants,
          publicCommitments: state.publicCommitments,
          hallEntries: state.hallEntries,
          wallEntries: state.wallEntries,
          loading: false,
        );
      }
    }
  }

  Future<void> signWeeklyContract({
    required String weekStartDate,
    required String weekEndDate,
    required int targetMissionsCount,
    required int targetFocusMinutes,
    required int stakeAmountCents,
    String? antiCharityRecipient,
  }) async {
    final dio = await ApiClient.getInstance();
    await dio.post(
      ApiEndpoints.commitmentContract,
      data: {
        'weekStartDate': weekStartDate,
        'weekEndDate': weekEndDate,
        'targetMissionsCount': targetMissionsCount,
        'targetFocusMinutes': targetFocusMinutes,
        'stakeAmountCents': stakeAmountCents,
        if (antiCharityRecipient != null && antiCharityRecipient.isNotEmpty)
          'antiCharityRecipient': antiCharityRecipient,
      },
    );
    await loadAll();
  }

  Future<Map<String, dynamic>> evaluateWeeklyContract() async {
    final dio = await ApiClient.getInstance();
    final res = await dio.post(ApiEndpoints.commitmentContractEvaluate);
    await loadAll();
    return Map<String, dynamic>.from(res.data as Map);
  }

  Future<PeerCovenantModel?> createCovenant({
    required int termsDays,
    required int stakeCoins,
    required String protocolObjective,
  }) async {
    final dio = await ApiClient.getInstance();
    final res = await dio.post(
      ApiEndpoints.covenantsCreate,
      data: {
        'termsDays': termsDays,
        'stakeCoins': stakeCoins,
        'protocolObjective': protocolObjective,
      },
    );
    await loadAll();
    if (res.data is Map && res.data['covenant'] is Map<String, dynamic>) {
      return PeerCovenantModel.fromJson(
          res.data['covenant'] as Map<String, dynamic>);
    }
    return null;
  }

  Future<PeerCovenantModel?> acceptCovenant(String code) async {
    final dio = await ApiClient.getInstance();
    final res = await dio.post(
      ApiEndpoints.covenantAccept(code.trim().toUpperCase()),
    );
    await loadAll();
    if (res.data is Map && res.data['covenant'] is Map<String, dynamic>) {
      return PeerCovenantModel.fromJson(
          res.data['covenant'] as Map<String, dynamic>);
    }
    return null;
  }

  Future<void> declarePublicOath({
    required String declaration,
    required DateTime targetDeadline,
  }) async {
    final dio = await ApiClient.getInstance();
    await dio.post(
      ApiEndpoints.publicCommitments,
      data: {
        'declaration': declaration,
        'targetDeadline': targetDeadline.toIso8601String(),
      },
    );
    await loadAll();
  }

  Future<void> witnessOath(String id) async {
    final dio = await ApiClient.getInstance();
    await dio.post(ApiEndpoints.witnessCommitment(id));
    await loadAll();
  }
}
