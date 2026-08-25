import { X, Download } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { usePWAInstall } from "@/hooks/usePWAInstall";

export function PWAInstallPrompt() {
  const { isInstallable, isInstalled, promptInstall } = usePWAInstall();

  if (!isInstallable || isInstalled) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -20, scale: 0.95 }}
        className="mb-6 relative overflow-hidden rounded-xl border border-purple-500/30 bg-gradient-to-r from-purple-900/40 via-black to-zinc-900/80 p-4 shadow-lg shadow-purple-900/20"
      >
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20 mix-blend-overlay"></div>
        <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-purple-500/20 text-purple-400">
              <Download className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-semibold text-zinc-100">Install Ascension Protocol</h3>
              <p className="text-sm text-zinc-400">
                Install the app on your device for a faster, full-screen native experience with offline capabilities.
              </p>
            </div>
          </div>
          <div className="flex w-full sm:w-auto items-center gap-2">
            <Button
              onClick={promptInstall}
              className="w-full sm:w-auto bg-purple-600 hover:bg-purple-700 text-white shadow-md shadow-purple-900/50"
            >
              Install App
            </Button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
