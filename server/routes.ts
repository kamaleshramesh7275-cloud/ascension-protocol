import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { DrizzleStorage } from "./drizzle-storage";
import { TIER_THRESHOLDS, Tier, STAT_NAMES } from "@shared/schema";
import { getRandomDailyQuests, getRandomWeeklyQuest, getRankTrialQuest } from "./quest-templates";

const storage = new DrizzleStorage();

// Middleware to check Firebase auth (simplified for MVP)
// In production, you'd verify Firebase tokens here
function requireAuth(req: Request, res: Response, next: Function) {
  const firebaseUid = req.headers["x-firebase-uid"] as string;
  if (!firebaseUid) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  req.firebaseUid = firebaseUid;
  next();
}

// Helper to calculate tier from XP
function calculateTier(xp: number): Tier {
  if (xp >= TIER_THRESHOLDS.S) return "S";
  if (xp >= TIER_THRESHOLDS.A) return "A";
  if (xp >= TIER_THRESHOLDS.B) return "B";
  if (xp >= TIER_THRESHOLDS.C) return "C";
  return "D";
}

// Helper to calculate level from XP
function calculateLevel(xp: number): number {
  return Math.floor(xp / 100) + 1;
}

// Helper to assign daily quests to a user
async function assignDailyQuests(userId: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  // Check if user already has today's quests
  const existingQuests = await storage.getUserQuests(userId);
  const todayQuests = existingQuests.filter(q => {
    const questDate = new Date(q.createdAt);
    return questDate >= today && questDate < tomorrow && q.type === "daily";
  });
  
  if (todayQuests.length > 0) {
    return; // Already has quests for today
  }
  
  // Assign new daily quests
  const questTemplates = getRandomDailyQuests(5);
  const dueDate = new Date(tomorrow);
  dueDate.setHours(23, 59, 59, 999);
  
  for (const template of questTemplates) {
    await storage.createQuest({
      userId,
      title: template.title,
      description: template.description,
      type: template.type,
      rewardXP: template.rewardXP,
      rewardStats: template.rewardStats,
      dueAt: dueDate,
    });
  }
}

// Helper to assign weekly quest
async function assignWeeklyQuest(userId: string) {
  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - now.getDay()); // Start of week (Sunday)
  weekStart.setHours(0, 0, 0, 0);
  
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 7);
  
  // Check if user already has this week's quest
  const existingQuests = await storage.getUserQuests(userId);
  const weeklyQuest = existingQuests.find(q => {
    const questDate = new Date(q.createdAt);
    return questDate >= weekStart && questDate < weekEnd && q.type === "weekly";
  });
  
  if (weeklyQuest) {
    return; // Already has weekly quest
  }
  
  // Assign new weekly quest
  const template = getRandomWeeklyQuest();
  const dueDate = new Date(weekEnd);
  dueDate.setHours(23, 59, 59, 999);
  
  await storage.createQuest({
    userId,
    title: template.title,
    description: template.description,
    type: template.type,
    rewardXP: template.rewardXP,
    rewardStats: template.rewardStats,
    dueAt: dueDate,
  });
}

declare global {
  namespace Express {
    interface Request {
      firebaseUid?: string;
    }
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Authentication & User Management
  
  // Get or create user (called after Firebase auth)
  app.post("/api/auth/register", async (req, res) => {
    try {
      const { firebaseUid, name, email, avatarUrl } = req.body;
      
      if (!firebaseUid || !name || !email) {
        return res.status(400).json({ error: "Missing required fields" });
      }
      
      // Check if user already exists
      let user = await storage.getUserByFirebaseUid(firebaseUid);
      
      if (!user) {
        // Create new user
        user = await storage.createUser({
          firebaseUid,
          name,
          email,
          avatarUrl,
          timezone: "UTC",
        });
        
        // Assign initial quests
        await assignDailyQuests(user.id);
        await assignWeeklyQuest(user.id);
      }
      
      res.json(user);
    } catch (error) {
      console.error("Register error:", error);
      res.status(500).json({ error: "Failed to register user" });
    }
  });
  
  // Get current user
  app.get("/api/user", requireAuth, async (req, res) => {
    try {
      const user = await storage.getUserByFirebaseUid(req.firebaseUid!);
      
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      // Ensure user has quests
      await assignDailyQuests(user.id);
      await assignWeeklyQuest(user.id);
      
      res.json(user);
    } catch (error) {
      console.error("Get user error:", error);
      res.status(500).json({ error: "Failed to get user" });
    }
  });
  
  // Quest Management
  
  // Get user's quests
  app.get("/api/quests", requireAuth, async (req, res) => {
    try {
      const user = await storage.getUserByFirebaseUid(req.firebaseUid!);
      
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      // Ensure user has quests
      await assignDailyQuests(user.id);
      await assignWeeklyQuest(user.id);
      
      const quests = await storage.getUserQuests(user.id);
      res.json(quests);
    } catch (error) {
      console.error("Get quests error:", error);
      res.status(500).json({ error: "Failed to get quests" });
    }
  });
  
  // Complete a quest
  app.post("/api/quests/:questId/complete", requireAuth, async (req, res) => {
    try {
      const { questId } = req.params;
      const user = await storage.getUserByFirebaseUid(req.firebaseUid!);
      
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      const quest = await storage.getQuest(questId);
      
      if (!quest) {
        return res.status(404).json({ error: "Quest not found" });
      }
      
      if (quest.userId !== user.id) {
        return res.status(403).json({ error: "Unauthorized" });
      }
      
      if (quest.completed) {
        return res.status(400).json({ error: "Quest already completed" });
      }
      
      // Mark quest as completed
      await storage.updateQuest(questId, {
        completed: true,
        completedAt: new Date(),
      });
      
      // Update user stats and XP
      const newXP = user.xp + quest.rewardXP;
      const newTier = calculateTier(newXP);
      const newLevel = calculateLevel(newXP);
      
      const statUpdates: Record<string, number> = {};
      
      if (quest.rewardStats) {
        for (const [stat, delta] of Object.entries(quest.rewardStats)) {
          if (STAT_NAMES.includes(stat as any)) {
            const currentValue = user[stat as keyof typeof user] as number;
            statUpdates[stat] = Math.min(100, currentValue + delta);
          }
        }
      }
      
      // Update streak (simplified - just increment for now)
      const newStreak = user.streak + 1;
      
      const updatedUser = await storage.updateUser(user.id, {
        xp: newXP,
        tier: newTier,
        level: newLevel,
        streak: newStreak,
        lastActive: new Date(),
        ...statUpdates,
      });
      
      // Log activity
      await storage.createActivity({
        userId: user.id,
        action: "completeQuest",
        questId: quest.id,
        xpDelta: quest.rewardXP,
        statDeltas: quest.rewardStats || {},
      });

      // Check if user crossed a tier threshold - trigger rank trial
      const oldTier = calculateTier(user.xp);
      if (oldTier !== newTier && newTier !== "D") {
        // Create rank trial challenge
        const trialTemplate = getRankTrialQuest();
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + 7); // Due in 7 days
        
        const trialQuest = await storage.createQuest({
          userId: user.id,
          title: trialTemplate.title,
          description: trialTemplate.description,
          type: "weekly",
          rewardXP: trialTemplate.rewardXP,
          rewardStats: trialTemplate.rewardStats,
          dueAt: dueDate,
        });

        // Create rank trial record
        await storage.createRankTrial({
          userId: user.id,
          tier: newTier,
          questId: trialQuest.id,
        });
      }
      
      res.json({ quest, user: updatedUser });
    } catch (error) {
      console.error("Complete quest error:", error);
      res.status(500).json({ error: "Failed to complete quest" });
    }
  });
  
  // Leaderboard
  app.get("/api/leaderboard", async (req, res) => {
    try {
      const allUsers = await storage.getAllUsers();
      
      // Sort by XP descending
      const leaderboard = allUsers
        .sort((a, b) => b.xp - a.xp)
        .slice(0, 100); // Top 100
      
      res.json(leaderboard);
    } catch (error) {
      console.error("Leaderboard error:", error);
      res.status(500).json({ error: "Failed to get leaderboard" });
    }
  });
  
  // Activity History
  app.get("/api/activities", requireAuth, async (req, res) => {
    try {
      const user = await storage.getUserByFirebaseUid(req.firebaseUid!);
      
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      const activities = await storage.getUserActivities(user.id);
      res.json(activities);
    } catch (error) {
      console.error("Get activities error:", error);
      res.status(500).json({ error: "Failed to get activities" });
    }
  });
  
  const httpServer = createServer(app);
  
  return httpServer;
}
