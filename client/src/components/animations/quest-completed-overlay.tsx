import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Trophy, Check } from "lucide-react";

interface QuestCompletedOverlayProps {
    questTitle: string;
    xp: number;
    coins: number;
    onClose: () => void;
}

export function QuestCompletedOverlay({ questTitle, xp, coins, onClose }: QuestCompletedOverlayProps) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <motion.div
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 40 }}
                transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }} // Apple-style ease
                className="relative"
            >
                {/* Shimmer Border Effect */}
                <div className="absolute -inset-[1px] rounded-xl bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-50 blur-sm" />

                <Card className="w-[450px] bg-[#0A0A0A] border-white/10 text-center overflow-hidden shadow-2xl rounded-xl relative z-10">
                    {/* Subtle Background Texture */}
                    <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.03]" />

                    <div className="p-10 space-y-8 relative z-10">
                        <motion.div
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: 0.2, duration: 0.5 }}
                            className="w-16 h-16 mx-auto bg-white/5 rounded-full flex items-center justify-center border border-white/10"
                        >
                            <Check className="w-8 h-8 text-white" />
                        </motion.div>

                        <div className="space-y-2">
                            <motion.h2
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3, duration: 0.5 }}
                                className="text-xs font-medium tracking-[0.3em] text-zinc-500 uppercase"
                            >
                                Quest Completed
                            </motion.h2>
                            <motion.h3
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.4, duration: 0.5 }}
                                className="text-2xl font-light text-white tracking-wide"
                            >
                                {questTitle}
                            </motion.h3>
                        </div>

                        <div className="flex items-center justify-center gap-12 py-6 border-t border-white/5 border-b">
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.6 }}
                                className="text-center"
                            >
                                <div className="text-3xl font-light text-white tabular-nums">{xp}</div>
                                <div className="text-[10px] uppercase tracking-widest text-zinc-600 mt-1">Experience</div>
                            </motion.div>
                            <div className="w-px h-10 bg-white/5" />
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.7 }}
                                className="text-center"
                            >
                                <div className="text-3xl font-light text-white tabular-nums">{coins}</div>
                                <div className="text-[10px] uppercase tracking-widest text-zinc-600 mt-1">Coins</div>
                            </motion.div>
                        </div>

                        <motion.button
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.9 }}
                            onClick={onClose}
                            className="text-xs text-zinc-500 hover:text-white transition-colors uppercase tracking-widest"
                        >
                            Dismiss
                        </motion.button>
                    </div>
                </Card>
            </motion.div>
        </div>
    );
}
