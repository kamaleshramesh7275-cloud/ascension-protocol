import { Router } from "express";
import { getStorage } from "../storage";
import { requireAuth, enrichUserWithLevelData } from "../middleware/auth";
import { insertWorkoutSessionSchema, insertWorkoutSetSchema, insertWorkoutTemplateSchema } from "@shared/schema";
import { OFFICIAL_TEMPLATES } from "@shared/official-templates";
import { advanceGateEvent, evaluateNewlyUnlockedShadows, computeBioFatigue } from "../services/system-mechanics";
import { recordDivisionXp } from "../services/divisions";
import { incrementRoadmapProgress, completeLinkedRoadmapTask } from "./roadmaps";
import { z } from "zod";

const router = Router();

// GET /api/workouts/targets?exerciseIds=id1,id2
// Progressive Overload & Sleep-Aware Deload Target Calculator
router.get("/workouts/targets", requireAuth, async (req, res) => {
  try {
    const user = (req as any).user;
    const storage = getStorage();
    const rawIds = String(req.query.exerciseIds || "");
    const exerciseIds = rawIds.split(",").map((s) => s.trim()).filter(Boolean);

    const recentWorkouts = await storage.getUserWorkoutSessions(user.id, 15);
    const recentFocus = await storage.getUserFocusSessions(user.id);
    const fatigue = computeBioFatigue(user, recentWorkouts, recentFocus);
    const sleepNum = user.lastSleepHours ? parseFloat(String(user.lastSleepHours)) : null;
    const needsDeload = (sleepNum !== null && sleepNum > 0 && sleepNum < 6.0) || fatigue.fatigueScore >= 75;
    const hasTankEquipped = Array.isArray(user.equippedShadows) && user.equippedShadows.includes("tank");

    const targets: Record<string, {
      targetWeight: number | null;
      targetReps: number;
      rationale: string;
      mode: "deload" | "weight_up" | "rep_up" | "baseline";
      lastWeight: number | null;
      lastReps: number | null;
    }> = {};

    for (const exerciseId of exerciseIds) {
      const lastSets = await storage.getLastSetsForExercise(user.id, exerciseId);
      const validSets = lastSets.filter((s) => {
        const w = s.weight ? parseFloat(String(s.weight)) : 0;
        return s.setType !== "warmup" && ((s.reps || 0) > 0 || w > 0);
      });
      if (validSets.length === 0) {
        targets[exerciseId] = {
          targetWeight: null,
          targetReps: 10,
          rationale: "Baseline: 3x10 clean form (RPE 7)",
          mode: "baseline",
          lastWeight: null,
          lastReps: null,
        };
        continue;
      }

      const numWeight = (s: typeof validSets[number]) =>
        s.weight !== null && s.weight !== undefined ? parseFloat(String(s.weight)) : null;

      const bestSet = [...validSets].sort(
        (a, b) => (numWeight(b) || 0) - (numWeight(a) || 0) || (b.reps || 0) - (a.reps || 0)
      )[0];
      const lastWeight = numWeight(bestSet);
      const lastReps = bestSet.reps ?? 8;

      if (needsDeload) {
        const deloadWeight = lastWeight && lastWeight > 0 ? Math.max(0, Math.round((lastWeight * 0.85) / 2.5) * 2.5) : lastWeight;
        targets[exerciseId] = {
          targetWeight: deloadWeight,
          targetReps: lastReps,
          rationale: sleepNum && sleepNum < 6.0
            ? `Sleep ${sleepNum.toFixed(1)}h Deload (-15% load)`
            : `Bio-Fatigue ${fatigue.fatigueScore}% Deload (-15% load)`,
          mode: "deload",
          lastWeight,
          lastReps,
        };
      } else if (lastWeight && lastWeight > 0 && lastReps >= 10) {
        const nextWeight = Number((lastWeight + 2.5).toFixed(1));
        targets[exerciseId] = {
          targetWeight: nextWeight,
          targetReps: Math.max(6, lastReps - 2),
          rationale: `${hasTankEquipped ? "Tank Coach: " : ""}+2.5kg Overload`,
          mode: "weight_up",
          lastWeight,
          lastReps,
        };
      } else {
        targets[exerciseId] = {
          targetWeight: lastWeight,
          targetReps: lastReps + 1,
          rationale: `${hasTankEquipped ? "Tank Coach: " : ""}+1 Rep Double Progression`,
          mode: "rep_up",
          lastWeight,
          lastReps,
        };
      }
    }

    res.json({
      needsDeload,
      fatigueScore: fatigue.fatigueScore,
      sleepHours: sleepNum,
      targets,
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// GET /api/workouts/exercises
// Search for exercises (optional ?q= query param)
router.get("/workouts/exercises", async (req, res) => {
  try {
    const storage = getStorage();
    const query = req.query.q as string;
    const exercises = await storage.getExercises(query);
    res.json(exercises);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// GET /api/workouts/official-templates
// Expose curated official training split routines for mobile clients
router.get("/workouts/official-templates", async (_req, res) => {
  res.json(OFFICIAL_TEMPLATES);
});

// GET /api/workouts/exercises/:id
router.get("/workouts/exercises/:id", async (req, res) => {
  try {
    const storage = getStorage();
    const exercise = await storage.getExercise(req.params.id);
    if (!exercise) {
      return res.status(404).json({ message: "Exercise not found" });
    }
    res.json(exercise);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// GET /api/workouts/sessions
// Get all workout sessions for the user
router.get("/workouts/sessions", requireAuth, async (req, res) => {
  try {
    const user = (req as any).user;
    const storage = getStorage();
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 90;
    const sessions = await storage.getUserWorkoutSessions(user.id, limit);
    res.json(sessions);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// POST /api/workouts/sessions
// Start a new workout session
router.post("/workouts/sessions", requireAuth, async (req, res) => {
  try {
    const user = (req as any).user;
    const storage = getStorage();

    const sessionData = insertWorkoutSessionSchema.parse({
      ...req.body,
      userId: user.id,
      startedAt: new Date(req.body.startedAt || new Date()),
    });
    const session = await storage.createWorkoutSession(sessionData);
    res.status(201).json(session);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
});

// GET /api/workouts/sessions/:id
// Get a specific session with its sets
router.get("/workouts/sessions/:id", requireAuth, async (req, res) => {
  try {
    const user = (req as any).user;
    const storage = getStorage();
    const session = await storage.getWorkoutSession(req.params.id);

    if (!session) return res.status(404).json({ message: "Session not found" });
    if (session.userId !== user.id) return res.status(403).json({ message: "Forbidden" });

    res.json(session);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// PUT /api/workouts/sessions/:id/finish
// Finish a session and log all sets
router.put("/workouts/sessions/:id/finish", requireAuth, async (req, res) => {
  try {
    const user = (req as any).user;
    const { sets, notes } = z.object({
      sets: z.array(insertWorkoutSetSchema.omit({ sessionId: true })),
      notes: z.string().optional(),
    }).parse(req.body);

    const storage = getStorage();
    const existing = await storage.getWorkoutSession(req.params.id);
    if (!existing) return res.status(404).json({ message: "Session not found" });
    if (existing.userId !== user.id) return res.status(403).json({ message: "Forbidden" });
    if (existing.finishedAt) return res.status(400).json({ message: "Session already finished" });

    const beforeUser = await storage.getUser(user.id);
    const oldLevel = beforeUser ? Math.floor((beforeUser.xp || 0) / 100) + 1 : 1;

    const setsWithSessionId = sets.map((s) => ({
      ...s,
      sessionId: req.params.id,
    }));

    const session = await storage.finishWorkoutSession(req.params.id, setsWithSessionId, notes);
    const verifiedScore = Math.max(session.xpEarned || 0, setsWithSessionId.length * 10);
    await recordDivisionXp(storage, user.id, verifiedScore);

    // Sync completed workout into active Roadmap week & auto-complete matching Daily Quests
    await incrementRoadmapProgress(storage, user.id, { workouts: 1 });
    const userQuests = await storage.getUserQuests(user.id);
    const completedQuestIds: string[] = [];
    for (const q of userQuests) {
      if (!q.completed && q.executionMode === "workout_verified") {
        await storage.updateQuest(q.id, { completed: true, completedAt: new Date() });
        completedQuestIds.push(q.id);
        if (q.roadmapTaskId) {
          await completeLinkedRoadmapTask(storage, user.id, q.roadmapTaskId);
        }
        break;
      }
    }

    // Advance Surprise Gate & Shadow Unlocks (SR-2, SR-3)
    const afterUser = await storage.getUser(user.id);
    let newlyUnlockedShadows: string[] = [];
    let finalUser = afterUser;

    if (afterUser) {
      const updatedGate = advanceGateEvent(afterUser.activeGateEvent, "workouts", 1);
      const userWorkouts = await storage.getUserWorkoutSessions(user.id, 30);
      newlyUnlockedShadows = evaluateNewlyUnlockedShadows(afterUser, {
        totalWorkouts: userWorkouts.filter((w) => w.finishedAt).length,
      });
      const existingShadows = Array.isArray(afterUser.unlockedShadows) ? afterUser.unlockedShadows : [];
      const mergedShadows = Array.from(new Set([...existingShadows, ...newlyUnlockedShadows]));

      if (updatedGate !== afterUser.activeGateEvent || newlyUnlockedShadows.length > 0) {
        finalUser = await storage.updateUser(user.id, {
          activeGateEvent: updatedGate,
          unlockedShadows: mergedShadows,
        });
      }
    }

    const newLevel = finalUser ? Math.floor((finalUser.xp || 0) / 100) + 1 : oldLevel;

    res.json({
      ...session,
      session,
      completedQuestIds,
      user: finalUser ? enrichUserWithLevelData(finalUser) : null,
      levelUp: newLevel > oldLevel,
      newLevel,
      newlyUnlockedShadows,
    });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
});

// GET /api/workouts/prs
// Get personal records for the user
router.get("/workouts/prs", requireAuth, async (req, res) => {
  try {
    const user = (req as any).user;
    const storage = getStorage();
    const exerciseId = req.query.exerciseId as string | undefined;
    const prs = await storage.getUserPersonalRecords(user.id, exerciseId);
    res.json(prs);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// GET /api/workouts/templates
// Get user's templates and public templates
router.get("/workouts/templates", requireAuth, async (req, res) => {
  try {
    const user = (req as any).user;
    const storage = getStorage();
    const templates = await storage.getWorkoutTemplates(user.id);
    res.json(templates);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// POST /api/workouts/templates
// Create a new workout template
router.post("/workouts/templates", requireAuth, async (req, res) => {
  try {
    const user = (req as any).user;
    const storage = getStorage();
    const templateData = insertWorkoutTemplateSchema.parse({
      ...req.body,
      userId: user.id,
    });

    const template = await storage.createWorkoutTemplate(templateData);
    res.status(201).json(template);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
});

// POST /api/workouts/generate-plan
// Generate and save personalized AI workout split templates using real DB exercises
router.post("/workouts/generate-plan", requireAuth, async (req, res) => {
  try {
    const user = (req as any).user;
    const storage = getStorage();
    const goalFocus =
      typeof req.body?.goalFocus === "string" && req.body.goalFocus.trim().length > 0
        ? req.body.goalFocus.trim().slice(0, 80)
        : (user.currentGoal || "Strength & Hypertrophy");
    const equipment =
      typeof req.body?.equipment === "string" && req.body.equipment.trim().length > 0
        ? req.body.equipment.trim().slice(0, 40)
        : (user.equipmentProfile || "gym");
    const durationMinutes = Math.max(20, Math.min(120, Math.round(Number(req.body?.durationMinutes) || 45)));
    const daysPerWeek = Math.max(2, Math.min(4, Math.round(Number(req.body?.daysPerWeek) || 3)));
    const constraintNote =
      typeof req.body?.constraintNote === "string" && req.body.constraintNote.trim().length > 0
        ? req.body.constraintNote.trim().slice(0, 160)
        : undefined;

    const availableExercises = await storage.getExercises();
    const { generateAiWorkoutSplit } = await import("../services/goal-coach");
    const split = await generateAiWorkoutSplit({
      goalFocus,
      equipment,
      durationMinutes,
      daysPerWeek,
      constraintNote,
      availableExercises,
    });

    const createdTemplates = [];
    for (const tpl of split.templates) {
      const templateData = insertWorkoutTemplateSchema.parse({
        userId: user.id,
        name: tpl.name,
        description: tpl.description,
        exerciseIds: tpl.exerciseIds,
        isPublic: false,
      });
      createdTemplates.push(await storage.createWorkoutTemplate(templateData));
    }

    res.status(201).json({
      templates: createdTemplates,
      providerUsed: split.providerUsed,
    });
  } catch (error: any) {
    console.error("Generate workout plan error:", error);
    res.status(500).json({ message: error.message || "Failed to generate workout plan" });
  }
});

// GET /api/workouts/exercises/:id/last-sets
// Get the sets from the most recent session that included this exercise (for auto-fill)
router.get("/workouts/exercises/:id/last-sets", requireAuth, async (req, res) => {
  try {
    const user = (req as any).user;
    const storage = getStorage();
    const sets = await storage.getLastSetsForExercise(user.id, req.params.id);
    res.json(sets);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
