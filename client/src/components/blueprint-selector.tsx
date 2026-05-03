import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Lock, Coins, Zap, Hammer, Sword } from "lucide-react";

const BLUEPRINTS = [
  {
    id: "house",
    label: "House",
    emoji: "🏠",
    description: "A simple dwelling. No buffs, but every empire starts here.",
    minMinutes: 5,
    passive: null,
    color: "border-slate-500/50 bg-slate-900/60",
    accent: "text-slate-300",
  },
  {
    id: "library",
    label: "Library",
    emoji: "📚",
    description: "+5% XP bonus from all focus sessions permanently.",
    minMinutes: 25,
    passive: "+5% XP",
    color: "border-blue-500/50 bg-blue-900/30",
    accent: "text-blue-300",
  },
  {
    id: "treasury",
    label: "Treasury",
    emoji: "🏦",
    description: "Generates 50 Coins every 24 hours passively.",
    minMinutes: 25,
    passive: "50💰/day",
    color: "border-yellow-500/50 bg-yellow-900/20",
    accent: "text-yellow-300",
  },
  {
    id: "forge",
    label: "Forge",
    emoji: "⚒️",
    description: "Reduces ruin clearing cost by 20%. Stack multiple.",
    minMinutes: 50,
    passive: "-20% ruin cost",
    color: "border-orange-500/50 bg-orange-900/20",
    accent: "text-orange-300",
  },
  {
    id: "barracks",
    label: "Barracks",
    emoji: "⚔️",
    description: "Generates 1 Troop/focus min. Use troops to raid rivals.",
    minMinutes: 50,
    passive: "1 troop/min",
    color: "border-green-500/50 bg-green-900/20",
    accent: "text-green-300",
  },
  {
    id: "citadel_tower",
    label: "Citadel Tower",
    emoji: "🗼",
    description: "Monumental landmark: +10% XP and 100 Coins/day!",
    minMinutes: 90,
    passive: "+10% XP · 100💰/day",
    color: "border-purple-500/50 bg-purple-900/30",
    accent: "text-purple-300",
  },
];

interface BlueprintSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (buildingId: string, wager: number) => void;
  selectedMinutes: number;
}

export function BlueprintSelector({ isOpen, onClose, onSelect, selectedMinutes }: BlueprintSelectorProps) {
  const [selected, setSelected] = useState<string>("house");
  const [wager, setWager] = useState<number>(0);

  const available = BLUEPRINTS.filter(b => selectedMinutes >= b.minMinutes);
  const locked = BLUEPRINTS.filter(b => selectedMinutes < b.minMinutes);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[150] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
        >
          <motion.div
            initial={{ scale: 0.9, y: 20, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.9, y: 20, opacity: 0 }}
            transition={{ type: "spring", bounce: 0.3 }}
            className="relative w-full max-w-2xl bg-[#080d1a] border border-white/10 rounded-3xl overflow-hidden shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-white/10">
              <div>
                <h2 className="text-xl font-bold text-white uppercase tracking-widest">Choose Blueprint</h2>
                <p className="text-white/40 text-xs mt-0.5">Select what to build during your {selectedMinutes}min session</p>
              </div>
              <button onClick={onClose} className="w-9 h-9 rounded-full flex items-center justify-center text-white/40 hover:bg-white/10 hover:text-white transition-all">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Blueprints grid */}
            <div className="p-6 grid grid-cols-2 gap-3 max-h-[50vh] overflow-y-auto">
              {available.map(bp => (
                <motion.button
                  key={bp.id}
                  onClick={() => setSelected(bp.id)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`relative text-left p-4 rounded-2xl border-2 transition-all ${selected === bp.id ? bp.color.replace("/50", "") + " ring-2 ring-white/30" : bp.color} ${selected === bp.id ? "shadow-lg" : ""}`}
                >
                  <div className="text-3xl mb-2">{bp.emoji}</div>
                  <p className={`font-bold text-sm ${bp.accent}`}>{bp.label}</p>
                  <p className="text-white/50 text-xs mt-1 leading-relaxed">{bp.description}</p>
                  {bp.passive && (
                    <div className={`mt-2 inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${bp.color} ${bp.accent}`}>
                      {bp.passive}
                    </div>
                  )}
                  {selected === bp.id && (
                    <motion.div
                      layoutId="selected-ring"
                      className="absolute inset-0 rounded-2xl ring-2 ring-white/50 pointer-events-none"
                    />
                  )}
                </motion.button>
              ))}

              {/* Locked blueprints */}
              {locked.map(bp => (
                <div key={bp.id} className="relative text-left p-4 rounded-2xl border-2 border-white/5 bg-white/2 opacity-40 cursor-not-allowed">
                  <Lock className="absolute top-3 right-3 w-4 h-4 text-white/30" />
                  <div className="text-3xl mb-2 grayscale">{bp.emoji}</div>
                  <p className="font-bold text-sm text-white/30">{bp.label}</p>
                  <p className="text-white/20 text-xs mt-1">Requires {bp.minMinutes}min session</p>
                </div>
              ))}
            </div>

            {/* Wager */}
            <div className="px-6 py-4 border-t border-white/10 bg-black/30">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-sm font-bold text-white/70 flex items-center gap-2">
                    <Coins className="w-4 h-4 text-yellow-400" />
                    Wager (optional)
                  </p>
                  <p className="text-xs text-white/30 mt-0.5">Win = ×1.5 refund. Fail = lose all wagered coins.</p>
                </div>
                <div className="flex items-center gap-2">
                  {[0, 50, 100, 200, 500].map(amt => (
                    <button
                      key={amt}
                      onClick={() => setWager(amt)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${wager === amt ? "bg-yellow-500 text-black" : "bg-white/10 text-white/60 hover:bg-white/20"}`}
                    >
                      {amt === 0 ? "None" : `${amt}💰`}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={() => { onSelect(selected, wager); onClose(); }}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-400 hover:to-amber-400 text-black font-bold uppercase tracking-widest text-sm transition-all shadow-lg shadow-yellow-500/20"
              >
                Begin Construction
                {wager > 0 && ` — Wagering ${wager}💰`}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
