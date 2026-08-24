import { useState } from "react";
import { motion } from "framer-motion";
import { User, Lock, Eye, EyeOff, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";

import { useAuth } from "@/hooks/use-auth";
import { signInWithGoogle } from "@/lib/firebase";

export default function Login() {
    const [, setLocation] = useLocation();
    const { toast } = useToast();
    const { loginLocal, loginGoogle } = useAuth();

    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const response = await fetch("/api/auth/login-local", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username, password }),
            });

            if (response.status === 404) {
                toast({ title: "Account not found", description: "Redirecting to registration..." });
                setLocation("/register");
                return;
            }

            if (!response.ok) {
                let errorMessage = `Login failed (${response.status})`;
                try {
                    const error = await response.json();
                    errorMessage = error.error || errorMessage;
                } catch (e) {
                    errorMessage += `: ${response.statusText}`;
                }
                throw new Error(errorMessage);
            }

            const data = await response.json();

            // Store credentials
            localStorage.setItem("username", username);
            localStorage.setItem("userId", data.userId);
            localStorage.setItem("guest_uid", data.firebaseUid);

            // Update auth state
            await loginLocal(username, data.userId, data.firebaseUid);

            toast({ title: "Welcome back, Ascendant!" });
            setLocation("/dashboard");
        } catch (error: any) {
            toast({
                title: "Login failed",
                description: error.message,
                variant: "destructive"
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleGoogleLogin = async () => {
        try {
            setIsLoading(true);
            const result = await signInWithGoogle();
            const firebaseUser = result.user;

            const response = await fetch("/api/auth/login-google", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ firebaseUid: firebaseUser.uid }),
            });

            if (response.status === 404) {
                toast({ title: "Account not found", description: "Redirecting to registration..." });
                setLocation("/register?google=true");
                return;
            }

            if (!response.ok) {
                throw new Error("Google login failed");
            }

            const data = await response.json();
            await loginGoogle(data.userId, data.firebaseUid, firebaseUser.displayName || undefined);
            
            toast({ title: "Welcome back, Ascendant!" });
            setLocation("/dashboard");
        } catch (error: any) {
            console.error("Google Login Error:", error);
            toast({
                title: "Login failed",
                description: error.message || "Could not sign in with Google",
                variant: "destructive"
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-black via-blue-950/20 to-black flex items-center justify-center p-6">
            <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2072&auto=format&fit=crop')] bg-cover opacity-10" />

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative z-10 w-full max-w-md"
            >
                <Card className="bg-zinc-900/90 border-zinc-800 backdrop-blur-xl">
                    <CardHeader className="text-center">
                        <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-blue-500/20 flex items-center justify-center">
                            <LogIn className="w-8 h-8 text-blue-400" />
                        </div>
                        <CardTitle className="text-3xl">Welcome Back</CardTitle>
                        <CardDescription>Continue your ascension journey</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleLogin} className="space-y-6">
                            {/* Username */}
                            <div className="space-y-2">
                                <Label htmlFor="username">Username</Label>
                                <div className="relative">
                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                                    <Input
                                        id="username"
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                        className="bg-black border-zinc-700 pl-10"
                                        placeholder="Enter your username"
                                        required
                                        autoFocus
                                    />
                                </div>
                            </div>

                            {/* Password */}
                            <div className="space-y-2">
                                <Label htmlFor="password">Password</Label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                                    <Input
                                        id="password"
                                        type={showPassword ? "text" : "password"}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="bg-black border-zinc-700 pl-10 pr-10"
                                        placeholder="Enter your password"
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
                                    >
                                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>

                            <Button
                                type="submit"
                                className="w-full bg-blue-600 hover:bg-blue-700"
                                disabled={isLoading}
                            >
                                {isLoading ? "Logging in..." : "Login"}
                            </Button>

                            <div className="relative">
                                <div className="absolute inset-0 flex items-center">
                                    <span className="w-full border-t border-zinc-700" />
                                </div>
                                <div className="relative flex justify-center text-xs uppercase">
                                    <span className="bg-zinc-900 px-2 text-zinc-500">Or continue with</span>
                                </div>
                            </div>

                            <Button
                                type="button"
                                variant="outline"
                                onClick={handleGoogleLogin}
                                disabled={isLoading}
                                className="w-full border-zinc-700 bg-transparent hover:bg-zinc-800"
                            >
                                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                                    <path
                                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                        fill="#4285F4"
                                    />
                                    <path
                                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                        fill="#34A853"
                                    />
                                    <path
                                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                        fill="#FBBC05"
                                    />
                                    <path
                                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                        fill="#EA4335"
                                    />
                                </svg>
                                Google
                            </Button>

                            <div className="text-center space-y-2">
                                <button
                                    type="button"
                                    onClick={() => setLocation("/account-selection")}
                                    className="text-sm text-zinc-500 hover:text-zinc-300 transition-colors"
                                >
                                    ← Back to account selection
                                </button>
                                <div className="text-sm text-zinc-500">
                                    Don't have an account?{" "}
                                    <button
                                        type="button"
                                        onClick={() => setLocation("/register")}
                                        className="text-blue-400 hover:text-blue-300"
                                    >
                                        Create one
                                    </button>
                                </div>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </motion.div>
        </div>
    );
}
