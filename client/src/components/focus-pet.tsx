import { motion, AnimatePresence } from "framer-motion";
import { Heart, Sparkles, TrendingUp } from "lucide-react";
import { usePet, type PetType, type PetStage } from "@/hooks/use-pet";
import { Button } from "@/components/ui/button";
import { useState } from "react";

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
    const { pet, feedPet } = usePet();
    const [showStats, setShowStats] = useState(false);
    const [isFeeding, setIsFeeding] = useState(false);

    const handleFeed = () => {
        setIsFeeding(true);
        feedPet();
        setTimeout(() => setIsFeeding(false), 1000);
    };

    const emoji = PET_EMOJIS[pet.type][pet.stage];
    const nextStageMinutes = getNextStageMinutes(pet.stage);
    const progress = nextStageMinutes ? (pet.totalFocusMinutes / nextStageMinutes) * 100 : 100;

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

                    {/* Sparkles Effect */}
                    {pet.stage === 'legendary' && (
                        <motion.div
                            className="absolute inset-0 pointer-events-none"
                            animate={{
                                opacity: [0.3, 0.7, 0.3],
                            }}
                            transition={{
                                duration: 2,
                                repeat: Infinity,
                            }}
                        >
                            {[...Array(6)].map((_, i) => (
                                <motion.div
                                    key={i}
                                    className="absolute text-yellow-400"
                                    style={{
                                        left: `${20 + i * 15}%`,
                                        top: `${10 + (i % 2) * 40}%`,
                                    }}
                                    animate={{
                                        y: [-5, 5, -5],
                                        opacity: [0, 1, 0],
                                    }}
                                    transition={{
                                        duration: 1.5,
                                        repeat: Infinity,
                                        delay: i * 0.2,
                                    }}
                                >
                                    ✨
                                </motion.div>
                            ))}
                        </motion.div>
                    )}
                </motion.div>

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
                                            <Sparkles className="w-4 h-4 text-amber-400" />
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
                                    Feed Pet (+10 ❤️)
                                </Button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
        </div>
    );
}

function getNextStageMinutes(stage: PetStage): number | null {
    switch (stage) {
        case 'egg': return 30;
        case 'baby': return 120;
        case 'teen': return 360;
        case 'adult': return 1200;
        case 'legendary': return null;
    }
}
