import { useState, useEffect } from "react";
import { AlertTriangle, ExternalLink, X, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { detectInAppBrowser, breakoutToNativeBrowser, IABDetectionResult } from "@/lib/iab-detector";

interface InAppBrowserBannerProps {
  onDismiss?: () => void;
  className?: string;
}

export function InAppBrowserBanner({ onDismiss, className = "" }: InAppBrowserBannerProps) {
  const [iabInfo, setIabInfo] = useState<IABDetectionResult | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const result = detectInAppBrowser();
    setIabInfo(result);
  }, []);

  if (!iabInfo || !iabInfo.isInApp || dismissed) {
    return null;
  }

  const handleDismiss = () => {
    setDismissed(true);
    onDismiss?.();
  };

  return (
    <div
      className={`rounded-xl border border-amber-500/40 bg-amber-950/30 backdrop-blur-md p-4 text-amber-200 shadow-[0_0_20px_rgba(245,158,11,0.15)] relative overflow-hidden transition-all ${className}`}
    >
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-lg bg-amber-500/20 text-amber-400 flex-shrink-0 mt-0.5">
          <AlertTriangle className="w-5 h-5" />
        </div>

        <div className="flex-1 space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-sm text-amber-300 font-mono tracking-tight">
              {iabInfo.appName ? `${iabInfo.appName} Webview Detected` : "In-App Browser Detected"}
            </h4>
            <button
              onClick={handleDismiss}
              className="text-amber-400/60 hover:text-amber-200 p-1 -mr-1"
              aria-label="Dismiss warning"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <p className="text-xs text-amber-200/80 leading-relaxed font-mono">
            Google blocks authentication inside embedded social apps. For Google Sign-In, please switch to your standard browser.
          </p>

          <div className="pt-1 flex flex-wrap items-center gap-2">
            {iabInfo.isAndroid && (
              <Button
                type="button"
                size="sm"
                onClick={() => breakoutToNativeBrowser()}
                className="bg-amber-500 hover:bg-amber-400 text-black font-mono font-bold text-xs h-8 px-3 shadow"
              >
                <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
                Open in Chrome
              </Button>
            )}

            {iabInfo.isIOS && (
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-mono">
                <Smartphone className="w-3.5 h-3.5" />
                <span>Tap <strong>•••</strong> & select <strong>Open in Safari</strong></span>
              </div>
            )}

            <span className="text-[11px] text-amber-400/70 font-mono">
              (Username/Password still works here)
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

