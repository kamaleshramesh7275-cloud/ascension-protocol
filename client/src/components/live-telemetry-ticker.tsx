import { useQuery } from "@tanstack/react-query";

interface LiveStatsResponse {
  totalWarriors: number;
  activeWarriors: number;
  hoursLogged: number;
  streaksSurvived: number;
  tickerTape: string;
  items: string[];
}

export function LiveTelemetryTicker() {
  const { data } = useQuery<LiveStatsResponse>({
    queryKey: ["/api/stats/live"],
    refetchInterval: 60000, // Refresh every minute
  });

  const defaultItems = [
    "PROTOCOL TELEMETRY: ACTIVE",
    "GLOBAL COHORT: 1,482 OPERATIVES",
    "STREAK INTEGRITY: 94.2% UNBROKEN",
    "HOURS COMMITTED: 3,940 HRS",
    "SYSTEM: ALL ENCRYPTED PROTOCOLS VERIFIED",
  ];

  const items = data?.items && data.items.length > 0 ? data.items : defaultItems;

  return (
    <div className="w-full bg-[#050608] border-t border-white/10 overflow-hidden select-none py-2 px-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Terminal Header Tag */}
        <div className="flex items-center gap-2 flex-shrink-0 pr-4 border-r border-white/10">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[10px] font-mono tracking-widest text-zinc-400 uppercase font-semibold">
            LIVE TELEMETRY
          </span>
        </div>

        {/* Streaming Content */}
        <div className="overflow-hidden whitespace-nowrap flex-1 flex items-center">
          <div className="flex items-center gap-8 animate-marquee font-mono text-[11px] text-zinc-400">
            {items.map((item, index) => (
              <span key={`item-${index}`} className="flex items-center gap-3">
                <span className="text-zinc-200">{item}</span>
                <span className="text-zinc-700">//</span>
              </span>
            ))}
            {/* Duplicated for smooth loop */}
            {items.map((item, index) => (
              <span key={`dup-${index}`} className="flex items-center gap-3">
                <span className="text-zinc-200">{item}</span>
                <span className="text-zinc-700">//</span>
              </span>
            ))}
          </div>
        </div>

        {/* Live Status Stamp */}
        <div className="hidden sm:flex items-center gap-2 flex-shrink-0 pl-4 border-l border-white/10 text-[10px] font-mono text-zinc-500">
          <span>COHORT LATENCY: 24MS</span>
        </div>
      </div>
    </div>
  );
}
