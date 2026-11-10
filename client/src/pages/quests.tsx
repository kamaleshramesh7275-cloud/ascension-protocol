import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Quest, QuestType } from "@shared/schema";
import { QuestCard } from "@/components/quest-card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Target, Trophy, Calendar, Sparkles, CheckCircle2, Crown, BookOpen, Dumbbell, Leaf, Zap, ArrowLeft, Shield, HeartPulse, Flame } from "lucide-react";
import { audioEngine } from "@/lib/audio-engine";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/ui/card";
import { DailyProtocol } from "@/components/daily-protocol";
import { useAnimations } from "@/context/animation-context";
import { Progress } from "@/components/ui/progress";
import { CustomHabitDialog } from "@/components/custom-habit-dialog";
import { PullToRefresh } from "@/components/pull-to-refresh";
import { ShareTelemetryButton } from "@/components/share-telemetry-button";
import { CofferOpeningModal } from "@/components/rewards/coffer-opening-modal";
import { useAuth } from "@/hooks/use-auth";
import { ManhwaSystemModal, type SystemModalType } from "@/components/system/manhwa-system-modal";
import { hapticSuccess, hapticShield } from "@/lib/haptics";

const CLASS_META: Record<string, { name: string; icon: string }> = {
    assassin: { name: "Shadow Assassin", icon: "🗡️" },
    tank: { name: "Iron Tank", icon: "🛡️" },
    ranger: { name: "Phantom Ranger", icon: "🏹" },
    mage: { name: "Void Scholar", icon: "🔮" },
    monarch: { name: "Shadow Monarch", icon: "👑" },
};

const GEAR_META: Record<string, string> = {
    bodyweight: "Bodyweight Only",
    dumbbells: "Dumbbells / Home",
    gym: "Commercial Gym",
};

export default function QuestsPage() {
    const [, setLocation] = useLocation();
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState<"active" | "browse" | "habits">("active");
    const [selectedCategory, setSelectedCategory] = useState<string>("All");
    const [showCofferModal, setShowCofferModal] = useState<boolean>(false);
    const [isActivatingRecovery, setIsActivatingRecovery] = useState<boolean>(false);
    const [systemModal, setSystemModal] = useState<{
        isOpen: boolean;
        type: SystemModalType;
        title?: string;
        subtitle?: string;
        message: string;
        flavorQuote?: string;
        rewards?: Array<{ label: string; value: string | number; icon?: string }>;
    }>({
        isOpen: false,
        type: "quest_complete",
        message: "",
    });

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
            hapticSuccess();
            const quest = quests?.find(q => q.id === questId);
            if (quest) {
                showQuestCompleted(quest.title, quest.rewardXP, quest.rewardCoins);
                setSystemModal({
                    isOpen: true,
                    type: "quest_complete",
                    title: "QUEST COMPLETED",
                    subtitle: "[ SYSTEM RANK UPDATE ]",
                    message: `Directive fulfilled: "${quest.title}". Your combat potential expands across the network.`,
                    flavorQuote: "Power is not given. It is forged through relentless execution.",
                    rewards: [
                        { label: "EXP ACQUIRED", value: `+${quest.rewardXP} XP`, icon: "⚡" },
                        { label: "HUNTER COINS", value: `+${quest.rewardCoins}`, icon: "🪙" },
                        { label: "STATUS", value: "CLEARED", icon: "✓" },
                    ],
                });
            }
            queryClient.invalidateQueries({ queryKey: ["/api/quests"] });
            queryClient.invalidateQueries({ queryKey: ["/api/user"] });
            toast({ title: "Quest Completed!", description: "You've earned XP and rewards!" });
        },
        onError: () => {
            if ('vibrate' in navigator) navigator.vibrate([100, 50, 100]);
            toast({ title: "Error", description: "Failed to complete quest.", variant: "destructive" });
        },
    });

    const handleActivateRecovery = async () => {
        if ((user?.streakShields ?? 0) <= 0) {
            toast({
                title: "No Mana Shields Available",
                description: "Acquire a Streak Shield in the Hunter Shop to protect your streak on rest days.",
                variant: "destructive",
            });
            return;
        }
        setIsActivatingRecovery(true);
        try {
            const res = await apiRequest("POST", "/api/user/recovery-day", {});
            const data = await res.json();
            hapticShield();
            setSystemModal({
                isOpen: true,
                type: "recovery_day",
                title: "REST DAY PROTOCOL ENGAGED",
                subtitle: "[ MANA SHIELD ACTIVATED ]",
                message: data.message || "Streak protected. Daily requirements recalibrated to cellular and neurological recovery.",
                flavorQuote: "Even monarchs must let their shadow army mend in darkness.",
                rewards: [
                    { label: "MANA SHIELDS REMAINING", value: data.shieldsRemaining ?? 0, icon: "🛡️" },
                    { label: "STREAK PRESERVED", value: `${data.streak ?? user?.streak ?? 1} Days`, icon: "🔥" },
                    { label: "RECOVERY DIRECTIVES", value: "3 Calibrated", icon: "💧" },
                ],
            });
            queryClient.invalidateQueries({ queryKey: ["/api/quests"] });
            queryClient.invalidateQueries({ queryKey: ["/api/user"] });
        } catch (err: any) {
            toast({
                title: "Recovery Activation Failed",
                description: err?.message || "Could not engage Rest Day Protocol.",
                variant: "destructive",
            });
        } finally {
            setIsActivatingRecovery(false);
        }
    };

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

    const allCategories = ["All", ...Array.from(new Set(quests?.filter(q => q.type === "daily").map(q => q.category || "general")))];
    const filteredActiveDailyQuests = activeDailyQuests.filter(q => selectedCategory === "All" || (q.category || "general") === selectedCategory);

    const totalDailyCount = activeDailyQuests.length + completedDailyQuests.length;
    const completedDailyCount = completedDailyQuests.length;
    const dailyBonusProgress = totalDailyCount > 0 ? (completedDailyCount / totalDailyCount) * 100 : 0;

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
        return <div data-tour="quests-page" className="p-10 text-white">Loading your journey...</div>;
    }

    return (
        <PullToRefresh onRefresh={async () => {
            await queryClient.invalidateQueries({ queryKey: ["/api/quests"] });
            await queryClient.invalidateQueries({ queryKey: ["/api/user/active-campaign"] });
        }}>
        <div className="relative min-h-screen bg-background">
            {/* Ambient Background */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <div className="absolute top-0 left-0 w-full h-full bg-[url('/grid-pattern.svg')] opacity-[0.03]" />
                <motion.div
                    animate={{ opacity: [0.1, 0.2, 0.1], scale: [1, 1.1, 1] }}
                    transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-primary/20 rounded-full blur-[120px]"
                />
            </div>

            <div className="relative z-10 p-4 sm:p-6 max-w-7xl mx-auto space-y-8 pb-24 md:pb-8" data-tour="quests-page">
                {/* Top Navigation */}
                <div className="flex items-center justify-between">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                            audioEngine.playTactileClick();
                            setLocation("/mission-command");
                        }}
                        className="border-white/10 bg-[#0E1218] text-zinc-300 hover:text-white hover:border-white/20 h-8 font-mono text-xs flex items-center gap-1.5"
                    >
                        <ArrowLeft className="w-3.5 h-3.5 text-cyan-400" />
                        <span>MISSION COMMAND</span>
                    </Button>
                    <span className="font-mono text-[10px] text-zinc-500 uppercase tracking-widest">TACTICAL QUESTS</span>
                </div>

                {/* Header */}
                <h1 className="text-3xl sm:text-4xl md:text-5xl font-display font-bold mb-2 text-foreground drop-shadow-sm">
                    Quest Board
                </h1>

                {/* Navigation Tabs */}
                <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="space-y-8">
                    <TabsList className="bg-muted/50 border border-border p-1 h-12 rounded-full backdrop-blur-xl w-full sm:w-auto">
                        <TabsTrigger value="active" className="rounded-full px-3 sm:px-6 h-full data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all text-xs sm:text-sm">
                            Active
                        </TabsTrigger>
                        <TabsTrigger value="browse" className="rounded-full px-3 sm:px-6 h-full data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all text-xs sm:text-sm">
                            Browse
                        </TabsTrigger>
                        <TabsTrigger value="habits" className="rounded-full px-3 sm:px-6 h-full data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all text-xs sm:text-sm">
                            Habits
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
                                {/* Hunter Archetype & Anti-Burnout Recovery HUD */}
                                <div className="bg-gradient-to-r from-zinc-950 via-blue-950/20 to-zinc-950 border border-blue-500/20 rounded-2xl p-4 sm:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-[0_0_20px_rgba(59,130,246,0.08)]">
                                    <div className="flex items-center gap-3">
                                        <div className="w-11 h-11 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-xl shadow-[0_0_12px_rgba(59,130,246,0.25)]">
                                            {CLASS_META[user?.hunterClass || "assassin"]?.icon || "🗡️"}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <span className="font-mono text-xs uppercase tracking-wider text-blue-400 font-bold">
                                                    {CLASS_META[user?.hunterClass || "assassin"]?.name || "Shadow Assassin"}
                                                </span>
                                                <span className="text-zinc-600">•</span>
                                                <span className="text-xs text-zinc-400 font-mono">
                                                    {GEAR_META[user?.equipmentProfile || "bodyweight"] || "Bodyweight"}
                                                </span>
                                            </div>
                                            <p className="text-xs text-zinc-500">
                                                Daily protocol tailored to your combat loadout.
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
                                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-black/60 border border-blue-500/30 font-mono text-xs">
                                            <Shield className="w-3.5 h-3.5 text-blue-400" />
                                            <span className="text-zinc-300">MANA SHIELDS:</span>
                                            <span className="text-blue-400 font-bold">{user?.streakShields ?? 1}</span>
                                        </div>

                                        {user?.activeRecoveryDay ? (
                                            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 font-mono text-xs text-emerald-400">
                                                <HeartPulse className="w-3.5 h-3.5 animate-pulse text-emerald-400" />
                                                <span>REST PROTOCOL ACTIVE</span>
                                            </div>
                                        ) : (
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={handleActivateRecovery}
                                                disabled={isActivatingRecovery || (user?.streakShields ?? 0) <= 0}
                                                className="border-blue-500/30 bg-blue-500/10 hover:bg-blue-500/20 text-blue-300 font-mono text-xs h-8 flex items-center gap-1.5"
                                                title="Consumes 1 Mana Shield to maintain streak and issue active recovery quests"
                                            >
                                                <HeartPulse className="w-3.5 h-3.5 text-blue-400" />
                                                <span>{isActivatingRecovery ? "ENGAGING..." : "ENGAGE REST DAY"}</span>
                                            </Button>
                                        )}
                                    </div>
                                </div>

                                {activeCampaign ? (
                                    <>
                                        {/* Active Campaign Header */}
                                        <div className="bg-card/40 border border-border p-6 rounded-2xl relative overflow-hidden">
                                            <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-transparent" />
                                            <div className="relative z-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                                                <div>
                                                    <div className="flex items-center gap-3 mb-2">
                                                        <span className="px-3 py-1 bg-primary/20 text-primary rounded-full text-xs font-bold uppercase tracking-wider border border-primary/20">
                                                            {activeCampaign.category}
                                                        </span>
                                                        <span className={`text-sm font-bold uppercase tracking-wider ${getDifficultyColor(activeCampaign.difficulty)}`}>
                                                            {activeCampaign.difficulty}
                                                        </span>
                                                    </div>
                                                    <h2 className="text-xl sm:text-3xl font-bold text-foreground mb-2">{activeCampaign.title}</h2>
                                                    <p className="text-muted-foreground text-sm sm:text-base">{activeCampaign.description}</p>
                                                </div>
                                                <div className="text-left sm:text-right">
                                                    <div className="text-xs text-muted-foreground uppercase tracking-widest mb-1">Time Remaining</div>
                                                    <div className="text-xl sm:text-2xl font-mono text-foreground tracking-widest">{timeLeft || "--:--:--"}</div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Daily Bonus Progress */}
                                        {totalDailyCount > 0 && (
                                            <div className="bg-card/40 border border-border p-4 rounded-xl mt-6 space-y-3">
                                                <div className="flex justify-between items-center text-sm font-bold">
                                                    <span className="flex items-center gap-2"><Trophy className="w-4 h-4 text-amber-500" /> Daily Bonus Chest</span>
                                                    <span>{completedDailyCount} / {totalDailyCount} Quests</span>
                                                </div>
                                                <Progress value={dailyBonusProgress} className="h-2" />
                                                {completedDailyCount === totalDailyCount && (
                                                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-2 border-t border-border/50">
                                                        <p className="text-xs text-emerald-400 font-mono font-medium">ALL DAILY PROTOCOLS EXECUTED WITH ZERO DEVIATION.</p>
                                                        <div className="flex items-center gap-2 flex-wrap">
                                                            <Button
                                                                size="sm"
                                                                onClick={() => {
                                                                    audioEngine.playCommandLock();
                                                                    setShowCofferModal(true);
                                                                }}
                                                                className="bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-400 hover:to-yellow-500 text-black font-mono text-xs font-black shadow-lg flex items-center gap-1.5 h-8 px-3"
                                                            >
                                                                <Trophy className="w-3.5 h-3.5 text-black" />
                                                                <span>BREACH SCOUT COFFER</span>
                                                            </Button>
                                                            <ShareTelemetryButton
                                                                label="TRANSMIT STATUS"
                                                                data={{
                                                                    type: "quest",
                                                                    title: "DAILY PROTOCOL EXECUTED",
                                                                    headlineMetric: `${completedDailyCount}/${totalDailyCount}`,
                                                                    subheadline: "Daily Quests Completed",
                                                                    userName: (user as any)?.name || "Operative",
                                                                    userTier: (user as any)?.tier || "INITIATE",
                                                                    referralCode: (user as any)?.referralCode,
                                                                    stats: [
                                                                        { label: "Status", value: "100% Zero Deviation" },
                                                                        { label: "Mission", value: activeCampaign?.title || "Daily Mission" },
                                                                    ],
                                                                }}
                                                            />
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {/* Today's Quests */}
                                        <div className="space-y-4">
                                            <div className="flex items-center justify-between gap-2 flex-wrap">
                                                <div className="flex items-center gap-2">
                                                    <Zap className="w-4 h-4" />
                                                    <span className="text-sm font-bold uppercase tracking-wider">Today's Objectives</span>
                                                </div>
                                                
                                                {/* Category Filter — horizontally scrollable on mobile */}
                                                <div className="flex gap-2 overflow-x-auto pb-1 max-w-full scrollbar-hide" style={{ WebkitOverflowScrolling: 'touch' }}>
                                                    {allCategories.map(cat => (
                                                        <button 
                                                            key={cat} 
                                                            onClick={() => setSelectedCategory(cat)}
                                                            className={`text-xs px-3 py-1 rounded-full border transition-colors whitespace-nowrap flex-shrink-0 ${selectedCategory === cat ? 'bg-primary/20 border-primary/50 text-primary' : 'bg-transparent border-zinc-800 text-zinc-400 hover:text-zinc-200'}`}
                                                        >
                                                            {cat.charAt(0).toUpperCase() + cat.slice(1)}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>

                                            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                                                {filteredActiveDailyQuests.map((quest) => (
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
                                <DailyProtocol />
                                <div className="mt-8 max-w-md mx-auto">
                                    <CustomHabitDialog />
                                </div>
                            </TabsContent>
                        </motion.div>
                    </AnimatePresence>
                </Tabs>
            </div>
        </div>

        <CofferOpeningModal
            isOpen={showCofferModal}
            cofferType="enclave_scout"
            onClose={() => setShowCofferModal(false)}
            onClaim={(loot) => {
                toast({
                    title: "SCOUT COFFER REWARDS CLAIMED! 🎁",
                    description: `Gained +${loot.totalXp} XP and +${loot.totalCoins} Coins!`,
                });
                queryClient.invalidateQueries({ queryKey: ["/api/user"] });
                queryClient.invalidateQueries({ queryKey: ["/api/quests"] });
            }}
        />

        <ManhwaSystemModal
            isOpen={systemModal.isOpen}
            type={systemModal.type}
            title={systemModal.title}
            subtitle={systemModal.subtitle}
            message={systemModal.message}
            flavorQuote={systemModal.flavorQuote}
            rewards={systemModal.rewards}
            onClose={() => setSystemModal(prev => ({ ...prev, isOpen: false }))}
        />
        </PullToRefresh>
    );
}
