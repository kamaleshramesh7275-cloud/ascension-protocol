import { Router } from "express";
import { getStorage } from "../storage";
import { requireAuth } from "../middleware/auth";
// const storage = getStorage();
import { insertUserItemSchema } from "@shared/schema";
import { z } from "zod";

const router = Router();

// Seed Shop Items if empty
async function seedShop() {
    const storage = getStorage();
    const items = await storage.getShopItems();
    if (items.length > 0) return;

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
        }
    ];

    for (const seed of seeds) {
        await storage.createShopItem(seed);
    }
}

// Get all shop items
router.get("/", async (req, res) => {
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

    // Direct check for premium exclusive items
    if (item.isPremium && !user.isPremium) {
        return res.status(403).send("Premium membership required for this item");
    }

    const dbUser = await storage.getUser(user.id);
    if (!dbUser) return res.status(404).send("User not found");

    // Calculate actual cost
    let effectiveCost = item.cost;

    console.log(`User coins: ${dbUser.coins}, Item effective cost: ${effectiveCost}`);

    // Check if already owned
    const inventory = await storage.getUserItems(dbUser.id);
    if (inventory.some(i => i.itemId === itemId)) {
        console.log("Item already owned");
        return res.status(400).send("Item already owned");
    }

    // Check funds
    if (dbUser.coins < effectiveCost) {
        console.log("Insufficient funds");
        return res.status(400).send("Insufficient funds");
    }

    // Deduct coins
    await storage.updateUser(dbUser.id, { coins: dbUser.coins - effectiveCost });

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

export default router;
