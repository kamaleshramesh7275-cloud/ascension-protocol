import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { 
  Target, Shield, Headphones, Gavel, FileCheck, 
  Flame, Award, Dumbbell, Sparkles, Volume2, 
  VolumeX, Copy, Check, Download, AlertTriangle, 
  Compass, ExternalLink, Terminal, Users
} from "lucide-react";
import { audioEngine } from "@/lib/audio-engine";
import { useAuth } from "@/hooks/use-auth";
import { usePWAInstall } from "@/hooks/usePWAInstall";
import { useToast } from "@/hooks/use-toast";

export function TacticalCommandPalette() {
  const [open, setOpen] = useState(false);
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { isInstallable, promptInstall } = usePWAInstall();
  const { toast } = useToast();
  const [isGammaActive, setIsGammaActive] = useState(false);

  // Keyboard shortcut listener: Ctrl+K or Cmd+K
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if ((e.key === "k" && (e.metaKey || e.ctrlKey)) || (e.key === "/" && !["INPUT", "TEXTAREA"].includes((e.target as HTMLElement)?.tagName))) {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const navigateTo = (path: string) => {
    setOpen(false);
    audioEngine.playCommandLock();
    setLocation(path);
  };

  const handleToggleGamma = () => {
    if (audioEngine.isGammaFlowActive()) {
      audioEngine.stop40HzGammaFlow();
      setIsGammaActive(false);
      toast({
        title: "NEURO-FLOW DISENGAGED",
        description: "40Hz Gamma binaural wave stopped.",
      });
    } else {
      audioEngine.start40HzGammaFlow(0.3);
      setIsGammaActive(true);
      toast({
        title: "NEURO-FLOW ENGAGED",
        description: "40Hz Gamma binaural wave streaming at 0.3 gain.",
      });
    }
    setOpen(false);
  };

  const handleTestKlaxon = () => {
    setOpen(false);
    audioEngine.startKlaxonSiren();
    toast({
      title: "KLAXON ENFORCER TEST",
      description: "Sounding 880Hz / 660Hz sawtooth alert burst.",
      variant: "destructive",
    });
    setTimeout(() => {
      audioEngine.stopKlaxonSiren();
    }, 2000);
  };

  const handleCopyInvite = () => {
    setOpen(false);
    const code = user?.displayName || user?.id || user?.uid || "OPERATOR";
    const inviteUrl = `${window.location.origin}/squad-pact?invite=${encodeURIComponent(code)}`;
    navigator.clipboard.writeText(inviteUrl);
    toast({
      title: "SQUAD COVENANT LINK COPIED",
      description: "Direct invite URL copied to clipboard.",
    });
  };

  return (
    <>
      <CommandDialog open={open} onOpenChange={setOpen}>
        <div className="bg-[#020617] border border-cyan-500/40 text-slate-100 rounded-2xl overflow-hidden shadow-[0_0_50px_rgba(6,182,212,0.2)]">
          {/* Header Bar */}
          <div className="px-4 py-2.5 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-cyan-400" />
              <span className="font-mono text-xs font-bold uppercase tracking-wider text-cyan-400">
                TACTICAL COMMAND PALETTE // QUICK SWITCHER
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-[10px] font-mono text-slate-500">
              <kbd className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-700 text-slate-300">ESC</kbd>
              <span>to close</span>
            </div>
          </div>

          <CommandInput 
            placeholder="Type a command or jump to a pillar (e.g. Focus, Squad, Court)..." 
            className="border-none focus:ring-0 font-mono text-sm placeholder:text-slate-500 py-4"
          />

          <CommandList className="max-h-[380px] p-2 overflow-y-auto font-mono text-xs">
            <CommandEmpty className="py-6 text-center text-xs text-slate-500 font-mono">
              NO PROTOCOL DIRECTIVE FOUND.
            </CommandEmpty>

            {/* Core 4 Pillars Group */}
            <CommandGroup heading="EXECUTION PROTOCOL // 4 PILLARS">
              <CommandItem
                onSelect={() => navigateTo("/mission-command")}
                className="flex items-center justify-between p-2.5 rounded-xl hover:bg-cyan-500/10 cursor-pointer text-slate-200"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
                    <Target className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-bold text-white">Mission Command</span>
                    <span className="text-[11px] text-slate-400 block">Daily Oath, Directives & Proof-of-Work</span>
                  </div>
                </div>
                <kbd className="px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-cyan-400 text-[10px] font-bold">1</kbd>
              </CommandItem>

              <CommandItem
                onSelect={() => navigateTo("/air-gap-focus")}
                className="flex items-center justify-between p-2.5 rounded-xl hover:bg-cyan-500/10 cursor-pointer text-slate-200"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-rose-500/20 text-rose-400 flex items-center justify-center">
                    <Shield className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-bold text-white">Air-Gap Focus Chamber</span>
                    <span className="text-[11px] text-slate-400 block">40Hz Binaural Beats & Klaxon Enforcer</span>
                  </div>
                </div>
                <kbd className="px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-cyan-400 text-[10px] font-bold">2</kbd>
              </CommandItem>

              <CommandItem
                onSelect={() => navigateTo("/squad-pact")}
                className="flex items-center justify-between p-2.5 rounded-xl hover:bg-cyan-500/10 cursor-pointer text-slate-200"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center">
                    <Users className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-bold text-white">Squad Pact Pool</span>
                    <span className="text-[11px] text-slate-400 block">Peer Escrow Vault & 85% Dividend Yield</span>
                  </div>
                </div>
                <kbd className="px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-cyan-400 text-[10px] font-bold">3</kbd>
              </CommandItem>

              <CommandItem
                onSelect={() => navigateTo("/commitment-contract")}
                className="flex items-center justify-between p-2.5 rounded-xl hover:bg-cyan-500/10 cursor-pointer text-slate-200"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                    <FileCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-bold text-white">Commitment Contract</span>
                    <span className="text-[11px] text-slate-400 block">Personal Weekly Escrow Pledge</span>
                  </div>
                </div>
                <kbd className="px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-cyan-400 text-[10px] font-bold">4</kbd>
              </CommandItem>

              <CommandItem
                onSelect={() => navigateTo("/performance-court")}
                className="flex items-center justify-between p-2.5 rounded-xl hover:bg-cyan-500/10 cursor-pointer text-slate-200"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center">
                    <Gavel className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-bold text-white">Sunday Performance Court</span>
                    <span className="text-[11px] text-slate-400 block">Weekly Judicial Decrees & Forfeitures</span>
                  </div>
                </div>
                <kbd className="px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-cyan-400 text-[10px] font-bold">5</kbd>
              </CommandItem>

              <CommandItem
                onSelect={() => navigateTo("/evening-debrief")}
                className="flex items-center justify-between p-2.5 rounded-xl hover:bg-cyan-500/10 cursor-pointer text-slate-200"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-bold text-white">Evening Debrief</span>
                    <span className="text-[11px] text-slate-400 block">AI Chief of Staff Friction Audit</span>
                  </div>
                </div>
                <kbd className="px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-cyan-400 text-[10px] font-bold">6</kbd>
              </CommandItem>

              <CommandItem
                onSelect={() => navigateTo("/hall-of-ascension")}
                className="flex items-center justify-between p-2.5 rounded-xl hover:bg-cyan-500/10 cursor-pointer text-slate-200"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-yellow-500/20 text-yellow-400 flex items-center justify-center">
                    <Award className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-bold text-white">Hall of Ascension</span>
                    <span className="text-[11px] text-slate-400 block">Leaderboard & Wall of Consequence</span>
                  </div>
                </div>
                <kbd className="px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-cyan-400 text-[10px] font-bold">7</kbd>
              </CommandItem>

              <CommandItem
                onSelect={() => navigateTo("/workout")}
                className="flex items-center justify-between p-2.5 rounded-xl hover:bg-cyan-500/10 cursor-pointer text-slate-200"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-orange-500/20 text-orange-400 flex items-center justify-center">
                    <Dumbbell className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-bold text-white">Workout Protocol</span>
                    <span className="text-[11px] text-slate-400 block">Tactical Physical Conditioning</span>
                  </div>
                </div>
                <kbd className="px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-cyan-400 text-[10px] font-bold">8</kbd>
              </CommandItem>
            </CommandGroup>

            <CommandSeparator className="my-2 bg-slate-800" />

            {/* Quick Actions Group */}
            <CommandGroup heading="QUICK ACTIONS & ACOUSTICS">
              <CommandItem
                onSelect={handleToggleGamma}
                className="flex items-center justify-between p-2.5 rounded-xl hover:bg-cyan-500/10 cursor-pointer text-slate-200"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
                    {audioEngine.isGammaFlowActive() ? <VolumeX className="w-4 h-4" /> : <Headphones className="w-4 h-4" />}
                  </div>
                  <div>
                    <span className="font-bold text-white">
                      {audioEngine.isGammaFlowActive() ? "Stop 40Hz Gamma Flow" : "Start 40Hz Gamma Flow"}
                    </span>
                    <span className="text-[11px] text-slate-400 block">
                      {audioEngine.isGammaFlowActive() ? "Binaural oscillation is currently active" : "Stream 40Hz cognitive entrainment wave"}
                    </span>
                  </div>
                </div>
                <span className="text-[10px] font-mono text-cyan-400">AUDIO</span>
              </CommandItem>

              <CommandItem
                onSelect={handleTestKlaxon}
                className="flex items-center justify-between p-2.5 rounded-xl hover:bg-rose-500/10 cursor-pointer text-slate-200"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-rose-500/20 text-rose-400 flex items-center justify-center">
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-bold text-white">Test Breach Klaxon Siren</span>
                    <span className="text-[11px] text-slate-400 block">Test 2s burst of the 880Hz alert tone</span>
                  </div>
                </div>
                <span className="text-[10px] font-mono text-rose-400">ALERT</span>
              </CommandItem>

              <CommandItem
                onSelect={handleCopyInvite}
                className="flex items-center justify-between p-2.5 rounded-xl hover:bg-amber-500/10 cursor-pointer text-slate-200"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center">
                    <Copy className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-bold text-white">Copy Squad Pact Invite Link</span>
                    <span className="text-[11px] text-slate-400 block">Enlist peers with your referral covenant link</span>
                  </div>
                </div>
                <span className="text-[10px] font-mono text-amber-400">REFERRAL</span>
              </CommandItem>

              {isInstallable && (
                <CommandItem
                  onSelect={() => {
                    setOpen(false);
                    promptInstall();
                  }}
                  className="flex items-center justify-between p-2.5 rounded-xl hover:bg-cyan-500/10 cursor-pointer text-slate-200"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
                      <Download className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="font-bold text-white">Install PWA Standalone App</span>
                      <span className="text-[11px] text-slate-400 block">Install to home screen for full offline enclave</span>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono text-cyan-400">INSTALL</span>
                </CommandItem>
              )}
            </CommandGroup>
          </CommandList>
        </div>
      </CommandDialog>
    </>
  );
}
