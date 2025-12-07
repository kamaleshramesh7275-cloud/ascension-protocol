# Premium Features Implementation Guide

## ✅ **Completed: Database Schema**

I've extended the database schema with all premium features:

### **New Tables Added:**

1. **guilds** - Guild system with levels and XP
2. **campaigns** - Quest chains/storylines
3. **userCampaigns** - Track user progress in campaigns
4. **contentLibrary** - Articles, videos, guides
5. **sleepLogs** - Daily sleep tracking
6. **nutritionLogs** - Meal and macro tracking
7. **themes** - Custom UI themes

### **Extended Tables:**

1. **users** - Added:
   - `coins` (in-game currency)
   - `guildId` (guild membership)
   - `theme` (UI preference)

2. **quests** - Added:
   - `rewardCoins` (coin rewards)
   - `difficulty` (easy/normal/hard/epic)
   - `campaignId` (for quest chains)
   - `parentQuestId` (multi-part quests)
   - `isBoss` (boss battle flag)
   - `bossHealth` & `bossMaxHealth` (boss mechanics)

3. **activityHistory** - Added:
   - `coinsDelta` (track coin changes)

---

## 🚀 **Next Steps: Implementation Priority**

### **Phase 1: Core Systems** (Implement First)

#### 1. **In-Game Currency System** 💰
**Files to Create:**
- `server/services/currency.ts` - Coin management logic
- `client/src/components/coin-display.tsx` - Show user's coins
- `client/src/components/coin-shop.tsx` - Spend coins on rewards

**API Endpoints:**
- `GET /api/user/coins` - Get current balance
- `POST /api/coins/earn` - Award coins
- `POST /api/coins/spend` - Deduct coins

**Features:**
- Earn coins from completing quests
- Spend coins on:
  - Premium themes
  - XP boosters
  - Stat resets
  - Guild perks
  - Content unlocks

#### 2. **Guild System** 🛡️
**Files to Create:**
- `server/routes/guilds.ts` - Guild CRUD operations
- `client/src/pages/guilds.tsx` - Guild browser
- `client/src/pages/guild-detail.tsx` - Individual guild page
- `client/src/components/guild-card.tsx` - Guild display component
- `client/src/components/create-guild-dialog.tsx` - Create guild form

**API Endpoints:**
- `GET /api/guilds` - List all public guilds
- `POST /api/guilds` - Create new guild
- `GET /api/guilds/:id` - Get guild details
- `POST /api/guilds/:id/join` - Join a guild
- `POST /api/guilds/:id/leave` - Leave guild
- `GET /api/guilds/:id/members` - List guild members
- `POST /api/guilds/:id/quests` - Create guild quest

**Features:**
- Create/join guilds (max 10 members)
- Guild levels and XP
- Guild quests (team challenges)
- Guild leaderboard
- Guild chat (future)

---

### **Phase 2: Content & Tracking** (Implement Second)

#### 3. **Content Library** 📚
**Files to Create:**
- `server/routes/content.ts` - Content CRUD
- `client/src/pages/library.tsx` - Content browser
- `client/src/pages/content-detail.tsx` - Article/video viewer
- `client/src/components/content-card.tsx` - Content preview
- `server/seed/content-seed.ts` - Seed initial content

**API Endpoints:**
- `GET /api/content` - List all content (filter by category/type)
- `GET /api/content/:id` - Get specific content
- `POST /api/content/:id/view` - Track view
- `POST /api/content/:id/like` - Like content

**Initial Content Categories:**
- **Fitness** (10 articles, 5 videos)
- **Productivity** (10 articles, 5 videos)
- **Mindfulness** (10 articles, 5 videos)
- **Nutrition** (10 guides)
- **Sleep** (5 guides)

#### 4. **Sleep Tracking** 😴
**Files to Create:**
- `server/routes/sleep.ts` - Sleep log CRUD
- `client/src/pages/sleep.tsx` - Sleep tracker page
- `client/src/components/sleep-log-form.tsx` - Log sleep
- `client/src/components/sleep-chart.tsx` - Visualize sleep data

**API Endpoints:**
- `GET /api/sleep` - Get user's sleep logs
- `POST /api/sleep` - Log sleep
- `GET /api/sleep/stats` - Get sleep insights

**Features:**
- Log bedtime & wake time
- Rate sleep quality (1-10)
- View sleep trends (7/30 days)
- Sleep insights & recommendations
- Correlate sleep with performance

#### 5. **Nutrition Tracking** 🍎
**Files to Create:**
- `server/routes/nutrition.ts` - Nutrition log CRUD
- `client/src/pages/nutrition.tsx` - Nutrition tracker
- `client/src/components/meal-log-form.tsx` - Log meals
- `client/src/components/nutrition-chart.tsx` - Macro breakdown

**API Endpoints:**
- `GET /api/nutrition` - Get nutrition logs
- `POST /api/nutrition` - Log meal
- `GET /api/nutrition/stats` - Daily/weekly totals

**Features:**
- Log meals with macros (protein/carbs/fats)
- Daily calorie tracking
- Macro goals & progress
- Meal history
- Nutrition insights

---

### **Phase 3: Advanced Features** (Implement Third)

#### 6. **Advanced Quest System** ⚔️
**Files to Create:**
- `server/routes/campaigns.ts` - Campaign management
- `client/src/pages/campaigns.tsx` - Campaign browser
- `client/src/pages/campaign-detail.tsx` - Campaign progress
- `client/src/components/boss-battle.tsx` - Boss fight UI
- `server/services/quest-generator.ts` - Generate quest chains

**API Endpoints:**
- `GET /api/campaigns` - List campaigns
- `GET /api/campaigns/:id` - Get campaign details
- `POST /api/campaigns/:id/start` - Start campaign
- `POST /api/quests/:id/attack-boss` - Damage boss

**Features:**
- **Quest Chains**: 5-10 linked quests with story
- **Boss Battles**: Multi-day challenges requiring multiple attacks
- **Difficulty Tiers**: Easy/Normal/Hard/Epic with scaled rewards
- **Campaign Progress**: Track completion percentage
- **Epic Rewards**: Bonus coins, XP, and exclusive titles

#### 7. **Custom Themes** 🎨
**Files to Create:**
- `client/src/pages/themes.tsx` - Theme selector
- `client/src/components/theme-preview.tsx` - Preview themes
- `client/src/hooks/use-theme.tsx` - Theme context
- `client/src/styles/themes.ts` - Theme definitions

**API Endpoints:**
- `GET /api/themes` - List available themes
- `POST /api/user/theme` - Set user theme

**Available Themes:**
1. **Default** (Free) - Current purple/blue
2. **Emerald Dream** (Free) - Green/teal
3. **Sunset Blaze** (Premium) - Orange/red/pink
4. **Ocean Depths** (Premium) - Deep blue/cyan
5. **Royal Purple** (Premium) - Purple/gold
6. **Cyberpunk Neon** (Premium) - Pink/cyan/yellow
7. **Forest Whisper** (Premium) - Green/brown/gold
8. **Crimson Night** (Premium) - Red/black/gold

**Theme System:**
- Dynamic CSS variables
- Real-time preview
- Unlock with coins (500 coins each)
- Save preference to database

---

## 📊 **Database Migration Required**

Before implementing features, run database migration:

```bash
# Generate migration
npm run db:generate

# Apply migration
npm run db:push
```

---

## 🎯 **Recommended Implementation Order**

1. **Week 1**: Currency System + Guild System
2. **Week 2**: Content Library + Sleep Tracking
3. **Week 3**: Nutrition Tracking + Advanced Quests
4. **Week 4**: Custom Themes + Polish & Testing

---

## 💡 **Quick Start: Implement Currency First**

The currency system is the foundation for other features. Here's a quick implementation:

### Step 1: Update User Display
Add coin counter to header/sidebar

### Step 2: Award Coins
Modify quest completion to award coins based on difficulty

### Step 3: Create Coin Shop
Simple UI to spend coins on themes/boosters

### Step 4: Track Transactions
Log all coin changes in activity history

---

## 🔧 **Technical Notes**

- All new tables use UUID primary keys
- Foreign keys properly reference users table
- Timestamps for audit trail
- JSONB for flexible data (stats, colors)
- Decimal for precise nutrition values
- Boolean flags for premium features

---

## 📝 **Content Seeding**

Create initial content for library:
- 50 articles across 5 categories
- 25 videos (YouTube embeds)
- 20 guides (step-by-step)
- 10 quest templates

---

## 🎮 **Gamification Strategy**

**Coin Economy:**
- Quest completion: 10-100 coins
- Daily login: 5 coins
- Streak bonus: 10 coins/day
- Guild quests: 50 coins
- Boss defeats: 200 coins

**Coin Sinks:**
- Premium themes: 500 coins
- XP boosters: 100 coins
- Stat resets: 200 coins
- Guild creation: 1000 coins
- Content unlocks: 50 coins

---

## 🚀 **Ready to Implement?**

Let me know which feature you'd like me to build first! I recommend:
1. **Currency System** (foundation)
2. **Guild System** (social engagement)
3. **Content Library** (value delivery)

Each feature will include:
- Backend API routes
- Database operations
- Frontend pages/components
- Premium UI with animations
