import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
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
  
  // Meta - progression data
  level: integer("level").default(1).notNull(),
  xp: integer("xp").default(0).notNull(),
  tier: text("tier").default("D").notNull(), // D, C, B, A, S
  streak: integer("streak").default(0).notNull(),
  lastActive: timestamp("last_active").defaultNow(),
  
  // Stats - 7 core attributes (1-100)
  strength: integer("strength").default(10).notNull(),
  agility: integer("agility").default(10).notNull(),
  stamina: integer("stamina").default(10).notNull(),
  vitality: integer("vitality").default(10).notNull(),
  intelligence: integer("intelligence").default(10).notNull(),
  willpower: integer("willpower").default(10).notNull(),
  charisma: integer("charisma").default(10).notNull(),
});

// Quests table
export const quests = pgTable("quests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  title: text("title").notNull(),
  description: text("description").notNull(),
  type: text("type").notNull(), // daily, weekly, ai
  rewardXP: integer("reward_xp").notNull(),
  rewardStats: jsonb("reward_stats").$type<Record<string, number>>(), // e.g., {strength: 2, stamina: 1}
  createdAt: timestamp("created_at").defaultNow().notNull(),
  dueAt: timestamp("due_at").notNull(),
  completed: boolean("completed").default(false).notNull(),
  completedAt: timestamp("completed_at"),
});

// Activity history table
export const activityHistory = pgTable("activity_history", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  action: text("action").notNull(), // completeQuest, levelUp, rankUp
  questId: varchar("quest_id"),
  xpDelta: integer("xp_delta").default(0).notNull(),
  statDeltas: jsonb("stat_deltas").$type<Record<string, number>>(),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

// Zod schemas for validation
export const insertUserSchema = createInsertSchema(users).pick({
  firebaseUid: true,
  name: true,
  email: true,
  avatarUrl: true,
  timezone: true,
});

export const insertQuestSchema = createInsertSchema(quests).omit({
  id: true,
  createdAt: true,
  completed: true,
  completedAt: true,
});

export const insertActivitySchema = createInsertSchema(activityHistory).omit({
  id: true,
  timestamp: true,
});

// TypeScript types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertQuest = z.infer<typeof insertQuestSchema>;
export type Quest = typeof quests.$inferSelect;

export type InsertActivity = z.infer<typeof insertActivitySchema>;
export type Activity = typeof activityHistory.$inferSelect;

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

export type QuestType = "daily" | "weekly" | "ai";

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
