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

class _LoginScreenState extends ConsumerState<LoginScreen> with SingleTickerProviderStateMixin {
  late final TabController _tabController;
  bool _isLoading = false;
  bool _obscurePassword = true;

  // Sign In Form Controllers
  final _signInFormKey = GlobalKey<FormState>();
  final _loginPhoneController = TextEditingController();
  final _loginPasswordController = TextEditingController();

  // Register Form Controllers
  final _registerFormKey = GlobalKey<FormState>();
  final _registerNameController = TextEditingController();
  final _registerEmailController = TextEditingController();
  final _registerPhoneController = TextEditingController();
  final _registerPasswordController = TextEditingController();
  final _registerReferralController = TextEditingController();
  bool _showReferralField = false;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
  }

  @override
  void dispose() {
    _tabController.dispose();
    _loginPhoneController.dispose();
    _loginPasswordController.dispose();
    _registerNameController.dispose();
    _registerEmailController.dispose();
    _registerPhoneController.dispose();
    _registerPasswordController.dispose();
    _registerReferralController.dispose();
    super.dispose();
  }

  void _showError(String message) {
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        backgroundColor: HunterTheme.surface,
        behavior: SnackBarBehavior.floating,
        content: Row(
          children: [
            const Icon(Icons.error_outline, color: HunterTheme.crimson, size: 20),
            const SizedBox(width: 10),
            Expanded(
              child: Text(
                message.replaceAll("Exception: ", ""),
                style: const TextStyle(color: HunterTheme.crimson, fontSize: 13),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _handlePhoneLogin() async {
    if (!_signInFormKey.currentState!.validate()) return;
    HapticFeedback.heavyImpact();
    setState(() => _isLoading = true);

    try {
      final success = await ref.read(authProvider.notifier).loginWithPhone(
            _loginPhoneController.text.trim(),
            _loginPasswordController.text,
          );

      if (!success && mounted) {
        setState(() => _isLoading = false);
        _showError('Invalid phone number or password');
      }
    } catch (e) {
      if (mounted) {
        setState(() => _isLoading = false);
        _showError(e.toString());
      }
    }
  }

  Future<void> _handleDirectRegister() async {
    if (!_registerFormKey.currentState!.validate()) return;
    HapticFeedback.heavyImpact();
    setState(() => _isLoading = true);

    try {
      final success = await ref.read(authProvider.notifier).registerDirect(
            name: _registerNameController.text.trim(),
            email: _registerEmailController.text.trim(),
            phone: _registerPhoneController.text.trim(),
            password: _registerPasswordController.text,
            referralCode: _registerReferralController.text.trim().isNotEmpty
                ? _registerReferralController.text.trim()
                : null,
          );

      if (!success && mounted) {
        setState(() => _isLoading = false);
        _showError('Registration failed. Phone or email may already be in use.');
      }
    } catch (e) {
      if (mounted) {
        setState(() => _isLoading = false);
        _showError(e.toString());
      }
    }
  }

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
        _showError('Google Sign-in failed: ${e.toString()}');
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

  InputDecoration _inputDecor({
    required String hint,
    required IconData icon,
    Widget? suffixIcon,
  }) {
    return InputDecoration(
      hintText: hint,
      hintStyle: TextStyle(color: Colors.white.withValues(alpha: 0.3), fontSize: 14),
      prefixIcon: Icon(icon, color: HunterTheme.cyanLight, size: 20),
      suffixIcon: suffixIcon,
      filled: true,
      fillColor: HunterTheme.surface,
      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: BorderSide(color: Colors.white.withValues(alpha: 0.1)),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: BorderSide(color: Colors.white.withValues(alpha: 0.1)),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: const BorderSide(color: HunterTheme.cyan, width: 1.5),
      ),
      errorBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: const BorderSide(color: HunterTheme.crimson, width: 1),
      ),
      focusedErrorBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: const BorderSide(color: HunterTheme.crimson, width: 1.5),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: HunterTheme.abyss,
      body: GestureDetector(
        onTap: () => FocusScope.of(context).unfocus(),
        child: Stack(
          children: [
            // Background Ambient Orb
            Positioned(
              top: -80,
              left: MediaQuery.of(context).size.width / 2 - 150,
              child: Container(
                width: 300,
                height: 300,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  gradient: RadialGradient(
                    colors: [
                      HunterTheme.cyan.withValues(alpha: 0.12),
                      Colors.transparent,
                    ],
                  ),
                ),
              ),
            ),

            SafeArea(
              child: SingleChildScrollView(
                padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
                child: Column(
                  children: [
                    const SizedBox(height: 12),

                    // System Emblem
                    Container(
                      width: 58,
                      height: 58,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        gradient: const LinearGradient(
                          colors: [HunterTheme.cyan, HunterTheme.purple],
                        ),
                        boxShadow: [
                          BoxShadow(
                            color: HunterTheme.cyan.withValues(alpha: 0.35),
                            blurRadius: 20,
                            spreadRadius: 2,
                          ),
                        ],
                      ),
                      child: const Icon(
                        Icons.shield,
                        color: Colors.black,
                        size: 32,
                      ),
                    ).animate().scale(duration: 500.ms, curve: Curves.easeOutBack),

                    const SizedBox(height: 12),

                    // Title
                    Text(
                      'ASCENSION PROTOCOL',
                      style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                            color: Colors.white,
                            fontWeight: FontWeight.w900,
                            letterSpacing: 2.5,
                          ),
                      textAlign: TextAlign.center,
                    ),

                    const SizedBox(height: 4),

                    Text(
                      'THE HUNTER SYSTEM OS • AWAKENING',
                      style: TextStyle(
                        color: HunterTheme.cyanLight,
                        fontSize: 10,
                        fontWeight: FontWeight.w800,
                        letterSpacing: 1.5,
                      ),
                    ),

                    const SizedBox(height: 24),

                    // Dual Tab Selector (Sign In / Register)
                    Container(
                      height: 46,
                      decoration: BoxDecoration(
                        color: HunterTheme.surface,
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: Colors.white.withValues(alpha: 0.08)),
                      ),
                      child: TabBar(
                        controller: _tabController,
                        indicatorSize: TabBarIndicatorSize.tab,
                        dividerColor: Colors.transparent,
                        indicator: BoxDecoration(
                          color: HunterTheme.cyan,
                          borderRadius: BorderRadius.circular(10),
                        ),
                        labelColor: Colors.black,
                        unselectedLabelColor: HunterTheme.textMuted,
                        labelStyle: const TextStyle(
                          fontWeight: FontWeight.w900,
                          fontSize: 13,
                          letterSpacing: 1.2,
                        ),
                        unselectedLabelStyle: const TextStyle(
                          fontWeight: FontWeight.bold,
                          fontSize: 13,
                          letterSpacing: 1.2,
                        ),
                        tabs: const [
                          Tab(text: 'SIGN IN'),
                          Tab(text: 'REGISTER'),
                        ],
                      ),
                    ),

                    const SizedBox(height: 20),

                    // Tab View content
                    SizedBox(
                      height: 330,
                      child: TabBarView(
                        controller: _tabController,
                        children: [
                          // Tab 0: Phone + Password Login
                          _buildSignInTab(),

                          // Tab 1: Direct Registration
                          _buildRegisterTab(),
                        ],
                      ),
                    ),

                    const SizedBox(height: 12),

                    // Divider: OR CONTINUE WITH
                    Row(
                      children: [
                        Expanded(
                          child: Divider(color: Colors.white.withValues(alpha: 0.15)),
                        ),
                        Padding(
                          padding: const EdgeInsets.symmetric(horizontal: 16),
                          child: Text(
                            'OR CONTINUE WITH',
                            style: TextStyle(
                              color: HunterTheme.textMuted,
                              fontSize: 11,
                              fontWeight: FontWeight.bold,
                              letterSpacing: 1.2,
                            ),
                          ),
                        ),
                        Expanded(
                          child: Divider(color: Colors.white.withValues(alpha: 0.15)),
                        ),
                      ],
                    ),

                    const SizedBox(height: 16),

                    // Google Sign-In Button
                    SizedBox(
                      width: double.infinity,
                      height: 50,
                      child: ElevatedButton(
                        onPressed: _isLoading ? null : _handleGoogleSignIn,
                        style: ElevatedButton.styleFrom(
                          backgroundColor: Colors.white,
                          foregroundColor: Colors.black,
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(14),
                          ),
                          elevation: 2,
                        ),
                        child: _isLoading
                            ? const SizedBox(
                                width: 20,
                                height: 20,
                                child: CircularProgressIndicator(
                                  strokeWidth: 2,
                                  valueColor: AlwaysStoppedAnimation<Color>(Colors.black),
                                ),
                              )
                            : Row(
                                mainAxisAlignment: MainAxisAlignment.center,
                                children: [
                                  const Icon(
                                    Icons.g_mobiledata,
                                    size: 28,
                                    color: Colors.black,
                                  ),
                                  const SizedBox(width: 10),
                                  const Text(
                                    'Sign in with Google',
                                    style: TextStyle(
                                      fontWeight: FontWeight.bold,
                                      fontSize: 15,
                                      color: Colors.black87,
                                    ),
                                  ),
                                ],
                              ),
                      ),
                    ),

                    const SizedBox(height: 14),

                    // Guest Mode
                    SizedBox(
                      width: double.infinity,
                      height: 44,
                      child: OutlinedButton(
                        onPressed: _isLoading ? null : _handleGuestLogin,
                        style: OutlinedButton.styleFrom(
                          backgroundColor: Colors.transparent,
                          side: BorderSide(
                            color: HunterTheme.cyan.withValues(alpha: 0.25),
                          ),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(14),
                          ),
                        ),
                        child: const Text(
                          'CONTINUE AS GUEST HUNTER',
                          style: TextStyle(
                            color: HunterTheme.cyanLight,
                            fontWeight: FontWeight.w700,
                            fontSize: 12,
                            letterSpacing: 1.2,
                          ),
                        ),
                      ),
                    ),

                    const SizedBox(height: 16),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  // Sign In Tab (Phone + Password)
  Widget _buildSignInTab() {
    return Form(
      key: _signInFormKey,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // Phone Input
          TextFormField(
            controller: _loginPhoneController,
            keyboardType: TextInputType.phone,
            style: const TextStyle(color: Colors.white, fontSize: 14),
            decoration: _inputDecor(
              hint: 'Phone Number (e.g. +91 9876543210)',
              icon: Icons.phone_android,
            ),
            validator: (val) {
              if (val == null || val.trim().isEmpty) {
                return 'Phone number is required';
              }
              final digits = val.replaceAll(RegExp(r'\D'), '');
              if (digits.length < 10) {
                return 'Enter valid 10+ digit phone number';
              }
              return null;
            },
          ),

          const SizedBox(height: 14),

          // Password Input
          TextFormField(
            controller: _loginPasswordController,
            obscureText: _obscurePassword,
            style: const TextStyle(color: Colors.white, fontSize: 14),
            decoration: _inputDecor(
              hint: 'Password',
              icon: Icons.lock_outline,
              suffixIcon: IconButton(
                icon: Icon(
                  _obscurePassword ? Icons.visibility_off : Icons.visibility,
                  color: Colors.white38,
                  size: 20,
                ),
                onPressed: () => setState(() => _obscurePassword = !_obscurePassword),
              ),
            ),
            validator: (val) {
              if (val == null || val.isEmpty) {
                return 'Password is required';
              }
              return null;
            },
          ),

          const SizedBox(height: 24),

          // Sign In Action Button
          SizedBox(
            height: 48,
            child: ElevatedButton(
              onPressed: _isLoading ? null : _handlePhoneLogin,
              style: ElevatedButton.styleFrom(
                backgroundColor: HunterTheme.cyan,
                foregroundColor: Colors.black,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
              ),
              child: _isLoading
                  ? const SizedBox(
                      width: 20,
                      height: 20,
                      child: CircularProgressIndicator(
                        strokeWidth: 2,
                        valueColor: AlwaysStoppedAnimation<Color>(Colors.black),
                      ),
                    )
                  : const Text(
                      'ENTER HUNTER SYSTEM',
                      style: TextStyle(
                        fontWeight: FontWeight.w900,
                        fontSize: 14,
                        letterSpacing: 1.5,
                      ),
                    ),
            ),
          ),
        ],
      ),
    );
  }

  // Register Tab (Name, Email, Phone, Password, Referral)
  Widget _buildRegisterTab() {
    return Form(
      key: _registerFormKey,
      child: SingleChildScrollView(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Name
            TextFormField(
              controller: _registerNameController,
              style: const TextStyle(color: Colors.white, fontSize: 14),
              decoration: _inputDecor(
                hint: 'Hunter Codename *',
                icon: Icons.person_outline,
              ),
              validator: (val) {
                if (val == null || val.trim().length < 2) {
                  return 'Name must be at least 2 characters';
                }
                return null;
              },
            ),

            const SizedBox(height: 10),

            // Email
            TextFormField(
              controller: _registerEmailController,
              keyboardType: TextInputType.emailAddress,
              style: const TextStyle(color: Colors.white, fontSize: 14),
              decoration: _inputDecor(
                hint: 'Email Address *',
                icon: Icons.email_outlined,
              ),
              validator: (val) {
                if (val == null || val.trim().isEmpty) {
                  return 'Email is required';
                }
                if (!val.contains('@') || !val.contains('.')) {
                  return 'Enter valid email address';
                }
                return null;
              },
            ),

            const SizedBox(height: 10),

            // Phone (Mandatory)
            TextFormField(
              controller: _registerPhoneController,
              keyboardType: TextInputType.phone,
              style: const TextStyle(color: Colors.white, fontSize: 14),
              decoration: _inputDecor(
                hint: 'Phone Number (Mandatory) *',
                icon: Icons.phone_android,
              ),
              validator: (val) {
                if (val == null || val.trim().isEmpty) {
                  return 'Phone number is mandatory';
                }
                final digits = val.replaceAll(RegExp(r'\D'), '');
                if (digits.length < 10) {
                  return 'Enter at least 10 digits';
                }
                return null;
              },
            ),

            const SizedBox(height: 10),

            // Password (Mandatory, min 8)
            TextFormField(
              controller: _registerPasswordController,
              obscureText: _obscurePassword,
              style: const TextStyle(color: Colors.white, fontSize: 14),
              decoration: _inputDecor(
                hint: 'Password (min 8 characters) *',
                icon: Icons.lock_outline,
              ),
              validator: (val) {
                if (val == null || val.length < 8) {
                  return 'Password must be at least 8 characters';
                }
                return null;
              },
            ),

            const SizedBox(height: 8),

            // Referral toggle
            if (!_showReferralField)
              Align(
                alignment: Alignment.centerLeft,
                child: TextButton.icon(
                  onPressed: () => setState(() => _showReferralField = true),
                  icon: const Icon(Icons.add, size: 16, color: HunterTheme.cyanLight),
                  label: const Text(
                    'Have an invitation / referral code?',
                    style: TextStyle(color: HunterTheme.cyanLight, fontSize: 11),
                  ),
                ),
              )
            else
              Padding(
                padding: const EdgeInsets.only(top: 4, bottom: 8),
                child: TextFormField(
                  controller: _registerReferralController,
                  textCapitalization: TextCapitalization.characters,
                  style: const TextStyle(color: Colors.white, fontSize: 14),
                  decoration: _inputDecor(
                    hint: 'Referral Code (Optional)',
                    icon: Icons.card_giftcard,
                  ),
                ),
              ),

            const SizedBox(height: 12),

            // Register Submit Button
            SizedBox(
              height: 48,
              child: ElevatedButton(
                onPressed: _isLoading ? null : _handleDirectRegister,
                style: ElevatedButton.styleFrom(
                  backgroundColor: HunterTheme.cyan,
                  foregroundColor: Colors.black,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                ),
                child: _isLoading
                    ? const SizedBox(
                        width: 20,
                        height: 20,
                        child: CircularProgressIndicator(
                          strokeWidth: 2,
                          valueColor: AlwaysStoppedAnimation<Color>(Colors.black),
                        ),
                      )
                    : const Text(
                        'AWAKEN ACCOUNT',
                        style: TextStyle(
                          fontWeight: FontWeight.w900,
                          fontSize: 14,
                          letterSpacing: 1.5,
                        ),
                      ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
