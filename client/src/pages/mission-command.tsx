import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { MorningBriefingModal } from "@/components/morning-briefing-modal";
import { ProofOfWorkSubmit } from "@/components/proof-of-work-submit";
import { MidDayPulseModal } from "@/components/mid-day-pulse-modal";
import { PushEnforcerCard } from "@/components/push-enforcer-card";
import { TacticalScenarioInjector } from "@/components/tactical-scenario-injector";
import { PWAEnclaveBanner } from "@/components/pwa-enclave-banner";
import { ResurrectionModal } from "@/components/resurrection-modal";
import { WeeklyRecapModal } from "@/components/weekly-recap-modal";
import { SocialTelemetryFeed } from "@/components/social-telemetry-feed";
import { TacticalCacheModal } from "@/components/tactical-cache-modal";
import { SpireAscentWidget } from "@/components/spire/spire-ascent-widget";
import { SystemHologramBanner } from "@/components/notifications/system-hologram-banner";
import { audioEngine } from "@/lib/audio-engine";
import { useToast } from "@/hooks/use-toast";
import { usePet } from "@/hooks/use-pet";
import {
  Crosshair,
  ShieldAlert,
  Flame,
  Clock,
  Zap,
  Lock,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Sparkles,
  BarChart3,
  Calendar,
  AlertCircle,
  FileCheck,
  RotateCcw,
  Compass,
  Radio,
  TrendingUp,
  Trophy,
  RefreshCw
} from "lucide-react";

export default function MissionCommand() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [showBriefing, setShowBriefing] = useState<boolean>(false);
  const [showProofModal, setShowProofModal] = useState<boolean>(false);
  const [showAbortModal, setShowAbortModal] = useState<boolean>(false);
  const [showWeeklyRecap, setShowWeeklyRecap] = useState<boolean>(false);
  const [abortReason, setAbortReason] = useState<string>("");
  const [primingCompleted, setPrimingCompleted] = useState<boolean>(false);
  const { pet } = usePet();

  // 1. Fetch Profile & Dynamic Trajectory
  const { data: profileData, isLoading: loadingProfile } = useQuery<{
    profile: any;
    disciplineScore: any;
    trajectory?: any;
  }>({
    queryKey: ["/api/execution-profile"],
  });

  // 2. Fetch Daily Mission
  const { data: dailyMission, isLoading: loadingMission } = useQuery<any>({
    queryKey: ["/api/daily-mission"],
  });

  // 3. Fetch Focus Density & Stats
  const { data: focusDensityData } = useQuery<any>({
    queryKey: ["/api/focus-density"],
  });

  // Check if Morning Briefing has been acknowledged today
  useEffect(() => {
    if (profileData?.profile) {
      const today = new Date().toISOString().split("T")[0];
      const acknowledgedDate = localStorage.getItem("ascension_briefing_date");
      if (acknowledgedDate !== today) {
        setShowBriefing(true);
      }
    } else if (!loadingProfile && profileData && !profileData.profile) {
      // If user has not completed 5-layer diagnostic, redirect to briefing room
      setLocation("/briefing-room");
    }
  }, [profileData, loadingProfile, setLocation]);

  const handleAcknowledgeBriefing = () => {
    audioEngine.playCommandLock();
    const today = new Date().toISOString().split("T")[0];
    localStorage.setItem("ascension_briefing_date", today);
    setShowBriefing(false);
    toast({
      title: "ORDERS ACKNOWLEDGED",
      description: "Mission lock engaged for today.",
    });
  };

  // Commit Mutation
  const commitMutation = useMutation({
    mutationFn: async (missionId: string) => {
      const res = await apiRequest("POST", `/api/daily-mission/${missionId}/commit`);
      return res.json();
    },
    onSuccess: () => {
      audioEngine.playCommandLock();
      queryClient.invalidateQueries({ queryKey: ["/api/daily-mission"] });
      toast({
        title: "MISSION COMMITTED",
        description: "You are locked into today's deliverable. Abort penalties are now active.",
      });
    },
  });

  // Abort Mutation
  const abortMutation = useMutation({
    mutationFn: async ({ missionId, reason }: { missionId: string; reason: string }) => {
      const res = await apiRequest("POST", `/api/daily-mission/${missionId}/abort`, { reason });
      return res.json();
    },
    onSuccess: () => {
      audioEngine.startKlaxonSiren();
      setTimeout(() => audioEngine.stopKlaxonSiren(), 1800);
      queryClient.invalidateQueries({ queryKey: ["/api/daily-mission"] });
      queryClient.invalidateQueries({ queryKey: ["/api/focus-density"] });
      setShowAbortModal(false);
      setAbortReason("");
      toast({
        title: "MISSION ABORTED — BREACH LOGGED",
        description: "-25 Discipline Penalty applied to your permanent record.",
        variant: "destructive",
      });
    },
    onError: (err: any) => {
      toast({
        title: "Abort Failed",
        description: err.message || "Failed to record abort reason.",
        variant: "destructive",
      });
    },
  });

  // Dynamic Roadmap Mutations
  const recalibrateMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/protocol/roadmap/recalibrate");
      return res.json();
    },
    onSuccess: (res: any) => {
      audioEngine.playCommandLock();
      queryClient.invalidateQueries({ queryKey: ["/api/execution-profile"] });
      toast({
        title: "TRAJECTORY RECALIBRATED",
        description: res.trajectory?.summary || "Roadmap probabilities updated from live focus velocity.",
      });
    },
    onError: (err: any) => {
      toast({
        title: "Recalibration Failed",
        description: err.message,
        variant: "destructive",
      });
    },
  });

  const advanceMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/protocol/roadmap/advance");
      return res.json();
    },
    onSuccess: (res: any) => {
      audioEngine.playCommandLock();
      queryClient.invalidateQueries({ queryKey: ["/api/execution-profile"] });
      queryClient.invalidateQueries({ queryKey: ["/api/daily-mission"] });
      toast({
        title: "MILESTONE CONQUERED",
        description: res.message || "Phase advanced. Next level daily mission unlocked (+50 Discipline PTS).",
      });
    },
    onError: (err: any) => {
      toast({
        title: "Advance Failed",
        description: err.message,
        variant: "destructive",
      });
    },
  });

  const profile = profileData?.profile;
  const discipline = profileData?.disciplineScore || focusDensityData?.disciplineScore;
  const densityPercent = focusDensityData?.focusDensityPercent ?? 0;
  const totalMinutes = focusDensityData?.totalMinutesToday ?? 0;
  const trajectory = profileData?.trajectory;

  return (
    <div className="min-h-screen bg-[#07080B] text-zinc-100 flex flex-col p-4 sm:p-6 md:p-8 relative overflow-hidden select-none">
      {/* Background ambient razor grid & lighting */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-amber-500/5 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-10 w-96 h-96 bg-cyan-500/5 blur-3xl pointer-events-none" />

      {/* Mandatory Morning Briefing Modal */}
      {showBriefing && profile && dailyMission && (
        <MorningBriefingModal
          failureStatement={profile.failureStatement}
          missionTitle={dailyMission.title}
          tacticalDeliverable={dailyMission.tacticalDeliverable}
          executionWindow={dailyMission.executionWindow}
          onAcknowledge={handleAcknowledgeBriefing}
        />
      )}

      {/* Main Content Area */}
      <div className="w-full max-w-5xl mx-auto space-y-8 relative z-10">
        {/* Top Command Bar */}
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/[0.08]">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[10px] font-mono tracking-widest uppercase flex items-center gap-1.5">
                <Radio className="w-3 h-3 animate-pulse text-amber-400" /> MISSION COMMAND CENTER // OS
              </span>
              <span className="px-2 py-0.5 rounded bg-[#141922] border border-white/[0.08] text-zinc-400 font-mono text-[10px]">
                {new Date().toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" }).toUpperCase()}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-zinc-100 swiss-display flex items-center gap-2">
              ASCENSION PROTOCOL
            </h1>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <TacticalScenarioInjector />
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                audioEngine.playTactileClick();
                setLocation("/evening-debrief");
              }}
              className="border-white/[0.08] bg-[#0E1218] text-zinc-300 hover:text-white hover:bg-[#141922] text-xs font-mono h-8"
            >
              <FileCheck className="w-3.5 h-3.5 mr-1.5 text-cyan-400" />
              DEBRIEF
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                audioEngine.playTactileClick();
                setShowWeeklyRecap(true);
              }}
              className="border-white/[0.08] bg-[#0E1218] text-zinc-300 hover:text-white hover:bg-[#141922] text-xs font-mono h-8"
            >
              <Trophy className="w-3.5 h-3.5 mr-1.5 text-amber-400" />
              WEEKLY AUDIT
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                audioEngine.playTactileClick();
                setLocation("/briefing-room");
              }}
              className="border-white/[0.08] bg-[#0E1218] text-zinc-400 hover:text-zinc-200 text-xs font-mono h-8"
            >
              DIAGNOSTIC
            </Button>
            {/* Companion Beast Chip */}
            <div 
              onClick={() => {
                audioEngine.playTactileClick();
                setLocation("/focus");
              }}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#0E1218] border border-white/[0.08] hover:border-amber-400/30 cursor-pointer transition-all h-8 select-none group"
              title="Focus Companion Beast. Tap to enter Focus Sanctum."
            >
              <span className="text-sm group-hover:scale-125 transition-transform">
                {pet.type === "dragon" ? "🐉" : pet.type === "wolf" ? "🐺" : "🐱"}
              </span>
              <span className="text-[10px] font-mono text-zinc-300 font-bold uppercase hidden sm:inline">
                {pet.name}
              </span>
              <Badge className="bg-amber-500/10 text-amber-400 border-amber-500/20 text-[9px] font-mono px-1 py-0 h-4">
                LVL {pet.level}
              </Badge>
            </div>
          </div>
        </header>

        {/* Cybernetic Native PWA Mobile Enclave Banner */}
        <PWAEnclaveBanner />

        {/* Floating Solo Leveling System Mandate Hologram */}
        <SystemHologramBanner
          title="SYSTEM MANDATE // PROTOCOL DIRECTIVE"
          message="Daily Spire has refreshed. Complete your Floor 1 Gate of Intent to maintain unbroken rank status."
          actionUrl="/air-gap-focus"
          actionLabel="BREACH AIR-GAP"
          severity="normal"
        />

        {/* ─── HERO TELEMETRY: FOCUS DENSITY, DISCIPLINE SCORE, EXECUTED STREAK ─── */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Card 1: Focus Density Telemetry */}
          <div className="obsidian-card p-5 relative overflow-hidden flex flex-col justify-between razor-border-hover group">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-mono text-zinc-400 font-semibold uppercase tracking-wider flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-amber-400" /> FOCUS DENSITY RATIO
              </span>
              <span className="text-xs font-mono text-amber-400 font-bold tabular-telemetry">{densityPercent}%</span>
            </div>

            <div className="my-2">
              <div className="text-4xl font-extrabold text-zinc-100 tabular-telemetry tracking-tight">
                {densityPercent}%
              </div>
              <p className="text-xs text-zinc-400 mt-1 font-mono">
                {totalMinutes} Verified Minutes Today
              </p>
            </div>

            <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden mt-3">
              <div
                className="h-full bg-amber-400 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, densityPercent)}%` }}
              />
            </div>
          </div>

          {/* Card 2: Clinical Discipline Score */}
          <div className="obsidian-card p-5 relative overflow-hidden flex flex-col justify-between razor-border-hover group">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-mono text-zinc-400 font-semibold uppercase tracking-wider flex items-center gap-1.5">
                <Crosshair className="w-3.5 h-3.5 text-cyan-400" /> DISCIPLINE SCORE
              </span>
              <span className="px-2 py-0.5 rounded bg-cyan-950/40 border border-cyan-500/30 text-cyan-400 text-[10px] font-mono uppercase tracking-wider">
                {discipline?.tier || "Practitioner"}
              </span>
            </div>

            <div className="my-2">
              <div className="text-4xl font-extrabold text-zinc-100 tabular-telemetry tracking-tight">
                {discipline?.score ?? 700}
                <span className="text-base text-zinc-500 font-normal"> / 1000</span>
              </div>
              <p className="text-xs text-zinc-400 mt-1 font-mono">
                {discipline?.completedMissions ?? 0} Completed Objectives Logged
              </p>
            </div>

            <div className="flex items-center justify-between text-[11px] font-mono text-zinc-500 mt-3 pt-2.5 border-t border-white/[0.06]">
              <span>BREACHES: <strong className="text-red-400">{discipline?.totalBreaches ?? 0}</strong></span>
              <span>PEAK: <strong className="text-zinc-300">{discipline?.highestScore ?? 700}</strong></span>
            </div>
          </div>

          {/* Card 3: Execution Streak & Defiance Multiplier */}
          <div className="obsidian-card p-5 relative overflow-hidden flex flex-col justify-between razor-border-hover group">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-mono text-zinc-400 font-semibold uppercase tracking-wider flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5 text-orange-400" /> EXECUTION STREAK
              </span>
              <span className="px-2 py-0.5 rounded bg-orange-950/40 border border-orange-500/30 text-orange-400 text-[10px] font-mono uppercase tracking-wider">
                UNBROKEN
              </span>
            </div>

            <div className="my-2">
              <div className="text-4xl font-extrabold text-zinc-100 tabular-telemetry tracking-tight flex items-baseline gap-2">
                {discipline?.currentStreak ?? 0}
                <span className="text-sm font-mono text-orange-400 tracking-wider">DAYS</span>
              </div>
              <p className="text-xs text-zinc-400 mt-1 font-mono">
                Zero missed days authorized. Reset to zero on abort.
              </p>
            </div>

            <div className="text-[11px] font-mono mt-3 pt-2.5 border-t border-white/[0.06] flex items-center gap-1.5 text-emerald-400">
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
              <span>Target: 30 consecutive days for Ironclad tier</span>
            </div>
          </div>
        </section>

        {/* ─── ROGUELIKE SPIRE OF ASCENSION (DAILY 5-FLOOR CYCLE) ─── */}
        {(() => {
          const today = new Date().toISOString().split("T")[0];
          const hasBriefedToday = typeof window !== "undefined" && localStorage.getItem("ascension_briefing_date") === today;
          return (
            <SpireAscentWidget
              currentStreak={discipline?.currentStreak ?? 0}
              completedMinutes={totalMinutes}
              hasBriefed={hasBriefedToday}
              hasDebriefed={false}
            />
          );
        })()}

        {/* ─── TODAY'S SINGLE MISSION CARD (7-FIELDS) ─── */}
        <section className="obsidian-card p-6 sm:p-8 relative overflow-hidden space-y-6 razor-border">
          {/* Subtle amber top edge hairline */}
          <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-amber-400 to-transparent" />

          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/[0.08]">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="px-2.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[10px] font-mono tracking-widest uppercase font-semibold">
                  SINGLE MISSION LOCK // DELIVERABLE
                </span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase tracking-wider font-semibold ${
                  dailyMission?.status === "completed"
                    ? "bg-emerald-500/15 border border-emerald-500/30 text-emerald-400"
                    : dailyMission?.status === "committed"
                    ? "bg-cyan-500/15 border border-cyan-500/30 text-cyan-400"
                    : dailyMission?.status === "aborted"
                    ? "bg-red-500/15 border border-red-500/30 text-red-400"
                    : "bg-amber-500/15 border border-amber-500/30 text-amber-400"
                }`}>
                  {dailyMission?.status || "PENDING"}
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-zinc-100 tracking-tight swiss-display">
                {dailyMission?.title || "Strategic Objective Loading..."}
              </h2>
            </div>

            <div className="flex items-center gap-2 text-xs font-mono text-zinc-400">
              <Clock className="w-4 h-4 text-cyan-400" />
              <span>WINDOW: {dailyMission?.executionWindow || "09:00 - 11:30"}</span>
            </div>
          </div>

          {/* 4-Field Mission Telemetry Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Field 1: Tactical Deliverable */}
            <div className="bg-[#090C10] p-4 rounded border border-white/[0.08] space-y-1">
              <div className="text-[11px] font-mono text-amber-400 font-semibold uppercase flex items-center gap-1.5">
                <Crosshair className="w-3.5 h-3.5" /> 1. Tactical Deliverable (Verifiable Output)
              </div>
              <p className="text-sm text-zinc-200 font-medium">
                {dailyMission?.tacticalDeliverable || "Generate and submit proof of tangible progress."}
              </p>
            </div>

            {/* Field 2: Focus Tier & Duration */}
            <div className="bg-[#090C10] p-4 rounded border border-white/[0.08] space-y-1">
              <div className="text-[11px] font-mono text-cyan-400 font-semibold uppercase flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5" /> 2. Focus Tier & Standard
              </div>
              <p className="text-sm text-zinc-200">
                <span className="font-bold text-zinc-100 font-mono">{dailyMission?.focusTier || "L1 Platinum"}</span> • {dailyMission?.estimatedMinutes || 90} Minutes Unbroken Air-Gap
              </p>
            </div>

            {/* Field 3: Priming Ritual (Interactive) */}
            <div className="bg-[#090C10] p-4 rounded border border-white/[0.08] space-y-2">
              <div className="text-[11px] font-mono text-zinc-400 font-semibold uppercase flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" /> 3. Priming Ritual (Cold-Start Breaker)
              </div>
              <div
                onClick={() => {
                  audioEngine.playTactileClick();
                  setPrimingCompleted(!primingCompleted);
                }}
                className={`flex items-start gap-2.5 p-2.5 rounded border cursor-pointer transition-all ${
                  primingCompleted ? "bg-cyan-950/20 border-cyan-500/40 text-zinc-100" : "border-white/[0.08] text-zinc-400 hover:border-white/20"
                }`}
              >
                <div className={`w-4 h-4 rounded mt-0.5 shrink-0 flex items-center justify-center border ${
                  primingCompleted ? "bg-cyan-400 border-cyan-400 text-black" : "border-zinc-700 bg-zinc-900"
                }`}>
                  {primingCompleted && <CheckCircle2 className="w-3.5 h-3.5 text-black" />}
                </div>
                <p className="text-xs leading-relaxed select-none">
                  {dailyMission?.primingRitual || "Clear desktop of all clutter. Open document and write acceptance criteria."}
                </p>
              </div>
            </div>

            {/* Field 4: Failure Condition */}
            <div className="bg-red-950/10 p-4 rounded border border-red-500/20 space-y-1">
              <div className="text-[11px] font-mono text-red-400 font-semibold uppercase flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-red-400" /> 4. Strict Failure Trigger
              </div>
              <p className="text-xs text-red-200/90 leading-relaxed">
                {dailyMission?.failureCondition || "Leaving workspace before 45 minutes or switching to non-essential browser tabs."}
              </p>
            </div>
          </div>

          {/* Verification Status Banner if completed */}
          {dailyMission?.status === "completed" && (
            <div className="p-4 rounded bg-emerald-950/20 border border-emerald-500/30 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-sm font-bold text-zinc-100 font-mono">MISSION DELIVERABLE VERIFIED</div>
                  <div className="text-xs text-emerald-400/90 font-mono">
                    Quality Score: {dailyMission.proofQualityScore}/100 • &ldquo;{dailyMission.aiReviewFeedback}&rdquo;
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Action CTAs */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
            <div className="flex items-center gap-2">
              {dailyMission?.status !== "aborted" && dailyMission?.status !== "completed" && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    audioEngine.playTactileClick();
                    setShowAbortModal(true);
                  }}
                  className="border-red-900/30 text-red-400 hover:bg-red-950/30 hover:text-red-300 text-xs font-mono h-8"
                >
                  Abort Protocol
                </Button>
              )}
            </div>

            <div className="flex items-center gap-3">
              {dailyMission?.status === "pending" && (
                <Button
                  onClick={() => {
                    audioEngine.playTactileClick();
                    commitMutation.mutate(dailyMission.id);
                  }}
                  disabled={commitMutation.isPending}
                  className="bg-amber-400 hover:bg-amber-300 text-black font-extrabold px-6 h-9 font-mono text-xs tracking-wider"
                >
                  {commitMutation.isPending ? "LOCKING..." : "COMMIT TO TODAY'S MISSION"}
                </Button>
              )}

              {dailyMission?.status === "committed" && (
                <>
                  <Button
                    onClick={() => {
                      audioEngine.playTactileClick();
                      setLocation(`/air-gap-focus?missionId=${dailyMission.id}`);
                    }}
                    className="bg-cyan-400 hover:bg-cyan-300 text-black font-extrabold flex items-center gap-2 px-6 h-9 font-mono text-xs tracking-wider"
                  >
                    <Lock className="w-4 h-4" /> ENTER AIR-GAP PROTOCOL
                  </Button>
                  <Button
                    onClick={() => {
                      audioEngine.playTactileClick();
                      setShowProofModal(true);
                    }}
                    className="bg-emerald-400 hover:bg-emerald-300 text-black font-bold flex items-center gap-2 px-5 h-9 font-mono text-xs tracking-wider"
                  >
                    <FileCheck className="w-4 h-4" /> SUBMIT PROOF
                  </Button>
                </>
              )}
            </div>
          </div>
        </section>

        {/* ─── AUTONOMOUS DIRECTIVE RADAR & PUSH ENFORCER ─── */}
        <section>
          <PushEnforcerCard />
        </section>

        {/* ─── DYNAMIC LIVING ROADMAP COMMAND ENCLAVE ─── */}
        {profile?.roadmapMilestones && profile.roadmapMilestones.length > 0 && (
          <section className="obsidian-card p-5 sm:p-6 space-y-5 relative overflow-hidden razor-border">
            {/* Ambient accent based on trajectory status */}
            <div className={`absolute top-0 left-0 w-full h-1 ${
              trajectory?.status === "AHEAD_OF_PACE"
                ? "bg-gradient-to-r from-emerald-500 via-cyan-400 to-emerald-500"
                : trajectory?.status === "ON_TRACK"
                ? "bg-gradient-to-r from-cyan-500 via-amber-400 to-cyan-500"
                : trajectory?.status === "DRIFT_WARNING"
                ? "bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500"
                : "bg-gradient-to-r from-red-600 via-rose-500 to-red-600"
            }`} />

            {/* Header with Title, Status Pill & Recalibrate CTA */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/[0.08]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded bg-[#141922] border border-white/10 flex items-center justify-center text-amber-400">
                  <Compass className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                    <h3 className="text-xs font-bold text-zinc-100 uppercase tracking-wider font-mono">
                      LIVING ROADMAP & DYNAMIC TRAJECTORY
                    </h3>
                    {trajectory && (
                      <span
                        className={`text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded border ${
                          trajectory.status === "AHEAD_OF_PACE"
                            ? "border-emerald-500/40 text-emerald-400 bg-emerald-950/40"
                            : trajectory.status === "ON_TRACK"
                            ? "border-cyan-500/40 text-cyan-400 bg-cyan-950/40"
                            : trajectory.status === "DRIFT_WARNING"
                            ? "border-amber-500/40 text-amber-400 bg-amber-950/40"
                            : "border-red-500/50 text-red-400 bg-red-950/50"
                        }`}
                      >
                        {trajectory.status === "AHEAD_OF_PACE" && "[PACE: OPTIMAL] Ahead of Schedule"}
                        {trajectory.status === "ON_TRACK" && "[PACE: NOMINAL] On Track"}
                        {trajectory.status === "DRIFT_WARNING" && "[WARN: DRIFT] Velocity Drift"}
                        {trajectory.status === "CRITICAL_DRIFT" && "[ALERT: CRITICAL] Critical Drift"}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-zinc-400 font-mono mt-0.5">
                    Target: <span className="text-zinc-200">{profile.targetOutcome}</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    audioEngine.playTactileClick();
                    recalibrateMutation.mutate();
                  }}
                  disabled={recalibrateMutation.isPending}
                  className="border-white/[0.08] bg-[#0E1218] hover:bg-[#141922] text-xs font-mono text-zinc-300 hover:text-white flex items-center gap-1.5 h-8"
                >
                  <RefreshCw className={`w-3.5 h-3.5 text-cyan-400 ${recalibrateMutation.isPending ? "animate-spin" : ""}`} />
                  {recalibrateMutation.isPending ? "Recalibrating..." : "Recalibrate Trajectory"}
                </Button>
              </div>
            </div>

            {/* Dynamic Telemetry Velocity Bar */}
            {trajectory && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-[#090C10] p-3.5 rounded border border-white/[0.08] text-xs font-mono">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                    <TrendingUp className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <div className="text-[10px] text-zinc-500 uppercase tracking-tight">EXECUTION VELOCITY</div>
                    <div className="text-sm font-bold text-zinc-100 flex items-center gap-1 tabular-telemetry">
                      {trajectory.velocityIndex}x
                      <span className={`text-[10px] ${trajectory.velocityIndex >= 1.0 ? "text-emerald-400" : "text-amber-400"}`}>
                        {trajectory.velocityIndex >= 1.0 ? "Pacing High" : "Under Baseline"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 border-t sm:border-t-0 sm:border-l border-white/[0.08] pt-2 sm:pt-0 sm:pl-3">
                  <div className="w-7 h-7 rounded bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                    <Calendar className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <div className="text-[10px] text-zinc-500 uppercase tracking-tight">PROJECTED COMPLETION</div>
                    <div className="text-sm font-bold text-zinc-100 tabular-telemetry">
                      {trajectory.projectedDate}{" "}
                      <span className={`text-[10px] font-semibold ${trajectory.daysDelta >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                        ({trajectory.daysDelta >= 0 ? `+${trajectory.daysDelta}d Ahead` : `${Math.abs(trajectory.daysDelta)}d Drift`})
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 border-t sm:border-t-0 sm:border-l border-slate-800/80 pt-2 sm:pt-0 sm:pl-3">
                  <div className="w-7 h-7 rounded-md bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
                    <Trophy className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-500 uppercase">ACTIVE PHASE</div>
                    <div className="text-sm font-bold text-purple-300">
                      Phase {profile.currentMilestoneIndex + 1} of {profile.roadmapMilestones.length}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Dynamic Milestone Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 pt-1">
              {(trajectory?.milestones || profile.roadmapMilestones).map((m: any, idx: number) => {
                const isCurrent = idx === profile.currentMilestoneIndex;
                const isPast = idx < profile.currentMilestoneIndex || m.completed;

                return (
                  <div
                    key={m.id || idx}
                    className={`p-3.5 rounded border flex flex-col justify-between transition-all ${
                      isCurrent
                        ? "bg-amber-500/10 border-amber-500/40 shadow-lg shadow-amber-500/5 ring-1 ring-amber-500/20"
                        : isPast
                        ? "bg-emerald-950/15 border-emerald-500/30 text-zinc-300"
                        : "bg-[#090C10] border-white/[0.08] text-zinc-500"
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between text-[11px] font-mono mb-2">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                          isPast
                            ? "bg-emerald-500/20 text-emerald-400"
                            : isCurrent
                            ? "bg-amber-500/20 text-amber-300"
                            : "bg-[#141922] text-zinc-500"
                        }`}>
                          {isPast ? "Conquered" : `Phase ${idx + 1}`}
                        </span>
                        <div className="flex items-center gap-1 font-bold">
                          <span className={`tabular-telemetry ${
                            m.probabilityScore >= 80 ? "text-emerald-400" : m.probabilityScore >= 60 ? "text-amber-400" : "text-red-400"
                          }`}>
                            {m.probabilityScore}%
                          </span>
                          <span className="text-[9px] text-zinc-500 font-normal">PROB</span>
                        </div>
                      </div>

                      <div className="text-xs font-bold text-zinc-100 leading-snug">{m.title}</div>
                      <div className="text-[11px] text-zinc-400 mt-1.5 leading-relaxed">
                        {m.coreDeliverable}
                      </div>
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-white/[0.06] flex items-center justify-between text-[10px] font-mono">
                      <span className="text-zinc-500">Target: Wk {m.weekNumber}</span>
                      {isCurrent && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            audioEngine.playTactileClick();
                            advanceMutation.mutate();
                          }}
                          disabled={advanceMutation.isPending}
                          className="h-6 px-2 text-[10px] font-mono font-bold text-amber-400 hover:text-amber-300 hover:bg-amber-500/10 p-0"
                        >
                          {advanceMutation.isPending ? "Locking..." : "ADVANCE PHASE"}
                        </Button>
                      )}
                      {isPast && (
                        <span className="text-emerald-400 font-bold flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                          VERIFIED
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* ─── REAL-TIME SOCIAL TELEMETRY STREAM & PEER ENDORSEMENTS ─── */}
        <section>
          <SocialTelemetryFeed />
        </section>
      </div>

      {/* ─── PROOF OF WORK SUBMISSION MODAL ─── */}
      <Dialog open={showProofModal} onOpenChange={setShowProofModal}>
        <DialogContent className="max-w-2xl bg-slate-950 border border-slate-800 p-0 overflow-hidden">
          {dailyMission && (
            <ProofOfWorkSubmit
              missionId={dailyMission.id}
              tacticalDeliverable={dailyMission.tacticalDeliverable}
              onCancel={() => setShowProofModal(false)}
              onSuccess={() => setShowProofModal(false)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* ─── ABORT PROTOCOL MODAL ─── */}
      <Dialog open={showAbortModal} onOpenChange={setShowAbortModal}>
        <DialogContent className="max-w-lg bg-slate-950 border-2 border-red-500/50 p-6 space-y-4">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-red-400 flex items-center gap-2">
              <ShieldAlert className="w-5 h-5" />
              CONFIRM MISSION ABORT PROTOCOL
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-400">
              Aborting is an official surrender event. It immediately triggers a -25 point discipline penalty and resets your streak to 0.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2 pt-2">
            <Label htmlFor="abortReason" className="text-xs font-semibold text-slate-300">
              State Your Failure Reason (Min 10 characters):
            </Label>
            <Input
              id="abortReason"
              placeholder="Why are you failing to deliver today's single mission?"
              value={abortReason}
              onChange={(e) => setAbortReason(e.target.value)}
              className="bg-slate-900 border-red-500/30 text-white placeholder:text-slate-600"
            />
            <p className="text-[11px] text-red-400/80">
              This statement is permanently recorded into your Breach Log.
            </p>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3">
            <Button
              variant="outline"
              onClick={() => setShowAbortModal(false)}
              className="border-slate-800 text-slate-400 hover:bg-slate-900"
            >
              Cancel & Stay in Mission
            </Button>
            <Button
              onClick={() => abortMutation.mutate({ missionId: dailyMission?.id, reason: abortReason })}
              disabled={abortMutation.isPending || abortReason.trim().length < 10}
              className="bg-red-600 hover:bg-red-500 text-white font-bold"
            >
              {abortMutation.isPending ? "RECORDING BREACH..." : "EXECUTE SURRENDER"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Mid-Day Pulse Intercept Enforcer */}
      <MidDayPulseModal />

      {/* Lapsed Operative Resurrection Protocol */}
      <ResurrectionModal />

      {/* Weekly Spotify Wrapped Style Telemetry Recap */}
      <WeeklyRecapModal open={showWeeklyRecap} onOpenChange={setShowWeeklyRecap} />

      {/* Tactical Mystery Cache Cipher Decryption */}
      <TacticalCacheModal />
    </div>
  );
}
