import { motion } from "framer-motion";
import { Roadmap, RoadmapWeek } from "@shared/schema";
import { cn } from "@/lib/utils";
import { Check, Lock, Star, Trophy, Zap, Database, Cpu, HardDrive } from "lucide-react";

interface RoadmapVisualProps {
    currentWeek: number;
    weeks: RoadmapWeek[];
}

export function RoadmapVisual({ currentWeek, weeks }: RoadmapVisualProps) {
    return (
        <div className="relative w-full h-[450px] bg-black/60 rounded-2xl overflow-hidden border border-primary/20 backdrop-blur-sm">
            {/* Circuit Board Background */}
            <div className="absolute inset-0 opacity-5">
                <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
                    <defs>
                        <pattern id="circuit" x="0" y="0" width="100" height="100" patternUnits="userSpaceOnUse">
                            <circle cx="50" cy="50" r="2" fill="currentColor" className="text-primary" />
                            <path d="M50 0 L50 50 M0 50 L50 50" stroke="currentColor" strokeWidth="0.5" className="text-primary" />
                        </pattern>
                    </defs>
                    <rect width="100%" height="100%" fill="url(#circuit)" />
                </svg>
            </div>

            {/* Gradient Overlays */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-accent/10" />
            <div className="absolute top-0 right-0 w-96 h-96 bg-primary/20 rounded-full blur-[100px]" />

            {/* Title Section */}
            <div className="absolute top-6 left-6 z-10">
                <div className="flex items-center gap-3 mb-2">
                    <Cpu className="w-6 h-6 text-primary" />
                    <h2 className="text-3xl font-bold font-mono bg-clip-text text-transparent bg-gradient-to-r from-primary via-accent to-primary">
                        DATA_STREAM
                    </h2>
                </div>
                <p className="text-muted-foreground text-xs max-w-md font-mono">
                    &gt; Neural pathway visualization | 4-phase progression system
                </p>
            </div>

            {/* Circuit Path Visualization */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="relative w-full max-w-5xl h-full px-8">
                    <svg
                        className="w-full h-full"
                        viewBox="0 0 1000 450"
                        fill="none"
                        preserveAspectRatio="xMidYMid meet"
                    >
                        {/* Glow Effect */}
                        <defs>
                            <filter id="glow">
                                <feGaussianBlur stdDeviation="4" result="coloredBlur" />
                                <feMerge>
                                    <feMergeNode in="coloredBlur" />
                                    <feMergeNode in="SourceGraphic" />
                                </feMerge>
                            </filter>
                            <linearGradient id="dataGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.3" />
                                <stop offset="50%" stopColor="hsl(var(--accent))" stopOpacity="0.8" />
                                <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="1" />
                            </linearGradient>
                        </defs>

                        {/* Circuit Path - Angular, Tech-like */}
                        <path
                            d="M 100 350 L 250 350 L 250 250 L 450 250 L 450 200 L 650 200 L 650 150 L 900 150"
                            stroke="url(#dataGradient)"
                            strokeWidth="3"
                            strokeLinecap="square"
                            fill="none"
                            filter="url(#glow)"
                        />

                        {/* Data Flow Animation */}
                        <path
                            d="M 100 350 L 250 350 L 250 250 L 450 250 L 450 200 L 650 200 L 650 150 L 900 150"
                            stroke="hsl(var(--primary))"
                            strokeWidth="2"
                            strokeLinecap="square"
                            fill="none"
                            strokeDasharray="20 20"
                            opacity="0.6"
                        >
                            <animate
                                attributeName="stroke-dashoffset"
                                from="40"
                                to="0"
                                dur="2s"
                                repeatCount="indefinite"
                            />
                        </path>

                        {/* Phase Nodes */}
                        {/* Phase 1 - Start */}
                        <g transform="translate(100, 350)">
                            <circle r="20" fill="hsl(var(--primary))" opacity="0.2" className="animate-pulse" />
                            <circle r="10" fill="hsl(var(--primary))" stroke="hsl(var(--primary))" strokeWidth="2" />
                            <circle r="4" fill="hsl(var(--background))" />
                        </g>

                        {/* Phase 2 */}
                        <g transform="translate(450, 250)">
                            <circle r="15" fill={currentWeek >= 2 ? "hsl(var(--accent))" : "hsl(var(--muted))"} opacity="0.2" />
                            <circle r="8" fill={currentWeek >= 2 ? "hsl(var(--accent))" : "hsl(var(--muted))"} stroke={currentWeek >= 2 ? "hsl(var(--accent))" : "hsl(var(--muted))"} strokeWidth="2" />
                            {currentWeek >= 2 && <circle r="3" fill="hsl(var(--background))" />}
                        </g>

                        {/* Phase 3 */}
                        <g transform="translate(650, 200)">
                            <circle r="15" fill={currentWeek >= 3 ? "hsl(var(--secondary))" : "hsl(var(--muted))"} opacity="0.2" />
                            <circle r="8" fill={currentWeek >= 3 ? "hsl(var(--secondary))" : "hsl(var(--muted))"} stroke={currentWeek >= 3 ? "hsl(var(--secondary))" : "hsl(var(--muted))"} strokeWidth="2" />
                            {currentWeek >= 3 && <circle r="3" fill="hsl(var(--background))" />}
                        </g>

                        {/* Phase 4 - Target */}
                        <g transform="translate(900, 150)">
                            <circle r="30" fill="hsl(var(--primary))" opacity="0.1" className="animate-ping" />
                            <circle r="15" fill={currentWeek >= 4 ? "hsl(var(--primary))" : "hsl(var(--muted))"} opacity="0.3" />
                            <circle r="12" fill={currentWeek >= 4 ? "hsl(var(--primary))" : "hsl(var(--muted))"} stroke={currentWeek >= 4 ? "hsl(var(--primary))" : "hsl(var(--muted))"} strokeWidth="2" />
                            <Star className="w-6 h-6 transform -translate-x-3 -translate-y-3" fill={currentWeek >= 4 ? "hsl(var(--background))" : "hsl(var(--muted-foreground))"} stroke="none" />
                        </g>
                    </svg>

                    {/* Phase Labels */}
                    <div className="absolute bottom-12 left-[8%]">
                        <div className={cn(
                            "relative p-4 rounded-xl border backdrop-blur-xl transition-all",
                            currentWeek >= 1 ? "bg-primary/10 border-primary/50" : "bg-card/20 border-border/30"
                        )}>
                            <div className="flex items-center gap-2 mb-1">
                                <Database className="w-4 h-4" />
                                <h3 className="font-bold text-sm font-mono">PHASE_01</h3>
                            </div>
                            <p className="text-[10px] opacity-70 font-mono">Foundation Protocol</p>
                        </div>
                    </div>

                    <div className="absolute top-1/2 left-[38%] -translate-y-1/2">
                        <div className={cn(
                            "relative p-4 rounded-xl border backdrop-blur-xl transition-all",
                            currentWeek >= 2 ? "bg-accent/10 border-accent/50" : "bg-card/20 border-border/30"
                        )}>
                            <div className="flex items-center gap-2 mb-1">
                                <Zap className="w-4 h-4" />
                                <h3 className="font-bold text-sm font-mono">PHASE_02</h3>
                            </div>
                            <p className="text-[10px] opacity-70 font-mono">Intensity Surge</p>
                        </div>
                    </div>

                    <div className="absolute top-[35%] left-[58%]">
                        <div className={cn(
                            "relative p-4 rounded-xl border backdrop-blur-xl transition-all",
                            currentWeek >= 3 ? "bg-secondary/10 border-secondary/50" : "bg-card/20 border-border/30"
                        )}>
                            <div className="flex items-center gap-2 mb-1">
                                <Cpu className="w-4 h-4" />
                                <h3 className="font-bold text-sm font-mono">PHASE_03</h3>
                            </div>
                            <p className="text-[10px] opacity-70 font-mono">Peak Performance</p>
                        </div>
                    </div>

                    <div className="absolute top-[20%] right-[8%]">
                        <div className={cn(
                            "relative p-4 rounded-xl border backdrop-blur-xl transition-all",
                            currentWeek >= 4 ? "bg-primary/10 border-primary/50" : "bg-card/20 border-border/30"
                        )}>
                            <div className="flex items-center gap-2 mb-1">
                                <Trophy className="w-4 h-4" />
                                <h3 className="font-bold text-sm font-mono">ASCENSION</h3>
                            </div>
                            <p className="text-[10px] opacity-70 font-mono">Protocol Complete</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
