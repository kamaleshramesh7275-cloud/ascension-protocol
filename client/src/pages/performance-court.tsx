import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  ExternalLink,
} from "lucide-react";
import { audioEngine } from "@/lib/audio-engine";
import { useAuth } from "@/hooks/use-auth";
import { ShareTelemetryButton } from "@/components/share-telemetry-button";

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
        description: "Official 7-day judicial audit decree rendered.",
      });
    },
    onError: (err: any) => {
      toast({ title: "Court Audit Error", description: err.message, variant: "destructive" });
    },
  });

  const latestAudit = audits[0];

  return (
    <div className="min-h-screen bg-[#07080B] text-zinc-100 flex flex-col p-4 sm:p-6 md:p-8 relative overflow-hidden font-sans">
      {/* Background ambient lighting */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-red-500/5 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-amber-500/5 blur-3xl pointer-events-none" />

      <div className="w-full max-w-4xl mx-auto space-y-6 relative z-10">
        {/* Header */}
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-white/10">
          <div>
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <Badge variant="outline" className="border-red-500/30 text-red-400 bg-red-500/10 font-mono text-[10px] uppercase tracking-wider px-2 py-0.5">
                <Gavel className="w-3 h-3 mr-1 inline" /> SECTOR 03 // WEEKLY JUDICIAL AUDIT
              </Badge>
              <Badge variant="outline" className="border-white/10 text-zinc-400 font-mono text-[10px] uppercase tracking-wider px-2 py-0.5">
                CYCLE VERIFICATION
              </Badge>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white uppercase font-mono">
              PERFORMANCE COURT
            </h1>
            <p className="text-xs text-zinc-400 font-sans mt-0.5">
              Uncompromising algorithmic examination of 7-day focus telemetry, protocol breaches, and execution veracity.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <Button
              variant="outline"
              onClick={() => {
                audioEngine.playTactileClick();
                setLocation("/mission-command");
              }}
              className="border-white/10 bg-[#090C10] hover:bg-[#141922] text-zinc-300 hover:text-white text-xs font-mono h-8 px-3 rounded"
            >
              <ArrowLeft className="w-3.5 h-3.5 mr-1 inline" /> MISSION COMMAND
            </Button>
            <Button
              onClick={() => {
                audioEngine.playTactileClick();
                conveneMutation.mutate();
              }}
              disabled={conveneMutation.isPending}
              className="bg-red-600 hover:bg-red-500 text-white font-mono font-bold text-xs uppercase tracking-wider h-8 px-3.5 rounded shadow-sm hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-1.5"
            >
              <Gavel className="w-3.5 h-3.5" />
              {conveneMutation.isPending ? "DELIBERATING..." : "CONVENE COURT"}
            </Button>
          </div>
        </header>

        {/* ─── LATEST COURT VERDICT ─── */}
        {latestAudit ? (
          <section className="obsidian-card border-red-500/30 bg-gradient-to-b from-[#0E1218] to-[#090C10] rounded-xl p-5 sm:p-7 space-y-5 shadow-2xl relative overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400 font-bold shrink-0">
                  <Gavel className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-white tracking-tight uppercase font-mono">
                    CYCLE {latestAudit.weekNumber} OFFICIAL JUDGMENT
                  </h2>
                  <p className="text-[11px] font-mono text-zinc-400 mt-0.5">
                    YEAR {latestAudit.year} // PACT VISIBILITY: {latestAudit.sharedWithSquad ? "VERIFIED PUBLIC" : "RESTRICTED"}
                  </p>
                </div>
              </div>

              <Badge className={`font-mono text-[10px] uppercase tracking-wider px-3 py-1 rounded font-bold ${
                latestAudit.missionsCompleted >= 5
                  ? "bg-emerald-500 text-black"
                  : latestAudit.missionsCompleted >= 3
                  ? "bg-amber-400 text-black"
                  : "bg-red-600 text-white"
              }`}>
                {latestAudit.missionsCompleted >= 5 ? "STANDARDS SATISFIED" : "STANDARDS BREACHED"}
              </Badge>
            </div>

            {/* Performance Matrix */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-[#07080B] p-3.5 rounded-lg border border-white/5 space-y-1">
                <div className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider">DIRECTIVES EXECUTED</div>
                <div className="text-xl sm:text-2xl font-bold text-white font-mono tabular-telemetry">
                  {latestAudit.missionsCompleted} <span className="text-xs text-zinc-500 font-normal">/ {latestAudit.missionsAssigned}</span>
                </div>
              </div>

              <div className="bg-[#07080B] p-3.5 rounded-lg border border-white/5 space-y-1">
                <div className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider">VERIFIED FOCUS</div>
                <div className="text-xl sm:text-2xl font-bold text-cyan-400 font-mono tabular-telemetry">
                  {latestAudit.actualFocusMinutes} <span className="text-xs text-zinc-500 font-normal">MINS</span>
                </div>
              </div>

              <div className="bg-[#07080B] p-3.5 rounded-lg border border-white/5 space-y-1">
                <div className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider">DENSITY RATING</div>
                <div className="text-xl sm:text-2xl font-bold text-amber-400 font-mono tabular-telemetry">
                  {latestAudit.focusDensityScore}%
                </div>
              </div>

              <div className="bg-[#07080B] p-3.5 rounded-lg border border-white/5 space-y-1">
                <div className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider">ATTENTION BREACHES</div>
                <div className="text-xl sm:text-2xl font-bold text-red-400 font-mono tabular-telemetry">
                  {latestAudit.breachesCount}
                </div>
              </div>
            </div>

            {/* AI Commander Verdict */}
            <div className="p-4 sm:p-5 rounded-lg bg-[#07080B] border border-red-500/25 space-y-2">
              <div className="text-[11px] font-mono text-red-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
                ALGORITHMIC TACTICAL VERDICT
              </div>
              <p className="text-xs sm:text-sm text-zinc-200 leading-relaxed font-mono italic">
                &ldquo;{latestAudit.aiVerdict}&rdquo;
              </p>
            </div>

            {/* Living Roadmap Impact */}
            <div className="bg-[#07080B] p-4 rounded-lg border border-white/5 space-y-1">
              <div className="text-[10px] font-mono text-cyan-400 uppercase font-semibold tracking-wider">
                STRATEGIC ROADMAP TRAJECTORY
              </div>
              <p className="text-xs text-zinc-300 font-sans leading-relaxed">
                {latestAudit.roadmapImpact}
              </p>
            </div>

            {/* Telemetry Transmit & Action Bar */}
            <div className="pt-2 flex flex-wrap items-center gap-2.5">
              <ShareTelemetryButton
                data={{
                  type: "quest",
                  title: `CYCLE ${latestAudit.weekNumber} JUDICIAL VERDICT`,
                  headlineMetric: `${latestAudit.focusDensityScore}% DENSITY`,
                  subheadline: "Supreme Performance Court Official Audit",
                  userName: (user as any)?.name || (user as any)?.displayName || "Operator",
                  userTier: (user as any)?.tier || "D",
                  stats: [
                    { label: "DIRECTIVES DELIVERED", value: `${latestAudit.missionsCompleted}/${latestAudit.missionsAssigned}` },
                    { label: "VERIFIED DEEP WORK", value: `${latestAudit.actualFocusMinutes} MINS` },
                    { label: "ATTENTION BREACHES", value: `${latestAudit.breachesCount}` },
                    { label: "FOCUS DENSITY", value: `${latestAudit.focusDensityScore}%` },
                  ],
                }}
                label="TRANSMIT VERDICT CARD"
                className="bg-cyan-400 hover:bg-cyan-300 text-black font-mono font-bold text-xs uppercase tracking-wider h-8 px-4 rounded shadow-sm"
              />

              <Button
                onClick={() => {
                  audioEngine.playTactileClick();
                  const decreeText = `[ASCENSION OS // COURT DECREE]\nCycle ${latestAudit.weekNumber} Audit (${latestAudit.year}):\n• Directives: ${latestAudit.missionsCompleted}/${latestAudit.missionsAssigned}\n• Verified Deep Work: ${latestAudit.actualFocusMinutes} mins\n• Focus Density: ${latestAudit.focusDensityScore}%\n• Attention Breaches: ${latestAudit.breachesCount}\n\nCommander Verdict:\n"${latestAudit.aiVerdict}"\n\nEnforce your protocol: ${window.location.origin}`;
                  if (navigator.share) {
                    navigator.share({
                      title: `Ascension Protocol Cycle ${latestAudit.weekNumber} Decree`,
                      text: decreeText,
                      url: window.location.origin,
                    }).catch(() => {});
                  } else {
                    navigator.clipboard.writeText(decreeText);
                    toast({
                      title: "JUDICIAL DECREE COPIED",
                      description: "Court verdict copied to clipboard for transmission.",
                    });
                  }
                }}
                variant="outline"
                className="border-white/10 bg-[#07080B] hover:bg-[#141922] text-zinc-300 font-mono text-xs flex items-center gap-1.5 h-8 px-3 rounded"
              >
                <Share2 className="w-3.5 h-3.5" />
                BROADCAST TEXT
              </Button>

              <Button
                variant="outline"
                onClick={() => {
                  audioEngine.playTactileClick();
                  const badgeMarkdown = `[![Discipline Score](${window.location.origin}/api/badges/${user?.id || 'operator'}.svg)](${window.location.origin})`;
                  navigator.clipboard.writeText(badgeMarkdown);
                  toast({
                    title: "SVG BADGE CODE COPIED",
                    description: "Markdown badge copied to clipboard for repository README.",
                  });
                }}
                className="border-white/10 bg-[#07080B] hover:bg-[#141922] text-zinc-300 font-mono text-xs flex items-center gap-1.5 h-8 px-3 rounded"
              >
                <Copy className="w-3.5 h-3.5 text-cyan-400" />
                COPY README BADGE
              </Button>

              <a
                href={`/api/badges/${user?.id || 'operator'}.svg`}
                target="_blank"
                rel="noreferrer"
                className="text-xs font-mono text-zinc-500 hover:text-cyan-400 flex items-center gap-1 ml-auto"
              >
                VIEW LIVE SVG <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </section>
        ) : (
          <div className="obsidian-card bg-[#090C10] border-white/5 rounded-xl p-8 text-center space-y-4">
            <Gavel className="w-10 h-10 text-zinc-600 mx-auto" />
            <h3 className="text-base font-bold text-white uppercase font-mono">NO COURT AUDITS CONVENED YET</h3>
            <p className="text-xs text-zinc-400 max-w-sm mx-auto font-sans leading-relaxed">
              At the close of each 7-day cycle, the court convenes automatically to assess execution velocity, breach frequency, and roadmap alignment.
            </p>
            <Button
              onClick={() => {
                audioEngine.playTactileClick();
                conveneMutation.mutate();
              }}
              className="bg-red-600 hover:bg-red-500 text-white font-mono font-bold text-xs uppercase tracking-wider h-8 px-4 rounded shadow-sm"
            >
              CONVENE INITIAL SESSION
            </Button>
          </div>
        )}

        {/* ─── HISTORIC SESSIONS LIST ─── */}
        {audits.length > 1 && (
          <section className="space-y-3">
            <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider font-mono">
              PRIOR COURT JUDGMENTS
            </h3>
            <div className="space-y-2">
              {audits.slice(1).map((a) => (
                <div
                  key={a.id}
                  className="obsidian-card razor-border-hover p-3.5 rounded-lg bg-[#090C10] border-white/5 flex items-center justify-between"
                >
                  <div>
                    <div className="font-semibold text-white text-xs font-mono uppercase">
                      CYCLE {a.weekNumber} AUDIT ({a.year})
                    </div>
                    <div className="text-[11px] text-zinc-400 font-mono mt-0.5 tabular-telemetry">
                      {a.missionsCompleted}/{a.missionsAssigned} DIRECTIVES // {a.actualFocusMinutes} FOCUS MINS
                    </div>
                  </div>
                  <div className="text-xs font-mono text-amber-400 tabular-telemetry font-bold">
                    {a.focusDensityScore}% DENSITY
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
