
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Lock, Crown, CheckCircle, Map, Brain, BarChart, Shield } from "lucide-react";
import { motion } from "framer-motion";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

export function FeatureLockOverlay() {
    const [paymentSent, setPaymentSent] = useState(false);
    const { toast } = useToast();

    // Determine UPI Link
    const upiLink = "upi://pay?pa=6383526774@paytm&pn=KamaleshkumarRameshkumar&am=100";

    const premiumRequestMutation = useMutation({
        mutationFn: async () => {
            const res = await apiRequest("POST", "/api/subscription/request", {});
            return res.json();
        },
        onSuccess: () => {
            setPaymentSent(true);
            toast({
                title: "Payment notification sent",
                description: "Admins have been notified. Activation in ~45 mins.",
            });
        },
        onError: () => {
            toast({
                title: "Error",
                description: "Failed to send notification. Please try again.",
                variant: "destructive",
            });
        }
    });

    const handlePay = () => {
        window.location.href = upiLink;
    };

    return (
        <div className="absolute inset-0 z-50 flex items-start justify-center pt-20 md:pt-24 bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-300 overflow-y-auto">
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="relative w-full max-w-4xl"
            >
                <Card className="border-yellow-500/30 bg-black/95 backdrop-blur-xl shadow-2xl shadow-yellow-900/20 overflow-hidden grid md:grid-cols-2">

                    {/* Left Side: Value Prop */}
                    <div className="p-8 md:p-10 border-b md:border-b-0 md:border-r border-white/10 relative overflow-hidden">
                        {/* Background Effects */}
                        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-yellow-500/5 to-transparent pointer-events-none" />
                        <div className="absolute -top-20 -left-20 w-64 h-64 bg-yellow-500/10 rounded-full blur-[80px]" />

                        <div className="relative z-10">
                            <h2 className="text-3xl font-bold text-white mb-2">Unlock Ascension</h2>
                            <p className="text-zinc-400 mb-8 text-lg">
                                Access the full suite of tools designed to accelerate your personal evolution.
                            </p>

                            <div className="space-y-6">
                                <div className="flex items-start gap-4">
                                    <div className="p-2 bg-red-500/10 rounded-lg">
                                        <Map className="w-6 h-6 text-red-500" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-white text-lg">Full Roadmap</h3>
                                        <p className="text-zinc-400 text-sm">Clear, step-by-step path to mastery.</p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-4">
                                    <div className="p-2 bg-blue-500/10 rounded-lg">
                                        <Brain className="w-6 h-6 text-blue-500" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-white text-lg">Unlimited Focus</h3>
                                        <p className="text-zinc-400 text-sm">Deep work sessions without daily limits.</p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-4">
                                    <div className="p-2 bg-purple-500/10 rounded-lg">
                                        <BarChart className="w-6 h-6 text-purple-500" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-white text-lg">Advanced Analytics</h3>
                                        <p className="text-zinc-400 text-sm">Track your stats, XP, and consistency.</p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-4">
                                    <div className="p-2 bg-amber-500/10 rounded-lg">
                                        <Shield className="w-6 h-6 text-amber-500" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-white text-lg">Verified Status</h3>
                                        <p className="text-zinc-400 text-sm">Stand out with a premium profile badge.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Side: Action */}
                    <div className="p-8 md:p-10 flex flex-col justify-center bg-zinc-900/30 relative">
                        <div className="w-20 h-20 bg-gradient-to-br from-yellow-500/20 to-orange-500/20 rounded-full flex items-center justify-center mx-auto ring-1 ring-yellow-500/50 shadow-lg shadow-yellow-500/20 mb-6">
                            <Lock className="w-10 h-10 text-yellow-500" />
                        </div>

                        <div className="text-center mb-8">
                            <h3 className="text-xl font-bold text-white mb-2">Lifetime Access</h3>
                            <div className="flex items-center justify-center gap-3">
                                <span className="text-5xl font-bold bg-gradient-to-r from-yellow-400 to-amber-600 bg-clip-text text-transparent">₹100</span>
                                <span className="text-xl text-zinc-500 line-through">₹499</span>
                            </div>
                            <p className="text-zinc-400 text-sm mt-4">One-time payment. No subscription.</p>
                        </div>

                        <div className="space-y-4">
                            {!paymentSent ? (
                                <>
                                    <a href="/pay-redirect" target="_blank" className="block w-full">
                                        <Button
                                            className="w-full bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-400 hover:to-amber-500 text-black font-bold h-14 text-lg shadow-lg shadow-yellow-500/20"
                                        >
                                            <Crown className="w-5 h-5 mr-2" />
                                            Pay ₹100 via UPI
                                        </Button>
                                    </a>
                                    <Button
                                        variant="outline"
                                        onClick={() => premiumRequestMutation.mutate()}
                                        disabled={premiumRequestMutation.isPending}
                                        className="w-full border-zinc-700 hover:bg-zinc-800 text-zinc-300 h-12"
                                    >
                                        I have made the payment
                                    </Button>
                                </>
                            ) : (
                                <div className="p-6 bg-green-500/10 border border-green-500/20 rounded-xl animate-in zoom-in duration-300">
                                    <div className="flex items-center justify-center gap-2 text-green-400 font-bold mb-2 text-lg">
                                        <CheckCircle className="w-6 h-6" />
                                        Payment Verified
                                    </div>
                                    <p className="text-center text-green-500/80">
                                        Admin has been notified.<br />Access will be unlocked shortly (~45m).
                                    </p>
                                </div>
                            )}
                            <p className="text-xs text-center text-zinc-600 mt-4">
                                Secure payment via your preferred UPI app.
                            </p>
                        </div>
                    </div>
                </Card>
            </motion.div>
        </div>
    );
}
