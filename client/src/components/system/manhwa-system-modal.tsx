import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Shield, Zap, Sparkles, Award, ArrowRight, X, Flame } from "lucide-react";
import { hapticLevelUp, hapticSuccess, hapticShield } from "@/lib/haptics";
import { audioEngine } from "@/lib/audio-engine";

export type ManhwaModalType =
  | "quest_complete"
  | "level_up"
  | "mana_shield"
  | "recovery_day"
  | "rank_awakening";

export type SystemModalType = ManhwaModalType;

export interface ManhwaRewardItem {
  label: string;
  value: string | number;
  icon?: string;
}

export interface ManhwaSystemModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: ManhwaModalType;
  title?: string;
  subtitle?: string;
  message?: string;
  details?: string;
  flavorQuote?: string;
  xpEarned?: number;
  coinsEarned?: number;
  newLevel?: number;
  statPointsAwarded?: number;
  rewards?: ManhwaRewardItem[];
}

export function ManhwaSystemModal({
  isOpen,
  onClose,
  type,
  title,
  subtitle,
  message,
  details,
  flavorQuote,
  xpEarned,
  coinsEarned,
  newLevel,
  statPointsAwarded,
  rewards,
}: ManhwaSystemModalProps) {
  const [typedTitle, setTypedTitle] = useState("");

  const defaultTitle = (() => {
    switch (type) {
      case "level_up":
        return "CONGRATULATIONS: YOU HAVE LEVELED UP";
      case "quest_complete":
        return "QUEST COMPLETION CONFIRMED";
      case "mana_shield":
        return "EMERGENCY PROTOCOL: MANA SHIELD DEPLOYED";
      case "recovery_day":
        return "REST PROTOCOL: CELLULAR REGENERATION";
      case "rank_awakening":
        return "AWAKENING TRIAL ACCOMPLISHED";
      default:
        return "THE SYSTEM HAS ISSUED A DIRECTIVE";
    }
  })();

  const activeTitle = title || defaultTitle;

  useEffect(() => {
    if (!isOpen) {
      setTypedTitle("");
      return;
    }

    // Trigger audio & haptic pulse
    if (type === "level_up" || type === "rank_awakening") {
      hapticLevelUp();
      audioEngine.playLevelUp();
    } else if (type === "mana_shield") {
      hapticShield();
      audioEngine.playChestUnlock();
    } else {
      hapticSuccess();
      audioEngine.playSuccess();
    }

    // Typewriter effect
    let currentIndex = 0;
    const interval = window.setInterval(() => {
      if (currentIndex <= activeTitle.length) {
        setTypedTitle(activeTitle.slice(0, currentIndex));
        currentIndex++;
      } else {
        clearInterval(interval);
      }
    }, 25);

    return () => clearInterval(interval);
  }, [isOpen, activeTitle, type]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md font-mono select-none">
        {/* Holographic Window Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.88, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 15 }}
          transition={{ type: "spring", stiffness: 400, damping: 28 }}
          className="relative w-full max-w-lg bg-[#020617]/95 border-2 border-cyan-500 rounded-2xl p-6 shadow-[0_0_50px_rgba(6,182,212,0.4)] overflow-hidden"
        >
          {/* Scanline Background & Corner Reticles */}
          <div className="absolute inset-0 bg-[linear-gradient(to_bottom,transparent_50%,rgba(0,0,0,0.4)_51%)] bg-[size:100%_4px] pointer-events-none opacity-40" />
          <div className="absolute top-2 left-2 w-3 h-3 border-t-2 border-l-2 border-cyan-300 pointer-events-none" />
          <div className="absolute top-2 right-2 w-3 h-3 border-t-2 border-r-2 border-cyan-300 pointer-events-none" />
          <div className="absolute bottom-2 left-2 w-3 h-3 border-b-2 border-l-2 border-cyan-300 pointer-events-none" />
          <div className="absolute bottom-2 right-2 w-3 h-3 border-b-2 border-r-2 border-cyan-300 pointer-events-none" />

          {/* Header Bar */}
          <div className="flex items-center justify-between pb-3 border-b border-cyan-500/30 text-cyan-400 text-xs">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
              <span className="tracking-widest uppercase font-bold text-[11px]">
                SYSTEM NOTIFICATION // SEC-7
              </span>
            </div>
            <button
              onClick={onClose}
              className="text-cyan-400/60 hover:text-cyan-300 transition-colors p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Main Body */}
          <div className="py-6 text-center space-y-4">
            <div className="mx-auto w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shadow-[0_0_25px_rgba(6,182,212,0.3)]">
              {type === "level_up" ? (
                <Sparkles className="w-9 h-9 animate-bounce" />
              ) : type === "mana_shield" ? (
                <Shield className="w-9 h-9" />
              ) : type === "recovery_day" ? (
                <Flame className="w-9 h-9 text-amber-400" />
              ) : (
                <Award className="w-9 h-9" />
              )}
            </div>

            <div className="space-y-1">
              <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight leading-snug drop-shadow-[0_0_12px_rgba(6,182,212,0.6)]">
                {typedTitle}
                <span className="animate-pulse">_</span>
              </h3>
              {subtitle && (
                <p className="text-xs sm:text-sm text-cyan-300/80 font-medium">{subtitle}</p>
              )}
            </div>

            {/* Level-Up Badge */}
            {newLevel !== undefined && (
              <div className="py-2">
                <div className="inline-block px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500/20 via-blue-500/20 to-cyan-500/20 border border-cyan-400/50">
                  <span className="text-xs text-zinc-400 block uppercase">CURRENT RANK</span>
                  <span className="text-3xl font-black text-cyan-300 tracking-wider">
                    LEVEL {newLevel}
                  </span>
                </div>
              </div>
            )}

            {/* Custom Rewards List */}
            {rewards && rewards.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-2 text-xs">
                {rewards.map((r, idx) => (
                  <div key={idx} className="p-2.5 rounded-xl bg-cyan-950/40 border border-cyan-500/30 flex flex-col items-center justify-center text-center">
                    <span className="text-[10px] text-zinc-400 block uppercase tracking-wider">{r.label}</span>
                    <span className="text-cyan-300 font-bold text-sm mt-0.5 flex items-center gap-1">
                      {r.icon && <span>{r.icon}</span>}
                      <span>{r.value}</span>
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Standard Reward Chips */}
            {(!rewards || rewards.length === 0) && (xpEarned !== undefined || coinsEarned !== undefined || statPointsAwarded !== undefined) && (
              <div className="grid grid-cols-3 gap-2 pt-2 text-xs">
                {xpEarned !== undefined && (
                  <div className="p-2.5 rounded-xl bg-cyan-950/40 border border-cyan-500/30">
                    <span className="text-[10px] text-zinc-400 block">XP GAINED</span>
                    <span className="text-cyan-300 font-bold text-sm">+{xpEarned} XP</span>
                  </div>
                )}
                {coinsEarned !== undefined && (
                  <div className="p-2.5 rounded-xl bg-amber-950/40 border border-amber-500/30">
                    <span className="text-[10px] text-zinc-400 block">COINS</span>
                    <span className="text-amber-300 font-bold text-sm">+{coinsEarned} 🪙</span>
                  </div>
                )}
                {statPointsAwarded !== undefined && (
                  <div className="p-2.5 rounded-xl bg-purple-950/40 border border-purple-500/30">
                    <span className="text-[10px] text-zinc-400 block">STAT PTS</span>
                    <span className="text-purple-300 font-bold text-sm">+{statPointsAwarded}</span>
                  </div>
                )}
              </div>
            )}

            {(message || details) && (
              <p className="text-xs text-zinc-300 bg-black/60 border border-cyan-500/20 p-3.5 rounded-xl leading-relaxed text-left font-mono">
                {message || details}
              </p>
            )}

            {flavorQuote && (
              <p className="text-[11px] text-cyan-400/80 italic border-l-2 border-cyan-500 pl-3 text-left">
                "{flavorQuote}"
              </p>
            )}
          </div>

          {/* Action Button */}
          <div className="pt-2">
            <Button
              type="button"
              onClick={onClose}
              className="w-full h-11 bg-cyan-500 hover:bg-cyan-400 text-black font-bold tracking-wider text-xs shadow-[0_0_20px_rgba(6,182,212,0.4)] flex items-center justify-center gap-2"
            >
              <span>CONFIRM DIRECTIVE</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

