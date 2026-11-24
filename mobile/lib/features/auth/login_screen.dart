import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../../core/theme/hunter_theme.dart';
import '../../core/providers/auth_provider.dart';

class LoginScreen extends ConsumerStatefulWidget {
  const LoginScreen({super.key});

  @override
  ConsumerState<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends ConsumerState<LoginScreen> {
  bool _isLoading = false;

  Future<void> _handleGoogleSignIn() async {
    HapticFeedback.heavyImpact();
    setState(() => _isLoading = true);

    try {
      final success = await ref.read(authProvider.notifier).signInWithGoogle();
      if (!success && mounted) {
        setState(() => _isLoading = false);
      }
    } catch (e) {
      if (mounted) {
        setState(() => _isLoading = false);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            backgroundColor: HunterTheme.surface,
            content: Text(
              'Sign-in error: ${e.toString()}',
              style: const TextStyle(color: HunterTheme.crimson),
            ),
          ),
        );
      }
    }
  }

  Future<void> _handleGuestLogin() async {
    HapticFeedback.mediumImpact();
    setState(() => _isLoading = true);
    try {
      await ref.read(authProvider.notifier).loginGuest();
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: HunterTheme.abyss,
      body: Stack(
        children: [
          // Background Gradient Orbs
          Positioned(
            top: -100,
            left: MediaQuery.of(context).size.width / 2 - 150,
            child: Container(
              width: 300,
              height: 300,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                gradient: RadialGradient(
                  colors: [
                    HunterTheme.cyan.withValues(alpha: 0.15),
                    Colors.transparent,
                  ],
                ),
              ),
            ),
          ),

          SafeArea(
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 24),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Spacer(),

                  // System Emblem Badge
                  Container(
                    width: 72,
                    height: 72,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      gradient: LinearGradient(
                        colors: [
                          HunterTheme.cyan,
                          HunterTheme.purple,
                        ],
                      ),
                      boxShadow: [
                        BoxShadow(
                          color: HunterTheme.cyan.withValues(alpha: 0.4),
                          blurRadius: 24,
                          spreadRadius: 2,
                        ),
                      ],
                    ),
                    child: const Icon(
                      Icons.shield,
                      color: Colors.black,
                      size: 40,
                    ),
                  ).animate().scale(duration: 600.ms, curve: Curves.easeOutBack),

                  const SizedBox(height: 24),

                  // Title & Subtitle
                  Text(
                    'ASCENSION PROTOCOL',
                    style: Theme.of(context).textTheme.displayMedium?.copyWith(
                          color: Colors.white,
                          fontWeight: FontWeight.w900,
                          letterSpacing: 3,
                        ),
                    textAlign: TextAlign.center,
                  ).animate().fadeIn(delay: 200.ms).slideY(begin: 0.2, end: 0),

                  const SizedBox(height: 8),

                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                    decoration: BoxDecoration(
                      color: HunterTheme.surface,
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(color: HunterTheme.cyan.withValues(alpha: 0.3)),
                    ),
                    child: Text(
                      'THE HUNTER SYSTEM OS • MOBILE CLIENT',
                      style: TextStyle(
                        color: HunterTheme.cyanLight,
                        fontSize: 11,
                        fontWeight: FontWeight.w800,
                        letterSpacing: 1.5,
                      ),
                    ),
                  ).animate().fadeIn(delay: 300.ms),

                  const SizedBox(height: 16),

                  Text(
                    'Awaken your potential. Track daily discipline, conquer boss raids, and elevate your rank.',
                    style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                          color: HunterTheme.textMuted,
                          fontSize: 13,
                          height: 1.5,
                        ),
                    textAlign: TextAlign.center,
                  ).animate().fadeIn(delay: 400.ms),

                  const Spacer(),

                  // Native 1-Tap Google Sign-In Button
                  SizedBox(
                    width: double.infinity,
                    height: 56,
                    child: ElevatedButton(
                      onPressed: _isLoading ? null : _handleGoogleSignIn,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.white,
                        foregroundColor: Colors.black,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(16),
                        ),
                        elevation: 4,
                      ),
                      child: _isLoading
                          ? const SizedBox(
                              width: 24,
                              height: 24,
                              child: CircularProgressIndicator(
                                strokeWidth: 2.5,
                                valueColor: AlwaysStoppedAnimation<Color>(Colors.black),
                              ),
                            )
                          : Row(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                Image.network(
                                  'https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg',
                                  width: 22,
                                  height: 22,
                                  errorBuilder: (_, _, _) => const Icon(
                                    Icons.g_mobiledata,
                                    size: 32,
                                    color: Colors.black,
                                  ),
                                ),
                                const SizedBox(width: 12),
                                const Text(
                                  'Sign in with Google',
                                  style: TextStyle(
                                    fontWeight: FontWeight.bold,
                                    fontSize: 16,
                                    color: Colors.black87,
                                  ),
                                ),
                              ],
                            ),
                    ),
                  ).animate().fadeIn(delay: 500.ms).slideY(begin: 0.2, end: 0),

                  const SizedBox(height: 14),

                  // Guest Mode Access
                  SizedBox(
                    width: double.infinity,
                    height: 52,
                    child: OutlinedButton(
                      onPressed: _isLoading ? null : _handleGuestLogin,
                      style: OutlinedButton.styleFrom(
                        backgroundColor: HunterTheme.surface,
                        side: BorderSide(
                          color: HunterTheme.cyan.withValues(alpha: 0.3),
                        ),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(16),
                        ),
                      ),
                      child: const Text(
                        'CONTINUE AS GUEST HUNTER',
                        style: TextStyle(
                          color: HunterTheme.cyanLight,
                          fontWeight: FontWeight.w800,
                          fontSize: 13,
                          letterSpacing: 1.2,
                        ),
                      ),
                    ),
                  ).animate().fadeIn(delay: 600.ms),

                  const SizedBox(height: 24),

                  Text(
                    'Protected by Unified Keystore • Direct GPU Rendering',
                    style: TextStyle(
                      color: HunterTheme.textMuted.withValues(alpha: 0.6),
                      fontSize: 10,
                    ),
                  ),

                  const SizedBox(height: 16),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
