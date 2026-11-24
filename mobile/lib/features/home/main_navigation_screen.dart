import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:connectivity_plus/connectivity_plus.dart';
import '../../core/theme/hunter_theme.dart';
import '../../core/providers/auth_provider.dart';
import '../../models/user_model.dart';
import '../quests/quests_screen.dart';
import '../stats/stats_screen.dart';
import '../focus/focus_screen.dart';
import '../debrief/debrief_screen.dart';

class MainNavigationScreen extends ConsumerStatefulWidget {
  final UserModel? initialUser;
  const MainNavigationScreen({super.key, this.initialUser});

  @override
  ConsumerState<MainNavigationScreen> createState() => _MainNavigationScreenState();
}

class _MainNavigationScreenState extends ConsumerState<MainNavigationScreen> {
  int _currentIndex = 0;
  bool _isOffline = false;
  StreamSubscription? _connectivitySub;
  DateTime? _lastBackPressTime;

  @override
  void initState() {
    super.initState();
    _checkInitialConnectivity();
    _connectivitySub = Connectivity().onConnectivityChanged.listen((results) {
      final offline = results.every((r) => r == ConnectivityResult.none);
      if (mounted && offline != _isOffline) {
        setState(() => _isOffline = offline);
      }
    });
  }

  Future<void> _checkInitialConnectivity() async {
    try {
      final results = await Connectivity().checkConnectivity();
      final offline = results.every((r) => r == ConnectivityResult.none);
      if (mounted) setState(() => _isOffline = offline);
    } catch (_) {}
  }

  @override
  void dispose() {
    _connectivitySub?.cancel();
    super.dispose();
  }

  void _onTabTapped(int index) {
    HapticFeedback.selectionClick();
    setState(() => _currentIndex = index);
  }

  void _handlePopInvoked(bool didPop, dynamic result) {
    if (didPop) return;

    // If on a secondary tab, back button returns to the home tab (Quests)
    if (_currentIndex != 0) {
      setState(() => _currentIndex = 0);
      return;
    }

    // On tab 0 (Quests): double-tap back to exit application safely
    final now = DateTime.now();
    if (_lastBackPressTime == null || now.difference(_lastBackPressTime!) > const Duration(seconds: 2)) {
      _lastBackPressTime = now;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          backgroundColor: HunterTheme.surface,
          duration: Duration(seconds: 2),
          content: Text(
            'Press back again to exit Ascension Protocol',
            style: TextStyle(color: HunterTheme.cyanLight),
          ),
        ),
      );
    } else {
      SystemNavigator.pop();
    }
  }

  @override
  Widget build(BuildContext context) {
    final authState = ref.watch(authProvider);
    final user = authState.value ?? widget.initialUser ?? const UserModel(
      id: 'guest',
      name: 'Hunter Shadow',
      email: 'hunter@ascension.app',
      level: 1,
      xp: 0,
      tier: 'D',
      streak: 1,
      coins: 100,
      hunterClass: 'assassin',
      streakShields: 1,
      activeRecoveryDay: false,
      onboardingCompleted: true,
      strength: 15,
      agility: 20,
      stamina: 12,
      vitality: 15,
      intelligence: 18,
      willpower: 25,
      charisma: 14,
    );

    final screens = [
      QuestsScreen(user: user),
      StatsScreen(user: user),
      const FocusScreen(),
      DebriefScreen(user: user),
    ];

    return PopScope(
      canPop: false,
      onPopInvokedWithResult: _handlePopInvoked,
      child: Scaffold(
        backgroundColor: HunterTheme.abyss,
        body: Column(
          children: [
            // Amber Offline Mode Banner
            if (_isOffline)
              SafeArea(
                bottom: false,
                child: Container(
                  width: double.infinity,
                  color: Colors.amber.shade800,
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: const [
                      Icon(Icons.wifi_off, color: Colors.white, size: 14),
                      SizedBox(width: 8),
                      Text(
                        'OFFLINE MODE — Local records will sync on reconnect',
                        style: TextStyle(
                          color: Colors.white,
                          fontWeight: FontWeight.bold,
                          fontSize: 11,
                          letterSpacing: 0.8,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            Expanded(
              child: IndexedStack(
                index: _currentIndex,
                children: screens,
              ),
            ),
          ],
        ),
        bottomNavigationBar: Container(
          decoration: BoxDecoration(
            color: HunterTheme.abyss,
            border: Border(
              top: BorderSide(
                color: HunterTheme.cyan.withValues(alpha: 0.2),
                width: 1,
              ),
            ),
          ),
          child: BottomNavigationBar(
            currentIndex: _currentIndex,
            onTap: _onTabTapped,
            backgroundColor: HunterTheme.abyss,
            selectedItemColor: HunterTheme.cyan,
            unselectedItemColor: HunterTheme.textMuted,
            selectedLabelStyle: const TextStyle(fontWeight: FontWeight.bold, fontSize: 11),
            unselectedLabelStyle: const TextStyle(fontSize: 10),
            items: const [
              BottomNavigationBarItem(
                icon: Icon(Icons.assignment_outlined),
                activeIcon: Icon(Icons.assignment, color: HunterTheme.cyan),
                label: 'QUESTS',
              ),
              BottomNavigationBarItem(
                icon: Icon(Icons.radar_outlined),
                activeIcon: Icon(Icons.radar, color: HunterTheme.cyan),
                label: 'STATS',
              ),
              BottomNavigationBarItem(
                icon: Icon(Icons.timer_outlined),
                activeIcon: Icon(Icons.timer, color: HunterTheme.cyan),
                label: 'FOCUS',
              ),
              BottomNavigationBarItem(
                icon: Icon(Icons.shield_outlined),
                activeIcon: Icon(Icons.shield, color: HunterTheme.cyan),
                label: 'DEBRIEF',
              ),
            ],
          ),
        ),
      ),
    );
  }
}
