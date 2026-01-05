import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { HabitTracking, InsertHabit } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2, CheckCircle2, Flame, Info, RotateCcw } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { useAnimations } from "@/context/animation-context";

export function DailyProtocol() {
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [newHabitName, setNewHabitName] = useState("");
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const { showQuestCompleted } = useAnimations();

    const { data: habits, isLoading } = useQuery<HabitTracking[]>({
        queryKey: ["/api/habits"],
    });

    const createMutation = useMutation({
        mutationFn: async (newHabit: Partial<InsertHabit>) => {
            const res = await apiRequest("POST", "/api/habits", newHabit);
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/habits"] });
            setIsAddOpen(false);
            setNewHabitName("");
            toast({ title: "Protocol Established", description: "New habit added to your daily routine." });
        },
    });

    const completeMutation = useMutation({
        mutationFn: async (id: string) => {
            const res = await apiRequest("POST", `/api/habits/${id}/complete`, {});
            return res.json();
        },
        onSuccess: (data: HabitTracking) => {
            queryClient.invalidateQueries({ queryKey: ["/api/habits"] });
            queryClient.invalidateQueries({ queryKey: ["/api/user"] });
            showQuestCompleted(data.habitName, 25, 0); // Award 25 XP
            toast({ title: "Objective Secured", description: "XP awarded. Keep up the momentum!" });
        },
    });

    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            return apiRequest("DELETE", `/api/habits/${id}`, {});
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/habits"] });
            toast({ title: "Protocol Deleted", description: "Habit removed from your routine." });
        },
    });

    const handleAddHabit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newHabitName.trim()) return;
        createMutation.mutate({
            habitName: newHabitName,
            habitId: newHabitName.toLowerCase().replace(/\s+/g, '-'),
            frequency: "daily",
        });
    };

    const isCompletedToday = (lastCompletedAt: string | Date | null) => {
        if (!lastCompletedAt) return false;
        const last = new Date(lastCompletedAt);
        const today = new Date();
        return (
            last.getDate() === today.getDate() &&
            last.getMonth() === today.getMonth() &&
            last.getFullYear() === today.getFullYear()
        );
    };

    const completedCount = habits?.filter(h => isCompletedToday(h.lastCompletedAt)).length || 0;
    const totalCount = habits?.length || 0;
    const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

    if (isLoading) return <div className="h-48 flex items-center justify-center text-muted-foreground">Loading Protocol...</div>;

    return (
        <Card className="border-primary/20 bg-card/40 backdrop-blur-xl overflow-hidden relative group">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none" />

            <CardHeader className="relative z-10 flex flex-row items-center justify-between pb-2">
                <div className="space-y-1">
                    <CardTitle className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
                        Daily Protocol
                        <Badge variant="outline" className="text-[10px] font-bold uppercase tracking-widest bg-primary/10 border-primary/20 text-primary">
                            Active
                        </Badge>
                    </CardTitle>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Info className="w-3 h-3" />
                        Tasks reset every day at 12:00 AM
                    </p>
                </div>

                <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                    <DialogTrigger asChild>
                        <Button size="icon" variant="ghost" className="rounded-full hover:bg-primary/10 hover:text-primary transition-all duration-300">
                            <Plus className="w-5 h-5" />
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-background/95 backdrop-blur-xl border-primary/20">
                        <DialogHeader>
                            <DialogTitle>Add New Protocol</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleAddHabit} className="space-y-4 pt-4">
                            <Input
                                placeholder="Ex: Morning Meditation, Reading, Hydration..."
                                value={newHabitName}
                                onChange={(e) => setNewHabitName(e.target.value)}
                                className="bg-muted/50 border-primary/20 focus:border-primary transition-all"
                                autoFocus
                            />
                            <Button
                                type="submit"
                                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold"
                                disabled={createMutation.isPending}
                            >
                                Establish Protocol
                            </Button>
                        </form>
                    </DialogContent>
                </Dialog>
            </CardHeader>

            <CardContent className="relative z-10 space-y-6">
                {/* Overall Progress */}
                <div className="space-y-2">
                    <div className="flex justify-between text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        <span>Daily Completion</span>
                        <span className="text-primary">{Math.round(progress)}%</span>
                    </div>
                    <Progress value={progress} className="h-2 bg-muted/50" />
                </div>

                {/* Habit List */}
                <div className="grid gap-3">
                    <AnimatePresence mode="popLayout">
                        {habits && habits.length > 0 ? (
                            habits.map((habit) => {
                                const completed = isCompletedToday(habit.lastCompletedAt);
                                return (
                                    <motion.div
                                        key={habit.id}
                                        layout
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                        whileHover={{ y: -2 }}
                                        className={`group/item flex items-center justify-between p-4 rounded-xl border transition-all duration-300 shadow-sm hover:shadow-primary/10 ${completed
                                            ? "bg-primary/10 border-primary/20 opacity-80"
                                            : "bg-muted/30 border-border/50 hover:border-primary/30 hover:bg-muted/50 hover:shadow-md"
                                            }`}
                                    >
                                        <div className="flex items-center gap-4">
                                            <Button
                                                size="icon"
                                                variant="ghost"
                                                className={`w-10 h-10 rounded-full border-2 transition-all duration-500 ${completed
                                                    ? "bg-primary border-primary text-primary-foreground"
                                                    : "border-muted-foreground/30 hover:border-primary hover:text-primary"
                                                    }`}
                                                onClick={() => !completed && completeMutation.mutate(habit.id)}
                                                disabled={completed || completeMutation.isPending}
                                            >
                                                {completed ? <CheckCircle2 className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                                            </Button>

                                            <div className="space-y-1">
                                                <h4 className={`font-semibold leading-none transition-all ${completed ? "text-muted-foreground line-through" : "text-foreground"}`}>
                                                    {habit.habitName}
                                                </h4>
                                                <div className="flex items-center gap-3">
                                                    <div className="flex items-center gap-1 text-[10px] font-bold text-amber-500 uppercase tracking-tighter">
                                                        <Flame className="w-3 h-3 fill-current" />
                                                        {habit.currentStreak} Day Streak
                                                    </div>
                                                    <div className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">
                                                        +25 XP
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <Button
                                            size="icon"
                                            variant="ghost"
                                            className="opacity-0 group-hover/item:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                                            onClick={() => deleteMutation.mutate(habit.id)}
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </motion.div>
                                );
                            })
                        ) : (
                            <div className="text-center py-8 space-y-3">
                                <RotateCcw className="w-8 h-8 text-muted-foreground mx-auto opacity-20" />
                                <p className="text-sm text-muted-foreground italic">No protocols established. Add your first task to begin.</p>
                            </div>
                        )}
                    </AnimatePresence>
                </div>
            </CardContent>
        </Card>
    );
}
