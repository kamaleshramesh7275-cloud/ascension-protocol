import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Copy, Check, Share2, Shield, Users } from "lucide-react";

interface ReferralTier {
  threshold: number;
  reward: string;
  bonusCoins: number;
  achieved: boolean;
}

interface ReferralStatsResponse {
  referralCode: string | null;
  totalReferrals: number;
  tiers: ReferralTier[];
  nextTier: ReferralTier | null;
  referrals: Array<{
    id: string;
    referredUserName: string;
    createdAt: string;
  }>;
}

export function VernierReferralRail() {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  const { data, isLoading } = useQuery<ReferralStatsResponse>({
    queryKey: ["/api/referrals/user/stats"],
  });

  const total = data?.totalReferrals || 0;
  const maxThreshold = 10;
  const progressPercent = Math.min(100, Math.round((total / maxThreshold) * 100));

  const copyCode = () => {
    if (!data?.referralCode) return;
    const shareUrl = `${window.location.origin}/register?ref=${data.referralCode}`;
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    toast({
      title: "COVENANT LINK COPIED",
      description: "Recruitment URL copied to clipboard with automated bonus attribution.",
    });
    setTimeout(() => setCopied(false), 2500);
  };

  const shareNative = async () => {
    if (!data?.referralCode) return;
    const shareUrl = `${window.location.origin}/register?ref=${data.referralCode}`;
    const shareData = {
      title: "ASCENSION PROTOCOL // CALLSIGN INVITATION",
      text: `Join the sovereign performance protocol with operative callsign ${data.referralCode}.`,
      url: shareUrl,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        copyCode();
      }
    } else {
      copyCode();
    }
  };

  if (isLoading) {
    return (
      <div className="p-5 bg-[#080A0D] border border-white/5 rounded-md animate-pulse">
        <div className="h-6 w-48 bg-white/5 rounded mb-4" />
        <div className="h-24 bg-white/5 rounded" />
      </div>
    );
  }

  const defaultTiers: ReferralTier[] = [
    { threshold: 1, reward: "COHORT RECRUITER ACCREDITATION", bonusCoins: 100, achieved: total >= 1 },
    { threshold: 3, reward: "OBSIDIAN AVATAR EMBOSSING", bonusCoins: 250, achieved: total >= 3 },
    { threshold: 5, reward: "PRO TELEMETRY ACCESS (1 MO)", bonusCoins: 500, achieved: total >= 5 },
    { threshold: 10, reward: "FOUNDING CIRCLE RING", bonusCoins: 1500, achieved: total >= 10 },
  ];

  const tiers = data?.tiers || defaultTiers;

  return (
    <div className="bg-[#080A0D] border border-white/10 rounded-md p-5 relative overflow-hidden">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Users className="w-4 h-4 text-zinc-400" />
            <h3 className="text-xs font-mono tracking-widest uppercase font-semibold text-zinc-200">
              COHORT RECRUITMENT CALIPER // VERNIER SCALE
            </h3>
          </div>
          <p className="text-xs text-zinc-500 font-mono">
            Bilateral referral covenants. Each operative verified unlocks engineered milestones.
          </p>
        </div>

        {/* Share Buttons */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-zinc-900 border border-white/10 font-mono text-xs">
            <span className="text-zinc-500 text-[10px]">CALLSIGN:</span>
            <span className="text-white font-bold tracking-wider">{data?.referralCode || "---"}</span>
          </div>

          <Button
            size="sm"
            variant="outline"
            className="border-white/10 hover:bg-zinc-800 text-xs font-mono h-8 px-2.5"
            onClick={copyCode}
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </Button>

          <Button
            size="sm"
            className="bg-white hover:bg-zinc-200 text-black font-mono text-xs font-bold uppercase h-8 px-3"
            onClick={shareNative}
          >
            <Share2 className="w-3.5 h-3.5 mr-1.5" />
            TRANSMIT
          </Button>
        </div>
      </div>

      {/* Vernier Caliper Progress Gauge */}
      <div className="mt-6 mb-8 px-2">
        <div className="flex justify-between items-center text-[10px] font-mono text-zinc-500 uppercase mb-2">
          <span>OPERATIVES INDUCTED: {total}</span>
          <span>PINNACLE TARGET: 10</span>
        </div>

        {/* The Milled Caliper Rail */}
        <div className="relative h-6 bg-[#0E1217] border border-white/10 rounded overflow-hidden flex items-center px-1">
          {/* Tick marks across the gauge */}
          <div className="absolute inset-0 flex justify-between px-3 items-center pointer-events-none opacity-20">
            {Array.from({ length: 40 }).map((_, i) => (
              <span
                key={i}
                className={`w-[1px] bg-white ${i % 4 === 0 ? "h-3" : "h-1.5"}`}
              />
            ))}
          </div>

          {/* Active progress fill */}
          <div
            className="h-full bg-gradient-to-r from-blue-900/60 via-blue-600/40 to-white/30 transition-all duration-500 relative"
            style={{ width: `${progressPercent}%` }}
          >
            {/* Precision Vernier Needle Pointer */}
            <div className="absolute right-0 top-0 bottom-0 w-[2px] bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)]" />
          </div>
        </div>
      </div>

      {/* 4 Milled Milestone Nodes */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {tiers.map((t) => (
          <div
            key={t.threshold}
            className={`p-3 rounded border font-mono transition-all ${
              t.achieved
                ? "bg-[#0E141B] border-emerald-500/30 shadow-[0_0_8px_rgba(16,185,129,0.1)]"
                : total + 1 === t.threshold
                ? "bg-[#11141A] border-amber-500/40"
                : "bg-[#0A0C0E] border-white/5 opacity-60"
            }`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className={`text-[10px] uppercase font-bold ${t.achieved ? "text-emerald-400" : "text-zinc-400"}`}>
                TIER {t.threshold} // {t.threshold} RECRUITS
              </span>
              {t.achieved ? (
                <Check className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <Shield className="w-3.5 h-3.5 text-zinc-600" />
              )}
            </div>

            <p className="text-[11px] text-zinc-200 font-semibold leading-tight mb-2">
              {t.reward}
            </p>

            <div className="flex items-center justify-between text-[10px] text-zinc-500 pt-1.5 border-t border-white/5">
              <span>YIELD:</span>
              <span className="text-amber-400 font-bold font-mono">+{t.bonusCoins} COINS</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
