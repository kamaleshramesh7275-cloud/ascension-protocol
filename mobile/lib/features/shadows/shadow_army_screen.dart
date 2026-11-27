import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/api/api_error.dart';
import '../../core/providers/auth_provider.dart';
import '../../core/providers/system_mechanics_provider.dart';
import '../../core/theme/hunter_theme.dart';
import '../../models/gate_shadow_models.dart';
import 'arise_extraction_overlay.dart';

/// SR-3 Shadow Extraction Army & Passive Perk Formation Deck (max 3 active shadows).
class ShadowArmyScreen extends ConsumerStatefulWidget {
  const ShadowArmyScreen({super.key});

  @override
  ConsumerState<ShadowArmyScreen> createState() => _ShadowArmyScreenState();
}

class _ShadowArmyScreenState extends ConsumerState<ShadowArmyScreen> {
  Set<String>? _draftEquipped;
  bool _saving = false;

  Future<void> _saveFormation(Set<String> selected) async {
    setState(() => _saving = true);
    try {
      await SystemMechanicsActions.equipShadows(ref, selected.toList());
      HapticFeedback.heavyImpact();
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          backgroundColor: HunterTheme.purple,
          content: Text('Shadow Monarch formation updated.'),
        ),
      );
      setState(() => _draftEquipped = null);
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          backgroundColor: HunterTheme.crimson,
          content: Text(extractApiError(e, 'Failed to equip shadows')),
        ),
      );
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  void _toggleShadow(ShadowCatalogItem shadow, Set<String> currentSelected) {
    if (!shadow.unlocked) return;
    HapticFeedback.selectionClick();
    final next = Set<String>.from(currentSelected);
    if (next.contains(shadow.id)) {
      next.remove(shadow.id);
    } else {
      if (next.length >= 3) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            backgroundColor: HunterTheme.crimson,
            content: Text('Monarch Command limit: Equip up to 3 active Shadows.'),
          ),
        );
        return;
      }
      next.add(shadow.id);
    }
    setState(() => _draftEquipped = next);
  }

  @override
  Widget build(BuildContext context) {
    final asyncShadows = ref.watch(shadowsProvider);
    final user = ref.watch(authProvider).value;

    return Scaffold(
      backgroundColor: HunterTheme.abyss,
      appBar: AppBar(
        backgroundColor: HunterTheme.abyss,
        elevation: 0,
        title: Text(
          'SHADOW ARMY // ARISE',
          style: TextStyle(
            color: HunterTheme.purple,
            fontWeight: FontWeight.w900,
            letterSpacing: 1.5,
            fontSize: 16,
          ),
        ),
      ),
      body: asyncShadows.when(
        loading: () => Center(
          child: CircularProgressIndicator(color: HunterTheme.purple),
        ),
        error: (err, _) => Center(
          child: Text(
            extractApiError(err, 'Unable to summon Shadow catalog'),
            style: TextStyle(color: HunterTheme.crimson),
          ),
        ),
        data: (catalog) {
          final serverEquipped = user?.equippedShadows.toSet() ??
              catalog.where((s) => s.equipped).map((s) => s.id).toSet();
          final selected = _draftEquipped ?? serverEquipped;
          final hasChanges = _draftEquipped != null &&
              (_draftEquipped!.length != serverEquipped.length ||
                  !_draftEquipped!.containsAll(serverEquipped));

          return Column(
            children: [
              Container(
                margin: const EdgeInsets.fromLTRB(16, 8, 16, 12),
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: HunterTheme.surface,
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(color: HunterTheme.purple.withValues(alpha: 0.4)),
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'ACTIVE SHADOW FORMATION',
                          style: TextStyle(
                            color: HunterTheme.purple,
                            fontWeight: FontWeight.w900,
                            fontSize: 11,
                            letterSpacing: 1.4,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          '${catalog.where((s) => s.unlocked).length} Extracted • Max 3 Deployed',
                          style: TextStyle(
                            color: HunterTheme.textMuted,
                            fontSize: 12,
                          ),
                        ),
                      ],
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                      decoration: BoxDecoration(
                        color: HunterTheme.purple.withValues(alpha: 0.2),
                        borderRadius: BorderRadius.circular(10),
                        border: Border.all(color: HunterTheme.purple),
                      ),
                      child: Text(
                        '${selected.length} / 3 SLOTS',
                        style: const TextStyle(
                          color: Colors.white,
                          fontWeight: FontWeight.w900,
                          fontSize: 12,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
              if (user?.pendingExtraction != null)
                Container(
                  margin: const EdgeInsets.fromLTRB(16, 0, 16, 12),
                  padding: const EdgeInsets.all(14),
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      colors: [
                        HunterTheme.purple.withValues(alpha: 0.26),
                        HunterTheme.surface,
                      ],
                    ),
                    borderRadius: BorderRadius.circular(14),
                    border: Border.all(color: HunterTheme.purple, width: 1.5),
                  ),
                  child: Row(
                    children: [
                      const Icon(Icons.auto_fix_high, color: Colors.white, size: 22),
                      const SizedBox(width: 10),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'ARISE READY • ${(user!.pendingExtraction!['bossName'] ?? 'BOSS').toString().toUpperCase()}',
                              style: const TextStyle(
                                color: Colors.white,
                                fontWeight: FontWeight.w900,
                                fontSize: 11.5,
                              ),
                            ),
                            Text(
                              '${user.pendingExtraction!['attemptsRemaining'] ?? 3} attempts left • Hold 10s to extract',
                              style: TextStyle(
                                color: HunterTheme.cyanLight,
                                fontSize: 11,
                              ),
                            ),
                          ],
                        ),
                      ),
                      ElevatedButton(
                        onPressed: () =>
                            AriseExtractionOverlay.show(context, user.pendingExtraction!),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: HunterTheme.purple,
                          foregroundColor: Colors.white,
                        ),
                        child: const Text(
                          'ARISE',
                          style: TextStyle(fontWeight: FontWeight.w900),
                        ),
                      ),
                    ],
                  ),
                ),
              if (user != null && user.extractedShadows.isNotEmpty)
                Container(
                  margin: const EdgeInsets.fromLTRB(16, 0, 16, 12),
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: HunterTheme.surface,
                    borderRadius: BorderRadius.circular(14),
                    border: Border.all(color: HunterTheme.gold.withValues(alpha: 0.35)),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'EXTRACTED LEGION CHRONICLES',
                        style: TextStyle(
                          color: HunterTheme.gold,
                          fontWeight: FontWeight.w900,
                          fontSize: 10.5,
                          letterSpacing: 1.2,
                        ),
                      ),
                      const SizedBox(height: 6),
                      ...user.extractedShadows.reversed.take(3).map(
                        (s) => Padding(
                          padding: const EdgeInsets.only(bottom: 4),
                          child: Text(
                            '• ${s['title'] ?? s['name']}: ${s['loreOrigin'] ?? ''}',
                            style: TextStyle(
                              color: HunterTheme.textPrimary,
                              fontSize: 11.5,
                              height: 1.3,
                            ),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              Expanded(
                child: ListView.builder(
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  itemCount: catalog.length,
                  itemBuilder: (context, index) {
                    final shadow = catalog[index];
                    final isEquipped = selected.contains(shadow.id);
                    final unlocked = shadow.unlocked;

                    return Container(
                      margin: const EdgeInsets.only(bottom: 12),
                      decoration: BoxDecoration(
                        color: unlocked
                            ? HunterTheme.surface
                            : HunterTheme.surface.withValues(alpha: 0.45),
                        borderRadius: BorderRadius.circular(14),
                        border: Border.all(
                          color: isEquipped
                              ? HunterTheme.purple
                              : (unlocked
                                  ? HunterTheme.purple.withValues(alpha: 0.35)
                                  : HunterTheme.textMuted.withValues(alpha: 0.2)),
                          width: isEquipped ? 1.8 : 1.0,
                        ),
                      ),
                      child: InkWell(
                        onTap: unlocked ? () => _toggleShadow(shadow, selected) : null,
                        borderRadius: BorderRadius.circular(14),
                        child: Padding(
                          padding: const EdgeInsets.all(14),
                          child: Row(
                            children: [
                              Container(
                                width: 48,
                                height: 48,
                                decoration: BoxDecoration(
                                  shape: BoxShape.circle,
                                  color: unlocked
                                      ? HunterTheme.purple.withValues(alpha: 0.2)
                                      : HunterTheme.abyss,
                                  border: Border.all(
                                    color: unlocked
                                        ? HunterTheme.purple
                                        : HunterTheme.textMuted.withValues(alpha: 0.3),
                                  ),
                                ),
                                child: Icon(
                                  unlocked ? Icons.shield_moon_rounded : Icons.lock_outline,
                                  color: unlocked ? HunterTheme.purple : HunterTheme.textMuted,
                                ),
                              ),
                              const SizedBox(width: 14),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Row(
                                      children: [
                                        Text(
                                          shadow.name.toUpperCase(),
                                          style: TextStyle(
                                            color: unlocked
                                                ? HunterTheme.textPrimary
                                                : HunterTheme.textMuted,
                                            fontWeight: FontWeight.w900,
                                            fontSize: 15,
                                          ),
                                        ),
                                        const SizedBox(width: 8),
                                        Container(
                                          padding: const EdgeInsets.symmetric(
                                              horizontal: 6, vertical: 2),
                                          decoration: BoxDecoration(
                                            color: HunterTheme.gold.withValues(alpha: 0.14),
                                            borderRadius: BorderRadius.circular(4),
                                          ),
                                          child: Text(
                                            shadow.rank.toUpperCase(),
                                            style: TextStyle(
                                              color: HunterTheme.gold,
                                              fontSize: 9.5,
                                              fontWeight: FontWeight.w900,
                                            ),
                                          ),
                                        ),
                                      ],
                                    ),
                                    Text(
                                      shadow.epithet,
                                      style: TextStyle(
                                        color: HunterTheme.cyanLight,
                                        fontSize: 11.5,
                                        fontWeight: FontWeight.w600,
                                      ),
                                    ),
                                    const SizedBox(height: 6),
                                    Text(
                                      'PASSIVE: ${shadow.perkTitle}',
                                      style: TextStyle(
                                        color: HunterTheme.emeraldLight,
                                        fontSize: 11.5,
                                        fontWeight: FontWeight.bold,
                                      ),
                                    ),
                                    const SizedBox(height: 2),
                                    Text(
                                      unlocked
                                          ? shadow.perkDescription
                                          : 'UNLOCK CONDITION: ${shadow.unlockCondition}',
                                      style: TextStyle(
                                        color: HunterTheme.textMuted,
                                        fontSize: 11,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                              if (unlocked)
                                Checkbox(
                                  value: isEquipped,
                                  activeColor: HunterTheme.purple,
                                  onChanged: (_) => _toggleShadow(shadow, selected),
                                ),
                            ],
                          ),
                        ),
                      ),
                    );
                  },
                ),
              ),
              if (hasChanges)
                SafeArea(
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: SizedBox(
                      width: double.infinity,
                      child: ElevatedButton.icon(
                        onPressed: _saving ? null : () => _saveFormation(selected),
                        icon: _saving
                            ? const SizedBox(
                                width: 16,
                                height: 16,
                                child: CircularProgressIndicator(
                                    strokeWidth: 2, color: Colors.white),
                              )
                            : const Icon(Icons.auto_awesome),
                        label: const Text(
                          'DEPLOY SHADOW FORMATION',
                          style: TextStyle(fontWeight: FontWeight.w900, letterSpacing: 1.2),
                        ),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: HunterTheme.purple,
                          foregroundColor: Colors.white,
                          padding: const EdgeInsets.symmetric(vertical: 14),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12),
                          ),
                        ),
                      ),
                    ),
                  ),
                ),
            ],
          );
        },
      ),
    );
  }
}
