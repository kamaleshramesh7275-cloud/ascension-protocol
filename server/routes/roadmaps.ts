import { Router } from "express";
import { getStorage } from "../storage";
import { requireAuth } from "../middleware/auth";
import { insertRoadmapSchema, insertRoadmapWeekSchema, insertRoadmapTaskSchema } from "@shared/schema";
import { z } from "zod";

const router = Router();

// --- User Routes ---

// Get current active roadmap for the logged-in user
router.get("/", requireAuth, async (req, res) => {
    const storage = getStorage();
    try {
        const roadmap = await storage.getActiveRoadmap((req as any).user!.id);
        if (!roadmap) {
            return res.status(404).json({ message: "No active roadmap found" });
        }

        // Fetch weeks for this roadmap
        const weeks = await storage.getRoadmapWeeks(roadmap.id);

        res.json({ ...roadmap, weeks });
    } catch (error) {
        console.error("Get roadmap error:", error);
        res.status(500).json({ error: "Failed to fetch roadmap" });
    }
});

// Get details for a specific week (including tasks)
router.get("/weeks/:weekId", requireAuth, async (req, res) => {
    const storage = getStorage();
    try {
        const { weekId } = req.params;
        const week = await storage.getRoadmapWeek(weekId);

        if (!week) {
            return res.status(404).json({ error: "Week not found" });
        }

        // Verify ownership indirectly via roadmap -> user check if needed, 
        // or trust query filtering. For strictness:
        const roadmap = await storage.getRoadmap(week.roadmapId);
        if (roadmap?.userId !== (req as any).user!.id) {
            // Allow admins to view too? For now strict user check.
            // Check if admin
            const adminPassword = req.headers["x-admin-password"] as string;
            const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin123";
            if (adminPassword !== ADMIN_PASSWORD) { // If not admin
                return res.status(403).json({ error: "Unauthorized" });
            }
        }

        const tasks = await storage.getRoadmapTasks(weekId);
        res.json({ ...week, tasks });
    } catch (error) {
        console.error("Get week details error:", error);
        res.status(500).json({ error: "Failed to fetch week details" });
    }
});

// Toggle task completion
router.post("/tasks/:taskId/toggle", requireAuth, async (req, res) => {
    const storage = getStorage();
    try {
        const { taskId } = req.params;
        // We should ideally verify ownership here too
        const updatedTask = await storage.toggleRoadmapTask(taskId);
        res.json(updatedTask);
    } catch (error) {
        console.error("Toggle task error:", error);
        res.status(500).json({ error: "Failed to update task" });
    }
});

// --- Admin Routes ---

// Assign a roadmap to a user (Create from Skeleton)
router.post("/assign", async (req, res) => {
    const storage = getStorage();
    try {
        const adminPassword = req.headers["x-admin-password"] as string;
        const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin123";

        if (adminPassword !== ADMIN_PASSWORD) {
            return res.status(403).json({ error: "Unauthorized" });
        }

        const { userId, templateData } = req.body;

        if (!userId) {
            return res.status(400).json({ error: "User ID is required" });
        }

        // 1. Create Roadmap
        const roadmap = await storage.createRoadmap({
            userId,
            status: "active",
            currentWeek: 1
        });

        // 2. Create Weeks & Tasks (Skeleton Generation)
        // Expecting templateData to contain weeks array, or use default if empty
        const weeksData = templateData?.weeks || getDefaultRoadmapSkeleton();

        for (const weekData of weeksData) {
            const week = await storage.createRoadmapWeek({
                roadmapId: roadmap.id,
                weekNumber: weekData.weekNumber,
                phaseName: weekData.phaseName,
                goal: weekData.goal,
                description: weekData.description,
                isLocked: weekData.weekNumber > 1 // Lock future weeks by default
            });

            if (weekData.tasks) {
                for (const taskData of weekData.tasks) {
                    await storage.createRoadmapTask({
                        weekId: week.id,
                        dayNumber: taskData.dayNumber,
                        text: taskData.text,
                        order: taskData.order || taskData.dayNumber,
                        isBoss: taskData.isBoss || false,
                        completed: false
                    });
                }
            }
        }

        res.json({ success: true, roadmapId: roadmap.id });
    } catch (error) {
        console.error("Assign roadmap error:", error);
        res.status(500).json({ error: "Failed to assign roadmap" });
    }
});

function getDefaultRoadmapSkeleton() {
    return [
        {
            weekNumber: 1,
            phaseName: "Stability",
            goal: "Prove consistency. Intensity does not matter.",
            description: "Build a daily work identity by completing at least one focused session every day.",
            tasks: generateDefaultTasksForWeek(1)
        },
        {
            weekNumber: 2,
            phaseName: "Pressure",
            goal: "Increase focus capacity under rules.",
            description: "Introduce constraints and higher volume.",
            tasks: generateDefaultTasksForWeek(2)
        },
        {
            weekNumber: 3,
            phaseName: "Dominance",
            goal: "Mastery over self and environment.",
            description: "Peak performance week.",
            tasks: generateDefaultTasksForWeek(3)
        },
        {
            weekNumber: 4,
            phaseName: "Ascension",
            goal: "Prepare for the next level.",
            description: "Consolidation and review.",
            tasks: generateDefaultTasksForWeek(4)
        }
    ];
}

function generateDefaultTasksForWeek(weekNum: number) {
    // Generate 7 daily tasks (one per day)
    const tasks = [];
    for (let day = 1; day <= 7; day++) {
        tasks.push({
            dayNumber: day,
            text: `Day ${day}: Core Study/Work Session`,
            isBoss: false,
            order: day
        });
    }
    return tasks;
}

export default router;
