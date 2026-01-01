import { RoadmapWeek, RoadmapTask } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Lock, Unlock, Trophy } from "lucide-react";
import { TaskItem } from "./TaskItem";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface WeekCardProps {
    week: RoadmapWeek & { tasks: RoadmapTask[] };
    index: number;
}

export function WeekCard({ week, index }: WeekCardProps) {
    // Calculate progress
    const completedTasks = week.tasks.filter(t => t.completed).length;
    const totalTasks = week.tasks.length;
    const progress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
    const isComplete = progress === 100;

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.1 }}
        >
            <div className={cn(
                "group relative overflow-hidden rounded-xl border transition-all duration-300",
                week.isLocked
                    ? "bg-zinc-950/50 border-zinc-900/50 grayscale opacity-80"
                    : isComplete
                        ? "bg-gradient-to-b from-green-950/20 to-black border-green-900/50"
                        : "bg-black border-zinc-800 hover:border-zinc-700"
            )}>
                {/* Progress Bar Background */}
                {!week.isLocked && (
                    <div
                        className="absolute top-0 left-0 h-1 bg-gradient-to-r from-blue-600 to-violet-600 transition-all duration-1000"
                        style={{ width: `${progress}%` }}
                    />
                )}

                {/* Header Section */}
                <div className="p-5 border-b border-zinc-900/50 bg-zinc-950/30">
                    <div className="flex justify-between items-start mb-2">
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <Badge variant="outline" className={cn(
                                    "uppercase text-[10px] tracking-wider font-bold",
                                    week.isLocked ? "bg-zinc-900 text-zinc-500" : "bg-blue-500/10 text-blue-400 border-blue-500/20"
                                )}>
                                    Week {week.weekNumber}
                                </Badge>
                                {week.isLocked ? (
                                    <Lock className="w-3 h-3 text-zinc-600" />
                                ) : (
                                    <Unlock className="w-3 h-3 text-emerald-500/50" />
                                )}
                            </div>
                            <h3 className={cn(
                                "text-xl font-bold font-heading",
                                week.isLocked ? "text-zinc-600" : "text-zinc-100"
                            )}>
                                {week.phaseName}
                            </h3>
                        </div>

                        {/* Progress Circle */}
                        <div className="relative w-10 h-10 flex items-center justify-center">
                            <svg className="w-full h-full transform -rotate-90">
                                <circle cx="20" cy="20" r="16" stroke="currentColor" strokeWidth="3" fill="transparent" className="text-zinc-900" />
                                {!week.isLocked && (
                                    <circle
                                        cx="20" cy="20" r="16"
                                        stroke="currentColor"
                                        strokeWidth="3"
                                        fill="transparent"
                                        strokeDasharray={100}
                                        strokeDashoffset={100 - progress}
                                        className="text-white transition-all duration-1000"
                                    />
                                )}
                            </svg>
                            <span className="absolute text-[9px] font-bold">{Math.round(progress)}%</span>
                        </div>
                    </div>

                    <p className="text-sm text-zinc-400 italic mb-2">"{week.goal}"</p>
                    <p className="text-xs text-zinc-500">{week.description}</p>
                </div>

                {/* Tasks List */}
                <div className="p-4 space-y-2">
                    {week.tasks
                        .sort((a, b) => a.order - b.order)
                        .map((task) => (
                            <TaskItem
                                key={task.id}
                                task={task}
                                isWeekLocked={week.isLocked}
                            />
                        ))}
                </div>

                {/* Locked Overlay */}
                {week.isLocked && (
                    <div className="absolute inset-0 bg-black/20 backdrop-blur-[1px] flex items-center justify-center">
                        {/* Minimal overlay to indicate locked state without obscuring text entirely */}
                    </div>
                )}
            </div>
        </motion.div>
    );
}
