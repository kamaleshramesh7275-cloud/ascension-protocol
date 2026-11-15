import { useEffect, useState, useRef } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { 
  AlertCircle, ArrowRight, Shield, Lock, Download, 
  Smartphone, Zap, Volume2, AlertTriangle, 
  Gavel, QrCode, Copy, Check, Terminal, Users, 
  Cpu, Play, Square
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { usePWAInstall } from "@/hooks/usePWAInstall";
import { audioEngine } from "@/lib/audio-engine";
import { InstantFocusSandboxModal } from "@/components/sandbox/instant-focus-sandbox-modal";

// Detect iOS device
function isIOS() {
  if (typeof window === "undefined") return false;
  return /iphone|ipad|ipod/i.test(navigator.userAgent) ||
    (navigator.userAgent.includes("Mac") && "ontouchend" in document);
}

// Detect if already running as standalone PWA
function isStandalone() {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as any).standalone === true;
}

export default function AuthPage() {
  const { user, loading } = useAuth();
  const [, setLocation] = useLocation();
  const [view, setView] = useState<'hero' | 'selection' | 'admin-login'>('hero');
  const [adminPassword, setAdminPassword] = useState("");
  const [adminError, setAdminError] = useState("");
  const { isInstallable, promptInstall } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [showSandbox, setShowSandbox] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Soundboard interactive preview state
  const [isGammaPlaying, setIsGammaPlaying] = useState(false);
  const [isSirenTesting, setIsSirenTesting] = useState(false);
  const sirenTimerRef = useRef<number | null>(null);

  // Escrow dividend calculator state
  const [squadStake, setSquadStake] = useState<number>(200);
  const [squadSize, setSquadSize] = useState<number>(5);
  const [failedMembers, setFailedMembers] = useState<number>(2);

  const ios = isIOS();
  const standalone = isStandalone();

  useEffect(() => {
    if (user && !loading) {
      if (user.isAnonymous) {
        setLocation("/account-selection");
      } else {
        setLocation("/mission-command");
      }
    }
  }, [user, loading, setLocation]);

  useEffect(() => {
    return () => {
      // Cleanup sounds on unmount
      audioEngine.stop40HzGammaFlow();
      audioEngine.stopKlaxonSiren();
      if (sirenTimerRef.current) clearTimeout(sirenTimerRef.current);
    };
  }, []);

  const handleAdminSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminPassword === "admin123") {
      sessionStorage.setItem("adminAuth", "true");
      sessionStorage.setItem("adminPassword", adminPassword);
      setLocation("/admin/dashboard");
    } else {
      setAdminError("Invalid authorization code");
    }
  };

  const handleInstall = () => {
    if (isInstallable) {
      promptInstall();
    } else if (ios) {
      setShowIOSGuide(true);
    } else {
      setShowQRModal(true);
    }
  };

  const toggleGammaFlow = () => {
    if (isGammaPlaying) {
      audioEngine.stop40HzGammaFlow();
      setIsGammaPlaying(false);
    } else {
      audioEngine.start40HzGammaFlow(0.3);
      setIsGammaPlaying(true);
    }
  };

  const triggerSirenTest = () => {
    if (isSirenTesting) return;
    setIsSirenTesting(true);
    audioEngine.startKlaxonSiren();
    sirenTimerRef.current = window.setTimeout(() => {
      audioEngine.stopKlaxonSiren();
      setIsSirenTesting(false);
    }, 2200);
  };

  const triggerGavelTest = () => {
    audioEngine.playCourtGavel();
  };

  const copyAppUrl = () => {
    const url = window.location.origin;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  // Escrow Dividend Math
  const totalPool = squadStake * squadSize;
  const forfeitedCapital = squadStake * failedMembers;
  const survivingMembers = Math.max(1, squadSize - failedMembers);
  const bountyPerSurvivor = (forfeitedCapital * 0.85) / survivingMembers; // 15% protocol reserve, 85% dividend
  const totalPayout = squadStake + bountyPerSurvivor;
  const roiPercentage = Math.round((bountyPerSurvivor / squadStake) * 100);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#020617] text-white">
        <div className="text-center">
          <div className="h-10 w-10 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-cyan-400 text-sm font-medium tracking-wide">Loading Ascension Protocol...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-[#020617] text-slate-100 font-sans selection:bg-cyan-500 selection:text-black overflow-x-hidden">

      {/* Cybernetic Grid & Glow Background */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a15_1px,transparent_1px),linear-gradient(to_bottom,#0f172a15_1px,transparent_1px)] bg-[size:4rem_4rem]" />
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute bottom-1/3 right-1/4 w-[32rem] h-[32rem] bg-indigo-500/10 rounded-full blur-[160px] pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-[600px] bg-gradient-radial from-cyan-900/5 via-transparent to-transparent pointer-events-none" />
      </div>

      {/* iOS Install Guide Drawer */}
      <AnimatePresence>
        {showIOSGuide && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/85 backdrop-blur-md z-50"
              onClick={() => setShowIOSGuide(false)}
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 350, damping: 30 }}
              className="fixed bottom-0 left-0 right-0 z-50 bg-[#090d16] border-t border-cyan-500/30 rounded-t-3xl p-6 pb-12 max-w-lg mx-auto shadow-[0_-10px_40px_rgba(6,182,212,0.15)]"
            >
              <div className="flex justify-center mb-4">
                <div className="w-12 h-1.5 rounded-full bg-slate-700" />
              </div>
              <div className="flex items-center justify-center gap-2 mb-2">
                <Smartphone className="w-5 h-5 text-cyan-400" />
                <h3 className="text-xl font-bold tracking-tight text-white">Install on iOS / Safari</h3>
              </div>
              <p className="text-xs text-slate-400 text-center mb-6">
                Add Ascension Protocol to your home screen for full offline and distraction-free operation.
              </p>
              
              <div className="space-y-3">
                <div className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-900/80 border border-slate-800">
                  <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold text-sm">
                    1
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-200">Tap the Safari Share Button</p>
                    <p className="text-xs text-slate-400 mt-0.5">Located at the bottom of Safari (the square icon with an arrow pointing up).</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-900/80 border border-slate-800">
                  <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold text-sm">
                    2
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-200">Select "Add to Home Screen"</p>
                    <p className="text-xs text-slate-400 mt-0.5">Scroll down slightly in the share menu and tap "Add to Home Screen".</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-900/80 border border-slate-800">
                  <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold text-sm">
                    3
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-200">Confirm "Add"</p>
                    <p className="text-xs text-slate-400 mt-0.5">The app icon will appear directly on your home screen with zero browser bars.</p>
                  </div>
                </div>
              </div>

              <Button 
                onClick={() => setShowIOSGuide(false)} 
                className="w-full mt-6 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-semibold tracking-wide py-6"
              >
                Understood, Proceed
              </Button>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Desktop-to-Mobile QR Launch Modal */}
      <AnimatePresence>
        {showQRModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4"
              onClick={() => setShowQRModal(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-[#090d16] border border-cyan-500/40 rounded-2xl p-6 sm:p-8 max-w-sm w-full text-center relative shadow-[0_0_50px_rgba(6,182,212,0.25)]"
              >
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-medium mb-4">
                  <QrCode className="w-3.5 h-3.5" />
                  <span>Mobile App Launcher</span>
                </div>

                <h3 className="text-xl font-bold text-white mb-2">Scan to Open on Mobile</h3>
                <p className="text-xs text-slate-400 mb-6 leading-relaxed">
                  Open your smartphone camera to launch Ascension Protocol with built-in focus audio and offline sync.
                </p>

                {/* QR Code Container */}
                <div className="bg-white p-4 rounded-xl inline-block shadow-inner mb-6 mx-auto border-4 border-cyan-500/30">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(window.location.origin)}&color=020617&bgcolor=ffffff`}
                    alt="Scan to open Ascension Protocol Mobile"
                    className="w-48 h-48 block mx-auto"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    onClick={copyAppUrl}
                    variant="outline"
                    className="flex-1 border-slate-700 bg-slate-900/60 hover:bg-slate-800 text-slate-200 text-xs py-5"
                  >
                    {copiedLink ? (
                      <>
                        <Check className="w-4 h-4 mr-1.5 text-emerald-400" />
                        Link Copied
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4 mr-1.5 text-cyan-400" />
                        Copy Link
                      </>
                    )}
                  </Button>
                  <Button
                    onClick={() => setShowQRModal(false)}
                    className="bg-cyan-500 hover:bg-cyan-400 text-black font-semibold text-xs py-5 px-5"
                  >
                    Close
                  </Button>
                </div>
              </motion.div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main Top Tactical Navigation Bar */}
      <header className="relative z-30 border-b border-slate-800/80 bg-[#020617]/90 backdrop-blur-md px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 border border-cyan-400/40">
              <Terminal className="w-5 h-5 text-black font-bold" />
            </div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg text-white tracking-tight">Ascension Protocol</span>
              <span className="text-xs text-cyan-400 font-medium px-2 py-0.5 rounded-full bg-cyan-950/80 border border-cyan-800/60 hidden sm:inline-block">v2.4</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowQRModal(true)}
              className="hidden sm:inline-flex items-center gap-1.5 text-xs text-slate-300 hover:text-cyan-400 transition-colors px-3 py-1.5 rounded-lg border border-slate-800 hover:border-cyan-500/40 bg-slate-900/50"
            >
              <QrCode className="w-3.5 h-3.5" />
              <span>Mobile App</span>
            </button>

            <Button
              onClick={() => setView('selection')}
              variant="outline"
              size="sm"
              className="text-xs border-cyan-500/40 text-cyan-300 hover:bg-cyan-950/50 font-medium px-4 h-9 rounded-lg"
            >
              Sign In
            </Button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="relative z-10 overflow-y-auto overflow-x-hidden" style={{ paddingBottom: standalone ? '0' : '88px' }}>
        <AnimatePresence mode="wait">

          {/* ============ HERO & SHOWCASE VIEW ============ */}
          {view === 'hero' && (
            <motion.div
              key="hero"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              {/* Hero Section */}
              <section className="w-full max-w-6xl mx-auto px-6 pt-16 sm:pt-20 pb-20 text-center flex flex-col items-center">
                {/* Clean Eyebrow Pill */}
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-cyan-500/30 bg-cyan-950/40 backdrop-blur-md mb-8"
                >
                  <Cpu className="w-3.5 h-3.5 text-cyan-400" />
                  <span className="text-xs font-medium text-cyan-300 tracking-wide">
                    High-Performance Daily Execution Platform
                  </span>
                </motion.div>

                {/* Primary Headline */}
                <motion.h1
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2, duration: 0.5 }}
                  className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight mb-6 leading-[1.08] max-w-5xl"
                >
                  <span className="text-white">The Daily Operating System </span>
                  <span className="bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 via-teal-300 to-indigo-300">
                    for High Performers.
                  </span>
                </motion.h1>

                {/* Refined Subhead */}
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.35 }}
                  className="text-base sm:text-lg md:text-xl text-slate-300/90 max-w-3xl mb-10 leading-relaxed font-normal"
                >
                  Designed for founders, operators, and ambitious achievers. Protect your focus with built-in binaural soundscapes, 
                  lock non-negotiable daily priorities, collaborate in accountability squads, and review execution with AI debriefs.
                </motion.p>

                {/* Primary Action Buttons */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.45 }}
                  className="flex flex-col items-center justify-center gap-3.5 w-full max-w-xl mb-6"
                >
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 w-full">
                    {/* Primary App Download Button */}
                    <Button
                      onClick={handleInstall}
                      size="lg"
                      className="w-full sm:w-auto flex-1 bg-cyan-500 hover:bg-cyan-400 text-black font-semibold text-sm sm:text-base py-6 px-7 rounded-xl shadow-[0_0_30px_rgba(6,182,212,0.35)] transition-all transform hover:scale-[1.01]"
                    >
                      <Download className="mr-2 w-4 h-4" />
                      Get Started / Install App
                    </Button>

                    {/* Instant Browser Access */}
                    <Button
                      onClick={() => setLocation('/account-selection')}
                      size="lg"
                      variant="outline"
                      className="w-full sm:w-auto border-slate-700 hover:border-cyan-500/50 bg-slate-900/70 hover:bg-slate-800 text-white font-medium text-sm sm:text-base py-6 px-7 rounded-xl transition-all"
                    >
                      Launch Web App <ArrowRight className="ml-2 w-4 h-4 text-cyan-400" />
                    </Button>
                  </div>

                  {/* 3-Minute Sandbox Button */}
                  <Button
                    onClick={() => {
                      audioEngine.playTactileClick();
                      setShowSandbox(true);
                    }}
                    className="w-full bg-slate-900/80 hover:bg-slate-800 border border-cyan-500/30 hover:border-cyan-500/60 text-cyan-300 font-medium text-xs sm:text-sm py-5 rounded-xl flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(6,182,212,0.15)] transition-all"
                  >
                    <Zap className="w-4 h-4 text-cyan-400" />
                    <span>Try a 3-Minute Deep Work Session (Instant Preview — No Sign-Up)</span>
                    <ArrowRight className="w-4 h-4 text-cyan-400 ml-1" />
                  </Button>
                </motion.div>

                {/* Sub-label Trust Indicators */}
                <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-slate-400 mb-16">
                  <span className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-cyan-400" /> 100% Offline Focus Sync
                  </span>
                  <span className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-cyan-400" /> Instant Browser Setup (PWA)
                  </span>
                  <span className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-cyan-400" /> Zero Invasive Ads or Tracking
                  </span>
                </div>

                {/* Interactive Soundboard Preview Card */}
                <motion.div
                  initial={{ opacity: 1, y: 0 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="w-full max-w-4xl bg-slate-900/60 border border-cyan-500/30 rounded-2xl p-6 sm:p-8 backdrop-blur-xl relative overflow-hidden text-left mb-20 shadow-[0_10px_40px_rgba(0,0,0,0.5)]"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
                    <div>
                      <div className="inline-flex items-center gap-2 text-cyan-400 text-xs font-semibold tracking-wider uppercase mb-1">
                        <Volume2 className="w-4 h-4" />
                        <span>Acoustic Focus Subsystem</span>
                      </div>
                      <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                        Built-In Soundscapes for Deep Focus
                      </h3>
                      <p className="text-xs sm:text-sm text-slate-400 mt-1 leading-relaxed">
                        Generated locally in your browser with native Web Audio oscillators. Zero downloads, zero latency.
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="px-3 py-1 rounded-lg bg-slate-800 text-xs text-slate-300 border border-slate-700">
                        Latency: &lt;5ms
                      </span>
                      <span className="px-3 py-1 rounded-lg bg-cyan-950 text-xs text-cyan-300 border border-cyan-800">
                        Frequency: 40Hz Gamma
                      </span>
                    </div>
                  </div>

                  {/* 3 Interactive Sound Triggers */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-6">
                    {/* Sound 1: 40Hz Gamma Flow */}
                    <div className="p-5 rounded-xl bg-slate-950/70 border border-slate-800 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-semibold text-cyan-400 uppercase tracking-wider">Cognitive Flow</span>
                          {isGammaPlaying && (
                            <span className="flex h-2 w-2 relative">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
                            </span>
                          )}
                        </div>
                        <h4 className="text-base font-bold text-white mb-1.5">40Hz Binaural Beat</h4>
                        <p className="text-xs text-slate-400 mb-4 leading-relaxed">
                          Synchronizes brainwave activity to foster sustained attention and flow state.
                        </p>
                      </div>

                      <Button
                        onClick={toggleGammaFlow}
                        size="sm"
                        className={`w-full text-xs font-semibold py-4 rounded-lg transition-all ${
                          isGammaPlaying 
                            ? 'bg-cyan-500 text-black hover:bg-cyan-400' 
                            : 'bg-slate-800 hover:bg-slate-700 text-cyan-300'
                        }`}
                      >
                        {isGammaPlaying ? (
                          <>
                            <Square className="w-3.5 h-3.5 mr-1.5 fill-current" /> Stop 40Hz Flow
                          </>
                        ) : (
                          <>
                            <Play className="w-3.5 h-3.5 mr-1.5 fill-current" /> Start 40Hz Flow
                          </>
                        )}
                      </Button>
                    </div>

                    {/* Sound 2: Distraction Alert */}
                    <div className="p-5 rounded-xl bg-slate-950/70 border border-slate-800 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-semibold text-rose-400 uppercase tracking-wider">Focus Guard</span>
                          {isSirenTesting && (
                            <span className="text-[10px] text-rose-400 font-bold animate-pulse">Alerting</span>
                          )}
                        </div>
                        <h4 className="text-base font-bold text-white mb-1.5">Distraction Alert</h4>
                        <p className="text-xs text-slate-400 mb-4 leading-relaxed">
                          An immediate acoustic alert triggered if you switch tabs or break focus during an active session.
                        </p>
                      </div>

                      <Button
                        onClick={triggerSirenTest}
                        disabled={isSirenTesting}
                        size="sm"
                        className="w-full text-xs font-semibold py-4 rounded-lg bg-rose-950/60 hover:bg-rose-900 border border-rose-800 text-rose-300"
                      >
                        <AlertTriangle className="w-3.5 h-3.5 mr-1.5 text-rose-400" />
                        {isSirenTesting ? "Playing Alert..." : "Test Alert Chime"}
                      </Button>
                    </div>

                    {/* Sound 3: Weekly Review Impact */}
                    <div className="p-5 rounded-xl bg-slate-950/70 border border-slate-800 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider">Accountability</span>
                          <span className="text-[10px] text-slate-500 font-medium">Sunday Review</span>
                        </div>
                        <h4 className="text-base font-bold text-white mb-1.5">Review Completion Chime</h4>
                        <p className="text-xs text-slate-400 mb-4 leading-relaxed">
                          Signature resonant acoustic impact sounded when weekly performance covenants are audited.
                        </p>
                      </div>

                      <Button
                        onClick={triggerGavelTest}
                        size="sm"
                        className="w-full text-xs font-semibold py-4 rounded-lg bg-amber-950/60 hover:bg-amber-900 border border-amber-800 text-amber-300"
                      >
                        <Gavel className="w-3.5 h-3.5 mr-1.5 text-amber-400" />
                        Play Review Chime
                      </Button>
                    </div>
                  </div>
                </motion.div>

                {/* Squad Accountability & Commitment Calculator */}
                <motion.div
                  initial={{ opacity: 1, y: 0 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="w-full max-w-4xl bg-slate-900/60 border border-amber-500/30 rounded-2xl p-6 sm:p-8 backdrop-blur-xl relative overflow-hidden text-left mb-24 shadow-[0_10px_40px_rgba(0,0,0,0.5)]"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
                    <div>
                      <div className="inline-flex items-center gap-2 text-amber-400 text-xs font-semibold tracking-wider uppercase mb-1">
                        <Users className="w-4 h-4" />
                        <span>Peer Accountability</span>
                      </div>
                      <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                        Squad Accountability & Commitment Pools
                      </h3>
                      <p className="text-xs sm:text-sm text-slate-400 mt-1 leading-relaxed">
                        Put skin in the game. Form an accountability circle with peers, set weekly commitments, and share in the pool when you hit your targets.
                      </p>
                    </div>

                    <div className="bg-amber-950/60 border border-amber-500/40 rounded-xl px-4 py-2.5 text-right">
                      <div className="text-[11px] text-amber-300 uppercase font-semibold">Estimated Payout</div>
                      <div className="text-2xl font-bold text-amber-400">
                        ${totalPayout.toFixed(0)} <span className="text-xs text-amber-300 font-medium">({roiPercentage >= 0 ? `+${roiPercentage}%` : ''})</span>
                      </div>
                    </div>
                  </div>

                  {/* Calculator Sliders & Output */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6">
                    {/* Stake Slider */}
                    <div>
                      <div className="flex justify-between text-xs mb-2">
                        <span className="text-slate-400 font-medium">Weekly Stake:</span>
                        <span className="text-cyan-400 font-bold">${squadStake}</span>
                      </div>
                      <input
                        type="range"
                        min="50"
                        max="1000"
                        step="50"
                        value={squadStake}
                        onChange={(e) => setSquadStake(Number(e.target.value))}
                        className="w-full accent-cyan-500 cursor-pointer"
                      />
                      <span className="text-[11px] text-slate-500 mt-1 block">$50 to $1,000 commitment</span>
                    </div>

                    {/* Squad Size Slider */}
                    <div>
                      <div className="flex justify-between text-xs mb-2">
                        <span className="text-slate-400 font-medium">Squad Members:</span>
                        <span className="text-cyan-400 font-bold">{squadSize} members</span>
                      </div>
                      <input
                        type="range"
                        min="3"
                        max="10"
                        step="1"
                        value={squadSize}
                        onChange={(e) => {
                          const size = Number(e.target.value);
                          setSquadSize(size);
                          if (failedMembers >= size) setFailedMembers(size - 1);
                        }}
                        className="w-full accent-cyan-500 cursor-pointer"
                      />
                      <span className="text-[11px] text-slate-500 mt-1 block">Accountability circle size</span>
                    </div>

                    {/* Failed Operators Slider */}
                    <div>
                      <div className="flex justify-between text-xs mb-2">
                        <span className="text-slate-400 font-medium">Unmet Commitments:</span>
                        <span className="text-rose-400 font-bold">{failedMembers} missed</span>
                      </div>
                      <input
                        type="range"
                        min="1"
                        max={squadSize - 1}
                        step="1"
                        value={failedMembers}
                        onChange={(e) => setFailedMembers(Number(e.target.value))}
                        className="w-full accent-rose-500 cursor-pointer"
                      />
                      <span className="text-[11px] text-slate-500 mt-1 block">
                        Capital in pool: ${forfeitedCapital}
                      </span>
                    </div>
                  </div>

                  <div className="mt-6 p-4 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-300 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="leading-relaxed">
                      <strong className="text-white">Discipline Reward Formula:</strong> Operators who fulfill 100% of their weekly targets recover their full <span className="text-cyan-300 font-semibold">${squadStake}</span> deposit plus an earned <span className="text-emerald-400 font-semibold">+${bountyPerSurvivor.toFixed(1)}</span> dividend.
                    </div>
                    <Button
                      onClick={() => setLocation('/account-selection')}
                      size="sm"
                      className="bg-amber-500 hover:bg-amber-400 text-black font-semibold text-xs px-4 py-2 rounded-lg flex-shrink-0"
                    >
                      Join Squad Pact
                    </Button>
                  </div>
                </motion.div>

                {/* The 4 Core Execution Pillars Showcase */}
                <section className="w-full max-w-6xl mx-auto mb-20 text-left">
                  <div className="text-center mb-12">
                    <span className="text-xs font-semibold text-cyan-400 tracking-wider uppercase">System Architecture</span>
                    <h2 className="text-3xl sm:text-4xl font-extrabold text-white mt-2 tracking-tight">
                      Four Pillars of Consistent Execution
                    </h2>
                    <p className="text-slate-400 text-sm sm:text-base mt-2 max-w-xl mx-auto leading-relaxed">
                      A structured daily operating rhythm engineered to eliminate decision fatigue, protect deep work, and build consistency.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Pillar I */}
                    <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800 hover:border-cyan-500/40 transition-all">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold text-lg">
                          01
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-white tracking-tight">Morning Briefing & Priority Locking</h3>
                          <span className="text-xs text-cyan-400 font-medium">Pillar I • Priority Locking</span>
                        </div>
                      </div>
                      <p className="text-slate-400 text-xs sm:text-sm leading-relaxed mb-4">
                        Define your 3 non-negotiable priorities each morning before communication channels open. Lock your daily focus with clear intention.
                      </p>
                      <div className="flex items-center gap-2 text-xs text-slate-400">
                        <Check className="w-4 h-4 text-cyan-400" /> Priority Weighting
                        <span className="mx-1">•</span>
                        <Check className="w-4 h-4 text-cyan-400" /> Distraction Shielding
                      </div>
                    </div>

                    {/* Pillar II */}
                    <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800 hover:border-cyan-500/40 transition-all">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center font-bold text-lg">
                          02
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-white tracking-tight">Deep Work Sessions & Focus Guard</h3>
                          <span className="text-xs text-rose-400 font-medium">Pillar II • Flow State</span>
                        </div>
                      </div>
                      <p className="text-slate-400 text-xs sm:text-sm leading-relaxed mb-4">
                        Full-screen focus sessions powered by local 40Hz binaural audio. Window switches trigger immediate acoustic alerts to preserve attention.
                      </p>
                      <div className="flex items-center gap-2 text-xs text-slate-400">
                        <Check className="w-4 h-4 text-rose-400" /> 100% Offline Enclave Sync
                        <span className="mx-1">•</span>
                        <Check className="w-4 h-4 text-rose-400" /> Real-time Focus Telemetry
                      </div>
                    </div>

                    {/* Pillar III */}
                    <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800 hover:border-cyan-500/40 transition-all">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-lg">
                          03
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-white tracking-tight">AI Performance Coaching</h3>
                          <span className="text-xs text-indigo-400 font-medium">Pillar III • Execution Insights</span>
                        </div>
                      </div>
                      <p className="text-slate-400 text-xs sm:text-sm leading-relaxed mb-4">
                        Mid-day pulse checks and structured evening debriefs to pinpoint friction, celebrate momentum, and calibrate daily habits.
                      </p>
                      <div className="flex items-center gap-2 text-xs text-slate-400">
                        <Check className="w-4 h-4 text-indigo-400" /> Friction Root Cause Analysis
                        <span className="mx-1">•</span>
                        <Check className="w-4 h-4 text-indigo-400" /> Daily Execution Velocity
                      </div>
                    </div>

                    {/* Pillar IV */}
                    <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800 hover:border-cyan-500/40 transition-all">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-lg">
                          04
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-white tracking-tight">Sunday Performance Court & Review</h3>
                          <span className="text-xs text-amber-400 font-medium">Pillar IV • Accountability</span>
                        </div>
                      </div>
                      <p className="text-slate-400 text-xs sm:text-sm leading-relaxed mb-4">
                        Automated weekly accountability review. Audits 7-day consistency, settles squad commitment pools, and resets goals for the coming week.
                      </p>
                      <div className="flex items-center gap-2 text-xs text-slate-400">
                        <Check className="w-4 h-4 text-amber-400" /> Escrow Commitment Pools
                        <span className="mx-1">•</span>
                        <Check className="w-4 h-4 text-amber-400" /> Verified Execution Records
                      </div>
                    </div>
                  </div>
                </section>

                {/* Final Call to Action */}
                <div className="w-full max-w-4xl p-8 sm:p-12 rounded-3xl bg-gradient-to-br from-cyan-950/60 to-slate-900 border border-cyan-500/40 text-center relative overflow-hidden mb-12">
                  <div className="relative z-10">
                    <h2 className="text-2xl sm:text-4xl font-extrabold text-white mb-4 tracking-tight">
                      Ready to Elevate Your Daily Execution?
                    </h2>
                    <p className="text-slate-300 text-sm sm:text-base max-w-xl mx-auto mb-8 leading-relaxed">
                      Ascension Protocol works across every device. Install the progressive web application to operate with deep focus and consistency.
                    </p>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                      <Button
                        onClick={handleInstall}
                        size="lg"
                        className="w-full sm:w-auto bg-cyan-500 hover:bg-cyan-400 text-black font-semibold text-sm sm:text-base py-6 px-8 rounded-xl shadow-[0_0_25px_rgba(6,182,212,0.4)]"
                      >
                        <Download className="mr-2 w-4 h-4" />
                        Install App Now
                      </Button>
                      <Button
                        onClick={() => setView('selection')}
                        size="lg"
                        variant="outline"
                        className="w-full sm:w-auto border-slate-700 bg-slate-900/60 hover:bg-slate-800 text-slate-200 font-medium text-sm sm:text-base py-6 px-8 rounded-xl"
                      >
                        Launch Web App
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Professional Footer */}
                <footer className="w-full text-center pb-8 pt-4 text-xs text-slate-500 border-t border-slate-900/80">
                  <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 mb-3">
                    <button
                      onClick={() => setLocation('/privacy')}
                      className="hover:text-cyan-400 transition-colors cursor-pointer"
                    >
                      Privacy Policy
                    </button>
                    <span>•</span>
                    <button
                      onClick={() => setLocation('/terms')}
                      className="hover:text-cyan-400 transition-colors cursor-pointer"
                    >
                      Terms of Service
                    </button>
                    <span>•</span>
                    <button
                      onClick={() => setLocation('/contact')}
                      className="hover:text-cyan-400 transition-colors cursor-pointer"
                    >
                      Contact Support
                    </button>
                  </div>
                  <p className="text-slate-600">© {new Date().getFullYear()} Ascension Protocol. All rights reserved.</p>
                </footer>
              </section>
            </motion.div>
          )}

          {/* ============ SELECTION VIEW (MEMBER / ADMIN PORTAL) ============ */}
          {view === 'selection' && (
            <motion.div
              key="selection"
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.97 }}
              transition={{ duration: 0.2 }}
              className="min-h-[85vh] flex flex-col items-center justify-center px-6 py-12"
            >
              <div className="text-center mb-10">
                <span className="text-xs font-semibold text-cyan-400 tracking-wider uppercase">Authentication</span>
                <h2 className="text-3xl sm:text-4xl font-bold text-white mt-1 tracking-tight">Select Sign-In Portal</h2>
                <p className="text-slate-400 text-sm mt-2">Choose your operator authorization profile</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-2xl">
                {/* Standard Operator Login */}
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setLocation('/login')}
                  className="cursor-pointer group relative overflow-hidden rounded-2xl border border-cyan-500/30 bg-slate-900/60 backdrop-blur-md p-8 hover:border-cyan-400 transition-all shadow-lg hover:shadow-cyan-500/10"
                >
                  <div className="relative z-10 flex flex-col items-center text-center gap-4">
                    <div className="p-4 rounded-2xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                      <Terminal className="w-8 h-8" />
                    </div>
                    <h3 className="text-xl font-bold text-white">Member Portal</h3>
                    <p className="text-slate-400 text-xs sm:text-sm leading-relaxed">
                      Access your mission command center, 40Hz focus sessions, and squad commitments.
                    </p>
                    <span className="text-cyan-400 text-xs font-semibold flex items-center gap-1 mt-2">
                      Sign In to Account <ArrowRight className="w-4 h-4" />
                    </span>
                  </div>
                </motion.div>

                {/* Administrator Console */}
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setView('admin-login')}
                  className="cursor-pointer group relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-md p-8 hover:border-amber-500/40 transition-all"
                >
                  <div className="relative z-10 flex flex-col items-center text-center gap-4">
                    <div className="p-4 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                      <Shield className="w-8 h-8" />
                    </div>
                    <h3 className="text-xl font-bold text-white">Administrator Access</h3>
                    <p className="text-slate-400 text-xs sm:text-sm leading-relaxed">
                      System diagnostics, performance audits, and platform management.
                    </p>
                    <span className="text-amber-400 text-xs font-semibold flex items-center gap-1 mt-2">
                      Admin Passphrase Login <Lock className="w-4 h-4" />
                    </span>
                  </div>
                </motion.div>
              </div>

              <button
                onClick={() => setView('hero')}
                className="mt-10 text-xs text-slate-400 hover:text-cyan-400 transition-colors"
              >
                ← Return to Home Overview
              </button>
            </motion.div>
          )}

          {/* ============ ADMIN LOGIN VIEW ============ */}
          {view === 'admin-login' && (
            <motion.div
              key="admin-login"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
              className="min-h-[85vh] flex flex-col items-center justify-center px-6 py-12"
            >
              <Card className="bg-[#090d16] border-slate-800 backdrop-blur-xl w-full max-w-sm shadow-2xl">
                <CardHeader className="text-center">
                  <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto mb-2 text-amber-400">
                    <Lock className="w-6 h-6" />
                  </div>
                  <CardTitle className="text-xl font-bold text-white">Administrator Sign-In</CardTitle>
                  <CardDescription className="text-xs text-slate-400">
                    Enter root administrator passphrase
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleAdminSubmit} className="space-y-4">
                    <input
                      type="password"
                      value={adminPassword}
                      onChange={(e) => { setAdminPassword(e.target.value); setAdminError(""); }}
                      placeholder="Root security passphrase"
                      className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm placeholder:text-slate-600 focus:outline-none focus:border-cyan-500 transition-all"
                      autoFocus
                    />
                    {adminError && (
                      <p className="text-xs text-rose-400 flex items-center gap-1.5">
                        <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" /> {adminError}
                      </p>
                    )}
                    <Button 
                      type="submit" 
                      className="w-full bg-cyan-500 hover:bg-cyan-400 text-black font-semibold text-xs py-5 rounded-xl"
                    >
                      Authenticate
                    </Button>
                    <div className="text-center pt-2">
                      <button 
                        type="button" 
                        onClick={() => setView('selection')} 
                        className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </motion.div>
          )}

        </AnimatePresence>
      </main>

      {/* ============ STICKY MOBILE CONSOLE / DOWNLOAD BAR ============ */}
      <AnimatePresence>
        {view === 'hero' && (
          <motion.div
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            exit={{ y: 100 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed bottom-0 left-0 right-0 md:hidden z-40 px-4 py-3 bg-[#020617]/95 backdrop-blur-xl border-t border-cyan-500/20"
          >
            {standalone ? (
              <Button
                onClick={() => setView('selection')}
                className="w-full bg-cyan-500 hover:bg-cyan-400 text-black font-semibold rounded-xl py-6 text-sm shadow-[0_0_20px_rgba(6,182,212,0.3)]"
              >
                Launch Dashboard <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button
                  onClick={handleInstall}
                  className="flex-1 bg-cyan-500 hover:bg-cyan-400 text-black font-semibold rounded-xl py-6 text-xs shadow-[0_0_20px_rgba(6,182,212,0.3)]"
                >
                  <Download className="mr-1.5 w-4 h-4" />
                  Install App
                </Button>
                <Button
                  onClick={() => setView('selection')}
                  variant="outline"
                  className="border-slate-700 bg-slate-900 text-white text-xs rounded-xl py-6 px-4 font-medium"
                >
                  Sign In
                </Button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* 3-Minute Instant Focus Sandbox Modal */}
      <InstantFocusSandboxModal
        isOpen={showSandbox}
        onClose={() => setShowSandbox(false)}
        onConvertToAccount={() => {
          setShowSandbox(false);
          setLocation('/account-selection');
        }}
      />

    </div>
  );
}
