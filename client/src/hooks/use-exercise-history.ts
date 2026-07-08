import { useQuery } from "@tanstack/react-query";
import type { WorkoutSet } from "@shared/schema";

/**
 * Fetches the sets from the most recent session that included `exerciseId`.
 * Returns an empty array if no history exists.
 * Only fetches when `exerciseId` is truthy.
 */
export function useExerciseHistory(exerciseId: string | null) {
  const { data: lastSets = [] } = useQuery<WorkoutSet[]>({
    queryKey: [`/api/workouts/exercises/${exerciseId}/last-sets`],
    enabled: !!exerciseId,
    staleTime: 5 * 60 * 1000, // 5 minutes – history rarely changes mid-session
  });

  return lastSets;
}
