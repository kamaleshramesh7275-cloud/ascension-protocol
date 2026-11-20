import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { UserPlus, LogIn, ArrowRight, Sparkles, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { signInWithGoogle, getGoogleRedirectResult, formatFirebaseAuthError } from "@/lib/firebase";
import { InAppBrowserBanner } from "@/components/auth/in-app-browser-banner";
import { Capacitor } from "@capacitor/core";
import { hapticTap, hapticSuccess } from "@/lib/haptics";

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

    const handleDemoLogin = async () => {
        setIsGoogleLoading(true);
        hapticTap();
        try {
            const response = await fetch("/api/auth/login-local", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username: "demo", password: "password123" }),
            });

            if (!response.ok) {
                throw new Error("Demo access temporarily unavailable");
            }

            const data = await response.json();
            localStorage.setItem("username", "demo");
            localStorage.setItem("userId", data.userId);
            localStorage.setItem("guest_uid", data.firebaseUid);

            await loginGoogle(data.userId, data.firebaseUid, "Demo Operator");
            hapticSuccess();
            toast({
                title: "Welcome, Hunter Operator!",
                description: "Signed in via Instant In-App Operator Access.",
            });
            setLocation("/dashboard");
        } catch (error: any) {
            toast({
                title: "Access Notice",
                description: error.message || "Could not connect to demo session.",
                variant: "destructive",
            });
        } finally {
            setIsGoogleLoading(false);
        }
    };

    const isNative = Capacitor.isNativePlatform();

    return (
        <div className="min-h-screen bg-gradient-to-br from-black via-purple-950/20 to-black flex items-center justify-center px-4 py-6 pt-[max(1.5rem,env(safe-area-inset-top))] pb-[max(1.5rem,env(safe-area-inset-bottom))]">
            <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2072&auto=format&fit=crop')] bg-cover opacity-10 pointer-events-none" />

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative z-10 w-full max-w-4xl font-sans"
            >
                <div className="text-center mb-6">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-mono mb-3">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>IN-APP AUTHENTICATION // SECURE PORTAL</span>
                    </div>
                    <h1 className="text-2xl sm:text-4xl md:text-5xl font-extrabold mb-2 text-white tracking-tight">
                        Welcome to Ascension Protocol
                    </h1>
                    <p className="text-sm sm:text-base text-zinc-400">Sign in to your account or create a new profile</p>
                </div>

                <div className="max-w-md mx-auto mb-4">
                    <InAppBrowserBanner />
                </div>

                {/* 1-Tap Instant In-App Operator Access */}
                <div className="max-w-md mx-auto mb-6">
                    <Button
                        type="button"
                        onClick={handleDemoLogin}
                        disabled={isGoogleLoading}
                        className="w-full h-12 py-3 bg-gradient-to-r from-cyan-900/60 via-slate-900 to-indigo-950/60 border border-cyan-400/50 hover:border-cyan-400 text-cyan-300 font-bold rounded-xl shadow-[0_0_20px_rgba(6,182,212,0.2)] transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98]"
                    >
                        <Sparkles className="w-4 h-4 text-cyan-400" />
                        <span>1-Tap Instant Hunter Access (Demo)</span>
                    </Button>
                </div>

                {/* Google Authentication Button */}
                <div className="max-w-md mx-auto mb-6">
                    <Button
                        type="button"
                        onClick={handleGoogleAuth}
                        disabled={isGoogleLoading}
                        variant="outline"
                        className="w-full h-11 py-2 bg-zinc-900/80 border border-zinc-700 hover:border-cyan-400 text-zinc-200 text-xs font-medium rounded-xl transition-all flex items-center justify-center gap-2.5 cursor-pointer"
                    >
                        <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24">
                            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                        </svg>
                        <span>{isGoogleLoading ? "Connecting..." : "Continue with Google Account"}</span>
                    </Button>

                    <div className="relative flex py-4 items-center">
                        <div className="flex-grow border-t border-zinc-800"></div>
                        <span className="flex-shrink mx-4 text-xs text-zinc-500 uppercase tracking-wider font-medium">In-App Credentials</span>
                        <div className="flex-grow border-t border-zinc-800"></div>
                    </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                    {/* New User Card */}
                    <motion.div
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                    >
                        <Card
                            className="h-full bg-gradient-to-br from-cyan-950/20 via-slate-900 to-black border-cyan-500/30 hover:border-cyan-500/60 rounded-2xl transition-all cursor-pointer p-2"
                            onClick={() => setLocation("/register")}
                        >
                            <CardHeader className="text-center pb-3">
                                <div className="mx-auto mb-3 w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center">
                                    <UserPlus className="w-8 h-8 text-cyan-400" />
                                </div>
                                <CardTitle className="text-xl font-bold text-white">Create New Account</CardTitle>
                                <CardDescription className="text-sm text-zinc-400">Set up your personal execution dashboard</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <ul className="space-y-2.5 text-xs sm:text-sm text-zinc-300">
                                    <li className="flex items-start gap-2">
                                        <ArrowRight className="w-4 h-4 text-cyan-400 mt-0.5 flex-shrink-0" />
                                        <span>Calibrate your daily priorities & habits</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <ArrowRight className="w-4 h-4 text-cyan-400 mt-0.5 flex-shrink-0" />
                                        <span>Select your archetype & fitness loadout</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <ArrowRight className="w-4 h-4 text-cyan-400 mt-0.5 flex-shrink-0" />
                                        <span>Access 40Hz binaural deep focus sessions</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <ArrowRight className="w-4 h-4 text-cyan-400 mt-0.5 flex-shrink-0" />
                                        <span>Join peer accountability squads</span>
                                    </li>
                                </ul>
                                <Button className="w-full bg-cyan-500 hover:bg-cyan-400 text-black font-semibold rounded-xl mt-4">
                                    Get Started
                                </Button>
                            </CardContent>
                        </Card>
                    </motion.div>

                    {/* Returning User Card */}
                    <motion.div
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                    >
                        <Card
                            className="h-full bg-gradient-to-br from-indigo-950/20 via-slate-900 to-black border-slate-800 hover:border-indigo-500/50 rounded-2xl transition-all cursor-pointer p-2"
                            onClick={() => setLocation("/login")}
                        >
                            <CardHeader className="text-center pb-3">
                                <div className="mx-auto mb-3 w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center">
                                    <LogIn className="w-8 h-8 text-indigo-400" />
                                </div>
                                <CardTitle className="text-xl font-bold text-white">Returning Member</CardTitle>
                                <CardDescription className="text-sm text-zinc-400">Continue your streak & active targets</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <ul className="space-y-2.5 text-xs sm:text-sm text-zinc-300">
                                    <li className="flex items-start gap-2">
                                        <ArrowRight className="w-4 h-4 text-indigo-400 mt-0.5 flex-shrink-0" />
                                        <span>Access your existing dashboard</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <ArrowRight className="w-4 h-4 text-indigo-400 mt-0.5 flex-shrink-0" />
                                        <span>Execute today's priority commitments</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <ArrowRight className="w-4 h-4 text-indigo-400 mt-0.5 flex-shrink-0" />
                                        <span>Review squad pool standing and rankings</span>
                                    </li>
                                </ul>
                                <Button variant="outline" className="w-full border-slate-700 bg-slate-900/80 hover:bg-slate-800 text-white font-semibold rounded-xl mt-4">
                                    Sign In
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
