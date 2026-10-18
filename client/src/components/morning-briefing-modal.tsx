import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertTriangle,
  Crosshair,
  ShieldAlert,
  Clock,
  Flame,
  CheckCircle2,
  Lock
} from "lucide-react";
import { audioEngine } from "@/lib/audio-engine";

interface MorningBriefingModalProps {
  failureStatement: string;
  missionTitle: string;
  tacticalDeliverable: string;
  executionWindow: string;
  onAcknowledge: () => void;
}

export function MorningBriefingModal({
  failureStatement,
  missionTitle,
  tacticalDeliverable,
  executionWindow,
  onAcknowledge,
}: MorningBriefingModalProps) {
  const [countdown, setCountdown] = useState<number>(3);
  const [canAcknowledge, setCanAcknowledge] = useState<boolean>(false);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanAcknowledge(true);
    }
  }, [countdown]);

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-xl flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="w-full max-w-2xl bg-slate-950 border-2 border-red-500/40 rounded-2xl shadow-2xl shadow-red-500/20 p-6 sm:p-8 space-y-6 relative overflow-hidden"
        >
          {/* Ambient red hazard accent */}
          <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-red-600 via-amber-500 to-red-600 animate-pulse" />

          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="border-red-500 text-red-400 bg-red-500/10 px-2.5 py-1 text-xs font-mono uppercase tracking-wider flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4 text-red-500 animate-pulse" />
                MANDATORY MORNING BRIEFING
              </Badge>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-mono text-slate-500">
              <Lock className="w-3.5 h-3.5" /> PROTOCOL ENGAGED
            </div>
          </div>

          {/* Psychological Mirror: The Failure Statement */}
          <div className="bg-red-950/20 border border-red-500/30 rounded-xl p-5 space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold font-mono text-red-400 uppercase tracking-wider">
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
              YOUR DAILY FAILURE MIRROR
            </div>
            <p className="text-base sm:text-lg font-semibold text-red-200 leading-relaxed italic">
              &ldquo;{failureStatement || "If I fail to execute today, I forfeit my potential and validate the rationalizations of my past self."}&rdquo;
            </p>
            <p className="text-[11px] text-red-400/80 font-mono">
              Written by your own hand during Diagnostic Intake. You cannot look away from this reality.
            </p>
          </div>

          {/* Today's High-Leverage Mission */}
          <div className="space-y-3">
            <div className="text-xs font-mono text-slate-400 flex items-center gap-1.5 uppercase tracking-wider">
              <Crosshair className="w-4 h-4 text-amber-400" />
              ASSIGNED STRATEGIC MISSION
            </div>
            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 space-y-2">
              <div className="text-lg font-bold text-white">
                {missionTitle}
              </div>
              <div className="text-xs text-slate-400">
                <span className="text-amber-400 font-semibold font-mono">DELIVERABLE: </span>
                {tacticalDeliverable}
              </div>
              <div className="flex items-center gap-2 pt-2 text-xs font-mono text-cyan-400">
                <Clock className="w-3.5 h-3.5" />
                <span>DESIGNATED PEAK WINDOW: {executionWindow}</span>
              </div>
            </div>
          </div>

          {/* Acknowledgment Action */}
          <div className="pt-2">
            <Button
              onClick={() => {
                audioEngine.playCommandLock();
                onAcknowledge();
              }}
              disabled={!canAcknowledge}
              className={`w-full h-13 text-sm sm:text-base font-extrabold uppercase tracking-wider transition-all ${
                canAcknowledge
                  ? "bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-600/30 cursor-pointer"
                  : "bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700"
              }`}
            >
              {canAcknowledge ? (
                <span className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-white" />
                  I ACKNOWLEDGE MY ORDERS AND ACCEPT THE BATTLE
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Clock className="w-4 h-4 animate-spin text-amber-400" />
                  READING PROTOCOL ENFORCED ({countdown}s)...
                </span>
              )}
            </Button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
