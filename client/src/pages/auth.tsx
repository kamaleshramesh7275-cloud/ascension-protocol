import { useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { signInWithGoogle, handleAuthRedirect } from "@/lib/firebase";
import { useAuth } from "@/hooks/use-auth";
import { Trophy, Zap, Target, TrendingUp } from "lucide-react";

export default function AuthPage() {
  const { user, loading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    // Handle redirect from Google sign-in
    handleAuthRedirect().catch(console.error);
  }, []);

  useEffect(() => {
    if (user && !loading) {
      setLocation("/dashboard");
    }
  }, [user, loading, setLocation]);

  const handleSignIn = async () => {
    try {
      await signInWithGoogle();
    } catch (error) {
      console.error("Sign in error:", error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Hero Section */}
      <div className="flex-1 flex items-center justify-center p-4 bg-gradient-to-br from-background via-background to-primary/5">
        <div className="max-w-4xl w-full">
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-purple-600 mb-6">
              <Trophy className="h-10 w-10 text-primary-foreground" />
            </div>
            <h1 className="text-6xl font-display font-black mb-4 bg-gradient-to-r from-primary via-purple-500 to-pink-500 bg-clip-text text-transparent">
              Ascension Protocol
            </h1>
            <p className="text-xl text-muted-foreground mb-2">
              Level Up Your Life
            </p>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Gamify your goals. Complete quests. Track your stats. Ascend to greatness.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 mb-12">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-primary" />
                  Daily Quests
                </CardTitle>
                <CardDescription>
                  Complete challenges to earn XP and level up your real-life stats
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-primary" />
                  7 Core Stats
                </CardTitle>
                <CardDescription>
                  Track Strength, Agility, Stamina, Vitality, Intelligence, Willpower, and Charisma
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  Rank System
                </CardTitle>
                <CardDescription>
                  Progress through 5 tiers from D to S rank as you gain experience
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-primary" />
                  Compete
                </CardTitle>
                <CardDescription>
                  Climb the global leaderboard and compare your progress with others
                </CardDescription>
              </CardHeader>
            </Card>
          </div>

          <Card className="max-w-md mx-auto">
            <CardHeader className="text-center">
              <CardTitle>Begin Your Ascension</CardTitle>
              <CardDescription>
                Sign in with Google to start your journey
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={handleSignIn} 
                size="lg" 
                className="w-full"
                data-testid="button-sign-in"
              >
                <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Continue with Google
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
