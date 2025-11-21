import { db } from "./db";
import { users, quests, activityHistory, rankTrials } from "@shared/schema";
import { eq } from "drizzle-orm";
import type {
  User,
  InsertUser,
  Quest,
  InsertQuest,
  Activity,
  InsertActivity,
  RankTrial,
  InsertRankTrial,
} from "@shared/schema";

export class DrizzleStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id));
    return result[0];
  }

  async getUserByFirebaseUid(firebaseUid: string): Promise<User | undefined> {
    const result = await db
      .select()
      .from(users)
      .where(eq(users.firebaseUid, firebaseUid));
    return result[0];
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const result = await db.insert(users).values(insertUser).returning();
    return result[0];
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User> {
    const result = await db
      .update(users)
      .set(updates)
      .where(eq(users.id, id))
      .returning();
    return result[0];
  }

  async getAllUsers(): Promise<User[]> {
    return db.select().from(users);
  }

  // Quest operations
  async getQuest(id: string): Promise<Quest | undefined> {
    const result = await db.select().from(quests).where(eq(quests.id, id));
    return result[0];
  }

  async getUserQuests(userId: string): Promise<Quest[]> {
    return db.select().from(quests).where(eq(quests.userId, userId));
  }

  async createQuest(insertQuest: InsertQuest): Promise<Quest> {
    const result = await db.insert(quests).values(insertQuest).returning();
    return result[0];
  }

  async updateQuest(id: string, updates: Partial<Quest>): Promise<Quest> {
    const result = await db
      .update(quests)
      .set(updates)
      .where(eq(quests.id, id))
      .returning();
    return result[0];
  }

  async deleteQuest(id: string): Promise<void> {
    await db.delete(quests).where(eq(quests.id, id));
  }

  // Activity operations
  async getActivity(id: string): Promise<Activity | undefined> {
    const result = await db
      .select()
      .from(activityHistory)
      .where(eq(activityHistory.id, id));
    return result[0];
  }

  async getUserActivities(userId: string): Promise<Activity[]> {
    return db
      .select()
      .from(activityHistory)
      .where(eq(activityHistory.userId, userId));
  }

  async createActivity(insertActivity: InsertActivity): Promise<Activity> {
    const result = await db
      .insert(activityHistory)
      .values(insertActivity)
      .returning();
    return result[0];
  }

  // Rank Trial operations
  async getRankTrial(id: string): Promise<RankTrial | undefined> {
    const result = await db
      .select()
      .from(rankTrials)
      .where(eq(rankTrials.id, id));
    return result[0];
  }

  async getUserRankTrials(userId: string): Promise<RankTrial[]> {
    return db
      .select()
      .from(rankTrials)
      .where(eq(rankTrials.userId, userId));
  }

  async createRankTrial(insertTrial: InsertRankTrial): Promise<RankTrial> {
    const result = await db
      .insert(rankTrials)
      .values(insertTrial)
      .returning();
    return result[0];
  }

  async updateRankTrial(
    id: string,
    updates: Partial<RankTrial>
  ): Promise<RankTrial> {
    const result = await db
      .update(rankTrials)
      .set(updates)
      .where(eq(rankTrials.id, id))
      .returning();
    return result[0];
  }
}
