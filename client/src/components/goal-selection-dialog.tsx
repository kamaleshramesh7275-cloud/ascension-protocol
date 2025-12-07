import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Brain, Dumbbell, Briefcase, Users, Sparkles } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface GoalSelectionDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    currentGoal?: string | null;
}

const CATEGORIES = [
    { id: "fitness", label: "Fitness", icon: Dumbbell, description: "Strength, Endurance, Health" },
    { id: "intellect", label: "Intellect", icon: Brain, description: "Learning, Skills, Reading" },
    { id: "wealth", label: "Wealth", icon: Briefcase, description: "Career, Business, Finance" },
    { id: "social", label: "Social", icon: Users, description: "Charisma, Networking, Relationships" },
    { id: "mindfulness", label: "Mindfulness", icon: Sparkles, description: "Meditation, Mental Health, Willpower" },
];

export function GoalSelectionDialog({ open, onOpenChange, currentGoal }: GoalSelectionDialogProps) {
    const [category, setCategory] = useState<string>("fitness");
    const [specificGoal, setSpecificGoal] = useState<string>("");
    const { toast } = useToast();
    const queryClient = useQueryClient();

    const updateGoalMutation = useMutation({
        mutationFn: async (goal: string) => {
            console.log("🎯 Updating goal to:", goal);
            const response = await apiRequest("PATCH", `/api/user`, { currentGoal: goal });
            const data = await response.json();
            console.log("✅ Goal update response:", data);
            return data;
        },
        onSuccess: (data) => {
            console.log("✅ Goal mutation succeeded, user data:", data);
            queryClient.invalidateQueries({ queryKey: ["/api/user"] });
            // Manually update the cache with the new user data
            queryClient.setQueryData(["/api/user"], data);
            toast({
                title: "Goal Set!",
                description: "Your quests will now be aligned with your new focus.",
            });
            onOpenChange(false);
        },
        onError: (error: Error) => {
            console.error("❌ Goal mutation failed:", error.message);
            toast({
                title: "Error",
                description: `Failed to update goal: ${error.message}`,
                variant: "destructive",
            });
        },
    });

    const handleSubmit = () => {
        if (!specificGoal.trim()) {
            toast({ title: "Please enter a specific goal", variant: "destructive" });
            return;
        }
        // Format: "Category: Specific Goal" (e.g., "Intellect: Learn Spanish")
        const formattedGoal = `${category}:${specificGoal}`;
        console.log("📝 Submitting goal:", formattedGoal);
        updateGoalMutation.mutate(formattedGoal);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px] bg-zinc-950 border-zinc-800 text-white">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-bold text-center">Choose Your Path</DialogTitle>
                    <DialogDescription className="text-center text-zinc-400">
                        Select a focus area to align your daily quests with your real-life goals.
                    </DialogDescription>
                </DialogHeader>

                <div className="py-6 space-y-6">
                    <div className="space-y-4">
                        <Label className="text-base">1. Select a Pillar</Label>
                        <RadioGroup value={category} onValueChange={setCategory} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {CATEGORIES.map((cat) => (
                                <div key={cat.id}>
                                    <RadioGroupItem value={cat.id} id={cat.id} className="peer sr-only" />
                                    <Label
                                        htmlFor={cat.id}
                                        className="flex items-center gap-4 p-4 border border-zinc-800 rounded-xl cursor-pointer hover:bg-zinc-900 peer-data-[state=checked]:border-purple-500 peer-data-[state=checked]:bg-purple-500/10 transition-all"
                                    >
                                        <div className={`p-2 rounded-lg ${category === cat.id ? "bg-purple-500 text-white" : "bg-zinc-800 text-zinc-400"}`}>
                                            <cat.icon className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <div className="font-semibold">{cat.label}</div>
                                            <div className="text-xs text-zinc-500">{cat.description}</div>
                                        </div>
                                    </Label>
                                </div>
                            ))}
                        </RadioGroup>
                    </div>

                    <div className="space-y-4">
                        <Label className="text-base">2. Define Your North Star</Label>
                        <Input
                            value={specificGoal}
                            onChange={(e) => setSpecificGoal(e.target.value)}
                            placeholder={
                                category === "fitness" ? "e.g., Run a marathon, Bench press 100kg" :
                                    category === "intellect" ? "e.g., Learn Python, Read 12 books" :
                                        category === "wealth" ? "e.g., Launch a side hustle, Save $10k" :
                                            category === "social" ? "e.g., Make 5 new friends, Speak at an event" :
                                                "e.g., Meditate daily, Quit smoking"
                            }
                            className="bg-zinc-900 border-zinc-800 h-12"
                        />
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button
                        onClick={handleSubmit}
                        className="bg-purple-600 hover:bg-purple-700 text-white"
                        disabled={updateGoalMutation.isPending}
                    >
                        {updateGoalMutation.isPending ? "Setting Path..." : "Confirm Path"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
