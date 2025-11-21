// Curated quest templates for the Ascension Protocol
// These replace AI-generated quests for regions without API access

export interface QuestTemplate {
  title: string;
  description: string;
  type: "daily" | "weekly";
  rewardXP: number;
  rewardStats: Record<string, number>;
}

export const dailyQuestTemplates: QuestTemplate[] = [
  // Strength quests
  {
    title: "60 Push-ups Challenge",
    description: "Complete 60 push-ups in sets of 20 with 1-minute rest between sets",
    type: "daily",
    rewardXP: 50,
    rewardStats: { strength: 3, stamina: 1 },
  },
  {
    title: "Plank Power",
    description: "Hold a plank position for a total of 3 minutes (can be split into multiple sets)",
    type: "daily",
    rewardXP: 40,
    rewardStats: { strength: 2, willpower: 2 },
  },
  {
    title: "50 Squats",
    description: "Perform 50 bodyweight squats with proper form",
    type: "daily",
    rewardXP: 45,
    rewardStats: { strength: 2, stamina: 2 },
  },
  
  // Agility quests
  {
    title: "Morning Sprint Session",
    description: "Complete 5x100m sprints with 2-minute rest between each",
    type: "daily",
    rewardXP: 55,
    rewardStats: { agility: 3, stamina: 2 },
  },
  {
    title: "Jump Rope Master",
    description: "Jump rope for 15 minutes continuously or in 3-minute intervals",
    type: "daily",
    rewardXP: 50,
    rewardStats: { agility: 3, vitality: 1 },
  },
  
  // Stamina quests
  {
    title: "30-Minute Cardio",
    description: "Complete 30 minutes of continuous cardio exercise (running, cycling, or swimming)",
    type: "daily",
    rewardXP: 60,
    rewardStats: { stamina: 3, vitality: 2 },
  },
  {
    title: "10,000 Steps",
    description: "Walk or run at least 10,000 steps today",
    type: "daily",
    rewardXP: 40,
    rewardStats: { stamina: 2, vitality: 1 },
  },
  
  // Vitality quests
  {
    title: "8-Hour Sleep Achievement",
    description: "Get a full 8 hours of quality sleep tonight",
    type: "daily",
    rewardXP: 50,
    rewardStats: { vitality: 4, willpower: 1 },
  },
  {
    title: "Hydration Hero",
    description: "Drink 8 glasses (2 liters) of water throughout the day",
    type: "daily",
    rewardXP: 30,
    rewardStats: { vitality: 3 },
  },
  {
    title: "Healthy Meal Prep",
    description: "Prepare and eat 3 balanced, nutritious meals today",
    type: "daily",
    rewardXP: 45,
    rewardStats: { vitality: 3, intelligence: 1 },
  },
  
  // Intelligence quests
  {
    title: "60-Minute Study Session",
    description: "Complete 60 minutes of focused study or learning on a chosen topic",
    type: "daily",
    rewardXP: 55,
    rewardStats: { intelligence: 4, willpower: 1 },
  },
  {
    title: "Read 30 Pages",
    description: "Read at least 30 pages of a book (fiction or non-fiction)",
    type: "daily",
    rewardXP: 40,
    rewardStats: { intelligence: 3 },
  },
  {
    title: "Learn Something New",
    description: "Spend 30 minutes learning a new skill or topic through tutorials or courses",
    type: "daily",
    rewardXP: 50,
    rewardStats: { intelligence: 3, willpower: 1 },
  },
  {
    title: "Problem Solver",
    description: "Solve 10 coding challenges, math problems, or puzzles",
    type: "daily",
    rewardXP: 60,
    rewardStats: { intelligence: 4, willpower: 2 },
  },
  
  // Willpower quests
  {
    title: "Cold Shower Challenge",
    description: "Take a 5-minute cold shower",
    type: "daily",
    rewardXP: 40,
    rewardStats: { willpower: 4, vitality: 1 },
  },
  {
    title: "No Phone Challenge",
    description: "Go 2 hours without checking your phone (during waking hours)",
    type: "daily",
    rewardXP: 45,
    rewardStats: { willpower: 3, intelligence: 1 },
  },
  {
    title: "Meditation Master",
    description: "Complete 20 minutes of meditation or mindfulness practice",
    type: "daily",
    rewardXP: 50,
    rewardStats: { willpower: 3, vitality: 2 },
  },
  {
    title: "Early Riser",
    description: "Wake up at 6 AM or earlier and start your day productively",
    type: "daily",
    rewardXP: 55,
    rewardStats: { willpower: 4, vitality: 1 },
  },
  
  // Charisma quests
  {
    title: "Social Connection",
    description: "Have a meaningful 30-minute conversation with a friend or family member",
    type: "daily",
    rewardXP: 45,
    rewardStats: { charisma: 3, intelligence: 1 },
  },
  {
    title: "Help Someone",
    description: "Offer genuine help or support to someone in need today",
    type: "daily",
    rewardXP: 50,
    rewardStats: { charisma: 4, willpower: 1 },
  },
  {
    title: "Public Speaking Practice",
    description: "Practice a presentation or speak confidently in a group setting for at least 10 minutes",
    type: "daily",
    rewardXP: 60,
    rewardStats: { charisma: 4, willpower: 2 },
  },
];

export const weeklyQuestTemplates: QuestTemplate[] = [
  {
    title: "Iron Warrior",
    description: "Complete 5 strength training workouts this week (at least 30 minutes each)",
    type: "weekly",
    rewardXP: 200,
    rewardStats: { strength: 5, stamina: 3 },
  },
  {
    title: "Speed Demon",
    description: "Run a total of 20 kilometers throughout the week",
    type: "weekly",
    rewardXP: 250,
    rewardStats: { agility: 5, stamina: 5, vitality: 2 },
  },
  {
    title: "Knowledge Seeker",
    description: "Read one complete book or finish an online course",
    type: "weekly",
    rewardXP: 300,
    rewardStats: { intelligence: 6, willpower: 3 },
  },
  {
    title: "Perfect Week",
    description: "Maintain a 7-day streak of completing at least 3 daily quests each day",
    type: "weekly",
    rewardXP: 350,
    rewardStats: { willpower: 6, vitality: 3, charisma: 2 },
  },
  {
    title: "Social Butterfly",
    description: "Have meaningful social interactions with at least 10 different people this week",
    type: "weekly",
    rewardXP: 220,
    rewardStats: { charisma: 6, intelligence: 2 },
  },
  {
    title: "Health Champion",
    description: "Eat healthy meals, sleep 8 hours, and exercise for 5 out of 7 days",
    type: "weekly",
    rewardXP: 280,
    rewardStats: { vitality: 6, willpower: 4 },
  },
];

// Helper function to get random daily quests
export function getRandomDailyQuests(count: number = 5): QuestTemplate[] {
  const shuffled = [...dailyQuestTemplates].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

// Helper function to get a random weekly quest
export function getRandomWeeklyQuest(): QuestTemplate {
  const randomIndex = Math.floor(Math.random() * weeklyQuestTemplates.length);
  return weeklyQuestTemplates[randomIndex];
}
