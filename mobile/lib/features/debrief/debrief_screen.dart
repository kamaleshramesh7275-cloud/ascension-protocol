import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:dio/dio.dart';
import '../../core/theme/hunter_theme.dart';
import '../../core/api/api_client.dart';
import '../../core/api/api_endpoints.dart';
import '../../core/providers/auth_provider.dart';
import '../../core/sync/sync_queue.dart';
import '../../models/user_model.dart';

class DebriefScreen extends ConsumerStatefulWidget {
  final UserModel user;
  const DebriefScreen({super.key, required this.user});

  @override
  ConsumerState<DebriefScreen> createState() => _DebriefScreenState();
}

class _DebriefScreenState extends ConsumerState<DebriefScreen> {
  final _reflectionController = TextEditingController();
  int _rating = 4;
  bool _submitted = false;
  bool _isLoading = true;
  bool _isClaimingRestDay = false;

  @override
  void initState() {
    super.initState();
    _checkTodayDebrief();
  }

  Future<void> _checkTodayDebrief() async {
    try {
      final dio = await ApiClient.getInstance();
      final res = await dio.get(ApiEndpoints.debriefToday);
      if (res.statusCode == 200 && res.data != null && mounted) {
        final data = res.data as Map<String, dynamic>;
        setState(() {
          _submitted = true;
          _reflectionController.text = data['reflectionText']?.toString() ?? '';
          final rawRating = (data['selfHonestyRating'] as num?)?.toInt() ?? 8;
          _rating = (rawRating ~/ 2).clamp(1, 5);
        });
      }
    } catch (_) {}
    if (mounted) {
      setState(() => _isLoading = false);
    }
  }

  @override
  void dispose() {
    _reflectionController.dispose();
    super.dispose();
  }

  Future<void> _submitDebrief() async {
    if (_submitted) return;
    final text = _reflectionController.text.trim();
    if (text.length < 20) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          backgroundColor: HunterTheme.surface,
          content: Text(
            'Reflection must be at least 20 characters for tactical audit.',
            style: TextStyle(color: HunterTheme.crimson),
          ),
        ),
      );
      return;
    }

    HapticFeedback.mediumImpact();
    setState(() => _submitted = true);

    final todayStr = DateTime.now().toIso8601String().split('T')[0];
    final honestyScore = (_rating * 2).clamp(1, 10);

    try {
      final dio = await ApiClient.getInstance();
      await dio.post(
        ApiEndpoints.debrief,
        data: {
          'date': todayStr,
          'reflectionText': text,
          'selfHonestyRating': honestyScore,
        },
      );
    } on DioException catch (e) {
      if (ApiClient.isOffline(e)) {
        await SyncQueueService.enqueue(
          PendingOperation(
            id: 'debrief_${DateTime.now().millisecondsSinceEpoch}',
            type: SyncOpType.submitDebrief,
            endpoint: ApiEndpoints.debrief,
            payload: {
              'date': todayStr,
              'reflectionText': text,
              'selfHonestyRating': honestyScore,
            },
            createdAt: DateTime.now(),
          ),
        );
      }
    } catch (_) {}

    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          backgroundColor: HunterTheme.surfaceLight,
          content: Text(
            'Evening Debrief Recorded. Mana Shield integrity verified.',
            style: TextStyle(color: HunterTheme.cyanLight, fontWeight: FontWeight.bold),
          ),
        ),
      );
    }
  }

  Future<void> _deployShieldRecoveryDay() async {
    if (widget.user.streakShields <= 0) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          backgroundColor: HunterTheme.surface,
          content: Text(
            'No Mana Shields available in inventory.',
            style: TextStyle(color: HunterTheme.crimson),
          ),
        ),
      );
      return;
    }

    setState(() => _isClaimingRestDay = true);
    HapticFeedback.heavyImpact();

    try {
      final dio = await ApiClient.getInstance();
      final response = await dio.post(ApiEndpoints.recoveryDay);

      if (response.statusCode == 200 && response.data != null) {
        final data = response.data;
        if (data is Map<String, dynamic> && data['user'] != null) {
          final updatedUser = UserModel.fromJson(data['user'] as Map<String, dynamic>);
          ref.read(authProvider.notifier).updateUser(updatedUser);
        }

        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              backgroundColor: HunterTheme.surfaceLight,
              content: Text(
                'Active Recovery Mode deployed. Daily streak preserved.',
                style: TextStyle(color: HunterTheme.emeraldLight, fontWeight: FontWeight.bold),
              ),
            ),
          );
        }
      }
    } catch (_) {}

    if (mounted) {
      setState(() => _isClaimingRestDay = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return const Scaffold(
        backgroundColor: HunterTheme.abyss,
        body: Center(
          child: CircularProgressIndicator(color: HunterTheme.cyan),
        ),
      );
    }

    return Scaffold(
      backgroundColor: HunterTheme.abyss,
      appBar: AppBar(
        backgroundColor: HunterTheme.abyss,
        elevation: 0,
        title: const Text(
          'EVENING DEBRIEF',
          style: TextStyle(
            color: HunterTheme.cyanLight,
            fontWeight: FontWeight.bold,
            letterSpacing: 2,
            fontSize: 18,
          ),
        ),
      ),
      body: ListView(
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
        children: [
          // Completed Banner if already recorded today
          if (_submitted)
            Container(
              margin: const EdgeInsets.only(bottom: 20),
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: HunterTheme.emerald.withValues(alpha: 0.15),
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: HunterTheme.emeraldLight, width: 1.5),
              ),
              child: Row(
                children: [
                  const Icon(Icons.check_circle, color: HunterTheme.emeraldLight, size: 28),
                  const SizedBox(width: 12),
                  const Expanded(
                    child: Text(
                      'Protocol Debrief Recorded for Today.\nMana Shield lock verified.',
                      style: TextStyle(
                        color: HunterTheme.emeraldLight,
                        fontWeight: FontWeight.bold,
                        fontSize: 13,
                        height: 1.3,
                      ),
                    ),
                  ),
                ],
              ),
            ),

          // Mana Shield Status Card
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              color: HunterTheme.surface,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(
                color: widget.user.activeRecoveryDay
                    ? HunterTheme.emerald
                    : HunterTheme.cyan.withValues(alpha: 0.3),
                width: 1.5,
              ),
            ),
            child: Row(
              children: [
                Icon(
                  Icons.shield,
                  color: widget.user.streakShields > 0 ? HunterTheme.cyan : HunterTheme.crimson,
                  size: 40,
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'MANA SHIELD PROTOCOL',
                        style: TextStyle(
                          color: HunterTheme.textPrimary,
                          fontWeight: FontWeight.bold,
                          letterSpacing: 1.2,
                          fontSize: 14,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        widget.user.activeRecoveryDay
                            ? 'Rest Day active. Streak safely shielded.'
                            : '${widget.user.streakShields} Mana Shields available.',
                        style: TextStyle(
                          color: HunterTheme.textMuted,
                          fontSize: 12,
                        ),
                      ),
                    ],
                  ),
                ),
                if (!widget.user.activeRecoveryDay && widget.user.streakShields > 0)
                  ElevatedButton(
                    onPressed: _isClaimingRestDay ? null : _deployShieldRecoveryDay,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: HunterTheme.surfaceLight,
                      foregroundColor: HunterTheme.cyanLight,
                      side: const BorderSide(color: HunterTheme.cyan),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                    ),
                    child: const Text('DEPLOY', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 11)),
                  ),
              ],
            ),
          ),
          const SizedBox(height: 24),

          // Daily Self-Honesty Rating
          const Text(
            'SELF-HONESTY & INTENSITY RATING',
            style: TextStyle(
              color: HunterTheme.cyanLight,
              fontWeight: FontWeight.bold,
              letterSpacing: 1.2,
              fontSize: 12,
            ),
          ),
          const SizedBox(height: 12),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: List.generate(5, (index) {
              final val = index + 1;
              final isSelected = _rating >= val;
              return IconButton(
                onPressed: _submitted ? null : () => setState(() => _rating = val),
                icon: Icon(
                  isSelected ? Icons.star : Icons.star_border,
                  color: isSelected ? HunterTheme.gold : HunterTheme.textMuted,
                  size: 32,
                ),
              );
            }),
          ),
          const SizedBox(height: 24),

          // Tactical Reflection Input
          const Text(
            'TACTICAL LOG & OBSTACLE ANALYSIS',
            style: TextStyle(
              color: HunterTheme.cyanLight,
              fontWeight: FontWeight.bold,
              letterSpacing: 1.2,
              fontSize: 12,
            ),
          ),
          const SizedBox(height: 12),
          TextField(
            controller: _reflectionController,
            enabled: !_submitted,
            maxLines: 5,
            style: const TextStyle(color: HunterTheme.textPrimary, fontSize: 14),
            decoration: InputDecoration(
              hintText: 'Record today\'s friction points, victories, and tactical recalibrations (min 20 characters)...',
              hintStyle: const TextStyle(color: HunterTheme.textMuted, fontSize: 13),
              filled: true,
              fillColor: HunterTheme.surface,
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(16),
                borderSide: BorderSide(color: HunterTheme.surfaceLight),
              ),
              focusedBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(16),
                borderSide: const BorderSide(color: HunterTheme.cyan),
              ),
            ),
          ),
          const SizedBox(height: 32),

          // Submit Action
          SizedBox(
            width: double.infinity,
            height: 52,
            child: ElevatedButton.icon(
              onPressed: _submitted ? null : _submitDebrief,
              icon: Icon(_submitted ? Icons.lock : Icons.send),
              label: Text(
                _submitted ? 'RECORD LOCKED' : 'COMMIT DEBRIEF',
                style: const TextStyle(fontWeight: FontWeight.bold, letterSpacing: 1.2),
              ),
              style: ElevatedButton.styleFrom(
                backgroundColor: _submitted ? HunterTheme.surfaceLight : HunterTheme.cyan,
                foregroundColor: _submitted ? HunterTheme.textMuted : Colors.black,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
