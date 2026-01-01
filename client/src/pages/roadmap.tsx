import { useQuery } from "@tanstack/react-query";
import { RoadmapVisual } from "@/components/roadmap/RoadmapVisual";
import { WeekCard } from "@/components/roadmap/WeekCard";
import { Roadmap, RoadmapWeek, RoadmapTask, User } from "@shared/schema";
import { Loader2, Lock } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

type RoadmapData = Roadmap & {
    weeks: (RoadmapWeek & { tasks: RoadmapTask[] })[];
};

export default function RoadmapPage() {
    const { user: authUser } = useAuth();

    // Fetch full backend user profile to check premium status
    const { data: user, isLoading: isUserLoading } = useQuery<User>({
        queryKey: ["/api/user"],
        enabled: !!authUser,
    });

    const { data: roadmap, isLoading: isRoadmapLoading, error } = useQuery<RoadmapData>({
        queryKey: ["/api/roadmap"],
        enabled: !!user?.isPremium, // Only fetch if user is premium
    });

    const isLoading = isUserLoading || isRoadmapLoading;

    if (isLoading) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
            </div>
        );
    }

    // If user is loaded but not premium (or if user failed to load but authUser exists), show lock screen
    // We check user?.isPremium explicitly. If user is undefined here (failed fetch), it falls through or we handle error.
    if (user && !user.isPremium) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center p-4">
                <div className="max-w-md text-center space-y-6">
                    <div className="w-20 h-20 bg-zinc-900 rounded-full flex items-center justify-center mx-auto border border-zinc-800">
                        <Lock className="w-10 h-10 text-zinc-500" />
                    </div>
                    <h1 className="text-3xl font-bold font-heading text-white">Premium Feature</h1>
                    <p className="text-zinc-400">
                        The 30-Day Ascension Roadmap is exclusively available to premium members. Upgrade your account to unlock your path to peak performance.
                    </p>
                    <Button asChild size="lg" className="w-full bg-blue-600 hover:bg-blue-500 text-white">
                        <Link href="/store">Upgrade to Premium</Link>
                    </Button>
                </div>
            </div>
        );
    }

    if (error || (!roadmap && user?.isPremium)) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center p-4 text-center">
                <p className="text-red-400">Failed to load roadmap. Please try again later.</p>
            </div>
        );
    }

    // Fallback if roadmap is missing but no error (rare race condition or initial state)
    if (!roadmap) return null;

    return (
        <div className="min-h-screen bg-black text-white p-4 md:p-8 pb-32">
            <div className="max-w-6xl mx-auto space-y-8">
                {/* Header */}
                <div className="space-y-2">
                    <h1 className="text-4xl md:text-5xl font-bold font-heading tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-violet-400 to-amber-400">
                        30-Day Protocol
                    </h1>
                    <p className="text-zinc-400 max-w-2xl">
                        Execute the daily tasks to advance through the phases. Consistency is the key to ascension.
                    </p>
                </div>

                {/* Visual Roadmap */}
                <RoadmapVisual
                    currentWeek={roadmap.currentWeek}
                    weeks={roadmap.weeks}
                />

                {/* Weeks Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {roadmap.weeks
                        .sort((a, b) => a.weekNumber - b.weekNumber)
                        .map((week, index) => (
                            <WeekCard
                                key={week.id}
                                week={week}
                                index={index}
                            />
                        ))}
                </div>
            </div>
        </div>
    );
}
