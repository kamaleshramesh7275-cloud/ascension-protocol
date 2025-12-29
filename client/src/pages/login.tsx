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

export default function Login() {
    const [, setLocation] = useLocation();
    const { toast } = useToast();
    const { loginLocal } = useAuth();

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
