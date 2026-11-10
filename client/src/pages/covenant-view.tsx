import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { ShieldCheck, Check, AlertCircle, Share2, Copy } from "lucide-react";

export default function CovenantViewPage() {
  const params = useParams<{ code: string }>();
  const covenantCode = params.code || "";
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [copied, setCopied] = useState(false);

  const { data: covenant, isLoading, error } = useQuery<any>({
    queryKey: [`/api/covenants/${covenantCode}`],
    enabled: !!covenantCode,
  });

  const acceptMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/covenants/${covenantCode}/accept`);
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to authorize covenant");
      }
      return res.json();
    },
    onSuccess: () => {
      if ("vibrate" in navigator) navigator.vibrate([40, 30, 80]);
      queryClient.invalidateQueries({ queryKey: [`/api/covenants/${covenantCode}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });

      toast({
        title: "BILATERAL COVENANT AUTHORIZED",
        description: "Mutual stake verified and locked. Execution window is now live.",
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

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    toast({
      title: "COVENANT TRANSMISSION LINK COPIED",
      description: "Direct invite link copied to clipboard.",
    });
    setTimeout(() => setCopied(false), 2500);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#050608] flex items-center justify-center p-6 text-white font-mono text-xs">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
          <span>INITIALIZING COVENANT VERIFICATION...</span>
        </div>
      </div>
    );
  }

  if (error || !covenant) {
    return (
      <div className="min-h-screen bg-[#050608] flex flex-col items-center justify-center p-6 text-white text-center">
        <AlertCircle className="w-12 h-12 text-red-400 mb-3" />
        <h2 className="text-xl font-bold font-mono uppercase mb-1">Covenant Record Inactive</h2>
        <p className="text-xs font-mono text-zinc-500 max-w-sm mb-4">
          This covenant code does not exist, has expired, or the verification hash is invalid.
        </p>
        <Button
          variant="outline"
          className="border-white/10 font-mono text-xs uppercase"
          onClick={() => setLocation("/dashboard")}
        >
          Return to Dashboard
        </Button>
      </div>
    );
  }

  const isInitiator = user && covenant.initiatorId === (user as any).id;
  const isPending = covenant.status === "pending";
  const isActive = covenant.status === "active";

  return (
    <div className="min-h-screen bg-[#050608] text-white flex flex-col justify-between p-4 sm:p-8">
      <div className="max-w-2xl mx-auto w-full my-auto py-8">
        {/* Document Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-zinc-900 border border-white/10 text-[10px] font-mono text-zinc-400 uppercase tracking-widest mb-3">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>BILATERAL DISCIPLINE COVENANT</span>
            <span className="text-zinc-600">//</span>
            <span>{covenant.covenantCode}</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold font-mono uppercase tracking-tight text-white mb-2">
            Execution Covenant Agreement
          </h1>
          <p className="text-xs font-mono text-zinc-400 max-w-md mx-auto">
            A mutual performance contract between two operatives. Both parties lock equal stakes. First to break protocol forfeits reserves.
          </p>
        </div>

        {/* Contract Parchment Card */}
        <div className="bg-[#090B0E] border border-white/15 rounded-md p-6 sm:p-8 relative overflow-hidden shadow-2xl">
          {/* Subtle Grid Watermark */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />

          {/* Party A & Party B Ledger */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-6 border-b border-white/10 relative z-10">
            {/* Party A: Initiator */}
            <div className="p-4 rounded bg-[#0D1015] border border-white/10">
              <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-wider block mb-1">
                PARTY A // INITIATOR
              </span>
              <p className="text-sm font-mono font-bold text-white uppercase">
                {covenant.initiatorName}
              </p>
              <div className="flex items-center gap-2 mt-2 text-[10px] font-mono text-zinc-400">
                <span>STREAK: {covenant.initiatorStreak} DAYS</span>
                <span className="text-zinc-700">//</span>
                <span className="text-emerald-400">STAKE: {covenant.stakeCoins} COINS</span>
              </div>
            </div>

            {/* Party B: Counterparty */}
            <div className="p-4 rounded bg-[#0D1015] border border-white/10">
              <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-wider block mb-1">
                PARTY B // COUNTERPARTY
              </span>
              {covenant.counterpartyName ? (
                <div>
                  <p className="text-sm font-mono font-bold text-white uppercase">
                    {covenant.counterpartyName}
                  </p>
                  <div className="flex items-center gap-2 mt-2 text-[10px] font-mono text-zinc-400">
                    <span>STREAK: {covenant.counterpartyStreak || 0} DAYS</span>
                    <span className="text-zinc-700">//</span>
                    <span className="text-emerald-400">STAKE LOCKED</span>
                  </div>
                </div>
              ) : (
                <div>
                  <p className="text-sm font-mono text-zinc-500 uppercase italic">
                    VACANT SLOT // PENDING MATCH
                  </p>
                  <span className="text-[10px] font-mono text-amber-400 mt-2 block">
                    MATCHING STAKE: {covenant.stakeCoins} COINS
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Terms & Conditions Section */}
          <div className="py-6 border-b border-white/10 relative z-10 space-y-3 font-mono text-xs">
            <span className="text-[10px] text-zinc-500 uppercase tracking-wider block">
              COVENANT TERMS AND CRUCIBLE SPECIFICATION
            </span>

            <div className="flex justify-between py-1.5 border-b border-white/5">
              <span className="text-zinc-400">DURATION STANDARD:</span>
              <span className="text-white font-bold">{covenant.termsDays} CONSECUTIVE DAYS</span>
            </div>

            <div className="flex justify-between py-1.5 border-b border-white/5">
              <span className="text-zinc-400">OBJECTIVE SPEC:</span>
              <span className="text-white font-bold">{covenant.protocolObjective}</span>
            </div>

            <div className="flex justify-between py-1.5 border-b border-white/5">
              <span className="text-zinc-400">MUTUAL STAKE POT:</span>
              <span className="text-amber-400 font-bold">{covenant.stakeCoins * 2} DISCIPLINE COINS</span>
            </div>

            <div className="flex justify-between py-1.5">
              <span className="text-zinc-400">FORFEIT CLAUSE:</span>
              <span className="text-red-400 font-bold">1 UNJUSTIFIED DAY MISSED = FORFEIT</span>
            </div>
          </div>

          {/* Status & Digital Signature Trigger */}
          <div className="pt-6 relative z-10 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-left w-full sm:w-auto">
              <span className="text-[9px] font-mono text-zinc-500 uppercase block">CONTRACT STATUS</span>
              <span
                className={`text-xs font-mono font-bold uppercase tracking-wider ${
                  isActive
                    ? "text-emerald-400"
                    : isPending
                    ? "text-amber-400"
                    : "text-zinc-400"
                }`}
              >
                // {covenant.status.toUpperCase()}
              </span>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Button
                variant="outline"
                size="sm"
                className="border-white/10 hover:bg-zinc-800 text-xs font-mono h-9 px-3 uppercase"
                onClick={handleCopyLink}
              >
                {copied ? <Check className="w-3.5 h-3.5 mr-1 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 mr-1" />}
                {copied ? "COPIED" : "SHARE LINK"}
              </Button>

              {isPending && (
                <>
                  {!user ? (
                    <Button
                      size="sm"
                      className="bg-white hover:bg-zinc-200 text-black font-mono text-xs font-bold uppercase h-9 px-4"
                      onClick={() => setLocation(`/register?ref=${covenant.covenantCode}`)}
                    >
                      AUTHENTICATE TO ACCEPT
                    </Button>
                  ) : isInitiator ? (
                    <Button
                      size="sm"
                      variant="secondary"
                      disabled
                      className="font-mono text-xs uppercase h-9 px-4 text-zinc-400"
                    >
                      AWAITING COUNTERPARTY
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      className="bg-emerald-500 hover:bg-emerald-400 text-black font-mono text-xs font-bold uppercase h-9 px-4"
                      disabled={acceptMutation.isPending}
                      onClick={() => acceptMutation.mutate()}
                    >
                      <ShieldCheck className="w-4 h-4 mr-1.5" />
                      {acceptMutation.isPending ? "AUTHORIZING..." : "AUTHORIZE COVENANT"}
                    </Button>
                  )}
                </>
              )}

              {isActive && (
                <div className="flex items-center gap-2 px-3 py-1.5 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-mono text-xs">
                  <Check className="w-3.5 h-3.5" />
                  <span>ACTIVE IN CRUCIBLE</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
