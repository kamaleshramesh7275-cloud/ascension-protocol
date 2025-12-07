import { useQuery } from "@tanstack/react-query";
import { User } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { Trophy, Medal, Crown, TrendingUp } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

export default function LeaderboardPage() {
    const { user: currentUser } = useAuth();
    const { data: leaderboard } = useQuery<User[]>({
        queryKey: ["/api/leaderboard"],
    });

    const container = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: {
                staggerChildren: 0.05
            }
        }
    };

    const item = {
        hidden: { y: 20, opacity: 0 },
        show: { y: 0, opacity: 1 }
    };

    const getRankIcon = (index: number) => {
        switch (index) {
            case 0: return <Crown className="h-6 w-6 text-yellow-500 fill-yellow-500" />;
            case 1: return <Medal className="h-6 w-6 text-gray-400 fill-gray-400" />;
            case 2: return <Medal className="h-6 w-6 text-amber-700 fill-amber-700" />;
            default: return <span className="text-lg font-bold text-muted-foreground w-6 text-center">{index + 1}</span>;
        }
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
                        className="text-4xl font-bold bg-gradient-to-r from-yellow-500 via-amber-500 to-orange-500 bg-clip-text text-transparent flex items-center justify-center gap-3"
                    >
                        <Trophy className="h-10 w-10 text-yellow-500" /> Global Rankings
                    </motion.h1>
                    <p className="text-muted-foreground mt-2">
                        The most ascended individuals in the protocol.
                    </p>
                </div>

                <Card className="border-white/10 bg-black/40 backdrop-blur-xl">
                    <CardHeader>
                        <CardTitle className="text-yellow-500">Top Ascendants</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="divide-y divide-white/10">
                            {leaderboard?.map((user, index) => (
                                <motion.div
                                    key={user.id}
                                    variants={item}
                                    whileHover={{ backgroundColor: "rgba(234, 179, 8, 0.05)" }}
                                    onClick={() => window.location.href = `/profile/${user.id}`}
                                    className={`
                    flex items-center p-4 transition-colors cursor-pointer
                    ${currentUser?.uid === user.firebaseUid ? "bg-yellow-500/10 border-l-2 border-yellow-500" : ""}
                  `}
                                >
                                    <div className="flex items-center justify-center w-12 mr-4">
                                        {getRankIcon(index)}
                                    </div>

                                    <Avatar className="h-10 w-10 mr-4 border border-white/10">
                                        <AvatarImage src={user.avatarUrl || undefined} />
                                        <AvatarFallback className="bg-yellow-500/20 text-yellow-500 font-bold">
                                            {user.name.charAt(0)}
                                        </AvatarFallback>
                                    </Avatar>

                                    <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                            <h3 className="font-bold text-lg hover:underline">{user.name}</h3>
                                            {currentUser?.uid === user.firebaseUid && (
                                                <Badge variant="secondary" className="text-xs bg-yellow-500/20 text-yellow-500 hover:bg-yellow-500/30">You</Badge>
                                            )}
                                        </div>
                                        <p className="text-sm text-muted-foreground">Level {user.level} • Rank {user.tier}</p>
                                    </div>

                                    <div className="text-right">
                                        <div className="font-bold text-xl text-yellow-500">{user.xp.toLocaleString()} XP</div>
                                        <div className="text-xs text-muted-foreground flex items-center justify-end gap-1">
                                            <TrendingUp className="h-3 w-3" /> {user.streak} Day Streak
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </motion.div>
        </div>
    );
}
