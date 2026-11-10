import React from "react";
import { motion } from "framer-motion";
import { User } from "@shared/schema";
import { getHunterArchetype, getTierVisuals, AvatarTier, ArchetypeDetails } from "@/lib/avatar-engine";

interface AscendantAvatarProps {
  user?: Partial<User> | null;
  tierOverride?: AvatarTier;
  archetypeOverride?: ArchetypeDetails;
  size?: number | string;
  showAura?: boolean;
  showPetCompanion?: boolean;
  className?: string;
  animate?: boolean;
}

export function AscendantAvatar({
  user,
  tierOverride,
  archetypeOverride,
  size = 320,
  showAura = true,
  className = "",
  animate = true,
}: AscendantAvatarProps) {
  const archetype = archetypeOverride || getHunterArchetype(user);
  const tierVisuals = getTierVisuals(tierOverride || user?.tier);
  const tier = tierVisuals.tier;

  const color = archetype.primaryColor;
  const glow = archetype.glowColor;

  // Tier level checks
  const isCPlus = tier === "C" || tier === "B" || tier === "A" || tier === "S";
  const isBPlus = tier === "B" || tier === "A" || tier === "S";
  const isAPlus = tier === "A" || tier === "S";
  const isS = tier === "S";

  return (
    <div
      className={`relative flex items-center justify-center select-none ${className}`}
      style={{
        width: typeof size === "number" ? `${size}px` : size,
        height: typeof size === "number" ? `${size}px` : size,
      }}
    >
      {/* 1. Ambient Background Aura FX */}
      {showAura && (
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
          {/* Outer Bloom */}
          <motion.div
            animate={
              animate
                ? {
                    scale: [1, 1.12, 1],
                    opacity: [0.35, 0.6, 0.35],
                  }
                : undefined
            }
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="absolute w-[80%] h-[80%] rounded-full blur-[45px]"
            style={{ backgroundColor: color, opacity: Number(tierVisuals.glowIntensity) * 0.45 }}
          />

          {/* S-Tier Cosmic Aura Wings */}
          {isS && (
            <motion.div
              animate={animate ? { scale: [1, 1.08, 1], rotate: [0, 2, -2, 0] } : undefined}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
              className="absolute w-full h-full flex items-center justify-center opacity-80 pointer-events-none"
            >
              <svg viewBox="0 0 400 400" className="w-[120%] h-[120%] absolute -top-4">
                <defs>
                  <linearGradient id="wingGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor={color} stopOpacity="0.8" />
                    <stop offset="70%" stopColor="#818cf8" stopOpacity="0.2" />
                    <stop offset="100%" stopColor="#000000" stopOpacity="0" />
                  </linearGradient>
                </defs>
                {/* Left Wing */}
                <path
                  d="M190 140 C140 70, 70 80, 20 130 C50 160, 90 180, 150 190 C110 210, 60 230, 40 270 C80 270, 130 250, 185 220 Z"
                  fill="url(#wingGradient)"
                  className="filter blur-[1px]"
                />
                {/* Right Wing */}
                <path
                  d="M210 140 C260 70, 330 80, 380 130 C350 160, 310 180, 250 190 C290 210, 340 230, 360 270 C320 270, 270 250, 215 220 Z"
                  fill="url(#wingGradient)"
                  className="filter blur-[1px]"
                />
              </svg>
            </motion.div>
          )}

          {/* A & S Tier Orbital Halo */}
          {tierVisuals.haloUnlocked && (
            <motion.div
              animate={animate ? { rotate: 360 } : undefined}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              className="absolute w-[86%] h-[86%] border border-dashed rounded-full pointer-events-none"
              style={{
                borderColor: `${color}88`,
                boxShadow: `0 0 25px ${glow}`,
              }}
            >
              <div
                className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full"
                style={{ backgroundColor: color, boxShadow: `0 0 10px ${color}` }}
              />
              <div
                className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full"
                style={{ backgroundColor: color, boxShadow: `0 0 10px ${color}` }}
              />
            </motion.div>
          )}
        </div>
      )}

      {/* 2. Scalable Modular Vector Hunter Silhouette & Armor */}
      <motion.svg
        viewBox="0 0 300 400"
        className="relative z-10 w-full h-full filter drop-shadow-[0_10px_25px_rgba(0,0,0,0.8)]"
        animate={animate ? { y: [0, -6, 0] } : undefined}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      >
        <defs>
          <linearGradient id="bodySuitGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#1e293b" />
            <stop offset="50%" stopColor="#0f172a" />
            <stop offset="100%" stopColor="#020617" />
          </linearGradient>

          <linearGradient id="armorMetalGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#334155" />
            <stop offset="50%" stopColor="#1e293b" />
            <stop offset="100%" stopColor="#090d16" />
          </linearGradient>

          <linearGradient id="glowTrimGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={color} />
            <stop offset="100%" stopColor="#ffffff" />
          </linearGradient>

          <filter id="neonBloom" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Ground Sigil for A & S Tiers */}
        {isAPlus && (
          <ellipse
            cx="150"
            cy="380"
            rx="110"
            ry="18"
            fill="none"
            stroke={color}
            strokeWidth="2"
            strokeDasharray="6 4"
            opacity="0.6"
          />
        )}

        {/* Legs / Combat Boots */}
        <path
          d="M125 250 L115 365 L135 370 L142 270 Z"
          fill="url(#bodySuitGrad)"
          stroke="#334155"
          strokeWidth="1.5"
        />
        <path
          d="M175 250 L185 365 L165 370 L158 270 Z"
          fill="url(#bodySuitGrad)"
          stroke="#334155"
          strokeWidth="1.5"
        />

        {/* Boot Armor Plates (Tier B+) */}
        {isBPlus && (
          <>
            <path d="M112 330 L138 333 L135 368 L113 365 Z" fill="url(#armorMetalGrad)" stroke={color} strokeWidth="1" />
            <path d="M188 330 L162 333 L165 368 L187 365 Z" fill="url(#armorMetalGrad)" stroke={color} strokeWidth="1" />
          </>
        )}

        {/* Torso & Suit */}
        <path
          d="M110 135 L190 135 L175 255 L125 255 Z"
          fill="url(#bodySuitGrad)"
          stroke="#334155"
          strokeWidth="1.5"
        />

        {/* Tier D: Tactical Hoodie Overlay */}
        {tier === "D" && (
          <path
            d="M105 130 C120 145, 180 145, 195 130 L180 230 C150 240, 150 240, 120 230 Z"
            fill="#1e2430"
            stroke="#475569"
            strokeWidth="1.5"
          />
        )}

        {/* Tier C+: Tactical Chest Armor Core */}
        {isCPlus && (
          <path
            d="M120 140 L180 140 L170 215 L150 230 L130 215 Z"
            fill="url(#armorMetalGrad)"
            stroke={isBPlus ? color : "#64748b"}
            strokeWidth={isBPlus ? "1.8" : "1"}
          />
        )}

        {/* Arc Reactor / Core Sigil (Glows with Class Color) */}
        {isCPlus && (
          <polygon
            points="150,165 160,180 150,195 140,180"
            fill={color}
            filter="url(#neonBloom)"
          />
        )}

        {/* Tier B+: Shoulder Pauldrons */}
        {isBPlus && (
          <>
            {/* Left Shoulder */}
            <path
              d="M90 130 L115 125 L118 160 L85 155 Z"
              fill="url(#armorMetalGrad)"
              stroke={color}
              strokeWidth="1.5"
            />
            {/* Right Shoulder */}
            <path
              d="M210 130 L185 125 L182 160 L215 155 Z"
              fill="url(#armorMetalGrad)"
              stroke={color}
              strokeWidth="1.5"
            />
          </>
        )}

        {/* Arms */}
        <path d="M108 140 L85 210 L100 230 L118 175 Z" fill="url(#bodySuitGrad)" stroke="#334155" />
        <path d="M192 140 L215 210 L200 230 L182 175 Z" fill="url(#bodySuitGrad)" stroke="#334155" />

        {/* Class Specific Weapon / Focus Implement */}
        {isCPlus && (
          <g>
            {archetype.id === "chrono_sage" && (
              /* Floating Quantum Grimoire */
              <g transform="translate(60, 190)">
                <rect x="0" y="0" width="30" height="42" rx="3" fill="#0f172a" stroke={color} strokeWidth="1.5" />
                <line x1="8" y1="10" x2="22" y2="10" stroke={color} strokeWidth="1" />
                <line x1="8" y1="18" x2="22" y2="18" stroke={color} strokeWidth="1" />
                <circle cx="15" cy="28" r="5" fill="none" stroke={color} strokeWidth="1" filter="url(#neonBloom)" />
              </g>
            )}

            {archetype.id === "iron_vanguard" && (
              /* Heavy Kinetic Gauntlets */
              <>
                <rect x="80" y="210" width="22" height="28" rx="4" fill="url(#armorMetalGrad)" stroke={color} strokeWidth="1.5" />
                <rect x="198" y="210" width="22" height="28" rx="4" fill="url(#armorMetalGrad)" stroke={color} strokeWidth="1.5" />
                <line x1="85" y1="220" x2="97" y2="220" stroke={color} strokeWidth="2" filter="url(#neonBloom)" />
                <line x1="203" y1="220" x2="215" y2="220" stroke={color} strokeWidth="2" filter="url(#neonBloom)" />
              </>
            )}

            {archetype.id === "void_reaver" && (
              /* Umbral Shadow Blades */
              <g transform="translate(205, 195)">
                <path d="M10 0 L15 45 L5 38 Z" fill="#0f172a" stroke={color} strokeWidth="1.5" filter="url(#neonBloom)" />
                <circle cx="10" cy="5" r="3" fill={color} />
              </g>
            )}

            {archetype.id === "bio_aegis" && (
              /* Crystalline Aegis Shield */
              <g transform="translate(60, 180)">
                <polygon points="15,0 35,10 30,45 15,55 0,45 -5,10" fill="url(#armorMetalGrad)" stroke={color} strokeWidth="1.5" />
                <circle cx="15" cy="25" r="8" fill="none" stroke={color} strokeWidth="1.5" filter="url(#neonBloom)" />
              </g>
            )}

            {archetype.id === "omni_ascendant" && (
              /* Dual Orbital Sol Blades */
              <>
                <line x1="75" y1="170" x2="85" y2="245" stroke={color} strokeWidth="2.5" filter="url(#neonBloom)" />
                <line x1="225" y1="170" x2="215" y2="245" stroke={color} strokeWidth="2.5" filter="url(#neonBloom)" />
              </>
            )}
          </g>
        )}

        {/* Neck / Collar */}
        <polygon points="138,135 162,135 156,120 144,120" fill="#0f172a" />

        {/* Head / Helm / Hood */}
        {tier === "D" ? (
          /* Hood Up */
          <path
            d="M125 125 C120 70, 180 70, 175 125 C165 132, 135 132, 125 125 Z"
            fill="#1e2430"
            stroke="#475569"
            strokeWidth="1.5"
          />
        ) : (
          /* Sleek Tactical Visor / Cyber Crown */
          <g>
            {/* Base Head */}
            <path
              d="M130 115 C130 75, 170 75, 170 115 C165 128, 135 128, 130 115 Z"
              fill="#090d16"
              stroke="#334155"
              strokeWidth="1.2"
            />
            {/* Cyber Helmet Trim */}
            <path
              d="M128 85 L150 72 L172 85 L168 105 L132 105 Z"
              fill="url(#armorMetalGrad)"
              stroke={color}
              strokeWidth="1.2"
            />
          </g>
        )}

        {/* Visor / Eye Glow */}
        {tier === "D" ? (
          /* Mysterious Shaded Eyes */
          <ellipse cx="150" cy="102" rx="14" ry="2" fill="#475569" opacity="0.6" />
        ) : (
          /* High-Tech Glowing Visor Bar */
          <g>
            <rect
              x="136"
              y="96"
              width="28"
              height="5"
              rx="2.5"
              fill={color}
              filter="url(#neonBloom)"
            />
            <rect x="144" y="97" width="12" height="3" rx="1.5" fill="#ffffff" />
          </g>
        )}

        {/* Tier S: Crown of the Monarch */}
        {isS && (
          <polygon
            points="140,65 150,50 160,65 170,55 168,75 132,75 130,55"
            fill={color}
            filter="url(#neonBloom)"
          />
        )}
      </motion.svg>
    </div>
  );
}

