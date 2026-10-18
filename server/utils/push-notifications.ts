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
            title: "⚔️ Quest Complete!",
            body: `"${questTitle}" done! +${xp} XP earned.`,
            url: "/quests",
        }),

    levelUp: (userId: string, newLevel: number) =>
        sendPushToUser(userId, {
            title: "🎉 Level Up!",
            body: `You are now Level ${newLevel}. Keep ascending!`,
            url: "/stats",
        }),

    partnerRequest: (userId: string, requesterName: string) =>
        sendPushToUser(userId, {
            title: "🤝 New Partner Request",
            body: `${requesterName} wants to connect as a study partner!`,
            url: "/partners",
        }),

    streakReminder: (userId: string, streakDays: number) =>
        sendPushToUser(userId, {
            title: "🔥 Don't Break Your Streak!",
            body: `You have a ${streakDays}-day streak. Complete a quest before midnight!`,
            url: "/quests",
        }),

    rankUp: (userId: string, newTier: string) =>
        sendPushToUser(userId, {
            title: "🏆 Rank Up!",
            body: `You've reached Tier ${newTier}. A new chapter begins!`,
            url: "/stats",
        }),

    // ─── 4 Pillars Execution Protocol Push Notifications ───
    morningBriefing: (userId: string, failureStatement?: string) =>
        sendPushToUser(userId, {
            title: "📋 MORNING BRIEFING LOCK",
            body: failureStatement
                ? `Orders locked: "${failureStatement.substring(0, 60)}..." Accept your mission now.`
                : "Daily orders generated. Confirm your single mission before cognitive drift sets in.",
            url: "/mission-command",
        }),

    midDayPulse: (userId: string, missionTitle?: string) =>
        sendPushToUser(userId, {
            title: "⚠️ 13:00 MID-DAY PULSE INTERCEPT",
            body: `50% of today has elapsed. "${missionTitle || 'Primary mission'}" incomplete. Declare your 30-min action now.`,
            url: "/mission-command",
        }),

    eveningDebrief: (userId: string) =>
        sendPushToUser(userId, {
            title: "📊 MANDATORY EVENING DEBRIEF",
            body: "Day concluding. The AI Chief of Staff requires your written assessment before 23:59.",
            url: "/evening-debrief",
        }),

    sundayPerformanceCourt: (userId: string, verdict: string = "Audit In Session") =>
        sendPushToUser(userId, {
            title: "⚖️ PERFORMANCE COURT CONVENED",
            body: `Weekly judicial audit complete. Status: ${verdict}. Review your roadmap trajectory.`,
            url: "/performance-court",
        }),

    squadDefectorAlert: (userId: string, defectorName: string, dividendPoints: number) =>
        sendPushToUser(userId, {
            title: "💀 SQUAD PACT LIQUIDATION",
            body: `${defectorName} defaulted. Their stake was liquidated. +${dividendPoints} pts performance dividend credited to you.`,
            url: "/squad-pact",
        }),
};
