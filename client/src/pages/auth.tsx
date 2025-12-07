import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { AlertCircle, ArrowRight, Sparkles, User, Shield, Lock } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function AuthPage() {
  const { user, loading, loginAsGuest } = useAuth();
  const [, setLocation] = useLocation();
  const [view, setView] = useState<'hero' | 'selection' | 'admin-login'>('hero');
  const [adminPassword, setAdminPassword] = useState("");
  const [adminError, setAdminError] = useState("");

  // Navigate based on user type
  useEffect(() => {
    if (user && !loading) {
      if (user.isAnonymous) {
        setLocation("/account-selection");
      }
      // Note: Admin users might not be "logged in" via useAuth if they use the password flow,
      // but if they are logged in via Google and are admins, we could redirect them.
      // For now, we rely on the password flow for admin access.
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
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center relative overflow-hidden selection:bg-purple-500/30">
      {/* Background Glow Effects */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-blue-900/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-purple-900/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-[20%] left-[50%] -translate-x-1/2 w-[40%] h-[40%] bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none" />

      <AnimatePresence mode="wait">
        {view === 'hero' && (
          <motion.div
            key="hero"
            className="relative z-10 max-w-4xl mx-auto px-4 text-center flex flex-col items-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5 }}
          >
            {/* Badge */}
            <motion.div
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/10 bg-white/5 backdrop-blur-sm mb-8"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
            >
              <Sparkles className="w-4 h-4 text-yellow-500" />
              <span className="text-sm font-medium text-gray-300">Project Ascension v1.0</span>
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
              className="text-lg md:text-xl text-gray-400 max-w-2xl mb-10 leading-relaxed"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.8 }}
            >
              Gamify your self-improvement journey. Track your stats, complete quests, and ascend to new tiers of human potential.
            </motion.p>

            {/* CTA Button */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.6, duration: 0.5 }}
            >
              <Button
                onClick={() => setView('selection')}
                size="lg"
                className="bg-white text-black hover:bg-gray-200 hover:scale-105 transition-all duration-300 rounded-full px-8 py-6 text-lg font-semibold shadow-[0_0_20px_rgba(255,255,255,0.3)] hover:shadow-[0_0_30px_rgba(255,255,255,0.5)]"
              >
                Begin Journey <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </motion.div>
          </motion.div>
        )}

        {view === 'selection' && (
          <motion.div
            key="selection"
            className="relative z-10 max-w-5xl mx-auto px-4 w-full flex flex-col items-center"
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
            className="relative z-10 max-w-md mx-auto px-4 w-full"
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

      {/* Bottom Gradient Fade */}
      <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-black to-transparent pointer-events-none" />
    </div>
  );
}
