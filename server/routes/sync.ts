import { Router } from "express";
import { getStorage } from "../storage";
import { z } from "zod";

const router = Router();

// Schema for individual sync events
const syncEventSchema = z.discriminatedUnion("type", [
    z.object({
        type: z.literal("XP_GAIN"),
        amount: z.number(),
        source: z.string()
    }),
    z.object({
        type: z.literal("COIN_GAIN"),
        amount: z.number(),
        source: z.string()
    }),
    z.object({
        type: z.literal("QUEST_COMPLETE"),
        questId: z.string()
    }),
    z.object({
        type: z.literal("ITEM_PURCHASE"),
        itemId: z.string(),
        cost: z.number()
    }),
    z.object({
        type: z.literal("FOCUS_SESSION"),
        duration: z.number(),
        timestamp: z.number()
    }),
]);

const cleanPayloadSchema = z.object({
    events: z.array(syncEventSchema)
});

// Batch Processor
router.post("/sync", async (req, res) => {
    // 1. Auth Check
    const userId = req.headers["x-firebase-uid"] as string;
    if (!userId) {
        return res.status(401).send("Unauthorized: Missing Auth Header (Sync)");
    }

    try {
        const payload = cleanPayloadSchema.parse(req.body);
        const storage = getStorage();

        // 2. Process Batch in Sequence
        let xpDelta = 0;
        let coinsDelta = 0;
        const completeQuests: string[] = [];

        console.log(`[Sync] Processing ${payload.events.length} events for User ${userId}`);

        for (const event of payload.events) {
            switch (event.type) {
                case "XP_GAIN":
                    xpDelta += event.amount;
                    break;
                case "COIN_GAIN":
                    coinsDelta += event.amount;
                    break;
                case "QUEST_COMPLETE":
                    completeQuests.push(event.questId);
                    break;
                case "ITEM_PURCHASE":
                    coinsDelta -= event.cost;
                    break;
                case "FOCUS_SESSION":
                    // Log focus session
                    await storage.createFocusSession({
                        userId,
                        duration: event.duration,
                        xpEarned: Math.floor(event.duration * 5),
                        // completedAt not in schema, ignoring
                    });
                    break;
            }
        }

        // 3. Apply Aggregated Updates
        if (xpDelta !== 0 || coinsDelta !== 0) {
            const user = await storage.getUser(userId);
            if (user) {
                await storage.updateUser(userId, {
                    xp: user.xp + xpDelta,
                    coins: user.coins + coinsDelta
                });
            }
        }

        // 4. Mark Quests Complete
        for (const questId of completeQuests) {
            // Use updateQuest with partial update
            await storage.updateQuest(questId, { completed: true });
        }

        res.json({ success: true, processed: payload.events.length });

    } catch (e) {
        console.error("[Sync] Error:", e);
        res.status(400).json({ error: "Invalid Batch Payload" });
    }
});

export default router;
