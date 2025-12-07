import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, Flame, Trophy } from "lucide-react";
import { motion } from "framer-motion";

interface Habit {
    id: string;
    name: string;
    icon: string;
    currentStreak: number;
    longestStreak: number;
    totalCompletions: number;
    completedToday: boolean;
}

// Mock data - will be replaced with real data from backend
const MOCK_HABITS: Habit[] = [
    {
        id: "hydration",
        name: "Hydration Master",
        icon: "💧",
        currentStreak: 0,
        longestStreak: 0,
        totalCompletions: 0,
        completedToday: false,
    },
    {
        id: "morning_routine",
        name: "Morning Warrior",
        icon: "⏰",
        currentStreak: 0,
        longestStreak: 0,
        totalCompletions: 0,
        completedToday: false,
    },
    {
        id: "reading",
        name: "Knowledge Seeker",
        icon: "📚",
        currentStreak: 0,
        longestStreak: 0,
        totalCompletions: 0,
        completedToday: false,
    },
];

export function HabitTracker() {
    const habits = MOCK_HABITS;

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold">Habit Tracker</h2>
                    <p className="text-sm text-muted-foreground">Build consistency, earn streak bonuses</p>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
                {habits.map((habit, index) => (
                    <motion.div
                        key={habit.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                    >
                        <Card className="relative overflow-hidden border-zinc-800 bg-zinc-900/50 hover:bg-zinc-900/70 transition-colors">
                            {habit.completedToday && (
                                <div className="absolute top-2 right-2">
                                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                                </div>
                            )}

                            <CardHeader className="pb-3">
                                <div className="flex items-center gap-3">
                                    <div className="text-3xl">{habit.icon}</div>
                                    <div className="flex-1">
                                        <CardTitle className="text-base">{habit.name}</CardTitle>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            {habit.completedToday ? "Completed today!" : "Not completed today"}
                                        </p>
                                    </div>
                                </div>
                            </CardHeader>

                            <CardContent className="space-y-4">
                                {/* Current Streak */}
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Flame className="w-4 h-4 text-orange-500" />
                                        <span className="text-sm text-muted-foreground">Current Streak</span>
                                    </div>
                                    <span className="text-lg font-bold text-orange-400">{habit.currentStreak} days</span>
                                </div>

                                {/* Progress to next milestone */}
                                <div className="space-y-2">
                                    <div className="flex justify-between text-xs text-muted-foreground">
                                        <span>Progress to 7-day streak</span>
                                        <span>{habit.currentStreak}/7</span>
                                    </div>
                                    <Progress value={(habit.currentStreak / 7) * 100} className="h-2" />
                                </div>

                                {/* Stats Grid */}
                                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-zinc-800">
                                    <div className="text-center">
                                        <div className="flex items-center justify-center gap-1 mb-1">
                                            <Trophy className="w-3 h-3 text-yellow-500" />
                                            <span className="text-xs text-muted-foreground">Best</span>
                                        </div>
                                        <p className="text-sm font-semibold">{habit.longestStreak} days</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-xs text-muted-foreground mb-1">Total</p>
                                        <p className="text-sm font-semibold">{habit.totalCompletions}x</p>
                                    </div>
                                </div>

                                {/* Action Button */}
                                <button
                                    disabled={habit.completedToday}
                                    className={`w-full py-2 rounded-lg text-sm font-medium transition-colors ${habit.completedToday
                                            ? "bg-green-500/20 text-green-400 cursor-not-allowed"
                                            : "bg-purple-600 hover:bg-purple-700 text-white"
                                        }`}
                                >
                                    {habit.completedToday ? "✓ Completed" : "Mark Complete"}
                                </button>
                            </CardContent>
                        </Card>
                    </motion.div>
                ))}
            </div>

            {/* Habit Insights */}
            <Card className="border-zinc-800 bg-zinc-900/30">
                <CardHeader>
                    <CardTitle className="text-lg">Habit Insights</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-4 md:grid-cols-3">
                        <div className="text-center p-4 rounded-lg bg-zinc-900/50">
                            <p className="text-2xl font-bold text-purple-400">0%</p>
                            <p className="text-xs text-muted-foreground mt-1">Completion Rate (7 days)</p>
                        </div>
                        <div className="text-center p-4 rounded-lg bg-zinc-900/50">
                            <p className="text-2xl font-bold text-orange-400">0</p>
                            <p className="text-xs text-muted-foreground mt-1">Total Active Streaks</p>
                        </div>
                        <div className="text-center p-4 rounded-lg bg-zinc-900/50">
                            <p className="text-2xl font-bold text-green-400">0 XP</p>
                            <p className="text-xs text-muted-foreground mt-1">Earned from Habits</p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
