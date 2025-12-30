import { Router } from "express";
import { getStorage } from "../storage";
// const storage = getStorage();

const router = Router();

// Seed Guilds if empty
async function seedGuilds() {
    const storage = getStorage();
    const guilds = await storage.getAllGuilds();
    if (guilds.length > 0) return;

    // Find or create a system user for guild leadership
    let systemUser = await storage.getUserByFirebaseUid("system_guild_leader");
    if (!systemUser) {
        console.log("Creating system user for guild leadership...");
        systemUser = await storage.createUser({
            firebaseUid: "system_guild_leader",
            name: "System Admin",
            email: "admin@ascension.protocol",
            avatarUrl: null,
            timezone: "UTC",
            onboardingCompleted: true,
            assessmentData: null,
            currentGoal: null,
            studySubject: null,
            studyAvailability: null,
        });
    }

    const seedGuilds = [
        {
            name: "Iron Warriors",
            description: "Forge your body and mind through discipline and strength",
            leaderId: systemUser.id,
            isPublic: true,
            maxMembers: 50,
        },
        {
            name: "Mindful Ascendants",
            description: "Elevate consciousness through meditation and self-reflection",
            leaderId: systemUser.id,
            isPublic: true,
            maxMembers: 50,
        },
        {
            name: "Code Crusaders",
            description: "Master the art of programming and technology",
            leaderId: systemUser.id,
            isPublic: true,
            maxMembers: 50,
        },
        {
            name: "Fitness Fanatics",
            description: "Push your physical limits and achieve peak performance",
            leaderId: systemUser.id,
            isPublic: true,
            maxMembers: 50,
        },
        {
            name: "Knowledge Seekers",
            description: "Pursue wisdom and continuous learning",
            leaderId: systemUser.id,
            isPublic: true,
            maxMembers: 50,
        },
        {
            name: "Creative Collective",
            description: "Express yourself through art, music, and creativity",
            leaderId: systemUser.id,
            isPublic: true,
            maxMembers: 50,
        },
        {
            name: "Business Builders",
            description: "Develop entrepreneurial skills and build successful ventures",
            leaderId: systemUser.id,
            isPublic: true,
            maxMembers: 50,
        },
        {
            name: "Social Champions",
            description: "Improve charisma and build meaningful connections",
            leaderId: systemUser.id,
            isPublic: true,
            maxMembers: 50,
        },
    ];

    for (const guild of seedGuilds) {
        await storage.createGuild(guild);
    }
}

// Get all guilds (pre‑populated)
router.get("/", async (req, res) => {
    try {
        const storage = getStorage();
        await seedGuilds(); // Ensure guilds exist
        const guilds = await storage.getAllGuilds();
        const enriched = await Promise.all(
            guilds.map(async (g) => {
                const members = await storage.getGuildMembers(g.id);
                const totalXP = members.reduce((sum: number, m: any) => sum + m.xp, 0);
                return { ...g, memberCount: members.length, totalXP };
            })
        );
        res.json(enriched);
    } catch (e) {
        console.error("GET guilds error", e);
        res.status(500).json({ error: "Failed to get guilds" });
    }
});

// Get guild by ID (with members)
router.get("/:id", async (req, res) => {
    try {
        const storage = getStorage();
        const { id } = req.params;
        const guild = await storage.getGuild(id);
        if (!guild) return res.status(404).json({ error: "Guild not found" });
        const members = await storage.getGuildMembers(id);
        const totalXP = members.reduce((sum: number, m: any) => sum + m.xp, 0);
        res.json({ ...guild, members, memberCount: members.length, totalXP });
    } catch (e) {
        console.error("GET guild error", e);
        res.status(500).json({ error: "Failed to get guild" });
    }
});

// Get guild members
router.get("/:id/members", async (req, res) => {
    try {
        const storage = getStorage();
        const { id } = req.params;
        const members = await storage.getGuildMembers(id);
        res.json(members);
    } catch (e) {
        console.error("GET guild members error", e);
        res.status(500).json({ error: "Failed to get guild members" });
    }
});

// Join a guild – assign roles based on join order
router.post("/:id/join", async (req, res) => {
    try {
        const storage = getStorage();
        const user = (req as any).user;
        console.log("Join request - User:", user ? user.id : "NO USER");

        if (!user) return res.status(401).json({ error: "Unauthorized" });

        // Check if user is already in a guild
        if (user.guildId) {
            console.log("User already in guild:", user.guildId);
            return res.status(400).json({ error: "Already in a guild" });
        }

        const { id } = req.params;
        console.log("Attempting to join guild:", id);

        const guild = await storage.getGuild(id);
        if (!guild) {
            console.log("Guild not found:", id);
            return res.status(404).json({ error: "Guild not found" });
        }

        const members = await storage.getGuildMembers(id);
        console.log("Current members:", members.length);

        if (members.length >= 50) {
            return res.status(400).json({ error: "Guild is full" });
        }

        // Determine Role and Updates
        const updates: any = {
            memberCount: members.length + 1
        };

        console.log(`User ${user.id} joining guild ${id}. Current members: ${members.length}`);

        // If no members (or leaderId is empty/invalid), this user becomes leader
        if (members.length === 0 || !guild.leaderId) {
            console.log("Assigning as leader");
            updates.leaderId = user.id;
        } else if (members.length < 6) {
            console.log("Assigning as Vice President");
            // Next 5 members become Vice Presidents
            const currentVPs = guild.vicePresidentIds || [];
            updates.vicePresidentIds = [...currentVPs, user.id];
        }

        console.log("Updating guild with:", updates);
        await storage.updateGuild(id, updates);

        console.log("Updating user with guildId:", id);
        await storage.updateUser(user.id, { guildId: id });

        console.log("Join successful!");
        res.json({ success: true });
    } catch (e) {
        console.error("Join guild error:", e);
        if (e instanceof Error) {
            console.error("Error message:", e.message);
            console.error("Stack:", e.stack);
        }
        res.status(500).json({ error: e instanceof Error ? e.message : "Failed to join guild" });
    }
});

// Leave guild – handle leader transfer or disband
router.post("/leave", async (req, res) => {
    try {
        const storage = getStorage();
        const user = (req as any).user;
        if (!user) return res.status(401).send("Unauthorized");
        if (!user.guildId) return res.status(400).json({ error: "Not in a guild" });
        const guild = await storage.getGuild(user.guildId);
        if (!guild) return res.status(404).json({ error: "Guild not found" });

        // If leader leaves, disband if no other members
        if (guild.leaderId === user.id) {
            const members = await storage.getGuildMembers(guild.id);
            if (members.length > 1) {
                return res.status(400).json({ error: "Transfer leadership before leaving" });
            }
            await storage.deleteGuild(guild.id);
        } else {
            // Remove from vice‑president list if present
            const vpIds = (guild as any).vicePresidentIds || [];
            const idx = vpIds.indexOf(user.id);
            if (idx !== -1) {
                vpIds.splice(idx, 1);
                await storage.updateGuild(guild.id, { vicePresidentIds: vpIds });
            }

            // Update member count
            const members = await storage.getGuildMembers(guild.id);
            await storage.updateGuild(guild.id, { memberCount: Math.max(0, members.length - 1) });
        }

        await storage.updateUser(user.id, { guildId: null });
        res.json({ success: true });
    } catch (e) {
        console.error("Leave guild error", e);
        res.status(500).json({ error: "Failed to leave guild" });
    }
});

// Kick member – only leader can kick
router.post("/:id/kick/:userId", async (req, res) => {
    try {
        const storage = getStorage();
        const user = (req as any).user;
        if (!user) return res.status(401).send("Unauthorized");
        const { id, userId } = req.params;
        const guild = await storage.getGuild(id);
        if (!guild) return res.status(404).json({ error: "Guild not found" });
        if (guild.leaderId !== user.id) return res.status(403).json({ error: "Only leader can kick" });
        if (userId === user.id) return res.status(400).json({ error: "Use leave endpoint" });

        const target = await storage.getUser(userId);
        if (!target || target.guildId !== id) return res.status(404).json({ error: "User not in guild" });

        // Remove from vice‑president list if needed
        const vpIds = (guild as any).vicePresidentIds || [];
        const idx = vpIds.indexOf(userId);
        if (idx !== -1) {
            vpIds.splice(idx, 1);
            await storage.updateGuild(id, { vicePresidentIds: vpIds });
        }

        // Update member count
        const members = await storage.getGuildMembers(id);
        await storage.updateGuild(id, { memberCount: Math.max(0, members.length - 1) });

        await storage.updateUser(userId, { guildId: null });
        res.json({ success: true });
    } catch (e) {
        console.error("Kick error", e);
        res.status(500).json({ error: "Failed to kick" });
    }
});

// ===== GUILD QUESTS =====

// Get all quests for a guild
router.get("/:id/quests", async (req, res) => {
    try {
        const storage = getStorage();
        const { id } = req.params;
        const quests = await storage.getGuildQuests(id);
        res.json(quests);
    } catch (e) {
        console.error("Get guild quests error", e);
        res.status(500).json({ error: "Failed to get quests" });
    }
});

// Create a new guild quest (President only)
router.post("/:id/quests", async (req, res) => {
    try {
        const storage = getStorage();
        const user = (req as any).user;
        if (!user) return res.status(401).json({ error: "Unauthorized" });

        const { id } = req.params;
        const guild = await storage.getGuild(id);
        if (!guild) return res.status(404).json({ error: "Guild not found" });

        // Check if user is president
        if (guild.leaderId !== user.id) {
            return res.status(403).json({ error: "Only guild president can create quests" });
        }

        const quest = await storage.createGuildQuest({
            guildId: id,
            ...req.body,
        });

        res.json(quest);
    } catch (e) {
        console.error("Create guild quest error", e);
        res.status(500).json({ error: "Failed to create quest" });
    }
});

// Get progress for a specific quest
router.get("/quests/:questId/progress", async (req, res) => {
    try {
        const storage = getStorage();
        const { questId } = req.params;
        const progress = await storage.getGuildQuestProgress(questId);
        res.json(progress);
    } catch (e) {
        console.error("Get quest progress error", e);
        res.status(500).json({ error: "Failed to get progress" });
    }
});

// ===== GUILD PERKS =====

// Get all available perks
router.get("/perks/catalog", async (req, res) => {
    try {
        const storage = getStorage();
        const perks = await storage.getAllGuildPerks();
        res.json(perks);
    } catch (e) {
        console.error("Get perks error", e);
        res.status(500).json({ error: "Failed to get perks" });
    }
});

// Get active perks for a guild
router.get("/:id/perks", async (req, res) => {
    try {
        const storage = getStorage();
        const { id } = req.params;
        const perks = await storage.getGuildActivePerks(id);
        res.json(perks);
    } catch (e) {
        console.error("Get active perks error", e);
        res.status(500).json({ error: "Failed to get active perks" });
    }
});

// Purchase a perk (President only)
router.post("/:id/perks/purchase", async (req, res) => {
    try {
        const storage = getStorage();
        const user = (req as any).user;
        if (!user) return res.status(401).json({ error: "Unauthorized" });

        const { id } = req.params;
        const { perkId } = req.body;

        const guild = await storage.getGuild(id);
        if (!guild) return res.status(404).json({ error: "Guild not found" });

        // Check if user is president
        if (guild.leaderId !== user.id) {
            return res.status(403).json({ error: "Only guild president can purchase perks" });
        }

        await storage.purchaseGuildPerk(id, perkId);
        res.json({ success: true });
    } catch (e) {
        console.error("Purchase perk error", e);
        res.status(500).json({ error: e instanceof Error ? e.message : "Failed to purchase perk" });
    }
});

// ===== GUILD DONATIONS =====

// Donate to guild
router.post("/:id/donate", async (req, res) => {
    try {
        const storage = getStorage();
        const user = (req as any).user;
        if (!user) return res.status(401).json({ error: "Unauthorized" });

        const { id } = req.params;
        const { amount } = req.body;

        if (!amount || amount <= 0) {
            return res.status(400).json({ error: "Invalid donation amount" });
        }

        const donation = await storage.donateToGuild(id, user.id, amount);
        res.json(donation);
    } catch (e) {
        console.error("Donate error", e);
        res.status(500).json({ error: e instanceof Error ? e.message : "Failed to donate" });
    }
});

// Get donation history
router.get("/:id/donations", async (req, res) => {
    try {
        const storage = getStorage();
        const { id } = req.params;
        const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
        const donations = await storage.getGuildDonations(id, limit);

        // Enrich with user names
        const enriched = await Promise.all(
            donations.map(async (d) => {
                const user = await storage.getUser(d.userId);
                return { ...d, userName: user?.name || "Unknown" };
            })
        );

        res.json(enriched);
    } catch (e) {
        console.error("Get donations error", e);
        res.status(500).json({ error: "Failed to get donations" });
    }
});

// Get treasury balance
router.get("/:id/treasury", async (req, res) => {
    try {
        const storage = getStorage();
        const { id } = req.params;
        const treasury = await storage.getGuildTreasury(id);
        res.json({ treasury });
    } catch (e) {
        console.error("Get treasury error", e);
        res.status(500).json({ error: "Failed to get treasury" });
    }
});

// Get guild messages
router.get("/:id/messages", async (req, res) => {
    try {
        const storage = getStorage();
        const { id } = req.params;
        const messages = await storage.getGuildMessages(id);
        res.json(messages);
    } catch (e) {
        console.error("Get guild messages error", e);
        res.status(500).json({ error: "Failed to get messages" });
    }
});

// Send guild message
router.post("/:id/messages", async (req, res) => {
    try {
        const storage = getStorage();
        const { id } = req.params;
        const user = (req as any).user;
        if (!user) return res.status(401).json({ error: "Unauthorized" });

        const { message } = req.body;
        if (!message || !message.trim()) {
            return res.status(400).json({ error: "Message is required" });
        }

        const fullUser = await storage.getUser(user.id);
        if (!fullUser) return res.status(404).json({ error: "User not found" });

        const newMessage = await storage.addGuildMessage({
            guildId: id,
            userId: user.id,
            content: message.trim(), // API sends 'message', storage expects 'content'
        });

        res.json(newMessage);
    } catch (e) {
        console.error("Send guild message error", e);
        res.status(500).json({ error: "Failed to send message" });
    }
});

export default router;
