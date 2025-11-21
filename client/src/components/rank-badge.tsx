import { cn } from "@/lib/utils";
import { Tier } from "@shared/schema";

interface RankBadgeProps {
  tier: Tier;
  level: number;
  size?: "sm" | "md" | "lg";
  showLevel?: boolean;
  className?: string;
}

const tierColors: Record<Tier, string> = {
  D: "from-slate-600 to-slate-700 border-slate-500",
  C: "from-emerald-600 to-emerald-700 border-emerald-500",
  B: "from-blue-600 to-blue-700 border-blue-500",
  A: "from-purple-600 to-purple-700 border-purple-500",
  S: "from-amber-500 via-yellow-500 to-amber-600 border-yellow-400",
};

const sizeClasses = {
  sm: "w-12 h-12 text-xl",
  md: "w-20 h-20 text-4xl",
  lg: "w-32 h-32 text-6xl",
};

export function RankBadge({ 
  tier, 
  level, 
  size = "md", 
  showLevel = true,
  className 
}: RankBadgeProps) {
  return (
    <div className={cn("flex flex-col items-center gap-2", className)} data-testid="badge-rank">
      <div
        className={cn(
          "relative rounded-xl bg-gradient-to-br border-2 flex items-center justify-center font-display font-black shadow-lg",
          tierColors[tier],
          sizeClasses[size]
        )}
      >
        <span className="relative z-10 drop-shadow-lg" data-testid="text-tier">
          {tier}
        </span>
        {tier === "S" && (
          <div className="absolute inset-0 rounded-xl bg-yellow-400/20 animate-pulse" />
        )}
      </div>
      {showLevel && (
        <div className="text-sm font-medium text-muted-foreground" data-testid="text-level">
          Level {level}
        </div>
      )}
    </div>
  );
}
