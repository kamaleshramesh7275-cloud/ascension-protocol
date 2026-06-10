import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { db as _db } from "../db";
import { citadelBuildings } from "@shared/schema";
import { eq, and, ne, inArray } from "drizzle-orm";
import { getStorage } from "../storage";

const router = Router();

// Ensure DB is configured at module load to avoid repeating null-checks in routes
if (!_db) {
  throw new Error('DB not configured. Set DATABASE_URL or provide a database for the server.');
}

const db = _db;

// ─── BUILDING DEFINITIONS ────────────────────────────────────────────────────
export const BUILDING_DEFS: Record<string, {
  label: string;
  description: string;
  passiveCoins: number;     // coins per 24h when completed
  xpBonusPct: number;       // % XP bonus to future sessions
  ruinClearDiscount: number;// % discount on 200 coin clear cost
  troopsPerMin: number;     // troops per focus minute
  minDuration: number;      // min focus minutes required
}> = {
  house:    { label: "House",    description: "A basic dwelling — the foundation of any great empire.", passiveCoins: 5,   xpBonusPct: 0,  ruinClearDiscount: 0,  troopsPerMin: 0,  minDuration: 5  },
  library:  { label: "Library",  description: "Grants +5% XP from all future focus sessions permanently.", passiveCoins: 15,  xpBonusPct: 5,  ruinClearDiscount: 0,  troopsPerMin: 0,  minDuration: 25 },
  treasury: { label: "Treasury", description: "Generates 100 Coins every 24 hours while standing.", passiveCoins: 100, xpBonusPct: 0,  ruinClearDiscount: 0,  troopsPerMin: 0,  minDuration: 25 },
  forge:    { label: "Forge",    description: "Reduces ruin clearing cost by 20%. Stack multiple forges!", passiveCoins: 25,  xpBonusPct: 0,  ruinClearDiscount: 20, troopsPerMin: 0,  minDuration: 50 },
  barracks: { label: "Barracks", description: "Generates 1 Troop per focus minute. Troops are used for Raids.", passiveCoins: 10,  xpBonusPct: 0,  ruinClearDiscount: 0,  troopsPerMin: 1,  minDuration: 50 },
  citadel_tower: { label: "Citadel Tower", description: "A monumental landmark granting +10% XP and 250 Coins/day!", passiveCoins: 250, xpBonusPct: 10, ruinClearDiscount: 0, troopsPerMin: 0, minDuration: 90 },
};

// ─── GET OWN BUILDINGS ────────────────────────────────────────────────────────
router.get("/", requireAuth, async (req, res) => {
  try {
    const userId = (req as any).user!.id;
    const buildings = await db.query.citadelBuildings.findMany({
      where: eq(citadelBuildings.userId, userId),
    });
    // Enrich with building def
    const enriched = buildings.map(b => ({
      ...b,
      def: BUILDING_DEFS[b.buildingName] || BUILDING_DEFS.house,
    }));
    res.json(enriched);
  } catch (error) {
    console.error("Fetch citadel error:", error);
    res.status(500).json({ error: "Failed to fetch citadel" });
  }
});

// ─── GET BUILDING DEFINITIONS ────────────────────────────────────────────────
router.get("/defs", requireAuth, (_req, res) => {
  res.json(BUILDING_DEFS);
});

// ─── GET PUBLIC CITADEL ───────────────────────────────────────────────────────
router.get("/public/:userId", requireAuth, async (req, res) => {
  try {
    const { userId } = req.params;
    const buildings = await db.query.citadelBuildings.findMany({
      where: eq(citadelBuildings.userId, userId),
    });
    const enriched = buildings.map(b => ({
      ...b,
      def: BUILDING_DEFS[b.buildingName] || BUILDING_DEFS.house,
    }));
    res.json(enriched);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch citadel" });
  }
});

// ─── START BUILD ─────────────────────────────────────────────────────────────
router.post("/build", requireAuth, async (req, res) => {
  try {
    const userId = (req as any).user!.id;
    const { type, buildingName = "house", x, y, wager = 0 } = req.body;

    if (!type || typeof x !== "number" || typeof y !== "number") {
      return res.status(400).json({ error: "Invalid building placement" });
    }

    // Check spot is free
    const existing = await db.query.citadelBuildings.findFirst({
      where: and(eq(citadelBuildings.userId, userId), eq(citadelBuildings.x, x), eq(citadelBuildings.y, y)),
    });
    if (existing) return res.status(409).json({ error: "That tile is already occupied" });

    // Handle wager deduction
    const storage = getStorage();
    if (wager > 0) {
      const user = await storage.getUser(userId);
      if (!user || user.coins < wager) return res.status(400).json({ error: "Insufficient coins for wager" });
      await storage.updateUser(userId, { coins: user.coins - wager });
    }

    const [building] = await db.insert(citadelBuildings).values({
      userId, type, buildingName, x, y, status: "building", wager,
    }).returning();

    res.status(201).json({ ...building, def: BUILDING_DEFS[buildingName] || BUILDING_DEFS.house });
  } catch (error) {
    console.error("Start building error:", error);
    res.status(500).json({ error: "Failed to start building" });
  }
});

// ─── COMPLETE BUILD (success) ─────────────────────────────────────────────────
router.post("/:id/complete", requireAuth, async (req, res) => {
  try {
    const userId = (req as any).user!.id;
    const { id } = req.params;
    const { focusMinutes = 0 } = req.body;

    const building = await db.query.citadelBuildings.findFirst({
      where: and(eq(citadelBuildings.id, id), eq(citadelBuildings.userId, userId)),
    });
    if (!building) return res.status(404).json({ error: "Building not found" });

    const [updated] = await db.update(citadelBuildings)
      .set({ status: "completed", completedAt: new Date(), lastCollectedAt: new Date() })
      .where(eq(citadelBuildings.id, id))
      .returning();

    // Wager reward: if wagered, refund + bonus
    const storage = getStorage();
    const def = BUILDING_DEFS[building.buildingName] || BUILDING_DEFS.house;
    if (building.wager > 0) {
      const user = await storage.getUser(userId);
      if (user) {
        const bonus = Math.floor(building.wager * 1.5); // 50% bonus for wagering
        await storage.updateUser(userId, { coins: user.coins + bonus });
      }
    }

    // Apply troops if barracks
    if (def.troopsPerMin > 0 && focusMinutes > 0) {
      const user = await storage.getUser(userId);
      if (user) {
        const troops = focusMinutes * def.troopsPerMin;
        await storage.updateUser(userId, { coins: (user.coins || 0) + Math.floor(troops * 5) }); // troops = +5 coins each for now
      }
    }

    res.json({ ...updated, def });
  } catch (error) {
    console.error("Complete building error:", error);
    res.status(500).json({ error: "Failed to complete building" });
  }
});

// ─── FAIL BUILD (burn) ────────────────────────────────────────────────────────
router.post("/:id/fail", requireAuth, async (req, res) => {
  try {
    const userId = (req as any).user!.id;
    const { id } = req.params;

    const building = await db.query.citadelBuildings.findFirst({
      where: and(eq(citadelBuildings.id, id), eq(citadelBuildings.userId, userId)),
    });
    if (!building) return res.status(404).json({ error: "Building not found" });

    // Wager is already deducted on start — nothing extra to do
    const [updated] = await db.update(citadelBuildings)
      .set({ status: "ruined" })
      .where(eq(citadelBuildings.id, id))
      .returning();

    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: "Failed to fail building" });
  }
});

// ─── CLEAR RUIN ───────────────────────────────────────────────────────────────
router.post("/:id/clear", requireAuth, async (req, res) => {
  try {
    const userId = (req as any).user!.id;
    const { id } = req.params;
    const BASE_CLEAR_COST = 200;

    const storage = getStorage();
    const user = await storage.getUser(userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    // Calculate forge discount
    const allBuildings = await db.query.citadelBuildings.findMany({
      where: and(eq(citadelBuildings.userId, userId), eq(citadelBuildings.status, "completed")),
    });
    const forgeDef = BUILDING_DEFS.forge;
    const forgeCount = allBuildings.filter(b => b.buildingName === "forge").length;
    const discountPct = Math.min(80, forgeCount * forgeDef.ruinClearDiscount);
    const clearCost = Math.floor(BASE_CLEAR_COST * (1 - discountPct / 100));

    if (user.coins < clearCost) {
      return res.status(400).json({ error: `Need ${clearCost} coins to clear ruin (you have ${user.coins})` });
    }

    const building = await db.query.citadelBuildings.findFirst({
      where: and(eq(citadelBuildings.id, id), eq(citadelBuildings.userId, userId), eq(citadelBuildings.status, "ruined")),
    });
    if (!building) return res.status(404).json({ error: "Ruin not found" });

    await storage.updateUser(userId, { coins: user.coins - clearCost });
    await db.delete(citadelBuildings).where(eq(citadelBuildings.id, id));

    res.json({ success: true, clearCost, remainingCoins: user.coins - clearCost });
  } catch (error) {
    res.status(500).json({ error: "Failed to clear ruin" });
  }
});

// ─── COLLECT PASSIVE COINS ───────────────────────────────────────────────────
router.post("/collect", requireAuth, async (req, res) => {
  try {
    const userId = (req as any).user!.id;
    const now = new Date();

    const buildings = await db.query.citadelBuildings.findMany({
      where: and(eq(citadelBuildings.userId, userId), eq(citadelBuildings.status, "completed")),
    });

    let totalCoins = 0;
    const toUpdate: string[] = [];

    for (const b of buildings) {
      const def = BUILDING_DEFS[b.buildingName];
      if (!def || def.passiveCoins <= 0) continue;
      const lastCollected = b.lastCollectedAt ? new Date(b.lastCollectedAt) : new Date(b.completedAt || now);
      const hoursSince = (now.getTime() - lastCollected.getTime()) / (1000 * 60 * 60);
      if (hoursSince >= 1) {
        const earned = Math.floor(def.passiveCoins * (hoursSince / 24));
        totalCoins += earned;
        toUpdate.push(b.id);
      }
    }

    if (toUpdate.length > 0) {
      await db.update(citadelBuildings)
        .set({ lastCollectedAt: now })
        .where(inArray(citadelBuildings.id, toUpdate));
    }

    if (totalCoins > 0) {
      const storage = getStorage();
      const user = await storage.getUser(userId);
      if (user) await storage.updateUser(userId, { coins: user.coins + totalCoins });
    }

    res.json({ collected: totalCoins });
  } catch (error) {
    res.status(500).json({ error: "Failed to collect passive income" });
  }
});

// ─── PUBLIC CITADEL STATS ───────────────────────────────────────────────────
router.get("/public/:userId/stats", requireAuth, async (req, res) => {
  try {
    const { userId } = req.params;
    const buildings = await db.query.citadelBuildings.findMany({
      where: and(eq(citadelBuildings.userId, userId), eq(citadelBuildings.status, "completed")),
    });

    let totalXpBonus = 0;
    let totalPassiveCoins = 0;
    let totalForgeDiscount = 0;
    let totalTroopsPerMin = 0;
    const buildingCounts: Record<string, number> = {};

    for (const b of buildings) {
      const def = BUILDING_DEFS[b.buildingName];
      if (!def) continue;
      totalXpBonus += def.xpBonusPct;
      totalPassiveCoins += def.passiveCoins;
      totalForgeDiscount = Math.min(80, totalForgeDiscount + def.ruinClearDiscount);
      totalTroopsPerMin += def.troopsPerMin;
      buildingCounts[b.buildingName] = (buildingCounts[b.buildingName] || 0) + 1;
    }

    const ruinCount = await db.query.citadelBuildings.findMany({
      where: and(eq(citadelBuildings.userId, userId), eq(citadelBuildings.status, "ruined")),
    });

    res.json({
      totalBuildings: buildings.length,
      ruinCount: ruinCount.length,
      buildingCounts,
      buffs: {
        xpBonus: totalXpBonus,
        passiveCoinsPerDay: totalPassiveCoins,
        ruinClearDiscount: totalForgeDiscount,
        troopsPerMin: totalTroopsPerMin,
      }
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to get public citadel stats" });
  }
});

// ─── CITADEL STATS (buffs summary) ───────────────────────────────────────────
router.get("/stats", requireAuth, async (req, res) => {
  try {
    const userId = (req as any).user!.id;
    const buildings = await db.query.citadelBuildings.findMany({
      where: and(eq(citadelBuildings.userId, userId), eq(citadelBuildings.status, "completed")),
    });

    let totalXpBonus = 0;
    let totalPassiveCoins = 0;
    let totalForgeDiscount = 0;
    let totalTroopsPerMin = 0;
    const buildingCounts: Record<string, number> = {};

    for (const b of buildings) {
      const def = BUILDING_DEFS[b.buildingName];
      if (!def) continue;
      totalXpBonus += def.xpBonusPct;
      totalPassiveCoins += def.passiveCoins;
      totalForgeDiscount = Math.min(80, totalForgeDiscount + def.ruinClearDiscount);
      totalTroopsPerMin += def.troopsPerMin;
      buildingCounts[b.buildingName] = (buildingCounts[b.buildingName] || 0) + 1;
    }

    const ruinCount = await db.query.citadelBuildings.findMany({
      where: and(eq(citadelBuildings.userId, userId), eq(citadelBuildings.status, "ruined")),
    });

    res.json({
      totalBuildings: buildings.length,
      ruinCount: ruinCount.length,
      buildingCounts,
      buffs: {
        xpBonus: totalXpBonus,
        passiveCoinsPerDay: totalPassiveCoins,
        ruinClearDiscount: totalForgeDiscount,
        troopsPerMin: totalTroopsPerMin,
      }
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to get citadel stats" });
  }
});

// ─── RAID (steal from rival ruins) ────────────────────────────────────────────
router.post("/raid/:targetUserId", requireAuth, async (req, res) => {
  try {
    const attackerId = (req as any).user!.id;
    const { targetUserId } = req.params;

    if (attackerId === targetUserId) return res.status(400).json({ error: "Cannot raid yourself" });

    // Check attacker has barracks troops (via building count * 5)
    const attackerBuildings = await db.query.citadelBuildings.findMany({
      where: and(eq(citadelBuildings.userId, attackerId), eq(citadelBuildings.status, "completed")),
    });
    const barracksCount = attackerBuildings.filter(b => b.buildingName === "barracks").length;
    if (barracksCount === 0) return res.status(400).json({ error: "You need at least one Barracks to raid" });

    // Find target ruins
    const targetRuins = await db.query.citadelBuildings.findMany({
      where: and(eq(citadelBuildings.userId, targetUserId), eq(citadelBuildings.status, "ruined")),
    });
    if (targetRuins.length === 0) return res.status(400).json({ error: "Target has no ruins to raid" });

    // Steal 15% of target's coins per ruin, capped at total barracks * 50
    const storage = getStorage();
    const target = await storage.getUser(targetUserId);
    if (!target) return res.status(404).json({ error: "Target not found" });

    const maxLoot = barracksCount * 50;
    const stolen = Math.min(maxLoot, Math.floor(target.coins * 0.15 * targetRuins.length));

    if (stolen <= 0) return res.status(400).json({ error: "Nothing to steal from target" });

    await storage.updateUser(targetUserId, { coins: Math.max(0, target.coins - stolen) });
    const attacker = await storage.getUser(attackerId);
    if (attacker) await storage.updateUser(attackerId, { coins: attacker.coins + stolen });

    // Notify target
    await storage.createNotification({
      userId: targetUserId,
      type: "citadel_raid",
      title: "⚔️ Your Citadel Was Raided!",
      message: `A rival raided your ruins and stole ${stolen} coins! Clear your ruins to stop future attacks.`,
      read: false,
    } as any);

    res.json({ success: true, stolen });
  } catch (error) {
    res.status(500).json({ error: "Failed to execute raid" });
  }
});

// ─── EXPAND GRID ─────────────────────────────────────────────────────────────
router.post("/expand", requireAuth, async (req, res) => {
  try {
    const userId = (req as any).user!.id;
    const EXPAND_COST = 2000; // coins

    const storage = getStorage();
    const user = await storage.getUser(userId);
    if (!user) return res.status(404).json({ error: "User not found" });
    if (user.coins < EXPAND_COST) return res.status(400).json({ error: `Need ${EXPAND_COST} coins to expand grid` });

    // Store grid size in user metadata (use xp as proxy for now via custom field)
    // We'll use coins deduction as the only gate; the FE tracks grid size
    await storage.updateUser(userId, { coins: user.coins - EXPAND_COST });

    res.json({ success: true, remainingCoins: user.coins - EXPAND_COST });
  } catch (error) {
    res.status(500).json({ error: "Failed to expand grid" });
  }
});

export default router;
