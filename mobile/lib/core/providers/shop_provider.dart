import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../models/shop_models.dart';
import '../api/api_client.dart';
import '../api/api_endpoints.dart';
import 'auth_provider.dart';

class ShopState {
  final List<ShopItemModel> catalog;
  final List<InventoryItemModel> inventory;
  final bool loading;
  final String? error;

  const ShopState({
    this.catalog = const [],
    this.inventory = const [],
    this.loading = false,
    this.error,
  });

  ShopState copyWith({
    List<ShopItemModel>? catalog,
    List<InventoryItemModel>? inventory,
    bool? loading,
    String? error,
  }) {
    return ShopState(
      catalog: catalog ?? this.catalog,
      inventory: inventory ?? this.inventory,
      loading: loading ?? this.loading,
      error: error,
    );
  }
}

final shopProvider = StateNotifierProvider<ShopNotifier, ShopState>((ref) {
  return ShopNotifier(ref);
});

class ShopNotifier extends StateNotifier<ShopState> {
  final Ref _ref;

  ShopNotifier(this._ref) : super(const ShopState()) {
    loadShop();
  }

  Future<void> loadShop() async {
    state = state.copyWith(loading: true, error: null);
    try {
      final dio = await ApiClient.getInstance();
      final results = await Future.wait([
        dio.get(ApiEndpoints.shop),
        dio.get(ApiEndpoints.shopInventory),
      ]);

      final rawCatalog = results[0].data as List? ?? const [];
      final rawInventory = results[1].data as List? ?? const [];

      final catalog = rawCatalog
          .map((e) => ShopItemModel.fromJson(e as Map<String, dynamic>))
          .toList();
      final inventory = rawInventory
          .map((e) => InventoryItemModel.fromJson(e as Map<String, dynamic>))
          .toList();

      if (mounted) {
        state = ShopState(catalog: catalog, inventory: inventory, loading: false);
      }
    } catch (e) {
      if (mounted) {
        state = state.copyWith(loading: false, error: e.toString());
      }
    }
  }

  Future<int?> purchaseItem(ShopItemModel item) async {
    final dio = await ApiClient.getInstance();
    final res = await dio.post(
      ApiEndpoints.shopBuy,
      data: {'itemId': item.id},
    );

    final data = res.data;
    int? newBalance;
    if (data is Map && data['newBalance'] != null) {
      newBalance = (data['newBalance'] as num).toInt();
      final current = _ref.read(authProvider).value;
      if (current != null) {
        _ref.read(authProvider.notifier).updateUser(current.copyWith(coins: newBalance));
      }
    }
    await loadShop();
    return newBalance;
  }

  Future<String> useItem(ShopItemModel item) async {
    final dio = await ApiClient.getInstance();
    final res = await dio.post(
      ApiEndpoints.shopUse,
      data: {'itemId': item.id, 'value': item.value},
    );
    if (res.data is Map<String, dynamic> && res.data['user'] is Map<String, dynamic>) {
      final current = _ref.read(authProvider).value;
      if (current != null) {
        final merged = <String, dynamic>{...current.toJson(), ...res.data['user']};
        _ref.read(authProvider.notifier).updateUser(current.copyWith(
          lastCoachSummary: merged['lastCoachSummary']?.toString(),
          activeFocusEscrow: merged['activeFocusEscrow'] is Map<String, dynamic>
              ? merged['activeFocusEscrow'] as Map<String, dynamic>
              : null,
        ));
      }
    }
    await loadShop();
    return (res.data is Map ? res.data['message']?.toString() : null) ??
        '${item.name} activated.';
  }

  Future<void> equipItem(ShopItemModel item) async {
    final dio = await ApiClient.getInstance();
    await dio.post(
      ApiEndpoints.shopEquip,
      data: {'itemId': item.id, 'type': item.type},
    );

    final current = _ref.read(authProvider).value;
    if (current != null) {
      switch (item.type) {
        case 'title':
          _ref.read(authProvider.notifier).updateUser(
                current.copyWith(activeTitle: item.value),
              );
          break;
        case 'badge':
          _ref.read(authProvider.notifier).updateUser(
                current.copyWith(activeBadgeId: item.value),
              );
          break;
        case 'theme':
          _ref.read(authProvider.notifier).updateUser(
                current.copyWith(theme: item.value),
              );
          break;
        case 'avatar':
          _ref.read(authProvider.notifier).updateUser(
                current.copyWith(avatarUrl: item.value),
              );
          break;
      }
    }
    await loadShop();
  }
}
