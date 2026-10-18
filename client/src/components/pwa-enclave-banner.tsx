import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { usePWAInstall } from "@/hooks/usePWAInstall";
import { audioEngine } from "@/lib/audio-engine";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Download,
  Smartphone,
  ShieldCheck,
  Share,
  PlusSquare,
  X,
  Zap,
  Radio,
  Lock,
  ArrowRight
} from "lucide-react";

export function PWAEnclaveBanner() {
  const { isInstallable, isInstalled, promptInstall } = usePWAInstall();
  const [isIos, setIsIos] = useState(false);
  const [showIosGuide, setShowIosGuide] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Detect iOS devices
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    const isStandalone = (window.navigator as any).standalone || window.matchMedia("(display-mode: standalone)").matches;

    if (isIosDevice && !isStandalone) {
      setIsIos(true);
    }
  }, []);

  const handleInstallClick = () => {
    audioEngine.playCommandLock();
    if (isIos) {
      setShowIosGuide(true);
    } else {
      promptInstall();
    }
  };

  // If already running in standalone PWA mode
  if (isInstalled) {
    return null;
  }

  // If user dismissed this session
  if (dismissed) {
    return null;
  }

  // Only show if installable on Android/desktop, or if iOS non-standalone
  if (!isInstallable && !isIos) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className="relative overflow-hidden rounded-2xl border border-cyan-500/40 bg-gradient-to-r from-slate-950 via-slate-900 to-cyan-950/40 p-4 sm:p-5 shadow-[0_0_30px_rgba(6,182,212,0.15)] mb-6 backdrop-blur-xl"
      >
        {/* Cybernetic Grid Accent */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#06b6d40a_1px,transparent_1px),linear-gradient(to_bottom,#06b6d40a_1px,transparent_1px)] bg-[size:16px_16px] pointer-events-none" />
        <div className="absolute -top-12 -right-12 w-32 h-32 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0 mt-0.5">
              <Smartphone className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="outline" className="border-cyan-500/40 text-cyan-400 bg-cyan-500/10 text-[10px] font-mono tracking-wider">
                  NATIVE MOBILE ENCLAVE
                </Badge>
                <Badge variant="outline" className="border-emerald-500/30 text-emerald-400 bg-emerald-500/10 text-[10px] font-mono">
                  ZERO-LATENCY AIR-GAP
                </Badge>
              </div>
              <h3 className="text-sm sm:text-base font-bold text-white tracking-wide">
                Install Ascension Protocol Client
              </h3>
              <p className="text-xs text-slate-400 max-w-xl mt-0.5 leading-relaxed">
                Run as a hardware-isolated standalone application with zero browser URL bar distractions, instant 40Hz audio wake, and offline session resilience.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 w-full md:w-auto justify-end shrink-0 pt-2 md:pt-0">
            <Button
              onClick={handleInstallClick}
              size="sm"
              className="bg-cyan-500 hover:bg-cyan-400 text-black font-extrabold font-mono text-xs shadow-lg shadow-cyan-500/25 flex items-center gap-1.5 h-9 px-4"
            >
              <Download className="w-3.5 h-3.5" />
              {isIos ? "Add to Home Screen" : "Install Native Client"}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setDismissed(true)}
              className="text-slate-500 hover:text-slate-300 hover:bg-slate-800/60 h-9 w-9 p-0 rounded-lg"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* iOS Step-by-Step Installation Modal / Sheet */}
        {showIosGuide && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-4 pt-4 border-t border-slate-800/80 space-y-3"
          >
            <div className="text-xs font-mono text-cyan-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
              <Share className="w-3.5 h-3.5" /> iOS Safari Installation Procedure
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-slate-300 font-mono">
              <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800 flex items-start gap-2">
                <span className="text-cyan-400 font-bold">1.</span>
                <span>Tap the Safari <strong>Share</strong> button at the bottom of your screen.</span>
              </div>
              <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800 flex items-start gap-2">
                <span className="text-cyan-400 font-bold">2.</span>
                <span>Scroll down and tap <strong>Add to Home Screen</strong> <PlusSquare className="inline w-3 h-3 text-cyan-400 ml-1" />.</span>
              </div>
              <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800 flex items-start gap-2">
                <span className="text-cyan-400 font-bold">3.</span>
                <span>Launch the <strong>Ascension</strong> icon from your Home Screen for full enclave mode.</span>
              </div>
            </div>
            <div className="flex justify-end pt-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowIosGuide(false)}
                className="text-[11px] font-mono border-slate-800 text-slate-400 hover:text-white h-7"
              >
                Dismiss Guide
              </Button>
            </div>
          </motion.div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
