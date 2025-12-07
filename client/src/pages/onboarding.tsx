import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { insertUserSchema, type InsertUser } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, ChevronLeft, Check, Dumbbell, Brain, Activity, Briefcase, Users, Sparkles, Target } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

function useWindowSize() {
    const [windowSize, setWindowSize] = useState({
        width: typeof window !== "undefined" ? window.innerWidth : 0,
        height: typeof window !== "undefined" ? window.innerHeight : 0,
    });

    useEffect(() => {
        function handleResize() {
            setWindowSize({
                width: window.innerWidth,
                height: window.innerHeight,
            });
        }

        window.addEventListener("resize", handleResize);
        handleResize();

        return () => window.removeEventListener("resize", handleResize);
    }, []);

    return windowSize;
}

import { z } from "zod";

// Define the schema for the onboarding form
const onboardingSchema = z.object({
    age: z.number(),
    weight: z.number(),
    height: z.number(),
    pushups: z.number(),
    pullups: z.number(),
    intelligence: z.number(),
    willpower: z.number(),
    charisma: z.number(),
    vitality: z.number(),
    currentGoal: z.string().min(1, "Please select a goal"),
});

type OnboardingData = {
    age: number;
    weight: number;
    height: number;
    pushups: number;
    pullups: number;
    intelligence: number;
    willpower: number;
    charisma: number;
    vitality: number;
    currentGoal: string;
};

const CATEGORIES = [
    { id: "fitness", label: "Fitness", icon: Dumbbell, description: "Strength, Endurance, Health" },
    { id: "intellect", label: "Intellect", icon: Brain, description: "Learning, Skills, Reading" },
    { id: "wealth", label: "Wealth", icon: Briefcase, description: "Career, Business, Finance" },
    { id: "social", label: "Social", icon: Users, description: "Charisma, Networking, Relationships" },
    { id: "mindfulness", label: "Mindfulness", icon: Sparkles, description: "Meditation, Mental Health, Willpower" },
];

export default function OnboardingPage() {
    const { user } = useAuth();
    const [, setLocation] = useLocation();
    const queryClient = useQueryClient();
    const [currentStep, setCurrentStep] = useState(1);
    const [direction, setDirection] = useState(0);
    const { width, height } = useWindowSize();
    const [showConfetti, setShowConfetti] = useState(false);

    const form = useForm<OnboardingData>({
        resolver: zodResolver(onboardingSchema),
        defaultValues: {
            age: 25,
            weight: 70,
            height: 175,
            pushups: 0,
            pullups: 0,
            intelligence: 5,
            willpower: 5,
            charisma: 5,
            vitality: 5,
            currentGoal: "",
        },
    });

    const [category, setCategory] = useState<string>("fitness");
    const [specificGoal, setSpecificGoal] = useState<string>("");

    // Update form value when category or specific goal changes
    useEffect(() => {
        if (specificGoal) {
            form.setValue("currentGoal", `${category}:${specificGoal}`);
        }
    }, [category, specificGoal, form]);

    const mutation = useMutation({
        mutationFn: async (data: OnboardingData) => {
            if (!user) throw new Error("User not authenticated");

            const res = await fetch("/api/onboarding", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "x-firebase-uid": user.uid
                },
                body: JSON.stringify(data),
            });
            if (!res.ok) throw new Error("Failed to update profile");
            return res.json();
        },
        onSuccess: async (data) => {
            // Update the cache with the new user data
            queryClient.setQueryData(["/api/user"], data);
            // Invalidate to ensure fresh data
            await queryClient.invalidateQueries({ queryKey: ["/api/user"] });
            // Small delay to ensure state updates
            await new Promise(resolve => setTimeout(resolve, 100));
            // Navigate using wouter
            setLocation("/dashboard");
        },
    });

    const onSubmit = (data: OnboardingData) => {
        mutation.mutate(data);
    };

    const nextStep = async (e?: React.MouseEvent<HTMLButtonElement>) => {
        e?.preventDefault();
        const fields = getFieldsForStep(currentStep);
        const isValid = await form.trigger(fields as any);

        if (isValid) {
            setDirection(1);
            setCurrentStep((prev) => prev + 1);
        }
    };

    const prevStep = (e?: React.MouseEvent<HTMLButtonElement>) => {
        e?.preventDefault();
        setDirection(-1);
        setCurrentStep((prev) => prev - 1);
    };

    const getFieldsForStep = (step: number) => {
        switch (step) {
            case 1: return ["age", "weight", "height"];
            case 2: return ["pushups", "pullups"];
            case 3: return ["intelligence", "willpower", "charisma", "vitality"];
            case 4: return ["currentGoal"];
            default: return [];
        }
    };

    const variants = {
        enter: (direction: number) => ({
            x: direction > 0 ? 50 : -50,
            opacity: 0,
        }),
        center: {
            x: 0,
            opacity: 1,
        },
        exit: (direction: number) => ({
            x: direction < 0 ? 50 : -50,
            opacity: 0,
        }),
    };

    return (
        <div className="min-h-screen w-full bg-black text-white flex items-center justify-center p-4 overflow-hidden relative">
            {/* Enhanced Dynamic Background */}
            <div className="absolute inset-0 z-0 overflow-hidden">
                {/* Base gradient */}
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-900 via-[#0a0a0a] to-black" />

                {/* Animated gradient orbs */}
                <motion.div
                    animate={{
                        scale: [1, 1.3, 1],
                        opacity: [0.4, 0.6, 0.4],
                        rotate: [0, 180, 0]
                    }}
                    transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
                    className="absolute top-[-30%] left-[-20%] w-[80%] h-[80%] bg-gradient-to-br from-purple-600/30 via-violet-500/20 to-purple-900/30 rounded-full blur-[150px]"
                />
                <motion.div
                    animate={{
                        scale: [1, 1.2, 1],
                        opacity: [0.3, 0.5, 0.3],
                        rotate: [0, -120, 0]
                    }}
                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                    className="absolute bottom-[-30%] right-[-20%] w-[80%] h-[80%] bg-gradient-to-tl from-blue-600/30 via-cyan-500/20 to-blue-900/30 rounded-full blur-[150px]"
                />
                <motion.div
                    animate={{
                        scale: [1, 1.4, 1],
                        opacity: [0.2, 0.4, 0.2],
                        x: [0, 100, 0],
                        y: [0, -50, 0]
                    }}
                    transition={{ duration: 30, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute top-[20%] right-[10%] w-[60%] h-[60%] bg-gradient-to-br from-pink-500/25 via-rose-400/15 to-red-500/25 rounded-full blur-[120px]"
                />
                <motion.div
                    animate={{
                        scale: [1, 1.25, 1],
                        opacity: [0.25, 0.45, 0.25],
                        x: [0, -80, 0],
                        y: [0, 60, 0]
                    }}
                    transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute bottom-[30%] left-[15%] w-[50%] h-[50%] bg-gradient-to-tr from-emerald-500/25 via-teal-400/15 to-green-500/25 rounded-full blur-[110px]"
                />

                {/* Floating particles */}
                {[...Array(8)].map((_, i) => (
                    <motion.div
                        key={i}
                        animate={{
                            y: [0, -30, 0],
                            x: [0, Math.sin(i) * 20, 0],
                            opacity: [0.1, 0.3, 0.1],
                            scale: [1, 1.2, 1]
                        }}
                        transition={{
                            duration: 8 + i * 2,
                            repeat: Infinity,
                            ease: "easeInOut",
                            delay: i * 0.5
                        }}
                        className="absolute w-32 h-32 rounded-full"
                        style={{
                            left: `${10 + i * 12}%`,
                            top: `${15 + (i % 3) * 25}%`,
                            background: `radial-gradient(circle, ${['rgba(139, 92, 246, 0.15)', 'rgba(59, 130, 246, 0.15)', 'rgba(236, 72, 153, 0.15)',
                                'rgba(16, 185, 129, 0.15)', 'rgba(251, 146, 60, 0.15)', 'rgba(168, 85, 247, 0.15)',
                                'rgba(14, 165, 233, 0.15)', 'rgba(244, 63, 94, 0.15)'][i]
                                } 0%, transparent 70%)`,
                        }}
                    />
                ))}

                {/* Noise texture overlay */}
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay" />

                {/* Radial light effect */}
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(120,119,198,0.1),transparent_50%)]" />
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-2xl z-10"
            >
                <Card className="border-white/10 bg-black/40 backdrop-blur-xl shadow-2xl overflow-hidden">
                    <CardHeader className="text-center pb-2">
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: "spring", stiffness: 260, damping: 20 }}
                            className="w-16 h-16 mx-auto bg-gradient-to-br from-primary to-purple-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-primary/20"
                        >
                            {currentStep === 1 && <Activity className="w-8 h-8 text-white" />}
                            {currentStep === 2 && <Dumbbell className="w-8 h-8 text-white" />}
                            {currentStep === 3 && <Brain className="w-8 h-8 text-white" />}
                            {currentStep === 4 && <Target className="w-8 h-8 text-white" />}
                        </motion.div>
                        <CardTitle className="text-3xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
                            System Initialization
                        </CardTitle>
                        <CardDescription className="text-lg">
                            Calibrating your baseline metrics for the Ascension Protocol.
                        </CardDescription>
                    </CardHeader>

                    <div className="px-8 py-2">
                        <div className="flex justify-between mb-2 text-sm font-medium text-muted-foreground">
                            <span>Progress</span>
                            <span>Step {currentStep} of 4</span>
                        </div>
                        <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
                            <motion.div
                                className="h-full bg-gradient-to-r from-primary to-purple-500"
                                initial={{ width: "25%" }}
                                animate={{ width: `${(currentStep / 4) * 100}%` }}
                                transition={{ duration: 0.5 }}
                            />
                        </div>
                    </div>

                    <CardContent className="p-8">
                        <form onSubmit={form.handleSubmit(onSubmit)}>
                            <AnimatePresence custom={direction} mode="wait">
                                <motion.div
                                    key={currentStep}
                                    custom={direction}
                                    variants={variants}
                                    initial="enter"
                                    animate="center"
                                    exit="exit"
                                    transition={{ x: { type: "spring", stiffness: 300, damping: 30 }, opacity: { duration: 0.2 } }}
                                >
                                    {currentStep === 1 && (
                                        <div className="space-y-6">
                                            <div className="space-y-4">
                                                <h3 className="text-xl font-semibold text-primary">Biometrics</h3>
                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                                    <div className="space-y-2">
                                                        <Label htmlFor="age">Age</Label>
                                                        <Input
                                                            id="age"
                                                            type="number"
                                                            {...form.register("age", { valueAsNumber: true })}
                                                            className="bg-white/5 border-white/10 focus:border-primary/50 transition-colors text-lg h-12"
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label htmlFor="weight">Weight (kg)</Label>
                                                        <Input
                                                            id="weight"
                                                            type="number"
                                                            {...form.register("weight", { valueAsNumber: true })}
                                                            className="bg-white/5 border-white/10 focus:border-primary/50 transition-colors text-lg h-12"
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label htmlFor="height">Height (cm)</Label>
                                                        <Input
                                                            id="height"
                                                            type="number"
                                                            {...form.register("height", { valueAsNumber: true })}
                                                            className="bg-white/5 border-white/10 focus:border-primary/50 transition-colors text-lg h-12"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {currentStep === 2 && (
                                        <div className="space-y-6">
                                            <div className="space-y-4">
                                                <h3 className="text-xl font-semibold text-primary">Physical Baseline</h3>
                                                <p className="text-sm text-muted-foreground">Enter your max reps for a single set.</p>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                    <div className="space-y-2">
                                                        <Label htmlFor="pushups">Max Pushups</Label>
                                                        <Input
                                                            id="pushups"
                                                            type="number"
                                                            {...form.register("pushups", { valueAsNumber: true })}
                                                            className="bg-white/5 border-white/10 focus:border-primary/50 transition-colors text-lg h-12"
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label htmlFor="pullups">Max Pullups</Label>
                                                        <Input
                                                            id="pullups"
                                                            type="number"
                                                            {...form.register("pullups", { valueAsNumber: true })}
                                                            className="bg-white/5 border-white/10 focus:border-primary/50 transition-colors text-lg h-12"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {currentStep === 3 && (
                                        <div className="space-y-6">
                                            <div className="space-y-4">
                                                <h3 className="text-xl font-semibold text-primary">Mental & Social Baseline</h3>
                                                <p className="text-sm text-muted-foreground">Rate yourself from 1 (Novice) to 10 (Master).</p>

                                                {[
                                                    { name: "intelligence", label: "Intelligence (Problem Solving, Learning)" },
                                                    { name: "willpower", label: "Willpower (Discipline, Focus)" },
                                                    { name: "charisma", label: "Charisma (Social Skills, Leadership)" },
                                                    { name: "vitality", label: "Vitality (Energy, Health)" }
                                                ].map((stat) => (
                                                    <div key={stat.name} className="space-y-3">
                                                        <div className="flex justify-between">
                                                            <Label>{stat.label}</Label>
                                                            <span className="font-bold text-primary">{form.watch(stat.name as any)}/10</span>
                                                        </div>
                                                        <Slider
                                                            defaultValue={[5]}
                                                            max={10}
                                                            min={1}
                                                            step={1}
                                                            onValueChange={(vals) => form.setValue(stat.name as any, vals[0])}
                                                            className="py-2"
                                                        />
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {currentStep === 4 && (
                                        <div className="space-y-6">
                                            <div className="space-y-4">
                                                <h3 className="text-xl font-semibold text-primary">Choose Your Path</h3>
                                                <p className="text-sm text-muted-foreground">Select a focus area to align your daily quests.</p>

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
                                                        className="bg-white/5 border-white/10 focus:border-primary/50 transition-colors text-lg h-12"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </motion.div>
                            </AnimatePresence>

                            <div className="flex justify-between mt-8 pt-4 border-t border-white/10">
                                <Button
                                    type="button"
                                    variant="ghost"
                                    onClick={prevStep}
                                    disabled={currentStep === 1}
                                    className="hover:bg-white/5"
                                >
                                    <ChevronLeft className="mr-2 h-4 w-4" /> Previous
                                </Button>

                                {currentStep < 4 ? (
                                    <Button
                                        type="button"
                                        onClick={nextStep}
                                        className="bg-primary hover:bg-primary/90 text-white px-8"
                                    >
                                        Next Step <ChevronRight className="ml-2 h-4 w-4" />
                                    </Button>
                                ) : (
                                    <Button
                                        type="submit"
                                        disabled={mutation.isPending}
                                        className="bg-gradient-to-r from-primary to-purple-600 hover:opacity-90 text-white px-8 shadow-lg shadow-primary/25"
                                    >
                                        {mutation.isPending ? (
                                            "Initializing..."
                                        ) : (
                                            <>Complete Initialization <Check className="ml-2 h-4 w-4" /></>
                                        )}
                                    </Button>
                                )}
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </motion.div>
        </div>
    );
}
