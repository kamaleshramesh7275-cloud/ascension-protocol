import { Router, Request, Response } from "express";
import { getStorage } from "../storage";
import { getFirebaseAdmin } from "../firebase-admin";

const router = Router();
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin@123";

function requireAdmin(req: Request, res: Response): boolean {
  const pwd = req.headers["x-admin-password"] as string;
  if (pwd !== ADMIN_PASSWORD) {
    res.status(403).json({ error: "Unauthorized" });
    return false;
  }
  return true;
}

// 30s TTL in-memory cache for heavy analytics aggregations
const analyticsCache = new Map<string, { expiresAt: number; data: any }>();
async function cached<T>(key: string, ttlMs: number, fn: () => Promise<T>): Promise<T> {
  const hit = analyticsCache.get(key);
  if (hit && hit.expiresAt > Date.now()) return hit.data as T;
  const data = await fn();
  analyticsCache.set(key, { expiresAt: Date.now() + ttlMs, data });
  return data;
}

function toYmd(d: Date | string | null | undefined): string {
  if (!d) return "";
  const dt = typeof d === "string" ? new Date(d) : d;
  if (Number.isNaN(dt.getTime())) return "";
  return dt.toISOString().slice(0, 10);
}

function addDays(ymd: string, delta: number): string {
  const dt = new Date(`${ymd}T00:00:00.000Z`);
  dt.setUTCDate(dt.getUTCDate() + delta);
  return dt.toISOString().slice(0, 10);
}

function csvEscape(v: any): string {
  if (v === null || v === undefined) return "";
  const s = typeof v === "object" ? JSON.stringify(v) : String(v);
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function rowsToCsv(rows: Record<string, any>[]): string {
  if (rows.length === 0) return "";
  const headerSet = new Set<string>();
  for (const r of rows) {
    Object.keys(r).forEach((k) => headerSet.add(k));
  }
  const headers = Array.from(headerSet);
  const lines = [headers.join(",")];
  for (const r of rows) {
    lines.push(headers.map((h) => csvEscape(r[h])).join(","));
  }
  return lines.join("\n");
}

/**
 * GET /api/admin/master/analytics/retention?date=YYYY-MM-DD
 * Full-day snapshot for selected date + logged-in users list + DAU/WAU/MAU + D1/D3/D7/D14/D30 cohorts.
 */
router.get("/analytics/retention", async (req, res) => {
  if (!requireAdmin(req, res)) return;
  try {
    const todayYmd = new Date().toISOString().slice(0, 10);
    const dateParam = typeof req.query.date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(req.query.date)
      ? req.query.date
      : todayYmd;

    const payload = await cached(`retention:${dateParam}`, 30_000, async () => {
      const storage = getStorage();
      const [users, focusAll, workoutsAll, questsAll, aiLogs] = await Promise.all([
        storage.getAllUsers(),
        storage.getAllFocusSessionsAll(),
        storage.getAllWorkoutSessionsAll(),
        storage.getAllQuestsAll(),
        storage.getAiUsageLogsSince(new Date(Date.now() - 35 * 86400_000)),
      ]);

      // Build per-user active-date sets
      const userActiveDays = new Map<string, Set<string>>();
      const addActive = (uid: string, ymd: string) => {
        if (!uid || !ymd) return;
        let set = userActiveDays.get(uid);
        if (!set) {
          set = new Set();
          userActiveDays.set(uid, set);
        }
        set.add(ymd);
      };

      for (const u of users) {
        addActive(u.id, toYmd(u.createdAt));
        addActive(u.id, toYmd(u.lastActive));
      }
      for (const f of focusAll) addActive(f.userId, toYmd(f.completedAt));
      for (const w of workoutsAll) addActive(w.userId, toYmd(w.startedAt));
      for (const q of questsAll) {
        if (q.completedAt) addActive(q.userId, toYmd(q.completedAt));
      }

      // Selected date logged-in / active users
      const loggedInUsers = users
        .filter((u) => userActiveDays.get(u.id)?.has(dateParam))
        .map((u) => {
          const signupYmd = toYmd(u.createdAt);
          return {
            id: u.id,
            name: u.name,
            email: u.email,
            tier: u.tier,
            level: u.level,
            streak: u.streak,
            hunterClass: u.evolvedClass || u.hunterClass,
            isNewUser: signupYmd === dateParam,
            onboardingCompleted: u.onboardingCompleted,
            inPenaltyZone: u.inPenaltyZone,
            lastActiveDate: u.lastActive,
            createdAt: u.createdAt,
          };
        });

      const newSignupsOnDate = loggedInUsers.filter((u) => u.isNewUser).length;
      const returningOnDate = loggedInUsers.length - newSignupsOnDate;

      // Full-day activity totals for selected date
      const focusOnDate = focusAll.filter((f) => toYmd(f.completedAt) === dateParam);
      const focusMinutesOnDate = focusOnDate.reduce((sum, f) => sum + (f.duration || 0), 0);
      const workoutsOnDate = workoutsAll.filter((w) => toYmd(w.startedAt) === dateParam);
      const questsCompletedOnDate = questsAll.filter((q) => q.completedAt && toYmd(q.completedAt) === dateParam);
      const aiOnDate = aiLogs.filter((l) => toYmd(l.createdAt) === dateParam);

      // WAU & MAU relative to selected date
      const wauStart = addDays(dateParam, -6);
      const mauStart = addDays(dateParam, -29);
      let wau = 0;
      let mau = 0;
      for (const u of users) {
        const days = userActiveDays.get(u.id);
        if (!days) continue;
        let inWau = false;
        let inMau = false;
        for (const d of Array.from(days)) {
          if (d >= wauStart && d <= dateParam) inWau = true;
          if (d >= mauStart && d <= dateParam) inMau = true;
        }
        if (inWau) wau++;
        if (inMau) mau++;
      }

      const dau = loggedInUsers.length;
      const stickiness = mau > 0 ? Math.round((dau / mau) * 100) : 0;

      // Onboarding Funnel
      const completedOnboarding = users.filter((u) => u.onboardingCompleted).length;
      const usersWithActivity = users.filter(
        (u) => focusAll.some((f) => f.userId === u.id) || workoutsAll.some((w) => w.userId === u.id)
      ).length;

      // Cohort Retention Matrix (last 10 signup dates relative to selected date)
      const cohorts: Array<{
        cohortDate: string;
        size: number;
        d1: number | null;
        d3: number | null;
        d7: number | null;
        d14: number | null;
        d30: number | null;
      }> = [];

      for (let offset = 0; offset < 10; offset++) {
        const cDate = addDays(dateParam, -offset);
        const cohortUsers = users.filter((u) => toYmd(u.createdAt) === cDate);
        if (cohortUsers.length === 0) continue;
        const pctAfter = (daysAfter: number) => {
          const targetDay = addDays(cDate, daysAfter);
          if (targetDay > todayYmd) return null;
          const retained = cohortUsers.filter((u) => userActiveDays.get(u.id)?.has(targetDay)).length;
          return Math.round((retained / cohortUsers.length) * 100);
        };
        cohorts.push({
          cohortDate: cDate,
          size: cohortUsers.length,
          d1: pctAfter(1),
          d3: pctAfter(3),
          d7: pctAfter(7),
          d14: pctAfter(14),
          d30: pctAfter(30),
        });
      }

      const comebackGateActive = users.filter((u) => (u as any).comebackGate?.active).length;
      const penaltyZoneUsers = users.filter((u) => u.inPenaltyZone).length;

      return {
        selectedDate: dateParam,
        totalUsers: users.length,
        daySummary: {
          dau,
          wau,
          mau,
          stickinessPct: stickiness,
          newSignups: newSignupsOnDate,
          returningUsers: returningOnDate,
          questsCompleted: questsCompletedOnDate.length,
          focusSessions: focusOnDate.length,
          focusMinutes: focusMinutesOnDate,
          workoutsLogged: workoutsOnDate.length,
          aiCalls: aiOnDate.length,
          aiErrors: aiOnDate.filter((a) => !a.success).length,
        },
        loggedInUsers,
        onboardingFunnel: {
          totalSignups: users.length,
          completedOnboarding,
          activeHabitUsers: usersWithActivity,
          onboardingPct: users.length ? Math.round((completedOnboarding / users.length) * 100) : 0,
        },
        cohorts,
        retentionSignals: {
          comebackGateActive,
          penaltyZoneUsers,
        },
      };
    });

    res.json(payload);
  } catch (err) {
    console.error("[ADMIN MASTER] Retention error:", err);
    res.status(500).json({ error: "Failed to compute retention analytics" });
  }
});

/**
 * GET /api/admin/master/analytics/progress
 * Global Rank, Level, Class, Division, and Roadmap progress distribution.
 */
router.get("/analytics/progress", async (req, res) => {
  if (!requireAdmin(req, res)) return;
  try {
    const payload = await cached("progress", 30_000, async () => {
      const storage = getStorage();
      const users = await storage.getAllUsers();

      const tierCounts: Record<string, number> = { D: 0, C: 0, B: 0, A: 0, S: 0 };
      const classCounts: Record<string, number> = {};
      const divisionCounts: Record<string, number> = {};
      const levelBuckets: Record<string, number> = { "1-5": 0, "6-10": 0, "11-20": 0, "21-35": 0, "36+": 0 };

      let evolvedCount = 0;
      let totalXp = 0;
      let totalStreak = 0;

      for (const u of users) {
        tierCounts[u.tier] = (tierCounts[u.tier] || 0) + 1;
        const cls = u.evolvedClass || u.hunterClass || "assassin";
        classCounts[cls] = (classCounts[cls] || 0) + 1;
        if (u.evolvedClass) evolvedCount++;

        const div = u.divisionTier || "Bronze";
        divisionCounts[div] = (divisionCounts[div] || 0) + 1;

        const lv = u.level || 1;
        if (lv <= 5) levelBuckets["1-5"]++;
        else if (lv <= 10) levelBuckets["6-10"]++;
        else if (lv <= 20) levelBuckets["11-20"]++;
        else if (lv <= 35) levelBuckets["21-35"]++;
        else levelBuckets["36+"]++;

        totalXp += u.xp || 0;
        totalStreak += u.streak || 0;
      }

      return {
        totalUsers: users.length,
        avgLevel: users.length ? Math.round((users.reduce((s, u) => s + (u.level || 1), 0) / users.length) * 10) / 10 : 0,
        avgXp: users.length ? Math.round(totalXp / users.length) : 0,
        avgStreak: users.length ? Math.round((totalStreak / users.length) * 10) / 10 : 0,
        evolvedCount,
        tierCounts,
        classCounts,
        divisionCounts,
        levelBuckets,
      };
    });
    res.json(payload);
  } catch (err) {
    console.error("[ADMIN MASTER] Progress error:", err);
    res.status(500).json({ error: "Failed to compute progress analytics" });
  }
});

/**
 * GET /api/admin/master/users/:userId/dossier
 * Complete 360-degree view of a single user's progress, states, and feature usage.
 */
router.get("/users/:userId/dossier", async (req, res) => {
  if (!requireAdmin(req, res)) return;
  try {
    const storage = getStorage();
    const user = await storage.getUser(req.params.userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    const [quests, focusSessions, workouts, todayDebrief, feedbackItems] = await Promise.all([
      storage.getUserQuests(user.id),
      storage.getUserFocusSessions(user.id),
      storage.getUserWorkoutSessions(user.id, 30),
      storage.getEveningDebrief(user.id, new Date().toISOString().slice(0, 10)),
      storage.getUserFeedback(user.id),
    ]);

    res.json({
      user,
      summary: {
        questsTotal: quests.length,
        questsCompleted: quests.filter((q: any) => q.completed).length,
        focusSessionsCount: focusSessions.length,
        focusMinutesTotal: focusSessions.reduce((s: number, f: any) => s + (f.duration || 0), 0),
        workoutsCount: workouts.length,
        debriefsCount: todayDebrief ? 1 : 0,
        feedbackCount: feedbackItems.length,
      },
      recentQuests: quests.slice(0, 10),
      recentFocus: focusSessions.slice(0, 10),
      recentWorkouts: workouts.slice(0, 10),
      recentDebriefs: todayDebrief ? [todayDebrief] : [],
      feedback: feedbackItems.slice(0, 10),
    });
  } catch (err) {
    console.error("[ADMIN MASTER] Dossier error:", err);
    res.status(500).json({ error: "Failed to load user dossier" });
  }
});

/**
 * GET /api/admin/master/analytics/usage
 * Global adoption & intensity across every feature + Coin economy.
 */
router.get("/analytics/usage", async (req, res) => {
  if (!requireAdmin(req, res)) return;
  try {
    const payload = await cached("usage", 30_000, async () => {
      const storage = getStorage();
      const [users, focusAll, workoutsAll, questsAll, feedbackAll] = await Promise.all([
        storage.getAllUsers(),
        storage.getAllFocusSessionsAll(),
        storage.getAllWorkoutSessionsAll(),
        storage.getAllQuestsAll(),
        storage.getAllFeedbackAdmin(),
      ]);

      const totalUsers = Math.max(1, users.length);
      const featureStats = [
        {
          feature: "Quests Completed",
          uniqueUsers: new Set(questsAll.filter((q) => q.completed).map((q) => q.userId)).size,
          totalUses: questsAll.filter((q) => q.completed).length,
        },
        {
          feature: "Focus Sanctum",
          uniqueUsers: new Set(focusAll.map((f) => f.userId)).size,
          totalUses: focusAll.length,
        },
        {
          feature: "Workout Logger",
          uniqueUsers: new Set(workoutsAll.map((w) => w.userId)).size,
          totalUses: workoutsAll.length,
        },
        {
          feature: "Shadow Extraction (ARISE)",
          uniqueUsers: users.filter((u) => (u.extractedShadows?.length || 0) > 0).length,
          totalUses: users.reduce((s, u) => s + (u.extractedShadows?.length || 0), 0),
        },
        {
          feature: "Job Change Questline",
          uniqueUsers: users.filter((u) => !!(u as any).jobChangeState?.status).length,
          totalUses: users.filter((u) => (u as any).jobChangeState?.status === "completed").length,
        },
        {
          feature: "Double Dungeon",
          uniqueUsers: users.filter((u) => !!(u as any).doubleDungeonState?.active || !!(u as any).doubleDungeonState?.lastRunAt).length,
          totalUses: users.filter((u) => !!(u as any).doubleDungeonState?.lastRunAt).length,
        },
        {
          feature: "Reawakening Test",
          uniqueUsers: users.filter((u) => !!(u as any).reawakeningState?.lastTestAt).length,
          totalUses: users.filter((u) => !!(u as any).reawakeningState?.lastTestAt).length,
        },
        {
          feature: "Monarch's Domain",
          uniqueUsers: users.filter((u) => !!(u as any).monarchDomainState?.lastCompletedAt || !!(u as any).monarchDomainState?.active).length,
          totalUses: users.filter((u) => !!(u as any).monarchDomainState?.lastCompletedAt).length,
        },
        {
          feature: "Guilds",
          uniqueUsers: users.filter((u) => !!u.guildId).length,
          totalUses: users.filter((u) => !!u.guildId).length,
        },
        {
          feature: "Feedback & Bug Reports",
          uniqueUsers: new Set(feedbackAll.map((f) => f.userId)).size,
          totalUses: feedbackAll.length,
        },
      ].map((row) => ({
        ...row,
        adoptionPct: Math.round((row.uniqueUsers / totalUsers) * 100),
      }));

      const totalCoins = users.reduce((s, u) => s + (u.coins || 0), 0);
      const totalFocusMinutes = focusAll.reduce((s, f) => s + (f.duration || 0), 0);
      const focusBreaches = focusAll.filter((f) => (f.breachCount || 0) > 0).length;

      return {
        totalUsers: users.length,
        featureStats,
        economy: {
          totalCoinsInCirculation: totalCoins,
          avgCoinsPerUser: Math.round(totalCoins / totalUsers),
          totalManaShields: users.reduce((s, u) => s + (u.streakShields || 0), 0),
        },
        focusHealth: {
          totalMinutes: totalFocusMinutes,
          breachRatePct: focusAll.length ? Math.round((focusBreaches / focusAll.length) * 100) : 0,
        },
      };
    });
    res.json(payload);
  } catch (err) {
    console.error("[ADMIN MASTER] Usage error:", err);
    res.status(500).json({ error: "Failed to compute usage analytics" });
  }
});

/**
 * GET /api/admin/master/analytics/user-feature-matrix?search=&page=1&limit=25
 * Per-user x per-feature usage breakdown for every single user.
 */
router.get("/analytics/user-feature-matrix", async (req, res) => {
  if (!requireAdmin(req, res)) return;
  try {
    const search = (typeof req.query.search === "string" ? req.query.search : "").trim().toLowerCase();
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(5, Number(req.query.limit) || 25));

    const storage = getStorage();
    const [users, focusAll, workoutsAll, questsAll, feedbackAll] = await Promise.all([
      storage.getAllUsers(),
      storage.getAllFocusSessionsAll(),
      storage.getAllWorkoutSessionsAll(),
      storage.getAllQuestsAll(),
      storage.getAllFeedbackAdmin(),
    ]);

    const filtered = search
      ? users.filter((u) => u.name.toLowerCase().includes(search) || u.email.toLowerCase().includes(search))
      : users;

    const slice = filtered.slice((page - 1) * limit, page * limit);
    const matrix = slice.map((u) => {
      const uFocus = focusAll.filter((f) => f.userId === u.id);
      const uWorkouts = workoutsAll.filter((w) => w.userId === u.id);
      const uQuests = questsAll.filter((q) => q.userId === u.id && q.completed);
      const uFeedback = feedbackAll.filter((f) => f.userId === u.id);

      return {
        userId: u.id,
        name: u.name,
        email: u.email,
        tier: u.tier,
        level: u.level,
        streak: u.streak,
        lastActiveDate: u.lastActive,
        questsCompleted: uQuests.length,
        focusSessions: uFocus.length,
        focusMinutes: uFocus.reduce((s, f) => s + (f.duration || 0), 0),
        workouts: uWorkouts.length,
        shadowsExtracted: u.extractedShadows?.length || 0,
        jobChangeStatus: (u as any).jobChangeState?.status || "none",
        doubleDungeonUsed: Boolean((u as any).doubleDungeonState?.active || (u as any).doubleDungeonState?.lastRunAt),
        reawakeningUsed: Boolean((u as any).reawakeningState?.lastTestAt),
        monarchDomainUsed: Boolean((u as any).monarchDomainState?.lastCompletedAt || (u as any).monarchDomainState?.active),
        guildJoined: Boolean(u.guildId),
        feedbackSubmitted: uFeedback.length,
      };
    });

    res.json({
      total: filtered.length,
      page,
      limit,
      matrix,
    });
  } catch (err) {
    console.error("[ADMIN MASTER] Matrix error:", err);
    res.status(500).json({ error: "Failed to build user-feature matrix" });
  }
});

/**
 * GET /api/admin/master/analytics/limits
 * AI provider calls, cache ratio, remaining daily quotas, rate limits, and client error diagnostics.
 */
router.get("/analytics/limits", async (req, res) => {
  if (!requireAdmin(req, res)) return;
  try {
    const storage = getStorage();
    const todayYmd = new Date().toISOString().slice(0, 10);
    const [config, aiLogs, users, feedbackAll] = await Promise.all([
      storage.getSystemConfig(),
      storage.getAiUsageLogsSince(new Date(Date.now() - 7 * 86400_000)),
      storage.getAllUsers(),
      storage.getAllFeedbackAdmin({ type: "bug" }),
    ]);

    const aiToday = aiLogs.filter((l) => toYmd(l.createdAt) === todayYmd);
    const providers = ["gemini", "groq", "openrouter", "custom_openai"];
    const capPerProvider = config.limits.aiDailyCapPerProvider || 5000;

    const providerStats = providers.map((p) => {
      const pToday = aiToday.filter((l) => l.provider === p);
      const p7d = aiLogs.filter((l) => l.provider === p);
      const avgLatencyMs = p7d.length
        ? Math.round(p7d.reduce((s, l) => s + (l.latencyMs || 0), 0) / p7d.length)
        : 0;
      return {
        provider: p,
        callsToday: pToday.length,
        calls7d: p7d.length,
        remainingToday: Math.max(0, capPerProvider - pToday.length),
        capPerDay: capPerProvider,
        errors7d: p7d.filter((l) => !l.success).length,
        avgLatencyMs,
      };
    });

    const recentClientErrors = feedbackAll
      .filter((f) => f.diagnostics?.recentErrors && f.diagnostics.recentErrors.length > 0)
      .slice(0, 15)
      .map((f) => ({
        feedbackId: f.id,
        userName: f.userName,
        title: f.title,
        status: f.status,
        appVersion: f.diagnostics?.appVersion,
        os: f.diagnostics?.os,
        recentErrors: f.diagnostics?.recentErrors || [],
        createdAt: f.createdAt,
      }));

    res.json({
      limits: config.limits,
      aiSummary: {
        callsToday: aiToday.length,
        calls7d: aiLogs.length,
        errorsToday: aiToday.filter((l) => !l.success).length,
        providerStats,
      },
      activeCooldowns: {
        guildCooldownUsers: users.filter((u) => (u as any).guildCooldownUntil && new Date((u as any).guildCooldownUntil) > new Date()).length,
        doubleDungeonActive: users.filter((u) => (u as any).doubleDungeonState?.active).length,
        monarchDomainActive: users.filter((u) => (u as any).monarchDomainState?.active).length,
      },
      recentClientErrors,
    });
  } catch (err) {
    console.error("[ADMIN MASTER] Limits error:", err);
    res.status(500).json({ error: "Failed to fetch AI & limits telemetry" });
  }
});

/**
 * GET / PATCH /api/admin/master/config
 */
router.get("/config", async (req, res) => {
  if (!requireAdmin(req, res)) return;
  try {
    const config = await getStorage().getSystemConfig();
    res.json(config);
  } catch (err) {
    res.status(500).json({ error: "Failed to load system config" });
  }
});

router.patch("/config", async (req, res) => {
  if (!requireAdmin(req, res)) return;
  try {
    const storage = getStorage();
    const before = await storage.getSystemConfig();
    const updated = await storage.updateSystemConfig(req.body || {});
    await storage.createAdminAuditLog({
      action: "CONFIG_UPDATE",
      beforeState: before,
      afterState: updated,
      note: "Updated global system controls/flags/limits",
    });
    analyticsCache.clear();
    res.json(updated);
  } catch (err) {
    console.error("[ADMIN MASTER] Config update error:", err);
    res.status(500).json({ error: "Failed to update system config" });
  }
});

/**
 * POST /api/admin/master/users/:userId/override
 * Full per-user master override + one-click state actions + audit log.
 */
router.post("/users/:userId/override", async (req, res) => {
  if (!requireAdmin(req, res)) return;
  try {
    const storage = getStorage();
    const user = await storage.getUser(req.params.userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    const { action, fields, shadowId, note } = req.body || {};
    const updates: Record<string, any> = {};

    if (fields && typeof fields === "object") {
      const allowed = [
        "level", "xp", "tier", "coins", "streak", "streakShields",
        "strength", "agility", "stamina", "vitality", "intelligence", "willpower", "charisma",
        "hunterClass", "evolvedClass", "isPremium", "role", "inPenaltyZone", "onboardingCompleted",
      ];
      for (const k of allowed) {
        if (fields[k] !== undefined) updates[k] = fields[k];
      }
    }

    if (action === "clear_penalty") {
      updates.inPenaltyZone = false;
    } else if (action === "trigger_comeback") {
      updates.comebackGate = { active: true, preBreakStreak: Math.max(1, user.streak || 3), triggeredAt: new Date().toISOString() };
    } else if (action === "clear_comeback") {
      updates.comebackGate = null;
    } else if (action === "grant_shadow" && shadowId) {
      const current = Array.isArray(user.extractedShadows) ? user.extractedShadows : [];
      if (!current.some((s) => s.baseShadowId === shadowId || s.id === shadowId)) {
        updates.extractedShadows = [
          ...current,
          {
            id: `${shadowId}_${Date.now()}`,
            baseShadowId: shadowId,
            name: String(shadowId).toUpperCase(),
            title: "Admin Granted Shadow",
            loreOrigin: "Granted directly by the System Architect.",
            passiveType: shadowId,
            acquiredAt: new Date().toISOString(),
          },
        ];
      }
    } else if (action === "revoke_shadow" && shadowId) {
      const current = Array.isArray(user.extractedShadows) ? user.extractedShadows : [];
      updates.extractedShadows = current.filter((s) => s.baseShadowId !== shadowId && s.id !== shadowId);
    } else if (action === "reset_cooldowns") {
      updates.guildCooldownUntil = null;
      updates.doubleDungeonState = null;
      updates.reawakeningState = null;
      updates.monarchDomainState = null;
    } else if (action === "ban_user") {
      updates.role = "banned";
    } else if (action === "unban_user") {
      updates.role = "user";
    }

    const updated = await storage.updateUser(user.id, updates);
    await storage.createAdminAuditLog({
      action: action ? `USER_ACTION_${String(action).toUpperCase()}` : "USER_OVERRIDE",
      targetUserId: user.id,
      beforeState: {
        level: user.level, xp: user.xp, tier: user.tier, coins: user.coins,
        streak: user.streak, inPenaltyZone: user.inPenaltyZone, role: user.role,
      },
      afterState: updates,
      note: note || `Admin override on ${user.email}`,
    });
    analyticsCache.clear();
    res.json({ success: true, user: updated });
  } catch (err) {
    console.error("[ADMIN MASTER] Override error:", err);
    res.status(500).json({ error: "Failed to override user state" });
  }
});

/**
 * POST /api/admin/master/push-broadcast
 * Send push notifications + in-app notifications to ALL users or targeted segments.
 */
router.post("/push-broadcast", async (req, res) => {
  if (!requireAdmin(req, res)) return;
  try {
    const { title, body, segment = "all", targetTier, targetUserId } = req.body || {};
    if (!title || !body) {
      return res.status(400).json({ error: "title and body are required" });
    }

    const storage = getStorage();
    const users = await storage.getAllUsers();
    const todayYmd = new Date().toISOString().slice(0, 10);
    const threeDaysAgoYmd = addDays(todayYmd, -3);

    let targets = users;
    if (segment === "active_today") {
      targets = users.filter((u) => toYmd(u.lastActive) === todayYmd);
    } else if (segment === "inactive_3d") {
      targets = users.filter((u) => !u.lastActive || toYmd(u.lastActive) <= threeDaysAgoYmd);
    } else if (segment === "penalty_zone") {
      targets = users.filter((u) => u.inPenaltyZone);
    } else if (segment === "tier" && targetTier) {
      targets = users.filter((u) => u.tier === targetTier);
    } else if (segment === "single_user" && targetUserId) {
      targets = users.filter((u) => u.id === targetUserId);
    }

    let pushSent = 0;
    let pushFailed = 0;
    let inAppCreated = 0;

    for (const u of targets) {
      try {
        await storage.createNotification({
          userId: u.id,
          type: "system",
          title: String(title),
          message: String(body),
        });
        inAppCreated++;
      } catch (_) {}

      const tokens: string[] = Array.isArray((u as any).fcmTokens) ? (u as any).fcmTokens : [];
      if (tokens.length > 0) {
        try {
          const resp = await getFirebaseAdmin().messaging().sendEachForMulticast({
            tokens,
            notification: { title: String(title), body: String(body) },
          });
          pushSent += resp.successCount;
          pushFailed += resp.failureCount;
        } catch (_) {
          pushFailed += tokens.length;
        }
      }
    }

    await storage.createAdminAuditLog({
      action: "PUSH_BROADCAST",
      afterState: { segment, targetTier, targetedUsers: targets.length, inAppCreated, pushSent, pushFailed, title },
      note: `Broadcast "${title}" to segment=${segment}`,
    });

    res.json({
      success: true,
      targetedUsers: targets.length,
      inAppCreated,
      pushSent,
      pushFailed,
    });
  } catch (err) {
    console.error("[ADMIN MASTER] Push broadcast error:", err);
    res.status(500).json({ error: "Failed to dispatch broadcast" });
  }
});

/**
 * POST /api/admin/master/trigger-job
 */
router.post("/trigger-job", async (req, res) => {
  if (!requireAdmin(req, res)) return;
  try {
    const { job } = req.body || {};
    if (job === "clear_cache") {
      analyticsCache.clear();
      return res.json({ success: true, message: "Analytics cache cleared" });
    }
    res.json({ success: true, message: `Triggered ${job || "noop"}` });
  } catch (err) {
    res.status(500).json({ error: "Failed to trigger job" });
  }
});

/**
 * GET /api/admin/master/audit-logs
 */
router.get("/audit-logs", async (req, res) => {
  if (!requireAdmin(req, res)) return;
  try {
    const logs = await getStorage().getAdminAuditLogs(150);
    res.json({ logs });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch audit logs" });
  }
});

/**
 * GET /api/admin/master/export?scope=all|user_feature_matrix|feedback|ai_limits|audit_logs&format=json|csv
 * Export full product analytics & raw tables for product development.
 */
router.get("/export", async (req, res) => {
  if (!requireAdmin(req, res)) return;
  try {
    const scope = typeof req.query.scope === "string" ? req.query.scope : "all";
    const format = req.query.format === "csv" ? "csv" : "json";
    const storage = getStorage();

    const [users, focusAll, workoutsAll, questsAll, feedbackAll, aiLogs, auditLogs, config] = await Promise.all([
      storage.getAllUsers(),
      storage.getAllFocusSessionsAll(),
      storage.getAllWorkoutSessionsAll(),
      storage.getAllQuestsAll(),
      storage.getAllFeedbackAdmin(),
      storage.getAiUsageLogsSince(new Date(Date.now() - 30 * 86400_000)),
      storage.getAdminAuditLogs(500),
      storage.getSystemConfig(),
    ]);

    const userMatrix = users.map((u) => {
      const uFocus = focusAll.filter((f) => f.userId === u.id);
      const uWorkouts = workoutsAll.filter((w) => w.userId === u.id);
      const uQuests = questsAll.filter((q) => q.userId === u.id && q.completed);
      return {
        userId: u.id,
        name: u.name,
        email: u.email,
        tier: u.tier,
        level: u.level,
        xp: u.xp,
        coins: u.coins,
        streak: u.streak,
        hunterClass: u.evolvedClass || u.hunterClass,
        inPenaltyZone: u.inPenaltyZone,
        onboardingCompleted: u.onboardingCompleted,
        createdAt: u.createdAt,
        lastActiveDate: u.lastActive,
        questsCompleted: uQuests.length,
        focusSessions: uFocus.length,
        focusMinutes: uFocus.reduce((s, f) => s + (f.duration || 0), 0),
        workouts: uWorkouts.length,
        shadowsExtracted: u.extractedShadows?.length || 0,
        guildId: u.guildId || "",
      };
    });

    let exportData: any;
    if (scope === "user_feature_matrix") exportData = userMatrix;
    else if (scope === "feedback") exportData = feedbackAll;
    else if (scope === "ai_limits") exportData = aiLogs;
    else if (scope === "audit_logs") exportData = auditLogs;
    else {
      exportData = {
        exportedAt: new Date().toISOString(),
        totalUsers: users.length,
        config,
        userFeatureMatrix: userMatrix,
        feedback: feedbackAll,
        aiUsageLogs: aiLogs,
        auditLogs,
      };
    }

    if (format === "csv") {
      const rows = Array.isArray(exportData) ? exportData : userMatrix;
      const csv = rowsToCsv(rows);
      res.setHeader("Content-Type", "text/csv; charset=utf-8");
      res.setHeader("Content-Disposition", `attachment; filename="ascension_${scope}_${new Date().toISOString().slice(0, 10)}.csv"`);
      return res.send(csv);
    }

    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="ascension_${scope}_${new Date().toISOString().slice(0, 10)}.json"`);
    res.send(JSON.stringify(exportData, null, 2));
  } catch (err) {
    console.error("[ADMIN MASTER] Export error:", err);
    res.status(500).json({ error: "Failed to export data" });
  }
});

export default router;
