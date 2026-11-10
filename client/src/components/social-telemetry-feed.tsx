import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { audioEngine } from "@/lib/audio-engine";
import { BragCardModal, BragCardData } from "@/components/brag-card-modal";
import {
  Radio,
  Flame,
  Zap,
  Activity,
  Dumbbell,
  Lock,
  Scale,
  CheckCircle2,
  RefreshCw,
  Share2,
  Users,
  Clock,
  Sparkles,
} from "lucide-react";

interface TelemetryFeedItem {
  id: string;
  userId: string;
  operatorName: string;
  operatorTier: string;
  actionType: "air_gap" | "streak" | "workout" | "covenant" | "quest" | string;
  title: string;
  telemetry: string;
  xpDelta: number;
  timestamp: string;
  endorsements: number;
  hasEndorsed: boolean;
}

export function SocialTelemetryFeed() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [filterMode, setFilterMode] = useState<"all" | "squad">("all");
  const [showShareModal, setShowShareModal] = useState<boolean>(false);

  const { data: currentUser } = useQuery<any>({
    queryKey: ["/api/user"],
  });

  const { data, isLoading, isRefetching, refetch } = useQuery<{
    feed: TelemetryFeedItem[];
    streamActive: boolean;
    protocolVersion: string;
  }>({
    queryKey: ["/api/social/feed"],
    refetchInterval: 30000, // Poll every 30 seconds for live pulse
  });

  const bragCardData: BragCardData = {
    type: "streak",
    title: "ASCENSION PROTOCOL TELEMETRY",
    headlineMetric: `${currentUser?.streak || 1} DAY STREAK`,
    subheadline: "Verified Human Discipline Network Log",
    userName: currentUser?.name || "Operator",
    userTier: currentUser?.tier || "D",
    referralCode: currentUser?.referralCode,
    stats: [
      { label: "TIER RATING", value: `TIER ${currentUser?.tier || "D"}` },
      { label: "DEFIANCE STREAK", value: `${currentUser?.streak || 1} DAYS` },
      { label: "NETWORK XP", value: `${currentUser?.xp || 0} XP` },
      { label: "RESERVES", value: `${currentUser?.coins || 0} COINS` },
    ],
  };

  const endorseMutation = useMutation({
    mutationFn: async (activityId: string) => {
      const res = await apiRequest("POST", `/api/social/feed/${activityId}/endorse`, {});
      return res.json();
    },
    onMutate: async (activityId: string) => {
      // Optimistic update
      await queryClient.cancelQueries({ queryKey: ["/api/social/feed"] });
      const previous = queryClient.getQueryData<{ feed: TelemetryFeedItem[] }>(["/api/social/feed"]);

      if (previous) {
        queryClient.setQueryData(["/api/social/feed"], {
          ...previous,
          feed: previous.feed.map((item) => {
            if (item.id === activityId) {
              const nextHasEndorsed = !item.hasEndorsed;
              return {
                ...item,
                hasEndorsed: nextHasEndorsed,
                endorsements: nextHasEndorsed ? item.endorsements + 1 : Math.max(0, item.endorsements - 1),
              };
            }
            return item;
          }),
        });
      }

      return { previous };
    },
    onError: (err, id, context) => {
      if (context?.previous) {
        queryClient.setQueryData(["/api/social/feed"], context.previous);
      }
      toast({
        title: "Transmission Failed",
        description: "Could not record endorsement to network ledger.",
        variant: "destructive",
      });
    },
    onSuccess: (data) => {
      if (data.hasEndorsed) {
        audioEngine.playCommandLock();
        toast({
          title: "PROTOCOL ENDORSED",
          description: "Endorsement packet transmitted to operator. Peer reinforcement logged.",
        });
      }
    },
  });

  const feedItems = data?.feed || [];

  const formatRelativeTime = (timestampStr: string) => {
    const diff = Math.max(0, Date.now() - new Date(timestampStr).getTime());
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "JUST NOW";
    if (mins < 60) return `${mins}M AGO`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}H AGO`;
    const days = Math.floor(hours / 24);
    return `${days}D AGO`;
  };

  const getActionConfig = (actionType: string) => {
    switch (actionType) {
      case "air_gap":
        return {
          icon: Lock,
          label: "[AIR-GAP]",
          color: "text-cyan-400 border-cyan-500/30 bg-cyan-950/40",
          iconColor: "text-cyan-400",
        };
      case "streak":
        return {
          icon: Flame,
          label: "[STREAK]",
          color: "text-amber-400 border-amber-500/30 bg-amber-950/40",
          iconColor: "text-amber-400",
        };
      case "workout":
        return {
          icon: Dumbbell,
          label: "[WORKOUT]",
          color: "text-emerald-400 border-emerald-500/30 bg-emerald-950/40",
          iconColor: "text-emerald-400",
        };
      case "covenant":
        return {
          icon: Scale,
          label: "[COVENANT]",
          color: "text-purple-400 border-purple-500/30 bg-purple-950/40",
          iconColor: "text-purple-400",
        };
      case "quest":
        return {
          icon: CheckCircle2,
          label: "[DIRECTIVE]",
          color: "text-blue-400 border-blue-500/30 bg-blue-950/40",
          iconColor: "text-blue-400",
        };
      default:
        return {
          icon: Activity,
          label: "[PROTOCOL]",
          color: "text-zinc-400 border-zinc-700 bg-zinc-900/50",
          iconColor: "text-zinc-400",
        };
    }
  };

  return (
    <div className="obsidian-panel rounded-xl p-5 sm:p-6 space-y-4 relative overflow-hidden">
      {/* Top telemetry status bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-md bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center text-emerald-400">
            <Radio className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-semibold text-white tracking-wider uppercase font-mono">
                TELEMETRY MESH FEED
              </h3>
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-[9px] font-mono text-emerald-400 uppercase tracking-wider">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                ONLINE
              </span>
            </div>
            <p className="text-[11px] text-zinc-400 font-sans mt-0.5">
              Decentralized peer verification log across active tactical nodes.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Mode Selector */}
          <div className="inline-flex rounded-md bg-[#07080B] p-0.5 border border-white/10 text-[11px] font-mono">
            <button
              onClick={() => {
                audioEngine.playTactileClick();
                setFilterMode("all");
              }}
              className={`px-2.5 py-1 rounded transition-all tracking-wider uppercase ${
                filterMode === "all"
                  ? "bg-[#1C232E] text-white font-semibold shadow-sm"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              ALL NODES
            </button>
            <button
              onClick={() => {
                audioEngine.playTactileClick();
                setFilterMode("squad");
              }}
              className={`px-2.5 py-1 rounded transition-all tracking-wider uppercase ${
                filterMode === "squad"
                  ? "bg-[#1C232E] text-white font-semibold shadow-sm"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              PACT NETWORK
            </button>
          </div>

          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              audioEngine.playTactileClick();
              refetch();
            }}
            disabled={isRefetching}
            className="text-zinc-400 hover:text-white border border-white/5 h-7 w-7 p-0 rounded"
            title="Poll telemetry mesh"
          >
            <RefreshCw className={`w-3 h-3 ${isRefetching ? "animate-spin text-cyan-400" : ""}`} />
          </Button>

          <Button
            size="sm"
            onClick={() => {
              audioEngine.playTactileClick();
              setShowShareModal(true);
            }}
            className="bg-amber-400 hover:bg-amber-300 text-black text-[11px] font-mono font-bold uppercase tracking-wider h-7 px-3 gap-1.5 rounded shadow-sm hover:scale-[1.02] active:scale-[0.98] transition-all"
          >
            <Share2 className="w-3 h-3" /> BROADCAST
          </Button>
        </div>
      </div>

      {/* Stream List */}
      <div className="space-y-2 max-h-[460px] overflow-y-auto pr-1">
        {isLoading ? (
          <div className="text-center py-12 font-mono text-xs text-zinc-500 space-y-2">
            <Radio className="w-5 h-5 animate-pulse mx-auto text-emerald-400" />
            <p className="tracking-widest uppercase">INTERCEPTING MESH TELEMETRY...</p>
          </div>
        ) : feedItems.length === 0 ? (
          <div className="text-center py-10 font-mono text-xs text-zinc-500 uppercase tracking-wider">
            NO PACKETS DETECTED IN THIS FREQUENCY
          </div>
        ) : (
          feedItems.map((item) => {
            const config = getActionConfig(item.actionType);
            const Icon = config.icon;

            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 3 }}
                animate={{ opacity: 1, y: 0 }}
                className="obsidian-card razor-border-hover rounded-lg p-3 sm:p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#090C10] hover:bg-[#0E1218] border-white/5 transition-all group"
              >
                {/* Left section: Meta and Title */}
                <div className="flex items-start gap-3 min-w-0 flex-1">
                  <div className={`w-8 h-8 rounded-md flex items-center justify-center shrink-0 border ${config.color}`}>
                    <Icon className={`w-3.5 h-3.5 ${config.iconColor}`} />
                  </div>

                  <div className="min-w-0 flex-1 space-y-0.5">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-xs font-semibold text-white tracking-tight">
                        {item.operatorName}
                      </span>
                      <Badge className="bg-[#141922] border-white/10 text-[9px] font-mono px-1.5 py-0 text-zinc-300">
                        TIER {item.operatorTier}
                      </Badge>
                      <Badge className={`text-[9px] font-mono px-1.5 py-0 border ${config.color}`}>
                        {config.label}
                      </Badge>
                      <span className="text-[10px] font-mono text-zinc-500 flex items-center gap-1 ml-auto sm:ml-0 tabular-telemetry">
                        <Clock className="w-2.5 h-2.5" />
                        {formatRelativeTime(item.timestamp)}
                      </span>
                    </div>

                    <p className="text-xs font-medium text-zinc-200 truncate">
                      {item.title}
                    </p>
                    <p className="text-[11px] font-mono text-zinc-400 truncate">
                      {item.telemetry}
                    </p>
                  </div>
                </div>

                {/* Right section: Endorse / Kudos CTA */}
                <div className="flex items-center justify-between sm:justify-end gap-2.5 pt-2 sm:pt-0 border-t sm:border-t-0 border-white/5">
                  {item.xpDelta > 0 && (
                    <span className="text-[11px] font-mono font-bold text-emerald-400 tabular-telemetry">
                      +{item.xpDelta} XP
                    </span>
                  )}

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      audioEngine.playTactileClick();
                      endorseMutation.mutate(item.id);
                    }}
                    disabled={endorseMutation.isPending}
                    className={`h-7 px-2.5 text-[10px] font-mono tracking-wider transition-all gap-1.5 rounded ${
                      item.hasEndorsed
                        ? "bg-amber-500/15 text-amber-300 border-amber-500/30"
                        : "bg-[#07080B] hover:bg-[#141922] text-zinc-400 hover:text-white border-white/10"
                    }`}
                  >
                    <Flame className={`w-3 h-3 ${item.hasEndorsed ? "fill-amber-400 text-amber-400" : ""}`} />
                    <span className="tabular-telemetry font-bold">{item.endorsements}</span>
                    <span className="hidden sm:inline uppercase">
                      {item.hasEndorsed ? "VERIFIED" : "ENDORSE"}
                    </span>
                  </Button>
                </div>
              </motion.div>
            );
          })
        )}
      </div>

      {/* Bottom broadcast CTA & telemetry info */}
      <div className="pt-3 border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] font-mono text-zinc-500">
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>MESH PROTOCOL VERIFIED</span>
        </div>
        <p className="text-[10px] text-zinc-500">
          Peer endorsements transmit verifiable reputation weight to network operators.
        </p>
      </div>

      {/* Brag Card Modal */}
      <BragCardModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        data={bragCardData}
      />
    </div>
  );
}
