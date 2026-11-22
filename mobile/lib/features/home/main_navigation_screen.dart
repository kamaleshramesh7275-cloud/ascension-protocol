import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../../core/theme/hunter_theme.dart';
import '../../models/user_model.dart';
import '../quests/quests_screen.dart';
import '../stats/stats_screen.dart';
import '../focus/focus_screen.dart';
import '../debrief/debrief_screen.dart';

class MainNavigationScreen extends StatefulWidget {
  final UserModel user;
  const MainNavigationScreen({super.key, required this.user});

  @override
  State<MainNavigationScreen> createState() => _MainNavigationScreenState();
}

class _MainNavigationScreenState extends State<MainNavigationScreen> {
  int _currentIndex = 0;

  late final List<Widget> _screens;

  @override
  void initState() {
    super.initState();
    _screens = [
      QuestsScreen(user: widget.user),
      StatsScreen(user: widget.user),
      const FocusScreen(),
      DebriefScreen(user: widget.user),
    ];
  }

  void _onTabTapped(int index) {
    HapticFeedback.selectionClick();
    setState(() => _currentIndex = index);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: HunterTheme.abyss,
      body: IndexedStack(
        index: _currentIndex,
        children: _screens,
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
    );
  }
}
