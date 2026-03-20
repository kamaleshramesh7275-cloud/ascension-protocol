import { Router } from "express";
import { getStorage } from "../storage";
import { sendPushToUser } from "../utils/push-notifications";

const router = Router();

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

export default router;
