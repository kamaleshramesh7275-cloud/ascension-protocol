
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Lock, Crown, CheckCircle } from "lucide-react";
import { motion } from "framer-motion";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

export function FeatureLockOverlay() {
    const [paymentSent, setPaymentSent] = useState(false);
    const { toast } = useToast();

    // Determine UPI Link
    // Note: 'am' is amount. User said 100.
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
        // Also could open in new tab maybe? But UPI links are protocols.
        // window.open(upiLink, '_blank');
    };

    return (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
                className="relative w-full max-w-md"
            >
                <Card className="border-yellow-500/30 bg-black/90 backdrop-blur-xl shadow-2xl shadow-yellow-900/20 overflow-hidden">
                    <div className="p-6 text-center space-y-6">
                        <div className="w-16 h-16 bg-gradient-to-br from-yellow-500/20 to-orange-500/20 rounded-full flex items-center justify-center mx-auto ring-1 ring-yellow-500/50 shadow-lg shadow-yellow-500/20">
                            <Lock className="w-8 h-8 text-yellow-500" />
                        </div>

                        <div>
                            <h2 className="text-2xl font-bold text-white mb-2">Locked Feature</h2>
                            <p className="text-zinc-400">
                                This feature is available exclusively to premium members.
                                Upgrade to unlock the full protocol.
                            </p>
                        </div>

                        <div className="space-y-3">
                            {!paymentSent ? (
                                <>
                                    <Button
                                        onClick={handlePay}
                                        className="w-full bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-400 hover:to-amber-500 text-black font-bold h-12"
                                    >
                                        <Crown className="w-4 h-4 mr-2" />
                                        Pay ₹100 via UPI
                                    </Button>
                                    <Button
                                        variant="outline"
                                        onClick={() => premiumRequestMutation.mutate()}
                                        disabled={premiumRequestMutation.isPending}
                                        className="w-full border-zinc-700 hover:bg-zinc-800 text-zinc-300"
                                    >
                                        I have made the payment
                                    </Button>
                                </>
                            ) : (
                                <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                                    <div className="flex items-center justify-center gap-2 text-green-400 font-bold mb-1">
                                        <CheckCircle className="w-5 h-5" />
                                        Payment Verified
                                    </div>
                                    <p className="text-xs text-green-500/80">
                                        Admin notified. Access will be unlocked shortly (~45m).
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </Card>
            </motion.div>
        </div>
    );
}
