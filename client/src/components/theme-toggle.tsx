import { Palette } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";

export function ThemeToggle() {
  const [, setLocation] = useLocation();

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setLocation("/store")}
      title="Browse Themes"
    >
      <Palette className="h-5 w-5" />
      <span className="sr-only">Browse Themes</span>
    </Button>
  );
}
