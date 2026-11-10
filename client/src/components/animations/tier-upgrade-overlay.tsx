import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { User } from "@shared/schema";
import { AscendantAvatar } from "@/components/avatar/ascendant-avatar";
import { HunterLicenseModal } from "@/components/avatar/hunter-license-modal";
import { getHunterArchetype, getTierVisuals, AvatarTier } from "@/lib/avatar-engine";
import { audioEngine } from "@/lib/audio-engine";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Trophy, Share2, ArrowRight } from "lucide-react";

interface TierUpgradeOverlayProps {
    tier: string;
    onClose: () => void;
}

export function TierUpgradeOverlay({ tier, onClose }: TierUpgradeOverlayProps) {
    const { user: authUser } = useAuth();
    const { data: user } = useQuery<User>({
        queryKey: ["/api/user"],
        enabled: !!authUser,
    });

    const [showHunterLicense, setShowHunterLicense] = useState(false);

    const normTier = (tier.toUpperCase() || "D") as AvatarTier;
    const tierVisuals = getTierVisuals(normTier);
    const archetype = getHunterArchetype(user);

    useEffect(() => {
        // Play triumphant orchestral ascension fanfare on reveal
        audioEngine.playLootFanfare("legendary");
    }, []);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 text-white overflow-hidden backdrop-blur-2xl">
            {/* Background Noise/Grain */}
            <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.05] pointer-events-none" />

            {/* Massive Ambient Background Letter */}
            <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 0.08, scale: 1 }}
                transition={{ duration: 2, ease: "easeOut" }}
                className="absolute inset-0 flex items-center justify-center pointer-events-none select-none"
            >
                <span 
                    className="text-[45vw] font-black tracking-tighter leading-none"
                    style={{ color: archetype.primaryColor }}
                >
                    {tier}
                </span>
            </motion.div>

            {/* Ambient Radial Bloom */}
            <div 
                className="absolute w-[600px] h-[600px] rounded-full blur-[140px] pointer-events-none opacity-25"
                style={{ backgroundColor: archetype.primaryColor }}
            />

            <div className="relative z-10 flex flex-col items-center justify-center w-full max-w-xl p-6 sm:p-8 text-center space-y-6">
                {/* Header Subtitle */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3, duration: 0.8 }}
                    className="space-y-2"
                >
                    <div className="flex items-center justify-center gap-2">
                        <Sparkles className="w-4 h-4 text-amber-400" />
                        <span className="font-mono text-xs uppercase tracking-[0.3em] text-zinc-400 font-bold">
                            PROTOCOL EVOLUTION // CEREMONY
                        </span>
                        <Sparkles className="w-4 h-4 text-amber-400" />
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-black font-display uppercase tracking-tight text-white">
                        Rank Promotion Verified
                    </h2>
                </motion.div>

                {/* Newly Upgraded Avatar Center Stage */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.85 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.6, duration: 1, ease: "easeOut" }}
                    className="relative flex flex-col items-center justify-center my-2"
                >
                    <div className="relative">
                        <AscendantAvatar
                            user={user}
                            tierOverride={normTier}
                            size={240}
                            animate={true}
                        />

                        {/* Tier Rank Floating Crest */}
                        <div
                            className="absolute -bottom-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full font-mono text-sm font-black tracking-widest border shadow-xl flex items-center gap-1.5 whitespace-nowrap"
                            style={{
                                backgroundColor: "#0A0D14",
                                borderColor: archetype.primaryColor,
                                color: archetype.primaryColor,
                                boxShadow: `0 0 20px ${archetype.glowColor}`,
                            }}
                        >
                            <Trophy className="w-4 h-4" />
                            <span>{tierVisuals.label.toUpperCase()} // {tier}-TIER</span>
                        </div>
                    </div>
                </motion.div>

                {/* Unlocked Attributes & Description */}
                <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1, duration: 0.8 }}
                    className="space-y-3 max-w-md"
                >
                    <div className="p-3.5 rounded-xl bg-white/[0.04] border border-white/10 text-xs font-mono space-y-1">
                        <div className="text-zinc-400">EQUIPMENT UNLOCKED:</div>
                        <div className="text-white font-bold">{tierVisuals.armorName}</div>
                        <div className="text-zinc-400 text-[11px] mt-1">
                            Aura Effects: <span className="text-cyan-400">{tierVisuals.effects.join(", ")}</span>
                        </div>
                    </div>

                    <p className="text-xs text-zinc-400 font-mono leading-relaxed">
                        Your real-world discipline has permanently upgraded your hunter frequency. Your new stature is broadcast to your squad.
                    </p>
                </motion.div>

                {/* Action Buttons: Brag & Acknowledge */}
                <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1.3, duration: 0.8 }}
                    className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full pt-2"
                >
                    <Button
                        onClick={() => {
                            audioEngine.playTactileClick();
                            setShowHunterLicense(true);
                        }}
                        style={{
                            backgroundColor: archetype.primaryColor,
                            color: "#000000",
                        }}
                        className="font-mono text-xs font-black h-11 uppercase tracking-wider shadow-lg hover:opacity-90 flex items-center justify-center gap-2"
                    >
                        <Share2 className="w-4 h-4 text-black" />
                        <span>FLEX LICENSE (9:16)</span>
                    </Button>

                    <Button
                        variant="outline"
                        onClick={() => {
                            audioEngine.playCommandLock();
                            onClose();
                            window.dispatchEvent(new CustomEvent('rank-acknowledged'));
                        }}
                        className="border-white/15 bg-white/5 hover:bg-white/10 text-white font-mono text-xs h-11 uppercase tracking-wider flex items-center justify-center gap-2"
                    >
                        <span>ACKNOWLEDGE</span>
                        <ArrowRight className="w-4 h-4 text-zinc-400" />
                    </Button>
                </motion.div>
            </div>

            {/* Hunter License Modal Triggered from Ceremony */}
            {user && (
                <HunterLicenseModal
                    isOpen={showHunterLicense}
                    onClose={() => setShowHunterLicense(false)}
                    user={{ ...user, tier: normTier }}
                />
            )}
        </div>
    );
}
