import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'core/theme/hunter_theme.dart';
import 'models/user_model.dart';
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

class AscensionMobileApp extends StatelessWidget {
  const AscensionMobileApp({super.key});

  @override
  Widget build(BuildContext context) {
    // Initializing state model (will be bound to Riverpod AuthProvider)
    const initialUser = UserModel(
      id: 'hunter_active',
      name: 'Hunter Sung',
      email: 'hunter@ascension.app',
      level: 14,
      xp: 45,
      tier: 'B',
      streak: 8,
      coins: 450,
      hunterClass: 'Shadow Monarch',
      streakShields: 2,
      activeRecoveryDay: false,
      strength: 78,
      agility: 82,
      stamina: 65,
      vitality: 70,
      intelligence: 88,
      willpower: 92,
      charisma: 60,
    );

    return MaterialApp(
      title: 'Ascension Protocol',
      debugShowCheckedModeBanner: false,
      theme: HunterTheme.darkTheme,
      home: const MainNavigationScreen(user: initialUser),
    );
  }
}
