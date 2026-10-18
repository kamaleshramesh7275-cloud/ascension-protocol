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
import { audioEngine } from "@/lib/audio-engine";
import { useToast } from "@/hooks/use-toast";
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
  const [abortReason, setAbortReason] = useState<string>("");
  const [primingCompleted, setPrimingCompleted] = useState<boolean>(false);

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
        title: "MILESTONE CONQUERED! 🏆",
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
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col p-4 sm:p-6 md:p-8 relative overflow-hidden">
      {/* Background ambient grid & lighting */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b0a_1px,transparent_1px),linear-gradient(to_bottom,#1e293b0a_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />
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
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800/80">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <Badge variant="outline" className="border-amber-500/30 text-amber-400 bg-amber-500/10 text-[11px] font-mono tracking-widest uppercase">
                <Radio className="w-3 h-3 animate-pulse text-amber-400" /> MISSION COMMAND CENTER
              </Badge>
              <Badge variant="outline" className="border-slate-800 text-slate-400 font-mono text-[11px]">
                {new Date().toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}
              </Badge>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-2">
              ASCENSION PROTOCOL
            </h1>
          </div>

          <div className="flex items-center gap-2.5">
            <TacticalScenarioInjector />
            <Button
              variant="outline"
              onClick={() => setLocation("/evening-debrief")}
              className="border-slate-800 text-slate-300 hover:bg-slate-900 text-xs font-semibold flex items-center gap-1.5"
            >
              <FileCheck className="w-3.5 h-3.5 text-cyan-400" />
              Evening Debrief
            </Button>
            <Button
              variant="outline"
              onClick={() => setLocation("/briefing-room")}
              className="border-slate-800 text-slate-400 hover:text-white text-xs font-mono"
            >
              Diagnostic
            </Button>
          </div>
        </header>

        {/* Cybernetic Native PWA Mobile Enclave Banner */}
        <PWAEnclaveBanner />

        {/* ─── HERO METRIC: FOCUS DENSITY & DISCIPLINE REPUTATION ─── */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Focus Density Score Widget */}
          <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-5 backdrop-blur-md relative overflow-hidden flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-mono text-slate-400 font-semibold uppercase tracking-wider flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-amber-400" /> FOCUS DENSITY SCORE
              </span>
              <span className="text-xs font-mono text-amber-400 font-bold">{densityPercent}%</span>
            </div>

            <div className="my-2">
              <div className="text-4xl font-black text-white font-mono tracking-tight">
                {densityPercent}%
              </div>
              <p className="text-xs text-slate-400 mt-1">
                {totalMinutes} Verified Deep Work Minutes Today
              </p>
            </div>

            <Progress value={densityPercent} className="h-1.5 bg-slate-950 mt-2" />
          </div>

          {/* Discipline Reputation Score */}
          <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-5 backdrop-blur-md relative overflow-hidden flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-mono text-slate-400 font-semibold uppercase tracking-wider flex items-center gap-1.5">
                <Crosshair className="w-3.5 h-3.5 text-cyan-400" /> DISCIPLINE SCORE
              </span>
              <Badge variant="outline" className="border-cyan-500/30 text-cyan-400 bg-cyan-500/10 text-[10px] font-mono">
                {discipline?.tier || "Practitioner"}
              </Badge>
            </div>

            <div className="my-2">
              <div className="text-4xl font-black text-white font-mono tracking-tight">
                {discipline?.score ?? 700}
                <span className="text-base text-slate-500 font-normal"> / 1000</span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Non-purchasable metric • {discipline?.completedMissions ?? 0} Completed Missions
              </p>
            </div>

            <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 mt-2 pt-2 border-t border-slate-800/60">
              <span>BREACHES: {discipline?.totalBreaches ?? 0}</span>
              <span>PEAK: {discipline?.highestScore ?? 700}</span>
            </div>
          </div>

          {/* Current Execution Streak */}
          <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-5 backdrop-blur-md relative overflow-hidden flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-mono text-slate-400 font-semibold uppercase tracking-wider flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5 text-orange-400" /> EXECUTION STREAK
              </span>
              <Badge variant="outline" className="border-orange-500/30 text-orange-400 bg-orange-500/10 text-[10px] font-mono">
                Unbroken
              </Badge>
            </div>

            <div className="my-2">
              <div className="text-4xl font-black text-white font-mono tracking-tight flex items-baseline gap-2">
                {discipline?.currentStreak ?? 0}
                <span className="text-lg text-orange-400 font-semibold">DAYS</span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Zero missed days authorized. Reset to zero on abort.
              </p>
            </div>

            <div className="text-[11px] font-mono text-slate-500 mt-2 pt-2 border-t border-slate-800/60 flex items-center gap-1.5 text-emerald-400">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Target: 30 consecutive days for Ironclad tier</span>
            </div>
          </div>
        </section>

        {/* ─── TODAY'S SINGLE MISSION CARD (7-FIELDS) ─── */}
        <section className="bg-gradient-to-br from-slate-900 via-slate-900/90 to-slate-950 border-2 border-amber-500/30 rounded-2xl p-6 sm:p-8 shadow-2xl relative overflow-hidden space-y-6">
          {/* Subtle amber top edge glow */}
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-amber-500 to-transparent" />

          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="outline" className="border-amber-500 text-amber-400 bg-amber-500/10 font-mono text-xs uppercase px-2.5 py-0.5">
                  SINGLE MISSION LOCK
                </Badge>
                <Badge className={`font-mono text-xs uppercase ${
                  dailyMission?.status === "completed"
                    ? "bg-emerald-500 text-black"
                    : dailyMission?.status === "committed"
                    ? "bg-cyan-500 text-black"
                    : dailyMission?.status === "aborted"
                    ? "bg-red-500 text-white"
                    : "bg-amber-500 text-black"
                }`}>
                  {dailyMission?.status || "PENDING"}
                </Badge>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white">
                {dailyMission?.title || "Strategic Objective Loading..."}
              </h2>
            </div>

            <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
              <Clock className="w-4 h-4 text-cyan-400" />
              <span>WINDOW: {dailyMission?.executionWindow || "09:00 - 11:30"}</span>
            </div>
          </div>

          {/* 7-Field Mission Anatomy */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Field 1: Tactical Deliverable */}
            <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800 space-y-1">
              <div className="text-xs font-mono text-amber-400 font-semibold uppercase flex items-center gap-1.5">
                <Crosshair className="w-3.5 h-3.5" /> 1. Tactical Deliverable (Verifiable Output)
              </div>
              <p className="text-sm text-slate-200 font-medium">
                {dailyMission?.tacticalDeliverable || "Generate and submit proof of tangible progress."}
              </p>
            </div>

            {/* Field 2: Focus Tier & Duration */}
            <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800 space-y-1">
              <div className="text-xs font-mono text-cyan-400 font-semibold uppercase flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5" /> 2. Focus Tier & Standard
              </div>
              <p className="text-sm text-slate-200">
                <span className="font-bold text-white font-mono">{dailyMission?.focusTier || "L1 Platinum"}</span> • {dailyMission?.estimatedMinutes || 90} Minutes Unbroken Air-Gap
              </p>
            </div>

            {/* Field 3: Priming Ritual (Interactive) */}
            <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800 space-y-2">
              <div className="text-xs font-mono text-purple-400 font-semibold uppercase flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" /> 3. Priming Ritual (Break Cold-Start Paralysis)
              </div>
              <div
                onClick={() => setPrimingCompleted(!primingCompleted)}
                className={`flex items-start gap-2.5 p-2.5 rounded-lg border cursor-pointer transition-all ${
                  primingCompleted ? "bg-purple-500/10 border-purple-500/40 text-white" : "border-slate-800 text-slate-300 hover:border-slate-700"
                }`}
              >
                <div className={`w-4 h-4 rounded mt-0.5 shrink-0 flex items-center justify-center border ${
                  primingCompleted ? "bg-purple-500 border-purple-500 text-black" : "border-slate-600"
                }`}>
                  {primingCompleted && <CheckCircle2 className="w-3.5 h-3.5 text-black" />}
                </div>
                <p className="text-xs leading-relaxed select-none">
                  {dailyMission?.primingRitual || "Clear desktop of all clutter. Open document and write acceptance criteria."}
                </p>
              </div>
            </div>

            {/* Field 4: Failure Condition */}
            <div className="bg-red-950/20 p-4 rounded-xl border border-red-500/30 space-y-1">
              <div className="text-xs font-mono text-red-400 font-semibold uppercase flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-red-400" /> 4. Strict Failure Trigger
              </div>
              <p className="text-xs text-red-200/90 leading-relaxed">
                {dailyMission?.failureCondition || "Leaving workspace before 45 minutes or switching to non-essential browser tabs."}
              </p>
            </div>
          </div>

          {/* Verification Status Banner if completed */}
          {dailyMission?.status === "completed" && (
            <div className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-500/40 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-sm font-bold text-white">MISSION DELIVERABLE VERIFIED</div>
                  <div className="text-xs text-emerald-400/90 font-mono">
                    Quality Score: {dailyMission.proofQualityScore}/100 • &ldquo;{dailyMission.aiReviewFeedback}&rdquo;
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Action CTAs */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-3">
            <div className="flex items-center gap-2">
              {dailyMission?.status !== "aborted" && dailyMission?.status !== "completed" && (
                <Button
                  variant="outline"
                  onClick={() => setShowAbortModal(true)}
                  className="border-red-900/40 text-red-400 hover:bg-red-950/50 hover:text-red-300 text-xs font-mono"
                >
                  Abort Protocol
                </Button>
              )}
            </div>

            <div className="flex items-center gap-3">
              {dailyMission?.status === "pending" && (
                <Button
                  onClick={() => commitMutation.mutate(dailyMission.id)}
                  disabled={commitMutation.isPending}
                  className="bg-amber-500 hover:bg-amber-400 text-black font-extrabold px-6"
                >
                  {commitMutation.isPending ? "LOCKING..." : "COMMIT TO TODAY'S MISSION"}
                </Button>
              )}

              {dailyMission?.status === "committed" && (
                <>
                  <Button
                    onClick={() => setLocation(`/air-gap-focus?missionId=${dailyMission.id}`)}
                    className="bg-cyan-500 hover:bg-cyan-400 text-black font-extrabold flex items-center gap-2 px-6"
                  >
                    <Lock className="w-4 h-4" /> ENTER AIR-GAP PROTOCOL
                  </Button>
                  <Button
                    onClick={() => setShowProofModal(true)}
                    className="bg-emerald-500 hover:bg-emerald-400 text-black font-bold flex items-center gap-2 px-5"
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
          <section className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 sm:p-6 space-y-5 backdrop-blur-md relative overflow-hidden">
            {/* Ambient accent based on trajectory status */}
            <div className={`absolute top-0 left-0 w-full h-1 ${
              trajectory?.status === "AHEAD_OF_PACE"
                ? "bg-gradient-to-r from-emerald-500 via-cyan-400 to-emerald-500"
                : trajectory?.status === "ON_TRACK"
                ? "bg-gradient-to-r from-cyan-500 via-amber-400 to-cyan-500"
                : trajectory?.status === "DRIFT_WARNING"
                ? "bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 animate-pulse"
                : "bg-gradient-to-r from-red-600 via-rose-500 to-red-600 animate-pulse"
            }`} />

            {/* Header with Title, Status Pill & Recalibrate CTA */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
                  <Compass className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                      LIVING ROADMAP & DYNAMIC TRAJECTORY
                    </h3>
                    {trajectory && (
                      <Badge
                        variant="outline"
                        className={`text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 ${
                          trajectory.status === "AHEAD_OF_PACE"
                            ? "border-emerald-500/40 text-emerald-400 bg-emerald-950/40"
                            : trajectory.status === "ON_TRACK"
                            ? "border-cyan-500/40 text-cyan-400 bg-cyan-950/40"
                            : trajectory.status === "DRIFT_WARNING"
                            ? "border-amber-500/40 text-amber-400 bg-amber-950/40"
                            : "border-red-500/50 text-red-400 bg-red-950/50"
                        }`}
                      >
                        {trajectory.status === "AHEAD_OF_PACE" && "🟢 Ahead of Schedule"}
                        {trajectory.status === "ON_TRACK" && "⚡ On Track"}
                        {trajectory.status === "DRIFT_WARNING" && "⚠️ Velocity Drift"}
                        {trajectory.status === "CRITICAL_DRIFT" && "🚨 Critical Drift"}
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 font-mono mt-0.5">
                    Target: <span className="text-slate-200">{profile.targetOutcome}</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => recalibrateMutation.mutate()}
                  disabled={recalibrateMutation.isPending}
                  className="border-slate-700 bg-slate-950 hover:bg-slate-800 text-xs font-mono text-slate-300 hover:text-white flex items-center gap-1.5 h-8"
                >
                  <RefreshCw className={`w-3.5 h-3.5 text-cyan-400 ${recalibrateMutation.isPending ? "animate-spin" : ""}`} />
                  {recalibrateMutation.isPending ? "Recalibrating..." : "Recalibrate Trajectory"}
                </Button>
              </div>
            </div>

            {/* Dynamic Telemetry Velocity Bar */}
            {trajectory && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-950/60 p-3.5 rounded-xl border border-slate-800/80 text-xs font-mono">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-md bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                    <TrendingUp className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-500 uppercase">EXECUTION VELOCITY</div>
                    <div className="text-sm font-bold text-white flex items-center gap-1">
                      {trajectory.velocityIndex}x
                      <span className={`text-[11px] ${trajectory.velocityIndex >= 1.0 ? "text-emerald-400" : "text-amber-400"}`}>
                        {trajectory.velocityIndex >= 1.0 ? "Pacing High" : "Under Baseline"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 border-t sm:border-t-0 sm:border-l border-slate-800/80 pt-2 sm:pt-0 sm:pl-3">
                  <div className="w-7 h-7 rounded-md bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                    <Calendar className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-500 uppercase">PROJECTED COMPLETION</div>
                    <div className="text-sm font-bold text-white">
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
                    className={`p-4 rounded-xl border flex flex-col justify-between transition-all ${
                      isCurrent
                        ? "bg-amber-500/10 border-amber-500/50 shadow-lg shadow-amber-500/10 ring-1 ring-amber-500/30"
                        : isPast
                        ? "bg-emerald-950/20 border-emerald-500/40 text-slate-300"
                        : "bg-slate-950/50 border-slate-800/80 text-slate-500"
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between text-[11px] font-mono mb-2">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          isPast
                            ? "bg-emerald-500/20 text-emerald-400"
                            : isCurrent
                            ? "bg-amber-500/20 text-amber-300"
                            : "bg-slate-900 text-slate-500"
                        }`}>
                          {isPast ? "Conquered" : `Phase ${idx + 1}`}
                        </span>
                        <div className="flex items-center gap-1 font-bold">
                          <span className={
                            m.probabilityScore >= 80 ? "text-emerald-400" : m.probabilityScore >= 60 ? "text-amber-400" : "text-red-400"
                          }>
                            {m.probabilityScore}%
                          </span>
                          <span className="text-[9px] text-slate-500 font-normal">PROB</span>
                        </div>
                      </div>

                      <div className="text-xs font-bold text-white leading-snug">{m.title}</div>
                      <div className="text-[11px] text-slate-400 mt-1.5 leading-relaxed">
                        {m.coreDeliverable}
                      </div>
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-slate-800/60 flex items-center justify-between text-[10px] font-mono">
                      <span className="text-slate-500">Target: Week {m.weekNumber}</span>
                      {isCurrent && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => advanceMutation.mutate()}
                          disabled={advanceMutation.isPending}
                          className="h-6 px-2 text-[10px] font-bold text-amber-400 hover:text-amber-300 hover:bg-amber-500/10 p-0"
                        >
                          {advanceMutation.isPending ? "Locking..." : "Advance Phase ➔"}
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
    </div>
  );
}
