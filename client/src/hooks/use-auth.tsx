import { createContext, useContext, useEffect, useState } from "react";
import { apiRequest, queryClient } from "@/lib/queryClient";

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
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: Error | null;
  loginAsGuest: (name?: string) => Promise<void>;
  loginLocal: (username: string, userId: string, firebaseUid: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Check for local guest/local-auth user
        const localUid = localStorage.getItem("guest_uid");
        const username = localStorage.getItem("username");
        const userId = localStorage.getItem("userId");

        if (localUid) {
          // Optimistically set user from localStorage
          const localUser: User = {
            id: userId || undefined,
            uid: localUid,
            email: username ? `${username}@local.ascension` : `${localUid}@guest.com`,
            displayName: username || "Guest Ascendant",
            photoURL: null,
            isAnonymous: !username,
          };
          setUser(localUser);

          // Fetch full user details from backend to ensure we have the ID
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
              });
              // Update localStorage with the correct ID
              localStorage.setItem("userId", userData.id);
            }
          } catch (fetchErr: any) {
            console.error("Failed to fetch user details:", fetchErr);
            // If the user doesn't exist (404) or is unauthorized (401), clear the session
            if (fetchErr.message && (fetchErr.message.includes("404") || fetchErr.message.includes("401"))) {
              console.log("User not found or unauthorized - clearing invalid session");
              localStorage.removeItem("guest_uid");
              localStorage.removeItem("username");
              localStorage.removeItem("userId");
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
    };

    checkAuth();
  }, []);

  const loginAsGuest = async (name?: string) => {
    try {
      setLoading(true);
      // Create a mock guest user
      const guestId = `guest_${Math.random().toString(36).substring(2, 15)}`;
      const guestUser: User = {
        uid: guestId,
        email: `${guestId}@guest.com`,
        displayName: name || "Guest Ascendant",
        photoURL: null,
        isAnonymous: true,
      };

      // Sync with backend (create user record)
      const res = await apiRequest("POST", "/api/auth/register", {
        firebaseUid: guestUser.uid,
        name: guestUser.displayName,
        email: guestUser.email,
        avatarUrl: guestUser.photoURL,
      });
      const registeredUser = await res.json();

      // Store guest ID for API requests
      localStorage.setItem("guest_uid", guestId);
      if (registeredUser.id) {
        localStorage.setItem("userId", registeredUser.id);
        guestUser.id = registeredUser.id;
      }

      // Set user state
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

      // Update localStorage
      localStorage.setItem("username", username);
      localStorage.setItem("userId", userId);
      localStorage.setItem("guest_uid", firebaseUid);

    } catch (error) {
      console.error("Local login error:", error);
      setError(error instanceof Error ? error : new Error("Local login failed"));
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      localStorage.removeItem("guest_uid");
      localStorage.removeItem("username");
      localStorage.removeItem("userId");
      queryClient.clear();
      setUser(null);
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, error, loginAsGuest, loginLocal, signOut }}>
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
