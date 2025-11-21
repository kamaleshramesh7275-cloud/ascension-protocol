import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Quest, STAT_NAMES } from "@shared/schema";
import { CheckCircle2, Clock, Sparkles, Calendar, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";

interface QuestCardProps {
  quest: Quest;
  onComplete?: (questId: string) => void;
  isCompletingQuest?: boolean;
}

const questTypeConfig = {
  daily: { label: "Daily", icon: Calendar, variant: "default" as const },
  weekly: { label: "Weekly", icon: Trophy, variant: "secondary" as const },
  ai: { label: "AI Quest", icon: Sparkles, variant: "outline" as const },
};

export function QuestCard({ quest, onComplete, isCompletingQuest }: QuestCardProps) {
  const typeConfig = questTypeConfig[quest.type as keyof typeof questTypeConfig] || questTypeConfig.daily;
  const TypeIcon = typeConfig.icon;
  
  const stats = quest.rewardStats ? Object.entries(quest.rewardStats).filter(([key]) => 
    STAT_NAMES.includes(key as any)
  ) : [];

  return (
    <Card 
      className={cn(
        "transition-all hover-elevate",
        quest.completed && "opacity-60"
      )}
      data-testid={`card-quest-${quest.id}`}
    >
      <CardHeader className="space-y-0 pb-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg line-clamp-2 flex items-start gap-2">
              {quest.completed && (
                <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
              )}
              <span data-testid="text-quest-title">{quest.title}</span>
            </CardTitle>
          </div>
          <Badge variant={typeConfig.variant} className="flex-shrink-0">
            <TypeIcon className="h-3 w-3 mr-1" />
            {typeConfig.label}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <CardDescription className="line-clamp-3" data-testid="text-quest-description">
          {quest.description}
        </CardDescription>
        
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline" className="gap-1">
            <Sparkles className="h-3 w-3 text-yellow-500" />
            <span data-testid="text-quest-xp">+{quest.rewardXP} XP</span>
          </Badge>
          
          {stats.map(([stat, value]) => (
            <Badge key={stat} variant="outline" className="gap-1 capitalize">
              +{value} {stat}
            </Badge>
          ))}
        </div>
        
        {!quest.completed && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            <span>Due {new Date(quest.dueAt).toLocaleDateString()}</span>
          </div>
        )}
      </CardContent>
      
      <CardFooter>
        {quest.completed ? (
          <Button variant="ghost" className="w-full" disabled data-testid="button-completed">
            <CheckCircle2 className="h-4 w-4 mr-2" />
            Completed
          </Button>
        ) : (
          <Button
            onClick={() => onComplete?.(quest.id)}
            className="w-full"
            disabled={isCompletingQuest}
            data-testid="button-complete-quest"
          >
            {isCompletingQuest ? "Completing..." : "Complete Quest"}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
