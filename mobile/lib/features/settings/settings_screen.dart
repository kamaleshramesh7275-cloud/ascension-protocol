import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../core/api/api_client.dart';
import '../../core/api/api_endpoints.dart';
import '../../core/api/api_error.dart';
import '../../core/theme/hunter_theme.dart';
import '../../core/providers/appearance_provider.dart';
import '../../core/providers/auth_provider.dart';
import '../../core/services/system_audio_service.dart';
import '../../core/widgets/home_widget_bridge.dart';
import '../../models/user_model.dart';
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
          side: BorderSide(color: HunterTheme.crimson, width: 1.5),
        ),
        title: Text(
          'PERMANENT ACCOUNT DELETION',
          style: TextStyle(
            color: HunterTheme.crimson,
            fontWeight: FontWeight.bold,
            letterSpacing: 1.2,
            fontSize: 16,
          ),
        ),
        content: Text(
          'WARNING: This action is permanent and irreversible.\n\nAll your hunter levels, attributes, streak history, quest logs, and inventory will be wiped from Ascension Protocol servers immediately.\n\nAre you absolutely sure you wish to terminate your matrix profile?',
          style: TextStyle(color: HunterTheme.textPrimary, fontSize: 13, height: 1.4),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(dialogCtx).pop(),
            child: Text('CANCEL', style: TextStyle(color: HunterTheme.textMuted)),
          ),
          ElevatedButton(
            onPressed: () async {
              Navigator.of(dialogCtx).pop();
              setState(() => _isProcessing = true);
              try {
                await ref.read(authProvider.notifier).deleteAccount();
                if (mounted) {
                  Navigator.of(context).popUntil((route) => route.isFirst);
                }
              } catch (e) {
                if (mounted) {
                  setState(() => _isProcessing = false);
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(
                      backgroundColor: HunterTheme.surface,
                      content: Text('Failed to delete account: $e', style: TextStyle(color: HunterTheme.crimson)),
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
          side: BorderSide(color: HunterTheme.cyan, width: 1.2),
        ),
        title: Text(
          'LOGOUT PROTOCOL',
          style: TextStyle(color: HunterTheme.cyanLight, fontWeight: FontWeight.bold),
        ),
        content: Text(
          'Are you sure you want to log out of Ascension Protocol?',
          style: TextStyle(color: HunterTheme.textPrimary),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(dialogCtx).pop(),
            child: Text('CANCEL', style: TextStyle(color: HunterTheme.textMuted)),
          ),
          ElevatedButton(
            onPressed: () async {
              Navigator.of(dialogCtx).pop();
              setState(() => _isProcessing = true);
              await ref.read(authProvider.notifier).logout();
              if (mounted) {
                Navigator.of(context).popUntil((route) => route.isFirst);
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
        title: Text(title, style: TextStyle(color: HunterTheme.cyanLight, fontWeight: FontWeight.bold)),
        content: SingleChildScrollView(
          child: Text(content, style: TextStyle(color: HunterTheme.textPrimary, height: 1.4)),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(),
            child: Text('CLOSE', style: TextStyle(color: HunterTheme.cyan)),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final liveUser = ref.watch(authProvider).value;
    final appearance = ref.watch(appearanceProvider);
    final penaltyEnabled = liveUser?.penaltyModeEnabled ?? true;
    final pushEnabled = liveUser?.notificationsEnabled ?? true;

    return Scaffold(
      backgroundColor: HunterTheme.abyss,
      appBar: AppBar(
        backgroundColor: HunterTheme.abyss,
        elevation: 0,
        title: Text(
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
          ? Center(child: CircularProgressIndicator(color: HunterTheme.cyan))
          : ListView(
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
              children: [
                // Appearance: Themes & Fonts (Global)
                _buildAppearanceSection(appearance),
                const SizedBox(height: 28),

                // System Mechanics & Push Preferences (SL-2 & RET-1)
                Text(
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
                        secondary: Icon(Icons.gpp_maybe_outlined, color: HunterTheme.crimson),
                        title: Text(
                          'Hardcore Penalty Zone Mode',
                          style: TextStyle(color: HunterTheme.textPrimary, fontWeight: FontWeight.bold),
                        ),
                        subtitle: Text(
                          'Trigger crimson survival quest & shop lock on missed protocols',
                          style: TextStyle(color: HunterTheme.textMuted, fontSize: 12),
                        ),
                        activeThumbColor: HunterTheme.crimson,
                        value: penaltyEnabled,
                        onChanged: (val) => _updatePreference({'penaltyModeEnabled': val}),
                      ),
                      Divider(color: HunterTheme.surfaceLight, height: 1),
                      SwitchListTile(
                        secondary: Icon(Icons.notifications_active_outlined, color: HunterTheme.cyan),
                        title: Text(
                          'Smart Contextual Push Alerts',
                          style: TextStyle(color: HunterTheme.textPrimary, fontWeight: FontWeight.bold),
                        ),
                        subtitle: Text(
                          'Morning briefing, 8 PM streak guard & 9 PM penalty deadline',
                          style: TextStyle(color: HunterTheme.textMuted, fontSize: 12),
                        ),
                        activeThumbColor: HunterTheme.cyan,
                        value: pushEnabled,
                        onChanged: (val) => _updatePreference({'notificationsEnabled': val}),
                      ),
                      Divider(color: HunterTheme.surfaceLight, height: 1),
                      SwitchListTile(
                        secondary: Icon(Icons.volume_up_rounded, color: HunterTheme.purple),
                        title: Text(
                          'System Voice & SFX Stings',
                          style: TextStyle(color: HunterTheme.textPrimary, fontWeight: FontWeight.bold),
                        ),
                        subtitle: Text(
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
                      Divider(color: HunterTheme.surfaceLight, height: 1),
                      ListTile(
                        leading: Icon(Icons.widgets_outlined, color: HunterTheme.gold),
                        title: Text(
                          'Pin Quest HUD Widget',
                          style: TextStyle(color: HunterTheme.textPrimary, fontWeight: FontWeight.bold),
                        ),
                        subtitle: Text(
                          'Add live Rank, Streak & Morning Anchor widget to Android Home Screen',
                          style: TextStyle(color: HunterTheme.textMuted, fontSize: 12),
                        ),
                        trailing: Icon(Icons.add_box_outlined, color: HunterTheme.gold),
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
                                style: TextStyle(color: HunterTheme.cyanLight),
                              ),
                            ),
                          );
                        },
                      ),
                      Divider(color: HunterTheme.surfaceLight, height: 1),
                      ListTile(
                        leading: Icon(Icons.bug_report_outlined, color: HunterTheme.crimson),
                        title: Text(
                          'Report a Bug / Error',
                          style: TextStyle(color: HunterTheme.textPrimary, fontWeight: FontWeight.bold),
                        ),
                        subtitle: Text(
                          'Auto-attach app & error diagnostics for rapid fix',
                          style: TextStyle(color: HunterTheme.textMuted, fontSize: 12),
                        ),
                        trailing: Icon(Icons.chevron_right, color: HunterTheme.textMuted),
                        onTap: () => BugReportSheet.show(context, screenName: 'SettingsScreen'),
                      ),
                      Divider(color: HunterTheme.surfaceLight, height: 1),
                      ListTile(
                        leading: Icon(Icons.lightbulb_outline_rounded, color: HunterTheme.cyan),
                        title: Text(
                          'Request Feature / Feedback Board',
                          style: TextStyle(color: HunterTheme.textPrimary, fontWeight: FontWeight.bold),
                        ),
                        subtitle: Text(
                          'Share what you need, track your reports & upvote top ideas',
                          style: TextStyle(color: HunterTheme.textMuted, fontSize: 12),
                        ),
                        trailing: Icon(Icons.chevron_right, color: HunterTheme.textMuted),
                        onTap: () => Navigator.of(context).push(
                          MaterialPageRoute(builder: (_) => const FeedbackScreen()),
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 28),

                // Account Section
                Text(
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
                        leading: Icon(Icons.logout, color: HunterTheme.cyan),
                        title: Text('Logout', style: TextStyle(color: HunterTheme.textPrimary, fontWeight: FontWeight.bold)),
                        subtitle: Text('Sign out of active device session', style: TextStyle(color: HunterTheme.textMuted, fontSize: 12)),
                        onTap: _showLogoutDialog,
                      ),
                      Divider(color: HunterTheme.surfaceLight, height: 1),
                      ListTile(
                        leading: Icon(Icons.delete_forever, color: HunterTheme.crimson),
                        title: Text('Delete Account', style: TextStyle(color: HunterTheme.crimson, fontWeight: FontWeight.bold)),
                        subtitle: Text('Permanently erase profile & all telemetry (Play Store Requirement)', style: TextStyle(color: HunterTheme.textMuted, fontSize: 12)),
                        onTap: _showDeleteAccountDialog,
                      ),
                    ],
                  ),
                ),
                SizedBox(height: 28),

                // Legal & Compliance Section
                Text(
                  'COMPLIANCE & LEGAL',
                  style: TextStyle(color: HunterTheme.cyanLight, fontWeight: FontWeight.bold, fontSize: 12, letterSpacing: 1.2),
                ),
                SizedBox(height: 12),
                Card(
                  color: HunterTheme.surface,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                  child: Column(
                    children: [
                      ListTile(
                        leading: Icon(Icons.privacy_tip_outlined, color: HunterTheme.cyanLight),
                        title: Text('Privacy Policy', style: TextStyle(color: HunterTheme.textPrimary)),
                        trailing: Icon(Icons.chevron_right, color: HunterTheme.textMuted),
                        onTap: () => _showInfoDialog(
                          'Privacy Policy',
                          'Ascension Protocol processes your identity, physical stats, and focus records under encrypted storage. You retain the right to delete your data at any time via the Delete Account option.',
                        ),
                      ),
                      Divider(color: HunterTheme.surfaceLight, height: 1),
                      ListTile(
                        leading: Icon(Icons.description_outlined, color: HunterTheme.cyanLight),
                        title: Text('Terms of Service', style: TextStyle(color: HunterTheme.textPrimary)),
                        trailing: Icon(Icons.chevron_right, color: HunterTheme.textMuted),
                        onTap: () => _showInfoDialog(
                          'Terms of Service',
                          'By accessing Ascension Protocol, you agree to commit to self-honesty, discipline, and non-tampering of operational records.',
                        ),
                      ),
                    ],
                  ),
                ),
                SizedBox(height: 28),

                // Version Info
                Center(
                  child: Column(
                    children: [
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

  Widget _buildAppearanceSection(AppearanceState appearance) {
    final notifier = ref.read(appearanceProvider.notifier);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'SYSTEM THEME & TYPOGRAPHY',
          style: TextStyle(
            color: HunterTheme.cyanLight,
            fontWeight: FontWeight.bold,
            fontSize: 12,
            letterSpacing: 1.2,
          ),
        ),
        const SizedBox(height: 12),
        Card(
          color: HunterTheme.surface,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'INTERFACE THEME',
                  style: TextStyle(
                    color: HunterTheme.textMuted,
                    fontSize: 11,
                    fontWeight: FontWeight.bold,
                    letterSpacing: 1.0,
                  ),
                ),
                const SizedBox(height: 10),
                Row(
                  children: HunterThemeId.values.map((id) {
                    final palette = HunterTheme.paletteFor(id);
                    final isSelected = appearance.themeId == id;
                    return Expanded(
                      child: GestureDetector(
                        onTap: () {
                          HapticFeedback.selectionClick();
                          notifier.setTheme(id);
                        },
                        child: Container(
                          margin: EdgeInsets.only(
                            right: id != HunterThemeId.values.last ? 8 : 0,
                          ),
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 10),
                          decoration: BoxDecoration(
                            color: palette.abyss,
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(
                              color: isSelected
                                  ? palette.cyan
                                  : palette.surfaceLight,
                              width: isSelected ? 2 : 1,
                            ),
                            boxShadow: isSelected
                                ? [
                                    BoxShadow(
                                      color: palette.cyan.withValues(alpha: 0.28),
                                      blurRadius: 10,
                                    ),
                                  ]
                                : null,
                          ),
                          child: Column(
                            children: [
                              Row(
                                mainAxisAlignment: MainAxisAlignment.center,
                                children: [
                                  _swatchDot(palette.surface),
                                  const SizedBox(width: 4),
                                  _swatchDot(palette.cyan),
                                  const SizedBox(width: 4),
                                  _swatchDot(palette.purple),
                                ],
                              ),
                              const SizedBox(height: 8),
                              Text(
                                palette.name.split(' ').take(2).join('\n'),
                                textAlign: TextAlign.center,
                                maxLines: 2,
                                overflow: TextOverflow.ellipsis,
                                style: TextStyle(
                                  color: palette.textPrimary,
                                  fontWeight: isSelected ? FontWeight.bold : FontWeight.w600,
                                  fontSize: 11,
                                  height: 1.2,
                                ),
                              ),
                              const SizedBox(height: 4),
                              Icon(
                                isSelected ? Icons.check_circle : Icons.circle_outlined,
                                size: 15,
                                color: isSelected ? palette.cyan : palette.textMuted,
                              ),
                            ],
                          ),
                        ),
                      ),
                    );
                  }).toList(),
                ),
                const SizedBox(height: 18),
                Divider(color: HunterTheme.surfaceLight, height: 1),
                const SizedBox(height: 14),
                Text(
                  'SYSTEM FONT FAMILY',
                  style: TextStyle(
                    color: HunterTheme.textMuted,
                    fontSize: 11,
                    fontWeight: FontWeight.bold,
                    letterSpacing: 1.0,
                  ),
                ),
                const SizedBox(height: 10),
                ...HunterFontId.values.map((fontId) {
                  final isSelected = appearance.fontId == fontId;
                  final previewStyle = fontId == HunterFontId.tacticalGrotesk
                      ? GoogleFonts.spaceGrotesk(
                          color: HunterTheme.textPrimary,
                          fontWeight: FontWeight.bold,
                          fontSize: 14,
                        )
                      : fontId == HunterFontId.terminalMono
                          ? GoogleFonts.jetBrainsMono(
                              color: HunterTheme.textPrimary,
                              fontWeight: FontWeight.bold,
                              fontSize: 13,
                            )
                          : GoogleFonts.rajdhani(
                              color: HunterTheme.textPrimary,
                              fontWeight: FontWeight.bold,
                              fontSize: 15,
                            );

                  return GestureDetector(
                    onTap: () {
                      HapticFeedback.selectionClick();
                      notifier.setFont(fontId);
                    },
                    child: Container(
                      margin: const EdgeInsets.only(bottom: 8),
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                      decoration: BoxDecoration(
                        color: isSelected
                            ? HunterTheme.cyan.withValues(alpha: 0.12)
                            : HunterTheme.abyss,
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(
                          color: isSelected ? HunterTheme.cyan : HunterTheme.surfaceLight,
                          width: isSelected ? 1.6 : 1,
                        ),
                      ),
                      child: Row(
                        children: [
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  HunterTheme.fontDisplayName(fontId),
                                  style: previewStyle,
                                ),
                                const SizedBox(height: 2),
                                Text(
                                  HunterTheme.fontSubtitle(fontId),
                                  style: previewStyle.copyWith(
                                    fontSize: 11.5,
                                    fontWeight: FontWeight.normal,
                                    color: HunterTheme.textMuted,
                                  ),
                                ),
                              ],
                            ),
                          ),
                          Icon(
                            isSelected ? Icons.radio_button_checked : Icons.radio_button_off,
                            color: isSelected ? HunterTheme.cyan : HunterTheme.textMuted,
                            size: 18,
                          ),
                        ],
                      ),
                    ),
                  );
                }),
              ],
            ),
          ),
        ),
      ],
    );
  }

  Widget _swatchDot(Color color) {
    return Container(
      width: 12,
      height: 12,
      decoration: BoxDecoration(
        color: color,
        shape: BoxShape.circle,
        border: Border.all(color: Colors.white24, width: 0.8),
      ),
    );
  }
}
