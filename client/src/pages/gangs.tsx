import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import { apiRequest } from "@/lib/queryClient";
import { User } from "@shared/schema";
import {
  Shield, Users, Swords, Trophy, Castle, Plus, Copy, Crown,
  ArrowRight, Sparkles, Zap, Target, ChevronRight
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
  { level: 1, name: "Wooden Shack", icon: "🏚️", upgradeCost: 500 },
  { level: 2, name: "Stone Fort", icon: "🏰", upgradeCost: 1000 },
  { level: 3, name: "Iron Citadel", icon: "⚔️", upgradeCost: 2000 },
  { level: 4, name: "Crystal Palace", icon: "💎", upgradeCost: 5000 },
  { level: 5, name: "Legendary Nexus", icon: "🌟", upgradeCost: null },
];

// ─── No Gang View ────────────────────────────────────────────────────────────
function NoGangView() {
  const [gangName, setGangName] = useState("");
  const [gangIcon, setGangIcon] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [joinOpen, setJoinOpen] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const createGang = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/gangs", { name: gangName, icon: gangIcon || null });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/gangs/my-gang"] });
      setCreateOpen(false);
      toast({ title: "Gang Created! 🔥", description: "Your gang is ready. Invite your friends!" });
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message || "Failed to create gang", variant: "destructive" });
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
      toast({ title: "Joined! 🎉", description: "Welcome to the gang!" });
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message || "Invalid invite code", variant: "destructive" });
    },
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center min-h-[60vh] px-6 text-center"
    >
      {/* Hero */}
      <div className="relative mb-8">
        <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-violet-500/20 border border-cyan-500/30 flex items-center justify-center">
          <Shield className="w-12 h-12 text-cyan-400" />
        </div>
        <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg shadow-orange-500/30">
          <Sparkles className="w-4 h-4 text-white" />
        </div>
      </div>

      <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-violet-400 bg-clip-text text-transparent mb-3">
        Join a Gang
      </h1>
      <p className="text-muted-foreground max-w-md mb-8 leading-relaxed">
        Create or join a small private crew of friends. Complete co-op quests,
        duel other gangs, and build your hideout together.
      </p>

      <div className="flex flex-col sm:flex-row gap-4 w-full max-w-sm">
        {/* Create */}
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button className="flex-1 bg-gradient-to-r from-cyan-600 to-violet-600 hover:from-cyan-500 hover:to-violet-500 text-white shadow-lg shadow-cyan-500/20 gap-2">
              <Plus className="w-4 h-4" /> Create Gang
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-border">
            <DialogHeader>
              <DialogTitle>Create Your Gang</DialogTitle>
              <DialogDescription>Give your gang a name and optional icon emoji.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <Input
                placeholder="Gang Name"
                value={gangName}
                onChange={(e) => setGangName(e.target.value)}
                maxLength={24}
                className="bg-background"
              />
              <Input
                placeholder="Icon (emoji, e.g. ⚡)"
                value={gangIcon}
                onChange={(e) => setGangIcon(e.target.value)}
                maxLength={4}
                className="bg-background"
              />
              <Button
                className="w-full bg-gradient-to-r from-cyan-600 to-violet-600"
                onClick={() => createGang.mutate()}
                disabled={!gangName.trim() || createGang.isPending}
              >
                {createGang.isPending ? "Creating..." : "Create Gang"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Join */}
        <Dialog open={joinOpen} onOpenChange={setJoinOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" className="flex-1 border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10 gap-2">
              <ArrowRight className="w-4 h-4" /> Join Gang
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-border">
            <DialogHeader>
              <DialogTitle>Join a Gang</DialogTitle>
              <DialogDescription>Enter the invite code your friend shared with you.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <Input
                placeholder="e.g. GANG-A3X7"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                maxLength={10}
                className="bg-background font-mono tracking-wider"
              />
              <Button
                className="w-full bg-gradient-to-r from-cyan-600 to-violet-600"
                onClick={() => joinGang.mutate()}
                disabled={!joinCode.trim() || joinGang.isPending}
              >
                {joinGang.isPending ? "Joining..." : "Join Gang"}
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
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const tabs: { id: GangTab; label: string; icon: React.ReactNode }[] = [
    { id: "overview", label: "Overview", icon: <Shield className="w-4 h-4" /> },
    { id: "quests", label: "Co-op", icon: <Target className="w-4 h-4" /> },
    { id: "duels", label: "Duels", icon: <Swords className="w-4 h-4" /> },
    { id: "leaderboard", label: "Board", icon: <Trophy className="w-4 h-4" /> },
    { id: "hideout", label: "Hideout", icon: <Castle className="w-4 h-4" /> },
  ];

  return (
    <div className="space-y-6 pb-24">
      {/* Gang Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-cyan-900/40 to-violet-900/40 border border-cyan-500/20 p-6"
      >
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-cyan-500/10 via-transparent to-transparent" />
        <div className="relative flex items-center gap-4">
          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-cyan-500/30 to-violet-500/30 border border-cyan-400/30 flex items-center justify-center text-2xl">
            {data.gang.icon || "⚔️"}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold text-white truncate">{data.gang.name}</h1>
            <div className="flex items-center gap-3 mt-1">
              <span className="text-sm text-cyan-300/70">{data.members.length}/10 members</span>
              <span className="text-sm text-amber-300/70 flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> {data.gang.treasuryCoins} coins
              </span>
            </div>
          </div>
          <button
            className="text-xs text-muted-foreground bg-white/5 rounded-lg px-3 py-2 hover:bg-white/10 transition font-mono"
            onClick={() => {
              navigator.clipboard.writeText(data.gang.inviteCode);
              toast({ title: "Copied!", description: `Invite code: ${data.gang.inviteCode}` });
            }}
          >
            <Copy className="w-3 h-3 inline mr-1" />{data.gang.inviteCode}
          </button>
        </div>
      </motion.div>

      {/* Tabs */}
      <div className="flex gap-1 bg-card/60 rounded-xl p-1 border border-border overflow-x-auto">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap flex-1 justify-center ${
              tab === t.id
                ? "bg-gradient-to-r from-cyan-600 to-violet-600 text-white shadow-md"
                : "text-muted-foreground hover:text-foreground hover:bg-white/5"
            }`}
          >
            {t.icon}
            <span className="hidden sm:inline">{t.label}</span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={tab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
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
    <div className="space-y-4">
      <h2 className="text-lg font-semibold flex items-center gap-2">
        <Users className="w-5 h-5 text-cyan-400" /> Members
      </h2>
      <div className="grid gap-3">
        {data.members.map(m => (
          <div key={m.id} className="flex items-center gap-3 p-3 rounded-xl bg-card/60 border border-border">
            <Avatar className="w-10 h-10 border border-cyan-500/20">
              <AvatarFallback className="bg-gradient-to-br from-cyan-600 to-violet-600 text-white text-sm">
                {(m.user.name || "?")[0]}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm truncate">{m.user.name || "Unknown"}</p>
              <p className="text-xs text-muted-foreground">Level {m.user.level} · {m.user.tier} Tier</p>
            </div>
            {m.role === "leader" && (
              <span className="flex items-center gap-1 text-amber-400 text-xs bg-amber-500/10 px-2 py-1 rounded-full">
                <Crown className="w-3 h-3" /> Leader
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
      toast({ title: "+1 Contributed! 🎯" });
    },
  });

  if (!quest) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <Target className="w-12 h-12 mx-auto mb-3 opacity-40" />
        <p>No active co-op quest this week.</p>
      </div>
    );
  }

  const progress = Math.min((quest.currentValue / quest.targetValue) * 100, 100);
  const isComplete = quest.completedAt !== null;

  return (
    <div className="space-y-6">
      <div className="p-6 rounded-2xl bg-gradient-to-br from-emerald-900/30 to-cyan-900/30 border border-emerald-500/20">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="font-bold text-lg text-white">{quest.objective}</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Reward: <span className="text-amber-400">{quest.rewardCoins} treasury coins</span>
            </p>
          </div>
          {isComplete && (
            <span className="bg-emerald-500/20 text-emerald-400 px-3 py-1 rounded-full text-xs font-bold">
              ✅ COMPLETE
            </span>
          )}
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Progress</span>
            <span className="text-white font-mono">{quest.currentValue}/{quest.targetValue}</span>
          </div>
          <Progress value={progress} className="h-3 bg-white/10" />
        </div>

        {!isComplete && (
          <Button
            className="w-full mt-4 bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500"
            onClick={() => contribute.mutate()}
            disabled={contribute.isPending}
          >
            <Zap className="w-4 h-4 mr-2" /> Contribute
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
      toast({ title: "Duel Started! ⚔️", description: "A 7-day XP battle begins now!" });
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message || "Failed to start duel", variant: "destructive" });
    },
  });

  const activeDuels = data.duels.filter(d => d.status === "active");
  const pastDuels = data.duels.filter(d => d.status === "completed");

  return (
    <div className="space-y-6">
      {/* Start Duel */}
      {activeDuels.length === 0 && (
        <Button
          className="w-full bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 gap-2 py-6 text-lg"
          onClick={() => startDuel.mutate()}
          disabled={startDuel.isPending}
        >
          <Swords className="w-5 h-5" /> {startDuel.isPending ? "Matchmaking..." : "Find & Start Duel"}
        </Button>
      )}

      {/* Active Duels */}
      {activeDuels.map(duel => {
        const isChallenger = duel.challengerGangId === data.gang.id;
        const ourScore = isChallenger ? duel.challengerScore : duel.defenderScore;
        const theirScore = isChallenger ? duel.defenderScore : duel.challengerScore;
        const expiresAt = new Date(duel.expiresAt);
        const daysLeft = Math.max(0, Math.ceil((expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24)));

        return (
          <div key={duel.id} className="p-5 rounded-2xl bg-gradient-to-br from-red-900/30 to-orange-900/30 border border-red-500/20">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-white">⚔️ Active Duel — {duel.duelType.toUpperCase()}</h3>
              <span className="text-xs text-muted-foreground bg-white/5 px-2 py-1 rounded-full">
                {daysLeft}d left
              </span>
            </div>
            <div className="flex items-center justify-around py-4">
              <div className="text-center">
                <p className="text-3xl font-bold text-cyan-400">{ourScore}</p>
                <p className="text-xs text-muted-foreground mt-1">Our Score</p>
              </div>
              <div className="text-2xl text-muted-foreground">vs</div>
              <div className="text-center">
                <p className="text-3xl font-bold text-red-400">{theirScore}</p>
                <p className="text-xs text-muted-foreground mt-1">Their Score</p>
              </div>
            </div>
          </div>
        );
      })}

      {/* Past Duels */}
      {pastDuels.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-muted-foreground mb-3">Past Duels</h3>
          <div className="space-y-2">
            {pastDuels.slice(0, 5).map(duel => {
              const won = duel.winnerId === data.gang.id;
              return (
                <div key={duel.id} className="flex items-center justify-between p-3 rounded-lg bg-card/60 border border-border">
                  <span className="text-sm">{duel.duelType.toUpperCase()} Duel</span>
                  <span className={`text-xs font-bold px-2 py-1 rounded-full ${won ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400"}`}>
                    {won ? "WON" : "LOST"}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {data.duels.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <Swords className="w-12 h-12 mx-auto mb-3 opacity-40" />
          <p>No duels yet. Challenge another gang!</p>
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

  if (isLoading) return <div className="text-center py-8 text-muted-foreground">Loading...</div>;

  const medals = ["🥇", "🥈", "🥉"];

  return (
    <div className="space-y-3">
      {(leaderboard || []).map((member, i) => (
        <div key={member.userId} className="flex items-center gap-3 p-3 rounded-xl bg-card/60 border border-border">
          <span className="text-lg w-8 text-center">{medals[i] || `#${i + 1}`}</span>
          <Avatar className="w-9 h-9 border border-cyan-500/20">
            <AvatarFallback className="bg-gradient-to-br from-cyan-600 to-violet-600 text-white text-xs">
              {(member.name || "?")[0]}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm truncate">{member.name}</p>
            <p className="text-xs text-muted-foreground">Lv.{member.level} · {member.streak}🔥</p>
          </div>
          <span className="text-sm font-mono text-cyan-400">{member.xp} XP</span>
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
      toast({ title: "Hideout Upgraded! 🏰" });
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message || "Not enough coins", variant: "destructive" });
    },
  });

  return (
    <div className="space-y-6">
      {/* Current Hideout */}
      <div className="text-center p-8 rounded-2xl bg-gradient-to-br from-amber-900/30 to-orange-900/30 border border-amber-500/20">
        <span className="text-6xl block mb-4">{config.icon}</span>
        <h3 className="text-xl font-bold text-white">{config.name}</h3>
        <p className="text-sm text-muted-foreground mt-1">Level {level}</p>
        <p className="text-amber-400 mt-3 text-sm flex items-center justify-center gap-1">
          <Sparkles className="w-4 h-4" /> Treasury: {data.gang.treasuryCoins} coins
        </p>
      </div>

      {/* Upgrade */}
      {nextConfig && (
        <div className="p-5 rounded-xl bg-card/60 border border-border">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="font-semibold text-white">Next: {nextConfig.name} {nextConfig.icon}</p>
              <p className="text-xs text-muted-foreground mt-1">Cost: {nextConfig.upgradeCost} treasury coins</p>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </div>
          <Button
            className="w-full bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500"
            onClick={() => upgrade.mutate()}
            disabled={upgrade.isPending || data.gang.treasuryCoins < (nextConfig.upgradeCost || Infinity)}
          >
            {upgrade.isPending ? "Upgrading..." : `Upgrade (${nextConfig.upgradeCost} coins)`}
          </Button>
        </div>
      )}

      {!nextConfig && (
        <div className="text-center py-4 text-emerald-400 font-semibold">
          🌟 Your hideout is MAX LEVEL!
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-cyan-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      {data ? <GangDashboard data={data} /> : <NoGangView />}
    </div>
  );
}
