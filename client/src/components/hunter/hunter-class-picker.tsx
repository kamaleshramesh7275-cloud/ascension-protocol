import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Shield, Zap, Flame, Award, Dumbbell, Sparkles, Check, Crown } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export interface HunterClassOption {
  id: "assassin" | "tank" | "ranger" | "mage" | "monarch";
  name: string;
  tagline: string;
  description: string;
  icon: string;
  color: string;
  borderHover: string;
  primaryStat: string;
}

export const HUNTER_CLASSES: HunterClassOption[] = [
  {
    id: "assassin",
    name: "Shadow Assassin",
    tagline: "Agility & Bodyweight Mastery",
    description: "Lightning kinetic burst, high-rep calisthenics, precision diamond pushups, and explosive speed.",
    icon: "🗡️",
    color: "from-cyan-500/20 to-blue-500/10",
    borderHover: "hover:border-cyan-400 border-cyan-500/30",
    primaryStat: "Agility & Stamina",
  },
  {
    id: "tank",
    name: "Iron Tank",
    tagline: "Raw Strength & Hypertrophy",
    description: "Mechanical tension, progressive overload, heavy compound presses, and unyielding physical armor.",
    icon: "🛡️",
    color: "from-amber-500/20 to-orange-500/10",
    borderHover: "hover:border-amber-400 border-amber-500/30",
    primaryStat: "Strength & Vitality",
  },
  {
    id: "ranger",
    name: "Phantom Ranger",
    tagline: "VO2 Max & Aerobic Pacing",
    description: "Distance stamina, interval tempos, high-cadence road runs, and cardiovascular engine dominance.",
    icon: "🏹",
    color: "from-emerald-500/20 to-teal-500/10",
    borderHover: "hover:border-emerald-400 border-emerald-500/30",
    primaryStat: "Stamina & Willpower",
  },
  {
    id: "mage",
    name: "Void Scholar",
    tagline: "Deep Focus & Cognitive Supremacy",
    description: "ADHD hyperfocus chamber, 40Hz binaural sessions, high-volume reading, and analytical mastery.",
    icon: "🔮",
    color: "from-purple-500/20 to-indigo-500/10",
    borderHover: "hover:border-purple-400 border-purple-500/30",
    primaryStat: "Intelligence & Discipline",
  },
  {
    id: "monarch",
    name: "Shadow Monarch",
    tagline: "Hybrid Overlord & Squad Lead",
    description: "All-rounder elite athletic conditioning, high-volume deep work, and squad raid leadership.",
    icon: "👑",
    color: "from-red-500/20 to-purple-500/10",
    borderHover: "hover:border-red-400 border-red-500/30",
    primaryStat: "All Attributes (+10% Raid Power)",
  },
];

export const EQUIPMENT_PROFILES = [
  {
    id: "bodyweight",
    name: "Bodyweight Only",
    icon: "🤸",
    desc: "Calisthenics, levers, plyo, zero gear required.",
  },
  {
    id: "dumbbells",
    name: "Dumbbells / Home",
    icon: "🏋️",
    desc: "Free weights, kettlebells, and bands.",
  },
  {
    id: "gym",
    name: "Commercial Gym",
    icon: "🏛️",
    desc: "Barbells, racks, cables, and heavy machines.",
  },
];

interface HunterClassPickerProps {
  selectedClass?: string;
  selectedEquipment?: string;
  onClassChange?: (newClass: string) => void;
  onEquipmentChange?: (newEquipment: string) => void;
  standaloneSave?: boolean;
}

export function HunterClassPicker({
  selectedClass: propClass,
  selectedEquipment: propEquipment,
  onClassChange,
  onEquipmentChange,
  standaloneSave = false,
}: HunterClassPickerProps) {
  const { user, refreshUser } = useAuth();
  const { toast } = useToast();

  const [currentClass, setCurrentClass] = useState<string>(
    propClass || user?.hunterClass || "assassin"
  );
  const [currentEquipment, setCurrentEquipment] = useState<string>(
    propEquipment || user?.equipmentProfile || "bodyweight"
  );
  const [isSaving, setIsSaving] = useState(false);

  const handleSelectClass = async (id: string) => {
    setCurrentClass(id);
    onClassChange?.(id);

    if (standaloneSave && user) {
      try {
        setIsSaving(true);
        await apiRequest("PATCH", "/api/user", { hunterClass: id });
        await refreshUser();
        toast({
          title: "Class Awakened!",
          description: `Your Hunter Archetype is now ${HUNTER_CLASSES.find((c) => c.id === id)?.name}. Daily quests will adapt.`,
        });
      } catch (err: any) {
        toast({ title: "Failed to update class", description: err.message, variant: "destructive" });
      } finally {
        setIsSaving(false);
      }
    }
  };

  const handleSelectEquipment = async (id: string) => {
    setCurrentEquipment(id);
    onEquipmentChange?.(id);

    if (standaloneSave && user) {
      try {
        setIsSaving(true);
        await apiRequest("PATCH", "/api/user", { equipmentProfile: id });
        await refreshUser();
        toast({
          title: "Gear Loadout Synced",
          description: `Daily quests adjusted for ${EQUIPMENT_PROFILES.find((e) => e.id === id)?.name}.`,
        });
      } catch (err: any) {
        toast({ title: "Failed to update gear profile", description: err.message, variant: "destructive" });
      } finally {
        setIsSaving(false);
      }
    }
  };

  return (
    <div className="space-y-6 font-mono text-white">
      {/* Hunter Class Archetypes */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h4 className="text-base font-bold text-cyan-300 uppercase tracking-wider flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              Hunter Archetype & Affinity
            </h4>
            <p className="text-xs text-zinc-400">
              Select your combat role to tailor daily workouts, focus chambers, and bonus stats.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {HUNTER_CLASSES.map((cls) => {
            const isSelected = currentClass === cls.id;
            return (
              <Card
                key={cls.id}
                onClick={() => !isSaving && handleSelectClass(cls.id)}
                className={`cursor-pointer transition-all relative overflow-hidden bg-gradient-to-br ${cls.color} backdrop-blur-xl ${
                  isSelected
                    ? "border-cyan-400 ring-2 ring-cyan-400/30 shadow-[0_0_20px_rgba(6,182,212,0.25)]"
                    : `${cls.borderHover} border-zinc-800/80 opacity-75 hover:opacity-100`
                }`}
              >
                <CardContent className="p-4 space-y-2">
                  <div className="flex items-start justify-between">
                    <div className="text-2xl">{cls.icon}</div>
                    {isSelected && (
                      <span className="flex items-center gap-1 text-[10px] font-bold text-cyan-400 bg-cyan-950/80 border border-cyan-400/40 px-2 py-0.5 rounded-full">
                        <Check className="w-3 h-3" /> ACTIVE
                      </span>
                    )}
                  </div>

                  <div>
                    <h5 className="font-bold text-sm text-white">{cls.name}</h5>
                    <p className="text-[11px] text-cyan-300 font-semibold">{cls.tagline}</p>
                  </div>

                  <p className="text-xs text-zinc-400 leading-relaxed">{cls.description}</p>

                  <div className="pt-1 text-[10px] text-zinc-500 uppercase tracking-widest flex items-center gap-1">
                    <span>AFFINITY:</span>
                    <span className="text-zinc-300 font-bold">{cls.primaryStat}</span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Equipment Profile Section */}
      <div>
        <div className="mb-3">
          <h4 className="text-base font-bold text-purple-300 uppercase tracking-wider flex items-center gap-2">
            <Dumbbell className="w-4 h-4 text-purple-400" />
            Equipment Loadout Profile
          </h4>
          <p className="text-xs text-zinc-400">
            Tell the System what gear you have available so you never receive unexecutable quests.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {EQUIPMENT_PROFILES.map((eq) => {
            const isSelected = currentEquipment === eq.id;
            return (
              <div
                key={eq.id}
                onClick={() => !isSaving && handleSelectEquipment(eq.id)}
                className={`cursor-pointer p-4 rounded-xl border transition-all flex items-start gap-3 bg-zinc-900/60 backdrop-blur-md ${
                  isSelected
                    ? "border-purple-400 bg-purple-950/20 ring-1 ring-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.2)]"
                    : "border-zinc-800 hover:border-zinc-700 opacity-70 hover:opacity-100"
                }`}
              >
                <div className="text-2xl flex-shrink-0 mt-0.5">{eq.icon}</div>
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-white">{eq.name}</span>
                    {isSelected && <Check className="w-3.5 h-3.5 text-purple-400" />}
                  </div>
                  <p className="text-xs text-zinc-400">{eq.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

