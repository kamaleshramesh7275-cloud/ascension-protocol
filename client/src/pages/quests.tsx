import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Quest, QuestType } from "@shared/schema";
import { QuestCard } from "@/components/quest-card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Target } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

export default function QuestsPage() {
  const [activeTab, setActiveTab] = useState<"all" | QuestType>("all");
  const { toast } = useToast();

  const { data: quests, isLoading } = useQuery<Quest[]>({
    queryKey: ["/api/quests"],
  });

  const completeMutation = useMutation({
    mutationFn: async (questId: string) => {
      return apiRequest("POST", `/api/quests/${questId}/complete`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/quests"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      toast({
        title: "Quest Completed!",
        description: "You've earned XP and stat bonuses!",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to complete quest. Please try again.",
        variant: "destructive",
      });
    },
  });

  const filteredQuests = quests?.filter((quest) => {
    if (activeTab === "all") return true;
    return quest.type === activeTab;
  }) || [];

  const activeQuests = filteredQuests.filter(q => !q.completed);
  const completedQuests = filteredQuests.filter(q => q.completed);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-64" />
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-64" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="page-quests">
      <div>
        <h1 className="text-4xl font-display font-bold mb-2">Quests</h1>
        <p className="text-muted-foreground">
          Complete quests to earn XP and improve your stats
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
        <TabsList>
          <TabsTrigger value="all" data-testid="tab-all">All Quests</TabsTrigger>
          <TabsTrigger value="daily" data-testid="tab-daily">Daily</TabsTrigger>
          <TabsTrigger value="weekly" data-testid="tab-weekly">Weekly</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-6 mt-6">
          {/* Active Quests */}
          {activeQuests.length > 0 && (
            <div>
              <h2 className="text-2xl font-semibold mb-4">Active</h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {activeQuests.map((quest) => (
                  <QuestCard
                    key={quest.id}
                    quest={quest}
                    onComplete={(id) => completeMutation.mutate(id)}
                    isCompletingQuest={completeMutation.isPending}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Completed Quests */}
          {completedQuests.length > 0 && (
            <div>
              <h2 className="text-2xl font-semibold mb-4">Completed</h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {completedQuests.map((quest) => (
                  <QuestCard key={quest.id} quest={quest} />
                ))}
              </div>
            </div>
          )}

          {/* Empty State */}
          {filteredQuests.length === 0 && (
            <div className="text-center py-12">
              <Target className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">No quests yet</h3>
              <p className="text-muted-foreground">
                New quests will be assigned daily. Check back tomorrow!
              </p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
