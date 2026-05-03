import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { User } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Pause, Square, X, Clock, TrendingUp, Target, Music, Volume2, VolumeX, Sparkles, Settings as SettingsIcon, Maximize, Minimize, Castle } from "lucide-react";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { FocusPet } from "@/components/focus-pet";
import { FocusSettings } from "@/components/focus-settings";
import { usePet } from "@/hooks/use-pet";
import { useFocusSettings } from "@/hooks/use-focus-settings";
import { syncEngine } from "@/lib/sync-engine";
import { useAuth } from "@/hooks/use-auth";
import { TrialExpiredOverlay } from "@/components/premium/trial-expired-overlay";
import { format } from "date-fns";
import { FocusCitadel } from "@/components/focus-citadel";
import { CitadelViewer } from "@/components/citadel-viewer";
import { BlueprintSelector } from "@/components/blueprint-selector";
import { useMutation } from "@tanstack/react-query";

const PRESETS = [
  { name: "Pomodoro", minutes: 25, description: "25 min work", icon: Clock },
  { name: "Short Break", minutes: 5, description: "5 min rest", icon: Sparkles },
  { name: "Long Break", minutes: 15, description: "15 min rest", icon: Sparkles },
  { name: "Deep Work", minutes: 50, description: "50 min work", icon: Target },
  { name: "Ultra Focus", minutes: 90, description: "90 min work", icon: TrendingUp },
];

const LOFI_TRACKS = [
  { name: "Lofi Hip Hop", url: "https://www.youtube.com/embed/jfKfPfyJRdk?autoplay=1&loop=1&playlist=jfKfPfyJRdk" },
  { name: "Chill Beats", url: "https://www.youtube.com/embed/5qap5aO4i9A?autoplay=1&loop=1&playlist=5qap5aO4i9A" },
  { name: "Study Music", url: "https://www.youtube.com/embed/lTRiuFIWV54?autoplay=1&loop=1&playlist=lTRiuFIWV54" },
];

const QUOTES = [
  "Focus is the art of knowing what to ignore.",
  "The shorter way to do many things is to do only one thing at a time.",
  "Deep work is the superpower of the 21st century.",
  "Do it or do not do it—you will be judged by the result.",
  "Your future is created by what you do today, not tomorrow.",
  "Suffer the pain of discipline or suffer the pain of regret.",
  "Mastery demands all of you.",
  "Silence the noise. Amplify the signal."
];

const THEME_CONFIG: Record<string, {
  bg: string;
  primary: string;
  secondary: string;
  accent: string;
  text: string;
  gradient: string;
}> = {
  'black-yellow': {
    bg: 'bg-black',
    primary: 'text-yellow-500',
    secondary: 'text-amber-500',
    accent: 'text-yellow-400',
    text: 'text-yellow-100',
    gradient: 'from-yellow-500 via-amber-500 to-yellow-600',
  },
  'purple-dream': {
    bg: 'bg-[#1a0933]',
    primary: 'text-purple-500',
    secondary: 'text-fuchsia-500',
    accent: 'text-purple-400',
    text: 'text-purple-100',
    gradient: 'from-purple-500 via-fuchsia-500 to-purple-600',
  },
  'ocean-blue': {
    bg: 'bg-[#001a33]',
    primary: 'text-blue-500',
    secondary: 'text-cyan-500',
    accent: 'text-blue-400',
    text: 'text-blue-100',
    gradient: 'from-blue-500 via-cyan-500 to-blue-600',
  },
  'forest-green': {
    bg: 'bg-[#0a1f0a]',
    primary: 'text-green-500',
    secondary: 'text-emerald-500',
    accent: 'text-green-400',
    text: 'text-green-100',
    gradient: 'from-green-500 via-emerald-500 to-green-600',
  },
  'sunset-orange': {
    bg: 'bg-[#1a0f00]',
    primary: 'text-orange-500',
    secondary: 'text-red-500',
    accent: 'text-orange-400',
    text: 'text-orange-100',
    gradient: 'from-orange-500 via-red-500 to-orange-600',
  },
  'monochrome': {
    bg: 'bg-black',
    primary: 'text-white',
    secondary: 'text-gray-400',
    accent: 'text-white',
    text: 'text-gray-100',
    gradient: 'from-white via-gray-400 to-gray-600',
  }
};

export default function FocusSanctum() {
  const { toast } = useToast();
  const { settings } = useFocusSettings();
  const { addFocusTime } = usePet();
  const theme = THEME_CONFIG[settings.theme] || THEME_CONFIG['black-yellow'];
  const ambientAudioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (ambientAudioRef.current) {
      ambientAudioRef.current.volume = settings.ambientVolume / 100;
      if (settings.ambientSound !== 'none') {
        const soundMap: Record<string, string> = {
          rain: 'https://assets.mixkit.co/sfx/preview/mixkit-light-rain-loop-1253.mp3',
          forest: 'https://assets.mixkit.co/sfx/preview/mixkit-forest-birds-ambience-1210.mp3',
          ocean: 'https://assets.mixkit.co/sfx/preview/mixkit-sea-waves-loop-1196.mp3',
          cafe: 'https://assets.mixkit.co/sfx/preview/mixkit-restaurant-crowd-talking-ambience-440.mp3',
          fireplace: 'https://assets.mixkit.co/sfx/preview/mixkit-campfire-crackling-1284.mp3'
        };
        ambientAudioRef.current.src = soundMap[settings.ambientSound] || '';
        ambientAudioRef.current.play().catch(e => console.log("Audio play failed:", e));
      } else {
        ambientAudioRef.current.pause();
      }
    }
  }, [settings.ambientSound, settings.ambientVolume]);

  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [totalTime, setTotalTime] = useState(25 * 60);
  const [task, setTask] = useState("");
  const [xpEarned, setXpEarned] = useState(0);
  const [zenMode, setZenMode] = useState(false);
  const [musicEnabled, setMusicEnabled] = useState(false);
  const [currentTrack, setCurrentTrack] = useState(0);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [quote, setQuote] = useState(QUOTES[0]);
  const { user } = useAuth();
  const [showLimitOverlay, setShowLimitOverlay] = useState(false);
  const [currentBuildingId, setCurrentBuildingId] = useState<string | null>(null);
  const [citadelViewerOpen, setCitadelViewerOpen] = useState(false);
  const [blueprintOpen, setBlueprintOpen] = useState(false);
  const [pendingMinutes, setPendingMinutes] = useState(25);
  const [selectedBlueprintId, setSelectedBlueprintId] = useState<string>("house");
  const [currentWager, setCurrentWager] = useState<number>(0);

  const startBuildingMutation = useMutation({
    mutationFn: async ({ type, buildingName, x, y, wager }: { type: string; buildingName: string; x: number; y: number; wager: number }) => {
      const res = await fetch("/api/citadel/build", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, buildingName, x, y, wager })
      });
      if (!res.ok) throw new Error("Failed to start building");
      return res.json();
    },
    onSuccess: (data) => {
      setCurrentBuildingId(data.id);
      queryClient.invalidateQueries({ queryKey: ["/api/citadel"] });
    }
  });

  const completeBuildingMutation = useMutation({
    mutationFn: async ({ id, focusMinutes }: { id: string; focusMinutes: number }) => {
      await fetch(`/api/citadel/${id}/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ focusMinutes }),
      });
    },
    onSuccess: () => {
      setCurrentBuildingId(null);
      queryClient.invalidateQueries({ queryKey: ["/api/citadel"] });
      queryClient.invalidateQueries({ queryKey: ["/api/citadel/stats"] });
    }
  });
  const failBuildingMutation = useMutation({
    mutationFn: async (id: string) => {
      await fetch(`/api/citadel/${id}/fail`, { method: "POST" });
    },
    onSuccess: () => {
      setCurrentBuildingId(null);
      queryClient.invalidateQueries({ queryKey: ["/api/citadel"] });
    }
  });

  // Check usage limit
  const checkDailyLimit = () => {
    if (!user || user.isPremium || user.isTrial) return true;

    const today = format(new Date(), 'yyyy-MM-dd');
    const usage = JSON.parse(localStorage.getItem('focus_daily_usage') || '{}');

    if (usage.date === today && usage.count >= 1) {
      return false;
    }
    return true;
  };

  const incrementDailyUsage = () => {
    if (!user || user.isPremium || user.isTrial) return;

    const today = format(new Date(), 'yyyy-MM-dd');
    const usage = JSON.parse(localStorage.getItem('focus_daily_usage') || '{}');

    const newCount = (usage.date === today ? usage.count : 0) + 1;
    localStorage.setItem('focus_daily_usage', JSON.stringify({ date: today, count: newCount }));
  };

  const toggleFullScreen = async () => {
    try {
      if (!containerRef.current) return;
      const doc = document as any;
      const elem = containerRef.current as any;
      if (!document.fullscreenElement && !doc.mozFullScreenElement && !doc.webkitFullscreenElement && !doc.msFullscreenElement) {
        if (elem.requestFullscreen) await elem.requestFullscreen();
        else if (elem.webkitRequestFullscreen) await elem.webkitRequestFullscreen();
      } else {
        if (document.exitFullscreen) await document.exitFullscreen();
        else if (doc.webkitExitFullscreen) await doc.webkitExitFullscreen();
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      const doc = document as any;
      setIsFullscreen(!!(document.fullscreenElement || doc.webkitFullscreenElement));
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
    };
  }, []);

  const { data: stats } = useQuery<{ totalMinutes: number; totalXP: number; sessionCount: number }>({
    queryKey: ["/api/focus/stats"],
  });

  useEffect(() => {
    if (isRunning && !isPaused) {
      intervalRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev === totalTime - 1) toast({ title: "Session Started 🚀", description: "Let's focus!" });
          if (prev <= 1) {
            handleComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning, isPaused, totalTime]);

  useEffect(() => {
    const elapsed = totalTime - timeLeft;
    const minutes = Math.floor(elapsed / 60);
    setXpEarned(minutes * 5); // 5 XP per minute
  }, [timeLeft, totalTime]);

  const handleStart = (minutes: number) => {
    if (!checkDailyLimit()) {
      setShowLimitOverlay(true);
      return;
    }
    // Open blueprint selector — user picks what to build and wager
    setPendingMinutes(minutes);
    setBlueprintOpen(true);
  };

  const executeStart = (buildingId: string, wager: number) => {
    incrementDailyUsage();
    const minutes = pendingMinutes;
    setTotalTime(minutes * 60);
    setTimeLeft(minutes * 60);
    setIsRunning(true);
    setIsPaused(false);
    setXpEarned(0);
    setSelectedBlueprintId(buildingId);
    setCurrentWager(wager);
    setQuote(QUOTES[Math.floor(Math.random() * QUOTES.length)]);

    let buildingType = "minor";
    if (minutes >= 50) buildingType = "major";
    if (minutes >= 90) buildingType = "monumental";

    const x = Math.floor(Math.random() * 5);
    const y = Math.floor(Math.random() * 5);

    startBuildingMutation.mutate({ type: buildingType, buildingName: buildingId, x, y, wager });
  };

  const handlePause = () => setIsPaused(!isPaused);

  const saveSession = (completed: boolean) => {
    const duration = Math.floor((totalTime - timeLeft) / 60);
    if (duration < 1) return;

    // Radical Optimization: Queue locally, no immediate API call
    const xp = duration * 5;

    // 1. Queue Focus Session Log
    syncEngine.add({
      type: "FOCUS_SESSION",
      duration: duration,
      timestamp: Date.now()
    });

    // 2. Queue XP Gain
    syncEngine.add({
      type: "XP_GAIN",
      amount: xp,
      source: "Focus Session"
    });

    // 3. Local UI Updates
    addFocusTime(duration);

    // 4. Invalidate stats eventually (optional, since we are optimistic)
    // queryClient.invalidateQueries({ queryKey: ["/api/focus/stats"] });

    toast({
      title: completed ? "Session Complete! 🎉" : "Session Stopped",
      description: `+${xp} XP earned!`,
    });
  };

  const handleStop = () => {
    saveSession(false);
    if (currentBuildingId) failBuildingMutation.mutate(currentBuildingId);
    setIsRunning(false);
    setIsPaused(false);
    setTimeLeft(totalTime);
    setXpEarned(0);
  };

  const handleComplete = () => {
    saveSession(true);
    const elapsed = Math.floor((totalTime - timeLeft) / 60);
    if (currentBuildingId) completeBuildingMutation.mutate({ id: currentBuildingId, focusMinutes: elapsed });
    setIsRunning(false);
    setIsPaused(false);
    setTimeLeft(totalTime);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div ref={containerRef} className="relative min-h-screen overflow-hidden">
      <div className={`fixed inset-0 ${theme.bg} transition-colors duration-700`} />

      {musicEnabled && (
        <iframe
          ref={iframeRef}
          src={LOFI_TRACKS[currentTrack].url}
          allow="autoplay"
          className="hidden"
        />
      )}

      <audio ref={ambientAudioRef} loop className="hidden" />

      <motion.button
        onClick={() => { window.location.href = '/dashboard'; }}
        className="fixed top-8 left-8 z-50 w-12 h-12 rounded-full bg-white/10 backdrop-blur-md border border-white/20 shadow-2xl flex items-center justify-center group hover:bg-white/20 transition-all"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
      >
        <X className="w-5 h-5 text-white" />
      </motion.button>
      <motion.div 
        initial={{ y: -50, opacity: 0 }} 
        animate={{ y: 0, opacity: 1 }} 
        className="fixed top-6 right-6 z-[60] flex items-center gap-2"
      >
        <div className="flex items-center gap-2 bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl px-4 py-2 shadow-2xl">
          <div className="flex items-center gap-3">
            <Button
              onClick={() => setMusicEnabled(!musicEnabled)}
              size="icon"
              variant="ghost"
              className={`w-10 h-10 rounded-xl transition-all ${musicEnabled ? "bg-yellow-500/20 text-yellow-500" : "text-white/40 hover:text-white"}`}
            >
              {musicEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
            </Button>
            
            {musicEnabled && (
              <div className="flex items-center gap-2 animate-in slide-in-from-right-4 duration-300">
                <Music className="w-4 h-4 text-yellow-300 animate-pulse" />
                <select
                  value={currentTrack}
                  onChange={(e) => setCurrentTrack(Number(e.target.value))}
                  className="bg-transparent text-white text-xs font-medium focus:outline-none border-none cursor-pointer"
                >
                  {LOFI_TRACKS.map((track, i) => (
                    <option key={i} value={i} className="bg-slate-900 text-white">{track.name}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div className="w-[1px] h-6 bg-white/10 mx-1" />

          <div className="flex items-center gap-1.5">
            <Button 
              onClick={toggleFullScreen} 
              size="icon" 
              variant="ghost"
              className="w-10 h-10 rounded-xl text-white/60 hover:text-white hover:bg-white/10 transition-all"
              title="Fullscreen"
            >
              {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
            </Button>
            
            <Button 
              onClick={() => setCitadelViewerOpen(true)} 
              size="icon" 
              variant="ghost"
              className="w-10 h-10 rounded-xl text-yellow-500/80 hover:text-yellow-400 hover:bg-yellow-500/10 transition-all"
              title="View Inner Citadel"
            >
              <Castle className="w-5 h-5" />
            </Button>
            
            <Button 
              onClick={() => setSettingsOpen(true)} 
              size="icon" 
              className="w-10 h-10 rounded-xl bg-gradient-to-br from-yellow-400 to-amber-600 text-black shadow-lg shadow-yellow-500/20 hover:scale-105 active:scale-95 transition-all"
              title="Settings"
            >
              <SettingsIcon className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </motion.div>

      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen p-8">
        <AnimatePresence mode="wait">
          {!isRunning ? (
            <motion.div key="setup" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="w-full max-w-4xl space-y-12">
              <div className="text-center space-y-3">
                <motion.h1 className={`text-7xl font-bold bg-gradient-to-r ${theme.gradient} bg-clip-text text-transparent`} animate={{ opacity: [0.8, 1, 0.8] }} transition={{ duration: 3, repeat: Infinity }}>
                  Focus Sanctum
                </motion.h1>
                <p className={`${theme.accent} opacity-70 text-sm uppercase tracking-widest`}>Deep Work Environment</p>
              </div>

              {!zenMode && stats && (
                <div className="grid grid-cols-3 gap-6">
                  {[
                    { icon: Clock, label: "Total Time", value: `${stats.totalMinutes}m` },
                    { icon: TrendingUp, label: "XP Earned", value: stats.totalXP },
                    { icon: Target, label: "Sessions", value: stats.sessionCount },
                  ].map((stat, i) => (
                    <motion.div key={i} className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 text-center hover:bg-white/10 transition-all" whileHover={{ scale: 1.05, y: -5 }} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
                      <div className={`w-12 h-12 mx-auto mb-3 rounded-full bg-gradient-to-r ${theme.gradient} flex items-center justify-center`}>
                        <stat.icon className="w-6 h-6 text-black" />
                      </div>
                      <p className={`text-xs uppercase tracking-wider ${theme.accent} opacity-70 mb-2`}>{stat.label}</p>
                      <p className="text-3xl font-bold text-white">{stat.value}</p>
                    </motion.div>
                  ))}
                </div>
              )}

              <div className="space-y-3">
                <label className={`text-sm uppercase tracking-wider ${theme.secondary} block`}>What are you working on?</label>
                <Input value={task} onChange={(e) => setTask(e.target.value)} placeholder="e.g., Master Python Programming" className={`bg-white/5 backdrop-blur-md border-white/10 text-white placeholder:${theme.accent}/30 h-14 text-lg focus:border-${theme.primary} focus:ring-2 focus:ring-${theme.primary}/20 rounded-xl`} />
              </div>

              <div className="space-y-4">
                <label className="text-sm uppercase tracking-wider text-purple-300 block">Choose Duration</label>
                <div className="grid grid-cols-3 gap-4">
                  {PRESETS.map((preset, i) => (
                    <motion.button key={preset.name} onClick={() => handleStart(preset.minutes)} className="relative group h-32 bg-white/5 backdrop-blur-md border border-white/10 hover:border-yellow-500/50 rounded-2xl overflow-hidden transition-all" whileHover={{ scale: 1.05, y: -5 }} whileTap={{ scale: 0.95 }} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                      <div className={`absolute inset-0 bg-gradient-to-br ${theme.gradient} opacity-0 group-hover:opacity-10 transition-opacity`} />
                      <div className="relative h-full flex flex-col items-center justify-center gap-2 p-4">
                        <preset.icon className={`w-8 h-8 ${theme.accent} opacity-70 group-hover:opacity-100 transition-colors`} />
                        <span className="text-xl font-semibold text-white">{preset.name}</span>
                        <span className={`text-sm ${theme.accent} opacity-70`}>{preset.description}</span>
                      </div>
                    </motion.button>
                  ))}
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div key="timer" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="w-full max-w-4xl space-y-16">
              <div className="text-center space-y-12">
                <div className="relative py-10">
                  <motion.div className={`text-[15rem] font-bold tracking-tighter ${theme.primary} tabular-nums leading-none`} animate={{ opacity: isPaused ? 0.5 : 1 }}>
                    {formatTime(timeLeft)}
                  </motion.div>
                  <motion.div key={quote} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 0.8, y: 0 }} className={`text-xl font-medium ${theme.text} mt-8 max-w-2xl mx-auto`}>
                    "{quote}"
                  </motion.div>
                </div>

                {!zenMode && (
                  <motion.div className={`inline-flex items-center gap-3 bg-gradient-to-r ${theme.gradient} bg-opacity-20 backdrop-blur-md border border-white/10 rounded-full px-8 py-4`} animate={{ scale: [1, 1.05, 1] }} transition={{ duration: 2, repeat: Infinity }}>
                    <Sparkles className={`w-6 h-6 ${theme.accent}`} />
                    <span className={`text-4xl font-bold ${theme.accent}`}>+{xpEarned}</span>
                    <span className={`text-lg uppercase tracking-wider ${theme.text} opacity-80`}>XP</span>
                  </motion.div>
                )}

                {task && !zenMode && (
                  <div className={`flex items-center justify-center gap-3 ${theme.accent} opacity-70`}>
                    <Target className="w-5 h-5" />
                    <p className="text-lg">{task}</p>
                  </div>
                )}
              </div>

              <div className="flex justify-center gap-4">
                <Button onClick={handlePause} size="lg" className="bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/20 text-white px-10 py-6 text-lg rounded-xl">
                  {isPaused ? <><Play className="w-5 h-5 mr-2" /> Resume</> : <><Pause className="w-5 h-5 mr-2" /> Pause</>}
                </Button>
                <Button onClick={handleStop} size="lg" variant="ghost" className="text-purple-300 hover:text-white hover:bg-white/10 px-10 py-6 text-lg rounded-xl">
                  <Square className="w-5 h-5 mr-2" /> Stop
                </Button>
              </div>

              {!zenMode && (
                <div className="text-center">
                  <button onClick={() => setZenMode(true)} className="text-sm uppercase tracking-wider text-yellow-500/70 hover:text-yellow-400 transition-colors">
                    Enter Zen Mode
                  </button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      
      <div className={isRunning ? "fixed top-1/2 left-24 -translate-y-1/2 z-30 transition-all duration-700 hidden md:block scale-75" : "hidden"}>
        <FocusCitadel theme={theme} />
      </div>
      {!isRunning && (
        <div className="absolute inset-0 flex items-center justify-center z-0 opacity-40 pointer-events-auto mt-64 hidden md:flex">
           <FocusCitadel theme={theme} className="scale-100" />
        </div>
      )}

      <FocusPet className={isRunning ? "fixed top-1/2 right-12 -translate-y-1/2 z-40 transition-all duration-700" : "fixed bottom-8 right-8 z-40 transition-all duration-700"} />
      <FocusSettings isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} />
      <CitadelViewer 
        isOpen={citadelViewerOpen} 
        onClose={() => setCitadelViewerOpen(false)} 
        isRaining={isRunning}
      />
      <BlueprintSelector
        isOpen={blueprintOpen}
        onClose={() => setBlueprintOpen(false)}
        selectedMinutes={pendingMinutes}
        onSelect={(buildingId, wager) => executeStart(buildingId, wager)}
      />
      {showLimitOverlay && <TrialExpiredOverlay />}
    </div>
  );
}
