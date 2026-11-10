import React, { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { User } from "@shared/schema";
import { AscendantAvatar } from "./ascendant-avatar";
import { getHunterArchetype, getTierVisuals } from "@/lib/avatar-engine";
import { usePet } from "@/hooks/use-pet";
import { toPng } from "html-to-image";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { 
  Download, Share2, Copy, Check, ShieldCheck, Flame, 
  Sparkles, Award, Zap, QrCode, Crosshair, Terminal
} from "lucide-react";

interface HunterLicenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User;
  referralCode?: string;
}

export function HunterLicenseModal({
  isOpen,
  onClose,
  user,
  referralCode,
}: HunterLicenseModalProps) {
  const { toast } = useToast();
  const { pet } = usePet();
  const archetype = getHunterArchetype(user);
  const tierVisuals = getTierVisuals(user.tier);
  const cardRef = useRef<HTMLDivElement>(null);

  const [format, setFormat] = useState<"story" | "badge">("story");
  const [isExporting, setIsExporting] = useState(false);
  const [copied, setCopied] = useState(false);

  // 3D Tilt Dynamics using Framer Motion springs
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const mouseXSpring = useSpring(x, { stiffness: 300, damping: 25 });
  const mouseYSpring = useSpring(y, { stiffness: 300, damping: 25 });

  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["12deg", "-12deg"]);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-12deg", "12deg"]);
  const glareX = useTransform(mouseXSpring, [-0.5, 0.5], ["0%", "100%"]);
  const glareY = useTransform(mouseYSpring, [-0.5, 0.5], ["0%", "100%"]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    x.set(mouseX / width - 0.5);
    y.set(mouseY / height - 0.5);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  const getReferralUrl = () => {
    const origin = typeof window !== "undefined" ? window.location.origin : "https://ascensionprotocol.app";
    return referralCode ? `${origin}/register?ref=${referralCode}` : origin;
  };

  const handleCopyLink = () => {
    const shareText = `🔥 [ASCENSION PROTOCOL] My Hunter License: Tier ${user.tier} ${archetype.name}.\nStreak: ${user.streak} Days | Level ${user.level}.\nCan you beat my focus stats? Join my squad: ${getReferralUrl()}`;
    navigator.clipboard.writeText(shareText);
    setCopied(true);
    toast({
      title: "HUNTER DOSSIER COPIED",
      description: "Ready to paste into WhatsApp, Discord, or Twitter.",
    });
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDownload = async () => {
    if (!cardRef.current) return;
    setIsExporting(true);

    try {
      // Small pause to allow animations to settle for render
      const dataUrl = await toPng(cardRef.current, {
        quality: 0.98,
        pixelRatio: 2.5,
      });

      const link = document.createElement("a");
      link.download = `Ascension-Hunter-License-${user.name.replace(/\s+/g, "_")}-${user.tier}-Tier.png`;
      link.href = dataUrl;
      link.click();

      toast({
        title: "LICENSE EXPORTED (LOSSLESS PNG)",
        description: "Saved to device. Post to Instagram Stories or WhatsApp Status!",
      });
    } catch (err: any) {
      console.error("Export error:", err);
      toast({
        title: "Export Failed",
        description: "Could not capture license image. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const hunterId = `ASC-${user.id.slice(0, 6).toUpperCase()}`;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-xl w-[95vw] max-h-[92vh] overflow-y-auto bg-[#07090E]/95 backdrop-blur-2xl border-white/10 p-4 sm:p-6 text-white rounded-2xl">
        <DialogHeader className="pb-3 border-b border-white/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Crosshair className="w-4 h-4 text-cyan-400" />
              <DialogTitle className="font-mono text-sm tracking-widest uppercase text-zinc-300">
                OFFICIAL HUNTER LICENSE // DOSSIER
              </DialogTitle>
            </div>
            <Badge
              variant="outline"
              className="font-mono text-[10px] uppercase border-cyan-500/40 text-cyan-400 bg-cyan-950/30"
            >
              VERIFIED OPERATOR
            </Badge>
          </div>
          <DialogDescription className="text-zinc-400 text-xs">
            Dynamic Hunter identity synchronized with real-life verified executions. Tilt to inspect holographic seal.
          </DialogDescription>
        </DialogHeader>

        {/* Format Selector Pills */}
        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center gap-1.5 p-1 bg-black/60 border border-white/10 rounded-lg">
            <button
              onClick={() => setFormat("story")}
              className={`px-3 py-1 rounded-md text-xs font-mono transition-all ${
                format === "story" ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40" : "text-zinc-400 hover:text-white"
              }`}
            >
              9:16 Story (Insta / WhatsApp)
            </button>
            <button
              onClick={() => setFormat("badge")}
              className={`px-3 py-1 rounded-md text-xs font-mono transition-all ${
                format === "badge" ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40" : "text-zinc-400 hover:text-white"
              }`}
            >
              Compact Badge (Discord / Feed)
            </button>
          </div>

          <span className="text-[11px] font-mono text-zinc-500 hidden sm:inline">
            Interactive 3D Gyro Active
          </span>
        </div>

        {/* 3D Tilting License Container */}
        <div
          className="flex justify-center items-center py-2 perspective-[1000px]"
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        >
          <motion.div
            style={{
              rotateX,
              rotateY,
              transformStyle: "preserve-3d",
            }}
            transition={{ type: "spring", stiffness: 350, damping: 30 }}
            className="w-full flex justify-center"
          >
            {/* The Target Card Captured by html-to-image */}
            <div
              ref={cardRef}
              className={`relative overflow-hidden rounded-2xl border transition-all duration-300 select-none ${
                format === "story" ? "w-[340px] sm:w-[360px] min-h-[580px]" : "w-[340px] sm:w-[380px] min-h-[440px]"
              }`}
              style={{
                backgroundColor: "#0A0D14",
                borderColor: `${archetype.primaryColor}55`,
                boxShadow: `0 20px 50px rgba(0,0,0,0.8), 0 0 30px ${archetype.glowColor}`,
              }}
            >
              {/* Dynamic Holographic Foil Glare */}
              <motion.div
                className="absolute inset-0 pointer-events-none opacity-20 z-30"
                style={{
                  background: `radial-gradient(circle at ${glareX} ${glareY}, rgba(255,255,255,0.8) 0%, rgba(255,255,255,0) 60%)`,
                }}
              />

              {/* Background Cyber Grid */}
              <div 
                className="absolute inset-0 opacity-15 pointer-events-none z-0"
                style={{
                  backgroundImage: `linear-gradient(${archetype.primaryColor}22 1px, transparent 1px), linear-gradient(90deg, ${archetype.primaryColor}22 1px, transparent 1px)`,
                  backgroundSize: "24px 24px"
                }}
              />

              {/* Card Header Bar */}
              <div className="relative z-10 px-5 pt-5 pb-2 flex items-center justify-between border-b border-white/10 bg-black/40">
                <div className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full animate-ping"
                    style={{ backgroundColor: archetype.primaryColor }}
                  />
                  <div>
                    <h3 className="font-mono text-xs font-black tracking-widest uppercase text-white">
                      ASCENSION PROTOCOL
                    </h3>
                    <p className="font-mono text-[9px] text-zinc-400 tracking-wider">
                      HUNTER LICENSE // {hunterId}
                    </p>
                  </div>
                </div>

                {/* Tier Rank Seal */}
                <div
                  className="px-2.5 py-1 rounded-md font-mono text-sm font-black tracking-widest border"
                  style={{
                    backgroundColor: `${archetype.primaryColor}22`,
                    borderColor: archetype.primaryColor,
                    color: archetype.primaryColor,
                    boxShadow: `0 0 12px ${archetype.glowColor}`,
                  }}
                >
                  {user.tier}-TIER
                </div>
              </div>

              {/* Centerpiece: Ascendant Avatar Hero & Focus Companion */}
              <div className="relative z-10 px-4 py-3 flex flex-col items-center justify-center">
                {/* Class Title & Sub-heading */}
                <div className="text-center mb-1">
                  <span 
                    className="font-mono text-[10px] tracking-widest uppercase font-semibold block"
                    style={{ color: archetype.primaryColor }}
                  >
                    {tierVisuals.label} // {archetype.name}
                  </span>
                  <h2 className="text-xl sm:text-2xl font-black font-display tracking-tight text-white uppercase">
                    {user.name}
                  </h2>
                </div>

                {/* The Evolving Avatar */}
                <div className="relative my-[-10px]">
                  <AscendantAvatar
                    user={user}
                    size={format === "story" ? 270 : 210}
                    animate={false} // Clean static render for export
                  />

                  {/* Companion Pet Floating Badge */}
                  {pet && pet.stage !== "egg" && (
                    <motion.div
                      className="absolute bottom-4 right-2 px-2.5 py-1 rounded-xl bg-black/80 border border-white/20 backdrop-blur-md flex items-center gap-1.5 shadow-lg"
                      style={{ borderColor: `${archetype.primaryColor}66` }}
                    >
                      <span className="text-sm">
                        {pet.type === "dragon" ? "🐉" : pet.type === "wolf" ? "🐺" : "🐱"}
                      </span>
                      <div className="text-left font-mono">
                        <p className="text-[9px] font-bold text-white capitalize leading-none">{pet.name}</p>
                        <p className="text-[8px] text-zinc-400 capitalize leading-none mt-0.5">Lvl {pet.level} {pet.stage}</p>
                      </div>
                    </motion.div>
                  )}
                </div>

                {/* Weapon / Relic Mention */}
                <div className="mt-1 px-3 py-1 rounded-full bg-white/5 border border-white/10 flex items-center gap-1.5 text-center">
                  <Zap className="w-3 h-3 text-amber-400" />
                  <span className="font-mono text-[10px] text-zinc-300">
                    Implement: <strong className="text-white">{archetype.weaponName}</strong>
                  </span>
                </div>
              </div>

              {/* Telemetry Stats Grid */}
              <div className="relative z-10 px-5 py-3 bg-black/60 border-t border-white/10">
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="p-2 rounded-lg bg-white/[0.03] border border-white/5">
                    <p className="font-mono text-[9px] text-zinc-400 uppercase">Streak</p>
                    <p className="font-mono text-base font-black text-amber-400 flex items-center justify-center gap-1">
                      <Flame className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      {user.streak}D
                    </p>
                  </div>

                  <div className="p-2 rounded-lg bg-white/[0.03] border border-white/5">
                    <p className="font-mono text-[9px] text-zinc-400 uppercase">Level</p>
                    <p className="font-mono text-base font-black text-white">
                      LVL {user.level}
                    </p>
                  </div>

                  <div className="p-2 rounded-lg bg-white/[0.03] border border-white/5">
                    <p className="font-mono text-[9px] text-zinc-400 uppercase">Top Stat</p>
                    <p 
                      className="font-mono text-base font-black truncate capitalize"
                      style={{ color: archetype.primaryColor }}
                    >
                      {archetype.dominantStat}
                    </p>
                  </div>
                </div>

                {/* Story-Specific QR Code & Viral Hook */}
                {format === "story" && (
                  <div className="mt-3 pt-3 border-t border-white/10 flex items-center justify-between">
                    <div className="text-left font-mono">
                      <p className="text-[10px] text-zinc-300 font-bold uppercase">
                        CHALLENGE THIS HUNTER
                      </p>
                      <p className="text-[8px] text-zinc-400">
                        Scan or visit: <span className="text-cyan-400">ascensionprotocol.app</span>
                      </p>
                    </div>

                    <div className="p-1 rounded-md bg-white text-black">
                      <QrCode className="w-6 h-6" />
                    </div>
                  </div>
                )}
              </div>

              {/* Watermark Footer */}
              <div className="relative z-10 px-5 py-2 bg-[#05070B] flex items-center justify-between text-[8px] font-mono text-zinc-500 uppercase tracking-widest border-t border-white/5">
                <span>AUTHENTICITY: CRYPTOGRAPHIC PROOF</span>
                <span>SYSTEM ID: #AP-2026</span>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3 pt-3 border-t border-white/10">
          <Button
            variant="outline"
            onClick={handleCopyLink}
            className="border-white/10 bg-white/5 hover:bg-white/10 text-white font-mono text-xs h-10 flex items-center justify-center gap-2"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-cyan-400" />}
            <span>{copied ? "COPIED TO CLIPBOARD" : "COPY BRAG STATEMENT"}</span>
          </Button>

          <Button
            onClick={handleDownload}
            disabled={isExporting}
            style={{
              backgroundColor: archetype.primaryColor,
              color: "#000000",
            }}
            className="font-mono text-xs font-black h-10 hover:opacity-90 transition-opacity flex items-center justify-center gap-2 shadow-lg"
          >
            <Download className="w-4 h-4 text-black" />
            <span>{isExporting ? "GENERATING..." : "DOWNLOAD LOSSLESS PNG"}</span>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

