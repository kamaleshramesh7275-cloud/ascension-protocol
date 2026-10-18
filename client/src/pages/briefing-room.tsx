import { useState } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  ShieldAlert,
  Target,
  Zap,
  Flame,
  Brain,
  AlertTriangle,
  Clock,
  ArrowRight,
  ArrowLeft,
  Crosshair,
  Lock,
  ChevronRight,
  CheckCircle2,
  Activity,
  Cpu,
  Sunrise,
  Sun,
  Quote,
  Sparkles
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface IntakeData {
  // Layer 1: Target Acquisition
  targetOutcome: string;
  targetDeadline: string;
  failureStatement: string;
  // Layer 2: Gap Matrix
  gapMatrix: Record<string, number>;
  // Layer 3: Failure Autopsy
  pastAttempts: string;
  primaryFailureTrigger: string;
  rationalizationPattern: string;
  relapseSignature: string;
  // Layer 4: Cognitive Fingerprint
  peakFocusStart: string;
  peakFocusEnd: string;
  primaryDistractor: string;
  stressResponse: "freeze" | "flight" | "scatter";
  environmentPreference: string;
  // Layer 5: Commitment Calibration
  dailyDeepWorkHours: number;
  deadDays: string[];
  nonNegotiableTimeThief: string;
  weeklyTargetHours: number;
}

const DEFAULT_INTAKE: IntakeData = {
  targetOutcome: "",
  targetDeadline: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
  failureStatement: "",
  gapMatrix: {
    "Deep Focus Capacity": 4,
    "Execution Velocity": 5,
    "Resistance to Distraction": 3,
    "Emotional Regulation": 5,
    "Consistency Under Pressure": 4,
  },
  pastAttempts: "2-3 previous failed attempts",
  primaryFailureTrigger: "Digital distractions & novelty seeking",
  rationalizationPattern: "I tell myself I need more preparation or I'll restart with a clean slate tomorrow.",
  relapseSignature: "Opening social media tabs during transition between tasks and justifying it as a break.",
  peakFocusStart: "08:30",
  peakFocusEnd: "11:30",
  primaryDistractor: "Short-form video & algorithmic feeds",
  stressResponse: "flight",
  environmentPreference: "Strict silence with single active window",
  dailyDeepWorkHours: 3,
  deadDays: [],
  nonNegotiableTimeThief: "Passive evening video streaming and phone before sleep",
  weeklyTargetHours: 18,
};

export default function BriefingRoom() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [step, setStep] = useState<number>(1);
  const [data, setData] = useState<IntakeData>(DEFAULT_INTAKE);
  const [oathAccepted, setOathAccepted] = useState<boolean>(false);

  // Pillar 1 Free Intelligence (Open-Meteo Chronobiology & Stoic Combat Doctrine)
  const { data: intelData } = useQuery({
    queryKey: ["/api/protocol/pillar-1-intelligence"],
    staleTime: 1000 * 60 * 15,
  });

  const chronobiology = (intelData as any)?.chronobiology;
  const doctrine = (intelData as any)?.doctrine;

  const totalSteps = 5;
  const progressPercent = Math.round((step / totalSteps) * 100);

  const saveMutation = useMutation({
    mutationFn: async (payload: IntakeData) => {
      const formattedPayload = {
        targetOutcome: payload.targetOutcome,
        targetDeadline: new Date(payload.targetDeadline).toISOString(),
        failureStatement: payload.failureStatement,
        gapMatrix: payload.gapMatrix,
        failureAutopsy: {
          pastAttempts: payload.pastAttempts,
          primaryFailureTrigger: payload.primaryFailureTrigger,
          rationalizationPattern: payload.rationalizationPattern,
          relapseSignature: payload.relapseSignature,
        },
        cognitiveFingerprint: {
          peakFocusStart: payload.peakFocusStart,
          peakFocusEnd: payload.peakFocusEnd,
          primaryDistractor: payload.primaryDistractor,
          stressResponse: payload.stressResponse,
          environmentPreference: payload.environmentPreference,
        },
        commitmentCapacity: {
          dailyDeepWorkHours: payload.dailyDeepWorkHours,
          deadDays: payload.deadDays,
          nonNegotiableTimeThief: payload.nonNegotiableTimeThief,
          weeklyTargetHours: payload.weeklyTargetHours,
        },
      };

      const res = await apiRequest("POST", "/api/execution-profile", formattedPayload);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/execution-profile"] });
      queryClient.invalidateQueries({ queryKey: ["/api/daily-mission"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      toast({
        title: "PROTOCOL LOCKED",
        description: "Your 5-Layer Intelligence Profile is forged. Entering Mission Command.",
      });
      setLocation("/mission-command");
    },
    onError: (err: any) => {
      toast({
        title: "Calibration Failed",
        description: err.message || "Please complete all mandatory diagnostic fields.",
        variant: "destructive",
      });
    },
  });

  const handleNext = () => {
    if (step === 1) {
      if (!data.targetOutcome.trim() || data.targetOutcome.length < 5) {
        toast({ title: "Objective Required", description: "State your exact strategic target outcome.", variant: "destructive" });
        return;
      }
      if (!data.failureStatement.trim() || data.failureStatement.length < 15) {
        toast({ title: "Consequence Required", description: "Articulate the exact painful consequence if you fail.", variant: "destructive" });
        return;
      }
    }
    if (step === 3) {
      if (!data.rationalizationPattern.trim() || !data.relapseSignature.trim()) {
        toast({ title: "Diagnostic Incomplete", description: "Expose your rationalization pattern and relapse trigger.", variant: "destructive" });
        return;
      }
    }
    if (step < totalSteps) {
      setStep(step + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handlePrev = () => {
    if (step > 1) {
      setStep(step - 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleSubmit = () => {
    if (!oathAccepted) {
      toast({ title: "Oath Required", description: "You must acknowledge and lock the Execution Oath.", variant: "destructive" });
      return;
    }
    saveMutation.mutate(data);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-start p-4 sm:p-6 md:p-10 relative overflow-hidden selection:bg-amber-500 selection:text-black">
      {/* Background ambient lighting */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-5xl h-96 bg-gradient-to-b from-amber-500/10 via-cyan-500/5 to-transparent blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-80 h-80 bg-red-500/5 blur-3xl pointer-events-none" />

      {/* Top Header */}
      <header className="w-full max-w-3xl flex flex-col items-center text-center mb-8 relative z-10">
        <div className="flex items-center gap-2 mb-3">
          <Badge variant="outline" className="border-amber-500/40 text-amber-400 bg-amber-500/10 px-3 py-1 font-mono tracking-wider text-xs uppercase flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5" /> Intelligence Intake Engine
          </Badge>
          <Badge variant="outline" className="border-slate-800 text-slate-400 bg-slate-900/60 font-mono text-xs">
            Step {step} of {totalSteps}
          </Badge>
        </div>

        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white mb-2">
          THE BRIEFING ROOM
        </h1>
        <p className="text-sm text-slate-400 max-w-xl">
          Ascension Protocol does not manage tasks. It calibrates an uncompromising execution machine. Complete the 5-layer diagnostic intake.
        </p>

        {/* Progress bar */}
        <div className="w-full max-w-xl mt-6 space-y-1.5">
          <div className="flex justify-between text-xs font-mono text-slate-400">
            <span>CALIBRATION PROGRESS</span>
            <span className="text-amber-400 font-bold">{progressPercent}%</span>
          </div>
          <Progress value={progressPercent} className="h-2 bg-slate-900 border border-slate-800" />
        </div>
      </header>

      {/* Step Container */}
      <main className="w-full max-w-3xl relative z-10">
        <AnimatePresence mode="wait">
          {/* ─── LAYER 1: TARGET ACQUISITION ─── */}
          {step === 1 && (
            <motion.div
              key="step-1"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-6 sm:p-8 backdrop-blur-md shadow-2xl shadow-black/80 space-y-6"
            >
              <div className="flex items-start gap-4 pb-4 border-b border-slate-800">
                <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center shrink-0 text-amber-400">
                  <Target className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    Layer 1: Target Acquisition
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Define the singular objective and the absolute cost of failure. Vague goals produce zero cognitive leverage.
                  </p>
                </div>
              </div>

              {/* Exact Target Outcome */}
              <div className="space-y-2">
                <Label htmlFor="targetOutcome" className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                  <Crosshair className="w-4 h-4 text-amber-400" /> Strategic Target Objective
                </Label>
                <Input
                  id="targetOutcome"
                  placeholder="e.g. Master High-Level Distributed Systems & pass Staff Engineer bar"
                  value={data.targetOutcome}
                  onChange={(e) => setData({ ...data, targetOutcome: e.target.value })}
                  className="bg-slate-950/80 border-slate-700/80 focus:border-amber-500 text-white placeholder:text-slate-600 h-12"
                />
                <p className="text-xs text-slate-500">What specific, measurable victory are you commanding?</p>
              </div>

              {/* Target Deadline */}
              <div className="space-y-2">
                <Label htmlFor="targetDeadline" className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-cyan-400" /> Non-Negotiable Deadline
                </Label>
                <Input
                  id="targetDeadline"
                  type="date"
                  value={data.targetDeadline}
                  onChange={(e) => setData({ ...data, targetDeadline: e.target.value })}
                  className="bg-slate-950/80 border-slate-700/80 focus:border-cyan-500 text-white h-12"
                />
                <p className="text-xs text-slate-500">Our living roadmap will calculate daily probability curves based on this date.</p>
              </div>

              {/* Failure Statement */}
              <div className="space-y-2 pt-2">
                <Label htmlFor="failureStatement" className="text-sm font-semibold text-red-400 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-400" /> The Cost of Surrender (Failure Mirror)
                </Label>
                <Textarea
                  id="failureStatement"
                  rows={3}
                  placeholder="If I fail to execute this, the consequence is: 6 more months wasted in stagnation, losing competitive edge, and proving my own excuses right."
                  value={data.failureStatement}
                  onChange={(e) => setData({ ...data, failureStatement: e.target.value })}
                  className="bg-slate-950/80 border-red-500/30 focus:border-red-500 text-white placeholder:text-slate-600 resize-none"
                />
                <p className="text-xs text-red-400/80 font-mono">
                  ⚠ This statement will appear every single morning during your mandatory briefing. Make it hurt.
                </p>
              </div>
            </motion.div>
          )}

          {/* ─── LAYER 2: CAPABILITY X-RAY ─── */}
          {step === 2 && (
            <motion.div
              key="step-2"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-6 sm:p-8 backdrop-blur-md shadow-2xl shadow-black/80 space-y-6"
            >
              <div className="flex items-start gap-4 pb-4 border-b border-slate-800">
                <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center shrink-0 text-cyan-400">
                  <Activity className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    Layer 2: Capability X-Ray & Readiness Heatmap
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Rate your honest baseline capability from 1 (broken) to 10 (ironclad). Your weakest domain will become your initial mission focus.
                  </p>
                </div>
              </div>

              <div className="space-y-6">
                {Object.entries(data.gapMatrix).map(([domain, score]) => (
                  <div key={domain} className="space-y-2 bg-slate-950/50 p-4 rounded-xl border border-slate-800/60">
                    <div className="flex justify-between items-center text-sm font-medium">
                      <span className="text-slate-200">{domain}</span>
                      <span className={`font-mono font-bold text-sm px-2 py-0.5 rounded ${
                        score <= 4 ? "bg-red-500/20 text-red-400" : score <= 7 ? "bg-amber-500/20 text-amber-400" : "bg-emerald-500/20 text-emerald-400"
                      }`}>
                        {score} / 10
                      </span>
                    </div>
                    <Slider
                      value={[score]}
                      min={1}
                      max={10}
                      step={1}
                      onValueChange={(val) => setData({
                        ...data,
                        gapMatrix: { ...data.gapMatrix, [domain]: val[0] },
                      })}
                      className="py-2"
                    />
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* ─── LAYER 3: FAILURE AUTOPSY ─── */}
          {step === 3 && (
            <motion.div
              key="step-3"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-6 sm:p-8 backdrop-blur-md shadow-2xl shadow-black/80 space-y-6"
            >
              <div className="flex items-start gap-4 pb-4 border-b border-slate-800">
                <div className="w-12 h-12 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center justify-center shrink-0 text-red-400">
                  <ShieldAlert className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    Layer 3: Failure Autopsy & Pattern Exposure
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Expose how you have surrendered in the past. Ascension Protocol intercepts your known failure patterns before they trigger.
                  </p>
                </div>
              </div>

              {/* Past Attempts */}
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-slate-200">Past Attempts</Label>
                <RadioGroup
                  value={data.pastAttempts}
                  onValueChange={(val) => setData({ ...data, pastAttempts: val })}
                  className="grid grid-cols-1 sm:grid-cols-2 gap-2.5"
                >
                  {["First serious attempt", "1-2 previous abandoned attempts", "3-5 previous failed cycles", "Chronic cycle of starting and stopping"].map((opt) => (
                    <div
                      key={opt}
                      onClick={() => setData({ ...data, pastAttempts: opt })}
                      className={`flex items-center space-x-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
                        data.pastAttempts === opt ? "bg-amber-500/10 border-amber-500/50 text-white" : "bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700"
                      }`}
                    >
                      <RadioGroupItem value={opt} id={opt} />
                      <Label htmlFor={opt} className="cursor-pointer text-xs font-medium">{opt}</Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>

              {/* Rationalization Pattern */}
              <div className="space-y-2">
                <Label htmlFor="rationalization" className="text-sm font-semibold text-slate-200">
                  Primary Rationalization Lie
                </Label>
                <Input
                  id="rationalization"
                  placeholder='e.g. "I worked hard yesterday so taking today off won&apos;t hurt."'
                  value={data.rationalizationPattern}
                  onChange={(e) => setData({ ...data, rationalizationPattern: e.target.value })}
                  className="bg-slate-950/80 border-slate-700/80 text-white"
                />
                <p className="text-xs text-slate-500">The specific excuse your brain uses to authorize quitting.</p>
              </div>

              {/* Relapse Signature */}
              <div className="space-y-2">
                <Label htmlFor="relapse" className="text-sm font-semibold text-slate-200">
                  Early Relapse Signature (The micro-behavior before the fall)
                </Label>
                <Input
                  id="relapse"
                  placeholder='e.g. Checking notifications right after sitting down, opening YouTube "just for background music"'
                  value={data.relapseSignature}
                  onChange={(e) => setData({ ...data, relapseSignature: e.target.value })}
                  className="bg-slate-950/80 border-slate-700/80 text-white"
                />
                <p className="text-xs text-slate-500">The first physical symptom that signals focus decay.</p>
              </div>
            </motion.div>
          )}

          {/* ─── LAYER 4: COGNITIVE FINGERPRINT ─── */}
          {step === 4 && (
            <motion.div
              key="step-4"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-6 sm:p-8 backdrop-blur-md shadow-2xl shadow-black/80 space-y-6"
            >
              <div className="flex items-start gap-4 pb-4 border-b border-slate-800">
                <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center shrink-0 text-purple-400">
                  <Brain className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    Layer 4: Cognitive Fingerprint & Peak Hours
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Map your biological peak focus windows and environmental vulnerability. Single Mission Lock schedules strictly inside this window.
                  </p>
                </div>
              </div>

              {/* Chronobiology Telemetry & Auto-Calibration (Open-Meteo Free API) */}
              {chronobiology && (
                <div className="p-4 rounded-xl bg-gradient-to-br from-cyan-950/40 to-slate-950 border border-cyan-500/40 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
                        <Sunrise className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-cyan-300 uppercase tracking-wider font-mono flex items-center gap-1.5">
                          <Sun className="w-3.5 h-3.5 text-amber-400" />
                          CHRONOBIOLOGY FOCUS RADAR
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono">
                          Dawn: <span className="text-white font-bold">{chronobiology.sunrise}</span> • Phase: <span className="text-emerald-400 font-bold">{chronobiology.circadianPhase}</span>
                        </div>
                      </div>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        if (chronobiology.peakFocusWindow) {
                          const parts = chronobiology.peakFocusWindow.split(" - ");
                          if (parts.length === 2) {
                            setData((prev) => ({
                              ...prev,
                              peakFocusStart: parts[0].trim(),
                              peakFocusEnd: parts[1].trim(),
                            }));
                            toast({
                              title: "Peak Window Calibrated",
                              description: `Synchronized with biological daylight peak: ${chronobiology.peakFocusWindow}`,
                            });
                          }
                        }
                      }}
                      className="border-cyan-500/50 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 font-mono text-xs flex items-center gap-1.5 shrink-0"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                      Auto-Calibrate Peak Window
                    </Button>
                  </div>
                  <div className="text-[11px] text-slate-400 font-mono flex items-center justify-between border-t border-cyan-900/40 pt-2">
                    <span>Algorithm Recommended Window:</span>
                    <span className="text-amber-400 font-bold">{chronobiology.peakFocusWindow}</span>
                  </div>
                </div>
              )}

              {/* Peak Windows */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-slate-200">Peak Window Start</Label>
                  <Input
                    type="time"
                    value={data.peakFocusStart}
                    onChange={(e) => setData({ ...data, peakFocusStart: e.target.value })}
                    className="bg-slate-950/80 border-slate-700/80 text-white h-12"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-slate-200">Peak Window End</Label>
                  <Input
                    type="time"
                    value={data.peakFocusEnd}
                    onChange={(e) => setData({ ...data, peakFocusEnd: e.target.value })}
                    className="bg-slate-950/80 border-slate-700/80 text-white h-12"
                  />
                </div>
              </div>

              {/* Stress Response */}
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-slate-200">Under High Stress, you default to:</Label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    { val: "freeze", title: "Freeze (Paralysis)", desc: "Staring at screen, unable to start, overwhelmed" },
                    { val: "flight", title: "Flight (Escapism)", desc: "Switching to easy entertainment, feeds, eating" },
                    { val: "scatter", title: "Scatter (Fake Work)", desc: "Organizing folders, re-formatting, busywork" },
                  ].map((mode) => (
                    <div
                      key={mode.val}
                      onClick={() => setData({ ...data, stressResponse: mode.val as any })}
                      className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                        data.stressResponse === mode.val
                          ? "bg-purple-500/15 border-purple-500/60 text-white shadow-lg shadow-purple-500/10"
                          : "bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700"
                      }`}
                    >
                      <div className="font-semibold text-sm text-purple-300">{mode.title}</div>
                      <div className="text-xs text-slate-400 mt-1">{mode.desc}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Primary Distractor */}
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-slate-200">Primary Attention Parasite</Label>
                <Input
                  value={data.primaryDistractor}
                  onChange={(e) => setData({ ...data, primaryDistractor: e.target.value })}
                  placeholder="e.g. YouTube recommendations, Twitter/X, Discord notifications"
                  className="bg-slate-950/80 border-slate-700/80 text-white"
                />
              </div>
            </motion.div>
          )}

          {/* ─── LAYER 5: COMMITMENT CALIBRATION & OATH ─── */}
          {step === 5 && (
            <motion.div
              key="step-5"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-6 sm:p-8 backdrop-blur-md shadow-2xl shadow-black/80 space-y-6"
            >
              <div className="flex items-start gap-4 pb-4 border-b border-slate-800">
                <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center shrink-0 text-amber-400">
                  <Flame className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    Layer 5: Commitment Calibration & The Iron Oath
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Calibrate realistic daily deep work capacity. Overpromising is an amateur trait. Lock in sustainable intensity.
                  </p>
                </div>
              </div>

              {/* Daily Deep Work Hours */}
              <div className="space-y-3 bg-slate-950/50 p-4 rounded-xl border border-slate-800/60">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-semibold text-slate-200">Daily Deep Work Non-Negotiable</span>
                  <Badge variant="outline" className="border-amber-500/40 text-amber-400 font-mono text-base px-3 py-0.5">
                    {data.dailyDeepWorkHours} Hours / Day
                  </Badge>
                </div>
                <Slider
                  value={[data.dailyDeepWorkHours]}
                  min={1}
                  max={8}
                  step={0.5}
                  onValueChange={(val) => setData({
                    ...data,
                    dailyDeepWorkHours: val[0],
                    weeklyTargetHours: Math.round(val[0] * 6),
                  })}
                  className="py-2"
                />
                <p className="text-xs text-slate-500">
                  Unbroken, distraction-free Air-Gap sessions. 3 focused hours beats 10 distracted hours.
                </p>
              </div>

              {/* Non-negotiable time thief */}
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-slate-200">The Habit Being Executed (Killed)</Label>
                <Input
                  value={data.nonNegotiableTimeThief}
                  onChange={(e) => setData({ ...data, nonNegotiableTimeThief: e.target.value })}
                  placeholder="e.g. Mindless scrolling in bed before sleeping"
                  className="bg-slate-950/80 border-slate-700/80 text-white"
                />
              </div>

              {/* Daily Stoic Combat Doctrine (Free API) */}
              {doctrine && (
                <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Quote className="w-3.5 h-3.5 text-cyan-400" />
                      TACTICAL COMBAT DECREE // {doctrine.author.toUpperCase()}
                    </span>
                    <Badge variant="outline" className="border-slate-800 text-[9px] font-mono text-slate-400">
                      {doctrine.tacticalCategory}
                    </Badge>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-200 italic font-mono leading-relaxed">
                    &ldquo;{doctrine.text}&rdquo;
                  </p>
                </div>
              )}

              {/* The Iron Oath */}
              <div className="p-5 rounded-xl bg-gradient-to-br from-amber-500/10 via-slate-900 to-red-500/10 border border-amber-500/40 space-y-4">
                <div className="flex items-center gap-2 text-amber-400 font-bold text-sm tracking-wider uppercase">
                  <Lock className="w-4 h-4" /> THE PROTOCOL OATH
                </div>
                <p className="text-xs text-slate-300 leading-relaxed italic">
                  &ldquo;I acknowledge that my current state is the direct sum of my past disciplines and compromises.
                  I accept that Ascension Protocol does not negotiate, comfort, or indulge rationalizations.
                  I commit to acknowledging my Morning Briefing, executing my Daily Single Mission, locking into Air-Gap sessions, and submitting honest proof of work.&rdquo;
                </p>

                <div
                  onClick={() => setOathAccepted(!oathAccepted)}
                  className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                    oathAccepted
                      ? "bg-amber-500/20 border-amber-500 text-white"
                      : "bg-slate-950/80 border-slate-700 text-slate-400 hover:border-slate-500"
                  }`}
                >
                  <div className={`w-5 h-5 rounded flex items-center justify-center border ${
                    oathAccepted ? "bg-amber-500 border-amber-500 text-black" : "border-slate-600"
                  }`}>
                    {oathAccepted && <CheckCircle2 className="w-4 h-4 text-black" />}
                  </div>
                  <span className="text-xs font-semibold select-none">
                    I BIND MYSELF TO THIS PROTOCOL (LOCK SYSTEM)
                  </span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Navigation Actions */}
        <div className="flex justify-between items-center mt-6">
          {step > 1 ? (
            <Button
              variant="outline"
              onClick={handlePrev}
              className="border-slate-800 text-slate-300 hover:bg-slate-900 flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" /> Previous Layer
            </Button>
          ) : (
            <div />
          )}

          {step < totalSteps ? (
            <Button
              onClick={handleNext}
              className="bg-amber-500 hover:bg-amber-400 text-black font-bold flex items-center gap-2 px-6"
            >
              Next Layer <ArrowRight className="w-4 h-4" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={saveMutation.isPending || !oathAccepted}
              className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black font-extrabold flex items-center gap-2 px-8 shadow-lg shadow-amber-500/20"
            >
              {saveMutation.isPending ? "INITIALIZING ENGINE..." : "LOCK PROTOCOL & COMMENCE"}
              <Cpu className="w-4 h-4" />
            </Button>
          )}
        </div>
      </main>
    </div>
  );
}
