import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
    Users, Crown, TrendingUp, LogOut, Shield, MessageSquare, Send,
    Trophy, Zap, Coins, Star, Lock, CheckCircle2, Clock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { User } from "@shared/schema";

interface Guild {
    id: string;
    name: string;
    description: string | null;
    leaderId: string;
    level: number;
    xp: number;
    memberCount: number;
    totalXP: number;
    maxMembers: number;
    isPublic: boolean;
    vicePresidentIds: string[];
    createdAt: Date;
}

interface GuildMessage {
    id: string;
    guildId: string;
    userId: string;
    userName: string;
    message: string;
    type: 'chat' | 'system' | 'achievement';
    createdAt: string;
}

interface GuildQuest {
    id: string;
    guildId: string;
    title: string;
    description: string;
    requiredContributions: number;
    currentContributions: number;
    contributors: string[];
    rewardXP: number;
    rewardCoins: number;
    completed: boolean;
    expiresAt: string;
}

interface GuildPerk {
    id: string;
    name: string;
    description: string;
    requiredLevel: number;
    xpBonus?: number;
    coinBonus?: number;
    questSlots?: number;
    unlocked: boolean;
}

const GUILD_LEVEL_THRESHOLDS: Record<number, number> = {
    1: 0, 2: 1000, 3: 2500, 4: 5000, 5: 10000,
    6: 20000, 7: 35000, 8: 55000, 9: 80000, 10: 100000,
};

export default function GuildsPage() {
    const { toast } = useToast();
    const [newMessage, setNewMessage] = useState("");
    const [activeTab, setActiveTab] = useState("overview");

    const { data: user } = useQuery<User>({
        queryKey: ["/api/user"],
    });

    const { data: guilds, isLoading: guildsLoading } = useQuery<Guild[]>({
        queryKey: ["/api/guilds"],
    });

    const userGuild = guilds?.find(g => g.id === user?.guildId);

    // Fetch guild members
    const { data: guildMembers = [] } = useQuery<User[]>({
        queryKey: [`/api/guilds/${userGuild?.id}/members`],
        enabled: !!userGuild,
    });

    const { data: messages = [] } = useQuery<GuildMessage[]>({
        queryKey: [`/api/guilds/${userGuild?.id}/messages`],
        enabled: !!userGuild,
        refetchInterval: 5000, // Poll every 5 seconds
    });

    // Guild quests - updated to use new endpoint
    const { data: guildQuests = [] } = useQuery<any[]>({
        queryKey: [`/api/guilds/${userGuild?.id}/quests`],
        enabled: !!userGuild,
    });

    // Guild perks catalog
    const { data: perksCatalog = [] } = useQuery<any[]>({
        queryKey: ["/api/guilds/perks/catalog"],
    });

    // Active guild perks
    const { data: activePerks = [] } = useQuery<any[]>({
        queryKey: [`/api/guilds/${userGuild?.id}/perks`],
        enabled: !!userGuild,
    });

    // Guild treasury
    const { data: treasuryData } = useQuery<{ treasury: number }>({
        queryKey: [`/api/guilds/${userGuild?.id}/treasury`],
        enabled: !!userGuild,
    });

    // Guild donations
    const { data: donations = [] } = useQuery<any[]>({
        queryKey: [`/api/guilds/${userGuild?.id}/donations`],
        enabled: !!userGuild,
    });

    const joinGuildMutation = useMutation({
        mutationFn: async (guildId: string) => {
            const res = await apiRequest("POST", `/api/guilds/${guildId}/join`, {});
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/guilds"] });
            queryClient.invalidateQueries({ queryKey: ["/api/user"] });
            toast({ title: "Joined guild successfully!" });
        },
        onError: (error: Error) => {
            toast({ title: "Failed to join guild", description: error.message, variant: "destructive" });
        },
    });

    const leaveGuildMutation = useMutation({
        mutationFn: async () => {
            const res = await apiRequest("POST", "/api/guilds/leave", {});
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/guilds"] });
            queryClient.invalidateQueries({ queryKey: ["/api/user"] });
            toast({ title: "Left guild successfully!" });
        },
        onError: (error: Error) => {
            toast({ title: "Failed to leave guild", description: error.message, variant: "destructive" });
        },
    });

    const sendMessageMutation = useMutation({
        mutationFn: async (message: string) => {
            console.log("Sending message:", message, "to guild:", userGuild?.id);
            const res = await apiRequest("POST", `/api/guilds/${userGuild?.id}/messages`, { message });
            return res.json();
        },
        onSuccess: (data) => {
            console.log("Message sent successfully:", data);
            setNewMessage("");
            queryClient.invalidateQueries({ queryKey: [`/api/guilds/${userGuild?.id}/messages`] });
            toast({ title: "Message sent!" });
        },
        onError: (error: Error) => {
            console.error("Failed to send message:", error);
            toast({ title: "Failed to send message", description: error.message, variant: "destructive" });
        },
    });

    const purchasePerkMutation = useMutation({
        mutationFn: async (perkId: string) => {
            const res = await apiRequest("POST", `/api/guilds/${userGuild?.id}/perks/purchase`, { perkId });
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [`/api/guilds/${userGuild?.id}/perks`] });
            queryClient.invalidateQueries({ queryKey: [`/api/guilds/${userGuild?.id}/treasury`] });
            queryClient.invalidateQueries({ queryKey: ["/api/guilds"] });
            toast({ title: "Perk purchased!", description: "Your guild now has this bonus active." });
        },
        onError: (error: Error) => {
            toast({ title: "Failed to purchase perk", description: error.message, variant: "destructive" });
        },
    });

    const donateMutation = useMutation({
        mutationFn: async (amount: number) => {
            const res = await apiRequest("POST", `/api/guilds/${userGuild?.id}/donate`, { amount });
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [`/api/guilds/${userGuild?.id}/treasury`] });
            queryClient.invalidateQueries({ queryKey: [`/api/guilds/${userGuild?.id}/donations`] });
            queryClient.invalidateQueries({ queryKey: ["/api/user"] });
            toast({ title: "Donation successful!", description: "Thank you for supporting your guild!" });
        },
        onError: (error: Error) => {
            toast({ title: "Failed to donate", description: error.message, variant: "destructive" });
        },
    });


    const sortedGuilds = guilds?.sort((a, b) => b.totalXP - a.totalXP) || [];

    const getNextLevelXP = (level: number) => {
        return GUILD_LEVEL_THRESHOLDS[Math.min(level + 1, 10)] || 100000;
    };

    const getLevelProgress = (xp: number, level: number) => {
        const currentThreshold = GUILD_LEVEL_THRESHOLDS[level];
        const nextThreshold = getNextLevelXP(level);
        return ((xp - currentThreshold) / (nextThreshold - currentThreshold)) * 100;
    };

    if (!user?.guildId) {
        return (
            <div className="min-h-screen bg-background p-6 pb-20 md:pb-6">
                <div className="max-w-7xl mx-auto space-y-8">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight mb-2">Guilds</h1>
                            <p className="text-muted-foreground">Join forces with other ascendants</p>
                        </div>
                    </div>

                    <div>
                        <h2 className="text-xl font-bold mb-4">Guild Leaderboard</h2>
                        <div className="space-y-3">
                            {guildsLoading ? (
                                <div className="text-center py-8 text-muted-foreground">Loading guilds...</div>
                            ) : sortedGuilds.length === 0 ? (
                                <div className="text-center py-8 text-muted-foreground">No guilds available</div>
                            ) : (
                                sortedGuilds.map((guild, index) => (
                                    <motion.div
                                        key={guild.id}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: index * 0.05 }}
                                        className="p-4 rounded-xl border border-border bg-card hover:border-primary/50 transition-all"
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                <div className={`text-2xl font-bold ${index === 0 ? "text-yellow-500" :
                                                    index === 1 ? "text-gray-400" :
                                                        index === 2 ? "text-orange-600" :
                                                            "text-muted-foreground"
                                                    }`}>
                                                    #{index + 1}
                                                </div>
                                                <div>
                                                    <h3 className="font-bold text-lg flex items-center gap-2">
                                                        {guild.name}
                                                        <Badge variant="outline" className="text-xs">Lv {guild.level}</Badge>
                                                    </h3>
                                                    <p className="text-sm text-muted-foreground line-clamp-1">{guild.description}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-6">
                                                <div className="text-right">
                                                    <div className="text-sm text-muted-foreground">Members</div>
                                                    <div className="font-bold">{guild.memberCount}/{guild.maxMembers}</div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="text-sm text-muted-foreground">Total XP</div>
                                                    <div className="font-bold text-primary">{guild.totalXP.toLocaleString()}</div>
                                                </div>
                                                <Button
                                                    size="sm"
                                                    onClick={() => joinGuildMutation.mutate(guild.id)}
                                                    disabled={joinGuildMutation.isPending || guild.memberCount >= guild.maxMembers}
                                                >
                                                    Join
                                                </Button>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background p-6 pb-20 md:pb-6">
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Guild Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-6 rounded-2xl border-2 border-primary bg-gradient-to-br from-primary/10 via-background to-background"
                >
                    <div className="flex items-start justify-between mb-4">
                        <div>
                            <h2 className="text-3xl font-bold flex items-center gap-3">
                                <Shield className="h-8 w-8 text-primary" />
                                {userGuild?.name}
                                <Badge variant="outline" className="text-lg">Level {userGuild?.level}</Badge>
                            </h2>
                            <p className="text-muted-foreground mt-1">{userGuild?.description}</p>
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => leaveGuildMutation.mutate()}
                            disabled={leaveGuildMutation.isPending}
                            className="gap-2"
                        >
                            <LogOut className="h-4 w-4" /> Leave
                        </Button>
                    </div>

                    {/* Guild Level Progress */}
                    <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                            <span>Guild XP: {userGuild?.xp.toLocaleString()}</span>
                            <span>Next Level: {getNextLevelXP(userGuild?.level || 1).toLocaleString()}</span>
                        </div>
                        <Progress value={getLevelProgress(userGuild?.xp || 0, userGuild?.level || 1)} className="h-3" />
                    </div>

                    <div className="grid grid-cols-4 gap-4 mt-4">
                        <div className="text-center p-3 rounded-lg bg-background/50 border border-border">
                            <Users className="h-5 w-5 mx-auto mb-1 text-blue-500" />
                            <div className="text-2xl font-bold">{userGuild?.memberCount}</div>
                            <div className="text-xs text-muted-foreground">Members</div>
                        </div>
                        <div className="text-center p-3 rounded-lg bg-background/50 border border-border">
                            <TrendingUp className="h-5 w-5 mx-auto mb-1 text-green-500" />
                            <div className="text-2xl font-bold">{userGuild?.totalXP.toLocaleString()}</div>
                            <div className="text-xs text-muted-foreground">Total XP</div>
                        </div>
                        <div className="text-center p-3 rounded-lg bg-background/50 border border-border">
                            <Crown className="h-5 w-5 mx-auto mb-1 text-yellow-500" />
                            <div className="text-2xl font-bold">#{sortedGuilds.findIndex(g => g.id === userGuild?.id) + 1}</div>
                            <div className="text-xs text-muted-foreground">Rank</div>
                        </div>
                        <div className="text-center p-3 rounded-lg bg-background/50 border border-border">
                            <Coins className="h-5 w-5 mx-auto mb-1 text-yellow-600" />
                            <div className="text-2xl font-bold">{treasuryData?.treasury || 0}</div>
                            <div className="text-xs text-muted-foreground">Treasury</div>
                        </div>
                    </div>
                </motion.div>

                {/* Tabs */}
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="grid w-full grid-cols-3 md:grid-cols-6 gap-1">
                        <TabsTrigger value="overview" className="text-xs md:text-sm">Overview</TabsTrigger>
                        <TabsTrigger value="members" className="text-xs md:text-sm">Members</TabsTrigger>
                        <TabsTrigger value="quests" className="text-xs md:text-sm">Quests</TabsTrigger>
                        <TabsTrigger value="perks" className="text-xs md:text-sm">Perks</TabsTrigger>
                        <TabsTrigger value="treasury" className="text-xs md:text-sm">Treasury</TabsTrigger>
                        <TabsTrigger value="chat" className="text-xs md:text-sm">Chat</TabsTrigger>
                    </TabsList>

                    {/* Overview Tab */}
                    <TabsContent value="overview" className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Star className="h-5 w-5 text-yellow-500" />
                                    Active Guild Perks
                                </CardTitle>
                                <CardDescription>Bonuses currently active for all members</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {activePerks.length === 0 ? (
                                    <div className="text-center py-8 text-muted-foreground">
                                        No active perks yet. Visit the Perks tab to purchase upgrades!
                                    </div>
                                ) : (
                                    <div className="grid gap-4">
                                        {activePerks.map((perk: any) => (
                                            <div
                                                key={perk.id}
                                                className="p-4 rounded-lg border border-green-500/50 bg-green-500/10"
                                            >
                                                <div className="flex items-start justify-between">
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <h3 className="font-bold">{perk.name}</h3>
                                                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                                                        </div>
                                                        <p className="text-sm text-muted-foreground">{perk.description}</p>
                                                    </div>
                                                    <Badge variant="default">Active</Badge>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Members Tab */}
                    <TabsContent value="members" className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Users className="h-5 w-5 text-blue-500" />
                                    Guild Members ({guildMembers.length})
                                </CardTitle>
                                <CardDescription>View all members of your guild</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    {guildMembers.map((member: any) => {
                                        const isLeader = member.id === userGuild?.leaderId;
                                        const isVP = userGuild?.vicePresidentIds?.includes(member.id);

                                        return (
                                            <div
                                                key={member.id}
                                                className="flex items-center justify-between p-4 rounded-lg border border-border bg-card hover:border-primary/50 transition-all"
                                            >
                                                <div className="flex items-center gap-4">
                                                    <div className="flex flex-col">
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-bold">{member.name}</span>
                                                            {isLeader && (
                                                                <Badge variant="default" className="gap-1">
                                                                    <Crown className="h-3 w-3" />
                                                                    President
                                                                </Badge>
                                                            )}
                                                            {isVP && !isLeader && (
                                                                <Badge variant="secondary" className="gap-1">
                                                                    <Shield className="h-3 w-3" />
                                                                    Vice President
                                                                </Badge>
                                                            )}
                                                        </div>
                                                        <span className="text-sm text-muted-foreground">
                                                            {member.tier} • Level {member.level}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-6">
                                                    <div className="text-right">
                                                        <div className="text-sm text-muted-foreground">XP</div>
                                                        <div className="font-bold text-primary">{member.xp.toLocaleString()}</div>
                                                    </div>
                                                    <div className="text-right">
                                                        <div className="text-sm text-muted-foreground">Coins</div>
                                                        <div className="font-bold text-yellow-600">{member.coins.toLocaleString()}</div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Guild Quests Tab */}
                    <TabsContent value="quests" className="space-y-4">
                        {/* Active Quests List */}
                        {guildQuests.length === 0 ? (
                            <Card>
                                <CardContent className="py-12 text-center text-muted-foreground">
                                    No active guild quests at the moment
                                </CardContent>
                            </Card>
                        ) : (
                            guildQuests.map((quest: any) => (
                                <Card key={quest.id} className="overflow-hidden">
                                    <CardHeader>
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <CardTitle className="flex items-center gap-2">
                                                    <Trophy className="h-5 w-5 text-yellow-500" />
                                                    {quest.title}
                                                </CardTitle>
                                                <CardDescription>{quest.description}</CardDescription>
                                            </div>
                                            <Badge variant={quest.status === "completed" ? "default" : "outline"} className="gap-1">
                                                {quest.status === "completed" ? (
                                                    <>
                                                        <CheckCircle2 className="h-3 w-3" />
                                                        Completed
                                                    </>
                                                ) : (
                                                    <>
                                                        <Clock className="h-3 w-3" />
                                                        {new Date(quest.expiresAt).toLocaleDateString()}
                                                    </>
                                                )}
                                            </Badge>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div>
                                            <div className="flex justify-between text-sm mb-2">
                                                <span>Progress: {quest.currentValue}/{quest.targetValue}</span>
                                                <span className="text-muted-foreground">
                                                    {Math.round((quest.currentValue / quest.targetValue) * 100)}%
                                                </span>
                                            </div>
                                            <Progress
                                                value={(quest.currentValue / quest.targetValue) * 100}
                                                className="h-2"
                                            />
                                        </div>

                                        <div className="flex items-center justify-between">
                                            <div className="flex gap-4 text-sm">
                                                <div className="flex items-center gap-1">
                                                    <Zap className="h-4 w-4 text-yellow-500" />
                                                    <span>{quest.rewardXP} XP</span>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <Coins className="h-4 w-4 text-yellow-600" />
                                                    <span>{quest.rewardCoins} Coins</span>
                                                </div>
                                            </div>
                                            <Badge variant="secondary" className="text-xs">
                                                {quest.type.replace('_', ' ').toUpperCase()}
                                            </Badge>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))
                        )}
                    </TabsContent>

                    {/* Perks Tab */}
                    <TabsContent value="perks" className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Star className="h-5 w-5 text-yellow-500" />
                                    Guild Perk Shop
                                </CardTitle>
                                <CardDescription>
                                    Purchase permanent upgrades for your guild (President only)
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="grid gap-4 md:grid-cols-2">
                                    {perksCatalog.map((perk: any) => {
                                        const isActive = activePerks.some((ap: any) => ap.id === perk.id);
                                        const isPresident = userGuild?.leaderId === user?.id;

                                        return (
                                            <div
                                                key={perk.id}
                                                className={`p-4 rounded-lg border ${isActive
                                                    ? "border-green-500/50 bg-green-500/10"
                                                    : "border-border bg-card"
                                                    }`}
                                            >
                                                <div className="flex items-start justify-between mb-3">
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <h3 className="font-bold">{perk.name}</h3>
                                                            {isActive && (
                                                                <CheckCircle2 className="h-4 w-4 text-green-500" />
                                                            )}
                                                        </div>
                                                        <p className="text-sm text-muted-foreground">{perk.description}</p>
                                                    </div>
                                                </div>

                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-2">
                                                        <Coins className="h-4 w-4 text-yellow-600" />
                                                        <span className="font-bold">{perk.cost}</span>
                                                        <span className="text-xs text-muted-foreground">treasury</span>
                                                    </div>

                                                    {isActive ? (
                                                        <Badge variant="default">Purchased</Badge>
                                                    ) : isPresident ? (
                                                        <Button
                                                            size="sm"
                                                            onClick={() => purchasePerkMutation.mutate(perk.id)}
                                                            disabled={
                                                                purchasePerkMutation.isPending ||
                                                                (treasuryData?.treasury || 0) < perk.cost
                                                            }
                                                        >
                                                            Purchase
                                                        </Button>
                                                    ) : (
                                                        <Badge variant="outline">
                                                            <Lock className="h-3 w-3 mr-1" />
                                                            President Only
                                                        </Badge>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Treasury Tab */}
                    <TabsContent value="treasury" className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Coins className="h-5 w-5 text-yellow-600" />
                                    Guild Treasury
                                </CardTitle>
                                <CardDescription>
                                    Donate coins to help your guild purchase perks
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                {/* Donation Form */}
                                <div className="p-4 rounded-lg border border-primary/20 bg-primary/5">
                                    <h3 className="font-bold mb-3">Make a Donation</h3>
                                    <div className="flex gap-2">
                                        <Input
                                            type="number"
                                            placeholder="Amount"
                                            min="1"
                                            id="donationAmount"
                                            className="flex-1"
                                        />
                                        <Button
                                            onClick={() => {
                                                const input = document.getElementById('donationAmount') as HTMLInputElement;
                                                const amount = parseInt(input.value);
                                                if (amount > 0) {
                                                    donateMutation.mutate(amount);
                                                    input.value = '';
                                                }
                                            }}
                                            disabled={donateMutation.isPending}
                                        >
                                            Donate
                                        </Button>
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-2">
                                        Your coins: {user?.coins || 0}
                                    </p>
                                </div>

                                {/* Donation Leaderboard */}
                                <div>
                                    <h3 className="font-bold mb-3">Top Donors</h3>
                                    {donations.length === 0 ? (
                                        <div className="text-center py-8 text-muted-foreground">
                                            No donations yet. Be the first to contribute!
                                        </div>
                                    ) : (
                                        <div className="space-y-2">
                                            {donations
                                                .reduce((acc: any[], donation: any) => {
                                                    const existing = acc.find(d => d.userId === donation.userId);
                                                    if (existing) {
                                                        existing.amount += donation.amount;
                                                    } else {
                                                        acc.push({ ...donation });
                                                    }
                                                    return acc;
                                                }, [])
                                                .sort((a: any, b: any) => b.amount - a.amount)
                                                .slice(0, 10)
                                                .map((donor: any, index: number) => (
                                                    <div
                                                        key={donor.userId}
                                                        className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            <div className={`text-lg font-bold ${index === 0 ? "text-yellow-500" :
                                                                index === 1 ? "text-gray-400" :
                                                                    index === 2 ? "text-orange-600" :
                                                                        "text-muted-foreground"
                                                                }`}>
                                                                #{index + 1}
                                                            </div>
                                                            <span className="font-medium">{donor.userName}</span>
                                                        </div>
                                                        <div className="flex items-center gap-1">
                                                            <Coins className="h-4 w-4 text-yellow-600" />
                                                            <span className="font-bold">{donor.amount.toLocaleString()}</span>
                                                        </div>
                                                    </div>
                                                ))}
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Chat Tab */}
                    <TabsContent value="chat" className="space-y-4">
                        <Card className="h-[500px] flex flex-col">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <MessageSquare className="h-5 w-5" />
                                    Guild Chat
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="flex-1 flex flex-col overflow-hidden">
                                <div className="flex-1 overflow-y-auto space-y-3 mb-4 pr-2">
                                    <AnimatePresence>
                                        {messages.map((msg) => (
                                            <motion.div
                                                key={msg.id}
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                className={`p-3 rounded-lg ${msg.type === 'system'
                                                    ? 'bg-blue-500/10 border border-blue-500/20'
                                                    : msg.type === 'achievement'
                                                        ? 'bg-yellow-500/10 border border-yellow-500/20'
                                                        : 'bg-muted'
                                                    }`}
                                            >
                                                <div className="flex items-start gap-2">
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <span className="font-semibold text-sm">{msg.userName}</span>
                                                            <span className="text-xs text-muted-foreground">
                                                                {new Date(msg.createdAt).toLocaleTimeString()}
                                                            </span>
                                                        </div>
                                                        <p className="text-sm">{msg.message}</p>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </AnimatePresence>
                                </div>

                                <div className="flex gap-2">
                                    <Input
                                        placeholder="Type a message..."
                                        value={newMessage}
                                        onChange={(e) => setNewMessage(e.target.value)}
                                        onKeyPress={(e) => {
                                            if (e.key === 'Enter' && newMessage.trim()) {
                                                sendMessageMutation.mutate(newMessage);
                                            }
                                        }}
                                        className="flex-1"
                                    />
                                    <Button
                                        size="icon"
                                        onClick={() => newMessage.trim() && sendMessageMutation.mutate(newMessage)}
                                        disabled={!newMessage.trim() || sendMessageMutation.isPending}
                                    >
                                        <Send className="h-4 w-4" />
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}
