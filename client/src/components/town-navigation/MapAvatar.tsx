import React from "react";
import { User } from "lucide-react";

interface MapAvatarProps {
    buildings: { id: string; x: number; y: number }[];
    activeId: string;
}

export function MapAvatar({ buildings, activeId }: MapAvatarProps) {
    const activeBuilding = buildings.find(b => b.id === activeId) || buildings[0];

    // Map absolute coordinates (center is 2000, 2000)
    // Avatar stands slightly in front of the building (offset y by +40px)
    const x = 2000 + activeBuilding.x;
    const y = 2000 + activeBuilding.y + 40;

    return (
        <div
            className="absolute z-30 transition-all duration-700 ease-[cubic-bezier(0.34,1.56,0.64,1)] pointer-events-none"
            style={{
                left: `${x}px`,
                top: `${y}px`,
                transform: "translate(-50%, -50%)",
            }}
        >
            {/* Target Marker / Player Stand */}
            <div className="relative flex flex-col items-center">
                {/* Bouncing Player Icon */}
                <div className="animate-bounce bg-primary text-primary-foreground rounded-full p-1.5 shadow-[0_0_15px_rgba(57,255,20,0.6)]">
                    <User className="w-5 h-5" />
                </div>

                {/* Shadow */}
                <div className="w-4 h-1.5 bg-black/40 rounded-[100%] blur-[2px] mt-1" />
            </div>
        </div>
    );
}
