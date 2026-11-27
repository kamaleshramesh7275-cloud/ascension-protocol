import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/api/api_client.dart';
import '../../core/api/api_endpoints.dart';
import '../../core/api/api_error.dart';
import '../../core/providers/auth_provider.dart';
import '../../core/providers/system_mechanics_provider.dart';
import '../../core/services/system_audio_service.dart';
import '../../core/theme/hunter_theme.dart';
import '../../core/widgets/system_window_dialog.dart';
import '../../models/user_model.dart';

/// Feature #3 ARISE Shadow Extraction Overlay (10s uninterrupted focus hold, max 3 tries).
class AriseExtractionOverlay extends ConsumerStatefulWidget {
  final Map<String, dynamic> pendingExtraction;

  const AriseExtractionOverlay({super.key, required this.pendingExtraction});

  static Future<void> show(
    BuildContext context,
    Map<String, dynamic> pendingExtraction,
  ) {
    return Navigator.of(context).push(
      PageRouteBuilder<void>(
        opaque: false,
        pageBuilder: (_, _, _) =>
            AriseExtractionOverlay(pendingExtraction: pendingExtraction),
      ),
    );
  }

  @override
  ConsumerState<AriseExtractionOverlay> createState() =>
      _AriseExtractionOverlayState();
}

class _AriseExtractionOverlayState extends ConsumerState<AriseExtractionOverlay>
    with WidgetsBindingObserver {
  Timer? _holdTimer;
  double _holdSeconds = 0.0;
  bool _isHolding = false;
  bool _submitting = false;
  int _breachCount = 0;
  late int _attemptsLeft;
  String? _statusMessage;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    _attemptsLeft =
        (widget.pendingExtraction['attemptsRemaining'] as num?)?.toInt() ?? 3;
    unawaited(SystemAudioService.playCue(
      SystemSfxCue.ariseRumble,
      haptic: SystemHapticPattern.lightPulse,
    ));
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (_isHolding && state == AppLifecycleState.paused) {
      _breachCount++;
      _cancelHold(reason: 'Concentration shattered by app switch!');
    }
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    _holdTimer?.cancel();
    super.dispose();
  }

  void _startHold() {
    if (_submitting || _attemptsLeft <= 0) return;
    HapticFeedback.heavyImpact();
    setState(() {
      _isHolding = true;
      _breachCount = 0;
      _holdSeconds = 0.0;
      _statusMessage = 'HOLDING MANA CHANNEL... DO NOT RELEASE';
    });

    _holdTimer?.cancel();
    _holdTimer = Timer.periodic(const Duration(milliseconds: 100), (t) {
      if (!mounted) {
        t.cancel();
        return;
      }
      final next = _holdSeconds + 0.1;
      if ((next * 10).round() % 20 == 0) {
        unawaited(SystemAudioService.playHaptic(SystemHapticPattern.lightPulse));
      }
      if (next >= 10.0) {
        t.cancel();
        setState(() {
          _holdSeconds = 10.0;
          _isHolding = false;
        });
        _submitAttempt();
      } else {
        setState(() => _holdSeconds = next);
      }
    });
  }

  void _cancelHold({String? reason}) {
    _holdTimer?.cancel();
    if (!_isHolding) return;
    setState(() {
      _isHolding = false;
      _holdSeconds = 0.0;
      _statusMessage = reason ?? 'Channel released too early. Hold for full 10s.';
    });
  }

  Future<void> _submitAttempt() async {
    setState(() {
      _submitting = true;
      _statusMessage = 'COMMANDING ARISE...';
    });
    try {
      final dio = await ApiClient.getInstance();
      final res = await dio.post(
        ApiEndpoints.shadowsExtractAttempt,
        data: {
          'holdSeconds': 10,
          'breachCount': _breachCount,
        },
      );
      if (res.data is Map<String, dynamic>) {
        final data = res.data as Map<String, dynamic>;
        if (data['user'] is Map<String, dynamic>) {
          ref.read(authProvider.notifier).updateUser(
                UserModel.fromJson(data['user'] as Map<String, dynamic>),
              );
        }
        ref.invalidate(shadowsProvider);

        if (!mounted) return;
        if (data['won'] == true) {
          final ext = data['extractedShadow'] as Map<String, dynamic>? ?? const {};
          final title = ext['title']?.toString() ?? 'SHADOW SOLDIER AWAKENED';
          final lore = ext['loreOrigin']?.toString() ?? 'Shadow bound to your monarch deck.';
          final name = ext['name']?.toString() ?? 'SHADOW';
          Navigator.of(context).pop();
          await SystemWindowDialog.showShadowArise(
            context,
            shadowIds: [name],
            customLore: '$title\n\n$lore',
          );
          return;
        }

        final remaining = (data['attemptsRemaining'] as num?)?.toInt() ?? 0;
        final msg = data['message']?.toString() ?? 'Extraction failed.';
        if (remaining <= 0) {
          Navigator.of(context).pop();
          await SystemWindowDialog.show(
            context,
            headerTag: 'EXTRACTION ENDED',
            title: 'SHADOW DISPERSED',
            body: msg,
            tone: SystemWindowTone.crimson,
            icon: Icons.smoke_free_rounded,
          );
        } else {
          unawaited(SystemAudioService.playCue(
            SystemSfxCue.breachGlitch,
            haptic: SystemHapticPattern.criticalWarning,
          ));
          setState(() {
            _attemptsLeft = remaining;
            _holdSeconds = 0.0;
            _statusMessage = msg;
          });
        }
      }
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _holdSeconds = 0.0;
        _statusMessage = extractApiError(
          e,
          'Requires online connection to seal Shadow Extraction.',
        );
      });
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final bossName = widget.pendingExtraction['bossName']?.toString() ?? 'Defeated Boss';
    final source = widget.pendingExtraction['sourceMilestone']?.toString() ?? 'Weekly Victory';
    final progress = (_holdSeconds / 10.0).clamp(0.0, 1.0);

    return Scaffold(
      backgroundColor: Colors.black.withValues(alpha: 0.94),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text(
                    '[ SHADOW EXTRACTION GATE ]',
                    style: TextStyle(
                      color: HunterTheme.purple,
                      fontWeight: FontWeight.w900,
                      fontSize: 12,
                      letterSpacing: 1.5,
                    ),
                  ),
                  IconButton(
                    onPressed: _submitting ? null : () => Navigator.of(context).pop(),
                    icon: const Icon(Icons.close, color: HunterTheme.textMuted),
                  ),
                ],
              ),
              const Spacer(),
              Text(
                bossName.toUpperCase(),
                textAlign: TextAlign.center,
                style: const TextStyle(
                  color: HunterTheme.textPrimary,
                  fontSize: 22,
                  fontWeight: FontWeight.w900,
                  letterSpacing: 1.4,
                ),
              ),
              const SizedBox(height: 6),
              Text(
                'Target Milestone: $source',
                textAlign: TextAlign.center,
                style: const TextStyle(color: HunterTheme.textMuted, fontSize: 12.5),
              ),
              const SizedBox(height: 10),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 5),
                decoration: BoxDecoration(
                  color: HunterTheme.purple.withValues(alpha: 0.16),
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(color: HunterTheme.purple),
                ),
                child: Text(
                  'ATTEMPTS REMAINING: $_attemptsLeft / 3',
                  style: const TextStyle(
                    color: HunterTheme.purple,
                    fontWeight: FontWeight.w900,
                    fontSize: 11.5,
                    letterSpacing: 1.1,
                  ),
                ),
              ),
              const SizedBox(height: 44),
              GestureDetector(
                onTapDown: (_) => _startHold(),
                onTapUp: (_) => _cancelHold(),
                onTapCancel: () => _cancelHold(),
                child: Stack(
                  alignment: Alignment.center,
                  children: [
                    SizedBox(
                      width: 210,
                      height: 210,
                      child: CircularProgressIndicator(
                        value: progress,
                        strokeWidth: 10,
                        backgroundColor: HunterTheme.surfaceLight,
                        valueColor: const AlwaysStoppedAnimation<Color>(HunterTheme.purple),
                      ),
                    ),
                    Container(
                      width: 174,
                      height: 174,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        gradient: RadialGradient(
                          colors: [
                            HunterTheme.purple.withValues(alpha: _isHolding ? 0.55 : 0.25),
                            Colors.black,
                          ],
                        ),
                        border: Border.all(color: HunterTheme.purple, width: 2),
                      ),
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(
                            Icons.shield_moon_rounded,
                            size: 46,
                            color: _isHolding ? Colors.white : HunterTheme.purple,
                          ),
                          const SizedBox(height: 10),
                          Text(
                            _submitting
                                ? 'SEALING...'
                                : _isHolding
                                    ? '${(10.0 - _holdSeconds).toStringAsFixed(1)}s'
                                    : 'HOLD "ARISE"',
                            style: const TextStyle(
                              color: Colors.white,
                              fontWeight: FontWeight.w900,
                              fontSize: 16,
                              letterSpacing: 1.5,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ).animate(target: _isHolding ? 1 : 0).scale(
                      begin: const Offset(1.0, 1.0),
                      end: const Offset(1.06, 1.06),
                      duration: 200.ms,
                    ),
              ),
              const SizedBox(height: 26),
              Text(
                _statusMessage ??
                    'Press and hold for 10 uninterrupted seconds to extract this shadow into your army.',
                textAlign: TextAlign.center,
                style: const TextStyle(
                  color: HunterTheme.cyanLight,
                  fontSize: 12.5,
                  height: 1.4,
                ),
              ),
              const Spacer(),
            ],
          ),
        ),
      ),
    );
  }
}
