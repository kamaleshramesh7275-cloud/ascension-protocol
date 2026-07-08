import { Router } from "express";
import { getStorage } from "../storage";
import { insertWorkoutSessionSchema, insertWorkoutSetSchema, insertWorkoutTemplateSchema } from "@shared/schema";
import { z } from "zod";

const router = Router();

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
router.get("/workouts/sessions", async (req, res) => {
  try {
    const firebaseUid = req.headers["x-firebase-uid"] as string;
    if (!firebaseUid) return res.status(401).json({ message: "Unauthorized" });

    const storage = getStorage();
    const user = await storage.getUserByFirebaseUid(firebaseUid);
    if (!user) return res.status(401).json({ message: "Unauthorized" });
    const userId = user.id;

    const limit = req.query.limit ? parseInt(req.query.limit as string) : 90;
    const sessions = await storage.getUserWorkoutSessions(userId, limit);
    res.json(sessions);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// POST /api/workouts/sessions
// Start a new workout session
router.post("/workouts/sessions", async (req, res) => {
  try {
    const firebaseUid = req.headers["x-firebase-uid"] as string;
    if (!firebaseUid) return res.status(401).json({ message: "Unauthorized" });

    const storage = getStorage();
    const user = await storage.getUserByFirebaseUid(firebaseUid);
    if (!user) return res.status(401).json({ message: "Unauthorized" });
    const userId = user.id;

    const sessionData = insertWorkoutSessionSchema.parse({
      ...req.body,
      userId,
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
router.get("/workouts/sessions/:id", async (req, res) => {
  try {
    const firebaseUid = req.headers["x-firebase-uid"] as string;
    if (!firebaseUid) return res.status(401).json({ message: "Unauthorized" });

    const storage = getStorage();
    const user = await storage.getUserByFirebaseUid(firebaseUid);
    if (!user) return res.status(401).json({ message: "Unauthorized" });
    const userId = user.id;

    const session = await storage.getWorkoutSession(req.params.id);
    
    if (!session) return res.status(404).json({ message: "Session not found" });
    if (session.userId !== userId) return res.status(403).json({ message: "Forbidden" });

    res.json(session);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// PUT /api/workouts/sessions/:id/finish
// Finish a session and log all sets
router.put("/workouts/sessions/:id/finish", async (req, res) => {
  try {
    const firebaseUid = req.headers["x-firebase-uid"] as string;
    if (!firebaseUid) return res.status(401).json({ message: "Unauthorized" });

    const { sets, notes } = z.object({
      sets: z.array(insertWorkoutSetSchema.omit({ sessionId: true })),
      notes: z.string().optional()
    }).parse(req.body);

    const storage = getStorage();
    const user = await storage.getUserByFirebaseUid(firebaseUid);
    if (!user) return res.status(401).json({ message: "Unauthorized" });
    const userId = user.id;
    
    // Security check
    const existing = await storage.getWorkoutSession(req.params.id);
    if (!existing) return res.status(404).json({ message: "Session not found" });
    if (existing.userId !== userId) return res.status(403).json({ message: "Forbidden" });
    if (existing.finishedAt) return res.status(400).json({ message: "Session already finished" });

    // Ensure sets have sessionId
    const setsWithSessionId = sets.map(s => ({
      ...s,
      sessionId: req.params.id
    }));

    const session = await storage.finishWorkoutSession(req.params.id, setsWithSessionId, notes);
    res.json(session);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
});

// GET /api/workouts/prs
// Get personal records for the user
router.get("/workouts/prs", async (req, res) => {
  try {
    const firebaseUid = req.headers["x-firebase-uid"] as string;
    if (!firebaseUid) return res.status(401).json({ message: "Unauthorized" });

    const storage = getStorage();
    const user = await storage.getUserByFirebaseUid(firebaseUid);
    if (!user) return res.status(401).json({ message: "Unauthorized" });
    const userId = user.id;

    const exerciseId = req.query.exerciseId as string | undefined;
    const prs = await storage.getUserPersonalRecords(userId, exerciseId);
    res.json(prs);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// GET /api/workouts/templates
// Get user's templates and public templates
router.get("/workouts/templates", async (req, res) => {
  try {
    const firebaseUid = req.headers["x-firebase-uid"] as string;
    if (!firebaseUid) return res.status(401).json({ message: "Unauthorized" });

    const storage = getStorage();
    const user = await storage.getUserByFirebaseUid(firebaseUid);
    if (!user) return res.status(401).json({ message: "Unauthorized" });
    const userId = user.id;

    const templates = await storage.getWorkoutTemplates(userId);
    res.json(templates);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// POST /api/workouts/templates
// Create a new workout template
router.post("/workouts/templates", async (req, res) => {
  try {
    const firebaseUid = req.headers["x-firebase-uid"] as string;
    if (!firebaseUid) return res.status(401).json({ message: "Unauthorized" });

    const storage = getStorage();
    const user = await storage.getUserByFirebaseUid(firebaseUid);
    if (!user) return res.status(401).json({ message: "Unauthorized" });
    const userId = user.id;

    const templateData = insertWorkoutTemplateSchema.parse({
      ...req.body,
      userId,
    });

    const template = await storage.createWorkoutTemplate(templateData);
    res.status(201).json(template);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
});

// GET /api/workouts/exercises/:id/last-sets
// Get the sets from the most recent session that included this exercise (for auto-fill)
router.get("/workouts/exercises/:id/last-sets", async (req, res) => {
  try {
    const firebaseUid = req.headers["x-firebase-uid"] as string;
    if (!firebaseUid) return res.status(401).json({ message: "Unauthorized" });

    const storage = getStorage();
    const user = await storage.getUserByFirebaseUid(firebaseUid);
    if (!user) return res.status(401).json({ message: "Unauthorized" });

    const sets = await storage.getLastSetsForExercise(user.id, req.params.id);
    res.json(sets);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
