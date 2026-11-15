import { useState } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { 
  Download, Smartphone, Apple, Monitor, QrCode, CheckCircle2, 
  ArrowRight, ShieldCheck, Zap, Bell, WifiOff, ExternalLink,
  ChevronRight, ArrowLeft, RefreshCw
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { usePWAInstall } from "@/hooks/usePWAInstall";
import { useToast } from "@/hooks/use-toast";

export default function DownloadPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { isInstallable, isInstalled, promptInstall } = usePWAInstall();
  const [activePlatform, setActivePlatform] = useState<"android" | "ios" | "desktop">("android");
  const [copiedUrl, setCopiedUrl] = useState(false);

  const currentUrl = typeof window !== "undefined" ? window.location.origin : "https://ascensions.in";

  const handleCopyLink = () => {
    navigator.clipboard.writeText(currentUrl);
    setCopiedUrl(true);
    toast({
      title: "Link Copied",
      description: "Direct web app URL copied to your clipboard.",
    });
    setTimeout(() => setCopiedUrl(false), 2500);
  };

  const handleInstallClick = async () => {
    if (isInstallable) {
      await promptInstall();
    } else if (isInstalled) {
      toast({
        title: "App Already Installed",
        description: "Ascension Protocol is already installed on this device. Open it from your home screen or applications menu.",
      });
    } else {
      toast({
        title: "Manual Installation Required",
        description: "Follow the platform instructions below to add Ascension Protocol to your home screen.",
      });
    }
  };

  return (
    <div className="min-h-screen bg-[#020617] text-slate-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-black">
      {/* Background Gradients */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-to-b from-cyan-600/15 via-indigo-600/10 to-transparent blur-3xl opacity-70" />
        <div className="absolute -bottom-40 right-0 w-[500px] h-[500px] bg-cyan-900/10 blur-3xl" />
      </div>

      {/* Top Header */}
      <header className="relative z-20 border-b border-slate-800/80 bg-[#020617]/90 backdrop-blur-md px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div 
            onClick={() => setLocation("/")}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 border border-cyan-400/40 group-hover:scale-105 transition-transform">
              <Download className="w-5 h-5 text-black font-bold" />
            </div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg text-white tracking-tight">Ascension Protocol</span>
              <span className="text-xs text-cyan-400 font-medium px-2 py-0.5 rounded-full bg-cyan-950/80 border border-cyan-800/60 hidden sm:inline-block">App Hub</span>
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
              onClick={() => setLocation("/about")}
              className="hidden md:inline-flex items-center text-xs text-slate-300 hover:text-cyan-400 transition-colors px-3 py-1.5"
            >
              About
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
              Get Started
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 flex-1 max-w-6xl w-full mx-auto px-6 py-12 md:py-16">
        
        {/* Hero Section */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-cyan-500/30 bg-cyan-950/40 backdrop-blur-md mb-6">
            <Smartphone className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-xs font-semibold text-cyan-300 tracking-wide uppercase">
              Progressive Web App Architecture
            </span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white mb-4 leading-tight">
            Install Ascension Protocol <br className="hidden sm:inline" />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 via-teal-300 to-indigo-300">
              On Any Mobile or Desktop Device
            </span>
          </h1>

          <p className="text-sm sm:text-base text-slate-300 leading-relaxed mb-8">
            Experience ultra-fast loading, full offline quest tracking, lock-screen notifications, and zero App Store bloat. Install directly from your browser in under 5 seconds.
          </p>

          {/* Primary Quick Action Button */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button
              onClick={handleInstallClick}
              size="lg"
              className="w-full sm:w-auto bg-cyan-500 hover:bg-cyan-400 text-black font-semibold text-sm sm:text-base py-6 px-8 rounded-xl shadow-[0_0_25px_rgba(6,182,212,0.4)] flex items-center justify-center gap-2"
            >
              {isInstalled ? (
                <>
                  <CheckCircle2 className="w-5 h-5 text-black" />
                  <span>App Already Installed</span>
                </>
              ) : isInstallable ? (
                <>
                  <Download className="w-5 h-5 text-black" />
                  <span>Install App to This Device</span>
                </>
              ) : (
                <>
                  <Download className="w-5 h-5 text-black" />
                  <span>Add to Home Screen</span>
                </>
              )}
            </Button>

            <Button
              onClick={handleCopyLink}
              size="lg"
              variant="outline"
              className="w-full sm:w-auto border-slate-700 bg-slate-900/60 hover:bg-slate-800 text-slate-200 text-sm sm:text-base py-6 px-6 rounded-xl flex items-center justify-center gap-2"
            >
              {copiedUrl ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>URL Copied!</span>
                </>
              ) : (
                <>
                  <ExternalLink className="w-4 h-4 text-slate-400" />
                  <span>Copy Web App Link</span>
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Platform Selection Tabs */}
        <div className="flex items-center justify-center gap-2 max-w-md mx-auto mb-10 p-1.5 rounded-2xl bg-slate-900/70 border border-slate-800 backdrop-blur-md">
          <button
            onClick={() => setActivePlatform("android")}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
              activePlatform === "android"
                ? "bg-cyan-500 text-black shadow-[0_0_15px_rgba(6,182,212,0.3)]"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Smartphone className="w-4 h-4" />
            <span>Android</span>
          </button>

          <button
            onClick={() => setActivePlatform("ios")}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
              activePlatform === "ios"
                ? "bg-cyan-500 text-black shadow-[0_0_15px_rgba(6,182,212,0.3)]"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Apple className="w-4 h-4" />
            <span>iOS / Apple</span>
          </button>

          <button
            onClick={() => setActivePlatform("desktop")}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
              activePlatform === "desktop"
                ? "bg-cyan-500 text-black shadow-[0_0_15px_rgba(6,182,212,0.3)]"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Monitor className="w-4 h-4" />
            <span>Desktop</span>
          </button>
        </div>

        {/* Installation Instructions & QR Section */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start mb-16">
          
          {/* Step Instructions Card */}
          <div className="lg:col-span-7">
            <Card className="bg-[#090d16] border-slate-800 backdrop-blur-xl shadow-xl rounded-2xl">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                    {activePlatform === "android" && <Smartphone className="w-5 h-5" />}
                    {activePlatform === "ios" && <Apple className="w-5 h-5" />}
                    {activePlatform === "desktop" && <Monitor className="w-5 h-5" />}
                  </div>
                  <div>
                    <CardTitle className="text-xl font-bold text-white">
                      {activePlatform === "android" && "Android Installation Guide"}
                      {activePlatform === "ios" && "iPhone & iPad Installation Guide"}
                      {activePlatform === "desktop" && "Desktop App Installation (Mac & Windows)"}
                    </CardTitle>
                    <CardDescription className="text-xs text-slate-400">
                      Zero app store downloads, updates automatically in background
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4 pt-2">
                {activePlatform === "android" && (
                  <div className="space-y-3">
                    <div className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-900/60 border border-slate-800">
                      <div className="w-6 h-6 rounded-lg bg-cyan-500/20 text-cyan-400 font-bold text-xs flex items-center justify-center flex-shrink-0 mt-0.5">
                        1
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-white">Open in Chrome or Brave</h4>
                        <p className="text-xs text-slate-400 mt-0.5">
                          Navigate to <span className="text-cyan-400 font-mono">ascensions.in</span> on your Android mobile browser.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-900/60 border border-slate-800">
                      <div className="w-6 h-6 rounded-lg bg-cyan-500/20 text-cyan-400 font-bold text-xs flex items-center justify-center flex-shrink-0 mt-0.5">
                        2
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-white">Tap the 3-Dot Browser Menu</h4>
                        <p className="text-xs text-slate-400 mt-0.5">
                          Tap the three vertical dots located in the top-right corner of your browser.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-900/60 border border-slate-800">
                      <div className="w-6 h-6 rounded-lg bg-cyan-500/20 text-cyan-400 font-bold text-xs flex items-center justify-center flex-shrink-0 mt-0.5">
                        3
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-white">Select "Install App" or "Add to Home Screen"</h4>
                        <p className="text-xs text-slate-400 mt-0.5">
                          Confirm the install prompt. An icon will appear on your home screen and app drawer immediately.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {activePlatform === "ios" && (
                  <div className="space-y-3">
                    <div className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-900/60 border border-slate-800">
                      <div className="w-6 h-6 rounded-lg bg-cyan-500/20 text-cyan-400 font-bold text-xs flex items-center justify-center flex-shrink-0 mt-0.5">
                        1
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-white">Open in Apple Safari</h4>
                        <p className="text-xs text-slate-400 mt-0.5">
                          Apple requires Safari for PWA installation. Visit <span className="text-cyan-400 font-mono">ascensions.in</span> in Safari.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-900/60 border border-slate-800">
                      <div className="w-6 h-6 rounded-lg bg-cyan-500/20 text-cyan-400 font-bold text-xs flex items-center justify-center flex-shrink-0 mt-0.5">
                        2
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-white">Tap the "Share" Button</h4>
                        <p className="text-xs text-slate-400 mt-0.5">
                          Look for the square icon with an arrow pointing upward at the bottom bar of Safari.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-900/60 border border-slate-800">
                      <div className="w-6 h-6 rounded-lg bg-cyan-500/20 text-cyan-400 font-bold text-xs flex items-center justify-center flex-shrink-0 mt-0.5">
                        3
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-white">Tap "Add to Home Screen"</h4>
                        <p className="text-xs text-slate-400 mt-0.5">
                          Scroll down the share sheet and tap <span className="text-white font-semibold">"Add to Home Screen"</span>, then tap <span className="text-white font-semibold">"Add"</span>.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {activePlatform === "desktop" && (
                  <div className="space-y-3">
                    <div className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-900/60 border border-slate-800">
                      <div className="w-6 h-6 rounded-lg bg-cyan-500/20 text-cyan-400 font-bold text-xs flex items-center justify-center flex-shrink-0 mt-0.5">
                        1
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-white">Open in Chrome or Edge</h4>
                        <p className="text-xs text-slate-400 mt-0.5">
                          Launch <span className="text-cyan-400 font-mono">ascensions.in</span> on your desktop browser.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-900/60 border border-slate-800">
                      <div className="w-6 h-6 rounded-lg bg-cyan-500/20 text-cyan-400 font-bold text-xs flex items-center justify-center flex-shrink-0 mt-0.5">
                        2
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-white">Click Install Icon in Address Bar</h4>
                        <p className="text-xs text-slate-400 mt-0.5">
                          Look for the install monitor icon on the right side of the address bar next to the bookmark star.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-900/60 border border-slate-800">
                      <div className="w-6 h-6 rounded-lg bg-cyan-500/20 text-cyan-400 font-bold text-xs flex items-center justify-center flex-shrink-0 mt-0.5">
                        3
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-white">Launch as Standalone App</h4>
                        <p className="text-xs text-slate-400 mt-0.5">
                          Runs in its own clean window without browser tabs or address bar clutter.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Scan to Phone QR Card */}
          <div className="lg:col-span-5">
            <Card className="bg-[#090d16] border-slate-800 backdrop-blur-xl shadow-xl rounded-2xl text-center">
              <CardHeader>
                <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 mx-auto mb-1">
                  <QrCode className="w-5 h-5" />
                </div>
                <CardTitle className="text-lg font-bold text-white">Scan from Mobile Camera</CardTitle>
                <CardDescription className="text-xs text-slate-400">
                  Instantly open and install on your smartphone
                </CardDescription>
              </CardHeader>

              <CardContent className="flex flex-col items-center">
                <div className="p-3 bg-white rounded-2xl shadow-xl shadow-cyan-500/10 mb-4">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(currentUrl)}&color=020617&bgcolor=ffffff`}
                    alt="Scan to open Ascension Protocol"
                    className="w-44 h-44 object-contain rounded-lg"
                  />
                </div>

                <div className="text-xs text-slate-400 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Point camera to load <span className="text-white font-medium">ascensions.in</span></span>
                </div>
              </CardContent>
            </Card>
          </div>

        </div>

        {/* PWA Performance & Architectural Advantages */}
        <div className="mb-16">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Why Progressive Web Architecture?
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-2">
              Built for speed, sovereign privacy, and continuous offline reliability.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800 hover:border-cyan-500/30 transition-all">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 mb-4">
                <WifiOff className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white mb-1.5">100% Offline Capable</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Log workouts, complete daily quests, and run focus sprints with zero connectivity. Syncs automatically when back online.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800 hover:border-cyan-500/30 transition-all">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-4">
                <Zap className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white mb-1.5">Instant Boot (<span className="font-mono">1.2MB</span>)</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                No 150MB store downloads. Instant launch from cache with high frame rate native animations and low battery drain.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800 hover:border-cyan-500/30 transition-all">
              <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400 mb-4">
                <Bell className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white mb-1.5">Lock-Screen Reminders</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Stay accountable with daily quest reset countdowns, squad notifications, and recovery alerts right on your phone.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800 hover:border-cyan-500/30 transition-all">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mb-4">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white mb-1.5">Zero Third-Party Store Tax</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                No app store surveillance, advertising trackers, or middleman cut. Direct connection to your personal Ascension system.
              </p>
            </div>
          </div>
        </div>

        {/* Bottom CTA Card */}
        <div className="w-full max-w-4xl mx-auto p-8 sm:p-10 rounded-3xl bg-gradient-to-br from-cyan-950/60 to-slate-900 border border-cyan-500/40 text-center relative overflow-hidden shadow-2xl">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-3">
            Ready to Initialize Your System?
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 max-w-lg mx-auto mb-6">
            Create your account in under 60 seconds and start tracking your real-life attributes today.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button
              onClick={() => setLocation("/account-selection")}
              className="w-full sm:w-auto bg-cyan-500 hover:bg-cyan-400 text-black font-semibold text-sm py-5 px-7 rounded-xl shadow-[0_0_20px_rgba(6,182,212,0.4)]"
            >
              Awaken Your Account <ArrowRight className="w-4 h-4 ml-1.5" />
            </Button>
            <Button
              onClick={() => setLocation("/login")}
              variant="outline"
              className="w-full sm:w-auto border-slate-700 bg-slate-900/60 hover:bg-slate-800 text-slate-200 text-sm py-5 px-6 rounded-xl"
            >
              Sign In to Existing Account
            </Button>
          </div>
        </div>

      </main>

      {/* Footer */}
      <footer className="relative z-20 border-t border-slate-900/80 bg-[#020617] px-6 py-8 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-center gap-x-6 gap-y-2 mb-3">
          <button onClick={() => setLocation("/")} className="hover:text-cyan-400 transition-colors">Home</button>
          <span>•</span>
          <button onClick={() => setLocation("/about")} className="hover:text-cyan-400 transition-colors">About</button>
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
