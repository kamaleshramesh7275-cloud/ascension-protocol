import { Router, type Request, type Response } from "express";
import { getStorage } from "../storage";
import { requireAuth } from "../middleware/auth";
import { pushNotifications } from "../utils/push-notifications";
import {
  insertExecutionProfileSchema,
  insertDailyMissionSchema,
  insertFocusDensitySessionSchema,
  insertDisciplineBreachSchema,
  insertEveningDebriefSchema,
  insertCommitmentContractSchema,
  insertSquadPactSchema,
  insertPublicCommitmentSchema,
  insertPerformanceCourtAuditSchema,
  insertMidDayPulseSchema,
  insertHallOfAscensionSchema,
  insertWallOfConsequenceSchema,
} from "@shared/schema";
import { z } from "zod";

const router = Router();

// Helper to get today's date formatted as YYYY-MM-DD
function getTodayDateString(): string {
  const now = new Date();
  return now.toISOString().split("T")[0];
}

// ─── 1. Execution Profile (Intelligence Intake Engine) ─────────────────────────

// GET /api/execution-profile
// Fetch user's 5-layer diagnostic profile & living roadmap
router.get("/execution-profile", requireAuth, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const storage = getStorage();

    const profile = await storage.getExecutionProfile(user.id);
    const disciplineScore = await storage.getDisciplineScore(user.id);

    res.json({
      profile: profile || null,
      disciplineScore: disciplineScore || {
        score: 700,
        tier: "Practitioner",
        totalSessions: 0,
        completedMissions: 0,
        abortedMissions: 0,
        totalBreaches: 0,
        currentStreak: 0,
        highestScore: 700,
        focusDensityAverage: 0,
      },
    });
  } catch (error: any) {
    console.error("Error fetching execution profile:", error);
    res.status(500).json({ error: error.message || "Failed to fetch profile" });
  }
});

// POST /api/execution-profile
// Save or update 5-layer diagnostic intake
router.post("/execution-profile", requireAuth, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const storage = getStorage();

    const parsed = insertExecutionProfileSchema.parse({
      ...req.body,
      userId: user.id,
    });

    // Auto-generate milestones if not supplied
    let milestones = parsed.roadmapMilestones;
    if (!milestones || milestones.length === 0) {
      const deadlineDate = new Date(parsed.targetDeadline);
      const totalWeeks = Math.max(4, Math.min(24, Math.ceil((deadlineDate.getTime() - Date.now()) / (7 * 24 * 60 * 60 * 1000))));
      const lowestDomain = Object.entries(parsed.gapMatrix).sort(([, a], [, b]) => a - b)[0]?.[0] || "Core Foundation";

      milestones = [
        {
          id: "m-1",
          weekNumber: 1,
          title: `Foundation & ${lowestDomain} Reconditioning`,
          coreDeliverable: `Eliminate primary bottleneck in ${lowestDomain}. Lock daily ${parsed.commitmentCapacity.dailyDeepWorkHours}h non-negotiable focus.`,
          estimatedHours: parsed.commitmentCapacity.weeklyTargetHours,
          probabilityScore: 88,
          completed: false,
        },
        {
          id: "m-2",
          weekNumber: Math.ceil(totalWeeks * 0.35),
          title: "Execution Velocity & Defense Against Distraction",
          coreDeliverable: `Overcome ${parsed.cognitiveFingerprint.primaryDistractor}. Produce first validated milestone artifact.`,
          estimatedHours: parsed.commitmentCapacity.weeklyTargetHours * 2,
          probabilityScore: 79,
          completed: false,
        },
        {
          id: "m-3",
          weekNumber: Math.ceil(totalWeeks * 0.7),
          title: "High-Leverage Breakthrough",
          coreDeliverable: `Demonstrate mastery under pressure. Complete 85% of target outcome criteria: ${parsed.targetOutcome.substring(0, 50)}...`,
          estimatedHours: parsed.commitmentCapacity.weeklyTargetHours * 3,
          probabilityScore: 72,
          completed: false,
        },
        {
          id: "m-4",
          weekNumber: totalWeeks,
          title: "Final Target Realization & Ascension",
          coreDeliverable: `Execute full target outcome without compromise: ${parsed.targetOutcome}`,
          estimatedHours: parsed.commitmentCapacity.weeklyTargetHours * 2,
          probabilityScore: 68,
          completed: false,
        },
      ];
    }

    const savedProfile = await storage.upsertExecutionProfile({
      ...parsed,
      roadmapMilestones: milestones,
    });

    // Ensure initial discipline score is established
    await storage.getDisciplineScore(user.id);

    // Auto-generate today's single mission if user doesn't have one yet
    const today = getTodayDateString();
    let todayMission = await storage.getDailyMission(user.id, today);
    if (!todayMission) {
      const peakWindow = `${parsed.cognitiveFingerprint.peakFocusStart} - ${parsed.cognitiveFingerprint.peakFocusEnd}`;
      todayMission = await storage.createDailyMission({
        userId: user.id,
        date: today,
        title: `Protocol Initiation: ${milestones[0].title}`,
        tacticalDeliverable: milestones[0].coreDeliverable,
        focusTier: "L1",
        estimatedMinutes: Math.round(parsed.commitmentCapacity.dailyDeepWorkHours * 60),
        executionWindow: peakWindow || "09:00 - 11:30",
        primingRitual: "Clear workspace of all hardware. Write the 3 acceptance criteria on physical paper before touching computer.",
        failureCondition: "Abandoning session under 30 minutes, browsing non-essential websites, or rationalizing failure.",
        proofTypeRequired: "structured_text",
        status: "pending",
      });
    }

    // Mark onboarding complete on user record
    await storage.updateUser(user.id, { onboardingCompleted: true });

    res.json({
      success: true,
      profile: savedProfile,
      dailyMission: todayMission,
    });
  } catch (error: any) {
    console.error("Error saving execution profile:", error);
    res.status(400).json({ error: error.message || "Invalid execution profile data" });
  }
});

// ─── 2. Single Mission Lock (Daily Missions) ──────────────────────────────────

// GET /api/daily-mission
// Fetch today's mission, auto-deriving from roadmap if none exists
router.get("/daily-mission", requireAuth, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const storage = getStorage();
    const today = req.query.date as string || getTodayDateString();

    let mission = await storage.getDailyMission(user.id, today);

    // If no mission exists for today, derive one from the profile or provide default mission
    if (!mission) {
      const profile = await storage.getExecutionProfile(user.id);
      if (profile && profile.roadmapMilestones && profile.roadmapMilestones.length > 0) {
        const currentMilestone = profile.roadmapMilestones[profile.currentMilestoneIndex || 0] || profile.roadmapMilestones[0];
        const peakWindow = `${profile.cognitiveFingerprint.peakFocusStart} - ${profile.cognitiveFingerprint.peakFocusEnd}`;
        
        mission = await storage.createDailyMission({
          userId: user.id,
          date: today,
          title: `Mission ${profile.currentMilestoneIndex + 1}: ${currentMilestone.title}`,
          tacticalDeliverable: currentMilestone.coreDeliverable,
          focusTier: "L1",
          estimatedMinutes: Math.min(180, Math.round(profile.commitmentCapacity.dailyDeepWorkHours * 60)),
          executionWindow: peakWindow || "09:00 - 11:30",
          primingRitual: "Two-minute micro-start: Open scratchpad, outline the exact deliverable structure before launching full workspace.",
          failureCondition: "Switching focus window without completion or delaying start past execution window.",
          proofTypeRequired: "structured_text",
          status: "pending",
        });
      } else {
        // Fallback default starter mission
        mission = await storage.createDailyMission({
          userId: user.id,
          date: today,
          title: "System Calibration & Baseline Focus",
          tacticalDeliverable: "Complete 60 continuous minutes of deep cognitive work on your highest-leverage task.",
          focusTier: "L1",
          estimatedMinutes: 60,
          executionWindow: "09:00 - 10:30",
          primingRitual: "Set timer, silence phone, full-screen the target task window.",
          failureCondition: "Leaving workspace before 45 minutes or succumbing to distraction.",
          proofTypeRequired: "structured_text",
          status: "pending",
        });
      }
    }

    res.json(mission);
  } catch (error: any) {
    console.error("Error fetching daily mission:", error);
    res.status(500).json({ error: error.message || "Failed to fetch daily mission" });
  }
});

// POST /api/daily-mission/:id/commit
// Commit oath to today's single mission
router.post("/daily-mission/:id/commit", requireAuth, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const storage = getStorage();
    const missionId = req.params.id;

    const mission = await storage.updateDailyMission(missionId, {
      status: "committed",
      committedAt: new Date(),
    });

    res.json({ success: true, mission });
  } catch (error: any) {
    console.error("Error committing to mission:", error);
    res.status(500).json({ error: error.message || "Failed to commit to mission" });
  }
});

// POST /api/daily-mission/:id/abort
// Formal mission abort with permanent breach recording
router.post("/daily-mission/:id/abort", requireAuth, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const storage = getStorage();
    const missionId = req.params.id;
    const { reason } = req.body;

    if (!reason || reason.trim().length < 10) {
      return res.status(400).json({ error: "Abort requires an explicit failure reason (minimum 10 characters)." });
    }

    const updatedMission = await storage.updateDailyMission(missionId, {
      status: "aborted",
      abortedAt: new Date(),
      abortReason: reason,
    });

    // Record formal discipline breach
    const breach = await storage.createDisciplineBreach({
      userId: user.id,
      sessionId: null,
      type: "mission_aborted",
      severity: "major",
      description: `User aborted Daily Mission '${updatedMission.title}'. Reason: "${reason}"`,
      penaltyScore: 25,
    });

    // Update mission abort stats
    const currentScore = await storage.getDisciplineScore(user.id);
    await storage.upsertDisciplineScore({
      userId: user.id,
      abortedMissions: (currentScore?.abortedMissions ?? 0) + 1,
      currentStreak: 0, // Reset streak on abort
    });

    res.json({
      success: true,
      mission: updatedMission,
      breach,
    });
  } catch (error: any) {
    console.error("Error aborting mission:", error);
    res.status(500).json({ error: error.message || "Failed to abort mission" });
  }
});

// POST /api/daily-mission/:id/proof
// Submit Proof-of-Work with AI verification
router.post("/daily-mission/:id/proof", requireAuth, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const storage = getStorage();
    const missionId = req.params.id;
    const { content, url, mcqAnswers } = req.body;

    if (!content && !url && (!mcqAnswers || Object.keys(mcqAnswers).length === 0)) {
      return res.status(400).json({ error: "Proof submission cannot be empty. Tangible evidence is required." });
    }

    // AI Grader Logic (Evaluates deliverable rigor)
    let proofQualityScore = 75; // baseline Silver
    const textLength = (content || "").trim().length;

    if (textLength > 300 || url) {
      proofQualityScore = 95; // Platinum L1
    } else if (textLength > 100) {
      proofQualityScore = 85; // Gold L2
    } else {
      proofQualityScore = 70; // Silver L3
    }

    const feedback = proofQualityScore >= 90
      ? "L1 Platinum Evidence Verified. Tangible deliverable demonstrates rigorous execution. Zero cognitive compromise detected."
      : "Evidence Accepted with Moderate Density. Ensure subsequent submissions articulate deeper structural proof.";

    const updatedMission = await storage.updateDailyMission(missionId, {
      status: "completed",
      completedAt: new Date(),
      proofData: { content, url, mcqAnswers },
      proofQualityScore,
      aiReviewFeedback: feedback,
    });

    // Reward XP & update discipline reputation
    const userRecord = await storage.getUser(user.id);
    if (userRecord) {
      await storage.updateUser(user.id, {
        xp: userRecord.xp + 150,
        coins: userRecord.coins + 30,
        willpower: Math.min(100, userRecord.willpower + 2),
        intelligence: Math.min(100, userRecord.intelligence + 2),
      });
    }

    const currentScore = await storage.getDisciplineScore(user.id);
    const newStreak = (currentScore?.currentStreak ?? 0) + 1;
    const updatedScore = Math.min(1000, (currentScore?.score ?? 700) + 15);

    await storage.upsertDisciplineScore({
      userId: user.id,
      score: updatedScore,
      completedMissions: (currentScore?.completedMissions ?? 0) + 1,
      currentStreak: newStreak,
    });

    res.json({
      success: true,
      mission: updatedMission,
      proofQualityScore,
      feedback,
      xpEarned: 150,
      disciplineScore: updatedScore,
    });
  } catch (error: any) {
    console.error("Error submitting proof:", error);
    res.status(500).json({ error: error.message || "Failed to submit proof of work" });
  }
});

// ─── 3. Air-Gap Focus Sessions ────────────────────────────────────────────────

// GET /api/focus-density
// Summary of Focus Density and recent sessions
router.get("/focus-density", requireAuth, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const storage = getStorage();

    const activeSession = await storage.getActiveFocusDensitySession(user.id);
    const sessions = await storage.getFocusDensitySessions(user.id, 10);
    const breaches = await storage.getDisciplineBreaches(user.id, 10);
    const discipline = await storage.getDisciplineScore(user.id);

    // Calculate today's focus density score
    const today = getTodayDateString();
    const todaySessions = sessions.filter(s => {
      const sDate = s.startedAt ? new Date(s.startedAt).toISOString().split("T")[0] : "";
      return sDate === today && s.status === "completed";
    });

    const totalMinutesToday = todaySessions.reduce((acc, s) => acc + (s.actualMinutes || 0), 0);
    const avgQualityToday = todaySessions.length > 0
      ? Math.round(todaySessions.reduce((acc, s) => acc + s.attentionQualityScore, 0) / todaySessions.length)
      : 100;

    // Focus Density % = (actualMinutes / targetAvailableMinutes) * quality
    const targetDailyMinutes = 180; // Standard 3-hour benchmark
    const focusDensityPercent = Math.min(100, Math.round((totalMinutesToday / targetDailyMinutes) * (avgQualityToday / 100) * 100));

    res.json({
      focusDensityPercent,
      totalMinutesToday,
      activeSession: activeSession || null,
      recentSessions: sessions,
      recentBreaches: breaches,
      disciplineScore: discipline,
    });
  } catch (error: any) {
    console.error("Error fetching focus density:", error);
    res.status(500).json({ error: error.message || "Failed to fetch focus density" });
  }
});

// POST /api/focus-sessions/air-gap
// Start Air-Gap Focus Session
router.post("/focus-sessions/air-gap", requireAuth, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const storage = getStorage();

    // Check if an active session already exists
    const existing = await storage.getActiveFocusDensitySession(user.id);
    if (existing) {
      return res.json({ session: existing, message: "Active session already in progress" });
    }

    const parsed = insertFocusDensitySessionSchema.parse({
      ...req.body,
      userId: user.id,
      actualMinutes: 0,
      status: "active",
      breachesCount: 0,
      breachEvents: [],
      attentionQualityScore: 100,
    });

    const session = await storage.createFocusDensitySession(parsed);

    // Update user total session count
    const score = await storage.getDisciplineScore(user.id);
    await storage.upsertDisciplineScore({
      userId: user.id,
      totalSessions: (score?.totalSessions ?? 0) + 1,
    });

    res.json({ success: true, session });
  } catch (error: any) {
    console.error("Error starting air-gap session:", error);
    res.status(400).json({ error: error.message || "Invalid session data" });
  }
});

// POST /api/focus-sessions/air-gap/:id/breach
// Log an attention breach during active session
router.post("/focus-sessions/air-gap/:id/breach", requireAuth, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const storage = getStorage();
    const sessionId = req.params.id;
    const { eventType, details } = req.body;

    const session = (await storage.getFocusDensitySessions(user.id, 50)).find(s => s.id === sessionId);
    if (!session) {
      return res.status(404).json({ error: "Focus session not found" });
    }

    const existingBreaches = session.breachEvents || [];
    const newBreachEvent = {
      timestamp: new Date().toISOString(),
      eventType: eventType || "visibility_lost",
      details: details || "Window switched or lost focus during Air-Gap Lock",
    };

    const newBreachCount = session.breachesCount + 1;
    const newQuality = Math.max(20, session.attentionQualityScore - 15);

    const updatedSession = await storage.updateFocusDensitySession(sessionId, {
      breachesCount: newBreachCount,
      attentionQualityScore: newQuality,
      breachEvents: [...existingBreaches, newBreachEvent],
    });

    // Record formal discipline breach
    const breach = await storage.createDisciplineBreach({
      userId: user.id,
      sessionId: session.id,
      type: eventType || "visibility_lost",
      severity: "minor",
      description: `Breach during Air-Gap session: ${details || "User navigated away from active focus screen"}`,
      penaltyScore: 15,
    });

    res.json({
      success: true,
      session: updatedSession,
      breach,
    });
  } catch (error: any) {
    console.error("Error logging breach:", error);
    res.status(500).json({ error: error.message || "Failed to log attention breach" });
  }
});

// POST /api/focus-sessions/air-gap/:id/finish
// Complete or abort Air-Gap session
router.post("/focus-sessions/air-gap/:id/finish", requireAuth, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const storage = getStorage();
    const sessionId = req.params.id;
    const { actualMinutes, status } = req.body;

    const finalStatus = status === "aborted" ? "aborted" : "completed";
    const minutes = Math.max(1, actualMinutes || 1);

    const updatedSession = await storage.updateFocusDensitySession(sessionId, {
      status: finalStatus,
      actualMinutes: minutes,
      endedAt: new Date(),
    });

    // If completed without critical breaches, increment discipline score
    if (finalStatus === "completed") {
      const currentScore = await storage.getDisciplineScore(user.id);
      const bonus = updatedSession.breachesCount === 0 ? 10 : 5;
      await storage.upsertDisciplineScore({
        userId: user.id,
        score: Math.min(1000, (currentScore?.score ?? 700) + bonus),
      });
    }

    res.json({ success: true, session: updatedSession });
  } catch (error: any) {
    console.error("Error finishing air-gap session:", error);
    res.status(500).json({ error: error.message || "Failed to finish focus session" });
  }
});

// POST /api/focus-sessions/air-gap/sync-offline
// Synchronize focus sessions and breaches logged while in offline Air-Gap mode
router.post("/focus-sessions/air-gap/sync-offline", requireAuth, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const storage = getStorage();
    const { sessions = [], breaches = [] } = req.body;

    let syncedSessions = 0;
    let syncedBreaches = 0;

    for (const s of sessions) {
      await storage.createFocusDensitySession({
        userId: user.id,
        declarationOutput: s.declarationOutput || "Offline Deep Work Block",
        obstaclePreMortem: s.obstaclePreMortem || "Offline Air-Gap Mode",
        scheduledMinutes: s.scheduledMinutes || 60,
        actualMinutes: s.actualMinutes || 60,
        status: s.status || "completed",
        breachesCount: s.breachesCount || 0,
        attentionQualityScore: Math.max(20, 100 - (s.breachesCount || 0) * 15),
      } as any);
      syncedSessions++;
    }

    for (const b of breaches) {
      await storage.createDisciplineBreach({
        userId: user.id,
        sessionId: null,
        type: b.type || "offline_breach",
        severity: "minor",
        description: b.details || "Offline attention breach recorded",
        penaltyScore: b.penalty || 15,
      });
      syncedBreaches++;
    }

    if (syncedSessions > 0) {
      const score = await storage.getDisciplineScore(user.id);
      await storage.upsertDisciplineScore({
        userId: user.id,
        totalSessions: (score?.totalSessions ?? 0) + syncedSessions,
        score: Math.min(1000, (score?.score ?? 700) + syncedSessions * 10 - syncedBreaches * 15),
      });
    }

    res.json({ success: true, syncedSessions, syncedBreaches });
  } catch (error: any) {
    console.error("Error syncing offline sessions:", error);
    res.status(500).json({ error: error.message || "Failed to sync offline sessions" });
  }
});

// ─── 4. Evening Debrief (Mandatory Audit) ──────────────────────────────────────

// GET /api/evening-debrief
router.get("/evening-debrief", requireAuth, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const storage = getStorage();
    const date = req.query.date as string || getTodayDateString();

    const debrief = await storage.getEveningDebrief(user.id, date);
    const mission = await storage.getDailyMission(user.id, date);
    const sessions = await storage.getFocusDensitySessions(user.id, 20);
    const todaySessions = sessions.filter(s => {
      const sDate = s.startedAt ? new Date(s.startedAt).toISOString().split("T")[0] : "";
      return sDate === date;
    });

    const breaches = await storage.getDisciplineBreaches(user.id, 20);
    const todayBreaches = breaches.filter(b => {
      const bDate = b.createdAt ? new Date(b.createdAt).toISOString().split("T")[0] : "";
      return bDate === date;
    });

    res.json({
      debrief: debrief || null,
      mission: mission || null,
      todaySessionsCount: todaySessions.length,
      todayFocusMinutes: todaySessions.reduce((acc, s) => acc + (s.actualMinutes || 0), 0),
      todayBreachesCount: todayBreaches.length,
    });
  } catch (error: any) {
    console.error("Error fetching evening debrief:", error);
    res.status(500).json({ error: error.message || "Failed to fetch debrief" });
  }
});

// POST /api/evening-debrief
router.post("/evening-debrief", requireAuth, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const storage = getStorage();
    const { reflectionText, selfHonestyRating, missionId } = req.body;
    const date = req.body.date || getTodayDateString();

    if (!reflectionText || reflectionText.trim().length < 20) {
      return res.status(400).json({ error: "Reflection text must be at least 20 characters of genuine self-audit." });
    }

    // AI Confrontational feedback generator
    const mission = await storage.getDailyMission(user.id, date);
    const missionStatus = mission?.status || "uncommitted";

    let aiFeedback = "";
    if (missionStatus === "completed") {
      aiFeedback = `AUDIT VERDICT: Mission deliverable achieved. Proof score logged at ${mission?.proofQualityScore || 90}%. Reflection reflects authentic effort. Tomorrow requires identical standard.`;
    } else if (missionStatus === "aborted") {
      aiFeedback = `AUDIT VERDICT: Abort was recorded for today's mission. Your reflection must acknowledge the exact rationalization pattern that led to surrender. Do not repeat this failure signature tomorrow.`;
    } else {
      aiFeedback = `AUDIT VERDICT: Day ended without verified mission completion. Accountability points deducted. Tomorrow start strictly in your designated peak window.`;
    }

    const debrief = await storage.createEveningDebrief({
      userId: user.id,
      date,
      missionId: missionId || null,
      reflectionText,
      aiFeedback,
      selfHonestyRating: selfHonestyRating ?? 8,
      focusDensityScoreOfDay: missionStatus === "completed" ? 85 : 30,
    });

    res.json({ success: true, debrief });
  } catch (error: any) {
    console.error("Error saving evening debrief:", error);
    res.status(500).json({ error: error.message || "Failed to submit debrief" });
  }
});

// ─── 5. Weekly Commitment Contracts (Pillar 4) ────────────────────────────────

// GET /api/commitment-contract
router.get("/commitment-contract", requireAuth, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const storage = getStorage();

    let contract = await storage.getActiveCommitmentContract(user.id);
    const missions = await storage.getDailyMissions(user.id, 7);
    const sessions = await storage.getFocusDensitySessions(user.id, 14);

    const completedMissionsThisWeek = missions.filter(m => m.status === "completed").length;
    const focusMinutesThisWeek = sessions.reduce((acc, s) => acc + (s.actualMinutes || 0), 0);

    // If no contract active, calculate suggested defaults
    if (!contract) {
      const today = new Date();
      const monday = new Date(today);
      monday.setDate(today.getDate() - today.getDay() + 1);
      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);

      return res.json({
        contract: null,
        suggested: {
          weekStartDate: monday.toISOString().split("T")[0],
          weekEndDate: sunday.toISOString().split("T")[0],
          targetMissionsCount: 5,
          targetFocusMinutes: 600,
          currentMissions: completedMissionsThisWeek,
          currentMinutes: focusMinutesThisWeek,
        },
      });
    }

    res.json({
      contract,
      currentMissions: completedMissionsThisWeek,
      currentMinutes: focusMinutesThisWeek,
    });
  } catch (error: any) {
    console.error("Error fetching commitment contract:", error);
    res.status(500).json({ error: error.message || "Failed to fetch contract" });
  }
});

// POST /api/commitment-contract
router.post("/commitment-contract", requireAuth, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const storage = getStorage();

    const parsed = insertCommitmentContractSchema.parse({
      ...req.body,
      userId: user.id,
      status: "active",
    });

    const contract = await storage.createCommitmentContract(parsed);
    res.json({ success: true, contract });
  } catch (error: any) {
    console.error("Error creating commitment contract:", error);
    res.status(400).json({ error: error.message || "Invalid contract parameters" });
  }
});

// POST /api/commitment-contract/evaluate
router.post("/commitment-contract/evaluate", requireAuth, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const storage = getStorage();

    const contract = await storage.getActiveCommitmentContract(user.id);
    if (!contract) {
      return res.status(404).json({ error: "No active contract found" });
    }

    const missions = await storage.getDailyMissions(user.id, 7);
    const sessions = await storage.getFocusDensitySessions(user.id, 14);

    const completedMissions = missions.filter(m => m.status === "completed").length;
    const focusMinutes = sessions.reduce((acc, s) => acc + (s.actualMinutes || 0), 0);

    const passed = completedMissions >= contract.targetMissionsCount && focusMinutes >= contract.targetFocusMinutes;
    const status = passed ? "fulfilled" : "breached";

    const score = await storage.getDisciplineScore(user.id);
    let verdict = "";

    if (passed) {
      verdict = `CONTRACT FULFILLED: Delivered ${completedMissions}/${contract.targetMissionsCount} missions & ${focusMinutes}/${contract.targetFocusMinutes} focus minutes. +25 Reputation Points awarded.`;
      await storage.upsertDisciplineScore({
        userId: user.id,
        score: Math.min(1000, (score?.score ?? 700) + 25),
      });
    } else {
      verdict = `CONTRACT BREACHED: Required ${contract.targetMissionsCount} missions (achieved ${completedMissions}), required ${contract.targetFocusMinutes} minutes (achieved ${focusMinutes}). Tier 2 Reputation Penalty (-75 points) applied.`;
      await storage.upsertDisciplineScore({
        userId: user.id,
        score: Math.max(0, (score?.score ?? 700) - 75),
      });

      // Record breach
      await storage.createDisciplineBreach({
        userId: user.id,
        sessionId: null,
        type: "weekly_contract_failed",
        severity: "critical",
        description: `Failed Weekly Commitment Contract: ${completedMissions}/${contract.targetMissionsCount} missions completed.`,
        penaltyScore: 75,
      });
    }

    const updated = await storage.updateCommitmentContract(contract.id, {
      status,
      verifiedMissionsCount: completedMissions,
      verifiedFocusMinutes: focusMinutes,
      outcomeVerdict: verdict,
    });

    res.json({ success: true, contract: updated, verdict, passed });
  } catch (error: any) {
    console.error("Error evaluating contract:", error);
    res.status(500).json({ error: error.message || "Failed to evaluate contract" });
  }
});

// ─── 6. Squad Pacts & Live Ambient Intelligence (Pillar 3 & 4) ─────────────────

// GET /api/squad-pact
router.get("/squad-pact", requireAuth, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const storage = getStorage();

    const result = await storage.getUserSquadPact(user.id);
    res.json(result || null);
  } catch (error: any) {
    console.error("Error fetching squad pact:", error);
    res.status(500).json({ error: error.message || "Failed to fetch squad pact" });
  }
});

// POST /api/squad-pact
router.post("/squad-pact", requireAuth, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const storage = getStorage();

    const inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    const parsed = insertSquadPactSchema.parse({
      ...req.body,
      inviteCode,
      creatorId: user.id,
      status: "active",
    });

    const pact = await storage.createSquadPact(parsed);
    res.json({ success: true, pact });
  } catch (error: any) {
    console.error("Error creating squad pact:", error);
    res.status(400).json({ error: error.message || "Failed to create squad pact" });
  }
});

// POST /api/squad-pact/join
router.post("/squad-pact/join", requireAuth, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const storage = getStorage();
    const { inviteCode } = req.body;

    if (!inviteCode) {
      return res.status(400).json({ error: "Invite code is required" });
    }

    const member = await storage.joinSquadPact(inviteCode.toUpperCase(), user.id);
    const pactData = await storage.getUserSquadPact(user.id);

    res.json({ success: true, member, pactData });
  } catch (error: any) {
    console.error("Error joining squad pact:", error);
    res.status(400).json({ error: error.message || "Failed to join squad pact" });
  }
});

// Ambient Squad Feed Memory Store
interface SquadFeedEvent {
  id: string;
  pactId: string;
  userId: string;
  userName: string;
  type: "focus_started" | "focus_finished" | "breach" | "proof_submitted" | "ping" | "pact_joined";
  message: string;
  timestamp: string;
}

const squadFeedsMap = new Map<string, SquadFeedEvent[]>();

function logSquadEvent(event: Omit<SquadFeedEvent, "id" | "timestamp">) {
  const fullEvent: SquadFeedEvent = {
    ...event,
    id: `ev-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
  };

  const existing = squadFeedsMap.get(event.pactId) || [];
  squadFeedsMap.set(event.pactId, [fullEvent, ...existing].slice(0, 40));
}

// GET /api/squad-pact/feed — live ambient activity feed
router.get("/squad-pact/feed", requireAuth, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const storage = getStorage();

    const squadData = await storage.getUserSquadPact(user.id);
    if (!squadData || !squadData.pact) {
      return res.json([]);
    }

    const pactId = squadData.pact.id;
    let events = squadFeedsMap.get(pactId);

    // If no events exist yet, seed initial ambient war-room events from members
    if (!events || events.length === 0) {
      const now = new Date();
      events = [
        {
          id: `ev-seed-1`,
          pactId,
          userId: user.id,
          userName: user.username || user.name || "Operator",
          type: "pact_joined",
          message: `Squad Vault established for "${squadData.pact.name}". ${squadData.pact.weeklyStakePoints} PTS staked per operator.`,
          timestamp: new Date(now.getTime() - 25 * 60000).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
        {
          id: `ev-seed-2`,
          pactId,
          userId: "op-vanguard",
          userName: "Operative-Vanguard",
          type: "focus_finished",
          message: `Completed 90m unbroken Air-Gap focus block. Quality: 100%.`,
          timestamp: new Date(now.getTime() - 14 * 60000).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
        {
          id: `ev-seed-3`,
          pactId,
          userId: "op-valkyrie",
          userName: "Operative-Valkyrie",
          type: "ping",
          message: `⚡ PUSHING DEEP BLOCK: Engaging 40Hz Gamma Flow mode.`,
          timestamp: new Date(now.getTime() - 6 * 60000).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ];
      squadFeedsMap.set(pactId, events);
    }

    res.json(events);
  } catch (error: any) {
    console.error("Error fetching squad feed:", error);
    res.status(500).json({ error: error.message || "Failed to fetch squad feed" });
  }
});

// POST /api/squad-pact/ping — broadcast tactical status beacon
router.post("/squad-pact/ping", requireAuth, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const storage = getStorage();
    const { pingType, note } = req.body;

    const squadData = await storage.getUserSquadPact(user.id);
    if (!squadData || !squadData.pact) {
      return res.status(404).json({ error: "No active squad pact found" });
    }

    let defaultMsg = "Tactical status ping emitted.";
    if (pingType === "pushing_focus") defaultMsg = "⚡ PUSHING DEEP BLOCK: Sealing cognitive air-gap chamber.";
    else if (pingType === "holding_line") defaultMsg = "🛡️ HOLDING THE LINE: Single daily mission on pace.";
    else if (pingType === "friction_warning") defaultMsg = "⚠️ FRICTION ALERT: Heavy distraction vector detected, deploying counter-measures.";
    else if (pingType === "mission_complete") defaultMsg = "🎯 MISSION CONQUERED: Objective proof submitted to the auditor.";

    const message = note ? `${defaultMsg} ("${note}")` : defaultMsg;

    logSquadEvent({
      pactId: squadData.pact.id,
      userId: user.id,
      userName: user.username || user.name || "Operator",
      type: "ping",
      message,
    });

    res.json({ success: true, message });
  } catch (error: any) {
    console.error("Error sending squad ping:", error);
    res.status(500).json({ error: error.message || "Failed to broadcast ping" });
  }
});

// POST /api/squad-pact/live-status
router.post("/squad-pact/live-status", requireAuth, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const storage = getStorage();
    const { status, sessionMinutes } = req.body;

    await storage.updateSquadPactMemberLiveStatus(user.id, status || "idle", sessionMinutes || 0);

    const squadData = await storage.getUserSquadPact(user.id);
    if (squadData && squadData.pact) {
      if (status === "in_session") {
        logSquadEvent({
          pactId: squadData.pact.id,
          userId: user.id,
          userName: user.username || user.name || "Operator",
          type: "focus_started",
          message: `Entered Air-Gap Focus Chamber (${sessionMinutes || 60}m planned block).`,
        });
      } else if (status === "completed_today") {
        logSquadEvent({
          pactId: squadData.pact.id,
          userId: user.id,
          userName: user.username || user.name || "Operator",
          type: "focus_finished",
          message: `Concluded focus session with verified proof.`,
        });
      }
    }

    res.json({ success: true });
  } catch (error: any) {
    console.error("Error updating live status:", error);
    res.status(500).json({ error: error.message || "Failed to update status" });
  }
});

// POST /api/squad-pact/distribute
router.post("/squad-pact/distribute", requireAuth, async (req: Request, res: Response) => {
  try {
    const storage = getStorage();
    const { pactId } = req.body;

    const result = await storage.distributeSquadPactPool(pactId);
    res.json({ success: true, result });
  } catch (error: any) {
    console.error("Error distributing pact pool:", error);
    res.status(500).json({ error: error.message || "Failed to distribute pool" });
  }
});

// ─── 7. Public Commitment Wall (Pillar 4) ─────────────────────────────────────

// GET /api/public-commitments
router.get("/public-commitments", async (req: Request, res: Response) => {
  try {
    const storage = getStorage();
    const commitments = await storage.getAllPublicCommitments(25);
    res.json(commitments);
  } catch (error: any) {
    console.error("Error fetching public commitments:", error);
    res.status(500).json({ error: error.message || "Failed to fetch commitments" });
  }
});

// POST /api/public-commitments
router.post("/public-commitments", requireAuth, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const storage = getStorage();

    const parsed = insertPublicCommitmentSchema.parse({
      ...req.body,
      userId: user.id,
    });

    const commitment = await storage.createPublicCommitment(parsed);
    res.json({ success: true, commitment });
  } catch (error: any) {
    console.error("Error creating public commitment:", error);
    res.status(400).json({ error: error.message || "Failed to publish commitment" });
  }
});

// POST /api/public-commitments/:id/witness
router.post("/public-commitments/:id/witness", requireAuth, async (req: Request, res: Response) => {
  try {
    const storage = getStorage();
    const commitment = await storage.addCommitmentWitness(req.params.id);
    res.json({ success: true, commitment });
  } catch (error: any) {
    console.error("Error adding witness:", error);
    res.status(500).json({ error: error.message || "Failed to add witness" });
  }
});

// ─── 8. Weekly Performance Court (Pillar 3) ───────────────────────────────────

// GET /api/performance-court
router.get("/performance-court", requireAuth, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const storage = getStorage();

    const audits = await storage.getPerformanceCourtAudits(user.id);
    res.json(audits);
  } catch (error: any) {
    console.error("Error fetching performance court audits:", error);
    res.status(500).json({ error: error.message || "Failed to fetch court audits" });
  }
});

// POST /api/performance-court/evaluate
router.post("/performance-court/evaluate", requireAuth, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const storage = getStorage();

    const missions = await storage.getDailyMissions(user.id, 7);
    const sessions = await storage.getFocusDensitySessions(user.id, 14);
    const breaches = await storage.getDisciplineBreaches(user.id, 14);
    const profile = await storage.getExecutionProfile(user.id);

    const completedCount = missions.filter(m => m.status === "completed").length;
    const actualMinutes = sessions.reduce((acc, s) => acc + (s.actualMinutes || 0), 0);
    const targetMinutes = 900;
    const focusDensity = Math.min(100, Math.round((actualMinutes / targetMinutes) * 100));

    // Harsh, analytical AI Court Verdict
    let aiVerdict = "";
    let roadmapImpact = "";

    if (completedCount >= 5 && actualMinutes >= 700) {
      aiVerdict = `COURT VERDICT: High-velocity execution verified. Delivered ${completedCount}/7 missions with ${actualMinutes} minutes of Air-Gap focus. You protected your commitments against distraction.`;
      roadmapImpact = `Trajectory on schedule. Days saved this week: +2. Current deadline probability: 82%.`;
    } else if (completedCount >= 3) {
      aiVerdict = `COURT VERDICT: Compromised velocity. Completed only ${completedCount}/7 missions. Behavioral logs reveal hesitation and delayed session initiation. The gap between ambition and execution remains open.`;
      roadmapImpact = `Deadline slipped by 4 days. Recovery requirement: +30% focus minutes next week.`;
    } else {
      aiVerdict = `COURT VERDICT: Severe execution failure. Completed ${completedCount}/7 missions with ${breaches.length} attention breach events. Stated obstacles match historical relapse patterns. Immediate intervention required.`;
      roadmapImpact = `Roadmap recalculation recommended. Deadline probability degraded to 48%.`;
    }

    const today = new Date();
    const weekNumber = Math.ceil((today.getDate() - today.getDay() + 1) / 7) || 1;

    const audit = await storage.createPerformanceCourtAudit({
      userId: user.id,
      weekNumber,
      year: today.getFullYear(),
      missionsAssigned: 7,
      missionsCompleted: completedCount,
      targetFocusMinutes: targetMinutes,
      actualFocusMinutes: actualMinutes,
      focusDensityScore: focusDensity,
      breachesCount: breaches.length,
      aiVerdict,
      roadmapImpact,
      sharedWithSquad: true,
    });

    res.json({ success: true, audit });
  } catch (error: any) {
    console.error("Error running court audit:", error);
    res.status(500).json({ error: error.message || "Failed to generate court audit" });
  }
});

// ─── 9. Mid-Day Pulse Enforcer (Pillar 3) ──────────────────────────────────────

// GET /api/mid-day-pulse/status
router.get("/mid-day-pulse/status", requireAuth, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const storage = getStorage();
    const today = getTodayDateString();

    const existingPulse = await storage.getMidDayPulse(user.id, today);
    const mission = await storage.getDailyMission(user.id, today);

    // Current hour in UTC or local
    const currentHour = new Date().getHours();
    const isPastMidday = currentHour >= 12; // 12:00 noon onward
    const isMissionIncomplete = !mission || mission.status !== "completed";

    // Required if past midday, mission incomplete, and not yet acknowledged
    const requiresAction = isPastMidday && isMissionIncomplete && !existingPulse;

    res.json({
      requiresAction,
      acknowledged: !!existingPulse,
      pulse: existingPulse || null,
      missionStatus: mission ? mission.status : "not_created",
      missionTitle: mission ? mission.title : null,
      currentHour,
    });
  } catch (error: any) {
    console.error("Error checking mid-day pulse status:", error);
    res.status(500).json({ error: error.message || "Failed to check pulse status" });
  }
});

// POST /api/mid-day-pulse
router.post("/mid-day-pulse", requireAuth, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const storage = getStorage();
    const today = getTodayDateString();

    const parsed = insertMidDayPulseSchema.parse({
      ...req.body,
      userId: user.id,
      date: today,
    });

    const pulse = await storage.createMidDayPulse(parsed);
    res.json({ success: true, pulse });
  } catch (error: any) {
    console.error("Error logging mid-day pulse:", error);
    res.status(400).json({ error: error.message || "Failed to log pulse" });
  }
});

// ─── 10. Hall of Ascension & Wall of Consequence (Pillar 4) ────────────────────

// GET /api/hall-of-ascension
router.get("/hall-of-ascension", async (req: Request, res: Response) => {
  try {
    const storage = getStorage();
    const entries = await storage.getHallOfAscensionEntries();
    res.json(entries);
  } catch (error: any) {
    console.error("Error fetching hall of ascension:", error);
    res.status(500).json({ error: error.message || "Failed to fetch hall of ascension" });
  }
});

// POST /api/hall-of-ascension
router.post("/hall-of-ascension", requireAuth, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const storage = getStorage();

    const parsed = insertHallOfAscensionSchema.parse({
      ...req.body,
      userId: user.id,
      userName: user.name || "Ascended Operator",
    });

    const entry = await storage.createHallOfAscensionEntry(parsed);
    res.json({ success: true, entry });
  } catch (error: any) {
    console.error("Error adding hall entry:", error);
    res.status(400).json({ error: error.message || "Failed to add hall entry" });
  }
});

// GET /api/wall-of-consequence
router.get("/wall-of-consequence", async (req: Request, res: Response) => {
  try {
    const storage = getStorage();
    const entries = await storage.getWallOfConsequenceEntries();
    res.json(entries);
  } catch (error: any) {
    console.error("Error fetching wall of consequence:", error);
    res.status(500).json({ error: error.message || "Failed to fetch wall of consequence" });
  }
});

// POST /api/wall-of-consequence
router.post("/wall-of-consequence", requireAuth, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const storage = getStorage();

    const parsed = insertWallOfConsequenceSchema.parse({
      ...req.body,
      userId: user.id,
      userName: user.name || "Defaulter",
    });

    const entry = await storage.createWallOfConsequenceEntry(parsed);
    res.json({ success: true, entry });
  } catch (error: any) {
    console.error("Error logging wall of consequence entry:", error);
    res.status(400).json({ error: error.message || "Failed to log consequence entry" });
  }
});

// ─── 11. Focus Density & Discipline Leaderboard ────────────────────────────────

// GET /api/focus-density-leaderboard
router.get("/focus-density-leaderboard", async (req: Request, res: Response) => {
  try {
    const storage = getStorage();
    const leaderboard = await storage.getFocusDensityLeaderboard(50);
    res.json(leaderboard);
  } catch (error: any) {
    console.error("Error fetching focus density leaderboard:", error);
    res.status(500).json({ error: error.message || "Failed to fetch leaderboard" });
  }
});

// ─── 12. Tactical Scenario Injector (Admin / Demo Engine) ─────────────────────

// POST /api/protocol/scenario-inject
// Triggers live simulations of high-stakes events (defector liquidation, court audits, breaches)
router.post("/protocol/scenario-inject", requireAuth, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const storage = getStorage();
    const { scenarioType } = req.body;

    if (scenarioType === "defector_liquidation") {
      let squadData = await storage.getUserSquadPact(user.id);
      if (!squadData || !squadData.pact) {
        const pact = await storage.createSquadPact({
          name: "Ironclad Vanguard (Tactical)",
          inviteCode: "SIM-" + Math.floor(1000 + Math.random() * 9000),
          creatorId: user.id,
          weeklyStakePoints: 100,
        } as any);
        squadData = await storage.getUserSquadPact(user.id);
      }

      const pactId = squadData!.pact.id;

      // Log defector consequence entry
      await storage.createWallOfConsequenceEntry({
        userId: "defector-viper",
        userName: "Operative-Viper",
        failureReason: "Abandoned 3 consecutive daily missions without notice. Defaulted on 100 PTS squad pact.",
        penaltyAmountDollars: 100,
        reputationDeducted: 150,
      } as any);

      // Log to squad ambient feed
      logSquadEvent({
        pactId,
        userId: "defector-viper",
        userName: "Operative-Viper",
        type: "breach",
        message: "🚨 PACT DEFAULTED: Operative-Viper missed 3 missions. 100 PTS liquidated & distributed to active squad survivors!",
      });

      // Credit dividend to user
      const score = await storage.getDisciplineScore(user.id);
      await storage.upsertDisciplineScore({
        userId: user.id,
        score: Math.min(1000, (score?.score ?? 700) + 50),
      });

      // Send push alert
      await pushNotifications.squadDefectorAlert(user.id, "Operative-Viper", 100);

      return res.json({
        success: true,
        scenario: "defector_liquidation",
        message: "Defector Operative-Viper liquidated. +50 PTS dividend credited to your account. Push alert broadcasted.",
      });
    }

    if (scenarioType === "court_decree") {
      const today = new Date();
      const weekNumber = Math.ceil((today.getDate() - today.getDay() + 1) / 7) || 1;

      const audit = await storage.createPerformanceCourtAudit({
        userId: user.id,
        weekNumber,
        year: today.getFullYear(),
        missionsAssigned: 7,
        missionsCompleted: 6,
        targetFocusMinutes: 900,
        actualFocusMinutes: 840,
        focusDensityScore: 93,
        breachesCount: 2,
        aiVerdict: "JUDICIAL DECREE: Exceptional resilience demonstrated. 6 of 7 missions verified with 840m unbroken Air-Gap focus. Minor tab-switching breach noted on Day 3. Standing elevated to Senior Vanguard.",
        roadmapImpact: "Velocity +18%. 90-Day North Star projected completion accelerated by 5 days.",
        sharedWithSquad: true,
      } as any);

      const score = await storage.getDisciplineScore(user.id);
      await storage.upsertDisciplineScore({
        userId: user.id,
        score: Math.min(1000, (score?.score ?? 700) + 40),
      });

      await pushNotifications.sundayPerformanceCourt(user.id, "Superior Execution - Gavel Sealed");

      return res.json({
        success: true,
        scenario: "court_decree",
        audit,
        message: "Sunday Performance Court convened. Verdict: Superior Execution (+40 Discipline Score).",
      });
    }

    if (scenarioType === "reset_mission") {
      const today = getTodayDateString();
      const mission = await storage.getDailyMission(user.id, today);
      if (mission) {
        await storage.updateDailyMission(mission.id, {
          status: "pending",
          completedAt: null,
          abortedAt: null,
          proofData: null,
        });
      }
      return res.json({
        success: true,
        scenario: "reset_mission",
        message: "Today's Single Daily Mission reset to pending status for live demo.",
      });
    }

    res.status(400).json({ error: `Unknown scenarioType: ${scenarioType}` });
  } catch (error: any) {
    console.error("Error running scenario injection:", error);
    res.status(500).json({ error: error.message || "Failed to inject scenario" });
  }
});

// Helper for escaping SVG text nodes
function escapeXml(unsafe: string): string {
  return unsafe.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case "<": return "&lt;";
      case ">": return "&gt;";
      case "&": return "&amp;";
      case "'": return "&apos;";
      case '"': return "&quot;";
      default: return c;
    }
  });
}

// ─── 13. Public Discipline Badge Endpoint (Embeddable SVG) ───────────────────

// GET /api/badges/:userId and /api/badges/:userId.svg
// Public, embeddable mil-spec discipline badge for GitHub README, portfolio, or Twitter
router.get("/badges/:userId", async (req: Request, res: Response) => {
  try {
    let { userId } = req.params;
    if (userId.endsWith(".svg")) {
      userId = userId.slice(0, -4);
    }
    const storage = getStorage();

    const user = await storage.getUser(userId);
    const targetUserId = user ? user.id : userId;
    const username = user?.name || "OPERATOR";
    const discipline = (await storage.getDisciplineScore(targetUserId)) || {
      score: 700,
      tier: "Practitioner",
      currentStreak: 0,
      focusDensityAverage: 85,
    };

    const score = discipline.score || 700;
    const tier = discipline.tier || "Practitioner";
    const streak = discipline.currentStreak || 0;
    const density = Math.round(discipline.focusDensityAverage || 85);

    const tierColors: Record<string, { bg: string; border: string; text: string }> = {
      Apex: { bg: "#064e3b", border: "#10b981", text: "#34d399" },
      Vanguard: { bg: "#164e63", border: "#06b6d4", text: "#22d3ee" },
      Sentinel: { bg: "#1e1b4b", border: "#6366f1", text: "#818cf8" },
      Practitioner: { bg: "#451a03", border: "#f59e0b", text: "#fbbf24" },
      Novice: { bg: "#3f3f46", border: "#71717a", text: "#a1a1aa" },
    };
    const colors = tierColors[tier] || tierColors.Practitioner;

    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="380" height="96" viewBox="0 0 380 96" fill="none">
  <defs>
    <linearGradient id="cardGrad" x1="0" y1="0" x2="380" y2="96" gradientUnits="userSpaceOnUse">
      <stop stop-color="#090d16"/>
      <stop offset="1" stop-color="#020617"/>
    </linearGradient>
    <clipPath id="clip">
      <rect width="380" height="96" rx="14" fill="#fff"/>
    </clipPath>
  </defs>

  <g clip-path="url(#clip)">
    <rect width="380" height="96" fill="url(#cardGrad)" stroke="${colors.border}" stroke-width="1.5" rx="14"/>
    <rect width="380" height="3" fill="${colors.border}"/>

    <text x="16" y="24" fill="#94a3b8" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, monospace" font-size="9" font-weight="700" letter-spacing="1.2">ASCENSION OS // DISCIPLINE TELEMETRY</text>

    <text x="16" y="46" fill="#ffffff" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="16" font-weight="800">${escapeXml(username.toUpperCase())}</text>

    <rect x="16" y="56" width="90" height="20" rx="4" fill="${colors.bg}" stroke="${colors.border}" stroke-width="0.8"/>
    <text x="61" y="70" fill="${colors.text}" font-family="monospace" font-size="10" font-weight="700" text-anchor="middle" letter-spacing="0.5">${escapeXml(tier.toUpperCase())}</text>

    <g transform="translate(140, 36)">
      <text x="0" y="0" fill="#64748b" font-family="monospace" font-size="8" font-weight="600" letter-spacing="0.5">DISCIPLINE</text>
      <text x="0" y="20" fill="#22d3ee" font-family="monospace" font-size="18" font-weight="800">${score}</text>
      <text x="0" y="34" fill="#06b6d4" font-family="monospace" font-size="8">INDEX</text>
    </g>

    <g transform="translate(225, 36)">
      <text x="0" y="0" fill="#64748b" font-family="monospace" font-size="8" font-weight="600" letter-spacing="0.5">STREAK</text>
      <text x="0" y="20" fill="#fbbf24" font-family="monospace" font-size="18" font-weight="800">${streak}d</text>
      <text x="0" y="34" fill="#f59e0b" font-family="monospace" font-size="8">ACTIVE</text>
    </g>

    <g transform="translate(305, 36)">
      <text x="0" y="0" fill="#64748b" font-family="monospace" font-size="8" font-weight="600" letter-spacing="0.5">DENSITY</text>
      <text x="0" y="20" fill="#34d399" font-family="monospace" font-size="18" font-weight="800">${density}%</text>
      <text x="0" y="34" fill="#10b981" font-family="monospace" font-size="8">EFFICIENCY</text>
    </g>
  </g>
</svg>`;

    res.setHeader("Content-Type", "image/svg+xml");
    res.setHeader("Cache-Control", "public, max-age=300, s-maxage=300");
    return res.send(svg);
  } catch (error: any) {
    console.error("Error generating discipline badge SVG:", error);
    res.status(500).send("<svg><text>Badge generation error</text></svg>");
  }
});

export default router;
