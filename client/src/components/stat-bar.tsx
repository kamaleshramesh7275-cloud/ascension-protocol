import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { 
  Dumbbell, 
  Zap, 
  Heart, 
  Shield, 
  Brain, 
  Target, 
  Users 
} from "lucide-react";

interface StatBarProps {
  name: string;
  value: number;
  max?: number;
  className?: string;
}

const statIcons: Record<string, typeof Dumbbell> = {
  strength: Dumbbell,
  agility: Zap,
  stamina: Heart,
  vitality: Shield,
  intelligence: Brain,
  willpower: Target,
  charisma: Users,
};

const statColors: Record<string, string> = {
  strength: "hsl(var(--chart-1))",
  agility: "hsl(var(--chart-2))",
  stamina: "hsl(var(--chart-3))",
  vitality: "hsl(var(--chart-4))",
  intelligence: "hsl(var(--chart-5))",
  willpower: "hsl(var(--primary))",
  charisma: "hsl(339 90% 51%)",
};

export function StatBar({ name, value, max = 100, className }: StatBarProps) {
  const Icon = statIcons[name.toLowerCase()] || Target;
  const progress = Math.min((value / max) * 100, 100);
  const color = statColors[name.toLowerCase()] || "hsl(var(--primary))";

  return (
    <div className={cn("space-y-2", className)} data-testid={`stat-${name.toLowerCase()}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4" style={{ color }} />
          <span className="text-sm font-medium capitalize">{name}</span>
        </div>
        <span className="text-sm font-semibold" data-testid={`text-${name.toLowerCase()}-value`}>
          {value} / {max}
        </span>
      </div>
      <div className="relative">
        <Progress 
          value={progress} 
          className="h-3"
          style={{
            // @ts-ignore - CSS custom property
            '--progress-color': color,
          }}
        />
      </div>
    </div>
  );
}
