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
                const oldXp = user.xp;
                const newXp = oldXp + xpDelta;
                
                // Detection for level up
                const oldLevel = Math.floor(oldXp / 100) + 1;
                const newLevel = Math.floor(newXp / 100) + 1;
                
                // Detection for rank up
                const getTier = (xp: number) => {
                    const { TIER_THRESHOLDS } = require("@shared/schema");
                    if (xp >= TIER_THRESHOLDS.S) return "S";
                    if (xp >= TIER_THRESHOLDS.A) return "A";
                    if (xp >= TIER_THRESHOLDS.B) return "B";
                    if (xp >= TIER_THRESHOLDS.C) return "C";
                    return "D";
                };
                const oldTier = getTier(oldXp);
                const newTier = getTier(newXp);

                await storage.updateUser(userId, {
                    xp: newXp,
                    coins: user.coins + coinsDelta,
                    level: newLevel,
                    tier: newTier as any
                });

                // Send push notifications
                try {
                    const { pushNotifications } = await import("../utils/push-notifications");
                    if (newLevel > oldLevel) {
                        await pushNotifications.levelUp(userId, newLevel);
                    }
                    if (newTier !== oldTier) {
                        await pushNotifications.rankUp(userId, newTier);
                    }
                } catch (pushErr) {
                    console.error("[Sync] Level/Rank push failed:", pushErr);
                }
            }
        }

        // 4. Mark Quests Complete
        for (const questId of completeQuests) {
            // Use updateQuest with partial update
            const updatedQuest = await storage.updateQuest(questId, { completed: true });
            
            // Send push notification for quest completion
            if (updatedQuest) {
                try {
                    const { pushNotifications } = await import("../utils/push-notifications");
                    await pushNotifications.questComplete(
                        userId, 
                        updatedQuest.title, 
                        updatedQuest.rewardXP
                    );
                } catch (pushErr) {
                    console.error("[Sync] Push notification failed:", pushErr);
                }
            }
        }

        // 5. Check for Pending Referrals to Complete
        if (completeQuests.length > 0) {
            try {
                // Find any pending referrals where this user is the referred user
                // First get the user's referral profile to find the referrer
                const userProfile = await storage.getReferralProfile(userId);
                
                if (userProfile && userProfile.referredById) {
                    const referrerId = userProfile.referredById;
                    const referrerReferrals = await storage.getReferrals(referrerId);
                    
                    // Find the pending referral for this user
                    const pendingReferral = referrerReferrals.find(r => 
                        r.referredUserId === userId && r.status === "pending"
                    );

                    if (pendingReferral) {
                        // Mark referral as completed
                        // Since we don't have a direct updateReferral method in storage yet, 
                        // we can manually update the referral in the Map if possible, or 
                        // just use incrementReferralCount which is built for this
                        console.log(`[REFERRAL] Marking referral as complete: ${referrerId} -> ${userId}`);
                        
                        // Increment count (this also awards the 3000 coin bonus at 3 referrals)
                        await storage.incrementReferralCount(referrerId);
                        
                        // We also need to manually update the status to "completed" in storage
                        // Let's implement an inline update for the referral record
                        const referralsMap = (storage as any).referrals;
                        if (referralsMap && referralsMap.has(pendingReferral.id)) {
                            const ref = referralsMap.get(pendingReferral.id);
                            ref.status = "completed";
                            referralsMap.set(pendingReferral.id, ref);
                            if (typeof (storage as any).autoSave === 'function') {
                                (storage as any).autoSave();
                            }
                        }

                        // Reward referrer with +200 coins
                        const referrerUser = await storage.getUser(referrerId);
                        if (referrerUser) {
                            await storage.updateUser(referrerId, { coins: (referrerUser.coins ?? 0) + 200 });
                            
                            // Send notification to referrer
                            const completedUser = await storage.getUser(userId);
                            await storage.createNotification({
                                userId: referrerId,
                                type: "achievement",
                                title: "Referral Bonus! 🎉",
                                message: `${completedUser?.name || "Your friend"} completed their first quest! +200 coins awarded to your account.`,
                            });
                        }
                    }
                }
            } catch (err) {
                console.error("[Sync] Error processing referral completion:", err);
            }
        }

        res.json({ success: true, processed: payload.events.length });

    } catch (e) {
        console.error("[Sync] Error:", e);
        res.status(400).json({ error: "Invalid Batch Payload" });
    }
});

export default router;
