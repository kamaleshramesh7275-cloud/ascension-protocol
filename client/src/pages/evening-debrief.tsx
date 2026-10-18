import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { audioEngine } from "@/lib/audio-engine";
import {
  FileCheck,
  ShieldAlert,
  Flame,
  Clock,
  Crosshair,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Sparkles,
  BarChart3,
  Lock,
  Zap,
  ArrowLeft
} from "lucide-react";

export default function EveningDebrief() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [reflectionText, setReflectionText] = useState<string>("");
  const [selfHonestyRating, setSelfHonestyRating] = useState<number>(8);

  const today = new Date().toISOString().split("T")[0];

  const { data: debriefData, isLoading } = useQuery<any>({
    queryKey: ["/api/evening-debrief", today],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/evening-debrief?date=${today}`);
      return res.json();
    },
  });

  const submitMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/evening-debrief", {
        date: today,
        missionId: debriefData?.mission?.id || null,
        reflectionText,
        selfHonestyRating,
      });
      return res.json();
    },
    onSuccess: () => {
      audioEngine.playCourtGavel();
      queryClient.invalidateQueries({ queryKey: ["/api/evening-debrief"] });
      queryClient.invalidateQueries({ queryKey: ["/api/focus-density"] });
      toast({
        title: "EVENING AUDIT RECORDED",
        description: "Your daily execution record is sealed.",
      });
      setLocation("/mission-command");
    },
    onError: (err: any) => {
      toast({
        title: "Submission Error",
        description: err.message || "Please provide authentic reflection.",
        variant: "destructive",
      });
    },
  });

  const mission = debriefData?.mission;
  const existingDebrief = debriefData?.debrief;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col p-4 sm:p-6 md:p-10 relative overflow-hidden">
      <div className="w-full max-w-3xl mx-auto space-y-8 relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <Button
            variant="outline"
            onClick={() => setLocation("/mission-command")}
            className="border-slate-800 text-slate-400 hover:text-white flex items-center gap-1.5 text-xs font-mono"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Mission Command
          </Button>

          <Badge variant="outline" className="border-amber-500/40 text-amber-400 bg-amber-500/10 font-mono text-xs uppercase px-3 py-1">
            <Lock className="w-3.5 h-3.5 mr-1 inline" /> MANDATORY EVENING AUDIT
          </Badge>
        </div>

        <div className="space-y-2">
          <h1 className="text-3xl font-black text-white tracking-tight">
            THE EVENING DEBRIEF
          </h1>
          <p className="text-sm text-slate-400">
            A day concluded without audit is a day surrendered to unconscious habit. Record your honest verdict.
          </p>
        </div>

        {/* ─── TODAY'S EXECUTION SUMMARY ─── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <div className="text-xs font-mono text-slate-400 mb-1">MISSION OUTCOME</div>
            <div className="text-base font-bold text-white uppercase flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${
                mission?.status === "completed" ? "bg-emerald-400" : mission?.status === "aborted" ? "bg-red-400" : "bg-amber-400"
              }`} />
              {mission?.status || "UNCOMMITTED"}
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <div className="text-xs font-mono text-slate-400 mb-1">DEEP WORK LOGGED</div>
            <div className="text-base font-bold text-white font-mono">
              {debriefData?.todayFocusMinutes ?? 0} MINUTES
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <div className="text-xs font-mono text-slate-400 mb-1">BREACHES DETECTED</div>
            <div className="text-base font-bold text-red-400 font-mono">
              {debriefData?.todayBreachesCount ?? 0} EVENTS
            </div>
          </div>
        </div>

        {/* Mission Card Context */}
        {mission && (
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 space-y-2">
            <div className="text-xs font-mono text-amber-400 uppercase font-semibold">
              TODAY&apos;S MISSION OBJECTIVE
            </div>
            <div className="text-base font-bold text-white">{mission.title}</div>
            <div className="text-xs text-slate-400">
              Deliverable: {mission.tacticalDeliverable}
            </div>
          </div>
        )}

        {/* ─── EXISTING DEBRIEF VERDICT IF ALREADY SUBMITTED ─── */}
        {existingDebrief ? (
          <div className="bg-slate-900 border border-emerald-500/40 rounded-2xl p-6 sm:p-8 space-y-4">
            <div className="flex items-center gap-2 text-emerald-400 font-mono text-xs font-bold uppercase tracking-wider">
              <CheckCircle2 className="w-4 h-4" /> AUDIT SEALED FOR {today}
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
              <div className="text-xs font-mono text-slate-400 uppercase">AI COMMANDER VERDICT</div>
              <p className="text-sm text-slate-200 italic font-mono leading-relaxed">
                &ldquo;{existingDebrief.aiFeedback}&rdquo;
              </p>
            </div>

            <div className="space-y-1">
              <div className="text-xs font-mono text-slate-400 uppercase">YOUR REFLECTION</div>
              <p className="text-sm text-slate-300">
                {existingDebrief.reflectionText}
              </p>
            </div>

            <Button
              onClick={() => setLocation("/mission-command")}
              className="bg-amber-500 hover:bg-amber-400 text-black font-extrabold px-6"
            >
              Return to Mission Command
            </Button>
          </div>
        ) : (
          /* ─── DEBRIEF FORM ─── */
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6">
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-slate-200">
                Honest Self-Interrogation (Min 20 characters):
              </Label>
              <Textarea
                rows={4}
                placeholder="Did you protect your focus or indulge in micro-compromises? Did you execute the deliverable with full intensity? State the exact truth."
                value={reflectionText}
                onChange={(e) => setReflectionText(e.target.value)}
                className="bg-slate-950 border-slate-700 text-white placeholder:text-slate-600 resize-none"
              />
              <p className="text-[11px] text-slate-500">
                Self-deception is structurally filtered. Be brutal with your analysis.
              </p>
            </div>

            <div className="space-y-3 bg-slate-950/60 p-4 rounded-xl border border-slate-800">
              <div className="flex justify-between items-center text-xs font-mono">
                <span className="text-slate-300 font-semibold">SELF-HONESTY RATING:</span>
                <span className="text-amber-400 font-bold text-sm">{selfHonestyRating} / 10</span>
              </div>
              <Slider
                value={[selfHonestyRating]}
                min={1}
                max={10}
                step={1}
                onValueChange={(val) => setSelfHonestyRating(val[0])}
              />
            </div>

            <Button
              onClick={() => submitMutation.mutate()}
              disabled={submitMutation.isPending || reflectionText.trim().length < 20}
              className="w-full bg-amber-500 hover:bg-amber-400 text-black font-extrabold h-12 flex items-center justify-center gap-2"
            >
              {submitMutation.isPending ? "SEALING AUDIT..." : "SUBMIT EVENING DEBRIEF"}
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
