import { useState, useEffect, useCallback } from "react";

/**
 * Hook that detects when a new service worker is waiting to activate.
 * Returns state & a function to apply the update (skip waiting + reload).
 *
 * Works with vite-plugin-pwa's `registerType: 'prompt'` mode, but also
 * works generically with any SW that supports the SKIP_WAITING message.
 */
export function useSwUpdate() {
  const [needRefresh, setNeedRefresh] = useState(false);
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    // Try to import vite-plugin-pwa's virtual module
    // Falls back to manual SW detection if not available
    const setupPwaUpdate = async () => {
      try {
        // vite-plugin-pwa provides this virtual module
        const { registerSW } = await import("virtual:pwa-register");
        
        const updateSW = registerSW({
          onNeedRefresh() {
            setNeedRefresh(true);
          },
          onOfflineReady() {
            console.log("[SW] App is ready for offline use");
          },
        });

        // Store the update function for later use
        (window as any).__pwaUpdateSW = updateSW;
      } catch {
        // Fallback: manually detect waiting SW
        const reg = await navigator.serviceWorker.getRegistration();
        if (reg) {
          setRegistration(reg);

          // Check if there's already a waiting worker
          if (reg.waiting) {
            setNeedRefresh(true);
          }

          // Listen for new workers
          reg.addEventListener("updatefound", () => {
            const newWorker = reg.installing;
            if (!newWorker) return;

            newWorker.addEventListener("statechange", () => {
              if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
                setNeedRefresh(true);
              }
            });
          });
        }
      }
    };

    setupPwaUpdate();
  }, []);

  const applyUpdate = useCallback(() => {
    // Try vite-plugin-pwa's update function first
    const pwaUpdate = (window as any).__pwaUpdateSW;
    if (pwaUpdate) {
      pwaUpdate(true); // true = reloadPage
      return;
    }

    // Fallback: manual skip waiting
    if (registration?.waiting) {
      registration.waiting.postMessage({ type: "SKIP_WAITING" });

      // Reload once the new SW takes over
      let refreshing = false;
      navigator.serviceWorker.addEventListener("controllerchange", () => {
        if (!refreshing) {
          refreshing = true;
          window.location.reload();
        }
      });
    }
  }, [registration]);

  const dismissUpdate = useCallback(() => {
    setNeedRefresh(false);
  }, []);

  return { needRefresh, applyUpdate, dismissUpdate };
}
