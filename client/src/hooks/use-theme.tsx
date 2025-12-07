import { createContext, useContext, useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { User } from "@shared/schema";
import { useAuth } from "./use-auth";

type Theme = string;

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  console.log("ThemeProvider: user", user, "loading", authLoading);

  // Fetch latest user data to get the equipped theme
  const { data: backendUser } = useQuery<User>({
    queryKey: ["/api/user"],
    enabled: !!user,
  });

  const [theme, setTheme] = useState<Theme>("dark");

  // Sync local state with backend user theme
  useEffect(() => {
    if (backendUser?.theme && backendUser.theme !== "default") {
      setTheme(backendUser.theme);
    } else {
      // Only reset to dark if we are sure we don't have a user or user has no theme
      // But if we are loading, we might want to keep current theme?
      // For now, default to dark is fine.
      setTheme("dark");
    }
  }, [backendUser?.theme]);

  useEffect(() => {
    const root = document.documentElement;
    // Remove all known theme classes
    root.classList.remove(
      "light", "dark",
      "midnight-eclipse", "crimson-warlord", "neon-cyberpunk",
      "golden-luxury", "forest-guardian", "arctic-frost",
      "solar-flare", "royal-amethyst", "steampunk", "matrix"
    );

    // Add the current theme class
    root.classList.add(theme);

    // Persist to local storage for guest/initial load
    localStorage.setItem("theme", theme);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return context;
};
