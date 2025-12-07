// Guild enhancement types
export interface GuildMessage {
    id: string;
    guildId: string;
    userId: string;
    userName: string;
    message: string;
    type: 'chat' | 'system' | 'achievement';
    createdAt: Date;
}

export interface GuildQuest {
    id: string;
    guildId: string;
    title: string;
    description: string;
    requiredContributions: number;
    currentContributions: number;
    contributors: string[]; // user IDs
    rewardXP: number;
    rewardCoins: number;
    completed: boolean;
    createdAt: Date;
    completedAt: Date | null;
    expiresAt: Date;
}

export interface GuildPerk {
    id: string;
    name: string;
    description: string;
    requiredLevel: number;
    xpBonus?: number;
    coinBonus?: number;
    questSlots?: number;
}

// Guild perks available at different levels
export const GUILD_PERKS: GuildPerk[] = [
    {
        id: 'perk-1',
        name: 'United We Stand',
        description: '+5% XP for all members',
        requiredLevel: 2,
        xpBonus: 0.05,
    },
    {
        id: 'perk-2',
        name: 'Shared Wealth',
        description: '+10% Coins for all members',
        requiredLevel: 3,
        coinBonus: 0.10,
    },
    {
        id: 'perk-3',
        name: 'Extra Quest Slot',
        description: '+1 daily quest slot',
        requiredLevel: 5,
        questSlots: 1,
    },
    {
        id: 'perk-4',
        name: 'Power of Many',
        description: '+10% XP for all members',
        requiredLevel: 7,
        xpBonus: 0.10,
    },
    {
        id: 'perk-5',
        name: 'Guild Treasury',
        description: '+20% Coins for all members',
        requiredLevel: 10,
        coinBonus: 0.20,
    },
];

// XP required for each guild level
export const GUILD_LEVEL_THRESHOLDS: Record<number, number> = {
    1: 0,
    2: 1000,
    3: 2500,
    4: 5000,
    5: 10000,
    6: 20000,
    7: 35000,
    8: 55000,
    9: 80000,
    10: 100000,
};
