import { Router } from "express";
import type { Request, Response } from "express";
import { db } from "../db";
import { contentLibrary } from "@shared/schema";
import { eq, desc, and, sql } from "drizzle-orm";

const router = Router();

// Get all content (with filters)
router.get("/", async (req: Request, res: Response) => {
    try {
        if (!db) return res.status(503).json({ error: "Database not available" });
        const { category, type, isPremium } = req.query;

        let query = db.select().from(contentLibrary);

        // Apply filters
        const conditions = [];
        if (category) {
            conditions.push(eq(contentLibrary.category, category as string));
        }
        if (type) {
            conditions.push(eq(contentLibrary.type, type as string));
        }
        if (isPremium !== undefined) {
            conditions.push(eq(contentLibrary.isPremium, isPremium === 'true'));
        }

        if (conditions.length > 0) {
            query = query.where(and(...conditions)) as any;
        }

        const content = await query.orderBy(desc(contentLibrary.createdAt));

        res.json(content);
    } catch (error) {
        console.error("Error fetching content:", error);
        res.status(500).json({ error: "Failed to fetch content" });
    }
});

// Get single content item
router.get("/:id", async (req: Request, res: Response) => {
    try {
        if (!db) return res.status(503).json({ error: "Database not available" });
        const { id } = req.params;

        const [content] = await db
            .select()
            .from(contentLibrary)
            .where(eq(contentLibrary.id, id));

        if (!content) {
            return res.status(404).json({ error: "Content not found" });
        }

        // Increment view count
        await db
            .update(contentLibrary)
            .set({ views: sql`${contentLibrary.views} + 1` })
            .where(eq(contentLibrary.id, id));

        res.json({ ...content, views: content.views + 1 });
    } catch (error) {
        console.error("Error fetching content:", error);
        res.status(500).json({ error: "Failed to fetch content" });
    }
});

// Like content
router.post("/:id/like", async (req: Request, res: Response) => {
    try {
        if (!db) return res.status(503).json({ error: "Database not available" });
        const { id } = req.params;

        const [content] = await db
            .update(contentLibrary)
            .set({ likes: sql`${contentLibrary.likes} + 1` })
            .where(eq(contentLibrary.id, id))
            .returning();

        if (!content) {
            return res.status(404).json({ error: "Content not found" });
        }

        res.json(content);
    } catch (error) {
        console.error("Error liking content:", error);
        res.status(500).json({ error: "Failed to like content" });
    }
});

export default router;
