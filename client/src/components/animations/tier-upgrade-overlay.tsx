import { motion } from "framer-motion";
import { useEffect, useState } from "react";

interface TierUpgradeOverlayProps {
    tier: string;
    onClose: () => void;
}

export function TierUpgradeOverlay({ tier, onClose }: TierUpgradeOverlayProps) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black text-white overflow-hidden">
            {/* Background Noise/Grain */}
            <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.05] pointer-events-none" />

            {/* Massive Background Letter */}
            <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 0.1, scale: 1 }}
                transition={{ duration: 2, ease: "easeOut" }}
                className="absolute inset-0 flex items-center justify-center pointer-events-none select-none"
            >
                <span className="text-[40vw] font-black text-white tracking-tighter leading-none">
                    {tier}
                </span>
            </motion.div>

            <div className="relative z-10 flex flex-col items-center justify-center w-full max-w-screen-lg p-12">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5, duration: 1 }}
                    className="flex flex-col items-center space-y-12"
                >
                    <div className="space-y-4 text-center">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: "100px" }}
                            transition={{ delay: 0.8, duration: 1, ease: "easeInOut" }}
                            className="h-px bg-white mx-auto"
                        />
                        <h2 className="text-sm uppercase tracking-[0.5em] text-zinc-400">Ascension Complete</h2>
                    </div>

                    <div className="relative">
                        <motion.h1
                            initial={{ opacity: 0, scale: 0.9, filter: "blur(10px)" }}
                            animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                            transition={{ delay: 1, duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
                            className="text-9xl md:text-[12rem] font-thin tracking-tighter text-white drop-shadow-[0_0_30px_rgba(255,255,255,0.5)]"
                        >
                            {tier}
                        </motion.h1>

                        {/* Subtle Glow Ring */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 0.5, scale: 1.1 }}
                            transition={{ delay: 1.2, duration: 2, repeat: Infinity, repeatType: "reverse" }}
                            className="absolute inset-0 bg-white/10 blur-[80px] rounded-full -z-10"
                        />
                    </div>

                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 2, duration: 1 }}
                        className="text-center space-y-8"
                    >
                        <p className="text-zinc-500 font-light tracking-wide max-w-md">
                            You have reached a new plateau of existence. Your potential has expanded.
                        </p>

                        <button
                            onClick={onClose}
                            className="group relative px-8 py-3 overflow-hidden rounded-full bg-white/5 hover:bg-white/10 transition-colors"
                        >
                            <span className="relative z-10 text-xs uppercase tracking-[0.2em] text-white">Acknowledge</span>
                            <div className="absolute inset-0 border border-white/10 rounded-full" />
                        </button>
                    </motion.div>
                </motion.div>
            </div>
        </div>
    );
}
