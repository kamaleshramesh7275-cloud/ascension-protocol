import { Router } from "express";
import { getStorage } from "../storage";
import { requireAuth } from "../middleware/auth";
// const storage = getStorage();
import { insertUserItemSchema } from "@shared/schema";
import { z } from "zod";

const router = Router();

let hasSeeded = false;

// Seed Shop Items if empty
async function seedShop() {
    if (hasSeeded) return; // Optimization: Skip DB check if already done in this process

    const storage = getStorage();
    const items = await storage.getShopItems();
    
    // Check which types are missing (allows adding new types to existing DB)
    const existingTypes = new Set(items.map(i => i.type));
    const missingTypes = ['avatar', 'badge', 'title', 'theme', 'consumable', 'program'].filter(t => !existingTypes.has(t));
    const requiredUtilities = [
        "streak_shield",
        "reschedule_pass",
        "focus_escrow_ticket",
        "protocol_audit_ticket",
        "program_pack_ppl",
        "program_pack_5k",
    ];
    const hasAllUtilities = requiredUtilities.every(val => items.some(i => i.value === val));

    if (missingTypes.length === 0 && hasAllUtilities) {
        hasSeeded = true;
        return;
    }

    const seeds = [
        // --- Avatars ---
        {
            name: "Cyber Ninja",
            description: "A stealthy warrior of the digital age.",
            type: "avatar",
            value: "https://api.dicebear.com/7.x/avataaars/svg?seed=Ninja&backgroundColor=b6e3f4",
            cost: 500,
            rarity: "rare",
            isPremium: false,
        },
        {
            name: "Zen Master",
            description: "Inner peace is the ultimate weapon.",
            type: "avatar",
            value: "https://api.dicebear.com/7.x/avataaars/svg?seed=Zen&backgroundColor=c0aede",
            cost: 100,
            rarity: "common",
            isPremium: false,
        },
        {
            name: "Void Walker",
            description: "One who traverses the darkness.",
            type: "avatar",
            value: "https://api.dicebear.com/7.x/avataaars/svg?seed=Void&backgroundColor=ffdfbf",
            cost: 1000,
            rarity: "epic",
            isPremium: true,
        },
        {
            name: "Neon Punk",
            description: "Bright lights, big city.",
            type: "avatar",
            value: "https://api.dicebear.com/7.x/avataaars/svg?seed=Neon&backgroundColor=ffdfbf",
            cost: 750,
            rarity: "rare",
            isPremium: false,
        },
        {
            name: "Ethereal Spirit",
            description: "A being of pure energy.",
            type: "avatar",
            value: "https://api.dicebear.com/7.x/avataaars/svg?seed=Spirit&backgroundColor=b6e3f4&clothing=collarAndSweater",
            cost: 1200,
            rarity: "epic",
            isPremium: true,
        },
        {
            name: "Cyber Samurai",
            description: "Honor code in binary.",
            type: "avatar",
            value: "https://api.dicebear.com/7.x/avataaars/svg?seed=Samurai&backgroundColor=ffdfbf&facialHair=beardMajestic",
            cost: 1500,
            rarity: "legendary",
            isPremium: true,
        },
        {
            name: "Forest Guardian",
            description: "Protector of the digital grove.",
            type: "avatar",
            value: "https://api.dicebear.com/7.x/avataaars/svg?seed=Forest&backgroundColor=c0aede&accessories=kurt",
            cost: 800,
            rarity: "rare",
            isPremium: false,
        },

        // --- Badges ---
        {
            name: "Early Adopter",
            description: "One of the first to ascend.",
            type: "badge",
            value: "https://cdn-icons-png.flaticon.com/512/3176/3176366.png",
            cost: 50,
            rarity: "common",
            isPremium: false,
        },
        {
            name: "Gym Rat",
            description: "Lives in the iron temple.",
            type: "badge",
            value: "https://cdn-icons-png.flaticon.com/512/2503/2503509.png",
            cost: 300,
            rarity: "rare",
            isPremium: false,
        },
        {
            name: "Mindful Monk",
            description: "Master of the mind.",
            type: "badge",
            value: "https://cdn-icons-png.flaticon.com/512/2647/2647333.png",
            cost: 300,
            rarity: "rare",
            isPremium: false,
        },
        {
            name: "Ascended",
            description: "Reached the pinnacle of human potential.",
            type: "badge",
            value: "https://cdn-icons-png.flaticon.com/512/6422/6422206.png",
            cost: 5000,
            rarity: "legendary",
            isPremium: true,
        },
        {
            name: "Night Owl",
            description: "Thrives in the moonlight.",
            type: "badge",
            value: "https://cdn-icons-png.flaticon.com/512/4825/4825038.png",
            cost: 200,
            rarity: "common",
            isPremium: false,
        },
        {
            name: "Streak Master",
            description: "Consistency is key.",
            type: "badge",
            value: "https://cdn-icons-png.flaticon.com/512/5778/5778385.png",
            cost: 1000,
            rarity: "epic",
            isPremium: false,
        },

        // --- Titles ---
        {
            name: "The Awakened",
            description: "Has realized their potential.",
            type: "title",
            value: "The Awakened",
            cost: 100,
            rarity: "common",
            isPremium: false,
        },
        {
            name: "Iron Will",
            description: "Unbreakable mental fortitude.",
            type: "title",
            value: "Iron Will",
            cost: 500,
            rarity: "rare",
            isPremium: false,
        },
        {
            name: "Shadow Walker",
            description: "Moves unseen, achieves unknown.",
            type: "title",
            value: "Shadow Walker",
            cost: 800,
            rarity: "epic",
            isPremium: true,
        },
        {
            name: "Grandmaster",
            description: "A master of all trades.",
            type: "title",
            value: "Grandmaster",
            cost: 2000,
            rarity: "legendary",
            isPremium: true,
        },
        {
            name: "Godlike",
            description: "Beyond human limits.",
            type: "title",
            value: "Godlike",
            cost: 10000,
            rarity: "legendary",
            isPremium: true,
        },

        // --- Themes ---
        {
            name: "Midnight",
            description: "Dark mode for the night owls.",
            type: "theme",
            value: "midnight",
            cost: 200,
            rarity: "common",
            isPremium: false,
        },
        {
            name: "Sunset",
            description: "Warm vibes for cool days.",
            type: "theme",
            value: "sunset",
            cost: 500,
            rarity: "rare",
            isPremium: false,
        },

        // --- Consumables & Goal Execution Armory (Tools That Help You Succeed) ---
        {
            name: "Streak Shield",
            description: "Automated protocol preservation. Deploys if a day is missed to safeguard active streak.",
            type: "consumable",
            value: "streak_shield",
            cost: 75,
            rarity: "rare",
            isPremium: false,
        },
        {
            name: "Deload / Reschedule Pass",
            description: "Use on high-fatigue or busy days: scales today's uncompleted hard quests down to lighter Minimum Viable wins without breaking streak.",
            type: "consumable",
            value: "reschedule_pass",
            cost: 60,
            rarity: "rare",
            isPremium: false,
        },
        {
            name: "Focus Escrow Ticket (150m / 48h)",
            description: "Use to lock 100 Coins in commitment escrow: log 150 verified Air-Gap Focus minutes within 48h to win back 150 Coins (1.5x return).",
            type: "consumable",
            value: "focus_escrow_ticket",
            cost: 100,
            rarity: "epic",
            isPremium: false,
        },
        {
            name: "AI Protocol Recalibration Audit",
            description: "Triggers a fresh Goal Coach audit rebuilding your active 4-week Roadmap around current capacity and obstacles.",
            type: "consumable",
            value: "protocol_audit_ticket",
            cost: 90,
            rarity: "epic",
            isPremium: false,
        },
        {
            name: "4-Week Progressive PPL Pack",
            description: "Structured Push/Pull/Legs progressive overload blueprint calibrated for compound strength PRs.",
            type: "program",
            value: "program_pack_ppl",
            cost: 120,
            rarity: "rare",
            isPremium: false,
        },
        {
            name: "4-Week Hybrid Endurance Pack",
            description: "Conditioning & aerobic threshold training block boosting Stamina and metabolic work capacity.",
            type: "program",
            value: "program_pack_5k",
            cost: 120,
            rarity: "rare",
            isPremium: false,
        }
    ];

    for (const seed of seeds) {
        const alreadyExists = items.some(i => i.value === seed.value);
        if (!alreadyExists && (missingTypes.includes(seed.type) || requiredUtilities.includes(seed.value))) {
            await storage.createShopItem(seed);
        }
    }
    hasSeeded = true;
}

// Get all shop items
router.get("/", async (req, res) => {
    // CACHE: Disabled to prevent persisting old UUIDs during development
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');

    const storage = getStorage();
    await seedShop(); // Ensure items exist
    const items = await storage.getShopItems();

    // Check if user is premium to show discounted prices
    const firebaseUid = req.headers["x-firebase-uid"] as string;
    let user = null;
    if (firebaseUid) {
        user = await storage.getUserByFirebaseUid(firebaseUid);
    }

    const processedItems = items; // No discounts

    res.json(processedItems);
});

// Get user inventory
router.get("/inventory", requireAuth, async (req, res) => {
    const storage = getStorage();
    const user = (req as any).user;
    if (!user) return res.status(401).send("Unauthorized");
    const items = await storage.getUserItems(user.id);

    // Enrich with item details
    const enrichedItems = await Promise.all(items.map(async (userItem) => {
        const shopItem = await storage.getShopItem(userItem.itemId);
        return { ...userItem, item: shopItem };
    }));

    res.json(enrichedItems);
});

// Buy item
router.post("/buy", requireAuth, async (req, res) => {
    const storage = getStorage();
    const user = (req as any).user;
    console.log("Buy request initiated");

    if (!user) {
        console.log("User not authenticated");
        return res.status(401).send("Unauthorized");
    }

    const { itemId } = req.body;
    console.log(`User ${user.id} attempting to buy item ${itemId}`);

    if (!itemId) return res.status(400).send("Missing itemId");

    const item = await storage.getShopItem(itemId);
    if (!item) {
        console.log(`Item ${itemId} not found`);
        return res.status(404).send("Item not found");
    }

    // Premium membership check removed as per user request

    const dbUser = await storage.getUser(user.id);
    if (!dbUser) return res.status(404).json({ error: "User not found" });

    // SL-2: Gate store purchases while Penalty Zone is active
    if (dbUser.inPenaltyZone) {
        return res.status(403).json({ error: "System Restricted: Clear your Penalty Zone survival quest before accessing the Supply Depot." });
    }

    // Milestone-gate prestige cosmetics so high-tier Titles/Badges represent earned real achievement
    if ((item.type === "title" || item.type === "badge") && item.rarity === "legendary") {
        const qualified = (dbUser.level || 1) >= 5 || (dbUser.streak || 0) >= 7;
        if (!qualified) {
            return res.status(403).json({
                error: "Milestone Locked: Reach Level 5 or a 7-day unbroken streak to unlock Legendary prestige cosmetics.",
            });
        }
    }

    // Calculate actual cost
    let effectiveCost = item.cost;

    console.log(`User coins: ${dbUser.coins}, Item effective cost: ${effectiveCost}`);

    // Check if already owned / capacity reached
    const inventory = await storage.getUserItems(dbUser.id);
    if (item.type === "consumable") {
        const ownedCount = inventory.filter(i => i.itemId === itemId).length;
        if (ownedCount >= 2) {
            console.log("Consumable capacity reached (max 2)");
            return res.status(400).json({ error: "Maximum capacity reached for this item (limit: 2)" });
        }
    } else if (inventory.some(i => i.itemId === itemId)) {
        console.log("Item already owned");
        return res.status(400).json({ error: "Item already owned" });
    }

    // Check funds
    if (dbUser.coins < effectiveCost) {
        console.log("Insufficient funds");
        return res.status(400).json({ error: "Insufficient coins" });
    }

    // Deduct coins & apply consumable effects
    if (item.value === "streak_shield") {
        await storage.updateUser(dbUser.id, { 
            coins: dbUser.coins - effectiveCost,
            streakShields: Math.min(5, (dbUser.streakShields || 0) + 1)
        });
    } else {
        await storage.updateUser(dbUser.id, { coins: dbUser.coins - effectiveCost });
    }

    // Add to inventory
    const userItem = await storage.createUserItem({
        userId: dbUser.id,
        itemId: item.id,
        equipped: false,
    });

    console.log("Purchase successful");
    res.json({ success: true, item: userItem, newBalance: dbUser.coins - effectiveCost });
});

// Equip item
router.post("/equip", requireAuth, async (req, res) => {
    const storage = getStorage();
    const user = (req as any).user;
    if (!user) return res.status(401).send("Unauthorized");
    const { itemId, type } = req.body; // type: 'avatar' | 'badge' | 'theme' | 'title'

    if (!itemId || !type) return res.status(400).send("Missing itemId or type");

    // Verify ownership
    const inventory = await storage.getUserItems(user.id);
    const userItem = inventory.find(i => i.itemId === itemId);

    if (!userItem) {
        return res.status(403).send("Item not owned");
    }

    const shopItem = await storage.getShopItem(itemId);
    if (!shopItem) return res.status(404).send("Item details not found");

    if (shopItem.type !== type) {
        return res.status(400).send("Item type mismatch");
    }

    // Update User Profile based on type
    if (type === "avatar") {
        await storage.updateUser(user.id, { avatarUrl: shopItem.value });
    } else if (type === "badge") {
        await storage.updateUser(user.id, { activeBadgeId: shopItem.id });
    } else if (type === "theme") {
        await storage.updateUser(user.id, { theme: shopItem.value });
    } else if (type === "title") {
        await storage.updateUser(user.id, { activeTitle: shopItem.value });
    }

    // Unequip others of same type
    for (const invItem of inventory) {
        const invShopItem = await storage.getShopItem(invItem.itemId);
        if (invShopItem && invShopItem.type === type && invItem.equipped) {
            await storage.updateUserItem(invItem.id, { equipped: false });
        }
    }

    // Equip new one
    await storage.updateUserItem(userItem.id, { equipped: true });

    res.json({ success: true });
});

// Use Utility Armory Consumable / Program Item (Real Goal Execution Effect)
router.post("/use", requireAuth, async (req, res) => {
    try {
        const storage = getStorage();
        const user = (req as any).user;
        if (!user) return res.status(401).send("Unauthorized");

        const { itemId, value } = req.body || {};
        if (!itemId && !value) {
            return res.status(400).json({ error: "Provide itemId or utility value to activate." });
        }

        const inventory = await storage.getUserItems(user.id);
        const allShopItems = await storage.getShopItems();
        let matchedUserItem: (typeof inventory)[number] | undefined;
        let matchedShopItem: (typeof allShopItems)[number] | undefined;

        for (const ui of inventory) {
            const si = allShopItems.find((s) => s.id === ui.itemId);
            if (!si) continue;
            if ((itemId && (ui.itemId === itemId || ui.id === itemId)) || (value && si.value === value)) {
                matchedUserItem = ui;
                matchedShopItem = si;
                break;
            }
        }

        if (!matchedUserItem || !matchedShopItem) {
            return res.status(404).json({ error: "Utility item not owned in inventory." });
        }

        const dbUser = await storage.getUser(user.id);
        if (!dbUser) return res.status(404).json({ error: "User not found." });

        let effectMessage = "";

        if (matchedShopItem.value === "reschedule_pass") {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const quests = await storage.getUserQuests(user.id);
            let scaledCount = 0;
            for (const q of quests) {
                if (!q.completed && q.type === "daily" && new Date(q.createdAt) >= today) {
                    await storage.updateQuest(q.id, {
                        difficulty: "easy",
                        targetMinutes: q.targetMinutes ? Math.min(20, q.targetMinutes) : q.targetMinutes,
                        description: `[DELOAD PASS] Scaled to Minimum Viable step: ${q.description}`,
                    });
                    scaledCount++;
                }
            }
            await storage.deleteUserItem(matchedUserItem.id);
            effectMessage = `Deload Pass activated: ${scaledCount} today quest(s) scaled into Minimum Viable steps.`;
        } else if (matchedShopItem.value === "focus_escrow_ticket") {
            if (dbUser.activeFocusEscrow) {
                return res.status(409).json({ error: "An active Focus Escrow contract is already running." });
            }
            const now = Date.now();
            await storage.updateUser(user.id, {
                activeFocusEscrow: {
                    stakeCoins: matchedShopItem.cost,
                    targetMinutes: 150,
                    progressMinutes: 0,
                    createdAt: new Date(now).toISOString(),
                    expiresAt: new Date(now + 48 * 60 * 60 * 1000).toISOString(),
                },
            });
            await storage.deleteUserItem(matchedUserItem.id);
            effectMessage = "Focus Escrow LOCKED: Complete 150 Air-Gap minutes in 48h to earn 150 Coins (1.5x payout).";
        } else if (matchedShopItem.value === "protocol_audit_ticket") {
            const { provisionRoadmapForGoal } = await import("./roadmaps");
            await provisionRoadmapForGoal(storage, dbUser, { replaceExisting: true });
            await storage.deleteUserItem(matchedUserItem.id);
            effectMessage = "AI Protocol Recalibration Audit complete: Active 4-week Roadmap updated to your current pace.";
        } else if (matchedShopItem.value.startsWith("program_pack_")) {
            await storage.updateUser(user.id, {
                lastCoachSummary: `Active Training Blueprint: ${matchedShopItem.name}. Launch sets from Workout -> Official Templates.`,
                lastCoachAt: new Date(),
            });
            effectMessage = `${matchedShopItem.name} activated! Open Workout Templates to run your structured progressive sessions.`;
        } else {
            return res.status(400).json({ error: "This item has no manual activation action." });
        }

        const refreshed = await storage.getUser(user.id);
        res.json({ success: true, message: effectMessage, user: refreshed });
    } catch (err: any) {
        console.error("Shop item activation error:", err);
        res.status(500).json({ error: err.message || "Failed to activate item" });
    }
});

export default router;
