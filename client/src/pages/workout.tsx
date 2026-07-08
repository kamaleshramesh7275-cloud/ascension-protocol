import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  Dumbbell, Plus, History, List, Play, Check, X, Search,
  Trophy, ChevronDown, ChevronUp, Zap, Clock, Weight,
  BarChart3, Layers, Activity
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { useWorkout } from "@/context/workout-context";
import { useAuth } from "@/hooks/use-auth";
import type { Exercise, WorkoutSession, WorkoutSessionWithSets, WorkoutTemplate, PersonalRecord } from "@shared/schema";
import { format, formatDuration, intervalToDuration } from "date-fns";
import { apiRequest } from "@/lib/queryClient";

// ── Live elapsed timer ──────────────────────────────────────────────────
function useElapsedTime(startedAt?: Date): string {
  const [elapsed, setElapsed] = useState("0:00");
  useEffect(() => {
    if (!startedAt) return;
    const tick = () => {
      const secs = Math.floor((Date.now() - new Date(startedAt).getTime()) / 1000);
      const m = Math.floor(secs / 60);
      const s = secs % 60;
      setElapsed(`${m}:${String(s).padStart(2, "0")}`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [startedAt]);
  return elapsed;
}

// ── Session detail accordion ────────────────────────────────────────────
function SessionCard({ session, exercises }: { session: WorkoutSession; exercises: Exercise[] }) {
  const [open, setOpen] = useState(false);
  const { data: detail } = useQuery<WorkoutSessionWithSets>({
    queryKey: [`/api/workouts/sessions/${session.id}`],
    enabled: open,
  });

  const duration = Math.floor((session.durationSeconds || 0) / 60);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 280, damping: 28 }}
    >
      <Card
        className={`bg-card/50 backdrop-blur-sm border-white/10 transition-all duration-300 overflow-hidden ${open ? "border-emerald-500/30" : "hover:border-white/20"}`}
      >
        {/* Summary row */}
        <button
          className="w-full text-left"
          onClick={() => setOpen(o => !o)}
          aria-expanded={open}
        >
          <CardContent className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="mt-1 h-9 w-9 rounded-xl bg-emerald-500/10 flex items-center justify-center shrink-0">
                <Dumbbell className="h-5 w-5 text-emerald-400" />
              </div>
              <div>
                <h3 className="font-semibold text-base leading-tight">{session.name}</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {format(new Date(session.startedAt), "EEE, MMM d • p")}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-6 text-sm ml-12 md:ml-0">
              <div className="text-center">
                <div className="font-bold text-emerald-400">{session.totalVolume?.toLocaleString()} kg</div>
                <div className="text-muted-foreground text-[10px] uppercase tracking-wide">Volume</div>
              </div>
              <div className="text-center">
                <div className="font-bold text-cyan-400">{session.totalSets}</div>
                <div className="text-muted-foreground text-[10px] uppercase tracking-wide">Sets</div>
              </div>
              <div className="text-center">
                <div className="font-bold text-amber-400">{duration} min</div>
                <div className="text-muted-foreground text-[10px] uppercase tracking-wide">Time</div>
              </div>
              {session.xpEarned ? (
                <div className="text-center">
                  <div className="font-bold text-violet-400">+{session.xpEarned}</div>
                  <div className="text-muted-foreground text-[10px] uppercase tracking-wide">XP</div>
                </div>
              ) : null}
              <div className="text-muted-foreground ml-2">
                {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </div>
            </div>
          </CardContent>
        </button>

        {/* Expanded sets detail */}
        <AnimatePresence initial={false}>
          {open && (
            <motion.div
              key="detail"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: "easeInOut" }}
              className="overflow-hidden"
            >
              <div className="px-5 pb-5 border-t border-white/5">
                {!detail ? (
                  <div className="py-6 flex items-center justify-center gap-2 text-muted-foreground text-sm">
                    <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}>
                      <Layers className="h-4 w-4" />
                    </motion.div>
                    Loading sets...
                  </div>
                ) : detail.sets.length === 0 ? (
                  <p className="text-muted-foreground text-sm py-4 text-center">No sets recorded.</p>
                ) : (
                  <div className="mt-4 space-y-3">
                    {/* Group sets by exercise */}
                    {Array.from(
                      detail.sets.reduce((map, set) => {
                        const exId = set.exerciseId;
                        if (!map.has(exId)) map.set(exId, []);
                        map.get(exId)!.push(set);
                        return map;
                      }, new Map<string, typeof detail.sets>())
                    ).map(([exId, exSets]) => {
                      const exercise = exercises.find(e => e.id === exId) || { name: "Unknown", muscleGroup: "" };
                      return (
                        <div key={exId} className="rounded-xl bg-white/3 border border-white/5 overflow-hidden">
                          <div className="px-4 py-2.5 bg-white/5 flex items-center gap-2">
                            <div className="h-5 w-5 rounded-md bg-primary/20 flex items-center justify-center">
                              <Dumbbell className="h-3 w-3 text-primary" />
                            </div>
                            <span className="text-sm font-semibold">{exercise.name}</span>
                            <span className="text-xs text-muted-foreground capitalize ml-auto">{exercise.muscleGroup}</span>
                          </div>
                          <div className="px-4 py-2">
                            <div className="grid grid-cols-4 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1 text-center">
                              <span>Set</span><span>Weight</span><span>Reps</span><span>PR</span>
                            </div>
                            {exSets.map((set, i) => (
                              <motion.div
                                key={i}
                                initial={{ opacity: 0, x: -8 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.04 }}
                                className="grid grid-cols-4 text-sm py-1.5 border-t border-white/5 text-center items-center"
                              >
                                <span className="text-muted-foreground">{set.setNumber}</span>
                                <span className="font-medium">{set.weight ? `${set.weight} kg` : "—"}</span>
                                <span className="font-medium">{set.reps ?? "—"}</span>
                                <span>
                                  {set.isPersonalRecord ? (
                                    <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 text-[10px] px-1.5">
                                      <Trophy className="h-2.5 w-2.5 mr-1" /> PR
                                    </Badge>
                                  ) : "—"}
                                </span>
                              </motion.div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                    {session.notes && (
                      <p className="text-xs text-muted-foreground italic border-t border-white/5 pt-3">
                        📝 {session.notes}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    </motion.div>
  );
}

// ── Main Page ───────────────────────────────────────────────────────────
export default function WorkoutPage() {
  const { user } = useAuth();
  const {
    activeSession, isWorkoutActive, startWorkout, finishWorkout,
    cancelWorkout, activeSets, addSet, updateSet, removeSet
  } = useWorkout();

  const elapsed = useElapsedTime(isWorkoutActive ? activeSession?.startedAt : undefined);

  const { data: exercises = [] } = useQuery<Exercise[]>({
    queryKey: ["/api/workouts/exercises"],
  });
  const { data: sessions = [] } = useQuery<WorkoutSession[]>({
    queryKey: ["/api/workouts/sessions"],
    enabled: !!user,
  });
  const { data: templates = [] } = useQuery<WorkoutTemplate[]>({
    queryKey: ["/api/workouts/templates"],
    enabled: !!user,
  });
  const { data: personalRecords = [] } = useQuery<PersonalRecord[]>({
    queryKey: ["/api/workouts/prs"],
    enabled: !!user,
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [isAddOpen, setIsAddOpen] = useState(false);

  const filteredExercises = exercises.filter(e =>
    e.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    e.muscleGroup.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleStartEmpty = () => {
    startWorkout({ userId: user?.id || "", name: "Empty Workout", startedAt: new Date() });
  };

  // ── Active Workout View ─────────────────────────────────────────────
  if (isWorkoutActive && activeSession) {
    return (
      <div className="p-4 md:p-6 max-w-4xl mx-auto mb-24 space-y-6">
        {/* Pulsing header banner */}
        <motion.div
          className="relative rounded-2xl overflow-hidden"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/20 to-cyan-500/20" />
          <div className="absolute inset-0 border border-emerald-500/30 rounded-2xl" />
          {/* Pulse glow */}
          <motion.div
            className="absolute inset-0 bg-emerald-500/10 rounded-2xl"
            animate={{ opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          />
          <div className="relative p-5 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <motion.div
                  className="h-2 w-2 rounded-full bg-emerald-400"
                  animate={{ scale: [1, 1.4, 1], opacity: [1, 0.6, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                />
                <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">Workout In Progress</span>
              </div>
              <h1 className="text-xl font-bold text-white">{activeSession.name}</h1>
              <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {elapsed}</span>
                <span className="flex items-center gap-1"><Layers className="h-3.5 w-3.5" /> {activeSets.length} sets</span>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <motion.div whileTap={{ scale: 0.95 }}>
                <Button size="sm" onClick={() => finishWorkout()} className="bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/30">
                  <Check className="w-4 h-4 mr-2" /> Finish
                </Button>
              </motion.div>
              <motion.div whileTap={{ scale: 0.95 }}>
                <Button variant="outline" size="sm" onClick={cancelWorkout} className="text-red-400 border-red-500/30 hover:bg-red-500/10 w-full">
                  <X className="w-4 h-4 mr-2" /> Cancel
                </Button>
              </motion.div>
            </div>
          </div>
        </motion.div>

        {/* Active sets */}
        <AnimatePresence>
          <div className="space-y-3">
            {activeSets.map((set, index) => {
              const exercise = exercises.find(e => e.id === set.exerciseId);
              return (
                <motion.div
                  key={`${set.exerciseId}-${set.setNumber}`}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20, height: 0 }}
                  layout
                >
                  <Card className="overflow-hidden bg-card/50 backdrop-blur-sm border-white/10">
                    <CardHeader className="py-3 px-4 flex flex-row items-center justify-between bg-white/5">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground font-medium bg-white/5 rounded px-2 py-0.5">Set {set.setNumber}</span>
                        <CardTitle className="text-sm font-semibold">{exercise?.name || "Unknown"}</CardTitle>
                      </div>
                      <motion.button whileTap={{ scale: 0.85 }} onClick={() => removeSet(index)} className="h-6 w-6 flex items-center justify-center rounded-full text-muted-foreground hover:text-red-400 hover:bg-red-400/10 transition-colors">
                        <X className="w-3.5 h-3.5" />
                      </motion.button>
                    </CardHeader>
                    <CardContent className="p-4 grid grid-cols-3 gap-3 items-end">
                      <div>
                        <label className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold block mb-1.5">Weight (kg)</label>
                        <Input
                          type="number"
                          placeholder="0"
                          className="h-10 text-center text-lg font-semibold bg-white/5 border-white/10"
                          value={set.weight || ""}
                          onChange={e => updateSet(index, { weight: parseFloat(e.target.value) || undefined })}
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold block mb-1.5">Reps</label>
                        <Input
                          type="number"
                          placeholder="0"
                          className="h-10 text-center text-lg font-semibold bg-white/5 border-white/10"
                          value={set.reps || ""}
                          onChange={e => updateSet(index, { reps: parseInt(e.target.value) || undefined })}
                        />
                      </div>
                      <motion.div whileTap={{ scale: 0.9 }}>
                        <Button variant="outline" className="h-10 w-full rounded-xl bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20">
                          <Check className="w-4 h-4 mr-1" /> Done
                        </Button>
                      </motion.div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </AnimatePresence>

        {/* Add exercise Button */}
        <div className="pt-4 mt-2">
          <Sheet open={isAddOpen} onOpenChange={setIsAddOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" className="w-full h-12 text-blue-400 border-blue-500/30 bg-blue-500/10 hover:bg-blue-500/20 font-medium text-base rounded-xl">
                <Plus className="w-5 h-5 mr-2" /> Add Exercise
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="h-[96vh] bg-[#0a0a0a] border-t border-white/10 p-0 flex flex-col sm:max-w-md sm:mx-auto sm:rounded-t-2xl">
              <div className="flex flex-row items-center justify-between border-b border-white/10 p-4 shrink-0">
                <button onClick={() => setIsAddOpen(false)} className="text-blue-500 font-medium text-base hover:text-blue-400 transition-colors">Cancel</button>
                <SheetTitle className="text-base font-semibold m-0 text-white">Add Exercise</SheetTitle>
                <button className="text-blue-500 font-medium text-base hover:text-blue-400 transition-colors">Create</button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 scrollbar-hide">
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                  <Input
                    placeholder="Search exercise"
                    className="pl-10 bg-white/5 border-none h-10 text-base rounded-xl text-white placeholder:text-muted-foreground focus-visible:ring-1 focus-visible:ring-white/20"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                  />
                </div>
                
                <div className="flex gap-3">
                  <Button variant="secondary" className="flex-1 bg-white/10 hover:bg-white/15 text-white border-none h-10 rounded-xl font-medium">All Equipment</Button>
                  <Button variant="secondary" className="flex-1 bg-white/10 hover:bg-white/15 text-white border-none h-10 rounded-xl font-medium">All Muscles</Button>
                </div>
                
                <div className="mt-2">
                  <h3 className="text-sm font-medium text-muted-foreground mb-2 px-1">Recent Exercises</h3>
                  <div className="flex flex-col">
                    {filteredExercises.map(exercise => (
                      <div
                        key={exercise.id}
                        className="flex items-center gap-4 py-3 border-b border-white/5 cursor-pointer hover:bg-white/5 transition-colors px-1"
                        onClick={() => {
                          const existingSets = activeSets.filter(s => s.exerciseId === exercise.id);
                          addSet(exercise.id, existingSets.length + 1);
                          setIsAddOpen(false);
                          setSearchQuery("");
                        }}
                      >
                        <div className="h-14 w-14 rounded-full bg-white flex items-center justify-center shrink-0">
                          <Dumbbell className="h-7 w-7 text-neutral-800" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-base font-medium text-white truncate">{exercise.name}</div>
                          <div className="text-sm text-muted-foreground capitalize">{exercise.muscleGroup}</div>
                        </div>
                        <div className="h-8 w-8 rounded-full border border-white/20 flex items-center justify-center shrink-0">
                          <Activity className="h-4 w-4 text-white" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    );
  }

  // ── Default View ────────────────────────────────────────────────────
  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto mb-24 space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
      >
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-500 bg-clip-text text-transparent">Workout</h1>
          <p className="text-muted-foreground text-sm mt-1">Track your progress and get stronger.</p>
        </div>
        <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
          <Button
            onClick={handleStartEmpty}
            size="lg"
            className="w-full md:w-auto bg-gradient-to-r from-emerald-500 to-cyan-600 hover:from-emerald-600 hover:to-cyan-700 text-white shadow-lg shadow-emerald-500/25 transition-shadow"
          >
            <Plus className="w-5 h-5 mr-2" />
            Start Empty Workout
          </Button>
        </motion.div>
      </motion.div>

      {/* Tabs */}
      <Tabs defaultValue="history" className="w-full">
        <TabsList className="grid w-full grid-cols-3 bg-card/50 backdrop-blur-md border border-white/10 h-11">
          <TabsTrigger value="history" className="data-[state=active]:bg-primary/20 gap-2 text-sm">
            <History className="w-4 h-4" /> History
          </TabsTrigger>
          <TabsTrigger value="templates" className="data-[state=active]:bg-primary/20 gap-2 text-sm">
            <List className="w-4 h-4" /> Templates
          </TabsTrigger>
          <TabsTrigger value="exercises" className="data-[state=active]:bg-primary/20 gap-2 text-sm">
            <Dumbbell className="w-4 h-4" /> Exercises
          </TabsTrigger>
        </TabsList>

        {/* ─ History ─ */}
        <TabsContent value="history" className="mt-6 space-y-3">
          {sessions.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-16 bg-card/20 rounded-2xl border border-white/5"
            >
              <Dumbbell className="w-12 h-12 text-muted-foreground/20 mx-auto mb-4" />
              <h3 className="text-base font-semibold text-white/70 mb-2">No workouts yet</h3>
              <p className="text-muted-foreground text-sm max-w-xs mx-auto">Start your first workout to track volume, sets, and personal records.</p>
            </motion.div>
          ) : (
            sessions.map(session => (
              <SessionCard key={session.id} session={session} exercises={exercises} />
            ))
          )}
        </TabsContent>

        {/* ─ Templates ─ */}
        <TabsContent value="templates" className="mt-6">
          {templates.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-16 bg-card/20 rounded-2xl border border-white/5"
            >
              <List className="w-12 h-12 text-muted-foreground/20 mx-auto mb-4" />
              <h3 className="text-base font-semibold text-white/70 mb-2">No templates yet</h3>
              <p className="text-muted-foreground text-sm max-w-xs mx-auto">Create templates for routines like "Push Day" or "Full Body".</p>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {templates.map(template => (
                <motion.div key={template.id} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Card className="bg-card/50 backdrop-blur-sm border-white/10 hover:border-white/20 transition-all">
                    <CardHeader>
                      <CardTitle className="text-base">{template.name}</CardTitle>
                      {template.description && <CardDescription>{template.description}</CardDescription>}
                    </CardHeader>
                    <CardContent>
                      <Button className="w-full" variant="secondary">
                        <Play className="w-4 h-4 mr-2" /> Start Template
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* ─ Exercises ─ */}
        <TabsContent value="exercises" className="mt-6">
          <div className="relative mb-6">
            <Search className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search exercise library..."
              className="pl-10 h-12 bg-card/50 border-white/10"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {filteredExercises.map((exercise, i) => {
              const exercisePRs = personalRecords.filter(pr => pr.exerciseId === exercise.id);
              const hasPR = exercisePRs.length > 0;
              return (
                <motion.div
                  key={exercise.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(i * 0.02, 0.3) }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                >
                  <Card className="bg-card/50 backdrop-blur-sm border-white/10 hover:border-primary/30 transition-all cursor-pointer relative overflow-hidden">
                    {hasPR && (
                      <div className="absolute top-0 right-0 bg-amber-500/15 text-amber-400 text-[10px] font-bold px-2 py-1 rounded-bl-lg flex items-center gap-1">
                        <Trophy className="w-3 h-3" /> PR
                      </div>
                    )}
                    <CardContent className="p-4 flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                        <Dumbbell className="h-5 w-5" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-semibold text-sm truncate">{exercise.name}</h4>
                        <p className="text-xs text-muted-foreground capitalize">{exercise.muscleGroup} • {exercise.equipment}</p>
                        {hasPR && (
                          <p className="text-[10px] text-amber-400/80 mt-0.5 truncate">
                            {exercisePRs.map(pr => `${pr.recordType === "1rm" ? "1RM" : "Vol"}: ${Number(pr.value).toFixed(1)}`).join(" • ")}
                          </p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
