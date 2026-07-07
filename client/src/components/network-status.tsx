import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { WifiOff, Wifi } from "lucide-react";

/**
 * Hook to track online/offline status reactively.
 */
export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== "undefined" ? navigator.onLine : true
  );

  useEffect(() => {
    const goOnline = () => setIsOnline(true);
    const goOffline = () => setIsOnline(false);

    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);

    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, []);

  return isOnline;
}

/**
 * Slim banner that slides in when the user goes offline,
 * and briefly shows a "Back online" confirmation when connectivity returns.
 */
export function NetworkStatus() {
  const isOnline = useOnlineStatus();
  const [showReconnected, setShowReconnected] = useState(false);
  const [wasEverOffline, setWasEverOffline] = useState(false);

  useEffect(() => {
    if (!isOnline) {
      setWasEverOffline(true);
      setShowReconnected(false);
    } else if (wasEverOffline) {
      // Just came back online
      setShowReconnected(true);
      const timer = setTimeout(() => setShowReconnected(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [isOnline, wasEverOffline]);

  const shouldShow = !isOnline || showReconnected;

  return (
    <AnimatePresence>
      {shouldShow && (
        <motion.div
          initial={{ y: -40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -40, opacity: 0 }}
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
          className={`fixed top-0 left-0 right-0 z-[100] flex items-center justify-center gap-2 py-2 px-4 text-xs font-semibold tracking-wide ${
            isOnline
              ? "bg-emerald-500/90 text-white backdrop-blur-sm"
              : "bg-amber-500/90 text-black backdrop-blur-sm"
          }`}
          style={{ paddingTop: "max(0.5rem, env(safe-area-inset-top))" }}
        >
          {isOnline ? (
            <>
              <Wifi className="w-3.5 h-3.5" />
              <span>Back online — syncing your progress</span>
            </>
          ) : (
            <>
              <WifiOff className="w-3.5 h-3.5" />
              <span>You're offline — data will sync when you reconnect</span>
            </>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
