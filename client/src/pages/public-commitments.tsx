import { useState } from "react";
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
  Eye,
  ShieldAlert,
  Flame,
  Zap,
  Lock,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Send,
  Users,
  Compass,
  ArrowLeft,
} from "lucide-react";
import { audioEngine } from "@/lib/audio-engine";

export default function PublicCommitmentsPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [showPublishModal, setShowPublishModal] = useState<boolean>(false);
  const [declaration, setDeclaration] = useState<string>("");
  const [deadline, setDeadline] = useState<string>(
    new Date(Date.now() + 120 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
  );

  // Fetch Public Commitments
  const { data: commitments = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/public-commitments"],
  });

  // Publish Commitment Mutation
  const publishMutation = useMutation({
    mutationFn: async () => {
      audioEngine.playTactileClick();
      const res = await apiRequest("POST", "/api/public-commitments", {
        declaration,
        targetDeadline: new Date(deadline).toISOString(),
        velocityPercent: 75,
      });
      return res.json();
    },
    onSuccess: () => {
      audioEngine.playCommandLock();
      queryClient.invalidateQueries({ queryKey: ["/api/public-commitments"] });
      setShowPublishModal(false);
      setDeclaration("");
      toast({
        title: "DECLARATION BROADCAST",
        description: "Your covenant is now registered on the public network ledger.",
      });
    },
    onError: (err: any) => {
      toast({ title: "Publish Error", description: err.message, variant: "destructive" });
    },
  });

  // Witness Mutation
  const witnessMutation = useMutation({
    mutationFn: async (id: string) => {
      audioEngine.playTactileClick();
      const res = await apiRequest("POST", `/api/public-commitments/${id}/witness`);
      return res.json();
    },
    onSuccess: () => {
      audioEngine.playCommandLock();
      queryClient.invalidateQueries({ queryKey: ["/api/public-commitments"] });
      toast({
        title: "WITNESS LOGGED",
        description: "Peer verification recorded. You are holding this operator accountable.",
      });
    },
  });

  return (
    <div className="min-h-screen bg-[#07080B] text-zinc-100 flex flex-col p-4 sm:p-6 md:p-8 relative overflow-hidden font-sans">
      {/* Background ambient lighting */}
      <div className="absolute top-0 left-1/3 w-96 h-96 bg-amber-500/5 blur-3xl pointer-events-none" />

      <div className="w-full max-w-5xl mx-auto space-y-6 relative z-10">
        {/* Header */}
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-white/10">
          <div>
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <Badge variant="outline" className="border-amber-500/30 text-amber-400 bg-amber-500/10 font-mono text-[10px] uppercase tracking-wider px-2 py-0.5">
                <Eye className="w-3 h-3 mr-1 inline text-amber-400" /> SECTOR 06 // THE WITNESS EFFECT
              </Badge>
              <Badge variant="outline" className="border-white/10 text-zinc-400 font-mono text-[10px] uppercase tracking-wider px-2 py-0.5">
                IRREVOCABLE COVENANT
              </Badge>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white uppercase font-mono">
              PUBLIC COMMITMENT WALL
            </h1>
            <p className="text-xs text-zinc-400 font-sans mt-0.5">
              Public accountability architecture. High-stakes declarations observed by peers to eliminate private rationalization.
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
            <Button
              onClick={() => {
                audioEngine.playTactileClick();
                setShowPublishModal(true);
              }}
              className="bg-amber-400 hover:bg-amber-300 text-black font-mono font-bold text-xs uppercase tracking-wider h-8 px-3.5 rounded shadow-sm hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-1.5"
            >
              <Send className="w-3.5 h-3.5" /> PUBLISH DECLARATION
            </Button>
          </div>
        </header>

        {/* ─── COMMITMENTS GRID ─── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {commitments.map((c) => {
            const deadlineFormatted = new Date(c.targetDeadline).toLocaleDateString(undefined, {
              month: "short",
              day: "numeric",
              year: "numeric",
            });

            return (
              <div
                key={c.id}
                className="obsidian-card razor-border-hover rounded-xl p-5 bg-[#090C10] border-white/5 hover:border-amber-500/25 flex flex-col justify-between space-y-4 transition-all"
              >
                <div>
                  <div className="flex items-center justify-between mb-3 gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-md bg-amber-500/10 border border-amber-500/25 flex items-center justify-center font-bold text-amber-400 text-xs font-mono shrink-0">
                        {c.user?.name?.[0]?.toUpperCase() || "A"}
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-semibold text-white truncate font-mono">
                          {c.user?.name || "Operative"}
                        </div>
                        <div className="text-[10px] font-mono text-zinc-500 tabular-telemetry">
                          DISCIPLINE: {c.currentDisciplineScore}
                        </div>
                      </div>
                    </div>

                    <Badge variant="outline" className="border-cyan-500/25 text-cyan-400 bg-cyan-500/10 text-[9px] font-mono uppercase tracking-wider px-2 py-0.5 shrink-0">
                      TARGET: {deadlineFormatted}
                    </Badge>
                  </div>

                  <p className="text-xs sm:text-sm font-medium text-zinc-200 leading-relaxed font-sans italic border-l-2 border-amber-400/40 pl-3">
                    &ldquo;{c.declaration}&rdquo;
                  </p>
                </div>

                <div className="pt-3 border-t border-white/5 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-[11px] font-mono text-zinc-400 tabular-telemetry">
                    <Eye className="w-3.5 h-3.5 text-amber-400" />
                    <span>{c.witnessesCount} {c.witnessesCount === 1 ? "WITNESS" : "WITNESSES"} WATCHING</span>
                  </div>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => witnessMutation.mutate(c.id)}
                    disabled={witnessMutation.isPending}
                    className="border-white/10 bg-[#07080B] hover:bg-[#141922] text-zinc-300 hover:text-white text-[11px] font-mono uppercase tracking-wider h-7 px-3 rounded"
                  >
                    WITNESS COVENANT
                  </Button>
                </div>
              </div>
            );
          })}
        </div>

        {commitments.length === 0 && !isLoading && (
          <div className="obsidian-card bg-[#090C10] border-white/5 rounded-xl p-12 text-center text-zinc-500 font-mono text-xs space-y-2 uppercase tracking-wider">
            <Eye className="w-8 h-8 text-zinc-600 mx-auto" />
            <p>NO PUBLIC DECLARATIONS REGISTERED YET</p>
            <p className="text-[11px] text-zinc-600 font-sans normal-case">
              Broadcast your major goal to establish unyielding peer accountability.
            </p>
          </div>
        )}
      </div>

      {/* ─── PUBLISH DECLARATION MODAL ─── */}
      <Dialog open={showPublishModal} onOpenChange={setShowPublishModal}>
        <DialogContent className="max-w-md bg-[#0E1218] border border-white/10 text-white p-6 space-y-4 rounded-xl shadow-2xl backdrop-blur-2xl">
          <DialogHeader>
            <DialogTitle className="text-base font-bold font-mono tracking-tight text-white flex items-center gap-2 uppercase">
              <Send className="w-4 h-4 text-amber-400" />
              BROADCAST LIFE DECLARATION
            </DialogTitle>
            <DialogDescription className="text-xs text-zinc-400 font-sans leading-relaxed">
              When peers witness your progress, the cost of default becomes immediate and visceral. State your non-negotiable target.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-1 font-sans">
            <div className="space-y-1.5">
              <Label className="text-xs font-mono text-zinc-300 uppercase tracking-wider">
                DECLARATION STATEMENT (MIN 10 CHARACTERS):
              </Label>
              <Input
                placeholder="e.g. Complete and release enterprise compliance platform v1."
                value={declaration}
                onChange={(e) => setDeclaration(e.target.value)}
                className="bg-[#07080B] border-white/10 text-white text-xs h-9 font-sans"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-mono text-zinc-300 uppercase tracking-wider">
                TARGET COMPLETION DEADLINE:
              </Label>
              <Input
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="bg-[#07080B] border-white/10 text-white text-xs h-9 font-mono"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3">
            <Button
              variant="outline"
              onClick={() => {
                audioEngine.playTactileClick();
                setShowPublishModal(false);
              }}
              className="border-white/10 bg-[#07080B] text-zinc-400 hover:text-white text-xs font-mono h-8 rounded"
            >
              CANCEL
            </Button>
            <Button
              onClick={() => publishMutation.mutate()}
              disabled={publishMutation.isPending || declaration.trim().length < 10}
              className="bg-amber-400 hover:bg-amber-300 text-black font-mono font-bold text-xs uppercase tracking-wider h-8 px-4 rounded shadow-sm"
            >
              {publishMutation.isPending ? "BROADCASTING..." : "SEAL DECLARATION"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
