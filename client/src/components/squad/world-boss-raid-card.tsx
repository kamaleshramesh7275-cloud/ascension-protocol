import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "wouter";
import { audioEngine } from "@/lib/audio-engine";
import { calculateBossState } from "@/lib/raid-engine";
import { CofferOpeningModal } from "@/components/rewards/coffer-opening-modal";
import { 
  Skull, Flame, Zap, ShieldAlert, Crosshair, Trophy, 
  Clock, AlertTriangle, Swords, Users, Sparkles 
} from "lucide-react";

interface WorldBossRaidCardProps {
  squadMembers: any[];
  squadName: string;
  onSendPing?: (message: string) => void;
}

export function WorldBossRaidCard({
  squadMembers = [],
  squadName,
  onSendPing,
}: WorldBossRaidCardProps) {
  const [, setLocation] = useLocation();
  const [showRaidLoot, setShowRaidLoot] = useState(false);
  const boss = calculateBossState(squadMembers);

  const hpPercent = Math.round((boss.currentHp / boss.maxHp) * 100);
  const isDefeated = boss.currentHp <= 0;

  // Sort squad members by damage dealt
  const topStrikers = [...squadMembers].sort((a, b) => {
    const aMins = a.completedMinutes || a.totalFocusMinutes || 0;
    const bMins = b.completedMinutes || b.totalFocusMinutes || 0;
    return bMins - aMins;
  });

  return (
    <Card className="obsidian-card border-red-500/30 bg-gradient-to-b from-[#12070A] via-[#0B090E] to-[#07090D] rounded-2xl relative overflow-hidden shadow-2xl">
      {/* Background Boss Energy Gradients */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-red-600/15 via-purple-900/10 to-transparent pointer-events-none" />

      <CardContent className="p-5 sm:p-7 relative z-10 space-y-6">
        {/* Raid Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-red-950/60 border border-red-500/40 flex items-center justify-center text-red-400 shadow-lg shadow-red-500/20">
              <Swords className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <Badge className="bg-red-500/20 text-red-400 border-red-500/40 text-[9px] font-mono uppercase px-2 py-0.5">
                  WEEKLY WORLD RAID // SQUAD COLLABORATIVE COMBAT
                </Badge>
                <span className="font-mono text-[10px] text-zinc-400 flex items-center gap-1">
                  <Clock className="w-3 h-3 text-amber-400" />
                  {boss.enrageTimeRemaining}
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black font-display text-white uppercase tracking-tight mt-1">
                {boss.name}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Badge 
              variant="outline" 
              className={`font-mono text-xs px-2.5 py-1 ${
                isDefeated 
                  ? "border-emerald-500 text-emerald-400 bg-emerald-950/30" 
                  : boss.bossPhase === 3
                  ? "border-red-500 text-red-400 bg-red-950/40 animate-pulse"
                  : "border-purple-500/40 text-purple-400 bg-purple-950/20"
              }`}
            >
              {isDefeated ? "DEFEATED // RAID VICTORY" : `PHASE ${boss.bossPhase} // ENRAGED`}
            </Badge>
          </div>
        </div>

        {/* Center Stage: Boss Avatar & HP Telemetry */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
          {/* Boss Hologram Sprite */}
          <div className="flex flex-col items-center justify-center text-center">
            <motion.div
              animate={
                isDefeated
                  ? { scale: [1, 0.9, 0.95], opacity: 0.4 }
                  : {
                      y: [0, -8, 0],
                      scale: boss.bossPhase === 3 ? [1, 1.05, 1] : [1, 1.02, 1],
                    }
              }
              transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
              className="relative select-none"
            >
              <div className="w-36 h-36 rounded-full bg-gradient-to-b from-red-500/20 via-purple-600/10 to-transparent flex items-center justify-center border border-red-500/30 shadow-[0_0_35px_rgba(239,68,68,0.3)]">
                <span className="text-6xl filter drop-shadow-[0_0_15px_rgba(239,68,68,0.8)]">
                  {isDefeated ? "💀" : boss.bossPhase === 3 ? "👹🔥" : "👾⚡"}
                </span>
              </div>

              {!isDefeated && (
                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2">
                  <Badge className="bg-red-900/80 text-white border-red-500 font-mono text-[9px] px-2 py-0 whitespace-nowrap">
                    1 MIN FOCUS = 1 DAMAGE
                  </Badge>
                </div>
              )}
            </motion.div>
          </div>

          {/* Health Bar & Critical Objective Info */}
          <div className="md:col-span-2 space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-mono font-bold">
                <span className="text-zinc-400 uppercase flex items-center gap-1.5">
                  <Skull className="w-4 h-4 text-red-400" />
                  BOSS INTEGRITY:
                </span>
                <span className={`text-base ${isDefeated ? "text-emerald-400" : "text-red-400"}`}>
                  {boss.currentHp} / {boss.maxHp} HP ({hpPercent}%)
                </span>
              </div>

              <div className="h-4 bg-black/60 rounded-full overflow-hidden border border-white/10 p-0.5 shadow-inner">
                <motion.div
                  className={`h-full rounded-full transition-all duration-700 ${
                    isDefeated
                      ? "bg-emerald-500"
                      : boss.bossPhase === 3
                      ? "bg-gradient-to-r from-red-600 via-rose-500 to-amber-500"
                      : "bg-gradient-to-r from-purple-600 via-red-500 to-rose-400"
                  }`}
                  initial={{ width: "100%" }}
                  animate={{ width: `${hpPercent}%` }}
                />
              </div>
            </div>

            {/* Tactical Weakness Prompt */}
            <div className="p-3 rounded-xl bg-white/[0.03] border border-white/10 text-xs font-mono text-zinc-300 flex items-start gap-2.5">
              <Zap className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
              <div>
                <strong className="text-white">COMBAT PROTOCOL:</strong> {boss.bossWeakness}
              </div>
            </div>

            {/* Squad DPS Contribution */}
            <div className="pt-2">
              <p className="font-mono text-[10px] text-zinc-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                <Users className="w-3 h-3 text-cyan-400" />
                SQUAD STRIKE ROSTER // DAMAGE DEALT:
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {topStrikers.slice(0, 3).map((member, idx) => {
                  const dmg = member.completedMinutes || member.totalFocusMinutes || 0;
                  return (
                    <div 
                      key={idx}
                      className="p-2 rounded-lg bg-black/40 border border-white/5 flex items-center justify-between text-xs font-mono"
                    >
                      <span className="text-zinc-300 truncate max-w-[90px]">
                        {member.user?.name || `Operator #${idx + 1}`}
                      </span>
                      <span className="font-bold text-amber-400">
                        {dmg} DMG
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Combat Action Controls */}
        <div className="pt-4 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-[11px] font-mono text-zinc-400">
            {isDefeated 
              ? "All squad members are eligible to claim Grand Auditor loot."
              : "Every completed Air-Gap session deals immediate damage to the Boss."}
          </p>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            {isDefeated ? (
              <Button
                onClick={() => {
                  audioEngine.playCommandLock();
                  setShowRaidLoot(true);
                }}
                className="w-full sm:w-auto bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-400 hover:to-yellow-500 text-black font-mono text-xs font-black h-10 px-6 shadow-xl flex items-center gap-2"
              >
                <Trophy className="w-4 h-4 text-black" />
                <span>CLAIM GRAND AUDITOR RAID COFFER</span>
              </Button>
            ) : (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    audioEngine.playTactileClick();
                    if (onSendPing) {
                      onSendPing("RALLY CALL: Chrono Leviathan needs 200 DMG! Enter Air-Gap focus now!");
                    }
                  }}
                  className="w-full sm:w-auto border-white/10 bg-white/5 hover:bg-white/10 text-zinc-300 text-xs font-mono h-10"
                >
                  RALLY SQUAD
                </Button>
                <Button
                  size="sm"
                  onClick={() => {
                    audioEngine.playCommandLock();
                    setLocation("/air-gap-focus?missionId=raid_boss_strike");
                  }}
                  className="w-full sm:w-auto bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-400 hover:to-rose-500 text-white font-mono text-xs font-black h-10 px-5 shadow-lg shadow-red-500/20 flex items-center gap-2"
                >
                  <Swords className="w-4 h-4 text-white" />
                  <span>LAUNCH FOCUS STRIKE</span>
                </Button>
              </>
            )}
          </div>
        </div>
      </CardContent>

      {/* Raid Victory Coffer Modal */}
      <CofferOpeningModal
        isOpen={showRaidLoot}
        cofferType="grand_auditor"
        onClose={() => setShowRaidLoot(false)}
        onClaim={(loot) => {
          audioEngine.playCommandLock();
        }}
      />
    </Card>
  );
}

