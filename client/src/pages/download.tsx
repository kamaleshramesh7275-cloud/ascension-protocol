import { useState } from "react";
import { useLocation } from "wouter";
import { 
  Download, Smartphone, CheckCircle2, ArrowRight, ShieldCheck, 
  Zap, Bell, ArrowLeft, GitBranch, Cpu, HardDrive, RefreshCw
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { hapticSuccess, hapticTap } from "@/lib/haptics";

import { isMobilePhoneBrowser } from "@/App";

export default function DownloadPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [downloading, setDownloading] = useState(false);
  const isMobile = isMobilePhoneBrowser();

  const apkDownloadUrl = "/api/download/apk";
  const githubReleaseUrl = "https://github.com/kamaleshramesh7275-cloud/ascension-protocol/releases";

  const handleDownloadClick = () => {
    hapticSuccess();
    setDownloading(true);
    toast({
      title: "Downloading Ascension Protocol APK...",
      description: "File: AscensionProtocol.apk (~10.9 MB). Tap the notification once finished to install.",
    });

    // Trigger direct download
    const link = document.createElement("a");
    link.href = apkDownloadUrl;
    link.setAttribute("download", "AscensionProtocol.apk");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setTimeout(() => setDownloading(false), 3000);
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
            onClick={() => { hapticTap(); setLocation("/"); }}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 border border-cyan-400/40 group-hover:scale-105 transition-transform">
              <Download className="w-5 h-5 text-black font-bold" />
            </div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg text-white tracking-tight">Ascension Protocol</span>
              <span className="text-xs text-cyan-400 font-medium px-2 py-0.5 rounded-full bg-cyan-950/80 border border-cyan-800/60">Android APK</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {isMobile ? (
              <Button
                onClick={handleDownloadClick}
                disabled={downloading}
                size="sm"
                className="bg-cyan-500 hover:bg-cyan-400 text-black font-extrabold text-xs px-4 h-9 rounded-xl shadow-[0_0_15px_rgba(6,182,212,0.3)] flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5 text-black stroke-[2.5]" />
                <span>Install APK</span>
              </Button>
            ) : (
              <>
                <button
                  onClick={() => { hapticTap(); setLocation("/"); }}
                  className="hidden sm:inline-flex items-center gap-1.5 text-xs text-slate-300 hover:text-cyan-400 transition-colors px-3 py-1.5 rounded-lg border border-slate-800 hover:border-cyan-500/40 bg-slate-900/50"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back</span>
                </button>
                <Button
                  onClick={() => { hapticTap(); setLocation("/login"); }}
                  size="sm"
                  variant="outline"
                  className="border-slate-700 bg-slate-900/60 hover:bg-slate-800 text-slate-200 text-xs px-3.5 h-9 rounded-lg"
                >
                  Sign In
                </Button>
                <Button
                  onClick={() => { hapticTap(); setLocation("/account-selection"); }}
                  size="sm"
                  className="bg-cyan-500 hover:bg-cyan-400 text-black font-semibold text-xs px-4 h-9 rounded-lg shadow-[0_0_15px_rgba(6,182,212,0.3)]"
                >
                  Get Started
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 flex-1 max-w-4xl w-full mx-auto px-6 py-12 md:py-16">
        
        {/* Hero Section */}
        <div className="text-center max-w-2xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-cyan-500/30 bg-cyan-950/40 backdrop-blur-md mb-6">
            <Smartphone className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-xs font-semibold text-cyan-300 tracking-wide uppercase">
              Official Android Release • Native Mobile App
            </span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white mb-4 leading-tight">
            Download Ascension Protocol <br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 via-teal-300 to-indigo-300">
              Native Android APK
            </span>
          </h1>

          <p className="text-sm sm:text-base text-slate-300 leading-relaxed mb-8">
            Install the full native Android mobile application with in-app Google Sign-In, instant biometric haptics, lock-screen notifications, and automatic GitHub live updates.
          </p>

          {/* Primary Big Download Button */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button
              onClick={handleDownloadClick}
              disabled={downloading}
              size="lg"
              className="w-full sm:w-auto bg-gradient-to-r from-cyan-500 to-teal-400 hover:from-cyan-400 hover:to-teal-300 text-black font-extrabold text-base py-7 px-10 rounded-2xl shadow-[0_0_35px_rgba(6,182,212,0.5)] flex items-center justify-center gap-3 transition-all hover:scale-[1.02]"
            >
              {downloading ? (
                <>
                  <RefreshCw className="w-6 h-6 animate-spin text-black" />
                  <span>Starting APK Download...</span>
                </>
              ) : (
                <>
                  <Download className="w-6 h-6 text-black stroke-[2.5]" />
                  <span>Download Android APK (10.9 MB)</span>
                </>
              )}
            </Button>

            <Button
              onClick={() => window.open(githubReleaseUrl, "_blank")}
              size="lg"
              variant="outline"
              className="w-full sm:w-auto border-slate-700 bg-slate-900/60 hover:bg-slate-800 text-slate-200 text-sm py-7 px-6 rounded-2xl flex items-center justify-center gap-2"
            >
              <GitBranch className="w-4 h-4 text-cyan-400" />
              <span>GitHub CI/CD Releases</span>
            </Button>
          </div>

          <div className="flex items-center justify-center gap-2 text-xs text-emerald-400 mt-4">
            <CheckCircle2 className="w-4 h-4" />
            <span>Verified clean • Direct package install • Auto-updates on GitHub push</span>
          </div>
        </div>

        {/* APK Technical Specifications Card */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-10">
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 text-center">
            <HardDrive className="w-5 h-5 text-cyan-400 mx-auto mb-1.5" />
            <div className="text-xs text-slate-400">File Size</div>
            <div className="text-sm font-bold text-white mt-0.5">10.9 MB</div>
          </div>
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 text-center">
            <Smartphone className="w-5 h-5 text-indigo-400 mx-auto mb-1.5" />
            <div className="text-xs text-slate-400">Target OS</div>
            <div className="text-sm font-bold text-white mt-0.5">Android 8.0+</div>
          </div>
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 text-center">
            <Cpu className="w-5 h-5 text-teal-400 mx-auto mb-1.5" />
            <div className="text-xs text-slate-400">Architecture</div>
            <div className="text-sm font-bold text-white mt-0.5">Universal (ARM64)</div>
          </div>
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 text-center">
            <RefreshCw className="w-5 h-5 text-emerald-400 mx-auto mb-1.5" />
            <div className="text-xs text-slate-400">Auto-Update</div>
            <div className="text-sm font-bold text-emerald-400 mt-0.5">GitHub Sync</div>
          </div>
        </div>

        {/* 2-Step Direct Installation Guide */}
        <Card className="bg-[#090d16] border-slate-800 backdrop-blur-xl shadow-xl rounded-2xl mb-12">
          <CardHeader>
            <CardTitle className="text-lg sm:text-xl font-bold text-white flex items-center gap-2.5">
              <ShieldCheck className="w-5 h-5 text-cyan-400" />
              <span>How to Install on Your Android Phone</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-4 p-4 rounded-xl bg-slate-900/60 border border-slate-800">
              <div className="w-8 h-8 rounded-lg bg-cyan-500/20 text-cyan-400 font-bold text-sm flex items-center justify-center flex-shrink-0">
                1
              </div>
              <div>
                <h4 className="text-sm font-semibold text-white">Download the APK</h4>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  Tap the <span className="text-cyan-400 font-semibold">"Download Android APK"</span> button above. Your browser will download <code className="text-cyan-300 bg-slate-800/80 px-1.5 py-0.5 rounded text-[11px]">AscensionProtocol.apk</code>.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 rounded-xl bg-slate-900/60 border border-slate-800">
              <div className="w-8 h-8 rounded-lg bg-cyan-500/20 text-cyan-400 font-bold text-sm flex items-center justify-center flex-shrink-0">
                2
              </div>
              <div>
                <h4 className="text-sm font-semibold text-white">Tap to Install</h4>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  Open your phone's notification panel or <span className="text-white font-medium">Downloads</span> folder and tap the file. If prompted by Android, tap <span className="text-white font-semibold">"Settings" → "Allow from this source"</span>, then confirm <span className="text-cyan-400 font-semibold">Install</span>.
                </p>
                <div className="mt-2.5 p-2.5 rounded-lg bg-amber-950/40 border border-amber-600/30 text-[11px] text-amber-300 leading-relaxed">
                  <span className="font-bold text-amber-200">⚠️ First-Time Update Note:</span> If Android shows <em>"App not installed as package conflicts with an existing package"</em>, uninstall the previous version from your home screen first, then install this release. Future updates will install seamlessly without uninstalling.
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* GitHub Auto-Update Pipeline Architecture */}
        <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900/90 via-slate-900/50 to-indigo-950/40 border border-slate-800/80 mb-12">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 flex-shrink-0">
              <GitBranch className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white mb-1">
                Continuous GitHub Live Updates
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Whenever new code or features are pushed to GitHub (<code className="text-indigo-300">main</code>), the CI/CD pipeline compiles the new version and updates the application package automatically. The in-app updater detects updates on launch and keeps your mobile experience up to date.
              </p>
            </div>
          </div>
        </div>

        {/* Bottom Action Strip */}
        <div className="text-center">
          <Button
            onClick={handleDownloadClick}
            size="lg"
            className="bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-sm py-5 px-8 rounded-xl shadow-[0_0_20px_rgba(6,182,212,0.3)]"
          >
            Download AscensionProtocol.apk Now <ArrowRight className="w-4 h-4 ml-1.5" />
          </Button>
        </div>

      </main>

      {/* Footer */}
      <footer className="relative z-20 border-t border-slate-900/80 bg-[#020617] px-6 py-8 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-center gap-x-6 gap-y-2 mb-3">
          {!isMobile && (
            <>
              <button onClick={() => setLocation("/")} className="hover:text-cyan-400 transition-colors">Home</button>
              <span>•</span>
              <button onClick={() => setLocation("/about")} className="hover:text-cyan-400 transition-colors">About</button>
              <span>•</span>
              <button onClick={() => setLocation("/contact")} className="hover:text-cyan-400 transition-colors">Contact</button>
              <span>•</span>
            </>
          )}
          <button onClick={() => setLocation("/privacy")} className="hover:text-cyan-400 transition-colors">Privacy Policy</button>
          <span>•</span>
          <button onClick={() => setLocation("/terms")} className="hover:text-cyan-400 transition-colors">Terms of Service</button>
        </div>
        <p className="text-slate-600">© {new Date().getFullYear()} Ascension Protocol. All rights reserved.</p>
      </footer>
    </div>
  );
}
