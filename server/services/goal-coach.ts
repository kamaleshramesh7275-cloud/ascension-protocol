import { GoogleGenAI } from "@google/genai";
import type { InsertQuest, RoadmapTask, RoadmapWeek, User, WorkoutSession } from "@shared/schema";

export type GoalDomain = "fitness" | "career_code" | "study_exam" | "business" | "discipline";

export interface RoadmapBlueprintWeek {
  weekNumber: number;
  phaseName: string;
  goal: string;
  description: string;
  targetFocusMinutes: number;
  targetWorkouts: number;
  tasks: Array<{ dayNumber: number; text: string; isBoss: boolean }>;
}

export interface DebriefAnalysisResult {
  diagnosticFeedback: string;
  tomorrowIfThenCue: string;
  coachActionType: "standard" | "scale_down_25" | "recovery_focus" | "bottleneck_fix";
  blockerTag: string;
  prescribedCategory: string;
  providerUsed: string;
}

export interface RadarBottleneck {
  stat: string;
  value: number;
  reason: string;
  actionTitle: string;
  actionType: "focus" | "workout" | "recovery" | "outreach";
  targetMinutes?: number;
  recommendedGuideCategory: string;
}

type ProviderName = "gemini" | "groq" | "openrouter" | "custom_openai" | "deterministic";

const providerCooldowns = new Map<string, number>();

function isCoolingDown(provider: string): boolean {
  const until = providerCooldowns.get(provider);
  if (!until) return false;
  if (Date.now() > until) {
    providerCooldowns.delete(provider);
    return false;
  }
  return true;
}

function tripCooldown(provider: string, ms = 90_000): void {
  providerCooldowns.set(provider, Date.now() + ms);
}

function extractJsonObject(raw: string): any | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  const fencedMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fencedMatch ? fencedMatch[1].trim() : trimmed;
  try {
    return JSON.parse(candidate);
  } catch {
    const start = candidate.indexOf("{");
    const end = candidate.lastIndexOf("}");
    if (start >= 0 && end > start) {
      try {
        return JSON.parse(candidate.slice(start, end + 1));
      } catch {
        return null;
      }
    }
    return null;
  }
}

async function callOpenAiCompatibleJson(params: {
  providerName: string;
  url: string;
  apiKey: string;
  model: string;
  systemPrompt: string;
  userPrompt: string;
  extraHeaders?: Record<string, string>;
}): Promise<any | null> {
  if (isCoolingDown(params.providerName)) return null;
  try {
    const res = await fetch(params.url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${params.apiKey}`,
        ...(params.extraHeaders || {}),
      },
      body: JSON.stringify({
        model: params.model,
        temperature: 0.4,
        max_tokens: 1400,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: params.systemPrompt },
          { role: "user", content: params.userPrompt },
        ],
      }),
      signal: AbortSignal.timeout(7000),
    });

    if (res.status === 429 || res.status === 402 || res.status === 503) {
      tripCooldown(params.providerName);
      return null;
    }
    if (!res.ok) return null;
    const data = await res.json();
    const content = data?.choices?.[0]?.message?.content;
    return typeof content === "string" ? extractJsonObject(content) : null;
  } catch {
    return null;
  }
}

async function callGeminiJson(params: {
  apiKey: string;
  model: string;
  systemPrompt: string;
  userPrompt: string;
}): Promise<any | null> {
  const cooldownKey = `gemini:${params.model}`;
  if (isCoolingDown(cooldownKey)) return null;
  try {
    const ai = new GoogleGenAI({ apiKey: params.apiKey });
    const response = await ai.models.generateContent({
      model: params.model,
      contents: `${params.systemPrompt}\n\n${params.userPrompt}`,
      config: {
        responseMimeType: "application/json",
        temperature: 0.4,
      },
    });
    const text = response?.text;
    return typeof text === "string" ? extractJsonObject(text) : null;
  } catch (err: any) {
    const status = err?.status || err?.code;
    if (status === 429 || status === 503 || status === 404 || String(err?.message || "").includes("429")) {
      tripCooldown(cooldownKey);
    }
    return null;
  }
}

/**
 * Multi-provider free-first AI failover chain (per-model pool cooldowns):
 * 1. Google AI Studio Free Tier (`GEMINI_API_KEY`) -> `gemini-3.5-flash` / `gemini-3.5-flash-lite` / `gemini-3.1-flash-lite`
 * 2. Groq Free Tier (`GROQ_API_KEY`) -> `openai/gpt-oss-120b`, `qwen/qwen3.8-27b`, `openai/gpt-oss-20b` (~1,000 req/day per model)
 * 3. OpenRouter `:free` Pool (`OPENROUTER_API_KEY`) -> `openrouter/free` (50 req/day on $0 lock)
 * 4. Optional custom OpenAI-compatible free edge (`AI_FALLBACK_URL` + `AI_FALLBACK_KEY`)
 * 5. Built-in Deterministic Domain Engine (0ms, infinite free ceiling).
 */
export async function callMultiAiJson<T = any>(
  systemPrompt: string,
  userPrompt: string,
  taskType: "plan" | "coach",
  meta?: { feature?: string; userId?: string }
): Promise<{ data: T; provider: ProviderName } | null> {
  const startedAt = Date.now();
  const featureName = meta?.feature || taskType;
  let storageRef: any = null;
  try {
    const { getStorage } = await import("../storage");
    storageRef = getStorage();
    const cfg = await storageRef.getSystemConfig();
    if (cfg && cfg.aiCoachingEnabled === false) {
      return null;
    }
  } catch (_) {}

  const recordLog = (provider: string, success: boolean, errorCode?: string) => {
    if (!storageRef?.logAiUsage) return;
    storageRef.logAiUsage({
      userId: meta?.userId ?? null,
      feature: featureName,
      provider,
      cacheHit: false,
      success,
      latencyMs: Date.now() - startedAt,
      errorCode: errorCode ?? null,
    }).catch(() => {});
  };

  const geminiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY;
  if (geminiKey) {
    const geminiModels = Array.from(
      new Set(
        taskType === "plan"
          ? [
              process.env.GEMINI_PLANNER_MODEL || "gemini-3.5-flash",
              "gemini-3.5-flash-lite",
              "gemini-3.1-flash-lite",
            ]
          : [
              process.env.GEMINI_COACH_MODEL || "gemini-3.5-flash-lite",
              "gemini-3.1-flash-lite",
              "gemini-3.5-flash",
            ]
      )
    );
    for (const model of geminiModels) {
      const parsed = await callGeminiJson({
        apiKey: geminiKey,
        model,
        systemPrompt,
        userPrompt,
      });
      if (parsed) {
        recordLog("gemini", true);
        return { data: parsed as T, provider: "gemini" };
      }
    }
  }

  const groqKey = process.env.GROQ_API_KEY;
  if (groqKey) {
    const groqModels = Array.from(
      new Set(
        taskType === "plan"
          ? [
              process.env.GROQ_PLANNER_MODEL || "openai/gpt-oss-120b",
              "qwen/qwen3.8-27b",
              "openai/gpt-oss-20b",
            ]
          : [
              process.env.GROQ_COACH_MODEL || "qwen/qwen3.8-27b",
              "openai/gpt-oss-20b",
              "openai/gpt-oss-120b",
            ]
      )
    );
    for (const model of groqModels) {
      const parsed = await callOpenAiCompatibleJson({
        providerName: `groq:${model}`,
        url: "https://api.groq.com/openai/v1/chat/completions",
        apiKey: groqKey,
        model,
        systemPrompt,
        userPrompt,
      });
      if (parsed) {
        recordLog("groq", true);
        return { data: parsed as T, provider: "groq" };
      }
    }
  }

  const openRouterKey = process.env.OPENROUTER_API_KEY;
  if (openRouterKey) {
    const parsed = await callOpenAiCompatibleJson({
      providerName: "openrouter",
      url: "https://openrouter.ai/api/v1/chat/completions",
      apiKey: openRouterKey,
      model: process.env.OPENROUTER_FREE_MODEL || "openrouter/free",
      systemPrompt,
      userPrompt,
      extraHeaders: {
        "HTTP-Referer": "https://ascensions.in",
        "X-Title": "Ascension Protocol",
      },
    });
    if (parsed) {
      recordLog("openrouter", true);
      return { data: parsed as T, provider: "openrouter" };
    }
  }

  const customUrl = process.env.AI_FALLBACK_URL;
  const customKey = process.env.AI_FALLBACK_KEY;
  if (customUrl && customKey) {
    const parsed = await callOpenAiCompatibleJson({
      providerName: "custom_openai",
      url: customUrl,
      apiKey: customKey,
      model: process.env.AI_FALLBACK_MODEL || "@cf/meta/llama-3.1-8b-instruct",
      systemPrompt,
      userPrompt,
    });
    if (parsed) {
      recordLog("custom_openai", true);
      return { data: parsed as T, provider: "custom_openai" };
    }
  }

  recordLog("none", false, "ALL_PROVIDERS_FAILED");
  return null;
}

/** Infer structured GoalDomain from either prefixed (`fitness:...`) or free-text goals. */
export function inferGoalDomain(goalText?: string | null, hunterClass?: string | null): GoalDomain {
  const lower = (goalText || "").toLowerCase();
  if (lower.startsWith("fitness:") || /\b(weight|fat|muscle|gym|bench|squat|deadlift|run|5k|10k|marathon|pushup|pullup|abs|strength|cardio|body|fit)\b/i.test(lower)) {
    return "fitness";
  }
  if (lower.startsWith("intellect:") || /\b(exam|study|cfa|usmle|gre|gmat|upsc|gate|jee|neet|sat|cert|degree|course|book|thesis|learn|language|spanish)\b/i.test(lower)) {
    return "study_exam";
  }
  if (/\b(code|coding|software|app|saas|mvp|react|flutter|python|rust|backend|frontend|fullstack|leetcode|algorithm|engineer|developer|ai|project|deploy)\b/i.test(lower)) {
    return "career_code";
  }
  if (lower.startsWith("wealth:") || /\b(business|startup|agency|revenue|mrr|sales|client|freelance|income|profit|launch|brand|marketing|outreach)\b/i.test(lower)) {
    return "business";
  }
  if (lower.startsWith("mindfulness:") || lower.startsWith("social:") || /\b(discipline|habit|focus|wake|sleep|routine|meditat|dopamine|phone|procrastin)\b/i.test(lower)) {
    return "discipline";
  }

  // Tie-break via hunterClass if generic phrasing
  if (hunterClass === "tank" || hunterClass === "ranger" || hunterClass === "assassin") return "fitness";
  if (hunterClass === "mage") return "career_code";
  return "discipline";
}

function cleanGoalLabel(goalText?: string | null): string {
  const raw = (goalText || "").trim();
  if (!raw) return "Master Peak Execution";
  const colonIdx = raw.indexOf(":");
  if (colonIdx > 0 && colonIdx < 16) {
    return raw.slice(colonIdx + 1).trim() || raw;
  }
  return raw;
}

function buildDeterministicRoadmapWeeks(params: {
  goalText: string;
  goalDomain: GoalDomain;
  dailyCapacityMinutes: number;
  equipmentProfile?: string;
  primaryDistractor?: string;
  pushups?: number;
}): RoadmapBlueprintWeek[] {
  const goal = cleanGoalLabel(params.goalText);
  const dailyMins = Math.max(30, Math.min(240, params.dailyCapacityMinutes || 90));
  const weeklyFocusTarget = dailyMins * 5;
  const distractor = params.primaryDistractor || "phone distractions";
  const eq = params.equipmentProfile || "bodyweight";
  const basePushups = Math.max(8, params.pushups || 15);

  if (params.goalDomain === "fitness") {
    const modeCue = eq === "gym" ? "barbell/machine compounds" : eq === "dumbbells" ? "dumbbell complexes" : `${basePushups}+ calisthenics sets`;
    return [
      {
        weekNumber: 1,
        phaseName: "WEEK 1: NEUROMUSCULAR FLOOR",
        goal: `Lock baseline training attendance for ${goal}`,
        description: `Establish unbroken session consistency using ${modeCue} and daily sleep/protein tracking.`,
        targetFocusMinutes: Math.min(180, dailyMins * 3),
        targetWorkouts: 3,
        tasks: [
          { dayNumber: 1, text: `Log Baseline Workout #1 (${modeCue}) + record exact weights/reps`, isBoss: false },
          { dayNumber: 2, text: `Active recovery walk 25m + eliminate ${distractor} 1h before bed`, isBoss: false },
          { dayNumber: 3, text: `Log Session #2 chasing +1 rep on primary compound lift`, isBoss: false },
          { dayNumber: 5, text: `Hit minimum protein/hydration floor 4 days straight`, isBoss: false },
          { dayNumber: 7, text: `BOSS TRIAL: Complete Session #3 with zero missed sets for ${goal}`, isBoss: true },
        ],
      },
      {
        weekNumber: 2,
        phaseName: "WEEK 2: PROGRESSIVE OVERLOAD",
        goal: `Beat Week-1 tonnage/reps on ${goal}`,
        description: "Systematically add +2.5kg or +1-2 reps across compound lifts while protecting 7h sleep.",
        targetFocusMinutes: Math.min(200, dailyMins * 3),
        targetWorkouts: 4,
        tasks: [
          { dayNumber: 1, text: `Push primary lift past Week-1 Epley 1RM target`, isBoss: false },
          { dayNumber: 3, text: `Neutralize ${distractor} pre-workout; start within 10m of schedule`, isBoss: false },
          { dayNumber: 5, text: `Add 1 extra working set on weak muscle group or conditioning sprint`, isBoss: false },
          { dayNumber: 7, text: `BOSS TRIAL: Record 1+ verified Exercise PR inside Workout Logger`, isBoss: true },
        ],
      },
      {
        weekNumber: 3,
        phaseName: "WEEK 3: THRESHOLD CAPACITY",
        goal: `Sustain peak training volume without fatigue crash`,
        description: "Manage Bio-Fatigue via sleep debriefs while pushing compound density.",
        targetFocusMinutes: Math.min(220, dailyMins * 3),
        targetWorkouts: 4,
        tasks: [
          { dayNumber: 1, text: `Hit 4 structured training blocks with strict rest timers`, isBoss: false },
          { dayNumber: 3, text: `Log 7h+ sleep across 3 consecutive Evening Debriefs`, isBoss: false },
          { dayNumber: 5, text: `Complete mid-week cardio/conditioning benchmark`, isBoss: false },
          { dayNumber: 7, text: `BOSS TRIAL: +10% cumulative weekly tonnage vs Week 1`, isBoss: true },
        ],
      },
      {
        weekNumber: 4,
        phaseName: "WEEK 4: PEAK BENCHMARK TEST",
        goal: `Realize measurable 30-day milestone for ${goal}`,
        description: "Consolidate fatigue and test max strength, endurance, or physique checkpoint.",
        targetFocusMinutes: Math.min(240, dailyMins * 4),
        targetWorkouts: 4,
        tasks: [
          { dayNumber: 1, text: `Smart intensity taper on lagging lifts to clear fatigue`, isBoss: false },
          { dayNumber: 3, text: `Review 30-day PR trend and nutrition compliance`, isBoss: false },
          { dayNumber: 5, text: `Execute benchmark test session for ${goal}`, isBoss: false },
          { dayNumber: 7, text: `FINAL BOSS: Complete Week-4 Assessment & lock next 30-day target`, isBoss: true },
        ],
      },
    ];
  }

  if (params.goalDomain === "career_code" || params.goalDomain === "business") {
    const artifactNoun = params.goalDomain === "career_code" ? "architecture, core modules, and runnable build" : "offer, ICP list, and outbound conversations";
    return [
      {
        weekNumber: 1,
        phaseName: "WEEK 1: SCOPE & CORE SCAFFOLD",
        goal: `Break ${goal} into daily shippable specs and ship v0.1`,
        description: `Lock daily ${dailyMins}m distraction-free blocks and finish foundational ${artifactNoun}.`,
        targetFocusMinutes: weeklyFocusTarget,
        targetWorkouts: 2,
        tasks: [
          { dayNumber: 1, text: `Write a strict 1-page scope doc breaking ${goal} into 4 weekly deliverables`, isBoss: false },
          { dayNumber: 2, text: `Complete 2x ${Math.min(60, dailyMins)}m Air-Gap Focus sprints on core foundation`, isBoss: false },
          { dayNumber: 4, text: `Firewall ${distractor} during peak focus hours (log 0 breaches)`, isBoss: false },
          { dayNumber: 6, text: `Ship first working milestone artifact and write proof note`, isBoss: false },
          { dayNumber: 7, text: `BOSS TRIAL: Reach 100% Week-1 focus target hours with verifiable output`, isBoss: true },
        ],
      },
      {
        weekNumber: 2,
        phaseName: "WEEK 2: HIGH-LEVERAGE BUILD",
        goal: `Execute core value engine for ${goal}`,
        description: "Prioritize hardest technical/revenue needle-movers before checking messages.",
        targetFocusMinutes: Math.round(weeklyFocusTarget * 1.1),
        targetWorkouts: 2,
        tasks: [
          { dayNumber: 1, text: `Execute Morning Anchor before opening social feeds or inbox`, isBoss: false },
          { dayNumber: 3, text: `Complete primary feature/pipeline build block and verify output`, isBoss: false },
          { dayNumber: 5, text: `Stress-test against real users, tests, or rejection feedback`, isBoss: false },
          { dayNumber: 7, text: `BOSS TRIAL: Demo/verify Week-2 functional milestone for ${goal}`, isBoss: true },
        ],
      },
      {
        weekNumber: 3,
        phaseName: "WEEK 3: HARDENING & VELOCITY",
        goal: `Eliminate bottlenecks slowing ${goal}`,
        description: "Fix edge cases, close feedback loops, and sustain unbroken focus density.",
        targetFocusMinutes: Math.round(weeklyFocusTarget * 1.15),
        targetWorkouts: 3,
        tasks: [
          { dayNumber: 1, text: `Audit Week 1-2 bottlenecks and clear top 3 high-impact blockers`, isBoss: false },
          { dayNumber: 3, text: `Log 3 unbroken Deep Work blocks (zero background exits)`, isBoss: false },
          { dayNumber: 5, text: `Complete full integration / customer conversion push`, isBoss: false },
          { dayNumber: 7, text: `BOSS TRIAL: Reach 85% milestone readiness for ${goal}`, isBoss: true },
        ],
      },
      {
        weekNumber: 4,
        phaseName: "WEEK 4: SHIP & VERIFY OUTCOME",
        goal: `Launch & validate real-world completion of ${goal}`,
        description: "Final polish, public proof delivery, and next-horizon planning.",
        targetFocusMinutes: weeklyFocusTarget,
        targetWorkouts: 2,
        tasks: [
          { dayNumber: 1, text: `Freeze new scope; focus 100% on finishing launch checklist`, isBoss: false },
          { dayNumber: 3, text: `Complete pre-launch verification & final proof audit`, isBoss: false },
          { dayNumber: 5, text: `Ship final deliverable to real world / production / clients`, isBoss: false },
          { dayNumber: 7, text: `FINAL BOSS: Post verified milestone proof for ${goal}`, isBoss: true },
        ],
      },
    ];
  }

  // study_exam or discipline
  return [
    {
      weekNumber: 1,
      phaseName: "WEEK 1: ENVIRONMENT & SYLLABUS LOCK",
      goal: `Eliminate ${distractor} and lock daily baseline for ${goal}`,
      description: `Establish non-negotiable ${dailyMins}m daily blocks with active recall instead of passive reading.`,
      targetFocusMinutes: weeklyFocusTarget,
      targetWorkouts: 2,
      tasks: [
        { dayNumber: 1, text: `Map exact topics/habits needed for ${goal} and cut low-ROI busywork`, isBoss: false },
        { dayNumber: 2, text: `Run first ${Math.min(45, dailyMins)}m Air-Gap Focus session with zero phone switches`, isBoss: false },
        { dayNumber: 4, text: `Complete 3 Evening Debriefs identifying exact procrastination triggers`, isBoss: false },
        { dayNumber: 7, text: `BOSS TRIAL: Pass 7-day baseline test / uninterrupted review block`, isBoss: true },
      ],
    },
    {
      weekNumber: 2,
      phaseName: "WEEK 2: ACTIVE RETRIEVAL & FRICTION REMOVAL",
      goal: `Convert passive study/intention into tested execution`,
      description: "Daily problem sets, spaced recall, and strict peak-window enforcement.",
      targetFocusMinutes: Math.round(weeklyFocusTarget * 1.1),
      targetWorkouts: 2,
      tasks: [
        { dayNumber: 1, text: `Execute 2 timed active-recall drills on hardest section`, isBoss: false },
        { dayNumber: 3, text: `Log weak error patterns and schedule targeted fixes`, isBoss: false },
        { dayNumber: 5, text: `Hit 100% planned daily focus density for 3 straight days`, isBoss: false },
        { dayNumber: 7, text: `BOSS TRIAL: Score >= 75% on timed Week-2 practice benchmark`, isBoss: true },
      ],
    },
    {
      weekNumber: 3,
      phaseName: "WEEK 3: TIMED PRESSURE SIMULATIONS",
      goal: `Perform cleanly under real exam/deadline constraints`,
      description: "Replicate real pressure conditions and fix time-management leaks.",
      targetFocusMinutes: Math.round(weeklyFocusTarget * 1.15),
      targetWorkouts: 3,
      tasks: [
        { dayNumber: 1, text: `Run full-length timed simulation under exam rules`, isBoss: false },
        { dayNumber: 3, text: `Remediate bottom 2 weak concepts via dedicated focus blocks`, isBoss: false },
        { dayNumber: 5, text: `Protect 7h+ sleep nightly to maximize memory consolidation`, isBoss: false },
        { dayNumber: 7, text: `BOSS TRIAL: Beat Week-2 score on cumulative checkpoint`, isBoss: true },
      ],
    },
    {
      weekNumber: 4,
      phaseName: "WEEK 4: CONSOLIDATION & FINAL MASTERY",
      goal: `Lock readiness and execute ${goal}`,
      description: "High-yield final review, recovery protection, and zero-drift execution.",
      targetFocusMinutes: weeklyFocusTarget,
      targetWorkouts: 2,
      tasks: [
        { dayNumber: 1, text: `Final gap sweep across weak topics with concise flashcards/notes`, isBoss: false },
        { dayNumber: 4, text: `Lock evening wind-down and sleep floor ahead of final push`, isBoss: false },
        { dayNumber: 7, text: `FINAL BOSS: Complete final milestone benchmark for ${goal}`, isBoss: true },
      ],
    },
  ];
}

export async function generateGoalRoadmapBlueprint(params: {
  goalText: string;
  goalDomain: GoalDomain;
  dailyCapacityMinutes: number;
  equipmentProfile?: string;
  primaryDistractor?: string;
  pushups?: number;
}): Promise<{ weeks: RoadmapBlueprintWeek[]; provider: string }> {
  const fallback = buildDeterministicRoadmapWeeks(params);

  const systemPrompt =
    "You are an elite performance strategist inside Ascension Protocol. Output ONLY valid JSON matching: { \"weeks\": [ { \"weekNumber\": 1..4, \"phaseName\": string, \"goal\": string, \"description\": string, \"targetFocusMinutes\": number, \"targetWorkouts\": number, \"tasks\": [ { \"dayNumber\": 1..7, \"text\": string, \"isBoss\": boolean } ] } ] }. STYLE RULE: Headings/titles can use cool technical/System RPG terms, but all descriptions and task content MUST use simple, plain, direct human language (e.g. say 'drink water' not 'infuse your matrix with water'; say 'write 2 pages of code' not 'synthesize neural logic'). Make every task concrete, measurable, specific to the user's actual goal, equipment, and distractor.";
  const userPrompt = JSON.stringify({
    goal: cleanGoalLabel(params.goalText),
    domain: params.goalDomain,
    dailyCapacityMinutes: params.dailyCapacityMinutes,
    equipmentProfile: params.equipmentProfile || "bodyweight",
    primaryDistractor: params.primaryDistractor || "Social media / procrastination",
    pushupsBaseline: params.pushups ?? 15,
    instruction: "Return 4 progressive weekly phases with 4-5 actionable tasks per week (last task each week isBoss=true).",
  });

  const aiRes = await callMultiAiJson<{ weeks?: any[] }>(systemPrompt, userPrompt, "plan");
  if (aiRes?.data?.weeks && Array.isArray(aiRes.data.weeks) && aiRes.data.weeks.length === 4) {
    try {
      const normalized: RoadmapBlueprintWeek[] = aiRes.data.weeks.map((w, idx) => {
        const fb = fallback[idx];
        const rawTasks = Array.isArray(w.tasks) ? w.tasks : [];
        const tasks = rawTasks.slice(0, 6).map((t: any, tIdx: number) => ({
          dayNumber: Math.max(1, Math.min(7, Number(t?.dayNumber) || Math.min(7, tIdx * 2 + 1))),
          text: String(t?.text || fb.tasks[tIdx]?.text || fb.goal).slice(0, 180),
          isBoss: Boolean(t?.isBoss ?? tIdx === rawTasks.length - 1),
        }));
        return {
          weekNumber: idx + 1,
          phaseName: String(w.phaseName || fb.phaseName).slice(0, 80),
          goal: String(w.goal || fb.goal).slice(0, 160),
          description: String(w.description || fb.description).slice(0, 260),
          targetFocusMinutes: Math.max(60, Math.min(1200, Number(w.targetFocusMinutes) || fb.targetFocusMinutes)),
          targetWorkouts: Math.max(1, Math.min(7, Number(w.targetWorkouts) || fb.targetWorkouts)),
          tasks: tasks.length >= 2 ? tasks : fb.tasks,
        };
      });
      return { weeks: normalized, provider: aiRes.provider };
    } catch {
      return { weeks: fallback, provider: "deterministic" };
    }
  }

  return { weeks: fallback, provider: "deterministic" };
}

export function computeRadarBottleneck(
  user: Pick<User, "strength" | "agility" | "stamina" | "vitality" | "intelligence" | "willpower" | "charisma" | "lastSleepHours" | "goalDomain" | "hunterClass">,
  focusMinutes7d = 0,
  workoutsCount7d = 0
): RadarBottleneck {
  const sleepNum = user.lastSleepHours ? parseFloat(String(user.lastSleepHours)) : null;
  if (sleepNum !== null && sleepNum > 0 && sleepNum < 6.2) {
    return {
      stat: "Vitality",
      value: user.vitality ?? 10,
      reason: `Sleep dropped to ${sleepNum.toFixed(1)}h — cognitive retention and muscle recovery are degraded.`,
      actionTitle: "Run 15m Recovery Reset & Early Wind-Down",
      actionType: "recovery",
      targetMinutes: 15,
      recommendedGuideCategory: "wellness",
    };
  }

  const statEntries = [
    { key: "Strength", val: user.strength ?? 10, domain: "fitness" },
    { key: "Agility", val: user.agility ?? 10, domain: "fitness" },
    { key: "Stamina", val: user.stamina ?? 10, domain: "fitness" },
    { key: "Vitality", val: user.vitality ?? 10, domain: "wellness" },
    { key: "Intelligence", val: user.intelligence ?? 10, domain: "productivity" },
    { key: "Willpower", val: user.willpower ?? 10, domain: "discipline" },
    { key: "Charisma", val: user.charisma ?? 10, domain: "social" },
  ];

  const lowest = [...statEntries].sort((a, b) => a.val - b.val)[0];

  if (lowest.key === "Intelligence" || (focusMinutes7d < 90 && (user.goalDomain === "career_code" || user.goalDomain === "study_exam"))) {
    return {
      stat: "Intelligence",
      value: user.intelligence ?? 10,
      reason: `Only ${focusMinutes7d}m deep focus logged in 7 days. Output stalls without uninterrupted blocks.`,
      actionTitle: "Launch 25m Distraction-Free Focus Block",
      actionType: "focus",
      targetMinutes: 25,
      recommendedGuideCategory: "productivity",
    };
  }

  if (lowest.key === "Strength" || lowest.key === "Stamina" || lowest.key === "Agility" || workoutsCount7d === 0) {
    return {
      stat: lowest.key,
      value: lowest.val,
      reason: `${lowest.key} trails your radar (${workoutsCount7d} workouts in 7 days). Physical drive fuels discipline.`,
      actionTitle: "Log 1 Guided Progressive Training Session",
      actionType: "workout",
      recommendedGuideCategory: "fitness",
    };
  }

  if (lowest.key === "Charisma") {
    return {
      stat: "Charisma",
      value: lowest.val,
      reason: "Social & accountability communication lags behind solo grind.",
      actionTitle: "Reach Out / Ship Public Proof or Join 1v1 Covenant",
      actionType: "outreach",
      recommendedGuideCategory: "discipline",
    };
  }

  return {
    stat: lowest.key,
    value: lowest.val,
    reason: `${lowest.key} is currently your narrowest bottleneck holding back total execution velocity.`,
    actionTitle: "Start 25m Deliberate Execution Block",
    actionType: "focus",
    targetMinutes: 25,
    recommendedGuideCategory: "productivity",
  };
}

/**
 * Generates high-leverage, capacity-aware daily quests directly connected to
 * the user's real goal, active Roadmap week tasks, sleep/bio-fatigue, and bottleneck stat.
 */
export function generateCoachDailyQuests(params: {
  user: User;
  activeWeek?: RoadmapWeek | null;
  incompleteTasks?: RoadmapTask[];
  fatigueScore?: number;
  sleepHours?: number | null;
  focusMinutes7d?: number;
  workoutsCount7d?: number;
}): InsertQuest[] {
  const { user, activeWeek, incompleteTasks = [], fatigueScore = 0, sleepHours = null } = params;
  const domain = (user.goalDomain as GoalDomain) || inferGoalDomain(user.currentGoal, user.hunterClass);
  const goalLabel = cleanGoalLabel(user.currentGoal);
  const baseCap = Math.max(25, Math.min(180, user.dailyCapacityMinutes || 60));
  const needsDeload = (sleepHours !== null && sleepHours > 0 && sleepHours < 6.0) || fatigueScore >= 75;
  const scaledFocusMins = needsDeload ? Math.max(20, Math.round(baseCap * 0.65)) : Math.min(90, Math.max(25, Math.round(baseCap * 0.6)));

  const dueAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
  const quests: InsertQuest[] = [];

  // 1. Primary Roadmap / Goal Needle-Mover (linked directly to roadmapTaskId if available)
  const nextTask = incompleteTasks[0] || null;
  const isFitnessTask = domain === "fitness" && (!nextTask || !/focus|debrief|sleep/i.test(nextTask.text));
  quests.push({
    userId: user.id,
    title: nextTask ? `Roadmap Anchor: ${nextTask.text.slice(0, 64)}` : `${goalLabel.slice(0, 36)}: Core Sprint`,
    description: nextTask
      ? `${activeWeek?.phaseName || "Active Week"} • Complete this step to advance your roadmap toward "${goalLabel}".${user.lastIfThenPlan ? ` Rule: ${user.lastIfThenPlan}` : ""}`
      : `Execute ${scaledFocusMins}m of dedicated work moving "${goalLabel}" forward today.`,
    type: "daily",
    difficulty: needsDeload ? "easy" : "hard",
    category: domain === "fitness" ? "fitness" : "productivity",
    rewardXP: needsDeload ? 30 : 45,
    rewardCoins: needsDeload ? 12 : 20,
    rewardStats: domain === "fitness" ? { strength: 2, stamina: 2 } : { intelligence: 3, willpower: 2 },
    roadmapTaskId: nextTask?.id || null,
    executionMode: isFitnessTask ? "workout_verified" : "focus_verified",
    targetMinutes: isFitnessTask ? null : scaledFocusMins,
    sourceType: nextTask ? "roadmap" : "goal",
    dueAt,
  });

  // 2. Domain-Calibrated Verified Action Quest (Training or Deep Focus Block)
  const hunterClass = user.hunterClass || "assassin";
  const equipment = user.equipmentProfile || "bodyweight";
  const wantWorkoutSecond = domain === "fitness" || hunterClass === "tank" || hunterClass === "assassin" || hunterClass === "ranger";

  if (wantWorkoutSecond && !isFitnessTask) {
    const workoutDesc = needsDeload
      ? "Sleep/fatigue warning active: log a 20m mobility or -15% deload workout in Workout Logger to recover stronger."
      : equipment === "gym"
        ? "Log 1 progressive gym session chasing your Auto-Overload weight/rep targets in Workout Logger."
        : equipment === "dumbbells"
          ? "Log 1 dumbbell session beating at least 1 exercise set vs last workout."
          : `Log 1 ${hunterClass} calisthenics session pushing reps with clean form in Workout Logger.`;

    quests.push({
      userId: user.id,
      title: needsDeload ? "Smart Deload Training Session" : "Progressive Overload Workout",
      description: workoutDesc,
      type: "daily",
      difficulty: needsDeload ? "easy" : "normal",
      category: "fitness",
      rewardXP: 35,
      rewardCoins: 15,
      rewardStats: { strength: 2, agility: 1, stamina: 2 },
      executionMode: "workout_verified",
      targetMinutes: null,
      sourceType: needsDeload ? "recovery" : "goal",
      dueAt,
    });
  } else {
    const focusMins = needsDeload ? 25 : Math.min(60, Math.max(25, Math.round(baseCap * 0.5)));
    quests.push({
      userId: user.id,
      title: `Verified ${focusMins}m Deep Focus Block`,
      description: `Lock your Air-Gap timer for ${focusMins}m on "${goalLabel}" and record 1 concrete thing shipped when done.`,
      type: "daily",
      difficulty: needsDeload ? "easy" : "normal",
      category: "productivity",
      rewardXP: 35,
      rewardCoins: 15,
      rewardStats: { intelligence: 3, willpower: 1 },
      executionMode: "focus_verified",
      targetMinutes: focusMins,
      sourceType: "goal",
      dueAt,
    });
  }

  // 3. Bottleneck / Recovery Micro-Habit targeting lowest Radar stat
  const bottleneck = computeRadarBottleneck(user, params.focusMinutes7d ?? 0, params.workoutsCount7d ?? 0);
  quests.push({
    userId: user.id,
    title: `Bottleneck Fix (${bottleneck.stat}): ${bottleneck.actionTitle.slice(0, 42)}`,
    description: bottleneck.reason,
    type: "daily",
    difficulty: "easy",
    category: bottleneck.recommendedGuideCategory,
    rewardXP: 20,
    rewardCoins: 10,
    rewardStats:
      bottleneck.stat === "Vitality"
        ? { vitality: 3 }
        : bottleneck.stat === "Charisma"
          ? { charisma: 3 }
          : bottleneck.stat === "Intelligence"
            ? { intelligence: 2, willpower: 1 }
            : { willpower: 2, stamina: 1 },
    executionMode: bottleneck.actionType === "focus" ? "focus_verified" : "checkbox",
    targetMinutes: bottleneck.targetMinutes || null,
    sourceType: needsDeload ? "recovery" : "bottleneck",
    dueAt,
  });

  return quests;
}

export async function analyzeEveningDebrief(params: {
  user: User;
  reflectionText: string;
  sleepHours: number;
  energyRating: number;
  blockerTag: string;
  selfHonestyRating: number;
  todayFocusMinutes: number;
  todayCompletedQuests: number;
}): Promise<DebriefAnalysisResult> {
  const goal = cleanGoalLabel(params.user.currentGoal);
  const distractor = params.user.primaryDistractor || "phone scrolling";
  const sleepLow = params.sleepHours > 0 && params.sleepHours < 6.2;

  let deterministicAction: DebriefAnalysisResult["coachActionType"] = "standard";
  let deterministicIfThen = `If it is 09:00 tomorrow, then I put ${distractor} in another room and start a 25m block on "${goal}".`;
  let deterministicFeedback = `Logged ${params.todayFocusMinutes}m focus & ${params.todayCompletedQuests} completed steps toward "${goal}". Protect peak execution first tomorrow.`;
  let prescribedCategory = "productivity";

  if (sleepLow || params.blockerTag === "fatigue") {
    deterministicAction = "scale_down_25";
    deterministicIfThen = `If I finish dinner tonight, then devices charge outside bedroom at 22:30 so tomorrow unlocks full recovery (${params.sleepHours.toFixed(1)}h -> 7.5h).`;
    deterministicFeedback = `Fatigue / ${params.sleepHours.toFixed(1)}h sleep detected. Tomorrow's quests are scaled down 25% into recovery-safe wins so your streak survives without burnout.`;
    prescribedCategory = "wellness";
  } else if (params.blockerTag === "distraction") {
    deterministicAction = "bottleneck_fix";
    deterministicIfThen = `If I feel the urge to check ${distractor}, then I immediately start a 10m Air-Gap starter sprint before touching feeds.`;
    deterministicFeedback = `Attention drift flagged (${distractor}). Tomorrow opens with a 25m friction-free Morning Anchor so you build momentum before distractions hit.`;
    prescribedCategory = "productivity";
  } else if (params.blockerTag === "overscoped" || params.blockerTag === "unclear") {
    deterministicAction = "bottleneck_fix";
    deterministicIfThen = `If a task feels too big tomorrow, then I outline just the first 15m deliverable and start Air-Gap Focus right away.`;
    deterministicFeedback = `Scope friction spotted. Tomorrow's anchor is shrunk to a clear, single deliverable you can ship in one session.`;
    prescribedCategory = "productivity";
  }

  const systemPrompt =
    "You are a concise, practical execution coach. Use simple, direct, everyday words in all advice and instructions (no convoluted sci-fi jargon). Given today's metrics and reflection, output ONLY valid JSON: { \"diagnosticFeedback\": string (max 220 chars, simple plain English, specific to their goal & reflection), \"tomorrowIfThenCue\": string (strict \"If [trigger], then [first concrete 5-15m step]\" max 160 chars in plain language), \"coachActionType\": \"standard\"|\"scale_down_25\"|\"recovery_focus\"|\"bottleneck_fix\", \"prescribedCategory\": \"fitness\"|\"productivity\"|\"wellness\"|\"discipline\" }.";

  const userPrompt = JSON.stringify({
    goal,
    reflection: params.reflectionText.slice(0, 500),
    sleepHours: params.sleepHours,
    energyRating: params.energyRating,
    blockerTag: params.blockerTag,
    focusMinutesToday: params.todayFocusMinutes,
    questsCompletedToday: params.todayCompletedQuests,
    distractor,
  });

  const aiRes = await callMultiAiJson<{
    diagnosticFeedback?: string;
    tomorrowIfThenCue?: string;
    coachActionType?: DebriefAnalysisResult["coachActionType"];
    prescribedCategory?: string;
  }>(systemPrompt, userPrompt, "coach");

  if (aiRes?.data?.diagnosticFeedback && aiRes?.data?.tomorrowIfThenCue) {
    const validActions = new Set(["standard", "scale_down_25", "recovery_focus", "bottleneck_fix"]);
    return {
      diagnosticFeedback: String(aiRes.data.diagnosticFeedback).slice(0, 320),
      tomorrowIfThenCue: String(aiRes.data.tomorrowIfThenCue).slice(0, 220),
      coachActionType: validActions.has(aiRes.data.coachActionType || "")
        ? (aiRes.data.coachActionType as DebriefAnalysisResult["coachActionType"])
        : deterministicAction,
      blockerTag: params.blockerTag || "none",
      prescribedCategory: String(aiRes.data.prescribedCategory || prescribedCategory),
      providerUsed: aiRes.provider,
    };
  }

  return {
    diagnosticFeedback: deterministicFeedback,
    tomorrowIfThenCue: deterministicIfThen,
    coachActionType: deterministicAction,
    blockerTag: params.blockerTag || "none",
    prescribedCategory,
    providerUsed: "deterministic",
  };
}

// ─── Feature #1: Focus Deliverable Review + Next Micro-Step ───────────────────

export interface DeliverableReviewResult {
  qualityScore: number;
  verdict: string;
  nextMicroStep: string;
  providerUsed: string;
}

export async function reviewFocusDeliverable(params: {
  goalText?: string | null;
  intentionTask?: string | null;
  deliverableText: string;
  durationMinutes?: number;
  breachCount?: number;
}): Promise<DeliverableReviewResult> {
  const goal = cleanGoalLabel(params.goalText);
  const task = (params.intentionTask || "Core objective").trim();
  const note = (params.deliverableText || "").trim();
  const breaches = params.breachCount ?? 0;

  const fallbackScore = note.length >= 120 ? 92 : note.length >= 40 ? 84 : 74;
  const adjustedFallbackScore = Math.max(55, fallbackScore - breaches * 5);
  const fallbackVerdict =
    breaches >= 3
      ? `Completed with ${breaches} focus interruptions — tighten phone isolation next round while advancing "${task.slice(0, 48)}".`
      : `Solid execution logged for "${task.slice(0, 48)}". Output moves "${goal.slice(0, 48)}" forward.`;
  const fallbackNext = `Continue "${task.slice(0, 50)}" from: ${note.slice(0, 55) || "next milestone deliverable"}`;

  if (note.length < 5) {
    return {
      qualityScore: adjustedFallbackScore,
      verdict: fallbackVerdict,
      nextMicroStep: fallbackNext,
      providerUsed: "deterministic",
    };
  }

  const systemPrompt =
    'You are an honest execution coach. Grade the user\'s session deliverable and suggest the exact next 5-25 minute step. Return ONLY valid JSON: { "qualityScore": number (60..100), "verdict": string (max 180 chars), "nextMicroStep": string (max 120 chars, concrete next physical action) }.';
  const userPrompt = JSON.stringify({
    goal,
    intendedTask: task,
    whatUserFinished: note.slice(0, 450),
    durationMinutes: params.durationMinutes ?? 25,
    appInterruptions: breaches,
  });

  const aiRes = await callMultiAiJson<{
    qualityScore?: number;
    verdict?: string;
    nextMicroStep?: string;
  }>(systemPrompt, userPrompt, "coach");

  if (aiRes?.data?.verdict && aiRes?.data?.nextMicroStep) {
    const score = Math.max(55, Math.min(100, Math.round(Number(aiRes.data.qualityScore) || adjustedFallbackScore)));
    return {
      qualityScore: score,
      verdict: String(aiRes.data.verdict).slice(0, 240),
      nextMicroStep: String(aiRes.data.nextMicroStep).slice(0, 140),
      providerUsed: aiRes.provider,
    };
  }

  return {
    qualityScore: adjustedFallbackScore,
    verdict: fallbackVerdict,
    nextMicroStep: fallbackNext,
    providerUsed: "deterministic",
  };
}

// ─── Feature #2: AI Continuity Daily Quests (1x/day Cached) ───────────────────

export async function generateAiDailyQuests(params: {
  user: User;
  activeWeek?: RoadmapWeek | null;
  incompleteTasks?: RoadmapTask[];
  recentFocusNotes?: string[];
  latestDebriefText?: string | null;
  fatigueScore?: number;
  sleepHours?: number | null;
  focusMinutes7d?: number;
  workoutsCount7d?: number;
}): Promise<{ quests: InsertQuest[]; providerUsed: string }> {
  const deterministic = generateCoachDailyQuests(params);
  const { user, activeWeek, incompleteTasks = [], recentFocusNotes = [], latestDebriefText, fatigueScore = 0, sleepHours = null } = params;
  const dueAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
  const domain = (user.goalDomain as GoalDomain) || inferGoalDomain(user.currentGoal, user.hunterClass);

  const systemPrompt =
    'You are the daily planner for Ascension Protocol. Given the user\'s goal, active roadmap task, yesterday\'s focus outputs, and fatigue/sleep, create 3 concrete today quests. Return ONLY valid JSON: { "quests": [ { "title": string, "description": string, "executionMode": "focus_verified"|"workout_verified"|"checkbox", "targetMinutes": number|null, "difficulty": "easy"|"normal"|"hard", "category": "fitness"|"productivity"|"wellness"|"discipline", "linkPrimaryRoadmapTask": boolean } ] }. STYLE RULE: Titles can use immersive Hunter/System terms, but all quest descriptions MUST use simple, plain, everyday words (e.g., "drink 3L water" instead of "infuse your matrix with water"; "walk 20 mins" instead of "engage biomechanical traversal"). Make quest 1 build directly on recent outputs/next step.';

  const userPrompt = JSON.stringify({
    goal: cleanGoalLabel(user.currentGoal),
    domain,
    hunterClass: user.hunterClass,
    equipment: user.equipmentProfile,
    dailyCapacityMinutes: user.dailyCapacityMinutes || 90,
    activeWeekPhase: activeWeek?.phaseName || null,
    nextRoadmapTasks: incompleteTasks.slice(0, 2).map((t) => t.text),
    recentFocusDeliverables: recentFocusNotes.slice(0, 2),
    queuedNextStep: (user as any).nextFocusStep || null,
    lastIfThenPlan: user.lastIfThenPlan || null,
    latestDebriefReflection: latestDebriefText ? latestDebriefText.slice(0, 220) : null,
    sleepHours,
    fatigueScore,
  });

  const aiRes = await callMultiAiJson<{ quests?: any[] }>(systemPrompt, userPrompt, "coach");
  if (aiRes?.data?.quests && Array.isArray(aiRes.data.quests) && aiRes.data.quests.length >= 2) {
    try {
      const validModes = new Set(["focus_verified", "workout_verified", "checkbox"]);
      const validDiff = new Set(["easy", "normal", "hard"]);
      const parsed: InsertQuest[] = aiRes.data.quests.slice(0, 4).map((q: any, idx: number) => {
        const fb = deterministic[idx] || deterministic[0];
        const mode = validModes.has(q?.executionMode) ? String(q.executionMode) : fb.executionMode || "checkbox";
        const diff = validDiff.has(q?.difficulty) ? String(q.difficulty) : fb.difficulty || "normal";
        const mins =
          mode === "focus_verified"
            ? Math.max(15, Math.min(120, Number(q?.targetMinutes) || fb.targetMinutes || 30))
            : null;
        const linkTask = Boolean(q?.linkPrimaryRoadmapTask ?? idx === 0) && incompleteTasks[0]?.id;

        return {
          userId: user.id,
          title: String(q?.title || fb.title).slice(0, 90),
          description: String(q?.description || fb.description).slice(0, 220),
          type: "daily",
          difficulty: diff,
          category: String(q?.category || fb.category || "productivity").slice(0, 32),
          rewardXP: diff === "hard" ? 45 : diff === "normal" ? 35 : 20,
          rewardCoins: diff === "hard" ? 20 : diff === "normal" ? 15 : 10,
          rewardStats: fb.rewardStats || { intelligence: 2, willpower: 1 },
          roadmapTaskId: linkTask ? incompleteTasks[0].id : null,
          executionMode: mode,
          targetMinutes: mins,
          sourceType: linkTask ? "roadmap" : idx === 2 ? "bottleneck" : "goal",
          dueAt,
        };
      });
      return { quests: parsed, providerUsed: aiRes.provider };
    } catch {
      return { quests: deterministic, providerUsed: "deterministic" };
    }
  }

  return { quests: deterministic, providerUsed: "deterministic" };
}

// ─── Feature #3: Custom AI Workout Split Builder (Uses Real DB Exercises) ─────

export interface GeneratedWorkoutSplit {
  name: string;
  description: string;
  exerciseIds: string[];
}

export async function generateAiWorkoutSplit(params: {
  goalFocus: string;
  equipment: string;
  durationMinutes: number;
  daysPerWeek: number;
  constraintNote?: string;
  availableExercises: Array<{ id: string; name: string; muscleGroup: string; equipment: string }>;
}): Promise<{ templates: GeneratedWorkoutSplit[]; providerUsed: string }> {
  const { availableExercises, equipment, daysPerWeek, durationMinutes, goalFocus, constraintNote } = params;
  const exLimit = Math.max(3, Math.min(7, Math.round((durationMinutes || 45) / 8)));
  const count = Math.max(2, Math.min(4, daysPerWeek || 3));

  const eqLower = (equipment || "gym").toLowerCase();
  const matchingPool = availableExercises.filter((e) => {
    if (eqLower === "bodyweight") return e.equipment === "bodyweight";
    if (eqLower === "dumbbells") return e.equipment === "dumbbell" || e.equipment === "bodyweight";
    return true;
  });
  const safePool = matchingPool.length >= 6 ? matchingPool : availableExercises;
  const validIdSet = new Set(availableExercises.map((e) => e.id));

  const buildFallbackSplits = (): GeneratedWorkoutSplit[] => {
    const chest = safePool.filter((e) => e.muscleGroup === "chest" || e.muscleGroup === "shoulders").slice(0, 3);
    const back = safePool.filter((e) => e.muscleGroup === "back" || e.muscleGroup === "arms").slice(0, 3);
    const legs = safePool.filter((e) => e.muscleGroup === "legs" || e.muscleGroup === "core").slice(0, 3);
    const allTop = safePool.slice(0, exLimit).map((e) => e.id);
    const templates: GeneratedWorkoutSplit[] = [
      {
        name: `AI Push & Conditioning (${durationMinutes}m)`,
        description: `Tailored for ${goalFocus} using ${equipment}. Focus on progressive compound control.`,
        exerciseIds: [...chest, ...legs.slice(0, 1)].slice(0, exLimit).map((e) => e.id),
      },
      {
        name: `AI Pull & Posterior Strength (${durationMinutes}m)`,
        description: `Upper pull & core durability built around your constraints.`,
        exerciseIds: [...back, ...legs.slice(1, 2)].slice(0, exLimit).map((e) => e.id),
      },
      {
        name: `AI Lower Power & Core (${durationMinutes}m)`,
        description: `Leg drive & metabolic capacity session.`,
        exerciseIds: legs.length >= 2 ? legs.map((e) => e.id) : allTop,
      },
    ];
    return templates.slice(0, count).map((t) => ({
      ...t,
      exerciseIds: t.exerciseIds.length > 0 ? t.exerciseIds : allTop,
    }));
  };

  const compactCatalog = safePool.slice(0, 55).map((e) => ({
    id: e.id,
    name: e.name,
    muscle: e.muscleGroup,
    eq: e.equipment,
  }));

  const systemPrompt =
    'You are an expert strength coach. Build custom workout day templates using ONLY exact "id" values from availableExercises. Return ONLY valid JSON: { "templates": [ { "name": string, "description": string, "exerciseIds": string[] } ] }. Respect equipment, durationMinutes, and injury/constraintNote strictly.';
  const userPrompt = JSON.stringify({
    goalFocus,
    equipment,
    durationMinutes,
    daysPerWeek: count,
    exercisesPerDay: exLimit,
    constraintNote: constraintNote || "None",
    availableExercises: compactCatalog,
  });

  const aiRes = await callMultiAiJson<{ templates?: any[] }>(systemPrompt, userPrompt, "plan");
  if (aiRes?.data?.templates && Array.isArray(aiRes.data.templates) && aiRes.data.templates.length > 0) {
    const validated: GeneratedWorkoutSplit[] = [];
    for (const raw of aiRes.data.templates.slice(0, count)) {
      const ids = Array.isArray(raw?.exerciseIds)
        ? raw.exerciseIds.map((x: any) => String(x)).filter((id: string) => validIdSet.has(id))
        : [];
      if (ids.length >= 2) {
        validated.push({
          name: String(raw.name || "Custom AI Split").slice(0, 72),
          description: String(raw.description || `Calibrated for ${goalFocus}`).slice(0, 200),
          exerciseIds: ids.slice(0, exLimit),
        });
      }
    }
    if (validated.length > 0) {
      return { templates: validated, providerUsed: aiRes.provider };
    }
  }

  return { templates: buildFallbackSplits(), providerUsed: "deterministic" };
}

// ─── Feature #5: "I Feel Stuck" 5-Minute Micro-Breakdown ──────────────────────

export async function generateMicroStarterStep(params: {
  questTitle: string;
  questDescription: string;
  goalText?: string | null;
  obstacleNote?: string;
}): Promise<{ starterAction: string; encouragement: string; timerMinutes: number; providerUsed: string }> {
  const fallbackAction = `Open only what's needed for "${params.questTitle.slice(0, 45)}" and complete just the first tiny 5-minute setup step — zero pressure to finish everything now.`;
  const fallbackEncouragement = "Momentum beats perfection. 5 honest minutes breaks procrastination.";

  const systemPrompt =
    'A user feels stuck or overwhelmed by a task. Shrink it into one tiny, concrete, physical 5-minute starter action anyone can begin in 10 seconds. Output ONLY valid JSON: { "starterAction": string (max 150 chars), "encouragement": string (max 110 chars) }.';
  const userPrompt = JSON.stringify({
    goal: cleanGoalLabel(params.goalText),
    taskTitle: params.questTitle,
    taskDescription: params.questDescription,
    whyStuck: params.obstacleNote || "Feels too big to start",
  });

  const aiRes = await callMultiAiJson<{ starterAction?: string; encouragement?: string }>(
    systemPrompt,
    userPrompt,
    "coach"
  );

  if (aiRes?.data?.starterAction) {
    return {
      starterAction: String(aiRes.data.starterAction).slice(0, 180),
      encouragement: String(aiRes.data.encouragement || fallbackEncouragement).slice(0, 140),
      timerMinutes: 5,
      providerUsed: aiRes.provider,
    };
  }

  return {
    starterAction: fallbackAction,
    encouragement: fallbackEncouragement,
    timerMinutes: 5,
    providerUsed: "deterministic",
  };
}

// ─── Feature #6: Sunday AI Weekly Strategy Audit & Monday Rebalance ───────────

export interface WeeklyAuditResult {
  weekKey: string;
  coachSummary: string;
  mondayAdjustment: string;
  dayPatternInsight: string;
  suggestedDailyMinutes: number;
  providerUsed: string;
  generatedAt: string;
}

export async function generateWeeklyStrategyAudit(params: {
  weekKey: string;
  user: User;
  focusSessions7d: Array<{ duration: number; completedAt: Date | string }>;
  workouts7d: Array<{ startedAt: Date | string; totalVolume?: number | null }>;
  completedQuestsCount: number;
  roadmapProgressPercent: number;
}): Promise<WeeklyAuditResult> {
  const { weekKey, user, focusSessions7d, workouts7d, completedQuestsCount, roadmapProgressPercent } = params;
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const dayFocus = new Map<string, number>();
  for (const d of dayNames) dayFocus.set(d, 0);
  for (const s of focusSessions7d) {
    const label = dayNames[new Date(s.completedAt).getDay()];
    dayFocus.set(label, (dayFocus.get(label) || 0) + (s.duration || 0));
  }
  for (const w of workouts7d) {
    const label = dayNames[new Date(w.startedAt).getDay()];
    dayFocus.set(label, (dayFocus.get(label) || 0) + 30);
  }

  const rankedDays = Array.from(dayFocus.entries()).sort((a, b) => b[1] - a[1]);
  const bestDay = rankedDays[0]?.[0] || "Mon";
  const weakestDay = rankedDays[rankedDays.length - 1]?.[0] || "Fri";
  const totalFocusMins = focusSessions7d.reduce((acc, s) => acc + (s.duration || 0), 0);
  const currentCap = user.dailyCapacityMinutes || 90;
  const suggestedMins =
    totalFocusMins >= currentCap * 4
      ? Math.min(180, currentCap + 15)
      : totalFocusMins < currentCap * 1.5
        ? Math.max(30, Math.round(currentCap * 0.75))
        : currentCap;

  const fallbackInsight = `Peak momentum hit on ${bestDay}; output dipped on ${weakestDay}.`;
  const fallbackSummary = `Delivered ${totalFocusMins}m deep work, ${workouts7d.length} workouts, and ${completedQuestsCount} completed quests (${roadmapProgressPercent}% Roadmap done).`;
  const fallbackMonday =
    suggestedMins < currentCap
      ? `Scale daily cap to ${suggestedMins}m starting Monday so ${weakestDay} doesn't break your streak.`
      : `Lock your Morning Anchor on ${weakestDay} early and keep ${suggestedMins}m daily pace.`;

  const systemPrompt =
    'You are a weekly performance strategist. Analyze 7-day focus/workout pattern and give a crisp Monday action plan. Return ONLY valid JSON: { "coachSummary": string (max 200 chars), "dayPatternInsight": string (max 140 chars), "mondayAdjustment": string (max 160 chars), "suggestedDailyMinutes": number (25..240) }.';
  const userPrompt = JSON.stringify({
    goal: cleanGoalLabel(user.currentGoal),
    totalFocusMinutes7d: totalFocusMins,
    workoutsCount7d: workouts7d.length,
    completedQuestsCount,
    roadmapProgressPercent,
    activityByDay: Object.fromEntries(dayFocus.entries()),
    lastBlockerTag: user.lastBlockerTag || "none",
    preferredPeakHour: user.preferredPeakHour ?? null,
    currentDailyCapacityMinutes: currentCap,
  });

  const aiRes = await callMultiAiJson<{
    coachSummary?: string;
    dayPatternInsight?: string;
    mondayAdjustment?: string;
    suggestedDailyMinutes?: number;
  }>(systemPrompt, userPrompt, "coach");

  const nowIso = new Date().toISOString();
  if (aiRes?.data?.coachSummary && aiRes?.data?.mondayAdjustment) {
    return {
      weekKey,
      coachSummary: String(aiRes.data.coachSummary).slice(0, 240),
      dayPatternInsight: String(aiRes.data.dayPatternInsight || fallbackInsight).slice(0, 160),
      mondayAdjustment: String(aiRes.data.mondayAdjustment).slice(0, 200),
      suggestedDailyMinutes: Math.max(25, Math.min(240, Math.round(Number(aiRes.data.suggestedDailyMinutes) || suggestedMins))),
      providerUsed: aiRes.provider,
      generatedAt: nowIso,
    };
  }

  return {
    weekKey,
    coachSummary: fallbackSummary,
    dayPatternInsight: fallbackInsight,
    mondayAdjustment: fallbackMonday,
    suggestedDailyMinutes: suggestedMins,
    providerUsed: "deterministic",
    generatedAt: nowIso,
  };
}

// ─── Feature #1 & #10: Adaptive Ultimatum Warning + Comeback Red Gate Brief ───

export function buildUltimatumWarningLine(user: User): string {
  const step = ((user as any).nextFocusStep || "").trim();
  const distractor = (user.primaryDistractor || "distractions").trim();
  const goal = cleanGoalLabel(user.currentGoal);
  if (step.length > 0) {
    return `[WARNING] Drop ${distractor} now and clear "${step.slice(0, 52)}" before midnight.`;
  }
  return `[WARNING] Drop ${distractor} now — protect your streak on "${goal.slice(0, 48)}" before 23:59.`;
}

export async function generateComebackBrief(params: {
  user: User;
  inactiveDays: number;
  previousStreak: number;
}): Promise<string> {
  const { user, inactiveDays, previousStreak } = params;
  const resumeStep = ((user as any).nextFocusStep || cleanGoalLabel(user.currentGoal)).slice(0, 75);
  const fallback = `Hunter. You are still alive after ${inactiveDays} days off. Run one 10m Air-Gap sprint on "${resumeStep}" + 1 quick workout set to reclaim ${Math.max(1, Math.floor(previousStreak * 0.5))} days of your ${previousStreak}d streak.`;

  const systemPrompt =
    'You are the cold, electrifying System voice from Solo Leveling welcoming a Hunter back into a Red Gate after missing 3+ days. Zero guilt, surgical action. Return ONLY valid JSON: { "brief": string (max 190 chars, must mention their goal/step + 10m sprint + 1 workout set) }.';
  const userPrompt = JSON.stringify({
    inactiveDays,
    previousStreak,
    goal: cleanGoalLabel(user.currentGoal),
    lastQueuedStep: (user as any).nextFocusStep || null,
  });

  const aiRes = await callMultiAiJson<{ brief?: string }>(systemPrompt, userPrompt, "coach");
  if (aiRes?.data?.brief) {
    return String(aiRes.data.brief).slice(0, 220);
  }
  return fallback;
}

// ─── Feature #4 & #3: Boss Persona Metadata + ARISE Shadow Extraction Lore ───

export function deriveBossMetaForWeek(
  weekNumber: number,
  goalDomain: GoalDomain,
  phaseName: string
): { bossName: string; bossTitle: string; bossWeaknessRule: string } {
  const namesByWeek: Record<number, { name: string; title: string }> = {
    1: { name: "Blood-Red Sentinel", title: "Warden of Starting Friction" },
    2: { name: "Baruch of Mid-Week Drift", title: "Eater of Broken Focus" },
    3: { name: "Iron Golem of Resistance", title: "Gatekeeper of Intensity" },
    4: { name: "Monarch's Final Shadow", title: "Sovereign of Goal Completion" },
  };
  const chosen = namesByWeek[weekNumber] || namesByWeek[1];
  const weakness =
    goalDomain === "fitness"
      ? "2x Critical Strike on workouts & morning sets; heals +10% on inactive days (max 2x/wk)."
      : "2x Critical Strike before 10:00 AM Focus blocks; heals +10% on inactive days (max 2x/wk).";
  return {
    bossName: chosen.name,
    bossTitle: `${chosen.title} (${phaseName.slice(0, 36)})`,
    bossWeaknessRule: weakness,
  };
}

export async function generateExtractionLore(params: {
  user: User;
  bossName: string;
  sourceMilestone: string;
  baseShadowId: string;
}): Promise<{ title: string; loreOrigin: string; passiveType: string }> {
  const { user, bossName, sourceMilestone, baseShadowId } = params;
  const fallback = {
    title: `${baseShadowId.toUpperCase()} — SLAYER OF ${bossName.toUpperCase().slice(0, 24)}`,
    loreOrigin: `Extracted from conquering "${sourceMilestone.slice(0, 60)}" toward "${cleanGoalLabel(user.currentGoal)}".`,
    passiveType: baseShadowId,
  };

  const systemPrompt =
    'You are the Solo Leveling System minting a 1-of-1 Shadow Soldier extracted from a real-life achievement. Return ONLY valid JSON: { "title": string (max 56 chars), "loreOrigin": string (max 150 chars, ties Shadow origin directly to user real milestone) }.';
  const userPrompt = JSON.stringify({
    goal: cleanGoalLabel(user.currentGoal),
    bossSlain: bossName,
    milestone: sourceMilestone,
    shadowArchetype: baseShadowId,
  });

  const aiRes = await callMultiAiJson<{ title?: string; loreOrigin?: string }>(systemPrompt, userPrompt, "coach");
  if (aiRes?.data?.title && aiRes?.data?.loreOrigin) {
    return {
      title: String(aiRes.data.title).slice(0, 64),
      loreOrigin: String(aiRes.data.loreOrigin).slice(0, 180),
      passiveType: baseShadowId,
    };
  }
  return fallback;
}

// ─── Feature #5 & #8: Job Change Trial + Weekly Guild Raid Dispatch ──────────

export async function generateJobChangeTrial(params: {
  user: User;
  focusMinutes14d: number;
  workouts14d: number;
  baseEvolutionTitle: string;
}): Promise<{
  awakenedTitle: string;
  steps: Array<{ id: string; label: string; target: number; current: number }>;
}> {
  const { user, focusMinutes14d, workouts14d, baseEvolutionTitle } = params;
  const fallbackSteps = [
    { id: "focus_blocks", label: "Complete 3 verified 45m+ Focus sprints", target: 3, current: 0 },
    { id: "zero_breach", label: "Finish 2 zero-breach Deep Work sprints", target: 2, current: 0 },
    { id: "workouts", label: "Log 2 progressive workouts", target: 2, current: 0 },
  ];

  const systemPrompt =
    'You are the Solo Leveling System designing a 7-day Lv.15+ Class Awakening Trial tailored to this user. Output ONLY valid JSON: { "awakenedTitle": string (max 42 chars), "stepLabels": [string, string, string] (3 short trial steps matching 3x45m sprints, zero-breach focus, and workouts) }.';
  const userPrompt = JSON.stringify({
    hunterClass: user.hunterClass,
    baseEvolutionTitle,
    goal: cleanGoalLabel(user.currentGoal),
    lastBlockerTag: user.lastBlockerTag || "none",
    focusMinutes14d,
    workouts14d,
  });

  const aiRes = await callMultiAiJson<{ awakenedTitle?: string; stepLabels?: string[] }>(
    systemPrompt,
    userPrompt,
    "coach"
  );
  if (aiRes?.data?.awakenedTitle) {
    const labels = Array.isArray(aiRes.data.stepLabels) ? aiRes.data.stepLabels : [];
    return {
      awakenedTitle: String(aiRes.data.awakenedTitle).slice(0, 48),
      steps: fallbackSteps.map((s, idx) => ({
        ...s,
        label: labels[idx] ? String(labels[idx]).slice(0, 90) : s.label,
      })),
    };
  }
  return { awakenedTitle: baseEvolutionTitle, steps: fallbackSteps };
}

export async function generateGuildWeeklyDispatch(params: {
  guildName: string;
  mvpName: string;
  totalHours: number;
  totalWorkouts: number;
  slackingCount: number;
  bossDefeated: boolean;
}): Promise<{ summary: string; callout: string }> {
  const fallbackSummary = params.bossDefeated
    ? `${params.guildName} shattered the Guild Boss with ${params.totalHours}h deep work and ${params.totalWorkouts} workouts. MVP: ${params.mvpName}.`
    : `${params.guildName} dealt ${params.totalHours}h deep work + ${params.totalWorkouts} workouts (${params.slackingCount} members under 60m floor). MVP: ${params.mvpName}.`;
  const fallbackCallout =
    params.slackingCount > 0
      ? `${params.slackingCount} member${params.slackingCount === 1 ? "" : "s"} fell below 60m floor — rally early Monday.`
      : "100% Guild participation bonus unlocked!";

  const systemPrompt =
    'Write a crisp 2-field Sunday Guild Raid war correspondent recap. Output ONLY valid JSON: { "summary": string (max 190 chars), "callout": string (max 110 chars) }.';
  const aiRes = await callMultiAiJson<{ summary?: string; callout?: string }>(
    systemPrompt,
    JSON.stringify(params),
    "coach"
  );
  if (aiRes?.data?.summary) {
    return {
      summary: String(aiRes.data.summary).slice(0, 220),
      callout: String(aiRes.data.callout || fallbackCallout).slice(0, 140),
    };
  }
  return { summary: fallbackSummary, callout: fallbackCallout };
}

// ─── Feature #6, #7, #9: Double Dungeon, Reawakening & Monarch's Domain ─────

export async function generateDoubleDungeonRules(params: {
  user: User;
  avgBreaches14d: number;
}): Promise<{
  rules: Array<{ key: string; title: string; tier: "Bronze" | "Silver" | "Gold"; multiplier: number; target: number }>;
}> {
  const { user, avgBreaches14d } = params;
  const fallback: Array<{ key: string; title: string; tier: "Bronze" | "Silver" | "Gold"; multiplier: number; target: number }> = [
    {
      key: "zero_breach_sprints",
      tier: "Bronze",
      multiplier: 1.4,
      target: 3,
      title: `Complete 3 Air-Gap Focus sprints with 0 breaches in 72h${avgBreaches14d > 1 ? " (cures app-switching)" : ""}`,
    },
    {
      key: "focus_minutes_72h",
      tier: "Silver",
      multiplier: 1.8,
      target: 120,
      title: "Log 120 verified Focus minutes within 72h on your active goal",
    },
    {
      key: "workouts_72h",
      tier: "Gold",
      multiplier: 2.2,
      target: 2,
      title: "Complete 2 verified Workouts within 72h without quitting early",
    },
  ];

  const systemPrompt =
    'You are the Cartenon Stone Tablet Architect. Write sharp 1-line 72h challenge titles tailored to this user for 3 keys: zero_breach_sprints (target 3), focus_minutes_72h (target 120), workouts_72h (target 2). Output ONLY valid JSON: { "titles": [string, string, string] }.';
  const aiRes = await callMultiAiJson<{ titles?: string[] }>(
    systemPrompt,
    JSON.stringify({
      goal: cleanGoalLabel(user.currentGoal),
      lastBlocker: user.lastBlockerTag || "none",
      avgBreaches14d,
    }),
    "coach"
  );
  if (aiRes?.data?.titles && Array.isArray(aiRes.data.titles) && aiRes.data.titles.length >= 3) {
    return {
      rules: fallback.map((r, i) => ({
        ...r,
        title: String(aiRes.data!.titles![i] || r.title).slice(0, 110),
      })),
    };
  }
  return { rules: fallback };
}

export async function generateReawakeningVerdict(params: {
  user: User;
  pushupsLogged: number;
  baselinePushups: number;
  deliverableText: string;
  awardedRank: string;
}): Promise<string> {
  const { user, pushupsLogged, baselinePushups, deliverableText, awardedRank } = params;
  const delta = pushupsLogged - baselinePushups;
  const fallback = `REAWAKENING CONFIRMED [${awardedRank}-RANK]: Pushups ${pushupsLogged} (${delta >= 0 ? `+${delta}` : delta} vs baseline), 25m zero-breach verified, deliverable accepted ("${deliverableText.slice(0, 50)}").`;

  const systemPrompt =
    'You are the Hunter Association Chief Examiner writing an official Reawakening Rank Certificate summary. Output ONLY valid JSON: { "verdict": string (max 190 chars) }.';
  const aiRes = await callMultiAiJson<{ verdict?: string }>(
    systemPrompt,
    JSON.stringify({
      name: user.name,
      awardedRank,
      pushupsLogged,
      baselinePushups,
      deliverable: deliverableText.slice(0, 140),
    }),
    "coach"
  );
  if (aiRes?.data?.verdict) {
    return String(aiRes.data.verdict).slice(0, 220);
  }
  return fallback;
}

export async function generateDomainBattlePlan(params: {
  user: User;
  incompleteTaskTitles: string[];
}): Promise<string[]> {
  const goal = cleanGoalLabel(params.user.currentGoal);
  const t0 = params.incompleteTaskTitles[0] || `Core milestone sprint for ${goal.slice(0, 32)}`;
  const t1 = params.incompleteTaskTitles[1] || `Secondary execution block on ${goal.slice(0, 32)}`;
  const t2 = params.incompleteTaskTitles[2] || `Final verification, cleanup & notes on ${goal.slice(0, 28)}`;
  const fallback = [
    `Block 1 (45m Sprint): ${t0}`,
    `Block 2 (45m Sprint): ${t1}`,
    `Block 3 (45m Sprint): ${t2}`,
    `Block 4 (Workout): Complete progressive strength or conditioning finisher`,
  ];

  const systemPrompt =
    'Split the user\'s locked 4-hour Monarch Domain block into 3 deep focus sprints + 1 workout step. Output ONLY valid JSON: { "planSteps": [string, string, string, string] (max 95 chars each) }.';
  const aiRes = await callMultiAiJson<{ planSteps?: string[] }>(
    systemPrompt,
    JSON.stringify({
      goal,
      equipment: params.user.equipmentProfile,
      tasks: params.incompleteTaskTitles.slice(0, 3),
    }),
    "coach"
  );
  if (aiRes?.data?.planSteps && Array.isArray(aiRes.data.planSteps) && aiRes.data.planSteps.length >= 4) {
    return aiRes.data.planSteps.slice(0, 4).map((s) => String(s).slice(0, 110));
  }
  return fallback;
}
