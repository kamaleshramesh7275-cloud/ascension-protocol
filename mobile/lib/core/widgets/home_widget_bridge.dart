import 'dart:async';
import 'package:flutter/services.dart';
import '../../models/quest_model.dart';
import '../../models/user_model.dart';

/// Native Android Home-Screen Quest HUD Widget Bridge (`in.ascensions.app/widget`).
/// Gracefully no-ops under headless tests or platforms without the Android receiver.
class HomeWidgetBridge {
  static const MethodChannel _channel = MethodChannel('in.ascensions.app/widget');
  static bool _listenerInitialized = false;
  static final StreamController<String> _deepLinkController =
      StreamController<String>.broadcast();

  static Stream<String> get deepLinkStream => _deepLinkController.stream;

  /// Builds pure serializable widget payload (unit-testable without platform channels).
  static Map<String, dynamic> buildHudPayload({
    required UserModel user,
    required List<QuestModel> quests,
    String? bossLabel,
    String? bossName,
    int? bossHpPercent,
    bool? bossDefeated,
  }) {
    final completed = quests.where((q) => q.completed).length;
    final total = quests.length;

    String anchorTitle = 'Initialize your 30-day mandate. The System awaits.';
    QuestModel? anchor;
    if (user.anchorQuestId != null && user.anchorQuestId!.isNotEmpty) {
      for (final q in quests) {
        if (q.id == user.anchorQuestId) {
          anchor = q;
          break;
        }
      }
    }
    anchor ??= quests.cast<QuestModel?>().firstWhere(
          (q) => q != null && !q.completed,
          orElse: () => quests.isNotEmpty ? quests.first : null,
        );
    if (anchor != null) {
      anchorTitle = anchor.completed ? 'CLEARED: ${anchor.title}' : anchor.title;
    }

    final remaining = total - completed;
    final hasIfThen = user.lastIfThenPlan != null && user.lastIfThenPlan!.trim().isNotEmpty;
    final statusLine = user.inPenaltyZone
        ? 'PENALTY ZONE ACTIVE - ESCAPE BEFORE 23:59'
        : hasIfThen
            ? user.lastIfThenPlan!.trim()
            : (bossLabel != null && bossLabel.isNotEmpty
                ? bossLabel
                : (remaining == 0 && total > 0
                    ? 'ALL DAILY QUESTS CLEARED'
                    : 'PENALTY COUNTDOWN: 23:59 ($remaining REMAINING)'));

    return {
      'tier': user.tier,
      'completedCount': completed,
      'totalCount': total,
      'streak': user.streak,
      'anchorTitle': anchorTitle,
      'inPenaltyZone': user.inPenaltyZone,
      'statusLine': statusLine,
      'bossName': bossName ?? 'WEEKLY BOSS: COMMANDER IGRIS',
      'bossHpPercent': bossHpPercent ?? 100,
      'bossDefeated': bossDefeated ?? false,
    };
  }

  static void initializeDeepLinkListener() {
    if (_listenerInitialized) return;
    _listenerInitialized = true;
    try {
      _channel.setMethodCallHandler((call) async {
        if (call.method == 'onWidgetDeepLink' && call.arguments != null) {
          _deepLinkController.add(call.arguments.toString());
        }
      });
    } catch (_) {}
  }

  static Future<void> syncFromState({
    required UserModel user,
    required List<QuestModel> quests,
    String? bossName,
    int? bossHpPercent,
    bool? bossDefeated,
  }) async {
    try {
      await _channel.invokeMethod<bool>(
        'updateWidgetHud',
        buildHudPayload(
          user: user,
          quests: quests,
          bossName: bossName,
          bossHpPercent: bossHpPercent,
          bossDefeated: bossDefeated,
        ),
      );
    } catch (_) {}
  }

  static Future<String?> consumeLaunchRoute() async {
    try {
      return await _channel.invokeMethod<String>('consumeLaunchRoute');
    } catch (_) {
      return null;
    }
  }

  static Future<bool> requestPinWidget() async {
    try {
      return (await _channel.invokeMethod<bool>('requestPinWidget')) ?? false;
    } catch (_) {
      return false;
    }
  }
}
