import { useQuery } from "@tanstack/react-query";
import { User as BackendUser } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/hooks/use-auth";
import { motion } from "framer-motion";
import {
    Dumbbell,
    Brain,
    Users,
    Heart,
    Shield,
    Zap,
    Crown
} from "lucide-react";

export default function StatsPage() {
    const { user: firebaseUser } = useAuth();
    const { data: user } = useQuery<BackendUser>({
        queryKey: ["/api/user"],
        enabled: !!firebaseUser,
    });

    if (!user) return null;

    const stats = [
        { name: "Strength", value: user.strength, icon: Dumbbell, color: "text-red-500", bg: "bg-red-500" },
        { name: "Agility", value: user.agility, icon: Zap, color: "text-yellow-500", bg: "bg-yellow-500" },
        { name: "Stamina", value: user.stamina, icon: Heart, color: "text-green-500", bg: "bg-green-500" },
        { name: "Vitality", value: user.vitality, icon: Shield, color: "text-emerald-500", bg: "bg-emerald-500" },
        { name: "Intelligence", value: user.intelligence, icon: Brain, color: "text-blue-500", bg: "bg-blue-500" },
        { name: "Willpower", value: user.willpower, icon: Crown, color: "text-purple-500", bg: "bg-purple-500" },
        { name: "Charisma", value: user.charisma, icon: Users, color: "text-pink-500", bg: "bg-pink-500" },
    ];

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
        <div className="p-8 min-h-screen bg-background/50">
            <motion.div
                variants={container}
                initial="hidden"
                animate="show"
                className="max-w-4xl mx-auto space-y-8"
            >
                <div className="text-center mb-12">
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
            </motion.div>
        </div>
    );
}
