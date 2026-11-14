import { useEffect, useState, useRef } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { 
  AlertCircle, ArrowRight, Shield, Lock, Download, Share, 
  Smartphone, Zap, Target, Volume2, VolumeX, AlertTriangle, 
  Gavel, QrCode, Copy, Check, Terminal, Flame, Users, 
  Cpu, Award, ExternalLink, Play, Square
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
  const bountyPerSurvivor = (forfeitedCapital * 0.85) / survivingMembers; // 15% burnt, 85% dividend
  const totalPayout = squadStake + bountyPerSurvivor;
  const roiPercentage = Math.round((bountyPerSurvivor / squadStake) * 100);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#020617] text-white">
        <div className="text-center font-mono">
          <div className="h-10 w-10 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-cyan-400 text-sm tracking-widest uppercase">INITIALIZING ASCENSION OS...</p>
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
                <h3 className="text-xl font-bold font-mono tracking-tight text-white uppercase">Install on iOS / Safari</h3>
              </div>
              <p className="text-xs text-slate-400 text-center mb-6 font-mono">
                Ascension Protocol is designed as an installed standalone tactical enclave.
              </p>
              
              <div className="space-y-3 font-mono">
                <div className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-900/80 border border-slate-800">
                  <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold text-sm">
                    1
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-200">Tap the Safari Share Icon</p>
                    <p className="text-xs text-slate-400 mt-0.5">Located on the bottom navigation bar in Safari (box with up arrow).</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-900/80 border border-slate-800">
                  <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold text-sm">
                    2
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-200">Select "Add to Home Screen"</p>
                    <p className="text-xs text-slate-400 mt-0.5">Scroll down slightly in the share menu to locate this option.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-900/80 border border-slate-800">
                  <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold text-sm">
                    3
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-200">Confirm "Add"</p>
                    <p className="text-xs text-slate-400 mt-0.5">Ascension OS will install directly to your device home screen with full offline enclave access.</p>
                  </div>
                </div>
              </div>

              <Button 
                onClick={() => setShowIOSGuide(false)} 
                className="w-full mt-6 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-bold uppercase tracking-wider py-6"
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
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-mono mb-4">
                  <QrCode className="w-3.5 h-3.5" />
                  <span>MOBILE ENCLAVE LAUNCHER</span>
                </div>

                <h3 className="text-xl font-bold font-mono text-white mb-2 uppercase">Scan to Install on Mobile</h3>
                <p className="text-xs text-slate-400 mb-6 font-mono leading-relaxed">
                  Open your camera to deploy the full Air-Gap protocol and binaural neuro-entrainment engine on your primary smartphone.
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
                    className="flex-1 border-slate-700 bg-slate-900/60 hover:bg-slate-800 text-slate-200 font-mono text-xs py-5"
                  >
                    {copiedLink ? (
                      <>
                        <Check className="w-4 h-4 mr-1.5 text-emerald-400" />
                        URL COPIED
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4 mr-1.5 text-cyan-400" />
                        COPY DIRECT LINK
                      </>
                    )}
                  </Button>
                  <Button
                    onClick={() => setShowQRModal(false)}
                    className="bg-cyan-500 hover:bg-cyan-400 text-black font-mono font-bold text-xs py-5 px-5"
                  >
                    CLOSE
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
              <Terminal className="w-5 h-5 text-black font-black" />
            </div>
            <div>
              <span className="font-mono font-bold text-lg text-white tracking-wider">ASCENSION</span>
              <span className="font-mono text-xs text-cyan-400 ml-1.5 font-bold tracking-widest px-1.5 py-0.5 rounded bg-cyan-950/80 border border-cyan-800/60">OS v2.4</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowQRModal(true)}
              className="hidden sm:inline-flex items-center gap-1.5 text-xs font-mono text-slate-400 hover:text-cyan-400 transition-colors px-3 py-1.5 rounded-lg border border-slate-800 hover:border-cyan-500/40 bg-slate-900/50"
            >
              <QrCode className="w-3.5 h-3.5" />
              <span>Mobile QR</span>
            </button>

            <Button
              onClick={() => setView('selection')}
              variant="outline"
              size="sm"
              className="font-mono text-xs border-cyan-500/40 text-cyan-300 hover:bg-cyan-950/50"
            >
              OPERATOR LOGIN
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
              <section className="w-full max-w-6xl mx-auto px-6 pt-16 pb-20 text-center flex flex-col items-center">
                {/* HUD Pill */}
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-cyan-500/30 bg-cyan-950/40 backdrop-blur-md mb-8"
                >
                  <Cpu className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
                  <span className="text-xs font-mono font-medium text-cyan-300 tracking-wider uppercase">
                    MIL-SPEC HUMAN EXECUTION SYSTEM // ACTIVE
                  </span>
                </motion.div>

                {/* Primary Headline */}
                <motion.h1
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2, duration: 0.5 }}
                  className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-black tracking-tight mb-6 leading-[1.04]"
                >
                  <span className="block text-white">THE HUMAN</span>
                  <span className="block text-white">OPERATING SYSTEM FOR</span>
                  <span className="block bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 via-teal-300 to-indigo-400">
                    MAXIMUM EXECUTION.
                  </span>
                </motion.h1>

                {/* Cybernetic Subhead */}
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.35 }}
                  className="text-sm sm:text-base md:text-lg text-slate-400 max-w-3xl mb-10 leading-relaxed font-mono"
                >
                  Air-gapped deep work chambers. 40Hz binaural neuro-entrainment. Anti-distraction breach klaxons.
                  Peer-backed escrow covenants and Sunday judicial decrees. Stop managing habits. Start enforcing protocols.
                </motion.p>

                {/* Primary Multi-Action Funnel */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.45 }}
                  className="flex flex-col items-center justify-center gap-3 w-full max-w-xl mb-6"
                >
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full">
                    {/* Primary App Download Button */}
                    <Button
                      onClick={handleInstall}
                      size="lg"
                      className="w-full sm:w-auto flex-1 bg-cyan-500 hover:bg-cyan-400 text-black font-mono font-bold text-base py-7 px-8 rounded-xl shadow-[0_0_30px_rgba(6,182,212,0.4)] transition-all transform hover:scale-[1.02]"
                    >
                      <Download className="mr-2.5 w-5 h-5" />
                      INSTALL APP TO DEVICE
                    </Button>

                    {/* Instant Browser Access */}
                    <Button
                      onClick={() => setLocation('/account-selection')}
                      size="lg"
                      variant="outline"
                      className="w-full sm:w-auto border-slate-700 hover:border-cyan-500/50 bg-slate-900/60 hover:bg-slate-800/80 text-white font-mono font-semibold text-base py-7 px-8 rounded-xl"
                    >
                      LAUNCH WEB CONSOLE <ArrowRight className="ml-2 w-5 h-5 text-cyan-400" />
                    </Button>
                  </div>

                  {/* Zero-Auth 3-Minute Sandbox Button */}
                  <Button
                    onClick={() => {
                      audioEngine.playTactileClick();
                      setShowSandbox(true);
                    }}
                    className="w-full bg-gradient-to-r from-amber-500/15 via-cyan-500/15 to-purple-500/15 hover:from-amber-500/25 hover:via-cyan-500/25 hover:to-purple-500/25 border border-cyan-400/50 text-cyan-300 font-mono font-bold text-xs sm:text-sm py-6 rounded-xl flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(6,182,212,0.2)] transition-all transform hover:scale-[1.01]"
                  >
                    <Zap className="w-4 h-4 text-amber-400 animate-pulse" />
                    <span>TEST 3-MIN FOCUS SPRINT & OPEN FIRST COFFER (NO SIGN-UP)</span>
                    <ArrowRight className="w-4 h-4 text-cyan-400" />
                  </Button>
                </motion.div>

                {/* Sub-label indicators */}
                <div className="flex flex-wrap items-center justify-center gap-4 text-xs font-mono text-slate-500 mb-16">
                  <span className="flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-cyan-400" /> Zero installation store tax
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-cyan-400" /> 100% Offline Air-Gap sync
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-cyan-400" /> Native PWA Push support
                  </span>
                </div>

                {/* Live Protocol Soundboard Preview Card */}
                <motion.div
                  initial={{ opacity: 1, y: 0 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="w-full max-w-4xl bg-slate-900/60 border border-cyan-500/30 rounded-2xl p-6 sm:p-8 backdrop-blur-xl relative overflow-hidden text-left mb-20 shadow-[0_10px_40px_rgba(0,0,0,0.5)]"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
                    <div>
                      <div className="inline-flex items-center gap-2 text-cyan-400 text-xs font-mono tracking-widest uppercase mb-1">
                        <Volume2 className="w-4 h-4" />
                        <span>Interactive Acoustics Subsystem</span>
                      </div>
                      <h3 className="text-xl sm:text-2xl font-bold font-mono text-white">
                        Test The Neuro-Reconditioning Audio Engine
                      </h3>
                      <p className="text-xs sm:text-sm text-slate-400 mt-1 font-mono">
                        Generated locally with native Web Audio oscillators. No downloads, zero latency.
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-1 rounded bg-slate-800 text-[11px] font-mono text-slate-300 border border-slate-700">
                        LATENCY: &lt;5ms
                      </span>
                      <span className="px-2.5 py-1 rounded bg-cyan-950 text-[11px] font-mono text-cyan-300 border border-cyan-800">
                        FREQ: 40Hz GAMMA
                      </span>
                    </div>
                  </div>

                  {/* 3 Interactive Sound Triggers */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-6">
                    {/* Sound 1: 40Hz Gamma Flow */}
                    <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-mono text-cyan-400 font-bold uppercase">Neuro-Flow</span>
                          {isGammaPlaying && (
                            <span className="flex h-2 w-2 relative">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
                            </span>
                          )}
                        </div>
                        <h4 className="text-sm font-bold text-white mb-1">40Hz Binaural Beat</h4>
                        <p className="text-xs text-slate-400 mb-4 font-mono leading-relaxed">
                          210Hz Left + 250Hz Right channels. Entrains prefrontal cortex into deep focus state.
                        </p>
                      </div>

                      <Button
                        onClick={toggleGammaFlow}
                        size="sm"
                        className={`w-full font-mono text-xs font-bold ${
                          isGammaPlaying 
                            ? 'bg-cyan-500 text-black hover:bg-cyan-400' 
                            : 'bg-slate-800 hover:bg-slate-700 text-cyan-300'
                        }`}
                      >
                        {isGammaPlaying ? (
                          <>
                            <Square className="w-3.5 h-3.5 mr-1.5 fill-current" /> STOP GAMMA FLOW
                          </>
                        ) : (
                          <>
                            <Play className="w-3.5 h-3.5 mr-1.5 fill-current" /> START 40HZ FLOW
                          </>
                        )}
                      </Button>
                    </div>

                    {/* Sound 2: Breach Klaxon Siren */}
                    <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-mono text-rose-400 font-bold uppercase">Enforcer</span>
                          {isSirenTesting && (
                            <span className="text-[10px] font-mono text-rose-400 font-bold animate-pulse">ALERTING</span>
                          )}
                        </div>
                        <h4 className="text-sm font-bold text-white mb-1">Breach Klaxon Siren</h4>
                        <p className="text-xs text-slate-400 mb-4 font-mono leading-relaxed">
                          Alternating 880Hz / 660Hz sawtooth wave triggered on focus window breach or app-switching.
                        </p>
                      </div>

                      <Button
                        onClick={triggerSirenTest}
                        disabled={isSirenTesting}
                        size="sm"
                        className="w-full font-mono text-xs font-bold bg-rose-950/60 hover:bg-rose-900 border border-rose-800 text-rose-300"
                      >
                        <AlertTriangle className="w-3.5 h-3.5 mr-1.5 text-rose-400" />
                        {isSirenTesting ? "FIRING 2S BURST..." : "TEST BREACH KLAXON"}
                      </Button>
                    </div>

                    {/* Sound 3: Court Gavel Impact */}
                    <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-mono text-amber-400 font-bold uppercase">Judiciary</span>
                          <span className="text-[10px] font-mono text-slate-500">SUNDAY 20:00</span>
                        </div>
                        <h4 className="text-sm font-bold text-white mb-1">Court Gavel Decree</h4>
                        <p className="text-xs text-slate-400 mb-4 font-mono leading-relaxed">
                          Sub-120Hz resonant impact played when weekly performance covenants are audited.
                        </p>
                      </div>

                      <Button
                        onClick={triggerGavelTest}
                        size="sm"
                        className="w-full font-mono text-xs font-bold bg-amber-950/60 hover:bg-amber-900 border border-amber-800 text-amber-300"
                      >
                        <Gavel className="w-3.5 h-3.5 mr-1.5 text-amber-400" />
                        STRIKE GAVEL
                      </Button>
                    </div>
                  </div>
                </motion.div>

                {/* Escrow Covenant & Dividend Calculator */}
                <motion.div
                  initial={{ opacity: 1, y: 0 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="w-full max-w-4xl bg-slate-900/60 border border-amber-500/30 rounded-2xl p-6 sm:p-8 backdrop-blur-xl relative overflow-hidden text-left mb-24 shadow-[0_10px_40px_rgba(0,0,0,0.5)]"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
                    <div>
                      <div className="inline-flex items-center gap-2 text-amber-400 text-xs font-mono tracking-widest uppercase mb-1">
                        <Users className="w-4 h-4" />
                        <span>Squad Pact Financial Dynamics</span>
                      </div>
                      <h3 className="text-xl sm:text-2xl font-bold font-mono text-white">
                        Simulate Your Squad Escrow Dividend Yield
                      </h3>
                      <p className="text-xs sm:text-sm text-slate-400 mt-1 font-mono">
                        When undisciplined operators fail their weekly oath, 85% of their deposit is redistributed to surviving executors.
                      </p>
                    </div>

                    <div className="bg-amber-950/60 border border-amber-500/40 rounded-xl px-4 py-2.5 text-right">
                      <div className="text-[11px] font-mono text-amber-300 uppercase">Estimated Payout</div>
                      <div className="text-2xl font-mono font-bold text-amber-400">
                        ${totalPayout.toFixed(0)} <span className="text-xs text-amber-300">({roiPercentage >= 0 ? `+${roiPercentage}%` : ''})</span>
                      </div>
                    </div>
                  </div>

                  {/* Calculator Sliders & Output */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6">
                    {/* Stake Slider */}
                    <div>
                      <div className="flex justify-between text-xs font-mono mb-2">
                        <span className="text-slate-400">YOUR ESCROW STAKE:</span>
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
                      <span className="text-[11px] font-mono text-slate-500 mt-1 block">$50 to $1,000 weekly pledge</span>
                    </div>

                    {/* Squad Size Slider */}
                    <div>
                      <div className="flex justify-between text-xs font-mono mb-2">
                        <span className="text-slate-400">SQUAD OPERATORS:</span>
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
                      <span className="text-[11px] font-mono text-slate-500 mt-1 block">Tactical peer circle size</span>
                    </div>

                    {/* Failed Operators Slider */}
                    <div>
                      <div className="flex justify-between text-xs font-mono mb-2">
                        <span className="text-slate-400">FAILED OPERATORS:</span>
                        <span className="text-rose-400 font-bold">{failedMembers} failed</span>
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
                      <span className="text-[11px] font-mono text-slate-500 mt-1 block">
                        Capital forfeited: ${forfeitedCapital}
                      </span>
                    </div>
                  </div>

                  <div className="mt-6 p-4 rounded-xl bg-slate-950/80 border border-slate-800 text-xs font-mono text-slate-400 flex items-center justify-between">
                    <div>
                      <span className="text-white font-bold">DISCIPLINE BOUNTY FORMULA:</span> You recover your initial <span className="text-cyan-300 font-bold">${squadStake}</span> deposit plus <span className="text-emerald-400 font-bold">+${bountyPerSurvivor.toFixed(1)}</span> dividend extracted from non-compliant peers.
                    </div>
                    <Button
                      onClick={() => setLocation('/account-selection')}
                      size="sm"
                      className="hidden sm:inline-flex bg-amber-500 hover:bg-amber-400 text-black font-mono font-bold text-xs"
                    >
                      ENTER ESCROW PACT
                    </Button>
                  </div>
                </motion.div>

                {/* The 4 Mil-Spec Pillars Showcase */}
                <section className="w-full max-w-6xl mx-auto mb-20 text-left">
                  <div className="text-center mb-12">
                    <span className="text-xs font-mono text-cyan-400 tracking-widest uppercase">OPERATIONAL ARCHITECTURE</span>
                    <h2 className="text-3xl sm:text-4xl font-bold font-mono text-white mt-2">
                      The 4 Pillars of Ascension Protocol
                    </h2>
                    <p className="text-slate-400 text-sm font-mono mt-2 max-w-xl mx-auto">
                      Engineered to eliminate decision fatigue, enforce focused deep work, and audit execution integrity.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Pillar I */}
                    <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800 hover:border-cyan-500/40 transition-all">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-mono font-bold text-lg">
                          01
                        </div>
                        <div>
                          <h3 className="text-lg font-bold font-mono text-white">Morning Briefing & Mission Oath</h3>
                          <span className="text-xs font-mono text-cyan-400">Pillar I // Intention Locking</span>
                        </div>
                      </div>
                      <p className="text-slate-400 text-xs sm:text-sm font-mono leading-relaxed mb-4">
                        Lock in 3 Non-Negotiable Directives before opening communications. Seal the digital oath with biometric confirmation.
                      </p>
                      <div className="flex items-center gap-2 text-xs font-mono text-slate-500">
                        <Check className="w-4 h-4 text-cyan-400" /> Directive Priority Weighting
                        <span className="mx-1">•</span>
                        <Check className="w-4 h-4 text-cyan-400" /> Anti-Procrastination Calibration
                      </div>
                    </div>

                    {/* Pillar II */}
                    <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800 hover:border-cyan-500/40 transition-all">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center font-mono font-bold text-lg">
                          02
                        </div>
                        <div>
                          <h3 className="text-lg font-bold font-mono text-white">Air-Gap Chamber & Klaxon Enforcer</h3>
                          <span className="text-xs font-mono text-rose-400">Pillar II // Cognitive Isolation</span>
                        </div>
                      </div>
                      <p className="text-slate-400 text-xs sm:text-sm font-mono leading-relaxed mb-4">
                        Full-screen lockdown with 40Hz Gamma flow audio. Tab switches and attention breaches trigger a piercing 880Hz klaxon countdown.
                      </p>
                      <div className="flex items-center gap-2 text-xs font-mono text-slate-500">
                        <Check className="w-4 h-4 text-rose-400" /> 100% Offline Enclave Sync
                        <span className="mx-1">•</span>
                        <Check className="w-4 h-4 text-rose-400" /> Focus Density Telemetry
                      </div>
                    </div>

                    {/* Pillar III */}
                    <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800 hover:border-cyan-500/40 transition-all">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-mono font-bold text-lg">
                          03
                        </div>
                        <div>
                          <h3 className="text-lg font-bold font-mono text-white">AI Chief of Staff</h3>
                          <span className="text-xs font-mono text-indigo-400">Pillar III // Adaptive Strategy</span>
                        </div>
                      </div>
                      <p className="text-slate-400 text-xs sm:text-sm font-mono leading-relaxed mb-4">
                        Conducts mid-day strategic pulse checks and evening debriefs. Detects cognitive friction, rebalances directives, and verifies proof-of-work.
                      </p>
                      <div className="flex items-center gap-2 text-xs font-mono text-slate-500">
                        <Check className="w-4 h-4 text-indigo-400" /> Friction Root Cause Analysis
                        <span className="mx-1">•</span>
                        <Check className="w-4 h-4 text-indigo-400" /> Daily Execution Velocity
                      </div>
                    </div>

                    {/* Pillar IV */}
                    <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800 hover:border-cyan-500/40 transition-all">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-mono font-bold text-lg">
                          04
                        </div>
                        <div>
                          <h3 className="text-lg font-bold font-mono text-white">Sunday Performance Court & Vaults</h3>
                          <span className="text-xs font-mono text-amber-400">Pillar IV // Consequence System</span>
                        </div>
                      </div>
                      <p className="text-slate-400 text-xs sm:text-sm font-mono leading-relaxed mb-4">
                        Automated weekly judicial tribunal. Evaluates 7-day compliance. Releases escrow bounties or executes public forfeitures.
                      </p>
                      <div className="flex items-center gap-2 text-xs font-mono text-slate-500">
                        <Check className="w-4 h-4 text-amber-400" /> Escrow Financial Covenants
                        <span className="mx-1">•</span>
                        <Check className="w-4 h-4 text-amber-400" /> Hall of Consequence decrees
                      </div>
                    </div>
                  </div>
                </section>

                {/* Final Pre-Footer Call to Action */}
                <div className="w-full max-w-4xl p-8 sm:p-12 rounded-3xl bg-gradient-to-br from-cyan-950/60 to-slate-900 border border-cyan-500/40 text-center relative overflow-hidden mb-12">
                  <div className="relative z-10">
                    <h2 className="text-2xl sm:text-4xl font-bold font-mono text-white mb-4">
                      Ready to Enforce Your Potential?
                    </h2>
                    <p className="text-slate-300 text-sm sm:text-base font-mono max-w-xl mx-auto mb-8">
                      Ascension Protocol runs on any device. Install the progressive web application to operate without distraction.
                    </p>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                      <Button
                        onClick={handleInstall}
                        size="lg"
                        className="w-full sm:w-auto bg-cyan-500 hover:bg-cyan-400 text-black font-mono font-bold text-base py-6 px-8 rounded-xl shadow-[0_0_25px_rgba(6,182,212,0.4)]"
                      >
                        <Download className="mr-2 w-5 h-5" />
                        INSTALL APP NOW
                      </Button>
                      <Button
                        onClick={() => setView('selection')}
                        size="lg"
                        variant="outline"
                        className="w-full sm:w-auto border-slate-700 bg-slate-900/60 hover:bg-slate-800 text-slate-200 font-mono text-base py-6 px-8 rounded-xl"
                      >
                        LAUNCH WEB CONSOLE
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <footer className="w-full text-center pb-8 pt-4 text-xs font-mono text-slate-500 border-t border-slate-900/80">
                  <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 mb-3">
                    <button
                      onClick={() => setLocation('/privacy')}
                      className="hover:text-cyan-400 transition-colors cursor-pointer"
                    >
                      PRIVACY POLICY
                    </button>
                    <span>•</span>
                    <button
                      onClick={() => setLocation('/terms')}
                      className="hover:text-cyan-400 transition-colors cursor-pointer"
                    >
                      TERMS OF SERVICE
                    </button>
                    <span>•</span>
                    <button
                      onClick={() => setLocation('/contact')}
                      className="hover:text-cyan-400 transition-colors cursor-pointer"
                    >
                      CONTACT DESK
                    </button>
                  </div>
                  <p className="text-slate-600">© {new Date().getFullYear()} ASCENSION OS // MIL-SPEC HUMAN PROTOCOL. ALL RIGHTS RESERVED.</p>
                </footer>
              </section>
            </motion.div>
          )}

          {/* ============ SELECTION VIEW ============ */}
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
                <span className="text-xs font-mono text-cyan-400 tracking-widest uppercase">SECURITY CLEARANCE</span>
                <h2 className="text-3xl sm:text-4xl font-bold font-mono text-white mt-1">Select Access Vector</h2>
                <p className="text-slate-400 text-xs sm:text-sm font-mono mt-2">Choose your operator authorization profile</p>
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
                    <h3 className="text-xl font-bold font-mono text-white">Operator Console</h3>
                    <p className="text-slate-400 text-xs font-mono leading-relaxed">
                      Access your mission command center, 40Hz air-gap focus chamber, and squad covenants.
                    </p>
                    <span className="text-cyan-400 text-xs font-mono font-bold flex items-center gap-1 mt-2">
                      AUTHORIZE ACCESS <ArrowRight className="w-4 h-4" />
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
                    <h3 className="text-xl font-bold font-mono text-white">Command Authority</h3>
                    <p className="text-slate-400 text-xs font-mono leading-relaxed">
                      System diagnostics, court tribunal audit logging, and protocol telemetric oversight.
                    </p>
                    <span className="text-amber-400 text-xs font-mono font-bold flex items-center gap-1 mt-2">
                      COMMAND KEY LOGIN <Lock className="w-4 h-4" />
                    </span>
                  </div>
                </motion.div>
              </div>

              <button
                onClick={() => setView('hero')}
                className="mt-10 text-xs font-mono text-slate-500 hover:text-cyan-400 transition-colors"
              >
                ← RETURN TO PUBLIC SHOWCASE
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
                  <CardTitle className="text-xl font-mono text-white">Command Security Gate</CardTitle>
                  <CardDescription className="text-xs font-mono text-slate-400">
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
                      className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono text-sm placeholder:text-slate-600 focus:outline-none focus:border-cyan-500 transition-all"
                      autoFocus
                    />
                    {adminError && (
                      <p className="text-xs font-mono text-rose-400 flex items-center gap-1.5">
                        <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" /> {adminError}
                      </p>
                    )}
                    <Button 
                      type="submit" 
                      className="w-full bg-cyan-500 hover:bg-cyan-400 text-black font-mono font-bold text-xs uppercase py-5 rounded-xl"
                    >
                      AUTHENTICATE
                    </Button>
                    <div className="text-center pt-2">
                      <button 
                        type="button" 
                        onClick={() => setView('selection')} 
                        className="text-xs font-mono text-slate-500 hover:text-slate-300 transition-colors"
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
                className="w-full bg-cyan-500 hover:bg-cyan-400 text-black font-mono font-bold rounded-xl py-6 text-sm shadow-[0_0_20px_rgba(6,182,212,0.3)]"
              >
                ENTER PROTOCOL CONSOLE <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button
                  onClick={handleInstall}
                  className="flex-1 bg-cyan-500 hover:bg-cyan-400 text-black font-mono font-bold rounded-xl py-6 text-xs uppercase shadow-[0_0_20px_rgba(6,182,212,0.3)]"
                >
                  <Download className="mr-1.5 w-4 h-4" />
                  INSTALL APP
                </Button>
                <Button
                  onClick={() => setView('selection')}
                  variant="outline"
                  className="border-slate-700 bg-slate-900 text-white font-mono text-xs rounded-xl py-6 px-4"
                >
                  LOGIN
                </Button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Zero-Auth 3-Minute Instant Focus Sandbox Modal */}
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
