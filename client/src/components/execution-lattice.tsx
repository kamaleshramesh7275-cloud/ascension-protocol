import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { format, subDays, eachDayOfInterval } from "date-fns";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface ExecutionLatticeProps {
  className?: string;
}

export function ExecutionLattice({ className = "" }: ExecutionLatticeProps) {
  // Fetch activity history to compute true daily execution
  const { data: activities = [] } = useQuery<any[]>({
    queryKey: ["/api/activities"],
  });

  const { data: user } = useQuery<any>({
    queryKey: ["/api/user"],
  });

  const { matrixDays, summary } = useMemo(() => {
    const today = new Date();
    // 91 days (exactly 13 weeks * 7 days)
    const intervalDays = eachDayOfInterval({
      start: subDays(today, 90),
      end: today,
    });

    // Map activities by YYYY-MM-DD
    const activityMap = new Map<string, { count: number; xp: number }>();
    activities.forEach((act) => {
      const dateKey = format(new Date(act.timestamp || act.createdAt), "yyyy-MM-dd");
      const current = activityMap.get(dateKey) || { count: 0, xp: 0 };
      activityMap.set(dateKey, {
        count: current.count + 1,
        xp: current.xp + (act.xpDelta || 0),
      });
    });

    let executedDaysCount = 0;

    const days = intervalDays.map((d) => {
      const dateKey = format(d, "yyyy-MM-dd");
      const data = activityMap.get(dateKey);
      const count = data?.count || 0;
      const xp = data?.xp || 0;

      let intensity = 0;
      if (count >= 5 || xp >= 500) intensity = 3;
      else if (count >= 3 || xp >= 250) intensity = 2;
      else if (count >= 1 || xp > 0) intensity = 1;

      if (intensity > 0) executedDaysCount++;

      return {
        date: d,
        dateKey,
        formattedDate: format(d, "MMM dd, yyyy"),
        dayOfWeek: format(d, "EEE"),
        intensity,
        count,
        xp,
      };
    });

    const integrityRate = ((executedDaysCount / 91) * 100).toFixed(1);

    return {
      matrixDays: days,
      summary: {
        executedDaysCount,
        totalDays: 91,
        integrityRate,
      },
    };
  }, [activities]);

  const getCellClasses = (intensity: number) => {
    switch (intensity) {
      case 3:
        return "bg-emerald-400 border-emerald-300 shadow-[0_0_8px_rgba(52,211,153,0.5)]";
      case 2:
        return "bg-emerald-600 border-emerald-500/60 shadow-[0_0_4px_rgba(16,185,129,0.3)]";
      case 1:
        return "bg-emerald-900/60 border-emerald-600/40";
      default:
        return "bg-[#0A0D12] border-white/5 hover:border-white/20";
    }
  };

  return (
    <div className={`p-5 rounded-lg bg-[#07090D] border border-white/10 font-mono text-xs ${className}`}>
      {/* Telemetry Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pb-4 mb-4 border-b border-white/5">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[10px] text-zinc-500 uppercase tracking-widest">
              DON'T BREAK THE CHAIN // 90-DAY LATTICE
            </span>
          </div>
          <h3 className="text-sm font-bold text-white uppercase tracking-tight mt-0.5">
            Operational Execution Heatmap
          </h3>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <span className="text-[9px] text-zinc-500 uppercase block tracking-wider">EXECUTION INTEGRITY</span>
            <span className="text-xs font-bold text-emerald-400">
              {summary.integrityRate}% [{summary.executedDaysCount}/91 DAYS]
            </span>
          </div>
        </div>
      </div>

      {/* Grid Lattice */}
      <TooltipProvider delayDuration={100}>
        <div className="overflow-x-auto pb-2">
          <div className="min-w-[640px]">
            {/* Week Matrix Columns */}
            <div className="grid grid-flow-col grid-rows-7 gap-1.5">
              {matrixDays.map((cell) => (
                <Tooltip key={cell.dateKey}>
                  <TooltipTrigger asChild>
                    <div
                      className={`w-3.5 h-3.5 rounded-sm border transition-all cursor-crosshair ${getCellClasses(
                        cell.intensity
                      )}`}
                    />
                  </TooltipTrigger>
                  <TooltipContent
                    side="top"
                    className="bg-[#090B0E] border-white/15 text-white font-mono text-[10px] p-2 space-y-0.5"
                  >
                    <div className="font-bold text-zinc-200">{cell.formattedDate}</div>
                    <div className="text-zinc-400">
                      Telemetry: <span className="text-emerald-400 font-bold">{cell.count} Actions</span>
                    </div>
                    {cell.xp > 0 && (
                      <div className="text-zinc-400">
                        Yield: <span className="text-amber-400 font-bold">+{cell.xp} XP</span>
                      </div>
                    )}
                  </TooltipContent>
                </Tooltip>
              ))}
            </div>

            {/* Days of Week Key */}
            <div className="flex justify-between items-center pt-3 text-[9px] text-zinc-500 uppercase">
              <span>90 Days Prior</span>
              <div className="flex items-center gap-1.5">
                <span>Dormant</span>
                <span className="w-2.5 h-2.5 rounded-sm bg-[#0A0D12] border border-white/10" />
                <span className="w-2.5 h-2.5 rounded-sm bg-emerald-900/60 border border-emerald-600/40" />
                <span className="w-2.5 h-2.5 rounded-sm bg-emerald-600 border border-emerald-500/60" />
                <span className="w-2.5 h-2.5 rounded-sm bg-emerald-400 border border-emerald-300 shadow-[0_0_6px_rgba(52,211,153,0.5)]" />
                <span>Apex Load</span>
              </div>
              <span>Today</span>
            </div>
          </div>
        </div>
      </TooltipProvider>
    </div>
  );
}
