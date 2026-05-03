import { IStorage } from "../storage";
import { generateDailyGuildQuest } from "./quest-generator";
import { db } from "../db";
import { citadelBuildings } from "@shared/schema";
import { eq, and, lt } from "drizzle-orm";

const CRON_INTERVAL = 60 * 60 * 1000; // 1 hour
const CONTAGION_INTERVAL = 6 * 60 * 60 * 1000; // 6 hours

export function initCronJobs(storage: IStorage) {
    console.log("[Cron] Initializing Cron Jobs...");

    processPremiumBonuses(storage);
    processCitadelContagion(storage); // run immediately
    // storage.deleteOldMessages(48) - Removed immediate run to strictly follow midnight schedule, 
    // or we could keep it for safety. User said "set a time a 12 am", implying the schedule is key.
    // I'll leave other checks passing hourly.

    // Schedule periodic run for general tasks
    setInterval(() => {
        processPremiumBonuses(storage);
    }, CRON_INTERVAL);

    // Citadel contagion: spread ruins every 6h
    setInterval(() => {
        processCitadelContagion(storage);
    }, CONTAGION_INTERVAL);

    // Schedule message cleanup at midnight (12 AM)
    const now = new Date();
    const nextMidnight = new Date(now);
    nextMidnight.setHours(24, 0, 0, 0); // Set to 00:00:00 of the next day
    const timeToMidnight = nextMidnight.getTime() - now.getTime();

    console.log(`[Cron] Scheduled message cleanup in ${Math.round(timeToMidnight / 1000 / 60)} minutes (at midnight)`);

    setTimeout(() => {
        console.log("[Cron] Running scheduled midnight message cleanup...");
        storage.deleteOldMessages(48);

        // Repeat every 24 hours
        setInterval(() => {
            console.log("[Cron] Running scheduled midnight message cleanup...");
            storage.deleteOldMessages(48);
        }, 24 * 60 * 60 * 1000);
    }, timeToMidnight);
}

async function processPremiumBonuses(storage: IStorage) {
    console.log("[Cron] Processing Premium Daily Bonuses...");
    try {
        const users = await storage.getAllUsers();
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        for (const user of users) {
            if (user.isPremium) {
                const lastBonus = user.lastPremiumBonusAt ? new Date(user.lastPremiumBonusAt) : null;
                if (lastBonus) lastBonus.setHours(0, 0, 0, 0);

                if (!lastBonus || lastBonus.getTime() < today.getTime()) {
                    console.log(`[Cron] Awarding daily bonus to premium user ${user.name} (${user.id})`);

                    await storage.updateUser(user.id, {
                        coins: user.coins + 100,
                        lastPremiumBonusAt: new Date()
                    });

                    await storage.createNotification({
                        userId: user.id,
                        type: "system",
                        title: "Daily Premium Bonus",
                        message: "You've received your daily 100 Coin Premium bonus! Keep ascending.",
                    });
                }
            }
        }
    } catch (error) {
        console.error("[Cron] Error processing premium bonuses:", error);
    }
}

// ─── CITADEL CONTAGION ────────────────────────────────────────────────────────
// If a ruin hasn't been cleared in 48h, it spreads to adjacent completed buildings
async function processCitadelContagion(storage: IStorage) {
    console.log("[Cron] Processing Citadel Contagion...");
    try {
        const CONTAGION_THRESHOLD_MS = 48 * 60 * 60 * 1000; // 48 hours
        const now = new Date();

        // Get all ruins older than 48h
        const allRuins = await db!.query.citadelBuildings.findMany({
            where: and(
                eq(citadelBuildings.status, "ruined"),
                lt(citadelBuildings.createdAt, new Date(now.getTime() - CONTAGION_THRESHOLD_MS))
            ),
        });

        if (allRuins.length === 0) {
            console.log("[Cron] No ancient ruins found — city is safe.");
            return;
        }

        const ADJACENT = [[-1, 0], [1, 0], [0, -1], [0, 1]];
        let spreadCount = 0;

        for (const ruin of allRuins) {
            for (const [dx, dy] of ADJACENT) {
                const nx = ruin.x + dx;
                const ny = ruin.y + dy;

                const neighbor = await db!.query.citadelBuildings.findFirst({
                    where: and(
                        eq(citadelBuildings.userId, ruin.userId),
                        eq(citadelBuildings.x, nx),
                        eq(citadelBuildings.y, ny),
                        eq(citadelBuildings.status, "completed")
                    ),
                });

                if (neighbor) {
                    // Spread — convert neighbor to ruined
                    await db!.update(citadelBuildings)
                        .set({ status: "ruined" })
                        .where(eq(citadelBuildings.id, neighbor.id));

                    spreadCount++;
                    console.log(`[Cron] Contagion spread to building ${neighbor.id} owned by user ${ruin.userId}`);

                    // Notify the user
                    await storage.createNotification({
                        userId: ruin.userId,
                        type: "citadel_contagion",
                        title: "🔥 Ruin Contagion Spreading!",
                        message: "Your uncleaned ruins are spreading and corrupting adjacent buildings! Clear them immediately before more of your city falls.",
                        read: false,
                    } as any);
                    break; // Only spread once per ruin per cycle to be merciful
                }
            }
        }

        if (spreadCount > 0) {
            console.log(`[Cron] Contagion spread to ${spreadCount} buildings total.`);
        }
    } catch (error) {
        console.error("[Cron] Error processing citadel contagion:", error);
    }
}

async function processGuildWars(storage: IStorage) {
    console.log("[Cron] Checking for completed Guild Wars...");
    try {
        const allGuilds = await storage.getAllGuilds();
        const now = new Date();

        for (const guild of allGuilds) {
            const activeWar = await storage.getActiveGuildWar(guild.id);
            if (activeWar && activeWar.status === "active" && new Date(activeWar.endDate) <= now) {
                console.log(`[Cron] Ending war ${activeWar.id} between ${activeWar.guild1Id} and ${activeWar.guild2Id}`);

                const g1Score = activeWar.guild1Score;
                const g2Score = activeWar.guild2Score;
                const winnerId = g1Score > g2Score ? activeWar.guild1Id : (g2Score > g1Score ? activeWar.guild2Id : null);

                // Distribute rewards to members
                const participants = await storage.getWarParticipants(activeWar.id);
                for (const p of participants) {
                    const isWinner = winnerId === p.guildId;
                    const rewards = activeWar.rewards as any;
                    const xpReward = isWinner ? (rewards?.winnerMemberXP || 0) : (rewards?.loserMemberXP || 0);
                    const coinReward = isWinner ? (rewards?.winnerMemberCoins || 0) : (rewards?.loserMemberCoins || 0);

                    const user = await storage.getUser(p.userId);
                    if (user) {
                        await storage.updateUser(user.id, {
                            xp: user.xp + xpReward,
                            coins: user.coins + coinReward
                        });

                        await storage.createNotification({
                            userId: user.id,
                            type: "guild",
                            title: "Guild War Result",
                            message: `The war has ended! Your guild ${winnerId === null ? "tied" : (isWinner ? "won" : "lost")}. You earned ${xpReward} XP and ${coinReward} Coins.`,
                        });
                    }
                }

                // Update Guild Stats
                const guilds = [activeWar.guild1Id, activeWar.guild2Id];
                for (const gid of guilds) {
                    const isWinner = winnerId === gid;
                    const rewards = activeWar.rewards as any;
                    const guildXP = isWinner ? (rewards?.winnerGuildXP || 0) : (rewards?.loserGuildXP || 0);

                    const g = allGuilds.find(x => x.id === gid);
                    if (g) {
                        await storage.updateGuild(gid, {
                            xp: g.xp + guildXP
                        });
                    }
                }

                // Update war status
                await storage.updateGuildWar(activeWar.id, {
                    status: "completed",
                    winnerId: winnerId as any,
                });
            }
        }
    } catch (error) {
        console.error("[Cron] Error processing guild wars:", error);
    }
}

async function runDailyGuildQuests(storage: IStorage) {
    console.log("[Cron] Running Daily Guild Quest Generation...");
    try {
        const guilds = await storage.getAllGuilds();
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        for (const guild of guilds) {
            // Check existing quests
            const quests = await storage.getGuildQuests(guild.id);

            // Check if any quest was created "today" AND is a daily type
            const hasDailyQuest = quests.some(q => {
                const created = new Date(q.createdAt);
                created.setHours(0, 0, 0, 0);
                return created.getTime() === today.getTime() &&
                    (q.type === "collective_xp" || q.type === "member_participation");
            });

            if (!hasDailyQuest) {
                console.log(`[Cron] Generating daily quest for guild ${guild.name} (${guild.id})`);
                const newQuest = generateDailyGuildQuest(guild.id, guild.level);
                await storage.createGuildQuest(newQuest);
            }
        }
        console.log("[Cron] Daily Guild Quest Generation Completed.");
    } catch (error) {
        console.error("[Cron] Error running daily guild quests:", error);
    }
}
