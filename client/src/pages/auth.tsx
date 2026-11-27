import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { 
  AlertCircle, ArrowRight, Shield, Lock, Download, 
  Smartphone, Zap, QrCode, Copy, Check, Terminal, Users, 
  Trophy, Flame, Sword, Sparkles, Activity, Layers, 
  Target, Award, ChevronRight, CheckCircle2, Compass, Brain, Crown
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { usePWAInstall } from "@/hooks/usePWAInstall";
import { Capacitor } from "@capacitor/core";
import { hapticTap, hapticSuccess } from "@/lib/haptics";

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

// Helper to render vector icon for archetypes (no emojis)
function renderArchetypeIcon(key: string, className: string = "w-5 h-5") {
  switch (key) {
    case "zap": return <Zap className={className} />;
    case "shield": return <Shield className={className} />;
    case "compass": return <Compass className={className} />;
    case "brain": return <Brain className={className} />;
    case "crown": return <Crown className={className} />;
    default: return <Sword className={className} />;
  }
}

// Hunter Class Archetypes Metadata (Clean SVG Icons)
const HUNTER_ARCHETYPES = [
  {
    name: "Shadow Assassin",
    iconKey: "zap",
    focus: "Calisthenics & Speed",
    stat: "AGILITY & DISCIPLINE",
    description: "Bodyweight mastery, explosive plyometrics, sprint intervals, and high-cadence mobility drills.",
    color: "border-cyan-500/40 text-cyan-400 bg-cyan-950/20",
  },
  {
    name: "Iron Tank",
    iconKey: "shield",
    focus: "Hypertrophy & Power",
    stat: "STRENGTH & VITALITY",
    description: "Heavy compound resistance, progressive overload, physical density, and high-intensity lifting.",
    color: "border-blue-500/40 text-blue-400 bg-blue-950/20",
  },
  {
    name: "Phantom Ranger",
    iconKey: "compass",
    focus: "Cardio & VO2 Endurance",
    stat: "STAMINA & PACE",
    description: "Long-distance pacing, zone-2 metabolic stamina, threshold intervals, and continuous grit.",
    color: "border-emerald-500/40 text-emerald-400 bg-emerald-950/20",
  },
  {
    name: "Void Scholar",
    iconKey: "brain",
    focus: "Deep Cognitive Focus",
    stat: "INTELLECT & WILLPOWER",
    description: "Unbroken deep work sessions, deliberate learning, strategic planning, and cognitive endurance.",
    color: "border-purple-500/40 text-purple-400 bg-purple-950/20",
  },
  {
    name: "Shadow Monarch",
    iconKey: "crown",
    focus: "Hybrid Mastery",
    stat: "ALL ATTRIBUTES",
    description: "The balanced sovereign archetype. Uniting physical strength, cognitive discipline, and peak leadership.",
    color: "border-amber-500/40 text-amber-400 bg-amber-950/20",
  },
];

// Progression Tiers Matrix
const PROGRESSION_TIERS = [
  {
    rank: "E-Rank",
    title: "Initiate",
    requirement: "Level 1 – 5",
    color: "text-zinc-400 border-zinc-700 bg-zinc-900/40",
    badge: "Awakened",
    desc: "Baseline calibration. Establishes the 3 daily priorities and foundational habit consistency.",
  },
  {
    rank: "D-Rank",
    title: "Apprentice",
    requirement: "Level 6 – 15",
    color: "text-emerald-400 border-emerald-500/30 bg-emerald-950/20",
    badge: "Streak Active",
    desc: "Sustained momentum. Unbroken 7-day streaks, active recovery management, and calibrated workouts.",
  },
  {
    rank: "C-Rank",
    title: "Operator",
    requirement: "Level 16 – 30",
    color: "text-cyan-400 border-cyan-500/30 bg-cyan-950/20",
    badge: "Calibrated",
    desc: "Progressive overload. High-density deep work sprints and physical volume scaling.",
  },
  {
    rank: "B-Rank",
    title: "Veteran",
    requirement: "Level 31 – 50",
    color: "text-blue-400 border-blue-500/30 bg-blue-950/20",
    badge: "Elite Executor",
    desc: "Advanced attribute distribution. Squad commitment leadership and zero-deviation consistency.",
  },
  {
    rank: "A-Rank",
    title: "Master",
    requirement: "Level 51 – 75",
    color: "text-purple-400 border-purple-500/30 bg-purple-950/20",
    badge: "Top 5%",
    desc: "Sovereign execution across both mental and physical domains. 30+ day unbroken execution records.",
  },
  {
    rank: "S-Rank",
    title: "Monarch",
    requirement: "Level 76+",
    color: "text-amber-400 border-amber-500/40 bg-amber-950/20 shadow-[0_0_20px_rgba(245,158,11,0.15)]",
    badge: "Apex Tier",
    desc: "The pinnacle of self-mastery. Top 1% of disciplined Hunters.",
  },
];

export default function AuthPage() {
  const { user, loading } = useAuth();
  const [, setLocation] = useLocation();
  const [view, setView] = useState<'hero' | 'selection'>('hero');
  const { isInstallable, promptInstall } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window === "undefined") return false;
    return Capacitor.isNativePlatform() || window.innerWidth < 768;
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    const handleResize = () => {
      setIsMobile(Capacitor.isNativePlatform() || window.innerWidth < 768);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Selected Hunter Archetype in visual showcase
  const [activeArchetypeIndex, setActiveArchetypeIndex] = useState(0);
  // Active feature slide in native mobile onboarding (0: Hunter Stats, 1: 40Hz Chamber, 2: Directives, 3: Squad Escrow)
  const [activeSlide, setActiveSlide] = useState(0);

  useEffect(() => {
    if (!isMobile || view !== 'hero') return;
    const timer = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % 4);
    }, 6000);
    return () => clearInterval(timer);
  }, [isMobile, view]);

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

  const handleInstall = () => {
    if (isInstallable) {
      promptInstall();
    } else if (ios) {
      setShowIOSGuide(true);
    } else {
      setLocation('/download');
    }
  };

  const copyAppUrl = () => {
    const url = window.location.origin;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#020617] text-white">
        <div className="text-center font-sans">
          <div className="h-10 w-10 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-cyan-400 text-sm font-medium tracking-wide">Loading Ascension Protocol...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-[#020617] text-slate-100 font-sans selection:bg-cyan-500 selection:text-black overflow-x-hidden">

      {/* Subtle Background Glows (Low-Stimulation) */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a15_1px,transparent_1px),linear-gradient(to_bottom,#0f172a15_1px,transparent_1px)] bg-[size:4rem_4rem]" />
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute bottom-1/3 right-1/4 w-[32rem] h-[32rem] bg-indigo-500/10 rounded-full blur-[160px] pointer-events-none" />
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
                Add Ascension Protocol to your home screen for full offline access and clean full-screen performance.
              </p>
              
              <div className="space-y-3 text-sm">
                <div className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-900/80 border border-slate-800">
                  <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold text-xs">
                    1
                  </div>
                  <div>
                    <p className="font-semibold text-slate-200">Tap the Safari Share Button</p>
                    <p className="text-xs text-slate-400 mt-0.5">Located at the bottom of Safari (the square icon with an arrow pointing up).</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-900/80 border border-slate-800">
                  <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold text-xs">
                    2
                  </div>
                  <div>
                    <p className="font-semibold text-slate-200">Select "Add to Home Screen"</p>
                    <p className="text-xs text-slate-400 mt-0.5">Scroll down slightly in the share menu and tap "Add to Home Screen".</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-900/80 border border-slate-800">
                  <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold text-xs">
                    3
                  </div>
                  <div>
                    <p className="font-semibold text-slate-200">Confirm "Add"</p>
                    <p className="text-xs text-slate-400 mt-0.5">The app icon installs directly to your home screen with zero browser bars.</p>
                  </div>
                </div>
              </div>

              <Button 
                onClick={() => setShowIOSGuide(false)} 
                className="w-full mt-6 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-semibold tracking-wide py-5"
              >
                Understood, Proceed
              </Button>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* QR modal removed — direct GitHub Release download via /download */}

      {/* ============ NATIVE MOBILE WELCOME VIEW ============ */}
      {isMobile && view === 'hero' && (
        <div className="min-h-[100dvh] bg-[#020617] text-white flex flex-col justify-between overflow-x-hidden relative px-4 pt-[max(0.6rem,env(safe-area-inset-top))] pb-[max(0.9rem,env(safe-area-inset-bottom))] font-sans select-none">
          {/* Subtle Ambient Background Aura */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[340px] h-[340px] bg-gradient-to-b from-cyan-500/20 via-indigo-600/10 to-transparent blur-3xl pointer-events-none" />

          {/* Top Native Header */}
          <header className="relative z-10 flex items-center justify-between py-1 px-1">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl overflow-hidden border border-cyan-400/40 shadow-md shadow-cyan-500/20 bg-slate-900 flex-shrink-0">
                <img src="/pwa-192x192.png" alt="Ascension Crest" className="w-full h-full object-cover" />
              </div>
              <div>
                <span className="font-black text-sm text-white tracking-tight block leading-none">Ascension Protocol</span>
                <span className="text-[9px] text-cyan-400/90 font-mono tracking-wider uppercase block mt-0.5">Self-Leveling System</span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-cyan-950/80 border border-cyan-500/40 text-[10px] font-mono text-cyan-300">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
              <span>LIVE v2.4</span>
            </div>
          </header>

          {/* Main Mobile Body: Hero Branding + Interactive Carousel Unified */}
          <div className="relative z-10 flex-1 flex flex-col justify-center py-1 space-y-2.5">
            {/* Hero Branding Section with Official Project Logo */}
            <div className="flex flex-col items-center text-center pt-0.5">
              <div className="relative my-0.5 w-20 h-20 rounded-2xl p-1 bg-gradient-to-b from-cyan-400/30 via-slate-900 to-black border border-cyan-400/50 shadow-[0_0_35px_rgba(6,182,212,0.35)] flex items-center justify-center">
                <img
                  src="/pwa-192x192.png"
                  alt="Ascension Protocol Official Logo"
                  className="w-full h-full object-cover rounded-xl"
                />
                <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-cyan-500 border-2 border-slate-950 flex items-center justify-center shadow-sm">
                  <Sparkles className="w-2.5 h-2.5 text-black" />
                </div>
              </div>

              <h1 className="text-xl font-black text-white tracking-tight leading-tight mt-1">
                ASCENSION PROTOCOL
              </h1>
              <p className="text-[11px] font-mono text-cyan-400/90 tracking-wide uppercase">
                The Sovereign Self-Leveling Operating System
              </p>
            </div>

            {/* Interactive Feature Carousel Container */}
            <div className="flex flex-col">
              {/* Feature Tabs Selector */}
              <div className="grid grid-cols-4 gap-1 mb-2 bg-slate-950/70 p-1 rounded-xl border border-slate-800/80">
              {[
                { label: "Stats", icon: Activity },
                { label: "40Hz", icon: Zap },
                { label: "Quests", icon: Target },
                { label: "Squad", icon: Users },
              ].map((tab, idx) => {
                const TabIcon = tab.icon;
                const isActive = activeSlide === idx;
                return (
                  <button
                    key={tab.label}
                    onClick={() => {
                      hapticTap();
                      setActiveSlide(idx);
                    }}
                    className={`py-1.5 px-1 rounded-lg text-[10px] font-mono font-bold flex items-center justify-center gap-1 transition-all cursor-pointer ${
                      isActive
                        ? "bg-cyan-500/20 text-cyan-300 border border-cyan-400/60 shadow-[0_0_12px_rgba(6,182,212,0.25)]"
                        : "text-slate-400 hover:text-slate-200 border border-transparent"
                    }`}
                  >
                    <TabIcon className="w-3 h-3" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Dynamic Feature Slide Card */}
            <motion.div
              key={activeSlide}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="p-3.5 rounded-2xl bg-gradient-to-b from-slate-900/95 via-slate-950 to-[#020617] border border-cyan-500/40 shadow-[0_0_30px_rgba(6,182,212,0.15)] backdrop-blur-xl"
            >
              {/* Slide 0: RPG Attributes & Archetypes */}
              {activeSlide === 0 && (
                <div>
                  <div className="flex items-center justify-between mb-2 border-b border-cyan-500/20 pb-1.5">
                    <span className="text-[11px] font-mono text-cyan-400 font-bold uppercase tracking-wider flex items-center gap-1">
                      <Sparkles className="w-3 h-3" />
                      <span>[ RPG ATTRIBUTE CALIBRATION ]</span>
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">Rank E → S</span>
                  </div>
                  <p className="text-[11px] text-slate-300 leading-relaxed mb-2.5">
                    Converts physical volume, deep work sprints, and unbroken habits into real hunter attributes.
                  </p>

                  <div className="grid grid-cols-2 gap-1.5 mb-2.5">
                    <div className="p-2 rounded-lg bg-slate-950/80 border border-slate-800 flex items-center justify-between">
                      <span className="text-[10px] font-bold text-red-400 font-mono">STR (Power)</span>
                      <span className="text-[11px] font-mono font-bold text-white">+45</span>
                    </div>
                    <div className="p-2 rounded-lg bg-slate-950/80 border border-slate-800 flex items-center justify-between">
                      <span className="text-[10px] font-bold text-cyan-400 font-mono">AGI (Speed)</span>
                      <span className="text-[11px] font-mono font-bold text-white">+38</span>
                    </div>
                    <div className="p-2 rounded-lg bg-slate-950/80 border border-slate-800 flex items-center justify-between">
                      <span className="text-[10px] font-bold text-purple-400 font-mono">INT (Focus)</span>
                      <span className="text-[11px] font-mono font-bold text-white">+52</span>
                    </div>
                    <div className="p-2 rounded-lg bg-slate-950/80 border border-slate-800 flex items-center justify-between">
                      <span className="text-[10px] font-bold text-emerald-400 font-mono">VIT (Shields)</span>
                      <span className="text-[11px] font-mono font-bold text-white">+40</span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="text-[10px] font-medium text-slate-400 flex justify-between">
                      <span>Hunter Discipline:</span>
                      <span className="text-cyan-400 font-semibold">{HUNTER_ARCHETYPES[activeArchetypeIndex].name}</span>
                    </div>
                    <div className="grid grid-cols-5 gap-1">
                      {HUNTER_ARCHETYPES.map((arch, idx) => (
                        <button
                          key={arch.name}
                          onClick={() => { hapticTap(); setActiveArchetypeIndex(idx); }}
                          className={`py-1.5 rounded-lg border flex flex-col items-center justify-center transition-all cursor-pointer ${
                            activeArchetypeIndex === idx
                              ? "bg-cyan-500/20 border-cyan-400 text-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.3)]"
                              : "bg-slate-950/60 border-slate-800 text-slate-500 hover:text-slate-300"
                          }`}
                        >
                          {renderArchetypeIcon(arch.iconKey, "w-3.5 h-3.5 mb-0.5")}
                          <span className="text-[8px] font-bold truncate max-w-full px-0.5">
                            {arch.name.split(" ")[1] || arch.name}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Slide 1: 40Hz Air-Gap Focus Chamber */}
              {activeSlide === 1 && (
                <div>
                  <div className="flex items-center justify-between mb-2 border-b border-cyan-500/20 pb-1.5">
                    <span className="text-[11px] font-mono text-cyan-400 font-bold uppercase tracking-wider flex items-center gap-1">
                      <Zap className="w-3 h-3" />
                      <span>[ 40Hz AIR-GAP FOCUS CHAMBER ]</span>
                    </span>
                    <span className="text-[10px] font-mono text-emerald-400">ENCLAVE ACTIVE</span>
                  </div>
                  <p className="text-[11px] text-slate-300 leading-relaxed mb-2.5">
                    Gamma binaural acoustic isolation designed to eradicate digital distraction and force uninterrupted deep execution.
                  </p>

                  <div className="p-3 rounded-xl bg-slate-950/90 border border-slate-800/80 mb-2">
                    <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 mb-2">
                      <span>Binaural Frequency:</span>
                      <span className="text-cyan-400 font-bold">40Hz Pure Gamma</span>
                    </div>
                    <div className="flex items-end justify-center gap-1.5 h-12 bg-black/60 rounded-lg p-2 border border-cyan-500/20">
                      {[40, 75, 55, 95, 65, 85, 45, 90, 60, 80, 50].map((h, i) => (
                        <div
                          key={i}
                          style={{ height: `${h}%` }}
                          className="w-1.5 bg-gradient-to-t from-cyan-600 to-cyan-300 rounded-full animate-pulse"
                        />
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-1.5">
                    <div className="p-2 rounded-lg bg-slate-950/70 border border-slate-800 text-center">
                      <div className="text-[11px] font-bold text-white font-mono">0-Tab Lock</div>
                      <div className="text-[9px] text-slate-400 mt-0.5">Zero Distractions</div>
                    </div>
                    <div className="p-2 rounded-lg bg-slate-950/70 border border-slate-800 text-center">
                      <div className="text-[11px] font-bold text-cyan-400 font-mono">99.4% Flow</div>
                      <div className="text-[9px] text-slate-400 mt-0.5">Execution Efficiency</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Slide 2: Autonomous Hunter Directives */}
              {activeSlide === 2 && (
                <div>
                  <div className="flex items-center justify-between mb-2 border-b border-cyan-500/20 pb-1.5">
                    <span className="text-[11px] font-mono text-cyan-400 font-bold uppercase tracking-wider flex items-center gap-1">
                      <Target className="w-3 h-3" />
                      <span>[ DAILY SYSTEM DIRECTIVES ]</span>
                    </span>
                    <span className="text-[10px] font-mono text-amber-400">EXPIRING 23:59</span>
                  </div>
                  <p className="text-[11px] text-slate-300 leading-relaxed mb-2.5">
                    Autonomous missions tailored dynamically to your equipment profile, physical readiness, and rank requirements.
                  </p>

                  <div className="p-3 rounded-xl bg-slate-950/90 border border-cyan-500/30 mb-2 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono text-slate-400">Directive #084</span>
                      <span className="text-[10px] font-mono font-bold text-emerald-400">+150 XP</span>
                    </div>
                    <div className="text-xs font-bold text-white">5km Zone-2 Pace + 4h Deep Work Sprint</div>
                    <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-gradient-to-r from-cyan-500 to-indigo-500 h-full w-3/4 rounded-full" />
                    </div>
                    <div className="flex justify-between text-[9px] font-mono text-slate-400">
                      <span>Progress: 75% Completed</span>
                      <span className="text-cyan-400">Rank Trial Pending</span>
                    </div>
                  </div>

                  <div className="p-2 rounded-lg bg-slate-950/70 border border-slate-800 flex items-center justify-between text-[10px]">
                    <span className="text-slate-300">Failure Consequence:</span>
                    <span className="text-red-400 font-mono font-bold">XP Penalty & Streak Reset</span>
                  </div>
                </div>
              )}

              {/* Slide 3: Peer Escrow & Squad Pacts */}
              {activeSlide === 3 && (
                <div>
                  <div className="flex items-center justify-between mb-2 border-b border-cyan-500/20 pb-1.5">
                    <span className="text-[11px] font-mono text-cyan-400 font-bold uppercase tracking-wider flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      <span>[ PEER ESCROW & SQUAD PACTS ]</span>
                    </span>
                    <span className="text-[10px] font-mono text-indigo-400">ESCROW ACTIVE</span>
                  </div>
                  <p className="text-[11px] text-slate-300 leading-relaxed mb-2.5">
                    High-stakes accountability contracts. Commit alongside verified hunters with cryptographic proof of execution.
                  </p>

                  <div className="p-3 rounded-xl bg-slate-950/90 border border-slate-800/80 mb-2 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white">Apex Squad #04</span>
                      <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/50 px-2 py-0.5 rounded-full border border-emerald-500/30">100% Verified</span>
                    </div>
                    <div className="grid grid-cols-2 gap-1.5 text-center">
                      <div className="p-1.5 rounded bg-slate-900 border border-slate-800">
                        <div className="text-[11px] font-bold text-white font-mono">Top 2</div>
                        <div className="text-[8px] text-slate-400">Rival Division</div>
                      </div>
                      <div className="p-1.5 rounded bg-slate-900 border border-slate-800">
                        <div className="text-[11px] font-bold text-cyan-400 font-mono">30-Day</div>
                        <div className="text-[8px] text-slate-400">Zero-Deviation Streak</div>
                      </div>
                    </div>
                  </div>

                  <div className="p-2 rounded-lg bg-slate-950/70 border border-slate-800 flex items-center justify-between text-[10px]">
                    <span className="text-slate-300">Accountability Type:</span>
                    <span className="text-cyan-400 font-mono font-bold">Escrow Verification</span>
                  </div>
                </div>
              )}
            </motion.div>

            {/* Pagination Indicator Dots (Sleek Slim Native Pills) */}
            <div className="flex items-center justify-center gap-2 mt-2.5">
              {[0, 1, 2, 3].map((dot) => (
                <div
                  key={dot}
                  role="button"
                  tabIndex={0}
                  onClick={() => {
                    hapticTap();
                    setActiveSlide(dot);
                  }}
                  className={`h-1.5 rounded-full transition-all cursor-pointer ${
                    activeSlide === dot ? "w-7 bg-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.7)]" : "w-2 bg-slate-700 hover:bg-slate-500"
                  }`}
                />
              ))}
            </div>
          </div>
          </div>

          {/* Bottom Native Action Buttons */}
          <div className="relative z-10 space-y-2 pt-1">
            <Button
              onClick={() => {
                hapticSuccess();
                setLocation('/account-selection');
              }}
              className="w-full bg-cyan-500 hover:bg-cyan-400 text-black font-extrabold text-sm h-13 rounded-2xl shadow-[0_0_25px_rgba(6,182,212,0.4)] flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98] transition-transform"
            >
              <span>AWAKEN YOUR SYSTEM</span>
              <ArrowRight className="w-4 h-4" />
            </Button>

            <Button
              onClick={() => {
                hapticTap();
                setLocation('/login');
              }}
              variant="outline"
              className="w-full border-slate-800 bg-slate-900/80 hover:bg-slate-800 text-slate-200 font-semibold text-xs h-11 rounded-xl cursor-pointer active:scale-[0.98] transition-transform"
            >
              <span>I Already Have an Account (Sign In)</span>
            </Button>

            {/* Discreet Legal & Support Links */}
            <div className="flex items-center justify-center gap-3 text-[10px] text-slate-500 pt-0.5">
              <button onClick={() => setLocation('/about')} className="hover:text-cyan-400">About</button>
              <span>•</span>
              <button onClick={() => setLocation('/contact')} className="hover:text-cyan-400">Contact</button>
              <span>•</span>
              <button onClick={() => setLocation('/privacy')} className="hover:text-cyan-400">Privacy</button>
              <span>•</span>
              <button onClick={() => setLocation('/terms')} className="hover:text-cyan-400">Terms</button>
            </div>
          </div>
        </div>
      )}

      {/* ============ DESKTOP WEB VIEW ============ */}
      {(!isMobile || view !== 'hero') && (
        <>
      {/* Clean Top Navigation Bar */}
      <header className="relative z-30 border-b border-slate-800/80 bg-[#020617]/90 backdrop-blur-md px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 border border-cyan-400/40">
              <Sword className="w-5 h-5 text-black font-bold" />
            </div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg text-white tracking-tight">Ascension Protocol</span>
              <span className="text-xs text-cyan-400 font-medium px-2 py-0.5 rounded-full bg-cyan-950/80 border border-cyan-800/60 hidden sm:inline-block">The System</span>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={() => setLocation('/about')}
              className="hidden md:inline-flex items-center text-xs text-slate-300 hover:text-cyan-400 transition-colors px-3 py-1.5"
            >
              About
            </button>

            <button
              onClick={() => setLocation('/download')}
              className="hidden sm:inline-flex items-center gap-1.5 text-xs text-slate-300 hover:text-cyan-400 transition-colors px-3 py-1.5 rounded-lg border border-slate-800 hover:border-cyan-500/40 bg-slate-900/50"
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Mobile App</span>
            </button>

            <button
              onClick={() => setLocation('/contact')}
              className="hidden md:inline-flex items-center text-xs text-slate-300 hover:text-cyan-400 transition-colors px-3 py-1.5"
            >
              Contact
            </button>

            <Button
              onClick={() => setLocation('/login')}
              size="sm"
              variant="outline"
              className="border-slate-700 bg-slate-900/60 hover:bg-slate-800 text-slate-200 text-xs px-3 h-9 rounded-lg"
            >
              Sign In
            </Button>

            <Button
              onClick={() => setLocation('/account-selection')}
              size="sm"
              className="bg-cyan-500 hover:bg-cyan-400 text-black font-semibold text-xs px-4 h-9 rounded-lg shadow-[0_0_15px_rgba(6,182,212,0.3)]"
            >
              Awaken Your Rank
            </Button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="relative z-10 overflow-y-auto overflow-x-hidden" style={{ paddingBottom: standalone ? '0' : '88px' }}>
        <AnimatePresence mode="wait">

          {/* ============ HERO & SYSTEM SHOWCASE VIEW ============ */}
          {view === 'hero' && (
            <motion.div
              key="hero"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              {/* HERO SECTION */}
              <section className="w-full max-w-6xl mx-auto px-6 pt-16 sm:pt-24 pb-20 text-center flex flex-col items-center">
                {/* Eyebrow Pill */}
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-cyan-500/30 bg-cyan-950/40 backdrop-blur-md mb-8"
                >
                  <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                  <span className="text-xs font-semibold text-cyan-300 tracking-wide uppercase">
                    Personal Progression & Hunter Rank System
                  </span>
                </motion.div>

                {/* Primary Headline */}
                <motion.h1
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2, duration: 0.5 }}
                  className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight mb-6 leading-[1.08] max-w-5xl"
                >
                  <span className="text-white">A Real-Life Leveling System </span>
                  <span className="bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 via-teal-300 to-indigo-300">
                    Designed for Yourself.
                  </span>
                </motion.h1>

                {/* Refined Subhead */}
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.35 }}
                  className="text-base sm:text-lg md:text-xl text-slate-300/90 max-w-3xl mb-10 leading-relaxed font-normal"
                >
                  Turn your daily physical training, focus habits, and mental discipline into quantifiable RPG stats. 
                  Choose your hunter archetype, calibrate real attributes (STR, AGI, INT, VIT), and climb the global ranks from E-Rank to Monarch.
                </motion.p>

                {/* Action Buttons */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.45 }}
                  className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full max-w-md mb-10"
                >
                  <Button
                    onClick={() => setLocation('/account-selection')}
                    size="lg"
                    className="w-full sm:w-auto flex-1 bg-cyan-500 hover:bg-cyan-400 text-black font-semibold text-sm sm:text-base py-6 px-8 rounded-xl shadow-[0_0_30px_rgba(6,182,212,0.35)] transition-all transform hover:scale-[1.01]"
                  >
                    <span>Awaken Your System</span>
                    <ArrowRight className="ml-2 w-4 h-4" />
                  </Button>

                  <Button
                    onClick={() => setLocation('/login')}
                    size="lg"
                    variant="outline"
                    className="w-full sm:w-auto border-slate-700 hover:border-cyan-500/50 bg-slate-900/70 hover:bg-slate-800 text-white font-medium text-sm sm:text-base py-6 px-7 rounded-xl transition-all"
                  >
                    Sign In
                  </Button>
                </motion.div>

                {/* Clean Feature Pills */}
                <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-slate-400 mb-20">
                  <span className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-cyan-400" /> E-Rank to Monarch Ladder
                  </span>
                  <span className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-cyan-400" /> Real-Life Stat Calibration
                  </span>
                  <span className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-cyan-400" /> Anti-Burnout Rest Day Shield
                  </span>
                  <span className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-cyan-400" /> 100% Offline Capable
                  </span>
                </div>

                {/* ======================================================== */}
                {/* SECTION 1: HOW THE SYSTEM OPERATES (THE CORE THREE LOOPS) */}
                {/* ======================================================== */}
                <section className="w-full max-w-5xl mx-auto mb-24 text-left">
                  <div className="text-center mb-12">
                    <span className="text-xs font-semibold text-cyan-400 tracking-wider uppercase">System Mechanics</span>
                    <h2 className="text-3xl sm:text-4xl font-extrabold text-white mt-2 tracking-tight">
                      How The System Quantifies Your Life
                    </h2>
                    <p className="text-slate-400 text-sm sm:text-base mt-2 max-w-xl mx-auto leading-relaxed">
                      Transform ambiguous self-improvement into a clear, dopamine-driven feedback loop where every rep, focus session, and completed habit levels up your character.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Loop 1: Calibrate Attributes */}
                    <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800 hover:border-cyan-500/30 transition-all flex flex-col justify-between">
                      <div>
                        <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 mb-4">
                          <Activity className="w-6 h-6" />
                        </div>
                        <span className="text-xs font-semibold text-cyan-400 uppercase tracking-wider block mb-1">Step 01 • Calibration</span>
                        <h3 className="text-lg font-bold text-white mb-2">Real Attribute Calibration</h3>
                        <p className="text-xs sm:text-sm text-slate-400 leading-relaxed mb-4">
                          Input your baseline physical metrics (push-ups, pull-ups, cardio endurance) and cognitive habits. The System calibrates your initial stat distribution across Strength, Agility, Intellect, and Vitality.
                        </p>
                      </div>
                      <div className="pt-3 border-t border-slate-800/80 text-xs text-slate-400 flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" /> Objective Stat Engine
                      </div>
                    </div>

                    {/* Loop 2: Adaptive Daily Quests */}
                    <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800 hover:border-cyan-500/30 transition-all flex flex-col justify-between">
                      <div>
                        <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 mb-4">
                          <Target className="w-6 h-6" />
                        </div>
                        <span className="text-xs font-semibold text-indigo-400 uppercase tracking-wider block mb-1">Step 02 • Daily Execution</span>
                        <h3 className="text-lg font-bold text-white mb-2">Archetype Quests & Gear</h3>
                        <p className="text-xs sm:text-sm text-slate-400 leading-relaxed mb-4">
                          Every morning, receive 3 non-negotiable daily quests customized to your Hunter Class and gear loadout (Bodyweight, Dumbbells, or Commercial Gym). No random filler; only high-yield directives.
                        </p>
                      </div>
                      <div className="pt-3 border-t border-slate-800/80 text-xs text-slate-400 flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400" /> Gear & Archetype Customization
                      </div>
                    </div>

                    {/* Loop 3: Tier Promotions */}
                    <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800 hover:border-cyan-500/30 transition-all flex flex-col justify-between">
                      <div>
                        <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-4">
                          <Trophy className="w-6 h-6" />
                        </div>
                        <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider block mb-1">Step 03 • Rank Promotion</span>
                        <h3 className="text-lg font-bold text-white mb-2">Climb From E to S-Tier</h3>
                        <p className="text-xs sm:text-sm text-slate-400 leading-relaxed mb-4">
                          Accumulate verified execution XP. Unlock Rank Awakening Trials at milestone thresholds to permanently promote your Hunter Rank.
                        </p>
                      </div>
                      <div className="pt-3 border-t border-slate-800/80 text-xs text-slate-400 flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" /> Verified Rank Promotion Trials
                      </div>
                    </div>
                  </div>
                </section>

                {/* ======================================================== */}
                {/* SECTION 2: HUNTER ARCHETYPES SHOWCASE */}
                {/* ======================================================== */}
                <section className="w-full max-w-5xl mx-auto mb-24 text-left">
                  <div className="text-center mb-10">
                    <span className="text-xs font-semibold text-cyan-400 tracking-wider uppercase">Class Customization</span>
                    <h2 className="text-3xl sm:text-4xl font-extrabold text-white mt-2 tracking-tight">
                      Select Your Hunter Archetype
                    </h2>
                    <p className="text-slate-400 text-sm sm:text-base mt-2 max-w-xl mx-auto leading-relaxed">
                      Choose the progression path that fits your physical style and life demands. Swap loadouts anytime in your Profile.
                    </p>
                  </div>

                  {/* Archetype Selector Tabs */}
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 mb-6">
                    {HUNTER_ARCHETYPES.map((archetype, idx) => {
                      const isActive = activeArchetypeIndex === idx;
                      return (
                        <button
                          key={archetype.name}
                          onClick={() => setActiveArchetypeIndex(idx)}
                          className={`p-3.5 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center ${
                            isActive
                              ? "border-cyan-400 bg-cyan-950/40 shadow-[0_0_20px_rgba(6,182,212,0.25)]"
                              : "border-slate-800 bg-slate-900/40 hover:border-slate-700 text-slate-400"
                          }`}
                        >
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-1.5 ${
                            isActive ? "text-cyan-400 bg-cyan-500/20" : "text-slate-400 bg-slate-800/60"
                          }`}>
                            {renderArchetypeIcon(archetype.iconKey, "w-4 h-4")}
                          </div>
                          <div className="text-xs font-bold text-white truncate w-full">{archetype.name}</div>
                          <div className="text-[10px] text-cyan-400/90 truncate mt-0.5 w-full">{archetype.focus}</div>
                        </button>
                      );
                    })}
                  </div>

                  {/* Active Archetype Detailed Card */}
                  <div className="p-6 sm:p-8 rounded-2xl bg-gradient-to-br from-slate-900/80 to-[#020617] border border-cyan-500/30 backdrop-blur-xl shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                    <div className="space-y-3 max-w-xl">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                          {renderArchetypeIcon(HUNTER_ARCHETYPES[activeArchetypeIndex].iconKey, "w-6 h-6")}
                        </div>
                        <div>
                          <h3 className="text-2xl font-bold text-white tracking-tight">
                            {HUNTER_ARCHETYPES[activeArchetypeIndex].name}
                          </h3>
                          <span className="text-xs font-semibold text-cyan-400 uppercase tracking-wider">
                            Primary Focus: {HUNTER_ARCHETYPES[activeArchetypeIndex].focus}
                          </span>
                        </div>
                      </div>

                      <p className="text-sm text-slate-300 leading-relaxed">
                        {HUNTER_ARCHETYPES[activeArchetypeIndex].description}
                      </p>

                      <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
                        <span className="px-2.5 py-1 rounded-md bg-slate-800 border border-slate-700 text-slate-300">
                          Core Stat: <strong className="text-white">{HUNTER_ARCHETYPES[activeArchetypeIndex].stat}</strong>
                        </span>
                        <span className="px-2.5 py-1 rounded-md bg-cyan-950/70 border border-cyan-500/40 text-cyan-300">
                          Adaptive Quest Multiplier: 1.25x XP
                        </span>
                      </div>
                    </div>

                    <div className="w-full md:w-auto flex-shrink-0">
                      <Button
                        onClick={() => setLocation('/account-selection')}
                        className="w-full md:w-auto bg-cyan-500 hover:bg-cyan-400 text-black font-semibold text-xs px-6 py-5 rounded-xl shadow-[0_0_20px_rgba(6,182,212,0.3)]"
                      >
                        Select This Archetype <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </div>
                  </div>
                </section>

                {/* ======================================================== */}
                {/* SECTION 3: THE HUNTER RANK PROGRESSION LADDER */}
                {/* ======================================================== */}
                <section className="w-full max-w-5xl mx-auto mb-24 text-left">
                  <div className="text-center mb-12">
                    <span className="text-xs font-semibold text-cyan-400 tracking-wider uppercase">Tier Hierarchy</span>
                    <h2 className="text-3xl sm:text-4xl font-extrabold text-white mt-2 tracking-tight">
                      The Six Progression Ranks
                    </h2>
                    <p className="text-slate-400 text-sm sm:text-base mt-2 max-w-xl mx-auto leading-relaxed">
                      Every operator awakens at E-Rank. Your real-world consistency dictates how high you climb.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {PROGRESSION_TIERS.map((tier) => (
                      <div
                        key={tier.rank}
                        className={`p-5 rounded-2xl border transition-all ${tier.color} backdrop-blur-md flex flex-col justify-between`}
                      >
                        <div>
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-lg font-black tracking-tight">{tier.rank}</span>
                            <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full bg-black/40 border border-white/10">
                              {tier.badge}
                            </span>
                          </div>
                          <h4 className="text-sm font-bold text-white mb-1">{tier.title}</h4>
                          <span className="text-xs text-slate-400 block mb-2">{tier.requirement}</span>
                          <p className="text-xs text-slate-300 leading-relaxed mb-4">
                            {tier.desc}
                          </p>
                        </div>

                        <div className="pt-3 border-t border-white/10 text-[11px] text-slate-400 flex items-center justify-between">
                          <span>Promotion Trial:</span>
                          <span className="text-cyan-300 font-medium">Automatic Check</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>

                {/* ======================================================== */}
                {/* SECTION 4: ANTI-BURNOUT RECOVERY PROTOCOL */}
                {/* ======================================================== */}
                <section className="w-full max-w-5xl mx-auto mb-24 text-left">
                  <div className="p-8 sm:p-10 rounded-3xl bg-gradient-to-br from-slate-900/90 via-slate-900/60 to-[#020617] border border-cyan-500/30 relative overflow-hidden shadow-2xl">
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
                      <div className="space-y-4 max-w-xl">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-semibold">
                          <Shield className="w-3.5 h-3.5" />
                          <span>Anti-Burnout Recovery Mechanic</span>
                        </div>
                        <h3 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                          Mana Shields & Rest Day Protocols
                        </h3>
                        <p className="text-sm text-slate-300 leading-relaxed">
                          Most habit trackers demotivate you by wiping your 60-day streak to zero when life, illness, or travel happens. 
                          The System includes <strong>Mana Shields</strong> that auto-deploy to protect your streak on missed days, plus a 
                          manual <strong>Rest Day Protocol</strong> that replaces heavy training with active cellular recovery (hydration, myofascial mobility, sleep).
                        </p>
                        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 pt-2">
                          <span className="flex items-center gap-1.5 text-cyan-300">
                            <Check className="w-4 h-4 text-cyan-400" /> Start with 1 Free Mana Shield
                          </span>
                          <span className="flex items-center gap-1.5 text-cyan-300">
                            <Check className="w-4 h-4 text-cyan-400" /> Never lose momentum to burnout
                          </span>
                        </div>
                      </div>

                      <div className="w-full md:w-auto p-5 rounded-2xl bg-black/60 border border-cyan-500/30 text-center space-y-3 flex-shrink-0">
                        <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/40 flex items-center justify-center text-cyan-400 mx-auto">
                          <Shield className="w-6 h-6" />
                        </div>
                        <div>
                          <div className="text-lg font-bold text-white">Streak Protection</div>
                          <div className="text-xs text-slate-400">Available in Hunter Shop</div>
                        </div>
                        <Button
                          onClick={() => setLocation('/account-selection')}
                          className="w-full bg-cyan-500 hover:bg-cyan-400 text-black font-semibold text-xs py-4 px-6 rounded-xl"
                        >
                          Experience The System
                        </Button>
                      </div>
                    </div>
                  </div>
                </section>

                {/* ======================================================== */}
                {/* SECTION 5: SQUAD ACCOUNTABILITY & RIVAL DIVISIONS */}
                {/* ======================================================== */}
                <section className="w-full max-w-5xl mx-auto mb-20 text-left">
                  <div className="text-center mb-12">
                    <span className="text-xs font-semibold text-cyan-400 tracking-wider uppercase">Social Architecture</span>
                    <h2 className="text-3xl sm:text-4xl font-extrabold text-white mt-2 tracking-tight">
                      Rival Divisions & Accountability Squads
                    </h2>
                    <p className="text-slate-400 text-sm sm:text-base mt-2 max-w-xl mx-auto leading-relaxed">
                      Compete in weekly 10-hunter pods or form a close-knit squad with shared commitments.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800 hover:border-cyan-500/30 transition-all space-y-3">
                      <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                        <Trophy className="w-5 h-5" />
                      </div>
                      <h3 className="text-lg font-bold text-white">Weekly Rival Divisions</h3>
                      <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                        Face off against 9 matched Hunters each week based on verified focus minutes, completed quests, and consistency. Top 2 promote a tier; bottom 2 demote.
                      </p>
                      <div className="pt-2 text-xs text-cyan-400 flex items-center gap-1">
                        <span>Fair 10-hunter weekly pods</span>
                      </div>
                    </div>

                    <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800 hover:border-cyan-500/30 transition-all space-y-3">
                      <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                        <Users className="w-5 h-5" />
                      </div>
                      <h3 className="text-lg font-bold text-white">Squad Commitment Covenants</h3>
                      <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                        Form accountability squads with 3 to 10 peers. Stake virtual coins or commitment deposits; operators who fulfill 100% of their weekly targets share the pool dividends.
                      </p>
                      <div className="pt-2 text-xs text-amber-400 flex items-center gap-1">
                        <span>Peer-verified execution consistency</span>
                      </div>
                    </div>
                  </div>
                </section>

                {/* FINAL CALL TO ACTION */}
                <div className="w-full max-w-4xl p-8 sm:p-12 rounded-3xl bg-gradient-to-br from-cyan-950/60 to-slate-900 border border-cyan-500/40 text-center relative overflow-hidden mb-12 shadow-2xl">
                  <div className="relative z-10">
                    <h2 className="text-2xl sm:text-4xl font-extrabold text-white mb-4 tracking-tight">
                      Your Level 1 Starts Today.
                    </h2>
                    <p className="text-slate-300 text-sm sm:text-base max-w-xl mx-auto mb-8 leading-relaxed">
                      Awaken your starting stats, pick your Hunter Archetype, and transform your daily life into an objective progression engine.
                    </p>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                      <Button
                        onClick={() => setLocation('/account-selection')}
                        size="lg"
                        className="w-full sm:w-auto bg-cyan-500 hover:bg-cyan-400 text-black font-semibold text-sm sm:text-base py-6 px-8 rounded-xl shadow-[0_0_25px_rgba(6,182,212,0.4)]"
                      >
                        Awaken Your Account
                      </Button>
                      <Button
                        onClick={() => setLocation('/login')}
                        size="lg"
                        variant="outline"
                        className="w-full sm:w-auto border-slate-700 bg-slate-900/60 hover:bg-slate-800 text-slate-200 font-medium text-sm sm:text-base py-6 px-8 rounded-xl"
                      >
                        Sign In
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Professional Footer */}
                <footer className="w-full text-center pb-8 pt-4 text-xs text-slate-500 border-t border-slate-900/80">
                  <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 mb-3">
                    <button
                      onClick={() => setLocation('/about')}
                      className="hover:text-cyan-400 transition-colors cursor-pointer"
                    >
                      About
                    </button>
                    <span>•</span>
                    <button
                      onClick={() => setLocation('/download')}
                      className="hover:text-cyan-400 transition-colors cursor-pointer"
                    >
                      Mobile App
                    </button>
                    <span>•</span>
                    <button
                      onClick={() => setLocation('/contact')}
                      className="hover:text-cyan-400 transition-colors cursor-pointer"
                    >
                      Contact & Support
                    </button>
                    <span>•</span>
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
                  </div>
                  <p className="text-slate-600">© {new Date().getFullYear()} Ascension Protocol. All rights reserved.</p>
                </footer>
              </section>
            </motion.div>
          )}

          {/* ============ SELECTION VIEW (SIGN IN / PORTALS) ============ */}
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
                <h2 className="text-3xl sm:text-4xl font-bold text-white mt-1 tracking-tight">Select Access Portal</h2>
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
                    <h3 className="text-xl font-bold text-white">Hunter Portal</h3>
                    <p className="text-slate-400 text-xs sm:text-sm leading-relaxed">
                      Access your mission command center, calibrated stats, daily quests, and rank standing.
                    </p>
                    <span className="text-cyan-400 text-xs font-semibold flex items-center gap-1 mt-2">
                      Sign In to Account <ArrowRight className="w-4 h-4" />
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

        </AnimatePresence>
      </main>

      {/* STICKY MOBILE LAUNCH BAR */}
      <AnimatePresence>
        {view === 'hero' && (
          <motion.div
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            exit={{ y: 100 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed bottom-0 left-0 right-0 md:hidden z-40 px-4 py-3 bg-[#020617]/95 backdrop-blur-xl border-t border-cyan-500/20"
          >
            <div className="flex gap-2">
              <Button
                onClick={() => setLocation('/account-selection')}
                className="flex-1 bg-cyan-500 hover:bg-cyan-400 text-black font-semibold rounded-xl py-6 text-xs shadow-[0_0_20px_rgba(6,182,212,0.3)]"
              >
                Awaken Your Rank <ArrowRight className="ml-1.5 w-4 h-4" />
              </Button>
              <Button
                onClick={() => setLocation('/login')}
                variant="outline"
                className="border-slate-700 bg-slate-900 text-white text-xs rounded-xl py-6 px-4 font-medium"
              >
                Sign In
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      </>
      )}

    </div>
  );
}
