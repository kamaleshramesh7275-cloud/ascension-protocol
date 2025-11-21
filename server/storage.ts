import {
  type User,
  type InsertUser,
  type Quest,
  type InsertQuest,
  type Activity,
  type InsertActivity,
  TIER_THRESHOLDS,
  Tier,
} from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByFirebaseUid(firebaseUid: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<User>): Promise<User>;
  getAllUsers(): Promise<User[]>;
  
  // Quest operations
  getQuest(id: string): Promise<Quest | undefined>;
  getUserQuests(userId: string): Promise<Quest[]>;
  createQuest(quest: InsertQuest): Promise<Quest>;
  updateQuest(id: string, updates: Partial<Quest>): Promise<Quest>;
  deleteQuest(id: string): Promise<void>;
  
  // Activity operations
  getActivity(id: string): Promise<Activity | undefined>;
  getUserActivities(userId: string): Promise<Activity[]>;
  createActivity(activity: InsertActivity): Promise<Activity>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private quests: Map<string, Quest>;
  private activities: Map<string, Activity>;

  constructor() {
    this.users = new Map();
    this.quests = new Map();
    this.activities = new Map();
  }

  // User operations
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByFirebaseUid(firebaseUid: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.firebaseUid === firebaseUid,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    
    // Create user object matching the exact schema requirements
    const user: User = {
      id,
      firebaseUid: insertUser.firebaseUid,
      name: insertUser.name,
      email: insertUser.email,
      avatarUrl: insertUser.avatarUrl || null,
      createdAt: new Date(),
      timezone: insertUser.timezone || "UTC",
      level: 1,
      xp: 0,
      tier: "D" as Tier,
      streak: 0,
      lastActive: new Date(),
      // Initialize all 7 stats to 10
      strength: 10,
      agility: 10,
      stamina: 10,
      vitality: 10,
      intelligence: 10,
      willpower: 10,
      charisma: 10,
    };
    
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User> {
    const user = this.users.get(id);
    if (!user) {
      throw new Error("User not found");
    }
    
    // Merge updates while preserving type safety
    const updatedUser: User = { 
      ...user, 
      ...updates 
    };
    
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  // Quest operations
  async getQuest(id: string): Promise<Quest | undefined> {
    return this.quests.get(id);
  }

  async getUserQuests(userId: string): Promise<Quest[]> {
    return Array.from(this.quests.values()).filter(
      (quest) => quest.userId === userId,
    );
  }

  async createQuest(insertQuest: InsertQuest): Promise<Quest> {
    const id = randomUUID();
    
    // Create quest object matching schema requirements
    const quest: Quest = {
      id,
      userId: insertQuest.userId,
      title: insertQuest.title,
      description: insertQuest.description,
      type: insertQuest.type,
      rewardXP: insertQuest.rewardXP,
      rewardStats: insertQuest.rewardStats || null,
      createdAt: new Date(),
      dueAt: insertQuest.dueAt,
      completed: false,
      completedAt: null,
    };
    
    this.quests.set(id, quest);
    return quest;
  }

  async updateQuest(id: string, updates: Partial<Quest>): Promise<Quest> {
    const quest = this.quests.get(id);
    if (!quest) {
      throw new Error("Quest not found");
    }
    
    const updatedQuest: Quest = { ...quest, ...updates };
    this.quests.set(id, updatedQuest);
    return updatedQuest;
  }

  async deleteQuest(id: string): Promise<void> {
    this.quests.delete(id);
  }

  // Activity operations
  async getActivity(id: string): Promise<Activity | undefined> {
    return this.activities.get(id);
  }

  async getUserActivities(userId: string): Promise<Activity[]> {
    return Array.from(this.activities.values())
      .filter((activity) => activity.userId === userId)
      .sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
  }

  async createActivity(insertActivity: InsertActivity): Promise<Activity> {
    const id = randomUUID();
    
    // Create activity object matching schema requirements
    const activity: Activity = {
      id,
      userId: insertActivity.userId,
      action: insertActivity.action,
      questId: insertActivity.questId || null,
      xpDelta: insertActivity.xpDelta || 0,
      statDeltas: insertActivity.statDeltas || null,
      timestamp: new Date(),
    };
    
    this.activities.set(id, activity);
    return activity;
  }
}

export const storage = new MemStorage();
