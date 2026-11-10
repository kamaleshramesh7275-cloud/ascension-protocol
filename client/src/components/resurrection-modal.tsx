import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { ShieldAlert, Zap, Trophy, Flame, Check } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

interface ResurrectionStatusResponse {
  eligible: boolean;
  hoursInactive?: number;
  recoveryReliefCoins?: number;
  accumulatedLegacy?: {
    level: number;
    tier: string;
    coins: number;
    questsCompleted: number;
    stamina: number;
    willpower: number;
  };
}

export function ResurrectionModal() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [dismissed, setDismissed] = useState(false);

  const { data: status } = useQuery<ResurrectionStatusResponse>({
    queryKey: ["/api/user/resurrection/status"],
    enabled: !!user && !dismissed,
  });

  const claimMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/user/resurrection/claim");
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to authorize resurrection");
      }
      return res.json();
    },
    onSuccess: () => {
      if ("vibrate" in navigator) navigator.vibrate([40, 50, 60]);
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user/resurrection/status"] });
      setDismissed(true);
      toast({
        title: "RESURRECTION PROTOCOL ACTIVE",
        description: "+100 Coins credited. Streak initialized to Day 01 baseline.",
      });
    },
    onError: (err: any) => {
      toast({
        title: "Authorization Failed",
        description: err.message,
        variant: "destructive",
      });
    },
  });

  if (!status?.eligible || dismissed) return null;

  const legacy = status.accumulatedLegacy;

  return (
    <Dialog open={true} onOpenChange={(val) => {
      if (!val) setDismissed(true);
    }}>
      <DialogContent className="max-w-md bg-[#0A0D12] border border-amber-500/30 text-white font-mono p-6 shadow-2xl">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            <span className="text-[10px] text-amber-400 uppercase tracking-widest">
              RESTORATION DIRECTIVE // {status.hoursInactive}H DOWNTIME
            </span>
          </div>
          <DialogTitle className="text-lg font-bold uppercase tracking-tight text-white flex items-center justify-between">
            <span>Resurrection Protocol</span>
          </DialogTitle>
          <DialogDescription className="text-xs text-zinc-400 font-mono">
            Your operational streak was interrupted. The protocol does not permit abandonment. Claim your relief package and re-enter the crucible.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {/* Accumulated Legacy Capital Card */}
          {legacy && (
            <div className="p-3.5 bg-black/60 rounded border border-white/10 space-y-2 text-xs">
              <div className="text-[10px] text-zinc-500 uppercase tracking-widest pb-1 border-b border-white/5">
                Accumulated Mission Capital
              </div>
              <div className="grid grid-cols-2 gap-2 text-zinc-300">
                <div>
                  <span className="text-zinc-500 block text-[9px] uppercase">RANK / TIER</span>
                  <span className="font-bold text-white">LVL {legacy.level} // {legacy.tier}</span>
                </div>
                <div>
                  <span className="text-zinc-500 block text-[9px] uppercase">MISSIONS CLEARED</span>
                  <span className="font-bold text-white">{legacy.questsCompleted} Quests</span>
                </div>
                <div>
                  <span className="text-zinc-500 block text-[9px] uppercase">ACCUMULATED COINS</span>
                  <span className="font-bold text-amber-400">{legacy.coins} Coins</span>
                </div>
                <div>
                  <span className="text-zinc-500 block text-[9px] uppercase">WILLPOWER STAT</span>
                  <span className="font-bold text-blue-400">{legacy.willpower} PTS</span>
                </div>
              </div>
            </div>
          )}

          {/* Recovery Terms */}
          <div className="p-3 rounded bg-amber-950/20 border border-amber-500/20 text-xs space-y-1.5 text-zinc-300">
            <div className="flex items-center gap-2 text-amber-400 font-bold uppercase text-[11px]">
              <ShieldAlert className="w-4 h-4 shrink-0" />
              <span>Resurrection Terms Authorized</span>
            </div>
            <ul className="text-[11px] text-zinc-400 space-y-1 list-disc pl-4">
              <li>Immediate Relief Grant: <strong className="text-white">+100 Discipline Coins</strong></li>
              <li>Streak Continuity: Restored to <strong className="text-white">Day 01 Active Baseline</strong></li>
              <li>Condition: Execute at least one daily mission within the next 24 hours.</li>
            </ul>
          </div>

          <div className="pt-1 flex gap-2">
            <Button
              className="w-full bg-amber-400 hover:bg-amber-300 text-black font-mono text-xs font-bold uppercase h-10 tracking-wider"
              disabled={claimMutation.isPending}
              onClick={() => claimMutation.mutate()}
            >
              <Zap className="w-4 h-4 mr-1.5" />
              {claimMutation.isPending ? "AUTHORIZING RECOVERY..." : "CLAIM RELIEF & REBOOT STREAK"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
