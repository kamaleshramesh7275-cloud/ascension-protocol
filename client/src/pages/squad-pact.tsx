import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import {
  Users,
  ShieldAlert,
  Flame,
  Zap,
  Lock,
  Clock,
  CheckCircle2,
  AlertTriangle,
  UserPlus,
  Coins,
  Radio,
  ArrowRight,
  TrendingUp,
  Share2,
  Terminal,
  Send,
  RadioTower,
  Activity,
  ArrowLeft,
} from "lucide-react";
import { audioEngine } from "@/lib/audio-engine";
import { WorldBossRaidCard } from "@/components/squad/world-boss-raid-card";

export default function SquadPactPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [pactName, setPactName] = useState("");
  const [inviteCodeInput, setInviteCodeInput] = useState("");
  const [stakePoints, setStakePoints] = useState(50);
  const [customPingNote, setCustomPingNote] = useState("");
  const [activeTab, setActiveTab] = useState<"members" | "comms">("comms");

  // Auto-detect invite code parameter from URL
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const inviteParam = params.get("invite");
      if (inviteParam) {
        setInviteCodeInput(inviteParam);
        setShowJoinModal(true);
      }
    }
  }, []);

  // Fetch User's Squad Pact with automated 4s ambient refresh
  const { data: squadData, isLoading } = useQuery<any>({
    queryKey: ["/api/squad-pact"],
    refetchInterval: 4000,
  });

  const pact = squadData?.pact;
  const members = squadData?.members || [];

  // Fetch Live Squad Activity Feed with 3s refresh
  const { data: feedEvents = [] } = useQuery<any[]>({
    queryKey: ["/api/squad-pact/feed"],
    refetchInterval: 3000,
    enabled: !!pact,
  });

  // Tactical Beacon Broadcast Mutation
  const pingMutation = useMutation({
    mutationFn: async ({ pingType, note }: { pingType: string; note?: string }) => {
      audioEngine.playTactileClick();
      const res = await apiRequest("POST", "/api/squad-pact/ping", { pingType, note });
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/squad-pact/feed"] });
      audioEngine.playCommandLock();
      toast({
        title: "BEACON TRANSMITTED",
        description: data.message || "Squad channel notified.",
      });
      setCustomPingNote("");
    },
    onError: (err: any) => {
      toast({ title: "Transmission Failed", description: err.message, variant: "destructive" });
    },
  });

  // Create Pact Mutation
  const createMutation = useMutation({
    mutationFn: async () => {
      audioEngine.playTactileClick();
      const res = await apiRequest("POST", "/api/squad-pact", {
        name: pactName,
        weeklyStakePoints: stakePoints,
      });
      return res.json();
    },
    onSuccess: () => {
      audioEngine.playCommandLock();
      queryClient.invalidateQueries({ queryKey: ["/api/squad-pact"] });
      setShowCreateModal(false);
      setPactName("");
      toast({
        title: "SQUAD PACT FORGED",
        description: `Staked ${stakePoints} Discipline Points. Share your invite code.`,
      });
    },
    onError: (err: any) => {
      toast({ title: "Failed to forge pact", description: err.message, variant: "destructive" });
    },
  });

  // Join Pact Mutation
  const joinMutation = useMutation({
    mutationFn: async () => {
      audioEngine.playTactileClick();
      const res = await apiRequest("POST", "/api/squad-pact/join", {
        inviteCode: inviteCodeInput.trim(),
      });
      return res.json();
    },
    onSuccess: () => {
      audioEngine.playCommandLock();
      queryClient.invalidateQueries({ queryKey: ["/api/squad-pact"] });
      setShowJoinModal(false);
      setInviteCodeInput("");
      toast({
        title: "PACT JOINED",
        description: "You are bound to the collective squad stake.",
      });
    },
    onError: (err: any) => {
      toast({ title: "Join Failed", description: err.message, variant: "destructive" });
    },
  });

  return (
    <div className="min-h-screen bg-[#07080B] text-zinc-100 flex flex-col p-4 sm:p-6 md:p-8 relative overflow-hidden font-sans">
      {/* Ambient background glow */}
      <div className="absolute top-0 right-1/3 w-96 h-96 bg-amber-500/5 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-10 w-96 h-96 bg-cyan-500/5 blur-3xl pointer-events-none" />

      <div className="w-full max-w-5xl mx-auto space-y-6 relative z-10">
        {/* Header */}
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-white/10">
          <div>
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <Badge variant="outline" className="border-amber-500/30 text-amber-400 bg-amber-500/10 font-mono text-[10px] uppercase tracking-wider px-2 py-0.5">
                <Users className="w-3 h-3 mr-1 inline" /> SECTOR 07 // SQUAD PACT
              </Badge>
              <Badge variant="outline" className="border-white/10 text-zinc-400 font-mono text-[10px] uppercase tracking-wider px-2 py-0.5">
                COLLECTIVE STAKES
              </Badge>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white uppercase font-mono">
              SQUAD PACT COMMAND
            </h1>
            <p className="text-xs text-zinc-400 font-sans mt-0.5">
              Peer accountability architecture with pooled discipline stakes and real-time operational telemetry.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <Button
              variant="outline"
              onClick={() => {
                audioEngine.playTactileClick();
                setLocation("/mission-command");
              }}
              className="border-white/10 bg-[#090C10] hover:bg-[#141922] text-zinc-300 hover:text-white text-xs font-mono h-8 px-3 rounded"
            >
              <ArrowLeft className="w-3.5 h-3.5 mr-1 inline" /> MISSION COMMAND
            </Button>
            {!pact && (
              <>
                <Button
                  variant="outline"
                  onClick={() => {
                    audioEngine.playTactileClick();
                    setShowJoinModal(true);
                  }}
                  className="border-white/10 bg-[#090C10] hover:bg-[#141922] text-zinc-300 hover:text-white text-xs font-mono h-8 px-3 rounded"
                >
                  JOIN VIA CODE
                </Button>
                <Button
                  onClick={() => {
                    audioEngine.playTactileClick();
                    setShowCreateModal(true);
                  }}
                  className="bg-amber-400 hover:bg-amber-300 text-black font-mono font-bold text-xs uppercase tracking-wider h-8 px-3.5 rounded shadow-sm hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-1.5"
                >
                  <UserPlus className="w-3.5 h-3.5" /> FORGE NEW PACT
                </Button>
              </>
            )}
            {pact && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  audioEngine.playTactileClick();
                  const inviteUrl = `${window.location.origin}/squad-pact?invite=${encodeURIComponent(pact.inviteCode)}`;
                  if (navigator.share) {
                    navigator.share({
                      title: `Join our Squad Pact: ${pact.name}`,
                      text: `Enlist in the Ascension Protocol Squad Pact "${pact.name}". Weekly stake: ${pact.weeklyStakePoints} pts:`,
                      url: inviteUrl,
                    }).catch(() => {});
                  } else {
                    navigator.clipboard.writeText(inviteUrl);
                    toast({
                      title: "SQUAD COVENANT LINK COPIED",
                      description: `Invite link with code ${pact.inviteCode} copied to clipboard!`,
                    });
                  }
                }}
                className="border-cyan-500/30 text-cyan-400 bg-cyan-500/10 hover:bg-cyan-500/20 font-mono text-xs h-8 px-3 rounded flex items-center gap-1.5"
              >
                <Share2 className="w-3.5 h-3.5" />
                INVITE CODE: {pact.inviteCode}
              </Button>
            )}
          </div>
        </header>

        {/* ─── IF NO SQUAD PACT ACTIVE ─── */}
        {!pact && !isLoading && (
          <div className="obsidian-card bg-[#090C10] border-white/5 rounded-xl p-8 text-center space-y-6 max-w-2xl mx-auto my-8">
            <div className="w-14 h-14 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-center mx-auto text-amber-400">
              <Lock className="w-7 h-7" />
            </div>

            <div className="space-y-1.5">
              <h2 className="text-xl font-bold text-white uppercase font-mono">
                NO ACTIVE SQUAD PACT
              </h2>
              <p className="text-xs text-zinc-400 max-w-md mx-auto leading-relaxed font-sans">
                Solo discipline is susceptible to rationalization. Form or join an elite 3–5 member Squad Pact.
                Each member stakes Discipline Points into a shared weekly pot. If you default, your stake redistributes to peers.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-left">
              <div className="bg-[#07080B] p-3.5 rounded-lg border border-white/5">
                <div className="text-amber-400 font-bold text-[11px] uppercase font-mono mb-1">1. STAKE POINTS</div>
                <div className="text-xs text-zinc-400 font-sans">Lock 50–200 Discipline Points into the squad pot weekly.</div>
              </div>
              <div className="bg-[#07080B] p-3.5 rounded-lg border border-white/5">
                <div className="text-cyan-400 font-bold text-[11px] uppercase font-mono mb-1">2. LIVE TELEMETRY</div>
                <div className="text-xs text-zinc-400 font-sans">Real-time peer pressure displays when operatives enter deep focus chambers.</div>
              </div>
              <div className="bg-[#07080B] p-3.5 rounded-lg border border-white/5">
                <div className="text-emerald-400 font-bold text-[11px] uppercase font-mono mb-1">3. MUTUAL YIELD</div>
                <div className="text-xs text-zinc-400 font-sans">Default = forfeit stake to peers. Full squad compliance = +20% bonus pool.</div>
              </div>
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <Button
                variant="outline"
                onClick={() => {
                  audioEngine.playTactileClick();
                  setShowJoinModal(true);
                }}
                className="border-white/10 bg-[#07080B] text-zinc-300 hover:text-white px-5 text-xs font-mono h-8 rounded"
              >
                ENTER SQUAD CODE
              </Button>
              <Button
                onClick={() => {
                  audioEngine.playTactileClick();
                  setShowCreateModal(true);
                }}
                className="bg-amber-400 hover:bg-amber-300 text-black font-mono font-bold text-xs uppercase tracking-wider px-5 h-8 rounded shadow-sm"
              >
                FORGE SQUAD PACT
              </Button>
            </div>
          </div>
        )}

        {/* ─── ACTIVE SQUAD PACT HERO ─── */}
        {pact && (
          <>
            {/* Squad Hero Banner */}
            <section className="obsidian-card border-amber-500/25 bg-gradient-to-r from-[#0E1218] to-[#090C10] rounded-xl p-5 sm:p-6 relative overflow-hidden">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="outline" className="border-amber-500/40 text-amber-400 bg-amber-500/10 font-mono text-[10px] uppercase tracking-wider">
                      ACTIVE SQUAD PACT
                    </Badge>
                    <span className="text-[10px] font-mono text-zinc-400 tabular-telemetry">WEEK #{pact.weekNumber}</span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold text-white uppercase font-mono">{pact.name}</h2>
                </div>

                <div className="flex items-center gap-5 bg-[#07080B] border border-white/10 px-5 py-3 rounded-lg">
                  <div>
                    <div className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider">SHARED POT</div>
                    <div className="text-xl sm:text-2xl font-bold text-amber-400 font-mono flex items-center gap-1.5 tabular-telemetry">
                      <Coins className="w-4 h-4 text-amber-400" /> {pact.totalPool}
                      <span className="text-xs text-zinc-500 font-normal">PTS</span>
                    </div>
                  </div>
                  <div className="h-8 w-px bg-white/10" />
                  <div>
                    <div className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider">MEMBER STAKE</div>
                    <div className="text-xl sm:text-2xl font-bold text-white font-mono tabular-telemetry">
                      {pact.weeklyStakePoints} <span className="text-xs text-zinc-500 font-normal">PTS</span>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* ─── SQUAD WORLD BOSS RAID ─── */}
            <WorldBossRaidCard
              squadMembers={members}
              squadName={pact.name}
              onSendPing={(note) => pingMutation.mutate({ pingType: "warning", note })}
            />

            {/* ─── LIVE AMBIENT INTELLIGENCE FEED ─── */}
            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                  <h3 className="text-xs font-semibold text-white uppercase tracking-wider font-mono">
                    LIVE OPERATIONAL TELEMETRY
                  </h3>
                </div>
                <span className="text-[10px] font-mono text-zinc-500 tabular-telemetry">
                  {members.length} BINDING OPERATIVES
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {members.map((m: any) => {
                  const isSession = m.currentLiveStatus === "in_session";
                  const isCompleted = m.currentLiveStatus === "completed_today";
                  const isUnresponsive = m.currentLiveStatus === "unresponsive";
                  const isBreached = m.currentLiveStatus === "breached";

                  return (
                    <div
                      key={m.id}
                      className={`obsidian-card p-4 rounded-lg border transition-all ${
                        isSession
                          ? "bg-[#090C10] border-cyan-500/40 shadow-md shadow-cyan-500/5"
                          : isBreached
                          ? "bg-[#090C10] border-red-500/40"
                          : isCompleted
                          ? "bg-[#090C10] border-emerald-500/30"
                          : "bg-[#090C10] border-white/5"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-md bg-[#141922] border border-white/10 flex items-center justify-center font-mono font-bold text-white text-xs">
                            {m.user?.name?.[0]?.toUpperCase() || "A"}
                          </div>
                          <div>
                            <div className="font-semibold text-xs text-white truncate max-w-[120px] font-mono">
                              {m.user?.name || "Operative"}
                            </div>
                            <div className="text-[10px] font-mono text-zinc-500">
                              TIER {m.user?.tier || "D"}
                            </div>
                          </div>
                        </div>

                        {/* Status Badge */}
                        <Badge
                          className={`font-mono text-[9px] uppercase px-1.5 py-0 tracking-wider ${
                            isSession
                              ? "bg-cyan-400 text-black animate-pulse"
                              : isCompleted
                              ? "bg-emerald-400 text-black"
                              : isBreached
                              ? "bg-red-500 text-white"
                              : isUnresponsive
                              ? "bg-amber-400 text-black"
                              : "bg-[#141922] text-zinc-400 border-white/10"
                          }`}
                        >
                          {m.currentLiveStatus?.replace("_", " ") || "IDLE"}
                        </Badge>
                      </div>

                      {/* Real-time stats */}
                      <div className="space-y-1 pt-2 border-t border-white/5 text-[11px] font-mono">
                        <div className="flex justify-between text-zinc-400">
                          <span>STAKE LOCKED:</span>
                          <span className="text-white font-semibold tabular-telemetry">{m.stakedPoints} PTS</span>
                        </div>
                        <div className="flex justify-between text-zinc-400">
                          <span>FOCUS MINUTES:</span>
                          <span className="text-cyan-400 font-semibold tabular-telemetry">{m.activeSessionMinutes}m</span>
                        </div>
                        {m.bonusReceived > 0 && (
                          <div className="flex justify-between text-emerald-400">
                            <span>BONUS SHARE:</span>
                            <span className="font-semibold tabular-telemetry">+{m.bonusReceived} PTS</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* ─── TACTICAL RADIO BEACON (PULSE COMMS) ─── */}
            <section className="obsidian-panel rounded-xl p-4 sm:p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <RadioTower className="w-3.5 h-3.5 text-cyan-400" />
                  <h3 className="text-xs font-semibold text-white uppercase tracking-wider font-mono">
                    TACTICAL RADIO BEACON // TRANSMITTER
                  </h3>
                </div>
                <Badge variant="outline" className="border-cyan-500/25 text-cyan-400 bg-cyan-500/10 text-[9px] font-mono uppercase tracking-wider">
                  FREQUENCY ARMED
                </Badge>
              </div>

              {/* Quick Ping Actions */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={pingMutation.isPending}
                  onClick={() => pingMutation.mutate({ pingType: "pushing_focus" })}
                  className="h-8 border-white/10 bg-[#07080B] hover:border-cyan-500/40 hover:bg-cyan-500/10 text-xs font-mono justify-start px-2.5 rounded"
                >
                  <Zap className="w-3 h-3 text-cyan-400 mr-2 shrink-0" />
                  DEEP BLOCK
                </Button>

                <Button
                  size="sm"
                  variant="outline"
                  disabled={pingMutation.isPending}
                  onClick={() => pingMutation.mutate({ pingType: "holding_line" })}
                  className="h-8 border-white/10 bg-[#07080B] hover:border-emerald-500/40 hover:bg-emerald-500/10 text-xs font-mono justify-start px-2.5 rounded"
                >
                  <CheckCircle2 className="w-3 h-3 text-emerald-400 mr-2 shrink-0" />
                  HOLDING LINE
                </Button>

                <Button
                  size="sm"
                  variant="outline"
                  disabled={pingMutation.isPending}
                  onClick={() => pingMutation.mutate({ pingType: "friction_warning" })}
                  className="h-8 border-white/10 bg-[#07080B] hover:border-amber-500/40 hover:bg-amber-500/10 text-xs font-mono justify-start px-2.5 rounded"
                >
                  <AlertTriangle className="w-3 h-3 text-amber-400 mr-2 shrink-0" />
                  FRICTION RISK
                </Button>

                <Button
                  size="sm"
                  variant="outline"
                  disabled={pingMutation.isPending}
                  onClick={() => pingMutation.mutate({ pingType: "mission_complete" })}
                  className="h-8 border-white/10 bg-[#07080B] hover:border-purple-500/40 hover:bg-purple-500/10 text-xs font-mono justify-start px-2.5 rounded"
                >
                  <Flame className="w-3 h-3 text-purple-400 mr-2 shrink-0" />
                  CONQUERED
                </Button>
              </div>

              {/* Custom Comm Broadcast Bar */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!customPingNote.trim()) return;
                  pingMutation.mutate({ pingType: "pushing_focus", note: customPingNote.trim() });
                }}
                className="flex items-center gap-2 pt-1"
              >
                <Input
                  value={customPingNote}
                  onChange={(e) => setCustomPingNote(e.target.value)}
                  placeholder="Transmit tactical status or objective update..."
                  className="bg-[#07080B] border-white/10 text-xs text-white placeholder:text-zinc-600 font-mono h-8 rounded"
                />
                <Button
                  type="submit"
                  size="sm"
                  disabled={pingMutation.isPending || !customPingNote.trim()}
                  className="h-8 bg-cyan-400 hover:bg-cyan-300 text-black font-mono font-bold px-3.5 shrink-0 text-xs uppercase tracking-wider rounded"
                >
                  <Send className="w-3 h-3 mr-1" />
                  TRANSMIT
                </Button>
              </form>
            </section>

            {/* ─── LIVE AMBIENT SQUAD ACTIVITY FEED (WAR ROOM TERMINAL) ─── */}
            <section className="obsidian-panel rounded-xl p-4 sm:p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Terminal className="w-3.5 h-3.5 text-emerald-400" />
                  <h3 className="text-xs font-semibold text-white uppercase tracking-wider font-mono">
                    OPERATIONAL ACTIVITY STREAM // AUDIT LOG
                  </h3>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-[10px] font-mono text-emerald-400 uppercase tracking-wider">ACTIVE (3S)</span>
                </div>
              </div>

              {/* Feed Stream */}
              <div className="bg-[#07080B] border border-white/5 rounded-lg p-3 max-h-60 overflow-y-auto space-y-2 font-mono text-xs divide-y divide-white/5">
                {feedEvents.length === 0 ? (
                  <div className="text-center py-6 text-zinc-500 text-xs uppercase tracking-wider">
                    NO ACTIVITY LOGGED. TRANSMIT A TACTICAL BEACON ABOVE.
                  </div>
                ) : (
                  feedEvents.map((ev: any) => {
                    const isFinished = ev.type === "focus_finished";
                    const isStarted = ev.type === "focus_started";
                    const isBreach = ev.type === "breach";

                    return (
                      <div key={ev.id} className="pt-2 first:pt-0 flex items-start justify-between gap-3">
                        <div className="flex items-start gap-2">
                          <span className="text-[10px] text-zinc-500 shrink-0 mt-0.5 tabular-telemetry">
                            [{ev.timestamp}]
                          </span>
                          <span className={`font-semibold text-xs shrink-0 ${isBreach ? "text-red-400" : isFinished ? "text-emerald-400" : isStarted ? "text-cyan-400" : "text-amber-400"}`}>
                            {ev.userName}:
                          </span>
                          <span className="text-zinc-300 leading-snug text-xs font-sans">
                            {ev.message}
                          </span>
                        </div>
                        <Badge
                          variant="outline"
                          className={`text-[9px] uppercase font-mono shrink-0 px-1.5 py-0 ${
                            isBreach
                              ? "border-red-500/30 text-red-400 bg-red-500/10"
                              : isFinished
                              ? "border-emerald-500/30 text-emerald-400 bg-emerald-500/10"
                              : isStarted
                              ? "border-cyan-500/30 text-cyan-400 bg-cyan-500/10"
                              : "border-white/10 text-zinc-400"
                          }`}
                        >
                          {ev.type.replace("_", " ")}
                        </Badge>
                      </div>
                    );
                  })
                )}
              </div>
            </section>
          </>
        )}
      </div>

      {/* ─── CREATE PACT MODAL ─── */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="max-w-md bg-[#0E1218] border border-white/10 text-white p-6 space-y-4 rounded-xl shadow-2xl backdrop-blur-2xl font-sans">
          <DialogHeader>
            <DialogTitle className="text-base font-bold font-mono tracking-tight text-white flex items-center gap-2 uppercase">
              <Users className="w-4 h-4 text-amber-400" />
              FORGE NEW SQUAD PACT
            </DialogTitle>
            <DialogDescription className="text-xs text-zinc-400 leading-relaxed">
              Establish a 3–5 operative mutual commitment covenant. Set the required weekly discipline stake.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-1">
            <div className="space-y-1.5">
              <Label htmlFor="pactName" className="text-xs font-mono text-zinc-300 uppercase tracking-wider">
                SQUAD IDENTIFIER:
              </Label>
              <Input
                id="pactName"
                placeholder="e.g. Ironclad Vanguard, Protocol Alpha"
                value={pactName}
                onChange={(e) => setPactName(e.target.value)}
                className="bg-[#07080B] border-white/10 text-white text-xs h-9 font-sans"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-zinc-300 uppercase tracking-wider">WEEKLY STAKE PER MEMBER:</span>
                <span className="text-amber-400 font-bold tabular-telemetry">{stakePoints} PTS</span>
              </div>
              <Input
                type="number"
                min={10}
                max={200}
                step={10}
                value={stakePoints}
                onChange={(e) => setStakePoints(parseInt(e.target.value) || 50)}
                className="bg-[#07080B] border-white/10 text-white text-xs h-9 font-mono"
              />
              <p className="text-[10px] text-zinc-500 font-sans">
                Staked directly from verified discipline balance into the mutual escrow pool.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3">
            <Button
              variant="outline"
              onClick={() => {
                audioEngine.playTactileClick();
                setShowCreateModal(false);
              }}
              className="border-white/10 bg-[#07080B] text-zinc-400 hover:text-white text-xs font-mono h-8 rounded"
            >
              CANCEL
            </Button>
            <Button
              onClick={() => createMutation.mutate()}
              disabled={createMutation.isPending || !pactName.trim()}
              className="bg-amber-400 hover:bg-amber-300 text-black font-mono font-bold text-xs uppercase tracking-wider h-8 px-4 rounded shadow-sm"
            >
              {createMutation.isPending ? "FORGING..." : "ACTIVATE PACT"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ─── JOIN PACT MODAL ─── */}
      <Dialog open={showJoinModal} onOpenChange={setShowJoinModal}>
        <DialogContent className="max-w-md bg-[#0E1218] border border-white/10 text-white p-6 space-y-4 rounded-xl shadow-2xl backdrop-blur-2xl font-sans">
          <DialogHeader>
            <DialogTitle className="text-base font-bold font-mono tracking-tight text-white flex items-center gap-2 uppercase">
              <UserPlus className="w-4 h-4 text-cyan-400" />
              JOIN SQUAD PACT
            </DialogTitle>
            <DialogDescription className="text-xs text-zinc-400 leading-relaxed">
              Enter the unique squad invite code provided by your covenant lead.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2 pt-1">
            <Label htmlFor="inviteCode" className="text-xs font-mono text-zinc-300 uppercase tracking-wider">
              SQUAD INVITE CODE:
            </Label>
            <Input
              id="inviteCode"
              placeholder="e.g. 7X9K2P"
              value={inviteCodeInput}
              onChange={(e) => setInviteCodeInput(e.target.value.toUpperCase())}
              className="bg-[#07080B] border-white/10 text-white font-mono uppercase tracking-widest text-center text-base h-10 rounded"
            />
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3">
            <Button
              variant="outline"
              onClick={() => {
                audioEngine.playTactileClick();
                setShowJoinModal(false);
              }}
              className="border-white/10 bg-[#07080B] text-zinc-400 hover:text-white text-xs font-mono h-8 rounded"
            >
              CANCEL
            </Button>
            <Button
              onClick={() => joinMutation.mutate()}
              disabled={joinMutation.isPending || inviteCodeInput.trim().length < 4}
              className="bg-cyan-400 hover:bg-cyan-300 text-black font-mono font-bold text-xs uppercase tracking-wider h-8 px-4 rounded shadow-sm"
            >
              {joinMutation.isPending ? "CONNECTING..." : "BIND TO PACT"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
