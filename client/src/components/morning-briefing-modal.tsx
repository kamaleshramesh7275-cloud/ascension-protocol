import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertTriangle,
  Crosshair,
  ShieldAlert,
  Clock,
  Flame,
  CheckCircle2,
  Lock,
  Sun,
  Sunrise,
  Quote,
  Zap,
  Radio
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

  // Fetch Free Chronobiology & Stoic Combat Doctrine API for Pillar 1
  const { data: intelData } = useQuery({
    queryKey: ["/api/protocol/pillar-1-intelligence"],
    staleTime: 1000 * 60 * 15, // 15 mins cache
  });

  const chronobiology = (intelData as any)?.chronobiology;
  const doctrine = (intelData as any)?.doctrine;

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
          className="w-full max-w-2xl bg-slate-950 border-2 border-red-500/40 rounded-2xl shadow-2xl shadow-red-500/20 p-6 sm:p-8 space-y-5 relative overflow-hidden"
        >
          {/* Ambient red hazard accent */}
          <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-red-600 via-amber-500 to-red-600 animate-pulse" />

          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="border-red-500 text-red-400 bg-red-500/10 px-2.5 py-1 text-xs font-mono uppercase tracking-wider flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4 text-red-500 animate-pulse" />
                MANDATORY MORNING BRIEFING
              </Badge>
              <Badge variant="outline" className="border-cyan-500/30 text-cyan-400 bg-cyan-950/40 text-[10px] font-mono">
                PILLAR 1: INTENT LOCK
              </Badge>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-mono text-slate-500">
              <Lock className="w-3.5 h-3.5" /> PROTOCOL ENGAGED
            </div>
          </div>

          {/* Chronobiology Environmental Telemetry (Open-Meteo Free API) */}
          {chronobiology && (
            <div className="bg-cyan-950/20 border border-cyan-500/30 rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                  <Sunrise className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-cyan-300 font-bold uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                    <Sun className="w-3 h-3 text-amber-400" />
                    CHRONOBIOLOGY FOCUS CALIBRATION
                  </div>
                  <div className="text-slate-400 text-[11px] mt-0.5">
                    Sunrise: <span className="text-white font-bold">{chronobiology.sunrise}</span> • Temp: <span className="text-white font-bold">{chronobiology.temperature}°C</span>
                  </div>
                </div>
              </div>

              <div className="sm:text-right bg-slate-950/80 px-3 py-1.5 rounded-lg border border-slate-800">
                <div className="text-[10px] text-slate-500 uppercase">PEAK NEURO-WINDOW</div>
                <div className="text-xs font-bold text-amber-400">{chronobiology.peakFocusWindow}</div>
              </div>
            </div>
          )}

          {/* Psychological Mirror: The Failure Statement */}
          <div className="bg-red-950/20 border border-red-500/30 rounded-xl p-4 sm:p-5 space-y-1.5">
            <div className="flex items-center gap-2 text-xs font-bold font-mono text-red-400 uppercase tracking-wider">
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
              YOUR DAILY FAILURE MIRROR
            </div>
            <p className="text-sm sm:text-base font-semibold text-red-200 leading-relaxed italic">
              &ldquo;{failureStatement || "If I fail to execute today, I forfeit my potential and validate the rationalizations of my past self."}&rdquo;
            </p>
            <p className="text-[10px] text-red-400/80 font-mono">
              Written by your own hand during Diagnostic Intake. You cannot look away from this reality.
            </p>
          </div>

          {/* Stoic Combat Doctrine of the Day (Free API) */}
          {doctrine && (
            <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 relative overflow-hidden">
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <div className="text-[11px] font-mono text-slate-400 font-semibold uppercase tracking-wider flex items-center gap-1.5">
                  <Quote className="w-3.5 h-3.5 text-cyan-400" />
                  COMBAT DOCTRINE // {doctrine.author.toUpperCase()}
                </div>
                <Badge variant="outline" className="border-slate-800 text-[9px] font-mono text-slate-400 uppercase">
                  {doctrine.tacticalCategory}
                </Badge>
              </div>
              <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-mono italic">
                &ldquo;{doctrine.text}&rdquo;
              </p>
            </div>
          )}

          {/* Today's High-Leverage Mission */}
          <div className="space-y-2">
            <div className="text-xs font-mono text-slate-400 flex items-center gap-1.5 uppercase tracking-wider">
              <Crosshair className="w-4 h-4 text-amber-400" />
              ASSIGNED STRATEGIC MISSION
            </div>
            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 space-y-1.5">
              <div className="text-base sm:text-lg font-bold text-white">
                {missionTitle}
              </div>
              <div className="text-xs text-slate-400">
                <span className="text-amber-400 font-semibold font-mono">DELIVERABLE: </span>
                {tacticalDeliverable}
              </div>
              <div className="flex items-center gap-2 pt-1 text-xs font-mono text-cyan-400">
                <Clock className="w-3.5 h-3.5" />
                <span>DESIGNATED PEAK WINDOW: {chronobiology?.peakFocusWindow || executionWindow}</span>
              </div>
            </div>
          </div>

          {/* Acknowledgment Action */}
          <div className="pt-1">
            <Button
              onClick={() => {
                audioEngine.playCommandLock();
                onAcknowledge();
              }}
              disabled={!canAcknowledge}
              className={`w-full h-12 text-xs sm:text-sm font-extrabold uppercase tracking-wider transition-all rounded-xl ${
                canAcknowledge
                  ? "bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-600/30 cursor-pointer"
                  : "bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700"
              }`}
            >
              {canAcknowledge ? (
                <span className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-white" />
                  I ACKNOWLEDGE MY ORDERS AND ACCEPT THE BATTLE
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 animate-spin text-amber-400" />
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
