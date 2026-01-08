
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Lock, Crown, Timer, ArrowRight, Shield } from "lucide-react";
import { Link, useLocation } from "wouter";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/use-auth";

export function TrialExpiredOverlay() {
    const [, setLocation] = useLocation();
    const { user } = useAuth();

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-xl p-4">
            {/* Dynamic Background */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-red-900/20 rounded-full blur-[100px] animate-pulse" />
                <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-orange-900/20 rounded-full blur-[100px] animate-pulse delay-75" />
            </div>

            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="relative w-full max-w-lg"
            >
                <Card className="border-red-500/30 bg-black/80 backdrop-blur-2xl shadow-2xl shadow-red-900/20 overflow-hidden">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-red-900/40 to-orange-900/40 p-6 text-center border-b border-white/5 relative">
                        <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-red-500/50 to-transparent" />
                        <div className="w-16 h-16 bg-red-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-red-500/30 shadow-[0_0_15px_rgba(239,68,68,0.3)]">
                            <Lock className="w-8 h-8 text-red-500" />
                        </div>
                        <h2 className="text-2xl font-bold text-white tracking-tight">Ascension Paused</h2>
                        <p className="text-red-200/60 text-sm font-medium uppercase tracking-widest mt-1">Trial Period Expired</p>
                    </div>

                    <div className="p-8 space-y-6">
                        <div className="text-center space-y-2">
                            <p className="text-muted-foreground leading-relaxed">
                                Your 48-hour initiation trial has concluded. To continue your journey and access the full protocol, premium activation is required.
                            </p>
                        </div>

                        <div className="space-y-3">
                            <div className="flex items-center gap-4 p-4 bg-white/5 rounded-xl border border-white/5 hover:border-yellow-500/30 transition-colors group">
                                <div className="p-2 bg-yellow-500/10 rounded-lg group-hover:bg-yellow-500/20 transition-colors">
                                    <Crown className="w-5 h-5 text-yellow-500" />
                                </div>
                                <div className="flex-1">
                                    <h4 className="font-bold text-white">Full Protocol Access</h4>
                                    <p className="text-xs text-muted-foreground">Unlock Dashboard, Quests, Stats & more</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-4 p-4 bg-white/5 rounded-xl border border-white/5 hover:border-blue-500/30 transition-colors group">
                                <div className="p-2 bg-blue-500/10 rounded-lg group-hover:bg-blue-500/20 transition-colors">
                                    <Timer className="w-5 h-5 text-blue-500" />
                                </div>
                                <div className="flex-1">
                                    <h4 className="font-bold text-white">Focus Sanctum</h4>
                                    <p className="text-xs text-muted-foreground">Unlimited deep work sessions</p>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-3 pt-2">
                            <Button
                                onClick={() => setLocation("/store?tab=premium")}
                                className="w-full h-14 bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-400 hover:to-amber-500 text-black font-bold text-lg shadow-lg shadow-yellow-500/20 relative overflow-hidden group"
                            >
                                <span className="relative z-10 flex items-center gap-2">
                                    Upgrade Now <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                </span>
                                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                            </Button>

                            <div className="text-center">
                                <button
                                    onClick={() => setLocation("/focus")}
                                    className="text-xs text-muted-foreground hover:text-white transition-colors uppercase tracking-widest border-b border-transparent hover:border-white/20 pb-0.5"
                                >
                                    Use Free Focus Timer (1/Day)
                                </button>
                            </div>
                        </div>
                    </div>
                </Card>
            </motion.div>
        </div>
    );
}
