import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
// import { DrizzleStorage } from "./drizzle-storage";
import { getStorage } from "./storage";
const storage = getStorage();
import { TIER_THRESHOLDS, Tier, STAT_NAMES } from "@shared/schema";

// Enable CORS for all routes (allow admin frontend to make DELETE with custom header)
const corsOptions = { origin: true, credentials: true };

import { getRandomDailyQuests, getRandomWeeklyQuest, getRankTrialQuest } from "./quest-templates";
import { mockContent } from "./data/mock-content";
import guildRouter from "./routes/guilds";
import guildEnhancementsRouter from "./routes/guild-enhancements";
import { registerLocalAuthRoutes } from "./routes/local-auth";
import { initCronJobs } from "./services/cron";
import { WebSocket, WebSocketServer } from "ws";

// DEBUG: Endpoint to list users
import { getStorage } from "./storage";
const storage = getStorage();

export async function registerRoutes(app: Express): Promise<Server> {
  // Initialize Cron Jobs
  initCronJobs(storage);

  app.get("/api/debug/users", async (req, res) => {
    const users = await storage.getAllUsers();
    res.json(users.map(u => ({ id: u.id, name: u.name, firebaseUid: u.firebaseUid })));
  });
  insertGuildSchema,
    insertGuildMessageSchema,
    insertGuildQuestSchema,
} from "@shared/schema";

// Middleware to check Firebase auth (simplified for MVP)
// In production, you'd verify Firebase tokens here
async function requireAuth(req: Request, res: Response, next: Function) {
  const firebaseUid = req.headers["x-firebase-uid"] as string;

  if (!firebaseUid) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  let user = await storage.getUserByFirebaseUid(firebaseUid);

  // Check if user was explicitly deleted
  if (await storage.isUserDeleted(firebaseUid)) {
    return res.status(403).json({ error: "Account has been deleted" });
  }

  // Handle guest users OR users lost due to server restart (MemStorage)
  if (!user) {
    const isGuest = firebaseUid.startsWith("guest_");
    const isLocal = firebaseUid.startsWith("local_");

    if (isGuest || isLocal) {
      user = await storage.createUser({
        firebaseUid,
        name: isGuest ? "Guest Ascendant" : "Ascendant",
        email: isGuest ? `${firebaseUid}@guest.com` : "user@ascension.com",
        avatarUrl: null,
        timezone: "UTC",
        onboardingCompleted: !isGuest, // Assume real users have onboarded
      });

      // Give them coins to test shop if they were lost
      if (!isGuest) {
        await storage.updateUser(user.id, { coins: 1000 });
      }
    }
  }

  if (!user) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  console.log(`Auth check for ${req.path}`);
  req.firebaseUid = firebaseUid;
  (req as any).user = user;
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
  const todayQuests = existingQuests.filter((q: any) => {
    const questDate = new Date(q.createdAt);
    return questDate >= today && questDate < tomorrow && q.type === "daily";
  });

  if (todayQuests.length > 0) {
    return; // Already has quests for today
  }

  // Get user data for personalized quest generation
  const user = await storage.getUser(userId);
  if (!user) return;

  // Generate personalized quests based on user's goal
  const { generateDailyQuests } = await import("./services/quest-generator");
  const personalizedQuests = generateDailyQuests(user);

  // Create the quests in storage
  for (const questData of personalizedQuests) {
    await storage.createQuest(questData);
  }
}

// Helper to assign weekly quests
async function assignWeeklyQuest(userId: string) {
  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - now.getDay()); // Start of week (Sunday)
  weekStart.setHours(0, 0, 0, 0);

  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 7);

  // Check if user already has this week's quests
  const existingQuests = await storage.getUserQuests(userId);
  const weeklyQuests = existingQuests.filter((q: any) => {
    const questDate = new Date(q.createdAt);
    return questDate >= weekStart && questDate < weekEnd && q.type === "weekly";
  });

  if (weeklyQuests.length > 0) {
    return; // Already has weekly quests
  }

  // Get user data
  const user = await storage.getUser(userId);
  if (!user) return;

  // Generate personalized weekly quests
  const { generateWeeklyQuests } = await import("./services/quest-generator");
  const newWeeklyQuests = generateWeeklyQuests(user);

  // Create the quests in storage
  for (const questData of newWeeklyQuests) {
    await storage.createQuest(questData);
  }
}

declare global {
  namespace Express {
    interface Request {
      firebaseUid?: string;
    }
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Initialize Cron Jobs
  initCronJobs(storage);

  // DEBUG: Endpoint to list users
  app.get("/api/debug/users", async (req, res) => {
    const users = await storage.getAllUsers();
    res.json(users.map(u => ({ id: u.id, name: u.name, firebaseUid: u.firebaseUid })));
  });

  // Store Routes
  app.get("/api/store/items", async (req, res) => {
    const items = await storage.getShopItems();
    res.json(items);
  });

  app.get("/api/store/inventory", requireAuth, async (req, res) => {
    const items = await storage.getUserItems((req as any).user!.id);
    res.json(items);
  });

  app.post("/api/store/purchase", requireAuth, async (req, res) => {
    const { itemId } = req.body;
    if (!itemId) return res.status(400).json({ message: "Item ID is required" });

    try {
      const item = await storage.purchaseItem((req as any).user!.id, itemId);
      res.json(item);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.post("/api/store/equip", requireAuth, async (req, res) => {
    const { itemId, type } = req.body;
    if (!itemId || !type) return res.status(400).json({ message: "Item ID and type are required" });

    try {
      const user = await storage.equipItem((req as any).user!.id, itemId, type);
      res.json(user);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });


  // --- Partner Matching ---

  // Get current partnerships
  app.get("/api/partners", requireAuth, async (req, res) => {
    console.log("Handling /api/partners request");
    const subject = req.query.subject as string;
    try {
      const partnerships = await storage.getPartnerships((req as any).user!.id);

      // Enrich with user data
      const enriched = await Promise.all(partnerships.map(async (p) => {
        const otherUserId = p.user1Id === (req as any).user!.id ? p.user2Id : p.user1Id;
        const otherUser = await storage.getUser(otherUserId);
        return {
          ...p,
          otherUser: otherUser ? {
            id: otherUser.id,
            name: otherUser.name,
            avatarUrl: otherUser.avatarUrl,
            level: otherUser.level,
            studySubject: otherUser.studySubject,
            studyAvailability: otherUser.studyAvailability,
          } : null
        };
      }));

      res.json(enriched);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch partnerships" });
    }
  });

  // Find potential partners
  app.get("/api/partners/match", requireAuth, async (req, res) => {
    console.log("Handling /api/partners/match request");
    try {
      const { subject, availability } = req.query;
      const potentialPartners = await storage.findPotentialPartners(
        (req as any).user!.id,
        subject as string,
        availability as string
      );

      // Return public profile info
      const publicProfiles = potentialPartners.map(u => ({
        id: u.id,
        name: u.name,
        avatarUrl: u.avatarUrl,
        level: u.level,
        studySubject: u.studySubject,
        studyAvailability: u.studyAvailability,
        lastActive: u.lastActive,
      }));

      res.json(publicProfiles);
    } catch (error) {
      res.status(500).json({ error: "Failed to find partners" });
    }
  });

  // Send request
  app.post("/api/partners/request", requireAuth, async (req, res) => {
    try {
      const { targetUserId } = req.body;
      if (!targetUserId) return res.status(400).json({ error: "Target user ID required" });

      // Check if already exists
      const existing = await storage.getPartnerships((req as any).user!.id);
      const hasExisting = existing.find(p =>
        (p.user1Id === (req as any).user!.id && p.user2Id === targetUserId) ||
        (p.user2Id === (req as any).user!.id && p.user1Id === targetUserId)
      );

      if (hasExisting) return res.status(400).json({ error: "Partnership already exists" });

      const partnership = await storage.createPartnership((req as any).user!.id, targetUserId);

      // Create notification for the target user (don't fail the request if this fails)
      try {
        const requester = (req as any).user!;
        await storage.createNotification({
          userId: targetUserId,
          type: "partner_request",
          title: "New Partner Request",
          message: `${requester.name} wants to connect with you as a study partner!`,
        });
      } catch (notifError) {
        console.error("Failed to create notification:", notifError);
      }

      res.json(partnership);
    } catch (error) {
      console.error("Partner request error:", error);
      res.status(500).json({ error: "Failed to send request" });
    }
  });

  // Respond to request
  app.post("/api/partners/respond", requireAuth, async (req, res) => {
    try {
      const { partnershipId, status } = req.body;
      if (!partnershipId || !['accepted', 'rejected'].includes(status)) {
        return res.status(400).json({ error: "Invalid request" });
      }

      const partnership = (await storage.getPartnerships((req as any).user!.id))
        .find(p => p.id === partnershipId);

      if (!partnership) return res.status(404).json({ error: "Partnership not found" });

      // Only recipient can accept/reject
      if (partnership.user2Id !== (req as any).user!.id) {
        return res.status(403).json({ error: "Unauthorized" });
      }

      const updated = await storage.updatePartnershipStatus(partnershipId, status);
      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: "Failed to update partnership" });
    }
  });

  // Direct Messages
  app.get("/api/partners/:partnerId/messages", requireAuth, async (req, res) => {
    try {
      const { partnerId } = req.params;
      const messages = await storage.getDirectMessages((req as any).user!.id, partnerId);
      res.json(messages);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch messages" });
    }
  });

  app.post("/api/partners/:partnerId/messages", requireAuth, async (req, res) => {
    try {
      const { partnerId } = req.params;
      const { content } = req.body;
      const message = await storage.createDirectMessage({
        senderId: (req as any).user!.id,
        receiverId: partnerId,
        content,
      });
      res.json(message);
    } catch (error) {
      res.status(500).json({ error: "Failed to send message" });
    }
  });

  const httpServer = createServer(app);

  // Health check
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  // --- Global Chat (WebSocket & API) ---

  // Get chat history
  app.get("/api/messages", async (req, res) => {
    try {
      const messages = await storage.getMessages(50);
      res.json(messages);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch messages" });
    }
  });

  // WebSocket Server
  const wss = new WebSocketServer({ server: httpServer, path: "/ws/chat" });

  wss.on("connection", (ws) => {
    console.log("New WebSocket connection");

    ws.on("message", async (data) => {
      try {
        const messageData = JSON.parse(data.toString());

        // Validate message format
        const parseResult = insertMessageSchema.safeParse(messageData);
        if (!parseResult.success) {
          console.error("Invalid message format:", parseResult.error);
          return;
        }

        // Save to storage
        const savedMessage = await storage.createMessage(parseResult.data);

        // Get user details to send back
        const user = await storage.getUser(savedMessage.userId);
        const fullMessage = { ...savedMessage, user };

        // Broadcast to all clients
        const broadcastData = JSON.stringify({ type: "new_message", message: fullMessage });
        wss.clients.forEach((client) => {
          if (client.readyState === WebSocket.OPEN) {
            client.send(broadcastData);
          }
        });
      } catch (error) {
        console.error("WebSocket message error:", error);
      }
    });

    ws.on("error", (error) => {
      console.error("WebSocket error:", error);
    });
  });

  // Authentication & User Management

  // Local username/password authentication
  registerLocalAuthRoutes(app);

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

  // Get public user profile
  app.get("/api/users/:id/public", requireAuth, async (req, res) => {
    try {
      const user = await storage.getUser(req.params.id);
      if (!user) return res.status(404).json({ message: "User not found" });

      // Return only public data
      const publicData = {
        id: user.id,
        name: user.name,
        level: user.level,
        tier: user.tier,
        xp: user.xp,
        bio: (user as any).bio,
        avatarUrl: user.avatarUrl,
        streak: user.streak,
        stats: {
          strength: user.strength,
          agility: user.agility,
          stamina: user.stamina,
          vitality: user.vitality,
          intelligence: user.intelligence,
          willpower: user.willpower,
          charisma: user.charisma,
        },
        joinedAt: user.createdAt,
      };

      res.json(publicData);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch profile" });
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

  // Update user profile
  app.patch("/api/user", requireAuth, async (req, res) => {
    try {
      console.log("🔧 PATCH /api/user received, body:", req.body);
      const user = await storage.getUserByFirebaseUid(req.firebaseUid!);

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // Extract allowed fields from request body
      const { name, email, avatarUrl, bio, currentGoal } = req.body;
      console.log("📝 Extracted currentGoal:", currentGoal);

      // Update user with new data
      const updatedUser = await storage.updateUser(user.id, {
        ...(name && { name }),
        ...(email && { email }),
        ...(avatarUrl !== undefined && { avatarUrl }),
        ...(currentGoal !== undefined && { currentGoal }),
        ...(req.body.studySubject !== undefined && { studySubject: req.body.studySubject }),
        ...(req.body.studyAvailability !== undefined && { studyAvailability: req.body.studyAvailability }),
        // Note: bio field doesn't exist in schema yet, but we're ready for it
      });

      console.log("✅ User updated, currentGoal is now:", updatedUser.currentGoal);
      res.json(updatedUser);
    } catch (error) {
      console.error("Update user error:", error);
      res.status(500).json({ error: "Failed to update user" });
    }
  });

  // Rivalry Routes
  app.post("/api/rivalry/challenge", requireAuth, async (req, res) => {
    try {
      const { defenderId, durationHours = 24 } = req.body;
      if (!defenderId) return res.status(400).json({ error: "Defender ID required" });

      const endDate = new Date();
      endDate.setHours(endDate.getHours() + durationHours);

      const rivalry = await storage.createRivalry({
        challengerId: (req as any).user!.id,
        defenderId,
        startDate: new Date(),
        endDate,
        // status, challengerScore, defenderScore are set by storage defaults
        reward: 500, // Default reward
      });

      res.status(201).json(rivalry);
    } catch (error) {
      console.error("Failed to create rivalry:", error);
      res.status(500).json({ error: "Failed to create rivalry" });
    }
  });

  app.get("/api/rivalry", requireAuth, async (req, res) => {
    try {
      const rivalries = await storage.getRivalries((req as any).user!.id);

      // Enhance with user details
      const enhancedRivalries = await Promise.all(rivalries.map(async (r) => {
        const opponentId = r.challengerId === (req as any).user!.id ? r.defenderId : r.challengerId;
        const opponent = await storage.getUser(opponentId);
        return { ...r, opponent };
      }));

      res.json(enhancedRivalries);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch rivalries" });
    }
  });

  app.post("/api/rivalry/respond", requireAuth, async (req, res) => {
    try {
      const { rivalryId, status } = req.body; // 'active' (accepted) or 'rejected'

      if (status === 'rejected') {
        // Ideally delete or mark as rejected
        await storage.updateRivalry(rivalryId, { status: 'rejected' });
        return res.json({ success: true });
      }

      const rivalry = await storage.updateRivalry(rivalryId, { status: 'active' });
      res.json(rivalry);
    } catch (error) {
      res.status(500).json({ error: "Failed to respond to rivalry" });
    }
  });

  const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin123";

  // --- Admin Auth Verification ---
  app.post("/api/admin/login", (req, res) => {
    const { password } = req.body;
    if (password === ADMIN_PASSWORD) {
      res.json({ success: true });
    } else {
      res.status(401).json({ error: "Invalid password" });
    }
  });

  // Get all users (admin only)
  app.get("/api/admin/users", async (req, res) => {
    try {
      const adminPassword = req.headers["x-admin-password"] as string;
      if (adminPassword !== ADMIN_PASSWORD) {
        return res.status(403).json({ error: "Unauthorized" });
      }

      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      console.error("Get all users error:", error);
      res.status(500).json({ error: "Failed to get users" });
    }
  });

  // Get all users credentials (admin only)
  app.get("/api/admin/users-credentials", async (req, res) => {
    try {
      const adminPassword = req.headers["x-admin-password"] as string;
      if (adminPassword !== ADMIN_PASSWORD) {
        return res.status(403).json({ error: "Unauthorized" });
      }

      const credentials = await storage.getAllCredentials();
      res.json(credentials);
    } catch (error) {
      console.error("Get all credentials error:", error);
      res.status(500).json({ error: "Failed to get credentials" });
    }
  });

  // Get all guild messages (admin only)
  app.get("/api/admin/guild-messages", async (req, res) => {
    try {
      const adminPassword = req.headers["x-admin-password"] as string;
      if (adminPassword !== ADMIN_PASSWORD) {
        return res.status(403).json({ error: "Unauthorized" });
      }

      const messages = await storage.getAllGuildMessages();
      res.json(messages);
    } catch (error) {
      console.error("Get all guild messages error:", error);
      res.status(500).json({ error: "Failed to get guild messages" });
    }
  });

  // Delete user (admin only)
  app.delete("/api/admin/users/:userId", async (req, res) => {
    try {
      const { userId } = req.params;

      const adminPassword = req.headers["x-admin-password"] as string;
      if (adminPassword !== ADMIN_PASSWORD) {
        return res.status(403).json({ error: "Unauthorized" });
      }

      await storage.deleteUser(userId);
      res.json({ success: true, message: "User deleted successfully" });
    } catch (error) {
      console.error("Delete user error:", error);
      res.status(500).json({ error: "Failed to delete user" });
    }
  });

  // Create guild quest (admin only)
  app.post("/api/admin/guilds/:guildId/quests", async (req, res) => {
    try {
      const { guildId } = req.params;
      const adminPassword = req.headers["x-admin-password"] as string;
      if (adminPassword !== ADMIN_PASSWORD) {
        return res.status(403).json({ error: "Unauthorized" });
      }

      const questData = insertGuildQuestSchema.parse({
        ...req.body,
        guildId,
      });

      const quest = await storage.createGuildQuest(questData);
      res.json(quest);
    } catch (error) {
      console.error("Create admin guild quest error:", error);
      res.status(500).json({ error: "Failed to create guild quest" });
    }
  });

  // --- Admin Guilds ---
  app.get("/api/admin/guilds", async (req, res) => {
    try {
      const adminPassword = req.headers["x-admin-password"] as string;
      if (adminPassword !== ADMIN_PASSWORD) return res.status(403).json({ error: "Unauthorized" });

      const guilds = await storage.getAllGuilds();
      res.json(guilds);
    } catch (error) {
      res.status(500).json({ error: "Failed to get guilds" });
    }
  });

  app.delete("/api/admin/guilds/:id", async (req, res) => {
    try {
      const adminPassword = req.headers["x-admin-password"] as string;
      if (adminPassword !== ADMIN_PASSWORD) return res.status(403).json({ error: "Unauthorized" });

      await storage.deleteGuild(req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete guild" });
    }
  });

  // --- Admin Shop Items ---
  app.get("/api/admin/items", async (req, res) => {
    try {
      const adminPassword = req.headers["x-admin-password"] as string;
      if (adminPassword !== ADMIN_PASSWORD) return res.status(403).json({ error: "Unauthorized" });

      const items = await storage.getShopItems();
      res.json(items);
    } catch (error) {
      res.status(500).json({ error: "Failed to get items" });
    }
  });

  app.post("/api/admin/items", async (req, res) => {
    try {
      const adminPassword = req.headers["x-admin-password"] as string;
      if (adminPassword !== ADMIN_PASSWORD) return res.status(403).json({ error: "Unauthorized" });

      const newItem = await storage.createShopItem(req.body);
      res.json(newItem);
    } catch (error) {
      res.status(500).json({ error: "Failed to create item" });
    }
  });

  app.delete("/api/admin/items/:id", async (req, res) => {
    try {
      const adminPassword = req.headers["x-admin-password"] as string;
      if (adminPassword !== ADMIN_PASSWORD) return res.status(403).json({ error: "Unauthorized" });

      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete item" });
    }
  });

  // --- Admin System Actions ---
  app.post("/api/admin/broadcast/coins", async (req, res) => {
    try {
      const adminPassword = req.headers["x-admin-password"] as string;
      if (adminPassword !== ADMIN_PASSWORD) return res.status(403).json({ error: "Unauthorized" });

      const { amount } = req.body;
      if (!amount || typeof amount !== 'number') return res.status(400).json({ error: "Invalid amount" });

      const users = await storage.getAllUsers();
      for (const user of users) {
        await storage.updateUser(user.id, { coins: user.coins + amount });
      }

      res.json({ success: true, count: users.length });
    } catch (error) {
      res.status(500).json({ error: "Failed to broadcast coins" });
    }
  });

  // Broadcast announcement to all users
  app.post("/api/admin/announcement", async (req, res) => {
    try {
      const adminPassword = req.headers["x-admin-password"] as string;
      if (adminPassword !== ADMIN_PASSWORD) return res.status(403).json({ error: "Unauthorized" });

      const { title, message, type } = req.body;
      if (!title || !message) return res.status(400).json({ error: "Title and message required" });

      const users = await storage.getAllUsers();
      const notificationType = type || "announcement";

      // Create notification for each user
      for (const user of users) {
        await storage.createNotification({
          userId: user.id,
          type: notificationType,
          title,
          message,
        });
      }

      res.json({ success: true, count: users.length });
    } catch (error) {
      console.error("Announcement error:", error);
      res.status(500).json({ error: "Failed to send announcement" });
    }
  });

  // --- Admin Data Management ---
  app.post("/api/admin/backup/create", async (req, res) => {
    try {
      const adminPassword = req.headers["x-admin-password"] as string;
      if (adminPassword !== ADMIN_PASSWORD) return res.status(403).json({ error: "Unauthorized" });

      const filename = await storage.createBackup();
      res.json({ success: true, message: "Backup created successfully", filename });
    } catch (error) {
      res.status(500).json({ error: "Failed to create backup" });
    }
  });

  app.get("/api/admin/backup/download", async (req, res) => {
    try {
      const adminPassword = req.query.password as string;
      if (adminPassword !== ADMIN_PASSWORD) return res.status(403).json({ error: "Unauthorized" });

      const path = await import("path");
      const backupPath = path.resolve(process.cwd(), ".backup", "backup.json");
      res.download(backupPath, "ascension-backup.json");
    } catch (error) {
      res.status(500).json({ error: "Failed to download backup" });
    }
  });

  app.post("/api/admin/backup/restore", async (req, res) => {
    try {
      const adminPassword = req.headers["x-admin-password"] as string;
      if (adminPassword !== ADMIN_PASSWORD) return res.status(403).json({ error: "Unauthorized" });

      const data = req.body;
      // Basic validation
      if (!data || !data.users) {
        return res.status(400).json({ error: "Invalid backup data" });
      }

      const fs = await import("fs/promises");
      const path = await import("path");
      const backupDir = path.resolve(process.cwd(), ".backup");
      await fs.mkdir(backupDir, { recursive: true });
      await fs.writeFile(
        path.join(backupDir, "backup.json"),
        JSON.stringify(data, null, 2)
      );

      await storage.hydrate();

      // Broadcast system announcement
      const broadcastData = JSON.stringify({
        type: "system_announcement",
        message: "All data has been successfully restored from backup."
      });

      wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(broadcastData);
        }
      });

      res.json({ success: true, message: "Data restored successfully" });
    } catch (error) {
      console.error("Restore error:", error);
      res.status(500).json({ error: "Failed to restore data" });
    }
  });

  // Get all study logs (admin only)
  app.get("/api/admin/study-logs", async (req, res) => {
    try {
      const adminPassword = req.headers["x-admin-password"] as string;
      if (adminPassword !== ADMIN_PASSWORD) return res.status(403).json({ error: "Unauthorized" });

      const logs = await storage.getAllFocusSessions();
      res.json(logs);
    } catch (error) {
      console.error("Get admin study logs error:", error);
      res.status(500).json({ error: "Failed to get study logs" });
    }
  });

  // Get all partnerships (admin only)
  app.get("/api/admin/partners", async (req, res) => {
    try {
      const adminPassword = req.headers["x-admin-password"] as string;
      if (adminPassword !== ADMIN_PASSWORD) return res.status(403).json({ error: "Unauthorized" });

      const partners = await storage.getAllPartnerships();
      res.json(partners);
    } catch (error) {
      console.error("Get admin partners error:", error);
      res.status(500).json({ error: "Failed to get partnerships" });
    }
  });

  // --- Admin User Editing ---
  app.patch("/api/admin/users/:userId", async (req, res) => {
    try {
      const adminPassword = req.headers["x-admin-password"] as string;
      if (adminPassword !== ADMIN_PASSWORD) return res.status(403).json({ error: "Unauthorized" });

      const { userId } = req.params;
      const updates = req.body;

      // Validate and sanitize updates
      const allowedFields = [
        'name', 'email', 'level', 'xp', 'tier', 'coins', 'streak',
        'strength', 'agility', 'stamina', 'vitality', 'intelligence', 'willpower', 'charisma'
      ];

      const sanitizedUpdates: any = {};
      for (const [key, value] of Object.entries(updates)) {
        if (allowedFields.includes(key)) {
          sanitizedUpdates[key] = value;
        }
      }

      console.log("Updating user:", userId, "with updates:", sanitizedUpdates);
      const updatedUser = await storage.updateUser(userId, sanitizedUpdates);
      console.log("User updated successfully:", updatedUser);
      res.json(updatedUser);
    } catch (error) {
      console.error("Update user error:", error);
      res.status(500).json({ error: "Failed to update user" });
    }
  });

  // --- Admin Quest Management ---

  // Get all quests (admin only)
  app.get("/api/admin/quests", async (req, res) => {
    try {
      const adminPassword = req.headers["x-admin-password"] as string;
      if (adminPassword !== ADMIN_PASSWORD) return res.status(403).json({ error: "Unauthorized" });

      const users = await storage.getAllUsers();
      const allQuests = [];

      for (const user of users) {
        const userQuests = await storage.getUserQuests(user.id);
        allQuests.push(...userQuests.map(q => ({ ...q, userName: user.name })));
      }

      console.log("Fetching all quests. Total users:", users.length, "Total quests:", allQuests.length);
      res.json(allQuests);
    } catch (error) {
      console.error("Get all quests error:", error);
      res.status(500).json({ error: "Failed to get quests" });
    }
  });

  // Create custom quest for user (admin only)
  app.post("/api/admin/quests", async (req, res) => {
    try {
      const adminPassword = req.headers["x-admin-password"] as string;
      if (adminPassword !== ADMIN_PASSWORD) return res.status(403).json({ error: "Unauthorized" });

      const { userId, title, description, type, rewardXP, rewardCoins, rewardStats, dueAt } = req.body;

      if (!userId || !title || !description) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      const quest = await storage.createQuest({
        userId,
        title,
        description,
        type: type || "custom",
        rewardXP: rewardXP || 50,
        rewardCoins: rewardCoins || 0,
        rewardStats: rewardStats || {},
        dueAt: dueAt ? new Date(dueAt) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      });

      console.log("Quest created successfully:", quest);
      res.json(quest);
    } catch (error) {
      console.error("Create quest error:", error);
      res.status(500).json({ error: "Failed to create quest" });
    }
  });

  // Delete quest (admin only)
  app.delete("/api/admin/quests/:questId", async (req, res) => {
    try {
      const adminPassword = req.headers["x-admin-password"] as string;
      if (adminPassword !== ADMIN_PASSWORD) return res.status(403).json({ error: "Unauthorized" });

      const { questId } = req.params;
      await storage.deleteQuest(questId);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete quest" });
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
      const oldLevel = calculateLevel(user.xp);
      const newLevel = calculateLevel(newXP);

      // Calculate Coin Rewards
      let coinsAwarded = quest.rewardCoins || 0;
      if (newLevel > oldLevel) {
        const levelDiff = newLevel - oldLevel;
        coinsAwarded += levelDiff * 100; // 100 coins per level up
      }

      const statUpdates: Record<string, number> = {};

      if (quest.rewardStats) {
        for (const [stat, delta] of Object.entries(quest.rewardStats)) {
          if (STAT_NAMES.includes(stat as any)) {
            const currentValue = user[stat as keyof typeof user] as number;
            const deltaNum = typeof delta === "number" ? delta : 0;
            statUpdates[stat] = Math.min(100, currentValue + deltaNum);
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
        coins: user.coins + coinsAwarded,
        lastActive: new Date(),
        ...statUpdates,
      });

      // Log activity
      await storage.createActivity({
        userId: user.id,
        action: "completeQuest",
        questId: quest.id,
        xpDelta: quest.rewardXP,
        coinsDelta: coinsAwarded,
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

  // Onboarding endpoint
  app.post("/api/onboarding", requireAuth, async (req, res) => {
    const user = await storage.getUserByFirebaseUid(req.firebaseUid!);
    if (!user) return res.status(404).json({ error: "User not found" });

    const {
      age,
      weight,
      height,
      pushups,
      pullups,
      intelligence,
      willpower,
      charisma,
      vitality
    } = req.body;

    // Calculate physical stats based on performance
    // Base is 10
    let strength = 10;
    let agility = 10;
    let stamina = 10;
    let calculatedVitality = 10;

    // Strength calculation (Pushups & Pullups)
    if (pushups > 50) strength += 30;
    else if (pushups > 30) strength += 20;
    else if (pushups > 10) strength += 10;

    if (pullups > 10) strength += 10; // Bonus for pullups

    // Agility calculation (Pullups influence agility too)
    if (pullups > 15) agility += 30;
    else if (pullups > 8) agility += 20;
    else if (pullups > 2) agility += 10;

    // Stamina calculation (Pushups influence stamina)
    if (pushups > 60) stamina += 30;
    else if (pushups > 40) stamina += 20;
    else if (pushups > 20) stamina += 10;

    // Vitality calculation (BMI check - very rough approximation for game purposes)
    // BMI = weight(kg) / height(m)^2
    if (weight && height) {
      const heightInM = height / 100;
      const bmi = weight / (heightInM * heightInM);
      // "Healthy" BMI range 18.5 - 25 gets a bonus
      if (bmi >= 18.5 && bmi <= 25) calculatedVitality += 20;
      else if (bmi > 25 && bmi < 30) calculatedVitality += 10; // Overweight but maybe muscular
    }

    // Add self-assessed vitality
    calculatedVitality += (vitality || 5);

    // Cap stats at 100
    const cap = (val: number) => Math.min(100, Math.max(1, val));

    const updatedUser = await storage.updateUser(user.id, {
      strength: cap(strength),
      agility: cap(agility),
      stamina: cap(stamina),
      vitality: cap(calculatedVitality),
      intelligence: cap((intelligence || 5) * 4), // Scale 1-10 to ~40 max initial
      willpower: cap((willpower || 5) * 4),
      charisma: cap((charisma || 5) * 4),
      onboardingCompleted: true,
      currentGoal: req.body.currentGoal,
    });

    res.json(updatedUser);
  });

  // Content Library Routes
  app.get("/api/content", async (req, res) => {
    try {
      const { category, type } = req.query;

      let filtered = mockContent;

      if (category && typeof category === 'string' && category !== 'all') {
        filtered = filtered.filter(c => c.category === category);
      }

      if (type && typeof type === 'string' && type !== 'all') {
        filtered = filtered.filter(c => c.type === type);
      }

      res.json(filtered);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch content" });
    }
  });

  app.get("/api/content/:id", async (req, res) => {
    try {
      const item = mockContent.find(c => c.id === req.params.id);
      if (!item) {
        return res.status(404).json({ error: "Content not found" });
      }
      res.json(item);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch content" });
    }
  });

  // Focus Sanctum Routes
  app.post("/api/focus/complete", requireAuth, async (req, res) => {
    try {
      const user = await storage.getUserByFirebaseUid(req.firebaseUid!);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      const { duration, task, backgroundType } = req.body;

      if (!duration || typeof duration !== 'number') {
        return res.status(400).json({ error: "Invalid duration" });
      }

      // Calculate XP: 1 XP per minute
      const xpEarned = duration;

      // Create focus session
      const session = await storage.createFocusSession({
        userId: user.id,
        duration,
        xpEarned,
        task: task || null,
        backgroundType: backgroundType || null,
      });

      // Award XP to user
      const newXP = user.xp + xpEarned;
      const newLevel = calculateLevel(newXP);
      const newTier = calculateTier(newXP);

      const updatedUser = await storage.updateUser(user.id, {
        xp: newXP,
        level: newLevel,
        tier: newTier,
        lastActive: new Date(),
      });

      // Log activity
      await storage.createActivity({
        userId: user.id,
        action: "focusSession",
        xpDelta: xpEarned,
        coinsDelta: 0,
        statDeltas: {},
      });

      res.json({ session, user: updatedUser });
    } catch (error) {
      console.error("Complete focus session error:", error);
      res.status(500).json({ error: "Failed to complete focus session" });
    }
  });

  app.get("/api/focus/history", requireAuth, async (req, res) => {
    try {
      const user = await storage.getUserByFirebaseUid(req.firebaseUid!);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      const sessions = await storage.getUserFocusSessions(user.id);
      res.json(sessions);
    } catch (error) {
      console.error("Get focus history error:", error);
      res.status(500).json({ error: "Failed to get focus history" });
    }
  });

  app.get("/api/focus/stats", requireAuth, async (req, res) => {
    try {
      const user = await storage.getUserByFirebaseUid(req.firebaseUid!);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      const stats = await storage.getFocusSessionStats(user.id);
      res.json(stats);
    } catch (error) {
      console.error("Get focus stats error:", error);
      res.status(500).json({ error: "Failed to get focus stats" });
    }
  });

  // ===== Notification Routes =====

  // Get user notifications
  app.get("/api/notifications", requireAuth, async (req, res) => {
    try {
      const user = await storage.getUserByFirebaseUid(req.firebaseUid!);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      const notifications = await storage.getUserNotifications(user.id);
      res.json(notifications);
    } catch (error) {
      console.error("Get notifications error:", error);
      res.status(500).json({ error: "Failed to get notifications" });
    }
  });

  // Mark notification as read
  app.patch("/api/notifications/:id/read", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      await storage.markNotificationAsRead(id);
      res.json({ success: true });
    } catch (error) {
      console.error("Mark notification as read error:", error);
      res.status(500).json({ error: "Failed to mark notification as read" });
    }
  });

  // Update notification preferences
  app.patch("/api/user/notification-preferences", requireAuth, async (req, res) => {
    try {
      const user = await storage.getUserByFirebaseUid(req.firebaseUid!);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      const { notificationsEnabled, notificationTime } = req.body;

      await storage.updateUser(user.id, {
        notificationsEnabled,
        notificationTime,
      });

      res.json({ success: true });
    } catch (error) {
      console.error("Update notification preferences error:", error);
      res.status(500).json({ error: "Failed to update notification preferences" });
    }
  });

  // Admin: Send custom notification to single user
  app.post("/api/admin/notifications/send", async (req, res) => {
    try {
      const adminPassword = req.headers["x-admin-password"] as string;
      if (adminPassword !== ADMIN_PASSWORD) {
        return res.status(403).json({ error: "Unauthorized" });
      }

      const { userId, title, message, type } = req.body;

      const notification = await storage.createNotification({
        userId,
        type: type || "admin",
        title,
        message,
      });

      res.json(notification);
    } catch (error) {
      console.error("Send notification error:", error);
      res.status(500).json({ error: "Failed to send notification" });
    }
  });

  // Admin: Broadcast notification to all users
  app.post("/api/admin/notifications/broadcast", async (req, res) => {
    try {
      const adminPassword = req.headers["x-admin-password"] as string;
      if (adminPassword !== ADMIN_PASSWORD) {
        return res.status(403).json({ error: "Unauthorized" });
      }

      const { title, message, type } = req.body;
      const users = await storage.getAllUsers();

      const notifications = [];
      for (const user of users) {
        const notification = await storage.createNotification({
          userId: user.id,
          type: type || "admin",
          title,
          message,
        });
        notifications.push(notification);
      }

      res.json({
        success: true,
        count: notifications.length,
        message: `Notification sent to ${notifications.length} users`
      });
    } catch (error) {
      console.error("Broadcast notification error:", error);
      res.status(500).json({ error: "Failed to broadcast notification" });
    }
  });

  // Admin: Get notification history
  app.get("/api/admin/notifications/history", async (req, res) => {
    try {
      const adminPassword = req.headers["x-admin-password"] as string;
      if (adminPassword !== ADMIN_PASSWORD) {
        return res.status(403).json({ error: "Unauthorized" });
      }

      const history = await storage.getAdminNotificationHistory();
      res.json(history);
    } catch (error) {
      console.error("Get notification history error:", error);
      res.status(500).json({ error: "Failed to get notification history" });
    }
  });

  // Guild Routes
  app.use("/api/guilds", requireAuth, guildRouter);
  app.use("/api/guild-enhancements", requireAuth, guildEnhancementsRouter);

  return httpServer;
}
