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
            case 0: return <Crown className="h-4 w-4 md:h-6 md:w-6 text-yellow-500 fill-yellow-500" />;
            case 1: return <Medal className="h-4 w-4 md:h-6 md:w-6 text-gray-400 fill-gray-400" />;
            case 2: return <Medal className="h-4 w-4 md:h-6 md:w-6 text-amber-700 fill-amber-700" />;
            default: return <span className="text-sm md:text-lg font-bold text-muted-foreground w-6 text-center">{index + 1}</span>;
        }
    };

    return (
        <div className="p-4 md:p-8 min-h-screen bg-background/50" data-tour="leaderboard-page">
            <motion.div
                variants={container}
                initial="hidden"
                animate="show"
                className="max-w-4xl mx-auto space-y-4 md:space-y-8"
            >
                <div className="text-center mb-6 md:mb-12">
                    <motion.h1
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-2xl md:text-4xl font-bold bg-gradient-to-r from-yellow-500 via-amber-500 to-orange-500 bg-clip-text text-transparent flex items-center justify-center gap-2 md:gap-3"
                    >
                        <Trophy className="h-6 w-6 md:h-10 md:w-10 text-yellow-500" /> Global Rankings
                    </motion.h1>
                    <p className="text-muted-foreground mt-2 text-sm md:text-base px-4">
                        The most ascended individuals in the protocol.
                    </p>
                </div>

                <Card className="border-white/10 bg-black/40 backdrop-blur-xl">
                    <CardHeader className="p-4 md:p-6">
                        <CardTitle className="text-yellow-500 text-lg md:text-xl">Top Ascendants</CardTitle>
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
                    flex items-center p-3 md:p-4 transition-colors cursor-pointer gap-2 md:gap-0
                    ${currentUser?.uid === user.firebaseUid ? "bg-yellow-500/10 border-l-2 border-yellow-500" : ""}
                  `}
                                >
                                    <div className="flex items-center justify-center w-8 md:w-12 mr-2 md:mr-4 flex-shrink-0">
                                        {getRankIcon(index)}
                                    </div>

                                    <Avatar className={`h-8 w-8 md:h-10 md:w-10 mr-2 md:mr-4 flex-shrink-0 border ${user.isPremium ? 'ring-2 md:ring-4 ring-yellow-500/50 shadow-lg shadow-yellow-500/30 border-yellow-500/50' : 'border-white/10'}`}>
                                        <AvatarImage src={user.avatarUrl || undefined} />
                                        <AvatarFallback className="bg-yellow-500/20 text-yellow-500 font-bold text-xs md:text-sm">
                                            {user.name.charAt(0)}
                                        </AvatarFallback>
                                    </Avatar>

                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-1 md:gap-2 flex-wrap">
                                            <h3 className="font-bold text-sm md:text-lg hover:underline truncate">{user.name}</h3>
                                            {user.isPremium && (
                                                <Crown className="h-3 w-3 md:h-4 md:w-4 text-yellow-500 fill-yellow-500 flex-shrink-0" />
                                            )}
                                            {currentUser?.uid === user.firebaseUid && (
                                                <Badge variant="secondary" className="text-xs bg-yellow-500/20 text-yellow-500 hover:bg-yellow-500/30">You</Badge>
                                            )}
                                        </div>
                                        <p className="text-xs md:text-sm text-muted-foreground truncate">Level {user.level} • Rank {user.tier}</p>
                                    </div>

                                    <div className="text-right flex-shrink-0">
                                        <div className="font-bold text-sm md:text-xl text-yellow-500 whitespace-nowrap">{user.xp.toLocaleString()} XP</div>
                                        <div className="text-xs text-muted-foreground flex items-center justify-end gap-1">
                                            <TrendingUp className="h-3 w-3" /> {user.streak}d
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
