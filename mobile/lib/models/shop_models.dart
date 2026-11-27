/// Supply Depot Shop catalog item and owned Hunter inventory item.
class ShopItemModel {
  final String id;
  final String name;
  final String description;
  final String type; // avatar, badge, theme, title, equipment
  final String value;
  final int cost;
  final bool isPremium;
  final String rarity; // common, rare, epic, legendary

  const ShopItemModel({
    required this.id,
    required this.name,
    required this.description,
    required this.type,
    required this.value,
    required this.cost,
    this.isPremium = false,
    this.rarity = 'common',
  });

  factory ShopItemModel.fromJson(Map<String, dynamic> json) {
    return ShopItemModel(
      id: json['id']?.toString() ?? '',
      name: json['name']?.toString() ?? 'System Artifact',
      description: json['description']?.toString() ?? '',
      type: json['type']?.toString() ?? 'equipment',
      value: json['value']?.toString() ?? '',
      cost: (json['cost'] as num?)?.toInt() ??
          (json['price'] as num?)?.toInt() ??
          0,
      isPremium: json['isPremium'] == true,
      rarity: json['rarity']?.toString().toLowerCase() ?? 'common',
    );
  }
}

class InventoryItemModel {
  final String id;
  final String userId;
  final String itemId;
  final bool equipped;
  final DateTime? acquiredAt;
  final ShopItemModel? item;

  const InventoryItemModel({
    required this.id,
    required this.userId,
    required this.itemId,
    this.equipped = false,
    this.acquiredAt,
    this.item,
  });

  factory InventoryItemModel.fromJson(Map<String, dynamic> json) {
    return InventoryItemModel(
      id: json['id']?.toString() ?? '',
      userId: json['userId']?.toString() ?? '',
      itemId: json['itemId']?.toString() ?? '',
      equipped: json['equipped'] == true,
      acquiredAt: json['acquiredAt'] != null
          ? DateTime.tryParse(json['acquiredAt'].toString())
          : null,
      item: json['item'] is Map<String, dynamic>
          ? ShopItemModel.fromJson(json['item'] as Map<String, dynamic>)
          : null,
    );
  }
}
