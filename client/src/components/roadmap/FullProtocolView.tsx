import { motion, AnimatePresence } from "framer-motion";
import { RoadmapWeek, RoadmapTask } from "@shared/schema";
import { TaskItem } from "./TaskItem";
import {
    X,
    Calendar,
    Target,
    Zap,
    CheckCircle2,
    ChevronLeft,
    ChevronRight,
    Trophy,
    Flame,
    Activity,
    Brain,
    Rocket
} from "lucide-react";
import { useState } from "react";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface FullProtocolViewProps {
    week: RoadmapWeek & { tasks: RoadmapTask[] };
    onClose: () => void;
}

export function FullProtocolView({ week, onClose }: FullProtocolViewProps) {
    const [selectedDay, setSelectedDay] = useState(1);

    const tasks = week.tasks || [];
    const completedTasks = tasks.filter(t => t.completed).length;
    const totalTasks = tasks.length;
    const progress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

    const days = [1, 2, 3, 4, 5, 6, 7];
    const currentDayTasks = tasks.filter(t => t.dayNumber === selectedDay);

    const dayCompleted = currentDayTasks.length > 0 && currentDayTasks.every(t => t.completed);

    // Get focus for the day based on task text or just general phase goals
    const dayFocus = week.goal;

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black text-white flex flex-col md:flex-row h-screen w-screen overflow-hidden"
        >
            {/* Ambient Background */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,_#1e1b4b_0%,_transparent_50%)] opacity-30 pointer-events-none" />
            <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-purple-900/10 to-transparent pointer-events-none" />

            {/* Left Sidebar Content (Week Info) */}
            <div className="w-full md:w-[400px] border-r border-zinc-900 bg-zinc-950/50 backdrop-blur-2xl p-8 flex flex-col relative z-10 shrink-0">
                <button
                    onClick={onClose}
                    className="absolute top-4 left-4 p-2 rounded-full hover:bg-zinc-900 transition-colors md:hidden"
                >
                    <X className="w-6 h-6" />
                </button>

                <div className="mt-8 md:mt-0 space-y-8 flex-1">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <Zap className="w-4 h-4 text-purple-400 fill-purple-400/20" />
                            <span className="text-xs font-bold uppercase tracking-[0.3em] text-purple-400">Biological Protocol</span>
                        </div>
                        <h2 className="text-4xl font-bold font-heading tracking-tight leading-tight">
                            Week {week.weekNumber}: <br />
                            <span className="bg-clip-text text-transparent bg-gradient-to-r from-white to-zinc-500">
                                {week.phaseName}
                            </span>
                        </h2>
                    </div>

                    <div className="space-y-4 p-4 rounded-2xl bg-zinc-900/30 border border-zinc-800/50">
                        <div className="flex justify-between items-end">
                            <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Overall Progress</span>
                            <span className="text-2xl font-mono font-bold text-white">{Math.round(progress)}%</span>
                        </div>
                        <Progress value={progress} className="h-2 bg-zinc-950 shadow-inner" />
                        <div className="flex items-center gap-2 text-sm text-zinc-400">
                            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                            <span>{completedTasks} of {totalTasks} actions verified</span>
                        </div>
                    </div>

                    {week.description && (
                        <div className="space-y-4">
                            <h3 className="text-[10px] font-bold uppercase tracking-widest text-zinc-600 font-mono">Mission Dossier</h3>
                            <div className="p-4 rounded-xl bg-purple-500/5 border border-purple-500/10 backdrop-blur-sm">
                                <p className="text-sm text-zinc-400 leading-relaxed italic">
                                    "{week.description}"
                                </p>
                            </div>
                        </div>
                    )}

                    <div className="space-y-4">
                        <h3 className="text-[10px] font-bold uppercase tracking-widest text-zinc-600">Core Objectives</h3>
                        <div className="space-y-2">
                            <div className="flex items-start gap-3 p-3 rounded-xl bg-white/5 border border-white/5">
                                <Target className="w-4 h-4 text-white/40 mt-0.5" />
                                <p className="text-sm text-zinc-300 leading-relaxed">{week.goal}</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="hidden md:block">
                    <button
                        onClick={onClose}
                        className="group w-full py-4 rounded-xl bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 transition-all text-sm font-bold tracking-widest flex items-center justify-center gap-2 overflow-hidden relative"
                    >
                        <div className="absolute inset-0 bg-gradient-to-r from-purple-600/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                        <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> RETURN TO ROADMAP
                    </button>
                </div>
            </div>

            {/* Main Content (Daily Protocol) */}
            <div className="flex-1 flex flex-col relative z-10 w-full overflow-hidden">
                {/* Header (Desktop) */}
                <div className="hidden md:flex items-center justify-between p-8 border-b border-zinc-900 bg-black/20 backdrop-blur-md">
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-2xl bg-purple-500/10 border border-purple-500/20">
                            <Calendar className="w-6 h-6 text-purple-400" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold font-heading">Day {selectedDay} Protocol</h3>
                            <p className="text-zinc-500 text-sm">Synchronize your biological rhythms and execute.</p>
                        </div>
                    </div>
                    {dayCompleted && (
                        <motion.div
                            initial={{ scale: 0.8, opacity: 0, x: 20 }}
                            animate={{ scale: 1, opacity: 1, x: 0 }}
                            className="flex items-center gap-3 px-6 py-3 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 font-bold text-sm shadow-[0_0_20px_rgba(16,185,129,0.1)]"
                        >
                            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            <Trophy className="w-4 h-4" /> DAY COMPLETE
                        </motion.div>
                    )}
                </div>

                {/* Day Selector Ribbon */}
                <div className="flex bg-zinc-950 border-b border-zinc-900 shrink-0 overflow-x-auto no-scrollbar">
                    {days.map((d) => {
                        const dayTasks = tasks.filter(t => t.dayNumber === d);
                        const isDayDone = dayTasks.length > 0 && dayTasks.every(t => t.completed);

                        return (
                            <button
                                key={d}
                                onClick={() => setSelectedDay(d)}
                                className={cn(
                                    "flex-1 min-w-[100px] py-4 px-2 text-center transition-all relative border-r border-zinc-900/50",
                                    selectedDay === d ? "bg-white/5" : "hover:bg-white/2"
                                )}
                            >
                                <span className={cn(
                                    "text-[10px] font-bold uppercase tracking-widest transition-colors block",
                                    selectedDay === d ? "text-purple-400" : "text-zinc-600"
                                )}>Day</span>
                                <span className={cn(
                                    "text-lg font-bold font-mono transition-colors block",
                                    selectedDay === d ? "text-white" : "text-zinc-500"
                                )}>{d}</span>
                                {selectedDay === d && (
                                    <motion.div
                                        layoutId="activeDay"
                                        className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-500 shadow-[0_0_10px_#8b5cf6]"
                                    />
                                )}
                                {isDayDone && (
                                    <div className="absolute top-2 right-2 flex items-center justify-center">
                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_5px_#10b981]" />
                                    </div>
                                )}
                            </button>
                        );
                    })}
                </div>

                {/* Tasks Area */}
                <ScrollArea className="flex-1">
                    <div className="p-6 md:p-10 max-w-4xl mx-auto space-y-12 pb-32">
                        {/* Daily Focus Card */}
                        <motion.div
                            key={`focus-${selectedDay}`}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="relative group"
                        >
                            <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-blue-600 rounded-3xl blur opacity-20 group-hover:opacity-30 transition duration-1000"></div>
                            <div className="relative p-8 rounded-3xl bg-zinc-900 border border-zinc-800/50 flex flex-col md:flex-row gap-6 items-center">
                                <div className="p-4 rounded-2xl bg-purple-500/10 border border-purple-500/20 shrink-0">
                                    <Rocket className="w-8 h-8 text-purple-400" />
                                </div>
                                <div className="flex-1 text-center md:text-left">
                                    <h4 className="text-[10px] font-bold text-purple-400 uppercase tracking-[0.3em] mb-1">Focus Mode Activated</h4>
                                    <p className="text-xl font-bold text-white leading-tight mb-2">Primary Objective for Day {selectedDay}</p>
                                    <p className="text-zinc-400 text-sm leading-relaxed">{dayFocus}</p>
                                </div>
                                <div className="flex md:flex-col gap-2 shrink-0">
                                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-black/50 border border-zinc-800">
                                        <Flame className="w-3.5 h-3.5 text-orange-400" />
                                        <span className="text-[10px] font-bold text-zinc-300">Intensive</span>
                                    </div>
                                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-black/50 border border-zinc-800">
                                        <Activity className="w-3.5 h-3.5 text-blue-400" />
                                        <span className="text-[10px] font-bold text-zinc-300">Active</span>
                                    </div>
                                </div>
                            </div>
                        </motion.div>

                        {/* Task Sections */}
                        <div className="space-y-10">
                            <div>
                                <div className="flex items-center justify-between mb-6">
                                    <div className="flex items-center gap-4">
                                        <div className="p-2 rounded-lg bg-blue-500/10">
                                            <Brain className="w-5 h-5 text-blue-400" />
                                        </div>
                                        <h5 className="text-lg font-bold font-heading">Protocol Execution</h5>
                                    </div>
                                    <div className="text-[10px] font-mono font-bold text-zinc-600 uppercase tracking-[0.2em]">
                                        {currentDayTasks.filter(t => t.completed).length}/{currentDayTasks.length} Verified
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <AnimatePresence mode="popLayout">
                                        {currentDayTasks
                                            .sort((a, b) => (a.isBoss === b.isBoss ? 0 : a.isBoss ? -1 : 1))
                                            .map((task) => (
                                                <div key={task.id} className={cn(
                                                    "transition-all duration-300",
                                                    task.isBoss && "md:col-span-2 group/boss"
                                                )}>
                                                    {task.isBoss && (
                                                        <div className="flex items-center gap-2 mb-2 px-2">
                                                            <Flame className="w-3 h-3 text-red-500 animate-pulse" />
                                                            <span className="text-[8px] font-bold text-red-500 uppercase tracking-[0.3em]">Critical Action</span>
                                                        </div>
                                                    )}
                                                    <TaskItem
                                                        task={task}
                                                        isWeekLocked={week.isLocked}
                                                    />
                                                </div>
                                            ))}
                                    </AnimatePresence>
                                    {currentDayTasks.length === 0 && (
                                        <div className="col-span-full py-12 text-center rounded-2xl border-2 border-dashed border-zinc-900">
                                            <p className="text-zinc-600 font-mono text-xs uppercase tracking-widest">No protocol assigned for this day</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Navigation Footer Controls (Mobile) */}
                        <div className="flex md:hidden gap-4 pt-10 border-t border-zinc-900 mt-10">
                            <button
                                onClick={onClose}
                                className="flex-1 py-4 rounded-xl bg-zinc-900 border border-zinc-800 text-sm font-bold flex items-center justify-center gap-2"
                            >
                                <ChevronLeft className="w-4 h-4" /> BACK
                            </button>
                        </div>
                    </div>
                </ScrollArea>
            </div>
        </motion.div>
    );
}
