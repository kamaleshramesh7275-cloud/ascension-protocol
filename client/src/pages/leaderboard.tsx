import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { User } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Trophy, Medal, Crown, TrendingUp, Brain, Shield, Clock, Sparkles, ArrowRight, Skull } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { PullToRefresh } from "@/components/pull-to-refresh";
import { queryClient } from "@/lib/queryClient";
import { useLocation } from "wouter";

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
            case 0: return <Crown className="h-5 w-5 text-amber-400 fill-amber-400" />;
            case 1: return <Medal className="h-5 w-5 text-zinc-300 fill-zinc-300" />;
            case 2: return <Medal className="h-5 w-5 text-amber-700 fill-amber-700" />;
            default: return <span className="text-sm font-mono font-bold text-muted-foreground w-6 text-center">{index + 1}</span>;
        }
    };

    return (
        <PullToRefresh onRefresh={async () => {
            await queryClient.invalidateQueries({ queryKey: ["/api/focus-density-leaderboard"] });
            await queryClient.invalidateQueries({ queryKey: ["/api/leaderboard"] });
        }}>
        <div className="p-4 md:p-8 min-h-screen bg-black/95 text-white" data-tour="leaderboard-page">
            <div className="max-w-4xl mx-auto space-y-6">
                {/* Header */}
                <div className="text-center space-y-2">
                    <h1 className="text-2xl md:text-4xl font-extrabold bg-gradient-to-r from-amber-400 via-orange-400 to-yellow-500 bg-clip-text text-transparent flex items-center justify-center gap-2">
                        <Trophy className="h-7 w-7 text-amber-400" /> Human Execution Rankings
                    </h1>
                    <p className="text-xs md:text-sm text-zinc-400 max-w-xl mx-auto">
                        Ranked by verified focus density and non-purchasable discipline scores. Vanity stats discarded.
                    </p>
                </div>

                {/* Hall of Ascension Callout Banner */}
                <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-950/30 via-zinc-900/60 to-black border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg shadow-amber-500/5">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20">
                            <Sparkles className="w-5 h-5 text-amber-400" />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-amber-300 uppercase tracking-wide">Hall of Ascension & Wall of Consequence</p>
                            <p className="text-xs text-zinc-400">View 30+ day living legends and audited contract defaults.</p>
                        </div>
                    </div>
                    <Button
                        onClick={() => setLocation("/hall-of-ascension")}
                        size="sm"
                        className="bg-amber-500 hover:bg-amber-600 text-black font-semibold text-xs uppercase tracking-wider gap-1.5 self-start sm:self-auto"
                    >
                        Enter The Hall <ArrowRight className="w-3.5 h-3.5" />
                    </Button>
                </div>

                {/* Tab Controls */}
                <div className="flex justify-center">
                    <div className="inline-flex p-1 rounded-xl bg-zinc-950 border border-white/10">
                        <button
                            onClick={() => setViewMode("focus")}
                            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
                                viewMode === "focus"
                                    ? "bg-amber-500 text-black shadow-md shadow-amber-500/20"
                                    : "text-zinc-400 hover:text-white"
                            }`}
                        >
                            <Brain className="w-3.5 h-3.5" /> Focus Density (One True Metric)
                        </button>
                        <button
                            onClick={() => setViewMode("legacy")}
                            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
                                viewMode === "legacy"
                                    ? "bg-zinc-800 text-white"
                                    : "text-zinc-400 hover:text-white"
                            }`}
                        >
                            Legacy XP Standings
                        </button>
                    </div>
                </div>

                {/* Leaderboard Card */}
                <Card className="border-white/10 bg-zinc-950/80 backdrop-blur-xl rounded-2xl overflow-hidden shadow-2xl">
                    <CardHeader className="p-4 md:p-5 border-b border-white/5 bg-zinc-900/40 flex flex-row items-center justify-between">
                        <CardTitle className="text-sm font-mono uppercase tracking-wider text-amber-400 flex items-center gap-2">
                            {viewMode === "focus" ? (
                                <>
                                    <Brain className="w-4 h-4 text-cyan-400" /> Focus Sovereignty Matrix
                                </>
                            ) : (
                                <>
                                    <Trophy className="w-4 h-4 text-amber-400" /> Cumulative XP Board
                                </>
                            )}
                        </CardTitle>
                        <span className="text-xs text-zinc-500 font-mono">
                            {viewMode === "focus" ? `${focusLeaderboard.length} Operators` : `${legacyLeaderboard.length} Users`}
                        </span>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="divide-y divide-white/5">
                            {viewMode === "focus" ? (
                                focusLeaderboard.map((item, index) => (
                                    <div
                                        key={item.user.id}
                                        onClick={() => setLocation(`/profile/${item.user.id}`)}
                                        className={`flex items-center p-3 md:p-4 transition-colors cursor-pointer gap-3 hover:bg-amber-500/5 ${
                                            currentUser?.uid === item.user.firebaseUid ? "bg-amber-500/10 border-l-2 border-amber-500" : ""
                                        }`}
                                    >
                                        <div className="flex items-center justify-center w-8 flex-shrink-0">
                                            {getRankIcon(index)}
                                        </div>

                                        <Avatar className="h-9 w-9 border border-white/10 flex-shrink-0">
                                            <AvatarImage src={item.user.avatarUrl || undefined} />
                                            <AvatarFallback className="bg-amber-500/20 text-amber-400 font-bold text-xs">
                                                {item.user.name?.charAt(0) || "U"}
                                            </AvatarFallback>
                                        </Avatar>

                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-1.5 flex-wrap">
                                                <h3 className="font-bold text-sm text-white hover:underline truncate">{item.user.name}</h3>
                                                {currentUser?.uid === item.user.firebaseUid && (
                                                    <Badge className="text-[10px] bg-amber-500/20 text-amber-400 border-amber-500/30 px-1.5 py-0 font-mono">You</Badge>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-3 text-xs text-zinc-400 font-mono mt-0.5">
                                                <span className="text-cyan-400 flex items-center gap-1">
                                                    <Clock className="w-3 h-3" /> {Math.round(item.verifiedMinutes / 60)}h Deep Work
                                                </span>
                                            </div>
                                        </div>

                                        <div className="text-right flex-shrink-0 space-y-0.5 font-mono">
                                            <div className="font-extrabold text-sm md:text-base text-amber-400">
                                                {item.disciplineScore} pts
                                            </div>
                                            <div className="text-[11px] text-zinc-500">
                                                {item.focusDensityScore}% Density
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                legacyLeaderboard.map((user, index) => (
                                    <div
                                        key={user.id}
                                        onClick={() => setLocation(`/profile/${user.id}`)}
                                        className={`flex items-center p-3 md:p-4 transition-colors cursor-pointer gap-3 hover:bg-white/5 ${
                                            currentUser?.uid === user.firebaseUid ? "bg-amber-500/10 border-l-2 border-amber-500" : ""
                                        }`}
                                    >
                                        <div className="flex items-center justify-center w-8 flex-shrink-0">
                                            {getRankIcon(index)}
                                        </div>

                                        <Avatar className="h-9 w-9 border border-white/10 flex-shrink-0">
                                            <AvatarImage src={user.avatarUrl || undefined} />
                                            <AvatarFallback className="bg-amber-500/20 text-amber-400 font-bold text-xs">
                                                {user.name.charAt(0)}
                                            </AvatarFallback>
                                        </Avatar>

                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-1.5 flex-wrap">
                                                <h3 className="font-bold text-sm text-white hover:underline truncate">{user.name}</h3>
                                                {currentUser?.uid === user.firebaseUid && (
                                                    <Badge className="text-[10px] bg-amber-500/20 text-amber-400 border-amber-500/30 px-1.5 py-0 font-mono">You</Badge>
                                                )}
                                            </div>
                                            <p className="text-xs text-zinc-500 font-mono">Level {user.level} • Rank {user.tier}</p>
                                        </div>

                                        <div className="text-right flex-shrink-0 space-y-0.5">
                                            <div className="font-bold text-sm text-amber-400 font-mono">{user.xp.toLocaleString()} XP</div>
                                            <div className="text-[11px] text-zinc-500 flex items-center justify-end gap-1 font-mono">
                                                <TrendingUp className="h-3 w-3" /> {user.streak}d
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
        </PullToRefresh>
    );
}
