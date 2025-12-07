import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { User, Lock, Eye, EyeOff, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";

import { useAuth } from "@/hooks/use-auth";

export default function Register() {
    const [, setLocation] = useLocation();
    const { toast } = useToast();
    const { loginLocal } = useAuth();

    const [step, setStep] = useState<"assessment" | "credentials">("assessment");
    const [showPassword, setShowPassword] = useState(false);

    // Assessment data
    const [assessment, setAssessment] = useState({
        age: "",
        weight: "",
        height: "",
        pushups: "",
        pullups: "",
        intelligence: 5,
        willpower: 5,
        charisma: 5,
        vitality: 5,
        education: "",
        stream: "",
    });

    // Credentials
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
    const [isCheckingUsername, setIsCheckingUsername] = useState(false);

    // Check username availability
    useEffect(() => {
        const checkUsername = async () => {
            if (username.length < 3) {
                setUsernameAvailable(null);
                return;
            }

            setIsCheckingUsername(true);
            try {
                const res = await fetch(`/api/auth/check-username/${username}`);
                const data = await res.json();
                setUsernameAvailable(!data.exists);
            } catch (error) {
                console.error("Failed to check username", error);
            } finally {
                setIsCheckingUsername(false);
            }
        };

        const timeoutId = setTimeout(checkUsername, 500);
        return () => clearTimeout(timeoutId);
    }, [username]);

    // Password validation
    const passwordRequirements = {
        length: password.length >= 8,
        uppercase: /[A-Z]/.test(password),
        lowercase: /[a-z]/.test(password),
        number: /[0-9]/.test(password),
    };

    const isPasswordValid = Object.values(passwordRequirements).every(Boolean);
    const passwordsMatch = password === confirmPassword && password.length > 0;

    const handleAssessmentSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!assessment.age || !assessment.weight || !assessment.height || !assessment.pushups || !assessment.pullups || !assessment.education || !assessment.stream) {
            toast({ title: "Please complete all fields", variant: "destructive" });
            return;
        }
        setStep("credentials");
    };

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!username || username.length < 3) {
            toast({ title: "Username must be at least 3 characters", variant: "destructive" });
            return;
        }

        if (usernameAvailable === false) {
            toast({ title: "Username is already taken", variant: "destructive" });
            return;
        }

        if (!isPasswordValid) {
            toast({ title: "Password does not meet requirements", variant: "destructive" });
            return;
        }

        if (!passwordsMatch) {
            toast({ title: "Passwords do not match", variant: "destructive" });
            return;
        }

        try {
            const response = await fetch("/api/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    username,
                    password,
                    ...assessment,
                }),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || "Registration failed");
            }

            const data = await response.json();

            // Store credentials and firebaseUid for authentication
            localStorage.setItem("username", username);
            localStorage.setItem("userId", data.userId);
            // Store as guest_uid so the backend requireAuth middleware recognizes it
            localStorage.setItem("guest_uid", data.firebaseUid);

            // Update auth state
            await loginLocal(username, data.userId, data.firebaseUid);

            toast({ title: "Account created successfully!" });
            setLocation("/dashboard");
        } catch (error: any) {
            toast({ title: "Registration failed", description: error.message, variant: "destructive" });
        }
    };

    if (step === "assessment") {
        return (
            <div className="min-h-screen bg-gradient-to-br from-black via-purple-950/20 to-black flex items-center justify-center p-6">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="w-full max-w-2xl"
                >
                    <Card className="bg-zinc-900/50 border-zinc-800">
                        <CardHeader>
                            <CardTitle className="text-2xl">Initial Assessment</CardTitle>
                            <CardDescription>Help us calibrate your starting stats</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleAssessmentSubmit} className="space-y-6">
                                {/* Physical Stats */}
                                <div className="space-y-4">
                                    <h3 className="font-semibold text-lg">Physical Metrics</h3>
                                    <div className="grid grid-cols-3 gap-4">
                                        <div>
                                            <Label>Age</Label>
                                            <Input
                                                type="number"
                                                value={assessment.age}
                                                onChange={(e) => setAssessment({ ...assessment, age: e.target.value })}
                                                className="bg-black border-zinc-700"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <Label>Weight (kg)</Label>
                                            <Input
                                                type="number"
                                                value={assessment.weight}
                                                onChange={(e) => setAssessment({ ...assessment, weight: e.target.value })}
                                                className="bg-black border-zinc-700"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <Label>Height (cm)</Label>
                                            <Input
                                                type="number"
                                                value={assessment.height}
                                                onChange={(e) => setAssessment({ ...assessment, height: e.target.value })}
                                                className="bg-black border-zinc-700"
                                                required
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Performance Tests */}
                                <div className="space-y-4">
                                    <h3 className="font-semibold text-lg">Performance Tests</h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <Label>Max Pushups (in one set)</Label>
                                            <Input
                                                type="number"
                                                value={assessment.pushups}
                                                onChange={(e) => setAssessment({ ...assessment, pushups: e.target.value })}
                                                className="bg-black border-zinc-700"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <Label>Max Pullups (in one set)</Label>
                                            <Input
                                                type="number"
                                                value={assessment.pullups}
                                                onChange={(e) => setAssessment({ ...assessment, pullups: e.target.value })}
                                                className="bg-black border-zinc-700"
                                                required
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Mental Stats */}
                                <div className="space-y-4">
                                    <h3 className="font-semibold text-lg">Self-Assessment (1-10)</h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        {[
                                            { key: "intelligence", label: "Intelligence" },
                                            { key: "willpower", label: "Willpower" },
                                            { key: "charisma", label: "Charisma" },
                                            { key: "vitality", label: "Vitality" },
                                        ].map(({ key, label }) => (
                                            <div key={key}>
                                                <Label>{label}: {assessment[key as keyof typeof assessment]}</Label>
                                                <input
                                                    type="range"
                                                    min="1"
                                                    max="10"
                                                    value={assessment[key as keyof typeof assessment]}
                                                    onChange={(e) => setAssessment({ ...assessment, [key]: parseInt(e.target.value) })}
                                                    className="w-full"
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Education & Career */}
                                <div className="space-y-4">
                                    <h3 className="font-semibold text-lg">Education & Career</h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <Label>Education Level</Label>
                                            <select
                                                value={assessment.education}
                                                onChange={(e) => setAssessment({ ...assessment, education: e.target.value })}
                                                className="w-full bg-black border border-zinc-700 rounded-md px-3 py-2 text-sm"
                                                required
                                            >
                                                <option value="">Select Level</option>
                                                <option value="High School">High School</option>
                                                <option value="Undergraduate">Undergraduate</option>
                                                <option value="Postgraduate">Postgraduate</option>
                                                <option value="PhD">PhD</option>
                                                <option value="Other">Other</option>
                                            </select>
                                        </div>
                                        <div>
                                            <Label>Stream / Major</Label>
                                            <Input
                                                value={assessment.stream}
                                                onChange={(e) => setAssessment({ ...assessment, stream: e.target.value })}
                                                className="bg-black border-zinc-700"
                                                placeholder="e.g. Computer Science"
                                                required
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="flex gap-4">
                                    <Button type="button" variant="outline" onClick={() => setLocation("/account-selection")} className="flex-1">
                                        Back
                                    </Button>
                                    <Button type="submit" className="flex-1 bg-purple-600 hover:bg-purple-700">
                                        Continue
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-black via-purple-950/20 to-black flex items-center justify-center p-6">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md"
            >
                <Card className="bg-zinc-900/50 border-zinc-800">
                    <CardHeader>
                        <CardTitle className="text-2xl">Create Your Account</CardTitle>
                        <CardDescription>Choose your username and password</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleRegister} className="space-y-6">
                            {/* Username */}
                            <div className="space-y-2">
                                <Label htmlFor="username">Username</Label>
                                <div className="relative">
                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                                    <Input
                                        id="username"
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                        className={`bg-black border-zinc-700 pl-10 ${usernameAvailable === true ? "border-green-500/50 focus:border-green-500" :
                                            usernameAvailable === false ? "border-red-500/50 focus:border-red-500" : ""
                                            }`}
                                        placeholder="Choose a unique username"
                                        required
                                    />
                                    {isCheckingUsername && (
                                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                            <div className="animate-spin h-4 w-4 border-2 border-purple-500 border-t-transparent rounded-full" />
                                        </div>
                                    )}
                                    {!isCheckingUsername && usernameAvailable === true && (
                                        <Check className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-green-500" />
                                    )}
                                    {!isCheckingUsername && usernameAvailable === false && (
                                        <X className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-red-500" />
                                    )}
                                </div>
                                {username && username.length < 3 && (
                                    <p className="text-xs text-red-400">Username must be at least 3 characters</p>
                                )}
                                {usernameAvailable === false && (
                                    <p className="text-xs text-red-400">
                                        Username is taken. <span className="underline cursor-pointer text-blue-400" onClick={() => setLocation("/login")}>Login instead?</span>
                                    </p>
                                )}
                                {usernameAvailable === true && (
                                    <p className="text-xs text-green-500">Username is available</p>
                                )}
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
                                        placeholder="Create a strong password"
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

                                {/* Password Requirements */}
                                <div className="space-y-1 text-xs">
                                    {Object.entries({
                                        length: "At least 8 characters",
                                        uppercase: "One uppercase letter",
                                        lowercase: "One lowercase letter",
                                        number: "One number",
                                    }).map(([key, label]) => (
                                        <div key={key} className="flex items-center gap-2">
                                            {passwordRequirements[key as keyof typeof passwordRequirements] ? (
                                                <Check className="w-3 h-3 text-green-500" />
                                            ) : (
                                                <X className="w-3 h-3 text-red-500" />
                                            )}
                                            <span className={passwordRequirements[key as keyof typeof passwordRequirements] ? "text-green-500" : "text-zinc-500"}>
                                                {label}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Confirm Password */}
                            <div className="space-y-2">
                                <Label htmlFor="confirmPassword">Confirm Password</Label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                                    <Input
                                        id="confirmPassword"
                                        type={showPassword ? "text" : "password"}
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        className="bg-black border-zinc-700 pl-10"
                                        placeholder="Confirm your password"
                                        required
                                    />
                                </div>
                                {confirmPassword && !passwordsMatch && (
                                    <p className="text-xs text-red-400">Passwords do not match</p>
                                )}
                                {passwordsMatch && (
                                    <p className="text-xs text-green-500 flex items-center gap-1">
                                        <Check className="w-3 h-3" /> Passwords match
                                    </p>
                                )}
                            </div>

                            <div className="flex gap-4">
                                <Button type="button" variant="outline" onClick={() => setStep("assessment")} className="flex-1">
                                    Back
                                </Button>
                                <Button
                                    type="submit"
                                    className="flex-1 bg-purple-600 hover:bg-purple-700"
                                    disabled={!isPasswordValid || !passwordsMatch || username.length < 3}
                                >
                                    Create Account
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </motion.div>
        </div>
    );
}
