import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/api/api_client.dart';
import '../../core/api/api_endpoints.dart';
import '../../core/api/api_error.dart';
import '../../core/providers/auth_provider.dart';
import '../../core/theme/hunter_theme.dart';
import '../../core/widgets/system_window_dialog.dart';
import '../../models/user_model.dart';

/// Feature #6 Cartenon Temple 72h Double Dungeon Commandments Sheet.
class CartenonDungeonSheet extends ConsumerStatefulWidget {
  const CartenonDungeonSheet({super.key});

  static Future<void> show(BuildContext context) {
    return showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => const CartenonDungeonSheet(),
    );
  }

  @override
  ConsumerState<CartenonDungeonSheet> createState() =>
      _CartenonDungeonSheetState();
}

class _CartenonDungeonSheetState extends ConsumerState<CartenonDungeonSheet> {
  bool _loading = true;
  bool _busy = false;
  List<Map<String, dynamic>> _options = const [];
  final Set<String> _selectedKeys = {'zero_breach_sprints'};
  int _maxStake = 100;
  int _stakeCoins = 50;
  Map<String, dynamic>? _activeState;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      final dio = await ApiClient.getInstance();
      final res = await dio.get(ApiEndpoints.doubleDungeonOptions);
      if (mounted && res.data is Map<String, dynamic>) {
        final data = res.data as Map<String, dynamic>;
        final rawRules = data['rules'] as List? ?? const [];
        final maxS = (data['maxStake'] as num?)?.toInt() ?? 50;
        setState(() {
          _options = rawRules.whereType<Map>().map((m) => Map<String, dynamic>.from(m)).toList();
          _maxStake = maxS;
          _stakeCoins = maxS >= 50 ? 50 : (maxS >= 25 ? 25 : 0);
          _activeState = data['activeState'] is Map
              ? Map<String, dynamic>.from(data['activeState'] as Map)
              : null;
        });
      }
    } catch (_) {
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _enterTemple() async {
    setState(() => _busy = true);
    try {
      final dio = await ApiClient.getInstance();
      final res = await dio.post(
        ApiEndpoints.doubleDungeonEnter,
        data: {
          'stakeCoins': _stakeCoins,
          'ruleKeys': _selectedKeys.toList(),
        },
      );
      if (res.data is Map<String, dynamic> && res.data['user'] is Map<String, dynamic>) {
        ref.read(authProvider.notifier).updateUser(
              UserModel.fromJson(res.data['user'] as Map<String, dynamic>),
            );
      }
      await _load();
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          backgroundColor: HunterTheme.crimson,
          content: Text(extractApiError(e, 'Unable to enter Cartenon Temple')),
        ),
      );
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _settleTemple() async {
    setState(() => _busy = true);
    try {
      final dio = await ApiClient.getInstance();
      final res = await dio.post(ApiEndpoints.doubleDungeonSettle);
      if (res.data is Map<String, dynamic>) {
        final data = res.data as Map<String, dynamic>;
        if (data['user'] is Map<String, dynamic>) {
          ref.read(authProvider.notifier).updateUser(
                UserModel.fromJson(data['user'] as Map<String, dynamic>),
              );
        }
        if (!mounted) return;
        if (data['broken'] == true) {
          Navigator.of(context).pop();
          await SystemWindowDialog.show(
            context,
            headerTag: 'CARTENON TEMPLE',
            title: 'COMMANDMENT BROKEN',
            body: data['message']?.toString() ?? 'Stake lost & Penalty Zone activated.',
            tone: SystemWindowTone.crimson,
            icon: Icons.gpp_bad_rounded,
          );
          return;
        }
        if (data['cleared'] == true) {
          Navigator.of(context).pop();
          await SystemWindowDialog.show(
            context,
            headerTag: 'CARTENON TEMPLE',
            title: 'COMMANDMENTS HONOURED',
            body: data['message']?.toString() ?? 'Payout credited to Hunter Wallet.',
            tone: SystemWindowTone.gold,
            icon: Icons.workspace_premium_rounded,
            enableShare: true,
          );
          return;
        }
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            backgroundColor: HunterTheme.surfaceLight,
            content: Text(data['message']?.toString() ?? 'Progress updated.'),
          ),
        );
      }
      await _load();
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          backgroundColor: HunterTheme.crimson,
          content: Text(extractApiError(e, 'Unable to settle')),
        ),
      );
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final isActive = _activeState != null && _activeState!['status'] == 'active';
    final activeRules = isActive && _activeState!['rules'] is List
        ? (_activeState!['rules'] as List).whereType<Map>().map((m) => Map<String, dynamic>.from(m)).toList()
        : const <Map<String, dynamic>>[];

    return Container(
      decoration: BoxDecoration(
        color: HunterTheme.surface,
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
        border: Border(top: BorderSide(color: HunterTheme.gold, width: 1.8)),
      ),
      padding: const EdgeInsets.fromLTRB(20, 20, 20, 28),
      child: _loading
          ? SizedBox(
              height: 180,
              child: Center(child: CircularProgressIndicator(color: HunterTheme.gold)),
            )
          : SingleChildScrollView(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        '[ CARTENON TEMPLE // 72H VOWS ]',
                        style: TextStyle(
                          color: HunterTheme.gold,
                          fontWeight: FontWeight.w900,
                          fontSize: 12,
                          letterSpacing: 1.4,
                        ),
                      ),
                      IconButton(
                        onPressed: () => Navigator.of(context).pop(),
                        icon: Icon(Icons.close, color: HunterTheme.textMuted),
                      ),
                    ],
                  ),
                  Text(
                    'Double Dungeon Commandments',
                    style: TextStyle(
                      color: HunterTheme.textPrimary,
                      fontSize: 18,
                      fontWeight: FontWeight.w900,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    '7-day cooldown • Stake capped at 50% wallet (max 500c). Breaking a vow triggers Penalty Zone.',
                    style: TextStyle(color: HunterTheme.textMuted, fontSize: 12),
                  ),
                  const SizedBox(height: 14),
                  if (isActive) ...[
                    Text(
                      'STAKED: ${_activeState!['stakeCoins']} COINS • PAYOUT ${_activeState!['payoutMultiplier']}x',
                      style: TextStyle(
                        color: HunterTheme.gold,
                        fontWeight: FontWeight.w900,
                        fontSize: 12,
                      ),
                    ),
                    const SizedBox(height: 10),
                    ...activeRules.map((r) {
                      final cur = (r['current'] as num?)?.toInt() ?? 0;
                      final tgt = (r['target'] as num?)?.toInt() ?? 1;
                      final violated = r['violated'] == true;
                      return ListTile(
                        contentPadding: EdgeInsets.zero,
                        leading: Icon(
                          violated
                              ? Icons.close
                              : (cur >= tgt ? Icons.check_circle : Icons.hourglass_bottom),
                          color: violated
                              ? HunterTheme.crimson
                              : (cur >= tgt ? HunterTheme.emerald : HunterTheme.gold),
                        ),
                        title: Text(
                          r['title']?.toString() ?? '',
                          style: TextStyle(color: HunterTheme.textPrimary, fontSize: 13),
                        ),
                        subtitle: Text(
                          '$cur / $tgt',
                          style: TextStyle(color: HunterTheme.cyanLight, fontSize: 11.5),
                        ),
                      );
                    }),
                    const SizedBox(height: 12),
                    SizedBox(
                      width: double.infinity,
                      child: ElevatedButton(
                        onPressed: _busy ? null : _settleTemple,
                        style: ElevatedButton.styleFrom(
                          backgroundColor: HunterTheme.gold,
                          foregroundColor: Colors.black,
                          padding: const EdgeInsets.symmetric(vertical: 14),
                        ),
                        child: const Text(
                          'VERIFY & SETTLE COMMANDMENTS',
                          style: TextStyle(fontWeight: FontWeight.w900),
                        ),
                      ),
                    ),
                  ] else ...[
                    ..._options.map((r) {
                      final key = r['key'].toString();
                      final checked = _selectedKeys.contains(key);
                      return CheckboxListTile(
                        value: checked,
                        onChanged: (v) {
                          setState(() {
                            if (v == true) {
                              _selectedKeys.add(key);
                            } else if (_selectedKeys.length > 1) {
                              _selectedKeys.remove(key);
                            }
                          });
                        },
                        contentPadding: EdgeInsets.zero,
                        activeColor: HunterTheme.gold,
                        title: Text(
                          r['title']?.toString() ?? '',
                          style: TextStyle(color: HunterTheme.textPrimary, fontSize: 12.5),
                        ),
                        subtitle: Text(
                          '${r['tier']} Law • ${r['multiplier']}x boost tier',
                          style: TextStyle(color: HunterTheme.cyanLight, fontSize: 11),
                        ),
                      );
                    }),
                    if (_maxStake >= 25) ...[
                      const SizedBox(height: 8),
                      Text(
                        'Stake Coins: $_stakeCoins / $_maxStake max',
                        style: TextStyle(color: HunterTheme.gold, fontWeight: FontWeight.bold),
                      ),
                      Slider(
                        value: _stakeCoins.toDouble().clamp(25, _maxStake.toDouble()),
                        min: 25,
                        max: _maxStake.toDouble(),
                        activeColor: HunterTheme.gold,
                        onChanged: _maxStake <= 25
                            ? null
                            : (v) => setState(() => _stakeCoins = v.round()),
                      ),
                    ],
                    const SizedBox(height: 10),
                    SizedBox(
                      width: double.infinity,
                      child: ElevatedButton(
                        onPressed: _busy || _maxStake < 25 ? null : _enterTemple,
                        style: ElevatedButton.styleFrom(
                          backgroundColor: HunterTheme.crimson,
                          foregroundColor: Colors.white,
                          padding: const EdgeInsets.symmetric(vertical: 14),
                        ),
                        child: Text(
                          _maxStake < 25
                              ? 'NEED >=50 COINS TO STAKE'
                              : 'SEAL STONE TABLET (${_selectedKeys.length} LAWS • 72H)',
                          style: const TextStyle(fontWeight: FontWeight.w900),
                        ),
                      ),
                    ),
                  ],
                ],
              ),
            ),
    );
  }
}
