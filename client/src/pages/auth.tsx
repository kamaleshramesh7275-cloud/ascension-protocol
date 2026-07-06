import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { AlertCircle, ArrowRight, Sparkles, User, Shield, Lock, Download, Share, MoreHorizontal, Plus, Smartphone } from "lucide-react";
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

  // Navigate based on user type
  useEffect(() => {
    if (user && !loading) {
      if (user.isAnonymous) {
        setLocation("/account-selection");
      }
    }
  }, [user, loading, setLocation]);

  const handleGuestLogin = async () => {
    try {
      await loginAsGuest();
    } catch (e) {
      console.error("Guest login error:", e);
    }
  };

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

  // Loading spinner with subtle pulse
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
    <div className="min-h-screen bg-black text-white flex flex-col relative overflow-y-auto overflow-x-hidden selection:bg-purple-500/30 pb-24 md:pb-12">
      {/* Background Glow Effects */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-blue-900/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-purple-900/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-[20%] left-[50%] -translate-x-1/2 w-[40%] h-[40%] bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none" />

      {/* iOS Install Guide Overlay */}
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
              initial={{ opacity: 0, y: 60, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 60, scale: 0.95 }}
              transition={{ type: "spring", stiffness: 350, damping: 30 }}
              className="fixed bottom-0 left-0 right-0 z-50 bg-zinc-900 border-t border-white/10 rounded-t-3xl p-6"
            >
              <div className="flex justify-center mb-4">
                <div className="w-10 h-1 rounded-full bg-white/20" />
              </div>
              <h3 className="text-xl font-bold text-white text-center mb-2">Install on iPhone / iPad</h3>
              <p className="text-sm text-zinc-400 text-center mb-6">Follow these 3 steps in Safari:</p>

              <div className="space-y-4">
                {[
                  { icon: Share, step: "1", text: "Tap the Share button", sub: "The square with an arrow, at the bottom of Safari" },
                  { icon: MoreHorizontal, step: "2", text: "Scroll and tap 'Add to Home Screen'", sub: "You may need to scroll down in the share sheet" },
                  { icon: Plus, step: "3", text: "Tap 'Add' to confirm", sub: "Ascensions will appear on your home screen" },
                ].map(({ icon: Icon, step, text, sub }) => (
                  <div key={step} className="flex items-start gap-4 p-3 rounded-2xl bg-white/5">
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

              <Button
                onClick={() => setShowIOSGuide(false)}
                className="w-full mt-6 rounded-2xl bg-white/10 hover:bg-white/20 text-white"
              >
                Got it
              </Button>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {view === 'hero' && (
          <motion.div
            key="hero"
            className="relative z-10 w-full px-4 flex flex-col items-center pt-20 pb-32"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5 }}
          >
            {/* Main Hero Container */}
            <div className="max-w-4xl mx-auto text-center flex flex-col items-center min-h-[100dvh] md:min-h-[80vh] justify-center mb-12 md:mb-24">
            {/* Badge */}
            <motion.div
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/10 bg-white/5 backdrop-blur-sm mb-8"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
            >
              <Sparkles className="w-4 h-4 text-yellow-500" />
              <span className="text-sm font-medium text-gray-300">Project Ascensions v1.0</span>
            </motion.div>

            {/* Main Heading */}
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight mb-4 leading-[1.1]">
              <span className="block text-white">Level Up Your</span>
              <span className="block bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-indigo-400 to-blue-500 pb-2">
                Existence
              </span>
            </h1>

            {/* Subheading */}
            <motion.p
              className="text-lg md:text-xl text-gray-400 max-w-2xl mb-8 leading-relaxed"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.8 }}
            >
              Gamify your self-improvement journey. Track your stats, complete quests, and ascend to new tiers of human potential.
            </motion.p>

            {/* CTA Buttons Row */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.6, duration: 0.5 }}
              className="hidden md:flex flex-col sm:flex-row items-center gap-3 w-full justify-center"
            >
              {standalone ? (
                <Button
                  onClick={() => setView('selection')}
                  size="lg"
                  className="bg-white text-black hover:bg-gray-200 hover:scale-105 transition-all duration-300 rounded-full px-8 py-6 text-lg font-semibold shadow-[0_0_20px_rgba(255,255,255,0.3)] hover:shadow-[0_0_30px_rgba(255,255,255,0.5)] w-full sm:w-auto"
                >
                  Begin Journey <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              ) : (
                isInstallable ? (
                  // Android / Desktop Chrome — native prompt
                  <Button
                    onClick={promptInstall}
                    size="lg"
                    variant="outline"
                    className="border-purple-500/50 bg-purple-500 text-white hover:bg-purple-600 hover:border-purple-400 hover:scale-105 transition-all duration-300 rounded-full px-8 py-6 text-lg font-semibold shadow-[0_0_15px_rgba(147,51,234,0.3)] w-full sm:w-auto"
                  >
                    <Download className="mr-2 w-5 h-5" />
                    Install App to Play
                  </Button>
                ) : (
                  // iOS or browser that hasn't fired the event yet — show guide
                  <Button
                    onClick={() => setShowIOSGuide(true)}
                    size="lg"
                    variant="outline"
                    className="border-purple-500/50 bg-purple-500 text-white hover:bg-purple-600 hover:border-purple-400 hover:scale-105 transition-all duration-300 rounded-full px-8 py-6 text-lg font-semibold shadow-[0_0_15px_rgba(147,51,234,0.3)] w-full sm:w-auto"
                  >
                    <Smartphone className="mr-2 w-5 h-5" />
                    Install App to Play
                  </Button>
                )
              )}
            </motion.div>

            {/* Small install hint text */}
            {!standalone && (
              <motion.p
                className="mt-4 text-xs text-zinc-600"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1 }}
              >
                {isInstallable
                  ? "Add to your home screen — no app store needed. Required to begin your journey."
                  : ios
                    ? "Safari → Share → Add to Home Screen. Required to begin your journey."
                    : "Works on Android, iOS & Desktop. Required to begin your journey."}
              </motion.p>
            )}

            {/* Features Section */}
            <motion.div 
              className="flex overflow-x-auto md:grid md:grid-cols-3 gap-4 md:gap-6 mt-12 md:mt-20 w-full max-w-6xl mx-auto snap-x snap-mandatory scrollbar-hide pb-4 md:pb-0 px-2"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8, duration: 0.6 }}
            >
              {[
                {
                  title: "Gamified Life",
                  description: "Turn your daily tasks, habits, and goals into an immersive RPG experience.",
                  icon: Sparkles
                },
                {
                  title: "Epic Quests",
                  description: "Complete real-world challenges, earn XP, and unlock new abilities and ranks.",
                  icon: Shield
                },
                {
                  title: "Focus Sanctum",
                  description: "Deep work sessions with built-in timers, ambient sounds, and productivity tracking.",
                  icon: Lock
                }
              ].map((feature, i) => (
                <div key={i} className="min-w-[85vw] md:min-w-0 snap-center flex-shrink-0 bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-sm hover:bg-white/10 transition-colors text-left">
                  <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center mb-4">
                    <feature.icon className="w-6 h-6 text-purple-400" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">{feature.title}</h3>
                  <p className="text-gray-400 text-sm leading-relaxed">{feature.description}</p>
                </div>
              ))}
            </motion.div>
            </div>

            {/* How It Works Section */}
            <div className="w-full max-w-6xl mx-auto mt-12 md:mt-24 mb-16 md:mb-32">
              <div className="text-center mb-10 md:mb-16">
                <h2 className="text-3xl md:text-5xl font-bold mb-4">The Ascension Protocol</h2>
                <p className="text-gray-400 max-w-2xl mx-auto px-4">Follow a proven system to level up across all domains of your life.</p>
              </div>
              
              <div className="flex overflow-x-auto md:grid md:grid-cols-4 gap-4 md:gap-8 snap-x snap-mandatory scrollbar-hide pb-4 px-2">
                {[
                  { step: "01", title: "Install the App", desc: "Keep it on your home screen for quick, frictionless access." },
                  { step: "02", title: "Set Your Stats", desc: "Define your base metrics in health, wealth, intellect, and spirit." },
                  { step: "03", title: "Complete Quests", desc: "Take on daily challenges and track your focus sessions." },
                  { step: "04", title: "Ascend Tiers", desc: "Earn XP, rank up on the leaderboard, and unlock your true potential." }
                ].map((item, i) => (
                  <div key={i} className="min-w-[75vw] md:min-w-0 snap-center flex-shrink-0 mt-4 md:mt-0 relative p-6 rounded-2xl bg-gradient-to-b from-white/5 to-transparent border border-white/10">
                    <span className="text-5xl font-black text-white/5 absolute -top-6 right-4">{item.step}</span>
                    <h3 className="text-xl font-bold mt-4 mb-2">{item.title}</h3>
                    <p className="text-sm text-gray-400">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Social Proof / Philosophy */}
            <div className="w-full max-w-4xl mx-auto text-center bg-purple-900/10 border border-purple-500/20 rounded-3xl p-8 md:p-10 mb-24 md:mb-32 mx-4 md:mx-auto">
              <h2 className="text-2xl md:text-4xl font-bold mb-6">Built for the Elite</h2>
              <p className="text-gray-300 leading-relaxed mb-8">
                Ascension is not just another habit tracker. It is a comprehensive protocol designed for those who refuse to settle for mediocrity. By combining proven behavioural psychology with RPG mechanics, you will find yourself addicted to your own self-improvement.
              </p>
              {!standalone && (
                <Button
                  onClick={isInstallable ? promptInstall : () => setShowIOSGuide(true)}
                  size="lg"
                  className="bg-white text-black hover:bg-gray-200 rounded-full px-8 py-6 font-bold"
                >
                  <Download className="mr-2 w-5 h-5" />
                  Install Now
                </Button>
              )}
            </div>

          </motion.div>
        )}

        {view === 'selection' && (
          <motion.div
            key="selection"
            className="relative z-10 max-w-5xl mx-auto px-4 w-full flex flex-col items-center min-h-[80vh] justify-center pt-20"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.4 }}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-12 text-center">Choose Your Path</h2>

            <div className="grid md:grid-cols-2 gap-6 w-full max-w-3xl">
              {/* User Login Option */}
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setLocation('/login')}
                className="cursor-pointer group relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md p-8 hover:bg-white/10 transition-colors duration-300"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="relative z-10 flex flex-col items-center text-center space-y-4">
                  <div className="p-4 rounded-full bg-blue-500/20 text-blue-400 group-hover:text-blue-300 group-hover:bg-blue-500/30 transition-colors">
                    <User className="w-8 h-8" />
                  </div>
                  <h3 className="text-2xl font-bold text-white">User Login</h3>
                  <p className="text-gray-400">Access your dashboard, track progress, and join study sessions.</p>
                  <Button variant="ghost" className="text-blue-400 group-hover:text-blue-300">
                    Login / Sign Up <ArrowRight className="ml-2 w-4 h-4" />
                  </Button>
                </div>
              </motion.div>

              {/* Admin Option */}
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setView('admin-login')}
                className="cursor-pointer group relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md p-8 hover:bg-white/10 transition-colors duration-300"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="relative z-10 flex flex-col items-center text-center space-y-4">
                  <div className="p-4 rounded-full bg-purple-500/20 text-purple-400 group-hover:text-purple-300 group-hover:bg-purple-500/30 transition-colors">
                    <Shield className="w-8 h-8" />
                  </div>
                  <h3 className="text-2xl font-bold text-white">Administrator</h3>
                  <p className="text-gray-400">Access the command center. Requires authorized credentials.</p>
                  <Button variant="ghost" className="text-purple-400 group-hover:text-purple-300">
                    Admin Login <Lock className="ml-2 w-4 h-4" />
                  </Button>
                </div>
              </motion.div>
            </div>

            <motion.button
              onClick={() => setView('hero')}
              className="mt-12 text-gray-500 hover:text-gray-300 transition-colors text-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              ← Back to Home
            </motion.button>
          </motion.div>
        )}

        {view === 'admin-login' && (
          <motion.div
            key="admin-login"
            className="relative z-10 max-w-md mx-auto px-4 w-full min-h-[80vh] flex flex-col justify-center pt-20"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4 }}
          >
            <Card className="bg-zinc-900/90 border-zinc-800 backdrop-blur-xl">
              <CardHeader>
                <CardTitle className="text-2xl text-center text-white">Admin Access</CardTitle>
                <CardDescription className="text-center text-zinc-400">
                  Enter your credentials to continue
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleAdminSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <input
                      type="password"
                      value={adminPassword}
                      onChange={(e) => {
                        setAdminPassword(e.target.value);
                        setAdminError("");
                      }}
                      placeholder="Enter password"
                      className="w-full px-3 py-2 bg-black/50 border border-zinc-700 rounded-md text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                      autoFocus
                    />
                    {adminError && (
                      <p className="text-sm text-red-400 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" /> {adminError}
                      </p>
                    )}
                  </div>
                  <Button
                    type="submit"
                    className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                  >
                    Login
                  </Button>
                  <div className="text-center">
                    <button
                      type="button"
                      onClick={() => setView('selection')}
                      className="text-sm text-zinc-500 hover:text-zinc-300 transition-colors"
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

      <AnimatePresence>
        {/* Footer */}
        <div className="absolute bottom-4 left-0 w-full text-center z-20">
          <p className="text-xs text-zinc-500">
            © {new Date().getFullYear()} All rights belong to Zingo Pvt Limited.
          </p>
        </div>
      </AnimatePresence>

      <AnimatePresence>
        {/* Sticky Mobile Bottom CTA */}
        {view === 'hero' && (
          <motion.div 
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            exit={{ y: 100 }}
            className="fixed bottom-0 left-0 right-0 p-4 bg-black/80 backdrop-blur-lg border-t border-white/10 md:hidden z-50 flex gap-2"
          >
            {standalone ? (
              <Button
                onClick={() => setView('selection')}
                size="lg"
                className="bg-white text-black hover:bg-gray-200 transition-all duration-300 rounded-xl w-full text-base font-bold shadow-[0_0_15px_rgba(255,255,255,0.2)]"
              >
                Begin Journey <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            ) : (
              isInstallable ? (
                <Button
                  onClick={promptInstall}
                  size="lg"
                  className="bg-purple-600 hover:bg-purple-700 text-white transition-all duration-300 rounded-xl w-full text-base font-bold shadow-[0_0_15px_rgba(147,51,234,0.4)]"
                >
                  <Download className="mr-2 w-5 h-5" />
                  Install App
                </Button>
              ) : (
                <Button
                  onClick={() => setShowIOSGuide(true)}
                  size="lg"
                  className="bg-purple-600 hover:bg-purple-700 text-white transition-all duration-300 rounded-xl w-full text-base font-bold shadow-[0_0_15px_rgba(147,51,234,0.4)]"
                >
                  <Smartphone className="mr-2 w-5 h-5" />
                  Install App
                </Button>
              )
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom Gradient Fade */}
      <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-black to-transparent pointer-events-none z-10" />
    </div>
  );
}
