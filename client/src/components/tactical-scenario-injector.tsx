import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { audioEngine } from "@/lib/audio-engine";
import {
  Sparkles,
  ShieldAlert,
  Flame,
  Gavel,
  RotateCcw,
  AlertTriangle,
  Zap,
  Radio,
  CheckCircle2,
  Skull,
  Coins
} from "lucide-react";

export function TacticalScenarioInjector() {
  const [open, setOpen] = useState(false);
  const [activeSimulation, setActiveSimulation] = useState<string | null>(null);
  const [sirenActive, setSirenActive] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const injectMutation = useMutation({
    mutationFn: async (scenarioType: string) => {
      setActiveSimulation(scenarioType);
      const res = await apiRequest("POST", "/api/protocol/scenario-inject", { scenarioType });
      return res.json();
    },
    onSuccess: (data, scenarioType) => {
      // Invalidate relevant caches
      queryClient.invalidateQueries({ queryKey: ["/api/daily-mission"] });
      queryClient.invalidateQueries({ queryKey: ["/api/execution-profile"] });
      queryClient.invalidateQueries({ queryKey: ["/api/focus-density"] });
      queryClient.invalidateQueries({ queryKey: ["/api/squad-pacts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/squad-ambient/feed"] });
      queryClient.invalidateQueries({ queryKey: ["/api/wall-of-consequence"] });
      queryClient.invalidateQueries({ queryKey: ["/api/performance-court"] });

      if (scenarioType === "defector_liquidation") {
        audioEngine.startKlaxonSiren();
        setTimeout(() => audioEngine.stopKlaxonSiren(), 1500);
        toast({
          title: "💀 DEFECTOR LIQUIDATED",
          description: data.message || "Operative-Viper forfeited 100 PTS. +50 PTS dividend distributed to your pool balance!",
          variant: "destructive",
        });
      } else if (scenarioType === "court_decree") {
        audioEngine.playCourtGavel();
        toast({
          title: "⚖️ SUNDAY COURT DECREE ISSUED",
          description: data.message || "Audited: Superior Execution. +40 Reputation points recorded.",
        });
      } else if (scenarioType === "reset_mission") {
        audioEngine.playCommandLock();
        toast({
          title: "🔄 MISSION STATE RESET",
          description: "Today's daily mission has been reset to pending for demonstration.",
        });
      }
    },
    onError: (err: any) => {
      toast({
        title: "Simulation Injection Failed",
        description: err.message,
        variant: "destructive",
      });
    },
    onSettled: () => {
      setActiveSimulation(null);
    },
  });

  const triggerBreachDemo = () => {
    setSirenActive(true);
    audioEngine.startKlaxonSiren();
    toast({
      title: "🚨 ATTENTION BREACH TEST ENGAGED",
      description: "Klaxon siren active. Testing audio warning loop (stopping in 3s)...",
      variant: "destructive",
    });
    setTimeout(() => {
      audioEngine.stopKlaxonSiren();
      setSirenActive(false);
      toast({
        title: "✅ KLAXON TEST COMPLETE",
        description: "Breach enforcer audio oscillator verified.",
      });
    }, 3000);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="border-amber-500/40 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20 hover:border-amber-400 font-mono text-xs flex items-center gap-1.5 shadow-[0_0_12px_rgba(245,158,11,0.15)]"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-spin" style={{ animationDuration: "6s" }} />
          Scenario Injector
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-2xl bg-slate-950/95 border border-slate-800 text-slate-100 backdrop-blur-xl shadow-2xl p-6">
        <DialogHeader className="pb-3 border-b border-slate-800/80">
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="outline" className="border-amber-500/30 text-amber-400 bg-amber-500/10 text-[10px] font-mono tracking-wider">
              PROTOCOL SIMULATOR
            </Badge>
            <Badge variant="outline" className="border-cyan-500/30 text-cyan-400 bg-cyan-500/10 text-[10px] font-mono">
              STAKEHOLDER DEMO ENGINE
            </Badge>
          </div>
          <DialogTitle className="text-xl font-black text-white flex items-center gap-2">
            <Radio className="w-5 h-5 text-amber-400" />
            Tactical Scenario Injector
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-400">
            One-click execution of high-stakes protocol events for live demonstrations, stress testing, and investor reviews.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          {/* 1. Defector Liquidation */}
          <div className="p-4 bg-slate-900/60 border border-red-500/30 rounded-xl flex flex-col justify-between hover:border-red-500/60 transition-colors">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-mono font-bold text-red-400 flex items-center gap-1.5">
                  <Skull className="w-4 h-4 text-red-400" />
                  DEFECTOR LIQUIDATION
                </span>
                <Badge variant="outline" className="border-red-500/30 text-red-400 text-[10px]">
                  High Stakes
                </Badge>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed mb-4">
                Simulate squad member breach. Forfeits 100 PTS stake, logs to Wall of Consequence, broadcasts to squad radio, and credits +50 PTS dividend to your balance.
              </p>
            </div>
            <Button
              size="sm"
              variant="destructive"
              className="w-full font-mono text-xs bg-red-950/80 border border-red-500 text-red-200 hover:bg-red-900"
              disabled={injectMutation.isPending}
              onClick={() => injectMutation.mutate("defector_liquidation")}
            >
              {activeSimulation === "defector_liquidation" ? "Liquidating..." : "Execute Defector Forfeiture"}
            </Button>
          </div>

          {/* 2. Sunday Performance Court */}
          <div className="p-4 bg-slate-900/60 border border-amber-500/30 rounded-xl flex flex-col justify-between hover:border-amber-500/60 transition-colors">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-mono font-bold text-amber-400 flex items-center gap-1.5">
                  <Gavel className="w-4 h-4 text-amber-400" />
                  PERFORMANCE COURT
                </span>
                <Badge variant="outline" className="border-amber-500/30 text-amber-400 text-[10px]">
                  Judicial Audit
                </Badge>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed mb-4">
                Instantly convene Sunday court. Generates AI judicial verdict on weekly focus density, plays the court gavel, logs roadmap acceleration, and awards +40 PTS.
              </p>
            </div>
            <Button
              size="sm"
              className="w-full font-mono text-xs bg-amber-950/80 border border-amber-500 text-amber-200 hover:bg-amber-900"
              disabled={injectMutation.isPending}
              onClick={() => injectMutation.mutate("court_decree")}
            >
              {activeSimulation === "court_decree" ? "Convening..." : "Convene Court Decree"}
            </Button>
          </div>

          {/* 3. Siren & Breach Enforcer Test */}
          <div className="p-4 bg-slate-900/60 border border-orange-500/30 rounded-xl flex flex-col justify-between hover:border-orange-500/60 transition-colors">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-mono font-bold text-orange-400 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-orange-400" />
                  BREACH KLAXON SIREN
                </span>
                <Badge variant="outline" className="border-orange-500/30 text-orange-400 text-[10px]">
                  Audio Enforcer
                </Badge>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed mb-4">
                Directly triggers the Web Audio dual-tone 660/880Hz emergency oscillator siren without leaving the screen. Tests the auditory penalty loop in real-time.
              </p>
            </div>
            <Button
              size="sm"
              variant="outline"
              className="w-full font-mono text-xs border-orange-500/60 text-orange-300 hover:bg-orange-500/10"
              disabled={sirenActive}
              onClick={triggerBreachDemo}
            >
              {sirenActive ? "Siren Active (3s)..." : "Test Klaxon Enforcer"}
            </Button>
          </div>

          {/* 4. Reset Daily Mission State */}
          <div className="p-4 bg-slate-900/60 border border-cyan-500/30 rounded-xl flex flex-col justify-between hover:border-cyan-500/60 transition-colors">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-mono font-bold text-cyan-400 flex items-center gap-1.5">
                  <RotateCcw className="w-4 h-4 text-cyan-400" />
                  RESET DAILY MISSION
                </span>
                <Badge variant="outline" className="border-cyan-500/30 text-cyan-400 text-[10px]">
                  Demo Loop
                </Badge>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed mb-4">
                Rolls back today's Single Daily Mission to pending status. Enables demonstrating the briefing intake, commitment lock, and proof-of-work verification from scratch.
              </p>
            </div>
            <Button
              size="sm"
              variant="outline"
              className="w-full font-mono text-xs border-cyan-500/60 text-cyan-300 hover:bg-cyan-500/10"
              disabled={injectMutation.isPending}
              onClick={() => injectMutation.mutate("reset_mission")}
            >
              {activeSimulation === "reset_mission" ? "Resetting..." : "Reset Mission to Pending"}
            </Button>
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500 font-mono">
          <span>Active Session Target: Local Dev / Live Prototype</span>
          <span className="text-amber-400/80 flex items-center gap-1">
            <Coins className="w-3 h-3" /> Real-time state synchronization
          </span>
        </div>
      </DialogContent>
    </Dialog>
  );
}
