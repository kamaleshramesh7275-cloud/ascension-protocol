import { useQuery, useMutation } from "@tanstack/react-query";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RankBadge } from "@/components/rank-badge";
import { XPProgress } from "@/components/xp-progress";
import { StatBar } from "@/components/stat-bar";
import { QuestCard } from "@/components/quest-card";
import { User, Quest, Task, STAT_NAMES } from "@shared/schema";
import { Flame, Target, CheckSquare, Plus, Trash2, TrendingUp, Zap, Award, BookOpen, Calendar, Activity } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { motion } from "framer-motion";
import { Progress } from "@/components/ui/progress";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function Dashboard() {
  const { toast } = useToast();
  const { data: user, isLoading: userLoading } = useQuery<User>({
    queryKey: ["/api/user"],
  });

  const { data: quests, isLoading: questsLoading } = useQuery<Quest[]>({
    queryKey: ["/api/quests"],
  });

  const completeQuestMutation = useMutation({
    mutationFn: async (questId: string) => {
      const res = await apiRequest("POST", `/api/quests/${questId}/complete`);
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      queryClient.invalidateQueries({ queryKey: ["/api/quests"] });
      queryClient.invalidateQueries({ queryKey: ["/api/activities"] });

      toast({
        title: "Quest Completed!",
        description: `You earned ${data.quest.rewardXP} XP and ${data.quest.rewardCoins} coins!`,
        variant: "default",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to complete quest",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const activeQuests = quests?.filter(q => !q.completed) || [];
  const completedToday = quests?.filter(q => q.completed) || [];

  // To-Do List State & Mutations
  const { data: todos = [] } = useQuery<Task[]>({
    queryKey: ["/api/tasks"],
  });
  const [newTodo, setNewTodo] = useState("");

  const createTaskMutation = useMutation({
    mutationFn: async (text: string) => {
      const res = await apiRequest("POST", "/api/tasks", { text });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      setNewTodo("");
      toast({ title: "Task added" });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to add task",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const updateTaskMutation = useMutation({
    mutationFn: async ({ id, completed }: { id: string; completed: boolean }) => {
      const res = await apiRequest("PATCH", `/api/tasks/${id}`, { completed });
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/tasks"] })
  });

  const deleteTaskMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/tasks/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      toast({ title: "Task deleted" });
    }
  });

  const addTodo = () => {
    if (!newTodo.trim()) return;
    createTaskMutation.mutate(newTodo);
  };

  const toggleTodo = (id: string, currentStatus: boolean) => {
    updateTaskMutation.mutate({ id, completed: !currentStatus });
  };

  const deleteTodo = (id: string) => {
    deleteTaskMutation.mutate(id);
  };

  // Motivational quotes
  const quotes = [
    "The secret of getting ahead is getting started.",
    "Success is the sum of small efforts repeated day in and day out.",
    "Don't watch the clock; do what it does. Keep going.",
    "The future depends on what you do today.",
    "Believe you can and you're halfway there."
  ];

  const [currentQuote, setCurrentQuote] = useState(quotes[0]);

  useEffect(() => {
    const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
    setCurrentQuote(randomQuote);
  }, []);

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

  // Weekly Progress Data
  const { data: weeklyData = [] } = useQuery<{ date: string; xp: number }[]>({
    queryKey: ["/api/user/stats/weekly"],
  });

  const chartData = weeklyData.length > 0 ? weeklyData.map(d => ({
    day: d.date,
    xp: d.xp
  })) : [
    { day: 'Mon', xp: 0 },
    { day: 'Tue', xp: 0 },
    { day: 'Wed', xp: 0 },
    { day: 'Thu', xp: 0 },
    { day: 'Fri', xp: 0 },
    { day: 'Sat', xp: 0 },
    { day: 'Sun', xp: 0 },
  ];

  // Daily Goal
  const dailyGoal = 200;
  // Get today's XP from the last entry of the chart data (assuming it's today)
  // or calculate from recent activities if needed. 
  // For now, let's use the last entry of chartData which corresponds to today/active day.
  const todayXP = chartData[chartData.length - 1]?.xp || 0;
  const goalProgress = Math.min((todayXP / dailyGoal) * 100, 100);

  // Recent Activity - fetch from backend
  const { data: activities = [] } = useQuery<any[]>({
    queryKey: ["/api/activities"],
  });

  // Format activities for display (limit to 4 most recent)
  const recentActivities = activities.slice(0, 4).map((activity: any) => ({
    id: activity.id,
    action: activity.description || 'Activity',
    xp: activity.xpDelta || 0,
    time: new Date(activity.timestamp).toLocaleString('en-US', {
      hour: 'numeric',
      minute: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }));

  return (
    <div className="space-y-6" data-testid="page-dashboard">
      {/* Header Section */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-display font-bold mb-2">
            Welcome back, {user.name}
          </h1>
          <p className="text-sm md:text-base text-muted-foreground">
            Continue your ascension journey
          </p>
        </div>

        <div className="flex items-center gap-3 sm:gap-6 flex-wrap">
          <div className="flex items-center gap-2 px-3 py-2 md:px-4 bg-card rounded-lg border border-card-border">
            <Flame className="h-4 w-4 md:h-5 md:w-5 text-orange-500" />
            <div>
              <p className="text-xs text-muted-foreground">Streak</p>
              <p className="text-base md:text-lg font-bold" data-testid="text-streak">{user.streak} days</p>
            </div>
          </div>

          <RankBadge tier={user.tier as any} level={user.level} />
        </div>
      </div>

      {/* XP Progress */}
      <Card>
        <CardContent className="pt-6">
          <XPProgress xp={user.xp} tier={user.tier as any} />
        </CardContent>
      </Card>

      {/* Quick Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <Card className="hover:shadow-lg transition-all cursor-pointer border-l-4 border-l-purple-500 hover:scale-105">
          <CardContent className="pt-4 md:pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs md:text-sm text-muted-foreground">Total XP</p>
                <p className="text-xl md:text-2xl font-bold">{user.xp}</p>
              </div>
              <Zap className="h-6 w-6 md:h-8 md:w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-all cursor-pointer border-l-4 border-l-blue-500 hover:scale-105">
          <CardContent className="pt-4 md:pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs md:text-sm text-muted-foreground">Level</p>
                <p className="text-xl md:text-2xl font-bold">{user.level}</p>
              </div>
              <Award className="h-6 w-6 md:h-8 md:w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-all cursor-pointer border-l-4 border-l-green-500 hover:scale-105">
          <CardContent className="pt-4 md:pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs md:text-sm text-muted-foreground">Completed</p>
                <p className="text-xl md:text-2xl font-bold">{completedToday.length}</p>
              </div>
              <CheckSquare className="h-6 w-6 md:h-8 md:w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-all cursor-pointer border-l-4 border-l-orange-500 hover:scale-105">
          <CardContent className="pt-4 md:pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs md:text-sm text-muted-foreground">Streak</p>
                <p className="text-xl md:text-2xl font-bold">{user.streak}</p>
              </div>
              <Flame className="h-6 w-6 md:h-8 md:w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Motivational Quote */}
      <Card className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 border-purple-500/20 hover:shadow-lg transition-all hover:scale-[1.02]">
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <BookOpen className="h-6 w-6 text-purple-500 flex-shrink-0 mt-1" />
            <div>
              <p className="text-lg font-medium italic">&ldquo;{currentQuote}&rdquo;</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Weekly Progress Chart & Daily Goal */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
        {/* Weekly Progress Chart */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base md:text-lg">
              <TrendingUp className="h-4 w-4 md:h-5 md:w-5 text-blue-500" />
              Weekly Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis dataKey="day" stroke="#888" />
                <YAxis stroke="#888" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333' }}
                  labelStyle={{ color: '#fff' }}
                />
                <Line
                  type="monotone"
                  dataKey="xp"
                  stroke="#8b5cf6"
                  strokeWidth={2}
                  dot={{ fill: '#8b5cf6', r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Daily Goal Progress */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-green-500" />
              Daily Goal
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center">
              <p className="text-4xl font-bold">{todayXP} / {dailyGoal}</p>
              <p className="text-sm text-muted-foreground mt-1">XP earned today</p>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Progress</span>
                <span className="font-semibold">{goalProgress.toFixed(0)}%</span>
              </div>
              <Progress value={goalProgress} className="h-3" />
            </div>
            {goalProgress >= 100 ? (
              <p className="text-center text-green-500 font-semibold">🎉 Goal achieved!</p>
            ) : (
              <p className="text-center text-muted-foreground text-sm">
                {dailyGoal - todayXP} XP to go
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity Feed */}
      <Card className="hover:shadow-lg transition-shadow">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-purple-500" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[250px]">
            <div className="space-y-3">
              {recentActivities.map((activity, index) => (
                <div
                  key={activity.id}
                  className="flex items-start gap-3 p-3 rounded-lg hover:bg-accent transition-colors"
                >
                  <div className="p-2 rounded-full bg-purple-500/20">
                    <Zap className="h-4 w-4 text-purple-500" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{activity.action}</p>
                    <p className="text-xs text-muted-foreground">{activity.time}</p>
                  </div>
                  {activity.xp > 0 && (
                    <span className="text-sm font-bold text-purple-400">+{activity.xp} XP</span>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        {/* Stats Panel */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-base md:text-lg">Your Stats</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 md:space-y-4">
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
        <div className="lg:col-span-2 space-y-4 md:space-y-6">
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                  <Target className="h-4 w-4 md:h-5 md:w-5" />
                  Active Quests
                </CardTitle>
                <span className="text-xs md:text-sm text-muted-foreground">
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
                    <QuestCard
                      key={quest.id}
                      quest={quest}
                      onComplete={(id) => completeQuestMutation.mutate(id)}
                      isCompletingQuest={completeQuestMutation.isPending}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* To-Do List Widget */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckSquare className="h-5 w-5 text-green-500" />
                Quick Tasks
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="Add a task..."
                    value={newTodo}
                    onChange={(e) => setNewTodo(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addTodo();
                      }
                    }}
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    size="icon"
                    onClick={(e) => {
                      e.preventDefault();
                      addTodo();
                    }}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <ScrollArea className="h-[200px]">
                  <div className="space-y-2">
                    {todos.map((todo) => (
                      <div key={todo.id} className="flex items-center gap-2 p-2 rounded hover:bg-accent group">
                        <Checkbox
                          checked={todo.completed}
                          onCheckedChange={() => toggleTodo(todo.id, todo.completed || false)}
                        />
                        <span className={`flex-1 text-sm ${todo.completed ? 'line-through text-muted-foreground' : ''}`}>
                          {todo.text}
                        </span>
                        <button
                          onClick={() => deleteTodo(todo.id)}
                          className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-opacity"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                    {todos.length === 0 && (
                      <p className="text-center text-muted-foreground text-sm py-4">
                        No tasks yet. Add one!
                      </p>
                    )}
                  </div>
                </ScrollArea>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
