import { motion, AnimatePresence } from "framer-motion";
import { Heart, TrendingUp } from "lucide-react";
import { usePet, type PetType, type PetStage } from "@/hooks/use-pet";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { getHunterArchetype } from "@/lib/avatar-engine";
import { useQuery } from "@tanstack/react-query";
import { User } from "@shared/schema";

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

const ARCHETYPE_MUTATIONS: Record<string, Record<PetType, { adult: string; legendary: string; name: string; auraTitle: string }>> = {
    chrono_sage: {
        cat: { adult: '🔮😺', legendary: '🌌🐱✨', name: 'Sphinx of Chronos', auraTitle: '+15% Intellect Velocity' },
        dragon: { adult: '⚡🐉', legendary: '💎🐉⚡', name: 'Aether Spellweaver', auraTitle: '+20% Deep Work Multiplier' },
        wolf: { adult: '🔮🐺', legendary: '✨🐺🔮', name: 'Astral Void Stalker', auraTitle: '+15% Cognitive Flow' },
    },
    iron_vanguard: {
        cat: { adult: '⚔️🐯', legendary: '⚔️🐅🔥', name: 'Iron Saber-Tiger', auraTitle: '+15% Kinetic Resilience' },
        dragon: { adult: '🌋🐲', legendary: '🌋🐲💥', name: 'Magma Dread-Wyrm', auraTitle: '+20% Raw Power Output' },
        wolf: { adult: '🛡️🐺', legendary: '🛡️🐺⚡', name: 'Titan Fenrir', auraTitle: '+15% Heavy Iron Will' },
    },
    void_reaver: {
        cat: { adult: '🌑🐈‍⬛', legendary: '🌑🐈‍⬛💜', name: 'Shadow Chimera', auraTitle: '+15% Air-Gap Shielding' },
        dragon: { adult: '👑🐉', legendary: '👑🐉🖤', name: 'Void Sovereign Wyrm', auraTitle: '+20% Zero-Breach Mastery' },
        wolf: { adult: '🌙🐺', legendary: '🌙🐺🩸', name: 'Eclipse Nightstalker', auraTitle: '+15% Dopamine Armor' },
    },
    bio_aegis: {
        cat: { adult: '🌿🐱', legendary: '🌿🐱💚', name: 'Celestial Neko-Sprout', auraTitle: '+15% Vitality Restoration' },
        dragon: { adult: '🍃🐉', legendary: '🍃🐉✨', name: 'Verdant World-Dragon', auraTitle: '+20% Stamina Regeneration' },
        wolf: { adult: '🌲🐺', legendary: '🌲🐺🌿', name: 'Forest Sentinel', auraTitle: '+15% Biological Recovery' },
    },
    omni_ascendant: {
        cat: { adult: '🌟🐱', legendary: '☀️🐱✨', name: 'Solar Apex Feline', auraTitle: '+18% Balanced Equilibrium' },
        dragon: { adult: '🌟🐉', legendary: '👑🐉☀️', name: 'Omni Celestial Dragon', auraTitle: '+25% Transcendent Surge' },
        wolf: { adult: '🌟🐺', legendary: '☀️🐺✨', name: 'Golden Sol Wolf', auraTitle: '+18% Universal Harmony' },
    },
};

const PET_NAMES: Record<PetType, string> = {
    cat: 'Cosmic Cat',
    dragon: 'Focus Dragon',
    wolf: 'Zen Wolf',
};

interface FocusPetProps {
    className?: string;
}

export function FocusPet({ className }: FocusPetProps) {
    const { pet, feedPet, evolvePet } = usePet();
    const { user: authUser } = useAuth();
    const { data: user } = useQuery<User>({
        queryKey: ["/api/user"],
        enabled: !!authUser
    });
    const archetype = getHunterArchetype(user);
    const mutation = ARCHETYPE_MUTATIONS[archetype.id]?.[pet.type];

    const [showStats, setShowStats] = useState(false);
    const [isFeeding, setIsFeeding] = useState(false);
    const [showEvolution, setShowEvolution] = useState(false);
    const [isEvolvingStatus, setIsEvolvingStatus] = useState(false); // For the animation
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
                description: "Pet fed! (+1 Level, +10 Happiness, -50 Coins)",
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
        setShowEvolution(false);
        setIsEvolvingStatus(true);

        // Play animation then evolve
        setTimeout(() => {
            evolvePet(type);
            setIsEvolvingStatus(false);
            toast({
                title: "Evolution Complete! 🌟",
                description: `Your pet has evolved into a ${PET_NAMES[type]}!`,
            });
        }, 3000);
    };

    let emoji = PET_EMOJIS[pet.type][pet.stage];
    let activePetName = PET_NAMES[pet.type];
    let activeAura = "Focus Resonance (+5% XP)";

    if (mutation && (pet.stage === "adult" || pet.stage === "legendary")) {
        emoji = pet.stage === "legendary" ? mutation.legendary : mutation.adult;
        activePetName = mutation.name;
        activeAura = mutation.auraTitle;
    }

    const nextStageMinutes = getNextStageMinutes(pet.stage);
    const progress = nextStageMinutes ? (pet.totalFocusMinutes / nextStageMinutes) * 100 : 100;
    const canEvolve = !pet.hasChosenPath && pet.level >= 5;

    return (
        <>
            <div className={className || "fixed bottom-8 right-8 z-40"} data-tour="focus-pet">
                {/* Pet Display */}
                <motion.div
                    className="relative"
                    onHoverStart={() => setShowStats(true)}
                    onHoverEnd={() => setShowStats(false)}
                    whileHover={{ scale: 1.1 }}
                >
                    {/* Pet Container */}
                    <motion.div
                        className="w-32 h-32 bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl flex items-center justify-center cursor-pointer overflow-hidden shadow-2xl"
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
                            className="text-7xl select-none"
                            animate={isFeeding ? {
                                scale: [1, 1.3, 1],
                                rotate: [0, 10, -10, 0],
                            } : {}}
                            transition={{ duration: 0.5 }}
                        >
                            {emoji}
                        </motion.div>
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
                    <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-r from-yellow-500 to-amber-500 rounded-full flex items-center justify-center text-black font-bold text-sm border-2 border-white/20 shadow-lg">
                        {pet.level}
                    </div>

                    {/* Happiness Bar */}
                    <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-24 h-2 bg-black/50 rounded-full overflow-hidden border border-white/10 shadow-lg">
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
                                className="absolute bottom-full mb-4 right-0 w-64 bg-black/90 backdrop-blur-md border border-white/20 rounded-2xl p-4 shadow-2xl z-50"
                            >
                                <div className="space-y-3">
                                    {/* Name & Type */}
                                    <div>
                                        <h3 className="text-lg font-bold text-white">{pet.name}</h3>
                                        <p className="text-sm font-bold text-yellow-400">{activePetName}</p>
                                        <div className="flex items-center justify-between mt-0.5">
                                            <span className="text-xs text-white/50 capitalize">Stage: {pet.stage}</span>
                                            <span className="text-[10px] font-mono font-bold text-cyan-400 bg-cyan-950/40 px-1.5 py-0.5 rounded border border-cyan-500/30">
                                                {activeAura}
                                            </span>
                                        </div>
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
                        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
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

            {/* Cinematic Evolution Animation Overlay */}
            <AnimatePresence>
                {isEvolvingStatus && (
                    <motion.div
                        className="fixed inset-0 z-[100] flex items-center justify-center bg-black"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.5 }}
                    >
                        {/* Light burst */}
                        <motion.div
                            className="absolute inset-0 bg-white"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: [0, 1, 0] }}
                            transition={{ duration: 2.5, times: [0, 0.1, 1], ease: "easeInOut" }}
                        />

                        <div className="relative z-10 flex flex-col items-center">
                            <motion.div
                                className="text-9xl mb-8 filter drop-shadow-[0_0_50px_rgba(255,255,255,0.8)]"
                                animate={{
                                    scale: [1, 1.5, 0],
                                    rotate: [0, 360, 720],
                                    filter: ["blur(0px)", "blur(10px)", "blur(0px)"]
                                }}
                                transition={{ duration: 2.5, ease: "easeInOut" }}
                            >
                                🥚
                            </motion.div>
                            <motion.h2
                                className="text-4xl font-bold text-white tracking-widest uppercase"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.5 }}
                            >
                                Evolving...
                            </motion.h2>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
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
