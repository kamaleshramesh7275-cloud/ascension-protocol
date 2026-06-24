import { useQuery } from "@tanstack/react-query";
import { User as BackendUser, WorkoutSession } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/hooks/use-auth";
import { motion } from "framer-motion";
import { format, subDays, eachDayOfInterval } from "date-fns";
import {
    Dumbbell,
    Brain,
    Users,
    Heart,
    Shield,
    Zap,
    Crown,
    BarChart3,
    Calendar,
    TrendingUp,
    Clock,
} from "lucide-react";
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    BarChart,
    Bar,
    CartesianGrid,
} from "recharts";

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-black/80 backdrop-blur-xl border border-white/10 rounded-xl px-4 py-3 shadow-2xl">
                <p className="text-xs text-muted-foreground mb-1">{label}</p>
                {payload.map((entry: any, i: number) => (
                    <p key={i} className="text-sm font-bold" style={{ color: entry.color }}>
                        {entry.name}: {entry.value}
                    </p>
                ))}
            </div>
        );
    }
    return null;
};

export default function StatsPage() {
    const { user: firebaseUser } = useAuth();
    const { data: user } = useQuery<BackendUser>({
        queryKey: ["/api/user"],
        enabled: !!firebaseUser,
    });

    const { data: sessions = [] } = useQuery<WorkoutSession[]>({
        queryKey: ["/api/workouts/sessions"],
        enabled: !!firebaseUser,
    });

    if (!user) return null;

    const stats = [
        { name: "Strength", value: user.strength, icon: Dumbbell, color: "text-red-500", bg: "bg-red-500", hex: "#ef4444" },
        { name: "Agility", value: user.agility, icon: Zap, color: "text-yellow-500", bg: "bg-yellow-500", hex: "#eab308" },
        { name: "Stamina", value: user.stamina, icon: Heart, color: "text-green-500", bg: "bg-green-500", hex: "#22c55e" },
        { name: "Vitality", value: user.vitality, icon: Shield, color: "text-emerald-500", bg: "bg-emerald-500", hex: "#10b981" },
        { name: "Intelligence", value: user.intelligence, icon: Brain, color: "text-blue-500", bg: "bg-blue-500", hex: "#3b82f6" },
        { name: "Willpower", value: user.willpower, icon: Crown, color: "text-purple-500", bg: "bg-purple-500", hex: "#a855f7" },
        { name: "Charisma", value: user.charisma, icon: Users, color: "text-pink-500", bg: "bg-pink-500", hex: "#ec4899" },
    ];

    // Process sessions into chart data (last 30 days)
    const last30Days = eachDayOfInterval({ start: subDays(new Date(), 29), end: new Date() });
    const volumeChartData = last30Days.map(day => {
        const dayStr = format(day, "MMM d");
        const daySessions = sessions.filter(s => {
            const sessionDate = new Date(s.startedAt);
            return format(sessionDate, "MMM d, yyyy") === format(day, "MMM d, yyyy");
        });
        const volume = daySessions.reduce((acc, s) => acc + (s.totalVolume || 0), 0);
        const setsCount = daySessions.reduce((acc, s) => acc + (s.totalSets || 0), 0);
        return { date: dayStr, Volume: volume, Sets: setsCount };
    });

    // Trim to weeks with labels visible every 5 days
    const sparseVolumeData = volumeChartData.filter((_, i) => i % 1 === 0);

    // Summary stats
    const totalWorkouts = sessions.length;
    const totalVolume = sessions.reduce((acc, s) => acc + (s.totalVolume || 0), 0);
    const totalSets = sessions.reduce((acc, s) => acc + (s.totalSets || 0), 0);
    const avgDuration = totalWorkouts > 0 ? Math.round(sessions.reduce((acc, s) => acc + (s.durationSeconds || 0), 0) / totalWorkouts / 60) : 0;

    const container = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    const item = {
        hidden: { x: -20, opacity: 0 },
        show: { x: 0, opacity: 1 }
    };

    return (
        <div className="p-4 md:p-8 min-h-screen bg-background/50 mb-24" data-tour="stats-page">
            <motion.div
                variants={container}
                initial="hidden"
                animate="show"
                className="max-w-4xl mx-auto space-y-10"
            >
                {/* Header */}
                <div className="text-center mb-8">
                    <motion.h1
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-4xl font-bold bg-gradient-to-r from-blue-500 to-cyan-500 bg-clip-text text-transparent"
                    >
                        Attribute Analysis
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className="text-muted-foreground mt-2"
                    >
                        Detailed breakdown of your current capabilities and potential.
                    </motion.p>
                </div>

                {/* ── Workout Analytics Section ── */}
                {totalWorkouts > 0 && (
                    <motion.div variants={item} className="space-y-6">
                        <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                                <BarChart3 className="h-5 w-5 text-emerald-400" />
                            </div>
                            <h2 className="text-xl font-bold text-white/90">Workout Analytics</h2>
                        </div>

                        {/* Summary cards */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {[
                                { label: "Total Workouts", value: totalWorkouts, icon: Calendar, color: "from-blue-500/20 to-blue-600/10", iconColor: "text-blue-400", border: "border-blue-500/20" },
                                { label: "All-Time Volume", value: `${totalVolume.toLocaleString()} kg`, icon: TrendingUp, color: "from-emerald-500/20 to-emerald-600/10", iconColor: "text-emerald-400", border: "border-emerald-500/20" },
                                { label: "Total Sets", value: totalSets, icon: Dumbbell, color: "from-violet-500/20 to-violet-600/10", iconColor: "text-violet-400", border: "border-violet-500/20" },
                                { label: "Avg Duration", value: `${avgDuration} min`, icon: Clock, color: "from-amber-500/20 to-amber-600/10", iconColor: "text-amber-400", border: "border-amber-500/20" },
                            ].map(stat => (
                                <motion.div key={stat.label} whileHover={{ scale: 1.03 }} transition={{ type: "spring", stiffness: 300 }}>
                                    <Card className={`bg-gradient-to-br ${stat.color} backdrop-blur-xl border ${stat.border} overflow-hidden`}>
                                        <CardContent className="p-5">
                                            <stat.icon className={`h-5 w-5 ${stat.iconColor} mb-3`} />
                                            <div className="text-2xl font-bold text-white">{stat.value}</div>
                                            <div className="text-xs text-muted-foreground mt-1">{stat.label}</div>
                                        </CardContent>
                                    </Card>
                                </motion.div>
                            ))}
                        </div>

                        {/* Volume chart */}
                        <Card className="border-white/10 bg-black/40 backdrop-blur-xl overflow-hidden">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
                                    <TrendingUp className="h-4 w-4 text-emerald-400" />
                                    Volume Lifted (kg) — Last 30 Days
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ResponsiveContainer width="100%" height={220}>
                                    <AreaChart data={sparseVolumeData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                                        <defs>
                                            <linearGradient id="volumeGradient" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                                                <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                                        <XAxis
                                            dataKey="date"
                                            tick={{ fontSize: 10, fill: "rgba(255,255,255,0.35)" }}
                                            tickLine={false}
                                            axisLine={false}
                                            interval={4}
                                        />
                                        <YAxis
                                            tick={{ fontSize: 10, fill: "rgba(255,255,255,0.35)" }}
                                            tickLine={false}
                                            axisLine={false}
                                        />
                                        <Tooltip content={<CustomTooltip />} />
                                        <Area
                                            type="monotone"
                                            dataKey="Volume"
                                            stroke="#10b981"
                                            strokeWidth={2}
                                            fill="url(#volumeGradient)"
                                            dot={false}
                                            activeDot={{ r: 5, fill: "#10b981", strokeWidth: 0 }}
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>

                        {/* Sets bar chart */}
                        <Card className="border-white/10 bg-black/40 backdrop-blur-xl overflow-hidden">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
                                    <BarChart3 className="h-4 w-4 text-violet-400" />
                                    Sets Logged — Last 30 Days
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ResponsiveContainer width="100%" height={180}>
                                    <BarChart data={sparseVolumeData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                                        <XAxis
                                            dataKey="date"
                                            tick={{ fontSize: 10, fill: "rgba(255,255,255,0.35)" }}
                                            tickLine={false}
                                            axisLine={false}
                                            interval={4}
                                        />
                                        <YAxis
                                            tick={{ fontSize: 10, fill: "rgba(255,255,255,0.35)" }}
                                            tickLine={false}
                                            axisLine={false}
                                        />
                                        <Tooltip content={<CustomTooltip />} />
                                        <Bar dataKey="Sets" fill="#a855f7" radius={[4, 4, 0, 0]} maxBarSize={24} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>
                    </motion.div>
                )}

                {/* ── Attribute Stats ── */}
                <div>
                    <div className="flex items-center gap-3 mb-6">
                        <div className="h-8 w-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                            <Zap className="h-5 w-5 text-blue-400" />
                        </div>
                        <h2 className="text-xl font-bold text-white/90">Attributes</h2>
                    </div>

                    <div className="grid gap-6">
                        {stats.map((stat, i) => (
                            <motion.div
                                key={stat.name}
                                variants={item}
                                whileHover={{ scale: 1.02 }}
                                transition={{ type: "spring", stiffness: 300 }}
                            >
                                <Card className="border-white/10 bg-black/40 backdrop-blur-xl overflow-hidden hover:border-blue-500/30 transition-colors">
                                    <div className={`h-1 w-full ${stat.bg} opacity-50`} />
                                    <CardContent className="p-6">
                                        <div className="flex items-center gap-4 mb-4">
                                            <div className={`p-3 rounded-xl ${stat.bg}/10`}>
                                                <stat.icon className={`h-6 w-6 ${stat.color}`} />
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex justify-between items-end mb-2">
                                                    <h3 className="font-bold text-lg">{stat.name}</h3>
                                                    <span className={`text-2xl font-bold ${stat.color}`}>{stat.value}</span>
                                                </div>
                                                <motion.div
                                                    initial={{ width: 0 }}
                                                    animate={{ width: "100%" }}
                                                    transition={{ duration: 1, delay: 0.5 + (i * 0.1) }}
                                                >
                                                    <Progress value={stat.value} className="h-2" indicatorClassName={stat.bg} />
                                                </motion.div>
                                            </div>
                                        </div>
                                        <p className="text-sm text-muted-foreground pl-[4.5rem]">
                                            Level {Math.floor(stat.value / 10) + 1} • {10 - (stat.value % 10)} points to next level
                                        </p>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
