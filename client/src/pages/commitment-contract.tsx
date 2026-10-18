import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { audioEngine } from "@/lib/audio-engine";
import {
  FileText,
  ShieldAlert,
  Flame,
  Zap,
  Lock,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  DollarSign,
  Scale,
  Award,
  Users
} from "lucide-react";

export default function CommitmentContractPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [targetMissions, setTargetMissions] = useState<number>(5);
  const [targetHours, setTargetHours] = useState<number>(10);
  const [stakeTier, setStakeTier] = useState<string>("reputation");
  const [antiCharityCause, setAntiCharityCause] = useState<string>("Opposed Political PAC");
  const [antiCharityAmount, setAntiCharityAmount] = useState<number>(25);
  const [signatureName, setSignatureName] = useState<string>("");
  const [oathAccepted, setOathAccepted] = useState<boolean>(false);

  // Fetch active contract & progress
  const { data: contractData, isLoading } = useQuery<any>({
    queryKey: ["/api/commitment-contract"],
  });

  // Sign Contract Mutation
  const signMutation = useMutation({
    mutationFn: async () => {
      const today = new Date();
      const monday = new Date(today);
      monday.setDate(today.getDate() - today.getDay() + 1);
      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);

      const res = await apiRequest("POST", "/api/commitment-contract", {
        weekStartDate: monday.toISOString().split("T")[0],
        weekEndDate: sunday.toISOString().split("T")[0],
        targetMissionsCount: targetMissions,
        targetFocusMinutes: targetHours * 60,
        stakeAmountCents: stakeTier === "anticharity" ? antiCharityAmount * 100 : 0,
        antiCharityRecipient: stakeTier === "anticharity" ? antiCharityCause : null,
      });
      return res.json();
    },
    onSuccess: () => {
      audioEngine.playCourtGavel();
      queryClient.invalidateQueries({ queryKey: ["/api/commitment-contract"] });
      toast({
        title: "CONTRACT SEALED",
        description: "Your weekly targets and consequences are legally bound to your record.",
      });
    },
    onError: (err: any) => {
      toast({ title: "Failed to sign contract", description: err.message, variant: "destructive" });
    },
  });

  // Evaluate Contract Mutation
  const evaluateMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/commitment-contract/evaluate");
      return res.json();
    },
    onSuccess: (data) => {
      if (data.passed) {
        audioEngine.playCourtGavel();
      } else {
        audioEngine.startKlaxonSiren();
        setTimeout(() => audioEngine.stopKlaxonSiren(), 2000);
      }
      queryClient.invalidateQueries({ queryKey: ["/api/commitment-contract"] });
      queryClient.invalidateQueries({ queryKey: ["/api/focus-density"] });
      toast({
        title: data.passed ? "CONTRACT FULFILLED" : "CONTRACT BREACH RECORDED",
        description: data.verdict,
        variant: data.passed ? "default" : "destructive",
      });
    },
    onError: (err: any) => {
      toast({ title: "Evaluation Error", description: err.message, variant: "destructive" });
    },
  });

  const contract = contractData?.contract;
  const currentMissions = contractData?.currentMissions ?? 0;
  const currentMinutes = contractData?.currentMinutes ?? 0;

  const missionPercent = contract ? Math.min(100, Math.round((currentMissions / contract.targetMissionsCount) * 100)) : 0;
  const focusPercent = contract ? Math.min(100, Math.round((currentMinutes / contract.targetFocusMinutes) * 100)) : 0;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col p-4 sm:p-6 md:p-8 relative overflow-hidden">
      <div className="w-full max-w-4xl mx-auto space-y-8 relative z-10">
        {/* Header */}
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <Badge variant="outline" className="border-amber-500/40 text-amber-400 bg-amber-500/10 font-mono text-[11px] uppercase tracking-wider">
                <Scale className="w-3.5 h-3.5 mr-1 inline" /> PILLAR 4: HIGH-STAKES COMMITMENT
              </Badge>
              <Badge variant="outline" className="border-slate-800 text-slate-400 font-mono text-[11px]">
                Irrevocable Accountability
              </Badge>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              WEEKLY COMMITMENT CONTRACT
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={() => setLocation("/performance-court")}
              className="border-slate-800 text-slate-300 hover:bg-slate-900 text-xs font-mono"
            >
              Performance Court
            </Button>
          </div>
        </header>

        {/* ─── ACTIVE CONTRACT TRACKING ─── */}
        {contract && contract.status === "active" && (
          <section className="bg-slate-900/90 border-2 border-amber-500/40 rounded-2xl p-6 sm:p-8 space-y-6 shadow-2xl relative overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
              <div>
                <Badge variant="outline" className="border-cyan-500 text-cyan-400 bg-cyan-500/10 font-mono text-xs uppercase mb-1">
                  CONTRACT IN EFFECT
                </Badge>
                <h2 className="text-xl sm:text-2xl font-black text-white">
                  Week of {contract.weekStartDate} to {contract.weekEndDate}
                </h2>
              </div>

              <div className="text-right">
                <div className="text-xs font-mono text-slate-400 uppercase">EVALUATION DEADLINE</div>
                <div className="text-sm font-bold text-amber-400 font-mono">Sunday 11:59 PM (Automatic)</div>
              </div>
            </div>

            {/* Target 1: Missions */}
            <div className="space-y-2 bg-slate-950/70 p-4 rounded-xl border border-slate-800">
              <div className="flex justify-between items-center text-xs font-mono">
                <span className="text-slate-300 font-semibold uppercase">1. MISSIONS VERIFIED:</span>
                <span className="text-amber-400 font-bold">
                  {currentMissions} / {contract.targetMissionsCount} COMPLETED ({missionPercent}%)
                </span>
              </div>
              <Progress value={missionPercent} className="h-2 bg-slate-900" />
            </div>

            {/* Target 2: Focus Minutes */}
            <div className="space-y-2 bg-slate-950/70 p-4 rounded-xl border border-slate-800">
              <div className="flex justify-between items-center text-xs font-mono">
                <span className="text-slate-300 font-semibold uppercase">2. VERIFIED DEEP WORK MINUTES:</span>
                <span className="text-cyan-400 font-bold">
                  {currentMinutes} / {contract.targetFocusMinutes} MINS ({focusPercent}%)
                </span>
              </div>
              <Progress value={focusPercent} className="h-2 bg-slate-900" />
            </div>

            {/* Locked Consequence Warning */}
            <div className="p-4 rounded-xl bg-red-950/20 border border-red-500/30 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <ShieldAlert className="w-6 h-6 text-red-400 shrink-0" />
                <div className="text-xs text-red-200/90 leading-relaxed">
                  <strong className="text-red-400 uppercase font-mono">BOUND CONSEQUENCE: </strong>
                  {contract.stakeAmountCents > 0
                    ? `Pre-authorized $${contract.stakeAmountCents / 100} donation to ${contract.antiCharityRecipient || "Opposed Cause"}`
                    : "Permanent -75 Discipline Reputation deduction + automatic squad failure broadcast."}
                </div>
              </div>
            </div>

            {/* Manual Evaluation Trigger */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <Button
                onClick={() => evaluateMutation.mutate()}
                disabled={evaluateMutation.isPending}
                className="bg-slate-800 hover:bg-slate-700 text-white font-mono text-xs border border-slate-700"
              >
                {evaluateMutation.isPending ? "ASSESSING..." : "Run Mid-Week Settlement Audit"}
              </Button>
            </div>
          </section>
        )}

        {/* ─── NEW CONTRACT SIGNING FORM (IF NONE ACTIVE) ─── */}
        {(!contract || contract.status !== "active") && (
          <section className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6">
            <div className="flex items-start gap-3 pb-4 border-b border-slate-800">
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Sign This Week&apos;s Commitment Contract</h2>
                <p className="text-xs text-slate-400 mt-1">
                  Commitment without consequences is just fantasy. Set your non-negotiable targets and select your failure consequence.
                </p>
              </div>
            </div>

            {/* Target 1: Weekly Deep Work Hours */}
            <div className="space-y-3 bg-slate-950/60 p-4 rounded-xl border border-slate-800">
              <div className="flex justify-between items-center text-xs font-mono">
                <span className="text-slate-300 font-semibold uppercase">TARGET DEEP WORK HOURS:</span>
                <span className="text-amber-400 font-bold text-sm">{targetHours} HOURS / WEEK</span>
              </div>
              <Slider
                value={[targetHours]}
                min={5}
                max={30}
                step={1}
                onValueChange={(val) => setTargetHours(val[0])}
              />
              <p className="text-[11px] text-slate-500">
                Verified through Air-Gap sessions only. Casual time does not count.
              </p>
            </div>

            {/* Target 2: Missions Count */}
            <div className="space-y-3 bg-slate-950/60 p-4 rounded-xl border border-slate-800">
              <div className="flex justify-between items-center text-xs font-mono">
                <span className="text-slate-300 font-semibold uppercase">TARGET MISSIONS TO COMPLETE:</span>
                <span className="text-cyan-400 font-bold text-sm">{targetMissions} OF 7 MISSIONS</span>
              </div>
              <Slider
                value={[targetMissions]}
                min={3}
                max={7}
                step={1}
                onValueChange={(val) => setTargetMissions(val[0])}
              />
            </div>

            {/* Consequence Stakes Selection */}
            <div className="space-y-3">
              <Label className="text-xs font-semibold text-slate-300 uppercase tracking-wider font-mono">
                SELECT IRREVOCABLE CONSEQUENCE TIER:
              </Label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  {
                    tier: "social",
                    title: "Tier 1: Social Stake",
                    desc: "Automatic broadcast alert sent to squad members and public feed upon failure.",
                  },
                  {
                    tier: "reputation",
                    title: "Tier 2: Reputation Stake",
                    desc: "Permanent deduction of -75 Discipline Points from your public reputation record.",
                  },
                  {
                    tier: "anticharity",
                    title: "Tier 3: Anti-Charity Escrow",
                    desc: "Pre-authorized financial charge donated to an opposed cause you despise.",
                  },
                ].map((s) => (
                  <div
                    key={s.tier}
                    onClick={() => setStakeTier(s.tier)}
                    className={`p-4 rounded-xl border cursor-pointer transition-all ${
                      stakeTier === s.tier
                        ? "bg-amber-500/10 border-amber-500 text-white shadow-lg shadow-amber-500/10"
                        : "bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700"
                    }`}
                  >
                    <div className="font-bold text-sm text-white">{s.title}</div>
                    <div className="text-xs text-slate-400 mt-1 leading-relaxed">{s.desc}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Anti-Charity configuration if selected */}
            {stakeTier === "anticharity" && (
              <div className="p-4 rounded-xl bg-red-950/20 border border-red-500/40 space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-red-400 uppercase font-mono">
                  <DollarSign className="w-4 h-4 text-red-400" /> ANTI-CHARITY ESCROW CONFIGURATION
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-slate-300">Opposed Organization or PAC</Label>
                  <Input
                    value={antiCharityCause}
                    onChange={(e) => setAntiCharityCause(e.target.value)}
                    placeholder="Name an organization you strongly oppose"
                    className="bg-slate-950 border-slate-700 text-white"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-slate-300">Penalty Amount per Failed Week</Label>
                  <div className="flex gap-2">
                    {[10, 25, 50].map((amt) => (
                      <Button
                        key={amt}
                        type="button"
                        variant={antiCharityAmount === amt ? "default" : "outline"}
                        onClick={() => setAntiCharityAmount(amt)}
                        className={antiCharityAmount === amt ? "bg-red-600 text-white" : "border-slate-800 text-slate-400"}
                      >
                        ${amt} USD
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Oath Agreement */}
            <div
              onClick={() => setOathAccepted(!oathAccepted)}
              className={`flex items-center gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
                oathAccepted ? "bg-amber-500/20 border-amber-500 text-white" : "bg-slate-950 border-slate-800 text-slate-400"
              }`}
            >
              <div className={`w-5 h-5 rounded flex items-center justify-center border ${
                oathAccepted ? "bg-amber-500 border-amber-500 text-black" : "border-slate-600"
              }`}>
                {oathAccepted && <CheckCircle2 className="w-4 h-4 text-black" />}
              </div>
              <span className="text-xs font-medium select-none">
                I accept that this contract is irrevocable and authorize all stated consequences upon failure.
              </span>
            </div>

            <Button
              onClick={() => signMutation.mutate()}
              disabled={signMutation.isPending || !oathAccepted}
              className="w-full bg-amber-500 hover:bg-amber-400 text-black font-extrabold h-12 flex items-center justify-center gap-2"
            >
              {signMutation.isPending ? "SEALING CONTRACT..." : "SIGN & LOCK WEEKLY COMMITMENT"}
              <ArrowRight className="w-4 h-4" />
            </Button>
          </section>
        )}
      </div>
    </div>
  );
}
