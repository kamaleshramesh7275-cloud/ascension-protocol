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

    // Handle guest users OR users lost due to server restart (MemStorage)
    if (!user) {
        const isGuest = firebaseUid.startsWith("guest_");
        const isLocal = firebaseUid.startsWith("local_");

        if (isGuest || isLocal) {
            user = await storage.createUser({
                firebaseUid,
                name: isGuest ? "Guest Ascendant" : "Ascendant",
                email: isGuest ? `${firebaseUid}@guest.com` : "user@ascension.com",
                avatarUrl: null,
                timezone: "UTC",
                onboardingCompleted: !isGuest, // Assume real users have onboarded
            });

            // Give them coins to test shop if they were lost
            if (!isGuest) {
                await storage.updateUser(user.id, { coins: 1000 });
            }
        }
    }

    if (!user) {
        return res.status(401).json({ error: "Unauthorized" });
    }

    console.log(`Auth check for ${req.path}`);
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
