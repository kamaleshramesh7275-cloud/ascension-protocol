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
  ArrowLeft
} from "lucide-react";

export default function PublicCommitmentsPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [showPublishModal, setShowPublishModal] = useState<boolean>(false);
  const [declaration, setDeclaration] = useState<string>("");
  const [deadline, setDeadline] = useState<string>(new Date(Date.now() + 120 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]);

  // Fetch Public Commitments
  const { data: commitments = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/public-commitments"],
  });

  // Publish Commitment Mutation
  const publishMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/public-commitments", {
        declaration,
        targetDeadline: new Date(deadline).toISOString(),
        velocityPercent: 75,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/public-commitments"] });
      setShowPublishModal(false);
      setDeclaration("");
      toast({
        title: "DECLARATION BROADCAST",
        description: "Your commitment is now visible to the entire community audience.",
      });
    },
    onError: (err: any) => {
      toast({ title: "Publish Error", description: err.message, variant: "destructive" });
    },
  });

  // Witness Mutation
  const witnessMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("POST", `/api/public-commitments/${id}/witness`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/public-commitments"] });
      toast({
        title: "WITNESS RECORDED",
        description: "You are now holding this ascendant accountable.",
      });
    },
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col p-4 sm:p-6 md:p-8 relative overflow-hidden">
      <div className="w-full max-w-5xl mx-auto space-y-8 relative z-10">
        {/* Header */}
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <Badge variant="outline" className="border-amber-500/40 text-amber-400 bg-amber-500/10 font-mono text-[11px] uppercase tracking-wider">
                <Eye className="w-3.5 h-3.5 mr-1 inline text-amber-400" /> PILLAR 4: THE WITNESS EFFECT
              </Badge>
              <Badge variant="outline" className="border-slate-800 text-slate-400 font-mono text-[11px]">
                Public Commitment Wall
              </Badge>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              PUBLIC COMMITMENT WALL
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={() => setLocation("/mission-command")}
              className="border-slate-800 text-slate-300 hover:bg-slate-900 text-xs font-mono"
            >
              <ArrowLeft className="w-3.5 h-3.5 mr-1 inline" /> Mission Command
            </Button>
            <Button
              onClick={() => setShowPublishModal(true)}
              className="bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs px-4 flex items-center gap-1.5"
            >
              <Send className="w-3.5 h-3.5" /> Publish Declaration
            </Button>
          </div>
        </header>

        {/* ─── COMMITMENTS GRID ─── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {commitments.map((c) => {
            const deadlineFormatted = new Date(c.targetDeadline).toLocaleDateString(undefined, {
              month: "short",
              day: "numeric",
              year: "numeric",
            });

            return (
              <div
                key={c.id}
                className="bg-slate-900/80 border border-slate-800 hover:border-slate-700 rounded-2xl p-6 flex flex-col justify-between space-y-4 transition-all backdrop-blur-md"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center font-bold text-amber-400 text-xs font-mono">
                        {c.user?.name?.[0]?.toUpperCase() || "A"}
                      </div>
                      <div>
                        <div className="text-sm font-bold text-white truncate max-w-[140px]">
                          {c.user?.name || "Ascendant"}
                        </div>
                        <div className="text-[10px] font-mono text-slate-400">
                          Discipline Score: {c.currentDisciplineScore}
                        </div>
                      </div>
                    </div>

                    <Badge variant="outline" className="border-cyan-500/30 text-cyan-400 bg-cyan-500/10 text-[10px] font-mono">
                      DEADLINE: {deadlineFormatted}
                    </Badge>
                  </div>

                  <p className="text-sm sm:text-base font-semibold text-slate-100 leading-relaxed italic">
                    &ldquo;{c.declaration}&rdquo;
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-mono text-slate-400">
                    <Eye className="w-3.5 h-3.5 text-amber-400" />
                    <span>{c.witnessesCount} {c.witnessesCount === 1 ? "WITNESS" : "WITNESSES"} WATCHING</span>
                  </div>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => witnessMutation.mutate(c.id)}
                    className="border-slate-700 text-slate-300 hover:bg-slate-800 text-xs font-mono"
                  >
                    Witness Commitment
                  </Button>
                </div>
              </div>
            );
          })}
        </div>

        {commitments.length === 0 && !isLoading && (
          <div className="p-12 text-center text-slate-500 bg-slate-900/40 rounded-2xl border border-slate-800">
            No public declarations published yet. Be the first to broadcast your commitment.
          </div>
        )}
      </div>

      {/* ─── PUBLISH DECLARATION MODAL ─── */}
      <Dialog open={showPublishModal} onOpenChange={setShowPublishModal}>
        <DialogContent className="max-w-md bg-slate-950 border border-slate-800 p-6 space-y-4">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-white flex items-center gap-2">
              <Send className="w-5 h-5 text-amber-400" />
              BROADCAST MAJOR LIFE DECLARATION
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-400">
              When peers watch your progress, the cost of failure becomes viscerally real. State your non-negotiable target.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label className="text-xs font-semibold text-slate-300">
                Major Life Declaration (Min 10 characters):
              </Label>
              <Input
                placeholder="e.g. I will crack UPSC Prelims 2026 above cutoff score."
                value={declaration}
                onChange={(e) => setDeclaration(e.target.value)}
                className="bg-slate-900 border-slate-700 text-white"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-semibold text-slate-300">
                Target Deadline
              </Label>
              <Input
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="bg-slate-900 border-slate-700 text-white"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3">
            <Button variant="outline" onClick={() => setShowPublishModal(false)} className="border-slate-800 text-slate-400">
              Cancel
            </Button>
            <Button
              onClick={() => publishMutation.mutate()}
              disabled={publishMutation.isPending || declaration.trim().length < 10}
              className="bg-amber-500 hover:bg-amber-400 text-black font-extrabold"
            >
              {publishMutation.isPending ? "BROADCASTING..." : "SEAL PUBLIC DECLARATION"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
