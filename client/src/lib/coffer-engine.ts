export type CofferType = "enclave_scout" | "vault_of_will" | "grand_auditor";

export type LootRarity = "common" | "rare" | "epic" | "legendary";

export interface LootItem {
  id: string;
  name: string;
  description: string;
  type: "xp" | "coins" | "consumable" | "relic" | "cosmetic";
  rarity: LootRarity;
  value?: number;
  icon: string;
  isCrit?: boolean;
}

export interface CofferDetails {
  id: CofferType;
  name: string;
  subtitle: string;
  glowColor: string;
  accentColor: string;
  description: string;
}

export const COFFER_DEFINITIONS: Record<CofferType, CofferDetails> = {
  enclave_scout: {
    id: "enclave_scout",
    name: "Enclave Scout Coffer",
    subtitle: "Standard Protocol Reward",
    glowColor: "rgba(6, 182, 212, 0.4)", // Cyan
    accentColor: "#06b6d4",
    description: "Awarded for daily check-in and task completions. Contains tactical supplies, XP, and coins.",
  },
  vault_of_will: {
    id: "vault_of_will",
    name: "Vault of Will Coffer",
    subtitle: "Air-Gap Focus Triumph",
    glowColor: "rgba(168, 85, 247, 0.5)", // Purple
    accentColor: "#a855f7",
    description: "Forged in unbreached Air-Gap chambers. High probability of rare relics and XP surges.",
  },
  grand_auditor: {
    id: "grand_auditor",
    name: "Grand Auditor Coffer",
    subtitle: "Verified Proof-of-Work Seal",
    glowColor: "rgba(245, 158, 11, 0.6)", // Gold
    accentColor: "#f59e0b",
    description: "Conferred upon passing strict proof-of-work audits. Peak chances of Legendary artifacts.",
  },
};

export const RARITY_COLORS: Record<LootRarity, { text: string; bg: string; border: string; glow: string }> = {
  common: {
    text: "text-zinc-300",
    bg: "bg-zinc-800/60",
    border: "border-zinc-500/30",
    glow: "rgba(161, 161, 170, 0.2)",
  },
  rare: {
    text: "text-cyan-400",
    bg: "bg-cyan-950/40",
    border: "border-cyan-500/50",
    glow: "rgba(6, 182, 212, 0.4)",
  },
  epic: {
    text: "text-purple-400",
    bg: "bg-purple-950/40",
    border: "border-purple-500/50",
    glow: "rgba(168, 85, 247, 0.45)",
  },
  legendary: {
    text: "text-amber-400",
    bg: "bg-amber-950/40",
    border: "border-amber-500/60",
    glow: "rgba(245, 158, 11, 0.6)",
  },
};

/**
 * Rolls for loot drop items using variable ratio schedules
 */
export function generateCofferLoot(cofferType: CofferType = "vault_of_will"): {
  highestRarity: LootRarity;
  items: LootItem[];
  totalXp: number;
  totalCoins: number;
} {
  const roll = Math.random();
  let highestRarity: LootRarity = "common";

  // Rarity threshold checks based on coffer tier
  if (cofferType === "grand_auditor") {
    if (roll > 0.92) highestRarity = "legendary";
    else if (roll > 0.70) highestRarity = "epic";
    else if (roll > 0.30) highestRarity = "rare";
  } else if (cofferType === "vault_of_will") {
    if (roll > 0.96) highestRarity = "legendary";
    else if (roll > 0.82) highestRarity = "epic";
    else if (roll > 0.45) highestRarity = "rare";
  } else {
    // enclave_scout
    if (roll > 0.985) highestRarity = "legendary";
    else if (roll > 0.90) highestRarity = "epic";
    else if (roll > 0.65) highestRarity = "rare";
  }

  // 1. Roll XP drop with variable crit surge
  const isCrit = Math.random() < 0.18; // 18% crit chance
  let baseMultiplier = 1;
  if (highestRarity === "legendary") baseMultiplier = 3.5;
  else if (highestRarity === "epic") baseMultiplier = 2.2;
  else if (highestRarity === "rare") baseMultiplier = 1.6;

  const rawXp = Math.floor((50 + Math.random() * 50) * baseMultiplier);
  const totalXp = isCrit ? rawXp * 2 : rawXp;

  // 2. Roll Coins
  const totalCoins = Math.floor((20 + Math.random() * 40) * baseMultiplier);

  const items: LootItem[] = [
    {
      id: "xp-pack",
      name: isCrit ? "CRITICAL FOCUS SURGE (+XP)" : "Ascension XP Essence",
      description: isCrit ? "2X CRITICAL SURGE! High-voltage cognitive XP burst." : "Pure mental discipline crystallized into meta-XP.",
      type: "xp",
      rarity: isCrit ? (highestRarity === "common" ? "rare" : highestRarity) : highestRarity,
      value: totalXp,
      icon: "⚡",
      isCrit,
    },
    {
      id: "coins-pack",
      name: "Tactical Credits",
      description: "Standard currency for Citadel monuments and avatar upgrades.",
      type: "coins",
      rarity: "common",
      value: totalCoins,
      icon: "🪙",
    },
  ];

  // 3. Roll Bonus Relic / Consumable based on rarity
  if (highestRarity === "legendary") {
    items.push({
      id: "aegis-death-protection",
      name: "Aegis Rune of Immortality",
      description: "Legendary consumable. Automatically absorbs one broken streak without penalty.",
      type: "relic",
      rarity: "legendary",
      icon: "🛡️✨",
    });
  } else if (highestRarity === "epic") {
    const epicRoll = Math.random() > 0.5;
    items.push({
      id: epicRoll ? "chrono-overdrive-serum" : "astral-pet-nectar",
      name: epicRoll ? "Chrono Overdrive Serum" : "Astral Pet Nectar",
      description: epicRoll
        ? "Consumable. Grants +50% Intelligence & Willpower XP for the next 2 hours."
        : "Rare treat. Immediately grants your Focus Pet +50 happiness and evolution XP.",
      type: "consumable",
      rarity: "epic",
      icon: epicRoll ? "🧪" : "🐾",
    });
  } else if (highestRarity === "rare") {
    items.push({
      id: "citadel-reinforcement-brick",
      name: "Aetherium Citadel Core",
      description: "Rare building material used to fortify Citadel monuments against degradation.",
      type: "relic",
      rarity: "rare",
      icon: "💎",
    });
  }

  return {
    highestRarity,
    items,
    totalXp,
    totalCoins,
  };
}

