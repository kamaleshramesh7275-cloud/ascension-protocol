import {
  DIVISION_TIERS,
  type DivisionTier,
  type RivalDivision,
  type RivalDivisionMember,
  type User,
} from "@shared/schema";
import type { IStorage } from "../storage";
import { pushNotifications } from "../utils/push-notifications";

export const MAX_POD_SIZE = 10;

/**
 * Returns canonical division week key anchored cleanly on Sunday 20:00 UTC boundary.
 * Adding +4 hours means Sunday 20:00:00 UTC shifts directly into ISO Monday's week key.
 */
export function getDivisionWeekKey(now: Date = new Date()): string {
  const shifted = new Date(now.getTime() + 4 * 60 * 60 * 1000);
  const utc = new Date(Date.UTC(shifted.getUTCFullYear(), shifted.getUTCMonth(), shifted.getUTCDate()));
  const dayNum = utc.getUTCDay() || 7;
  utc.setUTCDate(utc.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(utc.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((utc.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return `${utc.getUTCFullYear()}-W${String(weekNo).padStart(2, "0")}`;
}

/** Returns upcoming Sunday 20:00:00 UTC settlement timestamp. */
export function getNextDivisionResetAt(now: Date = new Date()): Date {
  const d = new Date(now);
  const daysUntilSunday = (7 - d.getUTCDay()) % 7;
  const reset = new Date(
    Date.UTC(
      d.getUTCFullYear(),
      d.getUTCMonth(),
      d.getUTCDate() + daysUntilSunday,
      20,
      0,
      0,
      0
    )
  );
  if (reset.getTime() <= now.getTime()) {
    reset.setUTCDate(reset.getUTCDate() + 7);
  }
  return reset;
}

export function computeZoneCounts(tier: DivisionTier, memberCount: number) {
  const promotionCount =
    tier === "Monarch" ? 0 : memberCount >= 6 ? 2 : memberCount >= 3 ? 1 : 0;
  const demotionCount = tier === "Bronze" || memberCount < 8 ? 0 : 2;
  return { promotionCount, demotionCount };
}

export function getTierPromotionCoins(tier: DivisionTier, rank: number, outcome: string): number {
  if (tier === "Monarch" && rank === 1) return 400;
  if (outcome === "promoted") {
    if (tier === "Bronze") return 150;
    if (tier === "Silver") return 250;
    if (tier === "Gold") return 350;
  }
  if (rank <= 5) return 50;
  return 0;
}

function nextHigherTier(tier: DivisionTier): DivisionTier {
  const idx = DIVISION_TIERS.indexOf(tier);
  if (idx === -1 || idx >= DIVISION_TIERS.length - 1) return tier;
  return DIVISION_TIERS[idx + 1];
}

function nextLowerTier(tier: DivisionTier): DivisionTier {
  const idx = DIVISION_TIERS.indexOf(tier);
  if (idx <= 0) return "Bronze";
  return DIVISION_TIERS[idx - 1];
}

/**
 * Ensures any prior unsettled weeks are finalized before placing or reading current pods.
 */
export async function settleExpiredDivisions(
  storage: IStorage,
  now: Date = new Date(),
  overrideCurrentWeekKey?: string
): Promise<number> {
  const currentWeekKey = overrideCurrentWeekKey ?? getDivisionWeekKey(now);
  const pendingDivisions = await storage.getUnsettledPastDivisions(currentWeekKey);
  let settledCount = 0;

  for (const division of pendingDivisions) {
    const members = await storage.getRivalDivisionMembers(division.id);
    members.sort((a, b) => b.weeklyXp - a.weeklyXp || a.updatedAt.getTime() - b.updatedAt.getTime());

    const tier = (DIVISION_TIERS.includes(division.tier as DivisionTier)
      ? division.tier
      : "Bronze") as DivisionTier;
    const { promotionCount, demotionCount } = computeZoneCounts(tier, members.length);

    for (let i = 0; i < members.length; i++) {
      const m = members[i];
      const rank = i + 1;
      let outcome: "promoted" | "stayed" | "demoted" = "stayed";
      let nextTier: DivisionTier = tier;

      if (promotionCount > 0 && rank <= promotionCount) {
        outcome = "promoted";
        nextTier = nextHigherTier(tier);
      } else if (demotionCount > 0 && rank > members.length - demotionCount) {
        outcome = "demoted";
        nextTier = nextLowerTier(tier);
      }

      const rewardCoins = getTierPromotionCoins(tier, rank, outcome);
      await storage.updateRivalDivisionMember(m.id, {
        finalRank: rank,
        outcome,
        rewardCoins,
        resultSeen: false,
      });

      const dbUser = await storage.getUser(m.userId);
      if (dbUser) {
        await storage.updateUser(dbUser.id, {
          divisionTier: nextTier,
          coins: (dbUser.coins || 0) + rewardCoins,
        });
        await pushNotifications
          .divisionResult(dbUser.id, tier, rank, outcome, rewardCoins)
          .catch(() => {});
      }
    }

    await storage.updateRivalDivision(division.id, { settled: true });
    settledCount++;
  }

  return settledCount;
}

/**
 * Finds or assigns a user into a 10-Hunter pod for the current week.
 */
export async function getOrAssignUserPod(
  storage: IStorage,
  user: User,
  weekKey: string = getDivisionWeekKey()
): Promise<{ division: RivalDivision; member: RivalDivisionMember }> {
  const existing = await storage.getUserDivisionMembership(user.id, weekKey);
  if (existing) return existing;

  const tier = (DIVISION_TIERS.includes(user.divisionTier as DivisionTier)
    ? user.divisionTier
    : "Bronze") as DivisionTier;

  const weekDivisions = (await storage.getRivalDivisionsByWeek(weekKey)).filter(
    (d) => d.tier === tier
  );
  weekDivisions.sort((a, b) => a.podNumber - b.podNumber);

  let targetDivision: RivalDivision | null = null;
  for (const div of weekDivisions) {
    const members = await storage.getRivalDivisionMembers(div.id);
    if (members.length < MAX_POD_SIZE) {
      targetDivision = div;
      break;
    }
  }

  if (!targetDivision) {
    const nextPodNum =
      weekDivisions.length > 0
        ? weekDivisions[weekDivisions.length - 1].podNumber + 1
        : 1;
    targetDivision = await storage.createRivalDivision({
      weekKey,
      tier,
      podNumber: nextPodNum,
      settled: false,
    });
  }

  const member = await storage.addRivalDivisionMember({
    divisionId: targetDivision.id,
    userId: user.id,
    userName: user.name,
    userTier: user.tier || "D",
    weeklyXp: 0,
    outcome: "pending",
    rewardCoins: 0,
    resultSeen: false,
  });

  return { division: targetDivision, member };
}

/**
 * Effort-integrity weighting so Rival Divisions reward genuine output
 * (Focus minutes, Workout volume, Roadmap milestones) over low-effort checkbox clicks.
 */
export function computeVerifiedDivisionPoints(
  executionMode: string | null | undefined,
  rawXpDelta: number
): number {
  if (!rawXpDelta || rawXpDelta <= 0) return 0;
  if (executionMode === "checkbox" || executionMode === "general") {
    return Math.min(20, Math.round(rawXpDelta * 0.5));
  }
  return rawXpDelta;
}

/**
 * Increments weekly division XP when a Hunter completes verified Focus, Workouts, or Quests.
 */
export async function recordDivisionXp(
  storage: IStorage,
  userId: string,
  xpDelta: number
): Promise<void> {
  if (!xpDelta || xpDelta <= 0) return;
  try {
    const user = await storage.getUser(userId);
    if (!user) return;
    const { member } = await getOrAssignUserPod(storage, user);
    await storage.updateRivalDivisionMember(member.id, {
      weeklyXp: (member.weeklyXp || 0) + xpDelta,
      userName: user.name,
      userTier: user.tier || "D",
      updatedAt: new Date(),
    });
  } catch (err) {
    console.warn("[Divisions] Non-fatal XP sync skip:", err);
  }
}

/**
 * Builds complete live Rival Pod payload for GET /api/divisions/current.
 */
export async function buildDivisionSnapshot(storage: IStorage, user: User) {
  const now = new Date();
  const weekKey = getDivisionWeekKey(now);
  await settleExpiredDivisions(storage, now, weekKey);

  const { division } = await getOrAssignUserPod(storage, user, weekKey);
  const rawMembers = await storage.getRivalDivisionMembers(division.id);
  const sorted = [...rawMembers].sort(
    (a, b) => b.weeklyXp - a.weeklyXp || a.updatedAt.getTime() - b.updatedAt.getTime()
  );

  const tier = (DIVISION_TIERS.includes(division.tier as DivisionTier)
    ? division.tier
    : "Bronze") as DivisionTier;
  const { promotionCount, demotionCount } = computeZoneCounts(tier, sorted.length);

  const myIndex = sorted.findIndex((m) => m.userId === user.id);
  const myRank = myIndex >= 0 ? myIndex + 1 : sorted.length;
  const xpToNextRank =
    myIndex > 0 ? Math.max(1, sorted[myIndex - 1].weeklyXp - sorted[myIndex].weeklyXp + 1) : 0;

  const pendingLastWeekOutcome = await storage.getUnseenDivisionOutcome(user.id);
  const podAvgXp = sorted.length > 0
    ? Math.round(sorted.reduce((sum, m) => sum + (m.weeklyXp || 0), 0) / sorted.length)
    : 0;

  return {
    weekKey,
    divisionTier: tier,
    podNumber: division.podNumber,
    podAvgXp,
    scoringRule: "Weighted by Verified Focus, Workout Sets & Roadmap Milestones (checkbox farming capped).",
    resetsAt: getNextDivisionResetAt(now).toISOString(),
    promotionCount,
    demotionCount,
    myUserId: user.id,
    myRank,
    xpToNextRank,
    members: sorted.map((m, idx) => ({
      ...m,
      rank: idx + 1,
      zone:
        promotionCount > 0 && idx + 1 <= promotionCount
          ? "promotion"
          : demotionCount > 0 && idx + 1 > sorted.length - demotionCount
          ? "demotion"
          : "safe",
    })),
    pendingLastWeekOutcome: pendingLastWeekOutcome || null,
  };
}
