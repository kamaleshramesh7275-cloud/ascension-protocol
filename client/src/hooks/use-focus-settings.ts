import { useState, useEffect, useCallback } from 'react';

export interface FocusSettings {
    theme: 'black-yellow' | 'purple-dream' | 'ocean-blue' | 'forest-green' | 'sunset-orange' | 'monochrome';
    timerStyle: 'segmented' | 'circular' | 'minimal';
    particleDensity: number;
    backgroundBlur: number;
    musicEnabled: boolean;
    currentTrack: number;
    ambientSound: 'none' | 'rain' | 'forest' | 'ocean' | 'cafe' | 'fireplace';
    ambientVolume: number;
}

const DEFAULT_SETTINGS: FocusSettings = {
    theme: 'black-yellow',
    timerStyle: 'segmented',
    particleDensity: 20,
    backgroundBlur: 10,
    musicEnabled: false,
    currentTrack: 0,
    ambientSound: 'none',
    ambientVolume: 50,
};

// Custom event name
const SETTINGS_UPDATED_EVENT = 'focus-settings-updated';

export function useFocusSettings() {
    // Initialize from localStorage
    const [settings, setSettings] = useState<FocusSettings>(() => {
        try {
            const saved = localStorage.getItem('focusSettings');
            return saved ? JSON.parse(saved) : DEFAULT_SETTINGS;
        } catch (e) {
            return DEFAULT_SETTINGS;
        }
    });

    // Listen for updates from other components
    useEffect(() => {
        const handleSettingsUpdate = () => {
            try {
                const saved = localStorage.getItem('focusSettings');
                if (saved) {
                    const newSettings = JSON.parse(saved);
                    setSettings(prev => {
                        if (JSON.stringify(prev) !== JSON.stringify(newSettings)) {
                            return newSettings;
                        }
                        return prev;
                    });
                }
            } catch (e) {
                console.error("Failed to load settings", e);
            }
        };

        window.addEventListener(SETTINGS_UPDATED_EVENT, handleSettingsUpdate);
        // Also listen for storage events (cross-tab sync)
        window.addEventListener('storage', handleSettingsUpdate);

        return () => {
            window.removeEventListener(SETTINGS_UPDATED_EVENT, handleSettingsUpdate);
            window.removeEventListener('storage', handleSettingsUpdate);
        };
    }, []);

    const updateSetting = useCallback(<K extends keyof FocusSettings>(
        key: K,
        value: FocusSettings[K]
    ) => {
        setSettings(prev => {
            const newSettings = { ...prev, [key]: value };
            localStorage.setItem('focusSettings', JSON.stringify(newSettings));
            return newSettings;
        });
        // Dispatch event asynchronously to avoid render loops
        setTimeout(() => window.dispatchEvent(new Event(SETTINGS_UPDATED_EVENT)), 0);
    }, []);

    const resetSettings = useCallback(() => {
        setSettings(DEFAULT_SETTINGS);
        localStorage.setItem('focusSettings', JSON.stringify(DEFAULT_SETTINGS));
        setTimeout(() => window.dispatchEvent(new Event(SETTINGS_UPDATED_EVENT)), 0);
    }, []);

    return { settings, updateSetting, resetSettings };
}
