import { createContext, useContext, useEffect, useState } from "react";
import { FirebaseUser, onAuthChange } from "@/lib/firebase";
import { apiRequest } from "@/lib/queryClient";

interface AuthContextType {
  user: FirebaseUser | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({ user: null, loading: true });

async function syncUserWithBackend(firebaseUser: FirebaseUser) {
  try {
    // Register or sync user with backend
    await apiRequest("POST", "/api/auth/register", {
      firebaseUid: firebaseUser.uid,
      name: firebaseUser.displayName || firebaseUser.email?.split("@")[0] || "Ascendant",
      email: firebaseUser.email,
      avatarUrl: firebaseUser.photoURL,
    });
  } catch (error) {
    console.error("Error syncing user with backend:", error);
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthChange(async (firebaseUser) => {
      if (firebaseUser) {
        // Sync user with backend
        await syncUserWithBackend(firebaseUser);
      }
      setUser(firebaseUser);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading }}>
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
