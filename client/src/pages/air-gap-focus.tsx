import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { ProofOfWorkSubmit } from "@/components/proof-of-work-submit";
import { useToast } from "@/hooks/use-toast";
import {
  Lock,
  ShieldAlert,
  Flame,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Volume2,
  VolumeX,
  Crosshair,
  Maximize2,
  Minimize2,
  Zap,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  Radio,
  AlertCircle,
  Wifi,
  WifiOff,
} from "lucide-react";
import { audioEngine } from "@/lib/audio-engine";
import { useOnlineStatus } from "@/components/network-status";
import { CofferOpeningModal } from "@/components/rewards/coffer-opening-modal";

type Phase = "declaration" | "pre_mortem" | "oath" | "active" | "completed";

export default function AirGapFocus() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const searchParams = new URLSearchParams(window.location.search);
  const missionId = searchParams.get("missionId") || "air_gap_focus_session";

  // Session state
  const [phase, setPhase] = useState<Phase>("declaration");
  const [showCofferModal, setShowCofferModal] = useState<boolean>(false);
  const [declarationOutput, setDeclarationOutput] = useState<string>("");
  const [obstaclePreMortem, setObstaclePreMortem] = useState<string>("");
  const [scheduledMinutes, setScheduledMinutes] = useState<number>(45);
  const [sessionId, setSessionId] = useState<string | null>(null);

  // Active Timer state
  const [secondsRemaining, setSecondsRemaining] = useState<number>(45 * 60);
  const [actualMinutesElapsed, setActualMinutesElapsed] = useState<number>(0);
  const [attentionScore, setAttentionScore] = useState<number>(100);
  const [breachesCount, setBreachesCount] = useState<number>(0);

  // Oath Countdown
  const [oathCountdown, setOathCountdown] = useState<number>(5);
  const [oathReady, setOathReady] = useState<boolean>(false);

  // Breach Detection Overlay
  const [isBreached, setIsBreached] = useState<boolean>(false);
  const [breachCountdown, setBreachCountdown] = useState<number>(10);
  const breachTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Fullscreen and Soundscape state
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [isSoundscapeOn, setIsSoundscapeOn] = useState<boolean>(false);

  // Network and Offline Air-Gap State
  const isOnline = useOnlineStatus();
  const [isOfflineSession, setIsOfflineSession] = useState<boolean>(false);

  // Auto-sync offline completed sessions & breaches when connection is restored
  useEffect(() => {
    if (isOnline) {
      const rawSessions = localStorage.getItem("ascension_offline_completed_sessions");
      const rawBreaches = localStorage.getItem("ascension_offline_breaches");
      const sessions = rawSessions ? JSON.parse(rawSessions) : [];
      const breaches = rawBreaches ? JSON.parse(rawBreaches) : [];

      if (sessions.length > 0 || breaches.length > 0) {
        apiRequest("POST", "/api/focus-sessions/air-gap/sync-offline", { sessions, breaches })
          .then((res) => res.json())
          .then((data) => {
            if (data.success) {
              localStorage.removeItem("ascension_offline_completed_sessions");
              localStorage.removeItem("ascension_offline_breaches");
              queryClient.invalidateQueries({ queryKey: ["/api/focus-density"] });
              queryClient.invalidateQueries({ queryKey: ["/api/daily-mission"] });
              queryClient.invalidateQueries({ queryKey: ["/api/execution-profile"] });
              toast({
                title: "AIR-GAP BUFFER SYNCHRONIZED",
                description: `${data.syncedSessions} offline session(s) & ${data.syncedBreaches} breach(es) uploaded to central ledger.`,
              });
            }
          })
          .catch((err) => console.warn("Offline sync retry deferred:", err));
      }
    }
  }, [isOnline, queryClient, toast]);

  // 1. Start Session Mutation (Online)
  const startSessionMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/focus-sessions/air-gap", {
        missionId: missionId || null,
        declarationOutput,
        obstaclePreMortem,
        scheduledMinutes,
      });
      return res.json();
    },
    onSuccess: (data) => {
      setSessionId(data.session.id);
      setIsOfflineSession(false);
      setSecondsRemaining(scheduledMinutes * 60);
      setPhase("active");
    },
    onError: () => {
      // Automatic fallback to offline enclaved session if server unreachable
      startOfflineSession();
    },
  });

  // Offline Session Starter Helper
  const startOfflineSession = () => {
    const offlineId = "offline-" + Date.now();
    setSessionId(offlineId);
    setIsOfflineSession(true);
    setSecondsRemaining(scheduledMinutes * 60);
    setPhase("active");

    const pending = {
      id: offlineId,
      declarationOutput,
      obstaclePreMortem,
      scheduledMinutes,
      startedAt: new Date().toISOString(),
    };
    localStorage.setItem("ascension_offline_pending", JSON.stringify(pending));

    toast({
      title: "AIR-GAP MAXIMUM SECURITY",
      description: "Operating in offline enclave mode. Sessions & breaches safely tracked locally.",
    });
  };

  const handleStartSession = () => {
    if (!isOnline) {
      startOfflineSession();
    } else {
      startSessionMutation.mutate();
    }
  };

  // 2. Log Breach Mutation (Online)
  const logBreachMutation = useMutation({
    mutationFn: async (details: string) => {
      if (!sessionId) return;
      const res = await apiRequest("POST", `/api/focus-sessions/air-gap/${sessionId}/breach`, {
        eventType: "visibility_lost",
        details,
      });
      return res.json();
    },
    onSuccess: (data) => {
      if (data?.session) {
        setAttentionScore(data.session.attentionQualityScore);
        setBreachesCount(data.session.breachesCount);
      }
    },
    onError: () => {
      recordOfflineBreach("Attention lost for >10 seconds (network offline)");
    },
  });

  const recordOfflineBreach = (details: string) => {
    setAttentionScore((prev) => Math.max(20, prev - 15));
    setBreachesCount((prev) => prev + 1);

    const raw = localStorage.getItem("ascension_offline_breaches") || "[]";
    const breaches = JSON.parse(raw);
    breaches.push({
      sessionId: sessionId || "offline",
      details,
      type: "visibility_lost",
      penalty: 15,
      timestamp: new Date().toISOString(),
    });
    localStorage.setItem("ascension_offline_breaches", JSON.stringify(breaches));

    toast({
      title: "ATTENTION BREACH LOGGED (OFFLINE)",
      description: "Disciplinary deduction saved locally. Will sync upon reconnection.",
      variant: "destructive",
    });
  };

  const handleLogBreach = (details: string) => {
    if (!isOnline || isOfflineSession || sessionId?.startsWith("offline-")) {
      recordOfflineBreach(details);
    } else {
      logBreachMutation.mutate(details);
    }
  };

  // 3. Finish Session Mutation (Online)
  const finishSessionMutation = useMutation({
    mutationFn: async (status: "completed" | "aborted") => {
      if (!sessionId) return;
      const res = await apiRequest("POST", `/api/focus-sessions/air-gap/${sessionId}/finish`, {
        actualMinutes: actualMinutesElapsed,
        status,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/focus-density"] });
      queryClient.invalidateQueries({ queryKey: ["/api/daily-mission"] });
      setPhase("completed");
    },
    onError: (_err, status) => {
      recordOfflineCompletion(status);
    },
  });

  const recordOfflineCompletion = (status: "completed" | "aborted") => {
    const raw = localStorage.getItem("ascension_offline_completed_sessions") || "[]";
    const completedList = JSON.parse(raw);
    completedList.push({
      id: sessionId || ("offline-" + Date.now()),
      declarationOutput,
      obstaclePreMortem,
      scheduledMinutes,
      actualMinutes: Math.max(1, Math.round(actualMinutesElapsed || scheduledMinutes)),
      status,
      breachesCount,
      attentionQualityScore: attentionScore,
      completedAt: new Date().toISOString(),
    });
    localStorage.setItem("ascension_offline_completed_sessions", JSON.stringify(completedList));
    localStorage.removeItem("ascension_offline_pending");

    setPhase("completed");
    toast({
      title: status === "completed" ? "AIR-GAP SESSION COMPLETE (OFFLINE)" : "SESSION ABORTED (OFFLINE)",
      description: "Saved to local enclave. Auto-sync will flush when network reconnects.",
    });
  };

  const handleFinishSession = (status: "completed" | "aborted") => {
    if (!isOnline || isOfflineSession || sessionId?.startsWith("offline-")) {
      recordOfflineCompletion(status);
    } else {
      finishSessionMutation.mutate(status);
    }
  };

  // Oath Countdown timer
  useEffect(() => {
    if (phase === "oath") {
      setOathCountdown(5);
      setOathReady(false);
      const timer = setInterval(() => {
        setOathCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            setOathReady(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [phase]);

  // Main Session Active Timer
  useEffect(() => {
    if (phase !== "active") return;

    const timer = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleFinishSession("completed");
          return 0;
        }
        return prev - 1;
      });

      setActualMinutesElapsed((prev) => prev + 1 / 60);
    }, 1000);

    return () => clearInterval(timer);
  }, [phase]);

  // Air-Gap Breach Detection (visibilitychange & blur)
  useEffect(() => {
    if (phase !== "active") return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        setIsBreached(true);
        setBreachCountdown(10);
      } else {
        // User returned within countdown
        setIsBreached(false);
      }
    };

    const handleBlur = () => {
      setIsBreached(true);
      setBreachCountdown(10);
    };

    const handleFocus = () => {
      setIsBreached(false);
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("blur", handleBlur);
    window.addEventListener("focus", handleFocus);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("blur", handleBlur);
      window.removeEventListener("focus", handleFocus);
    };
  }, [phase]);

  // Breach Penalty Countdown & Klaxon Siren Enforcer
  useEffect(() => {
    if (isBreached && phase === "active") {
      audioEngine.startKlaxonSiren();
      breachTimerRef.current = setInterval(() => {
        setBreachCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(breachTimerRef.current!);
            audioEngine.stopKlaxonSiren();
            handleLogBreach("Window lost focus or navigated away for more than 10 seconds");
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      audioEngine.stopKlaxonSiren();
      if (breachTimerRef.current) {
        clearInterval(breachTimerRef.current);
      }
    }

    return () => {
      audioEngine.stopKlaxonSiren();
      if (breachTimerRef.current) clearInterval(breachTimerRef.current);
    };
  }, [isBreached, phase]);

  // Audio cleanup on unmount
  useEffect(() => {
    return () => {
      audioEngine.stopKlaxonSiren();
      audioEngine.stop40HzGammaFlow();
    };
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  return (
    <div className="min-h-screen bg-[#07080B] text-zinc-100 flex flex-col items-center justify-start p-4 sm:p-6 relative overflow-y-auto select-none">
      {/* ─── FULLSCREEN BREACH WARNING OVERLAY ─── */}
      <AnimatePresence>
        {isBreached && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-red-950/95 backdrop-blur-2xl flex flex-col items-center justify-center p-6 text-center"
          >
            <div className="w-20 h-20 rounded-full bg-red-600/20 border-2 border-red-500 flex items-center justify-center text-red-500 mb-6 animate-pulse">
              <ShieldAlert className="w-12 h-12" />
            </div>

            <h1 className="text-3xl sm:text-4xl font-black text-white tracking-widest uppercase mb-2 swiss-display">
              ATTENTION BREACH DETECTED
            </h1>
            <p className="text-sm sm:text-base text-red-300 max-w-lg mb-6 font-mono">
              You navigated away from the active Air-Gap environment. Return focus to this window immediately.
            </p>

            <div className="text-6xl sm:text-7xl font-mono font-black text-red-400 mb-6 tabular-telemetry animate-bounce">
              00:{String(breachCountdown).padStart(2, "0")}
            </div>

            <p className="text-xs font-mono text-red-400/80 uppercase tracking-widest">
              FAILURE PENALTY WILL APPLY WHEN TIMER REACHES ZERO
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── TOP PROTOCOL HEADER & NAVIGATION BAR ─── */}
      <header className="w-full max-w-2xl mx-auto flex items-center justify-between gap-3 mb-6 pt-2 z-10 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          {phase !== "active" && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                audioEngine.playTactileClick();
                setLocation("/mission-command");
              }}
              className="border-white/10 bg-[#0E1218] text-zinc-300 hover:text-white hover:border-white/20 h-8 font-mono text-xs flex items-center gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-cyan-400" />
              <span>COMMAND</span>
            </Button>
          )}
          <span className="px-3 py-1 rounded bg-amber-500/10 border border-amber-500/30 text-amber-400 font-mono text-[10px] uppercase font-semibold tracking-wider flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5" /> AIR-GAP PROTOCOL
          </span>
          {isOnline ? (
            <span className="px-2.5 py-1 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-mono text-[10px] flex items-center gap-1.5">
              <Wifi className="w-3.5 h-3.5" /> SECURE LINK
            </span>
          ) : (
            <span className="px-2.5 py-1 rounded bg-red-500/15 border border-red-500/40 text-red-400 font-mono text-[10px] flex items-center gap-1.5 animate-pulse">
              <WifiOff className="w-3.5 h-3.5" /> OFFLINE ENCLAVE
            </span>
          )}
          {phase === "active" && (
            <span className="px-2.5 py-1 rounded bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 font-mono text-[10px] flex items-center gap-1.5">
              <Radio className="w-3.5 h-3.5 text-cyan-400 animate-pulse" /> SESSION LOCKED
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              audioEngine.playTactileClick();
              toggleFullscreen();
            }}
            className="border-white/[0.08] bg-[#0E1218] text-zinc-400 hover:text-white h-8"
            title="Toggle Fullscreen"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </Button>
        </div>
      </header>

      {/* ─── MAIN ENCLAVE CONTENT CONTAINER (PREVENTS COLLISION) ─── */}
      <div className="w-full flex-1 flex flex-col items-center justify-center my-auto pb-10">

      {/* ─── PHASE 1: OUTPUT DECLARATION ─── */}
      {phase === "declaration" && (
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-xl obsidian-card p-6 sm:p-8 space-y-6 razor-border"
        >
          <div className="flex items-center gap-3 pb-4 border-b border-white/[0.08]">
            <div className="w-10 h-10 rounded bg-[#141922] border border-white/10 flex items-center justify-center text-amber-400">
              <Crosshair className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-zinc-100 swiss-display">Declaration of Output</h2>
              <p className="text-xs text-zinc-400 font-mono">What exact tangible artifact will exist when this session ends?</p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="output" className="text-xs font-mono font-semibold text-zinc-300">
              SPECIFIC DELIVERABLE (NO ABSTRACT GOALS):
            </Label>
            <Input
              id="output"
              placeholder="e.g. 500 words of research draft, or completed authentication middleware code"
              value={declarationOutput}
              onChange={(e) => setDeclarationOutput(e.target.value)}
              className="bg-[#090C10] border-white/[0.08] text-zinc-100 placeholder:text-zinc-600 h-11 text-sm font-mono"
            />
          </div>

          <div className="space-y-3 bg-[#090C10] p-4 rounded border border-white/[0.08]">
            <div className="flex justify-between items-center text-xs font-mono">
              <span className="text-zinc-400 font-semibold uppercase">SESSION DURATION:</span>
              <span className="text-amber-400 font-bold tabular-telemetry text-sm">{scheduledMinutes} MINUTES</span>
            </div>
            <Slider
              value={[scheduledMinutes]}
              min={15}
              max={120}
              step={15}
              onValueChange={(val) => setScheduledMinutes(val[0])}
            />
          </div>

          <Button
            onClick={() => {
              audioEngine.playTactileClick();
              if (!declarationOutput.trim()) {
                toast({ title: "Declaration Required", description: "State the tangible output you will produce.", variant: "destructive" });
                return;
              }
              setPhase("pre_mortem");
            }}
            className="w-full bg-amber-400 hover:bg-amber-300 text-black font-extrabold h-11 flex items-center justify-center gap-2 font-mono text-xs tracking-wider"
          >
            PROCEED TO OBSTACLE PRE-MORTEM <ArrowRight className="w-4 h-4" />
          </Button>
        </motion.div>
      )}

      {/* ─── PHASE 2: OBSTACLE PRE-MORTEM ─── */}
      {phase === "pre_mortem" && (
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-xl obsidian-card p-6 sm:p-8 space-y-6 razor-border"
        >
          <div className="flex items-center gap-3 pb-4 border-b border-white/[0.08]">
            <div className="w-10 h-10 rounded bg-[#141922] border border-white/10 flex items-center justify-center text-cyan-400">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-zinc-100 swiss-display">Obstacle Pre-Mortem</h2>
              <p className="text-xs text-zinc-400 font-mono">What temptation or distraction will try to break you during these {scheduledMinutes} minutes?</p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="obstacle" className="text-xs font-mono font-semibold text-zinc-300">
              ANTICIPATED DERAILMENT & COUNTERMOVE:
            </Label>
            <Input
              id="obstacle"
              placeholder="e.g. Urge to check WhatsApp -> I will physically leave phone in another room."
              value={obstaclePreMortem}
              onChange={(e) => setObstaclePreMortem(e.target.value)}
              className="bg-[#090C10] border-white/[0.08] text-zinc-100 placeholder:text-zinc-600 h-11 text-sm font-mono"
            />
          </div>

          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => {
                audioEngine.playTactileClick();
                setPhase("declaration");
              }}
              className="border-white/[0.08] bg-[#0E1218] text-zinc-400 hover:text-white h-11 font-mono text-xs"
            >
              BACK
            </Button>
            <Button
              onClick={() => {
                audioEngine.playTactileClick();
                if (!obstaclePreMortem.trim()) {
                  toast({ title: "Pre-Mortem Required", description: "Anticipate your distraction countermeasure.", variant: "destructive" });
                  return;
                }
                setPhase("oath");
              }}
              className="flex-1 bg-cyan-400 hover:bg-cyan-300 text-black font-extrabold h-11 flex items-center justify-center gap-2 font-mono text-xs tracking-wider"
            >
              TAKE THE SESSION OATH <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </motion.div>
      )}

      {/* ─── PHASE 3: NON-SKIPPABLE OATH ─── */}
      {phase === "oath" && (
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-xl obsidian-card p-6 sm:p-8 space-y-6 razor-border text-center"
        >
          <div className="w-12 h-12 rounded bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto text-amber-400">
            <Lock className="w-6 h-6" />
          </div>

          <div className="space-y-1">
            <h2 className="text-xl font-black text-zinc-100 uppercase tracking-wider swiss-display">
              THE AIR-GAP COMMITMENT
            </h2>
            <p className="text-xs font-mono text-zinc-500">
              5-SECOND NON-SKIPPABLE PROTOCOL CALIBRATION
            </p>
          </div>

          <div className="bg-[#090C10] p-4 rounded border border-white/[0.08] text-xs sm:text-sm text-zinc-300 leading-relaxed italic font-mono">
            &ldquo;I bind myself to this unbroken session. I will produce: <strong className="text-zinc-100">{declarationOutput}</strong>.
            I will not switch tabs, minimize this screen, or seek comfort in distraction until the clock reaches zero.&rdquo;
          </div>

          <Button
            onClick={() => {
              audioEngine.playCommandLock();
              handleStartSession();
            }}
            disabled={!oathReady || startSessionMutation.isPending}
            className={`w-full h-12 text-xs sm:text-sm font-mono font-extrabold uppercase tracking-wider ${
              oathReady
                ? "bg-amber-400 hover:bg-amber-300 text-black shadow-lg shadow-amber-500/10"
                : "bg-zinc-800 text-zinc-500 border border-white/5 cursor-not-allowed"
            }`}
          >
            {oathReady ? (
              <span className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-black" /> ENGAGE AIR-GAP PROTOCOL
              </span>
            ) : (
              <span>CALIBRATING PROTOCOL ({oathCountdown}s)...</span>
            )}
          </Button>
        </motion.div>
      )}

      {/* ─── PHASE 4: ACTIVE LOCKED SESSION ─── */}
      {phase === "active" && (
        <div className="w-full max-w-3xl flex flex-col items-center justify-center space-y-8 z-10 text-center">
          {/* Prominent Promised Deliverable */}
          <div className="bg-[#0E1218] border border-white/[0.08] px-5 py-2 rounded-full text-xs text-zinc-300 flex items-center gap-2 shadow-lg">
            <span className="text-amber-400 font-mono font-semibold uppercase text-[10px] tracking-wider">PROMISED ARTIFACT:</span>
            <span className="font-medium text-zinc-100 truncate max-w-md font-mono">{declarationOutput}</span>
          </div>

          {/* Neuro-Entrainment Soundscape Control */}
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                audioEngine.playTactileClick();
                if (isSoundscapeOn) {
                  audioEngine.stop40HzGammaFlow();
                  setIsSoundscapeOn(false);
                } else {
                  audioEngine.start40HzGammaFlow(0.25);
                  setIsSoundscapeOn(true);
                }
              }}
              className={`rounded-full px-4 py-1.5 text-xs font-mono transition-all border ${
                isSoundscapeOn
                  ? "bg-cyan-500/15 text-cyan-300 border-cyan-400/50 shadow-lg shadow-cyan-500/10"
                  : "bg-[#0E1218] text-zinc-400 border-white/[0.08] hover:text-zinc-200 hover:border-white/20"
              }`}
            >
              {isSoundscapeOn ? (
                <>
                  <Volume2 className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
                  <span>40Hz Gamma Flow Wave • Active</span>
                </>
              ) : (
                <>
                  <VolumeX className="w-3.5 h-3.5 text-zinc-500" />
                  <span>Enable 40Hz Gamma Flow Wave</span>
                </>
              )}
            </Button>
          </div>

          {/* Giant Timer Display */}
          <div className="relative flex flex-col items-center justify-center my-6">
            <div className="text-7xl sm:text-9xl font-mono font-black text-zinc-100 tracking-tighter tabular-telemetry drop-shadow-[0_0_50px_rgba(6,182,212,0.15)]">
              {formatTime(secondsRemaining)}
            </div>

            {/* Quality & Breach indicators */}
            <div className="flex items-center gap-4 mt-4 font-mono text-xs">
              <span className="text-emerald-400 flex items-center gap-1.5 tabular-telemetry">
                <ShieldCheck className="w-4 h-4" /> QUALITY: {attentionScore}%
              </span>
              <span className={`flex items-center gap-1.5 tabular-telemetry ${breachesCount > 0 ? "text-red-400 font-bold" : "text-zinc-500"}`}>
                <AlertCircle className="w-4 h-4" /> BREACHES: {breachesCount}
              </span>
            </div>
          </div>

          {/* Emergency / Completion Controls */}
          <div className="flex items-center gap-4 pt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                audioEngine.playTactileClick();
                if (window.confirm("Aborting will apply a penalty to your Discipline Score. Confirm surrender?")) {
                  handleFinishSession("aborted");
                }
              }}
              className="border-red-900/40 text-red-400 hover:bg-red-950/60 hover:text-red-300 text-xs font-mono h-9"
            >
              Abort Session
            </Button>

            <Button
              onClick={() => {
                audioEngine.playCommandLock();
                handleFinishSession("completed");
              }}
              className="bg-emerald-400 hover:bg-emerald-300 text-black font-extrabold px-8 h-10 flex items-center gap-2 font-mono text-xs tracking-wider"
            >
              <CheckCircle2 className="w-4 h-4" /> COMPLETE & VERIFY PROOF
            </Button>
          </div>
        </div>
      )}

      {/* ─── PHASE 5: COMPLETED → PROOF OF WORK ─── */}
      {phase === "completed" && (
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-2xl obsidian-card p-6 sm:p-8 space-y-6 razor-border text-center"
        >
          <div className="w-14 h-14 rounded bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-400 mb-2">
            <CheckCircle2 className="w-7 h-7" />
          </div>

          <div className="space-y-1">
            <h2 className="text-2xl font-black text-zinc-100 uppercase tracking-tight swiss-display">
              AIR-GAP SESSION ACCOMPLISHED
            </h2>
            <p className="text-xs font-mono text-zinc-400">
              {actualMinutesElapsed} UNBROKEN MINUTES LOGGED // ATTENTION QUALITY: {attentionScore}%
            </p>
          </div>

          <div className="pt-2 text-left">
            <ProofOfWorkSubmit
              missionId={missionId}
              tacticalDeliverable={declarationOutput}
              onCancel={() => setLocation("/mission-command")}
              onSuccess={() => {
                audioEngine.playCommandLock();
                setShowCofferModal(true);
              }}
            />
          </div>
        </motion.div>
      )}
      </div>

      <CofferOpeningModal
        isOpen={showCofferModal}
        cofferType="vault_of_will"
        onClose={() => {
          setShowCofferModal(false);
          setLocation("/mission-command");
        }}
        onClaim={(loot) => {
          toast({
            title: "VAULT OF WILL LOOT CLAIMED! ⚡",
            description: `Earned +${loot.totalXp} XP & +${loot.totalCoins} Coins!`,
          });
          queryClient.invalidateQueries({ queryKey: ["/api/user"] });
          setLocation("/mission-command");
        }}
      />
    </div>
  );
}
