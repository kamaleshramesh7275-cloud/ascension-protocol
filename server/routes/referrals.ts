import { Router } from "express";
import type { IStorage } from "../storage";
import { requireAuth } from "../middleware/auth";

export function createReferralRouter(storage: IStorage): Router {
    const router = Router();

    // Validate a referral code
    router.post("/validate", async (req, res) => {
        try {
            const { code } = req.body;

            if (!code || typeof code !== "string") {
                return res.status(400).json({
                    valid: false,
                    message: "Referral code is required"
                });
            }

            const profile = await storage.getReferralProfileByCode(code.toUpperCase());

            if (!profile) {
                return res.status(404).json({
                    valid: false,
                    message: "Invalid referral code"
                });
            }

            const referrer = await storage.getUser(profile.userId);

            res.json({
                valid: true,
                referrerId: profile.userId,
                referrerName: referrer?.name || "Unknown User"
            });
        } catch (error) {
            console.error("Error validating referral code:", error);
            res.status(500).json({
                valid: false,
                message: "Server error"
            });
        }
    });

    // Get current user's referral statistics
    router.get("/user/stats", requireAuth, async (req: any, res) => {
        try {
            const userId = (req as any).user?.id;

            if (!userId) {
                return res.status(401).json({ message: "Unauthorized" });
            }

            const user = await storage.getUser(userId);
            if (!user) {
                return res.status(404).json({ message: "User not found" });
            }

            let profile = await storage.getReferralProfile(userId);

            // Lazy creation if profile doesn't exist
            if (!profile) {
                console.log(`[REFERRALS] Lazily creating referral profile for user ${user.name}`);
                profile = await storage.createReferralProfile({
                    userId,
                    referralCode: user.name.toUpperCase(),
                    referredById: null,
                    totalReferrals: 0,
                });
            }

            res.json({
                referralCode: profile?.referralCode || null,
                totalReferrals: profile?.totalReferrals || 0,
                referrals: []
            });
        } catch (error) {
            console.error("Error fetching user referrals:", error);
            res.status(500).json({ message: "Server error" });
        }
    });

    // Get all referrals (admin only)
    router.get("/admin/all", async (req, res) => {
        try {
            const adminPassword = req.headers["x-admin-password"] as string;
            const EXPECTED_PASSWORD = process.env.ADMIN_PASSWORD || "admin123";

            if (!adminPassword || adminPassword !== EXPECTED_PASSWORD) {
                return res.status(403).json({ message: "Forbidden" });
            }

            const allReferrals = await storage.getAllReferrals(adminPassword);

            res.json({
                total: allReferrals.length,
                referrals: allReferrals.map(r => ({
                    id: r.id,
                    referrer: {
                        id: r.referrer.id,
                        name: r.referrer.name,
                        email: r.referrer.email
                    },
                    referredUser: {
                        id: r.referredUser.id,
                        name: r.referredUser.name,
                        email: r.referredUser.email
                    },
                    status: r.status,
                    createdAt: r.createdAt
                }))
            });
        } catch (error) {
            console.error("Error fetching all referrals:", error);
            res.status(500).json({ message: "Server error" });
        }
    });

    // Backfill referral events from referral profiles (admin only)
    router.post("/admin/backfill", async (req, res) => {
        try {
            const adminPassword = req.headers["x-admin-password"] as string;
            const EXPECTED_PASSWORD = process.env.ADMIN_PASSWORD || "admin123";

            if (!adminPassword || adminPassword !== EXPECTED_PASSWORD) {
                return res.status(403).json({ message: "Forbidden" });
            }

            const result = await storage.backfillReferrals();
            res.json(result);
        } catch (error) {
            console.error("Error backfilling referrals:", error);
            res.status(500).json({ message: "Server error", detail: error instanceof Error ? error.message : String(error) });
        }
    });

    return router;
}
