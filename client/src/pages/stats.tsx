import { useQuery } from "@tanstack/react-query";
import { User, STAT_NAMES } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RankBadge } from "@/components/rank-badge";
import { StatBar } from "@/components/stat-bar";
import { XPProgress } from "@/components/xp-progress";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp } from "lucide-react";

export default function StatsPage() {
  const { data: user, isLoading } = useQuery<User>({
    queryKey: ["/api/user"],
  });

  if (isLoading || !user) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-64" />
        <div className="grid lg:grid-cols-2 gap-6">
          <Skeleton className="h-96" />
          <Skeleton className="h-96" />
        </div>
      </div>
    );
  }

  const totalStats = STAT_NAMES.reduce((sum, stat) => sum + user[stat], 0);
  const averageStat = Math.round(totalStats / STAT_NAMES.length);

  return (
    <div className="space-y-6" data-testid="page-stats">
      <div>
        <h1 className="text-4xl font-display font-bold mb-2">Your Stats</h1>
        <p className="text-muted-foreground">
          Track your progress across all attributes
        </p>
      </div>

      {/* Overview Cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total XP
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold" data-testid="text-total-xp">
              {user.xp.toLocaleString()}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Level
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold" data-testid="text-user-level">
              {user.level}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Stats
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold" data-testid="text-total-stats">
              {totalStats}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Average Stat
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold" data-testid="text-average-stat">
              {averageStat}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Rank Display */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Current Rank</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center py-8">
            <RankBadge tier={user.tier} level={user.level} size="lg" />
            <div className="mt-8 w-full">
              <XPProgress xp={user.xp} tier={user.tier} />
            </div>
          </CardContent>
        </Card>

        {/* Detailed Stats */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Attribute Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {STAT_NAMES.map((stat) => (
              <div key={stat} className="space-y-2">
                <StatBar name={stat} value={user[stat]} max={100} />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span className="capitalize">{stat}</span>
                  <span>{((user[stat] / 100) * 100).toFixed(0)}% of maximum</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Stat Insights */}
      <Card>
        <CardHeader>
          <CardTitle>Insights</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="p-4 bg-card rounded-lg border border-card-border">
              <p className="text-sm text-muted-foreground mb-1">Strongest Stat</p>
              <p className="text-lg font-semibold capitalize">
                {STAT_NAMES.reduce((max, stat) => 
                  user[stat] > user[max] ? stat : max
                , STAT_NAMES[0])}
              </p>
              <p className="text-2xl font-bold text-primary">
                {Math.max(...STAT_NAMES.map(s => user[s]))}
              </p>
            </div>

            <div className="p-4 bg-card rounded-lg border border-card-border">
              <p className="text-sm text-muted-foreground mb-1">Weakest Stat</p>
              <p className="text-lg font-semibold capitalize">
                {STAT_NAMES.reduce((min, stat) => 
                  user[stat] < user[min] ? stat : min
                , STAT_NAMES[0])}
              </p>
              <p className="text-2xl font-bold text-destructive">
                {Math.min(...STAT_NAMES.map(s => user[s]))}
              </p>
            </div>

            <div className="p-4 bg-card rounded-lg border border-card-border">
              <p className="text-sm text-muted-foreground mb-1">Balance</p>
              <p className="text-lg font-semibold">Development Level</p>
              <p className="text-2xl font-bold">
                {averageStat >= 50 ? "Well Balanced" : "Room to Grow"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
