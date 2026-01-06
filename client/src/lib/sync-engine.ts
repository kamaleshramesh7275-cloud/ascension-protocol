import { queryClient } from "./queryClient";
import { apiRequest } from "./queryClient";

// Types of events we sync
export type SyncEvent =
    | { type: 'XP_GAIN'; amount: number; source: string }
    | { type: 'COIN_GAIN'; amount: number; source: string }
    | { type: 'QUEST_COMPLETE'; questId: string }
    | { type: 'ITEM_PURCHASE'; itemId: string; cost: number }
    | { type: 'FOCUS_SESSION'; duration: number; timestamp: number };

const SYNC_INTERVAL = 15 * 60 * 1000; // 15 Minutes
const STORAGE_KEY = 'ascension_sync_queue';

class SyncEngine {
    private queue: SyncEvent[] = [];
    private timer: NodeJS.Timeout | null = null;

    constructor() {
        this.loadQueue();
        this.startTimer();
        this.setupExitHandlers();
    }

    // Add event to queue and persist
    public add(event: SyncEvent) {
        this.queue.push(event);
        this.saveQueue();
        console.log("[SyncEngine] Event Queued:", event.type, "(Total:", this.queue.length, ")");
    }

    // Load from localStorage on boot
    private loadQueue() {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) {
                this.queue = JSON.parse(stored);
                if (this.queue.length > 0) {
                    console.log("[SyncEngine] Restored", this.queue.length, "events from disk.");
                }
            }
        } catch (e) {
            console.error("[SyncEngine] Failed to load queue", e);
        }
    }

    // Save to localStorage
    private saveQueue() {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.queue));
    }

    // Start the background timer
    private startTimer() {
        this.timer = setInterval(() => {
            if (this.queue.length > 0) {
                this.flush("TIMER");
            }
        }, SYNC_INTERVAL);
    }

    // Send data to server
    public async flush(reason: string = "MANUAL") {
        if (this.queue.length === 0) return;

        const batch = [...this.queue];
        console.log(`[SyncEngine] Flushing ${batch.length} events (${reason})...`);

        try {
            // Optimistic: Clear queue immediately to prevent double-send risk during slow network
            // If fail, we restore.
            this.queue = [];
            this.saveQueue();

            await apiRequest("POST", "/api/sync", { events: batch });

            console.log("[SyncEngine] Sync Successful ✅");

            // Invalidate queries to refresh UI with server state if needed
            queryClient.invalidateQueries({ queryKey: ["/api/user"] });
            queryClient.invalidateQueries({ queryKey: ["/api/quests"] });

        } catch (error) {
            console.error("[SyncEngine] Sync Failed ❌", error);
            // Restore queue on failure
            this.queue = [...batch, ...this.queue];
            this.saveQueue();
        }
    }

    // Reliable Exit Sync (The "Red Button")
    private setupExitHandlers() {
        const handleExit = () => {
            if (this.queue.length === 0) return;

            const payload = JSON.stringify({ events: this.queue });
            const blob = new Blob([payload], { type: 'application/json' });

            // 1. Try Beacon (Most reliable for tiny data)
            const beaconSent = navigator.sendBeacon("/api/sync", blob);

            // 2. Fallback to fetch with keepalive (Reliable for larger data)
            if (!beaconSent) {
                fetch("/api/sync", {
                    method: "POST",
                    body: payload,
                    headers: { "Content-Type": "application/json" },
                    keepalive: true
                });
            }

            console.log("[SyncEngine] Emergency Exit Sync Triggered 🚨");
        };

        // Trigger on visibility change (hiding app) or unload
        document.addEventListener("visibilitychange", () => {
            if (document.visibilityState === "hidden") {
                handleExit();
            }
        });

        // Capture standard unload
        window.addEventListener("beforeunload", handleExit);
    }
}

export const syncEngine = new SyncEngine();
