import { Router } from "express";
import type { IStorage } from "../storage";

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

            const referrer = await storage.getUserByReferralCode(code);

            if (!referrer) {
                return res.status(404).json({
                    valid: false,
                    message: "Invalid referral code"
                });
            }

            res.json({
                valid: true,
                referrerId: referrer.id,
                referrerName: referrer.name
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
    router.get("/user/stats", async (req: any, res) => {
        try {
            const userId = req.user?.id;

            if (!userId) {
                return res.status(401).json({ message: "Unauthorized" });
            }

            const user = await storage.getUser(userId);
            if (!user) {
                return res.status(404).json({ message: "User not found" });
            }

            const referrals = await storage.getReferrals(userId);

            res.json({
                referralCode: user.referralCode,
                totalReferrals: referrals.length,
                referrals: referrals.map(r => ({
                    userId: r.referredUser.id,
                    userName: r.referredUser.name,
                    status: r.status,
                    createdAt: r.createdAt
                }))
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

            if (!adminPassword || adminPassword !== process.env.ADMIN_PASSWORD) {
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

    return router;
}
