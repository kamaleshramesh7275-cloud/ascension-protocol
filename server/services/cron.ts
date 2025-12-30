import { IStorage } from "../storage";
import { generateDailyGuildQuest } from "./quest-generator";

const CRON_INTERVAL = 60 * 60 * 1000; // 1 hour

export function initCronJobs(storage: IStorage) {
    console.log("[Cron] Initializing Cron Jobs...");

    // Run immediately on startup to catch up
    runDailyGuildQuests(storage);
    processGuildWars(storage);

    // Schedule periodic run
    setInterval(() => {
        runDailyGuildQuests(storage);
        processGuildWars(storage);
    }, CRON_INTERVAL);
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
