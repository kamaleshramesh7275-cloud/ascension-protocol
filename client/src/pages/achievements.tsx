import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { ShareTelemetryButton } from "@/components/share-telemetry-button";
import {
  Trophy,
  Award,
  Shield,
  Zap,
  Target,
  Dumbbell,
  Clock,
  Users,
  Check,
  Lock,
  ArrowLeft,
  Flame,
  Sparkles,
} from "lucide-react";
import { useLocation } from "wouter";
import { audioEngine } from "@/lib/audio-engine";

interface AchievementItem {
  code: string;
  title: string;
  description: string;
  category: "discipline" | "combat" | "fitness" | "focus" | "social";
  tier: "bronze" | "silver" | "gold" | "platinum" | "sovereign";
  rewardCoins: number;
  rewardXp: number;
  metricLabel: string;
  targetValue: number;
  currentValue: number;
  progressPercent: number;
  isUnlocked: boolean;
  isClaimed: boolean;
}

interface AchievementsResponse {
  summary: {
    unlockedCount: number;
    totalCount: number;
    completionRate: number;
  };
  achievements: AchievementItem[];
}

export default function AchievementsPage() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const { data, isLoading } = useQuery<AchievementsResponse>({
    queryKey: ["/api/achievements"],
    enabled: !!user,
  });

  const claimMutation = useMutation({
    mutationFn: async (code: string) => {
      const res = await apiRequest("POST", `/api/achievements/${code}/claim`);
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to claim achievement reward");
      }
      return res.json();
    },
    onSuccess: (resData) => {
      if ("vibrate" in navigator) navigator.vibrate([40, 50, 70]);
      queryClient.invalidateQueries({ queryKey: ["/api/achievements"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      toast({
        title: "ACHIEVEMENT REWARD CLAIMED",
        description: `+${resData.rewardCoins} Coins and +${resData.rewardXp} XP credited.`,
      });
    },
    onError: (err: any) => {
      toast({
        title: "Claim Failed",
        description: err.message,
        variant: "destructive",
      });
    },
  });

  const achievements = data?.achievements || [];
  const summary = data?.summary || { unlockedCount: 0, totalCount: 0, completionRate: 0 };

  const filteredAchievements = achievements.filter((ach) => {
    if (selectedCategory === "all") return true;
    return ach.category === selectedCategory;
  });

  const getTierColor = (tier: string) => {
    switch (tier) {
      case "sovereign":
        return "text-amber-400 border-amber-400/40 bg-amber-400/10";
      case "platinum":
        return "text-cyan-400 border-cyan-400/40 bg-cyan-400/10";
      case "gold":
        return "text-yellow-400 border-yellow-400/40 bg-yellow-400/10";
      case "silver":
        return "text-zinc-300 border-zinc-400/40 bg-zinc-400/10";
      default:
        return "text-orange-400 border-orange-400/40 bg-orange-400/10";
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "discipline":
        return <Shield className="w-4 h-4 text-emerald-400" />;
      case "combat":
        return <Target className="w-4 h-4 text-red-400" />;
      case "fitness":
        return <Dumbbell className="w-4 h-4 text-amber-400" />;
      case "focus":
        return <Clock className="w-4 h-4 text-blue-400" />;
      case "social":
        return <Users className="w-4 h-4 text-purple-400" />;
      default:
        return <Award className="w-4 h-4 text-white" />;
    }
  };

  return (
    <div className="min-h-screen bg-[#07080B] text-zinc-100 p-4 sm:p-8 font-mono pb-24 select-none">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Navigation & Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/[0.08]">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  audioEngine.playTactileClick();
                  setLocation("/mission-command");
                }}
                className="text-zinc-400 hover:text-white pl-0 pr-2 gap-1 text-xs h-7"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Command
              </Button>
              <span className="px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[9px] font-mono uppercase tracking-widest font-semibold">
                TELEMETRY ARCHIVE // TROPHY CABINET
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold uppercase tracking-tight text-zinc-100 swiss-display">
              Trophy & Milestone Cabinet
            </h1>
            <p className="text-xs text-zinc-400">
              Verified operational thresholds across discipline, physical load, deep-work focus, and tactical network influence.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                audioEngine.playTactileClick();
                setLocation("/hall-of-ascension");
              }}
              className="border-white/[0.08] bg-[#0E1218] hover:bg-[#141922] text-xs font-mono uppercase text-zinc-300 hover:text-white h-8"
            >
              <Trophy className="w-3.5 h-3.5 mr-1.5 text-amber-400" />
              HALL OF IMMORTALS
            </Button>
          </div>
        </div>

        {/* Global Progress Summary Card */}
        <div className="obsidian-card p-5 razor-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <span className="text-[10px] text-zinc-500 uppercase tracking-widest block mb-0.5 font-semibold">
              OVERALL MILESTONE COMPLETION
            </span>
            <div className="text-2xl font-bold text-zinc-100 flex items-baseline gap-2 tabular-telemetry">
              <span>{summary.unlockedCount} / {summary.totalCount} UNLOCKED</span>
              <span className="text-sm font-normal text-emerald-400">
                ({summary.completionRate}%)
              </span>
            </div>
          </div>

          <div className="w-full sm:w-64 space-y-1.5">
            <div className="flex justify-between text-[10px] text-zinc-400 uppercase">
              <span>Progress Vector</span>
              <span className="tabular-telemetry">{summary.completionRate}%</span>
            </div>
            <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-cyan-400 rounded-full transition-all duration-300"
                style={{ width: `${summary.completionRate}%` }}
              />
            </div>
          </div>
        </div>

        {/* Category Filters */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 bg-[#090C10] p-1 rounded border border-white/[0.08]">
          {[
            { id: "all", label: "All Sectors" },
            { id: "discipline", label: "Discipline" },
            { id: "combat", label: "Combat" },
            { id: "fitness", label: "Fitness" },
            { id: "focus", label: "Focus" },
            { id: "social", label: "Social" },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => {
                audioEngine.playTactileClick();
                setSelectedCategory(cat.id);
              }}
              className={`px-3 py-1.5 rounded text-xs uppercase tracking-wider transition-all whitespace-nowrap font-mono ${
                selectedCategory === cat.id
                  ? "bg-zinc-100 text-black font-extrabold shadow-sm"
                  : "text-zinc-400 hover:text-white hover:bg-white/[0.04]"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Milestone Grid */}
        {isLoading ? (
          <div className="text-center py-16 text-zinc-500 text-xs">
            <span>CALIBRATING TROPHY ARCHIVE...</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {filteredAchievements.map((ach) => (
              <div
                key={ach.code}
                className={`obsidian-card razor-border-hover p-4 sm:p-5 rounded-lg transition-all ${
                  ach.isUnlocked
                    ? "border-amber-500/25 bg-gradient-to-b from-[#0E1218] to-[#090C10] shadow-md shadow-black/50"
                    : "border-white/5 bg-[#090C10] opacity-80 hover:opacity-100"
                }`}
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-md flex items-center justify-center bg-[#141922] border border-white/10 shrink-0">
                      {getCategoryIcon(ach.category)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-sm text-white tracking-tight">{ach.title}</span>
                        <Badge variant="outline" className={`text-[9px] uppercase px-1.5 py-0 font-mono tracking-wider ${getTierColor(ach.tier)}`}>
                          {ach.tier}
                        </Badge>
                      </div>
                      <span className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider block mt-0.5">
                        SECTOR: {ach.category}
                      </span>
                    </div>
                  </div>

                  <div className="text-right font-mono text-[11px] tabular-telemetry">
                    <span className="text-amber-400 font-semibold block">+{ach.rewardCoins} CR</span>
                    <span className="text-zinc-500 block text-[10px]">+{ach.rewardXp} XP</span>
                  </div>
                </div>

                <p className="text-xs text-zinc-400 mb-4 leading-relaxed font-normal">
                  {ach.description}
                </p>

                {/* Progress Bar & Telemetry Status */}
                <div className="space-y-1.5 mb-4 p-2.5 rounded bg-[#07080B] border border-white/5">
                  <div className="flex justify-between text-[10px] text-zinc-400 font-mono uppercase tracking-wider">
                    <span>{ach.metricLabel}: <strong className="text-zinc-200 tabular-telemetry">{ach.currentValue}</strong> / {ach.targetValue}</span>
                    <span className={`tabular-telemetry font-bold ${ach.isUnlocked ? "text-emerald-400" : "text-zinc-400"}`}>
                      {ach.progressPercent}%
                    </span>
                  </div>
                  <Progress value={ach.progressPercent} className="h-1 bg-[#141922]" />
                </div>

                {/* Card Actions */}
                <div className="flex items-center justify-between pt-2.5 border-t border-white/5">
                  <div>
                    {ach.isUnlocked ? (
                      <span className="inline-flex items-center gap-1.5 text-[10px] font-mono text-emerald-400 uppercase tracking-wider">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        VERIFIED UNLOCKED
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-[10px] font-mono text-zinc-500 uppercase tracking-wider">
                        <Lock className="w-3 h-3" /> LOCKED TARGET
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {ach.isUnlocked && !ach.isClaimed && (
                      <Button
                        size="sm"
                        disabled={claimMutation.isPending}
                        onClick={() => {
                          audioEngine.playTactileClick();
                          claimMutation.mutate(ach.code);
                        }}
                        className="bg-amber-400 hover:bg-amber-300 text-black font-mono text-[11px] font-bold uppercase tracking-wider h-7 px-3 rounded shadow-sm hover:scale-[1.02] active:scale-[0.98] transition-all"
                      >
                        CLAIM REWARD
                      </Button>
                    )}

                    {ach.isUnlocked && (
                      <ShareTelemetryButton
                        label="TRANSMIT"
                        data={{
                          type: "quest",
                          title: "MILESTONE UNLOCKED",
                          headlineMetric: ach.title.toUpperCase(),
                          subheadline: ach.description,
                          userName: (user as any)?.name || "Operative",
                          userTier: (user as any)?.tier || "INITIATE",
                          referralCode: (user as any)?.referralCode,
                          stats: [
                            { label: "Tier", value: ach.tier.toUpperCase() },
                            { label: "Yield", value: `+${ach.rewardCoins} Coins` },
                            { label: "Sector", value: ach.category.toUpperCase() },
                          ],
                        }}
                      />
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
