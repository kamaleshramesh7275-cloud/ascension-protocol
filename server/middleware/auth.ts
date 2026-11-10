import type { Request, Response } from "express";
import { getStorage } from "../storage";

// Middleware to check Firebase auth (simplified for MVP)
// In production, you'd verify Firebase tokens here
export async function requireAuth(req: Request, res: Response, next: Function) {
    const storage = getStorage(); // Lazy load
    const firebaseUid = req.headers["x-firebase-uid"] as string;

    if (!firebaseUid) {
        return res.status(401).json({ error: "Unauthorized" });
    }

    let user = await storage.getUserByFirebaseUid(firebaseUid);

    // Check if user was explicitly deleted
    if (await storage.isUserDeleted(firebaseUid)) {
        return res.status(403).json({ error: "Account has been deleted" });
    }

    // Handle guest users, local users, or recovered Firebase/Google sessions (e.g. after server restart or fresh token)
    if (!user) {
        const isGuest = firebaseUid.startsWith("guest_");
        const isLocal = firebaseUid.startsWith("local_");

        user = await storage.createUser({
            firebaseUid,
            name: isGuest ? "Guest Ascendant" : "Ascendant",
            email: isGuest ? `${firebaseUid}@guest.com` : `${firebaseUid.slice(0, 10)}@ascension.protocol`,
            avatarUrl: null,
            timezone: "UTC",
            onboardingCompleted: !isGuest, // Assume real users have onboarded
        });

        // Give coins to non-guests
        if (!isGuest) {
            await storage.updateUser(user.id, { coins: 500 });
        }
    }

    if (!user) {
        return res.status(401).json({ error: "Unauthorized" });
    }

    // Calculate subscription status
    const { getSubscriptionStatus } = await import("../utils/subscription");
    const { isPremium, isTrial, trialEndsAt } = getSubscriptionStatus(user);

    // Inject effective premium status
    // We override the DB value with the effective value (Trial OR Premium)
    // This allows existing routes to work without modification
    (user as any).isPremium = isPremium;
    (user as any).isTrial = isTrial;
    (user as any).trialEndsAt = trialEndsAt;

    console.log(`Auth check for ${req.path} | User: ${user.name} | Premium: ${isPremium} (Trial: ${isTrial})`);

    req.firebaseUid = firebaseUid;
    (req as any).user = user;
    next();
}

export async function requireAdmin(req: Request, res: Response, next: Function) {
    const user = (req as any).user;
    if (!user || user.role !== "admin") {
        return res.status(403).json({ error: "Access denied. Admin role required." });
    }
    next();
}

export async function requireAdminPassword(req: Request, res: Response, next: Function) {
    const adminPassword = req.headers["x-admin-password"] as string;
    const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin123";

    if (adminPassword !== ADMIN_PASSWORD) {
        return res.status(403).json({ error: "Unauthorized" });
    }
    next();
}
