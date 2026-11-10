export interface WorldBoss {
  id: string;
  name: string;
  subtitle: string;
  maxHp: number;
  currentHp: number;
  bossPhase: 1 | 2 | 3;
  enrageTimeRemaining: string; // e.g. "36h 14m"
  bossWeakness: string; // e.g. "Unbroken 90m Air-Gap Sessions deal 2x Critical DMG"
  rewards: {
    title: string;
    xpBonus: number;
    coinsBonus: number;
    cofferType: "grand_auditor";
  };
}

export function calculateBossState(squadMembers: Array<{ totalFocusMinutes?: number; completedMinutes?: number; user?: any }>): WorldBoss {
  const maxHp = 1200; // 1200 total focus minutes required for the 5-member squad
  
  // Calculate total squad focus minutes from all members
  const totalSquadDamage = squadMembers.reduce((acc, m) => {
    const mins = m.completedMinutes || m.totalFocusMinutes || 0;
    return acc + mins;
  }, 0);

  const currentHp = Math.max(0, maxHp - totalSquadDamage);
  const healthPercent = (currentHp / maxHp) * 100;

  let bossPhase: 1 | 2 | 3 = 1;
  if (healthPercent <= 25) {
    bossPhase = 3;
  } else if (healthPercent <= 65) {
    bossPhase = 2;
  }

  // Calculate weekend countdown
  const now = new Date();
  const dayOfWeek = now.getDay(); // 0 is Sunday
  const daysUntilSunday = (7 - dayOfWeek) % 7;
  const hoursUntilMidnight = 24 - now.getHours();
  const enrageStr = `${daysUntilSunday * 24 + hoursUntilMidnight}H REMAINING`;

  return {
    id: "chrono_leviathan_01",
    name: "Chrono-Devourer Leviathan",
    subtitle: "WORLD CLASS ANOMALY // PHASE " + bossPhase,
    maxHp,
    currentHp,
    bossPhase,
    enrageTimeRemaining: enrageStr,
    bossWeakness: "Unbroken 60m+ Air-Gap sessions land 2X CRITICAL STRIKES",
    rewards: {
      title: "Vanquisher of Chronos",
      xpBonus: 500,
      coinsBonus: 250,
      cofferType: "grand_auditor",
    },
  };
}

