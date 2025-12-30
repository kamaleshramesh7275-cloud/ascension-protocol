import { Router } from "express";
import { getStorage } from "../storage";
import { requireAuth, requireAdmin } from "../middleware/auth";
import Stripe from "stripe";
import { z } from "zod";

const router = Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "mock_key", {
    apiVersion: "2024-12-18.acacia",
});

// Get current subscription status
router.get("/status", requireAuth, async (req, res) => {
    const user = (req as any).user;
    res.json({
        isPremium: user.isPremium,
        premiumExpiry: user.premiumExpiry,
        role: user.role
    });
});

// Create Stripe Checkout Session
router.post("/checkout", requireAuth, async (req, res) => {
    const user = (req as any).user;
    const storage = getStorage();

    try {
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ["card"],
            line_items: [
                {
                    price_data: {
                        currency: "inr",
                        product_data: {
                            name: "Ascension Protocol Premium",
                            description: "3x Rewards, Legendary Access, and more",
                        },
                        unit_amount: 9900, // ₹99 in paise
                        recurring: {
                            interval: "month",
                        },
                    },
                    quantity: 1,
                },
            ],
            mode: "subscription",
            success_url: `${req.headers.origin}/settings?status=success`,
            cancel_url: `${req.headers.origin}/settings?status=cancel`,
            customer_email: user.email,
            metadata: {
                userId: user.id,
            },
        });

        res.json({ url: session.url });
    } catch (error: any) {
        console.error("Stripe Checkout Error:", error);
        res.status(500).json({ error: error.message });
    }
});

// Admin: Activate Premium for any user
router.post("/admin/activate", requireAuth, requireAdmin, async (req, res) => {
    const storage = getStorage();
    const { userId, days = 30 } = req.body;

    if (!userId) {
        return res.status(400).json({ error: "userId is required" });
    }

    try {
        const targetUser = await storage.getUser(userId);
        if (!targetUser) {
            return res.status(404).json({ error: "User not found" });
        }

        const expiry = new Date();
        expiry.setDate(expiry.getDate() + days);

        await storage.updateUser(userId, {
            isPremium: true,
            premiumExpiry: expiry
        });

        await storage.createNotification({
            userId: userId,
            type: "admin",
            title: "Premium Activated",
            message: `An admin has activated your Premium Membership for ${days} days! Enjoy triple rewards.`
        });

        res.json({ success: true, message: `Activated Premium for ${targetUser.name}` });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// Stripe Webhook (Placeholder for handling production payments)
router.post("/webhook", async (req, res) => {
    // In a real app, verify the webhook signature and update user.isPremium
    res.json({ received: true });
});

export default router;
