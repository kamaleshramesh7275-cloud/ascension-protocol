import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { validateBetaCode } from "@/lib/beta-access";
import { motion } from "framer-motion";
import { Lock, ArrowRight, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function BetaAccessPage() {
    const [code, setCode] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [, setLocation] = useLocation();

    useEffect(() => {
        // Check if code already exists
        const storedCode = localStorage.getItem("betaCode");
        if (storedCode) {
            validateBetaCode(storedCode).then((isValid) => {
                if (isValid) {
                    setLocation("/auth");
                } else {
                    localStorage.removeItem("betaCode");
                }
            });
        }
    }, [setLocation]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            const isValid = await validateBetaCode(code);
            if (isValid) {
                localStorage.setItem("betaCode", code);
                setLocation("/auth");
            } else {
                setError("Invalid or already used code.");
            }
        } catch (err) {
            setError("An error occurred. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-black text-white flex items-center justify-center p-4 relative overflow-hidden">
            {/* Background effects */}
            <div className="absolute inset-0 z-0">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-900 via-[#0a0a0a] to-black" />
                <motion.div
                    animate={{
                        scale: [1, 1.2, 1],
                        opacity: [0.2, 0.4, 0.2],
                    }}
                    transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-900/20 rounded-full blur-[100px]"
                />
            </div>

            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="w-full max-w-md z-10"
            >
                <Card className="border-white/10 bg-black/40 backdrop-blur-xl">
                    <CardHeader className="text-center">
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
                            className="w-16 h-16 mx-auto bg-gradient-to-br from-yellow-500 to-orange-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-orange-500/20"
                        >
                            <Lock className="w-8 h-8 text-white" />
                        </motion.div>
                        <CardTitle className="text-2xl font-bold">Beta Access</CardTitle>
                        <CardDescription>Enter your exclusive access code to begin.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <Input
                                    placeholder="AP-BETA-XXXXXX"
                                    value={code}
                                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                                    className="bg-white/5 border-white/10 text-center text-lg tracking-widest uppercase placeholder:normal-case placeholder:tracking-normal"
                                    maxLength={14}
                                />
                            </div>

                            {error && (
                                <Alert variant="destructive" className="bg-red-900/20 border-red-900/50 text-red-200">
                                    <AlertCircle className="h-4 w-4" />
                                    <AlertDescription>{error}</AlertDescription>
                                </Alert>
                            )}

                            <Button
                                type="submit"
                                className="w-full bg-gradient-to-r from-yellow-500 to-orange-600 hover:opacity-90 transition-opacity"
                                disabled={loading || !code}
                            >
                                {loading ? "Verifying..." : (
                                    <>
                                        Unlock Access <ArrowRight className="ml-2 h-4 w-4" />
                                    </>
                                )}
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </motion.div>
        </div>
    );
}
