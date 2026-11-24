# ASCENSION PROTOCOL — FLUTTER MOBILE APP ARCHITECTURAL CONTEXT

> **Purpose**: This document contains complete, exhaustive context about the Ascension Protocol Flutter mobile client (`ascension_mobile`). It is specifically written to provide an incoming AI engineer (such as Claude) with 100% of the architectural, state management, networking, data modeling, feature implementation, and testing context required to work on this app without any guesswork.

---

## 1. Executive Summary & Product Vision

* **App Name**: `ascension_mobile` (Package: `in.ascensions.app`)
* **Framework**: Flutter 3.x / Dart SDK `^3.14.0`
* **Target Platforms**: Android (Primary target with hardware keystore & edge-to-edge styling) & iOS.
* **Production Backend**: `https://ascensions.in` (Node.js, Express, PostgreSQL via Drizzle ORM, WebSocket, Firebase Auth).
* **Genre & Theme**: Solo Leveling / Cyberpunk real-life gamified discipline protocol.
  * Real-world fitness, study habits, and productivity are framed as a "Hunter System".
  * Users have **Hunter Ranks** (`E`, `D`, `C`, `B`, `A`, `S`), **Levels**, **XP**, **Streaks**, and **Mana Shields**.
  * Characters possess **7 Core Real-Life Attributes** (Strength, Agility, Stamina, Vitality, Intelligence, Willpower, Charisma) evaluated on a 1–100 scale.
  * Maintaining daily streaks grants escalating Telemetry Multipliers (`1.0x` up to `3.0x`).
  * "Mana Shields" absorb missed days or allow an "Active Recovery Day" without breaking streaks.

---

## 2. Directory Structure & File Map

```
mobile/
├── android/                             # Native Android configuration (Kotlin DSL, MinSdk 21+, Java 17)
├── lib/
│   ├── main.dart                        # App entry point, ProviderScope, Theme & Route Gateway
│   ├── core/
│   │   ├── api/
│   │   │   ├── api_client.dart          # Dio singleton, dynamic header injection (x-firebase-uid)
│   │   │   ├── api_endpoints.dart       # Production endpoint constants (Base: https://ascensions.in)
│   │   │   └── auth_repository.dart     # Google Sign-in & Profile retrieval via Dio
│   │   ├── providers/
│   │   │   ├── auth_provider.dart       # Riverpod AuthStateNotifier (User state, Guest login, Session)
│   │   │   └── quests_provider.dart     # Riverpod QuestsNotifier (Optimistic toggle, XP sync)
│   │   ├── storage/
│   │   │   └── session_storage.dart     # FlutterSecureStorage (Tokens, Guest UID, Custom Base URL)
│   │   └── theme/
│   │       └── hunter_theme.dart        # Solo Leveling dark cyberpunk theme (Abyss, Cyan, Gold, Purple)
│   ├── features/
│   │   ├── auth/
│   │   │   └── login_screen.dart        # 1-Tap Google Sign-In & Persistent Guest Access
│   │   ├── briefing/
│   │   │   └── briefing_screen.dart     # 4-Layer Onboarding (Physical, Archetype, Gear, Covenant Oath)
│   │   ├── home/
│   │   │   └── main_navigation_screen.dart # IndexedStack with 4 sectors (Quests, Stats, Focus, Debrief)
│   │   ├── quests/
│   │   │   └── quests_screen.dart       # Top HUD (Rank/Level/XP/Streak/Shields) & Filterable Quests
│   │   ├── stats/
│   │   │   ├── stats_screen.dart        # 7-Attribute Breakdown, Shield status, Dossier export
│   │   │   └── stat_radar_painter.dart  # CustomPainter rendering 7-axis glowing polygon with labels
│   │   ├── focus/
│   │   │   └── focus_screen.dart        # Air-Gap deep work timer, wall-clock tracking, reward claim
│   │   └── debrief/
│   │       └── debrief_screen.dart      # Evening review, 1-5 star rating, Mana Shield rest day
│   └── models/
│       ├── user_model.dart              # User schema, level/XP threshold calculation
│       └── quest_model.dart             # Server quest schema parser (rewardXP, rewardStats, isBoss)
└── test/
    ├── architecture/                    # Reusable RUT-Standard Testing Framework
    │   ├── rut_harness.dart             # Test harness, in-memory keystore & SharedPreferences mock
    │   ├── rut_robot.dart               # User simulation robot (taps, gestures, navigation)
    │   └── scanners/
    │       ├── navigation_dead_end_scanner.dart # Proves all screens have exit/forward paths
    │       └── dead_button_scanner.dart # Detects permanently disabled or empty button callbacks
    ├── pillars/                         # 7 Behavioral Test Suites (Pillar 1 through Pillar 7)
    │   ├── p1_access_and_identity_test.dart
    │   ├── p2_navigation_topology_test.dart
    │   ├── p3_reactivity_and_speed_test.dart
    │   ├── p4_functional_integrity_test.dart
    │   ├── p5_cold_boot_persistence_test.dart
    │   ├── p6_bidirectional_sync_test.dart
    │   └── p7_security_and_keystore_test.dart
    └── journeys/
        └── journey_real_user_flow_test.dart # Full E2E user flow (Cold boot -> Guest -> 4 tabs)
```

---

## 3. Core Dependencies (`pubspec.yaml`)

```yaml
dependencies:
  flutter:
    sdk: flutter
  flutter_riverpod: ^2.5.1       # Reactive state management
  dio: ^5.4.3+1                  # HTTP client with interceptors
  connectivity_plus: ^6.0.3      # Network connectivity awareness
  google_sign_in: ^6.2.1         # Native Android 1-Tap Google Sign-In
  flutter_secure_storage: ^9.0.0 # Encrypted hardware-backed keystore
  shared_preferences: ^2.2.3     # Local key-value preferences
  google_fonts: ^6.2.1           # Rajdhani & Orbitron typography
  flutter_animate: ^4.5.0        # Smooth cyberpunk entry & pulse animations
  cupertino_icons: ^1.0.8
  audioplayers: ^6.0.0           # Tactical SFX engine
  intl: ^0.19.0                  # Date and currency formatting

dev_dependencies:
  flutter_test:
    sdk: flutter
  flutter_lints: ^6.0.0
```

---

## 4. Production Backend Integration Protocol

### 4.1 The Ironclad Header Requirement: `x-firebase-uid`
The production backend at `https://ascensions.in` protects routes using `server/middleware/auth.ts`:
```typescript
export async function requireAuth(req: Request, res: Response, next: Function) {
    const firebaseUid = req.headers["x-firebase-uid"] as string;
    if (!firebaseUid) {
        return res.status(401).json({ error: "Unauthorized" });
    }
    // Authenticates user or auto-provisions guest session
}
```
**CRITICAL RULE**: Every outgoing HTTP request from Flutter **MUST** include the `x-firebase-uid` header. 
* For Google users: their verified Google/Firebase UID.
* For Guest users: a persistent UID formatted as `guest_<timestamp>_<random>`.

This is handled centrally in `ApiClient` via an interceptor:
```dart
// lib/core/api/api_client.dart
_dio!.interceptors.add(
  InterceptorsWrapper(
    onRequest: (options, handler) async {
      final firebaseUid = await SessionStorage.getFirebaseUid();
      if (firebaseUid != null && firebaseUid.isNotEmpty) {
        options.headers['x-firebase-uid'] = firebaseUid;
      }
      final token = await SessionStorage.getToken();
      if (token != null && token.isNotEmpty) {
        options.headers['Authorization'] = 'Bearer $token';
      }
      return handler.next(options);
    },
  ),
);
```

### 4.2 Production Endpoints Matrix (`ApiEndpoints`)

| Key Constant | Production URL Path | Method | Payload / Description |
| :--- | :--- | :--- | :--- |
| `defaultBaseUrl` | `https://ascensions.in` | — | Production root |
| `authGoogle` | `/api/auth/login-google` | `POST` | `{ firebaseUid, email, displayName, photoUrl, idToken }` |
| `authMe` | `/api/user` | `GET` | Fetches active profile; returns `{ ...user, isPremium, ... }` |
| `onboarding` | `/api/onboarding` | `POST` | `{ hunterClass, equipmentProfile, currentGoal, pushups, onboardingCompleted: true }` |
| `quests` | `/api/quests` | `GET` | Returns `List<Quest>` (daily, weekly, boss) |
| `completeQuest(id)` | `/api/quests/:id/complete` | `POST` | Marks quest done; returns `{ quest, user, streakMultiplier, levelUp }` |
| `focusComplete` | `/api/focus/complete` | `POST` | `{ duration: int (minutes), task: String, backgroundType: String }` |
| `recoveryDay` | `/api/user/recovery-day` | `POST` | Spends 1 Mana Shield to activate Active Recovery Day (preserves streak) |
| `debrief` | `/api/debrief` | `POST` | `{ rating: int (1-5), notes: String, date: 'YYYY-MM-DD' }` |

---

## 5. State Management & Data Architecture

### 5.1 `UserModel` (`lib/models/user_model.dart`)
Represents the authenticated Hunter. 
```dart
class UserModel {
  final String id;
  final String name;
  final String email;
  final String? avatarUrl;
  final int level;                     // e.g. 1, 2, 3...
  final int xp;                        // Total cumulative XP
  final String tier;                   // D, C, B, A, S
  final int streak;                    // Consecutive days active
  final int coins;                     // Gold coins currency
  final String hunterClass;            // assassin, tank, ranger, mage, monarch
  final int streakShields;             // Mana Shields available (protects streaks)
  final bool activeRecoveryDay;        // If true, today's quests are optional
  final bool onboardingCompleted;      // If false, routes to BriefingScreen

  // 7 Core Real-Life Attributes (1-100)
  final int strength;
  final int agility;
  final int stamina;
  final int vitality;
  final int intelligence;
  final int willpower;
  final int charisma;

  int get xpForNextLevel => level * 100;
  double get xpProgress => (xp % 100) / 100.0;
}
```

### 5.2 `QuestModel` (`lib/models/quest_model.dart`)
Maps incoming PostgreSQL/Express quest entities:
* Maps `rewardXP` / `reward_xp` to `xp` (Never looks only for `xp`, preventing 25 XP fallback).
* Parses `rewardStats` JSON (e.g. `{"strength": 2}`) to extract primary attribute tag (`STR`, `AGI`, `INT`...).
* Distinguishes `type` (`daily`, `weekly`, `boss`) and `category` (`fitness`, `productivity`, `mindfulness`).

### 5.3 `authProvider` (`lib/core/providers/auth_provider.dart`)
Manages `AsyncValue<UserModel?>`:
* `checkSession()`: Reads persistent UID from `SessionStorage`. Calls `GET /api/user`.
* `signInWithGoogle()`: Native Google 1-Tap sign-in, exchanges tokens, sets user.
* `loginGuest()`: Ensures a persistent `guest_uid` exists in `FlutterSecureStorage`, sets default or server profile.
* `updateUser(UserModel updatedUser)`: **Crucial method** for live UI synchronization. Called synchronously by `QuestsNotifier` and `FocusScreen` so XP, coins, and level animate on the UI without reloading.
* `logout()`: Clears storage, purges Dio cache, returns user state to `null`.

### 5.4 `questsProvider` (`lib/core/providers/quests_provider.dart`)
Manages `List<QuestModel>`:
* Seeds immediately with `defaultQuests` so UI never flickers an empty state.
* `loadQuests()`: Fetches `/api/quests` from production.
* `toggleQuest(questId)`:
  1. Optimistically updates UI list state in `< 16ms`.
  2. Dispatches `POST /api/quests/:questId/complete`.
  3. On success, receives updated `user` object from server and calls `_ref.read(authProvider.notifier).updateUser(updatedUser)`.
  4. If offline/error, calculates local XP delta and updates user locally.

---

## 6. Screen Features & UI Walkthrough

### 6.1 Theme & Design Language (`HunterTheme`)
* **Palette**:
  * `abyss`: `#020617` (Deep space black)
  * `surface`: `#0B132B` (Dark navy card container)
  * `surfaceLight`: `#1C2541` (Elevated container)
  * `cyan`: `#06B6D4` (Primary hunter neon blue)
  * `cyanLight`: `#67E8F9` (High-contrast text)
  * `purple`: `#8B5CF6` (Mage/Mana secondary neon)
  * `gold`: `#EAB308` (Legendary XP / Streak fire)
  * `crimson`: `#EF4444` (Boss/Health/Strength)
  * `emerald`: `#10B981` (Recovery/Stamina)
* **Fonts**: `GoogleFonts.rajdhani` (Body and labels), `GoogleFonts.orbitron` (Titles and badges).

### 6.2 `LoginScreen` (`features/auth/login_screen.dart`)
* Solo Leveling awakened emblem badge.
* Native Google Sign-In with loading indicator and error SnackBar.
* "CONTINUE AS GUEST HUNTER" button creating a persistent keystore session.

### 6.3 `BriefingScreen` (`features/briefing/briefing_screen.dart`)
* 4-Layer Guided Awakening:
  1. *Physical Calibration*: Slider for max single-set pushups and primary goal input.
  2. *Archetype Selection*: Cards for Assassin, Tank, Ranger, Mage, Shadow Monarch.
  3. *Equipment Loadout*: Bodyweight, Dumbbells & Bands, Full Gym.
  4. *The Hunter Covenant Oath*: Final vow affirming discipline.
* Tapping "AFFIRM OATH & AWAKEN" calls `POST /api/onboarding`, calls `authProvider.notifier.updateUser()`, and navigates to the HUD.

### 6.4 `MainNavigationScreen` (`features/home/main_navigation_screen.dart`)
* Edge-to-edge `IndexedStack` preserving state across 4 sectors.
* Listens reactively to `ref.watch(authProvider)`.

#### Sector 1: `QuestsScreen` (`features/quests/quests_screen.dart`)
* **Hunter HUD**: Displays Rank (`RANK D`), Class & Level (`LV. 2 ASSASSIN`), Streak count (`STREAK: 5 DAYS 🔥`), Mana Shields badge, and animated XP linear bar.
* **Filter Chips**: `ALL`, `DAILY` (filters physical/fitness), `BOSS` (filters boss raids), `INTELLECT` (filters deep work/mental).
* **Quest Cards**: Checkbox with neon emerald fill, rank badge (`[RANK C]`), XP reward (`+50 XP • AGI`), strikethrough on completion.

#### Sector 2: `StatsScreen` & `StatRadarPainter` (`features/stats/`)
* **7-Axis Glowing Radar**: Custom canvas drawing 4 concentric 7-sided polygon rings, axes, and translucent cyan/purple gradient polygon with neon vertex dots.
* **Vertex Labels**: Uses `TextPainter` to render `STR`, `AGI`, `STA`, `VIT`, `INT`, `WIL`, `CHA` directly outside each vertex.
* **Attribute Bars**: 7 progress bars showing exact numerical score out of 100 with color coding.
* **Mana Shield Vault**: Shows remaining shields.
* **AppBar Action**: "Export Attribute Dossier" button ensuring screen has interactive capability.

#### Sector 3: `FocusScreen` (`features/focus/focus_screen.dart`)
* **Air-Gap Deep Work**: Circular countdown visualizer with presets for `15m`, `25m`, `45m`, `60m`.
* **Wall-Clock Accuracy**: Calculates remaining time via `DateTime.now()` delta against `_targetEndTime` (zero drift if app is backgrounded or locked).
* **Crash-Guarded**: All timer callbacks check `if (!mounted) return;`.
* **Claim Reward**: On completion, displays dialog; tapping "CLAIM REWARD" sends `POST /api/focus/complete`, awards Intellect/Willpower XP, and updates the HUD.

#### Sector 4: `DebriefScreen` (`features/debrief/debrief_screen.dart`)
* **Day Conclusion Protocol**: 1–5 Gold Star rating for daily discipline evaluation.
* **Friction & Wins Log**: Multi-line TextField for journaling.
* **Conclude Protocol**: Calls `POST /api/debrief` and locks debrief state.
* **Active Recovery Day Card**: Allows deploying 1 Mana Shield via `POST /api/user/recovery-day` to preserve streaks during illness or exhaustion.

---

## 7. Standard Real-User Testing Architecture (RUT-Standard)

The test suite in `mobile/test/` adheres to a strict 7-pillar user behavioral QA framework:

```
mobile/test/
├── architecture/
│   ├── rut_robot.dart                         # User simulation robot (tap, enter text, scroll, assert feedback)
│   ├── rut_harness.dart                       # Mock production server, container overrides, fake storage
│   └── scanners/
│       ├── navigation_dead_end_scanner.dart   # Checks all screens for dead-ends and exit paths
│       └── dead_button_scanner.dart           # Checks every button callback for functional execution
├── pillars/
│   ├── p1_access_and_identity_test.dart       # Tests login, session persistence, logout
│   ├── p2_navigation_topology_test.dart       # Asserts zero dead-end screens across all routes
│   ├── p3_reactivity_and_speed_test.dart      # Asserts optimistic UI state change in < 50ms
│   ├── p4_functional_integrity_test.dart      # Verifies schema parsing & filter chip integrity
│   ├── p5_cold_boot_persistence_test.dart     # Verifies data survives process death & restart
│   ├── p6_bidirectional_sync_test.dart        # Proves quest completion immediately updates HUD XP
│   └── p7_security_and_keystore_test.dart     # Proves x-firebase-uid injection & https endpoint lock
└── journeys/
    └── journey_real_user_flow_test.dart       # Full E2E user flow: Boot -> Guest -> Navigate 4 tabs
```

### Running Tests
To run all tests and static analysis:
```powershell
cd mobile
flutter test
flutter analyze
```

---

## 8. Invariants & Rules for Future Development

When modifying or adding features to this Flutter codebase, you **MUST** follow these rules:

1. **Header Invariant**: Never create a raw `Dio` instance without using `ApiClient.getInstance()`. All requests must carry `x-firebase-uid`.
2. **State Synchronization Invariant**: When an action rewards XP or alters user stats (quests, focus, debrief, shop), you **MUST** call `ref.read(authProvider.notifier).updateUser(updatedUser)` so the Top HUD, level bar, and radar reflect the change immediately.
3. **Dead-End Invariant**: Every screen must have either a visible action button, AppBar leading/back control, or bottom navigation bar. Never render a dead-end scrollable view without an actionable header or floating control.
4. **Reactivity Invariant**: Checkboxes and interactive buttons must trigger optimistic state changes immediately (`< 16ms`) with haptic feedback (`HapticFeedback.selectionClick()` or `mediumImpact()`), then sync asynchronously to the backend.
5. **Cold-Boot Invariant**: Never store critical user identity solely in memory. All user IDs and auth tokens must be stored through `SessionStorage` (`FlutterSecureStorage`).
6. **Mounted Guard Invariant**: Any asynchronous callback or timer in a `StatefulWidget` or `ConsumerStatefulWidget` that calls `setState()` or accesses `context` **MUST** be guarded by `if (!mounted) return;`.
