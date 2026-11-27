import { Router } from "express";
import { randomUUID } from "crypto";
import { getStorage } from "../storage";
import { requireAuth } from "../middleware/auth";
import { TIER_THRESHOLDS, type Tier } from "@shared/schema";
import {
  generateDoubleDungeonRules,
  generateReawakeningVerdict,
  generateDomainBattlePlan,
} from "../services/goal-coach";

const router = Router();

function calculateLevelFromXp(xp: number): number {
  return Math.max(1, Math.floor((xp || 0) / 100) + 1);
}

// ─── Feature #6: Double Dungeon Commandments (Cartenon Temple) ───────────────

router.get("/double-dungeon/options", requireAuth, async (req, res) => {
  try {
    const user = (req as any).user;
    const storage = getStorage();
    const recentFocus = await storage.getUserFocusSessions(user.id);
    const cutoff = Date.now() - 14 * 86400000;
    const f14 = recentFocus.filter((f) => new Date(f.completedAt).getTime() >= cutoff);
    const avgBreaches =
      f14.length > 0 ? f14.reduce((s, f) => s + (f.breachCount || 0), 0) / f14.length : 0;

    const { rules } = await generateDoubleDungeonRules({
      user,
      avgBreaches14d: Number(avgBreaches.toFixed(1)),
    });
    const maxStake = Math.max(0, Math.min(500, Math.floor((user.coins || 0) * 0.5)));

    res.json({
      rules,
      maxStake,
      activeState: user.doubleDungeonState || null,
    });
  } catch (e: any) {
    res.status(500).json({ error: e.message || "Failed to load Cartenon Commandments" });
  }
});

router.post("/double-dungeon/enter", requireAuth, async (req, res) => {
  try {
    const storage = getStorage();
    const user = await storage.getUser((req as any).user.id);
    if (!user) return res.status(404).json({ error: "User not found" });

    const existing = user.doubleDungeonState;
    if (existing && existing.status === "active" && new Date(existing.expiresAt).getTime() > Date.now()) {
      return res.status(409).json({ error: "A Cartenon Double Dungeon contract is already active." });
    }
    if (existing?.startedAt && Date.now() - new Date(existing.startedAt).getTime() < 7 * 86400000) {
      return res.status(429).json({ error: "Cartenon Temple opens at most once every 7 days." });
    }

    const maxAllowedStake = Math.min(500, Math.floor((user.coins || 0) * 0.5));
    const requestedStake = Math.round(Number(req.body?.stakeCoins) || 50);
    const stake = Math.max(25, Math.min(maxAllowedStake, requestedStake));
    if (maxAllowedStake < 25 || (user.coins || 0) < stake) {
      return res.status(400).json({ error: "Requires at least 50 Gold Coins to stake (50% wallet cap)." });
    }

    const recentFocus = await storage.getUserFocusSessions(user.id);
    const cutoff = Date.now() - 14 * 86400000;
    const f14 = recentFocus.filter((f) => new Date(f.completedAt).getTime() >= cutoff);
    const avgBreaches =
      f14.length > 0 ? f14.reduce((s, f) => s + (f.breachCount || 0), 0) / f14.length : 0;
    const { rules } = await generateDoubleDungeonRules({ user, avgBreaches14d: avgBreaches });

    const chosenKeys = Array.isArray(req.body?.ruleKeys)
      ? req.body.ruleKeys.map((k: any) => String(k))
      : ["zero_breach_sprints"];
    const picked = rules.filter((r) => chosenKeys.includes(r.key));
    const activeRules = (picked.length > 0 ? picked : [rules[0]]).map((r) => ({
      key: r.key,
      title: r.title,
      tier: r.tier,
      target: r.target,
      current: 0,
      violated: false,
    }));

    const multiplier = Math.min(
      2.2,
      Math.max(1.4, activeRules.length >= 3 ? 2.2 : activeRules.length === 2 ? 1.8 : 1.4)
    );
    const now = Date.now();
    const state = {
      id: `dd_${randomUUID().slice(0, 8)}`,
      status: "active" as const,
      startedAt: new Date(now).toISOString(),
      expiresAt: new Date(now + 72 * 3600000).toISOString(),
      stakeCoins: stake,
      payoutMultiplier: multiplier,
      rules: activeRules,
    };

    const updatedUser = await storage.updateUser(user.id, {
      coins: (user.coins || 0) - stake,
      doubleDungeonState: state,
    });

    res.json({ success: true, state, user: updatedUser });
  } catch (e: any) {
    res.status(500).json({ error: e.message || "Failed to enter Double Dungeon" });
  }
});

router.post("/double-dungeon/settle", requireAuth, async (req, res) => {
  try {
    const storage = getStorage();
    const user = await storage.getUser((req as any).user.id);
    if (!user) return res.status(404).json({ error: "User not found" });

    const dd = user.doubleDungeonState;
    if (!dd || dd.status !== "active") {
      return res.status(400).json({ error: "No active Cartenon Double Dungeon to settle." });
    }

    const since = new Date(dd.startedAt);
    const [focusSessions, workoutSessions] = await Promise.all([
      storage.getUserFocusSessions(user.id),
      storage.getUserWorkoutSessions(user.id, 30),
    ]);
    const focusSince = focusSessions.filter((f) => new Date(f.completedAt) >= since);
    const zeroBreaches = focusSince.filter((f) => (f.breachCount || 0) === 0).length;
    const focusMins = focusSince.reduce((s, f) => s + (f.duration || 0), 0);
    const workoutsDone = workoutSessions.filter(
      (w) => new Date(w.startedAt) >= since && Boolean(w.finishedAt)
    ).length;

    const brokenByBreach = focusSince.some((f) => (f.breachCount || 0) >= 3);
    const updatedRules = dd.rules.map((r) => {
      const current =
        r.key === "zero_breach_sprints"
          ? zeroBreaches
          : r.key === "focus_minutes_72h"
            ? focusMins
            : workoutsDone;
      const violated = brokenByBreach && r.key === "zero_breach_sprints";
      return { ...r, current, violated };
    });

    if (brokenByBreach || new Date(dd.expiresAt).getTime() < Date.now()) {
      const anyMissed = !updatedRules.every((r) => !r.violated && r.current >= r.target);
      if (brokenByBreach || anyMissed) {
        const failedState = { ...dd, status: "broken" as const, rules: updatedRules };
        const updatedUser = await storage.updateUser(user.id, {
          doubleDungeonState: failedState,
          inPenaltyZone: true,
          penaltyExpiresAt: new Date(Date.now() + 4 * 3600000),
        });
        await storage.createActivity({
          userId: user.id,
          action: "system",
          xpDelta: 0,
          coinsDelta: -dd.stakeCoins,
          description: `COMMANDMENT BROKEN: Lost ${dd.stakeCoins} Coins inside Cartenon Double Dungeon.`,
        } as any);
        return res.json({
          cleared: false,
          broken: true,
          message: "COMMANDMENT BROKEN! Stake forfeited & Penalty Zone triggered.",
          state: failedState,
          user: updatedUser,
        });
      }
    }

    const allDone = updatedRules.every((r) => !r.violated && r.current >= r.target);
    if (!allDone) {
      await storage.updateUser(user.id, { doubleDungeonState: { ...dd, rules: updatedRules } });
      return res.json({
        cleared: false,
        broken: false,
        message: "Commandments in progress — keep pushing.",
        state: { ...dd, rules: updatedRules },
        user,
      });
    }

    const payout = Math.round(dd.stakeCoins * dd.payoutMultiplier);
    const completedState = { ...dd, status: "completed" as const, rules: updatedRules };
    const updatedUser = await storage.updateUser(user.id, {
      coins: (user.coins || 0) + payout,
      doubleDungeonState: completedState,
    });
    res.json({
      cleared: true,
      broken: false,
      payoutCoins: payout,
      message: `CARTENON CLEARED! Awarded +${payout} Coins.`,
      state: completedState,
      user: updatedUser,
    });
  } catch (e: any) {
    res.status(500).json({ error: e.message || "Failed to settle Double Dungeon" });
  }
});

// ─── Feature #7: Reawakening Rank Test (14d Pass / 7d Fail Cooldown) ──────────

const NEXT_RANK_MAP: Record<string, Tier> = {
  D: "C",
  C: "B",
  B: "A",
  A: "S",
  S: "S",
};

router.post("/reawakening/start", requireAuth, async (req, res) => {
  try {
    const storage = getStorage();
    const user = await storage.getUser((req as any).user.id);
    if (!user) return res.status(404).json({ error: "User not found" });

    const existing = user.reawakeningState;
    if (existing?.nextEligibleAt && new Date(existing.nextEligibleAt).getTime() > Date.now()) {
      const daysLeft = Math.max(
        1,
        Math.ceil((new Date(existing.nextEligibleAt).getTime() - Date.now()) / 86400000)
      );
      return res.status(429).json({
        error: `Reawakening Rank Test on cooldown (${daysLeft} day${daysLeft === 1 ? "" : "s"} remaining).`,
      });
    }

    const currentTier = (user.tier || "D") as Tier;
    const nextTier = NEXT_RANK_MAP[currentTier] || "C";
    if (currentTier === "S") {
      return res.status(400).json({ error: "Already S-Rank Sovereign. Maximum association authority reached." });
    }
    const minXpReq = TIER_THRESHOLDS[nextTier] ?? 500;
    if ((user.xp || 0) < minXpReq) {
      return res.status(400).json({
        error: `Reach ${minXpReq} XP before sitting the ${nextTier}-Rank Reawakening Test.`,
      });
    }

    const now = Date.now();
    const state = {
      status: "in_progress" as const,
      startedAt: new Date(now).toISOString(),
      expiresAt: new Date(now + 24 * 3600000).toISOString(),
      lastAttemptAt: existing?.lastAttemptAt,
      nextEligibleAt: existing?.nextEligibleAt,
    };
    const updatedUser = await storage.updateUser(user.id, { reawakeningState: state });
    res.json({ success: true, targetRank: nextTier, state, user: updatedUser });
  } catch (e: any) {
    res.status(500).json({ error: e.message || "Failed to start Reawakening Exam" });
  }
});

router.post("/reawakening/submit", requireAuth, async (req, res) => {
  try {
    const storage = getStorage();
    const user = await storage.getUser((req as any).user.id);
    if (!user) return res.status(404).json({ error: "User not found" });

    const exam = user.reawakeningState;
    if (!exam || exam.status !== "in_progress" || !exam.startedAt || !exam.expiresAt) {
      return res.status(400).json({ error: "Start a Reawakening Rank Test first." });
    }
    if (new Date(exam.expiresAt).getTime() < Date.now()) {
      const expiredState = {
        ...exam,
        status: "failed" as const,
        lastAttemptAt: new Date().toISOString(),
        nextEligibleAt: new Date(Date.now() + 7 * 86400000).toISOString(),
      };
      const updatedUser = await storage.updateUser(user.id, { reawakeningState: expiredState });
      return res.status(400).json({
        error: "24h Reawakening window expired. 7-day retest cooldown activated.",
        user: updatedUser,
      });
    }

    const pushupsLogged = Math.max(0, Math.round(Number(req.body?.pushupsLogged) || 0));
    const deliverableText = String(req.body?.deliverableText || "").trim();
    if (deliverableText.length < 25) {
      return res.status(400).json({ error: "Write at least 25 characters describing today's shipped deliverable." });
    }

    const since = new Date(exam.startedAt);
    const focusSessions = await storage.getUserFocusSessions(user.id);
    const zeroBreachFocus = focusSessions.some(
      (f) => new Date(f.completedAt) >= since && (f.duration || 0) >= 25 && (f.breachCount || 0) === 0
    );

    const baselinePushups = Number((user.baselineStats as any)?.pushups ?? 10);
    const currentTier = (user.tier || "D") as Tier;
    const nextTier = NEXT_RANK_MAP[currentTier] || "C";
    const passed = zeroBreachFocus && pushupsLogged >= baselinePushups;
    const now = Date.now();

    if (!passed) {
      const failVerdict = !zeroBreachFocus
        ? "Exam Failed: Requires one 25m+ zero-breach Air-Gap Focus session inside the 24h test window. Retest opens in 7 days."
        : `Exam Failed: Pushups (${pushupsLogged}) fell short of Day-1 baseline (${baselinePushups}). Retest opens in 7 days.`;
      const failedState = {
        status: "failed" as const,
        startedAt: exam.startedAt,
        expiresAt: exam.expiresAt,
        lastAttemptAt: new Date(now).toISOString(),
        nextEligibleAt: new Date(now + 7 * 86400000).toISOString(),
        pushupsLogged,
        focusVerified: zeroBreachFocus,
        deliverableText,
        examinerVerdict: failVerdict,
      };
      const updatedUser = await storage.updateUser(user.id, { reawakeningState: failedState });
      return res.json({ passed: false, state: failedState, verdict: failVerdict, user: updatedUser });
    }

    const verdict = await generateReawakeningVerdict({
      user,
      pushupsLogged,
      baselinePushups,
      deliverableText,
      awardedRank: nextTier,
    });

    const passedState = {
      status: "passed" as const,
      startedAt: exam.startedAt,
      expiresAt: exam.expiresAt,
      lastAttemptAt: new Date(now).toISOString(),
      nextEligibleAt: new Date(now + 14 * 86400000).toISOString(),
      pushupsLogged,
      focusVerified: true,
      deliverableText,
      examinerVerdict: verdict,
      awardedRank: nextTier,
    };

    const updatedUser = await storage.updateUser(user.id, {
      tier: nextTier,
      reawakeningState: passedState,
      coins: (user.coins || 0) + 150,
    });

    res.json({
      passed: true,
      awardedRank: nextTier,
      verdict,
      state: passedState,
      user: updatedUser,
    });
  } catch (e: any) {
    res.status(500).json({ error: e.message || "Failed to grade Reawakening Test" });
  }
});

// ─── Feature #9: Monarch's Domain (Weekly 4-Hour Locked Deep Session) ──────────

router.post("/domain/start", requireAuth, async (req, res) => {
  try {
    const storage = getStorage();
    const user = await storage.getUser((req as any).user.id);
    if (!user) return res.status(404).json({ error: "User not found" });

    const prev = user.monarchDomainState;
    if (prev?.status === "active" && prev.expiresAt && new Date(prev.expiresAt).getTime() > Date.now()) {
      return res.json({ success: true, state: prev, user });
    }
    if (prev?.lastStartedAt && Date.now() - new Date(prev.lastStartedAt).getTime() < 7 * 86400000) {
      return res.status(429).json({ error: "Monarch's Domain unlocks once every 7 days." });
    }

    const roadmap = await storage.getActiveRoadmap(user.id);
    const taskTitles: string[] = [];
    if (roadmap) {
      const weeks = await storage.getRoadmapWeeks(roadmap.id);
      const activeWeek = weeks.find((w) => w.weekNumber === roadmap.currentWeek) || weeks[0];
      if (activeWeek) {
        const tasks = await storage.getRoadmapTasks(activeWeek.id);
        for (const t of tasks.filter((x) => !x.completed)) {
          taskTitles.push(t.text);
        }
      }
    }

    const planSteps = await generateDomainBattlePlan({ user, incompleteTaskTitles: taskTitles });
    const now = Date.now();
    const state = {
      status: "active" as const,
      startedAt: new Date(now).toISOString(),
      expiresAt: new Date(now + (4 * 60 + 15) * 60000).toISOString(),
      lastStartedAt: new Date(now).toISOString(),
      sprintsDone: 0,
      workoutDone: false,
      breaches: 0,
      bonusXpAwarded: 0,
      planSteps,
    };

    const updatedUser = await storage.updateUser(user.id, { monarchDomainState: state });
    res.json({ success: true, state, user: updatedUser });
  } catch (e: any) {
    res.status(500).json({ error: e.message || "Failed to enter Monarch's Domain" });
  }
});

router.post("/domain/breach", requireAuth, async (req, res) => {
  try {
    const storage = getStorage();
    const user = await storage.getUser((req as any).user.id);
    if (!user) return res.status(404).json({ error: "User not found" });

    const dom = user.monarchDomainState;
    if (!dom || dom.status !== "active") {
      return res.status(400).json({ error: "No active Monarch's Domain." });
    }
    const nextBreaches = (dom.breaches || 0) + 1;
    const shattered = nextBreaches > 1;
    const nextState = {
      ...dom,
      breaches: nextBreaches,
      status: shattered ? ("shattered" as const) : ("active" as const),
      loreSummary: shattered
        ? "Domain shattered after repeated exit breaches. Base XP preserved cleanly; 2x bonus voided."
        : undefined,
    };
    const updatedUser = await storage.updateUser(user.id, { monarchDomainState: nextState });
    res.json({ shattered, breaches: nextBreaches, state: nextState, user: updatedUser });
  } catch (e: any) {
    res.status(500).json({ error: e.message || "Failed to record Domain breach" });
  }
});

router.post("/domain/complete", requireAuth, async (req, res) => {
  try {
    const storage = getStorage();
    const user = await storage.getUser((req as any).user.id);
    if (!user) return res.status(404).json({ error: "User not found" });

    const dom = user.monarchDomainState;
    if (!dom || dom.status !== "active" || !dom.startedAt) {
      return res.status(400).json({ error: "No active Monarch's Domain to complete." });
    }
    if (dom.breaches > 1) {
      return res.status(400).json({ error: "Domain shattered due to focus breaches." });
    }

    const since = new Date(dom.startedAt);
    const [focusSessions, workoutSessions] = await Promise.all([
      storage.getUserFocusSessions(user.id),
      storage.getUserWorkoutSessions(user.id, 20),
    ]);
    const sprintsCount = focusSessions.filter((f) => new Date(f.completedAt) >= since).length;
    const focusTotal = focusSessions
      .filter((f) => new Date(f.completedAt) >= since)
      .reduce((s, f) => s + (f.duration || 0), 0);
    const hasWorkout = workoutSessions.some((w) => new Date(w.startedAt) >= since) || req.body?.workoutConfirmed === true;

    if (sprintsCount < 3 && focusTotal < 120) {
      return res.status(400).json({
        error: "Complete at least 3 verified Focus sprints (or 120m total) inside the Domain window first.",
      });
    }
    if (!hasWorkout) {
      return res.status(400).json({
        error: "Complete or confirm the Domain Workout finisher block first.",
      });
    }

    // Strict 2x bonus XP cap at +600 XP per weekly Monarch's Domain
    const bonusXp = Math.min(600, Math.max(150, Math.round(focusTotal * 3)));
    const newXp = (user.xp || 0) + bonusXp;
    const loreSummary = `Monarch's Domain conquered: ${sprintsCount} sprints (${focusTotal}m verified Focus) + Workout finisher with ${dom.breaches} breach(es). +${bonusXp} Bonus XP crowned.`;

    const completedState = {
      ...dom,
      status: "completed" as const,
      sprintsDone: sprintsCount,
      workoutDone: true,
      bonusXpAwarded: bonusXp,
      loreSummary,
    };

    const updatedUser = await storage.updateUser(user.id, {
      xp: newXp,
      level: calculateLevelFromXp(newXp),
      coins: (user.coins || 0) + 120,
      monarchDomainState: completedState,
    });

    res.json({
      success: true,
      bonusXp,
      coinsAwarded: 120,
      loreSummary,
      state: completedState,
      user: updatedUser,
    });
  } catch (e: any) {
    res.status(500).json({ error: e.message || "Failed to complete Monarch's Domain" });
  }
});

export default router;
