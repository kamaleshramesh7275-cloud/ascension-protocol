import React, { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";
import { audioEngine } from "@/lib/audio-engine";
import { CofferOpeningModal } from "@/components/rewards/coffer-opening-modal";
import { 
  Zap, Clock, Volume2, VolumeX, Shield, CheckCircle2, 
  ArrowRight, Sparkles, Trophy, Lock, Play, Pause 
} from "lucide-react";

interface InstantFocusSandboxModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConvertToAccount: () => void;
}

export function InstantFocusSandboxModal({
  isOpen,
  onClose,
  onConvertToAccount,
}: InstantFocusSandboxModalProps) {
  const [phase, setPhase] = useState<"intent" | "running" | "completed" | "coffer_done">("intent");
  const [taskName, setTaskName] = useState<string>("Rapid Deep Work Sprint");
  const [secondsRemaining, setSecondsRemaining] = useState<number>(180); // 3 minutes
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [isAudioActive, setIsAudioActive] = useState<boolean>(false);
  const [showCoffer, setShowCoffer] = useState<boolean>(false);
  const [earnedLoot, setEarnedLoot] = useState<{ xp: number; coins: number } | null>(null);

  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    if (isOpen) {
      setPhase("intent");
      setSecondsRemaining(180);
      setIsRunning(false);
      setIsAudioActive(false);
      setShowCoffer(false);
      setEarnedLoot(null);
    } else {
      audioEngine.stop40HzGammaFlow();
      if (timerRef.current) clearInterval(timerRef.current);
    }
  }, [isOpen]);

  useEffect(() => {
    if (isRunning && secondsRemaining > 0) {
      timerRef.current = window.setInterval(() => {
        setSecondsRemaining((prev) => {
          if (prev <= 1) {
            handleCompleteSprint();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning, secondsRemaining]);

  const handleStartSprint = () => {
    audioEngine.playCommandLock();
    setPhase("running");
    setIsRunning(true);
    setIsAudioActive(true);
    audioEngine.start40HzGammaFlow(0.25);
  };

  const handleCompleteSprint = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    audioEngine.stop40HzGammaFlow();
    setIsRunning(false);
    setIsAudioActive(false);
    audioEngine.playLootFanfare("rare");
    setPhase("completed");
    setShowCoffer(true);
  };

  const toggleAudio = () => {
    if (isAudioActive) {
      audioEngine.stop40HzGammaFlow();
      setIsAudioActive(false);
    } else {
      audioEngine.start40HzGammaFlow(0.25);
      setIsAudioActive(true);
    }
  };

  const mins = Math.floor(secondsRemaining / 60);
  const secs = secondsRemaining % 60;
  const timeFormatted = `${mins}:${secs < 10 ? "0" : ""}${secs}`;

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-md w-[92vw] bg-[#07090F]/95 backdrop-blur-3xl border border-cyan-500/30 p-6 text-white rounded-3xl overflow-hidden shadow-2xl">
          <div className="relative z-10 flex flex-col items-center text-center space-y-4">
            {/* Header Pill */}
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-950/60 border border-cyan-500/40 text-cyan-300 font-mono text-[10px] uppercase tracking-wider">
              <Zap className="w-3.5 h-3.5 text-cyan-400" />
              <span>ZERO-AUTH GUEST SANDBOX // TRIAL RUN</span>
            </div>

            {/* PHASE 1: SET INTENTION */}
            {phase === "intent" && (
              <div className="w-full space-y-4 pt-2">
                <div className="space-y-1">
                  <h3 className="text-xl sm:text-2xl font-black font-display text-white uppercase tracking-tight">
                    3-Minute Focus Test
                  </h3>
                  <p className="text-xs text-zinc-400 font-mono">
                    Experience mil-spec air-gapped focus with 40Hz binaural neuro-entrainment. No sign-up required.
                  </p>
                </div>

                <div className="text-left space-y-1.5">
                  <label className="text-[10px] font-mono uppercase text-zinc-400 tracking-wider">
                    TARGET MISSION INTENTION:
                  </label>
                  <Input
                    value={taskName}
                    onChange={(e) => setTaskName(e.target.value)}
                    placeholder="e.g. Read 5 pages, Review code, Clear inbox"
                    className="bg-black/60 border-white/15 text-white font-mono text-xs h-10"
                  />
                </div>

                <div className="p-3 rounded-xl bg-white/[0.03] border border-white/10 text-left space-y-1 text-xs font-mono">
                  <div className="text-zinc-400 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span>Trial Completion Reward:</span>
                  </div>
                  <div className="text-white font-bold">
                    Vault of Will Coffer Drop (+150 XP & Rare Relic)
                  </div>
                </div>

                <Button
                  onClick={handleStartSprint}
                  className="w-full bg-cyan-400 hover:bg-cyan-300 text-black font-mono text-xs font-black h-11 tracking-wider uppercase shadow-lg shadow-cyan-500/20"
                >
                  <Play className="w-4 h-4 mr-1.5 text-black" />
                  INITIATE 3-MIN FOCUS SPRINT
                </Button>
              </div>
            )}

            {/* PHASE 2: RUNNING SPRINT */}
            {phase === "running" && (
              <div className="w-full flex flex-col items-center space-y-5 py-4">
                <div className="space-y-1">
                  <Badge variant="outline" className="border-cyan-500/50 text-cyan-400 font-mono text-[10px] uppercase">
                    AIR-GAP SHIELD ACTIVE
                  </Badge>
                  <h4 className="text-sm font-mono text-zinc-300 max-w-xs truncate">
                    {taskName}
                  </h4>
                </div>

                {/* Animated Pulsing Countdown Circle */}
                <div className="relative w-44 h-44 flex items-center justify-center">
                  <motion.div
                    animate={{ scale: [1, 1.08, 1], opacity: [0.3, 0.6, 0.3] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute inset-0 rounded-full border-2 border-cyan-400/40"
                  />

                  <div className="text-5xl font-black font-mono text-white tracking-tighter tabular-nums drop-shadow-[0_0_20px_rgba(6,182,212,0.6)]">
                    {timeFormatted}
                  </div>
                </div>

                {/* 40Hz Audio Toggle */}
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={toggleAudio}
                    className={`h-8 font-mono text-xs border ${
                      isAudioActive ? "border-cyan-500/50 text-cyan-300 bg-cyan-950/40" : "border-white/10 text-zinc-400"
                    }`}
                  >
                    {isAudioActive ? (
                      <>
                        <Volume2 className="w-3.5 h-3.5 mr-1.5 text-cyan-400 animate-pulse" />
                        40Hz BINAURAL FLOWING
                      </>
                    ) : (
                      <>
                        <VolumeX className="w-3.5 h-3.5 mr-1.5 text-zinc-500" />
                        AUDIO MUTED
                      </>
                    )}
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleCompleteSprint}
                    className="text-xs font-mono text-zinc-400 hover:text-white"
                  >
                    Skip Ahead
                  </Button>
                </div>
              </div>
            )}

            {/* PHASE 3: TRIAL COMPLETED & CONVERSION HOOK */}
            {phase === "coffer_done" && (
              <div className="w-full space-y-4 pt-2">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center mx-auto text-emerald-400 shadow-lg shadow-emerald-500/20">
                  <CheckCircle2 className="w-6 h-6" />
                </div>

                <div className="space-y-1">
                  <h3 className="text-xl sm:text-2xl font-black font-display text-white uppercase tracking-tight">
                    Trial Sprint Accomplished!
                  </h3>
                  <p className="text-xs text-zinc-300 font-mono">
                    You earned <strong className="text-cyan-400">+{earnedLoot?.xp || 150} XP</strong> and unlocked provisional Hunter Rank status.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-gradient-to-r from-cyan-950/40 via-purple-950/30 to-black border border-cyan-500/30 text-left space-y-2">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-zinc-400">PROVISIONAL HUNTER ID:</span>
                    <Badge className="bg-cyan-500/20 text-cyan-300 border-cyan-500/40 font-mono text-[10px]">
                      D-TIER RECRUIT
                    </Badge>
                  </div>
                  <p className="text-[11px] text-zinc-300 font-mono leading-relaxed">
                    Create your free account now to link your Google identity, save your earned loot, unlock your 3D Hunter License, and begin climbing the Spire.
                  </p>
                </div>

                <Button
                  onClick={() => {
                    audioEngine.playCommandLock();
                    onConvertToAccount();
                  }}
                  className="w-full bg-gradient-to-r from-emerald-400 to-cyan-500 hover:from-emerald-300 hover:to-cyan-400 text-black font-mono text-xs font-black h-12 tracking-wider uppercase shadow-xl flex items-center justify-center gap-2"
                >
                  <Trophy className="w-4 h-4 text-black" />
                  <span>CLAIM LOOT & ACTIVATE HUNTER ACCOUNT</span>
                  <ArrowRight className="w-4 h-4 text-black" />
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Vault of Will Coffer Opening Ceremony on Sprint Completion */}
      <CofferOpeningModal
        isOpen={showCoffer}
        cofferType="vault_of_will"
        onClose={() => {
          setShowCoffer(false);
          setPhase("coffer_done");
        }}
        onClaim={(loot) => {
          setEarnedLoot({ xp: loot.totalXp, coins: loot.totalCoins });
          setShowCoffer(false);
          setPhase("coffer_done");
        }}
      />
    </>
  );
}

