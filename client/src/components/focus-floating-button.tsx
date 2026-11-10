import { motion } from "framer-motion";
import { Brain } from "lucide-react";
import { useLocation } from "wouter";
import { audioEngine } from "@/lib/audio-engine";

export function FocusFloatingButton() {
  const [location, setLocation] = useLocation();

  // Do not render on focused session or onboarding routes
  if (
    location === "/focus" ||
    location === "/air-gap-focus" ||
    location === "/briefing-room" ||
    location === "/onboarding" ||
    location === "/evening-debrief"
  ) {
    return null;
  }

  return (
    <motion.button
      onClick={() => {
        audioEngine.playTactileClick();
        setLocation("/air-gap-focus");
      }}
      className="fixed bottom-6 right-6 z-40 w-11 h-11 rounded-full bg-[#10141C] border border-white/10 hover:border-amber-400/50 shadow-xl shadow-black/80 flex items-center justify-center group overflow-hidden transition-colors"
      whileHover={{ scale: 1.08 }}
      whileTap={{ scale: 0.94 }}
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      title="Air-Gap Focus Enclave"
    >
      {/* Subtle indicator ring */}
      <div className="absolute inset-0 rounded-full border border-amber-400/20 group-hover:border-amber-400/50 transition-colors" />

      {/* Icon */}
      <Brain className="w-5 h-5 text-amber-400 group-hover:text-amber-300 transition-colors" />

      {/* Tooltip */}
      <div className="absolute bottom-full mb-2 right-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
        <div className="bg-[#0E1218] border border-white/10 px-2.5 py-1 rounded shadow-xl whitespace-nowrap">
          <p className="text-[10px] font-mono uppercase tracking-wider text-amber-400">Air-Gap Focus</p>
        </div>
      </div>
    </motion.button>
  );
}
