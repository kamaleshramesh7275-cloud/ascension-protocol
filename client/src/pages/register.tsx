import { useState, useEffect } from "react";
import { LiveTelemetryTicker } from "@/components/live-telemetry-ticker";
import { motion } from "framer-motion";
import { User, Lock, Eye, EyeOff, Check, X, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";

import { useAuth } from "@/hooks/use-auth";
import { signInWithGoogle, onAuthChange, getGoogleRedirectResult, formatFirebaseAuthError } from "@/lib/firebase";
import { InAppBrowserBanner } from "@/components/auth/in-app-browser-banner";

export default function Register() {
    const [, setLocation] = useLocation();
    const { toast } = useToast();
    const { loginLocal, loginGoogle } = useAuth();

    const [step, setStep] = useState<"identity" | "assessment" | "credentials">("identity");
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
    const [referralCode, setReferralCode] = useState("");
    const [phone, setPhone] = useState("");
    const [referralValid, setReferralValid] = useState<boolean | null>(null);
    const [referralReferrerName, setReferralReferrerName] = useState<string | null>(null);
    const [isValidatingReferral, setIsValidatingReferral] = useState(false);
    const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
    const [isCheckingUsername, setIsCheckingUsername] = useState(false);

    const [isGoogleAuth, setIsGoogleAuth] = useState(false);
    const [googleUid, setGoogleUid] = useState<string | null>(null);
    const [googleEmail, setGoogleEmail] = useState<string | null>(null);

    // Check for redirect result from Google OAuth or active auth state
    useEffect(() => {
        let isMounted = true;

        getGoogleRedirectResult()
            .then((user) => {
                if (!isMounted || !user) return;
                setGoogleUid(user.uid);
                setGoogleEmail(user.email);
                if (user.displayName && !username) {
                    setUsername(user.displayName.replace(/[^a-zA-Z0-9_]/g, "").slice(0, 14));
                }
                setIsGoogleAuth(true);
                setStep("assessment");
                toast({ title: "Authenticated with Google", description: "Let's calibrate your stats." });
            })
            .catch((err) => {
                console.error("Redirect result error:", err);
                const { title, description } = formatFirebaseAuthError(err);
                toast({ title, description, variant: "destructive" });
            });

        if (window.location.search.includes("google=true")) {
            const unsubscribe = onAuthChange((user) => {
                if (user && isMounted) {
                    setGoogleUid(user.uid);
                    setGoogleEmail(user.email);
                    if (user.displayName && !username) {
                        setUsername(user.displayName.replace(/[^a-zA-Z0-9_]/g, "").slice(0, 14));
                    }
                    setIsGoogleAuth(true);
                    setStep("assessment");
                }
            });
            return () => {
                isMounted = false;
                unsubscribe();
            };
        }

        return () => {
            isMounted = false;
        };
    }, []);

    // Auto-fill referral code from localStorage (set by /ref/:code redirect)
    useEffect(() => {
        const savedCode = localStorage.getItem("referral_code");
        if (savedCode) {
            setReferralCode(savedCode);
        }
    }, []);

    // Validate referral code with debounce
    useEffect(() => {
        if (!referralCode || referralCode.length < 3) {
            setReferralValid(null);
            setReferralReferrerName(null);
            return;
        }
        const timer = setTimeout(async () => {
            setIsValidatingReferral(true);
            try {
                const res = await fetch("/api/referrals/validate", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ code: referralCode }),
                });
                if (res.ok) {
                    const data = await res.json();
                    setReferralValid(true);
                    setReferralReferrerName(data.referrerName);
                } else {
                    setReferralValid(false);
                    setReferralReferrerName(null);
                }
            } catch {
                setReferralValid(false);
                setReferralReferrerName(null);
            } finally {
                setIsValidatingReferral(false);
            }
        }, 600);
        return () => clearTimeout(timer);
    }, [referralCode]);

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

        if (!isGoogleAuth) {
            if (!isPasswordValid) {
                toast({ title: "Password does not meet requirements", variant: "destructive" });
                return;
            }

            if (!passwordsMatch) {
                toast({ title: "Passwords do not match", variant: "destructive" });
                return;
            }
        }

        try {
            let response;
            if (isGoogleAuth) {
                response = await fetch("/api/auth/register-google", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        username,
                        firebaseUid: googleUid,
                        email: googleEmail,
                        phone: phone || undefined,
                        referralCode: referralCode || undefined,
                        ...assessment,
                    }),
                });
            } else {
                response = await fetch("/api/auth/register-local", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        username,
                        password,
                        phone: phone || undefined,
                        referralCode: referralCode || undefined,
                        ...assessment,
                    }),
                });
            }

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
            sessionStorage.setItem("isNewRegistration", "true");

            // Update auth state
            if (isGoogleAuth) {
                await loginGoogle(data.userId, data.firebaseUid, username);
            } else {
                await loginLocal(username, data.userId, data.firebaseUid);
            }

            toast({ title: "Account created successfully.", description: referralCode ? "+50 bonus coins awarded." : undefined });
            localStorage.removeItem("referral_code");
            setLocation("/dashboard");
        } catch (error: any) {
            toast({ title: "Registration failed", description: error.message, variant: "destructive" });
        }
    };

    const handleGoogleSignup = async () => {
        try {
            const authResult = await signInWithGoogle();
            if (!authResult) {
                // Page redirect initiated (fallback for mobile/standalone PWA)
                return;
            }
            const firebaseUser = authResult.user;
            setGoogleUid(firebaseUser.uid);
            setGoogleEmail(firebaseUser.email);
            if (firebaseUser.displayName && !username) {
                setUsername(firebaseUser.displayName.replace(/[^a-zA-Z0-9_]/g, "").slice(0, 14));
            }
            setIsGoogleAuth(true);
            setStep("assessment");
            toast({ title: "Authenticated with Google", description: "Let's calibrate your stats." });
        } catch (error: any) {
            console.error("Google Signup Error:", error);
            const { title, description } = formatFirebaseAuthError(error);
            toast({ title, description, variant: "destructive" });
        }
    };

    if (step === "identity") {
        return (
            <div className="min-h-screen bg-gradient-to-br from-black via-purple-950/20 to-black flex flex-col justify-between relative overflow-hidden">
                <div className="flex-1 flex items-center justify-center p-6">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="w-full max-w-md"
                >
                    <InAppBrowserBanner className="mb-4" />
                    <Card className="bg-zinc-900/50 border-zinc-800">
                        <CardHeader className="text-center">
                            <CardTitle className="text-2xl">Create Your Account</CardTitle>
                            <CardDescription>Get started by securely authenticating with Google</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={handleGoogleSignup}
                                className="w-full h-12 border-zinc-700 bg-transparent hover:bg-zinc-800"
                            >
                                <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                                </svg>
                                Continue with Google
                            </Button>

                            <div className="relative flex py-2 items-center">
                                <div className="flex-grow border-t border-zinc-800"></div>
                                <span className="flex-shrink mx-4 text-xs text-zinc-500 uppercase tracking-widest font-mono">Or</span>
                                <div className="flex-grow border-t border-zinc-800"></div>
                            </div>

                            <Button
                                type="button"
                                variant="ghost"
                                onClick={() => {
                                    setIsGoogleAuth(false);
                                    setStep("assessment");
                                }}
                                className="w-full h-11 border border-zinc-800 hover:bg-zinc-800/60 text-zinc-300 font-mono text-sm"
                            >
                                Register with Username & Password
                            </Button>
                            
                            <div className="text-center text-sm text-zinc-500 mt-6 pt-4 border-t border-zinc-800">
                                Already have an account?{" "}
                                <span className="underline cursor-pointer text-purple-400 hover:text-purple-300 transition-colors" onClick={() => setLocation("/login")}>
                                    Login here
                                </span>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>
                </div>

                <LiveTelemetryTicker />
            </div>
        );
    }

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

                            {/* Phone Number */}
                            <div className="space-y-2">
                                <Label htmlFor="phone">Mobile Number {isGoogleAuth && <span className="text-zinc-500 text-xs">(Optional)</span>}</Label>
                                <div className="relative">
                                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                                    <Input
                                        id="phone"
                                        type="tel"
                                        value={phone}
                                        onChange={(e) => setPhone(e.target.value)}
                                        className="bg-black border-zinc-700 pl-10"
                                        placeholder="e.g. +91 9876543210"
                                        required={!isGoogleAuth}
                                    />
                                </div>
                                {phone && phone.length < 10 && (
                                    <p className="text-xs text-red-400">Enter a valid mobile number</p>
                                )}
                            </div>

                            {isGoogleAuth ? (
                                <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl space-y-1">
                                    <p className="text-sm font-semibold text-emerald-400 flex items-center gap-2">
                                        <Check className="w-4 h-4" /> Google SSO Verified
                                    </p>
                                    <p className="text-xs text-zinc-400">
                                        Linked to <span className="text-zinc-200 font-mono">{googleEmail}</span>. No separate password needed.
                                    </p>
                                </div>
                            ) : (
                                <>
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
                                </>
                            )}

                            {/* Referral Code (Optional) */}
                            <div className="space-y-2">
                                <Label htmlFor="referralCode">Referral Code <span className="text-zinc-500">(Optional)</span></Label>
                                <div className="relative">
                                    <Input
                                        id="referralCode"
                                        value={referralCode}
                                        onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                                        className={`bg-black border-zinc-700 pr-8 ${referralValid === true ? "border-green-500/60" :
                                                referralValid === false ? "border-red-500/60" : ""
                                            }`}
                                        placeholder="e.g. ALEX_AB3K"
                                    />
                                    {isValidatingReferral && (
                                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                            <div className="animate-spin h-4 w-4 border-2 border-purple-500 border-t-transparent rounded-full" />
                                        </div>
                                    )}
                                    {!isValidatingReferral && referralValid === true && (
                                        <Check className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-green-500" />
                                    )}
                                    {!isValidatingReferral && referralValid === false && (
                                        <X className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-red-500" />
                                    )}
                                </div>
                                {referralValid === true && referralReferrerName && (
                                    <p className="text-xs text-green-400 flex items-center gap-1">
                                        <Check className="w-3 h-3" />
                                        Referred by <strong>{referralReferrerName}</strong> — you'll get +50 bonus coins!
                                    </p>
                                )}
                                {referralValid === false && (
                                    <p className="text-xs text-red-400">Invalid referral code</p>
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
