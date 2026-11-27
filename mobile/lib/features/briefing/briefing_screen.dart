import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../../core/theme/hunter_theme.dart';
import '../../core/api/api_client.dart';
import '../../core/api/api_endpoints.dart';
import '../../core/providers/auth_provider.dart';
import '../../models/user_model.dart';
import '../home/main_navigation_screen.dart';

class BriefingScreen extends ConsumerStatefulWidget {
  final UserModel user;
  const BriefingScreen({super.key, required this.user});

  @override
  ConsumerState<BriefingScreen> createState() => _BriefingScreenState();
}

class _BriefingScreenState extends ConsumerState<BriefingScreen> {
  final PageController _pageController = PageController();
  int _currentStep = 0;

  // Form State
  int _pushups = 25;
  String _selectedClass = 'assassin';
  String _equipment = 'bodyweight';
  String _goalDomain = 'fitness';
  int _dailyCapacityMinutes = 90;
  final int _deadlineDays = 30;
  final TextEditingController _goalController =
      TextEditingController(text: 'Lose 6kg and complete 4 workouts/week');
  final TextEditingController _distractorController =
      TextEditingController(text: 'Late-night phone scrolling');

  final List<Map<String, dynamic>> _archetypes = [
    {
      'id': 'assassin',
      'name': 'ASSASSIN',
      'icon': Icons.flash_on,
      'color': HunterTheme.cyan,
      'trait': 'Agility & Speed',
      'desc': 'Fast habit execution, swift cardio sprints, high responsiveness.',
    },
    {
      'id': 'tank',
      'name': 'TANK',
      'icon': Icons.shield,
      'color': HunterTheme.crimson,
      'trait': 'Vitality & Resilience',
      'desc': 'Maximum endurance, cold showers, unstoppable physical willpower.',
    },
    {
      'id': 'ranger',
      'name': 'RANGER',
      'icon': Icons.navigation,
      'color': HunterTheme.emerald,
      'trait': 'Perception & Stamina',
      'desc': 'Steady endurance, tracking accuracy, consistent daily streaks.',
    },
    {
      'id': 'mage',
      'name': 'MAGE',
      'icon': Icons.auto_awesome,
      'color': HunterTheme.purple,
      'trait': 'Intelligence & Mind',
      'desc': 'Air-Gap deep work sessions, study marathons, mental supremacy.',
    },
    {
      'id': 'monarch',
      'name': 'SHADOW MONARCH',
      'icon': Icons.military_tech,
      'color': HunterTheme.gold,
      'trait': 'Sovereign Mastery',
      'desc': 'Balanced mastery of body, mind, discipline, and leadership.',
    },
  ];

  void _nextPage() {
    HapticFeedback.selectionClick();
    if (_currentStep < 3) {
      _pageController.nextPage(
        duration: const Duration(milliseconds: 300),
        curve: Curves.easeInOut,
      );
      setState(() => _currentStep++);
    }
  }

  void _prevPage() {
    HapticFeedback.selectionClick();
    if (_currentStep > 0) {
      _pageController.previousPage(
        duration: const Duration(milliseconds: 300),
        curve: Curves.easeInOut,
      );
      setState(() => _currentStep--);
    }
  }

  Future<void> _affirmOathAndAwaken() async {
    HapticFeedback.heavyImpact();

    // Persist onboarding data to production backend
    try {
      final dio = await ApiClient.getInstance();
      final res = await dio.post(
        ApiEndpoints.onboarding,
        data: {
          'hunterClass': _selectedClass,
          'equipmentProfile': _equipment,
          'currentGoal': _goalController.text.trim(),
          'goalDomain': _goalDomain,
          'dailyCapacityMinutes': _dailyCapacityMinutes,
          'deadlineDays': _deadlineDays,
          'primaryDistractor': _distractorController.text.trim(),
          'pushups': _pushups,
          'onboardingCompleted': true,
        },
      );
      if (res.data is Map<String, dynamic>) {
        final serverUser = UserModel.fromJson(res.data as Map<String, dynamic>);
        ref.read(authProvider.notifier).updateUser(serverUser);
        if (mounted) {
          Navigator.of(context).pushReplacement(
            MaterialPageRoute(
              builder: (_) => MainNavigationScreen(initialUser: serverUser),
            ),
          );
        }
        return;
      }
    } catch (_) {
      // Local fallback in case of network variance
    }

    // Create awakened user state
    final awakenedUser = UserModel(
      id: widget.user.id,
      name: widget.user.name,
      email: widget.user.email,
      phone: widget.user.phone,
      level: 1,
      xp: 100,
      tier: _selectedClass == 'monarch' ? 'C' : 'D',
      streak: 1,
      coins: 150,
      hunterClass: _selectedClass,
      streakShields: 1,
      activeRecoveryDay: false,
      onboardingCompleted: true,
      strength: _selectedClass == 'tank' ? 45 : 25,
      agility: _selectedClass == 'assassin' ? 50 : 25,
      stamina: _selectedClass == 'ranger' ? 45 : 25,
      vitality: _selectedClass == 'tank' ? 50 : 30,
      intelligence: _selectedClass == 'mage' ? 55 : 25,
      willpower: _selectedClass == 'monarch' ? 50 : 35,
      charisma: 20,
    );

    ref.read(authProvider.notifier).updateUser(awakenedUser);

    if (mounted) {
      Navigator.of(context).pushReplacement(
        MaterialPageRoute(
          builder: (_) => MainNavigationScreen(initialUser: awakenedUser),
        ),
      );
    }
  }

  @override
  void dispose() {
    _pageController.dispose();
    _goalController.dispose();
    _distractorController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: HunterTheme.abyss,
      appBar: AppBar(
        backgroundColor: HunterTheme.abyss,
        elevation: 0,
        leading: _currentStep > 0
            ? IconButton(
                icon: Icon(Icons.arrow_back, color: HunterTheme.cyanLight),
                onPressed: _prevPage,
              )
            : null,
        title: Text(
          'BRIEFING ROOM • LAYER ${_currentStep + 1}/4',
          style: Theme.of(context).textTheme.titleLarge?.copyWith(
                fontSize: 14,
                letterSpacing: 1.5,
                fontWeight: FontWeight.bold,
                color: HunterTheme.cyanLight,
              ),
        ),
        actions: [
          TextButton.icon(
            onPressed: () {
              Navigator.of(context).pushReplacement(
                MaterialPageRoute(
                  builder: (_) => MainNavigationScreen(initialUser: widget.user),
                ),
              );
            },
            icon: Icon(Icons.close, color: HunterTheme.cyanLight, size: 18),
            label: Text('EXIT', style: TextStyle(color: HunterTheme.cyanLight, fontSize: 12, fontWeight: FontWeight.bold)),
          ),
        ],
      ),
      body: SafeArea(
        child: Column(
          children: [
            // Step Progress Bar
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
              child: ClipRRect(
                borderRadius: BorderRadius.circular(4),
                child: LinearProgressIndicator(
                  value: (_currentStep + 1) / 4.0,
                  backgroundColor: HunterTheme.surface,
                  valueColor: AlwaysStoppedAnimation<Color>(HunterTheme.cyan),
                  minHeight: 4,
                ),
              ),
            ),

            // Page View
            Expanded(
              child: PageView(
                controller: _pageController,
                physics: const NeverScrollableScrollPhysics(),
                children: [
                  _buildStep1Physical(),
                  _buildStep2Archetype(),
                  _buildStep3Equipment(),
                  _buildStep4Oath(),
                ],
              ),
            ),

            // Sticky Bottom Navigation Bar (Always Visible)
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: HunterTheme.abyss,
                border: Border(
                  top: BorderSide(
                    color: HunterTheme.cyan.withValues(alpha: 0.2),
                  ),
                ),
              ),
              child: _currentStep < 3
                  ? SizedBox(
                      width: double.infinity,
                      height: 52,
                      child: ElevatedButton.icon(
                        onPressed: _nextPage,
                        icon: const Icon(Icons.arrow_forward, color: Colors.black),
                        label: const Text(
                          'PROCEED TO NEXT LAYER',
                          style: TextStyle(
                            color: Colors.black,
                            fontWeight: FontWeight.w900,
                            letterSpacing: 1,
                          ),
                        ),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: HunterTheme.cyan,
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(14),
                          ),
                        ),
                      ),
                    )
                  : SizedBox(
                      width: double.infinity,
                      height: 56,
                      child: ElevatedButton.icon(
                        onPressed: _affirmOathAndAwaken,
                        icon: const Icon(Icons.shield, color: Colors.black),
                        label: const Text(
                          'AFFIRM OATH & AWAKEN',
                          style: TextStyle(
                            color: Colors.black,
                            fontWeight: FontWeight.w900,
                            fontSize: 16,
                            letterSpacing: 1.5,
                          ),
                        ),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: HunterTheme.gold,
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(14),
                          ),
                          elevation: 8,
                        ),
                      ),
                    ),
            ),
          ],
        ),
      ),
    );
  }

  // Layer 1: Physical Benchmark
  Widget _buildStep1Physical() {
    return ListView(
      padding: const EdgeInsets.all(20),
      children: [
        Text(
          'PHYSICAL CALIBRATION',
          style: Theme.of(context).textTheme.displayMedium?.copyWith(
                fontSize: 22,
                color: Colors.white,
              ),
        ),
        const SizedBox(height: 6),
        Text(
          'Calibrate baseline stamina to tune your daily quest difficulty.',
          style: TextStyle(color: HunterTheme.textMuted, fontSize: 13),
        ),
        const SizedBox(height: 24),

        // Pushup Benchmark
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: HunterTheme.surface,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: HunterTheme.cyan.withValues(alpha: 0.2)),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    'Pushup Max (Single Set)',
                    style: TextStyle(
                      color: HunterTheme.textPrimary,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  Text(
                    '$_pushups REPS',
                    style: TextStyle(
                      color: HunterTheme.cyanLight,
                      fontWeight: FontWeight.w900,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 8),
              Slider(
                value: _pushups.toDouble(),
                min: 0,
                max: 100,
                divisions: 20,
                activeColor: HunterTheme.cyan,
                inactiveColor: HunterTheme.surfaceLight,
                onChanged: (val) {
                  setState(() => _pushups = val.toInt());
                },
              ),
            ],
          ),
        ),

        const SizedBox(height: 20),

        // Primary Goal
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: HunterTheme.surface,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: HunterTheme.cyan.withValues(alpha: 0.2)),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Goal Track & Target',
                style: TextStyle(
                  color: HunterTheme.textPrimary,
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 8),
              Wrap(
                spacing: 8,
                runSpacing: 6,
                children: const [
                  ('fitness', 'Fitness / Body'),
                  ('career_code', 'Coding / Career'),
                  ('study_exam', 'Exam / Study'),
                  ('business', 'Business / Income'),
                  ('discipline', 'Habits / Focus'),
                ].map((pair) {
                  final selected = _goalDomain == pair.$1;
                  return ChoiceChip(
                    label: Text(pair.$2, style: const TextStyle(fontSize: 12)),
                    selected: selected,
                    onSelected: (_) {
                      HapticFeedback.selectionClick();
                      setState(() {
                        _goalDomain = pair.$1;
                        if (pair.$1 == 'fitness') {
                          _goalController.text = 'Lose 6kg and hit 4 workouts/week';
                        } else if (pair.$1 == 'career_code') {
                          _goalController.text = 'Ship my portfolio project & solve 60 DSA problems';
                        } else if (pair.$1 == 'study_exam') {
                          _goalController.text = 'Clear upcoming certification exam in 30 days';
                        } else if (pair.$1 == 'business') {
                          _goalController.text = 'Launch MVP and close first 5 paying clients';
                        } else {
                          _goalController.text = 'Lock 90m morning deep focus and 7h sleep daily';
                        }
                      });
                    },
                    selectedColor: HunterTheme.cyan,
                    backgroundColor: HunterTheme.surfaceLight,
                    labelStyle: TextStyle(
                      color: selected ? Colors.black : HunterTheme.textPrimary,
                      fontWeight: FontWeight.bold,
                    ),
                  );
                }).toList(),
              ),
              const SizedBox(height: 12),
              TextField(
                controller: _goalController,
                style: TextStyle(color: HunterTheme.textPrimary),
                decoration: InputDecoration(
                  hintText: 'What specific outcome do you want in 30 days?',
                  hintStyle: TextStyle(color: HunterTheme.textMuted, fontSize: 12),
                  filled: true,
                  fillColor: HunterTheme.surfaceLight,
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12),
                    borderSide: BorderSide.none,
                  ),
                ),
              ),
              const SizedBox(height: 16),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    'Daily Available Deep-Work / Training Time',
                    style: TextStyle(
                      color: HunterTheme.textPrimary,
                      fontWeight: FontWeight.bold,
                      fontSize: 13,
                    ),
                  ),
                  Text(
                    '${_dailyCapacityMinutes}m/day',
                    style: TextStyle(
                      color: HunterTheme.cyanLight,
                      fontWeight: FontWeight.w900,
                      fontSize: 13,
                    ),
                  ),
                ],
              ),
              Slider(
                value: _dailyCapacityMinutes.toDouble(),
                min: 30,
                max: 240,
                divisions: 14,
                activeColor: HunterTheme.cyan,
                inactiveColor: HunterTheme.surfaceLight,
                onChanged: (val) => setState(() => _dailyCapacityMinutes = val.toInt()),
              ),
              const SizedBox(height: 8),
              Text(
                'Biggest Daily Distraction / Blocker',
                style: TextStyle(
                  color: HunterTheme.textPrimary,
                  fontWeight: FontWeight.bold,
                  fontSize: 13,
                ),
              ),
              const SizedBox(height: 6),
              TextField(
                controller: _distractorController,
                style: TextStyle(color: HunterTheme.textPrimary, fontSize: 13),
                decoration: InputDecoration(
                  hintText: 'e.g., Late-night phone scrolling, Reels, Fatigue',
                  hintStyle: TextStyle(color: HunterTheme.textMuted, fontSize: 12),
                  filled: true,
                  fillColor: HunterTheme.surfaceLight,
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12),
                    borderSide: BorderSide.none,
                  ),
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  // Layer 2: Archetype Selection
  Widget _buildStep2Archetype() {
    return ListView(
      padding: const EdgeInsets.all(20),
      children: [
        Text(
          'SELECT HUNTER ARCHETYPE',
          style: Theme.of(context).textTheme.displayMedium?.copyWith(
                fontSize: 22,
                color: Colors.white,
              ),
        ),
        const SizedBox(height: 6),
        Text(
          'Your archetype shapes your initial attribute distribution.',
          style: TextStyle(color: HunterTheme.textMuted, fontSize: 13),
        ),
        const SizedBox(height: 20),

        ..._archetypes.map((arch) {
          final isSelected = _selectedClass == arch['id'];
          final color = arch['color'] as Color;

          return Card(
            margin: const EdgeInsets.only(bottom: 12),
            color: isSelected ? HunterTheme.surfaceLight : HunterTheme.surface,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(16),
              side: BorderSide(
                color: isSelected ? color : color.withValues(alpha: 0.2),
                width: isSelected ? 2 : 1,
              ),
            ),
            child: InkWell(
              onTap: () {
                HapticFeedback.selectionClick();
                setState(() => _selectedClass = arch['id'] as String);
              },
              borderRadius: BorderRadius.circular(16),
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Row(
                  children: [
                    Container(
                      width: 48,
                      height: 48,
                      decoration: BoxDecoration(
                        color: color.withValues(alpha: 0.2),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Icon(arch['icon'] as IconData, color: color, size: 28),
                    ),
                    const SizedBox(width: 16),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Text(
                                arch['name'] as String,
                                style: const TextStyle(
                                  color: Colors.white,
                                  fontWeight: FontWeight.w900,
                                  fontSize: 15,
                                ),
                              ),
                              Text(
                                arch['trait'] as String,
                                style: TextStyle(
                                  color: color,
                                  fontSize: 11,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 4),
                          Text(
                            arch['desc'] as String,
                            style: TextStyle(
                              color: HunterTheme.textMuted,
                              fontSize: 12,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),
          );
        }),
      ],
    );
  }

  // Layer 3: Equipment Loadout
  Widget _buildStep3Equipment() {
    final options = [
      {
        'id': 'bodyweight',
        'title': 'BODYWEIGHT (CALISTHENICS)',
        'desc': 'No gear required. Pushups, squats, sprints, core discipline.',
        'icon': Icons.accessibility_new,
      },
      {
        'id': 'dumbbells',
        'title': 'DUMBBELLS & BANDS',
        'desc': 'Home setup with adjustable resistance equipment.',
        'icon': Icons.fitness_center,
      },
      {
        'id': 'gym',
        'title': 'FULL GYM / FITNESS CENTER',
        'desc': 'Access to barbells, cables, power racks, and heavy iron.',
        'icon': Icons.sports_gymnastics,
      },
    ];

    return ListView(
      padding: const EdgeInsets.all(20),
      children: [
        Text(
          'EQUIPMENT LOADOUT',
          style: Theme.of(context).textTheme.displayMedium?.copyWith(
                fontSize: 22,
                color: Colors.white,
              ),
        ),
        const SizedBox(height: 6),
        Text(
          'Select your available physical training environment.',
          style: TextStyle(color: HunterTheme.textMuted, fontSize: 13),
        ),
        const SizedBox(height: 24),

        ...options.map((opt) {
          final isSelected = _equipment == opt['id'];
          return Card(
            margin: const EdgeInsets.only(bottom: 12),
            color: isSelected ? HunterTheme.surfaceLight : HunterTheme.surface,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(16),
              side: BorderSide(
                color: isSelected
                    ? HunterTheme.cyan
                    : HunterTheme.cyan.withValues(alpha: 0.2),
                width: isSelected ? 2 : 1,
              ),
            ),
            child: InkWell(
              onTap: () {
                HapticFeedback.selectionClick();
                setState(() => _equipment = opt['id'] as String);
              },
              borderRadius: BorderRadius.circular(16),
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Row(
                  children: [
                    Icon(opt['icon'] as IconData,
                        color: isSelected ? HunterTheme.cyan : HunterTheme.textMuted,
                        size: 32),
                    const SizedBox(width: 16),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            opt['title'] as String,
                            style: const TextStyle(
                              color: Colors.white,
                              fontWeight: FontWeight.bold,
                              fontSize: 14,
                            ),
                          ),
                          const SizedBox(height: 2),
                          Text(
                            opt['desc'] as String,
                            style: TextStyle(
                              color: HunterTheme.textMuted,
                              fontSize: 12,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),
          );
        }),
      ],
    );
  }

  // Layer 4: The Sacred Hunter Commitment Oath
  Widget _buildStep4Oath() {
    return ListView(
      padding: const EdgeInsets.all(20),
      children: [
        Center(
          child: Container(
            width: 64,
            height: 64,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: HunterTheme.gold.withValues(alpha: 0.15),
              border: Border.all(color: HunterTheme.gold, width: 2),
            ),
            child: Icon(Icons.shield, color: HunterTheme.gold, size: 36),
          ),
        ),
        const SizedBox(height: 16),
        Center(
          child: Text(
            'THE HUNTER COVENANT',
            style: Theme.of(context).textTheme.displayMedium?.copyWith(
                  fontSize: 22,
                  color: HunterTheme.gold,
                  letterSpacing: 2,
                ),
          ),
        ),
        const SizedBox(height: 8),
        Center(
          child: Text(
            'Final Protocol Before Awakening',
            style: TextStyle(color: HunterTheme.textMuted, fontSize: 13),
          ),
        ),
        SizedBox(height: 20),

        // The Sacred Oath Text Box
        Container(
          padding: EdgeInsets.all(20),
          decoration: BoxDecoration(
            color: HunterTheme.surface,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: HunterTheme.gold.withValues(alpha: 0.4)),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                '“I, Hunter of the Ascension Protocol, hereby vow to uphold daily discipline without compromise.\n\n'
                'I accept that weakness is temporary, but surrender is permanent. I will complete my daily quests, protect my focus during air-gap protocols, and face boss dungeons with unwavering resolve.\n\n'
                'By affirming this oath, my stats are permanently unlocked, my rank is registered, and my journey begins.”',
                style: TextStyle(
                  color: HunterTheme.textPrimary,
                  fontSize: 14,
                  height: 1.6,
                  fontStyle: FontStyle.italic,
                ),
              ),
            ],
          ),
        ).animate().fadeIn(duration: 500.ms),

        SizedBox(height: 20),

        Container(
          padding: EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: HunterTheme.cyan.withValues(alpha: 0.1),
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: HunterTheme.cyan.withValues(alpha: 0.3)),
          ),
          child: Row(
            children: [
              Icon(Icons.verified, color: HunterTheme.cyan, size: 20),
              SizedBox(width: 10),
              Expanded(
                child: Text(
                  'Initial Reward: 100 XP + 1 Free Mana Shield granted upon affirmation.',
                  style: TextStyle(
                    color: HunterTheme.cyanLight,
                    fontSize: 12,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }
}
