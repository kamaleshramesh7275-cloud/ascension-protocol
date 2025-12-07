
import { useState, useEffect, useCallback } from 'react';

export type PetType = 'cat' | 'dragon' | 'wolf';
export type PetStage = 'egg' | 'baby' | 'teen' | 'adult' | 'legendary';

export interface Pet {
    type: PetType;
    name: string;
    level: number;
    totalFocusMinutes: number;
    happiness: number; // 0-100
    stage: PetStage;
    lastFed: Date;
}

const DEFAULT_PET: Pet = {
    type: 'cat',
    name: 'Focus Buddy',
    level: 1,
    totalFocusMinutes: 0,
    happiness: 100,
    stage: 'egg',
    lastFed: new Date(),
};

const STAGE_THRESHOLDS = {
    egg: 0,
    baby: 30,
    teen: 120,
    adult: 360,
    legendary: 1200,
};

function calculateStage(minutes: number): PetStage {
    if (minutes >= STAGE_THRESHOLDS.legendary) return 'legendary';
    if (minutes >= STAGE_THRESHOLDS.adult) return 'adult';
    if (minutes >= STAGE_THRESHOLDS.teen) return 'teen';
    if (minutes >= STAGE_THRESHOLDS.baby) return 'baby';
    return 'egg';
}

function calculateLevel(minutes: number): number {
    return Math.floor(minutes / 60) + 1;
}

// Custom event name
const PET_UPDATED_EVENT = 'focus-pet-updated';

export function usePet() {
    const [pet, setPet] = useState<Pet>(() => {
        try {
            const saved = localStorage.getItem('focusPet');
            if (saved) {
                const parsed = JSON.parse(saved);
                return { ...parsed, lastFed: new Date(parsed.lastFed) };
            }
            return DEFAULT_PET;
        } catch (e) {
            return DEFAULT_PET;
        }
    });

    // Listen for updates from other components
    useEffect(() => {
        const handlePetUpdate = () => {
            try {
                const saved = localStorage.getItem('focusPet');
                if (saved) {
                    const parsed = JSON.parse(saved);
                    const newPet = { ...parsed, lastFed: new Date(parsed.lastFed) };
                    setPet(prev => {
                        // Simple equality check to avoid loops (ignoring lastFed for strict equality if needed, but full check is safer)
                        if (JSON.stringify(prev) !== JSON.stringify(newPet)) {
                            return newPet;
                        }
                        return prev;
                    });
                }
            } catch (e) {
                console.error("Failed to load pet data", e);
            }
        };

        window.addEventListener(PET_UPDATED_EVENT, handlePetUpdate);
        window.addEventListener('storage', handlePetUpdate);

        return () => {
            window.removeEventListener(PET_UPDATED_EVENT, handlePetUpdate);
            window.removeEventListener('storage', handlePetUpdate);
        };
    }, []);

    // Helper to persist and notify
    const updatePetState = useCallback((newPet: Pet) => {
        setPet(newPet);
        localStorage.setItem('focusPet', JSON.stringify(newPet));
        setTimeout(() => window.dispatchEvent(new Event(PET_UPDATED_EVENT)), 0);
    }, []);

    // Happiness decay over time
    useEffect(() => {
        const interval = setInterval(() => {
            setPet(prev => {
                const hoursSinceLastFed = (Date.now() - prev.lastFed.getTime()) / (1000 * 60 * 60);
                const happinessDecay = Math.floor(hoursSinceLastFed * 2);
                if (happinessDecay > 0) {
                    const updated = {
                        ...prev,
                        happiness: Math.max(0, prev.happiness - happinessDecay),
                    };
                    // We don't necessarily need to sync decay every minute across tabs, 
                    // but saving it locally is good.
                    localStorage.setItem('focusPet', JSON.stringify(updated));
                    return updated;
                }
                return prev;
            });
        }, 60000); // Check every minute

        return () => clearInterval(interval);
    }, []);

    const addFocusTime = useCallback((minutes: number) => {
        setPet(prev => {
            const newTotal = prev.totalFocusMinutes + minutes;
            const updated = {
                ...prev,
                totalFocusMinutes: newTotal,
                level: calculateLevel(newTotal),
                stage: calculateStage(newTotal),
                happiness: Math.min(100, prev.happiness + minutes * 2),
            };
            updatePetState(updated);
            return updated;
        });
    }, [updatePetState]);

    const feedPet = useCallback(() => {
        setPet(prev => {
            const updated = {
                ...prev,
                happiness: Math.min(100, prev.happiness + 10),
                lastFed: new Date(),
            };
            updatePetState(updated);
            return updated;
        });
    }, [updatePetState]);

    const changePetType = useCallback((type: PetType) => {
        setPet(prev => {
            const updated = { ...prev, type };
            updatePetState(updated);
            return updated;
        });
    }, [updatePetState]);

    const renamePet = useCallback((name: string) => {
        setPet(prev => {
            const updated = { ...prev, name };
            updatePetState(updated);
            return updated;
        });
    }, [updatePetState]);

    const resetPet = useCallback(() => {
        updatePetState(DEFAULT_PET);
    }, [updatePetState]);

    return {
        pet,
        addFocusTime,
        feedPet,
        changePetType,
        renamePet,
        resetPet,
    };
}
