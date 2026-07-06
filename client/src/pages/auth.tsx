import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { AlertCircle, ArrowRight, Sparkles, User, Shield, Lock, Download, Share, MoreHorizontal, Plus, Smartphone, Zap, Target, Trophy } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { usePWAInstall } from "@/hooks/usePWAInstall";

// Detect iOS device
function isIOS() {
  return /iphone|ipad|ipod/i.test(navigator.userAgent) ||
    (navigator.userAgent.includes("Mac") && "ontouchend" in document);
}

// Detect if already running as standalone PWA
function isStandalone() {
  return window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as any).standalone === true;
}

export default function AuthPage() {
  const { user, loading, loginAsGuest } = useAuth();
  const [, setLocation] = useLocation();
  const [view, setView] = useState<'hero' | 'selection' | 'admin-login'>('hero');
  const [adminPassword, setAdminPassword] = useState("");
  const [adminError, setAdminError] = useState("");
  const { isInstallable, promptInstall } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  const ios = isIOS();
  const standalone = isStandalone();

  useEffect(() => {
    if (user && !loading) {
      if (user.isAnonymous) {
        setLocation("/account-selection");
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
      setAdminError("Invalid password");
    }
  };

  const handleInstall = () => {
    if (isInstallable) {
      promptInstall();
    } else {
      setShowIOSGuide(true);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white">
        <div className="text-center animate-pulse">
          <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-gray-400">Loading…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-black text-white" style={{ maxWidth: '100vw', overflowX: 'hidden' }}>

      {/* Background Glows - fixed, non-scrolling */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 left-0 w-1/2 h-1/2 bg-blue-900/20 rounded-full blur-[120px] -translate-x-1/4 -translate-y-1/4" />
        <div className="absolute bottom-0 right-0 w-1/2 h-1/2 bg-purple-900/20 rounded-full blur-[120px] translate-x-1/4 translate-y-1/4" />
      </div>

      {/* iOS Install Guide Sheet */}
      <AnimatePresence>
        {showIOSGuide && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
              onClick={() => setShowIOSGuide(false)}
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 350, damping: 30 }}
              className="fixed bottom-0 left-0 right-0 z-50 bg-zinc-900 border-t border-white/10 rounded-t-3xl p-6 pb-10"
            >
              <div className="flex justify-center mb-4">
                <div className="w-10 h-1 rounded-full bg-white/20" />
              </div>
              <h3 className="text-xl font-bold text-white text-center mb-2">Install on iPhone / iPad</h3>
              <p className="text-sm text-zinc-400 text-center mb-6">Follow these 3 steps in Safari:</p>
              <div className="space-y-3">
                {[
                  { icon: Share, text: "Tap the Share button", sub: "The square with an arrow at the bottom of Safari" },
                  { icon: MoreHorizontal, text: "Scroll and tap 'Add to Home Screen'", sub: "You may need to scroll down in the share sheet" },
                  { icon: Plus, text: "Tap 'Add' to confirm", sub: "Ascension will appear on your home screen" },
                ].map(({ icon: Icon, text, sub }, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 rounded-2xl bg-white/5">
                    <div className="flex-shrink-0 w-9 h-9 rounded-xl bg-purple-500/20 flex items-center justify-center">
                      <Icon className="w-4 h-4 text-purple-400" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">{text}</p>
                      <p className="text-xs text-zinc-500 mt-0.5">{sub}</p>
                    </div>
                  </div>
                ))}
              </div>
              <Button onClick={() => setShowIOSGuide(false)} className="w-full mt-6 rounded-2xl bg-white/10 hover:bg-white/20 text-white">Got it</Button>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main Scrollable Content */}
      <div className="relative z-10 overflow-y-auto overflow-x-hidden" style={{ paddingBottom: standalone ? '0' : '80px' }}>

        <AnimatePresence mode="wait">

          {/* ============ HERO VIEW ============ */}
          {view === 'hero' && (
            <motion.div
              key="hero"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
            >
              {/* Hero Section - Full Viewport */}
              <section className="w-full flex flex-col items-center justify-center text-center px-6 py-20 min-h-screen">
                {/* Badge */}
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/10 bg-white/5 backdrop-blur-sm mb-6"
                >
                  <Sparkles className="w-4 h-4 text-yellow-400" />
                  <span className="text-xs font-medium text-gray-300 tracking-wide">Project Ascensions v1.0</span>
                </motion.div>

                {/* Heading */}
                <motion.h1
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3, duration: 0.6 }}
                  className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tight mb-5 leading-[1.05]"
                >
                  <span className="block text-white">Level Up</span>
                  <span className="block text-white">Your</span>
                  <span className="block bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-indigo-400 to-blue-400 pb-1">
                    Existence
                  </span>
                </motion.h1>

                {/* Subheading */}
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="text-base md:text-xl text-gray-400 max-w-sm md:max-w-2xl mb-10 leading-relaxed"
                >
                  Gamify your self-improvement. Track stats, complete quests, and ascend to new tiers of human potential.
                </motion.p>

                {/* Desktop-only CTA */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.6 }}
                  className="hidden md:flex items-center gap-3 justify-center"
                >
                  {standalone ? (
                    <Button
                      onClick={() => setView('selection')}
                      size="lg"
                      className="bg-white text-black hover:bg-gray-200 rounded-full px-8 py-6 text-lg font-bold shadow-[0_0_20px_rgba(255,255,255,0.3)]"
                    >
                      Begin Journey <ArrowRight className="ml-2 w-5 h-5" />
                    </Button>
                  ) : (
                    <Button
                      onClick={handleInstall}
                      size="lg"
                      className="bg-purple-600 hover:bg-purple-700 text-white rounded-full px-8 py-6 text-lg font-bold shadow-[0_0_20px_rgba(147,51,234,0.4)]"
                    >
                      <Download className="mr-2 w-5 h-5" />
                      Install App to Play
                    </Button>
                  )}
                </motion.div>

                {/* Install hint for desktop */}
                {!standalone && (
                  <p className="hidden md:block mt-3 text-xs text-zinc-600">
                    {ios ? "Safari → Share → Add to Home Screen" : "Works on Android, iOS & Desktop"}
                  </p>
                )}

                {/* Scroll indicator */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1.2 }}
                  className="mt-16 flex flex-col items-center gap-2 text-zinc-600"
                >
                  <span className="text-xs tracking-widest uppercase">Scroll to explore</span>
                  <motion.div
                    animate={{ y: [0, 6, 0] }}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                    className="w-px h-8 bg-gradient-to-b from-zinc-600 to-transparent"
                  />
                </motion.div>
              </section>

              {/* Features Section */}
              <section className="w-full px-6 pb-16">
                <div className="max-w-5xl mx-auto">
                  <div className="text-center mb-10">
                    <h2 className="text-2xl md:text-4xl font-bold mb-3">Everything you need to ascend</h2>
                    <p className="text-gray-500 text-sm md:text-base">Built for discipline. Designed for results.</p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {[
                      { title: "Gamified Life", description: "Turn daily tasks and habits into an immersive RPG experience.", icon: Zap, color: "from-yellow-500/20 to-orange-500/5" },
                      { title: "Epic Quests", description: "Complete real-world challenges, earn XP, and unlock new ranks.", icon: Target, color: "from-purple-500/20 to-blue-500/5" },
                      { title: "Focus Sanctum", description: "Deep work sessions with built-in timers and productivity tracking.", icon: Lock, color: "from-green-500/20 to-teal-500/5" },
                    ].map((feature, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        viewport={{ once: true }}
                        className={`bg-gradient-to-br ${feature.color} border border-white/10 rounded-2xl p-6 text-left`}
                      >
                        <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center mb-4">
                          <feature.icon className="w-5 h-5 text-white" />
                        </div>
                        <h3 className="text-lg font-bold text-white mb-2">{feature.title}</h3>
                        <p className="text-gray-400 text-sm leading-relaxed">{feature.description}</p>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </section>

              {/* Steps Section */}
              <section className="w-full px-6 pb-16">
                <div className="max-w-5xl mx-auto">
                  <div className="text-center mb-10">
                    <h2 className="text-2xl md:text-4xl font-bold mb-3">The Ascension Protocol</h2>
                    <p className="text-gray-500 text-sm md:text-base">A 4-step system to level up every domain of your life.</p>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                      { step: "01", title: "Install", desc: "Add to your home screen for instant, frictionless access." },
                      { step: "02", title: "Set Stats", desc: "Define your base metrics across health, wealth, and mind." },
                      { step: "03", title: "Complete Quests", desc: "Take on daily challenges and track your focus sessions." },
                      { step: "04", title: "Ascend", desc: "Earn XP, rank up on the leaderboard, and unlock potential." },
                    ].map((item, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        viewport={{ once: true }}
                        className="bg-white/5 border border-white/10 rounded-2xl p-5 relative overflow-hidden"
                      >
                        <span className="text-6xl font-black text-white/[0.03] absolute -top-2 -right-1 leading-none select-none">{item.step}</span>
                        <span className="text-xs font-bold text-purple-400 tracking-widest mb-2 block">{item.step}</span>
                        <h3 className="text-base font-bold text-white mb-1">{item.title}</h3>
                        <p className="text-xs text-gray-500 leading-relaxed">{item.desc}</p>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </section>

              {/* Philosophy Section */}
              <section className="w-full px-6 pb-24">
                <div className="max-w-3xl mx-auto">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="bg-gradient-to-br from-purple-900/30 to-blue-900/10 border border-purple-500/20 rounded-3xl p-8 text-center"
                  >
                    <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center mx-auto mb-4">
                      <Trophy className="w-6 h-6 text-purple-400" />
                    </div>
                    <h2 className="text-2xl md:text-3xl font-bold mb-4">Built for the Elite</h2>
                    <p className="text-gray-400 text-sm md:text-base leading-relaxed mb-6">
                      Ascension is not just another habit tracker. It is a protocol for those who refuse to settle for mediocrity. By combining behavioural psychology with RPG mechanics, you become addicted to your own self-improvement.
                    </p>
                    {!standalone && (
                      <Button
                        onClick={handleInstall}
                        size="lg"
                        className="bg-white text-black hover:bg-gray-200 rounded-full px-8 font-bold hidden md:inline-flex"
                      >
                        <Download className="mr-2 w-5 h-5" />
                        Install Now — It's Free
                      </Button>
                    )}
                  </motion.div>
                </div>
              </section>

              {/* Footer */}
              <div className="w-full text-center pb-6 px-6">
                <p className="text-xs text-zinc-600">© {new Date().getFullYear()} All rights belong to Zingo Pvt Limited.</p>
              </div>
            </motion.div>
          )}

          {/* ============ SELECTION VIEW ============ */}
          {view === 'selection' && (
            <motion.div
              key="selection"
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.97 }}
              transition={{ duration: 0.3 }}
              className="min-h-screen flex flex-col items-center justify-center px-6 py-20"
            >
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-3 text-center">Choose Your Path</h2>
              <p className="text-gray-500 mb-10 text-sm text-center">Select how you'd like to continue</p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-2xl">
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setLocation('/login')}
                  className="cursor-pointer group relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md p-8 hover:bg-white/10 transition-colors"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="relative z-10 flex flex-col items-center text-center gap-4">
                    <div className="p-4 rounded-full bg-blue-500/20 text-blue-400">
                      <User className="w-8 h-8" />
                    </div>
                    <h3 className="text-xl font-bold text-white">User Login</h3>
                    <p className="text-gray-400 text-sm">Access your dashboard, track progress, and join sessions.</p>
                    <span className="text-blue-400 text-sm flex items-center gap-1">Login / Sign Up <ArrowRight className="w-4 h-4" /></span>
                  </div>
                </motion.div>

                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setView('admin-login')}
                  className="cursor-pointer group relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md p-8 hover:bg-white/10 transition-colors"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="relative z-10 flex flex-col items-center text-center gap-4">
                    <div className="p-4 rounded-full bg-purple-500/20 text-purple-400">
                      <Shield className="w-8 h-8" />
                    </div>
                    <h3 className="text-xl font-bold text-white">Administrator</h3>
                    <p className="text-gray-400 text-sm">Access the command center. Requires authorized credentials.</p>
                    <span className="text-purple-400 text-sm flex items-center gap-1">Admin Login <Lock className="w-4 h-4" /></span>
                  </div>
                </motion.div>
              </div>

              <button
                onClick={() => setView('hero')}
                className="mt-10 text-gray-600 hover:text-gray-300 transition-colors text-sm"
              >
                ← Back to Home
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
              transition={{ duration: 0.3 }}
              className="min-h-screen flex flex-col items-center justify-center px-6 py-20"
            >
              <Card className="bg-zinc-900/90 border-zinc-800 backdrop-blur-xl w-full max-w-sm">
                <CardHeader>
                  <CardTitle className="text-2xl text-center text-white">Admin Access</CardTitle>
                  <CardDescription className="text-center text-zinc-400">Enter your credentials to continue</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleAdminSubmit} className="space-y-4">
                    <input
                      type="password"
                      value={adminPassword}
                      onChange={(e) => { setAdminPassword(e.target.value); setAdminError(""); }}
                      placeholder="Enter password"
                      className="w-full px-3 py-2 bg-black/50 border border-zinc-700 rounded-md text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                      autoFocus
                    />
                    {adminError && (
                      <p className="text-sm text-red-400 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" /> {adminError}
                      </p>
                    )}
                    <Button type="submit" className="w-full bg-purple-600 hover:bg-purple-700 text-white">Login</Button>
                    <div className="text-center">
                      <button type="button" onClick={() => setView('selection')} className="text-sm text-zinc-500 hover:text-zinc-300 transition-colors">Cancel</button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </motion.div>
          )}

        </AnimatePresence>
      </div>

      {/* ============ STICKY MOBILE CTA ============ */}
      <AnimatePresence>
        {view === 'hero' && (
          <motion.div
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            exit={{ y: 100 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed bottom-0 left-0 right-0 md:hidden z-40 px-4 py-3 bg-black/90 backdrop-blur-lg border-t border-white/[0.06]"
          >
            {standalone ? (
              <Button
                onClick={() => setView('selection')}
                className="w-full bg-white text-black font-bold rounded-xl py-6 text-base shadow-[0_0_20px_rgba(255,255,255,0.15)]"
              >
                Begin Journey <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            ) : (
              <Button
                onClick={handleInstall}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl py-6 text-base shadow-[0_0_20px_rgba(147,51,234,0.5)]"
              >
                <Smartphone className="mr-2 w-5 h-5" />
                Install App
              </Button>
            )}
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
