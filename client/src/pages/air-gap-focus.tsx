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
  ShieldCheck,
  Radio,
  AlertCircle,
  Wifi,
  WifiOff,
} from "lucide-react";
import { audioEngine } from "@/lib/audio-engine";
import { useOnlineStatus } from "@/components/network-status";

type Phase = "declaration" | "pre_mortem" | "oath" | "active" | "completed";

export default function AirGapFocus() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const searchParams = new URLSearchParams(window.location.search);
  const missionId = searchParams.get("missionId") || undefined;

  // Session state
  const [phase, setPhase] = useState<Phase>("declaration");
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
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-4 sm:p-6 relative overflow-hidden select-none">
      {/* ─── FULLSCREEN BREACH WARNING OVERLAY ─── */}
      <AnimatePresence>
        {isBreached && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-red-950/95 backdrop-blur-2xl flex flex-col items-center justify-center p-6 text-center"
          >
            <div className="w-20 h-20 rounded-full bg-red-600/30 border-2 border-red-500 flex items-center justify-center text-red-500 mb-6 animate-pulse">
              <ShieldAlert className="w-12 h-12" />
            </div>

            <h1 className="text-3xl sm:text-4xl font-black text-white tracking-widest uppercase mb-2">
              ATTENTION BREACH DETECTED
            </h1>
            <p className="text-sm sm:text-base text-red-300 max-w-lg mb-6">
              You navigated away from the active Air-Gap environment. Return focus to this window immediately.
            </p>

            <div className="text-6xl sm:text-7xl font-mono font-black text-red-400 mb-6 animate-bounce">
              00:{String(breachCountdown).padStart(2, "0")}
            </div>

            <p className="text-xs font-mono text-red-400/80 uppercase tracking-widest">
              FAILURE PENALTY WILL APPLY WHEN TIMER REACHES ZERO
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top Protocol Status */}
      <div className="absolute top-6 left-6 flex items-center gap-2 z-10 flex-wrap">
        <Badge variant="outline" className="border-amber-500/40 text-amber-400 bg-amber-500/10 font-mono text-xs uppercase px-3 py-1 flex items-center gap-1.5">
          <Lock className="w-3.5 h-3.5" /> AIR-GAP PROTOCOL
        </Badge>
        {isOnline ? (
          <Badge variant="outline" className="border-emerald-500/40 text-emerald-400 bg-emerald-500/10 font-mono text-xs flex items-center gap-1.5">
            <Wifi className="w-3.5 h-3.5" /> SECURE LINK
          </Badge>
        ) : (
          <Badge variant="outline" className="border-red-500/50 text-red-400 bg-red-500/15 font-mono text-xs flex items-center gap-1.5 animate-pulse">
            <WifiOff className="w-3.5 h-3.5" /> OFFLINE ENCLAVE ACTIVE
          </Badge>
        )}
        {phase === "active" && (
          <Badge variant="outline" className="border-cyan-500/40 text-cyan-400 bg-cyan-500/10 font-mono text-xs flex items-center gap-1.5">
            <Radio className="w-3 h-3 text-cyan-400 animate-pulse" /> SESSION LOCKED
          </Badge>
        )}
      </div>

      <div className="absolute top-6 right-6 flex items-center gap-2 z-10">
        <Button
          variant="outline"
          size="sm"
          onClick={toggleFullscreen}
          className="border-slate-800 text-slate-400 hover:text-white"
        >
          {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
        </Button>
      </div>

      {/* ─── PHASE 1: OUTPUT DECLARATION ─── */}
      {phase === "declaration" && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-xl bg-slate-900/90 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6 shadow-2xl backdrop-blur-md"
        >
          <div className="flex items-center gap-3 pb-4 border-b border-slate-800">
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Crosshair className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Declaration of Output</h2>
              <p className="text-xs text-slate-400">What exact tangible artifact will exist when this session ends?</p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="output" className="text-xs font-semibold text-slate-300">
              Specific Deliverable (No abstract goals):
            </Label>
            <Input
              id="output"
              placeholder="e.g. 500 words of research draft, or completed authentication middleware code"
              value={declarationOutput}
              onChange={(e) => setDeclarationOutput(e.target.value)}
              className="bg-slate-950 border-slate-700 text-white placeholder:text-slate-600 h-12"
            />
          </div>

          <div className="space-y-3 bg-slate-950/60 p-4 rounded-xl border border-slate-800">
            <div className="flex justify-between items-center text-xs font-mono">
              <span className="text-slate-300 font-semibold">SESSION DURATION:</span>
              <span className="text-amber-400 font-bold text-sm">{scheduledMinutes} MINUTES</span>
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
              if (!declarationOutput.trim()) {
                toast({ title: "Declaration Required", description: "State the tangible output you will produce.", variant: "destructive" });
                return;
              }
              setPhase("pre_mortem");
            }}
            className="w-full bg-amber-500 hover:bg-amber-400 text-black font-extrabold h-12 flex items-center justify-center gap-2"
          >
            Proceed to Obstacle Pre-Mortem <ArrowRight className="w-4 h-4" />
          </Button>
        </motion.div>
      )}

      {/* ─── PHASE 2: OBSTACLE PRE-MORTEM ─── */}
      {phase === "pre_mortem" && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-xl bg-slate-900/90 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6 shadow-2xl backdrop-blur-md"
        >
          <div className="flex items-center gap-3 pb-4 border-b border-slate-800">
            <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Obstacle Pre-Mortem</h2>
              <p className="text-xs text-slate-400">What temptation or distraction will try to break you during these {scheduledMinutes} minutes?</p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="obstacle" className="text-xs font-semibold text-slate-300">
              Anticipated Derailment & Countermove:
            </Label>
            <Input
              id="obstacle"
              placeholder="e.g. Urge to check WhatsApp -> I will physically leave phone in another room."
              value={obstaclePreMortem}
              onChange={(e) => setObstaclePreMortem(e.target.value)}
              className="bg-slate-950 border-slate-700 text-white placeholder:text-slate-600 h-12"
            />
          </div>

          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => setPhase("declaration")}
              className="border-slate-800 text-slate-400"
            >
              Back
            </Button>
            <Button
              onClick={() => {
                if (!obstaclePreMortem.trim()) {
                  toast({ title: "Pre-Mortem Required", description: "Anticipate your distraction countermeasure.", variant: "destructive" });
                  return;
                }
                setPhase("oath");
              }}
              className="flex-1 bg-cyan-500 hover:bg-cyan-400 text-black font-extrabold h-12 flex items-center justify-center gap-2"
            >
              Take the Session Oath <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </motion.div>
      )}

      {/* ─── PHASE 3: NON-SKIPPABLE OATH ─── */}
      {phase === "oath" && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-xl bg-slate-900 border-2 border-amber-500/40 rounded-2xl p-6 sm:p-8 space-y-6 shadow-2xl text-center"
        >
          <div className="w-14 h-14 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto text-amber-400">
            <Lock className="w-7 h-7" />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-black text-white uppercase tracking-wider">
              THE AIR-GAP COMMITMENT
            </h2>
            <p className="text-xs font-mono text-slate-400">
              5-SECOND NON-SKIPPABLE CALIBRATION
            </p>
          </div>

          <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 text-xs sm:text-sm text-slate-300 leading-relaxed italic">
            &ldquo;I bind myself to this unbroken session. I will produce: <strong className="text-white">{declarationOutput}</strong>.
            I will not switch tabs, minimize this screen, or seek comfort in distraction until the clock reaches zero.&rdquo;
          </div>

          <Button
            onClick={handleStartSession}
            disabled={!oathReady || startSessionMutation.isPending}
            className={`w-full h-14 text-sm sm:text-base font-extrabold uppercase tracking-wider ${
              oathReady
                ? "bg-amber-500 hover:bg-amber-400 text-black shadow-lg shadow-amber-500/20"
                : "bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed"
            }`}
          >
            {oathReady ? (
              <span className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-black" /> ENGAGE AIR-GAP PROTOCOL
              </span>
            ) : (
              <span>LOCKING PROTOCOL ({oathCountdown}s)...</span>
            )}
          </Button>
        </motion.div>
      )}

      {/* ─── PHASE 4: ACTIVE LOCKED SESSION ─── */}
      {phase === "active" && (
        <div className="w-full max-w-3xl flex flex-col items-center justify-center space-y-8 z-10 text-center">
          {/* Prominent Promised Deliverable */}
          <div className="bg-slate-900/60 border border-slate-800/80 px-6 py-2.5 rounded-full text-xs sm:text-sm text-slate-300 flex items-center gap-2">
            <span className="text-amber-400 font-mono font-semibold uppercase">PROMISED ARTIFACT:</span>
            <span className="font-medium text-white truncate max-w-md">{declarationOutput}</span>
          </div>

          {/* Neuro-Entrainment Soundscape Control */}
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
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
                  ? "bg-cyan-500/20 text-cyan-300 border-cyan-400 shadow-lg shadow-cyan-500/20"
                  : "bg-black/40 text-slate-400 border-white/10 hover:text-white hover:border-white/20"
              }`}
            >
              {isSoundscapeOn ? (
                <>
                  <Volume2 className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
                  <span>40Hz Gamma Flow Wave • Active</span>
                </>
              ) : (
                <>
                  <VolumeX className="w-3.5 h-3.5 text-slate-500" />
                  <span>Enable 40Hz Gamma Flow Wave</span>
                </>
              )}
            </Button>
          </div>

          {/* Giant Timer Display */}
          <div className="relative flex flex-col items-center justify-center my-6">
            <div className="text-7xl sm:text-9xl font-mono font-black text-white tracking-tighter drop-shadow-[0_0_40px_rgba(245,158,11,0.15)]">
              {formatTime(secondsRemaining)}
            </div>

            {/* Quality & Breach indicators */}
            <div className="flex items-center gap-4 mt-4 font-mono text-xs">
              <span className="text-emerald-400 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4" /> QUALITY: {attentionScore}%
              </span>
              <span className={`flex items-center gap-1.5 ${breachesCount > 0 ? "text-red-400 font-bold" : "text-slate-500"}`}>
                <AlertCircle className="w-4 h-4" /> BREACHES: {breachesCount}
              </span>
            </div>
          </div>

          {/* Emergency / Completion Controls */}
          <div className="flex items-center gap-4 pt-4">
            <Button
              variant="outline"
              onClick={() => {
                if (window.confirm("Aborting will apply a penalty to your Discipline Score. Confirm surrender?")) {
                  handleFinishSession("aborted");
                }
              }}
              className="border-red-900/40 text-red-400 hover:bg-red-950/60 hover:text-red-300 text-xs font-mono"
            >
              Abort Session
            </Button>

            <Button
              onClick={() => handleFinishSession("completed")}
              className="bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold px-8 flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" /> COMPLETE & VERIFY PROOF
            </Button>
          </div>
        </div>
      )}

      {/* ─── PHASE 5: COMPLETED → PROOF OF WORK ─── */}
      {phase === "completed" && (
        <div className="w-full max-w-2xl">
          <ProofOfWorkSubmit
            missionId={missionId || ""}
            tacticalDeliverable={declarationOutput}
            onCancel={() => setLocation("/mission-command")}
            onSuccess={() => setLocation("/mission-command")}
          />
        </div>
      )}
    </div>
  );
}
