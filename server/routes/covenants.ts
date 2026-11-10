import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { getStorage } from "../storage";
import { randomUUID } from "crypto";

const router = Router();

// In-memory fallback map for covenants when direct table isn't migrated yet
const inMemoryCovenants = new Map<string, any>();

// Create a new bilateral covenant (wager challenge)
router.post("/create", requireAuth, async (req, res) => {
  try {
    const storage = getStorage();
    const user = (req as any).user;
    if (!user) return res.status(401).json({ error: "Unauthorized" });

    const { termsDays = 7, stakeCoins = 250, protocolObjective = "Daily Protocol Execution" } = req.body;

    const dbUser = await storage.getUser(user.id);
    if (!dbUser) return res.status(404).json({ error: "User not found" });

    if ((dbUser.coins || 0) < stakeCoins) {
      return res.status(400).json({ error: `Insufficient reserves. Stake requires ${stakeCoins} coins.` });
    }

    // Deduct stake from initiator reserves
    await storage.updateUser(dbUser.id, {
      coins: (dbUser.coins || 0) - stakeCoins,
    });

    const covenantCode = `COV-${randomUUID().slice(0, 8).toUpperCase()}`;
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const covenant = {
      id: randomUUID(),
      covenantCode,
      initiatorId: dbUser.id,
      initiatorName: dbUser.name,
      initiatorStreak: dbUser.streak || 0,
      termsDays: Number(termsDays),
      stakeCoins: Number(stakeCoins),
      protocolObjective,
      counterpartyId: null,
      counterpartyName: null,
      counterpartyStreak: 0,
      status: "pending",
      winnerId: null,
      createdAt: new Date(),
      acceptedAt: null,
      expiresAt,
    };

    inMemoryCovenants.set(covenantCode, covenant);

    await storage.createActivity({
      userId: dbUser.id,
      action: "covenantCreated",
      coinsDelta: -stakeCoins,
    });

    res.json({
      success: true,
      covenant,
      shareUrl: `/covenant/${covenantCode}`,
    });
  } catch (error: any) {
    console.error("Create covenant error:", error);
    res.status(500).json({ error: error.message || "Failed to establish covenant" });
  }
});

// Inspect covenant by code (Public for invitation landing)
router.get("/:code", async (req, res) => {
  try {
    const { code } = req.params;
    const covenant = inMemoryCovenants.get(code.toUpperCase());

    if (!covenant) {
      return res.status(404).json({ error: "Covenant record not found or expired." });
    }

    res.json(covenant);
  } catch (error: any) {
    console.error("Get covenant error:", error);
    res.status(500).json({ error: "Failed to retrieve covenant" });
  }
});

// Accept bilateral covenant
router.post("/:code/accept", requireAuth, async (req, res) => {
  try {
    const storage = getStorage();
    const user = (req as any).user;
    if (!user) return res.status(401).json({ error: "Unauthorized" });

    const { code } = req.params;
    const covenant = inMemoryCovenants.get(code.toUpperCase());

    if (!covenant) {
      return res.status(404).json({ error: "Covenant not found." });
    }

    if (covenant.status !== "pending") {
      return res.status(400).json({ error: "This covenant has already been authorized or completed." });
    }

    if (covenant.initiatorId === user.id) {
      return res.status(400).json({ error: "Cannot accept your own bilateral covenant." });
    }

    const dbUser = await storage.getUser(user.id);
    if (!dbUser) return res.status(404).json({ error: "User not found" });

    if ((dbUser.coins || 0) < covenant.stakeCoins) {
      return res.status(400).json({
        error: `Insufficient reserves to match stake of ${covenant.stakeCoins} coins.`,
      });
    }

    // Deduct matching stake from counterparty
    await storage.updateUser(dbUser.id, {
      coins: (dbUser.coins || 0) - covenant.stakeCoins,
    });

    covenant.counterpartyId = dbUser.id;
    covenant.counterpartyName = dbUser.name;
    covenant.counterpartyStreak = dbUser.streak || 0;
    covenant.status = "active";
    covenant.acceptedAt = new Date();

    inMemoryCovenants.set(code.toUpperCase(), covenant);

    // Notify Initiator
    await storage.createNotification({
      userId: covenant.initiatorId,
      type: "challenge",
      title: "BILATERAL COVENANT AUTHORIZED",
      message: `Operative ${dbUser.name} has matched your ${covenant.stakeCoins} coin stake. The ${covenant.termsDays}-day crucible is active.`,
    });

    // Notify Acceptor
    await storage.createNotification({
      userId: dbUser.id,
      type: "challenge",
      title: "BILATERAL COVENANT AUTHORIZED",
      message: `You matched ${covenant.initiatorName}'s stake. Protocol: ${covenant.termsDays} days of unbroken execution.`,
    });

    res.json({
      success: true,
      covenant,
    });
  } catch (error: any) {
    console.error("Accept covenant error:", error);
    res.status(500).json({ error: error.message || "Failed to authorize covenant" });
  }
});

// List user's active covenants
router.get("/user/active", requireAuth, async (req, res) => {
  try {
    const user = (req as any).user;
    if (!user) return res.status(401).json({ error: "Unauthorized" });

    const userCovenants = Array.from(inMemoryCovenants.values()).filter(
      (c) => c.initiatorId === user.id || c.counterpartyId === user.id
    );

    res.json(userCovenants);
  } catch (error: any) {
    console.error("List covenants error:", error);
    res.status(500).json({ error: "Failed to list user covenants" });
  }
});

export default router;
