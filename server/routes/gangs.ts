import { Router, Request, Response } from "express";
import { getStorage } from "../storage";
import { requireAuth } from "../middleware/auth";
import { randomBytes } from "crypto";

const router = Router();

// Helper to generate short invite codes like "GANG-A3X7"
function generateInviteCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // Avoiding ambiguous chars
  let code = "GANG-";
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// ─── Create a Gang ───────────────────────────────────────────────────────────
router.post("/", requireAuth, async (req: Request, res: Response) => {
  try {
    const storage = getStorage();
    const userId = (req as any).user!.id;
    const { name, icon } = req.body;

    if (!name || name.trim().length === 0) {
      return res.status(400).json({ error: "Gang name is required" });
    }

    // Check if user is already in a gang
    const existing = await storage.getUserGang(userId);
    if (existing) {
      return res.status(400).json({ error: "You are already in a gang. Leave your current gang first." });
    }

    const inviteCode = generateInviteCode();
    const gang = await storage.createGang({
      name: name.trim(),
      icon: icon || null,
      inviteCode,
      leaderId: userId,
    });

    // Add creator as leader
    await storage.joinGang(gang.id, userId, "leader");

    // Generate a weekly co-op quest for the new gang
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    const objectives = [
      { objective: "Collectively earn 1000 XP", targetValue: 1000, rewardCoins: 200 },
      { objective: "Complete 30 quests as a team", targetValue: 30, rewardCoins: 300 },
      { objective: "Log 10 focus sessions together", targetValue: 10, rewardCoins: 250 },
    ];
    const randomObj = objectives[Math.floor(Math.random() * objectives.length)];
    await storage.createGangCoopQuest({
      gangId: gang.id,
      objective: randomObj.objective,
      targetValue: randomObj.targetValue,
      rewardCoins: randomObj.rewardCoins,
      expiresAt: nextWeek,
    });

    // Notify the creator
    await storage.createNotification({
      userId,
      type: "gang",
      title: "Gang Created! 🔥",
      message: `Your gang "${gang.name}" is ready. Share your invite code: ${inviteCode}`,
    });

    res.json(gang);
  } catch (err: any) {
    console.error("Error creating gang:", err);
    res.status(500).json({ error: err.message || "Failed to create gang" });
  }
});

// ─── Join a Gang via Invite Code ─────────────────────────────────────────────
router.post("/join", requireAuth, async (req: Request, res: Response) => {
  try {
    const storage = getStorage();
    const userId = (req as any).user!.id;
    const { inviteCode } = req.body;

    if (!inviteCode) {
      return res.status(400).json({ error: "Invite code is required" });
    }

    // Check if user is already in a gang
    const existing = await storage.getUserGang(userId);
    if (existing) {
      return res.status(400).json({ error: "You are already in a gang" });
    }

    const gang = await storage.getGangByInviteCode(inviteCode.toUpperCase());
    if (!gang) {
      return res.status(404).json({ error: "Invalid invite code" });
    }

    // Check gang size limit (max 10)
    const members = await storage.getGangMembers(gang.id);
    if (members.length >= 10) {
      return res.status(400).json({ error: "This gang is full (max 10 members)" });
    }

    const member = await storage.joinGang(gang.id, userId, "member");

    // Notify the gang leader
    const user = await storage.getUser(userId);
    await storage.createNotification({
      userId: gang.leaderId,
      type: "gang",
      title: "New Gang Member! 🎉",
      message: `${user?.name || "Someone"} has joined your gang "${gang.name}"!`,
    });

    res.json({ gang, member });
  } catch (err: any) {
    console.error("Error joining gang:", err);
    res.status(500).json({ error: err.message || "Failed to join gang" });
  }
});

// ─── Get My Gang ─────────────────────────────────────────────────────────────
router.get("/my-gang", requireAuth, async (req: Request, res: Response) => {
  try {
    const storage = getStorage();
    const userId = (req as any).user!.id;
    const gang = await storage.getUserGang(userId);

    if (!gang) {
      return res.json(null);
    }

    const members = await storage.getGangMembers(gang.id);
    const coopQuest = await storage.getGangCoopQuest(gang.id);
    const duels = await storage.getGangDuels(gang.id);

    res.json({ gang, members, coopQuest, duels });
  } catch (err: any) {
    console.error("Error getting gang:", err);
    res.status(500).json({ error: "Failed to fetch gang data" });
  }
});

// ─── Get Gang Leaderboard (Internal) ─────────────────────────────────────────
router.get("/:id/leaderboard", requireAuth, async (req: Request, res: Response) => {
  try {
    const storage = getStorage();
    const members = await storage.getGangMembers(req.params.id);

    // Sort by XP descending for a weekly leaderboard
    const leaderboard = members
      .map(m => ({
        userId: m.userId,
        name: m.user.name,
        avatar: m.user.avatar,
        xp: m.user.xp,
        level: m.user.level,
        streak: m.user.streak,
        role: m.role,
      }))
      .sort((a, b) => b.xp - a.xp);

    res.json(leaderboard);
  } catch (err: any) {
    res.status(500).json({ error: "Failed to fetch leaderboard" });
  }
});

// ─── Contribute to Co-op Quest ───────────────────────────────────────────────
router.post("/:id/contribute", requireAuth, async (req: Request, res: Response) => {
  try {
    const storage = getStorage();
    const { amount } = req.body;
    const gangId = req.params.id;

    const quest = await storage.getGangCoopQuest(gangId);
    if (!quest) {
      return res.status(404).json({ error: "No active co-op quest" });
    }

    const newValue = Math.min(quest.currentValue + (amount || 1), quest.targetValue);
    const updated = await storage.updateGangCoopQuest(quest.id, { currentValue: newValue });

    // Check if quest is now completed
    if (newValue >= quest.targetValue && !quest.completedAt) {
      await storage.updateGangCoopQuest(quest.id, { completedAt: new Date() });

      // Award treasury coins to the gang
      const gang = await storage.getGang(gangId);
      if (gang) {
        await storage.updateGang(gangId, { treasuryCoins: gang.treasuryCoins + quest.rewardCoins });

        // Notify all members
        const members = await storage.getGangMembers(gangId);
        for (const member of members) {
          await storage.createNotification({
            userId: member.userId,
            type: "gang",
            title: "Co-op Quest Complete! 🏆",
            message: `Your gang completed "${quest.objective}"! +${quest.rewardCoins} treasury coins.`,
          });
        }
      }
    }

    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: "Failed to contribute" });
  }
});

// ─── Start a Duel (Automatic Matchmaking) ────────────────────────────────────
router.post("/:id/start-duel", requireAuth, async (req: Request, res: Response) => {
  try {
    const storage = getStorage();
    const gangId = req.params.id;
    const { duelType } = req.body;

    // Check if gang already has an active duel
    const activeDuels = await storage.getGangDuels(gangId);
    const hasActive = activeDuels.some(d => d.status === "active" || d.status === "pending");
    if (hasActive) {
      return res.status(400).json({ error: "Your gang already has an active duel" });
    }

    // Automatic matchmaking
    const opponent = await storage.matchmakeGangDuel(gangId);
    if (!opponent) {
      return res.status(404).json({ error: "No suitable opponent found. More gangs need to exist!" });
    }

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7-day duel

    const duel = await storage.createGangDuel({
      challengerGangId: gangId,
      defenderGangId: opponent.id,
      duelType: duelType || "xp",
      expiresAt,
      status: "active",
    });

    // Notify both gangs
    const myGang = await storage.getGang(gangId);
    const myMembers = await storage.getGangMembers(gangId);
    const opponentMembers = await storage.getGangMembers(opponent.id);

    for (const m of myMembers) {
      await storage.createNotification({
        userId: m.userId,
        type: "gang",
        title: "Duel Started! ⚔️",
        message: `Your gang is now dueling "${opponent.name}" in a 7-day ${duelType || "XP"} battle!`,
      });
    }
    for (const m of opponentMembers) {
      await storage.createNotification({
        userId: m.userId,
        type: "gang",
        title: "Duel Challenge! ⚔️",
        message: `"${myGang?.name}" has challenged your gang to a 7-day ${duelType || "XP"} duel!`,
      });
    }

    res.json(duel);
  } catch (err: any) {
    console.error("Error starting duel:", err);
    res.status(500).json({ error: "Failed to start duel" });
  }
});

// ─── Upgrade Hideout ─────────────────────────────────────────────────────────
router.post("/:id/upgrade-hideout", requireAuth, async (req: Request, res: Response) => {
  try {
    const storage = getStorage();
    const gangId = req.params.id;
    const gang = await storage.getGang(gangId);

    if (!gang) return res.status(404).json({ error: "Gang not found" });

    // Cost scales: Level 2 = 500, Level 3 = 1000, Level 4 = 2000, Level 5 = 5000
    const upgradeCosts: Record<number, number> = { 1: 500, 2: 1000, 3: 2000, 4: 5000 };
    const cost = upgradeCosts[gang.hideoutLevel];

    if (!cost) {
      return res.status(400).json({ error: "Hideout is already at max level" });
    }
    if (gang.treasuryCoins < cost) {
      return res.status(400).json({ error: `Not enough treasury coins. Need ${cost}, have ${gang.treasuryCoins}.` });
    }

    const updated = await storage.updateGang(gangId, {
      hideoutLevel: gang.hideoutLevel + 1,
      treasuryCoins: gang.treasuryCoins - cost,
    });

    // Notify all members
    const members = await storage.getGangMembers(gangId);
    const levelNames = ["", "Wooden Shack", "Stone Fort", "Iron Citadel", "Crystal Palace", "Legendary Nexus"];
    for (const m of members) {
      await storage.createNotification({
        userId: m.userId,
        type: "gang",
        title: "Hideout Upgraded! 🏰",
        message: `Your gang hideout is now a ${levelNames[updated.hideoutLevel] || `Level ${updated.hideoutLevel}`}!`,
      });
    }

    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: "Failed to upgrade hideout" });
  }
});

export default router;
