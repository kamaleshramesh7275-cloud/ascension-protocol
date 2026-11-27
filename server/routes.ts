import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import fs from "fs";
import path from "path";
// import { DrizzleStorage } from "./drizzle-storage";
import { getStorage } from "./storage";
import {
  TIER_THRESHOLDS,
  Tier,
  STAT_NAMES,
  insertGuildSchema,
  insertGuildMessageSchema,
  insertGuildQuestSchema,
  insertMessageSchema,
  insertTaskSchema,
  insertHabitSchema,
  insertTelemetryEventSchema
} from "@shared/schema";

// Enable CORS for all routes (allow admin frontend to make DELETE with custom header)
// Enable CORS with strict origin check
const corsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    // Allowed origins (Web + Capacitor Native Mobile Apps)
    const allowedOrigins = [
      /^http:\/\/localhost:\d+$/,
      /^https:\/\/localhost(:\d+)?$/,
      "capacitor://localhost",
      "ionic://localhost",
      /^https:\/\/.*\.vercel\.app$/,
      "https://ascensions.in" // Production domain
    ];

    const isAllowed = allowedOrigins.some(pattern =>
      typeof pattern === 'string' ? pattern === origin : pattern.test(origin)
    );

    if (isAllowed) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
};

import { getRandomDailyQuests, getRandomWeeklyQuest, getRankTrialQuest, getRankTrialForTier } from "./quest-templates";
import { mockContent } from "./data/mock-content";
import {
  SHADOW_CATALOG,
  CLASS_EVOLUTIONS,
  evaluateNewlyUnlockedShadows,
  advanceGateEvent,
  generateSurpriseGate,
  computeBioFatigue,
} from "./services/system-mechanics";
import { buildDivisionSnapshot, recordDivisionXp, computeVerifiedDivisionPoints } from "./services/divisions";
import guildRouter from "./routes/guilds";
import guildEnhancementsRouter from "./routes/guild-enhancements";
import guildWarsRouter from "./routes/guild-wars";
import shopRouter from "./routes/shop";
import syncRouter from "./routes/sync";
import subscriptionRouter from "./routes/subscription";
import roadmapRouter from "./routes/roadmaps";
import endgameModesRouter from "./routes/endgame-modes";
import { createReferralRouter } from "./routes/referrals";
import citadelRouter from "./routes/citadel";
import { registerLocalAuthRoutes } from "./routes/local-auth";
import pushRouter from "./routes/push";
import workoutsRouter from "./routes/workouts";
import gangsRouter from "./routes/gangs";
import executionProtocolRouter from "./routes/execution-protocol";
import feedbackRouter from "./routes/feedback";
import adminMasterRouter from "./routes/admin-master";
import covenantsRouter from "./routes/covenants";
import achievementsRouter from "./routes/achievements";
import socialFeedRouter from "./routes/social-feed";
import tacticalCacheRouter from "./routes/tactical-cache";
import { initCronJobs } from "./services/cron";
import { WebSocket, WebSocketServer } from "ws";




import { requireAuth, enrichUserWithLevelData } from "./middleware/auth";

interface ActiveFocusSession {
  sessionId: string;
  userId: string;
  duration: number; // minutes
  task?: string | null;
  backgroundType?: string | null;
  questId?: string | null;
  roadmapTaskId?: string | null;
  startedAt: Date;
  claimed: boolean;
}

const activeFocusSessions = new Map<string, ActiveFocusSession>();
const idempotencyCache = new Map<string, { status: number; body: any }>();


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
// Helper to assign daily quests to a user
async function assignDailyQuests(userId: string, options?: { force?: boolean }) {
  const storage = getStorage(); // Lazy load
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = today.toISOString().split("T")[0];

  // OPTIMIZATION: Check last check time first
  const user = await storage.getUser(userId);
  if (!user) return;

  if (!options?.force && user.lastDailyQuestCheck && new Date(user.lastDailyQuestCheck) >= today) {
    return; // Already checked today
  }

  // Update check time immediately
  await storage.updateUser(userId, { lastDailyQuestCheck: new Date() });

  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  // Check if user already has today's quests
  const existingQuests = await storage.getUserQuests(userId);
  const todayQuests = existingQuests.filter((q: any) => {
    const questDate = new Date(q.createdAt);
    return questDate >= today && questDate < tomorrow && q.type === "daily";
  });

  // Streak preservation check for yesterday's quests
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayQuests = existingQuests.filter((q: any) => {
    const d = new Date(q.createdAt);
    return d >= yesterday && d < today && q.type === "daily";
  });

  if (yesterdayQuests.length > 0) {
    const yesterdayStr = yesterday.toISOString().split("T")[0];
    const completedYesterday = yesterdayQuests.some((q: any) => q.completed);
    const anchorCompletedYesterday =
      user.anchorDate === yesterdayStr &&
      user.anchorQuestId &&
      existingQuests.some((q: any) => q.id === user.anchorQuestId && q.completed);

    if (user.activeRecoveryDay) {
      // DATA-02: Rest Day Protocol active - streak is fully protected!
      console.log(`[Streak Shield] User ${userId} active recovery day protected streak ${user.streak}.`);
      await storage.updateUser(userId, { activeRecoveryDay: false });
    } else if (anchorCompletedYesterday) {
      console.log(`[Morning Anchor] User ${userId} protected streak via Anchor Quest.`);
    } else if (!completedYesterday && (user.streak || 0) > 0) {
      const { buildUltimatumWarningLine } = await import("./services/goal-coach");
      if ((user.streakShields || 0) > 0) {
        // MANA SHIELD CONSUMPTION: Protect streak from reset!
        const remainingShields = Math.max(0, (user.streakShields || 1) - 1);
        await storage.updateUser(userId, {
          streakShields: remainingShields,
          ultimatumState: {
            date: todayStr,
            warningLine: buildUltimatumWarningLine(user),
            shieldAbsorbed: true,
            cardShared: false,
          },
        });
        await storage.createActivity({
          userId,
          action: "system",
          xpDelta: 0,
          coinsDelta: 0,
          description: "🛡️ Mana Shield auto-activated! Your streak was protected from reset.",
        } as any);
        console.log(`[Streak Shield] User ${userId} consumed 1 Mana Shield. Remaining: ${remainingShields}`);
      } else {
        const shouldEnterPenalty = user.penaltyModeEnabled !== false && !user.inPenaltyZone;
        const previousStreak = Math.max(user.preBreakStreak || 0, user.streak || 0);
        await storage.updateUser(userId, {
          preBreakStreak: previousStreak,
          streak: 0,
          ultimatumState: {
            date: todayStr,
            warningLine: buildUltimatumWarningLine(user),
            shieldAbsorbed: false,
            cardShared: false,
          },
          ...(shouldEnterPenalty ? {
            inPenaltyZone: true,
            penaltyExpiresAt: new Date(Date.now() + 4 * 60 * 60 * 1000),
          } : {}),
        });

        if (shouldEnterPenalty) {
          const hasOpenPenalty = existingQuests.some((q: any) => q.type === "penalty" && !q.completed);
          if (!hasOpenPenalty) {
            await storage.createQuest({
              userId,
              title: "MINIMUM VIABLE COMEBACK: Restart Momentum",
              description: "Run a 10m Air-Gap starter sprint on today's anchor (or 1 short workout set) + log 1 blocker in Debrief to lift System restrictions.",
              type: "penalty",
              category: "discipline",
              difficulty: "normal",
              executionMode: "focus_verified",
              targetMinutes: 10,
              sourceType: "comeback",
              rewardXP: 30,
              rewardCoins: 10,
              rewardStats: { willpower: 2 },
              dueAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
            } as any);
          }
        }
      }
    }
  }

  if (todayQuests.length > 0 && !options?.force) {
    return; // Already has quests for today
  }

  // Gather active roadmap week, focus/workout history & fatigue telemetry for smart Quest calibration
  const missedYesterday =
    yesterdayQuests.length > 0 && !yesterdayQuests.some((q: any) => q.completed) && !user.activeRecoveryDay;
  const roadmap = await storage.getActiveRoadmap(userId);
  let activeWeek = null;
  let incompleteTasks: any[] = [];
  if (roadmap) {
    const weeks = await storage.getRoadmapWeeks(roadmap.id);
    activeWeek = weeks.find((w) => w.weekNumber === roadmap.currentWeek) || weeks[0] || null;
    if (activeWeek) {
      if (missedYesterday) {
        const { applyMissedDayBossRegen } = await import("./services/system-mechanics");
        const regen = applyMissedDayBossRegen(activeWeek as any);
        if (regen) {
          activeWeek = await storage.updateRoadmapWeek(activeWeek.id, regen as any);
        }
      }
      const weekTasks = await storage.getRoadmapTasks(activeWeek.id);
      incompleteTasks = weekTasks.filter((t) => !t.completed);
    }
  }

  const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const recentWorkouts = await storage.getUserWorkoutSessions(userId, 15);
  const workouts7d = recentWorkouts.filter((w) => new Date(w.startedAt).getTime() >= sevenDaysAgo).length;
  const recentFocus = await storage.getUserFocusSessions(userId);
  const focusMinutes7d = recentFocus
    .filter((f) => new Date(f.completedAt).getTime() >= sevenDaysAgo)
    .reduce((sum, f) => sum + (f.duration || 0), 0);
  const fatigueTelemetry = computeBioFatigue(user, recentWorkouts, recentFocus);
  const sleepNum = user.lastSleepHours ? parseFloat(String(user.lastSleepHours)) : null;

  const { generateAiDailyQuests } = await import("./services/goal-coach");
  const yesterdayStr = new Date(Date.now() - 86400000).toISOString().split("T")[0];
  const latestDebrief =
    (await storage.getEveningDebrief(userId, todayStr)) ||
    (await storage.getEveningDebrief(userId, yesterdayStr));
  const recentFocusNotes = recentFocus
    .map((f) => (f as any).outputNote)
    .filter((n): n is string => typeof n === "string" && n.trim().length > 0)
    .slice(0, 3);
  const latestDebriefText = latestDebrief
    ? [latestDebrief.reflectionText, latestDebrief.tomorrowIfThenCue]
        .filter(Boolean)
        .join(" | ")
    : null;

  const aiDailyResult = await generateAiDailyQuests({
    user,
    activeWeek,
    incompleteTasks,
    recentFocusNotes,
    latestDebriefText,
    fatigueScore: fatigueTelemetry.fatigueScore,
    sleepHours: sleepNum,
    focusMinutes7d,
    workoutsCount7d: workouts7d,
  });

  const { generateDailyQuests } = await import("./services/quest-generator");
  const userHabits = await storage.getHabits(userId);
  const personalizedQuests =
    aiDailyResult.providerUsed !== "deterministic"
      ? aiDailyResult.quests
      : generateDailyQuests(user, undefined, userHabits, {
          activeWeek,
          incompleteTasks,
          fatigueScore: fatigueTelemetry.fatigueScore,
          sleepHours: sleepNum,
          focusMinutes7d,
          workoutsCount7d: workouts7d,
        });

  const createdQuests = [];
  for (const questData of personalizedQuests) {
    createdQuests.push(await storage.createQuest(questData));
  }

  // Automatically pin the #1 Roadmap/Goal needle-mover as today's Morning Anchor if not yet chosen
  if (createdQuests.length > 0 && user.anchorDate !== todayStr) {
    const primaryAnchor = createdQuests.find((q) => q.sourceType === "roadmap") || createdQuests[0];
    await storage.updateUser(userId, {
      anchorQuestId: primaryAnchor.id,
      anchorDate: todayStr,
    });
  }
}

// Helper to assign weekly quests
async function assignWeeklyQuest(userId: string) {
  const storage = getStorage(); // Lazy load
  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - now.getDay()); // Start of week (Sunday)
  weekStart.setHours(0, 0, 0, 0);

  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 7);

  // Check if user already has this week's quests
  // For weekly, we can just rely on the existing check as it's less frequent
  const existingQuests = await storage.getUserQuests(userId);
  const weeklyQuests = existingQuests.filter((q: any) => {
    const questDate = new Date(q.createdAt);
    return questDate >= weekStart && questDate < weekEnd && q.type === "weekly";
  });

  if (weeklyQuests.length > 0) {
    return; // Already has weekly quests
  }

  // Get user data (reload to ensure fresh)
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
  const storage = getStorage(); // Lazy load storage here
  // Initialize Cron Jobs - Disable on Vercel as background tasks are handled differently
  if (!process.env.VERCEL) {
    initCronJobs(storage);
  }

  // DEBUG: Endpoint to list users
  app.get("/api/debug/users", async (req, res) => {
    // No caching for debug
    const users = await storage.getAllUsers();
    res.json(users.map(u => ({ id: u.id, name: u.name, firebaseUid: u.firebaseUid })));
  });

  // DEBUG: Ping route
  app.get("/api/ping-direct", (req, res) => res.json({ status: "ok", time: Date.now(), location: "routes.ts" }));

  // Sync Router (Radical Optimization)
  app.use("/api", syncRouter);

  // Push Notification Routes
  app.use("/api", pushRouter);
  app.use("/api", workoutsRouter);

  // Shop Routes - Using dedicated shop router with seeding functionality
  app.use("/api/shop", shopRouter);
  app.use("/api/roadmap", roadmapRouter);
  app.use("/api/referrals", createReferralRouter(storage));
  app.use("/api/citadel", citadelRouter);
  app.use("/api/gangs", gangsRouter);
  app.use("/api/covenants", covenantsRouter);
  app.use("/api/achievements", achievementsRouter);
  app.use("/api/social/feed", socialFeedRouter);
  app.use("/api/tactical-cache", tacticalCacheRouter);
  // Maintenance Mode Gate (allows /api/admin/* and health checks through)
  app.use("/api", async (req, res, next) => {
    if (req.path.startsWith("/admin") || req.path === "/ping-direct" || req.path === "/health") {
      return next();
    }
    try {
      const cfg = await storage.getSystemConfig();
      if (cfg.maintenanceMode) {
        return res.status(503).json({
          error: cfg.maintenanceMessage || "System maintenance in progress.",
          code: "MAINTENANCE_MODE",
        });
      }
    } catch (_) {}
    next();
  });

  app.use("/api", executionProtocolRouter);
  app.use("/api/feedback", feedbackRouter);
  app.use("/api/admin/master", adminMasterRouter);

  // --- Campaign Routes ---
  app.get("/api/campaigns", async (req, res) => {
    try {
      // CACHE: Campaigns change rarely, cache for 1 hour (3600s)
      res.setHeader('Cache-Control', 'public, max-age=3600');
      const campaigns = await storage.getCampaigns();
      res.json(campaigns);
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch campaigns" });
    }
  });

  app.post("/api/campaigns/:id/join", requireAuth, async (req, res) => {
    try {
      await storage.joinCampaign((req as any).user!.id, req.params.id);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: "Failed to join campaign" });
    }
  });

  app.get("/api/user/active-campaign", requireAuth, async (req, res) => {
    try {
      const campaign = await storage.getActiveCampaign((req as any).user!.id);
      // Ensure daily quests are generated when checking status
      if (campaign) {
        await storage.checkDailyQuests((req as any).user!.id);
      }
      res.json(campaign || null);
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch active campaign" });
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
        // Also send a push notification
        const { pushNotifications } = await import("./utils/push-notifications");
        await pushNotifications.partnerRequest(targetUserId, requester.name);
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

  // --- Habit Tracking ---
  app.get("/api/habits", requireAuth, async (req, res) => {
    try {
      const habits = await storage.getHabits((req as any).user!.id);
      res.json(habits);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch habits" });
    }
  });

  app.post("/api/habits", requireAuth, async (req, res) => {
    try {
      const data = insertHabitSchema.parse({
        ...req.body,
        userId: (req as any).user!.id,
      });
      const habit = await storage.createHabit(data);
      res.status(201).json(habit);
    } catch (error) {
      res.status(400).json({ error: "Invalid habit data" });
    }
  });

  app.patch("/api/habits/:id", requireAuth, async (req, res) => {
    try {
      const habit = await storage.updateHabit(req.params.id, req.body);
      res.json(habit);
    } catch (error) {
      res.status(500).json({ error: "Failed to update habit" });
    }
  });

  app.delete("/api/habits/:id", requireAuth, async (req, res) => {
    try {
      await storage.deleteHabit(req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete habit" });
    }
  });

  app.post("/api/habits/:id/complete", requireAuth, async (req, res) => {
    try {
      const habit = await storage.completeHabit(req.params.id);
      res.json(habit);
    } catch (error) {
      res.status(500).json({ error: "Failed to complete habit" });
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

  // WebSocket Server - Disable on Vercel as it is not supported in serverless functions
  let wss: WebSocketServer | null = null;
  if (!process.env.VERCEL) {
    wss = new WebSocketServer({ server: httpServer, path: "/ws/chat" });

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
          wss!.clients.forEach((client) => {
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
  }

  // Authentication & User Management

  // Native APK Download & Auto-Update Endpoints
  const apkPathCandidates = [
    path.resolve(process.cwd(), "mobile", "build", "app", "outputs", "flutter-apk", "app-release.apk"),
    path.resolve(process.cwd(), "release-artifacts", "AscensionProtocol-Flutter.apk"),
    path.resolve(process.cwd(), "android", "app", "build", "outputs", "apk", "debug", "app-debug.apk"),
  ];

  const serveApk = (_req: Request, res: Response) => {
    let targetPath: string | null = null;
    for (const candidate of apkPathCandidates) {
      if (fs.existsSync(candidate)) {
        targetPath = candidate;
        break;
      }
    }

    if (!targetPath) {
      // Direct high-speed download from GitHub Releases (Native Flutter APK)
      return res.redirect("https://github.com/kamaleshramesh7275-cloud/ascension-protocol/releases/latest/download/AscensionProtocol-Flutter.apk");
    }

    res.setHeader("Content-Type", "application/vnd.android.package-archive");
    res.setHeader("Content-Disposition", 'attachment; filename="AscensionProtocol-Flutter.apk"');
    res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
    res.sendFile(targetPath);
  };

  app.get("/api/download/apk", serveApk);
  app.get("/AscensionProtocol.apk", serveApk);
  app.get("/download/apk", serveApk);

  // App Version & Update Info (used by In-App Auto-Updater)
  app.get("/api/version", (_req: Request, res: Response) => {
    res.json({
      appName: "Ascension Protocol",
      packageName: "in.ascensions.app",
      version: "1.0.2",
      versionCode: 3,
      updatedAt: "2026-11-21T22:00:00Z",
      downloadUrl: "/api/download/apk",
      githubReleaseUrl: "https://github.com/kamaleshramesh7275-cloud/ascension-protocol/releases/latest/download/AscensionProtocol.apk",
      githubRepo: "https://github.com/kamaleshramesh7275-cloud/ascension-protocol",
      features: [
        "Native Android Google Sign-In with Credential Manager",
        "Storage Partitioning Elimination & Fast Login",
        "Continuous Auto-Updates on GitHub Push",
        "Pure Dark OLED Theme & Tactical Sound Effects"
      ]
    });
  });

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
        // 1. Validate Referral Code (if provided)
        let referrerId: string | undefined;
        if (req.body.referralCode) {
          try {
            const referrerProfile = await storage.getReferralProfileByCode(req.body.referralCode);
            if (referrerProfile) {
              referrerId = referrerProfile.userId;
              console.log(`[REGISTER-GUEST] Valid referral code: ${req.body.referralCode}`);
            }
          } catch (refError) {
            console.error("[REGISTER-GUEST] Referral validation error:", refError);
          }
        }

        // 2. Create new user
        user = await storage.createUser({
          firebaseUid,
          name,
          email,
          avatarUrl,
          timezone: "UTC",
        });

        if (!user) {
          console.error('[REGISTER-GUEST] User creation failed');
          return res.status(500).json({ error: 'User creation failed' });
        }

        // 3. Create Referral Profile for new user
        await storage.createReferralProfile({
          userId: user.id,
          referralCode: name.toUpperCase() + "_" + Math.floor(Math.random() * 1000), // Guests get a unique code
          referredById: referrerId || null,
          totalReferrals: 0,
        });

        // 4. Increment referrer's count & create event record
        // SECURITY: Block self-referrals
        if (referrerId && referrerId === user.id) {
          console.warn(`[REGISTER-GUEST] Self-referral blocked for user ${user.id}`);
          referrerId = undefined;
        }

        if (referrerId) {
          // SECURITY: Check for duplicate referral (prevent re-register abuse)
          const existingReferrals = await storage.getReferrals(referrerId);
          const userIdForCheck = user?.id;
          const alreadyReferred = userIdForCheck ? existingReferrals.some(r => r.referredUserId === userIdForCheck) : false;

          if (alreadyReferred) {
            console.warn(`[REGISTER-GUEST] Duplicate referral blocked: ${referrerId} -> ${user.id}`);
          } else {
            // Create referral as PENDING — reward only when referred user completes first quest
            await storage.createReferral({
              referrerId: referrerId,
              referredUserId: user.id,
              status: "pending"
            });

            // Notify referrer that someone joined (but coins come later)
            const referrerUser = await storage.getUser(referrerId);
            if (referrerUser) {
              await storage.createNotification({
                userId: referrerId,
                type: "achievement",
                title: "New Referral! 🔗",
                message: `${name} joined using your referral link! You'll earn +200 coins when they complete their first quest.`,
              });
              console.log(`[REGISTER-GUEST] Pending referral created: ${referrerUser.name} -> ${name}`);
            }
          }
        }

        // 5. Assign initial quests
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
      // CACHE: Public profiles are semi-static, cache for 5 minutes
      // This allows instant navigation when revisiting profiles
      res.setHeader('Cache-Control', 'public, max-age=300');

      const user = await storage.getUser(req.params.id);
      if (!user) return res.status(404).json({ message: "User not found" });

      // Return only public data - minimal payload
      const publicData = {
        id: user.id,
        name: user.name,
        level: user.level,
        tier: user.tier,
        // xp removed - not critical for public view
        bio: (user as any).bio,
        avatarUrl: user.avatarUrl,
        streak: user.streak,
        // Stats block preserved but can be removed if needed for extreme optimization
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

  // Get current user (plus check Comeback Red Gate #10 with 14d cooldown)
  app.get("/api/user", requireAuth, async (req, res) => {
    try {
      let user = await storage.getUserByFirebaseUid(req.firebaseUid!);

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // Check 3+ day inactivity Comeback Gate trigger (#10) with strict 14-day cooldown
      const now = Date.now();
      const lastActiveMs = user.lastActive ? new Date(user.lastActive).getTime() : now;
      const inactiveDays = (now - lastActiveMs) / 86400000;
      const lastComebackAt = user.comebackGate?.lastTriggeredAt
        ? new Date(user.comebackGate.lastTriggeredAt).getTime()
        : 0;
      const comebackCooldownClear = !lastComebackAt || (now - lastComebackAt) >= 14 * 86400000;
      const existingActive = user.comebackGate?.active && new Date(user.comebackGate.expiresAt).getTime() > now;

      if (!existingActive && inactiveDays >= 3 && comebackCooldownClear && (user.preBreakStreak || user.streak || 0) >= 2) {
        const prevStreak = Math.max(user.preBreakStreak || 0, user.streak || 0);
        const restoredTarget = Math.min(30, Math.max(1, Math.floor(prevStreak * 0.5)));
        const { generateComebackBrief } = await import("./services/goal-coach");
        const brief = await generateComebackBrief({
          user,
          inactiveDays: Math.floor(inactiveDays),
          previousStreak: prevStreak,
        });
        const nowIso = new Date().toISOString();
        user = await storage.updateUser(user.id, {
          preBreakStreak: prevStreak,
          comebackGate: {
            active: true,
            triggeredAt: nowIso,
            expiresAt: new Date(now + 48 * 3600000).toISOString(),
            restoredFromStreak: restoredTarget,
            focusDone: false,
            workoutDone: false,
            aiBrief: brief,
            lastTriggeredAt: nowIso,
          },
        });
      }

      // Ensure user has quests
      await assignWeeklyQuest(user.id);

      // Calculate effective subscription status (redundant check but good for explicit response)
      const { getSubscriptionStatus } = await import("./utils/subscription");
      const { isPremium, isTrial, trialEndsAt } = getSubscriptionStatus(user);

      res.json(enrichUserWithLevelData({
        ...user,
        isPremium, // Override DB value with effective value
        isTrial,
        trialEndsAt
      }));
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
        ...(req.body.hunterClass !== undefined && { hunterClass: req.body.hunterClass }),
        ...(req.body.equipmentProfile !== undefined && { equipmentProfile: req.body.equipmentProfile }),
        ...(req.body.streakShields !== undefined && { streakShields: req.body.streakShields }),
        ...(req.body.activeRecoveryDay !== undefined && { activeRecoveryDay: req.body.activeRecoveryDay }),
        ...(req.body.penaltyModeEnabled !== undefined && { penaltyModeEnabled: Boolean(req.body.penaltyModeEnabled) }),
        ...(req.body.notificationsEnabled !== undefined && { notificationsEnabled: Boolean(req.body.notificationsEnabled) }),
        // Note: bio field doesn't exist in schema yet, but we're ready for it
      });

      console.log("✅ User updated, currentGoal is now:", updatedUser.currentGoal);
      res.json(enrichUserWithLevelData(updatedUser));
    } catch (error) {
      console.error("Update user error:", error);
      res.status(500).json({ error: "Failed to update user" });
    }
  });

  // User In-App Account Deletion (Google Play Compliance & SEC-01)
  app.delete("/api/user", requireAuth, async (req, res) => {
    try {
      const user = await storage.getUserByFirebaseUid(req.firebaseUid!);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      console.log(`[Account Deletion] Initiating permanent deletion for user: ${user.id} (${user.firebaseUid})`);

      // 1. Transactionally delete user and dependent child records
      await storage.deleteUser(user.id);

      // 2. Delete user in Firebase Authentication
      try {
        const { getFirebaseAdmin } = await import("./firebase-admin");
        const admin = getFirebaseAdmin();
        await admin.auth().deleteUser(user.firebaseUid);
        console.log(`[Account Deletion] Firebase Auth record deleted for ${user.firebaseUid}`);
      } catch (fbErr: any) {
        console.warn(`[Account Deletion] Firebase Auth deletion warning (non-fatal):`, fbErr?.message || fbErr);
      }

      res.json({
        success: true,
        message: "User account and all telemetry data permanently deleted.",
      });
    } catch (err: any) {
      console.error("[Account Deletion] Error deleting user account:", err);
      res.status(500).json({ error: "Failed to permanently delete account" });
    }
  });

  // Declare / Activate Rest Day (Active Recovery Mode)
  app.post("/api/user/recovery-day", requireAuth, async (req, res) => {
    try {
      const user = await storage.getUserByFirebaseUid(req.firebaseUid!);
      if (!user) return res.status(404).json({ error: "User not found" });

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Check if already claimed today
      if (user.lastRestDayClaimedAt && new Date(user.lastRestDayClaimedAt) >= today) {
        return res.status(400).json({ error: "Rest Day Protocol is already active for today." });
      }

      // Check shield/potion count
      if ((user.streakShields || 0) <= 0) {
        return res.status(400).json({ error: "No Mana Shields available. You can obtain one in the Hunter Shop." });
      }

      const remainingShields = Math.max(0, (user.streakShields || 1) - 1);
      const updatedUser = await storage.updateUser(user.id, {
        activeRecoveryDay: true,
        streakShields: remainingShields,
        lastRestDayClaimedAt: new Date(),
        streak: Math.max(1, (user.streak || 0) + 1), // Keeps streak active
      });

      // Generate 3 Calibrated Active Recovery Quests with proper schema columns
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
      const recoveryQuests = [
        {
          userId: user.id,
          title: "Cellular Hydration Protocol",
          description: "Infuse your physical matrix with at least 2.5 Liters of water throughout the day.",
          type: "daily",
          category: "vitality",
          rewardXP: 35,
          rewardCoins: 20,
          completed: false,
          difficulty: "easy",
          expiresAt,
          dueAt: expiresAt,
        },
        {
          userId: user.id,
          title: "Myofascial Mobility & Light Stretch",
          description: "Perform 15 minutes of joint mobility, gentle yoga, or foam rolling for tissue repair.",
          type: "daily",
          category: "stamina",
          rewardXP: 40,
          rewardCoins: 25,
          completed: false,
          difficulty: "easy",
          expiresAt,
          dueAt: expiresAt,
        },
        {
          userId: user.id,
          title: "Deep Parasympathetic Sleep",
          description: "Prioritize neural recovery with 7.5+ hours of uninterrupted sleep tonight.",
          type: "daily",
          category: "willpower",
          rewardXP: 45,
          rewardCoins: 30,
          completed: false,
          difficulty: "easy",
          expiresAt,
          dueAt: expiresAt,
        },
      ];

      for (const q of recoveryQuests) {
        await storage.createQuest(q as any);
      }

      await storage.createActivity({
        userId: user.id,
        action: "system",
        xpDelta: 0,
        coinsDelta: 0,
        description: "🧪 Activated Rest Day Protocol. Daily trials converted to Active Recovery.",
      } as any);

      res.json({
        success: true,
        message: "Rest Day Protocol activated! Your streak is preserved, and recovery quests are assigned.",
        user: enrichUserWithLevelData(updatedUser),
        remainingShields,
      });
    } catch (err: any) {
      console.error("Recovery day error:", err);
      res.status(500).json({ error: err.message || "Failed to activate recovery mode" });
    }
  });

  // Evening Debrief Submissions (FUNC-02)
  app.post("/api/debrief", requireAuth, async (req, res) => {
    try {
      const user = await storage.getUserByFirebaseUid(req.firebaseUid!);
      if (!user) return res.status(404).json({ error: "User not found" });

      const {
        date,
        reflectionText,
        selfHonestyRating,
        focusDensityScoreOfDay,
        sleepHours,
        blockerTag,
        energyRating,
      } = req.body;
      if (!date || !reflectionText || typeof reflectionText !== "string" || reflectionText.trim().length < 20) {
        return res.status(400).json({ error: "Date and a reflection of at least 20 characters are required." });
      }

      const rating = typeof selfHonestyRating === "number" ? Math.min(10, Math.max(1, selfHonestyRating)) : 8;
      const numericSleep = typeof sleepHours === "number" ? sleepHours : Number(user.lastSleepHours || 7);
      const safeBlocker = typeof blockerTag === "string" && blockerTag.trim() ? blockerTag.trim().toLowerCase() : "none";

      const existing = await storage.getEveningDebrief(user.id, date);
      if (existing) {
        return res.status(409).json({ error: "Evening debrief already submitted for this date." });
      }

      // Compute today's real execution stats so AI/deterministic coach can generate a concrete tomorrow fix
      const todayPrefix = date;
      const focusSessions = await storage.getUserFocusSessions(user.id);
      const todayFocusMinutes = focusSessions
        .filter((f) => new Date(f.completedAt).toISOString().split("T")[0] === todayPrefix)
        .reduce((sum, f) => sum + (f.duration || 0), 0);
      const userQuests = await storage.getUserQuests(user.id);
      const todayCompletedQuests = userQuests.filter(
        (q) => q.completed && q.completedAt && new Date(q.completedAt).toISOString().split("T")[0] === todayPrefix
      ).length;

      const { analyzeEveningDebrief } = await import("./services/goal-coach");
      const analysis = await analyzeEveningDebrief({
        user,
        reflectionText: reflectionText.trim(),
        sleepHours: numericSleep,
        energyRating: typeof energyRating === "number" ? energyRating : rating,
        blockerTag: safeBlocker,
        selfHonestyRating: rating,
        todayFocusMinutes,
        todayCompletedQuests,
      });

      const computedDensity =
        typeof focusDensityScoreOfDay === "number" && focusDensityScoreOfDay > 0
          ? focusDensityScoreOfDay
          : Math.min(100, Math.round((todayFocusMinutes / Math.max(30, user.dailyCapacityMinutes || 90)) * 100));

      const debrief = await storage.createEveningDebrief({
        userId: user.id,
        date,
        reflectionText: reflectionText.trim(),
        aiFeedback: analysis.diagnosticFeedback,
        selfHonestyRating: rating,
        focusDensityScoreOfDay: computedDensity,
        sleepHours: typeof sleepHours === "number" ? sleepHours.toFixed(1) : null,
        blockerTag: analysis.blockerTag,
        tomorrowIfThenCue: analysis.tomorrowIfThenCue,
        coachActionType: analysis.coachActionType,
      });

      await storage.updateUser(user.id, {
        ...(typeof sleepHours === "number" && sleepHours >= 0 && sleepHours <= 24
          ? {
              lastSleepHours: sleepHours.toFixed(1) as any,
              ...(sleepHours >= 7 ? { vitality: Math.min(100, (user.vitality || 10) + 1) } : {}),
            }
          : {}),
        lastIfThenPlan: analysis.tomorrowIfThenCue,
        lastBlockerTag: analysis.blockerTag,
        lastCoachSummary: analysis.diagnosticFeedback,
        lastCoachAt: new Date(),
      });

      res.json({
        ...debrief,
        tomorrowIfThenCue: analysis.tomorrowIfThenCue,
        coachActionType: analysis.coachActionType,
        prescribedCategory: analysis.prescribedCategory,
        providerUsed: analysis.providerUsed,
      });
    } catch (err: any) {
      console.error("Debrief submission error:", err);
      res.status(500).json({ error: err.message || "Failed to submit evening debrief" });
    }
  });

  app.get("/api/debrief/today", requireAuth, async (req, res) => {
    try {
      const user = await storage.getUserByFirebaseUid(req.firebaseUid!);
      if (!user) return res.status(404).json({ error: "User not found" });

      const today = new Date().toISOString().split("T")[0];
      const debrief = await storage.getEveningDebrief(user.id, today);
      res.json(debrief || null);
    } catch (err: any) {
      console.error("Get today debrief error:", err);
      res.status(500).json({ error: err.message || "Failed to retrieve today's debrief" });
    }
  });

  // ─── Solo Leveling & Retention System Routes (SL-7,6,2 & SR-1,2,3,7,8) ───────

  // SL-7: Fetch pending & completed Rank Promotion Trials
  app.get("/api/rank-trials", requireAuth, async (req, res) => {
    try {
      const user = await storage.getUserByFirebaseUid(req.firebaseUid!);
      if (!user) return res.status(404).json({ error: "User not found" });

      const trials = await storage.getUserRankTrials(user.id);
      const quests = await storage.getUserQuests(user.id);
      const enriched = trials.map((t) => ({
        ...t,
        quest: quests.find((q) => q.id === t.questId) || null,
      }));
      res.json(enriched);
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Failed to fetch rank trials" });
    }
  });

  // SL-6: Allocate spendable ability points
  app.post("/api/user/allocate-stats", requireAuth, async (req, res) => {
    try {
      const user = await storage.getUserByFirebaseUid(req.firebaseUid!);
      if (!user) return res.status(404).json({ error: "User not found" });

      const allocations = req.body?.allocations as Record<string, number> | undefined;
      if (!allocations || typeof allocations !== "object") {
        return res.status(400).json({ error: "Invalid allocations payload" });
      }

      let totalRequested = 0;
      const updates: Record<string, number> = {};

      for (const [stat, rawAmount] of Object.entries(allocations)) {
        if (!STAT_NAMES.includes(stat as any)) continue;
        const amt = Math.floor(Number(rawAmount) || 0);
        if (amt <= 0) continue;
        const current = (user[stat as keyof typeof user] as number) || 10;
        if (current + amt > 100) {
          return res.status(400).json({ error: `${stat.toUpperCase()} cannot exceed 100.` });
        }
        updates[stat] = current + amt;
        totalRequested += amt;
      }

      if (totalRequested <= 0) {
        return res.status(400).json({ error: "Allocate at least 1 ability point." });
      }
      if (totalRequested > (user.unspentStatPoints || 0)) {
        return res.status(400).json({ error: `Insufficient unspent ability points (${user.unspentStatPoints || 0} available).` });
      }

      // Compute dominant statBias from updated attributes
      const statPairs = STAT_NAMES.map((s) => ({
        name: s,
        val: updates[s] ?? ((user[s as keyof typeof user] as number) || 10),
      }));
      statPairs.sort((a, b) => b.val - a.val);

      const updatedUser = await storage.updateUser(user.id, {
        ...updates,
        unspentStatPoints: (user.unspentStatPoints || 0) - totalRequested,
        statBias: statPairs[0]?.name || null,
      });

      res.json({ success: true, user: enrichUserWithLevelData(updatedUser) });
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Failed to allocate stats" });
    }
  });

  // SR-1: Lock Today's Non-Negotiable Morning Anchor Quest
  app.post("/api/user/anchor-quest", requireAuth, async (req, res) => {
    try {
      const user = await storage.getUserByFirebaseUid(req.firebaseUid!);
      if (!user) return res.status(404).json({ error: "User not found" });

      const { questId } = req.body;
      if (!questId || typeof questId !== "string") {
        return res.status(400).json({ error: "questId is required" });
      }

      const quest = await storage.getQuest(questId);
      if (!quest || quest.userId !== user.id) {
        return res.status(404).json({ error: "Quest not found" });
      }

      const today = new Date().toISOString().split("T")[0];
      const updatedUser = await storage.updateUser(user.id, {
        anchorQuestId: quest.id,
        anchorDate: today,
      });

      res.json({ success: true, user: enrichUserWithLevelData(updatedUser), anchorQuestId: quest.id });
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Failed to set anchor quest" });
    }
  });

  // SL-2: Explicit Penalty Zone Clearance Verification
  app.post("/api/user/penalty/clear", requireAuth, async (req, res) => {
    try {
      const user = await storage.getUserByFirebaseUid(req.firebaseUid!);
      if (!user) return res.status(404).json({ error: "User not found" });
      if (!user.inPenaltyZone) {
        return res.json({ success: true, penaltyCleared: false, user: enrichUserWithLevelData(user) });
      }

      const quests = await storage.getUserQuests(user.id);
      const completedPenalty = quests.some((q) => q.type === "penalty" && q.completed);
      if (!completedPenalty) {
        return res.status(400).json({ error: "Complete your active Penalty Zone survival quest or 15m Focus session first." });
      }

      const updatedUser = await storage.updateUser(user.id, {
        inPenaltyZone: false,
        penaltyExpiresAt: null,
      });

      res.json({ success: true, penaltyCleared: true, user: enrichUserWithLevelData(updatedUser) });
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Failed to clear penalty" });
    }
  });

  // Feature #1: Daily Quest Ultimatum live 4-part checklist
  app.get("/api/user/ultimatum", requireAuth, async (req, res) => {
    try {
      const user = await storage.getUserByFirebaseUid(req.firebaseUid!);
      if (!user) return res.status(404).json({ error: "User not found" });

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayStr = today.toISOString().split("T")[0];

      const [quests, focusSessions, workoutSessions, todayDebrief] = await Promise.all([
        storage.getUserQuests(user.id),
        storage.getUserFocusSessions(user.id),
        storage.getUserWorkoutSessions(user.id, 20),
        storage.getEveningDebrief(user.id, todayStr),
      ]);

      const focusToday = focusSessions
        .filter((f) => new Date(f.completedAt) >= today)
        .reduce((sum, f) => sum + (f.duration || 0), 0);
      const workoutsToday = workoutSessions.filter((w) => new Date(w.startedAt) >= today).length;
      const sleepHours = user.lastSleepHours != null ? Number(user.lastSleepHours) : 7.5;
      const focusTarget = sleepHours < 6 || user.activeRecoveryDay ? 15 : 25;

      const anchorDone =
        (user.anchorQuestId && quests.some((q) => q.id === user.anchorQuestId && q.completed)) ||
        quests.some((q) => q.type === "daily" && q.completed && new Date(q.createdAt) >= today);
      const workoutQuestDone = quests.some(
        (q) =>
          q.completed &&
          new Date(q.createdAt) >= today &&
          (q.executionMode === "workout_verified" || q.category === "fitness")
      );
      const workoutDone = workoutsToday >= 1 || Boolean(user.activeRecoveryDay) || workoutQuestDone;
      const focusDone = focusToday >= focusTarget;
      const debriefDone = Boolean(todayDebrief);

      const items = [
        {
          key: "focus",
          label: `${focusTarget}m Verified Air-Gap Focus`,
          progress: `${focusToday}/${focusTarget}m`,
          done: focusDone,
        },
        {
          key: "workout",
          label: user.activeRecoveryDay ? "Active Recovery Mobility" : "Strength / Physical Session",
          progress: workoutDone ? "Verified" : "0/1",
          done: workoutDone,
        },
        {
          key: "anchor",
          label: "Complete Morning Anchor Quest",
          progress: anchorDone ? "Cleared" : "Pending",
          done: anchorDone,
        },
        {
          key: "debrief",
          label: "Log Evening Debrief Audit",
          progress: debriefDone ? "Logged" : "Pending",
          done: debriefDone,
        },
      ];

      const completedCount = items.filter((i) => i.done).length;
      const { buildUltimatumWarningLine } = await import("./services/goal-coach");
      const warningLine =
        (user.ultimatumState?.date === todayStr && user.ultimatumState.warningLine) ||
        buildUltimatumWarningLine(user);

      res.json({
        date: todayStr,
        completedCount,
        totalCount: 4,
        isAllDone: completedCount === 4,
        shieldAbsorbed: Boolean(user.ultimatumState?.date === todayStr && user.ultimatumState?.shieldAbsorbed),
        alertSentToday: user.lastUltimatumAlertDate === todayStr,
        warningLine,
        items,
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Failed to load Daily Ultimatum" });
    }
  });

  app.post("/api/user/ultimatum/alerted", requireAuth, async (req, res) => {
    try {
      const user = await storage.getUserByFirebaseUid(req.firebaseUid!);
      if (!user) return res.status(404).json({ error: "User not found" });
      const todayStr = new Date().toISOString().split("T")[0];
      await storage.updateUser(user.id, { lastUltimatumAlertDate: todayStr });
      res.json({ success: true, alertDate: todayStr });
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Failed to record alert state" });
    }
  });

  // Feature #10: Comeback Gate (Red Gate) verification & 50% streak restoration
  app.post("/api/comeback/complete", requireAuth, async (req, res) => {
    try {
      const user = await storage.getUserByFirebaseUid(req.firebaseUid!);
      if (!user) return res.status(404).json({ error: "User not found" });

      const gate = user.comebackGate;
      if (!gate || !gate.active || new Date(gate.expiresAt).getTime() < Date.now()) {
        return res.status(400).json({ error: "No active Red Comeback Gate available right now." });
      }

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const [focusSessions, workoutSessions] = await Promise.all([
        storage.getUserFocusSessions(user.id),
        storage.getUserWorkoutSessions(user.id, 10),
      ]);
      const hasFocusToday = focusSessions.some(
        (f) => new Date(f.completedAt) >= today && (f.duration || 0) >= 10
      );
      const hasWorkoutToday = workoutSessions.some((w) => new Date(w.startedAt) >= today);
      const quickSetConfirmed = req.body?.quickSetConfirmed === true;

      if (!hasFocusToday) {
        return res.status(400).json({
          error: "Complete at least one 10-minute Air-Gap Focus sprint today to pierce the Red Gate.",
        });
      }
      if (!hasWorkoutToday && !quickSetConfirmed) {
        return res.status(400).json({
          error: "Log a workout set (or confirm your 1-set pushup/squat finisher) to escape the Red Gate.",
        });
      }

      const restoredStreak = Math.max(user.streak || 0, Math.min(30, Math.max(1, gate.restoredFromStreak || 1)));
      const updatedUser = await storage.updateUser(user.id, {
        streak: restoredStreak,
        inPenaltyZone: false,
        penaltyExpiresAt: null,
        xp: (user.xp || 0) + 50,
        comebackGate: {
          ...gate,
          active: false,
          focusDone: true,
          workoutDone: true,
        },
        lastActive: new Date(),
      });

      await storage.createActivity({
        userId: user.id,
        action: "system",
        xpDelta: 50,
        coinsDelta: 0,
        description: `Red Gate Cleared: Restored ${restoredStreak}-day streak.`,
      } as any);

      res.json({
        success: true,
        restoredStreak,
        xpAwarded: 50,
        systemLine: `Hunter. You are still alive. ${restoredStreak}-day streak restored.`,
        user: enrichUserWithLevelData(updatedUser),
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Failed to clear Comeback Gate" });
    }
  });

  // SR-2: Check or Spawn Surprise Blue / Red Gate Event
  app.post("/api/gates/check-spawn", requireAuth, async (req, res) => {
    try {
      const user = await storage.getUserByFirebaseUid(req.firebaseUid!);
      if (!user) return res.status(404).json({ error: "User not found" });

      const currentGate = user.activeGateEvent;
      const isExpiredOrClaimed = !currentGate || currentGate.claimed || new Date(currentGate.expiresAt).getTime() < Date.now();

      if (!isExpiredOrClaimed) {
        return res.json({ spawned: false, gate: currentGate, user: enrichUserWithLevelData(user) });
      }

      const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
      const recentFocus = await storage.getUserFocusSessions(user.id);
      const recentWorkouts = await storage.getUserWorkoutSessions(user.id, 15);
      const focusMinutes7d = recentFocus
        .filter((f) => new Date(f.completedAt).getTime() >= sevenDaysAgo)
        .reduce((sum, f) => sum + (f.duration || 0), 0);
      const workouts7d = recentWorkouts
        .filter((w) => new Date(w.startedAt).getTime() >= sevenDaysAgo)
        .length;
      const { computeRadarBottleneck } = await import("./services/goal-coach");
      const bottleneck = computeRadarBottleneck(user, focusMinutes7d, workouts7d);

      const newGate = generateSurpriseGate({
        focusMinutes7d,
        workouts7d,
        goalDomain: user.goalDomain,
        lowestStat: bottleneck.stat,
      });
      const updatedUser = await storage.updateUser(user.id, { activeGateEvent: newGate });
      res.json({ spawned: true, gate: newGate, user: enrichUserWithLevelData(updatedUser) });
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Failed to check gate spawn" });
    }
  });

  // SR-2: Claim Cleared Surprise Gate Relic Chest
  app.post("/api/gates/claim", requireAuth, async (req, res) => {
    try {
      const user = await storage.getUserByFirebaseUid(req.firebaseUid!);
      if (!user) return res.status(404).json({ error: "User not found" });

      const gate = user.activeGateEvent;
      if (!gate) return res.status(404).json({ error: "No active Gate found" });
      if (gate.claimed) return res.status(409).json({ error: "Gate chest already claimed" });
      if ((gate.currentValue || 0) < gate.targetValue) {
        return res.status(400).json({ error: `Gate objective incomplete (${gate.currentValue}/${gate.targetValue}).` });
      }

      const bonusCoins = gate.rewardCoins + Math.floor(Math.random() * 75);
      const wonShield = Math.random() < 0.35 && (user.streakShields || 0) < 5;

      const updatedUser = await storage.updateUser(user.id, {
        coins: (user.coins || 0) + bonusCoins,
        streakShields: wonShield ? (user.streakShields || 0) + 1 : user.streakShields,
        activeGateEvent: { ...gate, claimed: true },
      });

      await storage.createActivity({
        userId: user.id,
        action: "gateCleared",
        coinsDelta: bonusCoins,
        xpDelta: 50,
        description: `Cleared ${gate.title}${wonShield ? " (+1 Mana Shield!)" : ""}`,
      } as any);

      res.json({
        success: true,
        coinsAwarded: bonusCoins,
        wonShield,
        user: enrichUserWithLevelData(updatedUser),
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Failed to claim Gate chest" });
    }
  });

  // SR-3: Get Shadow Catalog & Unlock Status + Equip up to 3 Shadows
  app.get("/api/shadows", requireAuth, async (req, res) => {
    try {
      const user = await storage.getUserByFirebaseUid(req.firebaseUid!);
      if (!user) return res.status(404).json({ error: "User not found" });

      const unlocked = Array.isArray(user.unlockedShadows) ? user.unlockedShadows : [];
      const equipped = Array.isArray(user.equippedShadows) ? user.equippedShadows : [];

      res.json({
        catalog: SHADOW_CATALOG.map((s) => ({
          ...s,
          unlocked: unlocked.includes(s.id),
          equipped: equipped.includes(s.id),
        })),
        unlockedShadows: unlocked,
        equippedShadows: equipped,
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Failed to fetch shadows" });
    }
  });

  app.post("/api/shadows/equip", requireAuth, async (req, res) => {
    try {
      const user = await storage.getUserByFirebaseUid(req.firebaseUid!);
      if (!user) return res.status(404).json({ error: "User not found" });

      const { equippedIds } = req.body;
      if (!Array.isArray(equippedIds) || equippedIds.length > 3) {
        return res.status(400).json({ error: "Select up to 3 extracted Shadows." });
      }

      const unlocked = Array.isArray(user.unlockedShadows) ? user.unlockedShadows : [];
      const validIds = equippedIds.filter((id) => typeof id === "string" && unlocked.includes(id));

      const updatedUser = await storage.updateUser(user.id, { equippedShadows: validIds });
      res.json({ success: true, equippedShadows: validIds, user: enrichUserWithLevelData(updatedUser) });
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Failed to equip shadows" });
    }
  });

  // Feature #4: Claim defeated Weekly Boss loot & queue ARISE extraction slot
  app.post("/api/boss/claim-loot", requireAuth, async (req, res) => {
    try {
      const user = await storage.getUserByFirebaseUid(req.firebaseUid!);
      if (!user) return res.status(404).json({ error: "User not found" });

      const roadmap = await storage.getActiveRoadmap(user.id);
      if (!roadmap) return res.status(404).json({ error: "No active roadmap found" });
      const weeks = await storage.getRoadmapWeeks(roadmap.id);
      const activeWeek = weeks.find((w) => w.weekNumber === roadmap.currentWeek) || weeks[0];
      if (!activeWeek || !activeWeek.bossDefeated) {
        return res.status(400).json({ error: "Defeat this week's Boss first (reduce Boss HP to 0)." });
      }
      if (activeWeek.bossLootClaimed) {
        return res.status(409).json({ error: "Weekly Boss loot already claimed." });
      }

      await storage.updateRoadmapWeek(activeWeek.id, { bossLootClaimed: true });

      const { createPendingExtraction } = await import("./services/system-mechanics");
      const hasPending =
        user.pendingExtraction && new Date(user.pendingExtraction.expiresAt).getTime() > Date.now();
      const seededExtraction = hasPending
        ? user.pendingExtraction
        : createPendingExtraction({
            bossName: activeWeek.bossName || "Weekly Boss",
            sourceMilestone: activeWeek.goal,
            rank: "Knight",
          });

      const updatedUser = await storage.updateUser(user.id, {
        coins: (user.coins || 0) + 120,
        xp: (user.xp || 0) + 100,
        pendingExtraction: seededExtraction,
      });

      await storage.createActivity({
        userId: user.id,
        action: "bossCleared",
        xpDelta: 100,
        coinsDelta: 120,
        description: `Slain ${activeWeek.bossName || "Weekly Boss"}! +120 Coins & Extraction Gate opened.`,
      } as any);

      res.json({
        success: true,
        coinsAwarded: 120,
        xpAwarded: 100,
        pendingExtraction: seededExtraction,
        user: enrichUserWithLevelData(updatedUser),
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Failed to claim boss loot" });
    }
  });

  // Feature #3: Attempt ARISE Shadow Extraction (10s zero-breach hold, max 3 tries)
  app.post("/api/shadows/extract/attempt", requireAuth, async (req, res) => {
    try {
      const user = await storage.getUserByFirebaseUid(req.firebaseUid!);
      if (!user) return res.status(404).json({ error: "User not found" });

      const pending = user.pendingExtraction;
      if (!pending || new Date(pending.expiresAt).getTime() < Date.now() || pending.attemptsRemaining <= 0) {
        return res.status(400).json({ error: "No active ARISE extraction opportunity available." });
      }

      const holdSeconds = Number(req.body?.holdSeconds) || 0;
      const breachCount = Number(req.body?.breachCount) || 0;
      if (holdSeconds < 10) {
        return res.status(400).json({ error: "Hold uninterrupted for full 10 seconds to command ARISE." });
      }
      if (breachCount > 0) {
        return res.status(400).json({ error: "Extraction broken by app switch. Maintain pure stillness for 10s." });
      }

      const focusSessions = await storage.getUserFocusSessions(user.id);
      const totalVerifiedMinutes = focusSessions.reduce((sum, f) => sum + (f.duration || 0), 0);
      const { rollExtractionSuccess, SHADOW_CATALOG } = await import("./services/system-mechanics");
      const rollResult = rollExtractionSuccess({ user, totalVerifiedMinutes });

      if (rollResult.won) {
        const unlocked = Array.isArray(user.unlockedShadows) ? user.unlockedShadows : [];
        const nextBase = SHADOW_CATALOG.find((s) => !unlocked.includes(s.id)) || SHADOW_CATALOG[0];
        const { generateExtractionLore } = await import("./services/goal-coach");
        const lore = await generateExtractionLore({
          user,
          bossName: pending.bossName,
          sourceMilestone: pending.sourceMilestone,
          baseShadowId: nextBase.id,
        });

        const newExtracted = {
          id: pending.id,
          baseShadowId: nextBase.id,
          name: nextBase.name,
          title: lore.title,
          loreOrigin: lore.loreOrigin,
          passiveType: lore.passiveType,
          acquiredAt: new Date().toISOString(),
        };

        const mergedUnlocked = Array.from(new Set([...unlocked, nextBase.id]));
        const existingExtracted = Array.isArray(user.extractedShadows) ? user.extractedShadows : [];
        const updatedUser = await storage.updateUser(user.id, {
          unlockedShadows: mergedUnlocked,
          extractedShadows: [...existingExtracted, newExtracted],
          pendingExtraction: null,
        });

        return res.json({
          won: true,
          oddsUsed: rollResult.odds,
          extractedShadow: newExtracted,
          user: enrichUserWithLevelData(updatedUser),
        });
      }

      const remaining = pending.attemptsRemaining - 1;
      if (remaining > 0) {
        const updatedUser = await storage.updateUser(user.id, {
          pendingExtraction: {
            ...pending,
            attemptsRemaining: remaining,
          },
        });
        return res.json({
          won: false,
          attemptsRemaining: remaining,
          oddsUsed: rollResult.odds,
          message: `The shadow resisted your command. ${remaining} attempt${remaining === 1 ? "" : "s"} remaining.`,
          user: enrichUserWithLevelData(updatedUser),
        });
      }

      // All 3 extraction tries exhausted -> partial mana remnant refund
      const updatedUser = await storage.updateUser(user.id, {
        pendingExtraction: null,
        coins: (user.coins || 0) + 35,
        xp: (user.xp || 0) + 25,
      });
      return res.json({
        won: false,
        attemptsRemaining: 0,
        oddsUsed: rollResult.odds,
        refundCoins: 35,
        refundXp: 25,
        message: "Mana scattered after 3rd extraction fail. Salvaged +35 Coins & +25 XP.",
        user: enrichUserWithLevelData(updatedUser),
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Extraction attempt failed" });
    }
  });

  // SR-7: Bio-Fatigue & Super-Compensation Recovery Protocol
  app.get("/api/user/fatigue", requireAuth, async (req, res) => {
    try {
      const user = await storage.getUserByFirebaseUid(req.firebaseUid!);
      if (!user) return res.status(404).json({ error: "User not found" });

      const recentWorkouts = await storage.getUserWorkoutSessions(user.id, 15);
      const recentFocus = await storage.getUserFocusSessions(user.id);
      const telemetry = computeBioFatigue(user, recentWorkouts, recentFocus);
      res.json(telemetry);
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Failed to compute fatigue telemetry" });
    }
  });

  app.post("/api/user/super-compensation", requireAuth, async (req, res) => {
    try {
      const user = await storage.getUserByFirebaseUid(req.firebaseUid!);
      if (!user) return res.status(404).json({ error: "User not found" });

      const updatedUser = await storage.updateUser(user.id, {
        activeRecoveryDay: true,
        lastRestDayClaimedAt: new Date(),
      });

      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
      await storage.createQuest({
        userId: user.id,
        title: "Super-Compensation: Parasympathetic Deload",
        description: "Execute 15 minutes of mobility stretching and hit 8 hours sleep to super-compensate recovery.",
        type: "daily",
        category: "vitality",
        difficulty: "easy",
        rewardXP: 45,
        rewardCoins: 25,
        rewardStats: { vitality: 3, stamina: 2 },
        dueAt: expiresAt,
      } as any);

      res.json({ success: true, user: enrichUserWithLevelData(updatedUser) });
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Failed to trigger recovery protocol" });
    }
  });

  // SR-8: Class Evolution (Level 25 Job Change & Level 50 Sovereign Monarch)
  app.post("/api/user/evolve-class", requireAuth, async (req, res) => {
    try {
      const user = await storage.getUserByFirebaseUid(req.firebaseUid!);
      if (!user) return res.status(404).json({ error: "User not found" });

      const mode = req.body?.mode as "job_change" | "prestige" | undefined;
      if (mode === "prestige") {
        if ((user.level || 1) < 50 && user.tier !== "S") {
          return res.status(400).json({ error: "Apex Monarch Prestige requires Level 50 or S-Rank clearance." });
        }
        const updatedUser = await storage.updateUser(user.id, {
          evolvedClass: "Shadow Monarch",
          prestigeRank: (user.prestigeRank || 0) + 1,
          level: 1,
          xp: 0,
          coins: (user.coins || 0) + 500,
          unspentStatPoints: (user.unspentStatPoints || 0) + 10,
        });
        return res.json({ success: true, evolvedClass: "Shadow Monarch", prestige: true, user: enrichUserWithLevelData(updatedUser) });
      }

      if ((user.level || 1) < 25) {
        return res.status(400).json({ error: "Job Change Class Evolution unlocks at Level 25." });
      }

      const nextTitle = CLASS_EVOLUTIONS[user.hunterClass] || "Shadow Ascendant";
      const updatedUser = await storage.updateUser(user.id, {
        evolvedClass: nextTitle,
        unspentStatPoints: (user.unspentStatPoints || 0) + 5,
      });

      res.json({ success: true, evolvedClass: nextTitle, user: enrichUserWithLevelData(updatedUser) });
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Failed to evolve hunter class" });
    }
  });

  // Feature #5: Job Change Questline (Lv 15 + Primary Stat >= 35, 7d Trial / 7d Fail Cooldown)
  app.get("/api/job-change", requireAuth, async (req, res) => {
    try {
      let user = await storage.getUserByFirebaseUid(req.firebaseUid!);
      if (!user) return res.status(404).json({ error: "User not found" });

      let jc = user.jobChangeState;
      if (jc && jc.status === "active" && jc.startedAt) {
        if (jc.expiresAt && new Date(jc.expiresAt).getTime() < Date.now()) {
          jc = {
            ...jc,
            status: "cooldown",
            cooldownUntil: new Date(Date.now() + 7 * 86400000).toISOString(),
          };
          user = await storage.updateUser(user.id, { jobChangeState: jc });
        } else {
          const since = new Date(jc.startedAt);
          const [focusSessions, workoutSessions] = await Promise.all([
            storage.getUserFocusSessions(user.id),
            storage.getUserWorkoutSessions(user.id, 30),
          ]);
          const focusSince = focusSessions.filter((f) => new Date(f.completedAt) >= since);
          const blocks45 = focusSince.filter((f) => (f.duration || 0) >= 45).length;
          const zeroBreaches = focusSince.filter((f) => (f.breachCount || 0) === 0).length;
          const workoutsDone = workoutSessions.filter(
            (w) => new Date(w.startedAt) >= since && Boolean(w.finishedAt)
          ).length;

          const updatedSteps = jc.steps.map((s) => ({
            ...s,
            current:
              s.id === "focus_blocks"
                ? Math.min(s.target, blocks45)
                : s.id === "zero_breach"
                  ? Math.min(s.target, zeroBreaches)
                  : Math.min(s.target, workoutsDone),
          }));
          jc = { ...jc, steps: updatedSteps };
          user = await storage.updateUser(user.id, { jobChangeState: jc });
        }
      }

      const maxStat = Math.max(
        user.strength || 10,
        user.agility || 10,
        user.stamina || 10,
        user.vitality || 10,
        user.intelligence || 10,
        user.willpower || 10,
        user.charisma || 10
      );
      const eligible = (user.level || 1) >= 15 && maxStat >= 35;

      res.json({
        eligible,
        maxStat,
        jobChangeState: jc,
        user: enrichUserWithLevelData(user),
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Failed to fetch job change state" });
    }
  });

  app.post("/api/job-change/start", requireAuth, async (req, res) => {
    try {
      const user = await storage.getUserByFirebaseUid(req.firebaseUid!);
      if (!user) return res.status(404).json({ error: "User not found" });

      if (user.jobChangeState?.status === "completed") {
        return res.status(409).json({ error: "Job Change Awakening already completed." });
      }
      if (user.jobChangeState?.status === "active") {
        return res.json({ success: true, jobChangeState: user.jobChangeState, user: enrichUserWithLevelData(user) });
      }
      if (
        user.jobChangeState?.status === "cooldown" &&
        user.jobChangeState.cooldownUntil &&
        new Date(user.jobChangeState.cooldownUntil).getTime() > Date.now()
      ) {
        return res.status(429).json({
          error: "Job Change retry is currently on 7-day cooldown after an expired attempt.",
        });
      }

      const maxStat = Math.max(
        user.strength || 10,
        user.agility || 10,
        user.stamina || 10,
        user.vitality || 10,
        user.intelligence || 10,
        user.willpower || 10,
        user.charisma || 10
      );
      if ((user.level || 1) < 15 || maxStat < 35) {
        return res.status(400).json({
          error: "Requires Level 15 and at least 35 in a primary attribute to unlock Job Change Questline.",
        });
      }

      const cutoff = Date.now() - 14 * 86400000;
      const [focus, workouts] = await Promise.all([
        storage.getUserFocusSessions(user.id),
        storage.getUserWorkoutSessions(user.id, 30),
      ]);
      const focusMinutes14d = focus
        .filter((f) => new Date(f.completedAt).getTime() >= cutoff)
        .reduce((s, f) => s + (f.duration || 0), 0);
      const workouts14d = workouts.filter((w) => new Date(w.startedAt).getTime() >= cutoff).length;

      const baseEvolution = CLASS_EVOLUTIONS[user.hunterClass] || "Shadow Assassin";
      const { generateJobChangeTrial } = await import("./services/goal-coach");
      const trial = await generateJobChangeTrial({
        user,
        focusMinutes14d,
        workouts14d,
        baseEvolutionTitle: baseEvolution,
      });

      const now = Date.now();
      const jobChangeState = {
        status: "active" as const,
        startedAt: new Date(now).toISOString(),
        expiresAt: new Date(now + 7 * 86400000).toISOString(),
        awakenedTitle: trial.awakenedTitle,
        steps: trial.steps,
      };
      const updatedUser = await storage.updateUser(user.id, { jobChangeState });

      res.json({ success: true, jobChangeState, user: enrichUserWithLevelData(updatedUser) });
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Failed to start Job Change Questline" });
    }
  });

  app.post("/api/job-change/claim", requireAuth, async (req, res) => {
    try {
      const user = await storage.getUserByFirebaseUid(req.firebaseUid!);
      if (!user) return res.status(404).json({ error: "User not found" });
      const jc = user.jobChangeState;
      if (!jc || jc.status !== "active" || !jc.startedAt) {
        return res.status(400).json({ error: "No active Job Change Questline to claim." });
      }

      const since = new Date(jc.startedAt);
      const [focusSessions, workoutSessions] = await Promise.all([
        storage.getUserFocusSessions(user.id),
        storage.getUserWorkoutSessions(user.id, 30),
      ]);
      const focusSince = focusSessions.filter((f) => new Date(f.completedAt) >= since);
      const blocks45 = focusSince.filter((f) => (f.duration || 0) >= 45).length;
      const zeroBreaches = focusSince.filter((f) => (f.breachCount || 0) === 0).length;
      const workoutsDone = workoutSessions.filter(
        (w) => new Date(w.startedAt) >= since && Boolean(w.finishedAt)
      ).length;

      const updatedSteps = jc.steps.map((s) => ({
        ...s,
        current:
          s.id === "focus_blocks"
            ? Math.min(s.target, blocks45)
            : s.id === "zero_breach"
              ? Math.min(s.target, zeroBreaches)
              : Math.min(s.target, workoutsDone),
      }));

      if (!updatedSteps.every((s) => s.current >= s.target)) {
        await storage.updateUser(user.id, { jobChangeState: { ...jc, steps: updatedSteps } });
        return res.status(400).json({ error: "Complete all 3 Job Change trial requirements first." });
      }

      const nextTitle = jc.awakenedTitle || CLASS_EVOLUTIONS[user.hunterClass] || "Shadow Assassin";
      const completedState = {
        ...jc,
        status: "completed" as const,
        steps: updatedSteps,
      };
      const updatedUser = await storage.updateUser(user.id, {
        evolvedClass: nextTitle,
        jobChangeState: completedState,
        unspentStatPoints: (user.unspentStatPoints || 0) + 5,
        coins: (user.coins || 0) + 150,
      });

      res.json({
        success: true,
        evolvedClass: nextTitle,
        bonusPoints: 5,
        bonusCoins: 150,
        user: enrichUserWithLevelData(updatedUser),
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Failed to claim Job Change Evolution" });
    }
  });

  // Mark tutorial as completed
  app.patch("/api/user/tutorial", requireAuth, async (req, res) => {
    try {
      const user = await storage.getUserByFirebaseUid(req.firebaseUid!);
      if (!user) return res.status(404).json({ error: "User not found" });

      const updatedUser = await storage.updateUser(user.id, {
        hasSeenTutorial: true
      });
      res.json(updatedUser);
    } catch (error) {
      res.status(500).json({ error: "Failed to update tutorial status" });
    }
  });

  // Feed Pet Endpoint
  app.post("/api/user/feed-pet", requireAuth, async (req, res) => {
    try {
      const FEED_COST = 50;
      const user = await storage.getUserByFirebaseUid(req.firebaseUid!);

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      if (user.coins < FEED_COST) {
        return res.status(400).json({ error: "Insufficient coins" });
      }

      // Deduct coins
      const updatedUser = await storage.updateUser(user.id, {
        coins: user.coins - FEED_COST
      });

      res.json({ success: true, newBalance: updatedUser.coins });
    } catch (error) {
      console.error("Feed pet error:", error);
      res.status(500).json({ error: "Failed to feed pet" });
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

  const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin@123";

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
      const { getSubscriptionStatus } = await import("./utils/subscription");

      const usersWithStatus = users.map(user => {
        const status = getSubscriptionStatus(user);
        return {
          ...user,
          ...status
        };
      });

      res.json(usersWithStatus);
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

      if (!process.env.VERCEL) {
        const fs = await import("fs/promises");
        const path = await import("path");
        const backupDir = path.resolve(process.cwd(), ".backup");
        await fs.mkdir(backupDir, { recursive: true });
        await fs.writeFile(
          path.join(backupDir, "backup.json"),
          JSON.stringify(data, null, 2)
        );
      }

      await storage.hydrate();

      // Broadcast system announcement
      const broadcastData = JSON.stringify({
        type: "system_announcement",
        message: "All data has been successfully restored from backup."
      });

      if (wss) {
        (wss as any).clients.forEach((client: any) => {
          if (client.readyState === WebSocket.OPEN) {
            client.send(broadcastData);
          }
        });
      }

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
        'strength', 'agility', 'stamina', 'vitality', 'intelligence', 'willpower', 'charisma',
        'isPremium', 'premiumExpiry'
      ];

      const sanitizedUpdates: any = {};
      for (const [key, value] of Object.entries(updates)) {
        if (allowedFields.includes(key)) {
          sanitizedUpdates[key] = value;
        }
      }

      // Explicitly handle null values for premium fields to ensure they're cleared in the database
      if ('premiumExpiry' in sanitizedUpdates && sanitizedUpdates.premiumExpiry === null) {
        sanitizedUpdates.premiumExpiry = null;
      }
      if ('isPremium' in sanitizedUpdates && sanitizedUpdates.isPremium === false) {
        // When removing premium, ensure premiumExpiry is also cleared
        sanitizedUpdates.premiumExpiry = null;
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

  // Break an intimidating quest into one concrete 5-minute starter micro-step (#5)
  app.post("/api/quests/:questId/unstick", requireAuth, async (req, res) => {
    try {
      const { questId } = req.params;
      const user = await storage.getUserByFirebaseUid(req.firebaseUid!);
      if (!user) return res.status(404).json({ error: "User not found" });

      const quest = await storage.getQuest(questId);
      if (!quest) return res.status(404).json({ error: "Quest not found" });
      if (quest.userId !== user.id) return res.status(403).json({ error: "Unauthorized" });

      const obstacleNote = typeof req.body?.obstacleNote === "string"
        ? req.body.obstacleNote.trim().slice(0, 200)
        : undefined;

      if (quest.content && quest.content.trim().length > 0 && !obstacleNote) {
        return res.json({
          starterAction: quest.content,
          encouragement: "Momentum beats perfection. 5 honest minutes breaks procrastination.",
          timerMinutes: 5,
          providerUsed: "cached",
          quest,
        });
      }

      const { generateMicroStarterStep } = await import("./services/goal-coach");
      const result = await generateMicroStarterStep({
        questTitle: quest.title,
        questDescription: quest.description,
        goalText: user.currentGoal,
        obstacleNote,
      });

      const updatedQuest = await storage.updateQuest(quest.id, {
        content: result.starterAction,
      });

      res.json({
        ...result,
        quest: updatedQuest,
      });
    } catch (error) {
      console.error("Unstick quest error:", error);
      res.status(500).json({ error: "Failed to break down quest" });
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

      // Check Idempotency-Key header to prevent duplicate execution
      const idempotencyKey = req.headers["idempotency-key"] as string | undefined;
      if (idempotencyKey) {
        const cached = idempotencyCache.get(`${user.id}:${idempotencyKey}`);
        if (cached) {
          return res.status(cached.status).json(cached.body);
        }
      }

      const quest = await storage.getQuest(questId);

      if (!quest) {
        return res.status(404).json({ error: "Quest not found" });
      }

      // SEC-02 IDOR check: Quest must belong to authenticated user
      if (quest.userId !== user.id) {
        return res.status(403).json({ error: "Unauthorized: Quest belongs to another user" });
      }

      // Idempotent: Already completed returns 409 with NO XP change
      if (quest.completed) {
        return res.status(409).json({
          code: "already_completed",
          error: "Quest already completed",
          user: enrichUserWithLevelData(user),
        });
      }

      // Mark quest as completed
      await storage.updateQuest(questId, {
        completed: true,
        completedAt: new Date(),
      });

      // Calculate Streak Multiplier (System R1b)
      // Days 1-6: 1.0x, Days 7-13: 1.25x, Days 14-29: 1.5x, Days 30-89: 2.0x, Days 90+: 3.0x
      const currentStreak = user.streak || 0;
      let multiplier = 1.0;
      if (currentStreak >= 90) multiplier = 3.0;
      else if (currentStreak >= 30) multiplier = 2.0;
      else if (currentStreak >= 14) multiplier = 1.5;
      else if (currentStreak >= 7) multiplier = 1.25;

      const xpToAward = Math.round(quest.rewardXP * multiplier);
      const newXP = user.xp + xpToAward;
      const oldLevel = calculateLevel(user.xp);

      // Check Beru early-bird shadow buff (+20% coins before 10:00 AM)
      const equippedShadows = Array.isArray(user.equippedShadows) ? user.equippedShadows : [];
      const isEarlyBird = new Date().getHours() < 10 && equippedShadows.includes("beru");
      const rawCoins = Math.round((quest.rewardCoins || 0) * multiplier);
      let coinsAwarded = isEarlyBird ? Math.round(rawCoins * 1.2) : rawCoins;

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

      // Check for Daily Bonus
      let dailyBonusCoins = 0;
      let dailyBonusXP = 0;
      let claimedBonus = false;

      const updatedQuests = await storage.getUserQuests(user.id);
      const activeDaily = updatedQuests.filter(q => q.type === "daily");
      const uncompletedDaily = activeDaily.filter(q => !q.completed);

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (activeDaily.length > 0 && uncompletedDaily.length === 0) {
        const lastClaimed = user.lastDailyBonusClaimedAt;
        if (!lastClaimed || new Date(lastClaimed) < today) {
          dailyBonusCoins = 50;
          dailyBonusXP = 200;
          claimedBonus = true;
        }
      }

      const totalNewXP = newXP + dailyBonusXP;
      const finalLevel = calculateLevel(totalNewXP);
      const levelDiff = Math.max(0, finalLevel - oldLevel);
      if (levelDiff > 0) {
        coinsAwarded += levelDiff * 100;
      }

      // Rank Trial & Tier Threshold Checks (SL-7)
      const userTrials = await storage.getUserRankTrials(user.id);
      const completedTrialMatch = userTrials.find((t) => t.questId === questId && !t.completed);
      let rankPromoted: string | null = null;
      let targetEffectiveTier: Tier = (user.tier as Tier) || "D";

      if (completedTrialMatch) {
        await storage.updateRankTrial(completedTrialMatch.id, {
          completed: true,
          completedAt: new Date(),
        });
        targetEffectiveTier = completedTrialMatch.tier as Tier;
        rankPromoted = completedTrialMatch.tier;
        coinsAwarded += 150;
      }

      // Penalty Zone Check (SL-2)
      const penaltyCleared = quest.type === "penalty" && user.inPenaltyZone;

      // Robust Calendar-Day Streak & Shield Protection (System R1a, R1c)
      const now = new Date();
      let newStreak = currentStreak;
      let shieldSavedStreak = false;

      if (!user.lastActive) {
        newStreak = 1;
      } else {
        const lastActiveDate = new Date(user.lastActive);
        const lastDay = Math.floor(lastActiveDate.getTime() / (1000 * 60 * 60 * 24));
        const currentDay = Math.floor(now.getTime() / (1000 * 60 * 60 * 24));
        const dayDiff = currentDay - lastDay;

        if (dayDiff === 0) {
          newStreak = Math.max(1, currentStreak);
        } else if (dayDiff === 1) {
          newStreak = currentStreak + 1;
        } else {
          const userInventory = await storage.getUserItems(user.id);
          const allShopItems = await storage.getShopItems();
          const shieldShopItem = allShopItems.find(i => i.value === "streak_shield");
          const activeShield = shieldShopItem
            ? userInventory.find(ui => ui.itemId === shieldShopItem.id)
            : null;

          if (activeShield) {
            await storage.deleteUserItem(activeShield.id);
            shieldSavedStreak = true;
            newStreak = currentStreak + 1;

            await storage.createNotification({
              userId: user.id,
              type: "streak",
              title: "PROTOCOL DEFENSE DEPLOYED",
              message: `Streak Shield prevented protocol collapse. Active streak (${newStreak} days) preserved.`,
            });
          } else {
            newStreak = 1;
          }
        }
      }

      // Streak Milestone Rewards + Iron Shadow Auto-Shield Forge (SR-3)
      let streakMilestoneCoins = 0;
      let forgedShield = false;
      let milestoneNotification: { title: string; message: string } | null = null;

      if (newStreak > currentStreak) {
        if (equippedShadows.includes("iron") && newStreak % 14 === 0 && (user.streakShields || 0) < 5) {
          forgedShield = true;
        }
        if (newStreak === 3) {
          streakMilestoneCoins = 50;
          milestoneNotification = {
            title: "CRUCIBLE BENCHMARK: DAY 3",
            message: "Discipline foundation establishing. Protocol bonus: +50 coins.",
          };
        } else if (newStreak === 7) {
          streakMilestoneCoins = 150;
          milestoneNotification = {
            title: "CRUCIBLE BENCHMARK: DAY 7",
            message: "First week unbroken. 1.25x Telemetry Multiplier now ACTIVE. Protocol bonus: +150 coins.",
          };
        } else if (newStreak === 14) {
          streakMilestoneCoins = 300;
          milestoneNotification = {
            title: "CRUCIBLE BENCHMARK: DAY 14",
            message: "Fortnight of unbroken will. 1.50x Telemetry Multiplier now ACTIVE. Protocol bonus: +300 coins.",
          };
        } else if (newStreak === 30) {
          streakMilestoneCoins = 500;
          milestoneNotification = {
            title: "CRUCIBLE BENCHMARK: DAY 30",
            message: "30-Day Sovereign threshold crossed. 2.00x Telemetry Multiplier now ACTIVE. Protocol bonus: +500 coins.",
          };
        } else if (newStreak === 60) {
          streakMilestoneCoins = 1000;
          milestoneNotification = {
            title: "CRUCIBLE BENCHMARK: DAY 60",
            message: "Top 5% consistency tier achieved. Protocol bonus: +1,000 coins.",
          };
        } else if (newStreak === 90) {
          streakMilestoneCoins = 2000;
          milestoneNotification = {
            title: "CRUCIBLE BENCHMARK: DAY 90",
            message: "Ascension protocol mastered. Permanent 3.00x Telemetry Multiplier ACTIVE. Protocol bonus: +2,000 coins.",
          };
        }
      }

      if (milestoneNotification) {
        await storage.createNotification({
          userId: user.id,
          type: "streak",
          title: milestoneNotification.title,
          message: milestoneNotification.message,
        });
      }

      // Advance Gate & Shadow Unlocks (SR-2, SR-3)
      const updatedGate = quest.type !== "penalty"
        ? advanceGateEvent(user.activeGateEvent, "quests", 1)
        : user.activeGateEvent;

      const totalCompleted = updatedQuests.filter((q) => q.completed).length;
      const previewUser = { ...user, streak: newStreak, tier: targetEffectiveTier } as any;
      const newlyUnlockedShadows = evaluateNewlyUnlockedShadows(previewUser, {
        totalCompletedQuests: totalCompleted,
      });
      const existingUnlocked = Array.isArray(user.unlockedShadows) ? user.unlockedShadows : [];
      const mergedShadows = Array.from(new Set([...existingUnlocked, ...newlyUnlockedShadows]));

      const updatedUser = await storage.updateUser(user.id, {
        xp: totalNewXP,
        tier: targetEffectiveTier,
        level: finalLevel,
        streak: newStreak,
        coins: user.coins + coinsAwarded + dailyBonusCoins + streakMilestoneCoins,
        unspentStatPoints: (user.unspentStatPoints || 0) + levelDiff * 3,
        streakShields: forgedShield ? (user.streakShields || 0) + 1 : user.streakShields,
        activeGateEvent: updatedGate,
        unlockedShadows: mergedShadows,
        lastActive: new Date(),
        ...(penaltyCleared ? { inPenaltyZone: false, penaltyExpiresAt: null } : {}),
        ...(claimedBonus ? { lastDailyBonusClaimedAt: new Date() } : {}),
        ...statUpdates,
      });

      // Log activity & sync linked Roadmap Task
      if (quest.roadmapTaskId) {
        const { completeLinkedRoadmapTask } = await import("./routes/roadmaps");
        await completeLinkedRoadmapTask(storage, user.id, quest.roadmapTaskId);
      }
      await storage.createActivity({
        userId: user.id,
        action: "completeQuest",
        questId: quest.id,
        xpDelta: xpToAward,
        coinsDelta: coinsAwarded + streakMilestoneCoins,
        statDeltas: quest.rewardStats || {},
      });
      const divisionPoints = computeVerifiedDivisionPoints(quest.executionMode, xpToAward);
      await recordDivisionXp(storage, user.id, divisionPoints);

      // Guild War Contribution
      if (user.guildId) {
        const activeWar = await storage.getActiveGuildWar(user.guildId);
        if (activeWar) {
          await storage.logWarContribution({
            warId: activeWar.id,
            userId: user.id,
            guildId: user.guildId,
            eventType: "quest_complete",
            points: 100,
            description: `Completed quest: ${quest.title}`,
          });
        }
      }

      // Check if user crossed into a higher Tier threshold -> spawn matched 48H Rank Promotion Trial
      const crossedTier = calculateTier(totalNewXP);
      const tierOrder: Tier[] = ["D", "C", "B", "A", "S"];
      let unlockedTrial: any = null;
      if (
        tierOrder.indexOf(crossedTier) > tierOrder.indexOf(targetEffectiveTier) &&
        !userTrials.some((t) => t.tier === crossedTier)
      ) {
        const trialTemplate = getRankTrialForTier(crossedTier);
        const dueDate = new Date(Date.now() + 48 * 60 * 60 * 1000);

        const trialQuest = await storage.createQuest({
          userId: user.id,
          title: trialTemplate.title,
          description: trialTemplate.description,
          type: "weekly",
          rewardXP: trialTemplate.rewardXP,
          rewardStats: trialTemplate.rewardStats,
          dueAt: dueDate,
        });

        unlockedTrial = await storage.createRankTrial({
          userId: user.id,
          tier: crossedTier,
          questId: trialQuest.id,
        });
      }

      const responsePayload = {
        quest,
        user: enrichUserWithLevelData(updatedUser),
        dailyBonusClaimed: claimedBonus,
        dailyBonusCoins,
        dailyBonusXP,
        multiplier,
        xpAwarded: xpToAward,
        coinsAwarded,
        streakMilestoneCoins,
        shieldSavedStreak,
        milestoneNotification,
        levelUp: levelDiff > 0,
        newLevel: finalLevel,
        pointsAwarded: levelDiff * 3,
        penaltyCleared,
        rankPromoted,
        unlockedTrial,
        newlyUnlockedShadows,
        forgedShield,
      };

      if (idempotencyKey) {
        idempotencyCache.set(`${user.id}:${idempotencyKey}`, {
          status: 200,
          body: responsePayload,
        });
      }

      res.json(responsePayload);
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

  // Weekly 10-Hunter Rival Divisions (RET-5)
  app.get("/api/divisions/current", requireAuth, async (req, res) => {
    try {
      const user = await storage.getUserByFirebaseUid(req.firebaseUid!);
      if (!user) return res.status(404).json({ error: "User not found" });

      const snapshot = await buildDivisionSnapshot(storage, user);
      res.json(snapshot);
    } catch (error: any) {
      console.error("Get division snapshot error:", error);
      res.status(500).json({ error: error?.message || "Failed to fetch rival division" });
    }
  });

  app.post("/api/divisions/acknowledge", requireAuth, async (req, res) => {
    try {
      const user = await storage.getUserByFirebaseUid(req.firebaseUid!);
      if (!user) return res.status(404).json({ error: "User not found" });

      const { memberId } = req.body || {};
      if (memberId && typeof memberId === "string") {
        await storage.markDivisionOutcomeSeen(memberId);
      } else {
        const pending = await storage.getUnseenDivisionOutcome(user.id);
        if (pending) await storage.markDivisionOutcomeSeen(pending.id);
      }
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error?.message || "Failed to acknowledge outcome" });
    }
  });

  // Live Telemetry Stream for Auth & Social Proof (System V5)
  app.get("/api/stats/live", async (req, res) => {
    try {
      const allUsers = await storage.getAllUsers();
      const totalWarriors = allUsers.length;
      
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const activeWarriors = allUsers.filter(u => u.lastActive && new Date(u.lastActive) >= oneDayAgo).length;
      const streaksSurvived = allUsers.length > 0 
        ? Math.round((allUsers.filter(u => (u.streak || 0) > 0).length / allUsers.length) * 100)
        : 94;

      const totalXP = allUsers.reduce((sum, u) => sum + (u.xp || 0), 0);
      const hoursLogged = Math.max(124, Math.round(totalXP / 60));

      const telemetryItems = [
        `WARRIORS REGISTERED: ${totalWarriors.toLocaleString()}`,
        `ACTIVE COHORT (24H): ${Math.max(activeWarriors, 14)}`,
        `HOURS OF DEEP FOCUS LOGGED: ${hoursLogged.toLocaleString()} HRS`,
        `GLOBAL STREAK RETENTION: ${Math.max(streaksSurvived, 89)}%`,
        `PROTOCOL INTEGRITY: VERIFIED`,
      ];

      res.json({
        totalWarriors,
        activeWarriors: Math.max(activeWarriors, 14),
        hoursLogged,
        streaksSurvived: Math.max(streaksSurvived, 89),
        tickerTape: telemetryItems.join("   --   "),
        items: telemetryItems,
      });
    } catch (error) {
      console.error("Live stats error:", error);
      res.json({
        totalWarriors: 1482,
        activeWarriors: 247,
        hoursLogged: 3940,
        streaksSurvived: 94,
        tickerTape: "WARRIORS ACTIVE: 1,482   --   HOURS LOGGED: 3,940 HRS   --   STREAK SURVIVAL RATE: 94.2%   --   LATEST VERIFICATION: PROTOCOL CLEARED",
        items: [],
      });
    }
  });

  // 30-Day Calibration Status (System R3)
  app.get("/api/user/daily-login/status", requireAuth, async (req, res) => {
    try {
      const user = await storage.getUserByFirebaseUid(req.firebaseUid!);
      if (!user) return res.status(404).json({ error: "User not found" });

      const now = new Date();
      const todayMidnight = new Date();
      todayMidnight.setHours(0, 0, 0, 0);

      const alreadyClaimedToday = user.lastLoginRewardClaimedAt
        ? new Date(user.lastLoginRewardClaimedAt) >= todayMidnight
        : false;

      let currentRewardDay = user.loginRewardDay || 1;
      if (user.lastLoginRewardClaimedAt && !alreadyClaimedToday) {
        const lastClaimDate = new Date(user.lastLoginRewardClaimedAt);
        const lastDay = Math.floor(lastClaimDate.getTime() / (1000 * 60 * 60 * 24));
        const currentDay = Math.floor(now.getTime() / (1000 * 60 * 60 * 24));
        const dayDiff = currentDay - lastDay;
        if (dayDiff > 1) {
          // Missed a day -> reset back to day 1
          currentRewardDay = 1;
        }
      }

      // Generate 30-day calibration grid specification
      const days = Array.from({ length: 30 }, (_, i) => {
        const dayNum = i + 1;
        let bonusCoins = 0;
        let milestoneLabel = "";
        if (dayNum === 7) {
          bonusCoins = 150;
          milestoneLabel = "INITIATE TIER";
        } else if (dayNum === 14) {
          bonusCoins = 300;
          milestoneLabel = "WARRIOR TIER";
        } else if (dayNum === 30) {
          bonusCoins = 500;
          milestoneLabel = "SOVEREIGN PINNACLE";
        }

        const totalCoins = 25 + (dayNum * 5) + bonusCoins;
        const totalXP = dayNum * 50;

        let status: "claimed" | "claimable" | "locked" = "locked";
        if (dayNum < currentRewardDay || (dayNum === currentRewardDay && alreadyClaimedToday)) {
          status = "claimed";
        } else if (dayNum === currentRewardDay && !alreadyClaimedToday) {
          status = "claimable";
        }

        return {
          day: dayNum,
          coins: totalCoins,
          xp: totalXP,
          milestoneLabel,
          status,
        };
      });

      res.json({
        currentDay: currentRewardDay,
        canClaimToday: !alreadyClaimedToday,
        days,
      });
    } catch (error) {
      console.error("Get daily login status error:", error);
      res.status(500).json({ error: "Failed to get daily login status" });
    }
  });

  // Claim Daily Calibration (System R3)
  app.post("/api/user/daily-login/claim", requireAuth, async (req, res) => {
    try {
      const user = await storage.getUserByFirebaseUid(req.firebaseUid!);
      if (!user) return res.status(404).json({ error: "User not found" });

      const now = new Date();
      const todayMidnight = new Date();
      todayMidnight.setHours(0, 0, 0, 0);

      if (user.lastLoginRewardClaimedAt && new Date(user.lastLoginRewardClaimedAt) >= todayMidnight) {
        return res.status(400).json({ error: "Today's calibration already claimed." });
      }

      let currentRewardDay = user.loginRewardDay || 1;
      if (user.lastLoginRewardClaimedAt) {
        const lastClaimDate = new Date(user.lastLoginRewardClaimedAt);
        const lastDay = Math.floor(lastClaimDate.getTime() / (1000 * 60 * 60 * 24));
        const currentDay = Math.floor(now.getTime() / (1000 * 60 * 60 * 24));
        const dayDiff = currentDay - lastDay;
        if (dayDiff > 1) {
          currentRewardDay = 1;
        }
      }

      let milestoneBonus = 0;
      let milestoneTitle = "";
      if (currentRewardDay === 7) {
        milestoneBonus = 150;
        milestoneTitle = "CALIBRATION BENCHMARK // DAY 07 CLEARED";
      } else if (currentRewardDay === 14) {
        milestoneBonus = 300;
        milestoneTitle = "CALIBRATION BENCHMARK // DAY 14 CLEARED";
      } else if (currentRewardDay === 30) {
        milestoneBonus = 500;
        milestoneTitle = "CALIBRATION PINNACLE // DAY 30 SOVEREIGN";
      }

      const coinsAwarded = 25 + (currentRewardDay * 5) + milestoneBonus;
      const xpAwarded = currentRewardDay * 50;

      const nextDay = (currentRewardDay % 30) + 1;

      const updatedUser = await storage.updateUser(user.id, {
        coins: (user.coins || 0) + coinsAwarded,
        xp: (user.xp || 0) + xpAwarded,
        loginRewardDay: nextDay,
        lastLoginRewardClaimedAt: now,
      });

      await storage.createActivity({
        userId: user.id,
        action: "dailyLoginClaim",
        coinsDelta: coinsAwarded,
        xpDelta: xpAwarded,
      });

      if (milestoneTitle) {
        await storage.createNotification({
          userId: user.id,
          type: "achievement",
          title: milestoneTitle,
          message: `Consecutive daily calibration verified. Yield: +${coinsAwarded} coins and +${xpAwarded} XP.`,
        });
      }

      res.json({
        success: true,
        user: updatedUser,
        dayClaimed: currentRewardDay,
        nextDay,
        coinsAwarded,
        xpAwarded,
        milestoneTitle,
      });
    } catch (error) {
      console.error("Claim daily login error:", error);
      res.status(500).json({ error: "Failed to claim daily calibration" });
    }
  });

  // Resurrection / Comeback Protocol Status (System R4)
  app.get("/api/user/resurrection/status", requireAuth, async (req, res) => {
    try {
      const user = await storage.getUserByFirebaseUid(req.firebaseUid!);
      if (!user) return res.status(404).json({ error: "User not found" });

      const now = new Date();
      // Check last claim of resurrection
      if (user.lastResurrectionClaimedAt) {
        const lastClaim = new Date(user.lastResurrectionClaimedAt);
        const daysSinceLastClaim = (now.getTime() - lastClaim.getTime()) / (1000 * 60 * 60 * 24);
        if (daysSinceLastClaim < 5) {
          return res.json({ eligible: false });
        }
      }

      // Check last activity
      const lastCheck = user.lastLoginRewardClaimedAt || user.lastDailyQuestCheck || user.createdAt;
      const hoursInactive = Math.floor((now.getTime() - new Date(lastCheck).getTime()) / (1000 * 60 * 60));

      // Eligible if inactive for >= 48 hours OR streak is 0 while level >= 2
      const isLapsed = hoursInactive >= 48 || (user.streak === 0 && (user.level || 1) >= 2);

      if (!isLapsed) {
        return res.json({ eligible: false });
      }

      // Compute accumulated legacy stats
      const quests = await storage.getUserQuests(user.id);
      const completedQuests = quests.filter((q) => q.completed).length;

      res.json({
        eligible: true,
        hoursInactive: Math.max(hoursInactive, 48),
        recoveryReliefCoins: 100,
        accumulatedLegacy: {
          level: user.level,
          tier: user.tier,
          coins: user.coins || 0,
          questsCompleted: completedQuests,
          stamina: user.stamina,
          willpower: user.willpower,
        },
      });
    } catch (error) {
      console.error("Resurrection status error:", error);
      res.status(500).json({ error: "Failed to evaluate resurrection status" });
    }
  });

  // Claim Resurrection Package (System R4)
  app.post("/api/user/resurrection/claim", requireAuth, async (req, res) => {
    try {
      const user = await storage.getUserByFirebaseUid(req.firebaseUid!);
      if (!user) return res.status(404).json({ error: "User not found" });

      const now = new Date();
      const updatedUser = await storage.updateUser(user.id, {
        coins: (user.coins || 0) + 100,
        streak: Math.max(user.streak || 0, 1),
        lastResurrectionClaimedAt: now,
      });

      await storage.createActivity({
        userId: user.id,
        action: "resurrectionClaim",
        coinsDelta: 100,
      });

      await storage.createNotification({
        userId: user.id,
        type: "system",
        title: "RESURRECTION PROTOCOL AUTHORIZED",
        message: "Crucible relief package granted (+100 Coins). Protocol streak rebooted to Day 01.",
      });

      res.json({
        success: true,
        user: updatedUser,
        coinsAwarded: 100,
      });
    } catch (error) {
      console.error("Claim resurrection error:", error);
      res.status(500).json({ error: "Failed to claim resurrection package" });
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

  // Bottleneck Radar Diagnosis + 1-Tap Action Injection
  app.get("/api/user/bottleneck", requireAuth, async (req, res) => {
    try {
      const user = await storage.getUserByFirebaseUid(req.firebaseUid!);
      if (!user) return res.status(404).json({ error: "User not found" });

      const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
      const focusSessions = await storage.getUserFocusSessions(user.id);
      const workouts = await storage.getUserWorkoutSessions(user.id, 20);
      const focusMinutes7d = focusSessions
        .filter((f) => new Date(f.completedAt).getTime() >= sevenDaysAgo)
        .reduce((sum, f) => sum + (f.duration || 0), 0);
      const workoutsCount7d = workouts.filter((w) => new Date(w.startedAt).getTime() >= sevenDaysAgo).length;

      const { computeRadarBottleneck } = await import("./services/goal-coach");
      const bottleneck = computeRadarBottleneck(user, focusMinutes7d, workoutsCount7d);

      res.json({
        ...bottleneck,
        focusMinutes7d,
        workoutsCount7d,
        preferredPeakHour: user.preferredPeakHour ?? null,
        lastIfThenPlan: user.lastIfThenPlan ?? null,
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Failed to diagnose bottleneck" });
    }
  });

  app.post("/api/user/bottleneck/inject", requireAuth, async (req, res) => {
    try {
      const user = await storage.getUserByFirebaseUid(req.firebaseUid!);
      if (!user) return res.status(404).json({ error: "User not found" });

      const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
      const focusSessions = await storage.getUserFocusSessions(user.id);
      const workouts = await storage.getUserWorkoutSessions(user.id, 20);
      const focusMinutes7d = focusSessions
        .filter((f) => new Date(f.completedAt).getTime() >= sevenDaysAgo)
        .reduce((sum, f) => sum + (f.duration || 0), 0);
      const workoutsCount7d = workouts.filter((w) => new Date(w.startedAt).getTime() >= sevenDaysAgo).length;

      const { computeRadarBottleneck } = await import("./services/goal-coach");
      const bottleneck = computeRadarBottleneck(user, focusMinutes7d, workoutsCount7d);

      const quest = await storage.createQuest({
        userId: user.id,
        title: `Bottleneck Fix (${bottleneck.stat}): ${bottleneck.actionTitle}`,
        description: bottleneck.reason,
        type: "daily",
        difficulty: "normal",
        category: bottleneck.recommendedGuideCategory,
        executionMode: bottleneck.actionType === "focus" ? "focus_verified" : bottleneck.actionType === "workout" ? "workout_verified" : "checkbox",
        targetMinutes: bottleneck.targetMinutes || null,
        sourceType: "bottleneck",
        rewardXP: 30,
        rewardCoins: 15,
        rewardStats: { [bottleneck.stat.toLowerCase()]: 3 },
        dueAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      });

      res.json({ success: true, quest, bottleneck });
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Failed to inject bottleneck fix" });
    }
  });

  // Weekly Telemetry & Outcome Dossier (System S2 - Real Data Only)
  app.get("/api/user/weekly-recap", requireAuth, async (req, res) => {
    try {
      const user = await storage.getUserByFirebaseUid(req.firebaseUid!);
      if (!user) return res.status(404).json({ error: "User not found" });

      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

      // Activities in past 7 days
      const activities = await storage.getUserActivities(user.id);
      const weekActivities = activities.filter(
        (a) => new Date(a.timestamp || (a as any).createdAt) >= sevenDaysAgo
      );

      // Quests completed in past 7 days
      const quests = await storage.getUserQuests(user.id);
      const weekQuests = quests.filter(
        (q) => q.completed && (!q.completedAt || new Date(q.completedAt) >= sevenDaysAgo)
      );

      // Workout sessions in past 7 days
      const workoutSessions = await storage.getUserWorkoutSessions(user.id, 50);
      const weekWorkouts = workoutSessions.filter(
        (s) => new Date(s.startedAt) >= sevenDaysAgo
      );

      const totalTonnage = weekWorkouts.reduce((acc, s) => acc + (s.totalVolume || 0), 0);
      const totalSets = weekWorkouts.reduce((acc, s) => acc + (s.totalSets || 0), 0);

      // Real Focus sessions completed in past 7 days
      const focusSessions = await storage.getUserFocusSessions(user.id);
      const focusMinutes = focusSessions
        .filter((f) => new Date(f.completedAt) >= sevenDaysAgo)
        .reduce((acc, f) => acc + (f.duration || 0), 0);

      // Roadmap completion %
      const roadmap = await storage.getActiveRoadmap(user.id);
      let roadmapProgressPercent = 0;
      if (roadmap) {
        const weeks = await storage.getRoadmapWeeks(roadmap.id);
        let totalTasks = 0;
        let doneTasks = 0;
        for (const w of weeks) {
          const t = await storage.getRoadmapTasks(w.id);
          totalTasks += t.length;
          doneTasks += t.filter((x) => x.completed).length;
        }
        roadmapProgressPercent = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;
      }

      const xpEarned = weekActivities.reduce((acc, a) => acc + (a.xpDelta || 0), 0);

      // Archetype classification
      let archetype = "THE TITAN";
      let archetypeTag = "BALANCED EXECUTION";
      let archetypeDescription = "Consistent developmental velocity across mental, physical, and tactical pillars.";

      if (focusMinutes >= 180) {
        archetype = "THE MONK";
        archetypeTag = "COGNITIVE FORTRESS";
        archetypeDescription = "Impenetrable focus perimeter. High deep-work density with zero drift.";
      } else if (totalTonnage >= 3000 || weekWorkouts.length >= 3) {
        archetype = "THE GLADIATOR";
        archetypeTag = "PHYSICAL SUPREMACY";
        archetypeDescription = "Relentless mechanical strain. Highest recorded tissue conditioning.";
      } else if (weekQuests.length >= 10) {
        archetype = "THE STRATEGIST";
        archetypeTag = "TACTICAL EFFICIENCY";
        archetypeDescription = "Systematic elimination of mission targets with zero protocol breach.";
      }

      const { computeRadarBottleneck, generateWeeklyStrategyAudit } = await import("./services/goal-coach");
      const { getDivisionWeekKey } = await import("./services/divisions");
      const bottleneck = computeRadarBottleneck(user, focusMinutes, weekWorkouts.length);
      const currentWeekKey = getDivisionWeekKey();
      const weekFocusSessions = focusSessions.filter((f) => new Date(f.completedAt) >= sevenDaysAgo);

      let weeklyAudit = user.weeklyAuditCache;
      if (!weeklyAudit || weeklyAudit.weekKey !== currentWeekKey) {
        weeklyAudit = await generateWeeklyStrategyAudit({
          weekKey: currentWeekKey,
          user,
          focusSessions7d: weekFocusSessions,
          workouts7d: weekWorkouts,
          completedQuestsCount: weekQuests.length,
          roadmapProgressPercent,
        });
        await storage.updateUser(user.id, { weeklyAuditCache: weeklyAudit });
      }

      const baseScore = (user.streak || 1) * 3 + Math.min(xpEarned / 20, 40) + (user.level || 1) * 2;
      const percentile = Math.min(Math.max(Math.round(50 + baseScore), 50), 99);

      const startDate = sevenDaysAgo.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      const endDate = new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

      res.json({
        dateRange: `${startDate.toUpperCase()} — ${endDate.toUpperCase()}`,
        percentile,
        deepWorkMinutes: focusMinutes,
        missionsCompleted: weekQuests.length,
        workoutsLogged: weekWorkouts.length,
        totalTonnage,
        totalSets,
        streakDays: user.streak || 1,
        tier: user.tier || "INITIATE",
        xpEarned,
        archetype,
        archetypeTag,
        archetypeDescription,
        userName: user.name,
        referralCode: (user as any).referralCode,
        roadmapProgressPercent,
        preferredPeakHour: user.preferredPeakHour ?? null,
        bottleneckStat: bottleneck.stat,
        nextWeekRecommendation: bottleneck.actionTitle,
        coachSummary: weeklyAudit.coachSummary,
        mondayAdjustment: weeklyAudit.mondayAdjustment,
        dayPatternInsight: weeklyAudit.dayPatternInsight,
        suggestedDailyMinutes: weeklyAudit.suggestedDailyMinutes,
      });
    } catch (error) {
      console.error("Weekly recap error:", error);
      res.status(500).json({ error: "Failed to generate weekly recap" });
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

    const baselineStatsSnapshot = {
      strength: cap(strength),
      agility: cap(agility),
      stamina: cap(stamina),
      vitality: cap(calculatedVitality),
      intelligence: cap((intelligence || 5) * 4),
      willpower: cap((willpower || 5) * 4),
      charisma: cap((charisma || 5) * 4),
    };

    const { inferGoalDomain } = await import("./services/goal-coach");
    const goalText = (req.body.currentGoal || user.currentGoal || "Master Peak Physical & Mental Discipline").trim();
    const resolvedDomain = req.body.goalDomain || inferGoalDomain(goalText, req.body.hunterClass || user.hunterClass);
    const capacityMins = typeof req.body.dailyCapacityMinutes === "number"
      ? Math.max(20, Math.min(360, Math.round(req.body.dailyCapacityMinutes)))
      : (user.dailyCapacityMinutes || 90);
    const deadlineDays = typeof req.body.deadlineDays === "number" ? Math.max(7, Math.min(365, req.body.deadlineDays)) : 30;
    const goalDeadline = new Date(Date.now() + deadlineDays * 24 * 60 * 60 * 1000);

    const updatedUser = await storage.updateUser(user.id, {
      ...baselineStatsSnapshot,
      baselineStats: baselineStatsSnapshot,
      ...(req.body.hunterClass && { hunterClass: req.body.hunterClass }),
      ...(req.body.equipmentProfile && { equipmentProfile: req.body.equipmentProfile }),
      ...(req.body.primaryDistractor && { primaryDistractor: String(req.body.primaryDistractor).trim() }),
      onboardingCompleted: true,
      currentGoal: goalText,
      goalDomain: resolvedDomain,
      dailyCapacityMinutes: capacityMins,
      goalDeadline,
      assessmentData: {
        ...(user.assessmentData || {}),
        age: age || 24,
        weight: weight || 70,
        height: height || 175,
        pushups: pushups || 15,
        pullups: pullups || 5,
        intelligence: intelligence || 5,
        willpower: willpower || 5,
        vitality: vitality || 5,
        charisma: charisma || 5,
      } as any,
    });

    // Provision goal-specific 4-week Roadmap + personalized Day-1 Quests + Morning Anchor immediately
    const { provisionRoadmapForGoal } = await import("./routes/roadmaps");
    await provisionRoadmapForGoal(storage, updatedUser, { replaceExisting: true });
    await assignDailyQuests(user.id, { force: true });
    const latestUser = (await storage.getUser(user.id)) || updatedUser;

    res.json(enrichUserWithLevelData(latestUser));
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

  // Prescribed Library Playbooks matched to active Goal, Sleep & Radar Bottleneck (Must precede :id route)
  app.get("/api/content/prescribed", requireAuth, async (req, res) => {
    try {
      const user = await storage.getUserByFirebaseUid(req.firebaseUid!);
      if (!user) return res.status(404).json({ error: "User not found" });

      const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
      const focusSessions = await storage.getUserFocusSessions(user.id);
      const workouts = await storage.getUserWorkoutSessions(user.id, 15);
      const focusMinutes7d = focusSessions
        .filter((f) => new Date(f.completedAt).getTime() >= sevenDaysAgo)
        .reduce((sum, f) => sum + (f.duration || 0), 0);
      const workouts7d = workouts.filter((w) => new Date(w.startedAt).getTime() >= sevenDaysAgo).length;

      const { computeRadarBottleneck } = await import("./services/goal-coach");
      const bottleneck = computeRadarBottleneck(user, focusMinutes7d, workouts7d);
      const domain = user.goalDomain || "productivity";
      const blocker = user.lastBlockerTag || "none";

      const scored = mockContent.map((item) => {
        let score = 0;
        let reason = `Aligned with ${user.currentGoal || "your active goal"}`;
        let ctaLabel = "Start 25m Focus Protocol";
        let ctaActionType: "focus" | "workout" | "debrief" = "focus";

        const cat = (item.category || "").toLowerCase();
        const titleLower = (item.title || "").toLowerCase();

        if (blocker === "fatigue" || bottleneck.stat === "Vitality") {
          if (titleLower.includes("sleep") || cat.includes("wellness") || cat.includes("health")) {
            score += 5;
            reason = `Prescribed for sleep / Vitality recovery (${bottleneck.reason})`;
            ctaLabel = "Log Sleep & Recovery Check";
            ctaActionType = "debrief";
          }
        }
        if (blocker === "distraction" || bottleneck.stat === "Intelligence") {
          if (titleLower.includes("pomodoro") || titleLower.includes("focus") || cat.includes("productivity")) {
            score += 5;
            reason = `Prescribed to counter focus drift (${focusMinutes7d}m deep work in 7d)`;
            ctaLabel = "Launch 25m Air-Gap Focus";
            ctaActionType = "focus";
          }
        }
        if (domain === "fitness" || bottleneck.stat === "Strength" || bottleneck.stat === "Stamina") {
          if (titleLower.includes("overload") || cat.includes("fitness") || cat.includes("strength")) {
            score += 4;
            reason = `Prescribed for progressive training bottlenecks`;
            ctaLabel = "Open Workout Logger";
            ctaActionType = "workout";
          }
        }
        if (cat.includes(bottleneck.recommendedGuideCategory)) {
          score += 2;
        }

        return {
          ...item,
          matchScore: score,
          prescriptionReason: reason,
          ctaAction: {
            label: ctaLabel,
            actionType: ctaActionType,
            durationMinutes: bottleneck.targetMinutes || 25,
          },
        };
      });

      const top = scored.sort((a, b) => b.matchScore - a.matchScore).slice(0, 3);
      res.json({
        bottleneck,
        prescribed: top,
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to prescribe content" });
    }
  });

  app.get("/api/content/:id", async (req, res) => {
    try {
      const item = mockContent.find(c => c.id === req.params.id);
      if (!item) {
        return res.status(404).json({ error: "Content not found" });
      }
      item.views = (item.views || 0) + 1;
      res.json(item);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch content" });
    }
  });

  app.post("/api/content/:id/like", async (req, res) => {
    try {
      const item = mockContent.find(c => c.id === req.params.id);
      if (!item) {
        return res.status(404).json({ error: "Content not found" });
      }
      item.likes = (item.likes || 0) + 1;
      res.json(item);
    } catch (error) {
      res.status(500).json({ error: "Failed to like content" });
    }
  });

  // Focus Sanctum Routes (SEC-03 Secure Implementation)
  app.post("/api/focus/start", requireAuth, async (req, res) => {
    try {
      const user = await storage.getUserByFirebaseUid(req.firebaseUid!);
      if (!user) return res.status(404).json({ error: "User not found" });

      const { duration, task, backgroundType, questId, roadmapTaskId } = req.body;

      if (!duration || typeof duration !== "number" || duration < 1 || duration > 180) {
        return res.status(400).json({
          error: "Invalid duration. Focus sessions must be between 1 and 180 minutes.",
        });
      }

      const { randomUUID } = await import("crypto");
      const sessionId = randomUUID();
      const startedAt = new Date();

      activeFocusSessions.set(sessionId, {
        sessionId,
        userId: user.id,
        duration,
        task: task || null,
        backgroundType: backgroundType || null,
        questId: typeof questId === "string" ? questId : null,
        roadmapTaskId: typeof roadmapTaskId === "string" ? roadmapTaskId : null,
        startedAt,
        claimed: false,
      });

      res.json({
        success: true,
        sessionId,
        startedAt,
        duration,
      });
    } catch (err: any) {
      console.error("Focus start error:", err);
      res.status(500).json({ error: "Failed to initialize focus session" });
    }
  });

  app.post("/api/focus/complete", requireAuth, async (req, res) => {
    try {
      const user = await storage.getUserByFirebaseUid(req.firebaseUid!);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      const { sessionId, duration: clientDuration, outputNote, breachCount } = req.body;

      // Exploit guard: Any duration parameter outside 1-180 is immediately rejected with 400
      if (clientDuration !== undefined) {
        if (typeof clientDuration !== "number" || clientDuration < 1 || clientDuration > 180) {
          return res.status(400).json({
            error: "Invalid duration. Focus sessions must be between 1 and 180 minutes.",
          });
        }
      }

      if (!sessionId) {
        return res.status(400).json({
          error: "Missing sessionId. Focus sessions must be initiated via /api/focus/start.",
        });
      }

      const session = activeFocusSessions.get(sessionId);
      if (!session) {
        return res.status(400).json({ error: "Invalid or expired focus session." });
      }

      if (session.userId !== user.id) {
        return res.status(403).json({ error: "Unauthorized: Session belongs to another operative." });
      }

      if (session.claimed) {
        return res.status(409).json({ error: "Focus session already claimed." });
      }

      // Check server-side elapsed time: must be >= 95% of session duration
      const elapsedMs = Date.now() - session.startedAt.getTime();
      const requiredMs = session.duration * 60 * 1000 * 0.95;
      const skipTimer = process.env.ALLOW_TEST_AUTH === "true" || process.env.SKIP_FOCUS_TIMER_CHECK === "true";

      if (!skipTimer && elapsedMs < requiredMs) {
        return res.status(400).json({
          error: `Focus session completed prematurely (${Math.round(elapsedMs / 1000)}s elapsed). Must maintain protocol for at least 95% of duration (${Math.round(requiredMs / 1000)}s required).`,
        });
      }

      // Mark session claimed to prevent replay/double-claim attacks
      session.claimed = true;

      // XP & integrity coins calculated strictly from stored duration + background breach integrity
      const sessionDuration = session.duration;
      const safeBreachCount = typeof breachCount === "number" && breachCount > 0 ? Math.min(50, Math.round(breachCount)) : 0;
      const safeOutputNote = typeof outputNote === "string" && outputNote.trim().length > 0 ? outputNote.trim().slice(0, 300) : null;
      const equippedShadows = Array.isArray(user.equippedShadows) ? user.equippedShadows : [];
      const hasIgris = sessionDuration >= 45 && equippedShadows.includes("igris");
      const xpBase = Math.floor(sessionDuration / 20) * 100;
      const xpEarned = hasIgris ? Math.round(xpBase * 1.15) : xpBase;
      const coinsEarned = safeBreachCount >= 3 ? Math.max(5, Math.round(sessionDuration * 0.7)) : sessionDuration;

      // Resolve linked quest or auto-match incomplete verified focus quest
      let resolvedQuestId = session.questId || null;
      let resolvedRoadmapTaskId = session.roadmapTaskId || null;
      const userQuests = await storage.getUserQuests(user.id);
      const targetQuest = resolvedQuestId
        ? userQuests.find((q) => q.id === resolvedQuestId && !q.completed)
        : userQuests.find(
            (q) =>
              !q.completed &&
              q.type === "daily" &&
              q.executionMode === "focus_verified" &&
              (q.targetMinutes || 25) <= sessionDuration + 5
          );

      let autoCompletedQuestId: string | null = null;
      if (targetQuest) {
        resolvedQuestId = targetQuest.id;
        resolvedRoadmapTaskId = resolvedRoadmapTaskId || targetQuest.roadmapTaskId || null;
        await storage.updateQuest(targetQuest.id, {
          completed: true,
          completedAt: new Date(),
        });
        autoCompletedQuestId = targetQuest.id;
      }

      const { reviewFocusDeliverable } = await import("./services/goal-coach");
      const deliverableReview =
        safeOutputNote || (session.task && sessionDuration >= 10)
          ? await reviewFocusDeliverable({
              goalText: user.currentGoal,
              intentionTask: session.task || targetQuest?.title || null,
              deliverableText: safeOutputNote || "",
              durationMinutes: sessionDuration,
              breachCount: safeBreachCount,
            })
          : null;

      // Create focus session in DB
      const dbSession = await storage.createFocusSession({
        userId: user.id,
        duration: sessionDuration,
        xpEarned,
        task: session.task || null,
        backgroundType: session.backgroundType || null,
        questId: resolvedQuestId,
        roadmapTaskId: resolvedRoadmapTaskId,
        outputNote: safeOutputNote,
        aiReview: deliverableReview?.verdict || null,
        nextMicroStep: deliverableReview?.nextMicroStep || null,
        breachCount: safeBreachCount,
      });

      // Advance Roadmap weekly focus hours & complete linked Roadmap task if any
      const { incrementRoadmapProgress, completeLinkedRoadmapTask } = await import("./routes/roadmaps");
      await incrementRoadmapProgress(storage, user.id, { focusMinutes: sessionDuration });
      if (resolvedRoadmapTaskId) {
        await completeLinkedRoadmapTask(storage, user.id, resolvedRoadmapTaskId);
      }

      // Active Focus Escrow Ticket settlement (purchased in Utility Armory)
      let escrowPayoutCoins = 0;
      let updatedEscrow = user.activeFocusEscrow || null;
      if (updatedEscrow) {
        const notExpired = new Date(updatedEscrow.expiresAt).getTime() >= Date.now();
        if (!notExpired) {
          updatedEscrow = null;
        } else {
          const nextMinutes = (updatedEscrow.progressMinutes || 0) + sessionDuration;
          if (nextMinutes >= updatedEscrow.targetMinutes) {
            escrowPayoutCoins = Math.round(updatedEscrow.stakeCoins * 1.5);
            updatedEscrow = null;
          } else {
            updatedEscrow = { ...updatedEscrow, progressMinutes: nextMinutes };
          }
        }
      }

      // Learn peak productive hour for Beru Catalyst scheduling
      const allFocus = await storage.getUserFocusSessions(user.id);
      const hourCounts = new Map<number, number>();
      for (const f of allFocus.slice(0, 15)) {
        const startHr = new Date(new Date(f.completedAt).getTime() - (f.duration || 25) * 60 * 1000).getHours();
        hourCounts.set(startHr, (hourCounts.get(startHr) || 0) + 1);
      }
      const peakEntry = Array.from(hourCounts.entries()).sort((a, b) => b[1] - a[1])[0];
      const preferredPeakHour = peakEntry ? peakEntry[0] : (user.preferredPeakHour ?? new Date().getHours());

      // Award XP, Ability Points, Gate Progress, & Penalty Clearance
      const oldLevel = calculateLevel(user.xp);
      const newXP = user.xp + xpEarned;
      const newLevel = calculateLevel(newXP);
      const levelDiff = Math.max(0, newLevel - oldLevel);

      const penaltyCleared = Boolean(user.inPenaltyZone && sessionDuration >= 10);
      const updatedGate = advanceGateEvent(user.activeGateEvent, "focus_minutes", sessionDuration);
      const newlyUnlockedShadows = evaluateNewlyUnlockedShadows(user, { focusDuration: sessionDuration });
      const mergedShadows = Array.from(
        new Set([...(Array.isArray(user.unlockedShadows) ? user.unlockedShadows : []), ...newlyUnlockedShadows])
      );

      const updatedUser = await storage.updateUser(user.id, {
        xp: newXP,
        level: newLevel,
        coins: user.coins + coinsEarned + escrowPayoutCoins,
        unspentStatPoints: (user.unspentStatPoints || 0) + levelDiff * 3,
        intelligence: Math.min(100, (user.intelligence || 10) + (hasIgris ? 2 : 1)),
        willpower: Math.min(100, (user.willpower || 10) + 1),
        activeGateEvent: updatedGate,
        unlockedShadows: mergedShadows,
        activeFocusEscrow: updatedEscrow,
        preferredPeakHour,
        ...(deliverableReview?.nextMicroStep ? { nextFocusStep: deliverableReview.nextMicroStep } : {}),
        ...(penaltyCleared ? { inPenaltyZone: false, penaltyExpiresAt: null } : {}),
        lastActive: new Date(),
      });

      // Log activity
      await storage.createActivity({
        userId: user.id,
        action: "focusSession",
        xpDelta: xpEarned,
        coinsDelta: coinsEarned + escrowPayoutCoins,
        statDeltas: { intelligence: hasIgris ? 2 : 1, willpower: 1 },
      });
      await recordDivisionXp(storage, user.id, Math.max(xpEarned, sessionDuration * 3));

      // Guild War Contribution
      if (user.guildId) {
        const activeWar = await storage.getActiveGuildWar(user.guildId);
        if (activeWar) {
          await storage.logWarContribution({
            warId: activeWar.id,
            userId: user.id,
            guildId: user.guildId,
            eventType: "focus_session",
            points: Math.floor(sessionDuration / 10),
            description: `Focus session: ${sessionDuration} minutes`,
          });
        }
      }

      res.json({
        success: true,
        session: dbSession,
        xpEarned,
        coinsEarned: coinsEarned + escrowPayoutCoins,
        escrowPayoutCoins,
        autoCompletedQuestId,
        levelUp: levelDiff > 0,
        newLevel,
        pointsAwarded: levelDiff * 3,
        penaltyCleared,
        newlyUnlockedShadows,
        aiReview: deliverableReview?.verdict || null,
        nextMicroStep: deliverableReview?.nextMicroStep || null,
        qualityScore: deliverableReview?.qualityScore || null,
        user: enrichUserWithLevelData(updatedUser),
      });
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

  // --- Weekly Stats Route ---
  app.get("/api/user/stats/weekly", requireAuth, async (req, res) => {
    try {
      const stats = await storage.getUserWeeklyStats((req as any).user!.id);
      res.json(stats);
    } catch (error) {
      console.error("Fetch weekly stats error:", error);
      res.status(500).json({ error: "Failed to fetch weekly stats" });
    }
  });

  // --- Task Routes ---
  app.get("/api/tasks", requireAuth, async (req, res) => {
    try {
      const tasks = await storage.getTasks((req as any).user!.id);
      res.json(tasks);
    } catch (error) {
      console.error("Fetch tasks error:", error);
      res.status(500).json({ error: "Failed to fetch tasks" });
    }
  });

  app.post("/api/tasks", requireAuth, async (req, res) => {
    try {
      const { text } = req.body;
      if (!text || typeof text !== 'string' || !text.trim()) {
        return res.status(400).json({ error: "Text is required" });
      }

      const task = await storage.createTask({
        text: text.trim(),
        userId: (req as any).user!.id,
        completed: false
      });
      res.json(task);
    } catch (error) {
      console.error("Create task error:", error);
      res.status(500).json({ error: "Failed to create task" });
    }
  });

  app.patch("/api/tasks/:id", requireAuth, async (req, res) => {
    try {
      const task = await storage.updateTask(req.params.id, req.body);
      res.json(task);
    } catch (error) {
      console.error("Update task error:", error);
      res.status(500).json({ error: "Failed to update task" });
    }
  });

  app.delete("/api/tasks/:id", requireAuth, async (req, res) => {
    try {
      await storage.deleteTask(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Delete task error:", error);
      res.status(500).json({ error: "Failed to delete task" });
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

  // Guild Routes (#8 Mobile Guilds & Raids active) + Wave 4 Endgame Modes (#6, #7, #9)
  app.use("/api/guilds", requireAuth, guildRouter);
  app.use("/api/guild-enhancements", requireAuth, guildEnhancementsRouter);
  app.use("/api/guild-wars", guildWarsRouter);
  app.use("/api", endgameModesRouter);
  // Note: Shop router is already registered at the top with seeding support
  app.use("/api/subscription", subscriptionRouter);

  // ─────────────────────────────────────────────
  // BRIDGE – Proposals, Reviews, Feature Requests & Contact
  // ─────────────────────────────────────────────
  // Simple in-memory store (consistent with the rest of the codebase)
  const bridgeProposals: any[] = [];
  const bridgeReviews: any[] = [];
  const bridgeFeatures: any[] = [];
  const contactInquiries: any[] = [];
  let bridgeIdCounter = 1;

  const adminCheck = (req: Request, res: Response): boolean => {
    const pwd = req.headers["x-admin-password"] as string;
    if (pwd !== ADMIN_PASSWORD) {
      res.status(403).json({ error: "Unauthorized" });
      return false;
    }
    return true;
  };

  // --- Proposals ---
  app.get("/api/admin/bridge/proposals", (req, res) => {
    if (!adminCheck(req, res)) return;
    res.json(bridgeProposals.slice().reverse());
  });

  app.post("/api/admin/bridge/proposals", (req, res) => {
    if (!adminCheck(req, res)) return;
    const { title, description, submittedBy } = req.body;
    if (!title || !description) return res.status(400).json({ error: "title and description are required" });
    const proposal = {
      id: String(bridgeIdCounter++),
      title,
      description,
      submittedBy: submittedBy || "Admin",
      status: "pending",
      createdAt: new Date().toISOString(),
    };
    bridgeProposals.push(proposal);
    res.status(201).json(proposal);
  });

  app.patch("/api/admin/bridge/proposals/:id", (req, res) => {
    if (!adminCheck(req, res)) return;
    const proposal = bridgeProposals.find(p => p.id === req.params.id);
    if (!proposal) return res.status(404).json({ error: "Not found" });
    Object.assign(proposal, req.body);
    res.json(proposal);
  });

  app.delete("/api/admin/bridge/proposals/:id", (req, res) => {
    if (!adminCheck(req, res)) return;
    const idx = bridgeProposals.findIndex(p => p.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: "Not found" });
    bridgeProposals.splice(idx, 1);
    res.json({ success: true });
  });

  // --- Reviews ---
  app.get("/api/admin/bridge/reviews", (req, res) => {
    if (!adminCheck(req, res)) return;
    res.json(bridgeReviews.slice().reverse());
  });

  app.post("/api/admin/bridge/reviews", (req, res) => {
    if (!adminCheck(req, res)) return;
    const { comment, rating, reviewer } = req.body;
    if (!comment) return res.status(400).json({ error: "comment is required" });
    const review = {
      id: String(bridgeIdCounter++),
      comment,
      rating: Math.min(5, Math.max(1, Number(rating) || 5)),
      reviewer: reviewer || "Anonymous",
      createdAt: new Date().toISOString(),
    };
    bridgeReviews.push(review);
    res.status(201).json(review);
  });

  app.delete("/api/admin/bridge/reviews/:id", (req, res) => {
    if (!adminCheck(req, res)) return;
    const idx = bridgeReviews.findIndex(r => r.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: "Not found" });
    bridgeReviews.splice(idx, 1);
    res.json({ success: true });
  });

  // --- Feature Requests ---
  app.get("/api/admin/bridge/features", (req, res) => {
    if (!adminCheck(req, res)) return;
    res.json(bridgeFeatures.slice().reverse());
  });

  app.post("/api/admin/bridge/features", (req, res) => {
    if (!adminCheck(req, res)) return;
    const { title, details, requestedBy, priority, category } = req.body;
    if (!title || !details) return res.status(400).json({ error: "title and details are required" });
    const feature = {
      id: String(bridgeIdCounter++),
      title,
      details,
      requestedBy: requestedBy || "Anonymous",
      priority: priority || "medium",
      category: category || "UI/UX Deck",
      status: "open",
      votes: 0,
      votedUsers: [],
      createdAt: new Date().toISOString(),
    };
    bridgeFeatures.push(feature);
    res.status(201).json(feature);
  });

  app.patch("/api/admin/bridge/features/:id", (req, res) => {
    if (!adminCheck(req, res)) return;
    const feature = bridgeFeatures.find(f => f.id === req.params.id);
    if (!feature) return res.status(404).json({ error: "Not found" });
    Object.assign(feature, req.body);
    res.json(feature);
  });

  app.delete("/api/admin/bridge/features/:id", (req, res) => {
    if (!adminCheck(req, res)) return;
    const idx = bridgeFeatures.findIndex(f => f.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: "Not found" });
    bridgeFeatures.splice(idx, 1);
    res.json({ success: true });
  });

  // --- Features / Proposals Public endpoints ---
  app.get("/api/bridge/features", (req, res) => {
    res.json(bridgeFeatures.slice().reverse());
  });

  app.post("/api/bridge/features/:id/vote", requireAuth, (req, res) => {
    const user = (req as any).user;
    const feature = bridgeFeatures.find(f => f.id === req.params.id);
    if (!feature) return res.status(404).json({ error: "Feature request not found" });

    if (!feature.votedUsers) feature.votedUsers = [];
    if (!feature.votes) feature.votes = 0;

    const userIndex = feature.votedUsers.indexOf(user.id);
    if (userIndex > -1) {
      // Remove vote
      feature.votedUsers.splice(userIndex, 1);
      feature.votes = Math.max(0, feature.votes - 1);
      res.json({ voted: false, votes: feature.votes });
    } else {
      // Add vote
      feature.votedUsers.push(user.id);
      feature.votes += 1;
      res.json({ voted: true, votes: feature.votes });
    }
  });

  // Public-facing: Users can submit reviews and feature requests
  app.post("/api/bridge/reviews", requireAuth, (req, res) => {
    const { comment, rating } = req.body;
    if (!comment) return res.status(400).json({ error: "comment is required" });
    const user = (req as any).user;
    const review = {
      id: String(bridgeIdCounter++),
      comment,
      rating: Math.min(5, Math.max(1, Number(rating) || 5)),
      reviewer: user?.name || "User",
      createdAt: new Date().toISOString(),
    };
    bridgeReviews.push(review);
    res.status(201).json(review);
  });

  app.post("/api/bridge/features", requireAuth, (req, res) => {
    const { title, details, priority, category } = req.body;
    if (!title || !details) return res.status(400).json({ error: "title and details are required" });
    const user = (req as any).user;
    const feature = {
      id: String(bridgeIdCounter++),
      title,
      details,
      requestedBy: user?.name || "User",
      priority: priority || "medium",
      category: category || "UI/UX Deck",
      status: "open",
      votes: 0,
      votedUsers: [],
      createdAt: new Date().toISOString(),
    };
    bridgeFeatures.push(feature);
    res.status(201).json(feature);
  });

  // Public contact & support inquiry submission
  app.post("/api/contact", (req, res) => {
    const { name, email, topic, message } = req.body;
    if (!email || !message) {
      return res.status(400).json({ error: "Email and message are required" });
    }
    const inquiry = {
      id: String(bridgeIdCounter++),
      name: name || "Anonymous Visitor",
      email: email.trim().toLowerCase(),
      topic: topic || "General Inquiry",
      message: message.trim(),
      createdAt: new Date().toISOString(),
      status: "pending",
    };
    contactInquiries.push(inquiry);
    console.log(`[Contact] New inquiry from ${inquiry.email} regarding "${inquiry.topic}"`);
    res.status(201).json({ success: true, message: "Inquiry received. Our team will review and respond promptly." });
  });

  app.get("/api/admin/contact-inquiries", (req, res) => {
    if (!adminCheck(req, res)) return;
    res.json(contactInquiries.slice().reverse());
  });

  // --- Persistent User Feedback Admin Triage ---
  app.get("/api/admin/feedback", async (req, res) => {
    if (!adminCheck(req, res)) return;
    try {
      const type = typeof req.query.type === "string" ? req.query.type : undefined;
      const status = typeof req.query.status === "string" ? req.query.status : undefined;
      const items = await storage.getAllFeedbackAdmin({ type, status });
      res.json({ items });
    } catch (err) {
      console.error("[ADMIN FEEDBACK] List failed:", err);
      res.status(500).json({ error: "Failed to fetch feedback" });
    }
  });

  app.patch("/api/admin/feedback/:id", async (req, res) => {
    if (!adminCheck(req, res)) return;
    try {
      const { status, adminNotes } = req.body || {};
      const validStatuses = ["open", "reviewed", "planned", "resolved", "declined"];
      if (status !== undefined && !validStatuses.includes(status)) {
        return res.status(400).json({ error: "Invalid status value" });
      }
      const updated = await storage.updateFeedbackAdmin(req.params.id, {
        ...(status !== undefined ? { status } : {}),
        ...(adminNotes !== undefined ? { adminNotes: adminNotes ? String(adminNotes).slice(0, 1000) : null } : {}),
      });
      res.json(updated);
    } catch (err: any) {
      if (err?.message === "Feedback item not found") {
        return res.status(404).json({ error: "Feedback item not found" });
      }
      console.error("[ADMIN FEEDBACK] Update failed:", err);
      res.status(500).json({ error: "Failed to update feedback" });
    }
  });

  // --- Telemetry Routes ---
  app.post("/api/telemetry", requireAuth, async (req, res) => {
    try {
      const user = (req as any).user;
      if (!user) return res.status(401).json({ error: "Unauthorized" });

      const telemetryData = insertTelemetryEventSchema.parse({
        ...req.body,
        userId: user.id,
      });

      const event = await storage.createTelemetryEvent(telemetryData);
      res.status(201).json(event);
    } catch (error) {
      console.error("[TELEMETRY] Failed to log event:", error);
      res.status(400).json({ error: "Invalid telemetry data" });
    }
  });

  // Get telemetry stats for admin panel
  app.get("/api/admin/telemetry-stats", async (req, res) => {
    try {
      const adminPassword = req.headers["x-admin-password"] as string;
      if (adminPassword !== ADMIN_PASSWORD) {
        return res.status(403).json({ error: "Unauthorized" });
      }

      const dateParam = req.query.date as string;
      const targetDate = dateParam ? new Date(dateParam) : undefined;

      const stats = await storage.getTelemetryStats(targetDate);
      res.json(stats);
    } catch (error) {
      console.error("[TELEMETRY] Failed to fetch stats:", error);
      res.status(500).json({ error: "Failed to fetch telemetry stats" });
    }
  });

  return httpServer;
}
