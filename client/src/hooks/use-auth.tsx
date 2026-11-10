import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { get, set, del } from "idb-keyval";

// Simplified User interface (no Firebase types)
export interface User {
  id?: string;
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  isAnonymous: boolean;
  coins?: number;
  activeTitle?: string | null;
  activeBadgeId?: string | null;
  tier?: string;
  theme?: string;
  isTrial?: boolean;
  trialEndsAt?: string;
  isPremium?: boolean;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: Error | null;
  loginAsGuest: (name?: string) => Promise<void>;
  loginLocal: (username: string, userId: string, firebaseUid: string) => Promise<void>;
  loginGoogle: (userId: string, firebaseUid: string, username?: string) => Promise<void>;
  refreshUser: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Helper for dual-layer storage (ITP & Partitioned Cookie Hardening)
async function persistTokens(guestUid: string, userId?: string, username?: string) {
  try {
    localStorage.setItem("guest_uid", guestUid);
    await set("guest_uid", guestUid);
    if (userId) {
      localStorage.setItem("userId", userId);
      await set("userId", userId);
    }
    if (username) {
      localStorage.setItem("username", username);
      await set("username", username);
    }
  } catch (e) {
    console.warn("[Auth Storage] Error persisting token mirror:", e);
  }
}

async function clearPersistedTokens() {
  try {
    localStorage.removeItem("guest_uid");
    localStorage.removeItem("username");
    localStorage.removeItem("userId");
    await del("guest_uid");
    await del("userId");
    await del("username");
  } catch (e) {
    console.warn("[Auth Storage] Error clearing token mirror:", e);
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const checkAuth = useCallback(async () => {
    try {
      // 1. Check localStorage first
      let localUid = localStorage.getItem("guest_uid");
      let username = localStorage.getItem("username");
      let userId = localStorage.getItem("userId");

      // 2. Safari ITP / Cookie partitioning fallback: Check IndexedDB mirror
      if (!localUid) {
        try {
          localUid = (await get<string>("guest_uid")) || null;
          username = username || (await get<string>("username")) || null;
          userId = userId || (await get<string>("userId")) || null;
          if (localUid) {
            localStorage.setItem("guest_uid", localUid);
            if (username) localStorage.setItem("username", username);
            if (userId) localStorage.setItem("userId", userId);
          }
        } catch {
          // non-critical idb lookup failure
        }
      }

      if (localUid) {
        // Optimistically set user from cached tokens
        const localUser: User = {
          id: userId || undefined,
          uid: localUid,
          email: username ? `${username}@local.ascension` : `${localUid}@guest.com`,
          displayName: username || "Guest Ascendant",
          photoURL: null,
          isAnonymous: !username,
        };
        setUser(localUser);

        // Fetch full user details from backend to ensure we have the ID and latest stats
        try {
          const res = await apiRequest("GET", "/api/user");
          if (res.ok) {
            const userData = await res.json();
            setUser({
              id: userData.id,
              uid: userData.firebaseUid,
              email: userData.email,
              displayName: userData.name,
              photoURL: userData.avatarUrl,
              isAnonymous: !userData.name,
              coins: userData.coins,
              activeTitle: userData.activeTitle,
              activeBadgeId: userData.activeBadgeId,
              tier: userData.tier,
              theme: userData.theme,
              isTrial: userData.isTrial,
              trialEndsAt: userData.trialEndsAt,
              isPremium: userData.isPremium,
            });
            await persistTokens(userData.firebaseUid, userData.id, userData.name);
          }
        } catch (fetchErr: any) {
          console.error("Failed to fetch user details:", fetchErr);
          // If the user doesn't exist (404) or is unauthorized (401), clear the session
          if (fetchErr.message && (fetchErr.message.includes("404") || fetchErr.message.includes("401"))) {
            console.log("[Debug] User not found or unauthorized - clearing invalid session.");
            await clearPersistedTokens();
            queryClient.clear();
            setUser(null);
          }
        }
      } else {
        setUser(null);
      }
    } catch (err) {
      console.error("Auth initialization error:", err);
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // Standalone PWA Window Isolation: revalidate auth when returning from external browser or background
  useEffect(() => {
    const handleRevalidation = async () => {
      if (document.visibilityState === "visible") {
        const uid = localStorage.getItem("guest_uid") || (await get<string>("guest_uid"));
        if (uid && (!user || user.uid !== uid)) {
          console.log("[PWA Focus] App foregrounded, re-verifying active session...");
          await checkAuth();
        }
      }
    };

    document.addEventListener("visibilitychange", handleRevalidation);
    window.addEventListener("pageshow", handleRevalidation);
    return () => {
      document.removeEventListener("visibilitychange", handleRevalidation);
      window.removeEventListener("pageshow", handleRevalidation);
    };
  }, [user, checkAuth]);

  // Safety timeout: If loading takes longer than 5 seconds, clear session to prevent freeze
  useEffect(() => {
    const timer = setTimeout(() => {
      if (loading) {
        console.warn("Auth loading timed out. Resetting session.");
        clearPersistedTokens();
        queryClient.clear();
        setUser(null);
        setLoading(false);
      }
    }, 5000);
    return () => clearTimeout(timer);
  }, [loading]);

  const loginAsGuest = async (name?: string) => {
    try {
      setLoading(true);
      const guestId = `guest_${Math.random().toString(36).substring(2, 15)}`;
      const guestUser: User = {
        uid: guestId,
        email: `${guestId}@guest.com`,
        displayName: name || "Guest Ascendant",
        photoURL: null,
        isAnonymous: true,
      };

      const res = await apiRequest("POST", "/api/auth/register", {
        firebaseUid: guestUser.uid,
        name: guestUser.displayName,
        email: guestUser.email,
        avatarUrl: guestUser.photoURL,
      });
      const registeredUser = await res.json();

      await persistTokens(guestId, registeredUser.id);
      if (registeredUser.id) {
        guestUser.id = registeredUser.id;
      }

      setUser(guestUser);
    } catch (error) {
      console.error("Guest login error:", error);
      setError(error instanceof Error ? error : new Error("Guest login failed"));
    } finally {
      setLoading(false);
    }
  };

  const loginLocal = async (username: string, userId: string, firebaseUid: string) => {
    try {
      setLoading(true);
      const localUser: User = {
        id: userId,
        uid: firebaseUid,
        email: `${username}@local.ascension`,
        displayName: username,
        photoURL: null,
        isAnonymous: false,
      };

      setUser(localUser);
      await persistTokens(firebaseUid, userId, username);
    } catch (error) {
      console.error("Local login error:", error);
      setError(error instanceof Error ? error : new Error("Local login failed"));
    } finally {
      setLoading(false);
    }
  };

  const loginGoogle = async (userId: string, firebaseUid: string, username?: string) => {
    try {
      setLoading(true);
      await persistTokens(firebaseUid, userId, username);

      const res = await apiRequest("GET", "/api/user");
      if (res.ok) {
        const userData = await res.json();
        setUser({
          id: userData.id,
          uid: userData.firebaseUid,
          email: userData.email,
          displayName: userData.name,
          photoURL: userData.avatarUrl,
          isAnonymous: false,
          coins: userData.coins,
          activeTitle: userData.activeTitle,
          activeBadgeId: userData.activeBadgeId,
          tier: userData.tier,
          theme: userData.theme,
          isTrial: userData.isTrial,
          trialEndsAt: userData.trialEndsAt,
          isPremium: userData.isPremium,
        });
        await persistTokens(userData.firebaseUid, userData.id, userData.name);
      }
    } catch (error) {
      console.error("Google login context error:", error);
      setError(error instanceof Error ? error : new Error("Google login failed"));
    } finally {
      setLoading(false);
    }
  };

  const refreshUser = async () => {
    try {
      const res = await apiRequest("GET", "/api/user");
      if (res.ok) {
        const userData = await res.json();
        setUser({
          id: userData.id,
          uid: userData.firebaseUid,
          email: userData.email,
          displayName: userData.name,
          photoURL: userData.avatarUrl,
          isAnonymous: !userData.name,
          coins: userData.coins,
          activeTitle: userData.activeTitle,
          activeBadgeId: userData.activeBadgeId,
          tier: userData.tier,
          theme: userData.theme,
          isTrial: userData.isTrial,
          trialEndsAt: userData.trialEndsAt,
          isPremium: userData.isPremium,
        });
        await persistTokens(userData.firebaseUid, userData.id, userData.name);
      }
    } catch (err) {
      console.warn("refreshUser error:", err);
    }
  };

  const signOut = async () => {
    try {
      await clearPersistedTokens();
      queryClient.clear();
      setUser(null);
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  return (
    <AuthContext.Provider
      value={{ user, loading, error, loginAsGuest, loginLocal, loginGoogle, refreshUser, signOut }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};
