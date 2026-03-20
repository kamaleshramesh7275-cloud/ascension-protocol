import React from "react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

export interface LocationNodeProps {
    id: string;
    label: string;
    path: string;
    icon: React.ReactNode;
    x: number;
    y: number;
    activePath: string;
    isActive: boolean;
    isMapView: boolean;
    onClick?: (e?: any) => void;
    matches: (currentPath: string) => boolean;
    description?: string;
    themeColor?: string;
}

export function LocationNode({
    label,
    path,
    icon,
    x,
    y,
    activePath,
    isActive,
    isMapView,
    onClick,
    description,
    themeColor = "primary" // default to primary color
}: LocationNodeProps) {
    // Coordinates are relative to the center of the 4000x4000 map.
    // Center is at 2000, 2000.
    const absoluteX = 2000 + x;
    const absoluteY = 2000 + y;

    // Helper map to convert tailwind color names to actual glow colors
    const getThemeColors = (theme: string) => {
        const colors: Record<string, { border: string, bg: string, shadow: string }> = {
            "violet-500": { border: "#8b5cf6", bg: "rgba(139, 92, 246, 0.2)", shadow: "rgba(139, 92, 246, 0.4)" },
            "red-500": { border: "#ef4444", bg: "rgba(239, 68, 68, 0.2)", shadow: "rgba(239, 68, 68, 0.4)" },
            "indigo-400": { border: "#818cf8", bg: "rgba(129, 140, 248, 0.2)", shadow: "rgba(129, 140, 248, 0.4)" },
            "blue-500": { border: "#3b82f6", bg: "rgba(59, 130, 246, 0.2)", shadow: "rgba(59, 130, 246, 0.4)" },
            "amber-500": { border: "#f59e0b", bg: "rgba(245, 158, 11, 0.2)", shadow: "rgba(245, 158, 11, 0.4)" },
            "yellow-500": { border: "#eab308", bg: "rgba(234, 179, 8, 0.2)", shadow: "rgba(234, 179, 8, 0.4)" },
            "orange-500": { border: "#f97316", bg: "rgba(249, 115, 22, 0.2)", shadow: "rgba(249, 115, 22, 0.4)" },
            "rose-500": { border: "#f43f5e", bg: "rgba(244, 63, 94, 0.2)", shadow: "rgba(244, 63, 94, 0.4)" },
            "emerald-500": { border: "#10b981", bg: "rgba(16, 185, 129, 0.2)", shadow: "rgba(16, 185, 129, 0.4)" },
            "purple-500": { border: "#a855f7", bg: "rgba(168, 85, 247, 0.2)", shadow: "rgba(168, 85, 247, 0.4)" },
            "cyan-500": { border: "#06b6d4", bg: "rgba(6, 182, 212, 0.2)", shadow: "rgba(6, 182, 212, 0.4)" },
            "primary": { border: "#39ff14", bg: "rgba(57, 255, 20, 0.2)", shadow: "rgba(57, 255, 20, 0.4)" }
        };
        return colors[theme] || colors["primary"];
    };

    const theme = getThemeColors(themeColor);

    return (
        <div
            className={cn(
                "absolute transform -translate-x-1/2 -translate-y-1/2 pointer-events-auto transition-all duration-100 z-10",
                isActive ? "scale-110 z-20" : "hover:scale-105"
            )}
            style={{
                left: `${absoluteX}px`,
                top: `${absoluteY}px`,
            }}
        >
            <TooltipProvider>
                <Tooltip delayDuration={0}>
                    <TooltipTrigger asChild>
                        <div
                            role="button"
                            tabIndex={0}
                            onClick={onClick}
                            className={cn(
                                "relative group flex flex-col items-center justify-center p-4 rounded-full outline-none",
                                "bg-background/80 backdrop-blur-md border-2 shadow-lg transition-all duration-100 cursor-pointer",
                                isActive && !isMapView
                                    ? "border-primary shadow-[0_0_20px_rgba(57,255,20,0.5)] bg-primary/10"
                                    : "border-border hover:bg-card/90",
                                isMapView ? "scale-110" : "" // Slightly larger in map view
                            )}
                            style={{
                                borderColor: isMapView || isActive ? theme.border : undefined,
                                boxShadow: isMapView || isActive ? `0 0 20px ${theme.shadow}` : undefined,
                            }}
                        >
                            {/* Visual Building Stand-in (Icon) */}
                            <div className={cn(
                                "h-12 w-12 flex items-center justify-center text-2xl transition-colors duration-100",
                                isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                            )}>
                                {icon}
                            </div>

                            {/* Building Base / Platform */}
                            <div className={cn(
                                "absolute -bottom-2 w-16 h-4 rounded-[100%] border -z-10 transition-colors duration-100",
                            )}
                                style={{
                                    borderColor: isMapView || isActive ? theme.border : 'rgba(255,255,255,0.2)',
                                    backgroundColor: isMapView || isActive ? theme.bg : 'rgba(255,255,255,0.05)',
                                }}
                            />
                        </div>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="font-bold border-primary/50 border bg-background/95">
                        {label}
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>

            <div
                className={cn(
                    "absolute top-full left-1/2 -translate-x-1/2 mt-4 whitespace-nowrap flex flex-col items-center transition-all duration-500",
                    isMapView ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4 pointer-events-none"
                )}
            >
                <span
                    className="px-3 py-1 rounded-md text-sm font-bold backdrop-blur-md shadow-lg border"
                    style={{
                        backgroundColor: 'rgba(15, 23, 42, 0.9)',
                        borderColor: theme.border,
                        color: theme.border
                    }}
                >
                    {label}
                </span>
                {description && (
                    <span className="text-xs text-muted-foreground mt-1 max-w-[200px] text-center whitespace-normal bg-background/80 p-1 rounded backdrop-blur-sm">
                        {description}
                    </span>
                )}
            </div>

            {/* Minimal label when NOT in map view */}
            <div
                className={cn(
                    "absolute -bottom-10 left-1/2 -translate-x-1/2 whitespace-nowrap transition-opacity duration-100",
                    !isMapView ? "opacity-100" : "opacity-0 pointer-events-none"
                )}
            >
                <span className={cn(
                    "px-2 py-0.5 rounded text-xs font-semibold backdrop-blur-sm",
                    isActive ? "bg-primary text-primary-foreground" : "bg-background/80 text-muted-foreground border border-border"
                )}>
                    {label}
                </span>
            </div>
        </div>
    );
}
