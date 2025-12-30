import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { User, Activity } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { RankBadge } from "@/components/rank-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar, Flame, Trophy, TrendingUp, Edit, Settings, Sparkles, Shield, Award } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { formatDistanceToNow } from "date-fns";
import { EditProfileDialog } from "@/components/edit-profile-dialog";
import { SettingsDialog } from "@/components/settings-dialog";
import { motion } from "framer-motion";
import { useParams } from "wouter";
import { PremiumBenefitsDialog } from "@/components/premium-benefits-dialog";

export default function ProfilePage() {
    const { user: firebaseUser } = useAuth();
    const [editProfileOpen, setEditProfileOpen] = useState(false);
    const [settingsOpen, setSettingsOpen] = useState(false);
    const [premiumDialogOpen, setPremiumDialogOpen] = useState(false);
    const params = useParams<{ id?: string }>(); // Get ID from params
    const viewUserId = params.id;

    // Determine if we are viewing our own profile
    // Note: firebaseUser.uid is the firebase auth ID, but our user object uses a different ID. 
    // We'll rely on the fetched user data to compare IDs or just checks if viewUserId is present.
    // Ideally, we fetch /api/user to get our own ID first if we want strict comparison, 
    // but simply: if viewUserId exists, we are likely viewing someone else (or ourselves via public link).
    // Let's assume if viewUserId is present, we treat it as "view mode" initially, 
    // but if the fetched public profile ID matches our own ID (from /api/user context), we could enable edit.
    // For simplicity: If viewUserId is set, use public endpoint. If not, use private endpoint.

    const isOwnProfile = !viewUserId;

    const { data: user, isLoading: userLoading } = useQuery<User>({
        queryKey: isOwnProfile ? ["/api/user"] : [`/api/users/${viewUserId}/public`],
        enabled: isOwnProfile || !!viewUserId
    });

    const { data: activities = [], isLoading: activitiesLoading } = useQuery<Activity[]>({
        queryKey: ["/api/activities"],
        queryFn: async () => {
            const res = await apiRequest("GET", "/api/activities");
            return res.json();
        },
        enabled: isOwnProfile // Only fetch activities for own profile for now
    });

    if (userLoading || !user) {
        return (
            <div className="space-y-6">
                <Skeleton className="h-48 w-full" />
                <div className="grid md:grid-cols-2 gap-6">
                    <Skeleton className="h-64" />
                    <Skeleton className="h-64" />
                </div>
            </div>
        );
    }

    const joinedDaysAgo = user.createdAt
        ? Math.floor((Date.now() - new Date(user.createdAt).getTime()) / (1000 * 60 * 60 * 24))
        : 0;

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
        hidden: { y: 20, opacity: 0 },
        show: { y: 0, opacity: 1 }
    };

    return (
        <div className="relative min-h-screen overflow-hidden">
            {/* Animated Background */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-background" />
                <motion.div
                    animate={{
                        scale: [1, 1.2, 1],
                        opacity: [0.15, 0.25, 0.15],
                        rotate: [0, 90, 0]
                    }}
                    transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
                    className="absolute -top-1/2 -left-1/2 w-full h-full bg-gradient-to-br from-emerald-500/30 to-green-600/30 rounded-full blur-[120px]"
                />
                <motion.div
                    animate={{
                        scale: [1, 1.3, 1],
                        opacity: [0.15, 0.25, 0.15],
                        rotate: [0, -90, 0]
                    }}
                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                    className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-gradient-to-tl from-teal-500/30 to-cyan-600/30 rounded-full blur-[120px]"
                />
                <motion.div
                    animate={{
                        y: [0, -30, 0],
                        opacity: [0.1, 0.2, 0.1]
                    }}
                    transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-br from-emerald-400/20 to-green-500/20 rounded-full blur-[100px]"
                />
            </div>

            <motion.div
                variants={container}
                initial="hidden"
                animate="show"
                className="relative z-10 space-y-6 p-6"
                data-testid="page-profile"
            >
                <motion.div variants={item}>
                    <h1 className="text-4xl font-display font-bold mb-2 bg-gradient-to-r from-emerald-400 to-green-600 bg-clip-text text-transparent">
                        Profile
                    </h1>
                    <p className="text-muted-foreground flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-emerald-500" />
                        Your ascension journey
                    </p>
                </motion.div>

                {/* Profile Header */}
                <motion.div variants={item}>
                    <Card className="border-emerald-500/20 bg-black/40 backdrop-blur-xl overflow-hidden relative group">
                        <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 to-green-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                        <CardContent className="pt-6 relative">
                            <div className="flex flex-col md:flex-row md:items-center gap-6">
                                <motion.div
                                    whileHover={{ scale: 1.05, rotate: 5 }}
                                    transition={{ type: "spring", stiffness: 300 }}
                                >
                                    <Avatar className="h-24 w-24 ring-4 ring-emerald-500/30 shadow-lg shadow-emerald-500/20">
                                        <AvatarImage src={firebaseUser?.photoURL || user.avatarUrl || undefined} />
                                        <AvatarFallback className="text-3xl bg-gradient-to-br from-emerald-500 to-green-600 text-white">
                                            {user.name.charAt(0)}
                                        </AvatarFallback>
                                    </Avatar>
                                </motion.div>

                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                        <motion.h2
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            className="text-2xl font-bold"
                                            data-testid="text-username"
                                        >
                                            {user.name}
                                        </motion.h2>
                                        {user.isPremium && (
                                            <Badge className="bg-gradient-to-r from-yellow-400 to-amber-600 text-black font-bold animate-pulse">
                                                PREMIUM
                                            </Badge>
                                        )}
                                        {user.role === "admin" && (
                                            <Badge variant="secondary" className="bg-red-500/20 text-red-500 border-red-500/30">
                                                ADMIN
                                            </Badge>
                                        )}
                                    </div>
                                    <motion.p
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: 0.1 }}
                                        className="text-muted-foreground mb-4"
                                        data-testid="text-email"
                                    >
                                        {user.email}
                                    </motion.p>

                                    <div className="flex flex-wrap gap-4">
                                        <motion.div
                                            whileHover={{ scale: 1.05 }}
                                            className="flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10"
                                        >
                                            <Calendar className="h-4 w-4 text-emerald-500" />
                                            <span className="text-sm">
                                                Joined {joinedDaysAgo} days ago
                                            </span>
                                        </motion.div>
                                        <motion.div
                                            whileHover={{ scale: 1.05 }}
                                            className="flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/20"
                                        >
                                            <Flame className="h-4 w-4 text-orange-500" />
                                            <span className="text-sm font-medium">
                                                {user.streak} day streak
                                            </span>
                                        </motion.div>
                                    </div>
                                    <div className="flex flex-wrap gap-4 mt-2">
                                        {user.activeTitle && (
                                            <motion.div
                                                whileHover={{ scale: 1.05 }}
                                                className="flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20"
                                            >
                                                <Shield className="h-4 w-4 text-blue-500" />
                                                <span className="text-sm font-medium text-blue-500">
                                                    {user.activeTitle}
                                                </span>
                                            </motion.div>
                                        )}
                                        {user.activeBadgeId && (
                                            <motion.div
                                                whileHover={{ scale: 1.05 }}
                                                className="flex items-center gap-2 px-3 py-1 rounded-full bg-yellow-500/10 border border-yellow-500/20"
                                            >
                                                <Award className="h-4 w-4 text-yellow-500" />
                                                <span className="text-sm font-medium text-yellow-500">
                                                    Badge Equipped
                                                </span>
                                            </motion.div>
                                        )}
                                    </div>
                                </div>

                                <div className="flex flex-col gap-2">
                                    <RankBadge tier={user.tier as any} level={user.level} size="lg" />
                                    <div className="flex gap-2">
                                        {isOwnProfile && (
                                            <>
                                                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => setEditProfileOpen(true)}
                                                        className="border-emerald-500/30 hover:bg-emerald-500/10 hover:border-emerald-500/50"
                                                    >
                                                        <Edit className="h-4 w-4 mr-2" /> Edit
                                                    </Button>
                                                </motion.div>
                                                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => setSettingsOpen(true)}
                                                        className="hover:bg-emerald-500/10"
                                                    >
                                                        <Settings className="h-4 w-4" />
                                                    </Button>
                                                </motion.div>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>

                {/* Premium Membership Card (Visible to self or if admin is viewing another) */}
                {(isOwnProfile || (firebaseUser && (user as any).role === "admin")) && (
                    <motion.div variants={item}>
                        <Card className="border-yellow-500/30 bg-gradient-to-br from-yellow-500/5 to-transparent backdrop-blur-xl relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                <Trophy className="h-24 w-24 text-yellow-500" />
                            </div>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-yellow-500">
                                    <Award className="h-5 w-5" />
                                    Premium Membership
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {user.isPremium ? (
                                    <div>
                                        <p className="text-lg font-semibold text-emerald-400 flex items-center gap-2">
                                            Status: Active (₹99 Pass)
                                        </p>
                                        {user.premiumExpiry && (
                                            <p className="text-sm text-muted-foreground">
                                                Expires: {new Date(user.premiumExpiry).toLocaleDateString()}
                                            </p>
                                        )}
                                        <div className="mt-4 grid md:grid-cols-2 gap-2 text-sm">
                                            <div className="flex items-center gap-2">✓ 3x XP & Coin Rewards</div>
                                            <div className="flex items-center gap-2">✓ Legendary Shop Access</div>
                                            <div className="flex items-center gap-2">✓ Exclusive Focus Worlds</div>
                                            <div className="flex items-center gap-2">✓ Priority Guild Features</div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                                        <div>
                                            <p className="text-lg font-medium">Ascend to Premium for only ₹99/month</p>
                                            <p className="text-sm text-muted-foreground">Unlock triple progression and exclusive content.</p>
                                        </div>
                                        <Button
                                            className="bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-600 hover:to-amber-700 text-black font-bold whitespace-nowrap"
                                            onClick={() => setPremiumDialogOpen(true)}
                                        >
                                            Activate Premium
                                        </Button>
                                    </div>
                                )}

                                {/* Admin Section */}
                                {isOwnProfile && user.role === "admin" && (
                                    <div className="mt-6 pt-6 border-t border-white/10">
                                        <p className="text-sm font-bold text-red-500 mb-4 flex items-center gap-2">
                                            <Shield className="h-4 w-4" /> Admin Controls
                                        </p>
                                        <div className="flex flex-col sm:flex-row gap-2">
                                            <input
                                                id="targetUserId"
                                                placeholder="Enter User UUID to Activate"
                                                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                                            />
                                            <Button
                                                variant="destructive"
                                                onClick={async () => {
                                                    const userId = (document.getElementById("targetUserId") as HTMLInputElement).value;
                                                    if (!userId) {
                                                        alert("Please enter a User ID");
                                                        return;
                                                    }
                                                    try {
                                                        const res = await apiRequest("POST", "/api/subscription/admin/activate", { userId });
                                                        const data = await res.json();
                                                        alert(data.message);
                                                        window.location.reload();
                                                    } catch (err: any) {
                                                        alert(err.message || "Error activating premium");
                                                    }
                                                }}
                                            >
                                                Force Activate (30 days)
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </motion.div>
                )}

                {/* Stats Overview */}
                <motion.div variants={item} className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                        { icon: Trophy, label: "Total XP", value: user.xp.toLocaleString(), color: "from-yellow-500 to-orange-500", testId: "text-profile-xp" },
                        { icon: TrendingUp, label: "Level", value: user.level, color: "from-emerald-500 to-green-600", testId: "text-profile-level" },
                        { icon: Flame, label: "Streak", value: `${user.streak} days`, color: "from-orange-500 to-red-500", testId: "text-profile-streak" },
                        { icon: Sparkles, label: "Rank", value: user.tier, color: "from-purple-500 to-pink-500", testId: "text-profile-tier" }
                    ].map((stat, index) => (
                        <motion.div
                            key={stat.label}
                            variants={item}
                            whileHover={{ y: -5, scale: 1.02 }}
                            transition={{ type: "spring", stiffness: 300 }}
                        >
                            <Card className="border-white/10 bg-black/40 backdrop-blur-xl hover:border-emerald-500/30 transition-all duration-300 group overflow-hidden relative">
                                <div className={`absolute inset-0 bg-gradient-to-br ${stat.color} opacity-0 group-hover:opacity-10 transition-opacity duration-300`} />
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                        <stat.icon className="h-4 w-4" />
                                        {stat.label}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <motion.div
                                        initial={{ scale: 0.5, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        transition={{ delay: index * 0.1 + 0.3 }}
                                        className="text-3xl font-bold font-display"
                                        data-testid={stat.testId}
                                    >
                                        {stat.value}
                                    </motion.div>
                                </CardContent>
                            </Card>
                        </motion.div>
                    ))}
                </motion.div>

                {/* Activity History */}
                <motion.div variants={item}>
                    <Card className="border-emerald-500/20 bg-black/40 backdrop-blur-xl">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Sparkles className="h-5 w-5 text-emerald-500" />
                                Recent Activity
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {activitiesLoading ? (
                                <div className="space-y-4">
                                    {[1, 2, 3].map((i) => (
                                        <Skeleton key={i} className="h-16" />
                                    ))}
                                </div>
                            ) : !activities || activities.length === 0 ? (
                                <div className="text-center py-8">
                                    <p className="text-muted-foreground">No activity yet</p>
                                    <p className="text-sm text-muted-foreground mt-1">
                                        Complete quests to see your activity history
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {activities.slice(0, 10).map((activity, index) => (
                                        <motion.div
                                            key={activity.id}
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: index * 0.05 }}
                                            whileHover={{ x: 5, scale: 1.01 }}
                                            className="flex items-center justify-between p-4 rounded-lg bg-white/5 border border-white/10 hover:border-emerald-500/30 transition-all duration-300"
                                            data-testid={`activity-${activity.id}`}
                                        >
                                            <div className="flex-1">
                                                <p className="font-medium capitalize">
                                                    {activity.action.replace(/([A-Z])/g, ' $1').trim()}
                                                </p>
                                                <p className="text-sm text-muted-foreground">
                                                    {activity.timestamp && formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                                                </p>
                                            </div>

                                            <div className="flex items-center gap-2">
                                                {activity.xpDelta > 0 && (
                                                    <Badge variant="outline" className="gap-1 border-yellow-500/30 bg-yellow-500/10">
                                                        <Trophy className="h-3 w-3 text-yellow-500" />
                                                        +{activity.xpDelta} XP
                                                    </Badge>
                                                )}

                                                {activity.statDeltas && Object.keys(activity.statDeltas).length > 0 && (
                                                    <Badge variant="outline" className="gap-1 border-emerald-500/30 bg-emerald-500/10">
                                                        <TrendingUp className="h-3 w-3 text-emerald-500" />
                                                        Stats +{Object.values(activity.statDeltas).reduce((a, b) => a + b, 0)}
                                                    </Badge>
                                                )}
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </motion.div>
            </motion.div>

            {/* Dialogs */}
            <EditProfileDialog
                open={editProfileOpen}
                onOpenChange={setEditProfileOpen}
                user={user}
            />
            <SettingsDialog
                open={settingsOpen}
                onOpenChange={setSettingsOpen}
            />
            <PremiumBenefitsDialog
                open={premiumDialogOpen}
                onOpenChange={setPremiumDialogOpen}
            />
        </div>
    );
}
