import { Router } from "express";
import { getStorage } from "../storage";
import { requireAuth } from "../middleware/auth";

const router = Router();

// Get current active war for user's guild
router.get("/active", requireAuth, async (req, res) => {
    try {
        const storage = getStorage();
        const user = (req as any).user;

        if (!user.guildId) {
            return res.json(null);
        }

        const activeWar = await storage.getActiveGuildWar(user.guildId);
        res.json(activeWar);
    } catch (error) {
        console.error("Get active war error:", error);
        res.status(500).json({ error: "Failed to get active war" });
    }
});

// Join matchmaking queue
router.post("/matchmaking", requireAuth, async (req, res) => {
    try {
        const storage = getStorage();
        const user = (req as any).user;

        if (!user.guildId) {
            return res.status(400).json({ error: "You must be in a guild to participate in wars" });
        }

        // Check if guild already has an active war
        const existingWar = await storage.getActiveGuildWar(user.guildId);
        if (existingWar) {
            return res.status(400).json({ error: "Your guild is already in a war" });
        }

        // Check if user is guild leader
        const guild = await storage.getGuild(user.guildId);
        if (guild.leaderId !== user.id) {
            return res.status(403).json({ error: "Only the guild leader can start wars" });
        }

        // Check minimum members (3)
        const members = await storage.getGuildMembers(user.guildId);
        if (members.length < 3) {
            return res.status(400).json({ error: "Your guild needs at least 3 members to participate in wars" });
        }

        // Try to find a match
        const war = await storage.findOrCreateGuildWarMatch(user.guildId);

        res.json(war);
    } catch (error) {
        console.error("Matchmaking error:", error);
        res.status(500).json({ error: "Failed to join matchmaking" });
    }
});

// Get war details
router.get("/:warId", requireAuth, async (req, res) => {
    try {
        const storage = getStorage();
        const { warId } = req.params;

        const war = await storage.getGuildWar(warId);
        if (!war) {
            return res.status(404).json({ error: "War not found" });
        }

        res.json(war);
    } catch (error) {
        console.error("Get war error:", error);
        res.status(500).json({ error: "Failed to get war details" });
    }
});

// Get war participants/leaderboard
router.get("/:warId/participants", requireAuth, async (req, res) => {
    try {
        const storage = getStorage();
        const { warId } = req.params;

        const participants = await storage.getWarParticipants(warId);
        res.json(participants);
    } catch (error) {
        console.error("Get participants error:", error);
        res.status(500).json({ error: "Failed to get participants" });
    }
});

// Get war events feed
router.get("/:warId/events", requireAuth, async (req, res) => {
    try {
        const storage = getStorage();
        const { warId } = req.params;

        const events = await storage.getWarEvents(warId);
        res.json(events);
    } catch (error) {
        console.error("Get war events error:", error);
        res.status(500).json({ error: "Failed to get war events" });
    }
});

// Get war history for guild
router.get("/history/:guildId", requireAuth, async (req, res) => {
    try {
        const storage = getStorage();
        const { guildId } = req.params;

        const history = await storage.getGuildWarHistory(guildId);
        res.json(history);
    } catch (error) {
        console.error("Get war history error:", error);
        res.status(500).json({ error: "Failed to get war history" });
    }
});

// Log contribution (internal - called when user completes activities)
router.post("/:warId/contribute", requireAuth, async (req, res) => {
    try {
        const storage = getStorage();
        const { warId } = req.params;
        const { eventType, points, description } = req.body;
        const user = (req as any).user;

        if (!user.guildId) {
            return res.status(400).json({ error: "You must be in a guild" });
        }

        await storage.logWarContribution({
            warId,
            userId: user.id,
            guildId: user.guildId,
            eventType,
            points,
            description,
        });

        res.json({ success: true });
    } catch (error) {
        console.error("Log contribution error:", error);
        res.status(500).json({ error: "Failed to log contribution" });
    }
});

export default router;
