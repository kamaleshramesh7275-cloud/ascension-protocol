import { motion, AnimatePresence } from "framer-motion";
import { Heart, TrendingUp } from "lucide-react";
import { usePet, type PetType, type PetStage } from "@/hooks/use-pet";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

const PET_EMOJIS: Record<PetType, Record<PetStage, string>> = {
    cat: {
        egg: '🥚',
        baby: '🐱',
        teen: '😺',
        adult: '😸',
        legendary: '😻✨',
    },
    dragon: {
        egg: '🥚',
        baby: '🐉',
        teen: '🐲',
        adult: '🔥🐲',
        legendary: '⚡🐉✨',
    },
    wolf: {
        egg: '🥚',
        baby: '🐺',
        teen: '🐕',
        adult: '🐺',
        legendary: '🌙🐺✨',
    },
};

const PET_NAMES: Record<PetType, string> = {
    cat: 'Cosmic Cat',
    dragon: 'Focus Dragon',
    wolf: 'Zen Wolf',
};

export function FocusPet() {
    const { pet, feedPet, evolvePet } = usePet();
    const [showStats, setShowStats] = useState(false);
    const [isFeeding, setIsFeeding] = useState(false);
    const [showEvolution, setShowEvolution] = useState(false);
    const { toast } = useToast();

    const handleFeed = async (e: React.MouseEvent) => {
        e.stopPropagation(); // Prevent container click
        if (isFeeding) return;

        try {
            setIsFeeding(true);
            await apiRequest("POST", "/api/user/feed-pet", {});

            feedPet(); // Update local state
            queryClient.invalidateQueries({ queryKey: ["/api/user"] }); // Update coins

            toast({
                title: "Yummy! 🍎",
                description: "Pet fed! (+10 Happiness, -50 Coins)",
            });

            setTimeout(() => setIsFeeding(false), 1000);
        } catch (error) {
            setIsFeeding(false);
            toast({
                title: "Cannot feed pet",
                description: "You need 50 coins to feed your pet!",
                variant: "destructive",
            });
        }
    };

    const handleEvolve = (type: PetType) => {
        evolvePet(type);
        setShowEvolution(false);
        toast({
            title: "Evolution Complete! 🌟",
            description: `Your pet has evolved into a ${PET_NAMES[type]}!`,
        });
    };

    const emoji = PET_EMOJIS[pet.type][pet.stage];
    const nextStageMinutes = getNextStageMinutes(pet.stage);
    const progress = nextStageMinutes ? (pet.totalFocusMinutes / nextStageMinutes) * 100 : 100;
    const canEvolve = !pet.hasChosenPath && pet.level >= 5;

    return (
        <div className="fixed bottom-8 right-8 z-40">
            {/* Pet Display */}
            <motion.div
                className="relative"
                onHoverStart={() => setShowStats(true)}
                onHoverEnd={() => setShowStats(false)}
                whileHover={{ scale: 1.1 }}
            >
                {/* Pet Container */}
                <motion.div
                    className="w-32 h-32 bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl flex items-center justify-center cursor-pointer overflow-hidden"
                    animate={{
                        y: [0, -10, 0],
                    }}
                    transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut",
                    }}
                    onClick={handleFeed}
                >
                    {/* Pet Emoji */}
                    <motion.div
                        className="text-7xl"
                        animate={isFeeding ? {
                            scale: [1, 1.3, 1],
                            rotate: [0, 10, -10, 0],
                        } : {}}
                        transition={{ duration: 0.5 }}
                    >
                        {emoji}
                    </motion.div>

                    {/* Sparkles Effect Removed */}
                </motion.div>

                {/* Evolution Indicator */}
                <AnimatePresence>
                    {canEvolve && (
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0 }}
                            className="absolute -top-4 -right-4 z-50"
                        >
                            <Button
                                size="sm"
                                className="h-8 w-8 rounded-full p-0 bg-yellow-400 hover:bg-yellow-500 text-black border-2 border-white shadow-lg animate-bounce"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setShowEvolution(true);
                                }}
                            >
                                ✨
                            </Button>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Level Badge */}
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-r from-yellow-500 to-amber-500 rounded-full flex items-center justify-center text-black font-bold text-sm border-2 border-white/20">
                    {pet.level}
                </div>

                {/* Happiness Bar */}
                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-24 h-2 bg-black/50 rounded-full overflow-hidden border border-white/10">
                    <motion.div
                        className="h-full bg-gradient-to-r from-pink-500 to-red-500"
                        initial={{ width: 0 }}
                        animate={{ width: `${pet.happiness}%` }}
                        transition={{ duration: 0.5 }}
                    />
                </div>

                {/* Stats Tooltip */}
                <AnimatePresence>
                    {showStats && (
                        <motion.div
                            initial={{ opacity: 0, y: 10, scale: 0.9 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 10, scale: 0.9 }}
                            className="absolute bottom-full mb-4 right-0 w-64 bg-black/90 backdrop-blur-md border border-white/20 rounded-2xl p-4 shadow-2xl"
                        >
                            <div className="space-y-3">
                                {/* Name & Type */}
                                <div>
                                    <h3 className="text-lg font-bold text-white">{pet.name}</h3>
                                    <p className="text-sm text-yellow-400">{PET_NAMES[pet.type]}</p>
                                    <p className="text-xs text-white/50 capitalize">Stage: {pet.stage}</p>
                                </div>

                                {/* Stats */}
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-white/70 flex items-center gap-1">
                                            <Heart className="w-4 h-4 text-pink-400" />
                                            Happiness
                                        </span>
                                        <span className="text-white font-semibold">{pet.happiness}%</span>
                                    </div>

                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-white/70 flex items-center gap-1">
                                            <TrendingUp className="w-4 h-4 text-yellow-400" />
                                            Level
                                        </span>
                                        <span className="text-white font-semibold">{pet.level}</span>
                                    </div>

                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-white/70 flex items-center gap-1">
                                            Focus Time
                                        </span>
                                        <span className="text-white font-semibold">{pet.totalFocusMinutes}m</span>
                                    </div>
                                </div>

                                {/* Progress to Next Stage */}
                                {pet.stage !== 'legendary' && (
                                    <div>
                                        <div className="flex justify-between text-xs text-white/50 mb-1">
                                            <span>Next Stage</span>
                                            <span>{Math.floor(progress)}%</span>
                                        </div>
                                        <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                                            <motion.div
                                                className="h-full bg-gradient-to-r from-yellow-500 to-amber-500"
                                                initial={{ width: 0 }}
                                                animate={{ width: `${progress}%` }}
                                            />
                                        </div>
                                    </div>
                                )}

                                {/* Feed Button */}
                                <Button
                                    onClick={handleFeed}
                                    size="sm"
                                    className="w-full bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-600 hover:to-amber-600 text-black font-semibold"
                                >
                                    Feed Pet (50 Coins)
                                </Button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>

            {/* Evolution Modal */}
            <AnimatePresence>
                {showEvolution && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-zinc-900 border border-white/10 p-6 rounded-2xl max-w-md w-full space-y-6 shadow-xl"
                        >
                            <div className="text-center space-y-2">
                                <h2 className="text-2xl font-bold text-white">Evolution Time! 🥚✨</h2>
                                <p className="text-gray-400">Your pet is ready to evolve. Choose its destiny!</p>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <button
                                    onClick={() => handleEvolve('wolf')}
                                    className="p-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all group"
                                >
                                    <div className="text-4xl mb-2 group-hover:scale-110 transition-transform">🐺</div>
                                    <div className="font-bold text-white">Zen Wolf</div>
                                    <div className="text-xs text-gray-400 mt-1">Loyal & Focused</div>
                                </button>
                                <button
                                    onClick={() => handleEvolve('dragon')}
                                    className="p-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all group"
                                >
                                    <div className="text-4xl mb-2 group-hover:scale-110 transition-transform">🐉</div>
                                    <div className="font-bold text-white">Focus Dragon</div>
                                    <div className="text-xs text-gray-400 mt-1">Powerful & Wise</div>
                                </button>
                            </div>

                            <Button
                                variant="ghost"
                                className="w-full text-gray-400 hover:text-white"
                                onClick={() => setShowEvolution(false)}
                            >
                                Decide Later
                            </Button>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}

function getNextStageMinutes(stage: PetStage): number | null {
    switch (stage) {
        case 'egg': return 240; // Evolution at Level 5 (4 hours)
        case 'baby': return 360; // Growth to Teen at 6 hours
        case 'teen': return 900; // Growth to Adult at 15 hours
        case 'adult': return 2400; // Legendary at 40 hours
        case 'legendary': return null;
    }
}
