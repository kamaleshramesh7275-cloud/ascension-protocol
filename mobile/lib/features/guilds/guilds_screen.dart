import 'dart:io';
import 'dart:ui' as ui;
import 'package:flutter/material.dart';
import 'package:flutter/rendering.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:path_provider/path_provider.dart';
import 'package:share_plus/share_plus.dart';
import '../../core/api/api_client.dart';
import '../../core/api/api_endpoints.dart';
import '../../core/api/api_error.dart';
import '../../core/providers/auth_provider.dart';
import '../../core/theme/hunter_theme.dart';
import '../../core/widgets/system_window_dialog.dart';
import '../../models/user_model.dart';

/// Feature #8 Mobile Hunter Guilds & Weekly Shared Boss Raid Screen.
class GuildsScreen extends ConsumerStatefulWidget {
  const GuildsScreen({super.key});

  @override
  ConsumerState<GuildsScreen> createState() => _GuildsScreenState();
}

class _GuildsScreenState extends ConsumerState<GuildsScreen> {
  final GlobalKey _raidCardKey = GlobalKey();
  bool _loading = true;
  bool _acting = false;
  Map<String, dynamic>? _raidData;
  List<Map<String, dynamic>> _publicGuilds = const [];

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      final dio = await ApiClient.getInstance();
      final user = ref.read(authProvider).value;
      if (user?.guildId != null && user!.guildId!.isNotEmpty) {
        final res = await dio.get(ApiEndpoints.guildRaidActive);
        if (mounted && res.data is Map<String, dynamic>) {
          setState(() => _raidData = Map<String, dynamic>.from(res.data as Map));
        }
      } else {
        final res = await dio.get(ApiEndpoints.guilds);
        if (mounted && res.data is List) {
          setState(() {
            _raidData = null;
            _publicGuilds = (res.data as List)
                .whereType<Map>()
                .map((m) => Map<String, dynamic>.from(m))
                .toList();
          });
        }
      }
    } catch (_) {
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _joinGuild(String guildId) async {
    setState(() => _acting = true);
    try {
      final dio = await ApiClient.getInstance();
      await dio.post(ApiEndpoints.guildJoin(guildId));
      await ref.read(authProvider.notifier).checkSession();
      await _load();
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          backgroundColor: HunterTheme.crimson,
          content: Text(extractApiError(e, 'Unable to join guild right now')),
        ),
      );
    } finally {
      if (mounted) setState(() => _acting = false);
    }
  }

  Future<void> _leaveGuild() async {
    setState(() => _acting = true);
    try {
      final dio = await ApiClient.getInstance();
      await dio.post(ApiEndpoints.guildLeave);
      await ref.read(authProvider.notifier).checkSession();
      await _load();
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          backgroundColor: HunterTheme.surface,
          content: Text('Left Guild. 24h relocation cooldown started.'),
        ),
      );
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          backgroundColor: HunterTheme.crimson,
          content: Text(extractApiError(e, 'Cannot leave guild')),
        ),
      );
    } finally {
      if (mounted) setState(() => _acting = false);
    }
  }

  Future<void> _claimRaidLoot() async {
    setState(() => _acting = true);
    try {
      final dio = await ApiClient.getInstance();
      final res = await dio.post(ApiEndpoints.guildRaidClaim);
      if (res.data is Map<String, dynamic>) {
        final data = res.data as Map<String, dynamic>;
        if (data['user'] is Map<String, dynamic>) {
          ref.read(authProvider.notifier).updateUser(
                UserModel.fromJson(data['user'] as Map<String, dynamic>),
              );
        }
        if (!mounted) return;
        await SystemWindowDialog.show(
          context,
          headerTag: 'GUILD RAID CLEARED',
          title: 'GUILD VICTORY LOOT CLAIMED',
          body: 'Secured +${data['coinsAwarded'] ?? 150} Coins & +${data['xpAwarded'] ?? 100} XP.',
          tone: SystemWindowTone.gold,
          icon: Icons.groups_rounded,
          enableShare: true,
        );
      }
      await _load();
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          backgroundColor: HunterTheme.crimson,
          content: Text(extractApiError(e, 'Complete contribution floor (>=60m or 2 workouts) to claim.')),
        ),
      );
    } finally {
      if (mounted) setState(() => _acting = false);
    }
  }

  Future<void> _shareRaidCard(Map<String, dynamic> guild) async {
    try {
      final boundary =
          _raidCardKey.currentContext?.findRenderObject() as RenderRepaintBoundary?;
      if (boundary == null) return;
      final image = await boundary.toImage(pixelRatio: 2.5);
      final bytes = await image.toByteData(format: ui.ImageByteFormat.png);
      if (bytes == null) return;
      final dir = await getTemporaryDirectory();
      final file = File('${dir.path}/guild_raid_${DateTime.now().millisecondsSinceEpoch}.png');
      await file.writeAsBytes(bytes.buffer.asUint8List());
      await SharePlus.instance.share(
        ShareParams(
          files: [XFile(file.path)],
          text:
              'Join my Ascension Guild "${guild['name']}"! Deep-link invite: ascension://guild/join/${guild['id']}',
        ),
      );
    } catch (_) {}
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: HunterTheme.abyss,
      appBar: AppBar(
        backgroundColor: HunterTheme.abyss,
        elevation: 0,
        title: Text(
          'HUNTER GUILD & RAIDS',
          style: TextStyle(
            color: HunterTheme.textPrimary,
            fontWeight: FontWeight.w900,
            letterSpacing: 1.5,
            fontSize: 16,
          ),
        ),
        actions: [
          if (_raidData != null)
            IconButton(
              onPressed: _acting ? null : _leaveGuild,
              tooltip: 'Leave Guild',
              icon: Icon(Icons.logout_rounded, color: HunterTheme.crimson),
            ),
        ],
      ),
      body: _loading
          ? Center(child: CircularProgressIndicator(color: HunterTheme.cyan))
          : RefreshIndicator(
              onRefresh: _load,
              child: _raidData != null ? _buildGuildRaidView() : _buildGuildBrowser(),
            ),
    );
  }

  Widget _buildGuildBrowser() {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        Text(
          'JOIN A MONARCH GUILD • EQUAL RANK (NO HIERARCHY)',
          style: TextStyle(
            color: HunterTheme.cyanLight,
            fontWeight: FontWeight.w900,
            fontSize: 11.5,
            letterSpacing: 1.2,
          ),
        ),
        const SizedBox(height: 12),
        ..._publicGuilds.map(
          (g) => Card(
            color: HunterTheme.surface,
            margin: const EdgeInsets.only(bottom: 10),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(14),
              side: BorderSide(color: HunterTheme.cyan.withValues(alpha: 0.3)),
            ),
            child: ListTile(
              contentPadding: const EdgeInsets.all(14),
              title: Text(
                g['name']?.toString() ?? 'Guild',
                style: TextStyle(
                  color: HunterTheme.textPrimary,
                  fontWeight: FontWeight.w900,
                ),
              ),
              subtitle: Padding(
                padding: const EdgeInsets.only(top: 4),
                child: Text(
                  '${g['description'] ?? ''}\nMembers: ${g['memberCount'] ?? 1} • Guild XP: ${g['totalXP'] ?? 0}',
                  style: TextStyle(color: HunterTheme.textMuted, fontSize: 12),
                ),
              ),
              trailing: ElevatedButton(
                onPressed: _acting ? null : () => _joinGuild(g['id'].toString()),
                style: ElevatedButton.styleFrom(
                  backgroundColor: HunterTheme.cyan,
                  foregroundColor: Colors.black,
                ),
                child: const Text('JOIN', style: TextStyle(fontWeight: FontWeight.w900)),
              ),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildGuildRaidView() {
    final raid = _raidData!;
    final guild = raid['guild'] as Map<String, dynamic>? ?? const {};
    final maxHp = (raid['bossMaxHp'] as num?)?.toInt() ?? 5000;
    final curHp = (raid['bossCurrentHp'] as num?)?.toInt() ?? 5000;
    final frac = maxHp <= 0 ? 0.0 : (curHp / maxHp).clamp(0.0, 1.0);
    final defeated = raid['bossDefeated'] == true;
    final dispatch = raid['dispatch'] as Map<String, dynamic>?;
    final members = raid['members'] is List
        ? (raid['members'] as List).whereType<Map>().map((m) => Map<String, dynamic>.from(m)).toList()
        : const <Map<String, dynamic>>[];

    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        RepaintBoundary(
          key: _raidCardKey,
          child: Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              gradient: LinearGradient(
                colors: [
                  (defeated ? HunterTheme.gold : HunterTheme.purple).withValues(alpha: 0.2),
                  HunterTheme.surface,
                ],
              ),
              borderRadius: BorderRadius.circular(16),
              border: Border.all(
                color: defeated ? HunterTheme.gold : HunterTheme.purple,
                width: 1.5,
              ),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  '${guild['name']?.toString().toUpperCase() ?? 'GUILD'} • WEEK ${raid['weekKey'] ?? ''}',
                  style: TextStyle(
                    color: HunterTheme.cyanLight,
                    fontWeight: FontWeight.w900,
                    fontSize: 11,
                    letterSpacing: 1.3,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  raid['bossName']?.toString() ?? 'Guild Siege Behemoth',
                  style: TextStyle(
                    color: HunterTheme.textPrimary,
                    fontWeight: FontWeight.w900,
                    fontSize: 18,
                  ),
                ),
                const SizedBox(height: 10),
                ClipRRect(
                  borderRadius: BorderRadius.circular(8),
                  child: LinearProgressIndicator(
                    value: frac,
                    minHeight: 11,
                    backgroundColor: HunterTheme.abyss,
                    valueColor: AlwaysStoppedAnimation<Color>(
                      defeated ? HunterTheme.gold : HunterTheme.purple,
                    ),
                  ),
                ),
                const SizedBox(height: 6),
                Text(
                  '$curHp / $maxHp HP • Floor: >=60m Focus or 2 Workouts to claim loot',
                  style: TextStyle(color: HunterTheme.textMuted, fontSize: 11.5),
                ),
                if (dispatch != null && dispatch['summary'] != null) ...[
                  const SizedBox(height: 10),
                  Container(
                    padding: const EdgeInsets.all(10),
                    decoration: BoxDecoration(
                      color: HunterTheme.abyss.withValues(alpha: 0.7),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: Text(
                      '${dispatch['summary']}\n${dispatch['callout'] ?? ''}',
                      style: TextStyle(color: HunterTheme.textPrimary, fontSize: 11.5),
                    ),
                  ),
                ],
              ],
            ),
          ),
        ),
        const SizedBox(height: 12),
        Row(
          children: [
            Expanded(
              child: OutlinedButton.icon(
                onPressed: () => _shareRaidCard(guild),
                icon: Icon(Icons.share_rounded, color: HunterTheme.cyanLight),
                label: Text(
                  'INVITE & SHARE CARD',
                  style: TextStyle(color: HunterTheme.cyanLight, fontWeight: FontWeight.w900, fontSize: 11.5),
                ),
                style: OutlinedButton.styleFrom(side: BorderSide(color: HunterTheme.cyan)),
              ),
            ),
            if (defeated) ...[
              const SizedBox(width: 10),
              Expanded(
                child: ElevatedButton.icon(
                  onPressed: _acting ? null : _claimRaidLoot,
                  icon: const Icon(Icons.card_giftcard_rounded, size: 17),
                  label: const Text('CLAIM LOOT', style: TextStyle(fontWeight: FontWeight.w900, fontSize: 11.5)),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: HunterTheme.gold,
                    foregroundColor: Colors.black,
                  ),
                ),
              ),
            ],
          ],
        ),
        const SizedBox(height: 18),
        Text(
          'GUILD RAID ROSTER • ALL MEMBERS EQUAL',
          style: TextStyle(
            color: HunterTheme.textMuted,
            fontWeight: FontWeight.bold,
            fontSize: 11,
            letterSpacing: 1.2,
          ),
        ),
        const SizedBox(height: 8),
        ...members.map((m) {
          final qualified = m['qualified'] == true;
          return Container(
            margin: const EdgeInsets.only(bottom: 8),
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: HunterTheme.surface,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(
                color: qualified
                    ? HunterTheme.emerald.withValues(alpha: 0.4)
                    : HunterTheme.crimson.withValues(alpha: 0.3),
              ),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      m['name']?.toString() ?? 'Hunter',
                      style: TextStyle(color: HunterTheme.textPrimary, fontWeight: FontWeight.bold),
                    ),
                    Text(
                      '${m['focusMinutes'] ?? 0}m Focus • ${m['workouts'] ?? 0} Workouts',
                      style: TextStyle(color: HunterTheme.textMuted, fontSize: 11.5),
                    ),
                  ],
                ),
                Text(
                  '${m['damage'] ?? 0} DMG',
                  style: TextStyle(
                    color: qualified ? HunterTheme.emeraldLight : HunterTheme.crimson,
                    fontWeight: FontWeight.w900,
                    fontSize: 12.5,
                  ),
                ),
              ],
            ),
          );
        }),
      ],
    );
  }
}
