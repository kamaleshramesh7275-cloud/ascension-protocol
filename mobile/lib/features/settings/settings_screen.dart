import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/theme/hunter_theme.dart';
import '../../core/providers/auth_provider.dart';
import '../auth/login_screen.dart';

class SettingsScreen extends ConsumerStatefulWidget {
  const SettingsScreen({super.key});

  @override
  ConsumerState<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends ConsumerState<SettingsScreen> {
  bool _isProcessing = false;

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
