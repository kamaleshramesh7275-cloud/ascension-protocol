import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'core/theme/hunter_theme.dart';
import 'core/providers/auth_provider.dart';
import 'features/auth/login_screen.dart';
import 'features/briefing/briefing_screen.dart';
import 'features/home/main_navigation_screen.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Immersive Edge-to-Edge System Bar Styling
  SystemChrome.setSystemUIOverlayStyle(
    const SystemUiOverlayStyle(
      statusBarColor: Colors.transparent,
      statusBarIconBrightness: Brightness.light,
      systemNavigationBarColor: HunterTheme.abyss,
      systemNavigationBarIconBrightness: Brightness.light,
    ),
  );

  runApp(
    const ProviderScope(
      child: AscensionMobileApp(),
    ),
  );
}

class AscensionMobileApp extends ConsumerWidget {
  const AscensionMobileApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final authState = ref.watch(authProvider);

    return MaterialApp(
      title: 'Ascension Protocol',
      debugShowCheckedModeBanner: false,
      theme: HunterTheme.darkTheme,
      home: authState.when(
        data: (user) {
          if (user != null) {
            if (!user.onboardingCompleted) {
              return BriefingScreen(user: user);
            }
            return MainNavigationScreen(user: user);
          }
          return const LoginScreen();
        },
        loading: () => Scaffold(
          backgroundColor: HunterTheme.abyss,
          body: Center(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Container(
                  width: 56,
                  height: 56,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    gradient: const LinearGradient(
                      colors: [HunterTheme.cyan, HunterTheme.purple],
                    ),
                  ),
                  child: const Center(
                    child: CircularProgressIndicator(
                      strokeWidth: 3,
                      valueColor: AlwaysStoppedAnimation<Color>(Colors.black),
                    ),
                  ),
                ),
                const SizedBox(height: 20),
                const Text(
                  'AWAKENING HUNTER SYSTEM...',
                  style: TextStyle(
                    color: HunterTheme.cyanLight,
                    fontWeight: FontWeight.bold,
                    letterSpacing: 2,
                    fontSize: 12,
                  ),
                ),
              ],
            ),
          ),
        ),
        error: (_, _) => const LoginScreen(),
      ),
    );
  }
}
