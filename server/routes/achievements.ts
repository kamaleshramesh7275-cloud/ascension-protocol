import { Router, Request, Response } from "express";
import { getStorage } from "../storage";
import { requireAuth } from "../middleware/auth";

const router = Router();

export interface AchievementDef {
  code: string;
  title: string;
  description: string;
  category: "discipline" | "combat" | "fitness" | "focus" | "social";
  tier: "bronze" | "silver" | "gold" | "platinum" | "sovereign";
  rewardCoins: number;
  rewardXp: number;
  metricLabel: string;
  targetValue: number;
}

export const ACHIEVEMENTS_CATALOG: AchievementDef[] = [
  // DISCIPLINE
  {
    code: "first_flame",
    title: "First Flame",
    description: "Establish operational discipline with an unbroken 3-day sequence.",
    category: "discipline",
    tier: "bronze",
    rewardCoins: 50,
    rewardXp: 100,
    metricLabel: "Day Streak",
    targetValue: 3,
  },
  {
    code: "initiate_streak",
    title: "Initiate Cadence",
    description: "Hold protocol continuity for 7 calendar days.",
    category: "discipline",
    tier: "silver",
    rewardCoins: 150,
    rewardXp: 250,
    metricLabel: "Day Streak",
    targetValue: 7,
  },
  {
    code: "iron_will",
    title: "Iron Will",
    description: "Achieve 14 consecutive days of zero operational deficit.",
    category: "discipline",
    tier: "gold",
    rewardCoins: 300,
    rewardXp: 500,
    metricLabel: "Day Streak",
    targetValue: 14,
  },
  {
    code: "sovereign_discipline",
    title: "Sovereign Discipline",
    description: "Hold an unbroken 30-day sequence in the crucible.",
    category: "discipline",
    tier: "platinum",
    rewardCoins: 500,
    rewardXp: 1000,
    metricLabel: "Day Streak",
    targetValue: 30,
  },
  {
    code: "the_immortal",
    title: "The Immortal",
    description: "Surpass 90 days of relentless protocol execution.",
    category: "discipline",
    tier: "sovereign",
    rewardCoins: 2500,
    rewardXp: 5000,
    metricLabel: "Day Streak",
    targetValue: 90,
  },

  // COMBAT & TACTICAL
  {
    code: "first_blood",
    title: "First Blood",
    description: "Verify and clear your first operational daily quest.",
    category: "combat",
    tier: "bronze",
    rewardCoins: 50,
    rewardXp: 100,
    metricLabel: "Quests Cleared",
    targetValue: 1,
  },
  {
    code: "centurion",
    title: "Centurion",
    description: "Successfully eliminate 25 assigned missions.",
    category: "combat",
    tier: "silver",
    rewardCoins: 250,
    rewardXp: 500,
    metricLabel: "Quests Cleared",
    targetValue: 25,
  },
  {
    code: "quest_devourer",
    title: "Quest Devourer",
    description: "Systematically clear 100 mission targets.",
    category: "combat",
    tier: "gold",
    rewardCoins: 1000,
    rewardXp: 2000,
    metricLabel: "Quests Cleared",
    targetValue: 100,
  },
  {
    code: "bilateral_covenant",
    title: "Crucible Pact",
    description: "Establish or authorize your first bilateral peer covenant.",
    category: "combat",
    tier: "silver",
    rewardCoins: 150,
    rewardXp: 300,
    metricLabel: "Covenants",
    targetValue: 1,
  },

  // PHYSICAL CONDITIONING
  {
    code: "first_rep",
    title: "First Rep",
    description: "Log your first verified strength or hypertrophy session.",
    category: "fitness",
    tier: "bronze",
    rewardCoins: 50,
    rewardXp: 100,
    metricLabel: "Workouts Logged",
    targetValue: 1,
  },
  {
    code: "tonnage_titan",
    title: "Tonnage Titan",
    description: "Move 10,000 kg of cumulative mechanical volume.",
    category: "fitness",
    tier: "silver",
    rewardCoins: 300,
    rewardXp: 500,
    metricLabel: "Total KG Volume",
    targetValue: 10000,
  },
  {
    code: "apex_lifter",
    title: "Apex Lifter",
    description: "Cross 50,000 kg of cumulative load moved.",
    category: "fitness",
    tier: "gold",
    rewardCoins: 750,
    rewardXp: 1500,
    metricLabel: "Total KG Volume",
    targetValue: 50000,
  },
  {
    code: "iron_veteran",
    title: "Iron Veteran",
    description: "Complete 25 verified physical conditioning sessions.",
    category: "fitness",
    tier: "gold",
    rewardCoins: 500,
    rewardXp: 1000,
    metricLabel: "Workouts Logged",
    targetValue: 25,
  },

  // AIR-GAP FOCUS
  {
    code: "air_gap_initiate",
    title: "Air-Gap Initiate",
    description: "Lock into your first distraction-free deep work session.",
    category: "focus",
    tier: "bronze",
    rewardCoins: 50,
    rewardXp: 100,
    metricLabel: "Focus Minutes",
    targetValue: 25,
  },
  {
    code: "deep_diver",
    title: "Deep Diver",
    description: "Accumulate 300 minutes of verified cognitive focus.",
    category: "focus",
    tier: "silver",
    rewardCoins: 200,
    rewardXp: 400,
    metricLabel: "Focus Minutes",
    targetValue: 300,
  },
  {
    code: "monk_mode",
    title: "Monk Mode",
    description: "Accumulate 1,000 minutes of unbroken deep work.",
    category: "focus",
    tier: "gold",
    rewardCoins: 500,
    rewardXp: 1000,
    metricLabel: "Focus Minutes",
    targetValue: 1000,
  },
  {
    code: "flow_state_master",
    title: "Flow State Master",
    description: "Surpass 3,000 minutes of high-density cognitive output.",
    category: "focus",
    tier: "sovereign",
    rewardCoins: 1500,
    rewardXp: 3000,
    metricLabel: "Focus Minutes",
    targetValue: 3000,
  },

  // SOCIAL & NETWORK
  {
    code: "recruiter",
    title: "Field Recruiter",
    description: "Enlist 1 new operative into Ascension Protocol via referral.",
    category: "social",
    tier: "silver",
    rewardCoins: 100,
    rewardXp: 200,
    metricLabel: "Operatives Recruited",
    targetValue: 1,
  },
  {
    code: "vanguard_recruiter",
    title: "Vanguard Recruiter",
    description: "Recruit 3 verified operatives into active service.",
    category: "social",
    tier: "gold",
    rewardCoins: 300,
    rewardXp: 500,
    metricLabel: "Operatives Recruited",
    targetValue: 3,
  },
  {
    code: "legion_commander",
    title: "Legion Commander",
    description: "Build an active cell of 10 operatives.",
    category: "social",
    tier: "sovereign",
    rewardCoins: 1500,
    rewardXp: 2500,
    metricLabel: "Operatives Recruited",
    targetValue: 10,
  },
  {
    code: "calibration_cadence",
    title: "Calibration Cadence",
    description: "Log into the protocol and claim 7 daily calibrations.",
    category: "discipline",
    tier: "silver",
    rewardCoins: 200,
    rewardXp: 400,
    metricLabel: "Login Days",
    targetValue: 7,
  },
];

// In-memory store for claimed achievements (userId -> Set of codes)
const claimedAchievements = new Map<string, Set<string>>();

// GET /api/achievements
router.get("/", requireAuth, async (req: Request, res: Response) => {
  try {
    const storage = getStorage();
    const user = (req as any).user;
    if (!user) return res.status(401).json({ error: "Unauthorized" });

    const dbUser = await storage.getUser(user.id);
    if (!dbUser) return res.status(404).json({ error: "User not found" });

    // Live metrics computation
    const streak = dbUser.streak || 0;
    const quests = await storage.getUserQuests(dbUser.id);
    const completedQuestsCount = quests.filter((q) => q.completed).length;

    const workoutSessions = await storage.getUserWorkoutSessions(dbUser.id, 100);
    const workoutsCount = workoutSessions.length;
    const totalVolume = workoutSessions.reduce((acc, s) => acc + (s.totalVolume || 0), 0);

    const activities = await storage.getUserActivities(dbUser.id);
    const focusMinutes = activities
      .filter((a) => a.action === "focus_session" || a.action === "focus" || a.action === "focusSession")
      .reduce((acc, a) => acc + ((a as any).duration || a.xpDelta || 30), 0);

    const userClaims = claimedAchievements.get(dbUser.id) || new Set<string>();

    // Referral count from referral profile
    const refProfile = await storage.getReferralProfile(dbUser.id);
    const recruitsCount = refProfile?.totalReferrals || 0;

    const loginDay = dbUser.loginRewardDay || 1;

    // Check covenants
    const covenantsCount = activities.filter((a) => a.action === "covenantCreated").length;

    const achievements = ACHIEVEMENTS_CATALOG.map((ach) => {
      let currentVal = 0;
      switch (ach.code) {
        case "first_flame":
        case "initiate_streak":
        case "iron_will":
        case "sovereign_discipline":
        case "the_immortal":
          currentVal = streak;
          break;
        case "first_blood":
        case "centurion":
        case "quest_devourer":
          currentVal = completedQuestsCount;
          break;
        case "bilateral_covenant":
          currentVal = covenantsCount;
          break;
        case "first_rep":
        case "iron_veteran":
          currentVal = workoutsCount;
          break;
        case "tonnage_titan":
        case "apex_lifter":
          currentVal = totalVolume;
          break;
        case "air_gap_initiate":
        case "deep_diver":
        case "monk_mode":
        case "flow_state_master":
          currentVal = focusMinutes;
          break;
        case "recruiter":
        case "vanguard_recruiter":
        case "legion_commander":
          currentVal = recruitsCount;
          break;
        case "calibration_cadence":
          currentVal = loginDay;
          break;
        default:
          currentVal = 0;
      }

      const unlocked = currentVal >= ach.targetValue;
      const claimed = userClaims.has(ach.code);

      return {
        ...ach,
        currentValue: currentVal,
        progressPercent: Math.min(Math.round((currentVal / ach.targetValue) * 100), 100),
        isUnlocked: unlocked,
        isClaimed: claimed,
      };
    });

    const unlockedCount = achievements.filter((a) => a.isUnlocked).length;
    const totalCount = achievements.length;

    res.json({
      summary: {
        unlockedCount,
        totalCount,
        completionRate: Math.round((unlockedCount / totalCount) * 100),
      },
      achievements,
    });
  } catch (error: any) {
    console.error("Get achievements error:", error);
    res.status(500).json({ error: error.message || "Failed to retrieve achievements" });
  }
});

// POST /api/achievements/:code/claim
router.post("/:code/claim", requireAuth, async (req: Request, res: Response) => {
  try {
    const storage = getStorage();
    const user = (req as any).user;
    if (!user) return res.status(401).json({ error: "Unauthorized" });

    const { code } = req.params;
    const achievement = ACHIEVEMENTS_CATALOG.find((a) => a.code === code);
    if (!achievement) return res.status(404).json({ error: "Achievement definition not found" });

    const userClaims = claimedAchievements.get(user.id) || new Set<string>();
    if (userClaims.has(code)) {
      return res.status(400).json({ error: "Achievement reward already claimed" });
    }

    const dbUser = await storage.getUser(user.id);
    if (!dbUser) return res.status(404).json({ error: "User not found" });

    // Credit reward
    const updatedUser = await storage.updateUser(dbUser.id, {
      coins: (dbUser.coins || 0) + achievement.rewardCoins,
      xp: (dbUser.xp || 0) + achievement.rewardXp,
    });

    userClaims.add(code);
    claimedAchievements.set(user.id, userClaims);

    await storage.createActivity({
      userId: dbUser.id,
      action: "achievementClaim",
      coinsDelta: achievement.rewardCoins,
      xpDelta: achievement.rewardXp,
    });

    await storage.createNotification({
      userId: dbUser.id,
      type: "achievement",
      title: `[ACHIEVEMENT UNLOCKED] ${achievement.title}`,
      message: `Trophy claimed. Yield: +${achievement.rewardCoins} Coins, +${achievement.rewardXp} XP.`,
    });

    res.json({
      success: true,
      achievement,
      user: updatedUser,
      rewardCoins: achievement.rewardCoins,
      rewardXp: achievement.rewardXp,
    });
  } catch (error: any) {
    console.error("Claim achievement error:", error);
    res.status(500).json({ error: error.message || "Failed to claim achievement" });
  }
});

export default router;
