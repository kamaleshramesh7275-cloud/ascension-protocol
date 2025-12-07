import { motion } from "framer-motion";
import { Brain } from "lucide-react";
import { useLocation } from "wouter";

export function FocusFloatingButton() {
    const [, setLocation] = useLocation();

    return (
        <motion.button
            onClick={() => setLocation("/focus")}
            className="fixed bottom-8 right-8 z-50 w-16 h-16 rounded-full bg-gradient-to-br from-zinc-800 to-zinc-900 border border-zinc-700 shadow-2xl shadow-black/50 flex items-center justify-center group overflow-hidden"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
        >
            {/* Animated ring */}
            <motion.div
                className="absolute inset-0 rounded-full border-2 border-amber-500/50"
                animate={{
                    scale: [1, 1.3, 1],
                    opacity: [0.5, 0, 0.5],
                }}
                transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut",
                }}
            />

            {/* Glow effect */}
            <div className="absolute inset-0 rounded-full bg-amber-500/10 blur-xl group-hover:bg-amber-500/20 transition-colors" />

            {/* Icon */}
            <Brain className="w-7 h-7 text-amber-500 relative z-10 group-hover:text-amber-400 transition-colors" />

            {/* Tooltip */}
            <div className="absolute bottom-full mb-2 right-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                <div className="bg-zinc-900 border border-zinc-800 px-3 py-1.5 rounded-lg shadow-xl whitespace-nowrap">
                    <p className="text-xs text-zinc-300">Focus Sanctum</p>
                </div>
            </div>
        </motion.button>
    );
}
