import React, { useState, useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import { audioEngine } from "@/lib/audio-engine";
import { 
  CofferType, 
  LootItem, 
  LootRarity, 
  COFFER_DEFINITIONS, 
  RARITY_COLORS, 
  generateCofferLoot 
} from "@/lib/coffer-engine";
import { Sparkles, Zap, Shield, Check, Flame, Award, Gift } from "lucide-react";

interface CofferOpeningModalProps {
  isOpen: boolean;
  onClose: () => void;
  cofferType?: CofferType;
  onClaim?: (result: { totalXp: number; totalCoins: number; items: LootItem[] }) => void;
}

export function CofferOpeningModal({
  isOpen,
  onClose,
  cofferType = "vault_of_will",
  onClaim,
}: CofferOpeningModalProps) {
  const [phase, setPhase] = useState<"sealed" | "rumbling" | "opened">("sealed");
  const [lootResult, setLootResult] = useState<{
    highestRarity: LootRarity;
    items: LootItem[];
    totalXp: number;
    totalCoins: number;
  } | null>(null);

  const def = COFFER_DEFINITIONS[cofferType];

  useEffect(() => {
    if (isOpen) {
      setPhase("sealed");
      setLootResult(generateCofferLoot(cofferType));
    }
  }, [isOpen, cofferType]);

  const handleBreach = () => {
    if (phase !== "sealed") return;

    setPhase("rumbling");
    audioEngine.playChestRumble();

    // After 850ms of tension rumble, pop open the chest
    setTimeout(() => {
      setPhase("opened");
      const rarity = lootResult?.highestRarity || "common";
      audioEngine.playLootFanfare(rarity);
    }, 850);
  };

  const handleClaim = () => {
    audioEngine.playTactileClick();
    if (lootResult && onClaim) {
      onClaim(lootResult);
    }
    onClose();
  };

  const highestRarity = lootResult?.highestRarity || "common";
  const rarityConfig = RARITY_COLORS[highestRarity];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md w-[92vw] bg-[#07090F]/95 backdrop-blur-3xl border border-white/10 p-6 text-white rounded-3xl overflow-hidden shadow-2xl">
        {/* Dynamic Background Aura Glow */}
        <div 
          className="absolute inset-0 pointer-events-none transition-all duration-700 opacity-40 blur-[80px]"
          style={{
            background: phase === "opened" 
              ? `radial-gradient(circle at center, ${rarityConfig.glow} 0%, transparent 70%)`
              : `radial-gradient(circle at center, ${def.glowColor} 0%, transparent 60%)`
          }}
        />

        <div className="relative z-10 flex flex-col items-center text-center">
          {/* Header Title */}
          <div className="mb-4">
            <span 
              className="font-mono text-[10px] uppercase tracking-widest font-bold block"
              style={{ color: def.accentColor }}
            >
              ENCLAVE PROTOCOL CACHE // {def.subtitle}
            </span>
            <h2 className="text-xl sm:text-2xl font-black font-display text-white uppercase tracking-tight mt-0.5">
              {def.name}
            </h2>
          </div>

          {/* Center Stage: The Coffer Container */}
          <div className="relative w-64 h-56 flex items-center justify-center my-2 select-none">
            {/* Opening Light Blast */}
            {phase === "opened" && (
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: [0, 1.8, 1.2], opacity: [0, 1, 0.4] }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="absolute w-44 h-44 rounded-full blur-[25px] pointer-events-none"
                style={{ backgroundColor: rarityConfig.glow }}
              />
            )}

            {/* The Animated Coffer SVG Chest */}
            <motion.div
              animate={
                phase === "rumbling"
                  ? {
                      x: [-5, 5, -7, 7, -3, 3, 0],
                      y: [-2, 2, -3, 3, -1, 1, 0],
                      scale: [1, 1.04, 0.98, 1.06, 1],
                    }
                  : phase === "sealed"
                  ? {
                      y: [0, -6, 0],
                    }
                  : {
                      scale: [0.95, 1.02, 1],
                    }
              }
              transition={
                phase === "rumbling"
                  ? { duration: 0.85, repeat: Infinity }
                  : { duration: 3.5, repeat: Infinity, ease: "easeInOut" }
              }
              className="relative cursor-pointer"
              onClick={handleBreach}
            >
              <svg viewBox="0 0 200 180" className="w-48 h-48 filter drop-shadow-[0_15px_30px_rgba(0,0,0,0.8)]">
                <defs>
                  <linearGradient id="chestMetal" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#1e293b" />
                    <stop offset="50%" stopColor="#0f172a" />
                    <stop offset="100%" stopColor="#020617" />
                  </linearGradient>

                  <linearGradient id="glowTrim" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor={def.accentColor} />
                    <stop offset="100%" stopColor="#ffffff" />
                  </linearGradient>
                </defs>

                {/* Chest Base Body */}
                <path
                  d="M25 85 L175 85 L160 160 L40 160 Z"
                  fill="url(#chestMetal)"
                  stroke="#334155"
                  strokeWidth="2.5"
                />

                {/* Energy Conduit Lines */}
                <path d="M50 90 L55 155" stroke={def.accentColor} strokeWidth="2" opacity="0.8" />
                <path d="M150 90 L145 155" stroke={def.accentColor} strokeWidth="2" opacity="0.8" />
                <path d="M100 100 L100 155" stroke={def.accentColor} strokeWidth="2.5" opacity="0.9" />

                {/* Chest Lid - Closed or Opened */}
                {phase === "opened" ? (
                  /* Opened Lid Swung Back */
                  <g transform="translate(0, -35)">
                    <path
                      d="M30 45 L170 45 L180 70 L20 70 Z"
                      fill="url(#chestMetal)"
                      stroke={def.accentColor}
                      strokeWidth="2"
                    />
                    <ellipse cx="100" cy="70" rx="70" ry="12" fill={rarityConfig.glow} opacity="0.6" />
                  </g>
                ) : (
                  /* Sealed Closed Lid */
                  <path
                    d="M20 85 L180 85 L165 45 L35 45 Z"
                    fill="url(#chestMetal)"
                    stroke={def.accentColor}
                    strokeWidth="2"
                  />
                )}

                {/* Core Enclave Lock / Seal */}
                <circle
                  cx="100"
                  cy="90"
                  r="14"
                  fill="#0B111D"
                  stroke={phase === "opened" ? rarityConfig.glow : def.accentColor}
                  strokeWidth="2"
                />
                <polygon
                  points="100,82 108,94 92,94"
                  fill={phase === "opened" ? "#ffffff" : def.accentColor}
                  className={phase === "rumbling" ? "animate-ping" : ""}
                />
              </svg>

              {/* Pulsing prompt badge when sealed */}
              {phase === "sealed" && (
                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 whitespace-nowrap">
                  <Badge 
                    className="font-mono text-[10px] uppercase font-bold animate-pulse px-3 py-1 shadow-lg"
                    style={{
                      backgroundColor: `${def.accentColor}22`,
                      borderColor: def.accentColor,
                      color: def.accentColor,
                    }}
                  >
                    TAP TO BREACH CACHE
                  </Badge>
                </div>
              )}
            </motion.div>
          </div>

          {/* Phase 3: Loot Manifestation Cards */}
          <AnimatePresence>
            {phase === "opened" && lootResult && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, staggerChildren: 0.1 }}
                className="w-full space-y-2.5 my-3"
              >
                {/* Highest Rarity Seal Announcement */}
                <div className="flex items-center justify-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span className="font-mono text-xs uppercase tracking-widest font-black text-white">
                    {highestRarity.toUpperCase()} CACHE DROP UNLOCKED!
                  </span>
                  <Sparkles className="w-4 h-4 text-amber-400" />
                </div>

                {/* Item List */}
                <div className="space-y-2 max-h-48 overflow-y-auto px-1">
                  {lootResult.items.map((item, idx) => {
                    const itemRarity = RARITY_COLORS[item.rarity];
                    return (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, x: -15 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.12 }}
                        className={`p-3 rounded-2xl border ${itemRarity.border} ${itemRarity.bg} flex items-center justify-between shadow-lg backdrop-blur-md`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{item.icon}</span>
                          <div className="text-left font-mono">
                            <div className="flex items-center gap-1.5">
                              <p className="text-xs font-black text-white">{item.name}</p>
                              {item.isCrit && (
                                <Badge className="bg-amber-500 text-black text-[9px] font-black px-1.5 py-0 leading-none">
                                  CRIT 2X
                                </Badge>
                              )}
                            </div>
                            <p className="text-[10px] text-zinc-400 line-clamp-1">{item.description}</p>
                          </div>
                        </div>

                        {item.value && (
                          <span className="font-mono text-sm font-black text-white">
                            +{item.value}
                          </span>
                        )}
                      </motion.div>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Action Trigger Buttons */}
          <div className="w-full pt-4 border-t border-white/10 mt-2">
            {phase === "sealed" && (
              <Button
                onClick={handleBreach}
                style={{ backgroundColor: def.accentColor, color: "#000000" }}
                className="w-full font-mono text-xs font-black h-11 tracking-wider uppercase shadow-xl hover:opacity-90"
              >
                <Zap className="w-4 h-4 mr-2 text-black" />
                BREACH ENCLAVE CACHE
              </Button>
            )}

            {phase === "rumbling" && (
              <Button
                disabled
                className="w-full bg-zinc-800 text-zinc-400 font-mono text-xs font-black h-11"
              >
                DECRYPTING ENCLAVE CIPHER...
              </Button>
            )}

            {phase === "opened" && (
              <Button
                onClick={handleClaim}
                className="w-full bg-gradient-to-r from-emerald-400 to-green-500 hover:from-emerald-300 hover:to-green-400 text-black font-mono text-xs font-black h-11 tracking-wider uppercase shadow-xl"
              >
                <Check className="w-4 h-4 mr-2 text-black" />
                CLAIM ALL REWARDS
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

