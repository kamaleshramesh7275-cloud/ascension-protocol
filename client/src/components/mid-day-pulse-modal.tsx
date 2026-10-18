import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Clock, AlertTriangle, Zap, ArrowRight, ShieldAlert, CheckCircle2 } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { audioEngine } from "@/lib/audio-engine";

export function MidDayPulseModal() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [committedAction, setCommittedAction] = useState("");
  const [isDismissedTemporarily, setIsDismissedTemporarily] = useState(false);

  // Check pulse status
  const { data: statusData } = useQuery<{
    requiresAction: boolean;
    acknowledged: boolean;
    missionStatus: string;
    missionTitle: string | null;
    currentHour: number;
  }>({
    queryKey: ["/api/mid-day-pulse/status"],
    refetchInterval: 60000, // Check every minute
  });

  const pulseMutation = useMutation({
    mutationFn: async (action: string) => {
      const res = await apiRequest("POST", "/api/mid-day-pulse", {
        missionStatus: statusData?.missionStatus || "in_progress",
        committedAction: action,
        timeBlockMinutes: 30,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/mid-day-pulse/status"] });
      toast({
        title: "Mid-Day Micro-Action Locked",
        description: "Your 30-minute commitment is recorded into today's ledger. AI Chief of Staff will audit execution this evening.",
      });
    },
  });

  const shouldShow = statusData?.requiresAction && !isDismissedTemporarily;

  if (!shouldShow) return null;

  const handleCommitAndLaunch = async () => {
    if (!committedAction.trim() || committedAction.length < 5) {
      toast({
        title: "Action Undefined",
        description: "Specify a concrete, verifiable 30-minute action (e.g., 'Solve 5 MCQ questions', 'Write database schema migration').",
        variant: "destructive",
      });
      return;
    }

    audioEngine.playCommandLock();
    await pulseMutation.mutateAsync(committedAction);
    setLocation("/air-gap-focus");
  };

  const handleCommitOnly = async () => {
    if (!committedAction.trim() || committedAction.length < 5) {
      toast({
        title: "Action Undefined",
        description: "State what you are executing in the next 30 minutes.",
        variant: "destructive",
      });
      return;
    }

    audioEngine.playCommandLock();
    await pulseMutation.mutateAsync(committedAction);
    setIsDismissedTemporarily(true);
  };

  return (
    <Dialog open={shouldShow} onOpenChange={(open) => !open && setIsDismissedTemporarily(true)}>
      <DialogContent className="sm:max-w-[520px] bg-zinc-950/95 border border-amber-500/40 backdrop-blur-2xl text-white shadow-2xl shadow-amber-500/10 p-6 rounded-2xl">
        <DialogHeader className="space-y-3">
          <div className="flex items-center justify-between">
            <Badge className="bg-amber-500/10 text-amber-400 border-amber-500/30 flex items-center gap-1.5 px-3 py-1 text-xs uppercase tracking-wider font-mono">
              <Clock className="w-3.5 h-3.5 animate-pulse text-amber-400" />
              13:00 Mid-Day Pulse Intercept
            </Badge>
            <span className="text-xs text-muted-foreground font-mono">50% Time Elapsed</span>
          </div>

          <DialogTitle className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-amber-500" />
            Mid-Day Execution Alert
          </DialogTitle>

          <DialogDescription className="text-sm text-zinc-300 leading-relaxed">
            Over 50% of today’s operating window has passed. Your primary mission is currently marked as{" "}
            <span className="text-amber-400 font-semibold uppercase">{statusData?.missionStatus?.replace("_", " ") || "Incomplete"}</span>.
            Passive drift is strictly prohibited by Ascension Protocol.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 my-2">
          {statusData?.missionTitle && (
            <div className="p-3.5 rounded-xl bg-zinc-900/80 border border-white/5 space-y-1">
              <p className="text-xs uppercase tracking-wider text-muted-foreground font-mono">Today's Assigned Target</p>
              <p className="text-sm font-medium text-white">{statusData.missionTitle}</p>
            </div>
          )}

          <div className="space-y-2">
            <Label className="text-xs font-mono uppercase tracking-wider text-zinc-300 flex items-center justify-between">
              <span>Required: Single 30-Minute Micro-Action</span>
              <span className="text-amber-400 font-normal">Non-Negotiable</span>
            </Label>
            <Input
              value={committedAction}
              onChange={(e) => setCommittedAction(e.target.value)}
              placeholder="e.g. Write Section 2 draft; solve 10 chemistry problems..."
              className="bg-black/50 border-white/10 text-white placeholder:text-zinc-600 focus:border-amber-500 text-sm h-11"
              autoFocus
            />
            <p className="text-[11px] text-muted-foreground">
              This statement will be audited by the AI Chief of Staff during your Evening Debrief at 21:00.
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
          <Button
            onClick={handleCommitAndLaunch}
            disabled={pulseMutation.isPending}
            className="flex-1 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-black font-semibold text-xs tracking-wider uppercase h-11 shadow-lg shadow-amber-500/20 gap-2"
          >
            <Zap className="w-4 h-4 fill-black" />
            Lock & Enter Air-Gap
          </Button>

          <Button
            onClick={handleCommitOnly}
            variant="outline"
            disabled={pulseMutation.isPending}
            className="border-white/10 text-zinc-300 hover:text-white hover:bg-white/5 text-xs font-mono tracking-wider uppercase h-11"
          >
            Lock Action Only
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
