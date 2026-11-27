import type { User, WorkoutSession, FocusSession } from "@shared/schema";
import { randomUUID } from "crypto";

export interface ShadowDefinition {
  id: "igris" | "tank" | "iron" | "beru";
  name: string;
  epithet: string;
  rank: "Knight" | "General" | "Commander";
  perkTitle: string;
  perkDescription: string;
  unlockCondition: string;
}

export const SHADOW_CATALOG: ShadowDefinition[] = [
  {
    id: "igris",
    name: "Igris",
    epithet: "Blood-Red Knight of Deep Focus",
    rank: "Knight",
    perkTitle: "Deep Work Sentinel (+15% Focus XP)",
    perkDescription: "Auto-queues your Morning Anchor into Air-Gap Focus with Deliverable Guard and boosts INT/WIL XP +15% on 45m+ sprints.",
    unlockCondition: "Complete a 45m+ Air-Gap Focus session or reach a 5-day streak.",
  },
  {
    id: "tank",
    name: "Tank",
    epithet: "Alpha Iron Beast",
    rank: "Knight",
    perkTitle: "Overload Strategist (+15% Strength XP)",
    perkDescription: "Unlocks live Next-Set Progressive Overload weight/rep cues inside Active Workout and boosts Workout XP +15% on 12+ sets.",
    unlockCondition: "Finish 2 full Strength Workout sessions or reach a 14-day streak.",
  },
  {
    id: "iron",
    name: "Iron",
    epithet: "Aegis Vanguard",
    rank: "General",
    perkTitle: "Burnout Guardian (+Mana Shield Forge)",
    perkDescription: "Monitors sleep deficit & triggers automatic -15% deload recovery before burnout, plus forges +1 Mana Shield every 14 streak days.",
    unlockCondition: "Complete 10 cumulative Quests without abandoning protocol.",
  },
  {
    id: "beru",
    name: "Beru",
    epithet: "Marshal of Velocity",
    rank: "Commander",
    perkTitle: "Peak-Window Catalyst (+20% Morning Coins)",
    perkDescription: "Learns your highest-output productive hour from Focus history for precision nudges and grants +20% Coins before 10:00 AM.",
    unlockCondition: "Reach a 30-day streak or ascend to S-Rank Sovereign.",
  },
];

export const CLASS_EVOLUTIONS: Record<string, string> = {
  assassin: "Shadow Assassin",
  tank: "Iron Bastion",
  ranger: "Phantom Warden",
  mage: "Archmage",
  monarch: "Shadow Sovereign",
};

export function evaluateNewlyUnlockedShadows(
  user: User,
  metrics: { totalCompletedQuests?: number; totalWorkouts?: number; focusDuration?: number }
): string[] {
  const existing = new Set<string>(Array.isArray(user.unlockedShadows) ? user.unlockedShadows : []);
  const newlyUnlocked: string[] = [];

  const grant = (id: string) => {
    if (!existing.has(id)) {
      existing.add(id);
      newlyUnlocked.push(id);
    }
  };

  if ((metrics.focusDuration ?? 0) >= 45 || (user.streak ?? 0) >= 5) {
    grant("igris");
  }
  if ((metrics.totalWorkouts ?? 0) >= 2 || (user.streak ?? 0) >= 14) {
    grant("tank");
  }
  if ((metrics.totalCompletedQuests ?? 0) >= 10) {
    grant("iron");
  }
  if ((user.streak ?? 0) >= 30 || user.tier === "S") {
    grant("beru");
  }

  return newlyUnlocked;
}

export function advanceGateEvent(
  gate: User["activeGateEvent"] | null | undefined,
  eventType: "focus_minutes" | "workouts" | "quests",
  delta: number
): User["activeGateEvent"] | null {
  if (!gate || gate.claimed) return gate ?? null;
  if (new Date(gate.expiresAt).getTime() < Date.now()) return gate;
  if (gate.targetType !== eventType) return gate;

  return {
    ...gate,
    currentValue: Math.min(gate.targetValue, (gate.currentValue || 0) + delta),
  };
}

export function generateSurpriseGate(context?: {
  focusMinutes7d?: number;
  workouts7d?: number;
  goalDomain?: string | null;
  lowestStat?: string;
}): NonNullable<User["activeGateEvent"]> {
  const focusLag = (context?.focusMinutes7d ?? 0) < 90;
  const workoutLag = (context?.workouts7d ?? 0) < 2;
  let pickRed = context?.goalDomain === "fitness" ? workoutLag || !focusLag : workoutLag && !focusLag;
  if (!context) {
    pickRed = Math.random() > 0.6;
  }

  if (pickRed) {
    return {
      id: `gate_${randomUUID().slice(0, 8)}`,
      gateType: "red_gate",
      title: "RED GATE: BREAKTHROUGH TRAINING SPRINT",
      description: `Targeted Bottleneck (${context?.lowestStat || "Physical"}): Log 2 progressive workout sessions within 48 hours to shatter plateau velocity.`,
      targetType: "workouts",
      targetValue: 2,
      currentValue: 0,
      expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
      rewardCoins: 200,
      claimed: false,
    };
  }
  return {
    id: `gate_${randomUUID().slice(0, 8)}`,
    gateType: "blue_gate",
    title: "BLUE GATE: ZERO-DRIFT DEEP FOCUS",
    description: `Targeted Bottleneck (${context?.lowestStat || "Intelligence"}): Log 45 verified minutes of Air-Gap Deep Work within 24 hours on your main milestone.`,
    targetType: "focus_minutes",
    targetValue: 45,
    currentValue: 0,
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    rewardCoins: 125,
    claimed: false,
  };
}

export function computeBioFatigue(
  user: User,
  recentWorkouts: WorkoutSession[],
  recentFocus: FocusSession[]
) {
  const cutoff = Date.now() - 48 * 60 * 60 * 1000;
  const workouts48h = recentWorkouts.filter((w) => new Date(w.startedAt).getTime() >= cutoff);
  const focus48h = recentFocus.filter((f) => new Date(f.completedAt).getTime() >= cutoff);

  const workoutLoad = Math.min(55, workouts48h.reduce((acc, w) => acc + (w.totalSets || 5) * 2, 0));
  const focusLoad = Math.min(35, focus48h.reduce((acc, f) => acc + Math.round((f.duration || 0) / 10), 0));
  const sleepHours = user.lastSleepHours != null ? Number(user.lastSleepHours) : 7.5;
  const sleepOffset = sleepHours >= 8 ? -20 : sleepHours >= 7 ? -10 : (7 - sleepHours) * 12;

  const rawScore = Math.max(5, Math.min(100, Math.round(20 + workoutLoad + focusLoad + sleepOffset)));

  return {
    fatigueScore: rawScore,
    recoveryRecommended: rawScore >= 78 && !user.activeRecoveryDay,
    lastSleepHours: sleepHours,
    workoutsLast48h: workouts48h.length,
    focusMinutesLast48h: focus48h.reduce((acc, f) => acc + (f.duration || 0), 0),
    activeRecoveryDay: user.activeRecoveryDay,
  };
}

// ─── Feature #4 & #3: Weekly Boss Raid Damage + ARISE Extraction Engine ──────

export function applyBossDamageToWeek(
  week: {
    bossMaxHp?: number | null;
    bossCurrentHp?: number | null;
    bossDamageToday?: number | null;
    bossDamageDate?: string | null;
    bossDefeated?: boolean | null;
  },
  params: {
    focusMinutes?: number;
    workoutSets?: number;
    isMorningWindow?: boolean;
    userInt?: number;
    userStr?: number;
  }
) {
  const maxHp = Math.max(400, week.bossMaxHp ?? 1000);
  const currentHp = Math.max(0, week.bossCurrentHp ?? maxHp);
  if (week.bossDefeated || currentHp <= 0) {
    return {
      bossCurrentHp: 0,
      bossDamageToday: week.bossDamageToday ?? 0,
      bossDamageDate: week.bossDamageDate ?? new Date().toISOString().split("T")[0],
      bossDefeated: true,
      damageDealt: 0,
      dailyCapHit: false,
      newlyDefeated: false,
    };
  }

  const todayStr = new Date().toISOString().split("T")[0];
  const alreadyToday = week.bossDamageDate === todayStr ? (week.bossDamageToday ?? 0) : 0;
  const dailyCap = Math.round(maxHp * 0.35); // Strict 35%/day cap prevents 1-day Boss melts
  const remainingDailyBudget = Math.max(0, dailyCap - alreadyToday);

  const intFactor = 4 + (params.userInt ?? 10) * 0.06;
  const strFactor = 14 + (params.userStr ?? 10) * 0.15;
  const critMultiplier = params.isMorningWindow ? 1.5 : 1.0;

  const rawDamage = Math.round(
    ((params.focusMinutes ?? 0) * intFactor * critMultiplier) +
      ((params.workoutSets ?? 0) * strFactor)
  );
  const actualDamage = Math.min(currentHp, remainingDailyBudget, rawDamage);
  const nextHp = Math.max(0, currentHp - actualDamage);

  return {
    bossCurrentHp: nextHp,
    bossDamageToday: alreadyToday + actualDamage,
    bossDamageDate: todayStr,
    bossDefeated: nextHp === 0,
    damageDealt: actualDamage,
    dailyCapHit: rawDamage > remainingDailyBudget && remainingDailyBudget === 0,
    newlyDefeated: nextHp === 0 && currentHp > 0,
  };
}

export function applyMissedDayBossRegen(week: {
  bossMaxHp?: number | null;
  bossCurrentHp?: number | null;
  bossRegenCount?: number | null;
  bossDefeated?: boolean | null;
}) {
  const maxHp = Math.max(400, week.bossMaxHp ?? 1000);
  const regenCount = week.bossRegenCount ?? 0;
  if (week.bossDefeated || regenCount >= 2 || (week.bossCurrentHp ?? maxHp) >= maxHp) {
    return null;
  }
  const heal = Math.round(maxHp * 0.1);
  return {
    bossCurrentHp: Math.min(maxHp, (week.bossCurrentHp ?? maxHp) + heal),
    bossRegenCount: regenCount + 1,
  };
}

export function createPendingExtraction(params: {
  bossName: string;
  sourceMilestone: string;
  rank?: string;
}): NonNullable<User["pendingExtraction"]> {
  const now = Date.now();
  return {
    id: `ext_${randomUUID().slice(0, 8)}`,
    sourceMilestone: params.sourceMilestone.slice(0, 120),
    bossName: params.bossName.slice(0, 80),
    rank: params.rank || "Knight",
    attemptsRemaining: 3, // Max 3 tries just like Solo Leveling extraction rules
    targetHoldSeconds: 10,
    expiresAt: new Date(now + 72 * 3600000).toISOString(),
    seededAt: new Date(now).toISOString(),
  };
}

export function rollExtractionSuccess(params: {
  user: User;
  totalVerifiedMinutes: number;
}): { won: boolean; odds: number } {
  const existingUnlocked = Array.isArray(params.user.unlockedShadows) ? params.user.unlockedShadows : [];
  const existingExtracted = Array.isArray(params.user.extractedShadows) ? params.user.extractedShadows : [];
  const isFirstEver = existingUnlocked.length === 0 && existingExtracted.length === 0;

  if (isFirstEver) {
    return { won: true, odds: 1.0 };
  }

  const wil = params.user.willpower || 10;
  const odds = Math.min(
    0.85,
    Math.max(0.35, 0.35 + wil * 0.004 + Math.min(0.25, params.totalVerifiedMinutes * 0.001))
  );
  // CSPRNG normalized roll [0, 1) using crypto.randomUUID()
  const hex = randomUUID().replace(/-/g, "").slice(0, 8);
  const roll = parseInt(hex, 16) / 0x100000000;
  return { won: roll <= odds, odds: Number(odds.toFixed(2)) };
}
