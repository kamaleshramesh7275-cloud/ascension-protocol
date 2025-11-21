# Ascension Protocol - Design Guidelines

## Design Approach

**Selected Approach:** Reference-Based with Anime/RPG Game UI Inspiration

Drawing from:
- **Genshin Impact** / **Persona 5** - Bold, dynamic UI with clear hierarchy and engaging animations
- **Habitica** - Gamification patterns that motivate daily engagement
- **Honkai: Star Rail** - Clean stat displays and progression visualization
- **Duolingo** - Addictive progress mechanics and celebratory moments

**Core Design Principles:**
1. **Empowerment Through Visibility** - Stats, XP, and progress must be immediately readable and satisfying
2. **Ceremonial Progression** - Level-ups, quest completions, and rank upgrades deserve celebration
3. **Clarity in Complexity** - RPG systems are data-rich; design must simplify without dumbing down
4. **Kinetic Energy** - Subtle motion suggests growth and aliveness without distraction

---

## Typography System

**Font Families:**
- **Primary (UI/Body):** Inter or DM Sans (Google Fonts) - clean, highly legible for stats and data
- **Display (Headers/Ranks):** Exo 2 or Orbitron (Google Fonts) - futuristic, game-like for tier badges and major headings

**Type Scale:**
- Rank badges/Hero numbers: text-6xl to text-8xl (60-96px) - bold weight
- Page headers: text-4xl (36px) - semibold
- Section titles: text-2xl (24px) - semibold
- Quest titles: text-lg (18px) - medium
- Body/descriptions: text-base (16px) - regular
- Stats/metadata: text-sm (14px) - medium
- Micro-labels: text-xs (12px) - medium

---

## Layout System

**Spacing Primitives:** Use Tailwind units of **2, 4, 6, 8, 12, 16, 20** consistently
- Component padding: p-4 to p-6
- Section spacing: gap-8, py-12 to py-16
- Card spacing: p-6
- Tight groupings: gap-2
- Major sections: mb-12 to mb-20

**Grid Patterns:**
- Dashboard: Asymmetric grid (2:1 ratio) - main content wider than sidebar
- Stats page: 7-column grid for stat bars (one per attribute)
- Quest cards: grid-cols-1 md:grid-cols-2 lg:grid-cols-3
- Leaderboard: Single column with alternating emphasis on top 3

**Container Strategy:**
- App shell: max-w-7xl mx-auto px-4
- Cards: rounded-xl with subtle border
- Stat containers: Full-width with internal max-width constraints

---

## Component Library

### Navigation
- **Sidebar navigation** (desktop): Fixed left, w-64, vertical nav with icon + label
- **Bottom tab bar** (mobile): Fixed bottom, 5 core tabs (Dashboard, Quests, Stats, Rank, Profile)
- Active state: Distinct border accent (left border-l-4 for sidebar, top border-t-4 for mobile)

### Dashboard Components

**XP Progress Bar:**
- Full-width, height h-8 to h-12
- Show current XP / next threshold
- Segmented visualization showing tier thresholds
- Percentage fill with subtle gradient or pattern
- Large, bold XP numbers overlaid (text-2xl)

**Stat Bars (7 attributes):**
- Horizontal bars, h-6 each
- Stat name (left), value/100 (right), fill bar (center)
- Group in card with gap-3 between bars
- Consider stacked layout for mobile

**Quest Cards:**
- Compact card design: p-6, rounded-xl
- Quest type badge (top-right): "Daily" / "Weekly" / "AI"
- Title (text-lg semibold)
- Description (text-sm, 2-line clamp)
- Reward preview: "+50 XP" + stat icons with deltas
- Complete button: Prominent, full-width at bottom
- Completed state: Reduced opacity, checkmark overlay

**Rank Badge:**
- Large circular or hexagonal badge
- Tier letter (D/C/B/A/S) - massive text (text-6xl or text-8xl)
- Current level number below
- Border treatment that suggests tier hierarchy

**Streak Counter:**
- Flame icon + number
- Positioned near user profile or XP bar
- Animate on increment

### Quests Page

**Quest Filters:**
- Horizontal pill buttons: "All" / "Daily" / "Weekly" / "AI"
- Active filter has distinct treatment

**Quest List:**
- Card grid with hover state (subtle lift: hover:shadow-lg hover:-translate-y-1)
- Quick-complete button on hover or always visible on mobile

### Stats Page

**Stat Visualization Options:**
- **Radar chart** (preferred for desktop) - 7-point spider graph
- **Stacked horizontal bars** (fallback for mobile or accessibility)
- Historical sparklines below each stat showing 7-day trend
- Use chart library: Chart.js or Recharts via CDN

**Level & Tier Display:**
- Hero section with large rank badge
- XP breakdown: "3,250 / 3,500 XP to Rank A"
- Progress percentage

### Leaderboard (Rank Page)

**Top 3 Podium:**
- Visual hierarchy: 2nd (left), 1st (center, elevated), 3rd (right)
- Avatar, username, tier badge, XP total
- Medal icons (gold/silver/bronze)

**Rest of Leaderboard:**
- Table-style rows with alternating subtle background
- Columns: Rank #, Avatar, Username, Level, Tier, XP
- Highlight current user row with border or glow
- "Your Rank" sticky summary at top if user not in top 10

### Profile Page

**User Header:**
- Large avatar (left), username + level (right)
- Edit profile button (top-right)
- Tier badge prominently displayed
- Account created date / days active

**Recent Activity Feed:**
- Chronological list of completed quests
- Each item: timestamp, quest title, XP/stat gains
- Icons for activity type

### Onboarding Flow

**4-Step Wizard:**
1. Welcome + name input
2. Goal selection (checkboxes: Fitness, Learning, Productivity, etc.)
3. Baseline stats (auto-generated or quick self-assessment slider)
4. Tutorial overlay on dashboard (highlight XP bar, quests, etc.)

**Visual Treatment:**
- Stepper at top (1 of 4, 2 of 4...)
- Large illustration or icon per step
- Primary CTA button: "Next" / "Complete Setup"

### Modals & Overlays

**Quest Completion Celebration:**
- Modal on complete: Centered, p-8
- Success icon (checkmark burst)
- "+50 XP" large number with count-up animation
- Stat gains listed below
- Close/Continue button

**Rank Trial Challenge:**
- Full-screen overlay when triggered
- Dramatic presentation: "Rank Trial Available"
- Challenge details, accept/decline buttons

**Ascension Report:**
- Modal or dedicated page
- 5 sections (see spec): Summary, Top Gains, Weaknesses, Tasks, Motivational
- Each section in card with icon
- Share button (social share for virality)

---

## Animations (Minimal & Purposeful)

**Use Animation Only For:**
1. **XP Count-Up** - Numbers animate on quest completion (1-2 second duration)
2. **Level-Up Flash** - Brief glow or burst effect when leveling
3. **Quest Card Hover** - Subtle lift (translate-y: -4px, shadow increase)
4. **Loading States** - Skeleton screens for stat bars/quest cards
5. **Progress Bar Fill** - Smooth transition on XP gain

**Avoid:**
- Background animations
- Constant motion
- Decorative particle effects (unless rank-up moment)

**Implementation:**
- Use Tailwind's `transition-all duration-200` for hovers
- CSS keyframes for count-ups
- Framer Motion (via CDN) for celebration modals only

---

## Images

**Hero Section (Landing Page):**
- Large, immersive hero image: Anime-style character in ascension/leveling pose (glowing aura, determined expression)
- Dimensions: 1920x1080 minimum, optimized WebP
- Placement: Full-width background on landing hero, 60vh height
- Overlay: Semi-transparent gradient for text readability
- CTA buttons on hero: Blurred glass-morphism background (backdrop-blur-md)

**Dashboard:**
- No large images; focus on data visualization
- Small avatar images (64x64 or 96x96)

**Rank Badges:**
- Custom SVG or icon font for tier emblems
- Could use illustrative backgrounds for S-rank (e.g., golden aura texture)

**Leaderboard:**
- User avatars (48x48 circular)

**Profile:**
- User avatar (large, 128x128 or 160x160)

---

## Responsive Behavior

**Breakpoints:**
- Mobile: < 768px (single column, bottom nav)
- Tablet: 768px - 1024px (sidebar collapses to icon-only)
- Desktop: 1024px+ (full sidebar, multi-column layouts)

**Mobile Adaptations:**
- Stack stat bars vertically
- Quest cards: Single column
- Leaderboard: Simplified columns (hide level, show only rank/name/XP)
- Bottom navigation replaces sidebar
- Rank badge: Slightly smaller on mobile

---

## Accessibility

- All interactive elements: min-height h-12 (48px) for touch targets
- Form inputs: Consistent h-12 with clear labels
- Focus states: 2px ring on all interactive elements
- Color contrast: Ensure text meets WCAG AA (even without color specified)
- Screen reader labels on all icons

---

## Landing Page Structure

**Section 1 - Hero:**
- Large hero image (described above)
- Headline: "Level Up Your Life" (text-6xl bold)
- Subheadline: "Gamify your goals. Complete quests. Ascend to greatness." (text-xl)
- CTA buttons: "Start Free Trial" (primary) + "Watch Demo" (secondary with blurred background)

**Section 2 - How It Works (3 steps):**
- 3-column grid on desktop, stacked on mobile
- Icon + Title + Description per step
- Steps: "Complete Quests" → "Earn XP & Level Up" → "Climb the Ranks"

**Section 3 - Features Showcase:**
- 2-column alternating layout (image left, text right, then flip)
- Feature 1: AI-Generated Quests (screenshot of quest card)
- Feature 2: Track 7 Core Stats (screenshot of stats page)
- Feature 3: Weekly Ascension Reports (screenshot of report modal)
- Feature 4: Global Leaderboard (screenshot of top 3 podium)

**Section 4 - Social Proof:**
- Testimonial cards (if available) or "Join X Ascendants" stat
- 3-column grid with avatar + quote + username

**Section 5 - Pricing Teaser:**
- "Free for 30 days, then ₹99/month"
- Feature checklist

**Section 6 - CTA:**
- Final CTA: "Begin Your Ascension" button (large, py-6)
- Below: "No credit card required"

**Footer:**
- Links: About, Privacy, Terms, Contact
- Social icons
- Copyright

---

## Technical Implementation Notes

- Use Heroicons for all UI icons (via CDN)
- Chart.js for stat visualizations (via CDN)
- Google Fonts: Inter + Exo 2 (preload for performance)
- Implement skeleton loaders for all data-fetching components
- Progressive enhancement: Core functionality works without JS (forms submit)

---

**Final Emphasis:** This design balances RPG excitement with modern app usability. Every element should feel purposeful and rewarding. The user is the hero of their own story—design should amplify that feeling at every touchpoint.