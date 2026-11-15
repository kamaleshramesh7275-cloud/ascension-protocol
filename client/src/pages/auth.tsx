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
    desc: "The pinnacle of self-mastery. Top 1% of executors globally on the global leaderboard.",
  },
];

export default function AuthPage() {
  const { user, loading } = useAuth();
  const [, setLocation] = useLocation();
  const [view, setView] = useState<'hero' | 'selection' | 'admin-login'>('hero');
  const [adminPassword, setAdminPassword] = useState("");
  const [adminError, setAdminError] = useState("");
  const { isInstallable, promptInstall } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Selected Hunter Archetype in visual showcase
  const [activeArchetypeIndex, setActiveArchetypeIndex] = useState(0);

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
                  <span>Mobile Device Access</span>
                </div>

                <h3 className="text-xl font-bold text-white mb-2">Scan to Open on Mobile</h3>
                <p className="text-xs text-slate-400 mb-6 leading-relaxed">
                  Open your camera to access your personal leveling system, daily directives, and rank progression on mobile.
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
                    className="flex-1 border-slate-700 bg-slate-900/60 hover:bg-slate-800 text-slate-200 text-xs py-5 rounded-xl"
                  >
                    {copiedLink ? (
                      <>
                        <Check className="w-4 h-4 mr-1.5 text-emerald-400" />
                        Copied
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
                    className="bg-cyan-500 hover:bg-cyan-400 text-black font-semibold text-xs py-5 px-5 rounded-xl"
                  >
                    Close
                  </Button>
                </div>
              </motion.div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

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

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowQRModal(true)}
              className="hidden sm:inline-flex items-center gap-1.5 text-xs text-slate-300 hover:text-cyan-400 transition-colors px-3 py-1.5 rounded-lg border border-slate-800 hover:border-cyan-500/40 bg-slate-900/50"
            >
              <QrCode className="w-3.5 h-3.5" />
              <span>Mobile App</span>
            </button>

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
                          Accumulate verified execution XP. Unlock Rank Awakening Trials at milestone thresholds to permanently promote your Hunter Rank and climb the global leaderboards.
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
                {/* SECTION 5: SQUAD ACCOUNTABILITY & LEADERBOARDS */}
                {/* ======================================================== */}
                <section className="w-full max-w-5xl mx-auto mb-20 text-left">
                  <div className="text-center mb-12">
                    <span className="text-xs font-semibold text-cyan-400 tracking-wider uppercase">Social Architecture</span>
                    <h2 className="text-3xl sm:text-4xl font-extrabold text-white mt-2 tracking-tight">
                      Accountability Squads & Global Standing
                    </h2>
                    <p className="text-slate-400 text-sm sm:text-base mt-2 max-w-xl mx-auto leading-relaxed">
                      Compete with disciplined peers or form a close-knit squad with shared commitments.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800 hover:border-cyan-500/30 transition-all space-y-3">
                      <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                        <Trophy className="w-5 h-5" />
                      </div>
                      <h3 className="text-lg font-bold text-white">Global Hunter Leaderboards</h3>
                      <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                        Climb the global tier rankings based on verified habit consistency, completed quest volume, and streak length. Filter by Class (Assassin, Tank, Ranger, Scholar) or region.
                      </p>
                      <div className="pt-2 text-xs text-cyan-400 flex items-center gap-1">
                        <span>Transparent proof-of-work ranking</span>
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
              <Card className="bg-[#090d16] border-slate-800 backdrop-blur-xl w-full max-w-sm shadow-2xl rounded-2xl">
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

    </div>
  );
}
