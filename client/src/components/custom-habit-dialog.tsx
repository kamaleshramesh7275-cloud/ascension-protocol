import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PlusCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export function CustomHabitDialog() {
  const [open, setOpen] = useState(false);
  const [habitName, setHabitName] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const createHabitMutation = useMutation({
    mutationFn: async (name: string) => {
      return apiRequest("POST", "/api/habits", {
        habitId: name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
        habitName: name,
        frequency: "daily"
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/habits"] });
      queryClient.invalidateQueries({ queryKey: ["/api/quests"] });
      setOpen(false);
      setHabitName("");
      toast({ title: "Habit Created", description: "Your custom habit has been added and a daily quest will be generated." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to create habit.", variant: "destructive" });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!habitName.trim()) return;
    createHabitMutation.mutate(habitName);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full bg-zinc-900/50 border-zinc-800 text-zinc-300 hover:bg-zinc-800 hover:text-white mt-4">
          <PlusCircle className="w-4 h-4 mr-2" />
          Create Custom Habit
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-zinc-950 border-zinc-800 text-zinc-100">
        <DialogHeader>
          <DialogTitle>Create Custom Habit</DialogTitle>
          <DialogDescription className="text-zinc-400">
            Define a daily habit. We will automatically generate a daily quest for it so you can track your streak!
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="name">Habit Name</Label>
            <Input
              id="name"
              placeholder="e.g., Read 10 pages, Meditate, Code for 1 hour"
              value={habitName}
              onChange={(e) => setHabitName(e.target.value)}
              className="bg-zinc-900 border-zinc-800"
            />
          </div>
          <Button 
            type="submit" 
            className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
            disabled={!habitName.trim() || createHabitMutation.isPending}
          >
            {createHabitMutation.isPending ? "Creating..." : "Create Habit"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
