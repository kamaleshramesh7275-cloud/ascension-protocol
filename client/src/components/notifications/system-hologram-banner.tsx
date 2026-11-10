import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "wouter";
import { audioEngine } from "@/lib/audio-engine";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Terminal, AlertTriangle, ArrowRight, X, Sparkles } from "lucide-react";

interface SystemHologramBannerProps {
  title?: string;
  message?: string;
  actionUrl?: string;
  actionLabel?: string;
  severity?: "normal" | "urgent" | "penalty";
  dismissible?: boolean;
}

export function SystemHologramBanner({
  title = "SYSTEM MANDATE // PROTOCOL DIRECTIVE",
  message = "Daily Focus Spire has reset. Complete your Floor 1 Gate of Intent to maintain unbroken rank status.",
  actionUrl = "/mission-command",
  actionLabel = "VIEW MISSION",
  severity = "normal",
  dismissible = true,
}: SystemHologramBannerProps) {
  const [, setLocation] = useLocation();
  const [visible, setVisible] = useState(true);

  if (!visible) return null;

  const isUrgent = severity === "urgent";
  const isPenalty = severity === "penalty";

  const borderColor = isPenalty 
    ? "border-red-500/50 shadow-red-500/20" 
    : isUrgent 
    ? "border-amber-500/50 shadow-amber-500/20" 
    : "border-cyan-500/40 shadow-cyan-500/15";

  const glowBg = isPenalty 
    ? "bg-red-950/40" 
    : isUrgent 
    ? "bg-amber-950/40" 
    : "bg-[#060D17]/90";

  const accentColor = isPenalty 
    ? "#ef4444" 
    : isUrgent 
    ? "#f59e0b" 
    : "#06b6d4";

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -15, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -15, scale: 0.98 }}
        className={`relative overflow-hidden rounded-xl border backdrop-blur-xl p-4 sm:p-5 shadow-2xl ${borderColor} ${glowBg} transition-all`}
      >
        {/* Hologram Scanline Effect */}
        <div 
          className="absolute inset-0 pointer-events-none opacity-10"
          style={{
            backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.15) 2px, rgba(255,255,255,0.15) 4px)",
          }}
        />

        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div 
              className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
              style={{ backgroundColor: `${accentColor}22`, border: `1px solid ${accentColor}55` }}
            >
              {isPenalty ? (
                <AlertTriangle className="w-4 h-4 text-red-400" />
              ) : (
                <Terminal className="w-4 h-4" style={{ color: accentColor }} />
              )}
            </div>

            <div className="space-y-0.5">
              <div className="flex items-center gap-2 flex-wrap">
                <span 
                  className="font-mono text-[10px] font-black uppercase tracking-widest"
                  style={{ color: accentColor }}
                >
                  {isPenalty ? "[ SYSTEM PENALTY ALERT ]" : "[ SYSTEM NOTIFICATION ]"}
                </span>
                <span className="text-[10px] font-mono text-zinc-400">
                  {title}
                </span>
              </div>
              <p className="font-mono text-xs text-zinc-300 leading-relaxed max-w-2xl">
                {message}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <Button
              size="sm"
              onClick={() => {
                audioEngine.playCommandLock();
                setLocation(actionUrl);
              }}
              style={{
                backgroundColor: accentColor,
                color: "#000000",
              }}
              className="font-mono text-xs font-black h-8 px-4 uppercase shadow-md flex items-center gap-1.5 w-full sm:w-auto"
            >
              <span>{actionLabel}</span>
              <ArrowRight className="w-3.5 h-3.5 text-black" />
            </Button>

            {dismissible && (
              <button
                onClick={() => setVisible(false)}
                className="text-zinc-500 hover:text-zinc-300 p-1.5 rounded-md hover:bg-white/5 transition-colors"
                title="Dismiss"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

