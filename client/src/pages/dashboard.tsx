import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RankBadge } from "@/components/rank-badge";
import { XPProgress } from "@/components/xp-progress";
import { StatBar } from "@/components/stat-bar";
import { QuestCard } from "@/components/quest-card";
import { User, Quest, STAT_NAMES } from "@shared/schema";
import { Flame, Target } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function Dashboard() {
  const { data: user, isLoading: userLoading } = useQuery<User>({
    queryKey: ["/api/user"],
  });

  const { data: quests, isLoading: questsLoading } = useQuery<Quest[]>({
    queryKey: ["/api/quests"],
  });

  const activeQuests = quests?.filter(q => !q.completed) || [];
  const completedToday = quests?.filter(q => q.completed) || [];

  if (userLoading || !user) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-32 w-full" />
        <div className="grid md:grid-cols-2 gap-6">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="page-dashboard">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <div>
          <h1 className="text-4xl font-display font-bold mb-2">
            Welcome back, {user.name}
          </h1>
          <p className="text-muted-foreground">
            Continue your ascension journey
          </p>
        </div>
        
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 px-4 py-2 bg-card rounded-lg border border-card-border">
            <Flame className="h-5 w-5 text-orange-500" />
            <div>
              <p className="text-xs text-muted-foreground">Streak</p>
              <p className="text-lg font-bold" data-testid="text-streak">{user.streak} days</p>
            </div>
          </div>
          
          <RankBadge tier={user.tier} level={user.level} />
        </div>
      </div>

      {/* XP Progress */}
      <Card>
        <CardContent className="pt-6">
          <XPProgress xp={user.xp} tier={user.tier} />
        </CardContent>
      </Card>

      {/* Main Grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Stats Panel */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Your Stats</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {STAT_NAMES.map((stat) => (
              <StatBar
                key={stat}
                name={stat}
                value={user[stat]}
                max={100}
              />
            ))}
          </CardContent>
        </Card>

        {/* Quests Panel */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Active Quests
                </CardTitle>
                <span className="text-sm text-muted-foreground">
                  {completedToday.length} completed today
                </span>
              </div>
            </CardHeader>
            <CardContent>
              {questsLoading ? (
                <div className="grid gap-4">
                  <Skeleton className="h-48" />
                  <Skeleton className="h-48" />
                </div>
              ) : activeQuests.length === 0 ? (
                <div className="text-center py-12">
                  <Target className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">
                    No active quests. New quests will be assigned tomorrow!
                  </p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {activeQuests.slice(0, 3).map((quest) => (
                    <QuestCard key={quest.id} quest={quest} />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
