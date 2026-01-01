import { User, InsertQuest, Quest, InsertGuildQuest } from "@shared/schema";

interface QuestHistory {
    completedCount: number;
    averageCompletionTime: number;
    lastCompletionDate?: Date;
    streak: number;
}

// Dynamic Difficulty Adjustment
export function calculateDifficulty(user: User, history: QuestHistory): number {
    let difficultyMultiplier = 1.0;

    // Increase difficulty based on streak
    if (history.streak > 7) difficultyMultiplier += 0.3;
    else if (history.streak > 3) difficultyMultiplier += 0.15;

    // Increase based on completion rate
    if (history.completedCount > 50) difficultyMultiplier += 0.2;
    else if (history.completedCount > 20) difficultyMultiplier += 0.1;

    // Adjust based on user level
    difficultyMultiplier += (user.level - 1) * 0.05;

    return Math.min(difficultyMultiplier, 2.0); // Cap at 2x
}

// Habit Tracking System
export interface HabitQuest {
    habitId: string;
    name: string;
    frequency: 'daily' | 'weekly';
    currentStreak: number;
    longestStreak: number;
    totalCompletions: number;
}

export function generateHabitQuests(user: User): InsertQuest[] {
    const habits: HabitQuest[] = [
        {
            habitId: 'hydration',
            name: 'Hydration Master',
            frequency: 'daily',
            currentStreak: user.streak,
            longestStreak: user.streak,
            totalCompletions: 0
        },
        {
            habitId: 'morning_routine',
            name: 'Morning Warrior',
            frequency: 'daily',
            currentStreak: 0,
            longestStreak: 0,
            totalCompletions: 0
        },
        {
            habitId: 'reading',
            name: 'Knowledge Seeker',
            frequency: 'daily',
            currentStreak: 0,
            longestStreak: 0,
            totalCompletions: 0
        }
    ];

    return habits.map(habit => ({
        userId: user.id,
        title: `${habit.name} (${habit.currentStreak} day streak)`,
        description: `Continue your ${habit.name} habit. Current streak: ${habit.currentStreak} days. Longest: ${habit.longestStreak} days.`,
        type: "daily",
        difficulty: "easy",
        rewardXP: 3 + Math.floor(habit.currentStreak * 0.5), // Bonus XP for streaks
        rewardCoins: 1 + Math.floor(habit.currentStreak * 0.2),
        rewardStats: { willpower: 1, vitality: 1 },
        dueAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    }));
}

// Milestone Quest System
export interface Milestone {
    id: string;
    category: string;
    target: number;
    current: number;
    reward: {
        xp: number;
        coins: number;
        stats: Record<string, number>;
        title?: string;
    };
}

export function generateMilestoneQuests(user: User): InsertQuest[] {
    const milestones: Milestone[] = [];
    const assessmentData = user.assessmentData as any;

    // Fitness Milestones
    if (assessmentData?.pushups) {
        const currentPushups = assessmentData.pushups;
        const nextMilestone = Math.ceil(currentPushups / 10) * 10 + 10; // Round up to next 10

        milestones.push({
            id: 'pushup_milestone',
            category: 'fitness',
            target: nextMilestone,
            current: currentPushups,
            reward: {
                xp: 50,
                coins: 10,
                stats: { strength: 5, stamina: 3 },
                title: `Pushup Champion ${nextMilestone}`
            }
        });
    }

    // XP Milestones
    const nextXPMilestone = Math.ceil(user.xp / 1000) * 1000;
    if (nextXPMilestone > user.xp) {
        milestones.push({
            id: 'xp_milestone',
            category: 'progression',
            target: nextXPMilestone,
            current: user.xp,
            reward: {
                xp: 0, // Already at milestone
                coins: 20,
                stats: {},
                title: `${nextXPMilestone} XP Achieved`
            }
        });
    }

    // Level Milestones (every 5 levels)
    if (user.level % 5 === 4) { // One level away from milestone
        milestones.push({
            id: 'level_milestone',
            category: 'progression',
            target: user.level + 1,
            current: user.level,
            reward: {
                xp: 100,
                coins: 50,
                stats: { strength: 2, agility: 2, intelligence: 2 },
                title: `Level ${user.level + 1} Master`
            }
        });
    }

    return milestones.map(milestone => ({
        userId: user.id,
        title: `🏆 Milestone: ${milestone.reward.title || milestone.id}`,
        description: `Reach ${milestone.target} (Current: ${milestone.current}). Progress: ${Math.floor((milestone.current / milestone.target) * 100)}%`,
        type: "campaign",
        difficulty: "epic",
        rewardXP: milestone.reward.xp,
        rewardCoins: milestone.reward.coins,
        rewardStats: milestone.reward.stats,
        dueAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    }));
}

// Enhanced Daily Quest Generator with all features
export function generateDailyQuests(user: User, questHistory?: QuestHistory): InsertQuest[] {
    const quests: InsertQuest[] = [];
    const goal = user.currentGoal || "fitness:General Health";
    const [category, specific] = goal.split(":");
    const target = specific?.trim() || "Improvement";

    // Calculate difficulty multiplier
    const history: QuestHistory = questHistory || {
        completedCount: 0,
        averageCompletionTime: 0,
        streak: user.streak,
    };
    const difficultyMult = calculateDifficulty(user, history);

    const createQuest = (
        title: string,
        desc: string,
        baseXP: number,
        baseCoins: number,
        stats: Record<string, number>,
        difficulty: 'easy' | 'normal' | 'hard' = 'normal'
    ): InsertQuest => ({
        userId: user.id,
        title,
        description: desc,
        type: "daily",
        difficulty,
        rewardXP: Math.floor(baseXP * difficultyMult),
        rewardCoins: Math.floor(baseCoins * difficultyMult),
        rewardStats: stats,
        dueAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    });

    // 1. Primary Goal Quests (Multiple per category)
    if (category === "fitness") {
        const pushups = (user.assessmentData as any)?.pushups || 10;
        const targetPushups = Math.ceil(pushups * (1.1 + (difficultyMult - 1) * 0.1));

        quests.push(createQuest(
            `💪 Strength: ${targetPushups} Pushups`,
            `Complete ${targetPushups} pushups in a single set. Baseline: ${pushups}.`,
            10, 2, { strength: Math.floor(2 * difficultyMult) }, 'normal'
        ));

        quests.push(createQuest(
            `🏃 Cardio: 20 Min Run`,
            `Go for a 20-minute run or brisk walk. Maintain a steady pace.`,
            12, 2, { stamina: Math.floor(2 * difficultyMult), vitality: 1 }, 'normal'
        ));

        quests.push(createQuest(
            `🥗 Nutrition: Clean Eating`,
            `Eat 3 balanced meals today with no processed sugars.`,
            8, 1, { vitality: Math.floor(2 * difficultyMult) }, 'easy'
        ));

    } else if (category === "intellect") {
        const minutes = Math.floor(45 * difficultyMult);

        quests.push(createQuest(
            `🧠 Deep Work: ${target}`,
            `Dedicate ${minutes} minutes of uninterrupted focus to ${target}.`,
            15, 3, { intelligence: Math.floor(3 * difficultyMult) }, 'hard'
        ));

        quests.push(createQuest(
            `📚 Research: New Concept`,
            `Learn one new concept related to ${target} and write a summary.`,
            10, 2, { intelligence: Math.floor(2 * difficultyMult) }, 'normal'
        ));

        quests.push(createQuest(
            `🧩 Problem Solving`,
            `Solve a complex problem or puzzle related to your field.`,
            12, 2, { intelligence: 2, willpower: 1 }, 'normal'
        ));

    } else if (category === "wealth") {
        quests.push(createQuest(
            `💼 Strategic Planning`,
            `Plan your top 3 priorities for tomorrow to advance ${target}.`,
            8, 1, { intelligence: 1, willpower: 1 }, 'easy'
        ));

        quests.push(createQuest(
            `💰 Financial Review`,
            `Review your expenses for the week and identify one saving opportunity.`,
            10, 2, { intelligence: 2 }, 'normal'
        ));

        quests.push(createQuest(
            `🚀 Skill Acquisition`,
            `Spend 30 minutes learning a skill that increases your market value.`,
            12, 2, { intelligence: 2, charisma: 1 }, 'normal'
        ));

    } else if (category === "social") {
        quests.push(createQuest(
            `👥 Meaningful Connection`,
            `Have a 15-minute genuine conversation with someone about ${target}.`,
            10, 2, { charisma: Math.floor(3 * difficultyMult) }, 'normal'
        ));

        quests.push(createQuest(
            `🤝 Networking`,
            `Reach out to one person who can help you with ${target}.`,
            12, 2, { charisma: 2, willpower: 1 }, 'hard'
        ));

        quests.push(createQuest(
            `👂 Active Listening`,
            `Practice active listening in your next conversation. Ask 3 follow-up questions.`,
            8, 1, { charisma: 2 }, 'easy'
        ));

    } else if (category === "mindfulness") {
        const minutes = Math.floor(15 * difficultyMult);

        quests.push(createQuest(
            `🧘 Meditation: ${target}`,
            `Meditate for ${minutes} minutes. Focus on your breath.`,
            10, 2, { willpower: Math.floor(2 * difficultyMult) }, 'normal'
        ));

        quests.push(createQuest(
            `📝 Journaling`,
            `Write down 3 things you are grateful for and 1 thing you learned today.`,
            8, 1, { intelligence: 1, willpower: 1 }, 'easy'
        ));

        quests.push(createQuest(
            `🌲 Nature Walk`,
            `Take a 15-minute walk outside without your phone.`,
            10, 2, { vitality: 2 }, 'easy'
        ));
    }

    // 2. Habit Quest (from habit tracking system)
    const habitQuests = generateHabitQuests(user);
    if (habitQuests.length > 0) {
        quests.push(habitQuests[0]); // Add one habit quest per day
    }

    // 3. Challenge Quest (scales with difficulty)
    const challengeXP = Math.floor(15 * difficultyMult);
    quests.push(createQuest(
        `⚡ Daily Challenge: The Extra Mile`,
        `Do something today that pushes you outside your comfort zone.`,
        challengeXP,
        Math.floor(5 * difficultyMult),
        { willpower: Math.floor(3 * difficultyMult) },
        'hard'
    ));

    return quests;
}

// Generate weekly quests (Milestones + Weekly Challenges)
export function generateWeeklyQuests(user: User): InsertQuest[] {
    const quests: InsertQuest[] = [];
    const milestones = generateMilestoneQuests(user);

    // 1. Milestone Quest (if available)
    if (milestones.length > 0) {
        quests.push({
            ...milestones[0],
            type: "weekly",
            dueAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        });
    }

    // 2. Weekly Goal Challenge
    const goal = user.currentGoal || "fitness:General Health";
    const [category] = goal.split(":");

    if (category === "fitness") {
        quests.push({
            userId: user.id,
            title: "Weekly Endurance Challenge",
            description: "Complete 3 workout sessions of at least 45 minutes this week.",
            type: "weekly",
            difficulty: "hard",
            rewardXP: 50,
            rewardCoins: 10,
            rewardStats: { stamina: 5, strength: 3 },
            dueAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        });
    } else if (category === "intellect") {
        quests.push({
            userId: user.id,
            title: "Weekly Knowledge Synthesis",
            description: "Read a book or complete a course module and write a comprehensive summary.",
            type: "weekly",
            difficulty: "hard",
            rewardXP: 50,
            rewardCoins: 10,
            rewardStats: { intelligence: 5, willpower: 3 },
            dueAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        });
    }

    return quests;
}

// Guild Quest Generator
export function generateDailyGuildQuest(guildId: string, level: number): InsertGuildQuest {
    const templates = [
        {
            type: "collective_xp",
            title: "Daily Grind: Collective Power",
            description: "Gain combined XP as a guild.",
            targetBase: 1000,
            rewardXPBase: 10,
            rewardCoinsBase: 5
        },
        {
            type: "member_participation",
            title: "Guild Assembly",
            description: "Members must complete at least one personal quest today.",
            targetBase: 5, // 5 members
            rewardXPBase: 15,
            rewardCoinsBase: 7
        }
    ];

    // Pick random template
    const template = templates[Math.floor(Math.random() * templates.length)];

    // Scale by guild level
    const targetValue = Math.floor(template.targetBase * (1 + (level - 1) * 0.2));
    const rewardXP = Math.floor(template.rewardXPBase * (1 + (level - 1) * 0.1));
    const rewardCoins = Math.floor(template.rewardCoinsBase * (1 + (level - 1) * 0.1));

    return {
        guildId,
        title: template.title,
        description: `${template.description} Target: ${targetValue}`,
        type: template.type,
        targetValue,
        rewardXP,
        rewardCoins,
        status: "active",
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
    };
}
