import { Router } from "express";
import { randomUUID } from "crypto";
import { getStorage } from "../storage";
const storage = getStorage();

const router = Router();

// In-memory storage for guild features (will be added to main storage later)
// const guildMessages = new Map<string, any>(); // Moved to storage
const guildQuests = new Map<string, any>();

// Guild XP thresholds for leveling
const GUILD_LEVEL_THRESHOLDS: Record<number, number> = {
    1: 0,
    2: 1000,
    3: 2500,
    4: 5000,
    5: 10000,
    6: 20000,
    7: 35000,
    8: 55000,
    9: 80000,
    10: 100000,
};

// Calculate guild level from XP
function calculateGuildLevel(xp: number): number {
    let level = 1;
    for (let l = 10; l >= 1; l--) {
        if (xp >= GUILD_LEVEL_THRESHOLDS[l]) {
            level = l;
            break;
        }
    }
    return level;
}

// Get guild messages (activity feed)
// Get guild messages (activity feed)
router.get("/:guildId/messages", async (req, res) => {
    try {
        const { guildId } = req.params;
        console.log("GET messages for guild:", guildId);

        const messages = await storage.getGuildMessages(guildId);
        res.json(messages);
    } catch (e) {
        console.error("Get guild messages error:", e);
        res.status(500).json({ error: "Failed to get messages" });
    }
});

// Post guild message
router.post("/:guildId/messages", async (req, res) => {
    try {
        const user = (req as any).user;
        if (!user) return res.status(401).json({ error: "Unauthorized" });

        const { guildId } = req.params;
        const { message } = req.body;

        if (!message || message.trim().length === 0) {
            return res.status(400).json({ error: "Message cannot be empty" });
        }

        // Verify user is in this guild
        if (user.guildId !== guildId) {
            return res.status(403).json({ error: "Not a member of this guild" });
        }

        const newMessage = await storage.addGuildMessage({
            guildId,
            userId: user.id,
            userName: user.name,
            userAvatar: user.avatarUrl,
            message: message.trim(),
            type: 'chat',
            createdAt: new Date(),
        });

        res.json(newMessage);
    } catch (e) {
        console.error("Post guild message error:", e);
        res.status(500).json({ error: "Failed to post message" });
    }
});

// Contribute to guild quest
router.post("/:guildId/quests/:questId/contribute", async (req, res) => {
    try {
        const user = (req as any).user;
        if (!user) return res.status(401).json({ error: "Unauthorized" });

        const { guildId, questId } = req.params;

        // Verify user is in this guild
        if (user.guildId !== guildId) {
            return res.status(403).json({ error: "Not a member of this guild" });
        }

        const quest = guildQuests.get(questId);
        if (!quest) {
            return res.status(404).json({ error: "Quest not found" });
        }

        if (quest.completed) {
            return res.status(400).json({ error: "Quest already completed" });
        }

        // Check if user already contributed
        if (quest.contributors.includes(user.id)) {
            return res.status(400).json({ error: "Already contributed to this quest" });
        }

        // Add contribution
        quest.contributors.push(user.id);
        quest.currentContributions++;

        // Check if quest is complete
        if (quest.currentContributions >= quest.requiredContributions) {
            quest.completed = true;
            quest.completedAt = new Date();

            // Add system message
            const systemMessage = {
                id: randomUUID(),
                guildId,
                userId: 'system',
                userName: 'System',
                message: `Guild Quest "${quest.title}" completed! All members receive ${quest.rewardXP} XP and ${quest.rewardCoins} coins!`,
                type: 'achievement',
                createdAt: new Date(),
            };
            await storage.addGuildMessage(systemMessage);
        }

        guildQuests.set(questId, quest);
        res.json(quest);
    } catch (e) {
        console.error("Contribute to guild quest error:", e);
        res.status(500).json({ error: "Failed to contribute" });
    }
});

// Get guild perks (based on level)
router.get("/:guildId/perks", async (req, res) => {
    try {
        const { storage } = require("../storage");
        const { guildId } = req.params;

        const guild = await storage.getGuild(guildId);
        if (!guild) {
            return res.status(404).json({ error: "Guild not found" });
        }

        const perks = [
            {
                id: 'perk-1',
                name: 'United We Stand',
                description: '+5% XP for all members',
                requiredLevel: 2,
                xpBonus: 0.05,
                unlocked: guild.level >= 2,
            },
            {
                id: 'perk-2',
                name: 'Shared Wealth',
                description: '+10% Coins for all members',
                requiredLevel: 3,
                coinBonus: 0.10,
                unlocked: guild.level >= 3,
            },
            {
                id: 'perk-3',
                name: 'Extra Quest Slot',
                description: '+1 daily quest slot',
                requiredLevel: 5,
                questSlots: 1,
                unlocked: guild.level >= 5,
            },
            {
                id: 'perk-4',
                name: 'Power of Many',
                description: '+10% XP for all members',
                requiredLevel: 7,
                xpBonus: 0.10,
                unlocked: guild.level >= 7,
            },
            {
                id: 'perk-5',
                name: 'Guild Treasury',
                description: '+20% Coins for all members',
                requiredLevel: 10,
                coinBonus: 0.20,
                unlocked: guild.level >= 10,
            },
        ];

        res.json(perks);
    } catch (e) {
        console.error("Get guild perks error:", e);
        res.status(500).json({ error: "Failed to get perks" });
    }
});

// Create initial guild quests (called when guild is created or periodically)
export function createGuildQuests(guildId: string) {
    console.log("Creating guild quests for guild:", guildId);

    const questTemplates = [
        {
            title: "United Front",
            description: "Have 5 members complete any quest",
            requiredContributions: 5,
            rewardXP: 500,
            rewardCoins: 100,
        },
        {
            title: "Strength in Numbers",
            description: "Have 10 members complete any quest",
            requiredContributions: 10,
            rewardXP: 1000,
            rewardCoins: 250,
        },
        {
            title: "Guild Champions",
            description: "Have 3 members reach level 10",
            requiredContributions: 3,
            rewardXP: 750,
            rewardCoins: 200,
        },
    ];

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 1 week

    questTemplates.forEach(template => {
        const quest = {
            id: randomUUID(),
            guildId,
            ...template,
            currentContributions: 0,
            contributors: [],
            completed: false,
            createdAt: new Date(),
            completedAt: null,
            expiresAt,
        };
        guildQuests.set(quest.id, quest);
        console.log("Created quest:", quest.title);
    });

    console.log("Total guild quests:", guildQuests.size);
}

export default router;
