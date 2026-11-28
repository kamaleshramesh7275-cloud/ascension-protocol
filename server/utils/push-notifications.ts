/**
 * FCM Push Notification Utility
 * Sends push notifications to a user's registered devices via Firebase Admin SDK.
 *
 * Setup: Set FIREBASE_SERVICE_ACCOUNT_JSON env var to the Firebase service account JSON string.
 * Get it from: Firebase Console → Project Settings → Service Accounts → Generate new private key
 */

import { getStorage } from "../storage";

let messagingInstance: any = null;

async function getMessaging() {
    if (messagingInstance) return messagingInstance;

    const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON || process.env.FIREBASE_SERVICE_ACCOUNT;
    if (!serviceAccountJson) {
        console.warn("[Push] FIREBASE_SERVICE_ACCOUNT_JSON not set — push notifications disabled");
        return null;
    }

    try {
        const admin = await import("firebase-admin");
        if (!admin.default.apps.length) {
            const serviceAccount = JSON.parse(serviceAccountJson);
            admin.default.initializeApp({
                credential: admin.default.credential.cert(serviceAccount),
            });
        }
        messagingInstance = admin.default.messaging();
        return messagingInstance;
    } catch (err) {
        console.error("[Push] Failed to initialize Firebase Admin:", err);
        return null;
    }
}

export interface PushPayload {
    title: string;
    body: string;
    icon?: string;
    url?: string;
}

/**
 * Send a push notification to all registered devices of a user.
 * Silently skips if the user has no FCM tokens or if Admin SDK isn't configured.
 */
export async function sendPushToUser(userId: string, payload: PushPayload): Promise<void> {
    const messaging = await getMessaging();
    if (!messaging) return;

    const storage = getStorage();
    const user = await storage.getUser(userId);
    if (!user) return;

    const tokens: string[] = (user as any).fcmTokens || [];
    if (tokens.length === 0) return;

    const message = {
        notification: {
            title: payload.title,
            body: payload.body,
            imageUrl: payload.icon || undefined,
        },
        data: {
            route: payload.url || "/quests",
            title: payload.title,
            body: payload.body,
        },
        android: {
            priority: "high" as const,
            notification: {
                channelId: "system_alerts",
                sound: "default",
                clickAction: "FLUTTER_NOTIFICATION_CLICK",
            },
        },
        webpush: {
            notification: {
                icon: payload.icon || "/icon-192.png",
                badge: "/icon-72.png",
                vibrate: [200, 100, 200],
            },
            fcmOptions: {
                link: payload.url || "/dashboard",
            },
        },
        tokens,
    };

    try {
        const response = await messaging.sendEachForMulticast(message);
        console.log(`[Push] Sent to ${response.successCount}/${tokens.length} devices for user ${userId}`);

        // Clean up invalid tokens
        const invalidTokens: string[] = [];
        response.responses.forEach((resp: any, idx: number) => {
            if (!resp.success) {
                const errCode = resp.error?.code;
                if (
                    errCode === "messaging/invalid-registration-token" ||
                    errCode === "messaging/registration-token-not-registered"
                ) {
                    invalidTokens.push(tokens[idx]);
                }
            }
        });

        if (invalidTokens.length > 0) {
            const validTokens = tokens.filter((t) => !invalidTokens.includes(t));
            await storage.updateUser(userId, { fcmTokens: validTokens } as any);
            console.log(`[Push] Cleaned ${invalidTokens.length} invalid tokens for user ${userId}`);
        }
    } catch (err) {
        console.error("[Push] sendEachForMulticast error:", err);
    }
}

/**
 * Convenience wrappers for specific notification events
 */
export const pushNotifications = {
    questComplete: (userId: string, questTitle: string, xp: number) =>
        sendPushToUser(userId, {
            title: "[MISSION COMPLETE] Objective Verified",
            body: `"${questTitle}" logged. +${xp} XP credited to your telemetry record.`,
            url: "/quests",
        }),

    levelUp: (userId: string, newLevel: number) =>
        sendPushToUser(userId, {
            title: "[TIER ELEVATION] Operational Rank Advanced",
            body: `Security clearance advanced to Level ${newLevel}. Continue your ascent.`,
            url: "/stats",
        }),

    partnerRequest: (userId: string, requesterName: string) =>
        sendPushToUser(userId, {
            title: "[COMMUNICATION INCOMING] Peer Protocol Link",
            body: `${requesterName} has dispatched an accountability partner request.`,
            url: "/partners",
        }),

    streakReminder: (userId: string, streakDays: number) =>
        sendPushToUser(userId, {
            title: "[CRITICAL DISCIPLINE ALERT] Protocol Sequence at Risk",
            body: `Your Day ${streakDays} streak expires at midnight. Complete an operational mission immediately.`,
            url: "/quests",
        }),

    rankUp: (userId: string, newTier: string) =>
        sendPushToUser(userId, {
            title: "[ASCENSION BENCHMARK] Tier Designation Achieved",
            body: `You have crossed into Tier ${newTier}. Increased multipliers active.`,
            url: "/stats",
        }),

    // ─── Solo Leveling System Directives ───
    morningBriefing: (userId: string, failureStatement?: string) =>
        sendPushToUser(userId, {
            title: "[SYSTEM TRANSMISSION // DAILY MANDATE GENERATED]",
            body: failureStatement
                ? `Mandate locked: "${failureStatement.substring(0, 60)}..." Authorize your mission now.`
                : "Hunter. A new gate has materialized for today. Review your 4 daily pillars before embarking.",
            url: "/quests",
        }),

    midDayPulse: (userId: string, missionTitle?: string) =>
        sendPushToUser(userId, {
            title: "[ALERT: ZERO COGNITIVE OUTPUT DETECTED]",
            body: `Half of today has elapsed. "${missionTitle || 'Primary mission'}" incomplete. The Sanctum awaits your calibration.`,
            url: "/focus",
        }),

    eveningDebrief: (userId: string) =>
        sendPushToUser(userId, {
            title: "[COUNTDOWN: 59 MINUTES REMAINING]",
            body: "The System requires your daily debrief before 23:59 or disciplinary proceedings commence.",
            url: "/evening-debrief",
        }),

    sundayPerformanceCourt: (userId: string, verdict: string = "Audit In Session") =>
        sendPushToUser(userId, {
            title: "[SYSTEM VERDICT: WEEKLY DOSSIER SEALED]",
            body: `Weekly performance audit concluded. Trajectory: ${verdict}. Review your roadmap status.`,
            url: "/roadmap",
        }),

    squadDefectorAlert: (userId: string, defectorName: string, dividendPoints: number) =>
        sendPushToUser(userId, {
            title: "[COVENANT ENFORCED // DEFECTION DETECTED]",
            body: `${defectorName} severed protocol. Stake liquidated. +${dividendPoints} pts performance dividend credited.`,
            url: "/squad-pact",
        }),

    covenantBreachWarning: (userId: string, covenantCode: string, counterpartyName: string) =>
        sendPushToUser(userId, {
            title: "[COVENANT BREACH IMMINENT]",
            body: `Counterparty ${counterpartyName} held protocol today. Your stake will be forfeited if you do not execute before midnight.`,
            url: `/covenant/${covenantCode}`,
        }),

    resurrectionAlert: (userId: string, hoursInactive: number) =>
        sendPushToUser(userId, {
            title: "[WARNING: RED GATE DETECTED // DIMENSIONAL SECLUSION ENFORCED]",
            body: `Hunter. You have severed connection for ${hoursInactive} hours. Clear the Comeback Trial to reclaim 50% of your streak.`,
            url: "/quests",
        }),

    penaltyImminentWarning: (userId: string, remainingQuests: number) =>
        sendPushToUser(userId, {
            title: "[URGENT: PENALTY ZONE APPROACHING // T-MINUS 3 HOURS]",
            body: `${remainingQuests} daily quest pillar(s) remain unfulfilled. Complete your mandate before midnight or face Penalty Zone lockdown.`,
            url: "/quests",
        }),

    divisionResult: (
        userId: string,
        tier: string,
        rank: number,
        outcome: "promoted" | "stayed" | "demoted",
        rewardCoins: number
    ) =>
        sendPushToUser(userId, {
            title:
                outcome === "promoted"
                    ? `[DIVISION PROMOTED] #${rank} in ${tier} Pod!`
                    : `[WEEKLY POD SETTLED] Placed #${rank} (${tier})`,
            body:
                outcome === "promoted"
                    ? `You ascended from ${tier} Pod at Rank #${rank}${rewardCoins > 0 ? ` (+${rewardCoins} Coins)` : ""}!`
                    : `Weekly Rival Division settled at Rank #${rank}${rewardCoins > 0 ? ` (+${rewardCoins} Coins)` : ""}. New 10-Hunter Pod live.`,
            url: "/divisions",
        }),
};
