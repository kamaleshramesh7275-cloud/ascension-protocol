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
  final _registerConfirmPasswordController = TextEditingController();
  final _registerAgeController = TextEditingController();
  final _registerWeightController = TextEditingController();
  final _registerHeightController = TextEditingController();
  final _registerGoalController = TextEditingController();
  final _registerReferralController = TextEditingController();
  String _selectedGender = 'prefer_not_to_say';
  String _selectedOccupation = 'student';
  String _selectedExperience = 'beginner';
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
    _registerConfirmPasswordController.dispose();
    _registerAgeController.dispose();
    _registerWeightController.dispose();
    _registerHeightController.dispose();
    _registerGoalController.dispose();
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
            age: int.tryParse(_registerAgeController.text.trim()),
            weight: int.tryParse(_registerWeightController.text.trim()),
            height: int.tryParse(_registerHeightController.text.trim()),
            gender: _selectedGender,
            occupation: _selectedOccupation,
            experienceLevel: _selectedExperience,
            primaryGoal: _registerGoalController.text.trim().isNotEmpty
                ? _registerGoalController.text.trim()
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
              child: LayoutBuilder(
                builder: (context, constraints) => SingleChildScrollView(
                  padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
                  child: ConstrainedBox(
                    constraints: BoxConstraints(
                      minHeight: (constraints.maxHeight - 32).clamp(0.0, double.infinity),
                    ),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Column(
                          children: [
                            const SizedBox(height: 8),

                            // System Emblem (App Logo)
                            Container(
                              width: 72,
                              height: 72,
                              decoration: BoxDecoration(
                                shape: BoxShape.circle,
                                boxShadow: [
                                  BoxShadow(
                                    color: HunterTheme.cyan.withValues(alpha: 0.4),
                                    blurRadius: 22,
                                    spreadRadius: 2,
                                  ),
                                ],
                              ),
                              child: ClipOval(
                                child: Image.asset(
                                  'assets/images/app_logo.png',
                                  width: 72,
                                  height: 72,
                                  fit: BoxFit.cover,
                                  errorBuilder: (_, _, _) => const Icon(
                                    Icons.shield,
                                    color: HunterTheme.cyan,
                                    size: 42,
                                  ),
                                ),
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

                            const SizedBox(height: 20),

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

                            const SizedBox(height: 18),

                            // Responsive Tab View content
                            SizedBox(
                              height: (constraints.maxHeight * 0.45).clamp(320.0, 480.0),
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
                          ],
                        ),

                        Column(
                          children: [
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
                      ],
                    ),
                  ),
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
      autovalidateMode: AutovalidateMode.onUserInteraction,
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
              if (digits.length < 10 || digits.length > 15) {
                return 'Enter a valid 10–15 digit phone number';
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
              hint: 'Password (min 8 chars)',
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
              if (val.length < 8) {
                return 'Password must be at least 8 characters';
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

  // Register Tab (Full Profile + Strict Field Validation)
  Widget _buildRegisterTab() {
    return Form(
      key: _registerFormKey,
      autovalidateMode: AutovalidateMode.onUserInteraction,
      child: SingleChildScrollView(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Hunter Codename
            TextFormField(
              controller: _registerNameController,
              style: const TextStyle(color: Colors.white, fontSize: 14),
              decoration: _inputDecor(
                hint: 'Hunter Codename (3-24 chars) *',
                icon: Icons.person_outline,
              ),
              validator: (val) {
                final v = val?.trim() ?? '';
                if (v.length < 3 || v.length > 24) {
                  return 'Codename must be 3–24 characters';
                }
                if (!RegExp(r'^[a-zA-Z0-9_ -]+$').hasMatch(v)) {
                  return 'Use letters, numbers, spaces, - or _ only';
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
                final v = val?.trim() ?? '';
                if (v.isEmpty) return 'Email is required';
                if (!RegExp(r'^[\w.+-]+@[\w-]+\.[\w.-]{2,}$').hasMatch(v)) {
                  return 'Enter a valid email address';
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
                hint: 'Phone Number (10-15 digits) *',
                icon: Icons.phone_android,
              ),
              validator: (val) {
                if (val == null || val.trim().isEmpty) {
                  return 'Phone number is mandatory';
                }
                final digits = val.replaceAll(RegExp(r'\D'), '');
                if (digits.length < 10 || digits.length > 15) {
                  return 'Enter a valid 10–15 digit phone number';
                }
                return null;
              },
            ),

            const SizedBox(height: 10),

            // Password (Mandatory, min 8 + letter + number)
            TextFormField(
              controller: _registerPasswordController,
              obscureText: _obscurePassword,
              style: const TextStyle(color: Colors.white, fontSize: 14),
              decoration: _inputDecor(
                hint: 'Password (8+ chars, letter & number) *',
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
                if (val == null || val.length < 8) {
                  return 'Minimum 8 characters required';
                }
                if (!RegExp(r'^(?=.*[A-Za-z])(?=.*\d)').hasMatch(val)) {
                  return 'Include at least 1 letter and 1 number';
                }
                return null;
              },
            ),

            const SizedBox(height: 10),

            // Confirm Password
            TextFormField(
              controller: _registerConfirmPasswordController,
              obscureText: _obscurePassword,
              style: const TextStyle(color: Colors.white, fontSize: 14),
              decoration: _inputDecor(
                hint: 'Confirm Password *',
                icon: Icons.verified_user_outlined,
              ),
              validator: (val) {
                if (val == null || val.isEmpty) return 'Confirm your password';
                if (val != _registerPasswordController.text) {
                  return 'Passwords do not match';
                }
                return null;
              },
            ),

            const SizedBox(height: 12),

            // Physical Biometrics Row (Age, Weight, Height)
            Row(
              children: [
                Expanded(
                  child: TextFormField(
                    controller: _registerAgeController,
                    keyboardType: TextInputType.number,
                    style: const TextStyle(color: Colors.white, fontSize: 13),
                    decoration: _inputDecor(hint: 'Age *', icon: Icons.cake_outlined),
                    validator: (val) {
                      final n = int.tryParse(val?.trim() ?? '');
                      if (n == null || n < 13 || n > 100) return '13-100';
                      return null;
                    },
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: TextFormField(
                    controller: _registerWeightController,
                    keyboardType: TextInputType.number,
                    style: const TextStyle(color: Colors.white, fontSize: 13),
                    decoration: _inputDecor(hint: 'Kg *', icon: Icons.monitor_weight_outlined),
                    validator: (val) {
                      final n = int.tryParse(val?.trim() ?? '');
                      if (n == null || n < 25 || n > 300) return '25-300';
                      return null;
                    },
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: TextFormField(
                    controller: _registerHeightController,
                    keyboardType: TextInputType.number,
                    style: const TextStyle(color: Colors.white, fontSize: 13),
                    decoration: _inputDecor(hint: 'Cm *', icon: Icons.height),
                    validator: (val) {
                      final n = int.tryParse(val?.trim() ?? '');
                      if (n == null || n < 100 || n > 250) return '100-250';
                      return null;
                    },
                  ),
                ),
              ],
            ),

            const SizedBox(height: 10),

            // Gender & Occupation Dropdowns
            Row(
              children: [
                Expanded(
                  child: DropdownButtonFormField<String>(
                    initialValue: _selectedGender,
                    dropdownColor: HunterTheme.surface,
                    style: const TextStyle(color: Colors.white, fontSize: 12.5),
                    decoration: _inputDecor(hint: 'Gender', icon: Icons.wc),
                    items: const [
                      DropdownMenuItem(value: 'male', child: Text('Male')),
                      DropdownMenuItem(value: 'female', child: Text('Female')),
                      DropdownMenuItem(value: 'other', child: Text('Other')),
                      DropdownMenuItem(value: 'prefer_not_to_say', child: Text('Private')),
                    ],
                    onChanged: (v) {
                      if (v != null) setState(() => _selectedGender = v);
                    },
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: DropdownButtonFormField<String>(
                    initialValue: _selectedOccupation,
                    dropdownColor: HunterTheme.surface,
                    style: const TextStyle(color: Colors.white, fontSize: 12.5),
                    decoration: _inputDecor(hint: 'Role', icon: Icons.work_outline),
                    items: const [
                      DropdownMenuItem(value: 'student', child: Text('Student')),
                      DropdownMenuItem(value: 'developer', child: Text('Developer')),
                      DropdownMenuItem(value: 'founder', child: Text('Founder')),
                      DropdownMenuItem(value: 'corporate', child: Text('Corporate')),
                      DropdownMenuItem(value: 'creative', child: Text('Creative')),
                      DropdownMenuItem(value: 'athlete', child: Text('Athlete')),
                      DropdownMenuItem(value: 'other', child: Text('Other')),
                    ],
                    onChanged: (v) {
                      if (v != null) setState(() => _selectedOccupation = v);
                    },
                  ),
                ),
              ],
            ),

            const SizedBox(height: 10),

            // Experience Level
            DropdownButtonFormField<String>(
              initialValue: _selectedExperience,
              dropdownColor: HunterTheme.surface,
              style: const TextStyle(color: Colors.white, fontSize: 13),
              decoration: _inputDecor(hint: 'Discipline Level', icon: Icons.fitness_center),
              items: const [
                DropdownMenuItem(value: 'beginner', child: Text('Beginner (E-Rank Start)')),
                DropdownMenuItem(value: 'intermediate', child: Text('Intermediate (Consistent)')),
                DropdownMenuItem(value: 'advanced', child: Text('Advanced (High Intensity)')),
              ],
              onChanged: (v) {
                if (v != null) setState(() => _selectedExperience = v);
              },
            ),

            const SizedBox(height: 10),

            // Primary Goal
            TextFormField(
              controller: _registerGoalController,
              maxLength: 120,
              style: const TextStyle(color: Colors.white, fontSize: 13.5),
              decoration: _inputDecor(
                hint: 'Primary 30-Day Goal *',
                icon: Icons.flag_outlined,
              ),
              validator: (val) {
                final v = val?.trim() ?? '';
                if (v.length < 4) return 'Enter your main goal (min 4 chars)';
                return null;
              },
            ),

            const SizedBox(height: 6),

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
                  validator: (val) {
                    final v = val?.trim() ?? '';
                    if (v.isEmpty) return null;
                    if (!RegExp(r'^[A-Za-z0-9]{4,20}$').hasMatch(v)) {
                      return 'Referral code must be 4-20 alphanumeric chars';
                    }
                    return null;
                  },
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
