import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../models/division_models.dart';
import '../api/api_client.dart';
import '../api/api_endpoints.dart';
import 'auth_provider.dart';

class DivisionState {
  final DivisionPodModel? pod;
  final bool loading;

  const DivisionState({this.pod, this.loading = false});
}

final divisionsProvider =
    StateNotifierProvider<DivisionsNotifier, DivisionState>((ref) {
  return DivisionsNotifier(ref);
});

class DivisionsNotifier extends StateNotifier<DivisionState> {
  final Ref _ref;

  DivisionsNotifier(this._ref) : super(const DivisionState()) {
    loadDivision();
  }

  Future<void> loadDivision() async {
    state = DivisionState(pod: state.pod, loading: true);
    try {
      final dio = await ApiClient.getInstance();
      final res = await dio.get(ApiEndpoints.divisionsCurrent);
      if (res.data is Map<String, dynamic> && mounted) {
        final pod = DivisionPodModel.fromJson(res.data as Map<String, dynamic>);
        state = DivisionState(pod: pod, loading: false);

        final currentUser = _ref.read(authProvider).value;
        if (currentUser != null && currentUser.divisionTier != pod.divisionTier) {
          _ref.read(authProvider.notifier).updateUser(
                currentUser.copyWith(divisionTier: pod.divisionTier),
              );
        }
        return;
      }
    } catch (_) {}
    if (mounted) state = DivisionState(pod: state.pod, loading: false);
  }

  Future<void> acknowledgeOutcome(String memberId) async {
    try {
      final dio = await ApiClient.getInstance();
      await dio.post(
        ApiEndpoints.divisionsAcknowledge,
        data: {'memberId': memberId},
      );
      await loadDivision();
    } catch (_) {}
  }
}
