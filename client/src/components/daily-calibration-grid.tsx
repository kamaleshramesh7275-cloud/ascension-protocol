import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Check, ShieldCheck, Flame } from "lucide-react";

interface CalibrationDay {
  day: number;
  coins: number;
  xp: number;
  milestoneLabel: string;
  status: "claimed" | "claimable" | "locked";
}

interface CalibrationStatusResponse {
  currentDay: number;
  canClaimToday: boolean;
  days: CalibrationDay[];
}

export function DailyCalibrationGrid() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery<CalibrationStatusResponse>({
    queryKey: ["/api/user/daily-login/status"],
  });

  const claimMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/user/daily-login/claim");
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to claim");
      }
      return res.json();
    },
    onSuccess: (result) => {
      if ("vibrate" in navigator) navigator.vibrate([40, 20, 60]);

      queryClient.setQueryData(["/api/user"], (old: any) => {
        if (!old) return old;
        return {
          ...old,
          ...(result.user || {}),
        };
      });

      queryClient.invalidateQueries({ queryKey: ["/api/user/daily-login/status"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });

      toast({
        title: result.milestoneTitle || "CALIBRATION LOGGED",
        description: `Day ${result.dayClaimed} verified. Yield: +${result.coinsAwarded} coins and +${result.xpAwarded} XP.`,
        variant: "default",
      });
    },
    onError: (err: any) => {
      toast({
        title: "Claim Failed",
        description: err.message,
        variant: "destructive",
      });
    },
  });

  if (isLoading || !data) {
    return (
      <div className="p-4 bg-[#0A0C0E] border border-white/5 rounded-md animate-pulse">
        <div className="h-6 w-48 bg-white/5 rounded mb-4" />
        <div className="grid grid-cols-5 sm:grid-cols-6 md:grid-cols-10 gap-2">
          {Array.from({ length: 30 }).map((_, i) => (
            <div key={i} className="h-16 bg-white/5 rounded" />
          ))}
        </div>
      </div>
    );
  }

  const claimableDay = data.days.find((d) => d.status === "claimable");

  return (
    <div className="bg-[#080A0D] border border-white/10 rounded-md p-4 sm:p-5 relative overflow-hidden">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-white/5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-blue-400" />
            <h3 className="text-xs font-mono tracking-widest uppercase font-semibold text-zinc-300">
              30-DAY PROTOCOL CALIBRATION MATRIX
            </h3>
          </div>
          <p className="text-xs text-zinc-500 font-mono">
            Sequential daily discipline verification // Escalating protocol yield
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <span className="text-[10px] font-mono text-zinc-500 uppercase block">CYCLE PROGRESS</span>
            <span className="text-sm font-mono font-bold text-white">
              DAY {String(data.currentDay).padStart(2, "0")} / 30
            </span>
          </div>

          {data.canClaimToday && claimableDay ? (
            <Button
              size="sm"
              className="bg-white hover:bg-zinc-200 text-black font-mono text-xs font-bold uppercase tracking-wider h-9 px-4 active:scale-95 transition-transform"
              disabled={claimMutation.isPending}
              onClick={() => claimMutation.mutate()}
            >
              {claimMutation.isPending ? "VERIFYING..." : "CLAIM CALIBRATION"}
            </Button>
          ) : (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-zinc-900 border border-white/5 text-[11px] font-mono text-zinc-400">
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span>CALIBRATED FOR TODAY</span>
            </div>
          )}
        </div>
      </div>

      {/* 30-Day Grid */}
      <div className="grid grid-cols-5 sm:grid-cols-6 md:grid-cols-10 gap-1.5 sm:gap-2">
        {data.days.map((d) => {
          const isMilestone = d.day === 7 || d.day === 14 || d.day === 30;
          const isClaimable = d.status === "claimable";
          const isClaimed = d.status === "claimed";

          return (
            <div
              key={d.day}
              className={`relative rounded p-2 flex flex-col justify-between min-h-[64px] border transition-all ${
                isClaimable
                  ? "bg-[#11161F] border-blue-400 shadow-[0_0_12px_rgba(56,189,248,0.2)] animate-pulse"
                  : isClaimed
                  ? "bg-[#0B0D10] border-emerald-500/20 opacity-80"
                  : isMilestone
                  ? "bg-[#0E1217] border-amber-500/30"
                  : "bg-[#0A0C0E] border-white/5 opacity-50"
              }`}
            >
              {/* Day Header */}
              <div className="flex items-center justify-between">
                <span
                  className={`text-[10px] font-mono font-bold ${
                    isClaimable
                      ? "text-blue-300"
                      : isClaimed
                      ? "text-emerald-400"
                      : isMilestone
                      ? "text-amber-400"
                      : "text-zinc-500"
                  }`}
                >
                  D{String(d.day).padStart(2, "0")}
                </span>

                {isClaimed && <Check className="w-3 h-3 text-emerald-400" />}
                {isMilestone && !isClaimed && <ShieldCheck className="w-3 h-3 text-amber-400/70" />}
              </div>

              {/* Yield */}
              <div className="mt-1">
                <span className="text-[10px] font-mono block text-white font-semibold">
                  +{d.coins}c
                </span>
                <span className="text-[9px] font-mono block text-zinc-500">
                  +{d.xp}xp
                </span>
              </div>

              {/* Milestone Tag */}
              {d.milestoneLabel && (
                <div className="mt-1">
                  <span className="text-[8px] font-mono px-1 py-0.2 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20 block truncate">
                    {d.day === 30 ? "MAX" : "TIER"}
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
