import React, { useEffect, useState, useRef } from "react";
import { useLocation } from "wouter";
import { LocationNode, LocationNodeProps } from "./LocationNode";
import {
    Home,
    Sword,
    BookOpen,
    Trophy,
    BarChart2,
    User,
    Store,
    Users,
    MessageSquare,
    Map as MapIcon,
    Flame,
    X
} from "lucide-react";
import { cn } from "@/lib/utils";
import { MapAvatar } from "./MapAvatar";
import { CyberGridBackground } from "../roadmap/CyberGridBackground";

// Definition of all map locations
const BUILDINGS: Omit<LocationNodeProps, 'activePath' | 'isActive' | 'isMapView'>[] = [
    { id: "dashboard", label: "Dashboard", path: "/dashboard", icon: <Home />, x: 0, y: 0, themeColor: "violet-500", description: "Your Command Center", matches: (p) => p === "/dashboard" },
    { id: "quests", label: "Arena", path: "/quests", icon: <Sword />, x: 0, y: -525, themeColor: "red-500", description: "Battle daily tasks for glory", matches: (p) => p === "/quests" },
    { id: "library", label: "Archives", path: "/library", icon: <BookOpen />, x: -525, y: -525, themeColor: "indigo-400", description: "Ancient halls of knowledge", matches: (p) => p.startsWith("/library") },
    { id: "stats", label: "Tower", path: "/stats", icon: <BarChart2 />, x: 525, y: -525, themeColor: "blue-500", description: "Analyze your attributes", matches: (p) => p === "/stats" },
    { id: "partners", label: "Guild Hall", path: "/partners", icon: <Users />, x: -525, y: 0, themeColor: "amber-500", description: "Socialize with peers", matches: (p) => p === "/partners" },
    { id: "leaderboard", label: "Billboard", path: "/leaderboard", icon: <Trophy />, x: 525, y: 0, themeColor: "yellow-500", description: "The Wall of Fame", matches: (p) => p === "/leaderboard" },
    { id: "chat", label: "Tavern", path: "/global-chat", icon: <MessageSquare />, x: -525, y: 525, themeColor: "orange-500", description: "Global communications", matches: (p) => p === "/global-chat" },
    { id: "focus", label: "Sanctum", path: "/focus", icon: <Flame />, x: 0, y: 525, themeColor: "rose-500", description: "Deep focus and companions", matches: (p) => p === "/focus" },
    { id: "profile", label: "Estate", path: "/profile", icon: <User />, x: 525, y: 525, themeColor: "emerald-500", description: "Your personal legacy", matches: (p) => p.startsWith("/profile") },
    { id: "store", label: "Market", path: "/store", icon: <Store />, x: 300, y: 225, themeColor: "purple-500", description: "The cosmic armory", matches: (p) => p === "/store" },
    { id: "roadmap", label: "Notice Board", path: "/roadmap", icon: <MapIcon />, x: -300, y: -225, themeColor: "cyan-500", description: "The 30-Day Protocol", matches: (p) => p === "/roadmap" },
];

// Color map for dock icons
const COLOR_MAP: Record<string, string> = {
    "violet-500": "#8b5cf6",
    "red-500": "#ef4444",
    "indigo-400": "#818cf8",
    "blue-500": "#3b82f6",
    "amber-500": "#f59e0b",
    "yellow-500": "#eab308",
    "orange-500": "#f97316",
    "rose-500": "#f43f5e",
    "emerald-500": "#10b981",
    "purple-500": "#a855f7",
    "cyan-500": "#06b6d4",
    "primary": "#39ff14",
};

interface TownMapProps {
    children: React.ReactNode;
}

export function TownMap({ children }: TownMapProps) {
    const [location, setLocation] = useLocation();
    const [activeBuildingId, setActiveBuildingId] = useState<string>("dashboard");
    const [isMapView, setIsMapView] = useState(false); // If true, UI hides to show map

    // Map Panning State
    const [baseMapOffset, setBaseMapOffset] = useState({ x: 0, y: 0 }); // Offset determined by active building
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 }); // Offset from user dragging
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const dragDistance = useRef(0);

    // Determine active building based on route
    useEffect(() => {
        // Treat "/" and non-matching routes as home (dashboard)
        let matched = BUILDINGS.find(b => b.matches(location));

        // If not matched, default to dashboard
        if (!matched) matched = BUILDINGS[0];

        setActiveBuildingId(matched.id);

        // Pan the camera to center the active building
        setBaseMapOffset({
            x: -(2000 + matched.x),
            y: -(2000 + matched.y)
        });

        // Reset manual drag pan when a new building is navigated to
        setDragOffset({ x: 0, y: 0 });
    }, [location]);

    // Map Drag Events
    const handleDragStart = (e: React.MouseEvent | React.TouchEvent) => {
        if (!isMapView) return;
        setIsDragging(true);
        dragDistance.current = 0;
        const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
        const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
        setDragStart({ x: clientX, y: clientY });
    };

    const handleDragMove = (e: React.MouseEvent | React.TouchEvent) => {
        if (!isDragging || !isMapView) return;

        const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
        const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

        // Adjust drag speed based on zoom (0.8 scale means we need to move map more to match pointer)
        const scaleFactor = 1 / 0.8;

        const deltaX = (clientX - dragStart.x) * scaleFactor;
        const deltaY = (clientY - dragStart.y) * scaleFactor;

        dragDistance.current += Math.abs(deltaX) + Math.abs(deltaY);

        setDragOffset(prev => ({
            x: prev.x + deltaX,
            y: prev.y + deltaY
        }));
        setDragStart({ x: clientX, y: clientY });
    };

    const handleDragEnd = () => {
        setIsDragging(false);
    };

    // Toggle map view (zoom out, hide content overlay)
    const toggleMapView = () => {
        setIsMapView(!isMapView);
        // Slowly glide back to center when exiting map view if we panned away
        if (isMapView && (dragOffset.x !== 0 || dragOffset.y !== 0)) {
            setDragOffset({ x: 0, y: 0 });
        }
    };

    const navigateTo = (path: string) => {
        setIsMapView(false);
        setLocation(path);
    };

    // Total transform offset (stable [0,0] when not in map view to prevent jitter)
    const currentX = isMapView ? baseMapOffset.x + dragOffset.x : baseMapOffset.x;
    const currentY = isMapView ? baseMapOffset.y + dragOffset.y : baseMapOffset.y;

    // Theme color for the current location
    const currentBuilding = BUILDINGS.find(b => b.id === activeBuildingId);
    const themeColor = COLOR_MAP[currentBuilding?.themeColor || "primary"] || "#39ff14";

    return (
        <div className="relative w-full h-screen overflow-hidden bg-[#0F172A] select-none touch-none"
            onMouseDown={handleDragStart}
            onMouseMove={handleDragMove}
            onMouseUp={handleDragEnd}
            onMouseLeave={handleDragEnd}
            onTouchStart={handleDragStart}
            onTouchMove={handleDragMove}
            onTouchEnd={handleDragEnd}
        >

            {/* 
                1. Static Page Background (Cyber Grid)
                Only visible when NOT in map view. Provides a stable, premium feel.
            */}
            <div className={cn(
                "absolute inset-0 z-0 transition-opacity duration-1000",
                isMapView ? "opacity-0" : "opacity-100"
            )}>
                <CyberGridBackground />
            </div>

            {/* 
                2. The Map Container (GPU Accelerated Panning)
                Disabled motion when not in map view to fix "sliding" background feel.
            */}
            <div
                className={cn(
                    "absolute z-0",
                    // Disable transition while dragging or when hidden to prevent "phantom" sliding
                    isDragging || !isMapView
                        ? "transition-none"
                        : "transition-all duration-700 ease-[cubic-bezier(0.34,1.56,0.64,1)]",
                    isMapView ? "opacity-100" : "opacity-0 scale-110 pointer-events-none"
                )}
                style={{
                    width: '4000px',
                    height: '4000px',
                    left: '50vw',
                    top: '50vh',
                    transform: `translate(${currentX}px, ${currentY}px) scale(${isMapView ? 0.8 : 1.1})`,
                    cursor: isMapView ? (isDragging ? 'grabbing' : 'grab') : 'default'
                }}
            >
                {/* Map Background Grid / Texture */}
                <div className="absolute inset-0 opacity-10"
                    style={{
                        backgroundImage: 'linear-gradient(#39ff14 1px, transparent 1px), linear-gradient(90deg, #39ff14 1px, transparent 1px)',
                        backgroundSize: '100px 100px',
                    }}
                />

                {/* Buildings */}
                {BUILDINGS.map(building => (
                    <LocationNode
                        key={building.id}
                        {...building}
                        activePath={location}
                        isActive={building.id === activeBuildingId}
                        isMapView={isMapView}
                        onClick={(e) => {
                            if (dragDistance.current > 10) {
                                e?.preventDefault();
                                return;
                            }
                            if (isMapView) setIsMapView(false);
                            setLocation(building.path);
                        }}
                    />
                ))}

                {/* User Avatar */}
                <MapAvatar
                    buildings={BUILDINGS}
                    activeId={activeBuildingId}
                />
            </div>

            {/* 
        Foreground Content Overlay
        When not in map view, the actual page content sits on top (like a window).
      */}
            <div
                className={cn(
                    "absolute inset-0 z-10 flex flex-col pointer-events-none transition-all duration-700 ease-[cubic-bezier(0.34,1.56,0.64,1)]",
                    isMapView ? "opacity-0 scale-75 translate-y-8" : "opacity-100 scale-100 translate-y-0 pointer-events-auto",
                )}
            >
                {/* Toggle Map Button Floating Top Left */}
                <div className="absolute top-4 left-4 z-50 pointer-events-auto">
                    <button
                        onClick={toggleMapView}
                        className="flex items-center gap-2 px-4 py-2 rounded-full bg-card/90 border border-primary/50 text-sm font-bold shadow-[0_0_15px_rgba(57,255,20,0.3)] hover:bg-card/100 hover:scale-105 transition-all backdrop-blur-md"
                    >
                        <MapIcon className="w-4 h-4 text-primary" />
                        <span className="hidden sm:inline">World Map</span>
                    </button>
                </div>

                {/* The Route Content Container */}
                <div className="flex-1 w-full max-w-7xl mx-auto p-4 md:p-8 mt-16 md:mt-20 pb-20 overflow-y-auto pointer-events-auto">
                    <div 
                        className="bg-card/95 backdrop-blur-xl border border-border/50 shadow-[0_0_50px_rgba(0,0,0,0.5)] rounded-3xl p-4 sm:p-8 min-h-[80vh] transition-all duration-500"
                        style={{
                            boxShadow: `0 0 40px ${themeColor}15, inset 0 0 20px ${themeColor}05`,
                            borderColor: `${themeColor}33`
                        }}
                    >
                        {children}
                    </div>
                </div>

                {/* Bottom Navigation Dock */}
                <div className="absolute bottom-0 left-0 right-0 z-50 pointer-events-auto">
                    <div className="flex items-center justify-center pb-2 px-2">
                        <div className="flex items-center gap-1 bg-card/95 backdrop-blur-xl border border-border/80 rounded-2xl px-2 py-1.5 shadow-[0_0_30px_rgba(0,0,0,0.5)] overflow-x-auto max-w-full scrollbar-hide">
                            {BUILDINGS.map(building => {
                                const isActive = building.id === activeBuildingId;
                                const color = COLOR_MAP[building.themeColor || "primary"] || "#39ff14";
                                return (
                                    <button
                                        key={building.id}
                                        onClick={() => navigateTo(building.path)}
                                        title={building.label}
                                        className={cn(
                                            "relative flex flex-col items-center justify-center gap-0.5 px-2.5 py-1.5 rounded-xl transition-all duration-200 min-w-[52px]",
                                            isActive
                                                ? "scale-110"
                                                : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                                        )}
                                        style={
                                            isActive
                                                ? {
                                                    backgroundColor: `${color}1a`,
                                                    color: color,
                                                }
                                                : undefined
                                        }
                                    >
                                        {isActive && (
                                            <span
                                                className="absolute inset-0 rounded-xl opacity-30 blur-sm"
                                                style={{ backgroundColor: color }}
                                            />
                                        )}
                                        <span
                                            className="relative z-10 w-5 h-5 flex items-center justify-center"
                                            style={isActive ? { color } : undefined}
                                        >
                                            {building.icon}
                                        </span>
                                        <span
                                            className="relative z-10 text-[9px] font-semibold leading-none whitespace-nowrap"
                                            style={isActive ? { color } : undefined}
                                        >
                                            {building.label}
                                        </span>
                                        {isActive && (
                                            <span
                                                className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-0.5 rounded-full"
                                                style={{ backgroundColor: color }}
                                            />
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>

            {/* Map View Overlay: header hint + close button */}
            <div
                className={cn(
                    "absolute inset-0 z-20 pointer-events-none flex flex-col items-center transition-opacity duration-300",
                    isMapView ? "opacity-100" : "opacity-0"
                )}
            >
                {/* Top: Select a Location hint */}
                <div className="pt-8 pointer-events-auto">
                    <div className="bg-card/80 backdrop-blur-sm border border-border rounded-full px-6 py-2 text-primary font-bold shadow-lg flex items-center gap-3">
                        <MapIcon className="w-4 h-4" />
                        <span>Select a Location</span>
                        <button
                            onClick={toggleMapView}
                            className="ml-2 flex items-center gap-1 text-muted-foreground hover:text-foreground text-sm transition-colors"
                        >
                            <X className="w-4 h-4" />
                            <span className="hidden sm:inline">Close</span>
                        </button>
                    </div>
                </div>

                {/* Bottom: Quick-jump dock visible in map view too */}
                <div className="absolute bottom-0 left-0 right-0 pb-4 pointer-events-auto flex justify-center px-2">
                    <div className="flex items-center gap-1 bg-card/95 backdrop-blur-xl border border-border/80 rounded-2xl px-2 py-1.5 shadow-[0_0_30px_rgba(0,0,0,0.5)] overflow-x-auto max-w-full scrollbar-hide">
                        {BUILDINGS.map(building => {
                            const isActive = building.id === activeBuildingId;
                            const color = COLOR_MAP[building.themeColor || "primary"] || "#39ff14";
                            return (
                                <button
                                    key={building.id}
                                    onClick={() => navigateTo(building.path)}
                                    title={building.label}
                                    className={cn(
                                        "relative flex flex-col items-center justify-center gap-0.5 px-2.5 py-1.5 rounded-xl transition-all duration-200 min-w-[52px]",
                                        isActive
                                            ? "scale-110"
                                            : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                                    )}
                                    style={
                                        isActive
                                            ? {
                                                backgroundColor: `${color}1a`,
                                                color: color,
                                            }
                                            : undefined
                                    }
                                >
                                    {isActive && (
                                        <span
                                            className="absolute inset-0 rounded-xl opacity-30 blur-sm"
                                            style={{ backgroundColor: color }}
                                        />
                                    )}
                                    <span
                                        className="relative z-10 w-5 h-5 flex items-center justify-center"
                                        style={isActive ? { color } : undefined}
                                    >
                                        {building.icon}
                                    </span>
                                    <span
                                        className="relative z-10 text-[9px] font-semibold leading-none whitespace-nowrap"
                                        style={isActive ? { color } : undefined}
                                    >
                                        {building.label}
                                    </span>
                                    {isActive && (
                                        <span
                                            className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-0.5 rounded-full"
                                            style={{ backgroundColor: color }}
                                        />
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

        </div>
    );
}
