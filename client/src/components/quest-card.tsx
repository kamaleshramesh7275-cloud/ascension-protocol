import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Quest, STAT_NAMES } from "@shared/schema";
import { CheckCircle2, Clock, Sparkles, Calendar, Trophy, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface QuestCardProps {
  quest: Quest;
  onComplete?: (questId: string) => void;
  isCompletingQuest?: boolean;
}

const questTypeConfig = {
  daily: { label: "Daily", icon: Calendar, className: "bg-orange-500/10 text-orange-400 border-orange-500/20" },
  weekly: { label: "Weekly", icon: Trophy, className: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20" },
  ai: { label: "AI Quest", icon: Sparkles, className: "bg-purple-500/10 text-purple-400 border-purple-500/20" },
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
        "relative overflow-hidden transition-all duration-300 group",
        "bg-zinc-900/40 border-zinc-800/50 backdrop-blur-sm",
        "hover:bg-zinc-900/60 hover:border-zinc-700/50 hover:shadow-xl hover:shadow-purple-500/5",
        "hover:-translate-y-1",
        quest.completed && "opacity-75 grayscale-[0.5] hover:grayscale-0 hover:opacity-100"
      )}
      data-testid={`card-quest-${quest.id}`}
    >
      {/* Glow Effect on Hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

      <CardHeader className="space-y-0 pb-4 relative z-10">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0 space-y-1">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className={cn("text-xs font-medium px-2 py-0.5 h-auto", typeConfig.className)}>
                <TypeIcon className="h-3 w-3 mr-1" />
                {typeConfig.label}
              </Badge>
              {quest.completed && (
                <Badge variant="outline" className="bg-green-500/10 text-green-400 border-green-500/20 text-xs px-2 py-0.5 h-auto">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Completed
                </Badge>
              )}
            </div>
            <CardTitle className="text-lg font-semibold leading-tight text-zinc-100 group-hover:text-white transition-colors">
              {quest.title}
            </CardTitle>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 relative z-10">
        <CardDescription className="text-zinc-400 line-clamp-2 text-sm leading-relaxed">
          {quest.description}
        </CardDescription>

        {quest.content && (
          <div className="text-sm text-zinc-300 mt-2 bg-zinc-900/50 p-3 rounded-md border border-zinc-800/50">
            {quest.content}
          </div>
        )}

        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary" className="bg-zinc-800/50 text-zinc-300 border-zinc-700/50 hover:bg-zinc-800">
            <Sparkles className="h-3 w-3 text-yellow-500 mr-1.5" />
            <span className="font-mono text-xs">+{quest.rewardXP} XP</span>
          </Badge>

          {stats.map(([stat, value]) => (
            <Badge key={stat} variant="outline" className="bg-zinc-900/50 border-zinc-800 text-zinc-400 capitalize text-xs">
              +{value} {stat}
            </Badge>
          ))}
        </div>

        {!quest.completed && (
          <div className="flex items-center gap-2 text-xs text-zinc-500 font-medium">
            <Clock className="h-3.5 w-3.5" />
            <span>Due {new Date(quest.dueAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
          </div>
        )}
      </CardContent>

      <CardFooter className="relative z-10 pt-2">
        {quest.completed ? (
          <div className="w-full py-2 text-center text-sm font-medium text-green-500/80 flex items-center justify-center gap-2 bg-green-500/5 rounded-md border border-green-500/10">
            <CheckCircle2 className="h-4 w-4" />
            Quest Completed
          </div>
        ) : (
          <Button
            onClick={() => onComplete?.(quest.id)}
            className="w-full bg-zinc-100 text-zinc-900 hover:bg-white transition-all duration-300 group/btn"
            disabled={isCompletingQuest}
            data-testid="button-complete-quest"
          >
            {isCompletingQuest ? (
              <>
                <Sparkles className="h-4 w-4 mr-2 animate-spin" />
                Completing...
              </>
            ) : (
              <>
                Complete Quest
                <ArrowRight className="h-4 w-4 ml-2 opacity-0 -translate-x-2 group-hover/btn:opacity-100 group-hover/btn:translate-x-0 transition-all duration-300" />
              </>
            )}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
