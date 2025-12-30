import { InsertQuest } from "@shared/schema";

interface CampaignTemplate {
    title: string;
    description: string;
    category: string;
    difficulty: "beginner" | "intermediate" | "advanced";
    durationDays: number;
    totalQuests: number;
    rewardXP: number;
    rewardCoins: number;
    imageUrl?: string;
    quests: Record<number, Partial<InsertQuest>[]>;
}

export const CAMPAIGNS_DATA: CampaignTemplate[] = [
    {
        title: "Spartan Physiques",
        description: "Forge a body of steel with this 30-day calisthenics and endurance program. detailed for all levels.",
        category: "fitness",
        difficulty: "intermediate",
        durationDays: 30,
        totalQuests: 90,
        rewardXP: 5000,
        rewardCoins: 1000,
        quests: {
            1: [
                { title: "Use Your Body", description: "Complete 50 Pushups (total throughout the day)", rewardXP: 100, difficulty: "normal" },
                { title: "Legs of Iron", description: "Complete 50 Squats (total throughout the day)", rewardXP: 100, difficulty: "normal" },
                { title: "Mobility", description: "10 minutes of dynamic stretching", rewardXP: 50, difficulty: "easy" }
            ],
            2: [
                { title: "Core Power", description: "3 x 1 minute planks", rewardXP: 100, difficulty: "normal" },
                { title: "Cardio Burst", description: "20 minutes continuous jogging or brisk walking", rewardXP: 150, difficulty: "normal" },
                { title: "Hydration", description: "Drink 3 liters of water today", rewardXP: 50, difficulty: "easy" }
            ],
            3: [
                { title: "Pull Strength", description: "20 Pullups or Rows (total)", rewardXP: 150, difficulty: "hard" },
                { title: "HIIT Session", description: "15 minutes High Intensity Interval Training", rewardXP: 150, difficulty: "hard" },
                { title: "Recovery", description: "15 minutes foam rolling or static stretching", rewardXP: 50, difficulty: "easy" }
            ]
            // ... pattern continues
        }
    },
    {
        title: "Mind of Steel",
        description: "Sharpen your cognitive faculties and build unshakeable discipline.",
        category: "intellect",
        difficulty: "advanced",
        durationDays: 21,
        totalQuests: 63,
        rewardXP: 4500,
        rewardCoins: 800,
        quests: {
            1: [
                { title: "Deep Work", description: "Complete 2 hours of focused work with zero distractions", rewardXP: 200, difficulty: "hard" },
                { title: "Read", description: "Read 20 pages of a non-fiction book", rewardXP: 100, difficulty: "normal" },
                { title: "Meditation", description: "10 minutes mindfulness meditation", rewardXP: 50, difficulty: "easy" }
            ],
            2: [
                { title: "Skill Acquisition", description: "Practice a new language or skill for 45 mins", rewardXP: 150, difficulty: "normal" },
                { title: "Journaling", description: "Write 500 words reflecting on your goals", rewardXP: 100, difficulty: "normal" },
                { title: "No Social Media", description: "Complete the day with < 30 mins social media usage", rewardXP: 100, difficulty: "hard" }
            ]
        }
    },
    {
        title: "Couch to 5K",
        description: "The perfect starting point for your running journey. Build endurance gradually.",
        category: "fitness",
        difficulty: "beginner",
        durationDays: 14,
        totalQuests: 42,
        rewardXP: 2000,
        rewardCoins: 500,
        quests: {
            1: [
                { title: "First Steps", description: "Walk for 30 minutes", rewardXP: 50, difficulty: "easy" },
                { title: "Stretching", description: "5 min calf and hamstring stretches", rewardXP: 30, difficulty: "easy" },
                { title: "Water", description: "Drink 1 glass of water before your walk", rewardXP: 20, difficulty: "easy" }
            ]
        }
    },
    {
        title: "Digital Detox",
        description: "Regain control of your dopamine and attention span.",
        category: "lifestyle",
        difficulty: "beginner",
        durationDays: 7,
        totalQuests: 21,
        rewardXP: 1500,
        rewardCoins: 300,
        quests: {
            1: [
                { title: "Phone Free Bed", description: "No phone in the bedroom tonight", rewardXP: 100, difficulty: "normal" },
                { title: "Grayscale", description: "Turn your phone screen to grayscale mode", rewardXP: 50, difficulty: "easy" },
                { title: "Real Connection", description: "Have a face-to-face conversation for 20 mins", rewardXP: 100, difficulty: "normal" }
            ]
        }
    }
];

export function getCampaignDailyQuests(campaignTitle: string, dayNumber: number): Partial<InsertQuest>[] {
    const campaign = CAMPAIGNS_DATA.find(c => c.title === campaignTitle);
    if (!campaign) return [];

    // Return specific day quests if defined
    if (campaign.quests[dayNumber]) {
        return campaign.quests[dayNumber];
    }

    // Fallback / Generator Logic if specific day not keyed
    // Simple rotation for now
    const fallbackIndex = (dayNumber % 3) || 1;
    if (campaign.quests[fallbackIndex]) {
        return campaign.quests[fallbackIndex].map(q => ({
            ...q,
            title: `${q.title} (Day ${dayNumber})`,
            description: q.description // Keep generic or update
        }));
    }

    // Final fallback
    return [
        { title: "Daily Challenge 1", description: "Complete a small task", rewardXP: 50, difficulty: "easy" },
        { title: "Daily Challenge 2", description: "Complete a medium task", rewardXP: 100, difficulty: "normal" },
        { title: "Daily Challenge 3", description: "Push your limits", rewardXP: 150, difficulty: "hard" }
    ];
}
