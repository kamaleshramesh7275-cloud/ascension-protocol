import { Home, Target, Brain, ShoppingBag, User } from "lucide-react";
import { useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface MobileBottomNavProps {
    className?: string;
}

const navItems = [
    { icon: Home, label: "Home", path: "/dashboard" },
    { icon: Target, label: "Quests", path: "/quests" },
    { icon: Brain, label: "Focus", path: "/focus" },
    { icon: ShoppingBag, label: "Store", path: "/store" },
    { icon: User, label: "Profile", path: "/profile" },
];

export function MobileBottomNav({ className }: MobileBottomNavProps) {
    const [location, setLocation] = useLocation();

    return (
        <nav
            className={cn(
                "border-t border-white/10 bg-black/70 backdrop-blur-xl relative overflow-hidden",
                className
            )}
            style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
        >
            {/* Ambient glow line at top */}
            <div className="absolute top-0 left-1/4 right-1/4 h-px bg-gradient-to-r from-transparent via-primary/60 to-transparent" />

            <div className="flex items-stretch justify-around px-1 pt-2 pb-1">
                {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = location === item.path ||
                        (item.path === "/profile" && location.startsWith("/profile"));

                    return (
                        <button
                            key={item.path}
                            onClick={() => setLocation(item.path)}
                            className="relative flex flex-col items-center gap-1 flex-1 py-1.5 rounded-xl transition-all duration-200 group focus:outline-none"
                            style={{ minHeight: "52px", minWidth: "44px" }}
                            aria-label={item.label}
                            aria-current={isActive ? "page" : undefined}
                        >
                            {/* Sliding pill indicator */}
                            <AnimatePresence>
                                {isActive && (
                                    <motion.div
                                        layoutId="mobile-nav-pill"
                                        className="absolute inset-0 rounded-xl bg-primary/15 border border-primary/25"
                                        initial={{ opacity: 0, scale: 0.85 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.85 }}
                                        transition={{ type: "spring", stiffness: 400, damping: 30 }}
                                    />
                                )}
                            </AnimatePresence>

                            {/* Icon */}
                            <motion.div
                                whileTap={{ scale: 0.82 }}
                                transition={{ type: "spring", stiffness: 500, damping: 25 }}
                                className="relative z-10"
                            >
                                <Icon
                                    className={cn(
                                        "h-5 w-5 transition-all duration-200",
                                        isActive
                                            ? "text-primary drop-shadow-[0_0_6px_var(--tw-shadow-color)] shadow-primary"
                                            : "text-muted-foreground group-hover:text-foreground"
                                    )}
                                    style={isActive ? { filter: "drop-shadow(0 0 5px hsl(var(--primary) / 0.7))" } : {}}
                                />
                            </motion.div>

                            {/* Label */}
                            <span
                                className={cn(
                                    "relative z-10 text-[10px] font-semibold tracking-wide leading-none transition-colors duration-200",
                                    isActive
                                        ? "text-primary"
                                        : "text-muted-foreground group-hover:text-foreground"
                                )}
                            >
                                {item.label}
                            </span>
                        </button>
                    );
                })}
            </div>
        </nav>
    );
}
