import { Progress } from "@/components/ui/progress";
import { TIER_THRESHOLDS, Tier } from "@shared/schema";
import { cn } from "@/lib/utils";

interface XPProgressProps {
  xp: number;
  tier: Tier;
  className?: string;
}

const tierOrder: Tier[] = ["D", "C", "B", "A", "S"];

export function XPProgress({ xp, tier, className }: XPProgressProps) {
  const currentTierIndex = tierOrder.indexOf(tier);
  const nextTier = tierOrder[currentTierIndex + 1];
  
  const currentThreshold = TIER_THRESHOLDS[tier];
  const nextThreshold = nextTier ? TIER_THRESHOLDS[nextTier] : TIER_THRESHOLDS.S + 10000;
  
  const xpInCurrentTier = xp - currentThreshold;
  const xpNeededForNextTier = nextThreshold - currentThreshold;
  const progress = Math.min((xpInCurrentTier / xpNeededForNextTier) * 100, 100);

  return (
    <div className={cn("space-y-2", className)} data-testid="progress-xp">
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1">
          <div className="text-sm font-medium text-muted-foreground mb-1">
            Experience Points
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold font-display" data-testid="text-current-xp">
              {xp.toLocaleString()}
            </span>
            <span className="text-sm text-muted-foreground">XP</span>
          </div>
        </div>
        {nextTier && (
          <div className="text-right">
            <div className="text-sm text-muted-foreground">
              Next Rank: {nextTier}
            </div>
            <div className="text-sm font-medium" data-testid="text-xp-needed">
              {(nextThreshold - xp).toLocaleString()} XP needed
            </div>
          </div>
        )}
      </div>
      
      <div className="relative">
        <Progress value={progress} className="h-8" />
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xs font-semibold text-foreground drop-shadow-lg">
            {progress.toFixed(0)}%
          </span>
        </div>
      </div>
    </div>
  );
}
