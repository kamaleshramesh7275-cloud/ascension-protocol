import {
  type User,
  type InsertUser,
  type Quest,
  type InsertQuest,
  type Activity,
  type InsertActivity,
  type RankTrial,
  type InsertRankTrial,
  type ShopItem,
  type InsertShopItem,
  type UserItem,
  type InsertUserItem,
  type Guild,
  type InsertGuild,
  type FocusSession,
  type InsertFocusSession,
  type Notification,
  type InsertNotification,
  type Message,
  type InsertMessage,
  type Partnership,
  type InsertPartnership,
  type DirectMessage,
  type InsertDirectMessage,
  type Credential,
  type InsertCredential,
  type GuildMessage,
  type InsertGuildMessage,
  type Rivalry,
  type InsertRivalry,
  type GuildQuest,
  type InsertGuildQuest,
  type GuildQuestProgress,
  type InsertGuildQuestProgress,
  type GuildPerk,
  type InsertGuildPerk,
  type GuildDonation,
  type InsertGuildDonation,
  type Task,
  type InsertTask,
  type GuildWar,
  type GuildWarParticipant,
  type GuildWarEvent,
  type InsertGuildWarEvent,
  type InsertPremiumRequest,
  type PremiumRequest,
  type InsertCampaign,
  type Campaign,
  type UserCampaign,
  TIER_THRESHOLDS,
  Tier,
  users,
  quests,
  tasks,
  activityHistory,
  rankTrials,
  shopItems,
  userItems,
  guilds,
  focusSessions,
  notifications,
  messages,
  partnerships,
  directMessages,
  credentials,
  guildMessages,
  campaigns,
  userCampaigns,
  contentLibrary,
  sleepLogs,
  nutritionLogs,
  habitTracking,
  rivalries,
  guildQuests,
  guildQuestProgress,
  guildPerks,
  guildDonations,
  guildWars,
  guildWarParticipants,
  guildWarEvents,
  premiumRequests,
  insertCampaignSchema,
  insertShopItemSchema
} from "@shared/schema";
import { eq, and, desc, lt, gt, ne, or } from "drizzle-orm"; // Import operators
import { CAMPAIGNS_DATA, getCampaignDailyQuests } from "./data/campaigns";
import bcrypt from "bcryptjs";
import { randomUUID } from "crypto";
import { db } from "./db";

const activities = activityHistory;

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByFirebaseUid(firebaseUid: string): Promise<User | undefined>;
  isUserDeleted(firebaseUid: string): Promise<boolean>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<User>): Promise<User>;
  deleteUser(id: string): Promise<void>;
  getAllUsers(): Promise<User[]>;

  // Quest operations
  getQuest(id: string): Promise<Quest | undefined>;
  getUserQuests(userId: string): Promise<Quest[]>;
  createQuest(quest: InsertQuest): Promise<Quest>;
  updateQuest(id: string, updates: Partial<Quest>): Promise<Quest>;

  deleteQuest(id: string): Promise<void>;
  checkDailyQuests(userId: string): Promise<void>;

  // Campaign operations
  getCampaigns(): Promise<any[]>;
  joinCampaign(userId: string, campaignId: string): Promise<void>;
  getActiveCampaign(userId: string): Promise<any | undefined>;

  // Activity operations
  getActivity(id: string): Promise<Activity | undefined>;
  getUserActivities(userId: string): Promise<Activity[]>;
  createActivity(activity: InsertActivity): Promise<Activity>;

  // Rank Trial operations
  getRankTrial(id: string): Promise<RankTrial | undefined>;
  getUserRankTrials(userId: string): Promise<RankTrial[]>;
  createRankTrial(trial: InsertRankTrial): Promise<RankTrial>;
  updateRankTrial(id: string, updates: Partial<RankTrial>): Promise<RankTrial>;

  // Shop operations
  getShopItems(): Promise<ShopItem[]>;
  getShopItem(id: string): Promise<ShopItem | undefined>;
  createShopItem(item: InsertShopItem): Promise<ShopItem>;

  // User Item operations
  getUserItems(userId: string): Promise<UserItem[]>;
  createUserItem(item: InsertUserItem): Promise<UserItem>;
  updateUserItem(id: string, updates: Partial<UserItem>): Promise<UserItem>;

  // Guild operations
  getGuild(id: string): Promise<Guild | undefined>;
  getAllGuilds(): Promise<Guild[]>;
  getGuildMembers(guildId: string): Promise<User[]>;
  createGuild(guild: InsertGuild): Promise<Guild>;
  updateGuild(id: string, updates: Partial<Guild>): Promise<Guild>;
  deleteGuild(id: string): Promise<void>;

  // Guild Messages
  addGuildMessage(message: any): Promise<any>;
  getGuildMessages(guildId: string): Promise<any[]>;
  getAllGuildMessages(): Promise<any[]>;

  // Credentials
  saveCredentials(username: string, passwordHash: string, password: string, userId: string): Promise<void>;
  getCredentialsByUsername(username: string): Promise<{ username: string; passwordHash: string; userId: string } | undefined>;
  usernameExists(username: string): Promise<boolean>;
  getAllCredentials(): Promise<{ username: string; passwordHash: string; userId: string }[]>;

  // Focus Session operations
  createFocusSession(session: InsertFocusSession): Promise<FocusSession>;
  getUserFocusSessions(userId: string): Promise<FocusSession[]>;
  getAllFocusSessions(): Promise<(FocusSession & { user: User })[]>;
  getFocusSessionStats(userId: string): Promise<{ totalMinutes: number; totalXP: number; sessionCount: number }>;

  // Notification operations
  createNotification(notification: InsertNotification): Promise<Notification>;
  getUserNotifications(userId: string): Promise<Notification[]>;
  markNotificationAsRead(notificationId: string): Promise<void>;
  getAdminNotificationHistory(): Promise<any[]>;

  // Global Chat operations
  createMessage(message: InsertMessage): Promise<Message>;
  getMessages(limit?: number): Promise<(Message & { user: User })[]>;

  // Store & Inventory (Mixed)
  purchaseItem(userId: string, itemId: string): Promise<UserItem>;
  equipItem(userId: string, itemId: string, type: 'title' | 'badge' | 'theme'): Promise<User>;
  awardCoins(userId: string, amount: number): Promise<User>;

  // Partnership operations
  createPartnership(user1Id: string, user2Id: string): Promise<Partnership>;
  getAllPartnerships(): Promise<(Partnership & { user1: User; user2: User })[]>;
  getPartnerships(userId: string): Promise<Partnership[]>;
  updatePartnership(id: string, updates: Partial<Partnership>): Promise<Partnership>;
  updatePartnershipStatus(id: string, status: string): Promise<Partnership>;
  findPotentialPartners(userId: string, subject?: string, availability?: string): Promise<User[]>;

  // Direct Messages
  createDirectMessage(message: InsertDirectMessage): Promise<DirectMessage>;
  getDirectMessages(user1Id: string, user2Id: string): Promise<DirectMessage[]>;
  persist(): Promise<void>;
  createBackup(): Promise<string>;
  // Rivalry operations
  createRivalry(rivalry: InsertRivalry): Promise<Rivalry>;
  getRivalries(userId: string): Promise<Rivalry[]>;
  getRivalry(id: string): Promise<Rivalry | undefined>;
  updateRivalry(id: string, updates: Partial<Rivalry>): Promise<Rivalry>;

  // Guild Quest operations
  createGuildQuest(quest: InsertGuildQuest): Promise<GuildQuest>;
  getGuildQuests(guildId: string): Promise<GuildQuest[]>;
  updateGuildQuest(id: string, updates: Partial<GuildQuest>): Promise<GuildQuest>;
  contributeToGuildQuest(questId: string, userId: string, amount: number): Promise<void>;
  getGuildQuestProgress(questId: string): Promise<GuildQuestProgress[]>;

  // Guild Perk operations
  getAllGuildPerks(): Promise<GuildPerk[]>;
  purchaseGuildPerk(guildId: string, perkId: string): Promise<void>;
  getGuildActivePerks(guildId: string): Promise<GuildPerk[]>;

  // Guild Donation operations
  donateToGuild(guildId: string, userId: string, amount: number): Promise<GuildDonation>;
  getGuildDonations(guildId: string, limit?: number): Promise<GuildDonation[]>;
  getGuildTreasury(guildId: string): Promise<number>;
  hydrate(): Promise<void>;
  hydrate(): Promise<void>;

  // Tasks
  getTasks(userId: string): Promise<Task[]>;
  createTask(task: InsertTask): Promise<Task>;
  updateTask(id: string, task: Partial<Task>): Promise<Task>;
  deleteTask(id: string): Promise<void>;

  // Stats
  getUserWeeklyStats(userId: string): Promise<{ date: string; xp: number }[]>;

  // Guild War operations
  getActiveGuildWar(guildId: string): Promise<GuildWar | undefined>;
  getGuildWar(warId: string): Promise<GuildWar | undefined>;
  getWarParticipants(warId: string): Promise<(GuildWarParticipant & { user: User })[]>;
  getWarEvents(warId: string): Promise<GuildWarEvent[]>;
  getGuildWarHistory(guildId: string): Promise<GuildWar[]>;
  logWarContribution(contribution: { warId: string, userId: string, guildId: string, eventType: string, points: number, description: string }): Promise<void>;
  findOrCreateGuildWarMatch(guildId: string): Promise<GuildWar>;
  updateGuildWar(warId: string, updates: Partial<GuildWar>): Promise<GuildWar>;

  // Premium Request operations
  createPremiumRequest(request: InsertPremiumRequest): Promise<PremiumRequest>;
  getPendingPremiumRequests(): Promise<(PremiumRequest & { user: User })[]>;
  getAllPremiumRequests(): Promise<(PremiumRequest & { user: User })[]>;
  updatePremiumRequestStatus(id: string, status: "approved" | "rejected", adminNotes?: string): Promise<PremiumRequest>;
  getUserPremiumRequests(userId: string): Promise<PremiumRequest[]>;
}

// Shop Items
const DEFAULT_SHOP_ITEMS: InsertShopItem[] = [
  { name: "Novice", description: "Title for beginners", type: "title", rarity: "common", value: "Novice", cost: 100, isPremium: false },
  { name: "Apprentice", description: "Title for learners", type: "title", rarity: "common", value: "Apprentice", cost: 500, isPremium: false },
  { name: "Scholar", description: "Title for dedicated students", type: "title", rarity: "rare", value: "Scholar", cost: 1000, isPremium: false },
  { name: "Focus Master", description: "Title for focus experts", type: "title", rarity: "epic", value: "Focus Master", cost: 5000, isPremium: false },
  { name: "Bronze Medal", description: "A bronze medal for effort", type: "badge", rarity: "common", value: "medal_bronze", cost: 200, isPremium: false },
  { name: "Silver Medal", description: "A silver medal for achievement", type: "badge", rarity: "rare", value: "medal_silver", cost: 1000, isPremium: false },
  { name: "Gold Medal", description: "A gold medal for excellence", type: "badge", rarity: "epic", value: "medal_gold", cost: 5000, isPremium: false },
  // Global Themes (User Requested)
  { name: "Midnight Mirage", description: "Deep blue and mysterious night aesthetic.", type: "theme", rarity: "rare", value: "midnight-mirage", cost: 500, isPremium: true },
  { name: "Cyberpunk Neon", description: "Vibrant neon pinks and cyans.", type: "theme", rarity: "epic", value: "cyberpunk-neon", cost: 1200, isPremium: true },
  { name: "Golden Age", description: "Opulent gold and black luxury.", type: "theme", rarity: "legendary", value: "golden-age", cost: 5000, isPremium: true },
  { name: "Nature's Wrath", description: "Deep greens and earthy tones.", type: "theme", rarity: "rare", value: "natures-wrath", cost: 600, isPremium: true },
  { name: "Arctic Frost", description: "Cool whites and icy blues.", type: "theme", rarity: "rare", value: "arctic-frost", cost: 700, isPremium: true },
  { name: "Vampire's Kiss", description: "Deep red and black gothic vibes.", type: "theme", rarity: "epic", value: "vampires-kiss", cost: 1000, isPremium: true },
];

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private quests: Map<string, Quest>;
  private activities: Map<string, Activity>;
  private rankTrials: Map<string, RankTrial>;
  private shopItems: Map<string, ShopItem>;
  private userItems: Map<string, UserItem>;
  private guilds: Map<string, Guild>;
  private deletedUids: Set<string>;
  private userCredentials: Map<string, { username: string; passwordHash: string; userId: string }>;
  private guildMessages: Map<string, any>;
  private focusSessions: Map<string, FocusSession>;
  private notifications: Map<string, Notification>;
  private messages: Map<string, Message>;
  private partnerships: Map<string, Partnership>;
  private directMessages: Map<string, DirectMessage>;
  private rivalries: Map<string, Rivalry>;
  private guildQuests: Map<string, GuildQuest>;
  private guildQuestProgress: Map<string, GuildQuestProgress>;
  private guildPerks: Map<string, GuildPerk>;
  private guildDonations: Map<string, GuildDonation>;
  private campaigns: Map<string, any>;
  private userCampaigns: Map<string, any>;
  private tasks: Map<string, Task>;
  private guildWars: Map<string, GuildWar>;
  private guildWarParticipants: Map<string, GuildWarParticipant>;
  private guildWarEvents: Map<string, GuildWarEvent>;
  private premiumRequests: Map<string, PremiumRequest>;

  constructor() {
    this.guilds = new Map();
    // Pre-populate standard guilds
    const standardNames = ["Alpha", "Beta", "Gamma", "Delta", "Epsilon", "Zeta", "Eta", "Theta"];
    standardNames.forEach((name, idx) => {
      const id = `guild-${idx + 1}`;
      this.guilds.set(id, {
        id,
        name,
        description: `${name} guild`,
        leaderId: "",
        avatarUrl: null,
        createdAt: new Date(),
        level: 1,
        xp: 0,
        memberCount: 0,
        maxMembers: 50,
        isPublic: true,
        vicePresidentIds: [],
        treasury: 0,
        activePerks: [],
      });
    });
    this.users = new Map();
    this.quests = new Map();
    this.activities = new Map();
    this.rankTrials = new Map();
    this.shopItems = new Map();
    this.campaigns = new Map();
    this.campaigns = new Map();
    this.userCampaigns = new Map();
    this.tasks = new Map();

    // SEED CAMPAIGNS FROM DATA
    this.campaigns = new Map();
    CAMPAIGNS_DATA.forEach(c => {
      const id = randomUUID();
      this.campaigns.set(id, {
        id,
        title: c.title,
        description: c.description,
        category: c.category,
        difficulty: c.difficulty,
        durationDays: c.durationDays,
        totalQuests: c.totalQuests,
        rewardXP: c.rewardXP,
        rewardCoins: c.rewardCoins,
        imageUrl: c.imageUrl || null,
        createdAt: new Date()
      });
    });

    DEFAULT_SHOP_ITEMS.forEach(item => {
      const id = randomUUID();
      this.shopItems.set(id, {
        ...item,
        id,
        createdAt: new Date(),
        rarity: item.rarity || "common",
        isPremium: item.isPremium || false
      });
    });

    this.userItems = new Map();
    this.deletedUids = new Set();
    this.userCredentials = new Map();
    this.guildMessages = new Map();
    this.focusSessions = new Map();
    this.notifications = new Map();
    this.messages = new Map();
    this.partnerships = new Map();
    this.directMessages = new Map();
    this.rivalries = new Map();
    this.guildQuests = new Map();
    this.guildQuestProgress = new Map();
    this.guildPerks = new Map();
    this.guildDonations = new Map();
    this.guildWars = new Map();
    this.guildWarParticipants = new Map();
    this.guildWarEvents = new Map();
    this.premiumRequests = new Map();

    // Pre-populate guild perks catalog
    const defaultPerks: InsertGuildPerk[] = [
      { name: "XP Boost I", description: "+10% XP for all guild members", cost: 1000, effect: "xp_boost_10", iconName: "zap", tier: 1 },
      { name: "XP Boost II", description: "+20% XP for all guild members", cost: 3000, effect: "xp_boost_20", iconName: "zap", tier: 2 },
      { name: "Coin Boost I", description: "+15% coins for all guild members", cost: 1500, effect: "coin_boost_15", iconName: "coins", tier: 1 },
      { name: "Coin Boost II", description: "+30% coins for all guild members", cost: 4000, effect: "coin_boost_30", iconName: "coins", tier: 2 },
      { name: "Extra Quest Slot", description: "+1 daily quest slot for all members", cost: 2000, effect: "quest_slots_1", iconName: "list-plus", tier: 1 },
      { name: "Guild Treasury Boost", description: "+25% to all donations", cost: 2500, effect: "donation_boost_25", iconName: "piggy-bank", tier: 1 },
    ];

    defaultPerks.forEach(perk => {
      const id = randomUUID();
      this.guildPerks.set(id, { ...perk, id, tier: perk.tier || 1, iconName: perk.iconName || null });
    });

    // Pre-populate default quests for each guild
    const guildIds = Array.from(this.guilds.keys());
    guildIds.forEach(guildId => {
      const defaultQuests: InsertGuildQuest[] = [
        {
          guildId,
          title: "First Steps Together",
          description: "Guild members collectively earn 5,000 XP",
          type: "collective_xp",
          targetValue: 5000,
          rewardCoins: 100,
          rewardXP: 200,
          status: "active",
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        },
        {
          guildId,
          title: "Focused Unity",
          description: "Guild members collectively focus for 300 minutes",
          type: "collective_focus",
          targetValue: 300,
          rewardCoins: 150,
          rewardXP: 300,
          status: "active",
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
        {
          guildId,
          title: "Active Community",
          description: "Have 5 different members complete any quest",
          type: "member_participation",
          targetValue: 5,
          rewardCoins: 200,
          rewardXP: 400,
          status: "active",
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      ];

      defaultQuests.forEach(quest => {
        const id = randomUUID();
        this.guildQuests.set(id, {
          ...quest,
          id,
          createdAt: new Date(),
          completedAt: null,
          currentValue: 0,
        } as GuildQuest);
      });
    });

    // --- Inject Demo User for Vercel Persistence ---
    this.createDemoUser();
  }

  private createDemoUser() {
    try {
      const demoUsername = "demo"; // Fixed username
      const demoPassword = "password123";
      const demoFirebaseUid = "local_demo_uid";

      // 1. Create User
      const demoUser: User = {
        id: "100", // Fixed numeric/string ID often used in seeding
        firebaseUid: demoFirebaseUid,
        name: demoUsername,
        email: "demo@ascension.local",
        avatarUrl: null,
        timezone: "UTC",
        onboardingCompleted: true,
        level: 5,
        xp: 2500,
        tier: "Iron",
        streak: 3,
        createdAt: new Date(),
        coins: 500,
        strength: 20,
        agility: 15,
        stamina: 18,
        vitality: 25,
        intelligence: 30,
        willpower: 28,
        charisma: 22,
        currentGoal: "Master the demo",
        bio: "I am the persistent demo user.",
        stats: {
          strength: 20, agility: 15, stamina: 18, vitality: 25, intelligence: 30, willpower: 28, charisma: 22
        },
        studySubject: "Demoology",
        studyAvailability: "Always",
        lastNotificationSent: null,
      } as any;

      this.users.set(demoUser.id.toString(), demoUser);
      console.log("✅ Demo user created in MemStorage");

      // 2. Create Credentials
      const salt = bcrypt.genSaltSync(10);
      const hash = bcrypt.hashSync(demoPassword, salt);

      const creds = {
        id: randomUUID(),
        userId: demoUser.id.toString(),
        username: demoUsername,
        passwordHash: hash,
        createdAt: new Date()
      };

      this.userCredentials.set(creds.id, creds);
      console.log("✅ Demo credentials created");

    } catch (err) {
      console.error("Failed to create demo user:", err);
    }
  }

  // Rivalry operations
  async createRivalry(insertRivalry: InsertRivalry): Promise<Rivalry> {
    const id = randomUUID();
    const rivalry: Rivalry = {
      ...insertRivalry,
      id,
      status: "pending",
      challengerScore: 0,
      defenderScore: 0,
      winnerId: null,
      reward: insertRivalry.reward || 500,
      createdAt: new Date(),
      startDate: insertRivalry.startDate || new Date(),
    };
    this.rivalries.set(id, rivalry);
    this.autoSave();
    return rivalry;
  }

  async getRivalries(userId: string): Promise<Rivalry[]> {
    return Array.from(this.rivalries.values()).filter(
      (r) => r.challengerId === userId || r.defenderId === userId
    );
  }

  async getRivalry(id: string): Promise<Rivalry | undefined> {
    return this.rivalries.get(id);
  }

  async updateRivalry(id: string, updates: Partial<Rivalry>): Promise<Rivalry> {
    const existing = await this.getRivalry(id);
    if (!existing) throw new Error("Rivalry not found");
    const updated = { ...existing, ...updates };
    this.rivalries.set(id, updated);
    await this.persist();
    return updated;
  }

  // Guild Quest operations

  async createGuildQuest(quest: InsertGuildQuest): Promise<GuildQuest> {
    const id = randomUUID();
    const newQuest: GuildQuest = {
      ...quest,
      id,
      createdAt: new Date(),
      completedAt: null,
      currentValue: 0,
      status: quest.status ?? "active",
      contributors: [], // Initialize contributors array
    } as any; // Cast mainly because of contributors not being in InsertGuildQuest but needed for logic
    this.guildQuests.set(id, newQuest);
    return newQuest;
  }

  async getGuildQuests(guildId: string): Promise<GuildQuest[]> {
    return Array.from(this.guildQuests.values()).filter(q => q.guildId === guildId);
  }

  async updateGuildQuest(id: string, updates: Partial<GuildQuest>): Promise<GuildQuest> {
    const quest = this.guildQuests.get(id);
    if (!quest) throw new Error("Guild quest not found");
    const updated = { ...quest, ...updates };
    this.guildQuests.set(id, updated);
    this.autoSave();
    return updated;
  }

  async contributeToGuildQuest(questId: string, userId: string, amount: number): Promise<void> {
    const existing = Array.from(this.guildQuestProgress.values()).find(
      p => p.questId === questId && p.userId === userId
    );

    if (existing) {
      existing.contribution += amount;
      existing.updatedAt = new Date();
      this.guildQuestProgress.set(existing.id, existing);
    } else {
      const id = randomUUID();
      const progress: GuildQuestProgress = {
        id,
        questId,
        userId,
        contribution: amount,
        updatedAt: new Date(),
      };
      this.guildQuestProgress.set(id, progress);
    }

    const quest = this.guildQuests.get(questId);
    if (quest) {
      quest.currentValue += amount;

      if (quest.currentValue >= quest.targetValue && quest.status === "active") {
        quest.status = "completed";
        quest.completedAt = new Date();

        const contributors = Array.from(this.guildQuestProgress.values())
          .filter(p => p.questId === questId);

        for (const contributor of contributors) {
          const user = this.users.get(contributor.userId);
          if (user) {
            user.xp += quest.rewardXP;
            user.coins += quest.rewardCoins;
            this.users.set(user.id, user);
          }
        }
      }

      this.guildQuests.set(questId, quest);
    }

    this.autoSave();
  }

  async getGuildQuestProgress(questId: string): Promise<GuildQuestProgress[]> {
    return Array.from(this.guildQuestProgress.values()).filter(p => p.questId === questId);
  }

  async getAllGuildPerks(): Promise<GuildPerk[]> {
    return Array.from(this.guildPerks.values());
  }

  async purchaseGuildPerk(guildId: string, perkId: string): Promise<void> {
    const guild = this.guilds.get(guildId);
    if (!guild) throw new Error("Guild not found");

    const perk = this.guildPerks.get(perkId);
    if (!perk) throw new Error("Perk not found");

    if (guild.treasury < perk.cost) {
      throw new Error("Insufficient guild treasury");
    }

    guild.treasury -= perk.cost;
    if (!guild.activePerks) guild.activePerks = [];
    if (!guild.activePerks.includes(perkId)) {
      guild.activePerks.push(perkId);
    }

    this.guilds.set(guildId, guild);
    this.autoSave();
  }

  async getGuildActivePerks(guildId: string): Promise<GuildPerk[]> {
    const guild = this.guilds.get(guildId);
    if (!guild || !guild.activePerks) return [];

    return guild.activePerks
      .map(perkId => this.guildPerks.get(perkId))
      .filter((perk): perk is GuildPerk => perk !== undefined);
  }

  async donateToGuild(guildId: string, userId: string, amount: number): Promise<GuildDonation> {
    const user = this.users.get(userId);
    if (!user) throw new Error("User not found");

    const guild = this.guilds.get(guildId);
    if (!guild) throw new Error("Guild not found");

    if (user.coins < amount) {
      throw new Error("Insufficient coins");
    }

    user.coins -= amount;
    this.users.set(userId, user);

    const activePerks = await this.getGuildActivePerks(guildId);
    const donationBoost = activePerks.find(p => p.effect.startsWith("donation_boost"));
    const boostMultiplier = donationBoost ? 1 + parseInt(donationBoost.effect.split("_")[2]) / 100 : 1;
    const finalAmount = Math.floor(amount * boostMultiplier);

    guild.treasury += finalAmount;
    this.guilds.set(guildId, guild);

    const id = randomUUID();
    const donation: GuildDonation = {
      id,
      guildId,
      userId,
      amount,
      createdAt: new Date(),
    };
    this.guildDonations.set(id, donation);

    this.autoSave();
    return donation;
  }

  async getGuildDonations(guildId: string, limit: number = 50): Promise<GuildDonation[]> {
    return Array.from(this.guildDonations.values())
      .filter(d => d.guildId === guildId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit);
  }

  async getGuildTreasury(guildId: string): Promise<number> {
    const guild = this.guilds.get(guildId);
    return guild?.treasury || 0;
  }

  async getCampaigns(): Promise<any[]> {
    return Array.from(this.campaigns.values());
  }

  async getActiveCampaign(userId: string): Promise<any | undefined> {
    const uc = Array.from(this.userCampaigns.values()).find(uc => uc.userId === userId && !uc.completed);
    if (!uc) return undefined;
    return this.campaigns.get(uc.campaignId);
  }

  async joinCampaign(userId: string, campaignId: string): Promise<void> {
    // Check if duplicate
    const existing = Array.from(this.userCampaigns.values()).find(uc => uc.userId === userId && uc.campaignId === campaignId);
    if (existing) return;

    // End other active campaigns? Optional, but let's allow only 1 active for simplicity or many?
    // Let's allow one active per category maybe? For now just add it.

    // Seed Start Date
    const id = randomUUID();
    this.userCampaigns.set(id, {
      id, userId, campaignId, questsCompleted: 0, completed: false, startedAt: new Date(), completedAt: null
    });

    // Trigger daily quest check immediately
    await this.checkDailyQuests(userId);
  }

  async checkDailyQuests(userId: string): Promise<void> {
    // 1. Get user active campaigns
    const activeUCs = Array.from(this.userCampaigns.values()).filter(uc => uc.userId === userId && !uc.completed);
    const now = new Date();

    for (const uc of activeUCs) {
      const campaign = this.campaigns.get(uc.campaignId);
      if (!campaign) continue;

      // Calculate Day Number
      const msPerDay = 1000 * 60 * 60 * 24;
      const daysSinceStart = Math.floor((now.getTime() - uc.startedAt.getTime()) / msPerDay) + 1;

      if (daysSinceStart > campaign.durationDays) continue;

      // Check if quests exist for this campaign + dayNumber
      const existingQuests = Array.from(this.quests.values()).filter(q =>
        q.userId === userId &&
        q.campaignId === campaign.id &&
        (q as any).dayNumber === daysSinceStart
      );

      if (existingQuests.length === 0) {
        const dailyTemplates = getCampaignDailyQuests(campaign.title, daysSinceStart);
        const expiresAt = new Date(now.getTime() + msPerDay);

        for (const template of dailyTemplates) {
          await this.createQuest({
            userId,
            title: template.title || "Daily Quest",
            description: template.description || "Quest",
            difficulty: template.difficulty || campaign.difficulty,
            rewardXP: template.rewardXP || 50,
            rewardCoins: 20,
            type: "daily",
            campaignId: campaign.id,
            dayNumber: daysSinceStart,
            content: template.content || null,
            expiresAt: expiresAt,
            dueAt: expiresAt,
            rewardStats: template.rewardStats || null,
            parentQuestId: null,
            isBoss: false,
            bossHealth: null,
            bossMaxHealth: null
          });
        }
      }
    }
  }

  // --- Implementation of IStorage Methods (In-Memory) ---

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByFirebaseUid(firebaseUid: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(u => u.firebaseUid === firebaseUid);
  }

  async isUserDeleted(firebaseUid: string): Promise<boolean> {
    return this.deletedUids.has(firebaseUid);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = {
      id,
      ...insertUser,
      name: insertUser.name,
      firebaseUid: insertUser.firebaseUid,
      email: insertUser.email,
      avatarUrl: insertUser.avatarUrl || null,
      createdAt: new Date(),
      level: 1,
      xp: 0,
      tier: "D",
      streak: 0,
      lastActive: new Date(),
      strength: 10, agility: 10, stamina: 10, vitality: 10, intelligence: 10, willpower: 10, charisma: 10,
      coins: 100,
      guildId: null,
      theme: "default",
      activeBadgeId: null,
      activeTitle: null,
      assessmentData: null,
      currentGoal: null,
      studySubject: null,
      studyAvailability: null,
      notificationsEnabled: true,
      notificationTime: 9,
      onboardingCompleted: insertUser.onboardingCompleted ?? false,
      isPremium: insertUser.isPremium ?? false,
      premiumExpiry: insertUser.premiumExpiry ?? null,
      lastNotificationSent: null,
      timezone: insertUser.timezone || "UTC",
      lastPremiumBonusAt: null,
      stripeCustomerId: null,
      role: "user"
    };
    this.users.set(id, user);
    this.autoSave();
    return user;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User> {
    const user = this.users.get(id);
    if (!user) throw new Error("User not found");
    const updatedUser = { ...user, ...updates };
    this.users.set(id, updatedUser);
    this.autoSave();
    return updatedUser;
  }

  // Guild War operations (MemStorage)
  async getActiveGuildWar(guildId: string): Promise<GuildWar | undefined> {
    return Array.from(this.guildWars.values()).find(
      w => (w.guild1Id === guildId || w.guild2Id === guildId) && w.status === "active"
    );
  }

  async getGuildWar(warId: string): Promise<GuildWar | undefined> {
    return this.guildWars.get(warId);
  }

  async getWarParticipants(warId: string): Promise<(GuildWarParticipant & { user: User })[]> {
    const participants = Array.from(this.guildWarParticipants.values()).filter(p => p.warId === warId);
    return participants.map(p => {
      const user = this.users.get(p.userId);
      if (!user) throw new Error(`User ${p.userId} not found`);
      return { ...p, user };
    });
  }

  async getWarEvents(warId: string): Promise<GuildWarEvent[]> {
    return Array.from(this.guildWarEvents.values())
      .filter(e => e.warId === warId)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  async getGuildWarHistory(guildId: string): Promise<GuildWar[]> {
    return Array.from(this.guildWars.values())
      .filter(w => (w.guild1Id === guildId || w.guild2Id === guildId) && w.status === "completed")
      .sort((a, b) => b.endDate.getTime() - a.endDate.getTime());
  }

  async logWarContribution(contribution: { warId: string, userId: string, guildId: string, eventType: string, points: number, description: string }): Promise<void> {
    const war = this.guildWars.get(contribution.warId);
    if (!war || war.status !== "active") return;

    // Create event
    const eventId = randomUUID();
    const event: GuildWarEvent = {
      id: eventId,
      warId: contribution.warId,
      userId: contribution.userId,
      guildId: contribution.guildId,
      eventType: contribution.eventType,
      points: contribution.points,
      description: contribution.description,
      timestamp: new Date()
    };
    this.guildWarEvents.set(eventId, event);

    // Update war score
    if (war.guild1Id === contribution.guildId) {
      war.guild1Score += contribution.points;
    } else if (war.guild2Id === contribution.guildId) {
      war.guild2Score += contribution.points;
    }
    this.guildWars.set(war.id, war);

    // Update participant stats
    const participantKey = Array.from(this.guildWarParticipants.keys()).find(k => {
      const p = this.guildWarParticipants.get(k);
      return p?.warId === contribution.warId && p?.userId === contribution.userId;
    });

    if (participantKey) {
      const p = this.guildWarParticipants.get(participantKey)!;
      p.pointsContributed += contribution.points;
      if (contribution.eventType === "quest_complete") p.questsCompleted += 1;
      if (contribution.eventType === "focus_session") p.focusMinutes += Math.floor(contribution.points); // Assuming points = minutes for focus
      p.updatedAt = new Date();
      this.guildWarParticipants.set(participantKey, p);
    } else {
      const id = randomUUID();
      this.guildWarParticipants.set(id, {
        id,
        warId: contribution.warId,
        userId: contribution.userId,
        guildId: contribution.guildId,
        pointsContributed: contribution.points,
        questsCompleted: contribution.eventType === "quest_complete" ? 1 : 0,
        focusMinutes: contribution.eventType === "focus_session" ? contribution.points : 0,
        updatedAt: new Date()
      });
    }

    this.autoSave();
  }

  async findOrCreateGuildWarMatch(guildId: string): Promise<GuildWar> {
    const guild = this.guilds.get(guildId);
    if (!guild) throw new Error("Guild not found");

    // Look for other guilds in matchmaking status (in a real app this would be more complex)
    // For now, let's find a guild of similar level that isn't already in a war
    const opponent = Array.from(this.guilds.values()).find(g =>
      g.id !== guildId &&
      Math.abs(g.level - guild.level) <= 2 &&
      !Array.from(this.guildWars.values()).some(w => (w.guild1Id === g.id || w.guild2Id === g.id) && w.status === "active")
    );

    if (!opponent) {
      throw new Error("No suitable opponent found in matchmaking. Please try again later.");
    }

    const id = randomUUID();
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(startDate.getDate() + 7); // 7 day war

    const war: GuildWar = {
      id,
      season: 1,
      status: "active",
      guild1Id: guildId,
      guild2Id: opponent.id,
      guild1Score: 0,
      guild2Score: 0,
      winnerId: null,
      startDate,
      endDate,
      rewards: {
        winnerGuildXP: 5000,
        winnerGuildCoins: 2000,
        winnerMemberXP: 500,
        winnerMemberCoins: 200,
        loserGuildXP: 2000,
        loserGuildCoins: 500,
        loserMemberXP: 200,
        loserMemberCoins: 50
      },
      createdAt: new Date()
    };

    this.guildWars.set(id, war);
    this.autoSave();
    return war;
  }

  async updateGuildWar(warId: string, updates: Partial<GuildWar>): Promise<GuildWar> {
    const war = this.guildWars.get(warId);
    if (!war) throw new Error("Guild war not found");
    const updated = { ...war, ...updates };
    this.guildWars.set(warId, updated);
    this.autoSave();
    return updated;
  }

  // Premium Request operations
  async createPremiumRequest(request: InsertPremiumRequest): Promise<PremiumRequest> {
    const id = randomUUID();
    const newRequest: PremiumRequest = {
      ...request,
      id,
      status: "pending",
      adminNotes: request.adminNotes || null,
      createdAt: new Date(),
      resolvedAt: null,
    };
    this.premiumRequests.set(id, newRequest);
    this.autoSave();
    return newRequest;
  }

  async getPendingPremiumRequests(): Promise<(PremiumRequest & { user: User })[]> {
    return Array.from(this.premiumRequests.values())
      .filter(r => r.status === "pending")
      .map(r => ({
        ...r,
        user: this.users.get(r.userId)!
      }));
  }

  async getAllPremiumRequests(): Promise<(PremiumRequest & { user: User })[]> {
    return Array.from(this.premiumRequests.values())
      .map(r => ({
        ...r,
        user: this.users.get(r.userId)!
      }))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async updatePremiumRequestStatus(id: string, status: "approved" | "rejected", adminNotes?: string): Promise<PremiumRequest> {
    const request = this.premiumRequests.get(id);
    if (!request) throw new Error("Premium request not found");

    request.status = status;
    request.adminNotes = adminNotes || null;
    request.resolvedAt = new Date();

    this.premiumRequests.set(id, request);
    this.autoSave();
    return request;
  }

  async getUserPremiumRequests(userId: string): Promise<PremiumRequest[]> {
    return Array.from(this.premiumRequests.values()).filter(r => r.userId === userId);
  }


  async deleteUser(id: string): Promise<void> {
    const user = this.users.get(id);
    if (user) this.deletedUids.add(user.firebaseUid);
    this.users.delete(id);
    this.autoSave();
  }

  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  async getQuest(id: string): Promise<Quest | undefined> {
    return this.quests.get(id);
  }

  async getUserQuests(userId: string): Promise<Quest[]> {
    return Array.from(this.quests.values()).filter(q => q.userId === userId);
  }

  // Task Methods
  async getTasks(userId: string): Promise<Task[]> {
    return Array.from(this.tasks.values()).filter(t => t.userId === userId);
  }

  async createTask(insertTask: InsertTask): Promise<Task> {
    const id = randomUUID();
    const task: Task = {
      id,
      ...insertTask,
      createdAt: new Date(),
      completed: insertTask.completed || false
    };
    this.tasks.set(id, task);
    return task;
  }

  async updateTask(id: string, updates: Partial<Task>): Promise<Task> {
    const task = this.tasks.get(id);
    if (!task) throw new Error("Task not found");
    const updated = { ...task, ...updates };
    this.tasks.set(id, updated);
    return updated;
  }

  async deleteTask(id: string): Promise<void> {
    this.tasks.delete(id);
  }

  // Weekly Stats
  async getUserWeeklyStats(userId: string): Promise<{ date: string; xp: number }[]> {
    const now = new Date();
    const stats: { date: string; xp: number }[] = [];

    // Initialize last 7 days
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dateStr = d.toLocaleDateString('en-US', { weekday: 'short' });
      stats.push({ date: dateStr, xp: 0 });
    }

    // Since activityHistory is not tracked in MemStorage fully in this snippets context (using separate map?), 
    // we will mock return simpler based on quests if available, or just empty for MemStorage as it's dev only usually.
    // However, existing MemStorage has activities map? Let's check.
    // MemStorage has `activities` map.
    const userActivities = Array.from(this.activities.values())
      .filter(a => a.userId === userId);

    userActivities.forEach(activity => {
      // Logic to bucket by day would go here, 
      // but simplistic approach for MemStorage: return random/mock or calculate
      // Let's implement basic calculation
      const dayName = new Date(activity.timestamp).toLocaleDateString('en-US', { weekday: 'short' });
      const dayStat = stats.find(s => s.date === dayName);
      if (dayStat) {
        dayStat.xp += activity.xpDelta;
      }
    });

    return stats;
  }

  async createQuest(insertQuest: InsertQuest): Promise<Quest> {
    const id = randomUUID();
    const quest: Quest = {
      id,
      ...insertQuest,
      createdAt: new Date(),
      completed: false,
      completedAt: null,
      campaignId: null,
      parentQuestId: null,
      isBoss: false,
      bossHealth: null,
      bossMaxHealth: null,
      difficulty: insertQuest.difficulty || "normal",
      rewardCoins: insertQuest.rewardCoins || 0,
      rewardStats: insertQuest.rewardStats || null,
      content: insertQuest.content || null,
      dayNumber: insertQuest.dayNumber || null,
      expiresAt: insertQuest.expiresAt || null,
    };
    this.quests.set(id, quest);
    this.autoSave();
    return quest;
  }

  async updateQuest(id: string, updates: Partial<Quest>): Promise<Quest> {
    const quest = this.quests.get(id);
    if (!quest) throw new Error("Quest not found");
    const updated = { ...quest, ...updates };
    this.quests.set(id, updated);
    this.autoSave();
    return updated;
  }

  async deleteQuest(id: string): Promise<void> {
    this.quests.delete(id);
    this.autoSave();
  }

  async getActivity(id: string): Promise<Activity | undefined> {
    return this.activities.get(id);
  }

  async getUserActivities(userId: string): Promise<Activity[]> {
    return Array.from(this.activities.values())
      .filter(a => a.userId === userId)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  async createActivity(insertActivity: InsertActivity): Promise<Activity> {
    const id = randomUUID();
    const activity: Activity = {
      id,
      ...insertActivity,
      questId: insertActivity.questId || null,
      xpDelta: insertActivity.xpDelta || 0,
      coinsDelta: insertActivity.coinsDelta || 0,
      statDeltas: insertActivity.statDeltas || null,
      timestamp: new Date()
    };
    this.activities.set(id, activity);

    // Update rivalry scores
    if ((activity.xpDelta || 0) > 0) {
      const activeRivalries = Array.from(this.rivalries.values()).filter(r =>
        (r.challengerId === activity.userId || r.defenderId === activity.userId) &&
        r.status === "active"
      );

      for (const rivalry of activeRivalries) {
        if (rivalry.challengerId === activity.userId) {
          rivalry.challengerScore += (activity.xpDelta || 0);
        } else {
          rivalry.defenderScore += (activity.xpDelta || 0);
        }
        this.rivalries.set(rivalry.id, rivalry);
      }
    }

    this.autoSave();
    return activity;
  }

  async getRankTrial(id: string): Promise<RankTrial | undefined> {
    return this.rankTrials.get(id);
  }

  async getUserRankTrials(userId: string): Promise<RankTrial[]> {
    return Array.from(this.rankTrials.values()).filter(t => t.userId === userId);
  }

  async createRankTrial(insertTrial: InsertRankTrial): Promise<RankTrial> {
    const id = randomUUID();
    const trial: RankTrial = {
      id,
      ...insertTrial,
      completed: false,
      completedAt: null,
      createdAt: new Date()
    };
    this.rankTrials.set(id, trial);
    this.autoSave();
    return trial;
  }

  async updateRankTrial(id: string, updates: Partial<RankTrial>): Promise<RankTrial> {
    const trial = this.rankTrials.get(id);
    if (!trial) throw new Error("Trial not found");
    const updated = { ...trial, ...updates };
    this.rankTrials.set(id, updated);
    this.autoSave();
    return updated;
  }

  async getShopItems(): Promise<ShopItem[]> {
    return Array.from(this.shopItems.values());
  }

  async getShopItem(id: string): Promise<ShopItem | undefined> {
    return this.shopItems.get(id);
  }

  async createShopItem(item: InsertShopItem): Promise<ShopItem> {
    const id = randomUUID();
    const shopItem: ShopItem = {
      id,
      ...item,
      createdAt: new Date(),
      isPremium: item.isPremium ?? false,
      rarity: item.rarity ?? "common"
    };
    this.shopItems.set(id, shopItem);
    this.autoSave();
    return shopItem;
  }

  async getUserItems(userId: string): Promise<UserItem[]> {
    return Array.from(this.userItems.values()).filter(i => i.userId === userId);
  }

  async createUserItem(item: InsertUserItem): Promise<UserItem> {
    const id = randomUUID();
    const userItem: UserItem = {
      id, ...item, equipped: false, acquiredAt: new Date()
    };
    this.userItems.set(id, userItem);
    this.autoSave();
    return userItem;
  }

  async updateUserItem(id: string, updates: Partial<UserItem>): Promise<UserItem> {
    const item = this.userItems.get(id);
    if (!item) throw new Error("Item not found");
    const updated = { ...item, ...updates };
    this.userItems.set(id, updated);
    this.autoSave();
    return updated;
  }

  async getGuild(id: string): Promise<Guild | undefined> {
    return this.guilds.get(id);
  }

  async getAllGuilds(): Promise<Guild[]> {
    return Array.from(this.guilds.values());
  }

  async getGuildMembers(guildId: string): Promise<User[]> {
    return Array.from(this.users.values()).filter(u => u.guildId === guildId);
  }

  async createGuild(insertGuild: InsertGuild): Promise<Guild> {
    const id = randomUUID();
    const guild: Guild = {
      id,
      ...insertGuild,
      description: insertGuild.description ?? null,
      avatarUrl: null,
      createdAt: new Date(),
      level: 1, xp: 0, memberCount: 0, maxMembers: 50, isPublic: true, vicePresidentIds: [],
      treasury: 0, activePerks: []
    };
    this.guilds.set(id, guild);
    this.autoSave();
    return guild;
  }

  async updateGuild(id: string, updates: Partial<Guild>): Promise<Guild> {
    const guild = this.guilds.get(id);
    if (!guild) throw new Error("Guild not found");
    const updated = { ...guild, ...updates };
    this.guilds.set(id, updated);
    this.autoSave();
    return updated;
  }

  async deleteGuild(id: string): Promise<void> {
    this.guilds.delete(id);
    this.autoSave();
  }

  async addGuildMessage(message: any): Promise<any> {
    const id = `msg_${Date.now()}`;
    // Ensure content is stored as 'content' to match schema/DB
    const content = message.content || message.message;

    // Fetch user for enrichment
    const user = this.users.get(message.userId);

    const msg = {
      id,
      guildId: message.guildId,
      userId: message.userId,
      content: content,
      type: message.type || "chat",
      createdAt: new Date()
    };

    this.guildMessages.set(id, msg);
    this.autoSave();

    // Return with adaptable fields for frontend and enriched user info
    return {
      ...msg,
      message: content, // Frontend expects 'message'
      userName: user?.name || "Unknown",
      userAvatar: user?.avatarUrl
    };
  }

  async getGuildMessages(guildId: string): Promise<any[]> {
    const msgs = Array.from(this.guildMessages.values())
      .filter(m => m.guildId === guildId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, 50);

    // Enrich with user info and frontend mapping
    return msgs.map(msg => {
      const user = this.users.get(msg.userId);
      return {
        ...msg,
        message: msg.content, // Frontend expects 'message'
        userName: user?.name || "Unknown",
        userAvatar: user?.avatarUrl
      };
    });
  }

  async getAllGuildMessages(): Promise<any[]> {
    return Array.from(this.guildMessages.values());
  }

  async saveCredentials(username: string, passwordHash: string, password: string, userId: string): Promise<void> {
    this.userCredentials.set(username.toLowerCase(), { username, passwordHash, userId });
    this.autoSave();
  }

  async getCredentialsByUsername(username: string): Promise<{ username: string; passwordHash: string; userId: string } | undefined> {
    return this.userCredentials.get(username.toLowerCase());
  }

  async usernameExists(username: string): Promise<boolean> {
    return this.userCredentials.has(username.toLowerCase());
  }

  async getAllCredentials(): Promise<{ username: string; passwordHash: string; userId: string }[]> {
    return Array.from(this.userCredentials.values());
  }

  async createFocusSession(insertSession: InsertFocusSession): Promise<FocusSession> {
    const id = randomUUID();
    const session: FocusSession = {
      id,
      ...insertSession,
      task: insertSession.task || null,
      backgroundType: insertSession.backgroundType || null,
      completedAt: new Date(),
    };
    this.focusSessions.set(id, session);
    this.autoSave();
    return session;
  }

  async getUserFocusSessions(userId: string): Promise<FocusSession[]> {
    return Array.from(this.focusSessions.values())
      .filter(s => s.userId === userId)
      .sort((a, b) => b.completedAt.getTime() - a.completedAt.getTime());
  }

  async getAllFocusSessions(): Promise<(FocusSession & { user: User })[]> {
    const sessions = Array.from(this.focusSessions.values())
      .sort((a, b) => b.completedAt.getTime() - a.completedAt.getTime());
    return await Promise.all(sessions.map(async s => {
      const user = await this.getUser(s.userId);
      return { ...s, user: user! };
    }));
  }

  async getFocusSessionStats(userId: string): Promise<{ totalMinutes: number; totalXP: number; sessionCount: number }> {
    const sessions = await this.getUserFocusSessions(userId);
    return {
      totalMinutes: sessions.reduce((sum, s) => sum + s.duration, 0),
      totalXP: sessions.reduce((sum, s) => sum + s.xpEarned, 0),
      sessionCount: sessions.length,
    };
  }

  async createNotification(insertNotification: InsertNotification): Promise<Notification> {
    const id = randomUUID();
    const notification: Notification = {
      id,
      ...insertNotification,
      read: false,
      createdAt: new Date(),
    };
    this.notifications.set(id, notification);
    this.autoSave();
    return notification;
  }

  async getUserNotifications(userId: string): Promise<Notification[]> {
    return Array.from(this.notifications.values())
      .filter(n => n.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async markNotificationAsRead(notificationId: string): Promise<void> {
    const n = this.notifications.get(notificationId);
    if (n) {
      n.read = true;
      this.autoSave();
    }
  }

  async getAdminNotificationHistory(): Promise<any[]> {
    return Array.from(this.notifications.values()).filter(n =>
      ["admin", "announcement", "update", "event"].includes(n.type)
    );
  }

  async createMessage(insertMessage: InsertMessage): Promise<Message> {
    const id = randomUUID();
    const message: Message = {
      id,
      userId: insertMessage.userId,
      content: insertMessage.content,
      createdAt: new Date(),
    };
    this.messages.set(id, message);
    this.autoSave();
    return message;
  }

  async getMessages(limit = 50): Promise<(Message & { user: User })[]> {
    const msgs = Array.from(this.messages.values())
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
      .slice(-limit);

    return Promise.all(msgs.map(async m => {
      const user = await this.getUser(m.userId) || { id: "deleted", name: "Deleted", avatarUrl: null } as User;
      return { ...m, user };
    }));
  }

  async purchaseItem(userId: string, itemId: string): Promise<UserItem> {
    const user = await this.getUser(userId);
    const item = await this.getShopItem(itemId);
    if (!user || !item) throw new Error("User or Item not found");
    if (user.coins < item.cost) throw new Error("Insufficient coins");

    const updatedUser = { ...user, coins: user.coins - item.cost };
    this.users.set(userId, updatedUser);

    const userItem = await this.createUserItem({ userId, itemId });
    this.autoSave();
    return userItem;
  }

  async equipItem(userId: string, itemId: string, type: 'title' | 'badge' | 'theme'): Promise<User> {
    const user = await this.getUser(userId);
    const userItems = await this.getUserItems(userId);
    const shopItem = await this.getShopItem(itemId);

    // Check if user actually owns this item
    const ownsItem = userItems.some(ui => ui.itemId === itemId);

    if (!user || !ownsItem || !shopItem) throw new Error("Item not found or not owned");

    let updates: Partial<User> = {};
    if (type === 'title') updates.activeTitle = shopItem.name;
    if (type === 'badge') updates.activeBadgeId = shopItem.value;
    if (type === 'theme') updates.theme = shopItem.value;

    const updated = { ...user, ...updates };
    this.users.set(userId, updated);
    this.autoSave();
    return updated;
  }

  async awardCoins(userId: string, amount: number): Promise<User> {
    const user = this.users.get(userId);
    if (!user) throw new Error("User not found");
    const updated = { ...user, coins: user.coins + amount };
    this.users.set(userId, updated);
    this.autoSave();
    return updated;
  }

  async createPartnership(user1Id: string, user2Id: string): Promise<Partnership> {
    const id = randomUUID();
    const p: Partnership = {
      id, user1Id, user2Id, status: "pending", createdAt: new Date(), acceptedAt: null
    };
    this.partnerships.set(id, p);
    this.autoSave();
    return p;
  }

  async getPartnerships(userId: string): Promise<Partnership[]> {
    return Array.from(this.partnerships.values()).filter(p => p.user1Id === userId || p.user2Id === userId);
  }

  async getAllPartnerships(): Promise<(Partnership & { user1: User; user2: User })[]> {
    const all = Array.from(this.partnerships.values());
    return await Promise.all(all.map(async p => {
      const u1 = await this.getUser(p.user1Id);
      const u2 = await this.getUser(p.user2Id);
      return { ...p, user1: u1!, user2: u2! };
    }));
  }

  async updatePartnership(id: string, updates: Partial<Partnership>): Promise<Partnership> {
    const p = this.partnerships.get(id);
    if (!p) throw new Error("Partnership not found");
    const updated = { ...p, ...updates };
    this.partnerships.set(id, updated);
    this.autoSave();
    return updated;
  }

  async updatePartnershipStatus(id: string, status: string): Promise<Partnership> {
    const p = this.partnerships.get(id);
    if (!p) throw new Error("Not found");
    const updated: Partnership = { ...p, status, acceptedAt: status === "accepted" ? new Date() : p.acceptedAt };
    this.partnerships.set(id, updated);
    this.autoSave();
    return updated;
  }

  async findPotentialPartners(userId: string): Promise<User[]> {
    return Array.from(this.users.values()).filter(u => u.id !== userId);
  }

  async createDirectMessage(insertMessage: InsertDirectMessage): Promise<DirectMessage> {
    const id = randomUUID();
    const dm: DirectMessage = { id, ...insertMessage, read: false, createdAt: new Date() };
    this.directMessages.set(id, dm);
    this.autoSave();
    return dm;
  }

  async getDirectMessages(user1Id: string, user2Id: string): Promise<DirectMessage[]> {
    return Array.from(this.directMessages.values())
      .filter(m => (m.senderId === user1Id && m.receiverId === user2Id) || (m.senderId === user2Id && m.receiverId === user1Id))
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  }


  // --- Persistence Logic ---

  async persist(): Promise<void> {
    if (process.env.VERCEL) return;
    const fs = await import("fs/promises");
    const path = await import("path");
    const data = {
      users: Array.from(this.users.entries()),
      quests: Array.from(this.quests.entries()),
      activities: Array.from(this.activities.entries()),
      rankTrials: Array.from(this.rankTrials.entries()),
      shopItems: Array.from(this.shopItems.entries()),
      userItems: Array.from(this.userItems.entries()),
      guilds: Array.from(this.guilds.entries()),
      deletedUids: Array.from(this.deletedUids),
      userCredentials: Array.from(this.userCredentials.entries()),
      guildMessages: Array.from(this.guildMessages.entries()),
      focusSessions: Array.from(this.focusSessions.entries()),
      notifications: Array.from(this.notifications.entries()),
      messages: Array.from(this.messages.entries()),
      partnerships: Array.from(this.partnerships.entries()),
      directMessages: Array.from(this.directMessages.entries()),
      premiumRequests: Array.from(this.premiumRequests.entries()),
    };
    try {
      const backupDir = path.resolve(process.cwd(), ".backup");
      await fs.mkdir(backupDir, { recursive: true });
      await fs.writeFile(path.join(backupDir, "backup.json"), JSON.stringify(data, null, 2));
      console.log("💾 Data persisted to backup.json");
    } catch (error) {
      console.error("Failed to persist data:", error);
    }
  }

  async createBackup(): Promise<string> {
    if (process.env.VERCEL) return "vercel-unsupported";
    const fs = await import("fs/promises");
    const path = await import("path");
    const now = new Date();
    const timestamp = now.toISOString().replace(/T/, '-').replace(/\..+/, '').replace(/:/g, '-');
    const filename = `backup-${timestamp}.json`;

    const data = {
      users: Array.from(this.users.entries()),
      quests: Array.from(this.quests.entries()),
      activities: Array.from(this.activities.entries()),
      rankTrials: Array.from(this.rankTrials.entries()),
      shopItems: Array.from(this.shopItems.entries()),
      userItems: Array.from(this.userItems.entries()),
      guilds: Array.from(this.guilds.entries()),
      deletedUids: Array.from(this.deletedUids),
      userCredentials: Array.from(this.userCredentials.entries()),
      guildMessages: Array.from(this.guildMessages.entries()),
      focusSessions: Array.from(this.focusSessions.entries()),
      notifications: Array.from(this.notifications.entries()),
      messages: Array.from(this.messages.entries()),
      partnerships: Array.from(this.partnerships.entries()),
      directMessages: Array.from(this.directMessages.entries()),
      premiumRequests: Array.from(this.premiumRequests.entries()),
    };

    try {
      const backupDir = path.resolve(process.cwd(), ".backup");
      await fs.mkdir(backupDir, { recursive: true });
      await fs.writeFile(path.join(backupDir, filename), JSON.stringify(data, null, 2));
      console.log(`💾 Backup created: ${filename}`);
      return filename;
    } catch (error) {
      console.error("Failed to create backup:", error);
      throw error;
    }
  }

  async hydrate(): Promise<void> {
    const fs = await import("fs/promises");
    const path = await import("path");
    try {
      const backupPath = path.resolve(process.cwd(), ".backup", "backup.json");
      const content = await fs.readFile(backupPath, "utf-8");

      // JSON Reviver to safely restore Date objects
      const reviver = (key: string, value: any) => {
        if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(value)) {
          return new Date(value);
        }
        return value;
      };

      const data = JSON.parse(content, reviver);

      this.users = new Map(data.users);
      this.quests = new Map(data.quests);
      this.activities = new Map(data.activities);
      this.rankTrials = new Map(data.rankTrials);
      // DON'T load shopItems from backup - always use DEFAULT_SHOP_ITEMS
      // this.shopItems = new Map(data.shopItems);
      this.userItems = new Map(data.userItems);
      this.guilds = new Map(data.guilds);
      this.deletedUids = new Set(data.deletedUids);
      this.userCredentials = new Map(data.userCredentials);
      this.guildMessages = new Map(data.guildMessages);
      this.focusSessions = new Map(data.focusSessions);
      this.notifications = new Map(data.notifications);
      this.messages = new Map(data.messages);
      this.partnerships = new Map(data.partnerships || []);
      this.directMessages = new Map(data.directMessages || []);
      this.tasks = new Map(data.tasks || []);
      this.premiumRequests = new Map(data.premiumRequests || []);

      console.log(`🌊 Data hydrated from backup.json. Users: ${this.users.size}`);
    } catch (e) {
      console.log("No backup found or failed to load. Starting fresh.");
    }
  }

  private async autoSave() {
    this.persist().catch(err => console.error(err));
  }
}

export class DatabaseStorage implements IStorage {
  constructor() {
    console.log("🗄️ DatabaseStorage initialized");
    this.seedShopItems();
    this.seedCampaigns();
  }

  private async seedCampaigns() {
    console.log("🌱 Seeding campaigns...");
    for (const campaign of CAMPAIGNS_DATA) {
      const existing = await db!.query.campaigns.findFirst({
        where: eq(campaigns.title, campaign.title)
      });

      if (!existing) {
        console.log(`Creating missing campaign: ${campaign.title}`);
        await db!.insert(campaigns).values({
          title: campaign.title,
          description: campaign.description,
          category: campaign.category,
          difficulty: campaign.difficulty,
          durationDays: campaign.durationDays,
          totalQuests: campaign.totalQuests,
          rewardXP: campaign.rewardXP,
          rewardCoins: campaign.rewardCoins,
          imageUrl: campaign.imageUrl || null,
          createdAt: new Date()
        });
      }
    }
  }

  private async seedShopItems() {
    console.log("🌱 Seeding shop items...");
    for (const item of DEFAULT_SHOP_ITEMS) {
      // Check if item exists by value (unique key for themes/badges) or name
      const existing = await db!.query.shopItems.findFirst({
        where: eq(shopItems.value, item.value)
      });

      if (!existing) {
        console.log(`Creating missing shop item: ${item.name}`);
        await this.createShopItem({
          name: item.name,
          description: item.description,
          type: item.type,
          rarity: item.rarity,
          value: item.value,
          cost: item.cost,
          isPremium: item.isPremium || false
        });
      }
    }
  }

  async getUser(id: string): Promise<User | undefined> {
    return await db!.query.users.findFirst({ where: eq(users.id, id) });
  }

  async getUserByFirebaseUid(firebaseUid: string): Promise<User | undefined> {
    return await db!.query.users.findFirst({ where: eq(users.firebaseUid, firebaseUid) });
  }

  async isUserDeleted(firebaseUid: string): Promise<boolean> {
    return false; // Not implemented for DB
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db!.insert(users).values({ ...insertUser, coins: 5000 } as any).returning();
    return user;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User> {
    const [user] = await db!.update(users).set(updates).where(eq(users.id, id)).returning();
    return user;
  }

  async deleteUser(id: string): Promise<void> {
    // Cascade delete manually if needed, but relying on foreign keys
    await db!.delete(users).where(eq(users.id, id));
  }

  async getAllUsers(): Promise<User[]> {
    return await db!.select().from(users);
  }

  async getQuest(id: string): Promise<Quest | undefined> {
    return await db!.query.quests.findFirst({ where: eq(quests.id, id) });
  }

  async getUserQuests(userId: string): Promise<Quest[]> {
    return await db!.select().from(quests).where(eq(quests.userId, userId));
  }

  async createQuest(insertQuest: InsertQuest): Promise<Quest> {
    const [quest] = await db!.insert(quests).values(insertQuest).returning();
    return quest;
  }

  async updateQuest(id: string, updates: Partial<Quest>): Promise<Quest> {
    const [quest] = await db!.update(quests).set(updates).where(eq(quests.id, id)).returning();
    return quest;
  }

  async deleteQuest(id: string): Promise<void> {
    await db!.delete(quests).where(eq(quests.id, id));
  }

  async getActivity(id: string): Promise<Activity | undefined> {
    return await db!.query.activityHistory.findFirst({ where: eq(activities.id, id) });
  }

  async getUserActivities(userId: string): Promise<Activity[]> {
    return await db!.select().from(activities).where(eq(activities.userId, userId)).orderBy(desc(activities.timestamp));
  }

  async createActivity(activity: InsertActivity): Promise<Activity> {
    const [newActivity] = await db!
      .insert(activities)
      .values(activity)
      .returning();

    // Update rivalry scores if XP was gained
    if ((activity.xpDelta || 0) > 0) {
      const activeRivalries = await db!
        .select()
        .from(rivalries)
        .where(
          and(
            or(eq(rivalries.challengerId, activity.userId), eq(rivalries.defenderId, activity.userId)),
            eq(rivalries.status, "active")
          )
        );

      for (const rivalry of activeRivalries) {
        const isChallenger = rivalry.challengerId === activity.userId;
        const updates: Partial<Rivalry> = isChallenger
          ? { challengerScore: rivalry.challengerScore + (activity.xpDelta || 0) }
          : { defenderScore: rivalry.defenderScore + (activity.xpDelta || 0) };

        await db!
          .update(rivalries)
          .set(updates)
          .where(eq(rivalries.id, rivalry.id));
      }
    }

    return newActivity;
  }

  async getRankTrial(id: string): Promise<RankTrial | undefined> {
    return await db!.query.rankTrials.findFirst({ where: eq(rankTrials.id, id) });
  }

  async getUserRankTrials(userId: string): Promise<RankTrial[]> {
    return await db!.select().from(rankTrials).where(eq(rankTrials.userId, userId));
  }

  async createRankTrial(trial: InsertRankTrial): Promise<RankTrial> {
    const [t] = await db!.insert(rankTrials).values(trial).returning();
    return t;
  }

  async updateRankTrial(id: string, updates: Partial<RankTrial>): Promise<RankTrial> {
    const [t] = await db!.update(rankTrials).set(updates).where(eq(rankTrials.id, id)).returning();
    return t;
  }

  async getShopItems(): Promise<ShopItem[]> {
    return await db!.select().from(shopItems);
  }

  async getShopItem(id: string): Promise<ShopItem | undefined> {
    return await db!.query.shopItems.findFirst({ where: eq(shopItems.id, id) });
  }

  async createShopItem(item: InsertShopItem): Promise<ShopItem> {
    const [i] = await db!.insert(shopItems).values(item).returning();
    return i;
  }

  async getUserItems(userId: string): Promise<UserItem[]> {
    return await db!.select().from(userItems).where(eq(userItems.userId, userId));
  }

  async createUserItem(item: InsertUserItem): Promise<UserItem> {
    const [ui] = await db!.insert(userItems).values(item).returning();
    return ui;
  }

  async updateUserItem(id: string, updates: Partial<UserItem>): Promise<UserItem> {
    const [ui] = await db!.update(userItems).set(updates).where(eq(userItems.id, id)).returning();
    return ui;
  }

  async getGuild(id: string): Promise<Guild | undefined> {
    return await db!.query.guilds.findFirst({ where: eq(guilds.id, id) });
  }

  async getAllGuilds(): Promise<Guild[]> {
    return await db!.select().from(guilds);
  }

  async getGuildMembers(guildId: string): Promise<User[]> {
    return await db!.select().from(users).where(eq(users.guildId, guildId));
  }

  async createGuild(guild: InsertGuild): Promise<Guild> {
    const [g] = await db!.insert(guilds).values(guild as any).returning();
    return g;
  }

  async updateGuild(id: string, updates: Partial<Guild>): Promise<Guild> {
    const [g] = await db!.update(guilds).set(updates).where(eq(guilds.id, id)).returning();
    return g;
  }

  async deleteGuild(id: string): Promise<void> {
    await db!.delete(guilds).where(eq(guilds.id, id));
  }

  async addGuildMessage(message: any): Promise<any> {
    const guildMsg: InsertGuildMessage = {
      guildId: message.guildId,
      userId: message.userId,
      content: message.content,
    };
    const [msg] = await db!.insert(guildMessages).values(guildMsg).returning();

    // Fetch user details to return complete object for frontend
    const user = await this.getUser(message.userId);
    return {
      ...msg,
      userName: user?.name || "Unknown",
      userAvatar: user?.avatarUrl,
      message: msg.content, // Frontend expects 'message' property
      type: "chat"
    };
  }

  async getGuildMessages(guildId: string): Promise<any[]> {
    const msgs = await db!.select().from(guildMessages)
      .where(eq(guildMessages.guildId, guildId))
      .orderBy(desc(guildMessages.createdAt))
      .limit(50);

    // Enrich with user details
    const enriched = await Promise.all(msgs.map(async (msg) => {
      const user = await this.getUser(msg.userId);
      return {
        ...msg,
        userName: user?.name || "Unknown",
        userAvatar: user?.avatarUrl,
        message: msg.content, // Frontend expects 'message' property
        type: "chat"
      };
    }));

    return enriched.reverse(); // Return in chronological order
  }



  async getAllGuildMessages(): Promise<any[]> {
    return await db!.select().from(guildMessages);
  }

  async saveCredentials(username: string, passwordHash: string, password: string, userId: string): Promise<void> {
    await db!.insert(credentials).values({ username: username.toLowerCase(), passwordHash, userId });
  }

  async getCredentialsByUsername(username: string): Promise<{ username: string; passwordHash: string; userId: string } | undefined> {
    const cred = await db!.query.credentials.findFirst({ where: eq(credentials.username, username.toLowerCase()) });
    return cred;
  }

  async usernameExists(username: string): Promise<boolean> {
    const cred = await db!.query.credentials.findFirst({ where: eq(credentials.username, username.toLowerCase()) });
    return !!cred;
  }

  async getAllCredentials(): Promise<{ username: string; passwordHash: string; userId: string }[]> {
    const creds = await db!.select().from(credentials);
    return creds;
  }

  async createFocusSession(session: InsertFocusSession): Promise<FocusSession> {
    const [s] = await db!.insert(focusSessions).values(session).returning();
    return s;
  }

  async getUserFocusSessions(userId: string): Promise<FocusSession[]> {
    return await db!.select().from(focusSessions).where(eq(focusSessions.userId, userId));
  }

  async getAllFocusSessions(): Promise<(FocusSession & { user: User })[]> {
    const sessions = await db!.select().from(focusSessions).orderBy(desc(focusSessions.completedAt));
    return await Promise.all(sessions.map(async s => {
      const user = await this.getUser(s.userId);
      return { ...s, user: user! };
    }));
  }

  async getFocusSessionStats(userId: string): Promise<{ totalMinutes: number; totalXP: number; sessionCount: number }> {
    const sessions = await this.getUserFocusSessions(userId);
    return {
      totalMinutes: sessions.reduce((acc, s) => acc + s.duration, 0),
      totalXP: sessions.reduce((acc, s) => acc + s.xpEarned, 0),
      sessionCount: sessions.length
    };
  }

  async createNotification(n: InsertNotification): Promise<Notification> {
    const [notif] = await db!.insert(notifications).values(n).returning();
    return notif;
  }

  async getUserNotifications(userId: string): Promise<Notification[]> {
    return await db!.select().from(notifications).where(eq(notifications.userId, userId)).orderBy(desc(notifications.createdAt));
  }

  async markNotificationAsRead(notificationId: string): Promise<void> {
    await db!.update(notifications).set({ read: true }).where(eq(notifications.id, notificationId));
  }

  async getAdminNotificationHistory(): Promise<any[]> {
    return await db!.select().from(notifications).where(
      and(
        ne(notifications.type, 'quest')
      )
    );
  }

  async createMessage(m: InsertMessage): Promise<Message> {
    const [msg] = await db!.insert(messages).values(m).returning();
    return msg;
  }

  async getMessages(limit = 50): Promise<(Message & { user: User })[]> {
    const results = await db!.select().from(messages).limit(limit).orderBy(desc(messages.createdAt));
    const withUsers = await Promise.all(results.map(async m => {
      const user = await this.getUser(m.userId);
      return { ...m, user: user! };
    }));
    return withUsers.reverse();
  }

  // Rivalry operations
  async createRivalry(rivalry: InsertRivalry): Promise<Rivalry> {
    const [newRivalry] = await db!
      .insert(rivalries)
      .values(rivalry)
      .returning();
    return newRivalry;
  }

  async getRivalries(userId: string): Promise<Rivalry[]> {
    return await db!
      .select()
      .from(rivalries)
      .where(or(eq(rivalries.challengerId, userId), eq(rivalries.defenderId, userId)));
  }

  async getRivalry(id: string): Promise<Rivalry | undefined> {
    const [rivalry] = await db!
      .select()
      .from(rivalries)
      .where(eq(rivalries.id, id));
    return rivalry;
  }

  async updateRivalry(id: string, updates: Partial<Rivalry>): Promise<Rivalry> {
    const [updatedRivalry] = await db!
      .update(rivalries)
      .set(updates)
      .where(eq(rivalries.id, id))
      .returning();
    return updatedRivalry;
  }

  async purchaseItem(userId: string, itemId: string): Promise<UserItem> {
    return await db!.transaction(async (tx) => {
      // 1. Get user & item
      const userRes = await tx.select().from(users).where(eq(users.id, userId));
      const user = userRes[0];
      const itemRes = await tx.select().from(shopItems).where(eq(shopItems.id, itemId));
      const item = itemRes[0];

      if (!user) throw new Error("User not found");
      if (!item) throw new Error("Item not found");

      if (user.coins < item.cost) {
        throw new Error("Insufficient coins");
      }

      // 2. Deduct coins
      const [updatedUser] = await tx
        .update(users)
        .set({ coins: user.coins - item.cost })
        .where(eq(users.id, userId))
        .returning();

      // 3. Add item to inventory
      const [userItem] = await tx
        .insert(userItems)
        .values({
          userId,
          itemId,
          equipped: false,
        })
        .returning();

      return userItem;
    });
  }

  async createGuildQuest(quest: InsertGuildQuest): Promise<GuildQuest> {
    const [newQuest] = await db!.insert(guildQuests).values(quest).returning();
    return newQuest;
  }

  async getGuildQuests(guildId: string): Promise<GuildQuest[]> {
    return await db!
      .select()
      .from(guildQuests)
      .where(eq(guildQuests.guildId, guildId));
  }

  async equipItem(userId: string, itemId: string, type: 'title' | 'badge' | 'theme'): Promise<User> {
    return await db!.transaction(async (tx) => {
      const itemRes = await tx.select().from(shopItems).where(eq(shopItems.id, itemId));
      const item = itemRes[0];
      if (!item) throw new Error("Item not found");

      // Verify ownership
      const ownership = await tx.select().from(userItems).where(and(eq(userItems.userId, userId), eq(userItems.itemId, itemId)));
      if (ownership.length === 0) throw new Error("Item not owned");

      let updates: any = {};
      if (type === 'title') updates.activeTitle = item.name;
      if (type === 'badge') updates.activeBadgeId = item.value;
      if (type === 'theme') updates.theme = item.value;

      const [updatedUser] = await tx.update(users).set(updates).where(eq(users.id, userId)).returning();
      return updatedUser;
    });
  }

  async awardCoins(userId: string, amount: number): Promise<User> {
    const user = await this.getUser(userId);
    if (!user) throw new Error("User not found");
    const [updated] = await db!.update(users).set({ coins: user.coins + amount }).where(eq(users.id, userId)).returning();
    return updated;
  }

  async createPartnership(user1Id: string, user2Id: string): Promise<Partnership> {
    const [p] = await db!.insert(partnerships).values({ user1Id, user2Id, status: "pending" }).returning();
    return p;
  }

  async getPartnerships(userId: string): Promise<Partnership[]> {
    const p1 = await db!.select().from(partnerships).where(eq(partnerships.user1Id, userId));
    const p2 = await db!.select().from(partnerships).where(eq(partnerships.user2Id, userId));
    return [...p1, ...p2];
  }

  async getAllPartnerships(): Promise<(Partnership & { user1: User; user2: User })[]> {
    const all = await db!.select().from(partnerships);
    return await Promise.all(all.map(async p => {
      const u1 = await this.getUser(p.user1Id);
      const u2 = await this.getUser(p.user2Id);
      return { ...p, user1: u1!, user2: u2! };
    }));
  }

  async updatePartnership(id: string, updates: Partial<Partnership>): Promise<Partnership> {
    const [p] = await db!.update(partnerships).set(updates).where(eq(partnerships.id, id)).returning();
    return p;
  }

  async updatePartnershipStatus(id: string, status: string): Promise<Partnership> {
    const updates: any = { status };
    if (status === 'accepted') updates.acceptedAt = new Date();
    const [p] = await db!.update(partnerships).set(updates).where(eq(partnerships.id, id)).returning();
    return p;
  }

  async findPotentialPartners(userId: string, subject?: string, availability?: string): Promise<User[]> {
    return await db!.select().from(users).where(ne(users.id, userId));
  }

  async createDirectMessage(m: InsertDirectMessage): Promise<DirectMessage> {
    const [dm] = await db!.insert(directMessages).values(m).returning();
    return dm;
  }

  async getDirectMessages(u1: string, u2: string): Promise<DirectMessage[]> {
    // Basic fetch
    return await db!.select().from(directMessages);
  }


  async updateGuildQuest(id: string, updates: Partial<GuildQuest>): Promise<GuildQuest> {
    throw new Error("Method not implemented.");
  }

  async contributeToGuildQuest(questId: string, userId: string, amount: number): Promise<void> {
    throw new Error("Method not implemented.");
  }

  async getGuildQuestProgress(questId: string): Promise<GuildQuestProgress[]> {
    return [];
  }

  async getAllGuildPerks(): Promise<GuildPerk[]> {
    return [];
  }

  async purchaseGuildPerk(guildId: string, perkId: string): Promise<void> {
    throw new Error("Method not implemented.");
  }

  async getGuildActivePerks(guildId: string): Promise<GuildPerk[]> {
    return [];
  }

  async donateToGuild(guildId: string, userId: string, amount: number): Promise<GuildDonation> {
    console.log(`[DB] Donate: guild=${guildId} user=${userId} amount=${amount}`);
    return await db!.transaction(async (tx) => {
      // 1. Check user balance
      const userRes = await tx.select().from(users).where(eq(users.id, userId));
      const user = userRes[0];
      if (!user) throw new Error("User not found");

      if (user.coins < amount) {
        throw new Error("Insufficient coins");
      }

      // 2. Check guild
      const guildRes = await tx.select().from(guilds).where(eq(guilds.id, guildId));
      const guild = guildRes[0];
      if (!guild) throw new Error("Guild not found");

      // 3. Deduct from user
      await tx.update(users)
        .set({ coins: user.coins - amount })
        .where(eq(users.id, userId));

      // 4. Calculate boost (if any) - reusing logic similar to MemStorage or simplifying
      // For DB, let's fetch active perks to check for donation boost
      // Note: activePerks is a JSON array of string IDs in the guilds table

      let multiplier = 1;
      if (guild.activePerks && Array.isArray(guild.activePerks)) {
        // We'd need to fetch perks to check effects. 
        // For simplicity in this fix, we'll assume 1x or fetch if critical.
        // Let's do a quick fetch of perks if we want to be 100% accurate, 
        // but performance-wise maybe just add base amount first.

        // To properly implement boost:
        /*
        const perks = await tx.select().from(guildPerks).where(inArray(guildPerks.id, guild.activePerks));
        const boostPerk = perks.find(p => p.effect.startsWith("donation_boost"));
        if (boostPerk) {
            const percent = parseInt(boostPerk.effect.split("_")[2]);
            multiplier = 1 + (percent / 100);
        }
        */
      }

      const finalAmount = Math.floor(amount * multiplier);

      // 5. Add to guild treasury
      const currentTreasury = Number(guild.treasury || 0);
      console.log(`[DB] Updating treasury. Old: ${currentTreasury}, Add: ${finalAmount}`);
      await tx.update(guilds)
        .set({ treasury: currentTreasury + finalAmount })
        .where(eq(guilds.id, guildId));

      // 6. Create donation record
      const [donation] = await tx.insert(guildDonations).values({
        guildId,
        userId,
        amount,
        createdAt: new Date(),
      }).returning();

      return donation;
    });
  }

  async getGuildDonations(guildId: string, limit?: number): Promise<GuildDonation[]> {
    return await db!.select().from(guildDonations)
      .where(eq(guildDonations.guildId, guildId))
      .orderBy(desc(guildDonations.createdAt))
      .limit(limit || 50);
  }

  async getGuildTreasury(guildId: string): Promise<number> {
    const guild = await this.getGuild(guildId);
    return guild?.treasury || 0;
  }

  async persist(): Promise<void> {
    // DB handles persistence
  }

  async createBackup(): Promise<string> {
    if (process.env.VERCEL) return "vercel-unsupported";
    const fs = await import("fs/promises");
    const path = await import("path");
    const now = new Date();
    const timestamp = now.toISOString().replace(/T/, '-').replace(/\..+/, '').replace(/:/g, '-');
    const filename = `backup-${timestamp}.json`;

    // Fetch ALL data tables
    const data = {
      users: await db!.select().from(users),
      quests: await db!.select().from(quests),
      activities: await db!.select().from(activities),
      rankTrials: await db!.select().from(rankTrials),
      shopItems: await db!.select().from(shopItems),
      userItems: await db!.select().from(userItems),
      guilds: await db!.select().from(guilds),
      deletedUids: [], // No table yet
      userCredentials: await db!.select().from(credentials),
      guildMessages: await db!.select().from(guildMessages),
      focusSessions: await db!.select().from(focusSessions),
      notifications: await db!.select().from(notifications),
      messages: await db!.select().from(messages),
      partnerships: await db!.select().from(partnerships),
      directMessages: await db!.select().from(directMessages),
      campaigns: await db!.select().from(campaigns),
      userCampaigns: await db!.select().from(userCampaigns),
      contentLibrary: await db!.select().from(contentLibrary),
      sleepLogs: await db!.select().from(sleepLogs),
      nutritionLogs: await db!.select().from(nutritionLogs),
      habitTracking: await db!.select().from(habitTracking),
    };

    try {
      const backupDir = path.resolve(process.cwd(), ".backup");
      await fs.mkdir(backupDir, { recursive: true });
      await fs.writeFile(path.join(backupDir, filename), JSON.stringify(data, null, 2));
      console.log(`💾 DB Backup created: ${filename}`);
      return filename;
    } catch (error) {
      console.error("Failed to create DB backup:", error);
      throw error;
    }
  }

  async hydrate(): Promise<void> {
    console.warn("Hydration from file to DB not fully supported yet. Use DB tools.");
  }

  // --- Campaign Methods (DB) ---
  async getCampaigns(): Promise<Campaign[]> {
    return await db!.select().from(campaigns);
  }

  async getActiveCampaign(userId: string): Promise<UserCampaign | undefined> {
    // Join with campaign table if needed, but return the UserCampaign details with campaign info implicitly if queried
    // The current usage expects the campaign definition to display title/desc.
    // But strictly returning UserCampaign doesn't include title.
    // The route handler logic might need adjustment if we only return UserCampaign.
    // However, let's stick to returning UserCampaign but maybe we should join or separate.
    // MemStorage returns `this.userCampaigns...` which is UserCampaign.
    // MemStorage `getActiveCampaign` actually returns `campaign | undefined` in the interface?
    // Let's check Interface: `getActiveCampaign(userId: string): Promise<any | undefined>`
    // So we can return a mixed object.

    const result = await db!
      .select({
        id: campaigns.id,
        title: campaigns.title,
        description: campaigns.description,
        category: campaigns.category,
        difficulty: campaigns.difficulty,
        durationDays: campaigns.durationDays,
        rewardXP: campaigns.rewardXP,
        // User Campaign fields
        startedAt: userCampaigns.startedAt,
        questsCompleted: userCampaigns.questsCompleted,
        userId: userCampaigns.userId,
        campaignId: userCampaigns.campaignId,
        completed: userCampaigns.completed
      })
      .from(userCampaigns)
      .innerJoin(campaigns, eq(userCampaigns.campaignId, campaigns.id))
      .where(
        and(
          eq(userCampaigns.userId, userId),
          eq(userCampaigns.completed, false)
        )
      )
      .limit(1);

    return result[0] as any;
  }

  async joinCampaign(userId: string, campaignId: string): Promise<void> {
    const existing = await this.getActiveCampaign(userId);
    if (existing) {
      throw new Error("Already have an active campaign");
    }

    await db!.insert(userCampaigns).values({
      userId,
      campaignId
    });

    await this.checkDailyQuests(userId);
  }

  async checkDailyQuests(userId: string): Promise<void> {
    const activeUC = await db!.query.userCampaigns.findFirst({
      where: and(eq(userCampaigns.userId, userId), eq(userCampaigns.completed, false))
    });

    if (!activeUC) return;

    const campaign = await db!.query.campaigns.findFirst({
      where: eq(campaigns.id, activeUC.campaignId)
    });
    if (!campaign) return;

    const now = new Date();
    const msPerDay = 1000 * 60 * 60 * 24;
    const daysSinceStart = Math.floor((now.getTime() - activeUC.startedAt.getTime()) / msPerDay) + 1;

    if (daysSinceStart > campaign.durationDays) return;

    const existing = await db!.query.quests.findMany({
      where: and(
        eq(quests.userId, userId),
        eq(quests.campaignId, campaign.id),
        eq(quests.dayNumber, daysSinceStart)
      )
    });

    if (existing.length === 0) {
      const dailyTemplates = getCampaignDailyQuests(campaign.title, daysSinceStart);
      const expiresAt = new Date(now);
      expiresAt.setHours(expiresAt.getHours() + 24);

      for (const template of dailyTemplates) {
        await this.createQuest({
          userId,
          title: template.title || "Daily Quest",
          description: template.description || "Quest",
          type: "daily",
          difficulty: template.difficulty || campaign.difficulty,
          rewardXP: template.rewardXP || 50,
          rewardCoins: 20, // Default coins if not specified
          rewardStats: template.rewardStats || null,
          campaignId: campaign.id,
          dayNumber: daysSinceStart,
          content: template.content || null,
          expiresAt: expiresAt,
          dueAt: expiresAt,
          parentQuestId: null,
          isBoss: false,
          bossHealth: null,
          bossMaxHealth: null
        });
      }
    }
  }

  // Task Methods (DB)
  async getTasks(userId: string): Promise<Task[]> {
    return await db!.select().from(tasks).where(eq(tasks.userId, userId));
  }

  async createTask(insertTask: InsertTask): Promise<Task> {
    const id = randomUUID();
    const newTask: Task = {
      id,
      ...insertTask,
      createdAt: new Date(),
      completed: insertTask.completed || false
    };
    await db!.insert(tasks).values(newTask);
    return newTask;
  }

  async updateTask(id: string, updates: Partial<Task>): Promise<Task> {
    const [updated] = await db!
      .update(tasks)
      .set(updates)
      .where(eq(tasks.id, id))
      .returning();
    if (!updated) throw new Error("Task not found");
    return updated;
  }

  async deleteTask(id: string): Promise<void> {
    await db!.delete(tasks).where(eq(tasks.id, id));
  }

  // Guild War operations (DB)
  async getActiveGuildWar(guildId: string): Promise<GuildWar | undefined> {
    return await db!.query.guildWars.findFirst({
      where: and(
        or(eq(guildWars.guild1Id, guildId), eq(guildWars.guild2Id, guildId)),
        eq(guildWars.status, "active")
      )
    });
  }

  async getGuildWar(warId: string): Promise<GuildWar | undefined> {
    return await db!.query.guildWars.findFirst({
      where: eq(guildWars.id, warId)
    });
  }

  async getWarParticipants(warId: string): Promise<(GuildWarParticipant & { user: User })[]> {
    const participants = await db!
      .select()
      .from(guildWarParticipants)
      .where(eq(guildWarParticipants.warId, warId));

    return await Promise.all(participants.map(async p => {
      const user = await this.getUser(p.userId);
      return { ...p, user: user! };
    }));
  }

  async getWarEvents(warId: string): Promise<GuildWarEvent[]> {
    return await db!
      .select()
      .from(guildWarEvents)
      .where(eq(guildWarEvents.warId, warId))
      .orderBy(desc(guildWarEvents.timestamp));
  }

  async getGuildWarHistory(guildId: string): Promise<GuildWar[]> {
    return await db!
      .select()
      .from(guildWars)
      .where(and(
        or(eq(guildWars.guild1Id, guildId), eq(guildWars.guild2Id, guildId)),
        eq(guildWars.status, "completed")
      ))
      .orderBy(desc(guildWars.endDate));
  }

  async logWarContribution(contribution: { warId: string, userId: string, guildId: string, eventType: string, points: number, description: string }): Promise<void> {
    const war = await this.getGuildWar(contribution.warId);
    if (!war || war.status !== "active") return;

    await db!.transaction(async (tx) => {
      // 1. Create event
      await tx.insert(guildWarEvents).values({
        warId: contribution.warId,
        userId: contribution.userId,
        guildId: contribution.guildId,
        eventType: contribution.eventType,
        points: contribution.points,
        description: contribution.description,
      });

      // 2. Update war score
      const isGuild1 = war.guild1Id === contribution.guildId;
      await tx
        .update(guildWars)
        .set({
          [isGuild1 ? 'guild1Score' : 'guild2Score']: (isGuild1 ? war.guild1Score : war.guild2Score) + contribution.points
        })
        .where(eq(guildWars.id, war.id));

      // 3. Update participant stats
      const [participant] = await tx
        .select()
        .from(guildWarParticipants)
        .where(and(
          eq(guildWarParticipants.warId, contribution.warId),
          eq(guildWarParticipants.userId, contribution.userId)
        ));

      if (participant) {
        await tx
          .update(guildWarParticipants)
          .set({
            pointsContributed: participant.pointsContributed + contribution.points,
            questsCompleted: participant.questsCompleted + (contribution.eventType === "quest_complete" ? 1 : 0),
            focusMinutes: participant.focusMinutes + (contribution.eventType === "focus_session" ? contribution.points : 0),
            updatedAt: new Date()
          })
          .where(eq(guildWarParticipants.id, participant.id));
      } else {
        await tx.insert(guildWarParticipants).values({
          warId: contribution.warId,
          userId: contribution.userId,
          guildId: contribution.guildId,
          pointsContributed: contribution.points,
          questsCompleted: contribution.eventType === "quest_complete" ? 1 : 0,
          focusMinutes: contribution.eventType === "focus_session" ? contribution.points : 0,
        });
      }
    });
  }

  async findOrCreateGuildWarMatch(guildId: string): Promise<GuildWar> {
    // Basic matchmaking: find any other guild not in a war
    const allGuildsList = await this.getAllGuilds();
    const guild = allGuildsList.find(g => g.id === guildId);
    if (!guild) throw new Error("Guild not found");

    const wars = await db!.select().from(guildWars).where(eq(guildWars.status, "active"));
    const busyGuildIds = new Set(wars.flatMap(w => [w.guild1Id, w.guild2Id]));

    const opponent = allGuildsList.find(g =>
      g.id !== guildId &&
      !busyGuildIds.has(g.id) &&
      Math.abs(g.level - guild.level) <= 3
    );

    if (!opponent) {
      throw new Error("No suitable opponent found. Please try again later.");
    }

    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(startDate.getDate() + 7);

    const [newWar] = await db!
      .insert(guildWars)
      .values({
        season: 1,
        status: "active",
        guild1Id: guildId,
        guild2Id: opponent.id,
        guild1Score: 0,
        guild2Score: 0,
        startDate,
        endDate,
        rewards: {
          winnerGuildXP: 5000,
          winnerGuildCoins: 2000,
          winnerMemberXP: 500,
          winnerMemberCoins: 200,
          loserGuildXP: 2000,
          loserGuildCoins: 500,
          loserMemberXP: 200,
          loserMemberCoins: 50
        }
      })
      .returning();

    return newWar;
  }

  async updateGuildWar(warId: string, updates: Partial<GuildWar>): Promise<GuildWar> {
    const [updated] = await db!
      .update(guildWars)
      .set(updates)
      .where(eq(guildWars.id, warId))
      .returning();
    if (!updated) throw new Error("Guild war not found");
    return updated;
  }

  // Premium Request operations
  async createPremiumRequest(request: InsertPremiumRequest): Promise<PremiumRequest> {
    const [req] = await db!.insert(premiumRequests).values({
      ...request,
      status: "pending",
      createdAt: new Date(),
    }).returning();
    return req;
  }

  async getPendingPremiumRequests(): Promise<(PremiumRequest & { user: User })[]> {
    const results = await db!
      .select({
        request: premiumRequests,
        user: users,
      })
      .from(premiumRequests)
      .innerJoin(users, eq(premiumRequests.userId, users.id))
      .where(eq(premiumRequests.status, "pending"));

    return results.map(r => ({
      ...r.request,
      user: r.user
    }));
  }

  async getAllPremiumRequests(): Promise<(PremiumRequest & { user: User })[]> {
    const results = await db!
      .select({
        request: premiumRequests,
        user: users,
      })
      .from(premiumRequests)
      .innerJoin(users, eq(premiumRequests.userId, users.id))
      .orderBy(desc(premiumRequests.createdAt));

    return results.map(r => ({
      ...r.request,
      user: r.user
    }));
  }

  async updatePremiumRequestStatus(id: string, status: "approved" | "rejected", adminNotes?: string): Promise<PremiumRequest> {
    const [updated] = await db!
      .update(premiumRequests)
      .set({
        status,
        adminNotes: adminNotes || null,
        resolvedAt: new Date(),
      })
      .where(eq(premiumRequests.id, id))
      .returning();

    if (!updated) throw new Error("Premium request not found");
    return updated;
  }

  async getUserPremiumRequests(userId: string): Promise<PremiumRequest[]> {
    return await db!.select().from(premiumRequests).where(eq(premiumRequests.userId, userId));
  }

  // Weekly Stats (DB)

  async getUserWeeklyStats(userId: string): Promise<{ date: string; xp: number }[]> {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const logs = await db!
      .select()
      .from(activityHistory)
      .where(and(
        eq(activityHistory.userId, userId),
        gt(activityHistory.timestamp, sevenDaysAgo)
      ));

    const stats: { date: string; xp: number }[] = [];
    const now = new Date();

    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dayStr = d.toLocaleDateString('en-US', { weekday: 'short' });

      const dailyXP = logs
        .filter(log => {
          const logDate = new Date(log.timestamp);
          return logDate.getDate() === d.getDate() &&
            logDate.getMonth() === d.getMonth() &&
            logDate.getFullYear() === d.getFullYear();
        })
        .reduce((sum, log) => sum + (log.xpDelta || 0), 0);

      stats.push({ date: dayStr, xp: dailyXP });
    }

    return stats;
  }
}

let _storage: IStorage | null = null;
export const getStorage = (): IStorage => {
  if (!_storage) {
    if (process.env.DATABASE_URL) {
      _storage = new DatabaseStorage();
      console.log("🗄️ Initialized Database Storage");
    } else {
      _storage = new MemStorage();
      console.log("🗄️ Initialized Memory Storage");
    }
  }
  return _storage!;
};
