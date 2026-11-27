import 'dart:async';
import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/notifications/notification_service.dart';
import '../../core/providers/appearance_provider.dart';
import '../../core/providers/auth_provider.dart';
import '../../core/providers/quests_provider.dart';
import '../../core/storage/session_storage.dart';
import '../../core/theme/hunter_theme.dart';
import '../../core/widgets/home_widget_bridge.dart';
import '../../core/widgets/system_command_sheet.dart';
import '../../models/quest_model.dart';
import '../../models/user_model.dart';
import '../accountability/contracts_arena_screen.dart';
import '../arsenal/arsenal_hub_screen.dart';
import '../debrief/debrief_screen.dart';
import '../divisions/rival_divisions_screen.dart';
import '../feedback/post_registration_feedback_dialog.dart';
import '../focus/focus_screen.dart';
import '../quests/quests_screen.dart';
import '../shop/shop_screen.dart';
import '../stats/stats_screen.dart';
import '../stats/weekly_recap_sheet.dart';
import '../workout/workout_screen.dart';
import 'home_screen.dart';

class MainNavigationScreen extends ConsumerStatefulWidget {
  final UserModel? initialUser;
  const MainNavigationScreen({super.key, this.initialUser});

  @override
  ConsumerState<MainNavigationScreen> createState() =>
      _MainNavigationScreenState();
}

class _MainNavigationScreenState extends ConsumerState<MainNavigationScreen>
    with WidgetsBindingObserver {
  int _currentIndex = 0;
  late final PageController _pageController = PageController(initialPage: 0);
  bool _isOffline = false;
  StreamSubscription? _connectivitySub;
  StreamSubscription<String>? _notificationRouteSub;
  StreamSubscription<String>? _widgetRouteSub;
  DateTime? _lastBackPressTime;
  Timer? _feedbackTimer;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    _checkInitialConnectivity();
    _connectivitySub = Connectivity().onConnectivityChanged.listen((results) {
      final offline = results.every((r) => r == ConnectivityResult.none);
      if (mounted && offline != _isOffline) {
        setState(() => _isOffline = offline);
      }
    });
    _notificationRouteSub =
        NotificationService.routeStream.listen(_handleDeepLinkRoute);
    HomeWidgetBridge.initializeDeepLinkListener();
    _widgetRouteSub =
        HomeWidgetBridge.deepLinkStream.listen(_handleDeepLinkRoute);
    Future.microtask(() async {
      final initialRoute = await HomeWidgetBridge.consumeLaunchRoute();
      if (initialRoute != null && initialRoute.isNotEmpty) {
        _handleDeepLinkRoute(initialRoute);
      }
    });
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _maybeSchedulePostRegFeedback();
    });
  }

  Future<void> _maybeSchedulePostRegFeedback() async {
    _feedbackTimer?.cancel();
    final shown = await SessionStorage.isPostRegFeedbackShown();
    final regTs = await SessionStorage.getRegistrationTimestamp();
    final delay = PostRegistrationFeedbackDialog.evaluatePopupDelay(
      registrationTimestampMs: regTs,
      alreadyShown: shown,
      nowMs: DateTime.now().millisecondsSinceEpoch,
    );
    if (delay == null || !mounted) return;
    if (delay == Duration.zero) {
      await PostRegistrationFeedbackDialog.show(context);
    } else {
      _feedbackTimer = Timer(delay, () {
        if (mounted) {
          PostRegistrationFeedbackDialog.show(context);
        }
      });
    }
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.resumed) {
      _maybeSchedulePostRegFeedback();
      HomeWidgetBridge.consumeLaunchRoute().then((route) {
        if (route != null && route.isNotEmpty) {
          _handleDeepLinkRoute(route);
        }
      });
      final u = ref.read(authProvider).value;
      if (u != null) {
        HomeWidgetBridge.syncFromState(user: u, quests: ref.read(questsProvider));
      }
    }
  }

  void _handleDeepLinkRoute(String route) {
    if (!mounted) return;
    final clean = route.toLowerCase().trim();
    if (clean.contains('quest')) {
      _onTabTapped(1);
    } else if (clean.contains('workout')) {
      _onTabTapped(2);
    } else if (clean.contains('focus')) {
      _onTabTapped(3);
    } else if (clean.contains('debrief')) {
      final u = ref.read(authProvider).value ?? widget.initialUser;
      if (u != null) {
        Navigator.of(context).push(
          MaterialPageRoute(builder: (_) => DebriefScreen(user: u)),
        );
      }
    } else if (clean.contains('arsenal')) {
      _onTabTapped(4);
    } else if (clean.contains('division')) {
      Navigator.of(context).push(
        MaterialPageRoute(builder: (_) => const RivalDivisionsScreen()),
      );
    } else if (clean.contains('shop')) {
      Navigator.of(context).push(
        MaterialPageRoute(builder: (_) => const ShopScreen()),
      );
    } else if (clean.contains('contract') ||
        clean.contains('covenant') ||
        clean.contains('arena')) {
      Navigator.of(context).push(
        MaterialPageRoute(builder: (_) => const ContractsArenaScreen()),
      );
    } else if (clean.contains('recap')) {
      WeeklyRecapSheet.show(context);
    } else if (clean.contains('stats')) {
      final u = ref.read(authProvider).value ?? widget.initialUser;
      if (u != null) {
        Navigator.of(context).push(
          MaterialPageRoute(builder: (_) => StatsScreen(user: u)),
        );
      }
    } else {
      setState(() => _currentIndex = 0);
    }
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
    WidgetsBinding.instance.removeObserver(this);
    _feedbackTimer?.cancel();
    _connectivitySub?.cancel();
    _notificationRouteSub?.cancel();
    _widgetRouteSub?.cancel();
    _pageController.dispose();
    super.dispose();
  }

  void _onTabTapped(int index) {
    HapticFeedback.selectionClick();
    setState(() => _currentIndex = index);
    if (_pageController.hasClients) {
      _pageController.animateToPage(
        index,
        duration: const Duration(milliseconds: 220),
        curve: Curves.easeOutCubic,
      );
    }
  }

  void _handlePopInvoked(bool didPop, dynamic result) {
    if (didPop) return;

    if (_currentIndex != 0) {
      setState(() => _currentIndex = 0);
      return;
    }

    final now = DateTime.now();
    if (_lastBackPressTime == null ||
        now.difference(_lastBackPressTime!) > const Duration(seconds: 2)) {
      _lastBackPressTime = now;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
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
    ref.watch(appearanceProvider);
    ref.listen<AsyncValue<UserModel?>>(authProvider, (_, next) {
      final nextUser = next.value;
      if (nextUser != null) {
        HomeWidgetBridge.syncFromState(
          user: nextUser,
          quests: ref.read(questsProvider),
        );
      }
    });
    ref.listen<List<QuestModel>>(questsProvider, (_, nextQuests) {
      final currentUser = ref.read(authProvider).value;
      if (currentUser != null) {
        HomeWidgetBridge.syncFromState(
          user: currentUser,
          quests: nextQuests,
        );
      }
    });

    final authState = ref.watch(authProvider);
    final user = authState.value ??
        widget.initialUser ??
        const UserModel(
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
      HomeScreen(
        user: user,
        onNavigateTab: _onTabTapped,
        onOpenSystemCommand: () => SystemCommandSheet.show(context, user),
      ),
      QuestsScreen(user: user),
      const WorkoutScreen(),
      const FocusScreen(),
      ArsenalHubScreen(user: user),
    ];

    final navAccent = user.inPenaltyZone ? HunterTheme.crimson : HunterTheme.cyan;

    return PopScope(
      canPop: false,
      onPopInvokedWithResult: _handlePopInvoked,
      child: Scaffold(
        backgroundColor: HunterTheme.abyss,
        body: Column(
          children: [
            if (_isOffline)
              SafeArea(
                bottom: false,
                child: Container(
                  width: double.infinity,
                  color: Colors.amber.shade800,
                  padding:
                      const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
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
              child: PageView(
                controller: _pageController,
                onPageChanged: (idx) {
                  if (_currentIndex != idx) {
                    HapticFeedback.selectionClick();
                    setState(() => _currentIndex = idx);
                  }
                },
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
                color: navAccent.withValues(alpha: 0.4),
                width: 1.2,
              ),
            ),
          ),
          child: SafeArea(
            top: false,
            child: Row(
              children: [
                _navItem(0, Icons.home_outlined, Icons.home_rounded, 'HOME', navAccent),
                _navItem(1, Icons.assignment_outlined, Icons.assignment, 'QUESTS', navAccent),
                _navItem(2, Icons.fitness_center_outlined, Icons.fitness_center, 'WORKOUT', navAccent),
                _navItem(3, Icons.timer_outlined, Icons.timer, 'FOCUS', navAccent),
                _navItem(
                  4,
                  Icons.dashboard_customize_outlined,
                  Icons.dashboard_customize,
                  'ARSENAL',
                  navAccent,
                  onLongPress: () {
                    HapticFeedback.mediumImpact();
                    SystemCommandSheet.show(context, user);
                  },
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _navItem(
    int index,
    IconData icon,
    IconData activeIcon,
    String label,
    Color accent, {
    VoidCallback? onLongPress,
  }) {
    final selected = _currentIndex == index;
    return Expanded(
      child: Semantics(
        button: true,
        selected: selected,
        label: label,
        child: InkWell(
          onTap: () => _onTabTapped(index),
          onLongPress: onLongPress,
          child: ConstrainedBox(
            constraints: const BoxConstraints(minHeight: 56),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                AnimatedContainer(
                  duration: const Duration(milliseconds: 180),
                  width: selected ? 26 : 0,
                  height: 3,
                  margin: const EdgeInsets.only(bottom: 5),
                  decoration: BoxDecoration(
                    color: selected ? accent : Colors.transparent,
                    borderRadius: BorderRadius.circular(2),
                    boxShadow: selected
                        ? [BoxShadow(color: accent.withValues(alpha: 0.7), blurRadius: 8)]
                        : null,
                  ),
                ),
                Icon(
                  selected ? activeIcon : icon,
                  size: 22,
                  color: selected ? accent : HunterTheme.textMuted,
                ),
                const SizedBox(height: 3),
                Text(
                  label,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: TextStyle(
                    color: selected ? accent : HunterTheme.textMuted,
                    fontWeight: selected ? FontWeight.w900 : FontWeight.w600,
                    fontSize: 10,
                    letterSpacing: 0.6,
                  ),
                ),
                const SizedBox(height: 4),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
