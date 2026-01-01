import { useQuery } from "@tanstack/react-query";
import { RoadmapVisual } from "@/components/roadmap/RoadmapVisual";
import { WeekCard } from "@/components/roadmap/WeekCard";
import { Roadmap, RoadmapWeek, RoadmapTask, User } from "@shared/schema";
import { Loader2, Lock, Shield, Sparkles } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { motion } from "framer-motion";

type RoadmapData = Roadmap & {
    weeks: (RoadmapWeek & { tasks: RoadmapTask[] })[];
};

export default function RoadmapPage() {
    const { user: authUser } = useAuth();

    const { data: user, isLoading: isUserLoading } = useQuery<User>({
        queryKey: ["/api/user"],
        enabled: !!authUser,
    });

    const { data: roadmap, isLoading: isRoadmapLoading, error } = useQuery<RoadmapData>({
        queryKey: ["/api/roadmap"],
        enabled: !!user?.isPremium,
    });

    const isLoading = isUserLoading || isRoadmapLoading;

    if (isLoading) {
        return (
            <div className="min-h-screen bg-black flex flex-col items-center justify-center">
                <div className="relative">
                    <div className="absolute inset-0 bg-blue-500/20 blur-3xl animate-pulse" />
                    <Loader2 className="w-12 h-12 text-blue-500 animate-spin relative" />
                </div>
                <p className="mt-4 text-zinc-500 font-mono text-sm tracking-widest uppercase animate-pulse">Initializing Protocol...</p>
            </div>
        );
    }

    if (user && !user.isPremium) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center p-4 relative overflow-hidden">
                <div className="absolute inset-x-0 top-0 h-[500px] bg-gradient-to-b from-blue-600/10 to-transparent pointer-events-none" />
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="max-w-md text-center space-y-8 relative z-10"
                >
                    <div className="relative inline-block">
                        <div className="absolute inset-0 bg-blue-500/20 blur-2xl rounded-full" />
                        <div className="w-24 h-24 bg-zinc-900/50 backdrop-blur-xl rounded-3xl flex items-center justify-center mx-auto border border-zinc-800 shadow-2xl relative">
                            <Lock className="w-10 h-10 text-blue-400" />
                        </div>
                    </div>
                    <div className="space-y-4">
                        <h1 className="text-4xl font-bold font-heading text-white tracking-tight">Access Restricted</h1>
                        <p className="text-zinc-400 leading-relaxed">
                            The <span className="text-blue-400 font-bold">30-Day Ascension Protocol</span> is an elite training program reserved for premium initiates.
                        </p>
                    </div>
                    <div className="p-4 rounded-xl bg-blue-950/20 border border-blue-900/30 text-left space-y-3">
                        <div className="flex items-start gap-3">
                            <Shield className="w-5 h-5 text-blue-400 mt-0.5" />
                            <p className="text-xs text-zinc-300">Unlock detailed daily protocols designed for peak performance.</p>
                        </div>
                        <div className="flex items-start gap-3">
                            <Sparkles className="w-5 h-5 text-blue-400 mt-0.5" />
                            <p className="text-xs text-zinc-300">Track your progress across 4 modular phases of evolution.</p>
                        </div>
                    </div>
                    <Button asChild size="lg" className="w-full bg-blue-600 hover:bg-blue-500 text-white shadow-xl shadow-blue-900/20 py-6 text-lg font-bold">
                        <Link href="/store">Unlock Protocol</Link>
                    </Button>
                </motion.div>
            </div>
        );
    }

    if (error || (!roadmap && user?.isPremium)) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center p-4 text-center">
                <div className="space-y-4">
                    <p className="text-red-400 font-mono tracking-tighter text-xl">QUANTUM_LINK_FAILURE</p>
                    <p className="text-zinc-500 max-w-xs mx-auto">Failed to retrieve protocol data from the neural network.</p>
                    <Button variant="outline" onClick={() => window.location.reload()} className="border-zinc-800">Retry Link</Button>
                </div>
            </div>
        );
    }

    if (!roadmap) return null;

    return (
        <div className="min-h-screen bg-black text-white p-4 md:p-10 pb-40 relative overflow-hidden">
            {/* Ambient Background Elements */}
            <div className="fixed top-0 left-0 w-full h-[1000px] bg-[radial-gradient(circle_at_20%_0%,_var(--tw-gradient-stops))] from-blue-900/20 via-black to-black pointer-events-none -z-10" />
            <div className="fixed bottom-0 right-0 w-[800px] h-[800px] bg-[radial-gradient(circle_at_80%_80%,_var(--tw-gradient-stops))] from-purple-900/10 via-black to-black pointer-events-none -z-10 opacity-50" />

            <div className="max-w-7xl mx-auto space-y-12">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex flex-col md:flex-row md:items-end justify-between gap-6"
                >
                    <div className="space-y-3">
                        <div className="flex items-center gap-2">
                            <div className="h-1 w-12 bg-blue-600 rounded-full" />
                            <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-blue-400">Biological Optimization</span>
                        </div>
                        <h1 className="text-5xl md:text-7xl font-bold font-heading tracking-tighter leading-none">
                            Ascension <br /> <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-purple-400 to-indigo-600">Protocol</span>
                        </h1>
                        <p className="text-zinc-500 max-w-xl text-lg leading-relaxed">
                            Systematic reconstruction of daily performance via consistent execution of identified critical actions.
                        </p>
                    </div>

                    <div className="flex bg-zinc-900/30 backdrop-blur-xl rounded-2xl border border-zinc-800/50 p-4 gap-6 items-center">
                        <div className="text-center md:text-left">
                            <p className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Current Tier</p>
                            <p className="text-xl font-bold text-white capitalize">Phase 0{roadmap.currentWeek}</p>
                        </div>
                        <div className="h-8 w-px bg-zinc-800" />
                        <div className="text-center md:text-left">
                            <p className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">System Rank</p>
                            <p className="text-xl font-bold text-blue-400">Initiate</p>
                        </div>
                    </div>
                </motion.div>

                {/* Visual Roadmap (Path) */}
                <div className="relative py-10 px-4">
                    <RoadmapVisual
                        currentWeek={roadmap.currentWeek}
                        weeks={roadmap.weeks}
                    />
                </div>

                {/* Phase Selection / Grid */}
                <div className="space-y-6">
                    <div className="flex items-center gap-4">
                        <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-500 whitespace-nowrap">Operational Phases</h2>
                        <div className="h-px w-full bg-zinc-900" />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
                        {roadmap.weeks
                            .sort((a, b) => a.weekNumber - b.weekNumber)
                            .map((week, index) => (
                                <WeekCard
                                    key={week.id}
                                    week={week}
                                    index={index}
                                />
                            ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
