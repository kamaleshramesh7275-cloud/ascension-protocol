import { InsertExercise } from "@shared/schema";

export const DEFAULT_EXERCISES: InsertExercise[] = [
  // CHEST
  { name: "Barbell Bench Press", category: "strength", muscleGroup: "chest", equipment: "barbell" },
  { name: "Incline Barbell Bench Press", category: "strength", muscleGroup: "chest", equipment: "barbell" },
  { name: "Decline Barbell Bench Press", category: "strength", muscleGroup: "chest", equipment: "barbell" },
  { name: "Dumbbell Bench Press", category: "strength", muscleGroup: "chest", equipment: "dumbbell" },
  { name: "Incline Dumbbell Bench Press", category: "strength", muscleGroup: "chest", equipment: "dumbbell" },
  { name: "Dumbbell Fly", category: "strength", muscleGroup: "chest", equipment: "dumbbell" },
  { name: "Cable Crossover", category: "strength", muscleGroup: "chest", equipment: "cable" },
  { name: "Push-Up", category: "strength", muscleGroup: "chest", equipment: "bodyweight" },
  { name: "Chest Dip", category: "strength", muscleGroup: "chest", equipment: "bodyweight" },
  { name: "Machine Chest Press", category: "strength", muscleGroup: "chest", equipment: "machine" },
  { name: "Machine Fly", category: "strength", muscleGroup: "chest", equipment: "machine" },

  // BACK
  { name: "Deadlift", category: "strength", muscleGroup: "back", equipment: "barbell" },
  { name: "Pull-Up", category: "strength", muscleGroup: "back", equipment: "bodyweight" },
  { name: "Chin-Up", category: "strength", muscleGroup: "back", equipment: "bodyweight" },
  { name: "Barbell Row", category: "strength", muscleGroup: "back", equipment: "barbell" },
  { name: "Dumbbell Row", category: "strength", muscleGroup: "back", equipment: "dumbbell" },
  { name: "Lat Pulldown", category: "strength", muscleGroup: "back", equipment: "cable" },
  { name: "Seated Cable Row", category: "strength", muscleGroup: "back", equipment: "cable" },
  { name: "T-Bar Row", category: "strength", muscleGroup: "back", equipment: "machine" },
  { name: "Machine Row", category: "strength", muscleGroup: "back", equipment: "machine" },
  { name: "Back Extension", category: "strength", muscleGroup: "back", equipment: "bodyweight" },
  { name: "Straight Arm Pulldown", category: "strength", muscleGroup: "back", equipment: "cable" },
  { name: "Face Pull", category: "strength", muscleGroup: "back", equipment: "cable" },

  // LEGS
  { name: "Barbell Squat", category: "strength", muscleGroup: "legs", equipment: "barbell" },
  { name: "Front Squat", category: "strength", muscleGroup: "legs", equipment: "barbell" },
  { name: "Leg Press", category: "strength", muscleGroup: "legs", equipment: "machine" },
  { name: "Romanian Deadlift", category: "strength", muscleGroup: "legs", equipment: "barbell" },
  { name: "Stiff-Legged Deadlift", category: "strength", muscleGroup: "legs", equipment: "barbell" },
  { name: "Lunges", category: "strength", muscleGroup: "legs", equipment: "dumbbell" },
  { name: "Bulgarian Split Squat", category: "strength", muscleGroup: "legs", equipment: "dumbbell" },
  { name: "Leg Extension", category: "strength", muscleGroup: "legs", equipment: "machine" },
  { name: "Leg Curl", category: "strength", muscleGroup: "legs", equipment: "machine" },
  { name: "Standing Calf Raise", category: "strength", muscleGroup: "legs", equipment: "machine" },
  { name: "Seated Calf Raise", category: "strength", muscleGroup: "legs", equipment: "machine" },
  { name: "Hip Thrust", category: "strength", muscleGroup: "legs", equipment: "barbell" },
  { name: "Goblet Squat", category: "strength", muscleGroup: "legs", equipment: "dumbbell" },

  // SHOULDERS
  { name: "Overhead Press", category: "strength", muscleGroup: "shoulders", equipment: "barbell" },
  { name: "Dumbbell Shoulder Press", category: "strength", muscleGroup: "shoulders", equipment: "dumbbell" },
  { name: "Arnold Press", category: "strength", muscleGroup: "shoulders", equipment: "dumbbell" },
  { name: "Lateral Raise", category: "strength", muscleGroup: "shoulders", equipment: "dumbbell" },
  { name: "Cable Lateral Raise", category: "strength", muscleGroup: "shoulders", equipment: "cable" },
  { name: "Front Raise", category: "strength", muscleGroup: "shoulders", equipment: "dumbbell" },
  { name: "Reverse Pec Deck", category: "strength", muscleGroup: "shoulders", equipment: "machine" },
  { name: "Upright Row", category: "strength", muscleGroup: "shoulders", equipment: "barbell" },
  { name: "Barbell Shrug", category: "strength", muscleGroup: "shoulders", equipment: "barbell" },
  { name: "Dumbbell Shrug", category: "strength", muscleGroup: "shoulders", equipment: "dumbbell" },

  // ARMS
  { name: "Barbell Curl", category: "strength", muscleGroup: "arms", equipment: "barbell" },
  { name: "Dumbbell Curl", category: "strength", muscleGroup: "arms", equipment: "dumbbell" },
  { name: "Hammer Curl", category: "strength", muscleGroup: "arms", equipment: "dumbbell" },
  { name: "Preacher Curl", category: "strength", muscleGroup: "arms", equipment: "barbell" },
  { name: "Cable Curl", category: "strength", muscleGroup: "arms", equipment: "cable" },
  { name: "Triceps Pushdown", category: "strength", muscleGroup: "arms", equipment: "cable" },
  { name: "Overhead Triceps Extension", category: "strength", muscleGroup: "arms", equipment: "dumbbell" },
  { name: "Skullcrusher", category: "strength", muscleGroup: "arms", equipment: "barbell" },
  { name: "Triceps Dip", category: "strength", muscleGroup: "arms", equipment: "bodyweight" },
  { name: "Close Grip Bench Press", category: "strength", muscleGroup: "arms", equipment: "barbell" },

  // CORE
  { name: "Crunch", category: "strength", muscleGroup: "core", equipment: "bodyweight" },
  { name: "Plank", category: "strength", muscleGroup: "core", equipment: "bodyweight" },
  { name: "Leg Raise", category: "strength", muscleGroup: "core", equipment: "bodyweight" },
  { name: "Hanging Leg Raise", category: "strength", muscleGroup: "core", equipment: "bodyweight" },
  { name: "Russian Twist", category: "strength", muscleGroup: "core", equipment: "bodyweight" },
  { name: "Cable Crunch", category: "strength", muscleGroup: "core", equipment: "cable" },
  { name: "Ab Wheel Rollout", category: "strength", muscleGroup: "core", equipment: "equipment" },
  { name: "Sit-Up", category: "strength", muscleGroup: "core", equipment: "bodyweight" },
  { name: "Bicycle Crunch", category: "strength", muscleGroup: "core", equipment: "bodyweight" },

  // FULL BODY / OLYMPIC
  { name: "Clean and Jerk", category: "strength", muscleGroup: "full_body", equipment: "barbell" },
  { name: "Snatch", category: "strength", muscleGroup: "full_body", equipment: "barbell" },
  { name: "Power Clean", category: "strength", muscleGroup: "full_body", equipment: "barbell" },
  { name: "Kettlebell Swing", category: "strength", muscleGroup: "full_body", equipment: "kettlebell" },
  { name: "Burpee", category: "strength", muscleGroup: "full_body", equipment: "bodyweight" },
  { name: "Thruster", category: "strength", muscleGroup: "full_body", equipment: "barbell" },

  // CARDIO
  { name: "Treadmill Running", category: "cardio", muscleGroup: "full_body", equipment: "machine" },
  { name: "Stationary Bike", category: "cardio", muscleGroup: "legs", equipment: "machine" },
  { name: "Rowing Machine", category: "cardio", muscleGroup: "full_body", equipment: "machine" },
  { name: "Elliptical", category: "cardio", muscleGroup: "full_body", equipment: "machine" },
  { name: "Stairmaster", category: "cardio", muscleGroup: "legs", equipment: "machine" },
  { name: "Jump Rope", category: "cardio", muscleGroup: "full_body", equipment: "bodyweight" },
  { name: "Outdoor Running", category: "cardio", muscleGroup: "full_body", equipment: "bodyweight" },
  { name: "Swimming", category: "cardio", muscleGroup: "full_body", equipment: "bodyweight" }
];
