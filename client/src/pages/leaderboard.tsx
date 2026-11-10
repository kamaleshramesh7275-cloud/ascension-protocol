import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { User } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Trophy, Medal, Crown, TrendingUp, Brain, Shield, Clock, Sparkles, ArrowRight } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { PullToRefresh } from "@/components/pull-to-refresh";
import { queryClient } from "@/lib/queryClient";
import { useLocation } from "wouter";
import { audioEngine } from "@/lib/audio-engine";

interface FocusLeaderboardEntry {
  user: User;
  focusDensityScore: number;
  verifiedMinutes: number;
  disciplineScore: number;
}

export default function LeaderboardPage() {
  const [, setLocation] = useLocation();
  const { user: currentUser } = useAuth();
  const [viewMode, setViewMode] = useState<"focus" | "legacy">("focus");

  // Fetch Focus Density & Discipline Leaderboard
  const { data: focusLeaderboard = [] } = useQuery<FocusLeaderboardEntry[]>({
    queryKey: ["/api/focus-density-leaderboard"],
  });

  // Fetch Legacy XP Leaderboard
  const { data: legacyLeaderboard = [] } = useQuery<User[]>({
    queryKey: ["/api/leaderboard"],
  });

  const getRankIcon = (index: number) => {
    switch (index) {
      case 0:
        return <Crown className="h-4 w-4 text-amber-400 fill-amber-400" />;
      case 1:
        return <Medal className="h-4 w-4 text-zinc-300 fill-zinc-300" />;
      case 2:
        return <Medal className="h-4 w-4 text-amber-600 fill-amber-600" />;
      default:
        return <span className="text-xs font-mono font-bold text-zinc-500 w-6 text-center tabular-telemetry">{index + 1}</span>;
    }
  };

  return (
    <PullToRefresh
      onRefresh={async () => {
        await queryClient.invalidateQueries({ queryKey: ["/api/focus-density-leaderboard"] });
        await queryClient.invalidateQueries({ queryKey: ["/api/leaderboard"] });
      }}
    >
      <div className="p-4 sm:p-6 md:p-8 min-h-screen bg-[#07080B] text-zinc-100 font-sans relative overflow-hidden" data-tour="leaderboard-page">
        {/* Ambient glow */}
        <div className="absolute top-0 left-1/3 w-96 h-96 bg-cyan-500/5 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-amber-500/5 blur-3xl pointer-events-none" />

        <div className="max-w-4xl mx-auto space-y-6 relative z-10">
          {/* Header */}
          <div className="text-center space-y-2 pb-2">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/20 text-[10px] font-mono text-cyan-400 uppercase tracking-wider">
              SECTOR 05 // PERFORMANCE REGISTRY
            </div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight text-white uppercase font-mono">
              FOCUS SOVEREIGNTY MATRIX
            </h1>
            <p className="text-xs text-zinc-400 max-w-lg mx-auto font-sans leading-relaxed">
              Audited ranking calibrated by verified deep focus density and non-purchasable discipline scores.
            </p>
          </div>

          {/* Hall of Ascension Callout Banner */}
          <div className="obsidian-card razor-border-hover border-amber-500/25 bg-gradient-to-r from-[#0E1218] to-[#090C10] rounded-lg p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md shadow-amber-500/5">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-md bg-amber-500/10 border border-amber-500/25 shrink-0">
                <Sparkles className="w-4 h-4 text-amber-400" />
              </div>
              <div>
                <p className="text-xs font-bold font-mono text-amber-300 uppercase tracking-wide">HALL OF ASCENSION & WALL OF CONSEQUENCE</p>
                <p className="text-[11px] text-zinc-400 font-sans">View 30+ day living legends and audited contract defaults.</p>
              </div>
            </div>
            <Button
              onClick={() => {
                audioEngine.playTactileClick();
                setLocation("/hall-of-ascension");
              }}
              size="sm"
              className="bg-amber-400 hover:bg-amber-300 text-black font-mono font-bold text-xs uppercase tracking-wider h-8 px-3.5 gap-1.5 self-start sm:self-auto rounded shadow-sm hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              ENTER ARCHIVE <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </div>

          {/* Tab Controls */}
          <div className="flex justify-center">
            <div className="inline-flex p-0.5 rounded-md bg-[#07080B] border border-white/10 text-xs font-mono">
              <button
                onClick={() => {
                  audioEngine.playTactileClick();
                  setViewMode("focus");
                }}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded text-[11px] font-bold uppercase tracking-wider transition-all ${
                  viewMode === "focus"
                    ? "bg-[#1C232E] text-white shadow-sm"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                <Brain className="w-3 h-3 text-cyan-400" /> FOCUS DENSITY MATRIX
              </button>
              <button
                onClick={() => {
                  audioEngine.playTactileClick();
                  setViewMode("legacy");
                }}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded text-[11px] font-bold uppercase tracking-wider transition-all ${
                  viewMode === "legacy"
                    ? "bg-[#1C232E] text-white shadow-sm"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                CUMULATIVE XP BOARD
              </button>
            </div>
          </div>

          {/* Leaderboard Card */}
          <div className="obsidian-card rounded-xl border-white/10 bg-[#090C10] overflow-hidden shadow-2xl">
            <div className="p-3.5 sm:p-4 border-b border-white/10 bg-[#0E1218] flex flex-row items-center justify-between">
              <div className="text-xs font-mono uppercase tracking-wider text-amber-400 flex items-center gap-2">
                {viewMode === "focus" ? (
                  <>
                    <Brain className="w-3.5 h-3.5 text-cyan-400" /> ACTIVE TELEMETRY OPERATIVES
                  </>
                ) : (
                  <>
                    <Trophy className="w-3.5 h-3.5 text-amber-400" /> NETWORK ARCHIVE
                  </>
                )}
              </div>
              <span className="text-[10px] text-zinc-500 font-mono tabular-telemetry">
                {viewMode === "focus" ? `${focusLeaderboard.length} OPERATORS` : `${legacyLeaderboard.length} OPERATORS`}
              </span>
            </div>
            <div>
              <div className="divide-y divide-white/5">
                {viewMode === "focus" ? (
                  focusLeaderboard.map((item, index) => (
                    <div
                      key={item.user.id}
                      onClick={() => {
                        audioEngine.playTactileClick();
                        setLocation(`/profile/${item.user.id}`);
                      }}
                      className={`flex items-center p-3 sm:p-3.5 transition-colors cursor-pointer gap-3 hover:bg-[#0E1218] ${
                        currentUser?.uid === item.user.firebaseUid ? "bg-amber-500/10 border-l-2 border-amber-400" : ""
                      }`}
                    >
                      <div className="flex items-center justify-center w-7 shrink-0">
                        {getRankIcon(index)}
                      </div>

                      <Avatar className="h-8 w-8 border border-white/10 shrink-0">
                        <AvatarImage src={item.user.avatarUrl || undefined} />
                        <AvatarFallback className="bg-[#141922] text-amber-400 font-mono font-bold text-xs">
                          {item.user.name?.charAt(0) || "U"}
                        </AvatarFallback>
                      </Avatar>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h3 className="font-semibold text-xs text-white truncate font-mono">{item.user.name}</h3>
                          {currentUser?.uid === item.user.firebaseUid && (
                            <Badge className="text-[9px] bg-amber-400/20 text-amber-300 border-amber-400/30 px-1 py-0 font-mono uppercase">YOU</Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-[11px] text-zinc-400 font-mono mt-0.5">
                          <span className="text-cyan-400 flex items-center gap-1 tabular-telemetry">
                            <Clock className="w-2.5 h-2.5" /> {Math.round(item.verifiedMinutes / 60)}h Deep Work
                          </span>
                        </div>
                      </div>

                      <div className="text-right shrink-0 space-y-0.5 font-mono">
                        <div className="font-bold text-xs sm:text-sm text-amber-400 tabular-telemetry">
                          {item.disciplineScore} pts
                        </div>
                        <div className="text-[10px] text-zinc-500 tabular-telemetry">
                          {item.focusDensityScore}% Density
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  legacyLeaderboard.map((user, index) => (
                    <div
                      key={user.id}
                      onClick={() => {
                        audioEngine.playTactileClick();
                        setLocation(`/profile/${user.id}`);
                      }}
                      className={`flex items-center p-3 sm:p-3.5 transition-colors cursor-pointer gap-3 hover:bg-[#0E1218] ${
                        currentUser?.uid === user.firebaseUid ? "bg-amber-500/10 border-l-2 border-amber-400" : ""
                      }`}
                    >
                      <div className="flex items-center justify-center w-7 shrink-0">
                        {getRankIcon(index)}
                      </div>

                      <Avatar className="h-8 w-8 border border-white/10 shrink-0">
                        <AvatarImage src={user.avatarUrl || undefined} />
                        <AvatarFallback className="bg-[#141922] text-amber-400 font-mono font-bold text-xs">
                          {user.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h3 className="font-semibold text-xs text-white truncate font-mono">{user.name}</h3>
                          {currentUser?.uid === user.firebaseUid && (
                            <Badge className="text-[9px] bg-amber-400/20 text-amber-300 border-amber-400/30 px-1 py-0 font-mono uppercase">YOU</Badge>
                          )}
                        </div>
                        <p className="text-[10px] text-zinc-500 font-mono uppercase">LEVEL {user.level} // RANK {user.tier}</p>
                      </div>

                      <div className="text-right shrink-0 space-y-0.5 font-mono">
                        <div className="font-bold text-xs sm:text-sm text-amber-400 tabular-telemetry">{user.xp.toLocaleString()} XP</div>
                        <div className="text-[10px] text-zinc-500 flex items-center justify-end gap-1 tabular-telemetry">
                          <TrendingUp className="h-2.5 w-2.5" /> {user.streak}d
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </PullToRefresh>
  );
}
