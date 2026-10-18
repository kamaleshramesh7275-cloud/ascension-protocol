import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import {
  Scale,
  ShieldAlert,
  Flame,
  Zap,
  Lock,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Gavel,
  Calendar,
  AlertCircle,
  FileCheck,
  TrendingDown,
  TrendingUp,
  ArrowLeft,
  Share2,
  Copy,
  ExternalLink
} from "lucide-react";
import { audioEngine } from "@/lib/audio-engine";
import { useAuth } from "@/hooks/use-auth";

export default function PerformanceCourtPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  // Fetch court audits
  const { data: audits = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/performance-court"],
  });

  // Convene Court Mutation
  const conveneMutation = useMutation({
    mutationFn: async () => {
      audioEngine.playCourtGavel();
      const res = await apiRequest("POST", "/api/performance-court/evaluate");
      return res.json();
    },
    onSuccess: (data) => {
      audioEngine.playCourtGavel();
      queryClient.invalidateQueries({ queryKey: ["/api/performance-court"] });
      toast({
        title: "PERFORMANCE COURT CONVENED",
        description: "Your weekly audit verdict has been generated.",
      });
    },
    onError: (err: any) => {
      toast({ title: "Court Audit Error", description: err.message, variant: "destructive" });
    },
  });

  const latestAudit = audits[0];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col p-4 sm:p-6 md:p-8 relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-red-500/5 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-amber-500/5 blur-3xl pointer-events-none" />

      <div className="w-full max-w-4xl mx-auto space-y-8 relative z-10">
        {/* Header */}
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <Badge variant="outline" className="border-red-500/40 text-red-400 bg-red-500/10 font-mono text-[11px] uppercase tracking-wider">
                <Gavel className="w-3.5 h-3.5 mr-1 inline" /> PILLAR 3: WEEKLY PERFORMANCE COURT
              </Badge>
              <Badge variant="outline" className="border-slate-800 text-slate-400 font-mono text-[11px]">
                Sunday Audit
              </Badge>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              PERFORMANCE COURT
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={() => setLocation("/mission-command")}
              className="border-slate-800 text-slate-300 hover:bg-slate-900 text-xs font-mono"
            >
              <ArrowLeft className="w-3.5 h-3.5 mr-1 inline" /> Mission Command
            </Button>
            <Button
              onClick={() => conveneMutation.mutate()}
              disabled={conveneMutation.isPending}
              className="bg-red-600 hover:bg-red-500 text-white font-extrabold text-xs px-4 flex items-center gap-1.5"
            >
              <Gavel className="w-3.5 h-3.5" />
              {conveneMutation.isPending ? "DELIBERATING..." : "Convene Court Session"}
            </Button>
          </div>
        </header>

        {/* ─── LATEST COURT VERDICT ─── */}
        {latestAudit ? (
          <section className="bg-slate-900/90 border-2 border-red-500/40 rounded-2xl p-6 sm:p-8 space-y-6 shadow-2xl relative overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400 font-bold">
                  <Gavel className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-xl font-black text-white">
                    Week {latestAudit.weekNumber} Official Judgment
                  </h2>
                  <p className="text-xs font-mono text-slate-400">
                    Year {latestAudit.year} • Shared with Squad: {latestAudit.sharedWithSquad ? "YES" : "NO"}
                  </p>
                </div>
              </div>

              <Badge className={`font-mono text-xs uppercase px-3 py-1 ${
                latestAudit.missionsCompleted >= 5
                  ? "bg-emerald-500 text-black"
                  : latestAudit.missionsCompleted >= 3
                  ? "bg-amber-500 text-black"
                  : "bg-red-600 text-white"
              }`}>
                {latestAudit.missionsCompleted >= 5 ? "STANDARDS MET" : "STANDARDS BREACHED"}
              </Badge>
            </div>

            {/* Performance Matrix */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                <div className="text-[11px] font-mono text-slate-400 uppercase">MISSIONS COMPLETED</div>
                <div className="text-2xl font-black text-white font-mono mt-1">
                  {latestAudit.missionsCompleted} / {latestAudit.missionsAssigned}
                </div>
              </div>

              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                <div className="text-[11px] font-mono text-slate-400 uppercase">VERIFIED FOCUS</div>
                <div className="text-2xl font-black text-cyan-400 font-mono mt-1">
                  {latestAudit.actualFocusMinutes} <span className="text-xs text-slate-500">MINS</span>
                </div>
              </div>

              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                <div className="text-[11px] font-mono text-slate-400 uppercase">DENSITY SCORE</div>
                <div className="text-2xl font-black text-amber-400 font-mono mt-1">
                  {latestAudit.focusDensityScore}%
                </div>
              </div>

              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                <div className="text-[11px] font-mono text-slate-400 uppercase">BREACH EVENTS</div>
                <div className="text-2xl font-black text-red-400 font-mono mt-1">
                  {latestAudit.breachesCount}
                </div>
              </div>
            </div>

            {/* AI Commander Verdict */}
            <div className="p-5 rounded-xl bg-red-950/20 border border-red-500/30 space-y-2">
              <div className="text-xs font-mono text-red-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-red-400" />
                UNSOFTENED AI COMMANDER VERDICT
              </div>
              <p className="text-sm text-slate-200 leading-relaxed font-mono italic">
                &ldquo;{latestAudit.aiVerdict}&rdquo;
              </p>
            </div>

            {/* Living Roadmap Impact */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1">
              <div className="text-xs font-mono text-cyan-400 uppercase font-semibold">
                LIVING ROADMAP IMPACT
              </div>
              <p className="text-xs text-slate-300">
                {latestAudit.roadmapImpact}
              </p>
            </div>

            {/* Viral Growth & Share Action Bar */}
            <div className="pt-2 flex flex-wrap items-center gap-3">
              <Button
                onClick={() => {
                  const decreeText = `⚖️ [ASCENSION OS // COURT DECREE]\nWeek ${latestAudit.weekNumber} Audit (${latestAudit.year}):\n• Directives: ${latestAudit.missionsCompleted}/${latestAudit.missionsAssigned}\n• Verified Deep Work: ${latestAudit.actualFocusMinutes} mins\n• Focus Density: ${latestAudit.focusDensityScore}%\n• Attention Breaches: ${latestAudit.breachesCount}\n\nCommander Verdict:\n"${latestAudit.aiVerdict}"\n\nEnforce your protocol: ${window.location.origin}`;
                  if (navigator.share) {
                    navigator.share({
                      title: `Ascension Protocol Week ${latestAudit.weekNumber} Decree`,
                      text: decreeText,
                      url: window.location.origin,
                    }).catch(() => {});
                  } else {
                    navigator.clipboard.writeText(decreeText);
                    toast({
                      title: "JUDICIAL DECREE COPIED",
                      description: "Court verdict copied to clipboard for broadcast.",
                    });
                  }
                }}
                className="bg-cyan-500 hover:bg-cyan-400 text-black font-mono font-bold text-xs flex items-center gap-1.5 py-5 px-4"
              >
                <Share2 className="w-3.5 h-3.5" />
                BROADCAST VERDICT / SHARE
              </Button>

              <Button
                variant="outline"
                onClick={() => {
                  const badgeMarkdown = `[![Discipline Score](${window.location.origin}/api/badges/${user?.id || 'operator'}.svg)](${window.location.origin})`;
                  navigator.clipboard.writeText(badgeMarkdown);
                  toast({
                    title: "SVG BADGE EMBED CODE COPIED",
                    description: "Markdown badge copied! Paste into your GitHub README or blog.",
                  });
                }}
                className="border-slate-800 bg-slate-950 hover:bg-slate-800 text-slate-300 font-mono text-xs flex items-center gap-1.5 py-5 px-4"
              >
                <Copy className="w-3.5 h-3.5 text-cyan-400" />
                COPY GITHUB README BADGE
              </Button>

              <a
                href={`/api/badges/${user?.id || 'operator'}.svg`}
                target="_blank"
                rel="noreferrer"
                className="text-xs font-mono text-slate-500 hover:text-cyan-400 flex items-center gap-1 ml-auto"
              >
                View Live SVG <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </section>
        ) : (
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-8 text-center space-y-4">
            <Gavel className="w-12 h-12 text-slate-600 mx-auto" />
            <h3 className="text-lg font-bold text-white">No Court Audits Convened Yet</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Every Sunday night, the court convenes automatically to assess your 7-day velocity, breach history, and roadmap trajectory.
            </p>
            <Button
              onClick={() => conveneMutation.mutate()}
              className="bg-red-600 hover:bg-red-500 text-white font-bold"
            >
              Convene Initial Court Session
            </Button>
          </div>
        )}

        {/* ─── HISTORIC SESSIONS LIST ─── */}
        {audits.length > 1 && (
          <section className="space-y-3">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider font-mono">
              PRIOR COURT JUDGMENTS
            </h3>
            <div className="space-y-2">
              {audits.slice(1).map((a) => (
                <div key={a.id} className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                  <div>
                    <div className="font-bold text-white text-sm">Week {a.weekNumber} Audit ({a.year})</div>
                    <div className="text-xs text-slate-400 font-mono mt-0.5">
                      {a.missionsCompleted}/{a.missionsAssigned} Missions • {a.actualFocusMinutes} Focus Mins
                    </div>
                  </div>
                  <div className="text-xs font-mono text-slate-400">
                    {a.focusDensityScore}% Density
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
