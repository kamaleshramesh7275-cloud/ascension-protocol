import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { audioEngine } from "@/lib/audio-engine";
import { BragCardModal, BragCardData } from "@/components/brag-card-modal";
import {
  ShieldAlert,
  Zap,
  Lock,
  Unlock,
  Coins,
  Sparkles,
  Radio,
  ArrowRight,
  CheckCircle2,
  Share2,
  Box,
  Binary,
} from "lucide-react";

export function TacticalCacheModal() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedCache, setSelectedCache] = useState<any | null>(null);
  const [decryptState, setDecryptState] = useState<"idle" | "decrypting" | "revealed">("idle");
  const [revealedData, setRevealedData] = useState<any | null>(null);
  const [hexCycle, setHexCycle] = useState("0x4A 0x8F 0xC2");
  const [showBragCard, setShowBragCard] = useState(false);

  // Check cache status
  const { data: cacheStatus } = useQuery<{
    availableCaches: any[];
    totalAvailable: number;
    openedTodayCount: number;
    protocolCycle: string;
  }>({
    queryKey: ["/api/tactical-cache/status"],
    refetchInterval: 60000,
  });

  const { data: currentUser } = useQuery<any>({
    queryKey: ["/api/user"],
  });

  // Cycle fake hex values during decryption animation
  useEffect(() => {
    if (decryptState === "decrypting") {
      const interval = setInterval(() => {
        const hex = Array.from({ length: 4 }, () =>
          "0x" + Math.floor(Math.random() * 255).toString(16).toUpperCase().padStart(2, "0")
        ).join(" ");
        setHexCycle(hex);
      }, 100);
      return () => clearInterval(interval);
    }
  }, [decryptState]);

  const decryptMutation = useMutation({
    mutationFn: async (cache: any) => {
      const res = await apiRequest("POST", "/api/tactical-cache/decrypt", {
        cacheId: cache.id,
        tier: cache.tier,
      });
      return res.json();
    },
    onSuccess: (data) => {
      audioEngine.playCommandLock();
      queryClient.invalidateQueries({ queryKey: ["/api/tactical-cache/status"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      queryClient.invalidateQueries({ queryKey: ["/api/social/feed"] });
      setRevealedData(data);
      setDecryptState("revealed");
    },
    onError: (err: any) => {
      setDecryptState("idle");
      toast({
        title: "Decryption Interrupted",
        description: err.message || "Failed to decrypt tactical cipher.",
        variant: "destructive",
      });
    },
  });

  const handleStartDecryption = (cache: any) => {
    setSelectedCache(cache);
    setDecryptState("decrypting");
    audioEngine.playCommandLock();

    // Dramatic 1.6s decryption delay before firing API
    setTimeout(() => {
      decryptMutation.mutate(cache);
    }, 1600);
  };

  const handleClaimAndClose = () => {
    audioEngine.playCommandLock();
    setIsOpen(false);
    setDecryptState("idle");
    setSelectedCache(null);
    setRevealedData(null);
    toast({
      title: "RESERVES SECURED",
      description: "Tactical yield stowed in central vault.",
    });
  };

  const availableCaches = cacheStatus?.availableCaches || [];

  if (availableCaches.length === 0 && !isOpen) {
    return null;
  }

  const bragData: BragCardData = {
    type: "streak",
    title: "TACTICAL CACHE CIPHER DECRYPTED",
    headlineMetric: `+${revealedData?.rewardCoins || 50} COINS`,
    subheadline: "Ascension Protocol Variable Supply Drop",
    userName: currentUser?.name || "Operator",
    userTier: currentUser?.tier || "D",
    referralCode: currentUser?.referralCode,
    stats: [
      { label: "COIN RESERVES", value: `+${revealedData?.rewardCoins || 0}` },
      { label: "TELEMETRY XP", value: `+${revealedData?.rewardXp || 0} XP` },
      { label: "CIPHER SIGNATURE", value: revealedData?.cipherSignature || "HEX-CLASSIFIED" },
      { label: "DEFIANCE STREAK", value: `${currentUser?.streak || 1} DAYS` },
    ],
  };

  return (
    <>
      {/* Persistent HUD Banner on dashboard if caches are ready */}
      {availableCaches.length > 0 && !isOpen && (
        <div className="obsidian-card razor-border-hover border-amber-500/30 bg-gradient-to-r from-[#0E1218] to-[#090C10] rounded-lg p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md shadow-amber-500/5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-md bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
              <Box className="w-4 h-4 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-white tracking-wider uppercase">
                  ENCRYPTED SUPPLY CACHE DETECTED
                </span>
                <Badge className="bg-amber-500/15 text-amber-300 border-amber-500/30 text-[9px] font-mono px-1.5 py-0">
                  {availableCaches.length} PENDING
                </Badge>
              </div>
              <p className="text-[11px] text-zinc-400 font-sans mt-0.5">
                {availableCaches[0].title} primed for neural cipher decryption.
              </p>
            </div>
          </div>

          <Button
            size="sm"
            onClick={() => {
              audioEngine.playTactileClick();
              setSelectedCache(availableCaches[0]);
              setIsOpen(true);
            }}
            className="bg-amber-400 hover:bg-amber-300 text-black font-mono font-bold text-xs uppercase tracking-wider h-8 px-4 gap-2 shrink-0 rounded shadow-sm hover:scale-[1.02] active:scale-[0.98] transition-all"
          >
            <Unlock className="w-3.5 h-3.5" />
            DECRYPT SUPPLY CACHE
          </Button>
        </div>
      )}

      {/* Decryption Modal Dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[500px] bg-[#0E1218] border border-white/10 text-white p-6 rounded-xl shadow-2xl backdrop-blur-2xl">
          <DialogHeader className="space-y-2">
            <div className="flex items-center justify-between">
              <Badge className="bg-amber-500/10 text-amber-400 border-amber-500/25 font-mono text-[9px] uppercase tracking-wider px-2 py-0.5">
                TACTICAL CACHE // SECTOR DECRYPTION
              </Badge>
              <span className="text-[10px] font-mono text-zinc-500 tabular-telemetry">
                {selectedCache?.code || "CACHE-01"}
              </span>
            </div>

            <DialogTitle className="text-base font-semibold font-mono tracking-tight text-white flex items-center gap-2">
              <Box className="w-4 h-4 text-amber-400" />
              {selectedCache?.title || "Encrypted Supply Drop"}
            </DialogTitle>

            <DialogDescription className="text-xs text-zinc-400 font-sans leading-relaxed">
              Variable telemetry yield granted under active protocol compliance.
            </DialogDescription>
          </DialogHeader>

          {/* Body Content based on decrypt state */}
          <div className="py-4 space-y-4">
            {decryptState === "idle" && (
              <div className="space-y-3">
                <div className="bg-[#07080B] border border-white/5 rounded-lg p-3.5 space-y-2 font-mono text-xs">
                  <div className="flex items-center justify-between text-zinc-400">
                    <span className="text-[11px]">AUTHORIZATION SOURCE:</span>
                    <span className="text-white font-medium">{selectedCache?.source}</span>
                  </div>
                  <div className="flex items-center justify-between text-zinc-400">
                    <span className="text-[11px]">ESTIMATED YIELD:</span>
                    <span className="text-amber-400 font-semibold tabular-telemetry">{selectedCache?.estimatedYield}</span>
                  </div>
                  <div className="flex items-center justify-between text-zinc-400">
                    <span className="text-[11px]">CIPHER ENCRYPTION:</span>
                    <span className="text-cyan-400">AES-256 TELEMETRIC</span>
                  </div>
                </div>

                <Button
                  onClick={() => {
                    audioEngine.playTactileClick();
                    handleStartDecryption(selectedCache);
                  }}
                  className="w-full bg-amber-400 hover:bg-amber-300 text-black font-mono font-bold text-xs uppercase tracking-wider h-10 gap-2 rounded shadow-sm hover:scale-[1.01] active:scale-[0.99] transition-all"
                >
                  <Unlock className="w-4 h-4" />
                  ENGAGE CIPHER DECRYPTION
                </Button>
              </div>
            )}

            {decryptState === "decrypting" && (
              <div className="text-center py-6 space-y-4">
                <div className="w-12 h-12 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto text-amber-400 animate-pulse">
                  <Binary className="w-5 h-5 animate-spin" />
                </div>
                <div className="space-y-1">
                  <p className="text-[11px] font-mono font-bold text-zinc-300 uppercase tracking-widest">
                    DECRYPTING RESONANCE CIPHER...
                  </p>
                  <p className="text-sm font-mono text-amber-400 tracking-wider tabular-telemetry">
                    {hexCycle}
                  </p>
                </div>
                <div className="w-full bg-[#07080B] rounded-full h-1 overflow-hidden border border-white/5">
                  <div className="bg-gradient-to-r from-amber-500 to-cyan-400 h-full w-full animate-pulse" />
                </div>
              </div>
            )}

            {decryptState === "revealed" && revealedData && (
              <motion.div
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                className="space-y-4"
              >
                <div className="bg-[#07080B] border border-emerald-500/25 rounded-lg p-4 text-center space-y-3">
                  <div className="w-9 h-9 rounded-md bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-400">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>

                  <div>
                    <span className="text-[9px] font-mono uppercase tracking-widest text-emerald-400 font-semibold block">
                      CIPHER DECRYPTED // YIELD CONFIRMED
                    </span>
                    <h4 className="text-2xl font-bold font-mono text-white tracking-tight mt-1 tabular-telemetry">
                      +{revealedData.rewardCoins} COINS
                    </h4>
                    <p className="text-xs font-mono text-cyan-400 mt-0.5 tabular-telemetry">
                      +{revealedData.rewardXp} TELEMETRY XP
                    </p>
                  </div>

                  {revealedData.bonusItem && (
                    <div className="bg-amber-500/10 border border-amber-500/20 rounded p-2 text-xs font-mono text-amber-300">
                      BONUS ARTIFACT UNLOCKED: {revealedData.bonusItem}
                    </div>
                  )}

                  <div className="pt-2 border-t border-white/5 text-[10px] font-mono text-zinc-500 tabular-telemetry">
                    CIPHER SIGNATURE: {revealedData.cipherSignature}
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-2.5">
                  <Button
                    onClick={() => {
                      audioEngine.playTactileClick();
                      handleClaimAndClose();
                    }}
                    className="flex-1 bg-zinc-100 hover:bg-white text-black font-mono font-bold text-xs uppercase tracking-wider h-10 rounded shadow-sm"
                  >
                    STOW IN RESERVES
                  </Button>

                  <Button
                    onClick={() => {
                      audioEngine.playTactileClick();
                      setShowBragCard(true);
                    }}
                    variant="outline"
                    className="border-white/10 text-zinc-300 hover:text-white hover:bg-white/5 font-mono text-xs uppercase tracking-wider h-10 gap-1.5 rounded"
                  >
                    <Share2 className="w-3.5 h-3.5" /> BROADCAST
                  </Button>
                </div>
              </motion.div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Brag Card Modal */}
      <BragCardModal
        isOpen={showBragCard}
        onClose={() => setShowBragCard(false)}
        data={bragData}
      />
    </>
  );
}
