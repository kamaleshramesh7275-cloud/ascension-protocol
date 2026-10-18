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
  Activity
} from "lucide-react";
import { audioEngine } from "@/lib/audio-engine";

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
      const res = await apiRequest("POST", "/api/squad-pact/ping", { pingType, note });
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/squad-pact/feed"] });
      audioEngine.playCommandLock();
      toast({
        title: "📡 BEACON TRANSMITTED",
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
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col p-4 sm:p-6 md:p-8 relative overflow-hidden">
      {/* Ambient background glow */}
      <div className="absolute top-0 right-1/3 w-96 h-96 bg-amber-500/5 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-10 w-96 h-96 bg-cyan-500/5 blur-3xl pointer-events-none" />

      <div className="w-full max-w-5xl mx-auto space-y-8 relative z-10">
        {/* Header */}
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <Badge variant="outline" className="border-amber-500/40 text-amber-400 bg-amber-500/10 font-mono text-[11px] uppercase tracking-wider">
                <Users className="w-3.5 h-3.5 mr-1 inline" /> PILLAR 4: SQUAD PACT SYSTEM
              </Badge>
              <Badge variant="outline" className="border-slate-800 text-slate-400 font-mono text-[11px]">
                Collective Accountability
              </Badge>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              SQUAD PACT COMMAND
            </h1>
          </div>

          <div className="flex items-center gap-3">
            {!pact && (
              <>
                <Button
                  variant="outline"
                  onClick={() => setShowJoinModal(true)}
                  className="border-slate-800 text-slate-300 hover:bg-slate-900 text-xs font-mono"
                >
                  Join via Code
                </Button>
                <Button
                  onClick={() => setShowCreateModal(true)}
                  className="bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs flex items-center gap-1.5 px-4"
                >
                  <UserPlus className="w-3.5 h-3.5" /> Forge New Pact
                </Button>
              </>
            )}
            {pact && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
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
                className="border-cyan-500/40 text-cyan-400 bg-cyan-500/10 hover:bg-cyan-500/20 font-mono text-xs px-3 py-1 flex items-center gap-1.5"
              >
                <Share2 className="w-3.5 h-3.5" />
                INVITE CODE: {pact.inviteCode}
              </Button>
            )}
          </div>
        </header>

        {/* ─── IF NO SQUAD PACT ACTIVE ─── */}
        {!pact && !isLoading && (
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-8 text-center space-y-6 max-w-2xl mx-auto my-8">
            <div className="w-16 h-16 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto text-amber-400">
              <Lock className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-black text-white">
                NO ACTIVE SQUAD PACT
              </h2>
              <p className="text-sm text-slate-400 max-w-md mx-auto leading-relaxed">
                Solo discipline is fragile. Form or join a 3–5 member Squad Pact.
                Each member stakes Discipline Points into a shared weekly pot. If you fail, your stake redistributes to your peers.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-left">
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800/80">
                <div className="text-amber-400 font-bold text-xs uppercase font-mono mb-1">1. Stake Points</div>
                <div className="text-xs text-slate-400">Lock 50–200 Discipline Points into the squad pot every week.</div>
              </div>
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800/80">
                <div className="text-cyan-400 font-bold text-xs uppercase font-mono mb-1">2. Live Intelligence</div>
                <div className="text-xs text-slate-400">Ambient social pressure shows when peers are in active focus sessions.</div>
              </div>
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800/80">
                <div className="text-emerald-400 font-bold text-xs uppercase font-mono mb-1">3. Collective Stakes</div>
                <div className="text-xs text-slate-400">Fail your contract = forfeit your stake to peers. All pass = +20% bonus.</div>
              </div>
            </div>

            <div className="flex items-center justify-center gap-4 pt-4">
              <Button
                variant="outline"
                onClick={() => setShowJoinModal(true)}
                className="border-slate-800 text-slate-300 hover:bg-slate-900 px-6"
              >
                Enter Squad Code
              </Button>
              <Button
                onClick={() => setShowCreateModal(true)}
                className="bg-amber-500 hover:bg-amber-400 text-black font-extrabold px-6"
              >
                Forge Squad Pact
              </Button>
            </div>
          </div>
        )}

        {/* ─── ACTIVE SQUAD PACT HERO ─── */}
        {pact && (
          <>
            {/* Squad Hero Banner */}
            <section className="bg-gradient-to-r from-slate-900 via-slate-900/90 to-slate-950 border-2 border-amber-500/30 rounded-2xl p-6 sm:p-8 relative overflow-hidden">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <Badge variant="outline" className="border-amber-500 text-amber-400 bg-amber-500/10 font-mono text-xs uppercase">
                      ACTIVE SQUAD PACT
                    </Badge>
                    <span className="text-xs font-mono text-slate-400">WEEK #{pact.weekNumber}</span>
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-black text-white">{pact.name}</h2>
                </div>

                <div className="flex items-center gap-6 bg-slate-950/80 border border-slate-800 px-6 py-3.5 rounded-xl">
                  <div>
                    <div className="text-[11px] font-mono text-slate-400 uppercase">SHARED POT</div>
                    <div className="text-2xl font-black text-amber-400 font-mono flex items-center gap-1.5">
                      <Coins className="w-5 h-5 text-amber-400" /> {pact.totalPool}
                      <span className="text-xs text-slate-500 font-normal">PTS</span>
                    </div>
                  </div>
                  <div className="h-8 w-px bg-slate-800" />
                  <div>
                    <div className="text-[11px] font-mono text-slate-400 uppercase">MEMBER STAKE</div>
                    <div className="text-2xl font-black text-white font-mono">
                      {pact.weeklyStakePoints} <span className="text-xs text-slate-500 font-normal">PTS</span>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* ─── LIVE AMBIENT INTELLIGENCE FEED ─── */}
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                    LIVE AMBIENT INTELLIGENCE FEED
                  </h3>
                </div>
                <span className="text-xs font-mono text-slate-500">
                  {members.length} BINDING MEMBERS
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {members.map((m: any) => {
                  const isSession = m.currentLiveStatus === "in_session";
                  const isCompleted = m.currentLiveStatus === "completed_today";
                  const isUnresponsive = m.currentLiveStatus === "unresponsive";
                  const isBreached = m.currentLiveStatus === "breached";

                  return (
                    <div
                      key={m.id}
                      className={`p-5 rounded-2xl border transition-all ${
                        isSession
                          ? "bg-cyan-950/20 border-cyan-500/50 shadow-lg shadow-cyan-500/10"
                          : isBreached
                          ? "bg-red-950/20 border-red-500/40"
                          : isCompleted
                          ? "bg-emerald-950/20 border-emerald-500/40"
                          : "bg-slate-900/80 border-slate-800"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-9 h-9 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-white text-sm">
                            {m.user?.name?.[0]?.toUpperCase() || "A"}
                          </div>
                          <div>
                            <div className="font-bold text-white text-sm truncate max-w-[120px]">
                              {m.user?.name || "Ascendant"}
                            </div>
                            <div className="text-[11px] font-mono text-slate-400">
                              Tier {m.user?.tier || "D"}
                            </div>
                          </div>
                        </div>

                        {/* Status Badge */}
                        <Badge
                          className={`font-mono text-[10px] uppercase ${
                            isSession
                              ? "bg-cyan-500 text-black animate-pulse"
                              : isCompleted
                              ? "bg-emerald-500 text-black"
                              : isBreached
                              ? "bg-red-500 text-white"
                              : isUnresponsive
                              ? "bg-amber-500 text-black"
                              : "bg-slate-800 text-slate-400"
                          }`}
                        >
                          {m.currentLiveStatus?.replace("_", " ") || "IDLE"}
                        </Badge>
                      </div>

                      {/* Real-time stats */}
                      <div className="space-y-1 pt-2 border-t border-slate-800/80 text-xs font-mono">
                        <div className="flex justify-between text-slate-400">
                          <span>STAKE LOCKED:</span>
                          <span className="text-white font-bold">{m.stakedPoints} PTS</span>
                        </div>
                        <div className="flex justify-between text-slate-400">
                          <span>FOCUS MINUTES:</span>
                          <span className="text-cyan-400 font-bold">{m.activeSessionMinutes}m</span>
                        </div>
                        {m.bonusReceived > 0 && (
                          <div className="flex justify-between text-emerald-400">
                            <span>BONUS SHARE:</span>
                            <span className="font-bold">+{m.bonusReceived} PTS</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* ─── TACTICAL RADIO BEACON (PULSE COMMS) ─── */}
            <section className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <RadioTower className="w-4 h-4 text-cyan-400" />
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                    TACTICAL RADIO BEACON // TRANSMITTER
                  </h3>
                </div>
                <Badge variant="outline" className="border-cyan-500/30 text-cyan-400 bg-cyan-500/10 text-[10px] font-mono">
                  SQUAD FREQUENCY ARMED
                </Badge>
              </div>

              {/* Quick Ping Actions */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={pingMutation.isPending}
                  onClick={() => pingMutation.mutate({ pingType: "pushing_focus" })}
                  className="h-9 border-slate-800 hover:border-cyan-500/50 hover:bg-cyan-500/10 text-xs font-mono justify-start px-3"
                >
                  <Zap className="w-3.5 h-3.5 text-cyan-400 mr-2 shrink-0" />
                  ⚡ Deep Block
                </Button>

                <Button
                  size="sm"
                  variant="outline"
                  disabled={pingMutation.isPending}
                  onClick={() => pingMutation.mutate({ pingType: "holding_line" })}
                  className="h-9 border-slate-800 hover:border-emerald-500/50 hover:bg-emerald-500/10 text-xs font-mono justify-start px-3"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 mr-2 shrink-0" />
                  🛡️ Holding Line
                </Button>

                <Button
                  size="sm"
                  variant="outline"
                  disabled={pingMutation.isPending}
                  onClick={() => pingMutation.mutate({ pingType: "friction_warning" })}
                  className="h-9 border-slate-800 hover:border-amber-500/50 hover:bg-amber-500/10 text-xs font-mono justify-start px-3"
                >
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400 mr-2 shrink-0" />
                  ⚠️ Friction Risk
                </Button>

                <Button
                  size="sm"
                  variant="outline"
                  disabled={pingMutation.isPending}
                  onClick={() => pingMutation.mutate({ pingType: "mission_complete" })}
                  className="h-9 border-slate-800 hover:border-purple-500/50 hover:bg-purple-500/10 text-xs font-mono justify-start px-3"
                >
                  <Flame className="w-3.5 h-3.5 text-purple-400 mr-2 shrink-0" />
                  🎯 Conquered
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
                  placeholder="Transmit tactical squad message or mission status update..."
                  className="bg-slate-950 border-slate-800 text-xs text-white placeholder:text-slate-600 font-mono h-9"
                />
                <Button
                  type="submit"
                  size="sm"
                  disabled={pingMutation.isPending || !customPingNote.trim()}
                  className="h-9 bg-cyan-600 hover:bg-cyan-500 text-black font-bold px-4 shrink-0 text-xs font-mono flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  Transmit
                </Button>
              </form>
            </section>

            {/* ─── LIVE AMBIENT SQUAD ACTIVITY FEED (WAR ROOM TERMINAL) ─── */}
            <section className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-emerald-400" />
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                    LIVE AMBIENT ACTIVITY FEED // AUDIT LOG
                  </h3>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                  <span className="text-[11px] font-mono text-emerald-400">PULSING (3s)</span>
                </div>
              </div>

              {/* Feed Stream */}
              <div className="bg-slate-950 border border-slate-800/80 rounded-xl p-3 max-h-64 overflow-y-auto space-y-2 font-mono text-xs divide-y divide-slate-800/40">
                {feedEvents.length === 0 ? (
                  <div className="text-center py-6 text-slate-500 text-xs">
                    No activity recorded yet. Transmit a beacon above.
                  </div>
                ) : (
                  feedEvents.map((ev: any) => {
                    const isPing = ev.type === "ping";
                    const isFinished = ev.type === "focus_finished";
                    const isStarted = ev.type === "focus_started";
                    const isBreach = ev.type === "breach";

                    return (
                      <div key={ev.id} className="pt-2 first:pt-0 flex items-start justify-between gap-3">
                        <div className="flex items-start gap-2.5">
                          <span className="text-[11px] text-slate-500 shrink-0 mt-0.5">
                            [{ev.timestamp}]
                          </span>
                          <span className={`font-bold shrink-0 ${isBreach ? "text-red-400" : isFinished ? "text-emerald-400" : isStarted ? "text-cyan-400" : "text-amber-400"}`}>
                            {ev.userName}:
                          </span>
                          <span className="text-slate-300 leading-snug">
                            {ev.message}
                          </span>
                        </div>
                        <Badge
                          variant="outline"
                          className={`text-[9px] uppercase font-mono shrink-0 ${
                            isBreach
                              ? "border-red-500/40 text-red-400 bg-red-500/10"
                              : isFinished
                              ? "border-emerald-500/40 text-emerald-400 bg-emerald-500/10"
                              : isStarted
                              ? "border-cyan-500/40 text-cyan-400 bg-cyan-500/10"
                              : "border-slate-800 text-slate-400"
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
        <DialogContent className="max-w-md bg-slate-950 border border-slate-800 p-6 space-y-4">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-amber-400" />
              FORGE NEW SQUAD PACT
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-400">
              Form an elite 3–5 person accountability unit. You will establish the initial weekly stake.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label htmlFor="pactName" className="text-xs font-semibold text-slate-300">
                Squad Name
              </Label>
              <Input
                id="pactName"
                placeholder="e.g. Ironclad Vanguard, Protocol Alpha"
                value={pactName}
                onChange={(e) => setPactName(e.target.value)}
                className="bg-slate-900 border-slate-700 text-white"
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-slate-300 font-semibold">WEEKLY STAKE PER MEMBER:</span>
                <span className="text-amber-400 font-bold">{stakePoints} PTS</span>
              </div>
              <Input
                type="number"
                min={10}
                max={200}
                step={10}
                value={stakePoints}
                onChange={(e) => setStakePoints(parseInt(e.target.value) || 50)}
                className="bg-slate-900 border-slate-700 text-white"
              />
              <p className="text-[11px] text-slate-500">
                Staked directly from your Discipline Score into the collective pot.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3">
            <Button variant="outline" onClick={() => setShowCreateModal(false)} className="border-slate-800 text-slate-400">
              Cancel
            </Button>
            <Button
              onClick={() => createMutation.mutate()}
              disabled={createMutation.isPending || !pactName.trim()}
              className="bg-amber-500 hover:bg-amber-400 text-black font-extrabold"
            >
              {createMutation.isPending ? "FORGING..." : "ACTIVATE PACT"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ─── JOIN PACT MODAL ─── */}
      <Dialog open={showJoinModal} onOpenChange={setShowJoinModal}>
        <DialogContent className="max-w-md bg-slate-950 border border-slate-800 p-6 space-y-4">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-white flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-cyan-400" />
              JOIN SQUAD PACT
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-400">
              Enter the unique 6-character squad invite code provided by your squad leader.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2 pt-2">
            <Label htmlFor="inviteCode" className="text-xs font-semibold text-slate-300">
              Squad Invite Code
            </Label>
            <Input
              id="inviteCode"
              placeholder="e.g. 7X9K2P"
              value={inviteCodeInput}
              onChange={(e) => setInviteCodeInput(e.target.value.toUpperCase())}
              className="bg-slate-900 border-slate-700 text-white font-mono uppercase tracking-widest text-center text-lg h-12"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3">
            <Button variant="outline" onClick={() => setShowJoinModal(false)} className="border-slate-800 text-slate-400">
              Cancel
            </Button>
            <Button
              onClick={() => joinMutation.mutate()}
              disabled={joinMutation.isPending || inviteCodeInput.trim().length < 4}
              className="bg-cyan-500 hover:bg-cyan-400 text-black font-extrabold"
            >
              {joinMutation.isPending ? "CONNECTING..." : "BIND TO PACT"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
