import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { User } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Pause, Square, X, Clock, TrendingUp, Target, Music, Volume2, VolumeX, Sparkles, Settings as SettingsIcon, Maximize, Minimize } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Slider } from "@/components/ui/slider";
import { FocusPet } from "@/components/focus-pet";
import { FocusSettings } from "@/components/focus-settings";
import { usePet } from "@/hooks/use-pet";
import { useFocusSettings } from "@/hooks/use-focus-settings";

const PRESETS = [
  { name: "Pomodoro", minutes: 25, description: "25 min work", icon: Clock },
  { name: "Short Break", minutes: 5, description: "5 min rest", icon: Sparkles },
  { name: "Long Break", minutes: 15, description: "15 min rest", icon: Sparkles },
  { name: "Deep Work", minutes: 50, description: "50 min work", icon: Target },
  { name: "Ultra Focus", minutes: 90, description: "90 min work", icon: TrendingUp },
];

// Lofi music tracks (YouTube embed URLs)
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

// Theme configuration mapping
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

  // Handle ambient sound
  useEffect(() => {
    if (ambientAudioRef.current) {
      ambientAudioRef.current.volume = settings.ambientVolume / 100;
      if (settings.ambientSound !== 'none') {
        // In a real app, these would be actual paths. Using placeholders/online samples for demo
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
  const [volume, setVolume] = useState(50);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [quote, setQuote] = useState(QUOTES[0]);

  const toggleFullScreen = async () => {
    try {
      if (!containerRef.current) return;

      const doc = document as any;
      const elem = containerRef.current as any;

      if (!document.fullscreenElement && !doc.mozFullScreenElement && !doc.webkitFullscreenElement && !doc.msFullscreenElement) {
        if (elem.requestFullscreen) {
          await elem.requestFullscreen();
        } else if (elem.msRequestFullscreen) {
          await elem.msRequestFullscreen();
        } else if (elem.mozRequestFullScreen) {
          await elem.mozRequestFullScreen();
        } else if (elem.webkitRequestFullscreen) {
          await elem.webkitRequestFullscreen();
        }
      } else {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        } else if (doc.msExitFullscreen) {
          await doc.msExitFullscreen();
        } else if (doc.mozCancelFullScreen) {
          await doc.mozCancelFullScreen();
        } else if (doc.webkitExitFullscreen) {
          await doc.webkitExitFullscreen();
        }
      }
    } catch (err: any) {
      console.error(`Error attempting to toggle full-screen mode: ${err.message} (${err.name})`);
      toast({
        title: "Full Screen Error",
        description: "Could not enter full screen mode. Your browser might not support it.",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      const doc = document as any;
      const isFull = !!(document.fullscreenElement || doc.mozFullScreenElement || doc.webkitFullscreenElement || doc.msFullscreenElement);
      setIsFullscreen(isFull);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
    };
  }, []);

  const { data: user } = useQuery<User>({
    queryKey: ["/api/user"],
  });

  const { data: stats } = useQuery<{ totalMinutes: number; totalXP: number; sessionCount: number }>({
    queryKey: ["/api/focus/stats"],
  });

  const completeMutation = useMutation({
    mutationFn: async (data: { duration: number; task: string; backgroundType: string }) => {
      return apiRequest("POST", "/api/focus/complete", data);
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      queryClient.invalidateQueries({ queryKey: ["/api/focus/stats"] });

      // Add focus time to pet
      const duration = Math.floor((totalTime - timeLeft) / 60);
      if (duration > 0) {
        addFocusTime(duration);
      }

      toast({
        title: "Session Complete! 🎉",
        description: `+${xpEarned} XP earned!`,
      });
    },
  });

  useEffect(() => {
    if (isRunning && !isPaused) {
      intervalRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          // Notifications
          const elapsed = totalTime - prev;

          // Notifications Logic
          if (prev === totalTime - 1) { // Started
            toast({ title: "Session Started 🚀", description: "Let's focus!" });
          }
          if (prev === Math.floor(totalTime / 2)) {
            toast({ title: "Halfway There! ⚡", description: "Stay focused, you're doing great." });
          }
          if (prev === 60 && totalTime > 120) { // 1 min left (only if total > 2 min)
            toast({ title: "Final Minute! 🔥", description: "Finish strong!" });
          }

          if (prev <= 1) {
            handleComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, isPaused, totalTime]);

  useEffect(() => {
    const elapsed = totalTime - timeLeft;
    const minutes = Math.floor(elapsed / 60);
    setXpEarned(minutes);
  }, [timeLeft, totalTime]);

  const handleStart = (minutes: number) => {
    setTotalTime(minutes * 60);
    setTimeLeft(minutes * 60);
    setIsRunning(true);
    setIsPaused(false);
    setXpEarned(0);
    setQuote(QUOTES[Math.floor(Math.random() * QUOTES.length)]);
  };

  const handlePause = () => {
    setIsPaused(!isPaused);
  };

  const handleStop = () => {
    const duration = Math.floor((totalTime - timeLeft) / 60);
    if (duration > 0) {
      completeMutation.mutate({
        duration,
        task,
        backgroundType: "default",
      });
      toast({
        title: "Session Stopped",
        description: `Saved ${duration} minutes of focus time.`,
      });
    }
    setIsRunning(false);
    setIsPaused(false);
    setTimeLeft(totalTime);
    setXpEarned(0);
  };

  const handleComplete = () => {
    const duration = Math.floor((totalTime - timeLeft) / 60);
    if (duration > 0) {
      completeMutation.mutate({
        duration,
        task,
        backgroundType: "default",
      });
    }
    setIsRunning(false);
    setIsPaused(false);
    setTimeLeft(totalTime);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const progress = ((totalTime - timeLeft) / totalTime) * 100;
  const circumference = 2 * Math.PI * 140;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div ref={containerRef} className="relative min-h-screen overflow-hidden">
      {/* Animated Gradient Background - CLEANED UP */}
      <div className={`fixed inset-0 ${theme.bg} transition-colors duration-700`}>
        {/* Removed gradient glow blobs and particles */}
      </div>

      {/* Music Player (Hidden iframe) */}
      {musicEnabled && (
        <iframe
          ref={iframeRef}
          src={LOFI_TRACKS[currentTrack].url}
          allow="autoplay"
          className="hidden"
        />
      )}

      {/* Ambient Sound Player */}
      <audio ref={ambientAudioRef} loop className="hidden" />

      {/* Exit Button */}
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

      {/* Music Controls & Settings */}
      <motion.div
        className="fixed top-8 right-8 z-50 flex items-center gap-3"
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
      >
        {/* Music Panel */}
        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4 shadow-2xl">
          <div className="flex items-center gap-3">
            <Button
              onClick={() => setMusicEnabled(!musicEnabled)}
              size="sm"
              variant="ghost"
              className="text-white hover:bg-white/20"
            >
              {musicEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </Button>
            {musicEnabled && (
              <>
                <Music className="w-4 h-4 text-yellow-300" />
                <select
                  value={currentTrack}
                  onChange={(e) => setCurrentTrack(Number(e.target.value))}
                  className="bg-white/10 text-white text-xs rounded px-2 py-1 border border-white/20"
                >
                  {LOFI_TRACKS.map((track, i) => (
                    <option key={i} value={i} className="bg-black">
                      {track.name}
                    </option>
                  ))}
                </select>
              </>
            )}
          </div>
        </div>

        {/* Full Screen Button */}
        <Button
          onClick={toggleFullScreen}
          size="icon"
          className="w-12 h-12 bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/20 text-white shadow-2xl"
        >
          {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
        </Button>

        {/* Settings Button */}
        <Button
          onClick={() => setSettingsOpen(true)}
          size="icon"
          className="w-12 h-12 bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-600 hover:to-amber-600 text-black shadow-2xl"
        >
          <SettingsIcon className="w-5 h-5" />
        </Button>
      </motion.div>

      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen p-8">
        <AnimatePresence mode="wait">
          {!isRunning ? (
            <motion.div
              key="setup"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="w-full max-w-4xl space-y-12"
            >
              {/* Header */}
              <div className="text-center space-y-3">
                <motion.h1
                  className={`text-7xl font-bold bg-gradient-to-r ${theme.gradient} bg-clip-text text-transparent`}
                  animate={{ opacity: [0.8, 1, 0.8] }}
                  transition={{ duration: 3, repeat: Infinity }}
                >
                  Focus Sanctum
                </motion.h1>
                <p className={`${theme.accent} opacity-70 text-sm uppercase tracking-widest`}>
                  Deep Work Environment
                </p>
              </div>

              {/* Stats */}
              {!zenMode && stats && (
                <div className="grid grid-cols-3 gap-6">
                  {[
                    { icon: Clock, label: "Total Time", value: `${stats.totalMinutes}m` },
                    { icon: TrendingUp, label: "XP Earned", value: stats.totalXP },
                    { icon: Target, label: "Sessions", value: stats.sessionCount },
                  ].map((stat, i) => (
                    <motion.div
                      key={i}
                      className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 text-center hover:bg-white/10 transition-all"
                      whileHover={{ scale: 1.05, y: -5 }}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.1 }}
                    >
                      <div className={`w-12 h-12 mx-auto mb-3 rounded-full bg-gradient-to-r ${theme.gradient} flex items-center justify-center`}>
                        <stat.icon className="w-6 h-6 text-black" />
                      </div>
                      <p className={`text-xs uppercase tracking-wider ${theme.accent} opacity-70 mb-2`}>{stat.label}</p>
                      <p className="text-3xl font-bold text-white">{stat.value}</p>
                    </motion.div>
                  ))}
                </div>
              )}

              {/* Task Input */}
              <div className="space-y-3">
                <label className={`text-sm uppercase tracking-wider ${theme.secondary} block`}>
                  What are you working on?
                </label>
                <Input
                  value={task}
                  onChange={(e) => setTask(e.target.value)}
                  placeholder="e.g., Master Python Programming"
                  className={`bg-white/5 backdrop-blur-md border-white/10 text-white placeholder:${theme.accent}/30 h-14 text-lg focus:border-${theme.primary} focus:ring-2 focus:ring-${theme.primary}/20 rounded-xl`}
                />
              </div>

              {/* Presets */}
              <div className="space-y-4">
                <label className="text-sm uppercase tracking-wider text-purple-300 block">
                  Choose Duration
                </label>
                <div className="grid grid-cols-3 gap-4">
                  {PRESETS.map((preset, i) => (
                    <motion.button
                      key={preset.name}
                      onClick={() => handleStart(preset.minutes)}
                      className="relative group h-32 bg-white/5 backdrop-blur-md border border-white/10 hover:border-yellow-500/50 rounded-2xl overflow-hidden transition-all"
                      whileHover={{ scale: 1.05, y: -5 }}
                      whileTap={{ scale: 0.95 }}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                    >
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
            <motion.div
              key="timer"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="w-full max-w-4xl space-y-16"
            >
              {/* Timer Display based on Style */}
              {/* Simplified Digital Timer */}
              <div className="text-center space-y-12">
                <div className="relative py-10">
                  <motion.div
                    className={`text-[15rem] font-bold tracking-tighter ${theme.primary} tabular-nums leading-none`}
                    animate={{
                      opacity: isPaused ? 0.5 : 1,
                    }}
                  >
                    {formatTime(timeLeft)}
                  </motion.div>
                  <motion.div
                    key={quote}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 0.8, y: 0 }}
                    className={`text-xl font-medium ${theme.text} mt-8 max-w-2xl mx-auto`}
                  >
                    "{quote}"
                  </motion.div>
                </div>

                {/* XP Counter */}
                {!zenMode && (
                  <motion.div
                    className={`inline-flex items-center gap-3 bg-gradient-to-r ${theme.gradient} bg-opacity-20 backdrop-blur-md border border-white/10 rounded-full px-8 py-4`}
                    animate={{ scale: [1, 1.05, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <Sparkles className={`w-6 h-6 ${theme.accent}`} />
                    <span className={`text-4xl font-bold ${theme.accent}`}>+{xpEarned}</span>
                    <span className={`text-lg uppercase tracking-wider ${theme.text} opacity-80`}>XP</span>
                  </motion.div>
                )}

                {/* Task */}
                {task && !zenMode && (
                  <div className={`flex items-center justify-center gap-3 ${theme.accent} opacity-70`}>
                    <Target className="w-5 h-5" />
                    <p className="text-lg">{task}</p>
                  </div>
                )}
              </div>

              {/* Controls */}
              <div className="flex justify-center gap-4">
                <Button
                  onClick={handlePause}
                  size="lg"
                  className="bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/20 text-white px-10 py-6 text-lg rounded-xl"
                >
                  {isPaused ? (
                    <>
                      <Play className="w-5 h-5 mr-2" />
                      Resume
                    </>
                  ) : (
                    <>
                      <Pause className="w-5 h-5 mr-2" />
                      Pause
                    </>
                  )}
                </Button>
                <Button
                  onClick={handleStop}
                  size="lg"
                  variant="ghost"
                  className="text-purple-300 hover:text-white hover:bg-white/10 px-10 py-6 text-lg rounded-xl"
                >
                  <Square className="w-5 h-5 mr-2" />
                  Stop
                </Button>
              </div>

              {/* Zen Mode Toggle */}
              {!zenMode && (
                <div className="text-center">
                  <button
                    onClick={() => setZenMode(true)}
                    className="text-sm uppercase tracking-wider text-yellow-500/70 hover:text-yellow-400 transition-colors"
                  >
                    Enter Zen Mode
                  </button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Virtual Pet - Repositioned based on state */}
      <FocusPet
        className={
          isRunning
            ? "fixed top-1/2 right-12 -translate-y-1/2 z-40 transition-all duration-700"
            : "fixed bottom-8 right-8 z-40 transition-all duration-700"
        }
      />

      {/* Settings Panel */}
      <FocusSettings isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
  );
}
