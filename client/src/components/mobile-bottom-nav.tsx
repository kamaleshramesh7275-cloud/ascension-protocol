import { Home, Target, Users, Store, User, Map } from "lucide-react";
import { useLocation } from "wouter";
import { cn } from "@/lib/utils";

interface MobileBottomNavProps {
    className?: string;
}

export function MobileBottomNav({ className }: MobileBottomNavProps) {
    const [location, setLocation] = useLocation();

    const navItems = [
        { icon: Home, label: "Home", path: "/dashboard" },
        { icon: Target, label: "Quests", path: "/quests" },
        { icon: Map, label: "Roadmap", path: "/roadmap" },
        // { icon: Users, label: "Guilds", path: "/guilds" },
        { icon: Store, label: "Store", path: "/store" },
        { icon: User, label: "Profile", path: "/profile" },
    ];

    return (
        <nav className={cn("border-t bg-card/95 backdrop-blur-sm", className)}>
            <div className="flex items-center justify-around px-2 py-2 safe-area-inset-bottom">
                {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = location === item.path;

                    return (
                        <button
                            key={item.path}
                            onClick={() => setLocation(item.path)}
                            className={cn(
                                "flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-all duration-200",
                                isActive
                                    ? "text-primary bg-primary/10 scale-105"
                                    : "text-muted-foreground hover:text-foreground hover:bg-accent"
                            )}
                            aria-label={item.label}
                            aria-current={isActive ? "page" : undefined}
                        >
                            <Icon className="h-5 w-5" />
                            <span className="text-[10px] font-medium">{item.label}</span>
                        </button>
                    );
                })}
            </div>
        </nav>
    );
}
