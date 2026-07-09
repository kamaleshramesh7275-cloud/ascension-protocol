import React, { useState, useMemo } from "react";
import {
  Search, SlidersHorizontal, Dumbbell, Clock, Calendar, Check, Play,
  Plus, Bookmark, Copy, ChevronRight, X, Sparkles, Trophy, ShieldAlert
} from "lucide-react";
import { Sheet, SheetContent, SheetTitle, SheetHeader } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useWorkout } from "@/context/workout-context";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { OFFICIAL_TEMPLATES, type OfficialTemplate } from "@shared/official-templates";
import type { Exercise } from "@shared/schema";
import { motion, AnimatePresence } from "framer-motion";

interface OfficialTemplatesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  exercises: Exercise[];
}

export function OfficialTemplatesDialog({ open, onOpenChange, exercises }: OfficialTemplatesDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { startWorkoutWithExercises, isWorkoutActive } = useWorkout();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [difficultyFilter, setDifficultyFilter] = useState<string>("all");
  const [goalFilter, setGoalFilter] = useState<string>("all");
  const [selectedTemplate, setSelectedTemplate] = useState<OfficialTemplate | null>(null);

  // Reset selected template when dialog closes
  React.useEffect(() => {
    if (!open) {
      setSelectedTemplate(null);
    }
  }, [open]);

  // Categories list
  const categories = [
    { id: "all", label: "All Routines" },
    { id: "split", label: "Training Splits" },
    { id: "muscle_group", label: "Muscle Groups" },
    { id: "goal", label: "By Goal" },
    { id: "equipment", label: "Equipment" }
  ];

  // Filtering templates
  const filteredTemplates = useMemo(() => {
    return OFFICIAL_TEMPLATES.filter(template => {
      const matchesSearch =
        template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        template.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        template.exercises.some(e => e.name.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesCategory = selectedCategory === "all" || template.category === selectedCategory;
      const matchesDifficulty = difficultyFilter === "all" || template.difficulty === difficultyFilter;
      const matchesGoal = goalFilter === "all" || template.goal === goalFilter;

      return matchesSearch && matchesCategory && matchesDifficulty && matchesGoal;
    });
  }, [searchQuery, selectedCategory, difficultyFilter, goalFilter]);

  // Map template exercises to DB exercise IDs by name match
  const mapExercisesToDb = (templateExercises: any[]) => {
    return templateExercises.map(te => {
      const match = exercises.find(e => e.name.toLowerCase() === te.name.toLowerCase());
      return {
        exerciseId: match?.id || "",
        sets: te.sets
      };
    }).filter(e => e.exerciseId !== "");
  };

  const handleStartWorkout = async (template: OfficialTemplate) => {
    if (isWorkoutActive) {
      toast({
        title: "Active Workout In Progress",
        description: "Please finish or cancel your current workout session first.",
        variant: "destructive"
      });
      return;
    }

    const mapped = mapExercisesToDb(template.exercises);
    if (mapped.length === 0) {
      toast({
        title: "Error Loading Routine",
        description: "Exercises in this template could not be loaded.",
        variant: "destructive"
      });
      return;
    }

    try {
      await startWorkoutWithExercises(
        template.name,
        null, // It is an official template, not a custom user template in DB yet
        user!.id,
        mapped
      );
      onOpenChange(false);
    } catch (err: any) {
      toast({
        title: "Failed to start workout",
        description: err.message,
        variant: "destructive"
      });
    }
  };

  const handleAddToLibrary = async (template: OfficialTemplate) => {
    const mapped = mapExercisesToDb(template.exercises);
    const exerciseIds = mapped.map(m => m.exerciseId);

    try {
      const res = await apiRequest("POST", "/api/workouts/templates", {
        name: template.name,
        description: template.description || `Official ${template.name} routine`,
        exerciseIds,
        isPublic: false
      });
      
      if (res.ok) {
        queryClient.invalidateQueries({ queryKey: ["/api/workouts/templates"] });
        toast({
          title: "Saved to Library! 📥",
          description: `"${template.name}" has been successfully added to your templates.`
        });
      }
    } catch (err: any) {
      toast({
        title: "Failed to save template",
        description: err.message,
        variant: "destructive"
      });
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[96vh] bg-[#0a0a0a] border-t border-white/10 p-0 flex flex-col sm:max-w-xl sm:mx-auto sm:rounded-t-2xl overflow-hidden">
        
        {/* Header */}
        <div className="flex flex-row items-center justify-between border-b border-white/10 p-4 shrink-0 bg-black/40 backdrop-blur-md z-10">
          <button 
            onClick={() => selectedTemplate ? setSelectedTemplate(null) : onOpenChange(false)} 
            className="text-blue-500 font-medium text-base hover:text-blue-400 transition-colors"
          >
            {selectedTemplate ? "Back" : "Close"}
          </button>
          <SheetTitle className="text-base font-semibold m-0 text-white flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-emerald-400 animate-pulse" />
            {selectedTemplate ? "Routine Details" : "Official Template Library"}
          </SheetTitle>
          <div className="w-12"></div> {/* spacer to center title */}
        </div>

        {/* Dialog Body */}
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 scrollbar-hide">
          <AnimatePresence mode="wait">
            {!selectedTemplate ? (
              <motion.div 
                key="list"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex flex-col gap-4"
              >
                {/* Search & Basic Filters */}
                <div className="flex flex-col gap-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                    <Input
                      placeholder="Search splits, goals, or exercises..."
                      className="pl-10 bg-white/5 border-none h-10 text-base rounded-xl text-white placeholder:text-muted-foreground focus-visible:ring-1 focus-visible:ring-white/20"
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                    />
                  </div>
                  
                  {/* Select filters */}
                  <div className="flex gap-2">
                    <select
                      value={difficultyFilter}
                      onChange={e => setDifficultyFilter(e.target.value)}
                      className="bg-white/5 border-none text-xs rounded-lg px-2 py-1.5 text-white/80 focus:outline-none focus:ring-1 focus:ring-white/20 flex-1 cursor-pointer"
                    >
                      <option value="all" className="bg-[#0a0a0a]">All Levels</option>
                      <option value="beginner" className="bg-[#0a0a0a]">Beginner</option>
                      <option value="intermediate" className="bg-[#0a0a0a]">Intermediate</option>
                      <option value="advanced" className="bg-[#0a0a0a]">Advanced</option>
                    </select>

                    <select
                      value={goalFilter}
                      onChange={e => setGoalFilter(e.target.value)}
                      className="bg-white/5 border-none text-xs rounded-lg px-2 py-1.5 text-white/80 focus:outline-none focus:ring-1 focus:ring-white/20 flex-1 cursor-pointer"
                    >
                      <option value="all" className="bg-[#0a0a0a]">All Goals</option>
                      <option value="build_muscle" className="bg-[#0a0a0a]">Build Muscle</option>
                      <option value="gain_strength" className="bg-[#0a0a0a]">Gain Strength</option>
                      <option value="lose_fat" className="bg-[#0a0a0a]">Lose Fat</option>
                      <option value="endurance" className="bg-[#0a0a0a]">Endurance</option>
                    </select>
                  </div>
                </div>

                {/* Categories Tab pills */}
                <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
                  {categories.map(cat => (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedCategory(cat.id)}
                      className={`text-xs px-3 py-1.5 rounded-full border transition-all whitespace-nowrap ${
                        selectedCategory === cat.id 
                          ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-400" 
                          : "bg-white/5 border-white/10 text-muted-foreground hover:border-white/20"
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>

                {/* Templates List */}
                <div className="flex flex-col gap-3">
                  {filteredTemplates.map(template => (
                    <motion.div
                      key={template.id}
                      onClick={() => setSelectedTemplate(template)}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.98 }}
                      className="bg-card/40 border border-white/10 hover:border-emerald-500/30 rounded-xl p-4 flex flex-col gap-2 cursor-pointer transition-colors relative overflow-hidden"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex flex-col">
                          <span className="text-xs font-semibold text-emerald-400 uppercase tracking-widest">
                            {template.splitType || template.category.replace("_", " ")}
                          </span>
                          <h3 className="text-base font-bold text-white mt-0.5">{template.name}</h3>
                        </div>
                        <Badge className="bg-white/5 border-white/10 text-white/80 capitalize text-[10px]">
                          {template.difficulty}
                        </Badge>
                      </div>

                      <p className="text-xs text-muted-foreground line-clamp-2">{template.description}</p>

                      <div className="flex items-center gap-3 text-muted-foreground text-[11px] mt-1.5 border-t border-white/5 pt-2">
                        <div className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          <span>{template.durationMinutes} min</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          <span>{template.daysPerWeek} days/wk</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Dumbbell className="w-3.5 h-3.5" />
                          <span>{template.exercises.length} exercises</span>
                        </div>
                      </div>
                    </motion.div>
                  ))}

                  {filteredTemplates.length === 0 && (
                    <div className="py-16 text-center text-muted-foreground flex flex-col items-center justify-center">
                      <Dumbbell className="w-12 h-12 opacity-25 mb-3" />
                      <p className="font-medium">No official routines match your filters</p>
                      <p className="text-xs mt-1">Try adjusting search or category filters.</p>
                    </div>
                  )}
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="detail"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex flex-col gap-4 pb-20"
              >
                {/* Meta details */}
                <div className="flex flex-col gap-2">
                  <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest">
                    {selectedTemplate.splitType || selectedTemplate.category.replace("_", " ")}
                  </span>
                  <h2 className="text-2xl font-bold text-white">{selectedTemplate.name}</h2>
                  <p className="text-sm text-white/70 leading-relaxed">{selectedTemplate.description}</p>
                </div>

                {/* Quick stats tags */}
                <div className="grid grid-cols-3 gap-2">
                  <div className="bg-white/5 border border-white/5 rounded-xl p-3 flex flex-col items-center text-center">
                    <Clock className="w-4 h-4 text-emerald-400 mb-1" />
                    <span className="text-[10px] text-muted-foreground uppercase">Duration</span>
                    <span className="text-sm font-semibold text-white">{selectedTemplate.durationMinutes}m</span>
                  </div>
                  <div className="bg-white/5 border border-white/5 rounded-xl p-3 flex flex-col items-center text-center">
                    <Calendar className="w-4 h-4 text-emerald-400 mb-1" />
                    <span className="text-[10px] text-muted-foreground uppercase">Split frequency</span>
                    <span className="text-sm font-semibold text-white">{selectedTemplate.daysPerWeek} days/wk</span>
                  </div>
                  <div className="bg-white/5 border border-white/5 rounded-xl p-3 flex flex-col items-center text-center">
                    <Badge className="bg-primary/20 text-primary border-primary/30 capitalize text-[10px] mb-1">
                      {selectedTemplate.difficulty}
                    </Badge>
                    <span className="text-[10px] text-muted-foreground uppercase">Difficulty</span>
                    <span className="text-xs font-semibold text-white capitalize">{selectedTemplate.goal.replace("_", " ")}</span>
                  </div>
                </div>

                {/* Target muscles & equipment */}
                <div className="flex flex-col gap-2 border-t border-white/10 pt-4">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-muted-foreground">Target Muscles:</span>
                    <span className="text-white capitalize font-medium">{selectedTemplate.targetMuscles.join(", ")}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-muted-foreground">Equipment Required:</span>
                    <span className="text-white capitalize font-medium">{selectedTemplate.equipment.join(", ")}</span>
                  </div>
                </div>

                {/* Exercises list */}
                <div className="flex flex-col gap-2 border-t border-white/10 pt-4">
                  <h3 className="text-sm font-bold text-white mb-2">Exercises Library ({selectedTemplate.exercises.length})</h3>
                  
                  <div className="flex flex-col gap-2">
                    {selectedTemplate.exercises.map((ex, idx) => (
                      <div key={idx} className="bg-white/3 border border-white/5 rounded-xl p-3 flex flex-col gap-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground font-mono">{idx + 1}.</span>
                          <span className="text-sm font-semibold text-white">{ex.name}</span>
                          <Badge variant="outline" className="text-[9px] border-white/10 text-muted-foreground ml-auto">
                            {ex.sets.length} Sets
                          </Badge>
                        </div>

                        {/* Sets sub-table */}
                        <div className="grid grid-cols-4 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider border-b border-white/5 pb-1 text-center">
                          <span>Set</span>
                          <span>Type</span>
                          <span>Details</span>
                          <span>Target RPE</span>
                        </div>
                        <div className="flex flex-col">
                          {ex.sets.map((set, sIdx) => (
                            <div key={sIdx} className="grid grid-cols-4 text-xs py-1.5 border-t border-white/3 text-center items-center text-white/80">
                              <span className="text-muted-foreground">{sIdx + 1}</span>
                              <span className="capitalize text-[10px] text-emerald-400 font-medium">
                                {set.setType || "Normal"}
                              </span>
                              <span>
                                {set.reps ? `${set.reps} reps` : set.weightPlaceholder || "—"}
                              </span>
                              <span className="font-semibold text-amber-400">
                                {set.rpe ? `@ RPE ${set.rpe}` : "—"}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Warmup / Cooldown Coaching Notes */}
                {(selectedTemplate.notes || selectedTemplate.warmupNotes || selectedTemplate.cooldownNotes) && (
                  <div className="flex flex-col gap-3 border-t border-white/10 pt-4 bg-white/3 rounded-xl p-3 border border-white/5">
                    <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                      <Trophy className="w-4 h-4 text-amber-500" /> Coaching & Tips
                    </h3>
                    
                    {selectedTemplate.warmupNotes && (
                      <div className="text-xs">
                        <span className="font-bold text-emerald-400">Warm-up:</span>{" "}
                        <span className="text-white/70">{selectedTemplate.warmupNotes}</span>
                      </div>
                    )}

                    {selectedTemplate.notes && (
                      <div className="text-xs">
                        <span className="font-bold text-amber-400">Tips:</span>{" "}
                        <span className="text-white/70">{selectedTemplate.notes}</span>
                      </div>
                    )}

                    {selectedTemplate.cooldownNotes && (
                      <div className="text-xs">
                        <span className="font-bold text-cyan-400">Cool-down:</span>{" "}
                        <span className="text-white/70">{selectedTemplate.cooldownNotes}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Bottom Action Footer Panel */}
                <div className="fixed bottom-0 left-0 right-0 p-4 bg-black/85 backdrop-blur-xl border-t border-white/10 flex gap-3 z-20 sm:max-w-xl sm:mx-auto">
                  <Button
                    onClick={() => handleAddToLibrary(selectedTemplate)}
                    variant="outline"
                    className="flex-1 border-white/10 hover:bg-white/5 text-white h-12 rounded-xl"
                  >
                    <Bookmark className="w-4 h-4 mr-2" />
                    Save Library
                  </Button>
                  <Button
                    onClick={() => handleStartWorkout(selectedTemplate)}
                    className="flex-1 bg-gradient-to-r from-emerald-500 to-cyan-600 hover:from-emerald-600 hover:to-cyan-700 text-white font-semibold h-12 rounded-xl"
                  >
                    <Play className="w-4 h-4 mr-2 fill-current" />
                    Start Workout
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </SheetContent>
    </Sheet>
  );
}
