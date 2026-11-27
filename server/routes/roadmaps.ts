import { Router } from "express";
import { getStorage, type IStorage } from "../storage";
import { requireAuth } from "../middleware/auth";
import { insertRoadmapSchema, insertRoadmapWeekSchema, insertRoadmapTaskSchema, type User } from "@shared/schema";
import {
    generateGoalRoadmapBlueprint,
    inferGoalDomain,
    deriveBossMetaForWeek,
    type GoalDomain,
} from "../services/goal-coach";
import { applyBossDamageToWeek, createPendingExtraction } from "../services/system-mechanics";
import { z } from "zod";

const router = Router();

/**
 * Provision a goal-specific 4-week execution roadmap connected to the user's real goal.
 * Archives any previously active roadmap when replaceExisting is true.
 */
export async function provisionRoadmapForGoal(
    storage: IStorage,
    user: User,
    opts?: { replaceExisting?: boolean }
) {
    const existing = await storage.getActiveRoadmap(user.id);
    if (existing && !opts?.replaceExisting) {
        return existing;
    }
    if (existing && opts?.replaceExisting) {
        await storage.updateRoadmap(existing.id, { status: "archived" });
    }

    const goalText = user.currentGoal || "Build Consistent Physical & Deep Work Discipline";
    const goalDomain = ((user as any).goalDomain as GoalDomain) || inferGoalDomain(goalText, user.hunterClass);
    const dailyCapacityMinutes = (user as any).dailyCapacityMinutes || 90;
    const blueprint = await generateGoalRoadmapBlueprint({
        goalText,
        goalDomain,
        dailyCapacityMinutes,
        equipmentProfile: user.equipmentProfile || "bodyweight",
        primaryDistractor: (user as any).primaryDistractor || undefined,
        pushups: (user.assessmentData as any)?.pushups,
    });

    const roadmap = await storage.createRoadmap({
        userId: user.id,
        status: "active",
        currentWeek: 1,
        linkedGoalText: goalText,
        goalDomain,
    });

    for (const weekData of blueprint.weeks) {
        const bossMeta = deriveBossMetaForWeek(weekData.weekNumber, goalDomain, weekData.phaseName);
        const bossMaxHp = Math.max(800, weekData.targetFocusMinutes * 4 + weekData.targetWorkouts * 120);
        const week = await storage.createRoadmapWeek({
            roadmapId: roadmap.id,
            weekNumber: weekData.weekNumber,
            phaseName: weekData.phaseName,
            goal: weekData.goal,
            description: weekData.description,
            isLocked: weekData.weekNumber > 1,
            targetFocusMinutes: weekData.targetFocusMinutes,
            loggedFocusMinutes: 0,
            targetWorkouts: weekData.targetWorkouts,
            loggedWorkouts: 0,
            bossName: bossMeta.bossName,
            bossTitle: bossMeta.bossTitle,
            bossWeaknessRule: bossMeta.bossWeaknessRule,
            bossMaxHp,
            bossCurrentHp: bossMaxHp,
        });

        for (let i = 0; i < weekData.tasks.length; i++) {
            const taskData = weekData.tasks[i];
            await storage.createRoadmapTask({
                weekId: week.id,
                dayNumber: taskData.dayNumber,
                text: taskData.text,
                order: i + 1,
                isBoss: taskData.isBoss,
                completed: false,
            });
        }
    }

    return roadmap;
}

/** Auto-complete a linked Roadmap task and unlock the next week if all week tasks finish. */
export async function completeLinkedRoadmapTask(storage: IStorage, userId: string, taskId: string) {
    const roadmap = await storage.getActiveRoadmap(userId);
    if (!roadmap) return { updated: false, unlockedNextWeek: false };

    const weeks = await storage.getRoadmapWeeks(roadmap.id);
    for (const week of weeks) {
        const tasks = await storage.getRoadmapTasks(week.id);
        const match = tasks.find((t) => t.id === taskId);
        if (match) {
            if (!match.completed) {
                await storage.updateRoadmapTask(match.id, { completed: true });
            }
            const refreshed = await storage.getRoadmapTasks(week.id);
            const weekCleared = refreshed.length > 0 && refreshed.every((t) => t.completed);
            let unlockedNextWeek = false;
            if (weekCleared) {
                const nextWeek = weeks.find((w) => w.weekNumber === week.weekNumber + 1);
                if (nextWeek && nextWeek.isLocked) {
                    await storage.updateRoadmapWeek(nextWeek.id, { isLocked: false });
                    await storage.updateRoadmap(roadmap.id, {
                        currentWeek: Math.max(roadmap.currentWeek, nextWeek.weekNumber),
                    });
                    unlockedNextWeek = true;
                }
            }
            return { updated: true, unlockedNextWeek };
        }
    }
    return { updated: false, unlockedNextWeek: false };
}

/** Credit verified Focus minutes or completed Workouts directly onto the active Roadmap week. */
export async function incrementRoadmapProgress(
    storage: IStorage,
    userId: string,
    delta: { focusMinutes?: number; workouts?: number }
) {
    const roadmap = await storage.getActiveRoadmap(userId);
    if (!roadmap) return;
    const weeks = await storage.getRoadmapWeeks(roadmap.id);
    const activeWeek = weeks.find((w) => w.weekNumber === roadmap.currentWeek) || weeks[0];
    if (!activeWeek) return;

    const user = await storage.getUser(userId);
    const dmg = applyBossDamageToWeek(activeWeek, {
        focusMinutes: delta.focusMinutes,
        workoutSets: delta.workouts ? 10 : 0,
        isMorningWindow: new Date().getHours() < 10,
        userInt: user?.intelligence ?? 10,
        userStr: user?.strength ?? 10,
    });

    await storage.updateRoadmapWeek(activeWeek.id, {
        loggedFocusMinutes: (activeWeek.loggedFocusMinutes || 0) + (delta.focusMinutes || 0),
        loggedWorkouts: (activeWeek.loggedWorkouts || 0) + (delta.workouts || 0),
        bossCurrentHp: dmg.bossCurrentHp,
        bossDamageToday: dmg.bossDamageToday,
        bossDamageDate: dmg.bossDamageDate,
        bossDefeated: dmg.bossDefeated,
    } as any);

    // Seed ARISE Extraction slot cleanly when the weekly Boss falls (max 1 pending slot)
    if (dmg.newlyDefeated && user) {
        const hasPending =
            user.pendingExtraction &&
            new Date(user.pendingExtraction.expiresAt).getTime() > Date.now() &&
            user.pendingExtraction.attemptsRemaining > 0;
        if (!hasPending) {
            await storage.updateUser(user.id, {
                pendingExtraction: createPendingExtraction({
                    bossName: (activeWeek as any).bossName || "Weekly Boss",
                    sourceMilestone: activeWeek.goal,
                    rank: "Knight",
                }),
            });
        }
    }
}

// --- User Routes ---

// Get current active roadmap for the logged-in user
router.get("/", requireAuth, async (req, res) => {
    const storage = getStorage();
    try {
        const user = (req as any).user!;
        let roadmap = await storage.getActiveRoadmap(user.id);

        // Auto-provision goal-aligned roadmap if none exists
        if (!roadmap) {
            console.log(`[Roadmap] Auto-provisioning goal blueprint for user ${user.id}`);
            roadmap = await provisionRoadmapForGoal(storage, user);
        }

        // Fetch weeks for this roadmap (newly created or existing)
        const weeks = await storage.getRoadmapWeeks(roadmap.id);

        // Fetch tasks for each week to satisfy the frontend RoadmapData type
        const weeksWithTasks = await Promise.all(weeks.map(async (week) => {
            const tasks = await storage.getRoadmapTasks(week.id);
            return { ...week, tasks };
        }));

        const totalTasks = weeksWithTasks.reduce((sum, w) => sum + w.tasks.length, 0);
        const completedTasks = weeksWithTasks.reduce(
            (sum, w) => sum + w.tasks.filter((t) => t.completed).length,
            0
        );

        res.json({
            ...roadmap,
            goalProgressPercent: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
            weeks: weeksWithTasks,
        });
    } catch (error) {
        console.error("Get roadmap error:", error);
        res.status(500).json({ error: "Failed to fetch roadmap" });
    }
});

// Recalibrate roadmap to updated goal / daily capacity
router.post("/recalibrate", requireAuth, async (req, res) => {
    const storage = getStorage();
    try {
        const user = (req as any).user!;
        const { goalText, goalDomain, dailyCapacityMinutes, primaryDistractor } = req.body || {};
        const nextGoal = typeof goalText === "string" && goalText.trim().length >= 3 ? goalText.trim() : user.currentGoal;
        const resolvedDomain = goalDomain || inferGoalDomain(nextGoal, user.hunterClass);

        const updatedUser = await storage.updateUser(user.id, {
            ...(nextGoal ? { currentGoal: nextGoal } : {}),
            goalDomain: resolvedDomain,
            ...(typeof dailyCapacityMinutes === "number" ? { dailyCapacityMinutes: Math.max(20, Math.min(360, Math.round(dailyCapacityMinutes))) } : {}),
            ...(typeof primaryDistractor === "string" ? { primaryDistractor: primaryDistractor.trim() } : {}),
        });

        const roadmap = await provisionRoadmapForGoal(storage, updatedUser, { replaceExisting: true });
        const weeks = await storage.getRoadmapWeeks(roadmap.id);
        const weeksWithTasks = await Promise.all(weeks.map(async (week) => ({
            ...week,
            tasks: await storage.getRoadmapTasks(week.id),
        })));

        res.json({ ...roadmap, weeks: weeksWithTasks });
    } catch (error) {
        console.error("Recalibrate roadmap error:", error);
        res.status(500).json({ error: "Failed to recalibrate roadmap" });
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
            const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin@123";
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

// Toggle task completion with ownership check & sequential week unlock
router.post("/tasks/:taskId/toggle", requireAuth, async (req, res) => {
    const storage = getStorage();
    try {
        const { taskId } = req.params;
        const userId = (req as any).user!.id;

        const roadmap = await storage.getActiveRoadmap(userId);
        if (!roadmap) {
            return res.status(404).json({ error: "Active roadmap not found" });
        }

        const weeks = await storage.getRoadmapWeeks(roadmap.id);
        let ownerWeek: (typeof weeks)[number] | null = null;
        for (const week of weeks) {
            const tasks = await storage.getRoadmapTasks(week.id);
            if (tasks.some((t) => t.id === taskId)) {
                ownerWeek = week;
                break;
            }
        }

        if (!ownerWeek) {
            return res.status(403).json({ error: "Task does not belong to your active roadmap" });
        }

        const updatedTask = await storage.toggleRoadmapTask(taskId);

        // Check if current week is now 100% cleared -> unlock next week automatically
        const refreshedTasks = await storage.getRoadmapTasks(ownerWeek.id);
        const weekCleared = refreshedTasks.length > 0 && refreshedTasks.every((t) => t.completed);
        let unlockedNextWeek = false;

        if (weekCleared) {
            const nextWeek = weeks.find((w) => w.weekNumber === ownerWeek!.weekNumber + 1);
            if (nextWeek && nextWeek.isLocked) {
                await storage.updateRoadmapWeek(nextWeek.id, { isLocked: false });
                await storage.updateRoadmap(roadmap.id, {
                    currentWeek: Math.max(roadmap.currentWeek, nextWeek.weekNumber),
                });
                unlockedNextWeek = true;
            }
        }

        res.json({ ...updatedTask, unlockedNextWeek, weekCleared });
    } catch (error) {
        console.error("Toggle task error:", error);
        res.status(500).json({ error: "Failed to update task" });
    }
});

// --- Admin Routes ---

const requireAdminPassword = (req: any, res: any, next: any) => {
    const adminPassword = req.headers["x-admin-password"] as string;
    const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin@123";
    if (adminPassword !== ADMIN_PASSWORD) {
        return res.status(403).json({ error: "Unauthorized" });
    }
    next();
};

// Update a roadmap (Admin only)
router.patch("/admin/roadmaps/:id", requireAdminPassword, async (req, res) => {
    const storage = getStorage();
    try {
        const { id } = req.params;
        const updatedRoadmap = await storage.updateRoadmap(id, req.body);
        res.json(updatedRoadmap);
    } catch (error) {
        console.error("Update roadmap error:", error);
        res.status(500).json({ error: "Failed to update roadmap" });
    }
});

// Bulk update tasks (Admin only)
router.post("/admin/roadmaps/:id/bulk", requireAdminPassword, async (req, res) => {
    const storage = getStorage();
    try {
        const { id } = req.params;
        const { weekId, dayNumber, completed } = req.body;

        await storage.bulkUpdateRoadmapTasks({
            roadmapId: id,
            weekId,
            dayNumber,
            updates: { completed }
        });

        res.json({ success: true });
    } catch (error) {
        console.error("Bulk update roadmap tasks error:", error);
        res.status(500).json({ error: "Failed to perform bulk update" });
    }
});

// Get all roadmaps (Admin only)
router.get("/admin/roadmaps", requireAdminPassword, async (_req, res) => {
    const storage = getStorage();
    try {
        const roadmaps = await storage.getAllRoadmaps();
        res.json(roadmaps);
    } catch (error) {
        console.error("Get all roadmaps error:", error);
        res.status(500).json({ error: "Failed to fetch roadmaps" });
    }
});

// Get specific roadmap detail (Admin only)
router.get("/admin/roadmaps/:id", requireAdminPassword, async (req, res) => {
    const storage = getStorage();
    try {
        const { id } = req.params;
        const roadmap = await storage.getRoadmap(id);
        if (!roadmap) return res.status(404).json({ error: "Roadmap not found" });

        const weeks = await storage.getRoadmapWeeks(id);
        const weeksWithTasks = await Promise.all(weeks.map(async (week) => {
            const tasks = await storage.getRoadmapTasks(week.id);
            return { ...week, tasks };
        }));

        res.json({ ...roadmap, weeks: weeksWithTasks });
    } catch (error) {
        console.error("Get roadmap detail error:", error);
        res.status(500).json({ error: "Failed to fetch roadmap details" });
    }
});

// Update a roadmap week (Admin only)
router.patch("/admin/roadmap-weeks/:id", requireAdminPassword, async (req, res) => {
    const storage = getStorage();
    try {
        const { id } = req.params;
        const updatedWeek = await storage.updateRoadmapWeek(id, req.body);
        res.json(updatedWeek);
    } catch (error) {
        console.error("Update roadmap week error:", error);
        res.status(500).json({ error: "Failed to update week" });
    }
});

// Update a roadmap task (Admin only)
router.patch("/admin/roadmap-tasks/:id", requireAdminPassword, async (req, res) => {
    const storage = getStorage();
    try {
        const { id } = req.params;
        const updatedTask = await storage.updateRoadmapTask(id, req.body);
        res.json(updatedTask);
    } catch (error) {
        console.error("Update roadmap task error:", error);
        res.status(500).json({ error: "Failed to update task" });
    }
});

// Create a new roadmap task (Admin only)
router.post("/admin/roadmap-tasks", requireAdminPassword, async (req, res) => {
    const storage = getStorage();
    try {
        const newTask = await storage.createRoadmapTask(req.body);
        res.json(newTask);
    } catch (error) {
        console.error("Create roadmap task error:", error);
        res.status(500).json({ error: "Failed to create task" });
    }
});

// Delete a roadmap task (Admin only)
router.delete("/admin/roadmap-tasks/:id", requireAdminPassword, async (req, res) => {
    const storage = getStorage();
    try {
        const { id } = req.params;
        await storage.deleteRoadmapTask(id);
        res.json({ success: true });
    } catch (error) {
        console.error("Delete roadmap task error:", error);
        res.status(500).json({ error: "Failed to delete task" });
    }
});

// Assign a roadmap to a user (Create from Skeleton)
router.post("/assign", requireAdminPassword, async (req, res) => {
    const storage = getStorage();
    try {
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
    // Generate 5 daily tasks (one per day) x 7 days = 35 tasks
    const tasks = [];
    const taskTypes = [
        "Deep Focus Session",
        "Physical Optimization",
        "Mental Fortitude",
        "Skill Acquisition",
        "Daily Review"
    ];

    for (let day = 1; day <= 7; day++) {
        for (let i = 0; i < taskTypes.length; i++) {
            tasks.push({
                dayNumber: day,
                text: `Day ${day}: ${taskTypes[i]}`,
                isBoss: day === 7 && i === 4, // Last task of Day 7 is the "Boss"
                order: (day * 10) + i
            });
        }
    }
    return tasks;
}

export default router;
