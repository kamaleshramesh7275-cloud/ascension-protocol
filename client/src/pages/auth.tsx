import { useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { signInWithGoogle, handleAuthRedirect } from "@/lib/firebase";
import { useAuth } from "@/hooks/use-auth";
import { Trophy, Zap, Target, TrendingUp, AlertCircle } from "lucide-react";

export default function AuthPage() {
  const { user, loading, error } = useAuth();
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

  // Show Firebase configuration error
  if (error && error.message.includes("invalid-api-key")) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background via-background to-primary/5">
        <Card className="max-w-md w-full border-destructive/50 bg-destructive/5">
          <CardHeader>
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              <CardTitle className="text-destructive">Firebase Configuration Error</CardTitle>
            </div>
            <CardDescription>
              The Firebase API key is invalid or missing
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-background rounded-lg p-4 border border-border text-sm space-y-2">
              <p className="font-semibold text-foreground">Setup Required:</p>
              <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
                <li>Go to <a href="https://console.firebase.google.com" target="_blank" rel="noopener noreferrer" className="text-primary underline">Firebase Console</a></li>
                <li>Select your project "ascension-957b6"</li>
                <li>Click ⚙️ → Project Settings</li>
                <li>Copy the actual API Key (starts with "AIza")</li>
                <li>Ask the developer to update it in Replit Secrets as VITE_FIREBASE_API_KEY</li>
              </ol>
            </div>
            <div className="text-xs text-muted-foreground bg-muted rounded p-3">
              <strong>Current issue:</strong> The API key appears to be a placeholder. Firebase requires a real API key to authenticate users.
            </div>
          </CardContent>
        </Card>
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
                  <TrendingUp className="h-5 w-5 text-primary" />
                  7 Core Stats
                </CardTitle>
                <CardDescription>
                  Progress in Strength, Agility, Stamina, Vitality, Intelligence, Willpower & Charisma
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-primary" />
                  Rank Progression
                </CardTitle>
                <CardDescription>
                  Climb from D-Tier to S-Tier through dedicated gameplay
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-primary" />
                  Leaderboards
                </CardTitle>
                <CardDescription>
                  Compete globally and showcase your legendary ascension
                </CardDescription>
              </CardHeader>
            </Card>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              onClick={handleSignIn}
              className="text-base h-12"
              data-testid="button-signin-google"
            >
              Sign In with Google
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
