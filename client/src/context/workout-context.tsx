import React, { createContext, useContext, useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { 
  Exercise, 
  WorkoutSession, 
  WorkoutSessionWithSets, 
  WorkoutSetWithExercise,
  InsertWorkoutSession,
  InsertWorkoutSet
} from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

type WorkoutContextType = {
  activeSession: WorkoutSession | null;
  activeSets: Partial<InsertWorkoutSet>[];
  startWorkout: (session: InsertWorkoutSession) => Promise<void>;
  finishWorkout: (notes?: string) => Promise<void>;
  cancelWorkout: () => void;
  addSet: (exerciseId: string, setNumber: number) => void;
  updateSet: (index: number, updates: Partial<InsertWorkoutSet>) => void;
  removeSet: (index: number) => void;
  isWorkoutActive: boolean;
};

const WorkoutContext = createContext<WorkoutContextType | null>(null);

export function WorkoutProvider({ children }: { children: React.ReactNode }) {
  const [activeSession, setActiveSession] = useState<WorkoutSession | null>(null);
  const [activeSets, setActiveSets] = useState<Partial<InsertWorkoutSet>[]>([]);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Load from local storage on mount
  useEffect(() => {
    const savedSession = localStorage.getItem("activeWorkoutSession");
    const savedSets = localStorage.getItem("activeWorkoutSets");
    
    if (savedSession) {
      setActiveSession(JSON.parse(savedSession));
    }
    if (savedSets) {
      setActiveSets(JSON.parse(savedSets));
    }
  }, []);

  // Save to local storage on change
  useEffect(() => {
    if (activeSession) {
      localStorage.setItem("activeWorkoutSession", JSON.stringify(activeSession));
      localStorage.setItem("activeWorkoutSets", JSON.stringify(activeSets));
    } else {
      localStorage.removeItem("activeWorkoutSession");
      localStorage.removeItem("activeWorkoutSets");
    }
  }, [activeSession, activeSets]);

  const startMutation = useMutation({
    mutationFn: async (session: InsertWorkoutSession) => {
      const res = await apiRequest("POST", "/api/workouts/sessions", session);
      return res.json() as Promise<WorkoutSession>;
    },
    onSuccess: (data) => {
      setActiveSession(data);
      setActiveSets([]);
      toast({
        title: "Workout Started",
        description: "Let's crush those goals!",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to start workout",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const finishMutation = useMutation({
    mutationFn: async ({ id, sets, notes }: { id: string, sets: InsertWorkoutSet[], notes?: string }) => {
      const res = await apiRequest("PUT", `/api/workouts/sessions/${id}/finish`, { sets, notes });
      return res.json() as Promise<WorkoutSession>;
    },
    onSuccess: () => {
      setActiveSession(null);
      setActiveSets([]);
      queryClient.invalidateQueries({ queryKey: ["/api/workouts/sessions"] });
      toast({
        title: "Workout Completed",
        description: "Awesome job!",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to finish workout",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const startWorkout = async (session: InsertWorkoutSession) => {
    await startMutation.mutateAsync(session);
  };

  const finishWorkout = async (notes?: string) => {
    if (!activeSession) return;
    
    // Filter out empty sets (no reps/weight for strength, or no duration for cardio)
    const validSets = activeSets.filter(s => 
      s.exerciseId && s.setNumber !== undefined && 
      ((s.reps !== undefined && s.weight !== undefined) || s.durationSeconds !== undefined)
    ) as InsertWorkoutSet[];

    await finishMutation.mutateAsync({ 
      id: activeSession.id, 
      sets: validSets, 
      notes 
    });
  };

  const cancelWorkout = () => {
    setActiveSession(null);
    setActiveSets([]);
    toast({
      title: "Workout Cancelled",
      description: "Your session has been discarded.",
    });
  };

  const addSet = (exerciseId: string, setNumber: number) => {
    setActiveSets(prev => [
      ...prev,
      { exerciseId, setNumber, setType: "normal" }
    ]);
  };

  const updateSet = (index: number, updates: Partial<InsertWorkoutSet>) => {
    setActiveSets(prev => {
      const newSets = [...prev];
      newSets[index] = { ...newSets[index], ...updates };
      return newSets;
    });
  };

  const removeSet = (index: number) => {
    setActiveSets(prev => prev.filter((_, i) => i !== index));
    // Re-number subsequent sets for the same exercise
    setActiveSets(prev => {
      const newSets = [...prev];
      const removedExerciseId = prev[index]?.exerciseId;
      if (!removedExerciseId) return newSets;
      
      let setNum = 1;
      newSets.forEach(set => {
        if (set.exerciseId === removedExerciseId) {
          set.setNumber = setNum++;
        }
      });
      return newSets;
    });
  };

  return (
    <WorkoutContext.Provider value={{
      activeSession,
      activeSets,
      startWorkout,
      finishWorkout,
      cancelWorkout,
      addSet,
      updateSet,
      removeSet,
      isWorkoutActive: !!activeSession
    }}>
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
