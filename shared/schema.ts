import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, boolean, timestamp, jsonb, decimal, index } from "drizzle-orm/pg-core";
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

  // Monetization
  isPremium: boolean("is_premium").default(false).notNull(),
  premiumExpiry: timestamp("premium_expiry"),
  lastPremiumBonusAt: timestamp("last_premium_bonus_at"),
  stripeCustomerId: text("stripe_customer_id"),
  role: text("role").default("user").notNull(), // user, admin

  // Referral System
  referralCode: text("referral_code").unique(),
  referredBy: text("referred_by"), // ID of the user who referred this user

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
  hasSeenTutorial: boolean("has_seen_tutorial").default(false).notNull(),

  // Optimization: Track last time we checked for daily quests to avoid redundant DB queries
  lastDailyQuestCheck: timestamp("last_daily_quest_check"),
}, (table) => {
  return {
    firebaseUidIdx: index("idx_users_firebase_uid").on(table.firebaseUid),
    // For leaderboard
    xpIdx: index("idx_users_xp_desc").on(table.xp),
  };
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
}, (table) => {
  return {
    userIdIdx: index("quests_user_id_idx").on(table.userId),
    campaignIdIdx: index("quests_campaign_id_idx").on(table.campaignId),
  };
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
}, (table) => {
  return {
    userIdIdx: index("user_campaigns_user_id_idx").on(table.userId),
  };
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
}, (table) => ({
  userIdIdx: index("sleep_logs_user_id_idx").on(table.userId),
}));

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
}, (table) => ({
  userIdIdx: index("nutrition_logs_user_id_idx").on(table.userId),
}));

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
}, (table) => {
  return {
    userIdIdx: index("habit_tracking_user_id_idx").on(table.userId),
  };
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
}, (table) => {
  return {
    userIdIdx: index("focus_sessions_user_id_idx").on(table.userId),
  };
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
}, (table) => {
  return {
    userIdIdx: index("notifications_user_id_idx").on(table.userId),
    // Performance: Filter by unread notifications
    userReadIdx: index("idx_notifications_user_read").on(table.userId, table.read),
  };
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
}, (table) => {
  return {
    userIdIdx: index("activity_history_user_id_idx").on(table.userId),
  };
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
}, (table) => ({
  userIdIdx: index("user_items_user_id_idx").on(table.userId),
  itemIdIdx: index("user_items_item_id_idx").on(table.itemId),
}));

// Global Chat Messages
export const messages = pgTable("messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => {
  return {
    userIdIdx: index("messages_user_id_idx").on(table.userId),
    // Performance: Sort by recent messages
    createdAtIndex: index("idx_messages_created_at_desc").on(table.createdAt),
  };
});

// Referrals Table
export const referrals = pgTable("referrals", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  referrerId: varchar("referrer_id").notNull().references(() => users.id),
  referredUserId: varchar("referred_user_id").notNull().references(() => users.id),
  status: text("status").default("completed").notNull(), // pending, completed
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => {
  return {
    referrerIdIdx: index("referrals_referrer_id_idx").on(table.referrerId),
    referredUserIdIdx: index("referrals_referred_user_id_idx").on(table.referredUserId),
  };
});

// Direct Messages between partners
export const directMessages = pgTable("direct_messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  senderId: varchar("sender_id").notNull().references(() => users.id),
  receiverId: varchar("receiver_id").notNull().references(() => users.id),
  content: text("content").notNull(),
  read: boolean("read").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => {
  return {
    senderIdIdx: index("direct_messages_sender_id_idx").on(table.senderId),
    receiverIdIdx: index("direct_messages_receiver_id_idx").on(table.receiverId),
  };
});

// To-Do List Tasks
export const tasks = pgTable("tasks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  text: text("text").notNull(),
  completed: boolean("completed").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => {
  return {
    userIdIdx: index("tasks_user_id_idx").on(table.userId),
  };
});

// Partnerships table
export const partnerships = pgTable("partnerships", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  user1Id: varchar("user1_id").notNull().references(() => users.id),
  user2Id: varchar("user2_id").notNull().references(() => users.id),
  status: text("status").notNull().default("pending"), // pending, accepted, rejected
  createdAt: timestamp("created_at").defaultNow().notNull(),
  acceptedAt: timestamp("accepted_at"),
}, (table) => {
  return {
    user1Idx: index("partnerships_user1_idx").on(table.user1Id),
    user2Idx: index("partnerships_user2_idx").on(table.user2Id),
  };
});

// Zod schemas for validation
export const insertUserSchema = z.object({
  firebaseUid: z.string().min(1),
  name: z.string().min(1),
  email: z.string().email(),
  avatarUrl: z.string().nullable().optional(),
  timezone: z.string().nullable().optional(),
  onboardingCompleted: z.boolean().optional(),
  assessmentData: z.any().nullable().optional(),
  currentGoal: z.string().nullable().optional(),
  studySubject: z.string().nullable().optional(),
  studyAvailability: z.string().nullable().optional(),
  isPremium: z.boolean().optional(),
  premiumExpiry: z.date().nullable().optional(),
  role: z.string().optional(),
  hasSeenTutorial: z.boolean().optional(),
  referralCode: z.string().nullable().optional(),
  referredBy: z.string().nullable().optional(),
}).partial();

export const insertGuildSchema = z.object({
  name: z.string().min(1),
  description: z.string().nullable().optional(),
  leaderId: z.string().min(1),
  avatarUrl: z.string().nullable().optional(),
  isPublic: z.boolean().optional(),
});

export const insertQuestSchema = z.object({
  userId: z.string().min(1),
  title: z.string().min(1),
  description: z.string().min(1),
  type: z.string(),
  difficulty: z.string().optional(),
  rewardXP: z.number().int(),
  rewardCoins: z.number().int().optional(),
  rewardStats: z.any().nullable().optional(),
  campaignId: z.string().nullable().optional(),
  parentQuestId: z.string().nullable().optional(),
  isBoss: z.boolean().optional(),
  bossHealth: z.number().int().nullable().optional(),
  bossMaxHealth: z.number().int().nullable().optional(),
  content: z.string().nullable().optional(),
  dayNumber: z.number().int().nullable().optional(),
  expiresAt: z.date().nullable().optional(),
  dueAt: z.date(),
});

export const insertCampaignSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  category: z.string().min(1),
  difficulty: z.string().min(1),
  durationDays: z.number().int().optional(),
  totalQuests: z.number().int(),
  rewardXP: z.number().int(),
  rewardCoins: z.number().int(),
  imageUrl: z.string().nullable().optional(),
});

export const insertUserCampaignSchema = z.object({
  userId: z.string().min(1),
  campaignId: z.string().min(1),
  questsCompleted: z.number().int().optional(),
  completed: z.boolean().optional(),
  startedAt: z.date().optional(),
});

export const insertContentLibrarySchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  type: z.string(),
  category: z.string(),
  content: z.string().nullable().optional(),
  videoUrl: z.string().nullable().optional(),
  thumbnailUrl: z.string().nullable().optional(),
  duration: z.number().int().nullable().optional(),
  isPremium: z.boolean().optional(),
});

export const insertContentSchema = insertContentLibrarySchema; // Alias for backward compatibility

export const insertSleepLogSchema = z.object({
  userId: z.string().min(1),
  date: z.date(),
  bedtime: z.date(),
  wakeTime: z.date(),
  duration: z.string(), // decimal is often string in JS
  quality: z.number().int().min(1).max(10),
  notes: z.string().nullable().optional(),
});

export const insertNutritionLogSchema = z.object({
  userId: z.string().min(1),
  date: z.date(),
  mealType: z.string(),
  foodName: z.string().min(1),
  calories: z.number().int(),
  protein: z.string().nullable().optional(),
  carbs: z.string().nullable().optional(),
  fats: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
});

export const insertActivityHistorySchema = z.object({
  userId: z.string().min(1),
  action: z.string().min(1),
  questId: z.string().nullable().optional(),
  xpDelta: z.number().int().optional(),
  coinsDelta: z.number().int().optional(),
  statDeltas: z.any().nullable().optional(),
});

export const insertActivitySchema = insertActivityHistorySchema;

export const insertRankTrialSchema = z.object({
  userId: z.string().min(1),
  tier: z.string().min(1),
  questId: z.string().min(1),
});

export const insertHabitTrackingSchema = z.object({
  userId: z.string().min(1),
  habitId: z.string().min(1),
  habitName: z.string().min(1),
  frequency: z.string(),
});

export const insertHabitSchema = insertHabitTrackingSchema;

export const insertFocusSessionSchema = z.object({
  userId: z.string().min(1),
  duration: z.number().int().min(1),
  xpEarned: z.number().int().min(0),
  task: z.string().nullable().optional(),
  backgroundType: z.string().nullable().optional(),
});

export const insertNotificationSchema = z.object({
  userId: z.string().min(1),
  type: z.string(),
  title: z.string().min(1),
  message: z.string().min(1),
});

// TypeScript types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Guild = typeof guilds.$inferSelect;
export type InsertGuild = z.infer<typeof insertGuildSchema>;

export type Quest = typeof quests.$inferSelect;
export type InsertQuest = z.infer<typeof insertQuestSchema>;

export type Campaign = typeof campaigns.$inferSelect;
export type InsertCampaign = z.infer<typeof insertCampaignSchema>;

export type UserCampaign = typeof userCampaigns.$inferSelect;
export type InsertUserCampaign = z.infer<typeof insertUserCampaignSchema>;

export type Content = typeof contentLibrary.$inferSelect;
export type InsertContent = z.infer<typeof insertContentSchema>;

export type SleepLog = typeof sleepLogs.$inferSelect;
export type InsertSleepLog = z.infer<typeof insertSleepLogSchema>;

export type NutritionLog = typeof nutritionLogs.$inferSelect;
export type InsertNutritionLog = z.infer<typeof insertNutritionLogSchema>;

export type Activity = typeof activityHistory.$inferSelect;
export type InsertActivity = z.infer<typeof insertActivitySchema>;

export type RankTrial = typeof rankTrials.$inferSelect;
export type InsertRankTrial = z.infer<typeof insertRankTrialSchema>;

export type HabitTracking = typeof habitTracking.$inferSelect;
export type InsertHabit = z.infer<typeof insertHabitSchema>;

export type FocusSession = typeof focusSessions.$inferSelect;
export type InsertFocusSession = z.infer<typeof insertFocusSessionSchema>;

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;

export type Theme = typeof themes.$inferSelect;

export const insertShopItemSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1),
  description: z.string().min(1),
  cost: z.number().int(),
  type: z.string(),
  rarity: z.string(),
  value: z.string().min(1),
  isPremium: z.boolean().optional(),
});

export const insertUserItemSchema = z.object({
  userId: z.string().min(1),
  itemId: z.string().min(1),
  equipped: z.boolean().optional(),
});

export type ShopItem = typeof shopItems.$inferSelect;
export type InsertShopItem = z.infer<typeof insertShopItemSchema>;

export type UserItem = typeof userItems.$inferSelect;
export type InsertUserItem = z.infer<typeof insertUserItemSchema>;

export const insertMessageSchema = z.object({
  userId: z.string().min(1),
  content: z.string().min(1),
});

export type Message = typeof messages.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;

export const insertDirectMessageSchema = z.object({
  senderId: z.string().min(1),
  receiverId: z.string().min(1),
  content: z.string().min(1),
});

export type DirectMessage = typeof directMessages.$inferSelect;
export type InsertDirectMessage = z.infer<typeof insertDirectMessageSchema>;

export const insertPartnershipSchema = z.object({
  user1Id: z.string().min(1),
  user2Id: z.string().min(1),
  status: z.string().optional(),
});

export type Partnership = typeof partnerships.$inferSelect;
export type InsertPartnership = z.infer<typeof insertPartnershipSchema>;

export const insertTaskSchema = z.object({
  userId: z.string().min(1),
  text: z.string().min(1),
  completed: z.boolean().optional(),
});

export type Task = typeof tasks.$inferSelect;
export type InsertTask = z.infer<typeof insertTaskSchema>;

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

export const COIN_REWARDS: Record<QuestDifficulty, number> = {
  easy: 10,
  normal: 25,
  hard: 50,
  epic: 100,
};

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

export const insertCredentialSchema = z.object({
  userId: z.string().min(1),
  username: z.string().min(1),
  passwordHash: z.string().min(1),
});

export type Credential = typeof credentials.$inferSelect;
export type InsertCredential = z.infer<typeof insertCredentialSchema>;

export const insertGuildMessageSchema = z.object({
  guildId: z.string().min(1),
  userId: z.string().min(1),
  content: z.string().min(1),
});

export type GuildMessage = typeof guildMessages.$inferSelect;
export type InsertGuildMessage = z.infer<typeof insertGuildMessageSchema>;

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

export const insertRivalrySchema = z.object({
  challengerId: z.string().min(1),
  defenderId: z.string().min(1),
  endDate: z.date(),
  reward: z.number().int().optional(),
  startDate: z.date().optional(),
});

export type Rivalry = typeof rivalries.$inferSelect;
export type InsertRivalry = z.infer<typeof insertRivalrySchema>;

// Guild Quests
export const guildQuests = pgTable("guild_quests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  guildId: varchar("guild_id").notNull().references(() => guilds.id),
  title: text("title").notNull(),
  description: text("description").notNull(),
  type: text("type").notNull(),
  targetValue: integer("target_value").notNull(),
  currentValue: integer("current_value").default(0).notNull(),
  rewardCoins: integer("reward_coins").notNull(),
  rewardXP: integer("reward_xp").notNull(),
  status: text("status").default("active").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  completedAt: timestamp("completed_at"),
});

export const insertGuildQuestSchema = z.object({
  guildId: z.string().min(1),
  title: z.string().min(1),
  description: z.string().min(1),
  type: z.string(),
  targetValue: z.number().int(),
  rewardCoins: z.number().int(),
  rewardXP: z.number().int(),
  expiresAt: z.date(),
  status: z.string().optional(),
});

export type GuildQuest = typeof guildQuests.$inferSelect;
export type InsertGuildQuest = z.infer<typeof insertGuildQuestSchema>;

// Track contributions
export const guildQuestProgress = pgTable("guild_quest_progress", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  questId: varchar("quest_id").notNull().references(() => guildQuests.id),
  userId: varchar("user_id").notNull().references(() => users.id),
  contribution: integer("contribution").default(0).notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertGuildQuestProgressSchema = z.object({
  questId: z.string().min(1),
  userId: z.string().min(1),
  contribution: z.number().int(),
});

export type GuildQuestProgress = typeof guildQuestProgress.$inferSelect;
export type InsertGuildQuestProgress = z.infer<typeof insertGuildQuestProgressSchema>;

// Guild Perks
export const guildPerks = pgTable("guild_perks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description").notNull(),
  cost: integer("cost").notNull(),
  effect: text("effect").notNull(),
  iconName: text("icon_name"),
  tier: integer("tier").default(1).notNull(),
});

export const insertGuildPerkSchema = z.object({
  name: z.string().min(1),
  description: z.string().min(1),
  cost: z.number().int(),
  effect: z.string().min(1),
  iconName: z.string().nullable().optional(),
  tier: z.number().int().optional(),
});

export type GuildPerk = typeof guildPerks.$inferSelect;
export type InsertGuildPerk = z.infer<typeof insertGuildPerkSchema>;

// Guild Donations
export const guildDonations = pgTable("guild_donations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  guildId: varchar("guild_id").notNull().references(() => guilds.id),
  userId: varchar("user_id").notNull().references(() => users.id),
  amount: integer("amount").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertGuildDonationSchema = z.object({
  guildId: z.string().min(1),
  userId: z.string().min(1),
  amount: z.number().int().min(1),
});

export type GuildDonation = typeof guildDonations.$inferSelect;
export type InsertGuildDonation = z.infer<typeof insertGuildDonationSchema>;

// Guild Wars
export const guildWars = pgTable("guild_wars", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  season: integer("season").notNull(),
  status: text("status").notNull().default("matchmaking"),
  guild1Id: varchar("guild1_id").notNull().references(() => guilds.id),
  guild2Id: varchar("guild2_id").notNull().references(() => guilds.id),
  guild1Score: integer("guild1_score").default(0).notNull(),
  guild2Score: integer("guild2_score").default(0).notNull(),
  winnerId: varchar("winner_id"),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  rewards: jsonb("rewards").$type<{
    winnerGuildXP: number;
    winnerGuildCoins: number;
    winnerMemberXP: number;
    winnerMemberCoins: number;
    loserGuildXP: number;
    loserGuildCoins: number;
    loserMemberXP: number;
    loserMemberCoins: number;
  }>(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const guildWarParticipants = pgTable("guild_war_participants", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  warId: varchar("war_id").notNull().references(() => guildWars.id),
  userId: varchar("user_id").notNull().references(() => users.id),
  guildId: varchar("guild_id").notNull().references(() => guilds.id),
  pointsContributed: integer("points_contributed").default(0).notNull(),
  questsCompleted: integer("quests_completed").default(0).notNull(),
  focusMinutes: integer("focus_minutes").default(0).notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const guildWarEvents = pgTable("guild_war_events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  warId: varchar("war_id").notNull().references(() => guildWars.id),
  userId: varchar("user_id").notNull().references(() => users.id),
  guildId: varchar("guild_id").notNull().references(() => guilds.id),
  eventType: text("event_type").notNull(),
  points: integer("points").notNull(),
  description: text("description").notNull(),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

export const insertGuildWarSchema = z.object({
  season: z.number().int(),
  status: z.string().optional(),
  guild1Id: z.string().min(1),
  guild2Id: z.string().min(1),
  startDate: z.date(),
  endDate: z.date(),
  rewards: z.any().nullable().optional(),
});

export const insertGuildWarParticipantSchema = z.object({
  warId: z.string().min(1),
  userId: z.string().min(1),
  guildId: z.string().min(1),
  pointsContributed: z.number().int().optional(),
  questsCompleted: z.number().int().optional(),
  focusMinutes: z.number().int().optional(),
});

export const insertGuildWarEventSchema = z.object({
  warId: z.string().min(1),
  userId: z.string().min(1),
  guildId: z.string().min(1),
  eventType: z.string().min(1),
  points: z.number().int(),
  description: z.string().min(1),
});

export type GuildWar = typeof guildWars.$inferSelect;
export type InsertGuildWar = z.infer<typeof insertGuildWarSchema>;

export type GuildWarParticipant = typeof guildWarParticipants.$inferSelect;
export type InsertGuildWarParticipant = z.infer<typeof insertGuildWarParticipantSchema>;

export type GuildWarEvent = typeof guildWarEvents.$inferSelect;
export type InsertGuildWarEvent = z.infer<typeof insertGuildWarEventSchema>;

// Premium Activation Requests
export const premiumRequests = pgTable("premium_requests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  status: text("status").notNull().default("pending"),
  adminNotes: text("admin_notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  resolvedAt: timestamp("resolved_at"),
});

export const insertPremiumRequestSchema = z.object({
  userId: z.string().min(1),
  status: z.string().optional(),
  adminNotes: z.string().nullable().optional(),
});

export type PremiumRequest = typeof premiumRequests.$inferSelect;
export type InsertPremiumRequest = z.infer<typeof insertPremiumRequestSchema>;

export type WarStatus = "matchmaking" | "active" | "completed";

// 30-Day Premium Roadmap
export const roadmaps = pgTable("roadmaps", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  status: text("status").notNull().default("active"),
  startDate: timestamp("start_date").defaultNow().notNull(),
  currentWeek: integer("current_week").default(1).notNull(),
}, (table) => ({
  userIdIdx: index("roadmaps_user_id_idx").on(table.userId),
}));

export const roadmapWeeks = pgTable("roadmap_weeks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  roadmapId: varchar("roadmap_id").notNull().references(() => roadmaps.id),
  weekNumber: integer("week_number").notNull(),
  phaseName: text("phase_name").notNull(),
  goal: text("goal").notNull(),
  description: text("description"),
  isLocked: boolean("is_locked").default(true).notNull(),
}, (table) => ({
  roadmapIdIdx: index("roadmap_weeks_roadmap_id_idx").on(table.roadmapId),
}));

export const roadmapTasks = pgTable("roadmap_tasks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  weekId: varchar("week_id").notNull().references(() => roadmapWeeks.id),
  dayNumber: integer("day_number").notNull(),
  text: text("text").notNull(),
  completed: boolean("completed").default(false).notNull(),
  isBoss: boolean("is_boss").default(false).notNull(),
  order: integer("order").default(0).notNull(),
}, (table) => ({
  weekIdIdx: index("roadmap_tasks_week_id_idx").on(table.weekId),
}));

export const insertRoadmapSchema = z.object({
  userId: z.string().min(1),
  status: z.string().optional(),
  currentWeek: z.number().int().optional(),
});

export const insertRoadmapWeekSchema = z.object({
  roadmapId: z.string().min(1),
  weekNumber: z.number().int().min(1),
  phaseName: z.string().min(1),
  goal: z.string().min(1),
  description: z.string().nullable().optional(),
  isLocked: z.boolean().optional(),
});

export const insertRoadmapTaskSchema = z.object({
  weekId: z.string().min(1),
  dayNumber: z.number().int().min(1).max(7),
  text: z.string().min(1),
  completed: z.boolean().optional(),
  isBoss: z.boolean().optional(),
  order: z.number().optional(),
});

export type Roadmap = typeof roadmaps.$inferSelect;
export type InsertRoadmap = z.infer<typeof insertRoadmapSchema>;

export type RoadmapWeek = typeof roadmapWeeks.$inferSelect;
export type InsertRoadmapWeek = z.infer<typeof insertRoadmapWeekSchema>;

export type RoadmapTask = typeof roadmapTasks.$inferSelect;
export type InsertRoadmapTask = z.infer<typeof insertRoadmapTaskSchema>;

export const insertReferralSchema = z.object({
  referrerId: z.string().min(1),
  referredUserId: z.string().min(1),
  status: z.string().optional(),
});

export type Referral = typeof referrals.$inferSelect;
export type InsertReferral = z.infer<typeof insertReferralSchema>;
