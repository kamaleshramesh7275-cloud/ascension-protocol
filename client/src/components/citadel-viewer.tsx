import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { CitadelGrid } from "./citadel-grid";
import { X, Crown, Coins, Zap, Hammer, Sword, Shield, Map as MapIcon, ChevronRight, Info, TrendingUp } from "lucide-react";
import { Button } from "./ui/button";

interface Building {
  id: string; userId: string; type: string; buildingName: string;
  x: number; y: number; status: "building" | "completed" | "ruined";
  wager: number;
  def?: { label: string; passiveCoins: number; xpBonusPct: number; troopsPerMin: number; ruinClearDiscount: number; };
}

interface CitadelStats {
  totalBuildings: number; ruinCount: number;
  buildingCounts: Record<string, number>;
  buffs: { xpBonus: number; passiveCoinsPerDay: number; ruinClearDiscount: number; troopsPerMin: number; };
}

interface CitadelViewerProps {
  isOpen: boolean;
  onClose: () => void;
  userId?: string;
  username?: string;
  isRaining?: boolean;
}

function Skybox({ isRaining }: { isRaining?: boolean }) {
  const hour = new Date().getHours();
  const isNight = hour < 6 || hour >= 20;
  
  return (
    <div className={`absolute inset-0 transition-colors duration-1000 ${isNight ? "bg-[#020617]" : "bg-[#0c1445]"}`}>
      <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/40" />
      
      {/* Dynamic Rain */}
      {isRaining && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {Array.from({ length: 150 }).map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-[1px] h-8 bg-blue-400/20"
              style={{ left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%` }}
              animate={{ y: [0, 800], opacity: [0, 1, 0] }}
              transition={{ duration: 0.5 + Math.random() * 0.5, repeat: Infinity, ease: "linear", delay: Math.random() * 2 }}
            />
          ))}
        </div>
      )}

      {/* Atmospheric Fog */}
      <div className="absolute bottom-0 left-0 right-0 h-96 bg-gradient-to-t from-black/80 to-transparent pointer-events-none" />
    </div>
  );
}

export function CitadelViewer({ isOpen, onClose, userId, username, isRaining }: CitadelViewerProps) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<"city" | "stats" | "realm">("city");
  const [isInfoOpen, setIsInfoOpen] = useState(false);
  const [scale, setScale] = useState(0.8);
  const { data: user } = useQuery<any>({ queryKey: ["/api/user"] });
  const isSelf = !userId || userId === user?.id;
  const containerRef = useRef<HTMLDivElement>(null);

  const queryKey = isSelf ? "/api/citadel" : `/api/citadel/public/${userId}`;
  const { data: buildings = [] } = useQuery<Building[]>({ 
    queryKey: [queryKey],
    enabled: isOpen 
  });

  // Fetch stats - for public view, we could eventually add a public stats endpoint
  const { data: stats, isLoading: statsLoading } = useQuery<CitadelStats>({ 
    queryKey: ["/api/citadel/stats", isSelf ? "self" : userId], 
    queryFn: async () => {
      const url = isSelf ? "/api/citadel/stats" : `/api/citadel/public/${userId}/stats`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch stats");
      return res.json();
    },
    enabled: !!isOpen 
  });

  const collectMutation = useMutation({
    mutationFn: async () => {
      console.log("Triggering collect tribute...");
      const res = await fetch("/api/citadel/collect", { method: "POST" });
      if (!res.ok) throw new Error("Collection failed");
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/citadel"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      queryClient.invalidateQueries({ queryKey: ["/api/citadel/stats"] });
      if (data.collected > 0) {
        toast({ 
          title: "Tribute Collected! 💰", 
          description: `You harvested ${data.collected} coins from your empire.`,
        });
      } else {
        toast({ 
          title: "Treasury is Empty", 
          description: "Check back later when your buildings have generated more wealth.",
        });
      }
    },
    onError: () => {
      toast({ title: "Error", description: "Could not collect tribute at this time.", variant: "destructive" });
    }
  });

  const clearRuinMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/citadel/${id}/clear`, { method: "POST" });
      if (!res.ok) throw new Error("Restoration failed");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/citadel"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      toast({ title: "Building Restored! ✨", description: "The architecture has been returned to its former glory." });
    }
  });

  const expandGridMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/citadel/expand", { method: "POST" });
      if (!res.ok) throw new Error("Expansion failed");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      toast({ title: "Empire Expanded! 🗺️", description: "New territories have been annexed into your citadel." });
    }
  });

  // Handle Zoom
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      if (!isOpen) return;
      e.preventDefault();
      setScale(s => Math.min(1.5, Math.max(0.4, s - e.deltaY * 0.001)));
    };
    const div = containerRef.current;
    if (div) div.addEventListener("wheel", handleWheel, { passive: false });
    return () => div?.removeEventListener("wheel", handleWheel);
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex flex-col bg-black overflow-hidden"
        >
          <Skybox isRaining={isRaining} />

          {/* Header Controls */}
          <div className="relative z-[100] flex items-center justify-between px-8 py-6 bg-gradient-to-b from-black/90 to-transparent">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-yellow-500/10 border border-yellow-500/30 flex items-center justify-center shadow-lg shadow-yellow-500/10">
                <Crown className="w-7 h-7 text-yellow-500" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white tracking-tighter uppercase italic">
                  {username ? username : "Supreme Commander"}'s Citadel
                </h1>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-[10px] font-bold text-yellow-500/80 uppercase tracking-widest bg-yellow-500/10 px-2 py-0.5 rounded border border-yellow-500/20">
                    Tier {stats ? Math.floor(stats.totalBuildings / 5) + 1 : 1} Metropolis
                  </span>
                  {isRaining && (
                    <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest flex items-center gap-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
                      Deep Work Active
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-1.5 shadow-2xl">
              {[
                { id: "city", label: "Overview", icon: MapIcon },
                { id: "stats", label: "Economy", icon: TrendingUp },
                { id: "realm", label: "Realm", icon: Sword },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold uppercase tracking-wider transition-all ${activeTab === tab.id ? "bg-white/10 text-white shadow-inner" : "text-white/40 hover:text-white/70"}`}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                </button>
              ))}
              {isSelf && stats && stats.buffs.passiveCoinsPerDay > 0 && (
                <Button
                  onClick={() => collectMutation.mutate()}
                  disabled={collectMutation.isPending}
                  variant="outline"
                  className="bg-yellow-500/10 border-yellow-500/30 text-yellow-500 hover:bg-yellow-500 hover:text-black font-bold h-10 px-4 rounded-xl ml-2"
                >
                  <Coins className="w-4 h-4 mr-2" />
                  Collect
                </Button>
              )}
              <Button 
                onClick={() => setIsInfoOpen(true)} 
                size="icon" 
                variant="ghost" 
                className="w-12 h-12 rounded-xl text-blue-400 hover:text-blue-300 hover:bg-blue-400/10 transition-all ml-1"
                title="Strategy Guide"
              >
                <Info className="w-6 h-6" />
              </Button>
              <div className="w-[1px] h-8 bg-white/10 mx-2" />
              <Button 
                onClick={onClose} 
                size="icon" 
                variant="ghost" 
                className="w-12 h-12 rounded-xl text-white/40 hover:text-white hover:bg-red-500/20 hover:border-red-500/30 transition-all"
              >
                <X className="w-6 h-6" />
              </Button>
            </div>
          </div>

          {/* Main Visual Content */}
          <div className="relative flex-1 cursor-grab active:cursor-grabbing overflow-hidden" ref={containerRef}>
            {!stats && activeTab !== "city" ? (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                  <div className="w-12 h-12 border-4 border-white/20 border-t-white rounded-full animate-spin" />
                  <p className="text-white/40 font-bold uppercase tracking-widest text-xs">Consulting Archives...</p>
                </div>
              </div>
            ) : (
              <AnimatePresence mode="wait">
                {activeTab === "city" && (
                  <motion.div
                    key="city"
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="w-full h-full flex flex-col items-center justify-center"
                  >
                  {/* Floating Action Bar */}
                  {isSelf && (
                    <motion.div 
                      className="absolute bottom-12 z-50 flex items-center gap-4 bg-black/60 backdrop-blur-2xl border border-white/10 p-2 rounded-2xl shadow-2xl"
                      initial={{ y: 50, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                    >
                      <button
                        onClick={() => collectMutation.mutate()}
                        disabled={collectMutation.isPending}
                        className="flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-yellow-500 to-amber-600 rounded-xl text-black font-black uppercase tracking-tighter hover:scale-105 active:scale-95 transition-all shadow-lg shadow-yellow-500/20 disabled:opacity-50"
                      >
                        <Coins className="w-5 h-5" />
                        {collectMutation.isPending ? "Harvesting..." : "Collect Tribute"}
                      </button>
                      
                      <div className="flex flex-col px-4 border-r border-white/10">
                        <span className="text-[10px] uppercase tracking-widest text-white/40 font-bold">Daily Income</span>
                        <span className="text-lg font-black text-yellow-500">+{stats?.buffs.passiveCoinsPerDay || 0}💰</span>
                      </div>
                      
                      <button 
                        onClick={() => setIsInfoOpen(true)}
                        className="p-4 text-white/40 hover:text-white transition-colors"
                      >
                        <Info className="w-5 h-5" />
                      </button>
                    </motion.div>
                  )}

                  {/* Grid Container with Pan/Zoom */}
                  <motion.div 
                    style={{ scale }} 
                    transition={{ type: "spring", damping: 20 }}
                    className="flex items-center justify-center w-[2000px] h-[1200px]"
                  >
                    <CitadelGrid
                      buildings={buildings}
                      gridSize={10}
                      onClearRuin={(id) => clearRuinMutation.mutate(id)}
                      readonly={!isSelf}
                    />
                  </motion.div>
                </motion.div>
              )}

              {activeTab === "stats" && stats && (
                <motion.div 
                  key="stats" 
                  initial={{ opacity: 0, x: 100 }} 
                  animate={{ opacity: 1, x: 0 }}
                  className="absolute inset-0 flex items-center justify-center p-12"
                >
                  <div className="w-full max-w-5xl grid grid-cols-3 gap-8">
                    {/* Economy Overview */}
                    <div className="col-span-2 space-y-8">
                      <div className="grid grid-cols-2 gap-6">
                        {[
                          { icon: Zap, label: "Efficiency", value: `+${stats.buffs.xpBonus}% XP`, color: "text-blue-400" },
                          { icon: Coins, label: "Wealth", value: `${stats.buffs.passiveCoinsPerDay}💰/day`, color: "text-yellow-500" },
                          { icon: Hammer, label: "Stability", value: `${stats.buffs.ruinClearDiscount}% Discount`, color: "text-orange-400" },
                          { icon: Shield, label: "Defense", value: `${stats.buffs.troopsPerMin} Troops/min`, color: "text-green-400" },
                        ].map((s) => (
                          <div key={s.label} className="bg-white/5 border border-white/10 rounded-3xl p-8 flex flex-col gap-2">
                            <s.icon className={`w-8 h-8 ${s.color} opacity-80 mb-4`} />
                            <span className="text-4xl font-black text-white">{s.value}</span>
                            <span className="text-sm uppercase tracking-widest text-white/30 font-bold">{s.label}</span>
                          </div>
                        ))}
                      </div>

                      {isSelf && (
                        <div className="bg-gradient-to-r from-purple-500/20 to-blue-500/20 border border-purple-500/40 rounded-3xl p-10 flex items-center justify-between shadow-2xl">
                          <div className="space-y-2">
                            <h3 className="text-3xl font-black text-white tracking-tight uppercase italic">Annex Territory</h3>
                            <p className="text-white/40 max-w-sm">Expend 2000 gold to expand your city grid and unlock new building slots.</p>
                          </div>
                          <Button 
                            onClick={() => expandGridMutation.mutate()}
                            disabled={expandGridMutation.isPending}
                            className="h-16 px-12 bg-white text-black font-black text-lg rounded-2xl hover:bg-white/90 shadow-xl shadow-white/10"
                          >
                            EXPAND (2000💰)
                          </Button>
                        </div>
                      )}
                    </div>

                    {/* Inventory Sidebar */}
                    <div className="bg-white/5 border border-white/10 rounded-3xl p-8 space-y-6">
                      <h3 className="text-xl font-bold text-white uppercase tracking-tighter">Infrastructure</h3>
                      <div className="space-y-4">
                        {Object.entries(stats.buildingCounts).map(([name, count]) => (
                          <div key={name} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl">
                            <span className="capitalize text-white/60 font-medium">{name.replace("_", " ")}</span>
                            <span className="text-2xl font-black text-white">{count}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === "realm" && (
                <motion.div 
                  key="realm" 
                  initial={{ opacity: 0, x: 100 }} 
                  animate={{ opacity: 1, x: 0 }}
                  className="absolute inset-0 flex items-center justify-center p-12"
                >
                  <div className="w-full max-w-4xl space-y-8 text-center">
                    <div className="w-24 h-24 rounded-3xl bg-red-500/10 border border-red-500/30 flex items-center justify-center mx-auto shadow-2xl shadow-red-500/10">
                      <Sword className="w-12 h-12 text-red-500" />
                    </div>
                    <div className="space-y-4">
                      <h2 className="text-5xl font-black text-white tracking-tighter uppercase italic">The War Room</h2>
                      <p className="text-white/40 text-xl max-w-2xl mx-auto font-medium">Command your legions and raid rival empires for tribute.</p>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-6 max-w-2xl mx-auto">
                      <div className="bg-white/5 border border-white/10 p-8 rounded-3xl space-y-2">
                        <span className="text-[10px] uppercase tracking-widest text-white/30 font-bold">Active Garrison</span>
                        <p className="text-4xl font-black text-white">{stats?.buffs.troopsPerMin || 0}</p>
                        <p className="text-xs text-red-400 font-bold">Troops per focus min</p>
                      </div>
                      <div className="bg-white/5 border border-white/10 p-8 rounded-3xl space-y-2 opacity-50 cursor-not-allowed">
                        <span className="text-[10px] uppercase tracking-widest text-white/30 font-bold">Realm Map</span>
                        <p className="text-4xl font-black text-white italic">LOCKED</p>
                        <p className="text-xs text-white/40">Requires Tier 3 Metropolis</p>
                      </div>
                    </div>

                    <div className="bg-red-500/10 border border-red-500/20 p-6 rounded-2xl max-w-xl mx-auto">
                      <p className="text-sm text-red-400 font-bold italic">"Only those who focus with intent can lead armies to victory."</p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          )}
          </div>

          {/* Info Side Panel - FINAL LAYER */}
          <AnimatePresence>
            {isInfoOpen && (
              <>
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setIsInfoOpen(false)}
                  className="fixed inset-0 bg-black/80 backdrop-blur-md z-[200]"
                />
                <motion.div
                  initial={{ x: "100%" }}
                  animate={{ x: 0 }}
                  exit={{ x: "100%" }}
                  transition={{ type: "spring", damping: 30, stiffness: 300 }}
                  className="fixed top-0 right-0 bottom-0 w-[420px] bg-[#020617] border-l border-white/10 z-[210] shadow-[-20px_0_100px_rgba(0,0,0,0.8)] overflow-y-auto"
                >
                  <div className="relative p-8 border-b border-white/5 bg-gradient-to-br from-blue-500/10 to-purple-500/10">
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-blue-500" />
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-2xl font-black text-white tracking-tighter uppercase italic flex items-center gap-2">
                          <Crown className="w-6 h-6 text-yellow-500" />
                          Imperial Archive
                        </h2>
                        <p className="text-[10px] text-white/40 uppercase tracking-[0.2em] font-bold mt-1">Commander's Strategy Manual</p>
                      </div>
                      <Button onClick={() => setIsInfoOpen(false)} size="icon" variant="ghost" className="rounded-xl w-10 h-10 text-white/40 hover:text-white">
                        <X className="w-5 h-5" />
                      </Button>
                    </div>
                  </div>

                  <div className="p-8 space-y-12 pb-24">
                    {/* Philosophical Guidance */}
                    <section>
                      <div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-2xl p-6 border border-white/10 relative overflow-hidden">
                        <p className="text-sm text-white/80 leading-relaxed italic">
                          "Your Citadel is the physical manifestation of your focus. Every building represents a victory against distraction."
                        </p>
                      </div>
                    </section>

                    {/* Instructions */}
                    <section className="space-y-6">
                      <h3 className="text-xs font-bold text-white/30 uppercase tracking-[0.3em] flex items-center gap-2">
                        <div className="h-px flex-1 bg-white/10" />
                        Operations
                        <div className="h-px flex-1 bg-white/10" />
                      </h3>
                      <div className="space-y-4">
                        {[
                          { icon: Zap, color: "text-blue-400", title: "Construction", desc: "Sessions > 25m yield permanent buildings." },
                          { icon: MapIcon, color: "text-purple-400", title: "Navigation", desc: "Drag to pan, pinch to zoom." },
                          { icon: Coins, color: "text-yellow-500", title: "Harvest", desc: "Collect gold when the header glows." },
                        ].map((item, i) => (
                          <div key={i} className="flex gap-4">
                            <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                              <item.icon className={`w-5 h-5 ${item.color}`} />
                            </div>
                            <div className="space-y-0.5">
                              <h4 className="text-sm font-bold text-white uppercase">{item.title}</h4>
                              <p className="text-xs text-white/40 leading-relaxed">{item.desc}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </section>
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
