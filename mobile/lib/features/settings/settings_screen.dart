import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/api/api_client.dart';
import '../../core/api/api_endpoints.dart';
import '../../core/api/api_error.dart';
import '../../core/theme/hunter_theme.dart';
import '../../core/providers/auth_provider.dart';
import '../../core/services/system_audio_service.dart';
import '../../core/widgets/home_widget_bridge.dart';
import '../../models/user_model.dart';
import '../auth/login_screen.dart';
import '../feedback/bug_report_sheet.dart';
import '../feedback/feedback_screen.dart';

class SettingsScreen extends ConsumerStatefulWidget {
  const SettingsScreen({super.key});

  @override
  ConsumerState<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends ConsumerState<SettingsScreen> {
  bool _isProcessing = false;

  Future<void> _updatePreference(Map<String, dynamic> patch) async {
    HapticFeedback.selectionClick();
    final current = ref.read(authProvider).value;
    if (current != null) {
      ref.read(authProvider.notifier).updateUser(
            current.copyWith(
              penaltyModeEnabled:
                  patch['penaltyModeEnabled'] as bool? ?? current.penaltyModeEnabled,
              notificationsEnabled: patch['notificationsEnabled'] as bool? ??
                  current.notificationsEnabled,
            ),
          );
    }

    try {
      final dio = await ApiClient.getInstance();
      final res = await dio.patch(ApiEndpoints.updateUser, data: patch);
      if (res.data is Map<String, dynamic> && res.data['id'] != null) {
        ref
            .read(authProvider.notifier)
            .updateUser(UserModel.fromJson(res.data as Map<String, dynamic>));
      }
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          backgroundColor: HunterTheme.crimson,
          content: Text(extractApiError(e, 'Unable to update System preference')),
        ),
      );
    }
  }

  void _showDeleteAccountDialog() {
    HapticFeedback.heavyImpact();
    showDialog(
      context: context,
      builder: (dialogCtx) => AlertDialog(
        backgroundColor: HunterTheme.surface,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16),
          side: const BorderSide(color: HunterTheme.crimson, width: 1.5),
        ),
        title: const Text(
          'PERMANENT ACCOUNT DELETION',
          style: TextStyle(
            color: HunterTheme.crimson,
            fontWeight: FontWeight.bold,
            letterSpacing: 1.2,
            fontSize: 16,
          ),
        ),
        content: const Text(
          'WARNING: This action is permanent and irreversible.\n\nAll your hunter levels, attributes, streak history, quest logs, and inventory will be wiped from Ascension Protocol servers immediately.\n\nAre you absolutely sure you wish to terminate your matrix profile?',
          style: TextStyle(color: HunterTheme.textPrimary, fontSize: 13, height: 1.4),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(dialogCtx).pop(),
            child: const Text('CANCEL', style: TextStyle(color: HunterTheme.textMuted)),
          ),
          ElevatedButton(
            onPressed: () async {
              Navigator.of(dialogCtx).pop();
              setState(() => _isProcessing = true);
              try {
                await ref.read(authRepositoryProvider).deleteAccount();
                if (mounted) {
                  Navigator.of(context).pushAndRemoveUntil(
                    MaterialPageRoute(builder: (_) => const LoginScreen()),
                    (route) => false,
                  );
                }
              } catch (e) {
                if (mounted) {
                  setState(() => _isProcessing = false);
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(
                      backgroundColor: HunterTheme.surface,
                      content: Text('Failed to delete account: $e', style: const TextStyle(color: HunterTheme.crimson)),
                    ),
                  );
                }
              }
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: HunterTheme.crimson,
              foregroundColor: Colors.white,
            ),
            child: const Text('DELETE MY ACCOUNT', style: TextStyle(fontWeight: FontWeight.bold)),
          ),
        ],
      ),
    );
  }

  void _showLogoutDialog() {
    HapticFeedback.mediumImpact();
    showDialog(
      context: context,
      builder: (dialogCtx) => AlertDialog(
        backgroundColor: HunterTheme.surface,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16),
          side: const BorderSide(color: HunterTheme.cyan, width: 1.2),
        ),
        title: const Text(
          'LOGOUT PROTOCOL',
          style: TextStyle(color: HunterTheme.cyanLight, fontWeight: FontWeight.bold),
        ),
        content: const Text(
          'Are you sure you want to log out of Ascension Protocol?',
          style: TextStyle(color: HunterTheme.textPrimary),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(dialogCtx).pop(),
            child: const Text('CANCEL', style: TextStyle(color: HunterTheme.textMuted)),
          ),
          ElevatedButton(
            onPressed: () async {
              Navigator.of(dialogCtx).pop();
              setState(() => _isProcessing = true);
              await ref.read(authRepositoryProvider).signOut();
              if (mounted) {
                Navigator.of(context).pushAndRemoveUntil(
                  MaterialPageRoute(builder: (_) => const LoginScreen()),
                  (route) => false,
                );
              }
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: HunterTheme.cyan,
              foregroundColor: Colors.black,
            ),
            child: const Text('LOGOUT', style: TextStyle(fontWeight: FontWeight.bold)),
          ),
        ],
      ),
    );
  }

  void _showInfoDialog(String title, String content) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: HunterTheme.surface,
        title: Text(title, style: const TextStyle(color: HunterTheme.cyanLight, fontWeight: FontWeight.bold)),
        content: SingleChildScrollView(
          child: Text(content, style: const TextStyle(color: HunterTheme.textPrimary, height: 1.4)),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(),
            child: const Text('CLOSE', style: TextStyle(color: HunterTheme.cyan)),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final liveUser = ref.watch(authProvider).value;
    final penaltyEnabled = liveUser?.penaltyModeEnabled ?? true;
    final pushEnabled = liveUser?.notificationsEnabled ?? true;

    return Scaffold(
      backgroundColor: HunterTheme.abyss,
      appBar: AppBar(
        backgroundColor: HunterTheme.abyss,
        elevation: 0,
        title: const Text(
          'SETTINGS & PROTOCOL',
          style: TextStyle(
            color: HunterTheme.cyanLight,
            fontWeight: FontWeight.bold,
            letterSpacing: 1.5,
            fontSize: 16,
          ),
        ),
      ),
      body: _isProcessing
          ? const Center(child: CircularProgressIndicator(color: HunterTheme.cyan))
          : ListView(
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
              children: [
                // System Mechanics & Push Preferences (SL-2 & RET-1)
                const Text(
                  'SYSTEM MECHANICS & ALERTS',
                  style: TextStyle(color: HunterTheme.cyanLight, fontWeight: FontWeight.bold, fontSize: 12, letterSpacing: 1.2),
                ),
                const SizedBox(height: 12),
                Card(
                  color: HunterTheme.surface,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                  child: Column(
                    children: [
                      SwitchListTile(
                        secondary: const Icon(Icons.gpp_maybe_outlined, color: HunterTheme.crimson),
                        title: const Text(
                          'Hardcore Penalty Zone Mode',
                          style: TextStyle(color: HunterTheme.textPrimary, fontWeight: FontWeight.bold),
                        ),
                        subtitle: const Text(
                          'Trigger crimson survival quest & shop lock on missed protocols',
                          style: TextStyle(color: HunterTheme.textMuted, fontSize: 12),
                        ),
                        activeThumbColor: HunterTheme.crimson,
                        value: penaltyEnabled,
                        onChanged: (val) => _updatePreference({'penaltyModeEnabled': val}),
                      ),
                      const Divider(color: HunterTheme.surfaceLight, height: 1),
                      SwitchListTile(
                        secondary: const Icon(Icons.notifications_active_outlined, color: HunterTheme.cyan),
                        title: const Text(
                          'Smart Contextual Push Alerts',
                          style: TextStyle(color: HunterTheme.textPrimary, fontWeight: FontWeight.bold),
                        ),
                        subtitle: const Text(
                          'Morning briefing, 8 PM streak guard & 9 PM penalty deadline',
                          style: TextStyle(color: HunterTheme.textMuted, fontSize: 12),
                        ),
                        activeThumbColor: HunterTheme.cyan,
                        value: pushEnabled,
                        onChanged: (val) => _updatePreference({'notificationsEnabled': val}),
                      ),
                      const Divider(color: HunterTheme.surfaceLight, height: 1),
                      SwitchListTile(
                        secondary: const Icon(Icons.volume_up_rounded, color: HunterTheme.purple),
                        title: const Text(
                          'System Voice & SFX Stings',
                          style: TextStyle(color: HunterTheme.textPrimary, fontWeight: FontWeight.bold),
                        ),
                        subtitle: const Text(
                          'Holographic System alerts, level-up stings & alarm warnings',
                          style: TextStyle(color: HunterTheme.textMuted, fontSize: 12),
                        ),
                        activeThumbColor: HunterTheme.purple,
                        value: !SystemAudioService.isMuted,
                        onChanged: (val) async {
                          await SystemAudioService.setMuted(!val);
                          if (val) {
                            await SystemAudioService.playCue(
                              SystemSfxCue.ping,
                              haptic: SystemHapticPattern.lightPulse,
                            );
                          }
                          if (mounted) setState(() {});
                        },
                      ),
                      const Divider(color: HunterTheme.surfaceLight, height: 1),
                      ListTile(
                        leading: const Icon(Icons.widgets_outlined, color: HunterTheme.gold),
                        title: const Text(
                          'Pin Quest HUD Widget',
                          style: TextStyle(color: HunterTheme.textPrimary, fontWeight: FontWeight.bold),
                        ),
                        subtitle: const Text(
                          'Add live Rank, Streak & Morning Anchor widget to Android Home Screen',
                          style: TextStyle(color: HunterTheme.textMuted, fontSize: 12),
                        ),
                        trailing: const Icon(Icons.add_box_outlined, color: HunterTheme.gold),
                        onTap: () async {
                          final ok = await HomeWidgetBridge.requestPinWidget();
                          if (!context.mounted) return;
                          ScaffoldMessenger.of(context).showSnackBar(
                            SnackBar(
                              backgroundColor: HunterTheme.surfaceLight,
                              content: Text(
                                ok
                                    ? 'System Widget pin request sent to launcher.'
                                    : 'Long-press your Home Screen -> Widgets -> Ascension Quest HUD.',
                                style: const TextStyle(color: HunterTheme.cyanLight),
                              ),
                            ),
                          );
                        },
                      ),
                      const Divider(color: HunterTheme.surfaceLight, height: 1),
                      ListTile(
                        leading: const Icon(Icons.bug_report_outlined, color: HunterTheme.crimson),
                        title: const Text(
                          'Report a Bug / Error',
                          style: TextStyle(color: HunterTheme.textPrimary, fontWeight: FontWeight.bold),
                        ),
                        subtitle: const Text(
                          'Auto-attach app & error diagnostics for rapid fix',
                          style: TextStyle(color: HunterTheme.textMuted, fontSize: 12),
                        ),
                        trailing: const Icon(Icons.chevron_right, color: HunterTheme.textMuted),
                        onTap: () => BugReportSheet.show(context, screenName: 'SettingsScreen'),
                      ),
                      const Divider(color: HunterTheme.surfaceLight, height: 1),
                      ListTile(
                        leading: const Icon(Icons.lightbulb_outline_rounded, color: HunterTheme.cyan),
                        title: const Text(
                          'Request Feature / Feedback Board',
                          style: TextStyle(color: HunterTheme.textPrimary, fontWeight: FontWeight.bold),
                        ),
                        subtitle: const Text(
                          'Share what you need, track your reports & upvote top ideas',
                          style: TextStyle(color: HunterTheme.textMuted, fontSize: 12),
                        ),
                        trailing: const Icon(Icons.chevron_right, color: HunterTheme.textMuted),
                        onTap: () => Navigator.of(context).push(
                          MaterialPageRoute(builder: (_) => const FeedbackScreen()),
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 28),

                // Account Section
                const Text(
                  'IDENTITY & CREDENTIALS',
                  style: TextStyle(color: HunterTheme.cyanLight, fontWeight: FontWeight.bold, fontSize: 12, letterSpacing: 1.2),
                ),
                const SizedBox(height: 12),
                Card(
                  color: HunterTheme.surface,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                  child: Column(
                    children: [
                      ListTile(
                        leading: const Icon(Icons.logout, color: HunterTheme.cyan),
                        title: const Text('Logout', style: TextStyle(color: HunterTheme.textPrimary, fontWeight: FontWeight.bold)),
                        subtitle: const Text('Sign out of active device session', style: TextStyle(color: HunterTheme.textMuted, fontSize: 12)),
                        onTap: _showLogoutDialog,
                      ),
                      const Divider(color: HunterTheme.surfaceLight, height: 1),
                      ListTile(
                        leading: const Icon(Icons.delete_forever, color: HunterTheme.crimson),
                        title: const Text('Delete Account', style: TextStyle(color: HunterTheme.crimson, fontWeight: FontWeight.bold)),
                        subtitle: const Text('Permanently erase profile & all telemetry (Play Store Requirement)', style: TextStyle(color: HunterTheme.textMuted, fontSize: 12)),
                        onTap: _showDeleteAccountDialog,
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 28),

                // Legal & Compliance Section
                const Text(
                  'COMPLIANCE & LEGAL',
                  style: TextStyle(color: HunterTheme.cyanLight, fontWeight: FontWeight.bold, fontSize: 12, letterSpacing: 1.2),
                ),
                const SizedBox(height: 12),
                Card(
                  color: HunterTheme.surface,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                  child: Column(
                    children: [
                      ListTile(
                        leading: const Icon(Icons.privacy_tip_outlined, color: HunterTheme.cyanLight),
                        title: const Text('Privacy Policy', style: TextStyle(color: HunterTheme.textPrimary)),
                        trailing: const Icon(Icons.chevron_right, color: HunterTheme.textMuted),
                        onTap: () => _showInfoDialog(
                          'Privacy Policy',
                          'Ascension Protocol processes your identity, physical stats, and focus records under encrypted storage. You retain the right to delete your data at any time via the Delete Account option.',
                        ),
                      ),
                      const Divider(color: HunterTheme.surfaceLight, height: 1),
                      ListTile(
                        leading: const Icon(Icons.description_outlined, color: HunterTheme.cyanLight),
                        title: const Text('Terms of Service', style: TextStyle(color: HunterTheme.textPrimary)),
                        trailing: const Icon(Icons.chevron_right, color: HunterTheme.textMuted),
                        onTap: () => _showInfoDialog(
                          'Terms of Service',
                          'By accessing Ascension Protocol, you agree to commit to self-honesty, discipline, and non-tampering of operational records.',
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 28),

                // Version Info
                Center(
                  child: Column(
                    children: const [
                      Text(
                        'Ascension Protocol v1.0.4 (Build 42)',
                        style: TextStyle(color: HunterTheme.textMuted, fontSize: 12, fontWeight: FontWeight.bold),
                      ),
                      SizedBox(height: 4),
                      Text(
                        'Production Air-Gap Security Matrix Active',
                        style: TextStyle(color: HunterTheme.cyanLight, fontSize: 11),
                      ),
                    ],
                  ),
                ),
              ],
            ),
    );
  }
}
