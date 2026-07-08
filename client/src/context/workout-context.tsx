import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type {
  Exercise,
  WorkoutSession,
  WorkoutSessionWithSets,
  WorkoutSetWithExercise,
  InsertWorkoutSession,
  InsertWorkoutSet,
  WorkoutSet,
} from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

// ── Types ──────────────────────────────────────────────────────────────────────

export type SetType = "normal" | "warmup" | "dropset" | "failure";

export type ActiveSet = Partial<InsertWorkoutSet> & {
  /** local-only flag: this value came from history (shown greyed until edited) */
  isHistorical?: boolean;
};

export type ExerciseBlock = {
  exerciseId: string;
  /** Order within the active workout (index in the block list) */
  order: number;
  sets: ActiveSet[];
  /** Optional per-exercise note */
  note: string;
};

type WorkoutContextType = {
  // Session
  activeSession: WorkoutSession | null;
  isWorkoutActive: boolean;
  startWorkout: (session: InsertWorkoutSession) => Promise<void>;
  finishWorkout: (notes?: string) => Promise<void>;
  cancelWorkout: () => void;

  // Sets (flat list derived from blocks — used for simple reads)
  activeSets: ActiveSet[];

  // Block-level operations (the source of truth)
  exerciseBlocks: ExerciseBlock[];
  addExercises: (exerciseIds: string[], prefillMap?: Record<string, WorkoutSet[]>) => void;
  addSetToBlock: (exerciseId: string) => void;
  updateSet: (exerciseId: string, setIndex: number, updates: Partial<ActiveSet>) => void;
  removeSet: (exerciseId: string, setIndex: number) => void;
  removeBlock: (exerciseId: string) => void;
  reorderBlocks: (newOrder: ExerciseBlock[]) => void;
  updateBlockNote: (exerciseId: string, note: string) => void;

  // Rest timer
  restTimerSeconds: number | null;
  startRestTimer: (seconds?: number) => void;
  clearRestTimer: () => void;
};

// ── Context ────────────────────────────────────────────────────────────────────

const WorkoutContext = createContext<WorkoutContextType | null>(null);

// ── Provider ───────────────────────────────────────────────────────────────────

export function WorkoutProvider({ children }: { children: React.ReactNode }) {
  const [activeSession, setActiveSession] = useState<WorkoutSession | null>(null);
  const [exerciseBlocks, setExerciseBlocks] = useState<ExerciseBlock[]>([]);
  const [restTimerSeconds, setRestTimerSeconds] = useState<number | null>(null);
  const restIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // ── Persistence ──────────────────────────────────────────────────────────────

  useEffect(() => {
    const savedSession = localStorage.getItem("activeWorkoutSession");
    const savedBlocks = localStorage.getItem("activeWorkoutBlocks");

    if (savedSession) {
      try { setActiveSession(JSON.parse(savedSession)); } catch {}
    }
    if (savedBlocks) {
      try { setExerciseBlocks(JSON.parse(savedBlocks)); } catch {}
    }
  }, []);

  useEffect(() => {
    if (activeSession) {
      localStorage.setItem("activeWorkoutSession", JSON.stringify(activeSession));
      localStorage.setItem("activeWorkoutBlocks", JSON.stringify(exerciseBlocks));
    } else {
      localStorage.removeItem("activeWorkoutSession");
      localStorage.removeItem("activeWorkoutBlocks");
    }
  }, [activeSession, exerciseBlocks]);

  // ── Rest Timer ───────────────────────────────────────────────────────────────

  const clearRestTimer = useCallback(() => {
    if (restIntervalRef.current) {
      clearInterval(restIntervalRef.current);
      restIntervalRef.current = null;
    }
    setRestTimerSeconds(null);
  }, []);

  const startRestTimer = useCallback((seconds: number = 90) => {
    clearRestTimer();
    setRestTimerSeconds(seconds);
    restIntervalRef.current = setInterval(() => {
      setRestTimerSeconds(prev => {
        if (prev === null || prev <= 1) {
          clearInterval(restIntervalRef.current!);
          restIntervalRef.current = null;
          // Gentle pulse: timer finished
          return null;
        }
        return prev - 1;
      });
    }, 1000);
  }, [clearRestTimer]);

  // Clean up timer on unmount
  useEffect(() => () => { if (restIntervalRef.current) clearInterval(restIntervalRef.current); }, []);

  // ── Mutations ────────────────────────────────────────────────────────────────

  const startMutation = useMutation({
    mutationFn: async (session: InsertWorkoutSession) => {
      const res = await apiRequest("POST", "/api/workouts/sessions", session);
      return res.json() as Promise<WorkoutSession>;
    },
    onSuccess: (data) => {
      setActiveSession(data);
      setExerciseBlocks([]);
      toast({ title: "Workout Started", description: "Let's crush those goals!" });
    },
    onError: (error: any) => {
      toast({ title: "Failed to start workout", description: error.message, variant: "destructive" });
    }
  });

  const finishMutation = useMutation({
    mutationFn: async ({ id, sets, notes }: { id: string; sets: InsertWorkoutSet[]; notes?: string }) => {
      const res = await apiRequest("PUT", `/api/workouts/sessions/${id}/finish`, { sets, notes });
      return res.json() as Promise<WorkoutSession>;
    },
    onSuccess: () => {
      setActiveSession(null);
      setExerciseBlocks([]);
      clearRestTimer();
      queryClient.invalidateQueries({ queryKey: ["/api/workouts/sessions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/workouts/prs"] });
      toast({ title: "Workout Completed! 🏆", description: "Awesome job! XP awarded." });
    },
    onError: (error: any) => {
      toast({ title: "Failed to finish workout", description: error.message, variant: "destructive" });
    }
  });

  // ── Session actions ───────────────────────────────────────────────────────────

  const startWorkout = async (session: InsertWorkoutSession) => {
    await startMutation.mutateAsync(session);
  };

  const finishWorkout = async (notes?: string) => {
    if (!activeSession) return;

    const validSets: InsertWorkoutSet[] = [];
    exerciseBlocks.forEach(block => {
      block.sets.forEach((set, idx) => {
        if (!set.exerciseId) return;
        // Accept if it has reps+weight OR durationSeconds
        if ((set.reps !== undefined || set.weight !== undefined) || set.durationSeconds !== undefined) {
          validSets.push({
            sessionId: activeSession.id,
            exerciseId: set.exerciseId,
            setNumber: idx + 1,
            reps: set.reps ?? undefined,
            weight: set.weight ?? undefined,
            durationSeconds: set.durationSeconds ?? undefined,
            rpe: set.rpe ?? undefined,
            setType: (set.setType as SetType) ?? "normal",
          } as InsertWorkoutSet);
        }
      });
    });

    await finishMutation.mutateAsync({ id: activeSession.id, sets: validSets, notes });
  };

  const cancelWorkout = () => {
    setActiveSession(null);
    setExerciseBlocks([]);
    clearRestTimer();
    toast({ title: "Workout Cancelled", description: "Your session has been discarded." });
  };

  // ── Block-level operations ───────────────────────────────────────────────────

  /**
   * Add one or more exercises to the session.
   * If prefillMap[exerciseId] exists, those sets are used as historical placeholders.
   */
  const addExercises = useCallback(
    (exerciseIds: string[], prefillMap: Record<string, WorkoutSet[]> = {}) => {
      setExerciseBlocks(prev => {
        const existingIds = new Set(prev.map(b => b.exerciseId));
        const newBlocks: ExerciseBlock[] = [];

        exerciseIds.forEach(exerciseId => {
          if (existingIds.has(exerciseId)) {
            // Already in session: add one more set
            return;
          }

          const lastSets = prefillMap[exerciseId] ?? [];
          const sets: ActiveSet[] =
            lastSets.length > 0
              ? lastSets.map(s => ({
                  exerciseId,
                  setNumber: s.setNumber,
                  weight: s.weight !== null ? Number(s.weight) : undefined,
                  reps: s.reps ?? undefined,
                  durationSeconds: s.durationSeconds ?? undefined,
                  rpe: s.rpe ?? undefined,
                  setType: (s.setType as SetType) ?? "normal",
                  isHistorical: true,
                }))
              : [{ exerciseId, setNumber: 1, setType: "normal" as SetType }];

          newBlocks.push({ exerciseId, order: prev.length + newBlocks.length, sets, note: "" });
        });

        return [...prev, ...newBlocks];
      });
    },
    []
  );

  const addSetToBlock = useCallback((exerciseId: string) => {
    setExerciseBlocks(prev =>
      prev.map(block => {
        if (block.exerciseId !== exerciseId) return block;
        const newSetNumber = block.sets.length + 1;
        // Clone the last set values as a convenience
        const lastSet = block.sets[block.sets.length - 1];
        return {
          ...block,
          sets: [
            ...block.sets,
            {
              exerciseId,
              setNumber: newSetNumber,
              weight: lastSet?.weight,
              reps: lastSet?.reps,
              setType: "normal" as SetType,
            },
          ],
        };
      })
    );
  }, []);

  const updateSet = useCallback(
    (exerciseId: string, setIndex: number, updates: Partial<ActiveSet>) => {
      setExerciseBlocks(prev =>
        prev.map(block => {
          if (block.exerciseId !== exerciseId) return block;
          const newSets = [...block.sets];
          newSets[setIndex] = { ...newSets[setIndex], ...updates, isHistorical: false };
          return { ...block, sets: newSets };
        })
      );
    },
    []
  );

  const removeSet = useCallback((exerciseId: string, setIndex: number) => {
    setExerciseBlocks(prev =>
      prev
        .map(block => {
          if (block.exerciseId !== exerciseId) return block;
          const newSets = block.sets
            .filter((_, i) => i !== setIndex)
            .map((s, i) => ({ ...s, setNumber: i + 1 }));
          return { ...block, sets: newSets };
        })
        .filter(block => block.sets.length > 0)
    );
  }, []);

  const removeBlock = useCallback((exerciseId: string) => {
    setExerciseBlocks(prev => prev.filter(b => b.exerciseId !== exerciseId));
  }, []);

  const reorderBlocks = useCallback((newOrder: ExerciseBlock[]) => {
    setExerciseBlocks(newOrder.map((b, i) => ({ ...b, order: i })));
  }, []);

  const updateBlockNote = useCallback((exerciseId: string, note: string) => {
    setExerciseBlocks(prev =>
      prev.map(b => (b.exerciseId === exerciseId ? { ...b, note } : b))
    );
  }, []);

  // ── Derived flat set list (for backward compat) ──────────────────────────────

  const activeSets: ActiveSet[] = exerciseBlocks.flatMap(block =>
    block.sets.map(set => ({ ...set, exerciseId: block.exerciseId }))
  );

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <WorkoutContext.Provider
      value={{
        activeSession,
        isWorkoutActive: !!activeSession,
        startWorkout,
        finishWorkout,
        cancelWorkout,
        activeSets,
        exerciseBlocks,
        addExercises,
        addSetToBlock,
        updateSet,
        removeSet,
        removeBlock,
        reorderBlocks,
        updateBlockNote,
        restTimerSeconds,
        startRestTimer,
        clearRestTimer,
      }}
    >
      {children}
    </WorkoutContext.Provider>
  );
}

export function useWorkout() {
  const context = useContext(WorkoutContext);
  if (!context) {
    throw new Error("useWorkout must be used within a WorkoutProvider");
  }
  return context;
}
