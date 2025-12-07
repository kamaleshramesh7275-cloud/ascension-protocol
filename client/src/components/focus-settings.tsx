import { motion, AnimatePresence } from "framer-motion";
import { X, Settings as SettingsIcon, Palette, Timer, Sparkles, Gamepad2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { useFocusSettings } from "@/hooks/use-focus-settings";
import { usePet, type PetType } from "@/hooks/use-pet";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

interface FocusSettingsProps {
    isOpen: boolean;
    onClose: () => void;
}

const THEMES = [
    { id: 'black-yellow', name: 'Black & Yellow', colors: ['#000000', '#eab308'] },
    { id: 'purple-dream', name: 'Purple Dream', colors: ['#1a0933', '#a855f7'] },
    { id: 'ocean-blue', name: 'Ocean Blue', colors: ['#001a33', '#3b82f6'] },
    { id: 'forest-green', name: 'Forest Green', colors: ['#0a1f0a', '#22c55e'] },
    { id: 'sunset-orange', name: 'Sunset Orange', colors: ['#1a0f00', '#f97316'] },
    { id: 'monochrome', name: 'Monochrome', colors: ['#000000', '#ffffff'] },
];

const TIMER_STYLES = [
    { id: 'segmented', name: 'Segmented Digits', desc: 'Individual digit cards' },
    { id: 'circular', name: 'Circular', desc: 'Numbers inside circle' },
    { id: 'minimal', name: 'Minimal', desc: 'Simple text display' },
];

const AMBIENT_SOUNDS = [
    { id: 'none', name: 'None' },
    { id: 'rain', name: 'Rain' },
    { id: 'forest', name: 'Forest' },
    { id: 'ocean', name: 'Ocean Waves' },
    { id: 'cafe', name: 'Coffee Shop' },
    { id: 'fireplace', name: 'Fireplace' },
];

const PET_TYPES: { id: PetType; name: string; emoji: string }[] = [
    { id: 'cat', name: 'Cosmic Cat', emoji: '🐱' },
    { id: 'dragon', name: 'Focus Dragon', emoji: '🐉' },
    { id: 'wolf', name: 'Zen Wolf', emoji: '🐺' },
];

export function FocusSettings({ isOpen, onClose }: FocusSettingsProps) {
    const { settings, updateSetting, resetSettings } = useFocusSettings();
    const { pet, changePetType, renamePet } = usePet();
    const { toast } = useToast();

    // Local state for temporary changes
    const [localSettings, setLocalSettings] = useState(settings);
    const [localPet, setLocalPet] = useState({ name: pet.name, type: pet.type });

    // Sync local state when panel opens
    useEffect(() => {
        if (isOpen) {
            setLocalSettings(settings);
            setLocalPet({ name: pet.name, type: pet.type });
        }
    }, [isOpen, settings, pet.name, pet.type]);

    const handleSave = () => {
        // Apply all settings
        Object.entries(localSettings).forEach(([key, value]) => {
            updateSetting(key as any, value);
        });

        // Apply pet changes
        if (localPet.name !== pet.name) renamePet(localPet.name);
        if (localPet.type !== pet.type) changePetType(localPet.type);

        toast({
            title: "Settings Saved",
            description: "Your focus environment has been updated.",
        });
        onClose();
    };

    const handleCancel = () => {
        onClose();
    };

    // Helper to update local settings
    const updateLocalSetting = (key: keyof typeof settings, value: any) => {
        setLocalSettings(prev => ({ ...prev, [key]: value }));
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={handleCancel}
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
                    />

                    {/* Settings Panel */}
                    <motion.div
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-black/95 backdrop-blur-xl border-l border-white/10 z-50 flex flex-col"
                    >
                        <div className="flex-1 overflow-y-auto p-6 space-y-6">
                            {/* Header */}
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-r from-yellow-500 to-amber-500 flex items-center justify-center">
                                        <SettingsIcon className="w-5 h-5 text-black" />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-bold text-white">Focus Settings</h2>
                                        <p className="text-sm text-white/50">Customize your experience</p>
                                    </div>
                                </div>
                                <Button
                                    onClick={handleCancel}
                                    variant="ghost"
                                    size="icon"
                                    className="text-white/70 hover:text-white hover:bg-white/10"
                                >
                                    <X className="w-5 h-5" />
                                </Button>
                            </div>

                            {/* Tabs */}
                            <Tabs defaultValue="theme" className="w-full">
                                <TabsList className="grid w-full grid-cols-4 bg-white/5">
                                    <TabsTrigger value="theme" className="data-[state=active]:bg-yellow-500 data-[state=active]:text-black">
                                        <Palette className="w-4 h-4" />
                                    </TabsTrigger>
                                    <TabsTrigger value="timer" className="data-[state=active]:bg-yellow-500 data-[state=active]:text-black">
                                        <Timer className="w-4 h-4" />
                                    </TabsTrigger>
                                    <TabsTrigger value="effects" className="data-[state=active]:bg-yellow-500 data-[state=active]:text-black">
                                        <Sparkles className="w-4 h-4" />
                                    </TabsTrigger>
                                    <TabsTrigger value="pet" className="data-[state=active]:bg-yellow-500 data-[state=active]:text-black">
                                        <Gamepad2 className="w-4 h-4" />
                                    </TabsTrigger>
                                </TabsList>

                                {/* Theme Tab */}
                                <TabsContent value="theme" className="space-y-4 mt-6">
                                    <div>
                                        <Label className="text-white mb-3 block">Color Theme</Label>
                                        <div className="grid grid-cols-2 gap-3">
                                            {THEMES.map((theme) => (
                                                <button
                                                    key={theme.id}
                                                    onClick={() => updateLocalSetting('theme', theme.id)}
                                                    className={`p-4 rounded-xl border-2 transition-all ${localSettings.theme === theme.id
                                                            ? 'border-yellow-500 bg-white/10'
                                                            : 'border-white/10 bg-white/5 hover:bg-white/10'
                                                        }`}
                                                >
                                                    <div className="flex gap-2 mb-2">
                                                        {theme.colors.map((color, i) => (
                                                            <div
                                                                key={i}
                                                                className="w-8 h-8 rounded-full border border-white/20"
                                                                style={{ backgroundColor: color }}
                                                            />
                                                        ))}
                                                    </div>
                                                    <p className="text-sm font-medium text-white">{theme.name}</p>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </TabsContent>

                                {/* Timer Tab */}
                                <TabsContent value="timer" className="space-y-4 mt-6">
                                    <div>
                                        <Label className="text-white mb-3 block">Timer Style</Label>
                                        <div className="space-y-2">
                                            {TIMER_STYLES.map((style) => (
                                                <button
                                                    key={style.id}
                                                    onClick={() => updateLocalSetting('timerStyle', style.id)}
                                                    className={`w-full p-4 rounded-xl border-2 text-left transition-all ${localSettings.timerStyle === style.id
                                                            ? 'border-yellow-500 bg-white/10'
                                                            : 'border-white/10 bg-white/5 hover:bg-white/10'
                                                        }`}
                                                >
                                                    <p className="text-sm font-semibold text-white">{style.name}</p>
                                                    <p className="text-xs text-white/50">{style.desc}</p>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </TabsContent>

                                {/* Effects Tab */}
                                <TabsContent value="effects" className="space-y-6 mt-6">
                                    <div>
                                        <Label className="text-white mb-3 block">
                                            Particle Density: {localSettings.particleDensity}
                                        </Label>
                                        <Slider
                                            value={[localSettings.particleDensity]}
                                            onValueChange={([value]) => updateLocalSetting('particleDensity', value)}
                                            min={0}
                                            max={50}
                                            step={5}
                                            className="w-full"
                                        />
                                    </div>

                                    <div>
                                        <Label className="text-white mb-3 block">
                                            Background Blur: {localSettings.backgroundBlur}px
                                        </Label>
                                        <Slider
                                            value={[localSettings.backgroundBlur]}
                                            onValueChange={([value]) => updateLocalSetting('backgroundBlur', value)}
                                            min={0}
                                            max={20}
                                            step={2}
                                            className="w-full"
                                        />
                                    </div>

                                    <div>
                                        <Label className="text-white mb-3 block">Ambient Sound</Label>
                                        <Select
                                            value={localSettings.ambientSound}
                                            onValueChange={(value) => updateLocalSetting('ambientSound', value)}
                                        >
                                            <SelectTrigger className="bg-white/5 border-white/10 text-white">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {AMBIENT_SOUNDS.map((sound) => (
                                                    <SelectItem key={sound.id} value={sound.id}>
                                                        {sound.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    {localSettings.ambientSound !== 'none' && (
                                        <div>
                                            <Label className="text-white mb-3 block">
                                                Volume: {localSettings.ambientVolume}%
                                            </Label>
                                            <Slider
                                                value={[localSettings.ambientVolume]}
                                                onValueChange={([value]) => updateLocalSetting('ambientVolume', value)}
                                                min={0}
                                                max={100}
                                                step={10}
                                                className="w-full"
                                            />
                                        </div>
                                    )}
                                </TabsContent>

                                {/* Pet Tab */}
                                <TabsContent value="pet" className="space-y-6 mt-6">
                                    <div>
                                        <Label className="text-white mb-3 block">Pet Name</Label>
                                        <Input
                                            value={localPet.name}
                                            onChange={(e) => setLocalPet(prev => ({ ...prev, name: e.target.value }))}
                                            className="bg-white/5 border-white/10 text-white"
                                            placeholder="Enter pet name"
                                        />
                                    </div>

                                    <div>
                                        <Label className="text-white mb-3 block">Pet Type</Label>
                                        <div className="grid grid-cols-3 gap-3">
                                            {PET_TYPES.map((petType) => (
                                                <button
                                                    key={petType.id}
                                                    onClick={() => setLocalPet(prev => ({ ...prev, type: petType.id }))}
                                                    className={`p-4 rounded-xl border-2 transition-all ${localPet.type === petType.id
                                                            ? 'border-yellow-500 bg-white/10'
                                                            : 'border-white/10 bg-white/5 hover:bg-white/10'
                                                        }`}
                                                >
                                                    <div className="text-4xl mb-2">{petType.emoji}</div>
                                                    <p className="text-xs font-medium text-white text-center">{petType.name}</p>
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="bg-white/5 rounded-xl p-4 space-y-2">
                                        <h3 className="text-sm font-semibold text-white">Pet Stats</h3>
                                        <div className="space-y-1 text-sm">
                                            <div className="flex justify-between">
                                                <span className="text-white/70">Level</span>
                                                <span className="text-white font-semibold">{pet.level}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-white/70">Stage</span>
                                                <span className="text-white font-semibold capitalize">{pet.stage}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-white/70">Focus Time</span>
                                                <span className="text-white font-semibold">{pet.totalFocusMinutes}m</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-white/70">Happiness</span>
                                                <span className="text-white font-semibold">{pet.happiness}%</span>
                                            </div>
                                        </div>
                                    </div>
                                </TabsContent>
                            </Tabs>

                            {/* Reset Button */}
                            <Button
                                onClick={resetSettings}
                                variant="outline"
                                className="w-full border-white/10 text-white/70 hover:text-white hover:bg-white/10"
                            >
                                Reset to Defaults
                            </Button>
                        </div>

                        {/* Footer with Save/Cancel */}
                        <div className="p-6 border-t border-white/10 bg-black/50 backdrop-blur-xl flex gap-3">
                            <Button
                                onClick={handleCancel}
                                variant="ghost"
                                className="flex-1 text-white hover:bg-white/10"
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleSave}
                                className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-black font-bold"
                            >
                                <Save className="w-4 h-4 mr-2" />
                                Save Changes
                            </Button>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
