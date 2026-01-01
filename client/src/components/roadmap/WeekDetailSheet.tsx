import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { RoadmapWeek, RoadmapTask } from "@shared/schema";
import { TaskItem } from "./TaskItem";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Calendar, Target, CheckCircle2 } from "lucide-react";

interface WeekDetailSheetProps {
    week: RoadmapWeek & { tasks: RoadmapTask[] };
    isOpen: boolean;
    onClose: () => void;
}

export function WeekDetailSheet({ week, isOpen, onClose }: WeekDetailSheetProps) {
    const tasks = week.tasks || [];
    const completedTasks = tasks.filter(t => t.completed).length;
    const totalTasks = tasks.length;
    const progress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

    const days = [1, 2, 3, 4, 5, 6, 7];

    return (
        <Sheet open={isOpen} onOpenChange={onClose}>
            <SheetContent side="right" className="w-full sm:max-w-xl bg-zinc-950 border-zinc-900 text-white p-0">
                <div className="h-full flex flex-col">
                    <SheetHeader className="p-6 border-b border-zinc-900 bg-zinc-950/50 backdrop-blur-xl">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="p-3 rounded-2xl bg-purple-500/10 border border-purple-500/20">
                                <Calendar className="w-6 h-6 text-purple-400" />
                            </div>
                            <div>
                                <SheetTitle className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-zinc-400">
                                    Week {week.weekNumber}: {week.phaseName}
                                </SheetTitle>
                                <SheetDescription className="text-zinc-500">
                                    Complete your daily protocol to ascend.
                                </SheetDescription>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <div className="flex justify-between items-end">
                                <div className="flex items-center gap-2 text-sm text-zinc-400">
                                    <Target className="w-4 h-4" />
                                    <span>Goal: {week.goal}</span>
                                </div>
                                <span className="text-lg font-mono text-purple-400 font-bold">{Math.round(progress)}%</span>
                            </div>
                            <Progress value={progress} className="h-2 bg-zinc-900" />
                            <div className="flex items-center gap-2 text-xs text-zinc-500">
                                <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                                <span>{completedTasks} of {totalTasks} tasks completed</span>
                            </div>
                        </div>
                    </SheetHeader>

                    <ScrollArea className="flex-1 p-6">
                        <div className="space-y-8 pb-10">
                            {days.map((dayNum) => {
                                const dayTasks = tasks.filter(t => t.dayNumber === dayNum);
                                if (dayTasks.length === 0) return null;

                                const dayCompleted = dayTasks.every(t => t.completed);

                                return (
                                    <div key={dayNum} className="space-y-4">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm border transition-colors ${dayCompleted
                                                    ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-400"
                                                    : "bg-zinc-900 border-zinc-800 text-zinc-500"
                                                }`}>
                                                {dayNum}
                                            </div>
                                            <h3 className="text-lg font-semibold text-zinc-200">Day {dayNum} Protocol</h3>
                                            <div className="h-px flex-1 bg-zinc-900" />
                                        </div>

                                        <div className="grid gap-3">
                                            {dayTasks
                                                .sort((a, b) => (a.order || 0) - (b.order || 0))
                                                .map((task) => (
                                                    <TaskItem
                                                        key={task.id}
                                                        task={task}
                                                        isWeekLocked={week.isLocked}
                                                    />
                                                ))}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </ScrollArea>
                </div>
            </SheetContent>
        </Sheet>
    );
}
