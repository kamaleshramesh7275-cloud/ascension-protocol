import { useState, useEffect, useRef, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence, Reorder } from "framer-motion";
import {
  Dumbbell, Plus, History, List, Play, Check, X, Search,
  Trophy, ChevronDown, ChevronUp, Clock,
  Layers, Activity, Timer, GripVertical,
  StickyNote, FlameKindling, AlarmClock, RotateCcw,
  Minus, MessageSquare,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { useWorkout, type ExerciseBlock, type SetType } from "@/context/workout-context";
import { useAuth } from "@/hooks/use-auth";
import type { Exercise, WorkoutSession, WorkoutSessionWithSets, WorkoutTemplate, PersonalRecord, WorkoutSet } from "@shared/schema";
import { format } from "date-fns";

// ── Constants ───────────────────────────────────────────────────────────────────

const SET_TYPE_CONFIG: Record<SetType, { label: string; short: string; color: string; bg: string }> = {
  warmup:  { label: "Warm-up",  short: "W", color: "text-amber-400",  bg: "bg-amber-500/20 border-amber-500/40" },
  normal:  { label: "Normal",   short: "N", color: "text-white/60",   bg: "bg-white/10 border-white/20" },
  dropset: { label: "Drop Set", short: "D", color: "text-violet-400", bg: "bg-violet-500/20 border-violet-500/40" },
  failure: { label: "Failure",  short: "F", color: "text-red-400",    bg: "bg-red-500/20 border-red-500/40" },
};

const SET_TYPES: SetType[] = ["warmup", "normal", "dropset", "failure"];

// ── Elapsed timer ────────────────────────────────────────────────────────────────

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

// ── History session card ──────────────────────────────────────────────────────────

function SessionCard({ session, exercises }: { session: WorkoutSession; exercises: Exercise[] }) {
  const [open, setOpen] = useState(false);
  const { data: detail } = useQuery<WorkoutSessionWithSets>({
    queryKey: [`/api/workouts/sessions/${session.id}`],
    enabled: open,
  });

  const duration = Math.floor((session.durationSeconds || 0) / 60);

  return (
    <motion.div layout initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ type: "spring", stiffness: 280, damping: 28 }}>
      <Card className={`bg-card/50 backdrop-blur-sm border-white/10 transition-all duration-300 overflow-hidden ${open ? "border-emerald-500/30" : "hover:border-white/20"}`}>
        <button className="w-full text-left" onClick={() => setOpen(o => !o)} aria-expanded={open}>
          <CardContent className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="mt-1 h-9 w-9 rounded-xl bg-emerald-500/10 flex items-center justify-center shrink-0">
                <Dumbbell className="h-5 w-5 text-emerald-400" />
              </div>
              <div>
                <h3 className="font-semibold text-base leading-tight">{session.name}</h3>
                <p className="text-xs text-muted-foreground mt-0.5">{format(new Date(session.startedAt), "EEE, MMM d • p")}</p>
              </div>
            </div>
            <div className="flex items-center gap-6 text-sm ml-12 md:ml-0">
              <div className="text-center"><div className="font-bold text-emerald-400">{session.totalVolume?.toLocaleString()} kg</div><div className="text-muted-foreground text-[10px] uppercase tracking-wide">Volume</div></div>
              <div className="text-center"><div className="font-bold text-cyan-400">{session.totalSets}</div><div className="text-muted-foreground text-[10px] uppercase tracking-wide">Sets</div></div>
              <div className="text-center"><div className="font-bold text-amber-400">{duration} min</div><div className="text-muted-foreground text-[10px] uppercase tracking-wide">Time</div></div>
              {session.xpEarned ? <div className="text-center"><div className="font-bold text-violet-400">+{session.xpEarned}</div><div className="text-muted-foreground text-[10px] uppercase tracking-wide">XP</div></div> : null}
              <div className="text-muted-foreground ml-2">{open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}</div>
            </div>
          </CardContent>
        </button>
        <AnimatePresence initial={false}>
          {open && (
            <motion.div key="detail" initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25 }} className="overflow-hidden">
              <div className="px-5 pb-5 border-t border-white/5">
                {!detail ? (
                  <div className="py-6 flex items-center justify-center gap-2 text-muted-foreground text-sm">
                    <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}><Layers className="h-4 w-4" /></motion.div>
                    Loading sets...
                  </div>
                ) : detail.sets.length === 0 ? (
                  <p className="text-muted-foreground text-sm py-4 text-center">No sets recorded.</p>
                ) : (
                  <div className="mt-4 space-y-3">
                    {Array.from(detail.sets.reduce((map, set) => {
                      const exId = set.exerciseId;
                      if (!map.has(exId)) map.set(exId, []);
                      map.get(exId)!.push(set);
                      return map;
                    }, new Map<string, typeof detail.sets>())).map(([exId, exSets]) => {
                      const exercise = exercises.find(e => e.id === exId) || { name: "Unknown", muscleGroup: "" };
                      return (
                        <div key={exId} className="rounded-xl bg-white/3 border border-white/5 overflow-hidden">
                          <div className="px-4 py-2.5 bg-white/5 flex items-center gap-2">
                            <div className="h-5 w-5 rounded-md bg-primary/20 flex items-center justify-center"><Dumbbell className="h-3 w-3 text-primary" /></div>
                            <span className="text-sm font-semibold">{exercise.name}</span>
                            <span className="text-xs text-muted-foreground capitalize ml-auto">{exercise.muscleGroup}</span>
                          </div>
                          <div className="px-4 py-2">
                            <div className="grid grid-cols-5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1 text-center">
                              <span>Set</span><span>Type</span><span>Weight</span><span>Reps</span><span>PR</span>
                            </div>
                            {exSets.map((set, i) => {
                              const cfg = SET_TYPE_CONFIG[set.setType as SetType] || SET_TYPE_CONFIG.normal;
                              return (
                                <motion.div key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
                                  className="grid grid-cols-5 text-sm py-1.5 border-t border-white/5 text-center items-center">
                                  <span className="text-muted-foreground">{set.setNumber}</span>
                                  <span><Badge className={`text-[9px] px-1 ${cfg.bg} ${cfg.color} border`}>{cfg.short}</Badge></span>
                                  <span className="font-medium">{set.weight ? `${set.weight} kg` : "—"}</span>
                                  <span className="font-medium">{set.reps ?? (set.durationSeconds ? `${set.durationSeconds}s` : "—")}</span>
                                  <span>{set.isPersonalRecord ? (<Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 text-[10px] px-1.5"><Trophy className="h-2.5 w-2.5 mr-1" /> PR</Badge>) : "—"}</span>
                                </motion.div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                    {session.notes && <p className="text-xs text-muted-foreground italic border-t border-white/5 pt-3">📝 {session.notes}</p>}
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

// ── Set Type Picker ────────────────────────────────────────────────────────────────

function SetTypePicker({ value, onChange }: { value: SetType; onChange: (t: SetType) => void }) {
  const [open, setOpen] = useState(false);
  const cfg = SET_TYPE_CONFIG[value];
  return (
    <div className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className={`text-[10px] font-bold px-1.5 py-0.5 rounded border flex items-center gap-0.5 transition-all ${cfg.bg} ${cfg.color}`}
      >
        {cfg.short}
        <ChevronDown className="h-2.5 w-2.5" />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="absolute left-0 top-full mt-1 z-50 bg-[#111] border border-white/10 rounded-lg shadow-xl overflow-hidden"
          >
            {SET_TYPES.map(t => {
              const c = SET_TYPE_CONFIG[t];
              return (
                <button
                  key={t}
                  onClick={() => { onChange(t); setOpen(false); }}
                  className={`flex items-center gap-2 px-3 py-2 w-full text-xs hover:bg-white/5 transition-colors ${t === value ? "bg-white/5" : ""}`}
                >
                  <span className={`font-bold w-4 ${c.color}`}>{c.short}</span>
                  <span className="text-white/80">{c.label}</span>
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Individual Set Row ─────────────────────────────────────────────────────────────

function SetRow({
  set, setIndex, exerciseId, onUpdate, onRemove, onDone,
}: {
  set: any;
  setIndex: number;
  exerciseId: string;
  onUpdate: (updates: any) => void;
  onRemove: () => void;
  onDone: () => void;
}) {
  const [isDurationMode, setIsDurationMode] = useState(!!set.durationSeconds);
  const [showRpe, setShowRpe] = useState(!!set.rpe);
  const [dragX, setDragX] = useState(0);
  const [edited, setEdited] = useState(false);
  const isHistorical = set.isHistorical && !edited;

  const cfg = SET_TYPE_CONFIG[(set.setType as SetType) ?? "normal"];

  const handleDragEnd = (_: any, info: { offset: { x: number } }) => {
    if (info.offset.x < -80) {
      onRemove();
    }
    setDragX(0);
  };

  return (
    <div className="relative overflow-hidden rounded-xl">
      {/* Red delete background */}
      <div className="absolute inset-0 bg-red-500/20 flex items-center justify-end pr-4 rounded-xl">
        <X className="h-5 w-5 text-red-400" />
      </div>

      <motion.div
        drag="x"
        dragConstraints={{ left: -120, right: 0 }}
        dragElastic={0.1}
        onDragEnd={handleDragEnd}
        onDrag={(_, info) => setDragX(info.offset.x)}
        style={{ x: dragX }}
        className="relative bg-card/50 backdrop-blur-sm border border-white/10 rounded-xl overflow-hidden"
        whileTap={{ cursor: "grabbing" }}
      >
        {/* Set header */}
        <div className="flex items-center justify-between px-3 py-2 bg-white/5">
          <div className="flex items-center gap-2">
            <SetTypePicker
              value={(set.setType as SetType) ?? "normal"}
              onChange={t => onUpdate({ setType: t })}
            />
            <span className="text-xs text-muted-foreground font-medium">Set {setIndex + 1}</span>
            {isHistorical && (
              <span className="text-[9px] text-cyan-400/70 flex items-center gap-0.5">
                <RotateCcw className="h-2.5 w-2.5" /> last session
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            {/* Toggle duration mode */}
            <motion.button
              whileTap={{ scale: 0.85 }}
              onClick={() => setIsDurationMode(d => !d)}
              className={`h-6 w-6 flex items-center justify-center rounded-md transition-colors ${isDurationMode ? "text-cyan-400 bg-cyan-500/10" : "text-muted-foreground hover:text-white"}`}
              title="Toggle duration mode"
            >
              <Timer className="h-3.5 w-3.5" />
            </motion.button>
            {/* Toggle RPE */}
            <motion.button
              whileTap={{ scale: 0.85 }}
              onClick={() => setShowRpe(r => !r)}
              className={`h-6 w-6 flex items-center justify-center rounded-md transition-colors ${showRpe ? "text-orange-400 bg-orange-500/10" : "text-muted-foreground hover:text-white"}`}
              title="Toggle RPE"
            >
              <FlameKindling className="h-3.5 w-3.5" />
            </motion.button>
          </div>
        </div>

        {/* Inputs */}
        <div className="px-3 pb-3 pt-2">
          {isDurationMode ? (
            <div className="grid grid-cols-2 gap-2 items-end mb-2">
              <div>
                <label className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold block mb-1">Duration (s)</label>
                <Input
                  type="number"
                  placeholder={isHistorical && set.durationSeconds ? String(set.durationSeconds) : "0"}
                  className={`h-10 text-center text-lg font-semibold bg-white/5 border-white/10 ${isHistorical ? "placeholder:text-cyan-400/50" : ""}`}
                  value={set.durationSeconds || ""}
                  onChange={e => { setEdited(true); onUpdate({ durationSeconds: parseInt(e.target.value) || undefined }); }}
                />
              </div>
              <motion.div whileTap={{ scale: 0.9 }}>
                <Button
                  onClick={onDone}
                  variant="outline"
                  className="h-10 w-full rounded-xl bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20"
                >
                  <Check className="w-4 h-4 mr-1" /> Done
                </Button>
              </motion.div>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-2 items-end mb-2">
              <div>
                <label className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold block mb-1">Weight (kg)</label>
                <Input
                  type="number"
                  placeholder={isHistorical && set.weight != null ? String(set.weight) : "0"}
                  className="h-10 text-center text-lg font-semibold bg-white/5 border-white/10"
                  value={set.weight || ""}
                  onChange={e => { setEdited(true); onUpdate({ weight: parseFloat(e.target.value) || undefined }); }}
                />
              </div>
              <div>
                <label className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold block mb-1">Reps</label>
                <Input
                  type="number"
                  placeholder={isHistorical && set.reps != null ? String(set.reps) : "0"}
                  className="h-10 text-center text-lg font-semibold bg-white/5 border-white/10"
                  value={set.reps || ""}
                  onChange={e => { setEdited(true); onUpdate({ reps: parseInt(e.target.value) || undefined }); }}
                />
              </div>
              <motion.div whileTap={{ scale: 0.9 }}>
                <Button
                  onClick={onDone}
                  variant="outline"
                  className="h-10 w-full rounded-xl bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20"
                >
                  <Check className="w-4 h-4 mr-1" /> Done
                </Button>
              </motion.div>
            </div>
          )}

          {/* RPE row */}
          <AnimatePresence>
            {showRpe && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="mt-2 flex items-center gap-2">
                  <span className="text-[10px] text-orange-400/80 uppercase tracking-wider font-semibold w-8 shrink-0">RPE</span>
                  <div className="flex gap-1">
                    {[1,2,3,4,5,6,7,8,9,10].map(n => (
                      <motion.button
                        key={n}
                        whileTap={{ scale: 0.8 }}
                        onClick={() => onUpdate({ rpe: set.rpe === n ? undefined : n })}
                        className={`h-6 w-6 rounded-md text-[10px] font-bold transition-all ${
                          set.rpe === n
                            ? "bg-orange-500 text-white"
                            : "bg-white/5 text-muted-foreground hover:bg-white/10"
                        }`}
                      >
                        {n}
                      </motion.button>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}

// ── Exercise Block ─────────────────────────────────────────────────────────────────

function ExerciseBlockCard({
  block,
  exercise,
}: {
  block: ExerciseBlock;
  exercise: Exercise | undefined;
}) {
  const { updateSet, removeSet, removeBlock, addSetToBlock, updateBlockNote, startRestTimer } = useWorkout();
  const [showNote, setShowNote] = useState(!!block.note);

  return (
    <Card className="overflow-hidden bg-card/50 backdrop-blur-sm border border-white/10 transition-all duration-200">
      {/* Block header */}
      <CardHeader className="py-3 px-4 flex flex-row items-center justify-between bg-white/5 gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="h-8 w-8 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <Dumbbell className="h-4 w-4 text-primary" />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-semibold truncate">{exercise?.name ?? "Unknown Exercise"}</h3>
            <p className="text-[10px] text-muted-foreground capitalize">{exercise?.muscleGroup} • {exercise?.equipment}</p>
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {/* Note toggle */}
          <motion.button whileTap={{ scale: 0.85 }} onClick={() => setShowNote(n => !n)}
            className={`h-7 w-7 flex items-center justify-center rounded-lg transition-colors ${showNote ? "text-cyan-400 bg-cyan-500/10" : "text-muted-foreground hover:bg-white/5"}`}>
            <MessageSquare className="h-3.5 w-3.5" />
          </motion.button>
          {/* Remove block */}
          <motion.button whileTap={{ scale: 0.85 }} onClick={() => removeBlock(block.exerciseId)}
            className="h-7 w-7 flex items-center justify-center rounded-lg text-muted-foreground hover:text-red-400 hover:bg-red-400/10 transition-colors">
            <X className="h-3.5 w-3.5" />
          </motion.button>
          {/* Drag handle (visual — actual drag handled by Reorder.Item) */}
          <div className="h-7 w-7 flex items-center justify-center rounded-lg text-muted-foreground/50 cursor-grab active:cursor-grabbing">
            <GripVertical className="h-3.5 w-3.5" />
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-3 space-y-2">
        {/* Note area */}
        <AnimatePresence>
          {showNote && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
              <textarea
                placeholder="Form cues, video links, session notes..."
                className="w-full text-xs bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white placeholder:text-muted-foreground resize-none focus:outline-none focus:border-cyan-500/40 transition-colors"
                rows={2}
                value={block.note}
                onChange={e => updateBlockNote(block.exerciseId, e.target.value)}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Set column headers */}
        {block.sets.length > 0 && (
          <div className="grid grid-cols-[40px_1fr] gap-2 px-1">
            <span className="text-[9px] text-muted-foreground uppercase tracking-widest text-center">Type</span>
            <span className="text-[9px] text-muted-foreground uppercase tracking-widest">Details → swipe left to delete</span>
          </div>
        )}

        {/* Sets */}
        <AnimatePresence>
          {block.sets.map((set, setIndex) => (
            <motion.div
              key={`${block.exerciseId}-set-${setIndex}`}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20, height: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 28 }}
            >
              <SetRow
                set={set}
                setIndex={setIndex}
                exerciseId={block.exerciseId}
                onUpdate={updates => updateSet(block.exerciseId, setIndex, updates)}
                onRemove={() => removeSet(block.exerciseId, setIndex)}
                onDone={() => {
                  updateSet(block.exerciseId, setIndex, { isHistorical: false });
                  startRestTimer(90);
                }}
              />
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Add set button */}
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={() => addSetToBlock(block.exerciseId)}
          className="w-full h-9 flex items-center justify-center gap-1.5 rounded-xl border border-dashed border-white/15 text-muted-foreground text-xs hover:border-white/30 hover:text-white transition-all"
        >
          <Plus className="h-3.5 w-3.5" />
          Add Set
        </motion.button>
      </CardContent>
    </Card>
  );
}

// ── Exercise Sheet (Multi-Select) ────────────────────────────────────────────────────

function AddExerciseSheet({
  exercises,
  open,
  onOpenChange,
}: {
  exercises: Exercise[];
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  const { addExercises, exerciseBlocks } = useWorkout();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [muscleFilter, setMuscleFilter] = useState<string | null>(null);
  const [equipmentFilter, setEquipmentFilter] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [prefillMap, setPrefillMap] = useState<Record<string, any[]>>({});

  const activeExerciseIds = new Set(exerciseBlocks.map(b => b.exerciseId));

  // Derive filter options from exercises
  const muscleGroups = [...new Set(exercises.map(e => e.muscleGroup))].sort();
  const equipmentTypes = [...new Set(exercises.map(e => e.equipment).filter(Boolean))].sort();

  const filteredExercises = exercises.filter(e => {
    const matchesSearch = !searchQuery || e.name.toLowerCase().includes(searchQuery.toLowerCase()) || e.muscleGroup.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesMuscle = !muscleFilter || e.muscleGroup === muscleFilter;
    const matchesEquipment = !equipmentFilter || e.equipment === equipmentFilter;
    return matchesSearch && matchesMuscle && matchesEquipment;
  });

  const toggleSelect = async (exerciseId: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(exerciseId)) {
        next.delete(exerciseId);
      } else {
        next.add(exerciseId);
        // Eagerly fetch last-sets for this exercise
        queryClient.prefetchQuery({
          queryKey: [`/api/workouts/exercises/${exerciseId}/last-sets`],
          staleTime: 5 * 60 * 1000,
        }).then(async () => {
          const data = queryClient.getQueryData<any[]>([`/api/workouts/exercises/${exerciseId}/last-sets`]);
          if (data && data.length > 0) {
            setPrefillMap(prev => ({ ...prev, [exerciseId]: data }));
          }
        });
      }
      return next;
    });
  };

  const handleConfirm = () => {
    if (selected.size === 0) return;
    addExercises(Array.from(selected), prefillMap);
    setSelected(new Set());
    setPrefillMap({});
    setSearchQuery("");
    onOpenChange(false);
  };

  const handleClose = () => {
    setSelected(new Set());
    setSearchQuery("");
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[96vh] bg-[#0a0a0a] border-t border-white/10 p-0 flex flex-col sm:max-w-md sm:mx-auto sm:rounded-t-2xl">
        {/* Header */}
        <div className="flex flex-row items-center justify-between border-b border-white/10 p-4 shrink-0">
          <button onClick={handleClose} className="text-blue-500 font-medium text-base hover:text-blue-400 transition-colors">Cancel</button>
          <SheetTitle className="text-base font-semibold m-0 text-white">Add Exercise</SheetTitle>
          <button
            onClick={handleConfirm}
            disabled={selected.size === 0}
            className={`font-semibold text-base transition-colors ${selected.size > 0 ? "text-blue-500 hover:text-blue-400" : "text-muted-foreground"}`}
          >
            {selected.size > 0 ? `Add (${selected.size})` : "Add"}
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 scrollbar-hide">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Search exercise..."
              className="pl-10 bg-white/5 border-none h-10 text-base rounded-xl text-white placeholder:text-muted-foreground focus-visible:ring-1 focus-visible:ring-white/20"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Filter chips */}
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {/* Muscle group */}
            <div className="flex gap-1 shrink-0">
              <button
                onClick={() => setMuscleFilter(null)}
                className={`text-xs px-3 py-1.5 rounded-full border transition-all whitespace-nowrap ${!muscleFilter ? "bg-primary/20 border-primary/40 text-primary" : "bg-white/5 border-white/10 text-muted-foreground hover:border-white/20"}`}
              >
                All Muscles
              </button>
              {muscleGroups.slice(0, 6).map(m => (
                <button
                  key={m}
                  onClick={() => setMuscleFilter(muscleFilter === m ? null : m)}
                  className={`text-xs px-3 py-1.5 rounded-full border transition-all whitespace-nowrap capitalize ${muscleFilter === m ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-400" : "bg-white/5 border-white/10 text-muted-foreground hover:border-white/20"}`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          {/* Selection info */}
          {selected.size > 0 && (
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl px-4 py-2 flex items-center justify-between">
              <span className="text-sm text-emerald-400 font-medium">{selected.size} exercise{selected.size > 1 ? "s" : ""} selected</span>
              <button onClick={() => setSelected(new Set())} className="text-xs text-muted-foreground hover:text-white">Clear</button>
            </motion.div>
          )}

          {/* Exercise list */}
          <div className="flex flex-col">
            {filteredExercises.map(exercise => {
              const isSelected = selected.has(exercise.id);
              const isInSession = activeExerciseIds.has(exercise.id);
              const hasPrefill = !!prefillMap[exercise.id];

              return (
                <motion.div
                  key={exercise.id}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => !isInSession && toggleSelect(exercise.id)}
                  className={`flex items-center gap-4 py-3 border-b border-white/5 cursor-pointer transition-colors px-1 rounded-xl ${isSelected ? "bg-emerald-500/5" : isInSession ? "opacity-40" : "hover:bg-white/5"}`}
                >
                  <div className="h-12 w-12 rounded-full bg-white flex items-center justify-center shrink-0">
                    <Dumbbell className="h-6 w-6 text-neutral-800" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-white truncate">{exercise.name}</div>
                    <div className="text-xs text-muted-foreground capitalize">{exercise.muscleGroup} • {exercise.equipment}</div>
                    {hasPrefill && isSelected && (
                      <div className="text-[10px] text-cyan-400/80 flex items-center gap-1 mt-0.5">
                        <RotateCcw className="h-2.5 w-2.5" />
                        Last session data found — will auto-fill
                      </div>
                    )}
                    {isInSession && <div className="text-[10px] text-muted-foreground mt-0.5">Already in session</div>}
                  </div>
                  <div className={`h-7 w-7 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${isSelected ? "bg-emerald-500 border-emerald-500" : "border-white/20"}`}>
                    {isSelected && <Check className="h-3.5 w-3.5 text-white" />}
                  </div>
                </motion.div>
              );
            })}
            {filteredExercises.length === 0 && (
              <div className="py-12 text-center text-muted-foreground text-sm">
                <Dumbbell className="h-8 w-8 mx-auto mb-3 opacity-20" />
                No exercises found
              </div>
            )}
          </div>
        </div>

        {/* Bottom confirm */}
        <AnimatePresence>
          {selected.size > 0 && (
            <motion.div
              initial={{ y: 60, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 60, opacity: 0 }}
              className="border-t border-white/10 p-4 bg-[#0a0a0a]"
            >
              <Button
                onClick={handleConfirm}
                className="w-full h-12 bg-gradient-to-r from-emerald-500 to-cyan-600 hover:from-emerald-600 hover:to-cyan-700 text-white font-semibold text-base rounded-xl shadow-lg shadow-emerald-500/20"
              >
                <Plus className="h-5 w-5 mr-2" />
                Add {selected.size} Exercise{selected.size > 1 ? "s" : ""} to Workout
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </SheetContent>
    </Sheet>
  );
}

// ── Main Page ────────────────────────────────────────────────────────────────────────

export default function WorkoutPage() {
  const { user } = useAuth();
  const {
    activeSession, isWorkoutActive, startWorkout, finishWorkout,
    cancelWorkout, exerciseBlocks, reorderBlocks, activeSets,
    restTimerSeconds, clearRestTimer,
  } = useWorkout();

  const elapsed = useElapsedTime(isWorkoutActive ? activeSession?.startedAt : undefined);

  const { data: exercises = [] } = useQuery<Exercise[]>({ queryKey: ["/api/workouts/exercises"] });
  const { data: sessions = [] } = useQuery<WorkoutSession[]>({ queryKey: ["/api/workouts/sessions"], enabled: !!user });
  const { data: templates = [] } = useQuery<WorkoutTemplate[]>({ queryKey: ["/api/workouts/templates"], enabled: !!user });
  const { data: personalRecords = [] } = useQuery<PersonalRecord[]>({ queryKey: ["/api/workouts/prs"], enabled: !!user });

  const [searchQuery, setSearchQuery] = useState("");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [showFinishNotes, setShowFinishNotes] = useState(false);
  const [finishNotes, setFinishNotes] = useState("");

  const filteredExercises = exercises.filter(e =>
    e.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    e.muscleGroup.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleStartEmpty = () => {
    startWorkout({ userId: user!.id, name: "Empty Workout", startedAt: new Date() });
  };

  const handleFinish = () => {
    finishWorkout(finishNotes || undefined);
    setShowFinishNotes(false);
    setFinishNotes("");
  };

  // ── Active Workout View ──────────────────────────────────────────────────────────

  if (isWorkoutActive && activeSession) {
    return (
      <div className="p-4 md:p-6 max-w-4xl mx-auto mb-28 space-y-5">
        {/* Pulsing header banner */}
        <motion.div className="relative rounded-2xl overflow-hidden" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/20 to-cyan-500/20" />
          <div className="absolute inset-0 border border-emerald-500/30 rounded-2xl" />
          <motion.div
            className="absolute inset-0 bg-emerald-500/10 rounded-2xl"
            animate={{ opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          />
          <div className="relative p-5 flex items-center justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <motion.div className="h-2 w-2 rounded-full bg-emerald-400" animate={{ scale: [1, 1.4, 1], opacity: [1, 0.6, 1] }} transition={{ duration: 1.5, repeat: Infinity }} />
                <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">Workout In Progress</span>
              </div>
              <h1 className="text-lg font-bold text-white truncate">{activeSession.name}</h1>
              <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground flex-wrap">
                {/* Rest timer or elapsed */}
                {restTimerSeconds !== null ? (
                  <motion.span
                    className="flex items-center gap-1 text-orange-400 font-semibold"
                    animate={{ scale: restTimerSeconds <= 10 ? [1, 1.05, 1] : 1 }}
                    transition={{ duration: 0.5, repeat: restTimerSeconds <= 10 ? Infinity : 0 }}
                  >
                    <AlarmClock className="h-3.5 w-3.5" />
                    Rest: {Math.floor(restTimerSeconds / 60)}:{String(restTimerSeconds % 60).padStart(2, "0")}
                    <motion.button whileTap={{ scale: 0.85 }} onClick={clearRestTimer} className="ml-1 text-muted-foreground hover:text-white">
                      <X className="h-3 w-3" />
                    </motion.button>
                  </motion.span>
                ) : (
                  <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {elapsed}</span>
                )}
                <span className="flex items-center gap-1"><Layers className="h-3.5 w-3.5" /> {activeSets.length} sets • {exerciseBlocks.length} exercises</span>
              </div>
            </div>
            <div className="flex flex-col gap-2 shrink-0">
              <motion.div whileTap={{ scale: 0.95 }}>
                <Button size="sm" onClick={() => setShowFinishNotes(true)} className="bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/30">
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

        {/* Finish notes modal */}
        <AnimatePresence>
          {showFinishNotes && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-end justify-center bg-black/70"
              onClick={() => setShowFinishNotes(false)}
            >
              <motion.div
                initial={{ y: 60, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 60, opacity: 0 }}
                onClick={e => e.stopPropagation()}
                className="w-full max-w-md bg-[#111] border-t border-white/10 rounded-t-2xl p-6 space-y-4"
              >
                <h3 className="text-base font-semibold text-white">Finish Workout</h3>
                <textarea
                  placeholder="Session notes (optional)..."
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-muted-foreground resize-none focus:outline-none focus:border-emerald-500/40"
                  rows={3}
                  value={finishNotes}
                  onChange={e => setFinishNotes(e.target.value)}
                />
                <div className="flex gap-3">
                  <Button variant="outline" className="flex-1 border-white/10" onClick={() => setShowFinishNotes(false)}>Cancel</Button>
                  <Button onClick={handleFinish} className="flex-1 bg-gradient-to-r from-emerald-500 to-cyan-600 hover:from-emerald-600 hover:to-cyan-700 text-white shadow-lg">
                    <Check className="w-4 h-4 mr-2" /> Complete Workout
                  </Button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Exercise blocks (drag-and-drop reorderable) */}
        {exerciseBlocks.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-12 bg-card/20 rounded-2xl border border-dashed border-white/10">
            <Dumbbell className="h-10 w-10 text-muted-foreground/20 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">No exercises yet.</p>
            <p className="text-xs text-muted-foreground/60 mt-1">Tap "Add Exercise" below to get started.</p>
          </motion.div>
        ) : (
          <Reorder.Group
            axis="y"
            values={exerciseBlocks}
            onReorder={reorderBlocks}
            className="space-y-4"
          >
            {exerciseBlocks.map(block => {
              const exercise = exercises.find(e => e.id === block.exerciseId);
              return (
                <Reorder.Item
                  key={block.exerciseId}
                  value={block}
                  className="list-none"
                  whileDrag={{ scale: 1.01, boxShadow: "0 8px 32px rgba(16,185,129,0.15)", borderColor: "rgba(16,185,129,0.4)" }}
                >
                  <ExerciseBlockCard block={block} exercise={exercise} />
                </Reorder.Item>
              );
            })}
          </Reorder.Group>
        )}

        {/* Add exercise button */}
        <div className="pt-2">
          <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}>
            <Button
              variant="outline"
              onClick={() => setIsAddOpen(true)}
              className="w-full h-12 text-blue-400 border-blue-500/30 bg-blue-500/10 hover:bg-blue-500/20 font-medium text-base rounded-xl"
            >
              <Plus className="w-5 h-5 mr-2" /> Add Exercise
            </Button>
          </motion.div>
        </div>

        {/* Add exercise sheet */}
        <AddExerciseSheet exercises={exercises} open={isAddOpen} onOpenChange={setIsAddOpen} />
      </div>
    );
  }

  // ── Default View ────────────────────────────────────────────────────────────────────

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto mb-24 space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-500 bg-clip-text text-transparent">Workout</h1>
          <p className="text-muted-foreground text-sm mt-1">Track your progress and get stronger.</p>
        </div>
        <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
          <Button
            onClick={handleStartEmpty}
            size="lg"
            className="w-full md:w-auto bg-gradient-to-r from-emerald-500 to-cyan-600 hover:from-emerald-600 hover:to-cyan-700 text-white shadow-lg shadow-emerald-500/25"
          >
            <Plus className="w-5 h-5 mr-2" /> Start Empty Workout
          </Button>
        </motion.div>
      </motion.div>

      {/* Tabs */}
      <Tabs defaultValue="history" className="w-full">
        <TabsList className="grid w-full grid-cols-3 bg-card/50 backdrop-blur-md border border-white/10 h-11">
          <TabsTrigger value="history" className="data-[state=active]:bg-primary/20 gap-2 text-sm"><History className="w-4 h-4" /> History</TabsTrigger>
          <TabsTrigger value="templates" className="data-[state=active]:bg-primary/20 gap-2 text-sm"><List className="w-4 h-4" /> Templates</TabsTrigger>
          <TabsTrigger value="exercises" className="data-[state=active]:bg-primary/20 gap-2 text-sm"><Dumbbell className="w-4 h-4" /> Exercises</TabsTrigger>
        </TabsList>

        {/* History */}
        <TabsContent value="history" className="mt-6 space-y-3">
          {sessions.length === 0 ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-16 bg-card/20 rounded-2xl border border-white/5">
              <Dumbbell className="w-12 h-12 text-muted-foreground/20 mx-auto mb-4" />
              <h3 className="text-base font-semibold text-white/70 mb-2">No workouts yet</h3>
              <p className="text-muted-foreground text-sm max-w-xs mx-auto">Start your first workout to track volume, sets, and personal records.</p>
            </motion.div>
          ) : (
            sessions.map(session => <SessionCard key={session.id} session={session} exercises={exercises} />)
          )}
        </TabsContent>

        {/* Templates */}
        <TabsContent value="templates" className="mt-6">
          {templates.length === 0 ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-16 bg-card/20 rounded-2xl border border-white/5">
              <List className="w-12 h-12 text-muted-foreground/20 mx-auto mb-4" />
              <h3 className="text-base font-semibold text-white/70 mb-2">No templates yet</h3>
              <p className="text-muted-foreground text-sm max-w-xs mx-auto">Create templates for routines like "Push Day" or "Full Body".</p>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {templates.map(template => (
                <motion.div key={template.id} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Card className="bg-card/50 backdrop-blur-sm border-white/10 hover:border-white/20 transition-all">
                    <CardHeader><CardTitle className="text-base">{template.name}</CardTitle>{template.description && <CardDescription>{template.description}</CardDescription>}</CardHeader>
                    <CardContent><Button className="w-full" variant="secondary"><Play className="w-4 h-4 mr-2" /> Start Template</Button></CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Exercises */}
        <TabsContent value="exercises" className="mt-6">
          <div className="relative mb-6">
            <Search className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search exercise library..." className="pl-10 h-12 bg-card/50 border-white/10" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {filteredExercises.map((exercise, i) => {
              const exercisePRs = personalRecords.filter(pr => pr.exerciseId === exercise.id);
              const hasPR = exercisePRs.length > 0;
              return (
                <motion.div key={exercise.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i * 0.02, 0.3) }} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}>
                  <Card className="bg-card/50 backdrop-blur-sm border-white/10 hover:border-primary/30 transition-all cursor-pointer relative overflow-hidden">
                    {hasPR && <div className="absolute top-0 right-0 bg-amber-500/15 text-amber-400 text-[10px] font-bold px-2 py-1 rounded-bl-lg flex items-center gap-1"><Trophy className="w-3 h-3" /> PR</div>}
                    <CardContent className="p-4 flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0"><Dumbbell className="h-5 w-5" /></div>
                      <div className="min-w-0">
                        <h4 className="font-semibold text-sm truncate">{exercise.name}</h4>
                        <p className="text-xs text-muted-foreground capitalize">{exercise.muscleGroup} • {exercise.equipment}</p>
                        {hasPR && <p className="text-[10px] text-amber-400/80 mt-0.5 truncate">{exercisePRs.map(pr => `${pr.recordType === "1rm" ? "1RM" : "Vol"}: ${Number(pr.value).toFixed(1)}`).join(" • ")}</p>}
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
