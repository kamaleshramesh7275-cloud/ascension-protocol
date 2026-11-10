import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "wouter";
import { audioEngine } from "@/lib/audio-engine";
import { useToast } from "@/hooks/use-toast";
import { 
  Building2, CheckCircle2, ChevronRight, Lock, 
  Sparkles, Zap, Flame, Shield, Trophy, ArrowRight 
} from "lucide-react";

export interface SpireFloor {
  floor: number;
  name: string;
  category: string;
  requirement: string;
  status: "locked" | "current" | "cleared";
  actionUrl: string;
  actionLabel: string;
}

interface SpireAscentWidgetProps {
  currentStreak?: number;
  completedMinutes?: number;
  hasBriefed?: boolean;
  hasDebriefed?: boolean;
}

export function SpireAscentWidget({
  currentStreak = 1,
  completedMinutes = 0,
  hasBriefed = false,
  hasDebriefed = false,
}: SpireAscentWidgetProps) {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [selectedBoon, setSelectedBoon] = useState<string | null>(() => {
    return localStorage.getItem("ascension_daily_boon") || null;
  });

  // Calculate Floor progression based on real telemetry
  const isFloor1Cleared = hasBriefed;
  const isFloor2Cleared = completedMinutes >= 25;
  const isFloor3Cleared = completedMinutes >= 60;
  const isFloor4Cleared = completedMinutes >= 90;
  const isFloor5Cleared = hasDebriefed;

  const floors: SpireFloor[] = [
    {
      floor: 1,
      name: "Gate of Intent",
      category: "Initialization",
      requirement: "Morning Tactical Briefing",
      status: isFloor1Cleared ? "cleared" : "current",
      actionUrl: "/briefing-room",
      actionLabel: "ENTER GATE",
    },
    {
      floor: 2,
      name: "Kinetic Chamber",
      category: "Velocity",
      requirement: "25+ Min Focus Session",
      status: isFloor2Cleared 
        ? "cleared" 
        : isFloor1Cleared 
        ? "current" 
        : "locked",
      actionUrl: "/air-gap-focus?duration=25",
      actionLabel: "COMMENCE SPRINT",
    },
    {
      floor: 3,
      name: "The Deep Air-Gap",
      category: "Deep Siege",
      requirement: "60+ Min Unbroken Execution",
      status: isFloor3Cleared 
        ? "cleared" 
        : isFloor2Cleared 
        ? "current" 
        : "locked",
      actionUrl: "/air-gap-focus?duration=60",
      actionLabel: "COMMENCE AIR-GAP",
    },
    {
      floor: 4,
      name: "Keystone Barrier",
      category: "High Leverage",
      requirement: "90+ Min Cognitive Density",
      status: isFloor4Cleared 
        ? "cleared" 
        : isFloor3Cleared 
        ? "current" 
        : "locked",
      actionUrl: "/air-gap-focus?duration=90",
      actionLabel: "CONQUER KEYSTONE",
    },
    {
      floor: 5,
      name: "The Sentinel Boss",
      category: "Night Audit",
      requirement: "Evening Debrief & Proof Audit",
      status: isFloor5Cleared 
        ? "cleared" 
        : isFloor4Cleared 
        ? "current" 
        : "locked",
      actionUrl: "/evening-debrief",
      actionLabel: "CONFRONT AUDITOR",
    },
  ];

  const clearedCount = floors.filter(f => f.status === "cleared").length;
  const isSpireConquered = clearedCount === 5;

  const handleSelectBoon = (boonId: string, boonName: string) => {
    audioEngine.playCommandLock();
    setSelectedBoon(boonId);
    localStorage.setItem("ascension_daily_boon", boonId);
    toast({
      title: "ASCENT BOON DRAFTED",
      description: `Buff active: ${boonName}`,
    });
  };

  return (
    <Card className="obsidian-card border-cyan-500/25 bg-gradient-to-b from-[#090C12] via-[#06080D] to-[#040609] rounded-2xl relative overflow-hidden shadow-2xl">
      {/* Background Neon Spire Glow */}
      <div className="absolute top-0 right-1/4 w-72 h-72 bg-cyan-500/10 rounded-full blur-[100px] pointer-events-none" />

      <CardContent className="p-5 sm:p-7 relative z-10 space-y-6">
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-cyan-950/60 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shadow-lg shadow-cyan-500/20">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <Badge className="bg-cyan-500/20 text-cyan-400 border-cyan-500/40 text-[9px] font-mono uppercase px-2 py-0.5">
                  ROGUELIKE DAILY CYCLE // 5-FLOOR TOWER CLIMB
                </Badge>
                <span className="font-mono text-[10px] text-zinc-400">
                  FLOOR {Math.min(5, clearedCount + 1)} OF 5
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black font-display text-white uppercase tracking-tight mt-1">
                The Spire of Ascension
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Badge 
              variant="outline" 
              className={`font-mono text-xs px-2.5 py-1 ${
                isSpireConquered 
                  ? "border-emerald-500 text-emerald-400 bg-emerald-950/30" 
                  : "border-cyan-500/40 text-cyan-400 bg-cyan-950/20"
              }`}
            >
              {isSpireConquered ? "SPIRE CONQUERED ✨" : `${clearedCount} / 5 FLOORS SECURED`}
            </Badge>
          </div>
        </div>

        {/* Daily Boon Draft (Roguelike Relic Selector) */}
        {!selectedBoon && (
          <div className="p-4 rounded-xl bg-cyan-950/30 border border-cyan-500/30 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs font-bold text-cyan-300 uppercase flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-cyan-400" />
                DRAFT DAILY ASCENT BOON:
              </span>
              <span className="text-[10px] font-mono text-zinc-400">SELECT 1 MODIFIER FOR TODAY'S RUN</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <button
                onClick={() => handleSelectBoon("hermes", "Hermes' Draft (+20% Morning Velocity)")}
                className="p-3 rounded-lg bg-black/60 border border-white/10 hover:border-cyan-400/60 text-left transition-all group"
              >
                <p className="font-mono text-xs font-bold text-white group-hover:text-cyan-300">Hermes' Draft</p>
                <p className="text-[10px] text-zinc-400 mt-1">+20% XP if starting focus blocks before 10 AM.</p>
              </button>

              <button
                onClick={() => handleSelectBoon("titan", "Titan's Aegis (Air-Gap Shielding)")}
                className="p-3 rounded-lg bg-black/60 border border-white/10 hover:border-cyan-400/60 text-left transition-all group"
              >
                <p className="font-mono text-xs font-bold text-white group-hover:text-cyan-300">Titan's Aegis</p>
                <p className="text-[10px] text-zinc-400 mt-1">Air-Gap breaches grant a 15-second grace shield.</p>
              </button>

              <button
                onClick={() => handleSelectBoon("midas", "Midas Discipline (2X Debrief Coins)")}
                className="p-3 rounded-lg bg-black/60 border border-white/10 hover:border-cyan-400/60 text-left transition-all group"
              >
                <p className="font-mono text-xs font-bold text-white group-hover:text-cyan-300">Midas Discipline</p>
                <p className="text-[10px] text-zinc-400 mt-1">2X Ascension Coins on Floor 5 Sentinel victory.</p>
              </button>
            </div>
          </div>
        )}

        {/* 5-Floor Vertical Spire Ladder */}
        <div className="space-y-2.5">
          {floors.map((floor) => {
            const isCleared = floor.status === "cleared";
            const isCurrent = floor.status === "current";
            const isLocked = floor.status === "locked";

            return (
              <motion.div
                key={floor.floor}
                whileHover={!isLocked ? { scale: 1.01 } : {}}
                className={`p-3.5 sm:p-4 rounded-xl border transition-all flex items-center justify-between gap-4 ${
                  isCleared
                    ? "bg-emerald-950/20 border-emerald-500/40"
                    : isCurrent
                    ? "bg-cyan-950/40 border-cyan-500/60 shadow-[0_0_20px_rgba(6,182,212,0.15)]"
                    : "bg-black/30 border-white/5 opacity-50"
                }`}
              >
                <div className="flex items-center gap-3.5">
                  {/* Floor Level Circle */}
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center font-mono text-sm font-black border ${
                      isCleared
                        ? "bg-emerald-500/20 border-emerald-500 text-emerald-400"
                        : isCurrent
                        ? "bg-cyan-500/20 border-cyan-400 text-cyan-300 animate-pulse"
                        : "bg-white/5 border-white/10 text-zinc-500"
                    }`}
                  >
                    F{floor.floor}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-white">
                        {floor.name}
                      </span>
                      <span className="font-mono text-[9px] uppercase tracking-wider text-zinc-400">
                        // {floor.category}
                      </span>
                    </div>
                    <p className="font-mono text-[11px] text-zinc-400 mt-0.5">
                      {floor.requirement}
                    </p>
                  </div>
                </div>

                {/* Status / Action Button */}
                <div>
                  {isCleared ? (
                    <div className="flex items-center gap-1.5 font-mono text-xs font-bold text-emerald-400">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>SECURED</span>
                    </div>
                  ) : isCurrent ? (
                    <Button
                      size="sm"
                      onClick={() => {
                        audioEngine.playCommandLock();
                        setLocation(floor.actionUrl);
                      }}
                      className="bg-cyan-400 hover:bg-cyan-300 text-black font-mono text-xs font-black h-8 px-4 shadow-md flex items-center gap-1.5"
                    >
                      <span>{floor.actionLabel}</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Button>
                  ) : (
                    <div className="flex items-center gap-1 font-mono text-xs text-zinc-600">
                      <Lock className="w-3.5 h-3.5" />
                      <span>LOCKED</span>
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

