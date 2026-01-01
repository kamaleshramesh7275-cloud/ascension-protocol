import { useRef } from "react";
import { motion } from "framer-motion";
import { RoadmapTask } from "@shared/schema";
import { Check, Circle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface TaskItemProps {
    task: RoadmapTask;
    isWeekLocked: boolean;
}

export function TaskItem({ task, isWeekLocked }: TaskItemProps) {
    const queryClient = useQueryClient();

    // Optimized mutation with Optimistic Updates
    const toggleMutation = useMutation({
        mutationFn: async () => {
            const res = await apiRequest("POST", `/api/roadmap/tasks/${task.id}/toggle`);
            return res.json();
        },
        onMutate: async () => {
            // Cancel any outgoing refetches (so they don't overwrite our optimistic update)
            await queryClient.cancelQueries({ queryKey: ["/api/roadmap"] });

            // Snapshot the previous value
            const previousRoadmap = queryClient.getQueryData(["/api/roadmap"]);

            // Optimistically update to the new value
            queryClient.setQueryData(["/api/roadmap"], (old: any) => {
                if (!old) return old;
                return {
                    ...old,
                    weeks: old.weeks.map((week: any) => ({
                        ...week,
                        tasks: week.tasks.map((t: any) =>
                            t.id === task.id ? { ...t, completed: !t.completed } : t
                        )
                    }))
                };
            });

            // Return a context object with the snapshotted value
            return { previousRoadmap };
        },
        onError: (err, newTodo, context: any) => {
            // If the mutation fails, use the context returned from onMutate to roll back
            queryClient.setQueryData(["/api/roadmap"], context.previousRoadmap);
        },
        onSettled: () => {
            // Always refetch after error or success to guarantee sync
            queryClient.invalidateQueries({ queryKey: ["/api/roadmap"] });
        },
    });

    return (
        <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
                "flex items-center gap-3 p-3 rounded-lg border transition-all",
                task.completed
                    ? "bg-green-500/10 border-green-500/20"
                    : "bg-zinc-900/50 border-zinc-800 hover:border-zinc-700",
                isWeekLocked && "opacity-50 pointer-events-none"
            )}
        >
            <button
                onClick={() => !isWeekLocked && toggleMutation.mutate()}
                disabled={isWeekLocked || toggleMutation.isPending}
                className={cn(
                    "relative flex items-center justify-center w-6 h-6 rounded-full border-2 transition-colors",
                    task.completed
                        ? "bg-green-500 border-green-500 text-black"
                        : "border-zinc-600 hover:border-zinc-400"
                )}
            >
                {task.completed && <Check className="w-3.5 h-3.5" strokeWidth={3} />}
            </button>

            <span className={cn(
                "text-sm font-medium transition-colors",
                task.completed ? "text-zinc-400 line-through" : "text-zinc-200"
            )}>
                {task.text}
            </span>
        </motion.div>
    );
}
