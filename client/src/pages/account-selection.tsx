import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { UserPlus, LogIn, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { signInWithGoogle, getGoogleRedirectResult, formatFirebaseAuthError } from "@/lib/firebase";
import { InAppBrowserBanner } from "@/components/auth/in-app-browser-banner";

export default function AccountSelection() {
    const [, setLocation] = useLocation();
    const { toast } = useToast();
    const { loginGoogle } = useAuth();
    const [isGoogleLoading, setIsGoogleLoading] = useState(false);

    const completeGoogleLogin = async (firebaseUser: { uid: string; email: string | null; displayName: string | null; photoURL?: string | null }) => {
        const response = await fetch("/api/auth/login-google", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                firebaseUid: firebaseUser.uid,
                email: firebaseUser.email,
                displayName: firebaseUser.displayName,
                photoUrl: firebaseUser.photoURL,
            }),
        });

        if (!response.ok) {
            let errText = "Google login failed";
            try {
                const errData = await response.json();
                errText = errData.error || errText;
            } catch {
                errText = response.statusText || errText;
            }
            throw new Error(errText);
        }

        const data = await response.json();
        await loginGoogle(data.userId, data.firebaseUid, data.username || firebaseUser.displayName || undefined);

        toast({
            title: data.isNewUser ? "Welcome to Ascension Protocol!" : "Welcome back, Ascendant!",
            description: `Signed in as ${data.username || firebaseUser.displayName || "Hunter"}.`,
        });
        setLocation("/dashboard");
    };

    useEffect(() => {
        let isMounted = true;
        getGoogleRedirectResult()
            .then(async (user) => {
                if (!isMounted || !user) return;
                setIsGoogleLoading(true);
                await completeGoogleLogin(user);
            })
            .catch((error) => {
                console.error("Redirect login error:", error);
                const { title, description } = formatFirebaseAuthError(error);
                toast({ title, description, variant: "destructive" });
            })
            .finally(() => {
                if (isMounted) setIsGoogleLoading(false);
            });

        return () => { isMounted = false; };
    }, []);

    const handleGoogleAuth = async () => {
        try {
            setIsGoogleLoading(true);
            const authResult = await signInWithGoogle();
            if (!authResult) return; // redirect initiated
            await completeGoogleLogin(authResult.user);
        } catch (error: any) {
            console.error("Google Auth error:", error);
            const { title, description } = formatFirebaseAuthError(error);
            toast({ title, description, variant: "destructive" });
        } finally {
            setIsGoogleLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-black via-purple-950/20 to-black flex items-center justify-center p-6">
            <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2072&auto=format&fit=crop')] bg-cover opacity-10" />

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative z-10 w-full max-w-4xl"
            >
                <div className="text-center mb-8">
                    <h1 className="text-4xl md:text-5xl font-bold mb-3 bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-blue-500">
                        Welcome, Ascendant
                    </h1>
                    <p className="text-lg text-zinc-400">Choose your path or access instantly</p>
                </div>

                <div className="max-w-md mx-auto mb-4">
                    <InAppBrowserBanner />
                </div>

                {/* Fast-Track Google Authentication Button */}
                <div className="max-w-md mx-auto mb-8">
                    <Button
                        type="button"
                        onClick={handleGoogleAuth}
                        disabled={isGoogleLoading}
                        className="w-full h-13 py-3 bg-zinc-900/90 border border-purple-500/40 hover:border-purple-400 hover:bg-zinc-800 text-white font-medium shadow-[0_0_20px_rgba(168,85,247,0.2)] transition-all flex items-center justify-center gap-3"
                    >
                        <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
                            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                        </svg>
                        <span>{isGoogleLoading ? "Authenticating..." : "Fast-Track: Continue with Google"}</span>
                    </Button>

                    <div className="relative flex py-4 items-center">
                        <div className="flex-grow border-t border-zinc-800"></div>
                        <span className="flex-shrink mx-4 text-xs text-zinc-500 uppercase tracking-widest font-mono">Or Manual Credentials</span>
                        <div className="flex-grow border-t border-zinc-800"></div>
                    </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                    {/* New User Card */}
                    <motion.div
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                    >
                        <Card
                            className="h-full bg-gradient-to-br from-purple-900/20 to-black border-purple-500/30 hover:border-purple-500/60 transition-all cursor-pointer"
                            onClick={() => setLocation("/register")}
                        >
                            <CardHeader className="text-center pb-4">
                                <div className="mx-auto mb-4 w-20 h-20 rounded-full bg-purple-500/20 flex items-center justify-center">
                                    <UserPlus className="w-10 h-10 text-purple-400" />
                                </div>
                                <CardTitle className="text-2xl">New User</CardTitle>
                                <CardDescription className="text-base">Begin your ascension journey</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <ul className="space-y-3 text-sm text-zinc-300">
                                    <li className="flex items-start gap-2">
                                        <ArrowRight className="w-4 h-4 text-purple-400 mt-0.5 flex-shrink-0" />
                                        <span>Complete initial assessment</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <ArrowRight className="w-4 h-4 text-purple-400 mt-0.5 flex-shrink-0" />
                                        <span>Create your unique username</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <ArrowRight className="w-4 h-4 text-purple-400 mt-0.5 flex-shrink-0" />
                                        <span>Set a secure password</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <ArrowRight className="w-4 h-4 text-purple-400 mt-0.5 flex-shrink-0" />
                                        <span>Start earning XP and leveling up</span>
                                    </li>
                                </ul>
                                <Button className="w-full bg-purple-600 hover:bg-purple-700 mt-6">
                                    Start Calibration
                                </Button>
                            </CardContent>
                        </Card>
                    </motion.div>

                    {/* Returning User Card */}
                    <motion.div
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                    >
                        <Card
                            className="h-full bg-gradient-to-br from-blue-900/20 to-black border-blue-500/30 hover:border-blue-500/60 transition-all cursor-pointer"
                            onClick={() => setLocation("/login")}
                        >
                            <CardHeader className="text-center pb-4">
                                <div className="mx-auto mb-4 w-20 h-20 rounded-full bg-blue-500/20 flex items-center justify-center">
                                    <LogIn className="w-10 h-10 text-blue-400" />
                                </div>
                                <CardTitle className="text-2xl">Returning User</CardTitle>
                                <CardDescription className="text-base">Continue your ascension</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <ul className="space-y-3 text-sm text-zinc-300">
                                    <li className="flex items-start gap-2">
                                        <ArrowRight className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
                                        <span>Access your existing account</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <ArrowRight className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
                                        <span>Continue your daily quests</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <ArrowRight className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
                                        <span>Check your telemetry progress</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <ArrowRight className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
                                        <span>Climb the Hunter leaderboards</span>
                                    </li>
                                </ul>
                                <Button className="w-full bg-blue-600 hover:bg-blue-700 mt-6">
                                    Login with Password
                                </Button>
                            </CardContent>
                        </Card>
                    </motion.div>
                </div>

                <div className="text-center mt-8">
                    <button
                        onClick={() => setLocation("/")}
                        className="text-sm text-zinc-500 hover:text-zinc-300 transition-colors"
                    >
                        ← Back to Home
                    </button>
                </div>
            </motion.div>
        </div>
    );
}
