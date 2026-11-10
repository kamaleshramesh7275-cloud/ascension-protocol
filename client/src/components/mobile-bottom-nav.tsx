import { Home, Target, Brain, ShoppingBag, Dumbbell, MoreHorizontal, Trophy, User, Activity, BookOpen, Users, MessageSquare, Map, Phone, X, ArrowRight, Lock, Gavel, Scale, Flame, Eye, Award } from "lucide-react";
import { useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { useWorkout } from "@/context/workout-context";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { User as BackendUser } from "@shared/schema";

import { audioEngine } from "@/lib/audio-engine";

interface MobileBottomNavProps {
    className?: string;
}

// Primary 5 tabs always visible (Ascension Protocol Pillars)
const primaryNavItems = [
    { icon: Home, label: "Command", path: "/mission-command" },
    { icon: Brain, label: "Air-Gap", path: "/air-gap-focus" },
    { icon: Flame, label: "Squad", path: "/squad-pact" },
    { icon: Gavel, label: "Court", path: "/performance-court" },
    { icon: Dumbbell, label: "Workout", path: "/workout" },
];

// All the extra pages accessible from the "More" drawer
const moreNavItems = [
    { icon: Activity, label: "Evening Debrief", path: "/evening-debrief", color: "text-purple-400", bg: "bg-purple-500/10" },
    { icon: Gavel, label: "Performance Court", path: "/performance-court", color: "text-rose-400", bg: "bg-rose-500/10" },
    { icon: Scale, label: "Commitment Contract", path: "/commitment-contract", color: "text-amber-400", bg: "bg-amber-500/10" },
    { icon: Flame, label: "Squad Pact", path: "/squad-pact", color: "text-orange-400", bg: "bg-orange-500/10" },
    { icon: Eye, label: "Public Wall", path: "/public-commitments", color: "text-blue-400", bg: "bg-blue-500/10" },
    { icon: Activity, label: "Stats", path: "/stats", color: "text-sky-400", bg: "bg-sky-500/10" },
    { icon: Trophy, label: "Leaderboard", path: "/leaderboard", color: "text-yellow-400", bg: "bg-yellow-500/10" },
    { icon: Award, label: "Achievements", path: "/achievements", color: "text-amber-400", bg: "bg-amber-500/10" },
    { icon: Trophy, label: "Hall of Immortals", path: "/hall-of-ascension", color: "text-amber-400", bg: "bg-amber-500/10" },
    { icon: User, label: "Profile", path: "/profile", color: "text-emerald-400", bg: "bg-emerald-500/10" },
    { icon: Map, label: "Roadmap", path: "/roadmap", color: "text-red-400", bg: "bg-red-500/10", premiumOnly: true },
    { icon: BookOpen, label: "Library", path: "/library", color: "text-purple-400", bg: "bg-purple-500/10" },
    { icon: Users, label: "Partners", path: "/partners", color: "text-pink-400", bg: "bg-pink-500/10" },
    { icon: MessageSquare, label: "Global Chat", path: "/global-chat", color: "text-indigo-400", bg: "bg-indigo-500/10" },
    { icon: Phone, label: "Contact", path: "/contact", color: "text-violet-400", bg: "bg-violet-500/10" },
];

export function MobileBottomNav({ className }: MobileBottomNavProps) {
    const [location, setLocation] = useLocation();
    const { isWorkoutActive } = useWorkout();
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const { user: firebaseUser } = useAuth();

    const { data: user } = useQuery<BackendUser>({
        queryKey: ["/api/user"],
        enabled: !!firebaseUser,
    });

    const isMoreActive = moreNavItems.some(item =>
        location === item.path || (item.path === "/profile" && location.startsWith("/profile"))
    );

    const handleMoreItemClick = (path: string) => {
        audioEngine.playTactileClick();
        setIsDrawerOpen(false);
        setLocation(path);
    };

    return (
        <>
            {/* More Drawer Overlay */}
            <AnimatePresence>
                {isDrawerOpen && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
                            onClick={() => setIsDrawerOpen(false)}
                        />

                        {/* Drawer panel */}
                        <motion.div
                            initial={{ y: "100%", opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: "100%", opacity: 0 }}
                            transition={{ type: "spring", stiffness: 400, damping: 35 }}
                            className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-zinc-950 border-t border-white/10 rounded-t-3xl overflow-hidden"
                            style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
                        >
                            {/* Handle bar */}
                            <div className="flex justify-center pt-3 pb-1">
                                <div className="w-10 h-1 rounded-full bg-white/20" />
                            </div>

                            {/* Header */}
                            <div className="flex items-center justify-between px-5 py-3">
                                <h2 className="text-base font-bold text-white">More</h2>
                                <button
                                    onClick={() => setIsDrawerOpen(false)}
                                    className="p-1.5 rounded-full bg-white/10 text-muted-foreground hover:text-white transition-colors"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>

                            {/* Grid of items */}
                            <div className="grid grid-cols-4 gap-3 px-4 pb-5 pt-2">
                                {moreNavItems.map((item, index) => {
                                    const Icon = item.icon;
                                    const isActive = location === item.path ||
                                        (item.path === "/profile" && location.startsWith("/profile"));
                                    const isLocked = (item as any).premiumOnly && !user?.isPremium;

                                    return (
                                        <motion.button
                                            key={item.path}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: index * 0.04 }}
                                            onClick={() => handleMoreItemClick(item.path)}
                                            className={cn(
                                                "relative flex flex-col items-center gap-1.5 p-3 rounded-2xl transition-all duration-200",
                                                isActive
                                                    ? `${item.bg} border border-white/20`
                                                    : "bg-white/5 hover:bg-white/10 border border-transparent"
                                            )}
                                        >
                                            <div className={cn(
                                                "p-2 rounded-xl",
                                                isActive ? item.bg : "bg-white/5"
                                            )}>
                                                <Icon className={cn(
                                                    "w-5 h-5",
                                                    isActive ? item.color : "text-muted-foreground"
                                                )} />
                                            </div>
                                            <span className={cn(
                                                "text-[10px] font-semibold text-center leading-tight",
                                                isActive ? "text-white" : "text-muted-foreground"
                                            )}>
                                                {item.label}
                                            </span>
                                            {isLocked && (
                                                <Lock className="absolute top-2 right-2 w-2.5 h-2.5 text-zinc-500" />
                                            )}
                                        </motion.button>
                                    );
                                })}
                            </div>

                            {/* Ambient glow */}
                            <div className="absolute top-0 left-1/4 right-1/4 h-px bg-gradient-to-r from-transparent via-primary/60 to-transparent" />
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Bottom Nav Bar */}
            <nav
                className={cn(
                    "border-t border-white/[0.08] bg-[#07080B]/95 backdrop-blur-2xl relative overflow-hidden select-none",
                    className
                )}
                style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
            >
                {/* Razor top hairline highlight */}
                <div className="absolute top-0 left-0 right-0 h-px bg-white/[0.08]" />

                <div className="flex items-stretch justify-around px-1 pt-2 pb-1">
                    {primaryNavItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = location === item.path;
                        const isWorkout = item.path === "/workout";

                        return (
                            <button
                                key={item.path}
                                onClick={() => {
                                    audioEngine.playTactileClick();
                                    setLocation(item.path);
                                }}
                                className="relative flex flex-col items-center gap-1 flex-1 py-1.5 rounded-lg transition-all duration-150 group focus:outline-none"
                                style={{ minHeight: "50px", minWidth: "44px" }}
                                aria-label={item.label}
                                aria-current={isActive ? "page" : undefined}
                            >
                                {/* Precision Cyan Active Pill */}
                                {isActive && (
                                    <div className="absolute inset-0 rounded-md bg-cyan-950/30 border border-cyan-500/20" />
                                )}

                                <div className="relative z-10">
                                    <Icon
                                        className={cn(
                                            "h-4 w-4 transition-colors duration-150",
                                            isActive
                                                ? "text-cyan-400"
                                                : isWorkout && isWorkoutActive
                                                    ? "text-emerald-400"
                                                    : "text-zinc-500 group-hover:text-zinc-300"
                                        )}
                                    />
                                    {/* Pulsing indicator when workout is active */}
                                    {isWorkout && isWorkoutActive && (
                                        <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
                                    )}
                                </div>

                                <span
                                    className={cn(
                                        "relative z-10 text-[9px] font-mono tracking-tight leading-none transition-colors duration-150 uppercase",
                                        isActive
                                            ? "text-cyan-400 font-semibold"
                                            : isWorkout && isWorkoutActive
                                                ? "text-emerald-400"
                                                : "text-zinc-500 group-hover:text-zinc-300"
                                    )}
                                >
                                    {item.label}
                                </span>
                            </button>
                        );
                    })}

                    {/* More Button */}
                    <button
                        onClick={() => {
                            audioEngine.playTactileClick();
                            setIsDrawerOpen(prev => !prev);
                        }}
                        className="relative flex flex-col items-center gap-1 flex-1 py-1.5 rounded-lg transition-all duration-150 group focus:outline-none"
                        style={{ minHeight: "50px", minWidth: "44px" }}
                        aria-label="More navigation options"
                        aria-expanded={isDrawerOpen}
                    >
                        {(isMoreActive || isDrawerOpen) && (
                            <div className="absolute inset-0 rounded-md bg-cyan-950/30 border border-cyan-500/20" />
                        )}

                        <div className="relative z-10">
                            <MoreHorizontal
                                className={cn(
                                    "h-4 w-4 transition-colors duration-150",
                                    isMoreActive || isDrawerOpen
                                        ? "text-cyan-400"
                                        : "text-zinc-500 group-hover:text-zinc-300"
                                )}
                            />
                        </div>
                        <span
                            className={cn(
                                "relative z-10 text-[9px] font-mono tracking-tight leading-none transition-colors duration-150 uppercase",
                                isMoreActive || isDrawerOpen ? "text-cyan-400 font-semibold" : "text-zinc-500 group-hover:text-zinc-300"
                            )}
                        >
                            SECTORS
                        </span>
                    </button>
                </div>
            </nav>
        </>
    );
}
