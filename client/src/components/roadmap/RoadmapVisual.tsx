import { motion } from "framer-motion";
import { Roadmap, RoadmapWeek } from "@shared/schema";
import { cn } from "@/lib/utils";
import { Check, Lock, Star, Trophy } from "lucide-react";

interface RoadmapVisualProps {
    currentWeek: number;
    weeks: RoadmapWeek[];
}

export function RoadmapVisual({ currentWeek, weeks }: RoadmapVisualProps) {
    // SVG path definition for a winding road
    // This is a simplified bezier curve path that winds from bottom to top right
    const pathd = "M 50 400 C 50 300, 200 300, 200 200 C 200 100, 400 100, 600 50";

    return (
        <div className="relative w-full h-[400px] bg-black/40 rounded-xl overflow-hidden border border-border/50 backdrop-blur-sm mb-8">
            {/* Background Gradients */}
            <div className="absolute inset-0 bg-gradient-to-tr from-black via-zinc-900/50 to-amber-900/20" />
            <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl" />

            {/* Title */}
            <div className="absolute top-6 left-6 z-10">
                <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-zinc-400">
                    ASCENSION PATH
                </h2>
                <p className="text-muted-foreground text-sm max-w-md mt-2">
                    Your 30-day journey to peak performance. Follow the path, complete the phases, and ascend.
                </p>
            </div>

            {/* SVG Path */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="relative w-full max-w-4xl h-full">
                    <svg
                        className="w-full h-full visible md:visible"
                        viewBox="0 0 800 450"
                        fill="none"
                        preserveAspectRatio="xMidYMid meet"
                    >
                        {/* Path Glow */}
                        <path
                            d="M 100 400 C 250 400, 250 300, 400 300 C 550 300, 550 200, 700 100"
                            stroke="url(#pathGradient)"
                            strokeWidth="24"
                            strokeLinecap="round"
                            className="opacity-20 blur-lg"
                        />

                        {/* Main Path */}
                        <path
                            d="M 100 400 C 250 400, 250 300, 400 300 C 550 300, 550 200, 700 100"
                            stroke="url(#pathGradient)"
                            strokeWidth="8"
                            strokeLinecap="round"
                            strokeDasharray="12 12"
                        />

                        <defs>
                            <linearGradient id="pathGradient" x1="0%" y1="100%" x2="100%" y2="0%">
                                <stop offset="0%" stopColor="#3b82f6" />
                                <stop offset="50%" stopColor="#8b5cf6" />
                                <stop offset="100%" stopColor="#f59e0b" />
                            </linearGradient>
                        </defs>

                        {/* Phase Markers */}
                        {/* Week 1: Start */}
                        <g transform="translate(100, 400)">
                            <circle r="6" fill="#3b82f6" className="animate-pulse" />
                            <circle r="12" stroke="#3b82f6" strokeWidth="2" opacity="0.5" />
                        </g>

                        {/* Week 2 */}
                        <g transform="translate(280, 360)">
                            <circle r="4" fill={currentWeek >= 2 ? "#8b5cf6" : "#3f3f46"} />
                        </g>

                        {/* Week 3 */}
                        <g transform="translate(400, 300)">
                            <circle r="4" fill={currentWeek >= 3 ? "#a855f7" : "#3f3f46"} />
                        </g>

                        {/* Week 4 */}
                        <g transform="translate(550, 200)">
                            <circle r="4" fill={currentWeek >= 4 ? "#d946ef" : "#3f3f46"} />
                        </g>

                        {/* Target */}
                        <g transform="translate(700, 100)">
                            <circle r="20" fill="#f59e0b" className="animate-ping opacity-20" />
                            <circle r="10" fill="#f59e0b" />
                            <Star className="text-black transform -translate-x-3 -translate-y-3 w-6 h-6" fill="black" />
                        </g>
                    </svg>

                    {/* Labels placed absolutely based on approximate curve positions */}
                    <div className="absolute bottom-10 left-[10%] max-w-[150px]">
                        <div className={cn(
                            "p-3 rounded-lg border backdrop-blur-md transition-all",
                            currentWeek >= 1 ? "bg-blue-500/10 border-blue-500/50 text-blue-200" : "bg-black/40 border-zinc-800 text-zinc-500"
                        )}>
                            <h3 className="font-bold text-sm">Phase 1: Stability</h3>
                            <p className="text-xs opacity-80 mt-1">Foundation & Routine</p>
                        </div>
                    </div>

                    <div className="absolute bottom-24 left-[35%] max-w-[150px]">
                        <div className={cn(
                            "p-3 rounded-lg border backdrop-blur-md transition-all",
                            currentWeek >= 2 ? "bg-violet-500/10 border-violet-500/50 text-violet-200" : "bg-black/40 border-zinc-800 text-zinc-500"
                        )}>
                            <h3 className="font-bold text-sm">Phase 2: Pressure</h3>
                            <p className="text-xs opacity-80 mt-1">Intensity Increase</p>
                        </div>
                    </div>

                    <div className="absolute top-1/2 left-[55%] max-w-[150px]">
                        <div className={cn(
                            "p-3 rounded-lg border backdrop-blur-md transition-all",
                            currentWeek >= 3 ? "bg-purple-500/10 border-purple-500/50 text-purple-200" : "bg-black/40 border-zinc-800 text-zinc-500"
                        )}>
                            <h3 className="font-bold text-sm">Phase 3: Dominance</h3>
                            <p className="text-xs opacity-80 mt-1">Peak Performance</p>
                        </div>
                    </div>

                    <div className="absolute top-[15%] right-[15%] max-w-[150px]">
                        <div className={cn(
                            "p-3 rounded-lg border backdrop-blur-md transition-all",
                            currentWeek >= 4 ? "bg-amber-500/10 border-amber-500/50 text-amber-200" : "bg-black/40 border-zinc-800 text-zinc-500"
                        )}>
                            <h3 className="font-bold text-sm">Ascension</h3>
                            <p className="text-xs opacity-80 mt-1">Level Up</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
