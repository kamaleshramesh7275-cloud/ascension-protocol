import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { 
  Sparkles, Target, Zap, Shield, HeartPulse, Brain, 
  CheckCircle2, ArrowRight, ShieldCheck, Flame, Users,
  Award, ChevronRight, ArrowLeft, Layers, Compass
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AboutPage() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-[#020617] text-slate-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-black">
      {/* Background Gradients */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[450px] bg-gradient-to-b from-cyan-600/15 via-indigo-600/10 to-transparent blur-3xl opacity-70" />
        <div className="absolute top-1/3 -right-40 w-[500px] h-[500px] bg-cyan-900/10 blur-3xl" />
        <div className="absolute bottom-10 -left-40 w-[500px] h-[500px] bg-indigo-900/10 blur-3xl" />
      </div>

      {/* Top Header */}
      <header className="relative z-20 border-b border-slate-800/80 bg-[#020617]/90 backdrop-blur-md px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div 
            onClick={() => setLocation("/")}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 border border-cyan-400/40 group-hover:scale-105 transition-transform">
              <Sparkles className="w-5 h-5 text-black font-bold" />
            </div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg text-white tracking-tight">Ascension Protocol</span>
              <span className="text-xs text-cyan-400 font-medium px-2 py-0.5 rounded-full bg-cyan-950/80 border border-cyan-800/60 hidden sm:inline-block">System Dossier</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setLocation("/")}
              className="hidden sm:inline-flex items-center gap-1.5 text-xs text-slate-300 hover:text-cyan-400 transition-colors px-3 py-1.5 rounded-lg border border-slate-800 hover:border-cyan-500/40 bg-slate-900/50"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Home</span>
            </button>
            <button
              onClick={() => setLocation("/download")}
              className="hidden md:inline-flex items-center text-xs text-slate-300 hover:text-cyan-400 transition-colors px-3 py-1.5"
            >
              App Download
            </button>
            <button
              onClick={() => setLocation("/contact")}
              className="hidden md:inline-flex items-center text-xs text-slate-300 hover:text-cyan-400 transition-colors px-3 py-1.5"
            >
              Contact
            </button>
            <Button
              onClick={() => setLocation("/login")}
              size="sm"
              variant="outline"
              className="border-slate-700 bg-slate-900/60 hover:bg-slate-800 text-slate-200 text-xs px-3.5 h-9 rounded-lg"
            >
              Sign In
            </Button>
            <Button
              onClick={() => setLocation("/account-selection")}
              size="sm"
              className="bg-cyan-500 hover:bg-cyan-400 text-black font-semibold text-xs px-4 h-9 rounded-lg shadow-[0_0_15px_rgba(6,182,212,0.3)]"
            >
              Awaken Your Rank
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 flex-1 max-w-5xl w-full mx-auto px-6 py-12 md:py-20">
        
        {/* Eyebrow & Hero */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-cyan-500/30 bg-cyan-950/40 backdrop-blur-md mb-6">
            <Target className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-xs font-semibold text-cyan-300 tracking-wide uppercase">
              The Architecture of Self-Ascension
            </span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white mb-6 leading-tight">
            Built for Those Who Want <br className="hidden sm:inline" />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 via-teal-300 to-indigo-300">
              A System for Themselves.
            </span>
          </h1>

          <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
            In modern life, tangible progress often feels invisible. We study, train, work, and meditate, yet our daily growth lacks clear metrics, structure, and reward. Ascension Protocol was built to bridge this gap: transforming daily human effort into an objective, dopamine-aligned leveling system.
          </p>
        </div>

        {/* Narrative / Origin Section */}
        <div className="p-8 sm:p-12 rounded-3xl bg-slate-900/50 border border-slate-800 backdrop-blur-xl mb-16">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
            <div className="md:col-span-7 space-y-4">
              <span className="text-xs font-semibold text-cyan-400 uppercase tracking-wider">The Problem</span>
              <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                Traditional Habit Trackers Fail Because They Punish Reality.
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Most productivity apps are glorified to-do lists. If you miss one day due to illness, travel, or an emergency, your streak is destroyed, triggering abandonment. Moreover, they treat a 10-pushup morning the same as a 3-hour deep work marathon.
              </p>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                We observed how LitRPG and manhwa narratives engage people: characters receive clear baseline calibrations, adaptive quests matching their gear, and rank promotion milestones. We asked: <span className="text-white font-medium">Why should leveling up only exist in fiction?</span>
              </p>
            </div>

            <div className="md:col-span-5 space-y-3">
              <div className="p-4 rounded-xl bg-slate-950/80 border border-rose-500/20">
                <div className="text-xs font-bold text-rose-400 mb-1">Traditional Apps</div>
                <p className="text-xs text-slate-400">Rigid streaks, arbitrary checklists, zero attribute feedback, high burnout rate.</p>
              </div>

              <div className="p-4 rounded-xl bg-cyan-950/40 border border-cyan-500/30">
                <div className="text-xs font-bold text-cyan-400 mb-1">Ascension Protocol</div>
                <p className="text-xs text-slate-300">Calibrated stats (STR/AGI/INT/VIT), Rest Day Shields, Hunter Archetypes, and E-to-S Rank Trials.</p>
              </div>
            </div>
          </div>
        </div>

        {/* The 4 Core System Pillars */}
        <div className="mb-20">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs font-semibold text-cyan-400 uppercase tracking-wider">Core Foundations</span>
            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight mt-1">
              The 4 Pillars of Ascension
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-2">
              Engineered using behavioral psychology, progressive overload, and deep work architecture.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Pillar 1 */}
            <div className="p-6 sm:p-8 rounded-2xl bg-[#090d16] border border-slate-800 hover:border-cyan-500/40 transition-all">
              <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 mb-5">
                <Target className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">1. Objective Attribute Calibration</h3>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                You do not start at max capacity. The system runs an initial calibration test across four core attributes: <strong className="text-white">Strength, Agility, Intellect, and Vitality</strong>. Your starting rank is honest, measurable, and calibrated to your actual biology.
              </p>
            </div>

            {/* Pillar 2 */}
            <div className="p-6 sm:p-8 rounded-2xl bg-[#090d16] border border-slate-800 hover:border-cyan-500/40 transition-all">
              <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-5">
                <Compass className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">2. Class Archetypes & Gear Profiles</h3>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                Choose your discipline: <strong className="text-white">Shadow Assassin</strong> (Calisthenics & Speed), <strong className="text-white">Iron Tank</strong> (Hypertrophy & Power), <strong className="text-white">Phantom Ranger</strong> (Endurance), or <strong className="text-white">Void Scholar</strong> (Deep Cognitive Focus). Quests match your exact available equipment.
              </p>
            </div>

            {/* Pillar 3 */}
            <div className="p-6 sm:p-8 rounded-2xl bg-[#090d16] border border-slate-800 hover:border-cyan-500/40 transition-all">
              <div className="w-12 h-12 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400 mb-5">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">3. Anti-Burnout Recovery Protocols</h3>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                Consistency is sustained over months, not days. We introduced <strong className="text-white">Mana Shields</strong> and <strong className="text-white">Rest Day Potions</strong>. Take deliberate rest days to recharge without losing your streak or suffering rank degradation.
              </p>
            </div>

            {/* Pillar 4 */}
            <div className="p-6 sm:p-8 rounded-2xl bg-[#090d16] border border-slate-800 hover:border-cyan-500/40 transition-all">
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mb-5">
                <Award className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">4. Hunter Rank Promotion Trials</h3>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                Climbing from <strong className="text-white">E-Rank Initiate to S-Rank Monarch</strong> requires passing definitive gatekeeper trials: physical capacity tests, unbroken deep work sprints, and peer-verified squad commitments.
              </p>
            </div>

          </div>
        </div>

        {/* Privacy & Engineering Commitments */}
        <div className="p-8 sm:p-10 rounded-2xl bg-slate-900/30 border border-slate-800 mb-16">
          <div className="flex items-center gap-3 mb-4">
            <Shield className="w-6 h-6 text-cyan-400" />
            <h3 className="text-xl font-bold text-white">Our Engineering & Privacy Charter</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-2">
            <div>
              <h4 className="text-sm font-semibold text-white mb-1">Zero Data Selling</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Your physiological and habit data is personal. We never monetize user biometrics or broker information to advertisers.
              </p>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white mb-1">Local-First Storage</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Offline client cache ensures that you own your logs even when disconnected from internet access.
              </p>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white mb-1">Transparent Progression</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Attribute formulas and rank algorithms are clear and predictable, with zero hidden lootbox mechanics.
              </p>
            </div>
          </div>
        </div>

        {/* CTA Card */}
        <div className="w-full p-8 sm:p-12 rounded-3xl bg-gradient-to-br from-cyan-950/60 to-slate-900 border border-cyan-500/40 text-center relative overflow-hidden shadow-2xl">
          <h2 className="text-2xl sm:text-4xl font-extrabold text-white mb-3">
            Stop Tracking. Start Leveling.
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 max-w-lg mx-auto mb-8">
            Take the initial calibration test, select your Hunter Archetype, and step into your personal progression protocol today.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button
              onClick={() => setLocation("/account-selection")}
              size="lg"
              className="w-full sm:w-auto bg-cyan-500 hover:bg-cyan-400 text-black font-semibold text-sm py-6 px-8 rounded-xl shadow-[0_0_20px_rgba(6,182,212,0.4)]"
            >
              Awaken Your Account <ArrowRight className="w-4 h-4 ml-1.5" />
            </Button>
            <Button
              onClick={() => setLocation("/download")}
              size="lg"
              variant="outline"
              className="w-full sm:w-auto border-slate-700 bg-slate-900/60 hover:bg-slate-800 text-slate-200 text-sm py-6 px-7 rounded-xl"
            >
              Get the Mobile App
            </Button>
          </div>
        </div>

      </main>

      {/* Footer */}
      <footer className="relative z-20 border-t border-slate-900/80 bg-[#020617] px-6 py-8 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-center gap-x-6 gap-y-2 mb-3">
          <button onClick={() => setLocation("/")} className="hover:text-cyan-400 transition-colors">Home</button>
          <span>•</span>
          <button onClick={() => setLocation("/download")} className="hover:text-cyan-400 transition-colors">App Download</button>
          <span>•</span>
          <button onClick={() => setLocation("/contact")} className="hover:text-cyan-400 transition-colors">Contact</button>
          <span>•</span>
          <button onClick={() => setLocation("/privacy")} className="hover:text-cyan-400 transition-colors">Privacy Policy</button>
          <span>•</span>
          <button onClick={() => setLocation("/terms")} className="hover:text-cyan-400 transition-colors">Terms of Service</button>
        </div>
        <p className="text-slate-600">© {new Date().getFullYear()} Ascension Protocol. All rights reserved.</p>
      </footer>
    </div>
  );
}
