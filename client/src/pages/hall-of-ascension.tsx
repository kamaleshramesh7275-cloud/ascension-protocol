import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Trophy,
  ShieldAlert,
  Award,
  CheckCircle2,
  ArrowLeft,
  Scale,
  Sparkles,
  Skull,
} from "lucide-react";
import { ShareTelemetryButton } from "@/components/share-telemetry-button";
import { audioEngine } from "@/lib/audio-engine";

export default function HallOfAscensionPage() {
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState<"hall" | "consequence">("hall");

  // Fetch Hall of Ascension
  const { data: hallEntries = [], isLoading: loadingHall } = useQuery<any[]>({
    queryKey: ["/api/hall-of-ascension"],
  });

  // Fetch Wall of Consequence
  const { data: wallEntries = [], isLoading: loadingWall } = useQuery<any[]>({
    queryKey: ["/api/wall-of-consequence"],
  });

  return (
    <div className="min-h-screen bg-[#07080B] text-zinc-100 p-4 sm:p-6 md:p-8 font-sans selection:bg-amber-400 selection:text-black relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-0 left-1/3 w-96 h-96 bg-amber-500/5 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-rose-500/5 blur-3xl pointer-events-none" />

      <div className="max-w-5xl mx-auto space-y-6 relative z-10">
        {/* Navigation & Header */}
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-5">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  audioEngine.playTactileClick();
                  setLocation("/mission-command");
                }}
                className="text-zinc-400 hover:text-white pl-0 pr-2 gap-1 text-xs font-mono h-7"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> MISSION COMMAND
              </Button>
              <Badge className="bg-amber-500/10 text-amber-400 border-amber-500/30 text-[10px] px-2 py-0.5 font-mono uppercase tracking-wider">
                SECTOR 04 // IRREVERSIBLE RECORD
              </Badge>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white uppercase font-mono">
              HALL OF ASCENSION & WALL OF CONSEQUENCE
            </h1>
            <p className="text-xs text-zinc-400 font-sans max-w-2xl">
              The permanent historical ledger of human execution veracity. Sovereign discipline logged on the left; irrevocable contractual defaults logged on the right.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              onClick={() => {
                audioEngine.playTactileClick();
                setLocation("/achievements");
              }}
              variant="outline"
              size="sm"
              className="border-white/10 bg-[#090C10] hover:bg-[#141922] text-xs font-mono text-zinc-300 hover:text-white h-8 px-3 rounded gap-1.5"
            >
              <Award className="w-3.5 h-3.5 text-amber-400" /> TROPHY CABINET
            </Button>
            <Button
              onClick={() => {
                audioEngine.playTactileClick();
                setLocation("/leaderboard");
              }}
              variant="outline"
              size="sm"
              className="border-white/10 bg-[#090C10] hover:bg-[#141922] text-xs font-mono text-zinc-300 hover:text-white h-8 px-3 rounded"
            >
              LEADERBOARD
            </Button>
          </div>
        </header>

        {/* Mode Selector Tabs */}
        <div className="flex justify-center">
          <div className="inline-flex p-1 rounded-md bg-[#07080B] border border-white/10 text-xs font-mono">
            <button
              onClick={() => {
                audioEngine.playTactileClick();
                setActiveTab("hall");
              }}
              className={`flex items-center gap-2 px-4 py-1.5 rounded text-[11px] font-bold uppercase tracking-wider transition-all ${
                activeTab === "hall"
                  ? "bg-amber-400 text-black shadow-sm"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              <Trophy className="w-3.5 h-3.5" />
              HALL OF ASCENSION (INDUCTEES)
            </button>
            <button
              onClick={() => {
                audioEngine.playTactileClick();
                setActiveTab("consequence");
              }}
              className={`flex items-center gap-2 px-4 py-1.5 rounded text-[11px] font-bold uppercase tracking-wider transition-all ${
                activeTab === "consequence"
                  ? "bg-red-600 text-white shadow-sm"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              <Skull className="w-3.5 h-3.5" />
              WALL OF CONSEQUENCE (DEFAULTERS)
            </button>
          </div>
        </div>

        {/* Tab 1: Hall of Ascension */}
        {activeTab === "hall" && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-5"
          >
            {/* Induction Criteria Banner */}
            <div className="obsidian-card border-amber-500/25 bg-gradient-to-r from-[#0E1218] to-[#090C10] p-4 sm:p-5 rounded-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="p-2.5 rounded-md bg-amber-500/10 border border-amber-500/25 shrink-0">
                  <Sparkles className="w-5 h-5 text-amber-400" />
                </div>
                <div className="space-y-0.5">
                  <h3 className="text-xs font-bold font-mono text-amber-300 uppercase tracking-wide">
                    INDUCTION CRITERIA: 30 CONSECUTIVE DAYS AT 90%+ EXECUTION DENSITY
                  </h3>
                  <p className="text-xs text-zinc-400 font-sans max-w-2xl leading-relaxed">
                    Inductees have proven uninterrupted cognitive sovereignty under strict protocol telemetry without a single unexcused mission abort.
                  </p>
                </div>
              </div>
              <Badge className="bg-amber-500/15 text-amber-300 border-amber-500/30 text-[10px] px-2.5 py-1 font-mono uppercase self-start md:self-auto tracking-wider">
                {hallEntries.length} VERIFIED INDUCTEES
              </Badge>
            </div>

            {/* Inductees Grid */}
            {loadingHall ? (
              <div className="text-center py-16 font-mono text-xs text-zinc-500 tracking-wider">
                CALIBRATING HISTORICAL LEDGER...
              </div>
            ) : hallEntries.length === 0 ? (
              <div className="obsidian-card bg-[#090C10] border-white/5 rounded-lg p-10 text-center space-y-2">
                <Trophy className="w-8 h-8 text-zinc-600 mx-auto" />
                <h4 className="text-sm font-bold text-white uppercase font-mono">NO INDUCTEES LOGGED</h4>
                <p className="text-xs text-zinc-400 font-sans">
                  The first operative to complete 30 consecutive verified days will claim the inaugural induction slot.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                {hallEntries.map((entry, idx) => (
                  <div
                    key={entry.id || idx}
                    className="obsidian-card razor-border-hover p-4 sm:p-5 rounded-lg bg-[#090C10] border-white/5 hover:border-amber-500/30 transition-all flex flex-col justify-between"
                  >
                    <div className="space-y-3.5">
                      <div className="flex items-center justify-between">
                        <Badge className="bg-amber-500/10 text-amber-400 border-amber-500/25 text-[9px] font-mono tracking-wider uppercase px-1.5 py-0">
                          NODE #{idx + 1} INDUCTEE
                        </Badge>
                        <span className="text-[10px] font-mono text-zinc-500 tabular-telemetry">
                          {new Date(entry.inductedAt).toLocaleDateString()}
                        </span>
                      </div>

                      <div className="flex items-center gap-3">
                        <Avatar className="w-10 h-10 border border-amber-500/40">
                          <AvatarImage src={entry.avatarUrl || ""} />
                          <AvatarFallback className="bg-amber-500/15 text-amber-300 font-mono font-bold text-xs">
                            {entry.userName.substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1">
                          <h4 className="font-semibold text-xs text-white truncate font-mono">
                            {entry.userName}
                          </h4>
                          <p className="text-[11px] text-zinc-400 truncate font-sans">{entry.goalTitle}</p>
                        </div>
                      </div>

                      {/* Stats Matrix */}
                      <div className="grid grid-cols-2 gap-2 pt-1">
                        <div className="p-2 rounded bg-[#07080B] border border-white/5 space-y-0.5">
                          <p className="text-[9px] uppercase font-mono text-zinc-500 tracking-wider">DISCIPLINE</p>
                          <p className="text-base font-bold text-amber-400 font-mono tabular-telemetry">{entry.disciplineScore}</p>
                        </div>
                        <div className="p-2 rounded bg-[#07080B] border border-white/5 space-y-0.5">
                          <p className="text-[9px] uppercase font-mono text-zinc-500 tracking-wider">DEEP WORK</p>
                          <p className="text-base font-bold text-cyan-400 font-mono tabular-telemetry">
                            {Math.round(entry.verifiedDeepWorkMinutes / 60)}h
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-white/5 mt-3 flex items-center justify-between text-xs text-zinc-400 font-mono">
                      <span className="flex items-center gap-1.5 text-emerald-400 text-[10px] uppercase tracking-wider tabular-telemetry">
                        <CheckCircle2 className="w-3 h-3" /> {entry.consecutiveDays}D STREAK
                      </span>
                      <ShareTelemetryButton
                        data={{
                          type: "streak",
                          title: "HALL OF ASCENSION INDUCTION",
                          headlineMetric: `${entry.disciplineScore} DISCIPLINE`,
                          subheadline: "Permanent Ledger of Human Reliability",
                          userName: entry.userName,
                          userTier: "S",
                          stats: [
                            { label: "DISCIPLINE SCORE", value: `${entry.disciplineScore}` },
                            { label: "VERIFIED DEEP WORK", value: `${Math.round(entry.verifiedDeepWorkMinutes / 60)} HOURS` },
                            { label: "CONSECUTIVE STREAK", value: `${entry.consecutiveDays} DAYS` },
                            { label: "STATUS", value: "SOVEREIGN INDUCTEE" },
                          ],
                        }}
                        label="TRANSMIT"
                        size="sm"
                        variant="ghost"
                        className="h-6 px-2 text-[10px] font-mono text-amber-400 hover:text-white"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* Tab 2: Wall of Consequence */}
        {activeTab === "consequence" && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-5"
          >
            {/* Deterrence Warning Banner */}
            <div className="obsidian-card border-rose-500/30 bg-gradient-to-r from-[#0E1218] to-[#090C10] p-4 sm:p-5 rounded-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="p-2.5 rounded-md bg-rose-500/10 border border-rose-500/25 shrink-0">
                  <ShieldAlert className="w-5 h-5 text-rose-500" />
                </div>
                <div className="space-y-0.5">
                  <h3 className="text-xs font-bold font-mono text-rose-400 uppercase tracking-wide">
                    COST OF COMPROMISE: PUBLIC DISHONOR & LIQUIDATED ESCROW
                  </h3>
                  <p className="text-xs text-zinc-400 font-sans max-w-2xl leading-relaxed">
                    When maximum stakes are selected, consequences execute without exception. Below stand audited covenant defaults and liquidated forfeits.
                  </p>
                </div>
              </div>
              <Badge className="bg-rose-500/15 text-rose-300 border-rose-500/30 text-[10px] px-2.5 py-1 font-mono uppercase self-start md:self-auto tracking-wider">
                {wallEntries.length} AUDITED DEFAULTERS
              </Badge>
            </div>

            {/* Defaulters Grid */}
            {loadingWall ? (
              <div className="text-center py-16 font-mono text-xs text-zinc-500 tracking-wider">
                CALIBRATING DEFICIT RECORDS...
              </div>
            ) : wallEntries.length === 0 ? (
              <div className="obsidian-card bg-[#090C10] border-white/5 rounded-lg p-10 text-center space-y-2">
                <ShieldAlert className="w-8 h-8 text-zinc-600 mx-auto" />
                <h4 className="text-sm font-bold text-white uppercase font-mono">NO CONTRACT DEFAULTS LOGGED</h4>
                <p className="text-xs text-zinc-400 font-sans">
                  Zero breach events recorded. Network discipline covenants remain unviolated.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {wallEntries.map((defaulter, idx) => (
                  <div
                    key={defaulter.id || idx}
                    className="obsidian-card razor-border-hover p-4 sm:p-5 rounded-lg bg-[#090C10] border-rose-500/25 hover:border-rose-500/50 transition-all space-y-3.5"
                  >
                    <div className="flex items-center justify-between">
                      <Badge className="bg-rose-500/10 text-rose-400 border-rose-500/25 text-[9px] font-mono tracking-wider uppercase px-1.5 py-0">
                        {defaulter.breachType.replace(/_/g, " ")}
                      </Badge>
                      <span className="text-[10px] font-mono text-zinc-500 tabular-telemetry">
                        {new Date(defaulter.failedDate).toLocaleDateString()}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <Avatar className="w-10 h-10 border border-rose-500/40">
                        <AvatarImage src={defaulter.avatarUrl || ""} />
                        <AvatarFallback className="bg-rose-500/15 text-rose-400 font-mono font-bold text-xs">
                          {defaulter.userName.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <h4 className="font-semibold text-xs text-white truncate font-mono">{defaulter.userName}</h4>
                        <p className="text-[11px] text-zinc-400 truncate font-sans">TARGET: {defaulter.contractTarget}</p>
                      </div>
                    </div>

                    {/* Forfeited Stake Card */}
                    <div className="p-3 rounded bg-[#07080B] border border-rose-500/20 space-y-1">
                      <p className="text-[9px] uppercase font-mono text-rose-400/80 font-bold flex items-center gap-1.5 tracking-wider">
                        <Scale className="w-3 h-3" /> STAKE FORFEITED & LIQUIDATED
                      </p>
                      <p className="text-xs font-bold text-rose-300 font-mono tabular-telemetry">{defaulter.stakeForfeited}</p>
                    </div>

                    {/* Dishonor Reason */}
                    <div className="p-3 rounded bg-[#07080B] border border-white/5 space-y-1 text-xs">
                      <p className="text-[9px] uppercase font-mono text-zinc-500 tracking-wider">AUDIT FINDING</p>
                      <p className="text-[11px] text-zinc-300 font-sans italic leading-relaxed">"{defaulter.dishonorReason}"</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
}
