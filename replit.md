# Ascension Protocol

## Overview

Ascension Protocol is a gamified self-improvement platform where users ("Ascendants") level up real-life stats by completing quests. The application combines RPG-style progression mechanics with AI-generated personalized challenges to create an engaging habit-forming experience.

**Core Features:**
- 7-stat progression system (Strength, Agility, Stamina, Vitality, Intelligence, Willpower, Charisma)
- XP-based leveling with tier rankings (D/C/B/A/S)
- Daily and weekly quest system (AI-generated and curated templates)
- Leaderboard and competitive elements
- Streak tracking and activity history
- Gamified UI inspired by anime/RPG games (Genshin Impact, Persona 5, Habitica)

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework:** React with Vite build system
- **Routing:** Wouter (lightweight client-side routing)
- **State Management:** TanStack Query (React Query) for server state
- **UI Framework:** Radix UI primitives with shadcn/ui components
- **Styling:** TailwindCSS with custom design tokens

**Design System:**
- Custom theme with dark/light mode support
- Typography: Inter (body/UI) and Exo 2 (headers/display)
- Anime/RPG-inspired aesthetics with ceremonial progression moments
- Responsive grid layouts with asymmetric patterns for dashboard

**Key Pages:**
- Authentication (Google OAuth via Firebase)
- Dashboard (overview, active quests, stats summary)
- Quests (filtered quest lists with completion tracking)
- Stats (detailed attribute visualization)
- Leaderboard (global rankings)
- Profile (user journey and activity history)

**Rationale:** React + Vite provides rapid development with HMR, while Wouter keeps bundle size minimal. TanStack Query handles server state caching and synchronization elegantly. Radix UI ensures accessible components, and TailwindCSS enables rapid styling iteration aligned with the RPG aesthetic.

### Backend Architecture

**Framework:** Express.js with TypeScript
- **Runtime:** Node.js with ESM modules
- **Development:** tsx for development with hot reload
- **Production:** Bundled with esbuild for optimal performance

**API Structure:**
- RESTful endpoints for CRUD operations
- Session-based authentication with Firebase UID headers
- Middleware for auth extraction and request logging
- In-memory storage implementation (MemStorage) with interface-based design for easy database migration

**Key Routes:**
- `/api/auth/register` - User registration/sync
- `/api/user` - Current user profile
- `/api/quests` - Quest CRUD operations
- `/api/quests/:id/complete` - Quest completion handler
- `/api/leaderboard` - Global rankings
- `/api/activities` - User activity history

**Rationale:** Express provides flexibility and familiarity for rapid MVP development. Interface-based storage abstraction (IStorage) allows switching from in-memory to PostgreSQL without changing business logic. Session-based auth simplifies initial development while Firebase handles complex OAuth flows.

### Data Architecture

**Schema Design:**
The application uses a relational schema designed for PostgreSQL via Drizzle ORM:

**Users Table:**
- Profile data (Firebase UID, name, email, avatar)
- Meta progression (level, XP, tier, streak)
- Seven core stat attributes (1-100 scale)

**Quests Table:**
- Quest metadata (title, description, type)
- Reward structure (XP and stat bonuses as JSONB)
- Completion tracking with timestamps

**Activity History Table:**
- Event logging (quest completions, level-ups, tier changes)
- Timestamped for timeline reconstruction

**Quest System:**
- Curated templates in `quest-templates.ts` for regions without AI access
- Random selection algorithm ensures variety
- Type categorization (daily/weekly/ai)

**Progression Calculations:**
- Level = Math.floor(XP / 100) + 1
- Tier thresholds: D(0), C(500), B(2000), A(5000), S(10000)
- Stat caps at 100 with overflow prevention

**Rationale:** Drizzle ORM provides type-safe queries while maintaining raw SQL access when needed. JSONB for reward stats allows flexible quest reward structures. The schema supports both current in-memory implementation and future PostgreSQL migration without changes.

### Authentication & Authorization

**Provider:** Firebase Authentication
- Google OAuth via redirect flow
- Client-side SDK manages tokens and session
- Custom header (`x-firebase-uid`) sends UID to backend

**Security Model (MVP):**
- Client sends Firebase UID in custom header after successful auth
- Backend trusts client-provided UID for rapid development
- Auth middleware (`extractFirebaseUid`) extracts UID from headers

**Production Migration Path:**
- Install firebase-admin SDK
- Verify ID tokens server-side using `admin.auth().verifyIdToken()`
- Extract verified UID from decoded token
- Reject requests with invalid/missing tokens

**Rationale:** Firebase handles complex OAuth flows, eliminating need to manage social login integrations. Custom header approach accelerates MVP development while maintaining clear upgrade path. The middleware abstraction makes switching to token verification straightforward.

## External Dependencies

### Third-Party Services

**Firebase (Authentication)**
- **Purpose:** User authentication via Google OAuth
- **Configuration:** Requires `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_PROJECT_ID`, `VITE_FIREBASE_APP_ID`
- **Integration:** Client-side SDK for auth flows, backend receives Firebase UID
- **Production Requirement:** Firebase Admin SDK for server-side token verification

**Google Generative AI (Quest Generation)**
- **Package:** `@google/genai`
- **Purpose:** Generate personalized daily and weekly quests
- **Fallback:** Curated quest templates when AI unavailable or for regions without API access
- **Integration:** Server-side quest generation with template fallback system

### Database

**Current:** In-memory storage (MemStorage class)
- Implements IStorage interface
- Data lost on server restart
- Suitable for development/testing only

**Target:** PostgreSQL via Neon
- **ORM:** Drizzle with drizzle-kit for migrations
- **Connection:** `@neondatabase/serverless` package
- **Configuration:** `DATABASE_URL` environment variable
- **Migration:** `npm run db:push` applies schema changes

**Rationale:** Interface-based storage abstraction allows seamless migration from in-memory to PostgreSQL. Drizzle provides excellent TypeScript integration and migration tooling. Neon offers serverless PostgreSQL ideal for Replit deployments.

### UI Component Libraries

**Radix UI Primitives:**
- Comprehensive set of accessible, unstyled components
- Dialog, Dropdown, Popover, Tabs, Toast, and 20+ other primitives
- Handles complex accessibility requirements automatically

**shadcn/ui:**
- Pre-styled Radix components following design system
- Customized via Tailwind with theme variables
- "New York" style variant for clean, modern aesthetic

**Supporting Libraries:**
- `react-hook-form` + `@hookform/resolvers` - Form state management
- `zod` + `drizzle-zod` - Schema validation
- `date-fns` - Date formatting and manipulation
- `cmdk` - Command palette component
- `vaul` - Drawer/bottom sheet component

### Build & Development Tools

**Vite:**
- Development server with HMR
- Production bundler for client code
- Aliases for clean imports (`@/`, `@shared/`, `@assets/`)

**esbuild:**
- Production server bundler
- Fast, minimal bundle for Node.js deployment

**TypeScript:**
- Strict type checking across client/server/shared code
- Path mapping for module resolution

**Replit Integrations:**
- `@replit/vite-plugin-runtime-error-modal` - Error overlay
- `@replit/vite-plugin-cartographer` - Code navigation
- `@replit/vite-plugin-dev-banner` - Development banner

### Session Management

**Package:** `connect-pg-simple`
- **Purpose:** PostgreSQL-backed session store for Express
- **Use Case:** When migrating from in-memory to persistent sessions
- **Current Status:** Not yet implemented (using in-memory storage)