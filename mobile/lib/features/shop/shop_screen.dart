import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/api/api_error.dart';
import '../../core/providers/auth_provider.dart';
import '../../core/providers/shop_provider.dart';
import '../../core/theme/hunter_theme.dart';
import '../../models/shop_models.dart';

/// Feature #1 Supply Depot Shop & Hunter Inventory Screen.
class ShopScreen extends ConsumerStatefulWidget {
  const ShopScreen({super.key});

  @override
  ConsumerState<ShopScreen> createState() => _ShopScreenState();
}

class _ShopScreenState extends ConsumerState<ShopScreen> {
  String _selectedTab = 'ALL';
  String? _busyItemId;

  static const _tabs = [
    ('ALL', 'All'),
    ('utility', 'Tools & Packs'),
    ('title', 'Titles'),
    ('badge', 'Badges'),
    ('theme', 'Themes'),
    ('avatar', 'Avatars'),
  ];

  Color _rarityColor(String rarity) {
    switch (rarity) {
      case 'legendary':
        return HunterTheme.gold;
      case 'epic':
        return HunterTheme.purple;
      case 'rare':
        return HunterTheme.cyan;
      default:
        return HunterTheme.textMuted;
    }
  }

  Future<void> _useItem(ShopItemModel item) async {
    setState(() => _busyItemId = item.id);
    try {
      final msg = await ref.read(shopProvider.notifier).useItem(item);
      HapticFeedback.heavyImpact();
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          backgroundColor: HunterTheme.surfaceLight,
          content: Text(
            msg,
            style: const TextStyle(color: HunterTheme.emeraldLight, fontWeight: FontWeight.bold),
          ),
        ),
      );
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          backgroundColor: HunterTheme.crimson,
          content: Text(extractApiError(e, 'Activation failed')),
        ),
      );
    } finally {
      if (mounted) setState(() => _busyItemId = null);
    }
  }

  Future<void> _buyItem(ShopItemModel item) async {
    setState(() => _busyItemId = item.id);
    try {
      await ref.read(shopProvider.notifier).purchaseItem(item);
      HapticFeedback.heavyImpact();
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          backgroundColor: HunterTheme.surfaceLight,
          content: Text(
            'Acquired ${item.name} (-${item.cost} Coins).',
            style: const TextStyle(color: HunterTheme.gold, fontWeight: FontWeight.bold),
          ),
        ),
      );
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          backgroundColor: HunterTheme.crimson,
          content: Text(extractApiError(e, 'Purchase rejected')),
        ),
      );
    } finally {
      if (mounted) setState(() => _busyItemId = null);
    }
  }

  Future<void> _equipItem(ShopItemModel item) async {
    setState(() => _busyItemId = item.id);
    try {
      await ref.read(shopProvider.notifier).equipItem(item);
      HapticFeedback.mediumImpact();
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          backgroundColor: HunterTheme.surfaceLight,
          content: Text(
            'Equipped ${item.name}.',
            style: const TextStyle(color: HunterTheme.cyanLight, fontWeight: FontWeight.bold),
          ),
        ),
      );
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          backgroundColor: HunterTheme.crimson,
          content: Text(extractApiError(e, 'Failed to equip artifact')),
        ),
      );
    } finally {
      if (mounted) setState(() => _busyItemId = null);
    }
  }

  @override
  Widget build(BuildContext context) {
    final user = ref.watch(authProvider).value;
    final shopState = ref.watch(shopProvider);

    final ownedIds = shopState.inventory.map((i) => i.itemId).toSet();
    final equippedIds =
        shopState.inventory.where((i) => i.equipped).map((i) => i.itemId).toSet();

    final items = shopState.catalog.where((item) {
      if (_selectedTab == 'ALL') return true;
      if (_selectedTab == 'utility') {
        return item.type == 'equipment' ||
            item.type == 'consumable' ||
            item.type == 'program' ||
            item.type == 'boost';
      }
      return item.type == _selectedTab;
    }).toList();
    // Prioritize practical goal tools/consumables ahead of pure cosmetics in ALL view
    items.sort((a, b) {
      final aUtil = a.type == 'consumable' || a.type == 'program';
      final bUtil = b.type == 'consumable' || b.type == 'program';
      if (aUtil != bUtil) return aUtil ? -1 : 1;
      return 0;
    });

    return Scaffold(
      backgroundColor: HunterTheme.abyss,
      appBar: AppBar(
        backgroundColor: HunterTheme.abyss,
        elevation: 0,
        title: const Text(
          'SUPPLY DEPOT',
          style: TextStyle(
            color: HunterTheme.textPrimary,
            fontWeight: FontWeight.w900,
            letterSpacing: 1.5,
            fontSize: 17,
          ),
        ),
        actions: [
          Container(
            margin: const EdgeInsets.only(right: 14, top: 8, bottom: 8),
            padding: const EdgeInsets.symmetric(horizontal: 12),
            decoration: BoxDecoration(
              color: HunterTheme.gold.withValues(alpha: 0.14),
              borderRadius: BorderRadius.circular(18),
              border: Border.all(color: HunterTheme.gold.withValues(alpha: 0.55)),
            ),
            child: Row(
              children: [
                const Icon(Icons.monetization_on, color: HunterTheme.gold, size: 16),
                const SizedBox(width: 5),
                Text(
                  '${user?.coins ?? 0}',
                  style: const TextStyle(
                    color: HunterTheme.gold,
                    fontWeight: FontWeight.w900,
                    fontSize: 13,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
      body: Column(
        children: [
          if (user?.inPenaltyZone == true)
            Container(
              width: double.infinity,
              margin: const EdgeInsets.fromLTRB(16, 4, 16, 8),
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: HunterTheme.crimson.withValues(alpha: 0.14),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: HunterTheme.crimson),
              ),
              child: const Row(
                children: [
                  Icon(Icons.lock, color: HunterTheme.crimson, size: 18),
                  SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      'SUPPLY DEPOT LOCKED — Clear Penalty Zone survival task to unlock purchases.',
                      style: TextStyle(
                        color: HunterTheme.crimson,
                        fontSize: 11.5,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                ],
              ),
            ),

          // Category Filter Tabs
          SizedBox(
            height: 44,
            child: ListView.separated(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              scrollDirection: Axis.horizontal,
              itemBuilder: (_, idx) {
                final tab = _tabs[idx];
                final active = _selectedTab == tab.$1;
                return ChoiceChip(
                  label: Text(tab.$2),
                  selected: active,
                  onSelected: (_) => setState(() => _selectedTab = tab.$1),
                  backgroundColor: HunterTheme.surface,
                  selectedColor: HunterTheme.cyan,
                  labelStyle: TextStyle(
                    color: active ? Colors.black : HunterTheme.textPrimary,
                    fontWeight: FontWeight.bold,
                    fontSize: 12,
                  ),
                );
              },
              separatorBuilder: (_, _) => const SizedBox(width: 8),
              itemCount: _tabs.length,
            ),
          ),
          const SizedBox(height: 8),

          Expanded(
            child: shopState.loading && items.isEmpty
                ? const Center(child: CircularProgressIndicator(color: HunterTheme.cyan))
                : RefreshIndicator(
                    onRefresh: () => ref.read(shopProvider.notifier).loadShop(),
                    child: items.isEmpty
                        ? ListView(
                            children: const [
                              SizedBox(height: 120),
                              Center(
                                child: Text(
                                  'No artifacts found in this sector.',
                                  style: TextStyle(color: HunterTheme.textMuted),
                                ),
                              ),
                            ],
                          )
                        : ListView.builder(
                            padding: const EdgeInsets.fromLTRB(16, 4, 16, 20),
                            itemCount: items.length,
                            itemBuilder: (_, index) {
                              final item = items[index];
                              final owned = ownedIds.contains(item.id);
                              final equipped = equippedIds.contains(item.id);
                              final rarityCol = _rarityColor(item.rarity);
                              final isBusy = _busyItemId == item.id;
                              final isConsumable =
                                  item.type == 'equipment' || item.type == 'consumable';

                              return Container(
                                margin: const EdgeInsets.only(bottom: 12),
                                padding: const EdgeInsets.all(14),
                                decoration: BoxDecoration(
                                  color: HunterTheme.surface,
                                  borderRadius: BorderRadius.circular(14),
                                  border: Border.all(
                                    color: equipped
                                        ? HunterTheme.emerald
                                        : rarityCol.withValues(alpha: 0.4),
                                  ),
                                ),
                                child: Row(
                                  children: [
                                    Container(
                                      width: 46,
                                      height: 46,
                                      decoration: BoxDecoration(
                                        color: rarityCol.withValues(alpha: 0.14),
                                        borderRadius: BorderRadius.circular(12),
                                        border: Border.all(color: rarityCol.withValues(alpha: 0.5)),
                                      ),
                                      child: Icon(
                                        isConsumable
                                            ? Icons.shield_outlined
                                            : Icons.auto_awesome,
                                        color: rarityCol,
                                      ),
                                    ),
                                    const SizedBox(width: 14),
                                    Expanded(
                                      child: Column(
                                        crossAxisAlignment: CrossAxisAlignment.start,
                                        children: [
                                          Row(
                                            children: [
                                              Expanded(
                                                child: Text(
                                                  item.name,
                                                  style: const TextStyle(
                                                    color: HunterTheme.textPrimary,
                                                    fontWeight: FontWeight.w900,
                                                    fontSize: 14.5,
                                                  ),
                                                ),
                                              ),
                                              Container(
                                                padding: const EdgeInsets.symmetric(
                                                    horizontal: 6, vertical: 2),
                                                decoration: BoxDecoration(
                                                  color: rarityCol.withValues(alpha: 0.15),
                                                  borderRadius: BorderRadius.circular(4),
                                                ),
                                                child: Text(
                                                  item.rarity.toUpperCase(),
                                                  style: TextStyle(
                                                    color: rarityCol,
                                                    fontSize: 9.5,
                                                    fontWeight: FontWeight.w900,
                                                  ),
                                                ),
                                              ),
                                            ],
                                          ),
                                          const SizedBox(height: 3),
                                          Text(
                                            item.description,
                                            style: const TextStyle(
                                              color: HunterTheme.textMuted,
                                              fontSize: 12,
                                            ),
                                          ),
                                          const SizedBox(height: 8),
                                          Row(
                                            mainAxisAlignment:
                                                MainAxisAlignment.spaceBetween,
                                            children: [
                                              Text(
                                                '${item.cost} COINS • ${item.type.toUpperCase()}',
                                                style: const TextStyle(
                                                  color: HunterTheme.gold,
                                                  fontWeight: FontWeight.w800,
                                                  fontSize: 11.5,
                                                ),
                                              ),
                                              if (equipped)
                                                Container(
                                                  padding: const EdgeInsets.symmetric(
                                                      horizontal: 10, vertical: 5),
                                                  decoration: BoxDecoration(
                                                    color: HunterTheme.emerald
                                                        .withValues(alpha: 0.2),
                                                    borderRadius:
                                                        BorderRadius.circular(8),
                                                  ),
                                                  child: const Text(
                                                    'EQUIPPED',
                                                    style: TextStyle(
                                                      color: HunterTheme.emeraldLight,
                                                      fontWeight: FontWeight.w900,
                                                      fontSize: 11,
                                                    ),
                                                  ),
                                                )
                                              else if (owned &&
                                                  (item.type == 'consumable' ||
                                                      item.type == 'program') &&
                                                  item.value != 'streak_shield')
                                                Row(
                                                  mainAxisSize: MainAxisSize.min,
                                                  children: [
                                                    ElevatedButton(
                                                      onPressed: isBusy
                                                          ? null
                                                          : () => _useItem(item),
                                                      style: ElevatedButton.styleFrom(
                                                        backgroundColor:
                                                            HunterTheme.emerald,
                                                        foregroundColor: Colors.black,
                                                        padding:
                                                            const EdgeInsets.symmetric(
                                                                horizontal: 12,
                                                                vertical: 6),
                                                      ),
                                                      child: Text(
                                                        isBusy ? '...' : 'USE TOOL',
                                                        style: const TextStyle(
                                                            fontWeight: FontWeight.w900,
                                                            fontSize: 11),
                                                      ),
                                                    ),
                                                  ],
                                                )
                                              else if (owned && !isConsumable)
                                                ElevatedButton(
                                                  onPressed:
                                                      isBusy ? null : () => _equipItem(item),
                                                  style: ElevatedButton.styleFrom(
                                                    backgroundColor: HunterTheme.cyan,
                                                    foregroundColor: Colors.black,
                                                    padding: const EdgeInsets.symmetric(
                                                        horizontal: 14, vertical: 6),
                                                  ),
                                                  child: Text(
                                                    isBusy ? '...' : 'EQUIP',
                                                    style: const TextStyle(
                                                        fontWeight: FontWeight.w900,
                                                        fontSize: 11),
                                                  ),
                                                )
                                              else
                                                ElevatedButton(
                                                  onPressed: isBusy ||
                                                          (user?.inPenaltyZone == true)
                                                      ? null
                                                      : () => _buyItem(item),
                                                  style: ElevatedButton.styleFrom(
                                                    backgroundColor: HunterTheme.gold,
                                                    foregroundColor: Colors.black,
                                                    padding: const EdgeInsets.symmetric(
                                                        horizontal: 14, vertical: 6),
                                                  ),
                                                  child: Text(
                                                    isBusy ? '...' : 'BUY',
                                                    style: const TextStyle(
                                                        fontWeight: FontWeight.w900,
                                                        fontSize: 11),
                                                  ),
                                                ),
                                            ],
                                          ),
                                        ],
                                      ),
                                    ),
                                  ],
                                ),
                              );
                            },
                          ),
                  ),
          ),
        ],
      ),
    );
  }
}
