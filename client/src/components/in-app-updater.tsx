import { useState, useEffect } from "react";
import { Download, RefreshCw, X, Sparkles } from "lucide-react";
import { Capacitor } from "@capacitor/core";
import { App as CapApp } from "@capacitor/app";
import { hapticSuccess, hapticTap } from "@/lib/haptics";

const CURRENT_APP_VERSION = "1.0.2";

export function InAppUpdater() {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [newVersion, setNewVersion] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  const checkForUpdates = async () => {
    try {
      const response = await fetch("/api/version", { cache: "no-store" });
      if (!response.ok) return;

      const data = await response.json();
      const serverVersion = data.version;

      // If server version is newer or if asset hash changed
      if (serverVersion && serverVersion !== CURRENT_APP_VERSION) {
        setNewVersion(serverVersion);
        setUpdateAvailable(true);
      }
    } catch {
      // Offline or network error - silent
    }
  };

  useEffect(() => {
    // Initial check on mount
    checkForUpdates();

    // Check periodically every 15 minutes
    const interval = setInterval(checkForUpdates, 15 * 60 * 1000);

    // Check when mobile app resumes from background
    let appStateListener: any;
    if (Capacitor.isNativePlatform()) {
      CapApp.addListener("appStateChange", (state) => {
        if (state.isActive) {
          checkForUpdates();
        }
      }).then((handle) => {
        appStateListener = handle;
      });
    }

    return () => {
      clearInterval(interval);
      if (appStateListener) {
        appStateListener.remove();
      }
    };
  }, []);

  const handleApplyUpdate = () => {
    hapticSuccess();
    setIsUpdating(true);

    if (Capacitor.isNativePlatform()) {
      // In mobile app: Trigger APK download & package installation
      window.open("/api/download/apk", "_system");
      setTimeout(() => setIsUpdating(false), 2000);
    } else {
      // In web browser: Hard refresh & reload latest bundle
      if ("serviceWorker" in navigator) {
        navigator.serviceWorker.getRegistrations().then((registrations) => {
          for (const registration of registrations) {
            registration.update();
          }
        });
      }
      setTimeout(() => {
        window.location.reload();
      }, 500);
    }
  };

  if (!updateAvailable || dismissed) return null;

  return (
    <div className="fixed top-3 left-1/2 -translate-x-1/2 z-[9999] w-[92%] max-w-md animate-in fade-in slide-in-from-top-4 duration-300 pointer-events-auto">
      <div className="p-3.5 rounded-2xl bg-slate-950/95 border border-cyan-500/50 shadow-[0_10px_30px_rgba(6,182,212,0.3)] backdrop-blur-xl flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center flex-shrink-0 text-cyan-400">
            <Sparkles className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <div className="text-xs font-bold text-white flex items-center gap-1.5">
              <span>System Update Available</span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 bg-cyan-950 text-cyan-300 border border-cyan-800 rounded">
                v{newVersion || "latest"}
              </span>
            </div>
            <div className="text-[11px] text-slate-400">
              {Capacitor.isNativePlatform() 
                ? "Tap to install the latest APK update." 
                : "New build pushed to GitHub. Tap to reload."}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={handleApplyUpdate}
            disabled={isUpdating}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black text-xs font-bold shadow-md shadow-cyan-500/30 transition-transform active:scale-95"
          >
            {isUpdating ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Download className="w-3.5 h-3.5 stroke-[2.5]" />
            )}
            <span>Update</span>
          </button>
          <button
            onClick={() => { hapticTap(); setDismissed(true); }}
            className="w-7 h-7 rounded-lg text-slate-400 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
