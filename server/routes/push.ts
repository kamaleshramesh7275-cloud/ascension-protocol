import { Router } from "express";
import { getStorage } from "../storage";
import { sendPushToUser, pushNotifications } from "../utils/push-notifications";

const router = Router();

// Admin password check helper
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin123";
const isAdmin = (req: any) => req.headers["x-admin-password"] === ADMIN_PASSWORD;

// POST /api/push/register — save FCM token for current user
router.post("/push/register", async (req, res) => {
    const userId = req.headers["x-firebase-uid"] as string;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const { token } = req.body;
    if (!token || typeof token !== "string") {
        return res.status(400).json({ error: "Missing FCM token" });
    }

    try {
        const storage = getStorage();
        const user = await storage.getUserByFirebaseUid(userId);
        if (!user) return res.status(404).json({ error: "User not found" });

        // Store token in user's fcmTokens array (no duplicates)
        const existing: string[] = (user as any).fcmTokens || [];
        if (!existing.includes(token)) {
            const updated = [...existing, token].slice(-5); // Keep max 5 tokens (multi-device)
            await storage.updateUser(user.id, { fcmTokens: updated } as any);
        }

        res.json({ success: true });
    } catch (err) {
        console.error("[Push] Register error:", err);
        res.status(500).json({ error: "Failed to register token" });
    }
});

// DELETE /api/push/unregister — remove FCM token (logout)
router.delete("/push/unregister", async (req, res) => {
    const userId = req.headers["x-firebase-uid"] as string;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const { token } = req.body;
    if (!token) return res.status(400).json({ error: "Missing token" });

    try {
        const storage = getStorage();
        const user = await storage.getUserByFirebaseUid(userId);
        if (!user) return res.status(404).json({ error: "User not found" });

        const existing: string[] = (user as any).fcmTokens || [];
        const updated = existing.filter((t) => t !== token);
        await storage.updateUser(user.id, { fcmTokens: updated } as any);

        res.json({ success: true });
    } catch (err) {
        console.error("[Push] Unregister error:", err);
        res.status(500).json({ error: "Failed to unregister token" });
    }
});

// POST /api/push/test — test notification (dev only)
router.post("/push/test", async (req, res) => {
    const userId = req.headers["x-firebase-uid"] as string;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    try {
        const storage = getStorage();
        const user = await storage.getUserByFirebaseUid(userId);
        if (!user) return res.status(404).json({ error: "User not found" });

        await sendPushToUser(user.id, {
            title: "🔔 Test Notification",
            body: "Push notifications are working! Your Ascension journey continues.",
            url: "/dashboard",
        });

        res.json({ success: true, message: "Test push sent" });
    } catch (err) {
        console.error("[Push] Test error:", err);
        res.status(500).json({ error: "Failed to send test push" });
    }
});

// ─── ADMIN PUSH ROUTES ────────────────────────────────────────────────────────

// POST /api/push/admin/send — send push to a specific user (admin only)
router.post("/push/admin/send", async (req, res) => {
    if (!isAdmin(req)) return res.status(403).json({ error: "Forbidden" });

    const { userId, title, body, url } = req.body;
    if (!userId || !title || !body) {
        return res.status(400).json({ error: "userId, title, and body are required" });
    }

    try {
        await sendPushToUser(userId, { title, body, url: url || "/dashboard" });
        console.log(`[Push Admin] Sent custom push to user ${userId}`);
        res.json({ success: true, message: `Push sent to user ${userId}` });
    } catch (err) {
        console.error("[Push Admin] Send error:", err);
        res.status(500).json({ error: "Failed to send push notification" });
    }
});

// POST /api/push/admin/broadcast — send push to ALL users (admin only)
router.post("/push/admin/broadcast", async (req, res) => {
    if (!isAdmin(req)) return res.status(403).json({ error: "Forbidden" });

    const { title, body, url } = req.body;
    if (!title || !body) {
        return res.status(400).json({ error: "title and body are required" });
    }

    try {
        const storage = getStorage();
        const users = await storage.getAllUsers();
        let sent = 0;
        let skipped = 0;

        for (const user of users) {
            const tokens: string[] = (user as any).fcmTokens || [];
            if (tokens.length === 0) { skipped++; continue; }
            await sendPushToUser(user.id, { title, body, url: url || "/dashboard" });
            sent++;
        }

        console.log(`[Push Admin] Broadcast sent to ${sent} users, ${skipped} skipped (no tokens)`);
        res.json({ success: true, message: `Push broadcast sent to ${sent} users (${skipped} had no tokens)` });
    } catch (err) {
        console.error("[Push Admin] Broadcast error:", err);
        res.status(500).json({ error: "Failed to broadcast push notification" });
    }
});

// GET /api/push/admin/stats — get push token stats per user (admin only)
router.get("/push/admin/stats", async (req, res) => {
    if (!isAdmin(req)) return res.status(403).json({ error: "Forbidden" });

    try {
        const storage = getStorage();
        const users = await storage.getAllUsers();
        const stats = users.map((u) => ({
            id: u.id,
            name: u.name,
            email: u.email,
            tokenCount: ((u as any).fcmTokens || []).length,
            hasTokens: ((u as any).fcmTokens || []).length > 0,
        }));
        const subscribedCount = stats.filter((s) => s.hasTokens).length;
        res.json({ total: users.length, subscribed: subscribedCount, users: stats });
    } catch (err) {
        console.error("[Push Admin] Stats error:", err);
        res.status(500).json({ error: "Failed to fetch push stats" });
    }
});

export default router;
