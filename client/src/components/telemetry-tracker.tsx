import { useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";

// Helper to map route paths to user-friendly tab/page names
export function mapPathToTabName(path: string): string {
  if (path.startsWith("/profile")) return "Profile";
  if (path.startsWith("/library")) return "Library";
  if (path.startsWith("/session")) return "Session Page";
  
  switch (path) {
    case "/dashboard":
      return "Dashboard";
    case "/quests":
      return "Quests";
    case "/roadmap":
      return "Roadmap";
    case "/focus":
      return "Focus Sanctum";
    case "/store":
      return "Store";
    case "/stats":
      return "Stats";
    case "/leaderboard":
      return "Leaderboard";
    case "/partners":
      return "Partners";
    case "/global-chat":
      return "Global Chat";
    case "/contact":
      return "Citadel Support";
    case "/onboarding":
      return "Onboarding";
    case "/admin/dashboard":
      return "Admin Dashboard";
    default:
      return "Other";
  }
}

// Global function to track feature usage
export async function trackFeatureUse(featureName: string, duration: number = 0) {
  try {
    await apiRequest("POST", "/api/telemetry", {
      eventType: "feature_usage",
      eventName: featureName,
      duration,
    });
  } catch (error) {
    console.warn(`[Telemetry] Failed to track feature "${featureName}":`, error);
  }
}

// Bind to window for easy access in legacy or non-hook contexts
if (typeof window !== "undefined") {
  (window as any).trackFeatureUse = trackFeatureUse;
}

export function TelemetryTracker() {
  const [location] = useLocation();
  const { user } = useAuth();
  const locationRef = useRef(location);

  useEffect(() => {
    locationRef.current = location;
  }, [location]);

  useEffect(() => {
    // Only track authenticated users
    if (!user) return;

    const HEARTBEAT_INTERVAL_MS = 10000; // 10 seconds heartbeat
    const HEARTBEAT_DURATION_S = 10;

    const sendHeartbeat = async () => {
      // Only track if document is visible/active (don't track idle background tabs)
      if (document.visibilityState !== "visible") return;

      const tabName = mapPathToTabName(locationRef.current);
      // Skip tracking Admin Dashboard usage so it doesn't clutter normal user stats
      if (tabName === "Admin Dashboard") return;

      try {
        await apiRequest("POST", "/api/telemetry", {
          eventType: "tab_usage",
          eventName: tabName,
          duration: HEARTBEAT_DURATION_S,
        });
      } catch (e) {
        // Silently catch errors to avoid UI disruption
      }
    };

    // Send immediate heartbeat on mount/location change
    sendHeartbeat();

    // Setup periodic heartbeats
    const interval = setInterval(sendHeartbeat, HEARTBEAT_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [user, location]);

  return null; // Renderless tracking component
}
