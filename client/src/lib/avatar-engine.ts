import { User } from "@shared/schema";

export type HunterArchetype = 
  | "chrono_sage"     // Intelligence
  | "iron_vanguard"   // Strength & Agility
  | "void_reaver"     // Willpower
  | "bio_aegis"       // Vitality & Stamina
  | "omni_ascendant"; // Balanced / Charisma

export interface ArchetypeDetails {
  id: HunterArchetype;
  name: string;
  tagline: string;
  dominantStat: string;
  primaryColor: string;
  glowColor: string;
  auraCss: string;
  weaponName: string;
  weaponDescription: string;
  lore: string;
}

export const ARCHETYPES: Record<HunterArchetype, ArchetypeDetails> = {
  chrono_sage: {
    id: "chrono_sage",
    name: "Chrono Sage",
    tagline: "Master of Deep Cognitive Distortion",
    dominantStat: "Intelligence",
    primaryColor: "#06b6d4", // Cyan
    glowColor: "rgba(6, 182, 212, 0.4)",
    auraCss: "from-cyan-500/20 via-sky-500/10 to-transparent",
    weaponName: "Quantum Grimoire & Chrono Monocle",
    weaponDescription: "Bends cognitive timelines to compress 4 hours of knowledge work into 90 unbroken minutes.",
    lore: "Forged in the deepest library sanctums, the Chrono Sage consumes complex knowledge architectures at lightspeed.",
  },
  iron_vanguard: {
    id: "iron_vanguard",
    name: "Iron Vanguard",
    tagline: "Unbreakable Kinetic Behemoth",
    dominantStat: "Strength",
    primaryColor: "#ef4444", // Crimson
    glowColor: "rgba(239, 68, 68, 0.4)",
    auraCss: "from-red-500/20 via-rose-500/10 to-transparent",
    weaponName: "Pneumatic Titan Gauntlets",
    weaponDescription: "Harnesses raw physical discipline, shattering physical resistance and mental lethargy.",
    lore: "Where others look for shortcuts, the Vanguard pushes through extreme physical gravity until resistance breaks.",
  },
  void_reaver: {
    id: "void_reaver",
    name: "Void Reaver",
    tagline: "Sovereign of Absolute Will",
    dominantStat: "Willpower",
    primaryColor: "#a855f7", // Purple/Violet
    glowColor: "rgba(168, 85, 247, 0.4)",
    auraCss: "from-purple-500/20 via-indigo-500/10 to-transparent",
    weaponName: "Twin Umbral Daggers",
    weaponDescription: "Sever the threads of cheap algorithmic dopamine and instant gratification.",
    lore: "Operating within hard air-gaps, the Void Reaver remains cold, silent, and entirely unaffected by distraction feeds.",
  },
  bio_aegis: {
    id: "bio_aegis",
    name: "Bio-Aegis",
    tagline: "The Immortal Physiological Anchor",
    dominantStat: "Vitality",
    primaryColor: "#10b981", // Emerald
    glowColor: "rgba(16, 185, 129, 0.4)",
    auraCss: "from-emerald-500/20 via-teal-500/10 to-transparent",
    weaponName: "Crystalline Bio-Shield",
    weaponDescription: "Maintains peak neuro-recovery, flawless circadian rhythms, and inexhaustible stamina.",
    lore: "Built upon relentless sleep hygiene and biological fortification, the Bio-Aegis outlasts every cognitive siege.",
  },
  omni_ascendant: {
    id: "omni_ascendant",
    name: "Omni-Ascendant",
    tagline: "The Harmonized Singularity",
    dominantStat: "All Stats",
    primaryColor: "#f59e0b", // Gold
    glowColor: "rgba(245, 158, 11, 0.4)",
    auraCss: "from-amber-500/20 via-yellow-500/10 to-transparent",
    weaponName: "Orbital Sol Blades",
    weaponDescription: "Perfect equilibrium across physical power, cognitive depth, and relentless willpower.",
    lore: "Rare are those who conquer both body and mind in equal measure. The Omni-Ascendant commands the entire battlefield.",
  },
};

/**
 * Determines the Hunter Archetype based on real-life stat distribution
 */
export function getHunterArchetype(user?: Partial<User> | null): ArchetypeDetails {
  if (!user) return ARCHETYPES.chrono_sage;

  const int = user.intelligence ?? 10;
  const str = user.strength ?? 10;
  const agi = user.agility ?? 10;
  const will = user.willpower ?? 10;
  const vit = user.vitality ?? 10;
  const sta = user.stamina ?? 10;

  const physical = Math.max(str, agi);
  const biological = Math.max(vit, sta);

  // Check if balanced (all core stats within 15% range)
  const stats = [int, physical, will, biological];
  const maxStat = Math.max(...stats);
  const minStat = Math.min(...stats);
  if (maxStat - minStat <= 12 && maxStat > 25) {
    return ARCHETYPES.omni_ascendant;
  }

  // Find dominant stat
  if (int >= physical && int >= will && int >= biological) {
    return ARCHETYPES.chrono_sage;
  }
  if (physical >= int && physical >= will && physical >= biological) {
    return ARCHETYPES.iron_vanguard;
  }
  if (will >= int && will >= physical && will >= biological) {
    return ARCHETYPES.void_reaver;
  }
  return ARCHETYPES.bio_aegis;
}

export type AvatarTier = "D" | "C" | "B" | "A" | "S";

export interface TierVisuals {
  tier: AvatarTier;
  label: string;
  armorName: string;
  effects: string[];
  haloUnlocked: boolean;
  wingsUnlocked: boolean;
  glowIntensity: string;
}

export const TIER_VISUALS: Record<AvatarTier, TierVisuals> = {
  D: {
    tier: "D",
    label: "Initiate",
    armorName: "Neoprene Tactical Hoodie",
    effects: ["Subtle ambient fog"],
    haloUnlocked: false,
    wingsUnlocked: false,
    glowIntensity: "0.2",
  },
  C: {
    tier: "C",
    label: "Awakener",
    armorName: "Polymer Combat Vest & Class Focus Weapon",
    effects: ["Chest core glow", "Class weapon manifestation"],
    haloUnlocked: false,
    wingsUnlocked: false,
    glowIntensity: "0.4",
  },
  B: {
    tier: "B",
    label: "Commander",
    armorName: "Carbon-Fiber Exosuit & Neural Visor",
    effects: ["Full eye visor glow", "Shoulder thrusters", "Pulse aura"],
    haloUnlocked: false,
    wingsUnlocked: false,
    glowIntensity: "0.65",
  },
  A: {
    tier: "A",
    label: "High Hunter",
    armorName: "Aetherium Ornate Armor & Flowing Mantle",
    effects: ["Floating mantles", "Ground energy sigil", "Particle updraft"],
    haloUnlocked: true,
    wingsUnlocked: false,
    glowIntensity: "0.85",
  },
  S: {
    tier: "S",
    label: "Monarch",
    armorName: "Mythic Ascendant Regalia",
    effects: ["Celestial Orbital Halo", "Aura Wings", "Cosmic Starlight Storm"],
    haloUnlocked: true,
    wingsUnlocked: true,
    glowIntensity: "1.0",
  },
};

export function getTierVisuals(tierString?: string | null): TierVisuals {
  const normalized = (tierString?.toUpperCase() || "D") as AvatarTier;
  return TIER_VISUALS[normalized] || TIER_VISUALS.D;
}

