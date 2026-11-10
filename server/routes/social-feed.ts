import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { getStorage } from "../storage";
import { randomUUID } from "crypto";

const router = Router();

// Track endorsements in memory: activityId -> Set of userIds who endorsed
const activityEndorsements = new Map<string, Set<string>>();

// Initial seed activities to guarantee telemetry stream is rich even during cold starts
const DEFAULT_SEED_TELEMETRY = [
  {
    id: "seed-act-1",
    userId: "system-op-1",
    operatorName: "Marcus Vance",
    operatorTier: "S",
    actionType: "air_gap",
    title: "Air-Gap Protocol Completed",
    telemetry: "120 min unbroken session • 0 tab switches • 98% density",
    xpDelta: 240,
    timestamp: new Date(Date.now() - 4 * 60 * 1000).toISOString(),
    initialEndorsements: 14,
  },
  {
    id: "seed-act-2",
    userId: "system-op-2",
    operatorName: "Elena Rostova",
    operatorTier: "A",
    actionType: "streak",
    title: "Defiance Streak Calibrated",
    telemetry: "30 consecutive days verified • Streak Shield armed",
    xpDelta: 500,
    timestamp: new Date(Date.now() - 18 * 60 * 1000).toISOString(),
    initialEndorsements: 29,
  },
  {
    id: "seed-act-3",
    userId: "system-op-3",
    operatorName: "David Chen",
    operatorTier: "A",
    actionType: "workout",
    title: "Heavy Compound Protocol",
    telemetry: "140 kg Deadlift PR • 12,400 kg total volume moved",
    xpDelta: 180,
    timestamp: new Date(Date.now() - 42 * 60 * 1000).toISOString(),
    initialEndorsements: 8,
  },
  {
    id: "seed-act-4",
    userId: "system-op-4",
    operatorName: "Vikram Malhotra",
    operatorTier: "B",
    actionType: "covenant",
    title: "Bilateral Covenant Executed",
    telemetry: "7-day commitment contract locked with 250 coin stake",
    xpDelta: 100,
    timestamp: new Date(Date.now() - 75 * 60 * 1000).toISOString(),
    initialEndorsements: 19,
  },
  {
    id: "seed-act-5",
    userId: "system-op-5",
    operatorName: "Sarah Jenkins",
    operatorTier: "S",
    actionType: "quest",
    title: "Daily Protocol Objectives 100%",
    telemetry: "5 of 5 daily directives completed before 18:00 cutoff",
    xpDelta: 350,
    timestamp: new Date(Date.now() - 110 * 60 * 1000).toISOString(),
    initialEndorsements: 33,
  },
];

// Initialize seed endorsements
DEFAULT_SEED_TELEMETRY.forEach((item) => {
  if (!activityEndorsements.has(item.id)) {
    const s = new Set<string>();
    for (let i = 0; i < item.initialEndorsements; i++) {
      s.add(`seed-user-${i}`);
    }
    activityEndorsements.set(item.id, s);
  }
});

/**
 * GET /api/social/feed
 * Fetches the real-time social telemetry stream
 */
router.get("/", requireAuth, async (req, res) => {
  try {
    const storage = getStorage();
    const user = (req as any).user;
    if (!user) return res.status(401).json({ error: "Unauthorized" });

    const currentUserId = user.id;

    // Fetch all users to construct an index
    const allUsers = await storage.getAllUsers();
    const userMap = new Map<string, any>();
    allUsers.forEach((u) => userMap.set(u.id, u));

    // Get current user's recent activities
    const userActivities = await storage.getUserActivities(currentUserId);

    const liveFeedItems: any[] = [];

    // Map user's actual real activities into the feed
    for (const act of userActivities.slice(0, 10)) {
      const u = userMap.get(act.userId) || user;
      const endorsementsSet = activityEndorsements.get(act.id) || new Set<string>();

      let actionType = "protocol";
      let title = "Protocol Execution Logged";
      let telemetry = `+${act.xpDelta || 50} XP earned`;

      if (act.action === "completeQuest") {
        actionType = "quest";
        title = "Daily Directive Completed";
        telemetry = `Mission verified • +${act.xpDelta || 50} XP • +${act.coinsDelta || 0} Coins`;
      } else if (act.action === "workout") {
        actionType = "workout";
        title = "Physical Conditioning Session";
        telemetry = "Heavy session recorded into ledger";
      } else if (act.action === "focus") {
        actionType = "air_gap";
        title = "Air-Gap Protocol Session";
        telemetry = "Deep focus block completed without breaches";
      } else if (act.action === "streak") {
        actionType = "streak";
        title = "Defiance Streak Advanced";
        telemetry = `${u.streak || 1}-day streak validated`;
      } else if (act.action === "covenantCreated") {
        actionType = "covenant";
        title = "Bilateral Peer Covenant Formed";
        telemetry = "Wager staked in bilateral protocol";
      }

      liveFeedItems.push({
        id: act.id,
        userId: act.userId,
        operatorName: u.name || "Operator",
        operatorTier: u.tier || "D",
        actionType,
        title,
        telemetry,
        xpDelta: act.xpDelta || 0,
        timestamp: act.timestamp ? new Date(act.timestamp).toISOString() : new Date().toISOString(),
        endorsements: endorsementsSet.size,
        hasEndorsed: endorsementsSet.has(currentUserId),
      });
    }

    // Merge with seed activities for continuous telemetry stream
    const combined = [...liveFeedItems];
    for (const seed of DEFAULT_SEED_TELEMETRY) {
      const endorsementsSet = activityEndorsements.get(seed.id) || new Set<string>();
      combined.push({
        ...seed,
        endorsements: endorsementsSet.size,
        hasEndorsed: endorsementsSet.has(currentUserId),
      });
    }

    // Sort by timestamp descending
    combined.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    res.json({
      feed: combined.slice(0, 25),
      streamActive: true,
      protocolVersion: "2.4.0",
    });
  } catch (error) {
    console.error("Social feed error:", error);
    res.status(500).json({ error: "Failed to fetch telemetry feed" });
  }
});

/**
 * POST /api/social/feed/:activityId/endorse
 * Endorses (Kudos) a specific protocol execution
 */
router.post("/:activityId/endorse", requireAuth, async (req, res) => {
  try {
    const storage = getStorage();
    const user = (req as any).user;
    if (!user) return res.status(401).json({ error: "Unauthorized" });

    const currentUserId = user.id;
    const { activityId } = req.params;

    if (!activityEndorsements.has(activityId)) {
      activityEndorsements.set(activityId, new Set<string>());
    }

    const set = activityEndorsements.get(activityId)!;
    const alreadyEndorsed = set.has(currentUserId);

    if (alreadyEndorsed) {
      set.delete(currentUserId);
    } else {
      set.add(currentUserId);

      // Try finding the activity to reward the recipient
      try {
        const act = await storage.getActivity(activityId);
        if (act && act.userId && act.userId !== currentUserId) {
          const recipient = await storage.getUser(act.userId);
          if (recipient) {
            // Reward recipient with +5 coins for positive peer reinforcement
            await storage.updateUser(recipient.id, {
              coins: (recipient.coins || 0) + 5,
            });

            // Send notification
            await storage.createNotification({
              userId: recipient.id,
              type: "social",
              title: "PROTOCOL ENDORSED",
              message: `Operator ${user.name || "A comrade"} endorsed your telemetry log. +5 coins granted.`,
            });
          }
        }
      } catch (e) {
        // Continue even if database activity lookup fails (e.g. seed activity)
      }
    }

    res.json({
      activityId,
      endorsements: set.size,
      hasEndorsed: !alreadyEndorsed,
    });
  } catch (error) {
    console.error("Endorse error:", error);
    res.status(500).json({ error: "Failed to process endorsement" });
  }
});

export default router;
