import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Quest, QuestType } from "@shared/schema";
import { QuestCard } from "@/components/quest-card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Target, Trophy, Calendar, Sparkles, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/ui/card";
import { HabitTracker } from "@/components/habit-tracker";

import { useAnimations } from "@/context/animation-context";

export default function QuestsPage() {
    const [activeTab, setActiveTab] = useState<"all" | QuestType | "habits">("all");
    const { toast } = useToast();
    const { showQuestCompleted } = useAnimations();

    const { data: quests, isLoading } = useQuery<Quest[]>({
        queryKey: ["/api/quests"],
    });

    const completeMutation = useMutation({
        mutationFn: async (questId: string) => {
            return apiRequest("POST", `/api/quests/${questId}/complete`, {});
        },
        onSuccess: (data, questId) => {
            const quest = quests?.find(q => q.id === questId);
            if (quest) {
                showQuestCompleted(quest.title, quest.rewardXP, quest.rewardCoins);
            }

            queryClient.invalidateQueries({ queryKey: ["/api/quests"] });
            queryClient.invalidateQueries({ queryKey: ["/api/user"] });
            toast({
                title: "Quest Completed!",
                description: "You've earned XP and stat bonuses!",
            });
        },
        onError: () => {
            toast({
                title: "Error",
                description: "Failed to complete quest. Please try again.",
                variant: "destructive",
            });
        },
    });

    const filteredQuests = quests?.filter((quest) => {
        if (activeTab === "all") return true;
        return quest.type === activeTab;
    }) || [];

    const activeQuests = filteredQuests.filter(q => !q.completed);
    const completedQuests = filteredQuests.filter(q => q.completed);

    // Calculate stats
    const totalQuests = quests?.length || 0;
    const completedCount = quests?.filter(q => q.completed).length || 0;
    const completionRate = totalQuests > 0 ? Math.round((completedCount / totalQuests) * 100) : 0;
    const totalXPEarned = quests?.filter(q => q.completed).reduce((acc, q) => acc + q.rewardXP, 0) || 0;

    if (isLoading) {
        return (
            <div className="space-y-6 p-6">
                <div className="flex justify-between items-center">
                    <Skeleton className="h-12 w-64" />
                    <Skeleton className="h-10 w-32" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                    {[1, 2, 3].map((i) => (
                        <Skeleton key={i} className="h-24" />
                    ))}
                </div>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                        <Skeleton key={i} className="h-64" />
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="relative min-h-screen overflow-hidden bg-black/95">
            {/* Ambient Background */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <div className="absolute top-0 left-0 w-full h-full bg-[url('/grid-pattern.svg')] opacity-[0.03]" />
                <motion.div
                    animate={{
                        opacity: [0.1, 0.2, 0.1],
                        scale: [1, 1.1, 1],
                    }}
                    transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-purple-600/20 rounded-full blur-[120px]"
                />
                <motion.div
                    animate={{
                        opacity: [0.1, 0.2, 0.1],
                        scale: [1, 1.2, 1],
                    }}
                    transition={{ duration: 15, repeat: Infinity, ease: "easeInOut", delay: 2 }}
                    className="absolute bottom-[-10%] left-[-5%] w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[120px]"
                />
            </div>

            <div className="relative z-10 p-6 max-w-7xl mx-auto space-y-8" data-testid="page-quests">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.5 }}
                    >
                        <h1 className="text-5xl font-display font-bold mb-2 bg-gradient-to-r from-white via-purple-100 to-purple-200 bg-clip-text text-transparent drop-shadow-sm">
                            Quest Board
                        </h1>
                        <p className="text-zinc-400 text-lg max-w-xl">
                            Embark on challenges to prove your worth, earn experience, and ascend to new heights.
                        </p>
                    </motion.div>
                </div>

                {/* Stats Overview */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                    className="grid grid-cols-1 md:grid-cols-3 gap-4"
                >
                    <Card className="bg-zinc-900/50 border-zinc-800/50 backdrop-blur-xl hover:bg-zinc-900/70 transition-all duration-300 group overflow-hidden relative">
                        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div className="relative z-10 p-6 flex items-center gap-4">
                            <div className="p-3 rounded-xl bg-purple-500/10 text-purple-400 group-hover:bg-purple-500/20 transition-colors shadow-inner border border-purple-500/10">
                                <Target className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-zinc-400">Available Quests</p>
                                <p className="text-3xl font-bold text-white tracking-tight">{activeQuests.length}</p>
                            </div>
                        </div>
                    </Card>

                    <Card className="bg-zinc-900/50 border-zinc-800/50 backdrop-blur-xl hover:bg-zinc-900/70 transition-all duration-300 group overflow-hidden relative">
                        <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div className="relative z-10 p-6 flex items-center gap-4">
                            <div className="p-3 rounded-xl bg-green-500/10 text-green-400 group-hover:bg-green-500/20 transition-colors shadow-inner border border-green-500/10">
                                <CheckCircle2 className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-zinc-400">Completion Rate</p>
                                <p className="text-3xl font-bold text-white tracking-tight">{completionRate}%</p>
                            </div>
                        </div>
                    </Card>

                    <Card className="bg-zinc-900/50 border-zinc-800/50 backdrop-blur-xl hover:bg-zinc-900/70 transition-all duration-300 group overflow-hidden relative">
                        <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div className="relative z-10 p-6 flex items-center gap-4">
                            <div className="p-3 rounded-xl bg-amber-500/10 text-amber-400 group-hover:bg-amber-500/20 transition-colors shadow-inner border border-amber-500/10">
                                <Sparkles className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-zinc-400">Total XP Earned</p>
                                <p className="text-3xl font-bold text-white tracking-tight">{totalXPEarned}</p>
                            </div>
                        </div>
                    </Card>
                </motion.div>

                {/* Tabs and Content */}
                <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="space-y-8">
                    <div className="flex items-center justify-between">
                        <TabsList className="bg-zinc-900/50 border border-zinc-800/50 p-1 h-12 rounded-full backdrop-blur-xl">
                            {[
                                { id: "all", label: "All Quests" },
                                { id: "daily", label: "Daily" },
                                { id: "weekly", label: "Weekly" },
                                { id: "habits", label: "Habits" }
                            ].map((tab) => (
                                <TabsTrigger
                                    key={tab.id}
                                    value={tab.id}
                                    className="rounded-full px-6 h-full data-[state=active]:bg-purple-600 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-purple-900/20 transition-all duration-300"
                                >
                                    {tab.label}
                                </TabsTrigger>
                            ))}
                        </TabsList>
                    </div>

                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeTab}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.3 }}
                        >
                            <TabsContent value={activeTab} className="mt-0 space-y-8">
                                {/* Active Quests Section */}
                                {activeQuests.length > 0 && (
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-2 text-zinc-400 mb-4">
                                            <div className="h-px bg-zinc-800 flex-1" />
                                            <span className="text-sm font-medium uppercase tracking-wider">Active Challenges</span>
                                            <div className="h-px bg-zinc-800 flex-1" />
                                        </div>
                                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                                            {activeQuests.map((quest, index) => (
                                                <motion.div
                                                    key={quest.id}
                                                    initial={{ opacity: 0, y: 20 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ delay: index * 0.05 }}
                                                >
                                                    <QuestCard
                                                        quest={quest}
                                                        onComplete={(id) => completeMutation.mutate(id)}
                                                        isCompletingQuest={completeMutation.isPending}
                                                    />
                                                </motion.div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Completed Quests Section */}
                                {completedQuests.length > 0 && (
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-2 text-zinc-400 mb-4 pt-8">
                                            <div className="h-px bg-zinc-800 flex-1" />
                                            <span className="text-sm font-medium uppercase tracking-wider">Completed</span>
                                            <div className="h-px bg-zinc-800 flex-1" />
                                        </div>
                                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                                            {completedQuests.map((quest, index) => (
                                                <motion.div
                                                    key={quest.id}
                                                    initial={{ opacity: 0, y: 20 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ delay: index * 0.05 }}
                                                >
                                                    <QuestCard quest={quest} />
                                                </motion.div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Empty State */}
                                {filteredQuests.length === 0 && (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        className="flex flex-col items-center justify-center py-20 text-center space-y-4 bg-zinc-900/20 border border-zinc-800/50 rounded-2xl backdrop-blur-sm"
                                    >
                                        <div className="p-4 bg-zinc-900/50 rounded-full ring-1 ring-zinc-800">
                                            <Target className="h-12 w-12 text-zinc-600" />
                                        </div>
                                        <div className="space-y-2">
                                            <h3 className="text-xl font-semibold text-white">No quests available</h3>
                                            <p className="text-zinc-500 max-w-sm mx-auto">
                                                You've cleared the board for this category. Check back later for new challenges!
                                            </p>
                                        </div>
                                    </motion.div>
                                )}
                            </TabsContent>

                            {/* Habits Tab */}
                            <TabsContent value="habits" className="mt-0">
                                <HabitTracker />
                            </TabsContent>
                        </motion.div>
                    </AnimatePresence>
                </Tabs>
            </div>
        </div>
    );
}
