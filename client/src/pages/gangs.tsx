import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import { apiRequest } from "@/lib/queryClient";
import { User } from "@shared/schema";
import {
  Shield, Users, Swords, Trophy, Castle, Plus, Copy, Crown,
  ArrowRight, Zap, Target, ChevronRight, Share2, Check
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

// ─── Types ───────────────────────────────────────────────────────────────────
interface GangGroup {
  id: string;
  name: string;
  icon: string | null;
  inviteCode: string;
  leaderId: string;
  treasuryCoins: number;
  hideoutLevel: number;
  createdAt: string;
}
interface GangMember {
  id: string;
  gangId: string;
  userId: string;
  role: string;
  joinedAt: string;
  user: User;
}
interface GangCoopQuest {
  id: string;
  gangId: string;
  objective: string;
  targetValue: number;
  currentValue: number;
  rewardCoins: number;
  expiresAt: string;
  completedAt: string | null;
}
interface GangDuel {
  id: string;
  challengerGangId: string;
  defenderGangId: string;
  status: string;
  duelType: string;
  challengerScore: number;
  defenderScore: number;
  winnerId: string | null;
  expiresAt: string;
}
interface GangData {
  gang: GangGroup;
  members: GangMember[];
  coopQuest: GangCoopQuest | null;
  duels: GangDuel[];
}

// ─── Hideout Config ──────────────────────────────────────────────────────────
const HIDEOUT_LEVELS = [
  { level: 1, name: "Field Outpost", tag: "STAGE 01", upgradeCost: 500 },
  { level: 2, name: "Fortified Redoubt", tag: "STAGE 02", upgradeCost: 1000 },
  { level: 3, name: "Iron Command", tag: "STAGE 03", upgradeCost: 2000 },
  { level: 4, name: "Apex Bastion", tag: "STAGE 04", upgradeCost: 5000 },
  { level: 5, name: "Sovereign Citadel", tag: "STAGE 05", upgradeCost: null },
];

// ─── No Gang View ────────────────────────────────────────────────────────────
function NoGangView() {
  const [gangName, setGangName] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [joinOpen, setJoinOpen] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("join");
    if (code) {
      setJoinCode(code.toUpperCase());
      setJoinOpen(true);
    }
  }, []);

  const createGang = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/gangs", { name: gangName, icon: null });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/gangs/my-gang"] });
      setCreateOpen(false);
      toast({ title: "SQUAD ESTABLISHED", description: "Your private tactical crew is live. Dispatch invite links." });
    },
    onError: (err: any) => {
      toast({ title: "Operation Error", description: err.message || "Failed to establish squad", variant: "destructive" });
    },
  });

  const joinGang = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/gangs/join", { inviteCode: joinCode });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/gangs/my-gang"] });
      setJoinOpen(false);
      toast({ title: "SQUAD ACCESS GRANTED", description: "Successfully attached to squad unit." });
    },
    onError: (err: any) => {
      toast({ title: "Access Denied", description: err.message || "Invalid squad invite code", variant: "destructive" });
    },
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center font-mono"
    >
      <div className="w-16 h-16 rounded-xl bg-zinc-900 border border-white/10 flex items-center justify-center mb-6">
        <Shield className="w-8 h-8 text-blue-400" />
      </div>

      <div className="inline-block px-2.5 py-0.5 rounded bg-zinc-900 border border-white/10 text-[10px] text-zinc-400 uppercase tracking-widest mb-2">
        TACTICAL SQUAD FORMATION
      </div>
      <h1 className="text-2xl sm:text-3xl font-extrabold uppercase tracking-tight text-white mb-2">
        Assemble Your Unit
      </h1>
      <p className="text-xs text-zinc-400 max-w-md mb-8 leading-relaxed">
        Establish or join a private crew of up to 10 operatives. Execute weekly co-op objectives, wage XP tactical duels, and fortify squad headquarters.
      </p>

      <div className="flex flex-col sm:flex-row gap-3 w-full max-w-sm">
        {/* Create Dialog */}
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button className="flex-1 bg-white hover:bg-zinc-200 text-black font-mono text-xs font-bold uppercase h-10 tracking-wider">
              <Plus className="w-4 h-4 mr-1.5" /> Establish Squad
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-[#0A0D12] border-white/10 text-white font-mono max-w-md p-6">
            <DialogHeader>
              <DialogTitle className="text-base uppercase tracking-wider font-bold">Establish New Squad</DialogTitle>
              <DialogDescription className="text-xs text-zinc-400 font-mono">
                Assign a designation to initialize your squad frequency.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="space-y-1.5">
                <label className="text-[10px] text-zinc-400 uppercase tracking-wider block">Squad Callsign</label>
                <Input
                  placeholder="e.g. Apex Vanguard"
                  value={gangName}
                  onChange={(e) => setGangName(e.target.value)}
                  maxLength={24}
                  className="bg-black/50 border-white/10 text-xs font-mono text-white h-9"
                />
              </div>
              <Button
                className="w-full bg-white hover:bg-zinc-200 text-black font-mono text-xs font-bold uppercase h-9"
                onClick={() => createGang.mutate()}
                disabled={!gangName.trim() || createGang.isPending}
              >
                {createGang.isPending ? "INITIALIZING UNIT..." : "AUTHORIZE FORMATION"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Join Dialog */}
        <Dialog open={joinOpen} onOpenChange={setJoinOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" className="flex-1 border-white/15 hover:bg-zinc-800 text-white font-mono text-xs uppercase h-10">
              <ArrowRight className="w-4 h-4 mr-1.5" /> Enter Invite Code
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-[#0A0D12] border-white/10 text-white font-mono max-w-md p-6">
            <DialogHeader>
              <DialogTitle className="text-base uppercase tracking-wider font-bold">Join Existing Squad</DialogTitle>
              <DialogDescription className="text-xs text-zinc-400 font-mono">
                Input the squad transmission code provided by your unit commander.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="space-y-1.5">
                <label className="text-[10px] text-zinc-400 uppercase tracking-wider block">Invite Code</label>
                <Input
                  placeholder="e.g. GANG-A3X7"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  maxLength={12}
                  className="bg-black/50 border-white/10 text-xs font-mono tracking-widest text-white h-9"
                />
              </div>
              <Button
                className="w-full bg-white hover:bg-zinc-200 text-black font-mono text-xs font-bold uppercase h-9"
                onClick={() => joinGang.mutate()}
                disabled={!joinCode.trim() || joinGang.isPending}
              >
                {joinGang.isPending ? "AUTHENTICATING CODE..." : "LINK TO SQUAD"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </motion.div>
  );
}

// ─── Active Gang Dashboard ───────────────────────────────────────────────────
type GangTab = "overview" | "quests" | "duels" | "leaderboard" | "hideout";

function GangDashboard({ data }: { data: GangData }) {
  const [tab, setTab] = useState<GangTab>("overview");
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const tabs: { id: GangTab; label: string; icon: React.ReactNode }[] = [
    { id: "overview", label: "Overview", icon: <Shield className="w-3.5 h-3.5" /> },
    { id: "quests", label: "Co-op", icon: <Target className="w-3.5 h-3.5" /> },
    { id: "duels", label: "Duels", icon: <Swords className="w-3.5 h-3.5" /> },
    { id: "leaderboard", label: "Roster", icon: <Trophy className="w-3.5 h-3.5" /> },
    { id: "hideout", label: "Headquarters", icon: <Castle className="w-3.5 h-3.5" /> },
  ];

  const squadDeepLink = `${window.location.origin}/gangs?join=${data.gang.inviteCode}`;

  const handleShareInvite = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Ascension Protocol - Squad ${data.gang.name}`,
          text: `Join our tactical squad [${data.gang.name}]. Direct Code: ${data.gang.inviteCode}`,
          url: squadDeepLink,
        });
        return;
      } catch {
        // Fall back to clipboard
      }
    }
    navigator.clipboard.writeText(squadDeepLink);
    setCopied(true);
    toast({
      title: "SQUAD DEEP LINK COPIED",
      description: "Direct transmission URL copied to clipboard.",
    });
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="space-y-6 pb-24 font-mono">
      {/* Squad Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-lg bg-[#090B0E] border border-white/10 p-5 relative overflow-hidden shadow-xl"
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-lg bg-zinc-900 border border-white/15 flex items-center justify-center font-bold text-lg text-white">
              {data.gang.name.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-zinc-500 uppercase tracking-widest">SQUAD UNIT</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-zinc-800 text-zinc-300 border border-white/5">
                  {data.gang.inviteCode}
                </span>
              </div>
              <h1 className="text-xl font-extrabold text-white uppercase tracking-tight">{data.gang.name}</h1>
              <div className="flex items-center gap-4 text-xs text-zinc-400 mt-0.5">
                <span>{data.members.length}/10 OPERATIVES</span>
                <span>TREASURY: <span className="text-amber-400 font-bold">{data.gang.treasuryCoins}</span> COINS</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Button
              variant="outline"
              size="sm"
              className="border-white/15 hover:bg-zinc-800 text-xs uppercase h-8 px-3 font-mono flex-1 sm:flex-initial"
              onClick={handleShareInvite}
            >
              {copied ? <Check className="w-3.5 h-3.5 mr-1 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5 mr-1" />}
              {copied ? "COPIED" : "TRANSMIT INVITE"}
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Tabs */}
      <div className="flex gap-1 bg-zinc-950/80 rounded-md p-1 border border-white/10 overflow-x-auto">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-mono uppercase tracking-wider transition-all whitespace-nowrap flex-1 justify-center ${
              tab === t.id
                ? "bg-white text-black font-bold shadow-sm"
                : "text-zinc-400 hover:text-white hover:bg-white/5"
            }`}
          >
            {t.icon}
            <span>{t.label}</span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={tab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.15 }}
        >
          {tab === "overview" && <OverviewTab data={data} />}
          {tab === "quests" && <CoopQuestTab data={data} />}
          {tab === "duels" && <DuelsTab data={data} />}
          {tab === "leaderboard" && <LeaderboardTab gangId={data.gang.id} />}
          {tab === "hideout" && <HideoutTab data={data} />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

// ─── Tab: Overview ───────────────────────────────────────────────────────────
function OverviewTab({ data }: { data: GangData }) {
  return (
    <div className="space-y-4 font-mono">
      <div className="flex items-center justify-between">
        <h2 className="text-xs uppercase tracking-wider text-zinc-400 flex items-center gap-2">
          <Users className="w-4 h-4 text-zinc-300" /> Unit Roster ({data.members.length}/10)
        </h2>
      </div>
      <div className="grid gap-2">
        {data.members.map((m) => (
          <div key={m.id} className="flex items-center gap-3 p-3 rounded bg-[#090B0E] border border-white/10">
            <Avatar className="w-8 h-8 rounded border border-white/10">
              <AvatarFallback className="bg-zinc-800 text-white text-xs font-bold">
                {(m.user.name || "?")[0].toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-xs text-white truncate">{m.user.name || "Operative"}</p>
              <p className="text-[10px] text-zinc-500 uppercase">TIER: {m.user.tier || "INITIATE"} // LVL: {m.user.level}</p>
            </div>
            {m.role === "leader" && (
              <span className="flex items-center gap-1 text-amber-400 text-[10px] uppercase font-bold bg-amber-400/10 border border-amber-400/20 px-2 py-0.5 rounded">
                <Crown className="w-3 h-3" /> Commander
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Tab: Co-op Quest ────────────────────────────────────────────────────────
function CoopQuestTab({ data }: { data: GangData }) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const quest = data.coopQuest;

  const contribute = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/gangs/${data.gang.id}/contribute`, { amount: 1 });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/gangs/my-gang"] });
      toast({ title: "CONTRIBUTION LOGGED", description: "+1 unit metric added to mission objective." });
    },
  });

  if (!quest) {
    return (
      <div className="text-center py-12 text-zinc-500 font-mono text-xs">
        <Target className="w-8 h-8 mx-auto mb-2 opacity-30" />
        <p>NO ACTIVE CO-OP OBJECTIVE THIS CYCLE.</p>
      </div>
    );
  }

  const progress = Math.min((quest.currentValue / quest.targetValue) * 100, 100);
  const isComplete = quest.completedAt !== null;

  return (
    <div className="space-y-4 font-mono">
      <div className="p-5 rounded-md bg-[#090B0E] border border-white/10">
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="text-[10px] text-zinc-500 uppercase tracking-widest mb-1">WEEKLY SQUAD MISSION</div>
            <h3 className="font-bold text-sm text-white uppercase">{quest.objective}</h3>
            <p className="text-xs text-zinc-400 mt-1">
              Reward: <span className="text-amber-400 font-bold">{quest.rewardCoins} Treasury Coins</span>
            </p>
          </div>
          {isComplete && (
            <span className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">
              MISSION ACCOMPLISHED
            </span>
          )}
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-xs">
            <span className="text-zinc-500 uppercase">Telemetry Progress</span>
            <span className="text-white font-bold">{quest.currentValue} / {quest.targetValue}</span>
          </div>
          <Progress value={progress} className="h-2 bg-zinc-800" />
        </div>

        {!isComplete && (
          <Button
            className="w-full mt-4 bg-white hover:bg-zinc-200 text-black font-mono text-xs font-bold uppercase h-9 tracking-wider"
            onClick={() => contribute.mutate()}
            disabled={contribute.isPending}
          >
            <Zap className="w-3.5 h-3.5 mr-1.5" /> Log Contribution
          </Button>
        )}
      </div>
    </div>
  );
}

// ─── Tab: Duels ──────────────────────────────────────────────────────────────
function DuelsTab({ data }: { data: GangData }) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const startDuel = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/gangs/${data.gang.id}/start-duel`, { duelType: "xp" });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/gangs/my-gang"] });
      toast({ title: "TACTICAL DUEL ENGAGED", description: "7-day XP competitive skirmish active." });
    },
    onError: (err: any) => {
      toast({ title: "Matchmaking Terminated", description: err.message || "Failed to start duel", variant: "destructive" });
    },
  });

  const activeDuels = data.duels.filter((d) => d.status === "active");
  const pastDuels = data.duels.filter((d) => d.status === "completed");

  return (
    <div className="space-y-4 font-mono">
      {/* Start Duel */}
      {activeDuels.length === 0 && (
        <Button
          className="w-full bg-white hover:bg-zinc-200 text-black font-mono text-xs font-bold uppercase h-10 tracking-wider"
          onClick={() => startDuel.mutate()}
          disabled={startDuel.isPending}
        >
          <Swords className="w-4 h-4 mr-2" /> {startDuel.isPending ? "SCANNING SECTOR..." : "INITIATE SQUAD DUEL"}
        </Button>
      )}

      {/* Active Duels */}
      {activeDuels.map((duel) => {
        const isChallenger = duel.challengerGangId === data.gang.id;
        const ourScore = isChallenger ? duel.challengerScore : duel.defenderScore;
        const theirScore = isChallenger ? duel.defenderScore : duel.challengerScore;
        const expiresAt = new Date(duel.expiresAt);
        const daysLeft = Math.max(0, Math.ceil((expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24)));

        return (
          <div key={duel.id} className="p-4 rounded-md bg-[#090B0E] border border-white/10">
            <div className="flex items-center justify-between mb-3 text-xs">
              <span className="font-bold text-white uppercase tracking-wider">
                ACTIVE DUEL // {duel.duelType.toUpperCase()}
              </span>
              <span className="text-[10px] text-zinc-400 bg-zinc-800 px-2 py-0.5 rounded">
                {daysLeft}D REMAINING
              </span>
            </div>
            <div className="flex items-center justify-around py-3 bg-zinc-950/60 rounded border border-white/5">
              <div className="text-center">
                <p className="text-2xl font-extrabold text-blue-400">{ourScore}</p>
                <p className="text-[10px] text-zinc-500 uppercase">Our Unit</p>
              </div>
              <div className="text-xs font-bold text-zinc-600">VS</div>
              <div className="text-center">
                <p className="text-2xl font-extrabold text-red-400">{theirScore}</p>
                <p className="text-[10px] text-zinc-500 uppercase">Opponent Unit</p>
              </div>
            </div>
          </div>
        );
      })}

      {/* Past Duels */}
      {pastDuels.length > 0 && (
        <div className="space-y-2">
          <div className="text-[10px] uppercase text-zinc-500 tracking-wider">Historical Skirmishes</div>
          {pastDuels.slice(0, 5).map((duel) => {
            const won = duel.winnerId === data.gang.id;
            return (
              <div key={duel.id} className="flex items-center justify-between p-2.5 rounded bg-[#090B0E] border border-white/5 text-xs">
                <span className="text-zinc-300 uppercase">{duel.duelType} ENCOUNTER</span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                  won ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30" : "bg-red-500/10 text-red-400 border border-red-500/30"
                }`}>
                  {won ? "VICTORY" : "DEFEAT"}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {data.duels.length === 0 && (
        <div className="text-center py-6 text-zinc-500 text-xs font-mono">
          <p>NO ENGAGEMENTS RECORDED. INITIALIZE A SQUAD DUEL TO COMPETE.</p>
        </div>
      )}
    </div>
  );
}

// ─── Tab: Leaderboard ────────────────────────────────────────────────────────
function LeaderboardTab({ gangId }: { gangId: string }) {
  const { data: leaderboard, isLoading } = useQuery<any[]>({
    queryKey: [`/api/gangs/${gangId}/leaderboard`],
  });

  if (isLoading) return <div className="text-center py-8 text-zinc-500 text-xs font-mono">CALIBRATING ROSTER...</div>;

  return (
    <div className="space-y-2 font-mono">
      {(leaderboard || []).map((member, i) => (
        <div key={member.userId} className="flex items-center gap-3 p-2.5 rounded bg-[#090B0E] border border-white/10 text-xs">
          <span className="text-[10px] w-6 text-center text-zinc-500 font-bold">
            #{String(i + 1).padStart(2, "0")}
          </span>
          <Avatar className="w-7 h-7 rounded border border-white/10">
            <AvatarFallback className="bg-zinc-800 text-white text-[10px] font-bold">
              {(member.name || "?")[0].toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-white text-xs truncate">{member.name}</p>
            <p className="text-[10px] text-zinc-500 uppercase">LVL {member.level} // STREAK: {member.streak}D</p>
          </div>
          <span className="text-xs font-bold text-white">{member.xp} XP</span>
        </div>
      ))}
    </div>
  );
}

// ─── Tab: Hideout ────────────────────────────────────────────────────────────
function HideoutTab({ data }: { data: GangData }) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const level = data.gang.hideoutLevel;
  const config = HIDEOUT_LEVELS[level - 1] || HIDEOUT_LEVELS[0];
  const nextConfig = level < 5 ? HIDEOUT_LEVELS[level] : null;

  const upgrade = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/gangs/${data.gang.id}/upgrade-hideout`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/gangs/my-gang"] });
      toast({ title: "HEADQUARTERS UPGRADED", description: "Unit defense and perks advanced to next tier." });
    },
    onError: (err: any) => {
      toast({ title: "Upgrade Failed", description: err.message || "Insufficient treasury coins", variant: "destructive" });
    },
  });

  return (
    <div className="space-y-4 font-mono">
      {/* Current Hideout */}
      <div className="text-center p-6 rounded-md bg-[#090B0E] border border-white/10">
        <div className="text-[10px] text-zinc-500 uppercase tracking-widest mb-1">{config.tag}</div>
        <h3 className="text-lg font-bold text-white uppercase">{config.name}</h3>
        <p className="text-xs text-zinc-400 mt-1">Fortification Level: {level} of 5</p>
        <p className="text-amber-400 mt-3 text-xs font-bold">
          TREASURY RESERVES: {data.gang.treasuryCoins} COINS
        </p>
      </div>

      {/* Upgrade */}
      {nextConfig && (
        <div className="p-4 rounded-md bg-[#090B0E] border border-white/10">
          <div className="flex items-center justify-between mb-3 text-xs">
            <div>
              <p className="font-bold text-white uppercase">UPGRADE TARGET: {nextConfig.name}</p>
              <p className="text-[10px] text-zinc-400 mt-0.5">Required Investment: {nextConfig.upgradeCost} Treasury Coins</p>
            </div>
            <ChevronRight className="w-4 h-4 text-zinc-500" />
          </div>
          <Button
            className="w-full bg-white hover:bg-zinc-200 text-black font-mono text-xs font-bold uppercase h-9"
            onClick={() => upgrade.mutate()}
            disabled={upgrade.isPending || data.gang.treasuryCoins < (nextConfig.upgradeCost || Infinity)}
          >
            {upgrade.isPending ? "UPGRADING FORTIFICATION..." : `UPGRADE TO ${nextConfig.tag} (${nextConfig.upgradeCost} COINS)`}
          </Button>
        </div>
      )}

      {!nextConfig && (
        <div className="text-center py-4 text-emerald-400 font-bold text-xs uppercase bg-emerald-500/10 border border-emerald-500/20 rounded">
          HEADQUARTERS IS AT APEX SPECIFICATION
        </div>
      )}
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────
export default function GangsPage() {
  const { user } = useAuth();
  const { data, isLoading } = useQuery<GangData | null>({
    queryKey: ["/api/gangs/my-gang"],
    enabled: !!user,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center font-mono text-xs text-zinc-400">
        <span>INITIALIZING SQUAD TELEMETRY...</span>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      {data ? <GangDashboard data={data} /> : <NoGangView />}
    </div>
  );
}
