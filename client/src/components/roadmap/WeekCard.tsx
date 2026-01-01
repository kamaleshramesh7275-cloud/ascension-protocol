import { RoadmapWeek, RoadmapTask } from "@shared/schema";
import { Badge } from "@/components/ui/badge";
import { Lock, Unlock, ChevronRight, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface WeekCardProps {
    week: RoadmapWeek & { tasks: RoadmapTask[] };
    index: number;
    onSelect: () => void;
}

export function WeekCard({ week, index, onSelect }: WeekCardProps) {
    // Calculate progress with safety check for missing tasks
    const tasks = week.tasks || [];
    const completedTasks = tasks.filter(t => t.completed).length;
    const totalTasks = tasks.length;
    const progress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
    const isComplete = progress === 100 && totalTasks > 0;

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            whileHover={!week.isLocked ? { scale: 1.02 } : {}}
            className="cursor-pointer h-full"
            onClick={() => !week.isLocked && onSelect()}
        >
            <div className={cn(
                "group relative overflow-hidden rounded-2xl border transition-all duration-500",
                "backdrop-blur-xl h-full flex flex-col",
                week.isLocked
                    ? "bg-zinc-900/20 border-zinc-900/50 grayscale"
                    : isComplete
                        ? "bg-gradient-to-br from-purple-500/10 via-black to-emerald-500/10 border-emerald-500/30"
                        : "bg-zinc-900/40 border-zinc-800 hover:border-purple-500/40 shadow-2xl shadow-purple-900/5"
            )}>
                {/* Glowing highlight on hover */}
                {!week.isLocked && (
                    <div className="absolute inset-x-0 top-0 h-[200px] bg-gradient-to-b from-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
                )}

                {/* Header Section */}
                <div className="p-6">
                    <div className="flex justify-between items-start mb-4">
                        <div className="space-y-1">
                            <div className="flex items-center gap-2">
                                <Badge variant="outline" className={cn(
                                    "uppercase text-[10px] tracking-tight font-bold border-none px-0",
                                    week.isLocked ? "text-zinc-600" : "text-purple-400"
                                )}>
                                    Phase 0{week.weekNumber}
                                </Badge>
                                <div className="h-1 w-1 rounded-full bg-zinc-800" />
                                {week.isLocked ? (
                                    <Lock className="w-3 h-3 text-zinc-600" />
                                ) : (
                                    <Unlock className="w-3 h-3 text-white/40" />
                                )}
                            </div>
                            <h3 className={cn(
                                "text-2xl font-bold font-heading leading-tight",
                                week.isLocked ? "text-zinc-600" : "text-white"
                            )}>
                                {week.phaseName}
                            </h3>
                        </div>

                        {/* Circular Progress (Glass style) */}
                        <div className="relative w-12 h-12 flex items-center justify-center">
                            <svg className="w-full h-full transform -rotate-90">
                                <circle cx="24" cy="24" r="20" stroke="currentColor" strokeWidth="2.5" fill="transparent" className="text-zinc-900/50" />
                                {!week.isLocked && (
                                    <motion.circle
                                        initial={{ strokeDashoffset: 126 }}
                                        animate={{ strokeDashoffset: 126 - (126 * progress) / 100 }}
                                        transition={{ duration: 1.5, ease: "easeOut" }}
                                        cx="24" cy="24" r="20"
                                        stroke="currentColor"
                                        strokeWidth="2.5"
                                        fill="transparent"
                                        strokeDasharray={126}
                                        className={cn(
                                            "transition-all",
                                            isComplete ? "text-emerald-500" : "text-purple-500"
                                        )}
                                    />
                                )}
                            </svg>
                            {isComplete ? (
                                <Check className="absolute w-5 h-5 text-emerald-500" />
                            ) : (
                                <span className="absolute text-[10px] font-mono font-bold text-zinc-400">{Math.round(progress)}%</span>
                            )}
                        </div>
                    </div>

                    <p className={cn(
                        "text-sm mb-4 line-clamp-2 min-h-[40px]",
                        week.isLocked ? "text-zinc-700" : "text-zinc-400"
                    )}>
                        {week.goal}
                    </p>

                    <div className="flex items-center justify-between pt-4 border-t border-zinc-800/50">
                        <div className="flex flex-col">
                            <span className="text-[10px] uppercase font-bold text-zinc-600 tracking-wider">Protocol</span>
                            <span className={cn(
                                "text-xs font-medium",
                                week.isLocked ? "text-zinc-800" : "text-zinc-300"
                            )}>
                                {completedTasks}/{totalTasks} Actions
                            </span>
                        </div>

                        {!week.isLocked && (
                            <div className="flex items-center gap-1 text-[10px] font-bold uppercase text-purple-400 group-hover:translate-x-1 transition-transform">
                                Open <ChevronRight className="w-3 h-3" />
                            </div>
                        )}
                    </div>
                </div>

                {/* Progress Bar (Bottom) */}
                {!week.isLocked && (
                    <div className="mt-auto h-1 w-full bg-zinc-900">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${progress}%` }}
                            className={cn(
                                "h-full",
                                isComplete ? "bg-emerald-500" : "bg-purple-600 shadow-[0_0_10px_rgba(147,51,234,0.5)]"
                            )}
                        />
                    </div>
                )}
            </div>
        </motion.div>
    );
}


