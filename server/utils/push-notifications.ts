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

    // ─── 4 Pillars Execution Protocol Push Notifications ───
    morningBriefing: (userId: string, failureStatement?: string) =>
        sendPushToUser(userId, {
            title: "[06:00 DIRECTIVE] Morning Briefing Locked",
            body: failureStatement
                ? `Orders locked: "${failureStatement.substring(0, 60)}..." Authorize your mission now.`
                : "Daily orders generated. Confirm your single mission before cognitive drift sets in.",
            url: "/mission-command",
        }),

    midDayPulse: (userId: string, missionTitle?: string) =>
        sendPushToUser(userId, {
            title: "[13:00 INTERCEPT] Mid-Day Execution Audit",
            body: `50% of today has elapsed. "${missionTitle || 'Primary mission'}" incomplete. Declare your 30-min action now.`,
            url: "/mission-command",
        }),

    eveningDebrief: (userId: string) =>
        sendPushToUser(userId, {
            title: "[21:00 MANDATORY AUDIT] Evening Debrief Required",
            body: "Day concluding. The Chief of Staff requires your written assessment before 23:59.",
            url: "/evening-debrief",
        }),

    sundayPerformanceCourt: (userId: string, verdict: string = "Audit In Session") =>
        sendPushToUser(userId, {
            title: "[PERFORMANCE COURT] Judicial Audit Convened",
            body: `Weekly judicial audit complete. Status: ${verdict}. Review your roadmap trajectory.`,
            url: "/performance-court",
        }),

    squadDefectorAlert: (userId: string, defectorName: string, dividendPoints: number) =>
        sendPushToUser(userId, {
            title: "[PACT LIQUIDATION] Defaulter Stake Distributed",
            body: `${defectorName} defaulted on their contract. Stake liquidated. +${dividendPoints} pts performance dividend credited.`,
            url: "/squad-pact",
        }),

    covenantBreachWarning: (userId: string, covenantCode: string, counterpartyName: string) =>
        sendPushToUser(userId, {
            title: "[COVENANT ALERT] Bilateral Pot in Jeopardy",
            body: `Counterparty ${counterpartyName} held protocol today. Your stake will be forfeited if you do not execute before midnight.`,
            url: `/covenant/${covenantCode}`,
        }),

    resurrectionAlert: (userId: string, hoursInactive: number) =>
        sendPushToUser(userId, {
            title: "[RECOVERY DIRECTIVE] Inactivity Detected",
            body: `${hoursInactive} hours of radio silence. Your accumulated capital is at risk. Return to authorize Resurrection Protocol.`,
            url: "/dashboard",
        }),
};
