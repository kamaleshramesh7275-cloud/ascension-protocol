import { useState, useEffect, useCallback } from "react";
import { getToken, onMessage } from "firebase/messaging";
import { getFCMMessaging } from "@/lib/firebase";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY || "BFz9ob26ZXx7Gt-gWzw2E__SMXz67yJ1dx8lrxCMpp-oTodzkaFUNul88B7Mn77jZoku1nqZogtRxTZRwa1tj6g";
const TOKEN_STORAGE_KEY = "fcm_token";

export type PermissionState = "default" | "granted" | "denied";

/**
 * Retry a function with exponential backoff.
 * Attempts: 2s, 4s, 8s (3 tries total).
 */
async function withRetry<T>(fn: () => Promise<T>, maxRetries = 3): Promise<T> {
    let lastError: unknown;
    for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
            return await fn();
        } catch (err) {
            lastError = err;
            if (attempt < maxRetries - 1) {
                const delay = Math.pow(2, attempt + 1) * 1000; // 2s, 4s, 8s
                console.log(`[Push] Retry ${attempt + 1}/${maxRetries} in ${delay}ms...`);
                await new Promise((resolve) => setTimeout(resolve, delay));
            }
        }
    }
    throw lastError;
}

export function usePushNotifications() {
    const [permission, setPermission] = useState<PermissionState>("default");
    const [isSupported, setIsSupported] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();

    // Check support and current permission on mount
    useEffect(() => {
        const supported =
            typeof window !== "undefined" &&
            "Notification" in window &&
            "serviceWorker" in navigator &&
            "PushManager" in window;
        setIsSupported(supported);
        if (supported) {
            setPermission(Notification.permission as PermissionState);
        }
    }, []);

    const registerToken = useCallback(async () => {
        try {
            const messaging = await getFCMMessaging();
            if (!messaging) return null;

            // Get the active SW registration (from vite-plugin-pwa or fallback)
            const swReg = await navigator.serviceWorker.ready;

            const token = await withRetry(async () => {
                return await getToken(messaging, {
                    vapidKey: VAPID_KEY,
                    serviceWorkerRegistration: swReg,
                });
            });

            if (token) {
                // Save to our server (also with retry)
                await withRetry(async () => {
                    await apiRequest("POST", "/api/push/register", { token });
                });
                localStorage.setItem(TOKEN_STORAGE_KEY, token);
                console.log("[Push] FCM token registered");
            }

            return token;
        } catch (err) {
            console.error("[Push] Failed to get FCM token after retries:", err);
            return null;
        }
    }, []);

    const subscribe = useCallback(async () => {
        if (!isSupported) {
            toast({ title: "Not supported", description: "Your browser doesn't support push notifications.", variant: "destructive" });
            return false;
        }

        setIsLoading(true);
        try {
            const result = await Notification.requestPermission();
            setPermission(result as PermissionState);

            if (result === "granted") {
                await registerToken();
                toast({ title: "🔔 Notifications enabled!", description: "You'll receive push notifications from Ascensions Protocol." });
                return true;
            } else {
                toast({ title: "Notifications blocked", description: "You can enable them in your browser settings.", variant: "destructive" });
                return false;
            }
        } finally {
            setIsLoading(false);
        }
    }, [isSupported, registerToken, toast]);

    const unsubscribe = useCallback(async () => {
        const token = localStorage.getItem(TOKEN_STORAGE_KEY);
        if (token) {
            try {
                await apiRequest("DELETE", "/api/push/unregister", { token });
                localStorage.removeItem(TOKEN_STORAGE_KEY);
            } catch (err) {
                console.error("[Push] Unregister error:", err);
            }
        }
    }, []);

    // Listen for foreground push messages and show a toast
    useEffect(() => {
        if (permission !== "granted") return;
        let unsubFcm: (() => void) | null = null;

        (async () => {
            const messaging = await getFCMMessaging();
            if (!messaging) return;
            unsubFcm = onMessage(messaging, (payload) => {
                const { title, body } = payload.notification || {};
                toast({ title: title || "Ascensions Protocol", description: body || "" });
            });
        })();

        return () => { unsubFcm?.(); };
    }, [permission, toast]);

    return { isSupported, permission, isLoading, subscribe, unsubscribe };
}
