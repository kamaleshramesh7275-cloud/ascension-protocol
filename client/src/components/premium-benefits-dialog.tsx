import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Sparkles, Trophy, ShoppingBag, Shield, Zap, CheckCircle2, Clock } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { apiRequest } from "@/lib/queryClient";

interface PremiumBenefitsDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

const benefits = [
    {
        icon: Trophy,
        title: "3x Rewards",
        description: "Triple XP and Coin gains from all quests and focus sessions.",
        color: "text-yellow-500",
        bg: "bg-yellow-500/10"
    },
    {
        icon: ShoppingBag,
        title: "25% Shop Discount",
        description: "Permanent discount on all items in the store, including legendary gear.",
        color: "text-emerald-500",
        bg: "bg-emerald-500/10"
    },
    {
        icon: Zap,
        title: "Legendary Access",
        description: "Unlock exclusive legendary items and content unavailable to standard users.",
        color: "text-purple-500",
        bg: "bg-purple-500/10"
    },
    {
        icon: Shield,
        title: "Daily Bonus",
        description: "Receive 100 bonus Coins every single day you log in.",
        color: "text-blue-500",
        bg: "bg-blue-500/10"
    }
];

export function PremiumBenefitsDialog({ open, onOpenChange }: PremiumBenefitsDialogProps) {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [isRequested, setIsRequested] = useState(false);

    const requestMutation = useMutation({
        mutationFn: async () => {
            const res = await apiRequest("POST", "/api/subscription/request");
            return res.json();
        },
        onSuccess: () => {
            toast({
                title: "Request Submitted!",
                description: "Your premium activation request is now pending admin approval.",
            });
            setIsRequested(true);
            queryClient.invalidateQueries({ queryKey: ["/api/user"] });
        },
        onError: (error: any) => {
            toast({
                title: "Request Failed",
                description: error.message,
                variant: "destructive",
            });
        }
    });

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px] bg-black/90 border-yellow-500/30 backdrop-blur-2xl text-white overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/5 via-transparent to-amber-600/5 pointer-events-none" />

                <DialogHeader className="relative z-10">
                    <DialogTitle className="text-3xl font-bold text-center bg-gradient-to-r from-yellow-400 to-amber-600 bg-clip-text text-transparent flex items-center justify-center gap-2">
                        <Sparkles className="h-8 w-8 text-yellow-500" />
                        Premium Ascension
                    </DialogTitle>
                    <DialogDescription className="text-center text-zinc-400 text-lg mt-2">
                        Unlock your true potential with the Elite Protocol
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-6 py-6 relative z-10">
                    {benefits.map((benefit, index) => (
                        <motion.div
                            key={benefit.title}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="flex items-start gap-4 p-4 rounded-xl bg-white/5 border border-white/10 hover:border-yellow-500/30 transition-all group"
                        >
                            <div className={`p-3 rounded-lg ${benefit.bg} ${benefit.color} group-hover:scale-110 transition-transform`}>
                                <benefit.icon className="h-6 w-6" />
                            </div>
                            <div>
                                <h3 className="font-bold text-lg group-hover:text-yellow-500 transition-colors">{benefit.title}</h3>
                                <p className="text-zinc-400 text-sm leading-relaxed">{benefit.description}</p>
                            </div>
                        </motion.div>
                    ))}
                </div>

                <DialogFooter className="relative z-10 sm:justify-center flex-col gap-3">
                    <AnimatePresence mode="wait">
                        {isRequested ? (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="flex flex-col items-center gap-2 text-emerald-400"
                            >
                                <CheckCircle2 className="h-10 w-10" />
                                <p className="font-bold text-lg">Request Pending Approval</p>
                                <p className="text-xs text-zinc-500 flex items-center gap-1">
                                    <Clock className="h-3 w-3" /> Usually approved within 24 hours
                                </p>
                            </motion.div>
                        ) : (
                            <div className="w-full space-y-4">
                                <Button
                                    className="w-full bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-600 hover:to-amber-700 text-black font-black text-lg h-14 shadow-[0_0_20px_rgba(234,179,8,0.3)] group"
                                    onClick={() => requestMutation.mutate()}
                                    disabled={requestMutation.isPending}
                                >
                                    {requestMutation.isPending ? (
                                        "Processing..."
                                    ) : (
                                        <>
                                            Request Activation
                                            <Zap className="ml-2 h-5 w-5 fill-current group-hover:animate-pulse" />
                                        </>
                                    )}
                                </Button>
                                <p className="text-center text-[10px] text-zinc-500 uppercase tracking-widest font-bold">
                                    Approval required by protocol admin
                                </p>
                            </div>
                        )}
                    </AnimatePresence>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
