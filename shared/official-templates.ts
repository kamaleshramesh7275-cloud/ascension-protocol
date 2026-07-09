export interface TemplateExercise {
  name: string;
  sets: Array<{
    reps?: number;
    weightPlaceholder?: string;
    rpe?: number; // Target RPE
    restSeconds?: number;
    setType?: "normal" | "warmup" | "dropset" | "failure";
  }>;
}

export interface OfficialTemplate {
  id: string;
  name: string;
  description: string;
  category: "muscle_group" | "split" | "goal" | "level" | "equipment";
  splitType?: string; // PPL, Upper-Lower, Arnold, Bro Split, Full Body, etc.
  difficulty: "beginner" | "intermediate" | "advanced" | "elite";
  durationMinutes: number;
  daysPerWeek: number;
  targetMuscles: string[];
  equipment: string[];
  goal: "build_muscle" | "lose_fat" | "gain_strength" | "athletic" | "mobility" | "endurance";
  exercises: TemplateExercise[];
  notes?: string;
  warmupNotes?: string;
  cooldownNotes?: string;
}

export const OFFICIAL_TEMPLATES: OfficialTemplate[] = [
  // ── PUSH PULL LEGS (PPL) SPLIT ──────────────────────────────────────────────
  {
    id: "ppl_push_beginner",
    name: "Beginner PPL - Push Day",
    description: "Focuses on the chest, shoulders, and triceps. Designed to build foundational pushing strength.",
    category: "split",
    splitType: "Push Pull Legs",
    difficulty: "beginner",
    durationMinutes: 45,
    daysPerWeek: 3,
    targetMuscles: ["chest", "shoulders", "triceps"],
    equipment: ["barbell", "dumbbell", "machine"],
    goal: "build_muscle",
    notes: "Rest 90-120 seconds between sets. Focus on controlling the eccentric (lowering) phase.",
    warmupNotes: "5 mins light cardio + arm swings and light sets of chest press.",
    cooldownNotes: "Pec stretch, shoulder cross-body stretch, and overhead tricep stretch.",
    exercises: [
      {
        name: "Barbell Bench Press",
        sets: [
          { setType: "warmup", reps: 10, rpe: 5, restSeconds: 60 },
          { setType: "normal", reps: 8, rpe: 7, restSeconds: 90 },
          { setType: "normal", reps: 8, rpe: 7, restSeconds: 90 },
          { setType: "normal", reps: 8, rpe: 8, restSeconds: 90 }
        ]
      },
      {
        name: "Dumbbell Shoulder Press",
        sets: [
          { setType: "normal", reps: 10, rpe: 7, restSeconds: 90 },
          { setType: "normal", reps: 10, rpe: 7, restSeconds: 90 },
          { setType: "normal", reps: 10, rpe: 8, restSeconds: 90 }
        ]
      },
      {
        name: "Dumbbell Fly",
        sets: [
          { setType: "normal", reps: 12, rpe: 7, restSeconds: 60 },
          { setType: "normal", reps: 12, rpe: 8, restSeconds: 60 }
        ]
      },
      {
        name: "Triceps Pushdown",
        sets: [
          { setType: "normal", reps: 12, rpe: 8, restSeconds: 60 },
          { setType: "normal", reps: 12, rpe: 8, restSeconds: 60 },
          { setType: "dropset", reps: 15, rpe: 9, restSeconds: 60 }
        ]
      }
    ]
  },
  {
    id: "ppl_pull_beginner",
    name: "Beginner PPL - Pull Day",
    description: "Focuses on the back, biceps, and rear shoulders. Builds pull-up capability and pulling strength.",
    category: "split",
    splitType: "Push Pull Legs",
    difficulty: "beginner",
    durationMinutes: 45,
    daysPerWeek: 3,
    targetMuscles: ["back", "arms", "shoulders"],
    equipment: ["bodyweight", "barbell", "dumbbell", "cable"],
    goal: "build_muscle",
    notes: "Focus on pulling with your elbows rather than your hands to maximize lat engagement.",
    warmupNotes: "5 mins cardio + scapular pull-ups and light rows.",
    cooldownNotes: "Lat stretch, child's pose, and wrist/forearm stretch.",
    exercises: [
      {
        name: "Pull-Up",
        sets: [
          { setType: "normal", reps: 6, rpe: 7, restSeconds: 90 },
          { setType: "normal", reps: 6, rpe: 8, restSeconds: 90 },
          { setType: "normal", reps: 6, rpe: 8, restSeconds: 90 }
        ]
      },
      {
        name: "Barbell Row",
        sets: [
          { setType: "normal", reps: 8, rpe: 7, restSeconds: 90 },
          { setType: "normal", reps: 8, rpe: 8, restSeconds: 90 },
          { setType: "normal", reps: 8, rpe: 8, restSeconds: 90 }
        ]
      },
      {
        name: "Dumbbell Curl",
        sets: [
          { setType: "normal", reps: 12, rpe: 7, restSeconds: 60 },
          { setType: "normal", reps: 12, rpe: 8, restSeconds: 60 },
          { setType: "normal", reps: 12, rpe: 8, restSeconds: 60 }
        ]
      },
      {
        name: "Face Pull",
        sets: [
          { setType: "normal", reps: 15, rpe: 8, restSeconds: 60 },
          { setType: "normal", reps: 15, rpe: 8, restSeconds: 60 }
        ]
      }
    ]
  },
  {
    id: "ppl_legs_beginner",
    name: "Beginner PPL - Legs & Core",
    description: "Builds foundational lower body strength, targets quads, hamstrings, glutes, and abs.",
    category: "split",
    splitType: "Push Pull Legs",
    difficulty: "beginner",
    durationMinutes: 50,
    daysPerWeek: 3,
    targetMuscles: ["legs", "core"],
    equipment: ["barbell", "dumbbell", "bodyweight"],
    goal: "build_muscle",
    notes: "Keep your chest high during squats. Control the movement fully.",
    warmupNotes: "5 mins leg cycling + bodyweight squats and hip openers.",
    cooldownNotes: "Quad stretch, hamstring stretch, glute stretch, and calf stretch.",
    exercises: [
      {
        name: "Barbell Squat",
        sets: [
          { setType: "warmup", reps: 8, rpe: 5, restSeconds: 60 },
          { setType: "normal", reps: 8, rpe: 7, restSeconds: 120 },
          { setType: "normal", reps: 8, rpe: 7, restSeconds: 120 },
          { setType: "normal", reps: 8, rpe: 8, restSeconds: 120 }
        ]
      },
      {
        name: "Romanian Deadlift",
        sets: [
          { setType: "normal", reps: 10, rpe: 7, restSeconds: 90 },
          { setType: "normal", reps: 10, rpe: 7, restSeconds: 90 },
          { setType: "normal", reps: 10, rpe: 8, restSeconds: 90 }
        ]
      },
      {
        name: "Standing Calf Raise",
        sets: [
          { setType: "normal", reps: 15, rpe: 8, restSeconds: 60 },
          { setType: "normal", reps: 15, rpe: 8, restSeconds: 60 }
        ]
      },
      {
        name: "Plank",
        sets: [
          { setType: "normal", durationSeconds: 45, rpe: 8, restSeconds: 60 },
          { setType: "normal", durationSeconds: 45, rpe: 8, restSeconds: 60 }
        ]
      }
    ]
  },

  // ── UPPER LOWER SPLIT ────────────────────────────────────────────────────────
  {
    id: "upper_lower_upper_int",
    name: "Upper Body Hypertrophy",
    description: "An intermediate 4-day upper/lower split workout focusing on muscle growth across the chest, back, shoulders, and arms.",
    category: "split",
    splitType: "Upper Lower",
    difficulty: "intermediate",
    durationMinutes: 60,
    daysPerWeek: 4,
    targetMuscles: ["chest", "back", "shoulders", "arms"],
    equipment: ["barbell", "dumbbell", "cable", "machine"],
    goal: "build_muscle",
    notes: "Focus on mind-muscle connection and progressive overload.",
    exercises: [
      {
        name: "Incline Barbell Bench Press",
        sets: [
          { setType: "normal", reps: 8, rpe: 8, restSeconds: 90 },
          { setType: "normal", reps: 8, rpe: 8, restSeconds: 90 },
          { setType: "normal", reps: 8, rpe: 8, restSeconds: 90 }
        ]
      },
      {
        name: "Lat Pulldown",
        sets: [
          { setType: "normal", reps: 10, rpe: 8, restSeconds: 90 },
          { setType: "normal", reps: 10, rpe: 8, restSeconds: 90 },
          { setType: "normal", reps: 10, rpe: 8, restSeconds: 90 }
        ]
      },
      {
        name: "Dumbbell Shoulder Press",
        sets: [
          { setType: "normal", reps: 10, rpe: 8, restSeconds: 90 },
          { setType: "normal", reps: 10, rpe: 8, restSeconds: 90 }
        ]
      },
      {
        name: "Dumbbell Row",
        sets: [
          { setType: "normal", reps: 10, rpe: 8, restSeconds: 90 },
          { setType: "normal", reps: 10, rpe: 8, restSeconds: 90 }
        ]
      },
      {
        name: "Lateral Raise",
        sets: [
          { setType: "normal", reps: 12, rpe: 8, restSeconds: 60 },
          { setType: "normal", reps: 12, rpe: 9, restSeconds: 60 }
        ]
      },
      {
        name: "Hammer Curl",
        sets: [
          { setType: "normal", reps: 12, rpe: 8, restSeconds: 60 },
          { setType: "normal", reps: 12, rpe: 8, restSeconds: 60 }
        ]
      }
    ]
  },
  {
    id: "upper_lower_lower_int",
    name: "Lower Body Hypertrophy",
    description: "An intermediate lower body workout targeting the quads, hamstrings, glutes, and calves with hypertrophy-focused ranges.",
    category: "split",
    splitType: "Upper Lower",
    difficulty: "intermediate",
    durationMinutes: 60,
    daysPerWeek: 4,
    targetMuscles: ["legs"],
    equipment: ["barbell", "machine", "dumbbell"],
    goal: "build_muscle",
    notes: "Take deep breaths and focus on quality reps. Ensure full depth on squats.",
    exercises: [
      {
        name: "Barbell Squat",
        sets: [
          { setType: "normal", reps: 8, rpe: 8, restSeconds: 120 },
          { setType: "normal", reps: 8, rpe: 8, restSeconds: 120 },
          { setType: "normal", reps: 8, rpe: 8, restSeconds: 120 }
        ]
      },
      {
        name: "Romanian Deadlift",
        sets: [
          { setType: "normal", reps: 10, rpe: 8, restSeconds: 90 },
          { setType: "normal", reps: 10, rpe: 8, restSeconds: 90 },
          { setType: "normal", reps: 10, rpe: 8, restSeconds: 90 }
        ]
      },
      {
        name: "Leg Press",
        sets: [
          { setType: "normal", reps: 12, rpe: 8, restSeconds: 90 },
          { setType: "normal", reps: 12, rpe: 8, restSeconds: 90 }
        ]
      },
      {
        name: "Leg Curl",
        sets: [
          { setType: "normal", reps: 12, rpe: 8, restSeconds: 60 },
          { setType: "normal", reps: 12, rpe: 8, restSeconds: 60 }
        ]
      },
      {
        name: "Seated Calf Raise",
        sets: [
          { setType: "normal", reps: 15, rpe: 8, restSeconds: 60 },
          { setType: "normal", reps: 15, rpe: 8, restSeconds: 60 }
        ]
      }
    ]
  },

  // ── MUSCLE GROUP SPECIFIC ───────────────────────────────────────────────────
  {
    id: "muscle_chest_focus",
    name: "Chest Hypertrophy Specialization",
    description: "An advanced chest routine targeting upper, mid, and lower pectorals for maximum chest expansion and density.",
    category: "muscle_group",
    difficulty: "advanced",
    durationMinutes: 50,
    daysPerWeek: 1,
    targetMuscles: ["chest"],
    equipment: ["barbell", "dumbbell", "cable"],
    goal: "build_muscle",
    notes: "Focus on stretch at the bottom and hard squeezes at the top.",
    exercises: [
      {
        name: "Barbell Bench Press",
        sets: [
          { setType: "normal", reps: 6, rpe: 8, restSeconds: 120 },
          { setType: "normal", reps: 6, rpe: 8, restSeconds: 120 },
          { setType: "normal", reps: 6, rpe: 9, restSeconds: 120 }
        ]
      },
      {
        name: "Incline Dumbbell Bench Press",
        sets: [
          { setType: "normal", reps: 8, rpe: 8, restSeconds: 90 },
          { setType: "normal", reps: 8, rpe: 8, restSeconds: 90 },
          { setType: "normal", reps: 8, rpe: 9, restSeconds: 90 }
        ]
      },
      {
        name: "Cable Crossover",
        sets: [
          { setType: "normal", reps: 12, rpe: 8, restSeconds: 60 },
          { setType: "normal", reps: 12, rpe: 8, restSeconds: 60 },
          { setType: "dropset", reps: 15, rpe: 9, restSeconds: 60 }
        ]
      },
      {
        name: "Chest Dip",
        sets: [
          { setType: "normal", reps: 10, rpe: 8, restSeconds: 90 },
          { setType: "failure", reps: 15, rpe: 10, restSeconds: 90 }
        ]
      }
    ]
  },
  {
    id: "muscle_back_focus",
    name: "Back Width & Thickness Specialization",
    description: "A comprehensive back routine focusing on the latissimus dorsi, rhomboids, traps, and erectors.",
    category: "muscle_group",
    difficulty: "advanced",
    durationMinutes: 55,
    daysPerWeek: 1,
    targetMuscles: ["back"],
    equipment: ["barbell", "cable", "bodyweight"],
    goal: "build_muscle",
    notes: "Pull with your elbows, squeeze your shoulder blades together on row movements.",
    exercises: [
      {
        name: "Deadlift",
        sets: [
          { setType: "normal", reps: 5, rpe: 7, restSeconds: 150 },
          { setType: "normal", reps: 5, rpe: 8, restSeconds: 150 },
          { setType: "normal", reps: 5, rpe: 8, restSeconds: 150 }
        ]
      },
      {
        name: "Pull-Up",
        sets: [
          { setType: "normal", reps: 8, rpe: 8, restSeconds: 90 },
          { setType: "normal", reps: 8, rpe: 8, restSeconds: 90 },
          { setType: "normal", reps: 8, rpe: 8, restSeconds: 90 }
        ]
      },
      {
        name: "Barbell Row",
        sets: [
          { setType: "normal", reps: 8, rpe: 8, restSeconds: 90 },
          { setType: "normal", reps: 8, rpe: 8, restSeconds: 90 },
          { setType: "normal", reps: 8, rpe: 9, restSeconds: 90 }
        ]
      },
      {
        name: "Lat Pulldown",
        sets: [
          { setType: "normal", reps: 12, rpe: 8, restSeconds: 60 },
          { setType: "normal", reps: 12, rpe: 8, restSeconds: 60 }
        ]
      }
    ]
  },

  // ── GOAL SPECIFIC (STRENGTH / FAT LOSS) ──────────────────────────────────────
  {
    id: "goal_strength_power",
    name: "Powerlifter's Bench & Squat Focus",
    description: "A strength-focused program designed to build maximal push and leg strength with low repetition, high intensity work.",
    category: "goal",
    difficulty: "advanced",
    durationMinutes: 65,
    daysPerWeek: 3,
    targetMuscles: ["chest", "legs", "shoulders"],
    equipment: ["barbell"],
    goal: "gain_strength",
    notes: "Rest 3-5 minutes on heavy sets to maximize ATP recovery. Keep RPE precise.",
    exercises: [
      {
        name: "Barbell Squat",
        sets: [
          { setType: "normal", reps: 5, rpe: 7, restSeconds: 180 },
          { setType: "normal", reps: 5, rpe: 8, restSeconds: 180 },
          { setType: "normal", reps: 5, rpe: 8, restSeconds: 180 },
          { setType: "normal", reps: 3, rpe: 9, restSeconds: 240 }
        ]
      },
      {
        name: "Barbell Bench Press",
        sets: [
          { setType: "normal", reps: 5, rpe: 7, restSeconds: 180 },
          { setType: "normal", reps: 5, rpe: 8, restSeconds: 180 },
          { setType: "normal", reps: 5, rpe: 8, restSeconds: 180 },
          { setType: "normal", reps: 3, rpe: 9, restSeconds: 240 }
        ]
      },
      {
        name: "Overhead Press",
        sets: [
          { setType: "normal", reps: 6, rpe: 8, restSeconds: 120 },
          { setType: "normal", reps: 6, rpe: 8, restSeconds: 120 }
        ]
      }
    ]
  },
  {
    id: "goal_fat_loss_circuit",
    name: "High Intensity Fat Burn Circuit",
    description: "A full-body metabolic conditioning circuit designed to maximize caloric burn and improve endurance.",
    category: "goal",
    difficulty: "intermediate",
    durationMinutes: 30,
    daysPerWeek: 4,
    targetMuscles: ["full_body"],
    equipment: ["bodyweight", "dumbbell", "kettlebell"],
    goal: "lose_fat",
    notes: "Rest as little as possible between exercises. Rest 2 minutes between circuits.",
    exercises: [
      {
        name: "Burpee",
        sets: [
          { setType: "normal", reps: 15, rpe: 8, restSeconds: 15 },
          { setType: "normal", reps: 15, rpe: 8, restSeconds: 15 },
          { setType: "normal", reps: 15, rpe: 9, restSeconds: 15 }
        ]
      },
      {
        name: "Kettlebell Swing",
        sets: [
          { setType: "normal", reps: 20, rpe: 8, restSeconds: 15 },
          { setType: "normal", reps: 20, rpe: 8, restSeconds: 15 },
          { setType: "normal", reps: 20, rpe: 9, restSeconds: 15 }
        ]
      },
      {
        name: "Push-Up",
        sets: [
          { setType: "normal", reps: 15, rpe: 8, restSeconds: 15 },
          { setType: "normal", reps: 15, rpe: 8, restSeconds: 15 },
          { setType: "normal", reps: 15, rpe: 9, restSeconds: 15 }
        ]
      },
      {
        name: "Jump Rope",
        sets: [
          { setType: "normal", durationSeconds: 60, rpe: 8, restSeconds: 60 },
          { setType: "normal", durationSeconds: 60, rpe: 8, restSeconds: 60 }
        ]
      }
    ]
  },

  // ── EQUIPMENT SPECIFIC (HOME / DUMBBELL ONLY) ──────────────────────────────
  {
    id: "equipment_dumbbell_only",
    name: "Dumbbell Only Full Body Routine",
    description: "No gym or barbell required. A comprehensive muscle building routine using only a pair of dumbbells.",
    category: "equipment",
    difficulty: "beginner",
    durationMinutes: 40,
    daysPerWeek: 3,
    targetMuscles: ["full_body"],
    equipment: ["dumbbell", "bodyweight"],
    goal: "build_muscle",
    notes: "Make sure you choose a weight challenging enough for the target rep range.",
    exercises: [
      {
        name: "Dumbbell Bench Press",
        sets: [
          { setType: "normal", reps: 10, rpe: 7, restSeconds: 60 },
          { setType: "normal", reps: 10, rpe: 8, restSeconds: 60 },
          { setType: "normal", reps: 10, rpe: 8, restSeconds: 60 }
        ]
      },
      {
        name: "Dumbbell Row",
        sets: [
          { setType: "normal", reps: 10, rpe: 7, restSeconds: 60 },
          { setType: "normal", reps: 10, rpe: 8, restSeconds: 60 },
          { setType: "normal", reps: 10, rpe: 8, restSeconds: 60 }
        ]
      },
      {
        name: "Goblet Squat",
        sets: [
          { setType: "normal", reps: 12, rpe: 7, restSeconds: 90 },
          { setType: "normal", reps: 12, rpe: 8, restSeconds: 90 },
          { setType: "normal", reps: 12, rpe: 8, restSeconds: 90 }
        ]
      },
      {
        name: "Dumbbell Shoulder Press",
        sets: [
          { setType: "normal", reps: 10, rpe: 8, restSeconds: 60 },
          { setType: "normal", reps: 10, rpe: 8, restSeconds: 60 }
        ]
      }
    ]
  },
  {
    id: "equipment_bodyweight_only",
    name: "Calisthenics & Bodyweight Warrior",
    description: "Build muscle, control, and endurance using solely your bodyweight. Ideal for outdoor parks or home.",
    category: "equipment",
    difficulty: "intermediate",
    durationMinutes: 35,
    daysPerWeek: 4,
    targetMuscles: ["full_body"],
    equipment: ["bodyweight"],
    goal: "endurance",
    notes: "Focus on controlled movements and maximum muscle contraction.",
    exercises: [
      {
        name: "Pull-Up",
        sets: [
          { setType: "normal", reps: 8, rpe: 8, restSeconds: 90 },
          { setType: "normal", reps: 8, rpe: 8, restSeconds: 90 },
          { setType: "normal", reps: 8, rpe: 8, restSeconds: 90 }
        ]
      },
      {
        name: "Push-Up",
        sets: [
          { setType: "normal", reps: 20, rpe: 8, restSeconds: 60 },
          { setType: "normal", reps: 20, rpe: 8, restSeconds: 60 },
          { setType: "failure", reps: 25, rpe: 10, restSeconds: 60 }
        ]
      },
      {
        name: "Leg Raise",
        sets: [
          { setType: "normal", reps: 15, rpe: 8, restSeconds: 45 },
          { setType: "normal", reps: 15, rpe: 8, restSeconds: 45 }
        ]
      },
      {
        name: "Lunges",
        sets: [
          { setType: "normal", reps: 20, rpe: 8, restSeconds: 60 },
          { setType: "normal", reps: 20, rpe: 8, restSeconds: 60 }
        ]
      }
    ]
  }
];
