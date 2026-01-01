import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Quest, QuestType } from "@shared/schema";
import { QuestCard } from "@/components/quest-card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Target, Trophy, Calendar, Sparkles, CheckCircle2, Crown, BookOpen, Dumbbell, Leaf, Zap } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/ui/card";
import { HabitTracker } from "@/components/habit-tracker";
import { useAnimations } from "@/context/animation-context";
import { Progress } from "@/components/ui/progress";

export default function QuestsPage() {
    const [activeTab, setActiveTab] = useState<"active" | "browse" | "habits">("active");
    const { toast } = useToast();
    const { showQuestCompleted } = useAnimations();

    // Queries
    const { data: quests, isLoading: isLoadingQuests } = useQuery<Quest[]>({
        queryKey: ["/api/quests"],
    });

    const { data: activeCampaign, isLoading: isLoadingCampaign } = useQuery<any>({
        queryKey: ["/api/user/active-campaign"],
    });

    const { data: allCampaigns } = useQuery<any[]>({
        queryKey: ["/api/campaigns"],
        enabled: activeTab === "browse", // Only fetch when browsing
    });

    // Mutations
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
            toast({ title: "Quest Completed!", description: "You've earned XP and rewards!" });
        },
        onError: () => {
            toast({ title: "Error", description: "Failed to complete quest.", variant: "destructive" });
        },
    });

    const joinCampaignMutation = useMutation({
        mutationFn: async (campaignId: string) => {
            return apiRequest("POST", `/api/campaigns/${campaignId}/join`, {});
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/user/active-campaign"] });
            queryClient.invalidateQueries({ queryKey: ["/api/quests"] });
            setActiveTab("active");
            toast({ title: "Journey Started", description: "Your daily quests have been updated." });
        },
    });

    // Data Processing
    // Filter quests to show only ACTIVE DAILY quests (or relevant ones)
    // Note: The backend logic should already handle "24h expiry" via checking created/expiresAt dates
    // But we might want to filter out 'completed' from the 'Active' list visually if desired, or show them checked.
    const activeDailyQuests = quests?.filter(q => q.type === "daily" && !q.completed) || [];
    const completedDailyQuests = quests?.filter(q => q.type === "daily" && q.completed) || [];

    // Countdown Timer Logic
    const [timeLeft, setTimeLeft] = useState("");

    useEffect(() => {
        const updateTimer = () => {
            // Find shared expiration time from any daily quest
            const activeQuests = quests?.filter(q => q.type === "daily") || [];
            if (activeQuests.length === 0) {
                setTimeLeft("--:--:--");
                return;
            }

            // Assume all daily quests expire at the same time (created together)
            const expiresAt = activeQuests[0].expiresAt;
            if (!expiresAt) {
                setTimeLeft("--:--:--");
                return;
            }

            const now = new Date();
            const end = new Date(expiresAt);
            const diff = end.getTime() - now.getTime();

            if (diff <= 0) {
                setTimeLeft("00:00:00");
                return; // Optionally invalidate queries here to refresh
            }

            const hours = Math.floor(diff / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((diff % (1000 * 60)) / 1000);

            setTimeLeft(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
        };

        const timerId = setInterval(updateTimer, 1000);
        updateTimer(); // Initial call

        return () => clearInterval(timerId);
    }, [quests]);

    const getDifficultyColor = (difficulty: string) => {
        switch (difficulty) {
            case "beginner": return "text-green-400";
            case "intermediate": return "text-yellow-400";
            case "advanced": return "text-red-500";
            default: return "text-zinc-400";
        }
    };

    if (isLoadingQuests || isLoadingCampaign) {
        return <div className="p-10 text-white">Loading your journey...</div>;
    }

    return (
        <div className="relative min-h-screen overflow-hidden bg-background">
            {/* Ambient Background */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <div className="absolute top-0 left-0 w-full h-full bg-[url('/grid-pattern.svg')] opacity-[0.03]" />
                <motion.div
                    animate={{ opacity: [0.1, 0.2, 0.1], scale: [1, 1.1, 1] }}
                    transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-primary/20 rounded-full blur-[120px]"
                />
            </div>

            <div className="relative z-10 p-6 max-w-7xl mx-auto space-y-8">
                {/* Header */}
                <h1 className="text-5xl font-display font-bold mb-2 text-foreground drop-shadow-sm">
                    Quest Board
                </h1>

                {/* Navigation Tabs */}
                <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="space-y-8">
                    <TabsList className="bg-muted/50 border border-border p-1 h-12 rounded-full backdrop-blur-xl">
                        <TabsTrigger value="active" className="rounded-full px-6 h-full data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all">
                            Active Journey
                        </TabsTrigger>
                        <TabsTrigger value="browse" className="rounded-full px-6 h-full data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all">
                            Browse Quest Packs
                        </TabsTrigger>
                        <TabsTrigger value="habits" className="rounded-full px-6 h-full data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all">
                            Habit Tracker
                        </TabsTrigger>
                    </TabsList>

                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeTab}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.3 }}
                        >
                            <TabsContent value="active" className="space-y-8">
                                {activeCampaign ? (
                                    <>
                                        {/* Active Campaign Header */}
                                        <div className="bg-card/40 border border-border p-6 rounded-2xl relative overflow-hidden">
                                            <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-transparent" />
                                            <div className="relative z-10 flex justify-between items-center">
                                                <div>
                                                    <div className="flex items-center gap-3 mb-2">
                                                        <span className="px-3 py-1 bg-primary/20 text-primary rounded-full text-xs font-bold uppercase tracking-wider border border-primary/20">
                                                            {activeCampaign.category}
                                                        </span>
                                                        <span className={`text-sm font-bold uppercase tracking-wider ${getDifficultyColor(activeCampaign.difficulty)}`}>
                                                            {activeCampaign.difficulty}
                                                        </span>
                                                    </div>
                                                    <h2 className="text-3xl font-bold text-foreground mb-2">{activeCampaign.title}</h2>
                                                    <p className="text-muted-foreground">{activeCampaign.description}</p>
                                                </div>
                                                <div className="text-right hidden md:block">
                                                    <div className="text-sm text-muted-foreground uppercase tracking-widest mb-1">Time Remaining</div>
                                                    {/* Mock timer for now */}
                                                    <div className="text-2xl font-mono text-foreground tracking-widest">{timeLeft || "--:--:--"}</div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Today's Quests */}
                                        <div className="space-y-4">
                                            <div className="flex items-center gap-2 text-muted-foreground">
                                                <Zap className="w-4 h-4" />
                                                <span className="text-sm font-bold uppercase tracking-wider">Today's Objectives</span>
                                            </div>

                                            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                                                {activeDailyQuests.map((quest) => (
                                                    <QuestCard
                                                        key={quest.id}
                                                        quest={quest}
                                                        onComplete={(id) => completeMutation.mutate(id)}
                                                        isCompletingQuest={completeMutation.isPending}
                                                    />
                                                ))}
                                                {activeDailyQuests.length === 0 && completedDailyQuests.length === 0 && (
                                                    <div className="col-span-3 text-center py-10 text-zinc-500">
                                                        No quests for today. Check back tomorrow!
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Completed Section */}
                                        {completedDailyQuests.length > 0 && (
                                            <div className="space-y-4 pt-8">
                                                <div className="flex items-center gap-2 text-muted-foreground">
                                                    <CheckCircle2 className="w-4 h-4" />
                                                    <span className="text-sm font-bold uppercase tracking-wider">Completed Today</span>
                                                </div>
                                                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 opacity-60">
                                                    {completedDailyQuests.map((quest) => (
                                                        <QuestCard key={quest.id} quest={quest} />
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <div className="text-center py-20 bg-card/30 rounded-2xl border border-border">
                                        <Crown className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                                        <h3 className="text-2xl font-bold text-foreground mb-2">No Active Journey</h3>
                                        <p className="text-muted-foreground max-w-md mx-auto mb-6">
                                            You haven't started a quest pack yet. Browse the available packs to begin your ascension.
                                        </p>
                                        <Button
                                            onClick={() => setActiveTab("browse")}
                                            className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-6 text-lg rounded-xl"
                                        >
                                            Find Your Path
                                        </Button>
                                    </div>
                                )}
                            </TabsContent>

                            <TabsContent value="browse">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {allCampaigns?.map((campaign) => (
                                        <Card key={campaign.id} className="group overflow-hidden border-border bg-card/40 hover:bg-card/60 transition-all duration-300">
                                            <div className="relative h-48 overflow-hidden">
                                                <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent z-10" />
                                                <img
                                                    src={campaign.imageUrl || "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800&q=80"}
                                                    alt={campaign.title}
                                                    className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700"
                                                />
                                                <div className="absolute top-4 left-4 z-20 flex gap-2">
                                                    <span className="px-3 py-1 bg-black/60 backdrop-blur-md text-white rounded-full text-xs font-bold uppercase border border-white/10">
                                                        {campaign.category}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="p-6">
                                                <div className="flex justify-between items-start mb-4">
                                                    <div>
                                                        <h3 className="text-2xl font-bold text-foreground group-hover:text-primary transition-colors">
                                                            {campaign.title}
                                                        </h3>
                                                        <div className={`text-xs font-bold uppercase tracking-wider mt-1 ${getDifficultyColor(campaign.difficulty)}`}>
                                                            {campaign.difficulty} Difficulty
                                                        </div>
                                                    </div>
                                                </div>

                                                <p className="text-muted-foreground mb-6 line-clamp-2">
                                                    {campaign.description}
                                                </p>

                                                <div className="flex items-center justify-between text-sm text-muted-foreground mb-6 p-4 bg-background/50 rounded-xl">
                                                    <div className="flex items-center gap-2">
                                                        <Calendar className="w-4 h-4" />
                                                        <span>{campaign.durationDays} Days</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <Trophy className="w-4 h-4 text-amber-500" />
                                                        <span className="text-amber-500">{campaign.rewardXP} XP</span>
                                                    </div>
                                                </div>

                                                <Button
                                                    onClick={() => joinCampaignMutation.mutate(campaign.id)}
                                                    className="w-full bg-secondary text-secondary-foreground hover:bg-secondary/80 font-bold py-6 rounded-xl"
                                                    disabled={joinCampaignMutation.isPending || (activeCampaign && activeCampaign.id === campaign.id)}
                                                >
                                                    {activeCampaign && activeCampaign.id === campaign.id ? "Currently Active" : "Start Journey"}
                                                </Button>
                                            </div>
                                        </Card>
                                    ))}
                                </div>
                            </TabsContent>

                            <TabsContent value="habits">
                                <HabitTracker />
                            </TabsContent>
                        </motion.div>
                    </AnimatePresence>
                </Tabs>
            </div>
        </div>
    );
}
