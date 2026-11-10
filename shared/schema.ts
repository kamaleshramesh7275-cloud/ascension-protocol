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
  // referralCode: text("referral_code").unique(),
  // referredBy: text("referred_by"), // ID of the user who referred this user

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
  fcmTokens: jsonb("fcm_tokens").$type<string[]>().default([]).notNull(), // Device tokens for push
  hasSeenTutorial: boolean("has_seen_tutorial").default(false).notNull(),
  phone: text("phone"), // Mobile number collected during registration
  // Optimization: Track last time we checked for daily quests to avoid redundant DB queries
  lastDailyQuestCheck: timestamp("last_daily_quest_check"),
  lastDailyBonusClaimedAt: timestamp("last_daily_bonus_claimed_at"),
  loginRewardDay: integer("login_reward_day").default(1).notNull(),
  lastLoginRewardClaimedAt: timestamp("last_login_reward_claimed_at"),
  lastResurrectionClaimedAt: timestamp("last_resurrection_claimed_at"),
}, (table) => {
  return {
    firebaseUidIdx: index("idx_users_firebase_uid").on(table.firebaseUid),
    // For leaderboard
    xpIdx: index("idx_users_xp_desc").on(table.xp),
  };
});

// Decoupled Referral System
export const referralProfiles = pgTable("referral_profiles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().unique(), // Foreign key to users.id
  referralCode: text("referral_code").notNull().unique(),
  referredById: varchar("referred_by_id"), // Optional: ID of the user who referred this user
  totalReferrals: integer("total_referrals").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertReferralProfileSchema = createInsertSchema(referralProfiles);
export type InsertReferralProfile = z.infer<typeof insertReferralProfileSchema>;
export type ReferralProfile = typeof referralProfiles.$inferSelect;

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
  category: text("category").default("general").notNull(), // fitness, productivity, mindfulness, etc.

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

// Bilateral Discipline Covenants (Peer Challenges)
export const peerCovenants = pgTable("peer_covenants", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  covenantCode: text("covenant_code").notNull().unique(),
  initiatorId: varchar("initiator_id").notNull().references(() => users.id),
  initiatorName: text("initiator_name").notNull(),
  initiatorStreak: integer("initiator_streak").default(0).notNull(),
  termsDays: integer("terms_days").default(7).notNull(),
  stakeCoins: integer("stake_coins").default(250).notNull(),
  protocolObjective: text("protocol_objective").default("Daily Protocol Execution").notNull(),
  counterpartyId: varchar("counterparty_id").references(() => users.id),
  counterpartyName: text("counterparty_name"),
  counterpartyStreak: integer("counterparty_streak").default(0),
  status: text("status").default("pending").notNull(), // pending, active, completed, breached
  winnerId: varchar("winner_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  acceptedAt: timestamp("accepted_at"),
  expiresAt: timestamp("expires_at"),
}, (table) => {
  return {
    covenantCodeIdx: index("idx_peer_covenants_code").on(table.covenantCode),
    initiatorIdx: index("idx_peer_covenants_initiator").on(table.initiatorId),
    counterpartyIdx: index("idx_peer_covenants_counterparty").on(table.counterpartyId),
  };
});

export type PeerCovenant = typeof peerCovenants.$inferSelect;
export const insertPeerCovenantSchema = createInsertSchema(peerCovenants);
export type InsertPeerCovenant = z.infer<typeof insertPeerCovenantSchema>;

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
  phone: z.string().nullable().optional(),
  // referralCode: z.string().nullable().optional(),
  // referredBy: z.string().nullable().optional(),
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
  category: z.string().optional(),
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
export type User = typeof users.$inferSelect & {
  isTrial?: boolean;
  trialEndsAt?: string;
};
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

// Citadel Builder
export const citadelBuildings = pgTable("citadel_buildings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  type: text("type").notNull(), // minor, major, monumental
  buildingName: text("building_name").default("house").notNull(), // house, library, treasury, forge, barracks
  x: integer("x").notNull(),
  y: integer("y").notNull(),
  status: text("status").notNull(), // building, completed, ruined
  wager: integer("wager").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  completedAt: timestamp("completed_at"),
  lastCollectedAt: timestamp("last_collected_at").defaultNow().notNull(),
});

export const insertCitadelBuildingSchema = z.object({
  userId: z.string().min(1),
  type: z.string().min(1),
  buildingName: z.string().optional(),
  x: z.number().int(),
  y: z.number().int(),
  status: z.string().min(1),
  wager: z.number().int().optional(),
});

export type CitadelBuilding = typeof citadelBuildings.$inferSelect;
export type InsertCitadelBuilding = z.infer<typeof insertCitadelBuildingSchema>;

// Telemetry Events for tracking usage
export const telemetryEvents = pgTable("telemetry_events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  eventType: text("event_type").notNull(), // 'tab_usage', 'feature_usage'
  eventName: text("event_name").notNull(), // e.g. 'Dashboard', 'Complete Quest'
  duration: integer("duration").default(0).notNull(), // duration in seconds
  timestamp: timestamp("timestamp").defaultNow().notNull(),
}, (table) => {
  return {
    userIdIdx: index("telemetry_events_user_id_idx").on(table.userId),
    eventTypeIdx: index("telemetry_events_event_type_idx").on(table.eventType),
    timestampIdx: index("telemetry_events_timestamp_idx").on(table.timestamp),
  };
});

export const insertTelemetryEventSchema = z.object({
  userId: z.string().min(1),
  eventType: z.string().min(1),
  eventName: z.string().min(1),
  duration: z.number().int().optional(),
});

export type TelemetryEvent = typeof telemetryEvents.$inferSelect;
export type InsertTelemetryEvent = z.infer<typeof insertTelemetryEventSchema>;

// ─── WORKOUT TRACKER ──────────────────────────────────────────────────────────

// Global exercise library (admin-seeded + user custom)
export const exercises = pgTable("exercises", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  category: text("category").notNull(),           // strength, cardio, flexibility, sports
  muscleGroup: text("muscle_group").notNull(),     // chest, back, legs, shoulders, arms, core, full_body
  equipment: text("equipment").default("bodyweight").notNull(), // barbell, dumbbell, machine, bodyweight, cable, kettlebell, band
  instructions: text("instructions"),
  isCustom: boolean("is_custom").default(false).notNull(),
  createdByUserId: varchar("created_by_user_id"),  // null = global/system exercise
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  muscleGroupIdx: index("exercises_muscle_group_idx").on(table.muscleGroup),
  categoryIdx: index("exercises_category_idx").on(table.category),
}));

// Workout templates (user-defined or system presets)
export const workoutTemplates = pgTable("workout_templates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),  // null = system template
  name: text("name").notNull(),
  description: text("description"),
  exerciseIds: jsonb("exercise_ids").$type<string[]>().default([]).notNull(),
  isPublic: boolean("is_public").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index("workout_templates_user_id_idx").on(table.userId),
}));

// Workout sessions (one session = one gym visit)
export const workoutSessions = pgTable("workout_sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  name: text("name").notNull(),            // e.g., "Push Day", "Leg Day"
  templateId: varchar("template_id"),      // optional, from which template
  startedAt: timestamp("started_at").notNull(),
  finishedAt: timestamp("finished_at"),
  durationSeconds: integer("duration_seconds"),
  totalVolume: integer("total_volume").default(0).notNull(), // total kg moved (weight × reps summed)
  totalSets: integer("total_sets").default(0).notNull(),
  xpEarned: integer("xp_earned").default(0).notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index("workout_sessions_user_id_idx").on(table.userId),
  startedAtIdx: index("workout_sessions_started_at_idx").on(table.startedAt),
}));

// Individual sets logged within a session
export const workoutSets = pgTable("workout_sets", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sessionId: varchar("session_id").notNull().references(() => workoutSessions.id, { onDelete: "cascade" }),
  exerciseId: varchar("exercise_id").notNull().references(() => exercises.id),
  setNumber: integer("set_number").notNull(),
  reps: integer("reps"),                       // null for timed exercises
  weight: decimal("weight", { precision: 6, scale: 2 }), // kg, null for bodyweight
  durationSeconds: integer("duration_seconds"),// for cardio/timed exercises
  rpe: integer("rpe"),                         // rate of perceived exertion 1-10
  isPersonalRecord: boolean("is_personal_record").default(false).notNull(),
  setType: text("set_type").default("normal").notNull(), // normal, warmup, dropset, failure
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  sessionIdIdx: index("workout_sets_session_id_idx").on(table.sessionId),
  exerciseIdIdx: index("workout_sets_exercise_id_idx").on(table.exerciseId),
}));

// Personal Records tracker
export const personalRecords = pgTable("personal_records", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  exerciseId: varchar("exercise_id").notNull().references(() => exercises.id),
  recordType: text("record_type").notNull(), // "1rm", "best_set_volume", "max_reps", "best_weight"
  value: decimal("value", { precision: 8, scale: 2 }).notNull(),
  setId: varchar("set_id").references(() => workoutSets.id),
  achievedAt: timestamp("achieved_at").defaultNow().notNull(),
}, (table) => ({
  userExerciseIdx: index("prs_user_exercise_idx").on(table.userId, table.exerciseId),
  userIdIdx: index("prs_user_id_idx").on(table.userId),
}));

// ─── Workout Zod Schemas ──────────────────────────────────────────────────────

export const insertExerciseSchema = z.object({
  name: z.string().min(1),
  category: z.string().min(1),
  muscleGroup: z.string().min(1),
  equipment: z.string().optional(),
  instructions: z.string().nullable().optional(),
  isCustom: z.boolean().optional(),
  createdByUserId: z.string().nullable().optional(),
});

export const insertWorkoutTemplateSchema = z.object({
  userId: z.string().nullable().optional(),
  name: z.string().min(1),
  description: z.string().nullable().optional(),
  exerciseIds: z.array(z.string()).optional(),
  isPublic: z.boolean().optional(),
});

export const insertWorkoutSessionSchema = z.object({
  userId: z.string().min(1),
  name: z.string().min(1),
  templateId: z.string().nullable().optional(),
  startedAt: z.date(),
  notes: z.string().nullable().optional(),
});

export const insertWorkoutSetSchema = z.object({
  sessionId: z.string().min(1),
  exerciseId: z.string().min(1),
  setNumber: z.number().int(),
  reps: z.number().int().nullable().optional(),
  weight: z.number().nullable().optional(),
  durationSeconds: z.number().int().nullable().optional(),
  rpe: z.number().int().min(1).max(10).nullable().optional(),
  setType: z.enum(["normal", "warmup", "dropset", "failure"]).optional(),
});

export const insertPersonalRecordSchema = z.object({
  userId: z.string().min(1),
  exerciseId: z.string().min(1),
  recordType: z.string().min(1),
  value: z.number(),
  setId: z.string().nullable().optional(),
});

// ─── Workout TypeScript Types ─────────────────────────────────────────────────

export type Exercise = typeof exercises.$inferSelect;
export type InsertExercise = z.infer<typeof insertExerciseSchema>;

export type WorkoutTemplate = typeof workoutTemplates.$inferSelect;
export type InsertWorkoutTemplate = z.infer<typeof insertWorkoutTemplateSchema>;

export type WorkoutSession = typeof workoutSessions.$inferSelect;
export type InsertWorkoutSession = z.infer<typeof insertWorkoutSessionSchema>;

export type WorkoutSet = typeof workoutSets.$inferSelect;
export type InsertWorkoutSet = z.infer<typeof insertWorkoutSetSchema>;

export type PersonalRecord = typeof personalRecords.$inferSelect;
export type InsertPersonalRecord = z.infer<typeof insertPersonalRecordSchema>;

// Extended types for API responses
export type WorkoutSetWithExercise = WorkoutSet & { exercise: Exercise };
export type WorkoutSessionWithSets = WorkoutSession & { sets: WorkoutSetWithExercise[] };

// ─── Gang System ──────────────────────────────────────────────────────────────

// Gang Groups (The core gang entity)
export const gangGroups = pgTable("gang_groups", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull().unique(),
  icon: text("icon"), // Optional emoji or icon name
  inviteCode: text("invite_code").notNull().unique(), // Short code for joining
  leaderId: varchar("leader_id").notNull().references(() => users.id),
  treasuryCoins: integer("treasury_coins").default(0).notNull(), // Pooled coins for hideout
  hideoutLevel: integer("hideout_level").default(1).notNull(), // 1=Wooden, 2=Stone, etc.
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertGangGroupSchema = z.object({
  name: z.string().min(1),
  icon: z.string().nullable().optional(),
  inviteCode: z.string().min(1),
  leaderId: z.string().min(1),
});

export type GangGroup = typeof gangGroups.$inferSelect;
export type InsertGangGroup = z.infer<typeof insertGangGroupSchema>;

// Gang Members
export const gangMembers = pgTable("gang_members", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  gangId: varchar("gang_id").notNull().references(() => gangGroups.id, { onDelete: 'cascade' }),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  role: text("role").default("member").notNull(), // 'leader' or 'member'
  joinedAt: timestamp("joined_at").defaultNow().notNull(),
}, (table) => ({
  gangIdIdx: index("gang_members_gang_id_idx").on(table.gangId),
  userIdIdx: index("gang_members_user_id_idx").on(table.userId),
}));

export const insertGangMemberSchema = z.object({
  gangId: z.string().min(1),
  userId: z.string().min(1),
  role: z.string().optional(),
});

export type GangMember = typeof gangMembers.$inferSelect;
export type InsertGangMember = z.infer<typeof insertGangMemberSchema>;

// Gang Co-op Quests
export const gangCoopQuests = pgTable("gang_coop_quests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  gangId: varchar("gang_id").notNull().references(() => gangGroups.id, { onDelete: 'cascade' }),
  objective: text("objective").notNull(),
  targetValue: integer("target_value").notNull(),
  currentValue: integer("current_value").default(0).notNull(),
  rewardCoins: integer("reward_coins").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  completedAt: timestamp("completed_at"),
});

export const insertGangCoopQuestSchema = z.object({
  gangId: z.string().min(1),
  objective: z.string().min(1),
  targetValue: z.number().int(),
  rewardCoins: z.number().int(),
  expiresAt: z.date(),
});

export type GangCoopQuest = typeof gangCoopQuests.$inferSelect;
export type InsertGangCoopQuest = z.infer<typeof insertGangCoopQuestSchema>;

// Gang Duels
export const gangDuels = pgTable("gang_duels", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  challengerGangId: varchar("challenger_gang_id").notNull().references(() => gangGroups.id, { onDelete: 'cascade' }),
  defenderGangId: varchar("defender_gang_id").notNull().references(() => gangGroups.id, { onDelete: 'cascade' }),
  status: text("status").default("pending").notNull(), // 'pending', 'active', 'completed'
  duelType: text("duel_type").notNull(), // 'xp', 'steps', etc.
  challengerScore: integer("challenger_score").default(0).notNull(),
  defenderScore: integer("defender_score").default(0).notNull(),
  winnerId: varchar("winner_id").references(() => gangGroups.id),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertGangDuelSchema = z.object({
  challengerGangId: z.string().min(1),
  defenderGangId: z.string().min(1),
  duelType: z.string().min(1),
  expiresAt: z.date(),
  status: z.string().optional(),
});

export type GangDuel = typeof gangDuels.$inferSelect;
export type InsertGangDuel = z.infer<typeof insertGangDuelSchema>;

// ─── 4-Pillars Uncompromising Human Execution Engine ─────────────────────────

// 1. Intelligence Intake & Execution Profiles
export const executionProfiles = pgTable("execution_profiles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  targetOutcome: text("target_outcome").notNull(), // Layer 1: Exact target statement
  targetDeadline: timestamp("target_deadline").notNull(),
  failureStatement: text("failure_statement").notNull(), // Exact painful consequence if failed
  gapMatrix: jsonb("gap_matrix").$type<Record<string, number>>().notNull(), // Layer 2: Domain readiness heatmap
  failureAutopsy: jsonb("failure_autopsy").$type<{
    pastAttempts: string;
    primaryFailureTrigger: string;
    rationalizationPattern: string;
    relapseSignature: string;
  }>().notNull(), // Layer 3: Diagnostic of past failures
  cognitiveFingerprint: jsonb("cognitive_fingerprint").$type<{
    peakFocusStart: string;
    peakFocusEnd: string;
    primaryDistractor: string;
    stressResponse: "freeze" | "flight" | "scatter";
    environmentPreference: string;
  }>().notNull(), // Layer 4: Biological & environmental profile
  commitmentCapacity: jsonb("commitment_capacity").$type<{
    dailyDeepWorkHours: number;
    deadDays: string[];
    nonNegotiableTimeThief: string;
    weeklyTargetHours: number;
  }>().notNull(), // Layer 5: Time reality
  roadmapMilestones: jsonb("roadmap_milestones").$type<Array<{
    id: string;
    weekNumber: number;
    title: string;
    coreDeliverable: string;
    estimatedHours: number;
    probabilityScore: number;
    completed: boolean;
  }>>().default([]).notNull(),
  currentMilestoneIndex: integer("current_milestone_index").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertExecutionProfileSchema = z.object({
  userId: z.string().min(1),
  targetOutcome: z.string().min(3),
  targetDeadline: z.union([z.string(), z.date()]),
  failureStatement: z.string().min(10),
  gapMatrix: z.record(z.string(), z.number()),
  failureAutopsy: z.object({
    pastAttempts: z.string(),
    primaryFailureTrigger: z.string(),
    rationalizationPattern: z.string(),
    relapseSignature: z.string(),
  }),
  cognitiveFingerprint: z.object({
    peakFocusStart: z.string(),
    peakFocusEnd: z.string(),
    primaryDistractor: z.string(),
    stressResponse: z.enum(["freeze", "flight", "scatter"]),
    environmentPreference: z.string(),
  }),
  commitmentCapacity: z.object({
    dailyDeepWorkHours: z.number().min(0.5).max(16),
    deadDays: z.array(z.string()),
    nonNegotiableTimeThief: z.string(),
    weeklyTargetHours: z.number().min(1),
  }),
  roadmapMilestones: z.array(z.object({
    id: z.string(),
    weekNumber: z.number(),
    title: z.string(),
    coreDeliverable: z.string(),
    estimatedHours: z.number(),
    probabilityScore: z.number(),
    completed: z.boolean(),
  })).optional(),
  currentMilestoneIndex: z.number().int().optional(),
});

export type ExecutionProfile = typeof executionProfiles.$inferSelect;
export type InsertExecutionProfile = z.infer<typeof insertExecutionProfileSchema>;

// 2. Single Mission Lock (Daily Missions)
export const dailyMissions = pgTable("daily_missions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  date: text("date").notNull(), // YYYY-MM-DD
  title: text("title").notNull(), // Strategic Objective
  tacticalDeliverable: text("tactical_deliverable").notNull(), // Exact verifiable output required
  focusTier: text("focus_tier").default("L1").notNull(), // L1, L2, L3, L4
  estimatedMinutes: integer("estimated_minutes").default(90).notNull(),
  executionWindow: text("execution_window").notNull(), // e.g. "09:00 - 11:30"
  primingRitual: text("priming_ritual").notNull(), // 2-min starter action
  failureCondition: text("failure_condition").notNull(), // Immediate disqualifier
  proofTypeRequired: text("proof_type_required").default("structured_text").notNull(), // structured_text, artifact_url, mcq_recall, code_diff
  status: text("status").default("pending").notNull(), // pending, committed, in_progress, completed, failed, aborted
  committedAt: timestamp("committed_at"),
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  abortedAt: timestamp("aborted_at"),
  abortReason: text("abort_reason"),
  proofData: jsonb("proof_data").$type<{
    content?: string;
    url?: string;
    metrics?: Record<string, any>;
    mcqAnswers?: Record<string, string>;
  }>(),
  proofQualityScore: integer("proof_quality_score"), // 0 - 100
  aiReviewFeedback: text("ai_review_feedback"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertDailyMissionSchema = z.object({
  userId: z.string().min(1),
  date: z.string().min(1),
  title: z.string().min(1),
  tacticalDeliverable: z.string().min(1),
  focusTier: z.string().optional(),
  estimatedMinutes: z.number().int().optional(),
  executionWindow: z.string().min(1),
  primingRitual: z.string().min(1),
  failureCondition: z.string().min(1),
  proofTypeRequired: z.string().optional(),
  status: z.string().optional(),
  abortReason: z.string().optional(),
  proofData: z.any().optional(),
  proofQualityScore: z.number().int().optional(),
  aiReviewFeedback: z.string().optional(),
});

export type DailyMission = typeof dailyMissions.$inferSelect;
export type InsertDailyMission = z.infer<typeof insertDailyMissionSchema>;

// 3. Air-Gap Focus Sessions
export const focusDensitySessions = pgTable("focus_density_sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  missionId: varchar("mission_id").references(() => dailyMissions.id, { onDelete: 'set null' }),
  declarationOutput: text("declaration_output").notNull(), // What exact output will be produced
  obstaclePreMortem: text("obstacle_pre_mortem").notNull(), // What will try to derail + countermove
  scheduledMinutes: integer("scheduled_minutes").notNull(),
  actualMinutes: integer("actual_minutes").default(0).notNull(),
  status: text("status").default("active").notNull(), // active, completed, aborted, breached
  oathAcknowledged: boolean("oath_acknowledged").default(true).notNull(),
  breachesCount: integer("breaches_count").default(0).notNull(),
  breachEvents: jsonb("breach_events").$type<Array<{
    timestamp: string;
    eventType: string;
    details: string;
  }>>().default([]).notNull(),
  attentionQualityScore: integer("attention_quality_score").default(100).notNull(),
  proofSubmitted: boolean("proof_submitted").default(false).notNull(),
  startedAt: timestamp("started_at").defaultNow().notNull(),
  endedAt: timestamp("ended_at"),
});

export const insertFocusDensitySessionSchema = z.object({
  userId: z.string().min(1),
  missionId: z.string().nullable().optional(),
  declarationOutput: z.string().min(3),
  obstaclePreMortem: z.string().min(3),
  scheduledMinutes: z.number().int().min(5),
  actualMinutes: z.number().int().optional(),
  status: z.string().optional(),
  oathAcknowledged: z.boolean().optional(),
  breachesCount: z.number().int().optional(),
  breachEvents: z.array(z.any()).optional(),
  attentionQualityScore: z.number().int().optional(),
  proofSubmitted: z.boolean().optional(),
});

export type FocusDensitySession = typeof focusDensitySessions.$inferSelect;
export type InsertFocusDensitySession = z.infer<typeof insertFocusDensitySessionSchema>;

// 4. Discipline Breaches (Permanent Record)
export const disciplineBreaches = pgTable("discipline_breaches", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  sessionId: varchar("session_id").references(() => focusDensitySessions.id, { onDelete: 'set null' }),
  type: text("type").notNull(), // visibility_lost, window_blurred, session_abandoned, mission_aborted, oath_violated, morning_briefing_ignored
  severity: text("severity").default("minor").notNull(), // warning, minor, major, critical
  description: text("description").notNull(),
  penaltyScore: integer("penalty_score").default(15).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertDisciplineBreachSchema = z.object({
  userId: z.string().min(1),
  sessionId: z.string().nullable().optional(),
  type: z.string().min(1),
  severity: z.string().optional(),
  description: z.string().min(1),
  penaltyScore: z.number().int().optional(),
});

export type DisciplineBreach = typeof disciplineBreaches.$inferSelect;
export type InsertDisciplineBreach = z.infer<typeof insertDisciplineBreachSchema>;

// 5. Discipline Reputation Score (0 - 1000)
export const disciplineScores = pgTable("discipline_scores", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().unique().references(() => users.id, { onDelete: 'cascade' }),
  score: integer("score").default(700).notNull(), // 0 - 1000
  tier: text("tier").default("Practitioner").notNull(), // Novice, Apprentice, Practitioner, Ironclad, Ascended
  totalSessions: integer("total_sessions").default(0).notNull(),
  completedMissions: integer("completed_missions").default(0).notNull(),
  abortedMissions: integer("aborted_missions").default(0).notNull(),
  totalBreaches: integer("total_breaches").default(0).notNull(),
  currentStreak: integer("current_streak").default(0).notNull(),
  highestScore: integer("highest_score").default(700).notNull(),
  focusDensityAverage: integer("focus_density_average").default(0).notNull(), // percentage 0-100
  lastCalculatedAt: timestamp("last_calculated_at").defaultNow().notNull(),
});

export const insertDisciplineScoreSchema = z.object({
  userId: z.string().min(1),
  score: z.number().int().min(0).max(1000).optional(),
  tier: z.string().optional(),
  totalSessions: z.number().int().optional(),
  completedMissions: z.number().int().optional(),
  abortedMissions: z.number().int().optional(),
  totalBreaches: z.number().int().optional(),
  currentStreak: z.number().int().optional(),
  highestScore: z.number().int().optional(),
  focusDensityAverage: z.number().int().optional(),
});

export type DisciplineScore = typeof disciplineScores.$inferSelect;
export type InsertDisciplineScore = z.infer<typeof insertDisciplineScoreSchema>;

// 6. Commitment Contracts
export const commitmentContracts = pgTable("commitment_contracts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  weekStartDate: text("week_start_date").notNull(), // YYYY-MM-DD
  weekEndDate: text("week_end_date").notNull(), // YYYY-MM-DD
  targetMissionsCount: integer("target_missions_count").default(5).notNull(),
  targetFocusMinutes: integer("target_focus_minutes").default(600).notNull(),
  stakeAmountCents: integer("stake_amount_cents").default(0).notNull(),
  antiCharityRecipient: text("anti_charity_recipient"),
  status: text("status").default("active").notNull(), // active, fulfilled, breached, forfeited
  verifiedMissionsCount: integer("verified_missions_count").default(0).notNull(),
  verifiedFocusMinutes: integer("verified_focus_minutes").default(0).notNull(),
  outcomeVerdict: text("outcome_verdict"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertCommitmentContractSchema = z.object({
  userId: z.string().min(1),
  weekStartDate: z.string().min(1),
  weekEndDate: z.string().min(1),
  targetMissionsCount: z.number().int().optional(),
  targetFocusMinutes: z.number().int().optional(),
  stakeAmountCents: z.number().int().optional(),
  antiCharityRecipient: z.string().nullable().optional(),
  status: z.string().optional(),
  verifiedMissionsCount: z.number().int().optional(),
  verifiedFocusMinutes: z.number().int().optional(),
  outcomeVerdict: z.string().nullable().optional(),
});

export type CommitmentContract = typeof commitmentContracts.$inferSelect;
export type InsertCommitmentContract = z.infer<typeof insertCommitmentContractSchema>;

// 7. Evening Debrief Audit
export const eveningDebriefs = pgTable("evening_debriefs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  date: text("date").notNull(), // YYYY-MM-DD
  missionId: varchar("mission_id").references(() => dailyMissions.id, { onDelete: 'set null' }),
  reflectionText: text("reflection_text").notNull(), // Min 50 words
  aiFeedback: text("ai_feedback"),
  selfHonestyRating: integer("self_honesty_rating").default(8).notNull(), // 1 - 10
  focusDensityScoreOfDay: integer("focus_density_score_of_day").default(0).notNull(), // 0 - 100
  submittedAt: timestamp("submitted_at").defaultNow().notNull(),
});

export const insertEveningDebriefSchema = z.object({
  userId: z.string().min(1),
  date: z.string().min(1),
  missionId: z.string().nullable().optional(),
  reflectionText: z.string().min(20),
  aiFeedback: z.string().nullable().optional(),
  selfHonestyRating: z.number().int().min(1).max(10).optional(),
  focusDensityScoreOfDay: z.number().int().min(0).max(100).optional(),
});

export type EveningDebrief = typeof eveningDebriefs.$inferSelect;
export type InsertEveningDebrief = z.infer<typeof insertEveningDebriefSchema>;

// ─── Phase 2: High-Stakes Squad Pacts & Performance Court ───────────────────

// 8. Squad Pacts (3-5 Member Discipline Stake Pool)
export const squadPacts = pgTable("squad_pacts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  inviteCode: text("invite_code").notNull().unique(),
  creatorId: varchar("creator_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  weeklyStakePoints: integer("weekly_stake_points").default(50).notNull(), // Discipline points staked per member
  totalPool: integer("total_pool").default(0).notNull(),
  weekNumber: integer("week_number").default(1).notNull(),
  status: text("status").default("active").notNull(), // forming, active, evaluated
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertSquadPactSchema = z.object({
  name: z.string().min(2),
  inviteCode: z.string().min(4),
  creatorId: z.string().min(1),
  weeklyStakePoints: z.number().int().min(10).max(200).optional(),
  totalPool: z.number().int().optional(),
  weekNumber: z.number().int().optional(),
  status: z.string().optional(),
});

export type SquadPact = typeof squadPacts.$inferSelect;
export type InsertSquadPact = z.infer<typeof insertSquadPactSchema>;

// 9. Squad Pact Members & Live Ambient Intelligence
export const squadPactMembers = pgTable("squad_pact_members", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  pactId: varchar("pact_id").notNull().references(() => squadPacts.id, { onDelete: 'cascade' }),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  stakedPoints: integer("staked_points").default(50).notNull(),
  status: text("status").default("active").notNull(), // active, passed, forfeited
  bonusReceived: integer("bonus_received").default(0).notNull(),
  currentLiveStatus: text("current_live_status").default("idle").notNull(), // idle, in_session, unresponsive, breached, completed_today
  activeSessionMinutes: integer("active_session_minutes").default(0).notNull(),
  joinedAt: timestamp("joined_at").defaultNow().notNull(),
});

export const insertSquadPactMemberSchema = z.object({
  pactId: z.string().min(1),
  userId: z.string().min(1),
  stakedPoints: z.number().int().optional(),
  status: z.string().optional(),
  currentLiveStatus: z.string().optional(),
  activeSessionMinutes: z.number().int().optional(),
});

export type SquadPactMember = typeof squadPactMembers.$inferSelect;
export type InsertSquadPactMember = z.infer<typeof insertSquadPactMemberSchema>;

// 10. Public Commitment Wall (Major Life Declarations with Live Witnesses)
export const publicCommitments = pgTable("public_commitments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  declaration: text("declaration").notNull(), // The Major Life Declaration
  targetDeadline: timestamp("target_deadline").notNull(),
  currentDisciplineScore: integer("current_discipline_score").default(700).notNull(),
  velocityPercent: integer("velocity_percent").default(70).notNull(),
  witnessesCount: integer("witnesses_count").default(1).notNull(),
  weeklyUpdates: jsonb("weekly_updates").$type<Array<{
    weekNumber: number;
    velocity: number;
    verdict: string;
    date: string;
  }>>().default([]).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertPublicCommitmentSchema = z.object({
  userId: z.string().min(1),
  declaration: z.string().min(10),
  targetDeadline: z.union([z.string(), z.date()]),
  currentDisciplineScore: z.number().int().optional(),
  velocityPercent: z.number().int().optional(),
  witnessesCount: z.number().int().optional(),
  weeklyUpdates: z.array(z.any()).optional(),
});

export type PublicCommitment = typeof publicCommitments.$inferSelect;
export type InsertPublicCommitment = z.infer<typeof insertPublicCommitmentSchema>;

// 11. Weekly Performance Court Audits
export const performanceCourtAudits = pgTable("performance_court_audits", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  weekNumber: integer("week_number").notNull(),
  year: integer("year").notNull(),
  missionsAssigned: integer("missions_assigned").default(7).notNull(),
  missionsCompleted: integer("missions_completed").default(0).notNull(),
  targetFocusMinutes: integer("target_focus_minutes").default(900).notNull(),
  actualFocusMinutes: integer("actual_focus_minutes").default(0).notNull(),
  focusDensityScore: integer("focus_density_score").default(0).notNull(), // 0 - 100
  breachesCount: integer("breaches_count").default(0).notNull(),
  aiVerdict: text("ai_verdict").notNull(), // Uncompromising analytical judgment
  roadmapImpact: text("roadmap_impact").notNull(), // Days added/saved, revised deadline probability
  sharedWithSquad: boolean("shared_with_squad").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertPerformanceCourtAuditSchema = z.object({
  userId: z.string().min(1),
  weekNumber: z.number().int(),
  year: z.number().int(),
  missionsAssigned: z.number().int().optional(),
  missionsCompleted: z.number().int().optional(),
  targetFocusMinutes: z.number().int().optional(),
  actualFocusMinutes: z.number().int().optional(),
  focusDensityScore: z.number().int().optional(),
  breachesCount: z.number().int().optional(),
  aiVerdict: z.string().min(10),
  roadmapImpact: z.string().min(5),
  sharedWithSquad: z.boolean().optional(),
});

export type PerformanceCourtAudit = typeof performanceCourtAudits.$inferSelect;
export type InsertPerformanceCourtAudit = z.infer<typeof insertPerformanceCourtAuditSchema>;

// 12. Mid-Day Pulse Checks
export const midDayPulses = pgTable("mid_day_pulses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  date: text("date").notNull(), // YYYY-MM-DD
  missionStatus: text("mission_status").notNull(), // 'not_started' | 'in_progress' | 'completed'
  committedAction: text("committed_action").notNull(), // The 30m micro-action
  timeBlockMinutes: integer("time_block_minutes").default(30).notNull(),
  acknowledgedAt: timestamp("acknowledged_at").defaultNow().notNull(),
  executedSuccessfully: boolean("executed_successfully"),
});

export const insertMidDayPulseSchema = z.object({
  userId: z.string().min(1),
  date: z.string().min(1),
  missionStatus: z.string().min(1),
  committedAction: z.string().min(5),
  timeBlockMinutes: z.number().int().optional(),
  executedSuccessfully: z.boolean().optional(),
});

export type MidDayPulse = typeof midDayPulses.$inferSelect;
export type InsertMidDayPulse = z.infer<typeof insertMidDayPulseSchema>;

// 13. Hall of Ascension (30+ Day Elite Inductees with 90%+ Consistency)
export const hallOfAscension = pgTable("hall_of_ascension", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  userName: text("user_name").notNull(),
  avatarUrl: text("avatar_url"),
  goalTitle: text("goal_title").notNull(),
  disciplineScore: integer("discipline_score").notNull(),
  verifiedDeepWorkMinutes: integer("verified_deep_work_minutes").notNull(),
  consecutiveDays: integer("consecutive_days").notNull(),
  inductedAt: timestamp("inducted_at").defaultNow().notNull(),
  status: text("status").default("active").notNull(),
});

export const insertHallOfAscensionSchema = z.object({
  userId: z.string().min(1),
  userName: z.string().min(1),
  avatarUrl: z.string().optional(),
  goalTitle: z.string().min(3),
  disciplineScore: z.number().int(),
  verifiedDeepWorkMinutes: z.number().int(),
  consecutiveDays: z.number().int(),
  status: z.string().optional(),
});

export type HallOfAscensionEntry = typeof hallOfAscension.$inferSelect;
export type InsertHallOfAscensionEntry = z.infer<typeof insertHallOfAscensionSchema>;

// 14. Wall of Consequence (High-Stakes Contract Defaulters)
export const wallOfConsequence = pgTable("wall_of_consequence", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  userName: text("user_name").notNull(),
  contractTarget: text("contract_target").notNull(),
  failedDate: timestamp("failed_date").defaultNow().notNull(),
  stakeForfeited: text("stake_forfeited").notNull(),
  dishonorReason: text("dishonor_reason").notNull(),
  breachType: text("breach_type").default("contract_default").notNull(),
  avatarUrl: text("avatar_url"),
});

export const insertWallOfConsequenceSchema = z.object({
  userId: z.string().min(1),
  userName: z.string().min(1),
  contractTarget: z.string().min(3),
  stakeForfeited: z.string().min(2),
  dishonorReason: z.string().min(5),
  breachType: z.string().optional(),
  avatarUrl: z.string().optional(),
});

export type WallOfConsequenceEntry = typeof wallOfConsequence.$inferSelect;
export type InsertWallOfConsequenceEntry = z.infer<typeof insertWallOfConsequenceSchema>;


