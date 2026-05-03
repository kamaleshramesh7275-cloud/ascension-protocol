import React from "react";
import { motion } from "framer-motion";

interface ParticleProps {
  x: number; y: number; color: string;
}

// ─── ISOMETRIC SVG BUILDING ASSETS ──────────────────────────────────────────
const BuildingSVGs: Record<string, (props: { status: string; glow?: string }) => JSX.Element> = {
  house: ({ status }) => (
    <svg width="64" height="72" viewBox="0 0 64 72" fill="none" xmlns="http://www.w3.org/2000/svg">
      <polygon points="32,4 60,20 60,52 32,68 4,52 4,20" fill={status === "ruined" ? "#3f1010" : "#1e293b"} stroke={status === "ruined" ? "#ef4444" : "#475569"} strokeWidth="1.5"/>
      <polygon points="32,4 60,20 32,36 4,20" fill={status === "ruined" ? "#7f1d1d" : "#334155"} stroke={status === "ruined" ? "#dc2626" : "#64748b"} strokeWidth="1"/>
      <polygon points="32,36 60,20 60,52 32,68" fill={status === "ruined" ? "#450a0a" : "#0f172a"} strokeWidth="0"/>
    </svg>
  ),
  library: ({ status }) => (
    <svg width="64" height="88" viewBox="0 0 64 88" fill="none" xmlns="http://www.w3.org/2000/svg">
      <polygon points="32,4 60,20 60,68 32,84 4,68 4,20" fill={status === "ruined" ? "#3f1010" : "#1e3a5f"} stroke={status === "ruined" ? "#ef4444" : "#3b82f6"} strokeWidth="1.5"/>
      <polygon points="32,4 60,20 32,36 4,20" fill={status === "ruined" ? "#7f1d1d" : "#1d4ed8"} stroke={status === "ruined" ? "#dc2626" : "#60a5fa"} strokeWidth="1"/>
      <polygon points="32,36 60,20 60,68 32,84" fill={status === "ruined" ? "#450a0a" : "#1e3a8a"} strokeWidth="0"/>
      {status === "completed" && <rect x="20" y="38" width="24" height="16" fill="#93c5fd" opacity="0.3"/>}
    </svg>
  ),
  treasury: ({ status }) => (
    <svg width="64" height="80" viewBox="0 0 64 80" fill="none" xmlns="http://www.w3.org/2000/svg">
      <polygon points="32,4 60,20 60,60 32,76 4,60 4,20" fill={status === "ruined" ? "#3f1010" : "#1c1917"} stroke={status === "ruined" ? "#ef4444" : "#d97706"} strokeWidth="1.5"/>
      <polygon points="32,4 60,20 32,36 4,20" fill={status === "ruined" ? "#7f1d1d" : "#78350f"} stroke={status === "ruined" ? "#dc2626" : "#f59e0b"} strokeWidth="1"/>
      {status === "completed" && <circle cx="32" cy="50" r="10" fill="#d97706" opacity="0.8"/>}
    </svg>
  ),
  forge: ({ status }) => (
    <svg width="64" height="84" viewBox="0 0 64 84" fill="none" xmlns="http://www.w3.org/2000/svg">
      <polygon points="32,4 60,20 60,64 32,80 4,64 4,20" fill={status === "ruined" ? "#3f1010" : "#1c1917"} stroke={status === "ruined" ? "#ef4444" : "#ea580c"} strokeWidth="1.5"/>
      <polygon points="32,36 60,20 60,64 32,80" fill={status === "ruined" ? "#450a0a" : "#431407"} strokeWidth="0"/>
      {status === "completed" && <rect x="26" y="0" width="8" height="20" fill="#44403c"/>}
    </svg>
  ),
  barracks: ({ status }) => (
    <svg width="64" height="76" viewBox="0 0 64 76" fill="none" xmlns="http://www.w3.org/2000/svg">
      <polygon points="32,4 60,20 60,56 32,72 4,56 4,20" fill={status === "ruined" ? "#3f1010" : "#1a2e1a"} stroke={status === "ruined" ? "#ef4444" : "#16a34a"} strokeWidth="1.5"/>
      {status === "completed" && <line x1="32" y1="-2" x2="32" y2="-14" stroke="#4ade80" strokeWidth="1"/>}
    </svg>
  ),
  citadel_tower: ({ status }) => (
    <svg width="72" height="120" viewBox="0 0 72 120" fill="none" xmlns="http://www.w3.org/2000/svg">
      <polygon points="36,4 68,22 68,100 36,118 4,100 4,22" fill={status === "ruined" ? "#3f1010" : "#1e1b4b"} stroke={status === "ruined" ? "#ef4444" : "#a855f7"} strokeWidth="2"/>
      <polygon points="36,4 68,22 36,40 4,22" fill={status === "ruined" ? "#7f1d1d" : "#4c1d95"} stroke={status === "ruined" ? "#dc2626" : "#c084fc"} strokeWidth="1.5"/>
      {status === "completed" && <circle cx="36" cy="4" r="3" fill="#fde68a" opacity="0.9"/>}
    </svg>
  ),
};

// Smoke particle for ruins
function SmokeParticle({ x, y }: ParticleProps) {
  return (
    <motion.div
      className="absolute w-2 h-2 rounded-full bg-gray-500/40 pointer-events-none"
      style={{ left: x, top: y }}
      initial={{ opacity: 0.6, scale: 1, y: 0 }}
      animate={{ opacity: 0, scale: 2.5, y: -40 }}
      transition={{ duration: 3, repeat: Infinity, delay: Math.random() * 2 }}
    />
  );
}

const GLOW_COLORS: Record<string, string> = {
  library: "#60a5fa",
  treasury: "#f59e0b",
  forge: "#fb923c",
  barracks: "#4ade80",
  citadel_tower: "#c084fc",
  house: "#6b7280",
};

interface Building {
  id: string;
  userId: string;
  type: string;
  buildingName: string;
  x: number;
  y: number;
  status: "building" | "completed" | "ruined";
  wager: number;
  def?: {
    label: string;
    passiveCoins: number;
    xpBonusPct: number;
  };
}

interface CitadelGridProps {
  buildings: Building[];
  gridSize: number;
  onClearRuin?: (id: string) => void;
  readonly?: boolean;
  isRunning?: boolean;
  onTileClick?: (x: number, y: number) => void;
  selectedTile?: { x: number; y: number } | null;
  className?: string;
}

export function CitadelGrid({
  buildings,
  gridSize,
  onClearRuin,
  readonly = false,
  isRunning = false,
  onTileClick,
  selectedTile,
  className = "",
}: CitadelGridProps) {
  const grid: Record<string, Building> = {};
  buildings.forEach(b => { grid[`${b.x},${b.y}`] = b; });

  const TILE_W = 100;
  const TILE_H = 60;
  const totalW = gridSize * TILE_W;
  const totalH = gridSize * TILE_H;

  // Environment generation (deterministic seed based on size)
  const getTileType = (x: number, y: number) => {
    const val = (Math.sin(x * 12.3 + y * 34.5) * 10000) % 1;
    if (val > 0.8) return "water";
    if (val > 0.6) return "sand";
    return "grass";
  };

  return (
    <div className={`relative select-none transform-gpu ${className}`} style={{ width: totalW, height: totalH, perspective: "1000px" }}>
      <div className="absolute inset-0" style={{ transform: "rotateX(0deg) rotateZ(0deg)" }}>
        {Array.from({ length: gridSize }, (_, y) =>
          Array.from({ length: gridSize }, (_, x) => {
            const key = `${x},${y}`;
            const b = grid[key];
            const type = getTileType(x, y);
            
            // Isometric position
            const isoX = (x - y) * (TILE_W / 2) + totalW / 2;
            const isoY = (x + y) * (TILE_H / 2);

            const isSelected = selectedTile?.x === x && selectedTile?.y === y;

            const tileColor = type === "water" ? "#0f172a" : type === "sand" ? "#451a03" : "#064e3b";
            const strokeColor = type === "water" ? "#1e40af" : type === "sand" ? "#78350f" : "#065f46";

            // Road Logic: Connect adjacent buildings
            const hasUp = y > 0 && grid[`${x},${y-1}`];
            const hasDown = y < gridSize-1 && grid[`${x},${y+1}`];
            const hasLeft = x > 0 && grid[`${x-1},${y}`];
            const hasRight = x < gridSize-1 && grid[`${x+1},${y}`];
            const isRoad = !b && (hasUp || hasDown || hasLeft || hasRight);

            return (
              <div
                key={key}
                className="absolute transition-all duration-700"
                style={{ left: isoX - TILE_W / 2, top: isoY, width: TILE_W, height: TILE_H }}
              >
                {/* Tile Base */}
                <svg width={TILE_W} height={TILE_H + 20} viewBox={`0 0 ${TILE_W} ${TILE_H + 20}`} className="absolute top-0 left-0 overflow-visible">
                  {/* Side Depth (3D effect) */}
                  <polygon points={`0,${TILE_H/2} ${TILE_W/2},${TILE_H} ${TILE_W/2},${TILE_H+12} 0,${TILE_H/2+12}`} fill="#020617"/>
                  <polygon points={`${TILE_W/2},${TILE_H} ${TILE_W},${TILE_H/2} ${TILE_W},${TILE_H/2+12} ${TILE_W/2},${TILE_H+12}`} fill="#0f172a"/>
                  
                  {/* Top Face */}
                  <polygon
                    points={`${TILE_W/2},0 ${TILE_W},${TILE_H/2} ${TILE_W/2},${TILE_H} 0,${TILE_H/2}`}
                    fill={b?.status === "ruined" ? "#1a0505" : isRoad ? "#1e293b" : isSelected ? "#1e40af" : tileColor}
                    stroke={b?.status === "ruined" ? "#7f1d1d" : isRoad ? "#334155" : isSelected ? "#60a5fa" : strokeColor}
                    strokeWidth={isSelected ? "3" : "1"}
                    className={!readonly && !isRunning && !b ? "cursor-pointer hover:brightness-125 transition-all" : ""}
                    onClick={() => !readonly && !isRunning && !b && onTileClick?.(x, y)}
                  />

                  {/* Road Details */}
                  {isRoad && (
                    <polygon points={`${TILE_W/2},4 ${TILE_W-8},${TILE_H/2} ${TILE_W/2},${TILE_H-4} 8,${TILE_H/2}`} fill="#0f172a" opacity="0.4"/>
                  )}
                  
                  {/* Grass/Decoration Details */}
                  {type === "grass" && !b && !isRoad && (
                    <g opacity="0.6">
                      <circle cx={TILE_W/2 - 10} cy={TILE_H/2 - 5} r="1" fill="#10b981" />
                      <circle cx={TILE_W/2 + 15} cy={TILE_H/2 + 2} r="1" fill="#10b981" />
                      {/* Small Tree SVG */}
                      {(x + y) % 5 === 0 && (
                        <path d={`M${TILE_W/2},${TILE_H/2} l-2,-8 l4,0 z`} fill="#064e3b" stroke="#059669" strokeWidth="0.5"/>
                      )}
                    </g>
                  )}
                </svg>

                {/* Building */}
                {b && (
                  <motion.div
                    className="absolute pointer-events-auto"
                    style={{ left: TILE_W / 2 - 32, top: -30 }}
                    initial={{ y: -20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                  >
                    <div className="relative group">
                      {/* Aura */}
                      {b.status === "completed" && (
                        <div className="absolute inset-0 blur-2xl opacity-20 animate-pulse" style={{ backgroundColor: GLOW_COLORS[b.buildingName] }} />
                      )}
                      
                      {/* Building Sprite */}
                      <div className="relative z-10">
                        {React.createElement(BuildingSVGs[b.buildingName] || BuildingSVGs.house, { status: b.status })}
                      </div>

                      {/* Ruins Effect */}
                      {b.status === "ruined" && (
                        <div className="absolute top-0 left-0 w-full h-full">
                          <SmokeParticle x={20} y={10} color="#6b7280" />
                          <SmokeParticle x={40} y={5} color="#6b7280" />
                        </div>
                      )}

                      {/* Clear Button */}
                      {b.status === "ruined" && !readonly && (
                        <button
                          onClick={(e) => { e.stopPropagation(); onClearRuin?.(b.id); }}
                          className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-red-600 hover:bg-red-500 text-white text-[10px] font-bold px-3 py-1 rounded-full shadow-lg z-50 whitespace-nowrap"
                        >
                          RESTORE (200💰)
                        </button>
                      )}

                      {/* Name Label */}
                      <div className="absolute -top-10 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-black/80 px-2 py-1 rounded text-[10px] text-white whitespace-nowrap pointer-events-none">
                        {b.buildingName.toUpperCase()}
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
