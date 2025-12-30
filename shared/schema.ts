import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, boolean, timestamp, jsonb, decimal } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table with profile, meta, and stats
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  // Firebase auth ID
  firebaseUid: text("firebase_uid").notNull().unique(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  avatarUrl: text("avatar_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  timezone: text("timezone").default("UTC"),
  onboardingCompleted: boolean("onboarding_completed").default(false).notNull(),

  // Meta - progression data
  level: integer("level").default(1).notNull(),
  xp: integer("xp").default(0).notNull(),
  tier: text("tier").default("D").notNull(), // D, C, B, A, S
  streak: integer("streak").default(0).notNull(),
  lastActive: timestamp("last_active").defaultNow(),

  // Premium Features
  coins: integer("coins").default(100).notNull(), // In-game currency
  guildId: varchar("guild_id"), // References guilds table
  theme: text("theme").default("default").notNull(), // UI theme preference
  activeBadgeId: varchar("active_badge_id"), // Currently displayed badge
  activeTitle: text("active_title"), // Currently displayed title

  // Stats - 7 core attributes (1-100)
  strength: integer("strength").default(10).notNull(),
  agility: integer("agility").default(10).notNull(),
  stamina: integer("stamina").default(10).notNull(),
  vitality: integer("vitality").default(10).notNull(),
  intelligence: integer("intelligence").default(10).notNull(),
  willpower: integer("willpower").default(10).notNull(),
  charisma: integer("charisma").default(10).notNull(),

  // Personalization
  assessmentData: jsonb("assessment_data").$type<{
    age: number;
    weight: number;
    height: number;
    pushups: number;
    pullups: number;
    intelligence: number;
    willpower: number;
    vitality: number;
    charisma: number;
    education?: string;
    stream?: string;
  }>(),
  currentGoal: text("current_goal"), // e.g., "Learn Spanish", "Build a Startup"
  studySubject: text("study_subject"),
  studyAvailability: text("study_availability"),

  // Notification preferences
  notificationsEnabled: boolean("notifications_enabled").default(true).notNull(),
  notificationTime: integer("notification_time").default(9).notNull(), // hour (0-23)
  lastNotificationSent: timestamp("last_notification_sent"),
});

// Guilds table
export const guilds = pgTable("guilds", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull().unique(),
  description: text("description"),
  leaderId: varchar("leader_id").notNull().references(() => users.id),
  avatarUrl: text("avatar_url"),
  level: integer("level").default(1).notNull(),
  xp: integer("xp").default(0).notNull(),
  memberCount: integer("member_count").default(1).notNull(),
  maxMembers: integer("max_members").default(50).notNull(),
  isPublic: boolean("is_public").default(true).notNull(),
  vicePresidentIds: jsonb('vice_president_ids').$type<string[]>().default([]).notNull(),
  treasury: integer("treasury").default(0).notNull(), // Guild coins from donations
  activePerks: jsonb('active_perks').$type<string[]>().default([]).notNull(), // Array of active perk IDs
  createdAt: timestamp("created_at").defaultNow().notNull(),
});


// Quests table
export const quests = pgTable("quests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  title: text("title").notNull(),
  description: text("description").notNull(),
  type: text("type").notNull(), // daily, weekly, ai, campaign, boss
  difficulty: text("difficulty").default("normal").notNull(), // easy, normal, hard, epic
  rewardXP: integer("reward_xp").notNull(),
  rewardCoins: integer("reward_coins").default(0).notNull(),
  rewardStats: jsonb("reward_stats").$type<Record<string, number>>(), // e.g., {strength: 2, stamina: 1}

  // Advanced Quest System
  campaignId: varchar("campaign_id"), // For quest chains
  parentQuestId: varchar("parent_quest_id"), // For multi-part quests
  isBoss: boolean("is_boss").default(false).notNull(),
  bossHealth: integer("boss_health"), // For boss battles
  bossMaxHealth: integer("boss_max_health"),

  content: text("content"), // Rich text tips/guide
  dayNumber: integer("day_number"), // Order within campaign
  expiresAt: timestamp("expires_at"), // For 24h rotation
  createdAt: timestamp("created_at").defaultNow().notNull(),
  dueAt: timestamp("due_at").notNull(),
  completed: boolean("completed").default(false).notNull(),
  completedAt: timestamp("completed_at"),
});



// Quest Campaigns (Quest Chains)
export const campaigns = pgTable("campaigns", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  description: text("description").notNull(),
  category: text("category").notNull(), // fitness, productivity, mindfulness, etc.
  difficulty: text("difficulty").notNull(), // beginner, intermediate, advanced
  durationDays: integer("duration_days").default(7).notNull(),
  totalQuests: integer("total_quests").notNull(),
  rewardXP: integer("reward_xp").notNull(),
  rewardCoins: integer("reward_coins").notNull(),
  imageUrl: text("image_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// User Campaign Progress
export const userCampaigns = pgTable("user_campaigns", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  campaignId: varchar("campaign_id").notNull().references(() => campaigns.id),
  questsCompleted: integer("quests_completed").default(0).notNull(),
  completed: boolean("completed").default(false).notNull(),
  startedAt: timestamp("started_at").defaultNow().notNull(),
  completedAt: timestamp("completed_at"),
});

// Content Library
export const contentLibrary = pgTable("content_library", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  description: text("description").notNull(),
  type: text("type").notNull(), // article, video, guide, template
  category: text("category").notNull(), // fitness, productivity, mindfulness, nutrition, sleep
  content: text("content"), // For articles/guides
  videoUrl: text("video_url"), // For videos
  thumbnailUrl: text("thumbnail_url"),
  duration: integer("duration"), // In minutes for videos
  isPremium: boolean("is_premium").default(false).notNull(),
  views: integer("views").default(0).notNull(),
  likes: integer("likes").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Sleep Tracking
export const sleepLogs = pgTable("sleep_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  date: timestamp("date").notNull(),
  bedtime: timestamp("bedtime").notNull(),
  wakeTime: timestamp("wake_time").notNull(),
  duration: decimal("duration", { precision: 4, scale: 2 }).notNull(), // Hours
  quality: integer("quality").notNull(), // 1-10 rating
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Nutrition Tracking
export const nutritionLogs = pgTable("nutrition_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  date: timestamp("date").notNull(),
  mealType: text("meal_type").notNull(), // breakfast, lunch, dinner, snack
  foodName: text("food_name").notNull(),
  calories: integer("calories").notNull(),
  protein: decimal("protein", { precision: 5, scale: 2 }), // grams
  carbs: decimal("carbs", { precision: 5, scale: 2 }), // grams
  fats: decimal("fats", { precision: 5, scale: 2 }), // grams
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Habit Tracking
export const habitTracking = pgTable("habit_tracking", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  habitId: text("habit_id").notNull(), // e.g., 'hydration', 'morning_routine'
  habitName: text("habit_name").notNull(),
  frequency: text("frequency").notNull(), // daily, weekly
  currentStreak: integer("current_streak").default(0).notNull(),
  longestStreak: integer("longest_streak").default(0).notNull(),
  totalCompletions: integer("total_completions").default(0).notNull(),
  lastCompletedAt: timestamp("last_completed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Focus Sessions (Focus Sanctum)
export const focusSessions = pgTable("focus_sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  duration: integer("duration").notNull(), // minutes
  xpEarned: integer("xp_earned").notNull(),
  task: text("task"), // Optional: what the user was working on
  backgroundType: text("background_type"), // rain, forest, ocean, cyberpunk, space
  completedAt: timestamp("completed_at").defaultNow().notNull(),
});

// Notifications table
export const notifications = pgTable("notifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  type: text("type").notNull(), // quest, habit, streak, achievement, motivational, admin, announcement, update, event
  title: text("title").notNull(),
  message: text("message").notNull(),
  read: boolean("read").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Activity history table
export const activityHistory = pgTable("activity_history", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  action: text("action").notNull(), // completeQuest, levelUp, rankUp, joinGuild, etc.
  questId: varchar("quest_id"),
  xpDelta: integer("xp_delta").default(0).notNull(),
  coinsDelta: integer("coins_delta").default(0).notNull(),
  statDeltas: jsonb("stat_deltas").$type<Record<string, number>>(),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

// Rank Trial challenges triggered when crossing tier thresholds
export const rankTrials = pgTable("rank_trials", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  tier: text("tier").notNull(), // The tier being challenged for (C, B, A, S)
  questId: varchar("quest_id").notNull().references(() => quests.id),
  completed: boolean("completed").default(false).notNull(),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Themes
export const themes = pgTable("themes", {
  id: varchar("id").primaryKey(),
  name: text("name").notNull(),
  displayName: text("display_name").notNull(),
  description: text("description"),
  isPremium: boolean("is_premium").default(false).notNull(),
  colors: jsonb("colors").$type<{
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    foreground: string;
  }>().notNull(),
  previewUrl: text("preview_url"),
});

// Shop Items (Avatars, Badges, Themes)
export const shopItems = pgTable("shop_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description").notNull(),
  type: text("type").notNull(), // avatar, badge, theme
  value: text("value").notNull(), // url for avatar/badge, theme_id for theme
  cost: integer("cost").notNull(),
  isPremium: boolean("is_premium").default(false).notNull(),
  rarity: text("rarity").default("common").notNull(), // common, rare, epic, legendary
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// User Inventory
export const userItems = pgTable("user_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  itemId: varchar("item_id").notNull().references(() => shopItems.id),
  equipped: boolean("equipped").default(false).notNull(),
  acquiredAt: timestamp("acquired_at").defaultNow().notNull(),
});

// Global Chat Messages
export const messages = pgTable("messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Direct Messages between partners
export const directMessages = pgTable("direct_messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  senderId: varchar("sender_id").notNull().references(() => users.id),
  receiverId: varchar("receiver_id").notNull().references(() => users.id),
  content: text("content").notNull(),
  read: boolean("read").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Partnerships table
export const partnerships = pgTable("partnerships", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  user1Id: varchar("user1_id").notNull().references(() => users.id),
  user2Id: varchar("user2_id").notNull().references(() => users.id),
  status: text("status").notNull().default("pending"), // pending, accepted, rejected
  createdAt: timestamp("created_at").defaultNow().notNull(),
  acceptedAt: timestamp("accepted_at"),
});

// Zod schemas for validation
export const insertUserSchema = createInsertSchema(users).pick({
  firebaseUid: true,
  name: true,
  email: true,
  avatarUrl: true,
  timezone: true,
  onboardingCompleted: true,
  assessmentData: true,
  currentGoal: true,
  studySubject: true,
  studyAvailability: true,
}).partial({
  avatarUrl: true,
  timezone: true,
  onboardingCompleted: true,
  assessmentData: true,
  currentGoal: true,
  studySubject: true,
  studyAvailability: true,
});

export const insertGuildSchema = createInsertSchema(guilds);

export const insertQuestSchema = createInsertSchema(quests).omit({
  id: true,
  createdAt: true,
  completed: true,
  completedAt: true,
});

export const insertCampaignSchema = createInsertSchema(campaigns).omit({
  id: true,
  createdAt: true,
});

export const insertContentSchema = createInsertSchema(contentLibrary).omit({
  id: true,
  createdAt: true,
  views: true,
  likes: true,
});

export const insertSleepLogSchema = createInsertSchema(sleepLogs).omit({
  id: true,
  createdAt: true,
});

export const insertNutritionLogSchema = createInsertSchema(nutritionLogs).omit({
  id: true,
  createdAt: true,
});

export const insertActivitySchema = createInsertSchema(activityHistory).omit({
  id: true,
  timestamp: true,
});

export const insertRankTrialSchema = createInsertSchema(rankTrials).omit({
  id: true,
  completed: true,
  completedAt: true,
  createdAt: true,
});

export const insertHabitSchema = createInsertSchema(habitTracking).omit({
  id: true,
  createdAt: true,
});

export const insertFocusSessionSchema = createInsertSchema(focusSessions).omit({
  id: true,
  completedAt: true,
});

export const insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
  read: true,
  createdAt: true,
});

// TypeScript types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertGuild = z.infer<typeof insertGuildSchema>;
export type Guild = typeof guilds.$inferSelect;

export type InsertQuest = z.infer<typeof insertQuestSchema>;
export type Quest = typeof quests.$inferSelect;

export type InsertCampaign = z.infer<typeof insertCampaignSchema>;
export type Campaign = typeof campaigns.$inferSelect;

export const insertUserCampaignSchema = createInsertSchema(userCampaigns).omit({
  id: true,
  startedAt: true,
  completed: true,
  questsCompleted: true,
  completedAt: true
});

export type InsertUserCampaign = z.infer<typeof insertUserCampaignSchema>;
export type UserCampaign = typeof userCampaigns.$inferSelect;

export type InsertContent = z.infer<typeof insertContentSchema>;
export type Content = typeof contentLibrary.$inferSelect;

export type InsertSleepLog = z.infer<typeof insertSleepLogSchema>;
export type SleepLog = typeof sleepLogs.$inferSelect;

export type InsertNutritionLog = z.infer<typeof insertNutritionLogSchema>;
export type NutritionLog = typeof nutritionLogs.$inferSelect;

export type InsertActivity = z.infer<typeof insertActivitySchema>;
export type Activity = typeof activityHistory.$inferSelect;

export type InsertRankTrial = z.infer<typeof insertRankTrialSchema>;
export type RankTrial = typeof rankTrials.$inferSelect;

export type InsertHabit = z.infer<typeof insertHabitSchema>;
export type HabitTracking = typeof habitTracking.$inferSelect;

export type InsertFocusSession = z.infer<typeof insertFocusSessionSchema>;
export type FocusSession = typeof focusSessions.$inferSelect;

export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type Notification = typeof notifications.$inferSelect;



export type Theme = typeof themes.$inferSelect;

export const insertShopItemSchema = createInsertSchema(shopItems).omit({
  id: true,
  createdAt: true,
});

export const insertUserItemSchema = createInsertSchema(userItems).omit({
  id: true,
  acquiredAt: true,
});

export type InsertShopItem = z.infer<typeof insertShopItemSchema>;
export type ShopItem = typeof shopItems.$inferSelect;

export type InsertUserItem = z.infer<typeof insertUserItemSchema>;
export type UserItem = typeof userItems.$inferSelect;

export const insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  createdAt: true,
});

export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type Message = typeof messages.$inferSelect;

export const insertDirectMessageSchema = createInsertSchema(directMessages).omit({
  id: true,
  createdAt: true,
  read: true,
});

export type InsertDirectMessage = z.infer<typeof insertDirectMessageSchema>;
export type DirectMessage = typeof directMessages.$inferSelect;

export const insertPartnershipSchema = createInsertSchema(partnerships).omit({
  id: true,
  createdAt: true,
  acceptedAt: true,
});

export type InsertPartnership = z.infer<typeof insertPartnershipSchema>;
export type Partnership = typeof partnerships.$inferSelect;

export type ItemType = "avatar" | "badge" | "theme" | "title";
export type ItemRarity = "common" | "rare" | "epic" | "legendary";

// Helper types for frontend
export type UserStats = {
  strength: number;
  agility: number;
  stamina: number;
  vitality: number;
  intelligence: number;
  willpower: number;
  charisma: number;
};

export type Tier = "D" | "C" | "B" | "A" | "S";

export type QuestType = "daily" | "weekly" | "ai" | "campaign" | "boss";

export type QuestDifficulty = "easy" | "normal" | "hard" | "epic";

export type ContentType = "article" | "video" | "guide" | "template";

export type ContentCategory = "fitness" | "productivity" | "mindfulness" | "nutrition" | "sleep";

export type MealType = "breakfast" | "lunch" | "dinner" | "snack";

// Constants for game mechanics
export const TIER_THRESHOLDS: Record<Tier, number> = {
  D: 0,
  C: 500,
  B: 1500,
  A: 3500,
  S: 6000,
};

export const STAT_NAMES = [
  "strength",
  "agility",
  "stamina",
  "vitality",
  "intelligence",
  "willpower",
  "charisma",
] as const;

export type StatName = typeof STAT_NAMES[number];

// Coin rewards by quest difficulty
export const COIN_REWARDS: Record<QuestDifficulty, number> = {
  easy: 10,
  normal: 25,
  hard: 50,
  epic: 100,
};

// Available themes
export const AVAILABLE_THEMES = [
  { id: "default", name: "Default", isPremium: false },
  { id: "emerald", name: "Emerald Dream", isPremium: false },
  { id: "sunset", name: "Sunset Blaze", isPremium: true },
  { id: "ocean", name: "Ocean Depths", isPremium: true },
  { id: "royal", name: "Royal Purple", isPremium: true },
  { id: "cyberpunk", name: "Cyberpunk Neon", isPremium: true },
  { id: "forest", name: "Forest Whisper", isPremium: true },
  { id: "crimson", name: "Crimson Night", isPremium: true },
] as const;

// Credentials for local auth
export const credentials = pgTable("credentials", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  username: text("username").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Guild Chat Messages
export const guildMessages = pgTable("guild_messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  guildId: varchar("guild_id").notNull().references(() => guilds.id),
  userId: varchar("user_id").notNull().references(() => users.id),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertCredentialSchema = createInsertSchema(credentials).omit({
  id: true,
  createdAt: true,
});

export type InsertCredential = z.infer<typeof insertCredentialSchema>;
export type Credential = typeof credentials.$inferSelect;

export const insertGuildMessageSchema = createInsertSchema(guildMessages).omit({
  id: true,
  createdAt: true,
});

export type InsertGuildMessage = z.infer<typeof insertGuildMessageSchema>;
export type GuildMessage = typeof guildMessages.$inferSelect;

// Rivalries
export const rivalries = pgTable("rivalries", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  challengerId: varchar("challenger_id").notNull().references(() => users.id),
  defenderId: varchar("defender_id").notNull().references(() => users.id),
  status: text("status").notNull().default("pending"), // pending, active, completed, rejected
  startDate: timestamp("start_date").defaultNow().notNull(),
  endDate: timestamp("end_date").notNull(),
  challengerScore: integer("challenger_score").default(0).notNull(),
  defenderScore: integer("defender_score").default(0).notNull(),
  winnerId: varchar("winner_id"),
  reward: integer("reward").default(500).notNull(), // XP Reward
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertRivalrySchema = createInsertSchema(rivalries).omit({
  id: true,
  createdAt: true,
  status: true,
  challengerScore: true,
  defenderScore: true,
  winnerId: true,
});

export type InsertRivalry = z.infer<typeof insertRivalrySchema>;
export type Rivalry = typeof rivalries.$inferSelect;

// Guild Quests - collaborative challenges for guilds
export const guildQuests = pgTable("guild_quests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  guildId: varchar("guild_id").notNull().references(() => guilds.id),
  title: text("title").notNull(),
  description: text("description").notNull(),
  type: text("type").notNull(), // "collective_xp", "collective_focus", "member_participation"
  targetValue: integer("target_value").notNull(), // e.g., 10000 XP, 100 hours
  currentValue: integer("current_value").default(0).notNull(),
  rewardCoins: integer("reward_coins").notNull(),
  rewardXP: integer("reward_xp").notNull(),
  status: text("status").default("active").notNull(), // "active", "completed", "expired"
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  completedAt: timestamp("completed_at"),
});

export const insertGuildQuestSchema = createInsertSchema(guildQuests).omit({
  id: true,
  createdAt: true,
  currentValue: true,
  completedAt: true,
});

export type InsertGuildQuest = z.infer<typeof insertGuildQuestSchema>;
export type GuildQuest = typeof guildQuests.$inferSelect;

// Track individual member contributions to guild quests
export const guildQuestProgress = pgTable("guild_quest_progress", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  questId: varchar("quest_id").notNull().references(() => guildQuests.id),
  userId: varchar("user_id").notNull().references(() => users.id),
  contribution: integer("contribution").default(0).notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertGuildQuestProgressSchema = createInsertSchema(guildQuestProgress).omit({
  id: true,
  updatedAt: true,
});

export type InsertGuildQuestProgress = z.infer<typeof insertGuildQuestProgressSchema>;
export type GuildQuestProgress = typeof guildQuestProgress.$inferSelect;

// Guild Perks - upgrades that benefit all members
export const guildPerks = pgTable("guild_perks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description").notNull(),
  cost: integer("cost").notNull(), // Cost in guild treasury coins
  effect: text("effect").notNull(), // "xp_boost_10", "coin_boost_20", "quest_slots_1"
  iconName: text("icon_name"), // For UI
  tier: integer("tier").default(1).notNull(), // Unlock tier
});

export const insertGuildPerkSchema = createInsertSchema(guildPerks).omit({
  id: true,
});

export type InsertGuildPerk = z.infer<typeof insertGuildPerkSchema>;
export type GuildPerk = typeof guildPerks.$inferSelect;

// Guild Donations - track member contributions
export const guildDonations = pgTable("guild_donations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  guildId: varchar("guild_id").notNull().references(() => guilds.id),
  userId: varchar("user_id").notNull().references(() => users.id),
  amount: integer("amount").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertGuildDonationSchema = createInsertSchema(guildDonations).omit({
  id: true,
  createdAt: true,
});

export type InsertGuildDonation = z.infer<typeof insertGuildDonationSchema>;
export type GuildDonation = typeof guildDonations.$inferSelect;


