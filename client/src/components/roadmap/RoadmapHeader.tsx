import { motion } from "framer-motion";
import { Shield, Activity, Zap } from "lucide-react";

interface RoadmapHeaderProps {
    currentWeek: number;
}

export function RoadmapHeader({ currentWeek }: RoadmapHeaderProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative"
        >
            {/* Mainframe Border Accents */}
            <div className="absolute -top-2 -left-2 w-8 h-8 border-t-2 border-l-2 border-primary/50" />
            <div className="absolute -top-2 -right-2 w-8 h-8 border-t-2 border-r-2 border-primary/50" />
            <div className="absolute -bottom-2 -left-2 w-8 h-8 border-b-2 border-l-2 border-primary/50" />
            <div className="absolute -bottom-2 -right-2 w-8 h-8 border-b-2 border-r-2 border-primary/50" />

            <div className="relative bg-card/30 backdrop-blur-xl border border-border/50 rounded-2xl p-8">
                <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
                    {/* Title Section */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2">
                            <div className="h-1 w-12 bg-primary rounded-full" />
                            <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-primary font-mono">
                                BIOLOGICAL OPTIMIZATION PROTOCOL
                            </span>
                        </div>
                        <h1 className="text-5xl md:text-7xl font-bold font-heading tracking-tighter leading-none">
                            Command{" "}
                            <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary via-accent to-secondary">
                                Center
                            </span>
                        </h1>
                        <p className="text-muted-foreground max-w-2xl text-sm leading-relaxed font-mono">
                            &gt; SYSTEM_STATUS: ACTIVE | Systematic reconstruction of daily performance via consistent execution of identified critical actions.
                        </p>
                    </div>

                    {/* HUD Metrics */}
                    <div className="grid grid-cols-3 gap-4">
                        {/* Current Phase */}
                        <div className="relative group">
                            <div className="absolute inset-0 bg-primary/10 blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                            <div className="relative bg-card/50 backdrop-blur-xl rounded-xl border border-border/50 p-4 text-center">
                                <div className="flex items-center justify-center gap-2 mb-2">
                                    <Shield className="w-4 h-4 text-primary" />
                                    <p className="text-[9px] uppercase font-bold text-muted-foreground tracking-wider font-mono">
                                        PHASE
                                    </p>
                                </div>
                                <p className="text-2xl font-bold text-foreground font-mono">0{currentWeek}</p>
                            </div>
                        </div>

                        {/* System Integrity */}
                        <div className="relative group">
                            <div className="absolute inset-0 bg-accent/10 blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                            <div className="relative bg-card/50 backdrop-blur-xl rounded-xl border border-border/50 p-4 text-center">
                                <div className="flex items-center justify-center gap-2 mb-2">
                                    <Activity className="w-4 h-4 text-accent" />
                                    <p className="text-[9px] uppercase font-bold text-muted-foreground tracking-wider font-mono">
                                        INTEGRITY
                                    </p>
                                </div>
                                <p className="text-2xl font-bold text-accent font-mono">98%</p>
                            </div>
                        </div>

                        {/* Status */}
                        <div className="relative group">
                            <div className="absolute inset-0 bg-secondary/10 blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                            <div className="relative bg-card/50 backdrop-blur-xl rounded-xl border border-border/50 p-4 text-center">
                                <div className="flex items-center justify-center gap-2 mb-2">
                                    <Zap className="w-4 h-4 text-secondary" />
                                    <p className="text-[9px] uppercase font-bold text-muted-foreground tracking-wider font-mono">
                                        STATUS
                                    </p>
                                </div>
                                <div className="flex items-center justify-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                                    <p className="text-xs font-bold text-green-500 font-mono">ONLINE</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Terminal Status Line */}
                <div className="mt-6 pt-4 border-t border-border/30">
                    <p className="text-[10px] font-mono text-muted-foreground">
                        <span className="text-primary">$</span> Scanning user data...{" "}
                        <span className="text-green-500">OK</span> | Syncing protocol...{" "}
                        <span className="text-green-500">OK</span> | Initializing roadmap...{" "}
                        <span className="text-green-500">COMPLETE</span>
                    </p>
                </div>
            </div>
        </motion.div>
    );
}
