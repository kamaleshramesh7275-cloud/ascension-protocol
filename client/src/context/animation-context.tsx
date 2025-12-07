import React, { createContext, useContext, useState, ReactNode } from "react";
import { AnimatePresence } from "framer-motion";
import { QuestCompletedOverlay } from "@/components/animations/quest-completed-overlay";
import { TierUpgradeOverlay } from "@/components/animations/tier-upgrade-overlay";

interface QuestCompletionData {
    title: string;
    xp: number;
    coins: number;
}

interface AnimationContextType {
    showQuestCompleted: (title: string, xp: number, coins: number) => void;
    showTierUpgrade: (tier: string) => void;
}

const AnimationContext = createContext<AnimationContextType | undefined>(undefined);

export function AnimationProvider({ children }: { children: ReactNode }) {
    const [questData, setQuestData] = useState<QuestCompletionData | null>(null);
    const [newTier, setNewTier] = useState<string | null>(null);

    const showQuestCompleted = (title: string, xp: number, coins: number) => {
        setQuestData({ title, xp, coins });
        // Auto-close after 5 seconds if not clicked
        setTimeout(() => {
            setQuestData(prev => (prev?.title === title ? null : prev));
        }, 5000);
    };

    const showTierUpgrade = (tier: string) => {
        setNewTier(tier);
    };

    return (
        <AnimationContext.Provider value={{ showQuestCompleted, showTierUpgrade }}>
            {children}
            <AnimatePresence>
                {questData && (
                    <QuestCompletedOverlay
                        key="quest-overlay"
                        questTitle={questData.title}
                        xp={questData.xp}
                        coins={questData.coins}
                        onClose={() => setQuestData(null)}
                    />
                )}
                {newTier && (
                    <TierUpgradeOverlay
                        key="tier-overlay"
                        tier={newTier}
                        onClose={() => setNewTier(null)}
                    />
                )}
            </AnimatePresence>
        </AnimationContext.Provider>
    );
}

export function useAnimations() {
    const context = useContext(AnimationContext);
    if (context === undefined) {
        throw new Error("useAnimations must be used within an AnimationProvider");
    }
    return context;
}
