import { useQuery } from "@tanstack/react-query";
import { User, Activity } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { RankBadge } from "@/components/rank-badge";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar, Flame, Trophy, TrendingUp } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { formatDistanceToNow } from "date-fns";

export default function ProfilePage() {
  const { user: firebaseUser } = useAuth();
  
  const { data: user, isLoading: userLoading } = useQuery<User>({
    queryKey: ["/api/user"],
  });

  const { data: activities, isLoading: activitiesLoading } = useQuery<Activity[]>({
    queryKey: ["/api/activities"],
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

  return (
    <div className="space-y-6" data-testid="page-profile">
      <div>
        <h1 className="text-4xl font-display font-bold mb-2">Profile</h1>
        <p className="text-muted-foreground">
          Your ascension journey
        </p>
      </div>

      {/* Profile Header */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row md:items-center gap-6">
            <Avatar className="h-24 w-24 ring-4 ring-primary/20">
              <AvatarImage src={firebaseUser?.photoURL || user.avatarUrl || undefined} />
              <AvatarFallback className="text-3xl">
                {user.name.charAt(0)}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1">
              <h2 className="text-2xl font-bold mb-1" data-testid="text-username">{user.name}</h2>
              <p className="text-muted-foreground mb-4" data-testid="text-email">{user.email}</p>
              
              <div className="flex flex-wrap gap-4">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    Joined {joinedDaysAgo} days ago
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Flame className="h-4 w-4 text-orange-500" />
                  <span className="text-sm font-medium">
                    {user.streak} day streak
                  </span>
                </div>
              </div>
            </div>
            
            <RankBadge tier={user.tier} level={user.level} size="lg" />
          </div>
        </CardContent>
      </Card>

      {/* Stats Overview */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Trophy className="h-4 w-4" />
              Total XP
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold" data-testid="text-profile-xp">
              {user.xp.toLocaleString()}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Level
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold" data-testid="text-profile-level">
              {user.level}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Flame className="h-4 w-4" />
              Streak
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold" data-testid="text-profile-streak">
              {user.streak}
            </div>
            <p className="text-xs text-muted-foreground mt-1">days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Current Rank
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold font-display" data-testid="text-profile-tier">
              {user.tier}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Activity History */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
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
              {activities.slice(0, 10).map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-center justify-between p-4 rounded-lg bg-card border border-card-border hover-elevate"
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
                      <Badge variant="outline" className="gap-1">
                        <Trophy className="h-3 w-3 text-yellow-500" />
                        +{activity.xpDelta} XP
                      </Badge>
                    )}
                    
                    {activity.statDeltas && Object.keys(activity.statDeltas).length > 0 && (
                      <Badge variant="outline" className="gap-1">
                        <TrendingUp className="h-3 w-3" />
                        Stats +{Object.values(activity.statDeltas).reduce((a, b) => a + b, 0)}
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
