import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { getStorage } from "../storage";
import { randomUUID } from "crypto";

const router = Router();

// In-memory tracking of opened caches today per user: userId -> Set of cacheTier/dates
const userOpenedCaches = new Map<string, { date: string; openedTiers: string[] }>();

function getTodayKey(): string {
  return new Date().toISOString().split("T")[0];
}

/**
 * GET /api/tactical-cache/status
 * Returns available encrypted caches for the current user
 */
router.get("/status", requireAuth, async (req, res) => {
  try {
    const storage = getStorage();
    const user = (req as any).user;
    if (!user) return res.status(401).json({ error: "Unauthorized" });

    const dbUser = await storage.getUser(user.id);
    if (!dbUser) return res.status(404).json({ error: "User not found" });

    const today = getTodayKey();
    const userHistory = userOpenedCaches.get(dbUser.id);
    const openedTiersToday = (userHistory && userHistory.date === today) ? userHistory.openedTiers : [];

    const availableCaches: any[] = [];

    // 1. Daily Protocol Calibration Cache (Available once every calendar day)
    if (!openedTiersToday.includes("daily_recon")) {
      availableCaches.push({
        id: `cache-daily-${today}`,
        tier: (dbUser.streak || 0) >= 7 ? "silver" : "bronze",
        code: "RECON-01",
        title: "Daily Reconnaissance Cache",
        source: "Daily Active Protocol Operational Grant",
        estimatedYield: (dbUser.streak || 0) >= 7 ? "35 - 90 Coins + Telemetry XP" : "15 - 45 Coins + Telemetry XP",
      });
    }

    // 2. High-Discipline Milestone Cache (Streak >= 14 or level >= 5)
    if ((dbUser.streak || 0) >= 14 && !openedTiersToday.includes("streak_elite")) {
      availableCaches.push({
        id: `cache-streak-${today}`,
        tier: "gold",
        code: "DEFIANCE-14",
        title: "Defiance Citadel Reserve",
        source: "14+ Day Verified Streak Authorization",
        estimatedYield: "75 - 220 Coins + Rare Shield Item",
      });
    }

    res.json({
      availableCaches,
      totalAvailable: availableCaches.length,
      openedTodayCount: openedTiersToday.length,
      protocolCycle: today,
    });
  } catch (error) {
    console.error("Tactical cache status error:", error);
    res.status(500).json({ error: "Failed to check tactical caches" });
  }
});

/**
 * POST /api/tactical-cache/decrypt
 * Decrypts a tactical cache and awards variable reinforcement
 */
router.post("/decrypt", requireAuth, async (req, res) => {
  try {
    const storage = getStorage();
    const user = (req as any).user;
    if (!user) return res.status(401).json({ error: "Unauthorized" });

    const { cacheId, tier = "bronze" } = req.body;
    const dbUser = await storage.getUser(user.id);
    if (!dbUser) return res.status(404).json({ error: "User not found" });

    const today = getTodayKey();
    let userHistory = userOpenedCaches.get(dbUser.id);
    if (!userHistory || userHistory.date !== today) {
      userHistory = { date: today, openedTiers: [] };
      userOpenedCaches.set(dbUser.id, userHistory);
    }

    // Determine category key
    const categoryKey = cacheId?.includes("streak") ? "streak_elite" : "daily_recon";

    if (userHistory.openedTiers.includes(categoryKey)) {
      return res.status(400).json({
        error: "Cache cipher already decrypted for this operational cycle.",
      });
    }

    // Calculate variable reward with slot-machine unpredictability
    let coins = 0;
    let xp = 0;
    let bonusItem: string | null = null;

    if (tier === "gold") {
      coins = Math.floor(Math.random() * 145) + 75; // 75 - 220
      xp = Math.floor(Math.random() * 150) + 150; // 150 - 300
      if (Math.random() < 0.35) {
        bonusItem = "Streak Shield Emergency Unit";
      }
    } else if (tier === "silver") {
      coins = Math.floor(Math.random() * 55) + 35; // 35 - 90
      xp = Math.floor(Math.random() * 75) + 75; // 75 - 150
    } else {
      coins = Math.floor(Math.random() * 30) + 15; // 15 - 45
      xp = Math.floor(Math.random() * 50) + 50; // 50 - 100
    }

    userHistory.openedTiers.push(categoryKey);

    // Apply updates
    const updatedCoins = (dbUser.coins || 0) + coins;
    const updatedXp = (dbUser.xp || 0) + xp;

    await storage.updateUser(dbUser.id, {
      coins: updatedCoins,
      xp: updatedXp,
    });

    // Record activity
    await storage.createActivity({
      userId: dbUser.id,
      action: "tacticalCacheDecrypted",
      coinsDelta: coins,
      xpDelta: xp,
    });

    res.json({
      success: true,
      rewardCoins: coins,
      rewardXp: xp,
      bonusItem,
      totalCoins: updatedCoins,
      totalXp: updatedXp,
      cipherSignature: `HEX-${randomUUID().slice(0, 8).toUpperCase()}`,
      message: `Tactical Cipher Decrypted: +${coins} Coins and +${xp} XP deposited to reserves.`,
    });
  } catch (error) {
    console.error("Cache decrypt error:", error);
    res.status(500).json({ error: "Failed to decrypt tactical cache" });
  }
});

export default router;
