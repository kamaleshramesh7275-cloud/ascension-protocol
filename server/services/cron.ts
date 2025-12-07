import { IStorage } from "../storage";
import { generateDailyGuildQuest } from "./quest-generator";

const CRON_INTERVAL = 60 * 60 * 1000; // 1 hour

export function initCronJobs(storage: IStorage) {
    console.log("[Cron] Initializing Cron Jobs...");

    // Run immediately on startup to catch up
    runDailyGuildQuests(storage);

    // Schedule periodic run
    setInterval(() => {
        runDailyGuildQuests(storage);
    }, CRON_INTERVAL);
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
