import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { audioEngine } from "@/lib/audio-engine";
import {
  ShieldCheck,
  Award,
  Link2,
  FileText,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowRight
} from "lucide-react";

interface ProofOfWorkSubmitProps {
  missionId: string;
  tacticalDeliverable: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function ProofOfWorkSubmit({
  missionId,
  tacticalDeliverable,
  onSuccess,
  onCancel,
}: ProofOfWorkSubmitProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [content, setContent] = useState<string>("");
  const [url, setUrl] = useState<string>("");
  const [result, setResult] = useState<any>(null);

  const proofMutation = useMutation({
    mutationFn: async (payload: { content: string; url?: string }) => {
      const res = await apiRequest("POST", `/api/daily-mission/${missionId}/proof`, payload);
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/daily-mission"] });
      queryClient.invalidateQueries({ queryKey: ["/api/focus-density"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      audioEngine.playCommandLock();
      setResult(data);
      toast({
        title: "PROOF VERIFIED",
        description: `Deliverable accepted with Quality Score: ${data.proofQualityScore}/100`,
      });
      if (onSuccess) onSuccess();
    },
    onError: (err: any) => {
      toast({
        title: "Verification Rejected",
        description: err.message || "Failed to submit proof. Ensure tangible detail.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() && !url.trim()) {
      toast({
        title: "Empty Submission",
        description: "Submit written documentation, bullet points of work completed, or a link to the artifact.",
        variant: "destructive",
      });
      return;
    }
    proofMutation.mutate({ content, url: url.trim() || undefined });
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-7 shadow-2xl relative overflow-hidden space-y-6">
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              Proof-of-Work Verification
            </h3>
            <p className="text-xs text-slate-400">
              Zero self-reporting. Submit tangible evidence for AI verification.
            </p>
          </div>
        </div>
        <Badge variant="outline" className="border-amber-500/30 text-amber-400 bg-amber-500/10 font-mono text-xs">
          Tier 1 Execution
        </Badge>
      </div>

      {/* Target Deliverable Reminder */}
      <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800/80">
        <div className="text-xs font-mono text-amber-400 font-semibold uppercase mb-1">
          REQUIRED DELIVERABLE
        </div>
        <div className="text-sm text-slate-200">
          {tacticalDeliverable}
        </div>
      </div>

      {result ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="p-5 rounded-xl bg-emerald-950/20 border border-emerald-500/40 space-y-4 text-center"
        >
          <div className="w-14 h-14 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center mx-auto text-emerald-400">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <div>
            <div className="text-xl font-extrabold text-white">
              VERIFICATION ACCEPTED
            </div>
            <div className="text-sm font-mono text-emerald-400 font-bold mt-1">
              Quality Score: {result.proofQualityScore} / 100 • +{result.xpEarned} XP
            </div>
          </div>
          <p className="text-xs text-slate-300 italic max-w-md mx-auto">
            &ldquo;{result.feedback}&rdquo;
          </p>
          <Button
            onClick={onCancel}
            className="bg-emerald-500 hover:bg-emerald-400 text-black font-bold px-6"
          >
            Return to Mission Command
          </Button>
        </motion.div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="content" className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-amber-400" />
              Detailed Deliverable Summary / Code Diff / Execution Notes
            </Label>
            <Textarea
              id="content"
              rows={4}
              placeholder="Outline exact work produced: key decisions, problems solved, metrics achieved, and architecture implemented."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="bg-slate-950/90 border-slate-700 focus:border-amber-500 text-white placeholder:text-slate-600 resize-none"
            />
            <p className="text-[11px] text-slate-500">
              Min 50 words recommended. Submissions with rigorous technical substance qualify for L1 Platinum multiplier.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="url" className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <Link2 className="w-3.5 h-3.5 text-cyan-400" />
              Live Artifact URL / Pull Request / Document Link (Optional)
            </Label>
            <Input
              id="url"
              type="url"
              placeholder="https://github.com/... or https://docs.google.com/..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="bg-slate-950/90 border-slate-700 focus:border-cyan-500 text-white placeholder:text-slate-600 h-11"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3">
            {onCancel && (
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                className="border-slate-800 text-slate-400 hover:bg-slate-800"
              >
                Cancel
              </Button>
            )}
            <Button
              type="submit"
              disabled={proofMutation.isPending}
              className="bg-amber-500 hover:bg-amber-400 text-black font-extrabold px-6 flex items-center gap-2"
            >
              {proofMutation.isPending ? "GRADING DELIVERABLE..." : "SUBMIT PROOF OF WORK"}
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
