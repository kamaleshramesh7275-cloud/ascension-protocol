import { IStorage } from "../storage";
import { generateDailyGuildQuest } from "./quest-generator";
import { db } from "../db";
import { citadelBuildings } from "@shared/schema";
import { eq, and, lt } from "drizzle-orm";
import { pushNotifications } from "../utils/push-notifications";

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

    // ── Streak Reminder Push Notifications ──────────────────────────────────
    // Fire at 8 PM local time every day: remind users who haven't done a quest today
    const schedule8PM = () => {
        const t = new Date();
        const next8PM = new Date(t);
        next8PM.setHours(20, 0, 0, 0);
        // If it's already past 8 PM today, schedule for tomorrow
        if (next8PM.getTime() <= t.getTime()) {
            next8PM.setDate(next8PM.getDate() + 1);
        }
        const delay = next8PM.getTime() - t.getTime();
        console.log(`[Cron] Streak reminder push scheduled in ${Math.round(delay / 1000 / 60)} minutes (at 8 PM)`);

        setTimeout(async () => {
            await processStreakReminders(storage);
            // Re-schedule for the next day
            setInterval(() => processStreakReminders(storage), 24 * 60 * 60 * 1000);
        }, delay);
    };
    schedule8PM();

    // ── 4 Pillars Autonomous Execution Protocol Schedulers ──
    scheduleDaily(6, 30, "Morning Briefing Dispatcher", () => processMorningBriefings(storage));
    scheduleDaily(13, 0, "Mid-Day Pulse Intercept Dispatcher", () => processMidDayPulses(storage));
    scheduleDaily(21, 0, "Evening Debrief Audit Dispatcher", () => processEveningDebriefs(storage));
    scheduleWeekly(0, 20, 0, "Weekly Performance Court & Squad Liquidation", () => processWeeklyPerformanceCourts(storage));
}

async function processStreakReminders(storage: IStorage) {
    console.log("[Cron] Sending streak reminder push notifications...");
    try {
        const users = await storage.getAllUsers();
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        for (const user of users) {
            // Only remind users who have an active streak
            if (!user.streak || user.streak < 1) continue;

            // Check if they already completed a quest today
            const lastCompleted = (user as any).lastQuestCompletedAt
                ? new Date((user as any).lastQuestCompletedAt)
                : null;

            if (lastCompleted) {
                lastCompleted.setHours(0, 0, 0, 0);
                if (lastCompleted.getTime() >= today.getTime()) {
                    // Already active today — no reminder needed
                    continue;
                }
            }

            // Fire the push notification
            await pushNotifications.streakReminder(user.id, user.streak);
        }
        console.log("[Cron] Streak reminder push notifications sent.");
    } catch (error) {
        console.error("[Cron] Error sending streak reminders:", error);
    }
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
    if (!db || !(db as any).query?.citadelBuildings) return;
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

// ─────────────────────────────────────────────────────────────────────────────
// 4 PILLARS AUTONOMOUS ENFORCER SCHEDULERS & EXECUTORS
// ─────────────────────────────────────────────────────────────────────────────

function scheduleDaily(hour: number, minute: number, label: string, taskFn: () => Promise<void>) {
    const computeDelay = () => {
        const now = new Date();
        const target = new Date(now);
        target.setHours(hour, minute, 0, 0);
        if (target.getTime() <= now.getTime()) {
            target.setDate(target.getDate() + 1);
        }
        return target.getTime() - now.getTime();
    };

    const delay = computeDelay();
    console.log(`[Cron] ${label} scheduled in ${Math.round(delay / 1000 / 60)} minutes (at ${hour}:${minute.toString().padStart(2, '0')})`);

    setTimeout(async () => {
        try {
            await taskFn();
        } catch (e) {
            console.error(`[Cron] Error running ${label}:`, e);
        }
        setInterval(async () => {
            try {
                await taskFn();
            } catch (e) {
                console.error(`[Cron] Error running ${label}:`, e);
            }
        }, 24 * 60 * 60 * 1000);
    }, delay);
}

function scheduleWeekly(dayOfWeek: number, hour: number, minute: number, label: string, taskFn: () => Promise<void>) {
    const computeDelay = () => {
        const now = new Date();
        const target = new Date(now);
        target.setHours(hour, minute, 0, 0);
        const dayDiff = (dayOfWeek - now.getDay() + 7) % 7;
        target.setDate(target.getDate() + dayDiff);
        if (target.getTime() <= now.getTime()) {
            target.setDate(target.getDate() + 7);
        }
        return target.getTime() - now.getTime();
    };

    const delay = computeDelay();
    console.log(`[Cron] ${label} scheduled in ${Math.round(delay / 1000 / 60 / 60)} hours (Weekly Sunday at ${hour}:${minute.toString().padStart(2, '0')})`);

    setTimeout(async () => {
        try {
            await taskFn();
        } catch (e) {
            console.error(`[Cron] Error running ${label}:`, e);
        }
        setInterval(async () => {
            try {
                await taskFn();
            } catch (e) {
                console.error(`[Cron] Error running ${label}:`, e);
            }
        }, 7 * 24 * 60 * 60 * 1000);
    }, delay);
}

/**
 * 06:30 AM — Dispatches Morning Briefing alert to all active operators.
 */
async function processMorningBriefings(storage: IStorage) {
    console.log("[Cron] Executing 06:30 Morning Briefing Dispatcher...");
    try {
        const users = await storage.getAllUsers();
        for (const user of users) {
            const profile = await storage.getExecutionProfile(user.id);
            if (profile) {
                await pushNotifications.morningBriefing(user.id, profile.failureStatement);
            }
        }
        console.log(`[Cron] Morning Briefings dispatched to ${users.length} operators.`);
    } catch (error) {
        console.error("[Cron] Error processing morning briefings:", error);
    }
}

/**
 * 13:00 PM — Mid-Day Pulse Intercept: Alerts operators whose primary mission is incomplete.
 */
async function processMidDayPulses(storage: IStorage) {
    console.log("[Cron] Executing 13:00 Mid-Day Pulse Intercept Dispatcher...");
    try {
        const users = await storage.getAllUsers();
        const todayStr = new Date().toISOString().split("T")[0];

        for (const user of users) {
            const mission = await storage.getDailyMission(user.id, todayStr);
            const existingPulse = await storage.getMidDayPulse(user.id, todayStr);

            // Trigger if mission is missing or incomplete, and not yet acknowledged
            if ((!mission || mission.status !== "completed") && !existingPulse) {
                await pushNotifications.midDayPulse(user.id, mission?.title);
            }
        }
        console.log("[Cron] Mid-Day Pulse Intercept evaluation complete.");
    } catch (error) {
        console.error("[Cron] Error processing mid-day pulses:", error);
    }
}

/**
 * 21:00 PM — Mandatory Evening Debrief Audit summons.
 */
async function processEveningDebriefs(storage: IStorage) {
    console.log("[Cron] Executing 21:00 Evening Debrief Audit Dispatcher...");
    try {
        const users = await storage.getAllUsers();
        const todayStr = new Date().toISOString().split("T")[0];

        for (const user of users) {
            const debrief = await storage.getEveningDebrief(user.id, todayStr);
            if (!debrief) {
                await pushNotifications.eveningDebrief(user.id);
            }
        }
        console.log("[Cron] Evening Debrief summons dispatched.");
    } catch (error) {
        console.error("[Cron] Error processing evening debriefs:", error);
    }
}

/**
 * Sunday 20:00 PM — Weekly Performance Court Convening & Squad Pact Pool Liquidation.
 */
async function processWeeklyPerformanceCourts(storage: IStorage) {
    console.log("[Cron] Executing Sunday 20:00 Performance Court & Squad Liquidation...");
    try {
        const users = await storage.getAllUsers();
        const now = new Date();
        const weekNumber = Math.ceil((now.getDate() - now.getDay() + 1) / 7) || 1;

        for (const user of users) {
            const missions = await storage.getDailyMissions(user.id, 7);
            const sessions = await storage.getFocusDensitySessions(user.id, 14);
            const breaches = await storage.getDisciplineBreaches(user.id, 14);

            const completedCount = missions.filter(m => m.status === "completed").length;
            const actualMinutes = sessions.reduce((acc, s) => acc + (s.actualMinutes || 0), 0);
            const targetMinutes = 900;
            const focusDensity = Math.min(100, Math.round((actualMinutes / targetMinutes) * 100));

            let verdict = "Violated";
            let aiVerdict = "";
            let roadmapImpact = "";

            if (completedCount >= 5 && actualMinutes >= 700) {
                verdict = "Distinction";
                aiVerdict = `COURT VERDICT: High-velocity execution verified. Delivered ${completedCount}/7 missions with ${actualMinutes}m deep work.`;
                roadmapImpact = `Trajectory on schedule. Days saved: +2.`;
            } else if (completedCount >= 3) {
                verdict = "Met";
                aiVerdict = `COURT VERDICT: Compromised velocity. Completed ${completedCount}/7 missions. Behavioral logs reveal hesitation.`;
                roadmapImpact = `Deadline slipped by 4 days. +30% focus minutes required next week.`;
            } else {
                verdict = "Violated";
                aiVerdict = `COURT VERDICT: Severe execution failure. Completed ${completedCount}/7 missions with ${breaches.length} breaches.`;
                roadmapImpact = `Roadmap recalculation recommended. Deadline probability degraded.`;
            }

            // Create court audit
            await storage.createPerformanceCourtAudit({
                userId: user.id,
                weekNumber,
                year: now.getFullYear(),
                missionsAssigned: 7,
                missionsCompleted: completedCount,
                targetFocusMinutes: targetMinutes,
                actualFocusMinutes: actualMinutes,
                focusDensityScore: focusDensity,
                breachesCount: breaches.length,
                aiVerdict,
                roadmapImpact,
                sharedWithSquad: true,
            });

            // If user belongs to a squad pact, evaluate pool distribution
            const squadData = await storage.getUserSquadPact(user.id);
            if (squadData && squadData.pact.status === "active") {
                await storage.distributeSquadPactPool(squadData.pact.id);
            }

            // Fire push notification
            await pushNotifications.sundayPerformanceCourt(user.id, verdict);
        }
        console.log(`[Cron] Weekly Performance Court evaluations completed for ${users.length} operators.`);
    } catch (error) {
        console.error("[Cron] Error processing weekly performance courts:", error);
    }
}
