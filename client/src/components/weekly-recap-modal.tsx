import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { toPng } from "html-to-image";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  ChevronLeft,
  ChevronRight,
  Share2,
  Download,
  X,
  Shield,
  Zap,
  Target,
  Dumbbell,
  Clock,
  Award
} from "lucide-react";

interface WeeklyRecapData {
  dateRange: string;
  percentile: number;
  deepWorkMinutes: number;
  missionsCompleted: number;
  workoutsLogged: number;
  totalTonnage: number;
  totalSets: number;
  streakDays: number;
  tier: string;
  xpEarned: number;
  archetype: string;
  archetypeTag: string;
  archetypeDescription: string;
  userName: string;
  referralCode?: string;
}

interface WeeklyRecapModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function WeeklyRecapModal({ open, onOpenChange }: WeeklyRecapModalProps) {
  const { toast } = useToast();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);

  const { data: recap, isLoading } = useQuery<WeeklyRecapData>({
    queryKey: ["/api/user/weekly-recap"],
    enabled: open,
  });

  const TOTAL_SLIDES = 4;

  // Auto-advance timer (5.5s per slide)
  useEffect(() => {
    if (!open || isPaused || isLoading) return;
    const timer = setTimeout(() => {
      if (currentSlide < TOTAL_SLIDES - 1) {
        setCurrentSlide((prev) => prev + 1);
      }
    }, 5500);

    return () => clearTimeout(timer);
  }, [open, currentSlide, isPaused, isLoading]);

  const handleNext = () => {
    if (currentSlide < TOTAL_SLIDES - 1) {
      setCurrentSlide((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentSlide > 0) {
      setCurrentSlide((prev) => prev - 1);
    }
  };

  const handleShareStory = async () => {
    if (!cardRef.current || !recap) return;
    setIsExporting(true);
    try {
      const dataUrl = await toPng(cardRef.current, {
        pixelRatio: 2.5,
        cacheBust: true,
      });

      const res = await fetch(dataUrl);
      const blob = await res.blob();
      const file = new File([blob], `Ascension_Recap_${recap.userName.replace(/\s+/g, "_")}.png`, {
        type: "image/png",
      });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: "Ascension Protocol - Weekly Telemetry Recap",
          text: `My weekly operational standing: outperforming ${recap.percentile}% of operatives as ${recap.archetype}. Join the protocol.`,
        });
      } else if (navigator.share) {
        await navigator.share({
          title: "Ascension Protocol - Weekly Telemetry Recap",
          text: `My weekly operational standing: outperforming ${recap.percentile}% of operatives as ${recap.archetype}.`,
          url: window.location.origin,
        });
      } else {
        handleDownload();
      }
    } catch {
      handleDownload();
    } finally {
      setIsExporting(false);
    }
  };

  const handleDownload = async () => {
    if (!cardRef.current || !recap) return;
    setIsExporting(true);
    try {
      const dataUrl = await toPng(cardRef.current, {
        pixelRatio: 2.5,
        cacheBust: true,
      });
      const link = document.createElement("a");
      link.download = `Ascension_Recap_${recap.userName.replace(/\s+/g, "_")}.png`;
      link.href = dataUrl;
      link.click();
      toast({
        title: "WEEKLY AUDIT ARTIFACT SAVED",
        description: "Image generated and downloaded to device storage.",
      });
    } catch {
      toast({
        title: "Export Failed",
        description: "Unable to render story image.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[420px] h-[85vh] max-h-[720px] bg-[#050608] border border-white/15 text-white font-mono p-0 overflow-hidden flex flex-col justify-between select-none">
        {/* Top Progress Bars */}
        <div className="absolute top-0 inset-x-0 p-3 z-30 flex gap-1.5 bg-gradient-to-b from-black/80 to-transparent">
          {Array.from({ length: TOTAL_SLIDES }).map((_, idx) => (
            <div key={idx} className="flex-1 h-1 bg-white/15 rounded-full overflow-hidden">
              <div
                className={`h-full bg-white transition-all duration-300 ${
                  idx < currentSlide
                    ? "w-full"
                    : idx === currentSlide
                    ? "w-full animate-pulse"
                    : "w-0"
                }`}
              />
            </div>
          ))}
        </div>

        {/* Top Close Button & Date Range */}
        <div className="pt-6 px-4 z-20 flex justify-between items-center text-[10px] text-zinc-400">
          <span className="uppercase tracking-widest">{recap?.dateRange || "CALCULATING AUDIT..."}</span>
          <button
            onClick={() => onOpenChange(false)}
            className="p-1 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Slide Carousel Container */}
        <div
          className="flex-1 relative flex items-center justify-center p-6"
          onMouseDown={() => setIsPaused(true)}
          onMouseUp={() => setIsPaused(false)}
          onTouchStart={() => setIsPaused(true)}
          onTouchEnd={() => setIsPaused(false)}
        >
          {isLoading || !recap ? (
            <div className="text-center text-xs text-zinc-500">
              <span className="animate-pulse">COMPILING WEEKLY AUDIT TELEMETRY...</span>
            </div>
          ) : (
            <AnimatePresence mode="wait">
              {/* Slide 0: Tactical Standing */}
              {currentSlide === 0 && (
                <motion.div
                  key="slide-0"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.25 }}
                  className="text-center space-y-6 w-full"
                >
                  <div className="w-16 h-16 rounded-full bg-blue-950/40 border border-blue-500/30 flex items-center justify-center mx-auto">
                    <Shield className="w-8 h-8 text-blue-400" />
                  </div>

                  <div className="space-y-2">
                    <span className="text-[10px] text-zinc-500 uppercase tracking-widest block">
                      SECTOR COMPARATIVE BENCHMARK
                    </span>
                    <h2 className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight">
                      TOP {100 - recap.percentile}%
                    </h2>
                    <p className="text-xs text-zinc-400 max-w-xs mx-auto leading-relaxed pt-2">
                      In the past 7 days, your operational output surpassed{" "}
                      <strong className="text-white font-bold">{recap.percentile}% of active operatives</strong> across the network.
                    </p>
                  </div>

                  <div className="p-3 bg-zinc-950/80 rounded border border-white/5 text-[11px] text-zinc-400">
                    STATUS: <span className="text-emerald-400 font-bold uppercase">ZERO PROTOCOL DRIFT</span>
                  </div>
                </motion.div>
              )}

              {/* Slide 1: Quantitative Telemetry */}
              {currentSlide === 1 && (
                <motion.div
                  key="slide-1"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.25 }}
                  className="space-y-4 w-full"
                >
                  <div className="text-center mb-4">
                    <span className="text-[10px] text-zinc-500 uppercase tracking-widest">WEEKLY EXECUTION LEDGER</span>
                    <h3 className="text-xl font-bold uppercase text-white">Quantitative Telemetry</h3>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <div className="p-3.5 rounded bg-zinc-950/80 border border-white/10">
                      <Clock className="w-4 h-4 text-blue-400 mb-2" />
                      <div className="text-xl font-bold text-white">{Math.floor(recap.deepWorkMinutes / 60)}h {recap.deepWorkMinutes % 60}m</div>
                      <div className="text-[9px] text-zinc-500 uppercase">Air-Gap Focus</div>
                    </div>

                    <div className="p-3.5 rounded bg-zinc-950/80 border border-white/10">
                      <Target className="w-4 h-4 text-emerald-400 mb-2" />
                      <div className="text-xl font-bold text-white">{recap.missionsCompleted}</div>
                      <div className="text-[9px] text-zinc-500 uppercase">Missions Cleared</div>
                    </div>

                    <div className="p-3.5 rounded bg-zinc-950/80 border border-white/10">
                      <Dumbbell className="w-4 h-4 text-amber-400 mb-2" />
                      <div className="text-xl font-bold text-white">{(recap.totalTonnage || 0).toLocaleString()} KG</div>
                      <div className="text-[9px] text-zinc-500 uppercase">Tonnage Lifted</div>
                    </div>

                    <div className="p-3.5 rounded bg-zinc-950/80 border border-white/10">
                      <Zap className="w-4 h-4 text-purple-400 mb-2" />
                      <div className="text-xl font-bold text-white">+{recap.xpEarned}</div>
                      <div className="text-[9px] text-zinc-500 uppercase">XP Yield</div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Slide 2: Warrior Archetype */}
              {currentSlide === 2 && (
                <motion.div
                  key="slide-2"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.25 }}
                  className="text-center space-y-5 w-full"
                >
                  <div className="w-16 h-16 rounded-xl bg-amber-950/30 border border-amber-500/40 flex items-center justify-center mx-auto">
                    <Award className="w-8 h-8 text-amber-400" />
                  </div>

                  <div>
                    <span className="text-[10px] text-zinc-500 uppercase tracking-widest block mb-1">
                      TACTICAL ARCHETYPE DESIGNATION
                    </span>
                    <h2 className="text-2xl sm:text-3xl font-extrabold uppercase text-white tracking-tight">
                      {recap.archetype}
                    </h2>
                    <span className="inline-block mt-1 px-2 py-0.5 rounded bg-amber-400/10 text-amber-400 border border-amber-400/20 text-[10px] font-bold uppercase">
                      {recap.archetypeTag}
                    </span>
                  </div>

                  <p className="text-xs text-zinc-400 max-w-xs mx-auto leading-relaxed">
                    &ldquo;{recap.archetypeDescription}&rdquo;
                  </p>
                </motion.div>
              )}

              {/* Slide 3: 9:16 Defiance Export Card */}
              {currentSlide === 3 && (
                <motion.div
                  key="slide-3"
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.25 }}
                  className="w-full flex flex-col items-center justify-center"
                >
                  {/* Exportable DOM Card */}
                  <div
                    ref={cardRef}
                    className="w-full bg-[#080A0E] border border-white/20 rounded-md p-5 text-white font-mono space-y-4 shadow-2xl relative overflow-hidden"
                  >
                    <div className="flex justify-between items-center text-[10px] pb-2 border-b border-white/10">
                      <span className="font-bold tracking-widest">ASCENSION PROTOCOL</span>
                      <span className="text-zinc-500">{recap.dateRange}</span>
                    </div>

                    <div>
                      <span className="text-[9px] text-zinc-500 uppercase block">WEEKLY ARCHETYPE</span>
                      <div className="text-xl font-extrabold uppercase text-white">{recap.archetype}</div>
                      <div className="text-xs text-emerald-400 font-bold uppercase mt-0.5">
                        TOP {100 - recap.percentile}% OPERATIVE STANDING
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-white/5">
                      <div>
                        <span className="text-zinc-500 block text-[9px] uppercase">DEEP WORK</span>
                        <span className="font-bold text-white">{Math.floor(recap.deepWorkMinutes / 60)}h {recap.deepWorkMinutes % 60}m</span>
                      </div>
                      <div>
                        <span className="text-zinc-500 block text-[9px] uppercase">MISSIONS</span>
                        <span className="font-bold text-white">{recap.missionsCompleted} Cleared</span>
                      </div>
                      <div>
                        <span className="text-zinc-500 block text-[9px] uppercase">PHYSICAL TONNAGE</span>
                        <span className="font-bold text-white">{(recap.totalTonnage || 0).toLocaleString()} KG</span>
                      </div>
                      <div>
                        <span className="text-zinc-500 block text-[9px] uppercase">STREAK</span>
                        <span className="font-bold text-amber-400">Day {recap.streakDays}</span>
                      </div>
                    </div>

                    <div className="text-[9px] text-zinc-500 pt-2 border-t border-white/10 flex justify-between items-center">
                      <span>VERIFIED TELEMETRY</span>
                      <span>REF: {recap.referralCode || "ASCEND"}</span>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          )}

          {/* Left/Right Click Navigators */}
          <button
            onClick={handlePrev}
            disabled={currentSlide === 0}
            className="absolute left-1 top-1/2 -translate-y-1/2 w-8 h-12 flex items-center justify-center text-zinc-500 hover:text-white disabled:opacity-0 transition-opacity z-10"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={handleNext}
            disabled={currentSlide === TOTAL_SLIDES - 1}
            className="absolute right-1 top-1/2 -translate-y-1/2 w-8 h-12 flex items-center justify-center text-zinc-500 hover:text-white disabled:opacity-0 transition-opacity z-10"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Bottom Actions */}
        <div className="p-4 bg-zinc-950/90 border-t border-white/10 z-20 flex gap-2">
          {currentSlide === TOTAL_SLIDES - 1 ? (
            <>
              <Button
                variant="outline"
                className="flex-1 border-white/15 hover:bg-zinc-800 text-xs uppercase h-10 font-mono"
                disabled={isExporting}
                onClick={handleDownload}
              >
                <Download className="w-3.5 h-3.5 mr-1.5" />
                Download
              </Button>
              <Button
                className="flex-1 bg-white hover:bg-zinc-200 text-black font-mono text-xs font-bold uppercase h-10"
                disabled={isExporting}
                onClick={handleShareStory}
              >
                <Share2 className="w-3.5 h-3.5 mr-1.5" />
                Transmit Story
              </Button>
            </>
          ) : (
            <Button
              className="w-full bg-white hover:bg-zinc-200 text-black font-mono text-xs font-bold uppercase h-10"
              onClick={handleNext}
            >
              Next Milestone ({currentSlide + 1}/{TOTAL_SLIDES})
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
