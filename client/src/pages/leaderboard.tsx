import { useQuery } from "@tanstack/react-query";
import { User } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RankBadge } from "@/components/rank-badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Trophy, Medal, Award } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";

export default function LeaderboardPage() {
  const { user: currentUser } = useAuth();
  
  const { data: leaderboard, isLoading } = useQuery<User[]>({
    queryKey: ["/api/leaderboard"],
  });

  const { data: userData } = useQuery<User>({
    queryKey: ["/api/user"],
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-64" />
        <div className="grid md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  const topThree = leaderboard?.slice(0, 3) || [];
  const restOfLeaderboard = leaderboard?.slice(3) || [];
  
  const currentUserRank = leaderboard?.findIndex(
    (user) => user.firebaseUid === currentUser?.uid
  );
  const userRankPosition = currentUserRank !== undefined && currentUserRank >= 0 
    ? currentUserRank + 1 
    : null;

  const podiumOrder = [topThree[1], topThree[0], topThree[2]]; // 2nd, 1st, 3rd

  return (
    <div className="space-y-6" data-testid="page-leaderboard">
      <div>
        <h1 className="text-4xl font-display font-bold mb-2">Leaderboard</h1>
        <p className="text-muted-foreground">
          Compete with Ascendants worldwide
        </p>
      </div>

      {/* User's Rank */}
      {userData && userRankPosition && (
        <Card className="border-primary/50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="text-3xl font-bold text-primary">
                  #{userRankPosition}
                </div>
                <Avatar className="h-12 w-12">
                  <AvatarImage src={currentUser?.photoURL || undefined} />
                  <AvatarFallback>{userData.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold">Your Rank</p>
                  <p className="text-sm text-muted-foreground">
                    {userData.xp.toLocaleString()} XP
                  </p>
                </div>
              </div>
              <RankBadge tier={userData.tier} level={userData.level} size="sm" showLevel={false} />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Top 3 Podium */}
      {topThree.length > 0 && (
        <div>
          <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
            <Trophy className="h-6 w-6 text-yellow-500" />
            Top Ascendants
          </h2>
          <div className="grid md:grid-cols-3 gap-4">
            {podiumOrder.map((user, index) => {
              if (!user) return null;
              const actualPosition = index === 0 ? 2 : index === 1 ? 1 : 3;
              const heights = ["md:h-40", "md:h-52", "md:h-32"];
              const medals = [Medal, Trophy, Award];
              const MedalIcon = medals[index];
              const colors = ["text-slate-400", "text-yellow-500", "text-amber-600"];
              
              return (
                <Card 
                  key={user.id} 
                  className={cn(
                    "relative overflow-hidden",
                    actualPosition === 1 && "border-yellow-500/50 shadow-lg shadow-yellow-500/20"
                  )}
                >
                  <div className={cn(
                    "flex flex-col items-center justify-end p-6 transition-all",
                    heights[index]
                  )}>
                    <div className="absolute top-4 right-4">
                      <MedalIcon className={cn("h-8 w-8", colors[index])} />
                    </div>
                    
                    <Avatar className="h-20 w-20 mb-4 ring-4 ring-background">
                      <AvatarImage src={user.avatarUrl || undefined} />
                      <AvatarFallback className="text-2xl">
                        {user.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    
                    <Badge className="mb-2" data-testid={`badge-position-${actualPosition}`}>
                      #{actualPosition}
                    </Badge>
                    
                    <h3 className="font-semibold text-lg text-center mb-1" data-testid={`text-username-${actualPosition}`}>
                      {user.name}
                    </h3>
                    
                    <p className="text-sm text-muted-foreground mb-3" data-testid={`text-xp-${actualPosition}`}>
                      {user.xp.toLocaleString()} XP
                    </p>
                    
                    <RankBadge 
                      tier={user.tier} 
                      level={user.level} 
                      size="sm"
                      showLevel={false}
                    />
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Rest of Leaderboard */}
      {restOfLeaderboard.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Rankings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {restOfLeaderboard.map((user, index) => {
                const position = index + 4;
                const isCurrentUser = user.firebaseUid === currentUser?.uid;
                
                return (
                  <div
                    key={user.id}
                    className={cn(
                      "flex items-center gap-4 p-4 rounded-lg transition-colors hover-elevate",
                      isCurrentUser && "bg-primary/10 border border-primary/20"
                    )}
                    data-testid={`row-user-${position}`}
                  >
                    <div className="w-8 text-center font-semibold text-muted-foreground">
                      #{position}
                    </div>
                    
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={user.avatarUrl || undefined} />
                      <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{user.name}</p>
                      <p className="text-sm text-muted-foreground">
                        Level {user.level}
                      </p>
                    </div>
                    
                    <div className="text-right">
                      <p className="font-semibold">{user.xp.toLocaleString()} XP</p>
                    </div>
                    
                    <RankBadge 
                      tier={user.tier} 
                      level={user.level} 
                      size="sm"
                      showLevel={false}
                    />
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {!leaderboard || leaderboard.length === 0 && (
        <div className="text-center py-12">
          <Trophy className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-xl font-semibold mb-2">No rankings yet</h3>
          <p className="text-muted-foreground">
            Be the first to complete quests and climb the leaderboard!
          </p>
        </div>
      )}
    </div>
  );
}
