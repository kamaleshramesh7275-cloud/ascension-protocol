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
        <DialogContent className="max-w-md w-[92vw] bg-[#07090F]/95 backdrop-blur-3xl border border-cyan-500/30 p-6 text-white rounded-3xl overflow-hidden shadow-2xl font-sans">
          <div className="relative z-10 flex flex-col items-center text-center space-y-4">
            {/* Header Pill */}
            <div className="flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-cyan-950/60 border border-cyan-500/40 text-cyan-300 text-xs font-medium">
              <Zap className="w-3.5 h-3.5 text-cyan-400" />
              <span>Instant Focus Session • No Sign-Up Required</span>
            </div>

            {/* PHASE 1: SET INTENTION */}
            {phase === "intent" && (
              <div className="w-full space-y-4 pt-2">
                <div className="space-y-1">
                  <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                    3-Minute Deep Work Sprint
                  </h3>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    Experience deep focus powered by local 40Hz binaural neuro-acoustic audio. Works offline with zero setup.
                  </p>
                </div>

                <div className="text-left space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-300">
                    What are you working on?
                  </label>
                  <Input
                    value={taskName}
                    onChange={(e) => setTaskName(e.target.value)}
                    placeholder="e.g. Clear inbox, Outline presentation, Write code"
                    className="bg-black/60 border-white/15 text-white text-xs h-10 rounded-xl"
                  />
                </div>

                <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/10 text-left space-y-1 text-xs">
                  <div className="text-zinc-400 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Sprint Milestone:</span>
                  </div>
                  <div className="text-white font-semibold">
                    Complete this sprint to earn +150 Performance Points
                  </div>
                </div>

                <Button
                  onClick={handleStartSprint}
                  className="w-full bg-cyan-400 hover:bg-cyan-300 text-black text-xs font-semibold h-11 rounded-xl shadow-lg shadow-cyan-500/20"
                >
                  <Play className="w-4 h-4 mr-1.5 text-black" />
                  Start 3-Minute Focus Session
                </Button>
              </div>
            )}

            {/* PHASE 2: RUNNING SPRINT */}
            {phase === "running" && (
              <div className="w-full flex flex-col items-center space-y-5 py-4">
                <div className="space-y-1">
                  <Badge variant="outline" className="border-cyan-500/50 text-cyan-400 text-xs font-medium">
                    Deep Focus Active
                  </Badge>
                  <h4 className="text-sm text-zinc-300 max-w-xs truncate font-medium">
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

                  <div className="text-5xl font-black text-white tracking-tighter tabular-nums drop-shadow-[0_0_20px_rgba(6,182,212,0.6)]">
                    {timeFormatted}
                  </div>
                </div>

                {/* 40Hz Audio Toggle */}
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={toggleAudio}
                    className={`h-9 text-xs font-medium border rounded-xl ${
                      isAudioActive ? "border-cyan-500/50 text-cyan-300 bg-cyan-950/40" : "border-white/10 text-zinc-400"
                    }`}
                  >
                    {isAudioActive ? (
                      <>
                        <Volume2 className="w-3.5 h-3.5 mr-1.5 text-cyan-400 animate-pulse" />
                        40Hz Audio Playing
                      </>
                    ) : (
                      <>
                        <VolumeX className="w-3.5 h-3.5 mr-1.5 text-zinc-500" />
                        Audio Muted
                      </>
                    )}
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleCompleteSprint}
                    className="text-xs text-zinc-400 hover:text-white"
                  >
                    Complete Early
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
                  <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                    Focus Session Complete!
                  </h3>
                  <p className="text-xs text-zinc-300">
                    You earned <strong className="text-cyan-400">+{earnedLoot?.xp || 150} Points</strong> towards your daily focus consistency.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-gradient-to-r from-cyan-950/40 via-purple-950/30 to-black border border-cyan-500/30 text-left space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-zinc-400 font-medium">Session Status:</span>
                    <Badge className="bg-cyan-500/20 text-cyan-300 border-cyan-500/40 text-xs">
                      Verified Completion
                    </Badge>
                  </div>
                  <p className="text-xs text-zinc-300 leading-relaxed">
                    Create your free account to track your daily streak, access unlimited deep focus sessions, and join peer accountability squads.
                  </p>
                </div>

                <Button
                  onClick={() => {
                    audioEngine.playCommandLock();
                    onConvertToAccount();
                  }}
                  className="w-full bg-gradient-to-r from-cyan-500 to-indigo-500 hover:from-cyan-400 hover:to-indigo-400 text-black font-semibold text-xs h-12 rounded-xl shadow-xl flex items-center justify-center gap-2"
                >
                  <Trophy className="w-4 h-4 text-black" />
                  <span>Save Progress & Create Free Account</span>
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

