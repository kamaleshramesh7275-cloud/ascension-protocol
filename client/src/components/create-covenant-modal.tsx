import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { ShieldCheck, Copy, Check, Share2, AlertTriangle } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

interface CreateCovenantModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateCovenantModal({ open, onOpenChange }: CreateCovenantModalProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [termsDays, setTermsDays] = useState<number>(7);
  const [stakeCoins, setStakeCoins] = useState<number>(250);
  const [protocolObjective, setProtocolObjective] = useState<string>("Daily Protocol Execution");
  const [createdCovenant, setCreatedCovenant] = useState<{ covenantCode: string; shareUrl: string } | null>(null);
  const [copied, setCopied] = useState(false);

  const userCoins = (user as any)?.coins || 0;
  const hasSufficientCoins = userCoins >= stakeCoins;

  const createMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/covenants/create", {
        termsDays,
        stakeCoins,
        protocolObjective,
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to initialize covenant");
      }
      return res.json();
    },
    onSuccess: (data) => {
      if ("vibrate" in navigator) navigator.vibrate([30, 40, 50]);
      setCreatedCovenant({
        covenantCode: data.covenant.covenantCode,
        shareUrl: `${window.location.origin}${data.shareUrl}`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      queryClient.invalidateQueries({ queryKey: ["/api/covenants/user/active"] });
      toast({
        title: "BILATERAL COVENANT INITIALIZED",
        description: `Stake of ${stakeCoins} coins committed to crucible escrow.`,
      });
    },
    onError: (err: any) => {
      toast({
        title: "Initialization Terminated",
        description: err.message,
        variant: "destructive",
      });
    },
  });

  const handleCopyLink = () => {
    if (!createdCovenant) return;
    navigator.clipboard.writeText(createdCovenant.shareUrl);
    setCopied(true);
    toast({
      title: "COVENANT TRANSMISSION LINK COPIED",
      description: "Send this direct link to any peer or squad member.",
    });
    setTimeout(() => setCopied(false), 2500);
  };

  const handleNativeShare = async () => {
    if (!createdCovenant) return;
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Ascension Protocol - Bilateral Covenant",
          text: `I have committed ${stakeCoins} coins to a ${termsDays}-day discipline covenant. Match my stake or forfeit.`,
          url: createdCovenant.shareUrl,
        });
      } catch {
        // Ignored or dismissed
      }
    } else {
      handleCopyLink();
    }
  };

  const handleReset = () => {
    setCreatedCovenant(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={(val) => {
      if (!val) setCreatedCovenant(null);
      onOpenChange(val);
    }}>
      <DialogContent className="max-w-md bg-[#0A0D12] border border-white/10 text-white font-mono p-6">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
            <span className="text-[10px] text-zinc-400 uppercase tracking-widest">CRUCIBLE PROTOCOL</span>
          </div>
          <DialogTitle className="text-lg font-bold uppercase tracking-tight text-white flex items-center justify-between">
            <span>Bilateral Discipline Covenant</span>
          </DialogTitle>
          <DialogDescription className="text-xs text-zinc-400 font-mono">
            Lock equal discipline coin stakes with an accountability partner. One failed execution day yields the entire pot to the survivor.
          </DialogDescription>
        </DialogHeader>

        {!createdCovenant ? (
          <div className="space-y-4 pt-2">
            {/* Objective Selector */}
            <div className="space-y-1.5">
              <label className="text-[10px] text-zinc-400 uppercase tracking-wider block">
                Protocol Objective
              </label>
              <Input
                value={protocolObjective}
                onChange={(e) => setProtocolObjective(e.target.value)}
                placeholder="e.g., Daily Mission Execution"
                className="bg-black/50 border-white/10 text-xs text-white font-mono h-9 focus-visible:ring-1 focus-visible:ring-blue-500"
              />
            </div>

            {/* Terms Duration Selector */}
            <div className="space-y-1.5">
              <label className="text-[10px] text-zinc-400 uppercase tracking-wider block">
                Crucible Window (Duration)
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[7, 14, 30].map((days) => (
                  <button
                    key={days}
                    type="button"
                    onClick={() => setTermsDays(days)}
                    className={`py-2 px-3 rounded border text-xs font-mono uppercase transition-all ${
                      termsDays === days
                        ? "bg-white text-black border-white font-bold"
                        : "bg-black/40 text-zinc-400 border-white/10 hover:border-white/25 hover:text-white"
                    }`}
                  >
                    {days} Days
                  </button>
                ))}
              </div>
            </div>

            {/* Stake coins Selector */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-[10px] uppercase">
                <span className="text-zinc-400 tracking-wider">Per-Party Stake Escrow</span>
                <span className={hasSufficientCoins ? "text-emerald-400" : "text-red-400"}>
                  Reserves: {userCoins} Coins
                </span>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {[100, 250, 500, 1000].map((coins) => (
                  <button
                    key={coins}
                    type="button"
                    onClick={() => setStakeCoins(coins)}
                    className={`py-2 px-2 rounded border text-xs font-mono uppercase transition-all ${
                      stakeCoins === coins
                        ? "bg-amber-400 text-black border-amber-400 font-bold"
                        : "bg-black/40 text-zinc-400 border-white/10 hover:border-white/25 hover:text-white"
                    }`}
                  >
                    {coins}
                  </button>
                ))}
              </div>
            </div>

            {/* Contract Terms Summary */}
            <div className="p-3 bg-zinc-950/80 border border-white/5 rounded text-[11px] space-y-1.5 text-zinc-400">
              <div className="flex justify-between">
                <span>COMBINED POT:</span>
                <span className="text-amber-400 font-bold">{stakeCoins * 2} Coins</span>
              </div>
              <div className="flex justify-between">
                <span>CONDITIONS:</span>
                <span className="text-white">Zero excuses, binary verification</span>
              </div>
              <div className="flex justify-between">
                <span>ESCROW STATUS:</span>
                <span className="text-zinc-300">Deducted upon initialization</span>
              </div>
            </div>

            {!hasSufficientCoins && (
              <div className="flex items-center gap-2 text-xs text-red-400 bg-red-950/20 border border-red-500/20 p-2.5 rounded">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>Insufficient discipline coins. Complete daily quests to build reserves.</span>
              </div>
            )}

            <Button
              className="w-full bg-white hover:bg-zinc-200 text-black font-mono text-xs font-bold uppercase h-10 tracking-wider"
              disabled={!hasSufficientCoins || createMutation.isPending}
              onClick={() => createMutation.mutate()}
            >
              {createMutation.isPending ? "INITIALIZING ESCROW..." : "LOCK STAKE & GENERATE LINK"}
            </Button>
          </div>
        ) : (
          /* Post-Creation Share Screen */
          <div className="space-y-4 pt-2">
            <div className="p-4 bg-emerald-950/20 border border-emerald-500/30 rounded text-center">
              <ShieldCheck className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
              <div className="text-xs font-bold text-white uppercase tracking-wider mb-0.5">
                Covenant Initialized
              </div>
              <div className="text-[10px] text-zinc-400 uppercase tracking-widest font-mono">
                CODE: {createdCovenant.covenantCode}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] text-zinc-400 uppercase tracking-wider block">
                Direct Covenant Transmission Link
              </label>
              <div className="flex items-center gap-2">
                <Input
                  readOnly
                  value={createdCovenant.shareUrl}
                  className="bg-black/50 border-white/10 text-xs font-mono text-zinc-300 h-9"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopyLink}
                  className="border-white/15 hover:bg-zinc-800 text-xs h-9 px-3 shrink-0 uppercase"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2">
              <Button
                variant="outline"
                className="border-white/15 hover:bg-zinc-800 text-xs font-mono uppercase h-9"
                onClick={handleNativeShare}
              >
                <Share2 className="w-3.5 h-3.5 mr-1.5" />
                Transmit Link
              </Button>
              <Button
                className="bg-white hover:bg-zinc-200 text-black font-mono text-xs font-bold uppercase h-9"
                onClick={handleReset}
              >
                Dismiss
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
