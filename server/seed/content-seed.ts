import { db } from "../db";
import { contentLibrary } from "@shared/schema";

export async function seedContent() {
    if (!db) {
        console.warn("Database not available, skipping content seeding.");
        return;
    }
    const content = [
        // Fitness Articles
        {
            title: "The Science of Progressive Overload",
            description: "Learn how to continuously challenge your muscles for optimal growth and strength gains.",
            type: "article",
            category: "fitness",
            content: `# The Science of Progressive Overload

Progressive overload is the gradual increase of stress placed upon the body during exercise training. It's the fundamental principle behind muscle growth and strength development.

## Key Principles

1. **Increase Weight**: Add 2.5-5% more weight when you can complete all sets with good form
2. **Increase Reps**: Aim for 1-2 more reps per set each week
3. **Increase Sets**: Add an extra set when current volume becomes manageable
4. **Decrease Rest**: Reduce rest periods between sets by 10-15 seconds

## Implementation

Start with a weight you can lift for 8-12 reps with good form. When you can complete 12 reps for all sets, increase the weight by 5%.

Track your progress in a journal to ensure consistent progression.`,
            thumbnailUrl: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800",
            isPremium: false,
            views: 0,
            likes: 0,
        },
        {
            title: "HIIT vs Steady State Cardio",
            description: "Discover which cardio method is best for your goals and fitness level.",
            type: "article",
            category: "fitness",
            content: `# HIIT vs Steady State Cardio

Both High-Intensity Interval Training (HIIT) and steady-state cardio have their place in a well-rounded fitness program.

## HIIT Benefits
- Burns more calories in less time
- Increases metabolic rate for 24-48 hours post-workout
- Improves cardiovascular fitness quickly
- Preserves muscle mass better

## Steady State Benefits
- Lower impact on joints
- Easier to recover from
- Better for building aerobic base
- Can be done more frequently

## Recommendation
Combine both: 2-3 HIIT sessions and 2-3 steady-state sessions per week for optimal results.`,
            thumbnailUrl: "https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?w=800",
            isPremium: false,
            views: 0,
            likes: 0,
        },
        {
            title: "Perfect Push-Up Form Guide",
            description: "Master the push-up with proper technique to maximize results and prevent injury.",
            type: "guide",
            category: "fitness",
            content: `# Perfect Push-Up Form Guide

## Setup
1. Start in a plank position
2. Hands slightly wider than shoulder-width
3. Fingers pointing forward
4. Body in a straight line from head to heels

## Execution
1. Lower your body by bending elbows to 90 degrees
2. Keep elbows at 45-degree angle from body
3. Lower until chest nearly touches ground
4. Push back up explosively
5. Fully extend arms at top

## Common Mistakes
- Sagging hips
- Flaring elbows
- Not going deep enough
- Holding breath

## Progressions
1. Wall push-ups
2. Incline push-ups
3. Standard push-ups
4. Decline push-ups
5. One-arm push-ups`,
            thumbnailUrl: "https://images.unsplash.com/photo-1598971639058-fab3c3109a00?w=800",
            isPremium: true,
            views: 0,
            likes: 0,
        },

        // Productivity Articles
        {
            title: "The Pomodoro Technique Explained",
            description: "Boost your productivity with this time-tested focus method.",
            type: "article",
            category: "productivity",
            content: `# The Pomodoro Technique Explained

The Pomodoro Technique is a time management method that uses a timer to break work into focused intervals.

## How It Works

1. **Choose a task** you want to work on
2. **Set a timer** for 25 minutes (one "Pomodoro")
3. **Work** on the task until the timer rings
4. **Take a 5-minute break**
5. **Repeat** 4 times, then take a longer 15-30 minute break

## Benefits

- Reduces mental fatigue
- Improves focus and concentration
- Creates urgency and motivation
- Tracks how much time tasks actually take
- Reduces procrastination

## Tips for Success

- Eliminate all distractions during Pomodoros
- Use the breaks to truly rest
- Adjust the intervals to your needs
- Track completed Pomodoros for motivation`,
            thumbnailUrl: "https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?w=800",
            isPremium: false,
            views: 0,
            likes: 0,
        },
        {
            title: "Deep Work: Rules for Focused Success",
            description: "Learn how to cultivate deep focus in a distracted world.",
            type: "article",
            category: "productivity",
            content: `# Deep Work: Rules for Focused Success

Deep work is the ability to focus without distraction on cognitively demanding tasks.

## The Four Rules

### 1. Work Deeply
- Schedule deep work sessions
- Create rituals and routines
- Build a deep work habit

### 2. Embrace Boredom
- Don't take breaks from distraction, take breaks from focus
- Practice productive meditation
- Resist the urge to check your phone

### 3. Quit Social Media
- Apply the "any benefit" approach
- Use the 80/20 rule for tools
- Don't use the internet to entertain yourself

### 4. Drain the Shallows
- Schedule every minute of your day
- Quantify the depth of every activity
- Finish work by 5:30 PM

## Implementation

Start with 1-2 hours of deep work daily and gradually increase to 4 hours.`,
            thumbnailUrl: "https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?w=800",
            isPremium: true,
            views: 0,
            likes: 0,
        },

        // Mindfulness Articles
        {
            title: "Beginner's Guide to Meditation",
            description: "Start your meditation practice with these simple, effective techniques.",
            type: "guide",
            category: "mindfulness",
            content: `# Beginner's Guide to Meditation

Meditation is a practice of focused attention that can reduce stress and improve well-being.

## Getting Started

### 1. Find a Quiet Space
Choose a calm, quiet place where you won't be disturbed.

### 2. Sit Comfortably
- Sit on a cushion or chair
- Keep your back straight
- Rest hands on knees or lap
- Close your eyes or soften your gaze

### 3. Focus on Your Breath
- Notice the sensation of breathing
- Count breaths if it helps
- When mind wanders, gently return to breath

### 4. Start Small
- Begin with 5 minutes daily
- Gradually increase to 20 minutes
- Consistency matters more than duration

## Common Challenges

**"My mind won't stop thinking"** - That's normal! The practice is noticing and returning to breath.

**"I don't have time"** - Start with just 5 minutes. You have time.

**"Am I doing it right?"** - If you're trying, you're doing it right.`,
            thumbnailUrl: "https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800",
            isPremium: false,
            views: 0,
            likes: 0,
        },
        {
            title: "Mindful Breathing Techniques",
            description: "Master powerful breathing exercises to calm your mind and reduce stress.",
            type: "guide",
            category: "mindfulness",
            content: `# Mindful Breathing Techniques

## Box Breathing (4-4-4-4)
1. Inhale for 4 counts
2. Hold for 4 counts
3. Exhale for 4 counts
4. Hold for 4 counts
5. Repeat 4-5 times

**Use for**: Stress relief, focus

## 4-7-8 Breathing
1. Inhale through nose for 4 counts
2. Hold breath for 7 counts
3. Exhale through mouth for 8 counts
4. Repeat 4 times

**Use for**: Sleep, anxiety

## Alternate Nostril Breathing
1. Close right nostril, inhale left
2. Close left nostril, exhale right
3. Inhale right
4. Close right, exhale left
5. Repeat 5-10 times

**Use for**: Balance, clarity

## Diaphragmatic Breathing
1. Place hand on belly
2. Breathe deeply into belly (not chest)
3. Feel belly rise and fall
4. Practice for 5-10 minutes

**Use for**: Relaxation, grounding`,
            thumbnailUrl: "https://images.unsplash.com/photo-1545389336-cf090694435e?w=800",
            isPremium: false,
            views: 0,
            likes: 0,
        },

        // Nutrition Articles
        {
            title: "Macros 101: Protein, Carbs, and Fats",
            description: "Understanding macronutrients and how to balance them for your goals.",
            type: "article",
            category: "nutrition",
            content: `# Macros 101: Protein, Carbs, and Fats

Macronutrients are the nutrients your body needs in large amounts for energy and function.

## Protein (4 calories/gram)

**Functions:**
- Builds and repairs muscle
- Supports immune function
- Creates enzymes and hormones

**Recommended:** 0.8-1g per pound of body weight

**Sources:** Chicken, fish, eggs, tofu, legumes

## Carbohydrates (4 calories/gram)

**Functions:**
- Primary energy source
- Fuels brain and muscles
- Supports gut health (fiber)

**Recommended:** 40-50% of total calories

**Sources:** Rice, oats, fruits, vegetables, whole grains

## Fats (9 calories/gram)

**Functions:**
- Hormone production
- Nutrient absorption
- Cell membrane structure

**Recommended:** 20-30% of total calories

**Sources:** Avocado, nuts, olive oil, fatty fish

## Balancing Macros

For general health: 40% carbs, 30% protein, 30% fats
For muscle gain: 40% carbs, 35% protein, 25% fats
For fat loss: 30% carbs, 40% protein, 30% fats`,
            thumbnailUrl: "https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=800",
            isPremium: false,
            views: 0,
            likes: 0,
        },
        {
            title: "Meal Prep for Beginners",
            description: "Save time and eat healthier with these meal prep strategies.",
            type: "guide",
            category: "nutrition",
            content: `# Meal Prep for Beginners

## Benefits
- Saves time during the week
- Reduces food waste
- Ensures healthy eating
- Saves money

## Getting Started

### 1. Plan Your Meals
- Choose 2-3 recipes for the week
- Make a shopping list
- Pick a prep day (usually Sunday)

### 2. Essential Equipment
- Food containers (glass or BPA-free plastic)
- Sharp knives
- Cutting boards
- Sheet pans

### 3. Batch Cooking Tips
- Cook proteins in bulk (chicken, ground turkey)
- Roast vegetables on sheet pans
- Cook grains in rice cooker
- Prep snacks (cut veggies, portion nuts)

### 4. Storage Guidelines
- Refrigerate meals for up to 4 days
- Freeze extras for later
- Label containers with dates
- Store dressings separately

## Sample Meal Prep

**Breakfast:** Overnight oats (5 servings)
**Lunch:** Chicken, rice, and broccoli (4 servings)
**Dinner:** Turkey chili (6 servings)
**Snacks:** Cut vegetables, hummus, fruit`,
            thumbnailUrl: "https://images.unsplash.com/photo-1547592166-23ac45744acd?w=800",
            isPremium: true,
            views: 0,
            likes: 0,
        },

        // Sleep Articles
        {
            title: "Sleep Hygiene: 10 Rules for Better Sleep",
            description: "Optimize your sleep environment and habits for restorative rest.",
            type: "article",
            category: "sleep",
            content: `# Sleep Hygiene: 10 Rules for Better Sleep

## 1. Consistent Sleep Schedule
Go to bed and wake up at the same time every day, even weekends.

## 2. Create a Dark Environment
- Use blackout curtains
- Cover LED lights
- Consider a sleep mask

## 3. Keep It Cool
Optimal bedroom temperature: 60-67°F (15-19°C)

## 4. Limit Screen Time
No screens 1-2 hours before bed. Blue light disrupts melatonin production.

## 5. Avoid Caffeine After 2 PM
Caffeine has a half-life of 5-6 hours.

## 6. Exercise Regularly
But not within 3 hours of bedtime.

## 7. Create a Bedtime Routine
- Read a book
- Take a warm bath
- Practice meditation
- Light stretching

## 8. Use Your Bed Only for Sleep
Don't work, eat, or watch TV in bed.

## 9. Manage Stress
Journal, meditate, or practice deep breathing before bed.

## 10. Consider Supplements
- Magnesium glycinate
- L-theanine
- Melatonin (short-term use)

Consult a doctor before taking supplements.`,
            thumbnailUrl: "https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?w=800",
            isPremium: false,
            views: 0,
            likes: 0,
        },

        // Video Content
        {
            title: "5-Minute Morning Stretch Routine",
            description: "Wake up your body with this quick, energizing stretch sequence.",
            type: "video",
            category: "fitness",
            videoUrl: "https://www.youtube.com/embed/g_tea8ZNk5A",
            thumbnailUrl: "https://images.unsplash.com/photo-1599901860904-17e6ed7083a0?w=800",
            duration: 5,
            isPremium: false,
            views: 0,
            likes: 0,
        },
        {
            title: "10-Minute Guided Meditation",
            description: "A calming meditation session perfect for beginners.",
            type: "video",
            category: "mindfulness",
            videoUrl: "https://www.youtube.com/embed/inpok4MKVLM",
            thumbnailUrl: "https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800",
            duration: 10,
            isPremium: false,
            views: 0,
            likes: 0,
        },
        {
            title: "Productivity Masterclass: Time Blocking",
            description: "Learn how to structure your day for maximum productivity.",
            type: "video",
            category: "productivity",
            videoUrl: "https://www.youtube.com/embed/n9W1B5LpFZA",
            thumbnailUrl: "https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?w=800",
            duration: 15,
            isPremium: true,
            views: 0,
            likes: 0,
        },
    ];

    try {
        console.log("Seeding content library...");

        // Check if content already exists
        const existingContent = await db.select().from(contentLibrary).limit(1);

        if (existingContent.length > 0) {
            console.log("Content already seeded, skipping...");
            return;
        }

        await db.insert(contentLibrary).values(content);
        console.log(`✅ Seeded ${content.length} content items`);
    } catch (error) {
        console.error("Error seeding content:", error);
        throw error;
    }
}
