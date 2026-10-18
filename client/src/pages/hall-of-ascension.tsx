import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Trophy,
  ShieldAlert,
  Flame,
  Award,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ArrowLeft,
  Scale,
  Sparkles,
  Zap,
  TrendingUp,
  Skull
} from "lucide-react";

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
    <div className="min-h-screen bg-black text-white p-4 md:p-8 font-sans selection:bg-amber-500 selection:text-black">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Navigation & Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-6">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setLocation("/mission-command")}
                className="text-muted-foreground hover:text-white pl-0 pr-2 gap-1 text-xs"
              >
                <ArrowLeft className="w-4 h-4" /> Command
              </Button>
              <Badge className="bg-amber-500/10 text-amber-400 border-amber-500/30 text-xs px-2.5 py-0.5 font-mono uppercase tracking-wider">
                Pillar 4 • Irreversible Record
              </Badge>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight bg-gradient-to-r from-amber-400 via-orange-300 to-yellow-500 bg-clip-text text-transparent">
              Hall of Ascension & Wall of Consequence
            </h1>
            <p className="text-xs md:text-sm text-zinc-400">
              The permanent historical ledger of human reliability. 30+ day disciplined mastery on the left; catastrophic contract defaults on the right.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              onClick={() => setLocation("/leaderboard")}
              variant="outline"
              size="sm"
              className="border-white/10 text-xs text-zinc-300 hover:text-white"
            >
              Focus Density Leaderboard
            </Button>
          </div>
        </div>

        {/* Mode Selector Tabs */}
        <div className="flex justify-center">
          <div className="inline-flex p-1.5 rounded-2xl bg-zinc-950 border border-white/10 shadow-xl">
            <button
              onClick={() => setActiveTab("hall")}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
                activeTab === "hall"
                  ? "bg-gradient-to-r from-amber-500 to-yellow-600 text-black shadow-lg shadow-amber-500/20"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              <Trophy className="w-4 h-4" />
              Hall of Ascension (Immortals)
            </button>
            <button
              onClick={() => setActiveTab("consequence")}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
                activeTab === "consequence"
                  ? "bg-gradient-to-r from-rose-600 to-red-700 text-white shadow-lg shadow-rose-600/20"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              <Skull className="w-4 h-4" />
              Wall of Consequence (Deterrence)
            </button>
          </div>
        </div>

        {/* Tab 1: Hall of Ascension */}
        {activeTab === "hall" && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="space-y-6"
          >
            {/* Induction Criteria Banner */}
            <div className="p-5 rounded-2xl bg-gradient-to-r from-amber-950/30 via-zinc-900/60 to-black border border-amber-500/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
                  <Sparkles className="w-6 h-6 text-amber-400" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-amber-300 uppercase tracking-wide">Induction Standard: 30 Consecutive Days @ ≥ 90% Fulfillment</h3>
                  <p className="text-xs text-zinc-400 max-w-2xl">
                    Inductees have proven their cognitive sovereignty. They logged verified deep work daily without a single unexcused mission abort.
                  </p>
                </div>
              </div>
              <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/40 text-xs px-3 py-1 font-mono uppercase self-start md:self-auto">
                {hallEntries.length} Living Legends
              </Badge>
            </div>

            {/* Inductees Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {hallEntries.map((entry, idx) => (
                <div
                  key={entry.id || idx}
                  className="group relative p-6 rounded-2xl bg-zinc-950/90 border border-amber-500/20 hover:border-amber-500/60 transition-all duration-300 shadow-xl hover:shadow-2xl hover:shadow-amber-500/10 flex flex-col justify-between"
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Badge className="bg-amber-500/10 text-amber-400 border-amber-500/30 text-[10px] font-mono tracking-wider uppercase px-2 py-0.5">
                        Tier {idx + 1} Inductee
                      </Badge>
                      <span className="text-xs font-mono text-zinc-500">
                        {new Date(entry.inductedAt).toLocaleDateString()}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <Avatar className="w-12 h-12 border-2 border-amber-500/40 shadow-md shadow-amber-500/20">
                        <AvatarImage src={entry.avatarUrl || ""} />
                        <AvatarFallback className="bg-amber-500/20 text-amber-300 font-bold text-sm">
                          {entry.userName.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h4 className="font-bold text-sm text-white group-hover:text-amber-300 transition-colors">
                          {entry.userName}
                        </h4>
                        <p className="text-xs text-muted-foreground line-clamp-1">{entry.goalTitle}</p>
                      </div>
                    </div>

                    {/* Stats Matrix */}
                    <div className="grid grid-cols-2 gap-2 pt-2">
                      <div className="p-2.5 rounded-xl bg-black/50 border border-white/5 space-y-0.5">
                        <p className="text-[10px] uppercase font-mono text-muted-foreground">Discipline Score</p>
                        <p className="text-lg font-extrabold text-amber-400 font-mono">{entry.disciplineScore}</p>
                      </div>
                      <div className="p-2.5 rounded-xl bg-black/50 border border-white/5 space-y-0.5">
                        <p className="text-[10px] uppercase font-mono text-muted-foreground">Deep Work</p>
                        <p className="text-lg font-extrabold text-cyan-400 font-mono">
                          {Math.round(entry.verifiedDeepWorkMinutes / 60)}h
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-white/5 mt-4 flex items-center justify-between text-xs text-zinc-400 font-mono">
                    <span className="flex items-center gap-1.5 text-emerald-400">
                      <CheckCircle2 className="w-3.5 h-3.5" /> {entry.consecutiveDays}d Streak
                    </span>
                    <span className="uppercase tracking-wider text-[10px] text-amber-500/80">Sovereign Tier</span>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Tab 2: Wall of Consequence */}
        {activeTab === "consequence" && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="space-y-6"
          >
            {/* Deterrence Warning Banner */}
            <div className="p-5 rounded-2xl bg-gradient-to-r from-red-950/40 via-zinc-900/60 to-black border border-rose-500/40 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20">
                  <ShieldAlert className="w-6 h-6 text-rose-500" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-rose-400 uppercase tracking-wide">
                    The Cost of Compromise: Public Dishonor & Liquidated Escrow
                  </h3>
                  <p className="text-xs text-zinc-400 max-w-2xl">
                    When maximum stakes are selected, consequences are executed without mercy. Here stand the audited defaults and forfeit penalties.
                  </p>
                </div>
              </div>
              <Badge className="bg-rose-500/20 text-rose-300 border-rose-500/40 text-xs px-3 py-1 font-mono uppercase self-start md:self-auto">
                {wallEntries.length} Recorded Defaulters
              </Badge>
            </div>

            {/* Defaulters Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {wallEntries.map((defaulter, idx) => (
                <div
                  key={defaulter.id || idx}
                  className="p-6 rounded-2xl bg-zinc-950/90 border border-rose-500/30 hover:border-rose-500/60 transition-all duration-300 shadow-xl space-y-4"
                >
                  <div className="flex items-center justify-between">
                    <Badge className="bg-rose-500/10 text-rose-400 border-rose-500/30 text-[10px] font-mono tracking-wider uppercase px-2 py-0.5">
                      {defaulter.breachType.replace(/_/g, " ")}
                    </Badge>
                    <span className="text-xs font-mono text-zinc-500">
                      {new Date(defaulter.failedDate).toLocaleDateString()}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <Avatar className="w-11 h-11 border-2 border-rose-500/40">
                      <AvatarImage src={defaulter.avatarUrl || ""} />
                      <AvatarFallback className="bg-rose-500/20 text-rose-400 font-bold text-xs">
                        {defaulter.userName.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h4 className="font-bold text-sm text-white">{defaulter.userName}</h4>
                      <p className="text-xs text-muted-foreground">Target: {defaulter.contractTarget}</p>
                    </div>
                  </div>

                  {/* Forfeited Stake Card */}
                  <div className="p-3.5 rounded-xl bg-red-950/20 border border-rose-500/20 space-y-1.5">
                    <p className="text-[10px] uppercase font-mono text-rose-400/80 font-bold flex items-center gap-1.5">
                      <Scale className="w-3.5 h-3.5" /> Stake Forfeited & Liquidated
                    </p>
                    <p className="text-sm font-extrabold text-rose-300 font-mono">{defaulter.stakeForfeited}</p>
                  </div>

                  {/* Dishonor Reason */}
                  <div className="p-3 rounded-xl bg-black/60 border border-white/5 space-y-1 text-xs text-zinc-300">
                    <p className="text-[10px] uppercase font-mono text-muted-foreground">Audit Finding</p>
                    <p className="leading-relaxed text-zinc-300 italic">"{defaulter.dishonorReason}"</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
