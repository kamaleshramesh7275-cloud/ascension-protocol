import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
    
    Send, 
    Star, 
    Sparkles, 
    Lightbulb, 
    Flame, 
    ArrowUp, 
    MessageSquare, 
    CheckCircle2, 
    Crown, 
    Database, 
    ChevronRight,
    Loader2
} from "lucide-react";
import { FaWhatsapp } from "react-icons/fa";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface Proposal {
    id: string;
    title: string;
    description: string;
    category: string;
    votes: number;
    status: string;
    author: string;
    isVoted?: boolean;
    votedUsers?: string[];
}

export default function ContactPage() {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    
    // Direct link states
    const whatsAppUrl = "https://wa.me/916383525774";

    // Review form state
    const [rating, setRating] = useState<number>(0);
    const [hoverRating, setHoverRating] = useState<number>(0);
    const [reviewText, setReviewText] = useState<string>("");
    const [showReviewSuccess, setShowReviewSuccess] = useState<boolean>(false);

    // Feature request state
    const [featureCategory, setFeatureCategory] = useState<string>("UI/UX Deck");
    const [featureTitle, setFeatureTitle] = useState<string>("");
    const [featureDesc, setFeatureDesc] = useState<string>("");
    const [showFeatureSuccess, setShowFeatureSuccess] = useState<boolean>(false);

    const categories = ["UI/UX Deck", "Quests & Campaigns", "Gamified Stats", "Citadel Chat", "Habit Logs"];

    // Fetch user
    const { data: currentUser } = useQuery<any>({
        queryKey: ["/api/user"],
    });

    // Fetch proposals/features
    const { data: rawProposals = [], isLoading: isProposalsLoading } = useQuery<any[]>({
        queryKey: ["/api/bridge/features"],
        queryFn: async () => {
            const res = await apiRequest("GET", "/api/bridge/features");
            return res.json();
        }
    });

    // Map backend features to UI Proposal format
    const proposals: Proposal[] = rawProposals.map((item: any) => ({
        id: item.id,
        title: item.title,
        description: item.details,
        category: item.category,
        votes: item.votes || 0,
        status: item.status === "open" ? "Transmitting" : item.status === "in-progress" ? "Under Review" : "Approved",
        author: item.requestedBy || "Anonymous",
        isVoted: item.votedUsers?.includes(currentUser?.id)
    }));

    // Review mutation
    const submitReviewMutation = useMutation({
        mutationFn: async (data: { comment: string; rating: number }) => {
            const res = await apiRequest("POST", "/api/bridge/reviews", data);
            return res.json();
        },
        onSuccess: () => {
            setShowReviewSuccess(true);
            toast({
                title: "QUEST COMPLETED: Cognitive Sync",
                description: "Review successfully transmitted! +25 XP / +5 Charisma awarded.",
            });
            setReviewText("");
            setRating(0);
            queryClient.invalidateQueries({ queryKey: ["/api/admin/bridge/reviews"] });
        },
        onError: () => {
            toast({
                title: "Transmission Failed",
                description: "Failed to broadcast review transmission.",
                variant: "destructive"
            });
        }
    });

    // Feature mutation
    const submitFeatureMutation = useMutation({
        mutationFn: async (data: { title: string; details: string; category: string; priority: string }) => {
            const res = await apiRequest("POST", "/api/bridge/features", data);
            return res.json();
        },
        onSuccess: () => {
            setShowFeatureSuccess(true);
            toast({
                title: "QUEST COMPLETED: Protocol Upgrade Proponent",
                description: "Proposals broadcasted! +25 XP / +5 Willpower awarded.",
            });
            setFeatureTitle("");
            setFeatureDesc("");
            queryClient.invalidateQueries({ queryKey: ["/api/bridge/features"] });
            queryClient.invalidateQueries({ queryKey: ["/api/admin/bridge/features"] });
        },
        onError: () => {
            toast({
                title: "Transmission Failed",
                description: "Failed to broadcast proposal.",
                variant: "destructive"
            });
        }
    });

    // Vote mutation
    const voteMutation = useMutation({
        mutationFn: async (id: string) => {
            const res = await apiRequest("POST", `/api/bridge/features/${id}/vote`);
            return res.json();
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ["/api/bridge/features"] });
            queryClient.invalidateQueries({ queryKey: ["/api/admin/bridge/features"] });
            toast({
                title: "Uplink Signal Boosted",
                description: data.voted ? "Your vote signature was added to the proposal matrix." : "Your vote signature was removed from the proposal matrix.",
            });
        }
    });

    // Handle review transmission
    const handleReviewSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (rating === 0) {
            toast({
                title: "Authentication Failed",
                description: "Please select a star alignment tier to synchronize your review.",
                variant: "destructive"
            });
            return;
        }
        if (!reviewText.trim()) {
            toast({
                title: "Transmission Empty",
                description: "Vocal review matrix is empty. Please enter your review notes.",
                variant: "destructive"
            });
            return;
        }

        submitReviewMutation.mutate({ comment: reviewText, rating });
    };

    // Handle feature proposal
    const handleFeatureSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!featureTitle.trim() || !featureDesc.trim()) {
            toast({
                title: "Broadcasting Failed",
                description: "Ensure both Title and Proposal details are fully compiled before broadcasting.",
                variant: "destructive"
            });
            return;
        }

        submitFeatureMutation.mutate({
            title: featureTitle,
            details: featureDesc,
            category: featureCategory,
            priority: "medium"
        });
    };

    // Vote feature request
    const handleVote = (id: string) => {
        voteMutation.mutate(id);
    };

    const containerVariants = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: { staggerChildren: 0.1 }
        }
    };

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        show: { y: 0, opacity: 1 }
    };

    return (
        <div className="p-4 md:p-8 min-h-screen bg-background/50 text-white overflow-x-hidden" data-tour="contact-page">
            {/* Header section */}
            <div className="text-center mb-12 relative max-w-4xl mx-auto">
                <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: "spring", stiffness: 200 }}
                    className="inline-block p-3 rounded-2xl bg-gradient-to-br from-violet-500/20 to-fuchsia-600/20 border border-violet-500/30 shadow-[0_0_30px_rgba(139,92,246,0.15)] mb-4"
                >
                    <Database className="w-10 h-10 text-violet-400 animate-pulse" />
                </motion.div>
                <motion.h1
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-4xl font-extrabold bg-gradient-to-r from-violet-400 via-fuchsia-400 to-indigo-400 bg-clip-text text-transparent uppercase tracking-wider font-exo"
                >
                    Communications & Feedback Deck
                </motion.h1>
                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="text-zinc-400 mt-2 text-sm md:text-base font-inter max-w-xl mx-auto"
                >
                    Synchronize secure vocal lines with Support Command, transmit Holo-Reviews, and propose system upgrades.
                </motion.p>
            </div>

            <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="show"
                className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-start mb-16"
            >
                {/* LEFT COLUMN: UPLINK CARDS & REVIEW CARD */}
                <div className="lg:col-span-7 space-y-8">
                    {/* Communications Deck (Direct Contact) */}
                    <motion.div variants={itemVariants}>
                        <Card className="border-white/10 bg-black/40 backdrop-blur-xl relative overflow-hidden shadow-[0_4px_30px_rgba(0,0,0,0.4)]">
                            <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-violet-500 to-fuchsia-500 opacity-60" />
                            <CardHeader className="pb-4">
                                <CardTitle className="text-xl font-bold flex items-center gap-2 font-exo tracking-wide">
                                    <Sparkles className="w-5 h-5 text-violet-400" />
                                    SECURE UPLINKS
                                </CardTitle>
                                <CardDescription className="text-zinc-400 font-inter">
                                    Direct encryption channels to support operatives.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="grid grid-cols-1 gap-4">
                                {/* WhatsApp card */}
                                <motion.a
                                    href={whatsAppUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    whileHover={{ scale: 1.03, y: -2 }}
                                    className="p-5 rounded-2xl bg-white/5 border border-white/5 hover:border-emerald-500/30 hover:bg-emerald-500/5 transition-all duration-300 flex flex-col justify-between group shadow-lg cursor-pointer"
                                >
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 group-hover:bg-emerald-500/20 group-hover:text-white transition-all shadow-[0_0_15px_rgba(16,185,129,0.1)]">
                                            <FaWhatsapp className="w-5 h-5" />
                                        </div>
                                        <ChevronRight className="w-5 h-5 text-zinc-500 group-hover:text-emerald-400 transition-colors" />
                                    </div>
                                    <div>
                                        <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider font-exo">Quantum WhatsApp</span>
                                        <h3 className="text-lg font-bold text-white group-hover:text-emerald-300 transition-colors mb-1">Support chat</h3>
                                        <p className="text-xs text-zinc-400 font-inter">Instantly beam text logs to our live operations deck.</p>
                                    </div>
                                </motion.a>
                            </CardContent>
                        </Card>
                    </motion.div>

                    {/* Holo-Review Card */}
                    <motion.div variants={itemVariants}>
                        <Card className="border-white/10 bg-black/40 backdrop-blur-xl relative overflow-hidden shadow-[0_4px_30px_rgba(0,0,0,0.4)]">
                            <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-violet-500 to-indigo-500 opacity-60" />
                            <CardHeader>
                                <CardTitle className="text-xl font-bold flex items-center gap-2 font-exo tracking-wide">
                                    <Flame className="w-5 h-5 text-amber-500" />
                                    TRANSMIT HOLO-REVIEW
                                </CardTitle>
                                <CardDescription className="text-zinc-400 font-inter">
                                    Broadcast your experience feedback to synchronize our system grids.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="relative">
                                <AnimatePresence mode="wait">
                                    {!showReviewSuccess ? (
                                        <motion.form
                                            key="review-form"
                                            onSubmit={handleReviewSubmit}
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                            className="space-y-6"
                                        >
                                            {/* Stars deck */}
                                            <div className="flex flex-col gap-2 p-4 rounded-xl bg-white/5 border border-white/5">
                                                <label className="text-xs uppercase tracking-wider font-bold text-violet-400 font-exo">Alignment Rating</label>
                                                <div className="flex items-center gap-2 mt-1">
                                                    {[1, 2, 3, 4, 5].map((star) => (
                                                        <motion.button
                                                            type="button"
                                                            key={star}
                                                            whileHover={{ scale: 1.25 }}
                                                            whileTap={{ scale: 0.9 }}
                                                            onClick={() => setRating(star)}
                                                            onMouseEnter={() => setHoverRating(star)}
                                                            onMouseLeave={() => setHoverRating(0)}
                                                            className="text-zinc-600 focus:outline-none transition-colors"
                                                        >
                                                            <Star
                                                                className={`w-8 h-8 ${
                                                                    star <= (hoverRating || rating)
                                                                        ? "text-yellow-400 fill-yellow-400 filter drop-shadow-[0_0_6px_rgba(234,179,8,0.6)]"
                                                                        : "text-zinc-600"
                                                                }`}
                                                            />
                                                        </motion.button>
                                                    ))}
                                                    {(rating > 0 || hoverRating > 0) && (
                                                        <span className="text-sm font-bold text-yellow-400 ml-2 font-exo">
                                                            {["Initiate", "Acolyte", "Sentinel", "Champion", "Ascendant"][(hoverRating || rating) - 1]} Tier
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Text block */}
                                            <div className="space-y-2">
                                                <label className="text-xs uppercase tracking-wider font-bold text-violet-400 font-exo">Review Matrix Log</label>
                                                <Textarea
                                                    required
                                                    value={reviewText}
                                                    onChange={(e) => setReviewText(e.target.value)}
                                                    placeholder="Transmitting cognitive reviews... Share your detailed adventure with us!"
                                                    className="min-h-[110px] border-white/10 bg-black/60 focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/50 rounded-xl transition-all"
                                                />
                                            </div>

                                            {/* Submit button */}
                                            <Button
                                                type="submit"
                                                disabled={submitReviewMutation.isPending}
                                                className="w-full h-12 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold rounded-xl shadow-lg hover:shadow-violet-500/20 border border-violet-500/30 transition-all font-exo tracking-wide"
                                            >
                                                {submitReviewMutation.isPending ? (
                                                    <span className="flex items-center gap-2">
                                                        <Loader2 className="animate-spin h-4 w-4 text-white" />
                                                        Broadcasting Transmission...
                                                    </span>
                                                ) : (
                                                    <span className="flex items-center justify-center gap-2">
                                                        <Send className="w-4 h-4" />
                                                        TRANSMIT FEEDBACK (+25 XP)
                                                    </span>
                                                )}
                                            </Button>
                                        </motion.form>
                                    ) : (
                                        <motion.div
                                            key="success-container"
                                            initial={{ scale: 0.9, opacity: 0 }}
                                            animate={{ scale: 1, opacity: 1 }}
                                            exit={{ scale: 0.9, opacity: 0 }}
                                            className="p-6 rounded-2xl bg-violet-500/10 border border-violet-500/20 text-center space-y-4"
                                        >
                                            <div className="w-12 h-12 rounded-full bg-violet-500/20 text-violet-400 flex items-center justify-center mx-auto border border-violet-500/30 shadow-[0_0_15px_rgba(139,92,246,0.2)]">
                                                <CheckCircle2 className="w-6 h-6" />
                                            </div>
                                            <div className="space-y-1">
                                                <h3 className="text-xl font-bold font-exo text-violet-300">SYNC LOGGED</h3>
                                                <p className="text-sm text-zinc-300 font-inter">Your review has successfully synced with our server cores.</p>
                                            </div>
                                            
                                            {/* Reward Badge */}
                                            <motion.div
                                                initial={{ scale: 0.8, y: 10 }}
                                                animate={{ scale: 1, y: 0 }}
                                                transition={{ delay: 0.2, type: "spring" }}
                                                className="p-4 rounded-xl bg-black/60 border border-yellow-500/30 inline-flex flex-col items-center gap-1 shadow-md shadow-yellow-500/5 mx-auto"
                                            >
                                                <div className="flex items-center gap-1.5 text-yellow-400 font-bold font-exo text-sm">
                                                    <Crown className="w-4 h-4" />
                                                    QUEST COMPLETE
                                                </div>
                                                <div className="text-white text-xs font-semibold">
                                                    <span className="text-violet-400 font-bold">+25 XP</span> • <span className="text-fuchsia-400 font-bold">+5 Charisma</span>
                                                </div>
                                            </motion.div>

                                            <div>
                                                <Button
                                                    variant="ghost"
                                                    onClick={() => setShowReviewSuccess(false)}
                                                    className="text-xs text-zinc-400 hover:text-white"
                                                >
                                                    Transmit Another review
                                                </Button>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </CardContent>
                        </Card>
                    </motion.div>
                </div>

                {/* RIGHT COLUMN: FEATURE LAB & LIVE BOARD */}
                <div className="lg:col-span-5 space-y-8">
                    {/* Proposal Lab */}
                    <motion.div variants={itemVariants}>
                        <Card className="border-white/10 bg-black/40 backdrop-blur-xl relative overflow-hidden shadow-[0_4px_30px_rgba(0,0,0,0.4)]">
                            <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-fuchsia-500 to-pink-500 opacity-60" />
                            <CardHeader>
                                <CardTitle className="text-xl font-bold flex items-center gap-2 font-exo tracking-wide">
                                    <Lightbulb className="w-5 h-5 text-fuchsia-400" />
                                    PROPOSE PROTOCOL UPGRADES
                                </CardTitle>
                                <CardDescription className="text-zinc-400 font-inter">
                                    Propose features or design modules to advance the Citadel codebase.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <AnimatePresence mode="wait">
                                    {!showFeatureSuccess ? (
                                        <motion.form
                                            key="feature-form"
                                            onSubmit={handleFeatureSubmit}
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                            className="space-y-4"
                                        >
                                            {/* Title input */}
                                            <div className="space-y-2">
                                                <label className="text-xs uppercase tracking-wider font-bold text-fuchsia-400 font-exo">Upgrade Title</label>
                                                <Input
                                                    required
                                                    value={featureTitle}
                                                    onChange={(e) => setFeatureTitle(e.target.value)}
                                                    placeholder="E.g., Dark Cyberpunk Mode..."
                                                    className="border-white/10 bg-black/60 focus:border-fuchsia-500/50 focus:ring-1 focus:ring-fuchsia-500/50 rounded-xl"
                                                />
                                            </div>

                                            {/* Category filter pills */}
                                            <div className="space-y-2">
                                                <label className="text-xs uppercase tracking-wider font-bold text-fuchsia-400 font-exo">Category Deck</label>
                                                <div className="flex flex-wrap gap-1.5 pt-1">
                                                    {categories.map((cat) => (
                                                        <button
                                                            type="button"
                                                            key={cat}
                                                            onClick={() => setFeatureCategory(cat)}
                                                            className={`text-[10px] md:text-xs px-2.5 py-1 rounded-full font-bold transition-all border ${
                                                                featureCategory === cat
                                                                    ? "bg-fuchsia-500/20 text-fuchsia-400 border-fuchsia-500 shadow-[0_0_10px_rgba(217,70,239,0.2)]"
                                                                    : "bg-white/5 text-zinc-400 border-transparent hover:bg-white/10 hover:text-zinc-200"
                                                            }`}
                                                        >
                                                            {cat}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Description field */}
                                            <div className="space-y-2">
                                                <label className="text-xs uppercase tracking-wider font-bold text-fuchsia-400 font-exo">Proposal Detail Log</label>
                                                <Textarea
                                                    required
                                                    value={featureDesc}
                                                    onChange={(e) => setFeatureDesc(e.target.value)}
                                                    placeholder="Compile detailed proposal parameters here..."
                                                    className="min-h-[90px] border-white/10 bg-black/60 focus:border-fuchsia-500/50 focus:ring-1 focus:ring-fuchsia-500/50 rounded-xl transition-all"
                                                />
                                            </div>

                                            {/* Propose button */}
                                            <Button
                                                type="submit"
                                                disabled={submitFeatureMutation.isPending}
                                                className="w-full h-11 bg-gradient-to-r from-fuchsia-600 to-pink-600 hover:from-fuchsia-500 hover:to-pink-500 text-white font-bold rounded-xl shadow-lg hover:shadow-fuchsia-500/20 border border-fuchsia-500/30 transition-all font-exo tracking-wide text-xs"
                                            >
                                                {submitFeatureMutation.isPending ? (
                                                    <span className="flex items-center gap-2">
                                                        <Loader2 className="animate-spin h-3.5 w-3.5 text-white" />
                                                        Broadcasting upgrade...
                                                    </span>
                                                ) : (
                                                    <span className="flex items-center justify-center gap-2">
                                                        <Send className="w-3.5 h-3.5" />
                                                        BROADCAST PROPOSAL (+25 XP)
                                                    </span>
                                                )}
                                            </Button>
                                        </motion.form>
                                    ) : (
                                        <motion.div
                                            key="success-proposal"
                                            initial={{ scale: 0.9, opacity: 0 }}
                                            animate={{ scale: 1, opacity: 1 }}
                                            exit={{ scale: 0.9, opacity: 0 }}
                                            className="p-6 rounded-2xl bg-fuchsia-500/10 border border-fuchsia-500/20 text-center space-y-4"
                                        >
                                            <div className="w-12 h-12 rounded-full bg-fuchsia-500/20 text-fuchsia-400 flex items-center justify-center mx-auto border border-fuchsia-500/30 shadow-[0_0_15px_rgba(217,70,239,0.2)]">
                                                <CheckCircle2 className="w-6 h-6" />
                                            </div>
                                            <div className="space-y-1">
                                                <h3 className="text-xl font-bold font-exo text-fuchsia-300">UPGRADE FILED</h3>
                                                <p className="text-sm text-zinc-300 font-inter">Feature broadcast signals were uploaded to the Community Board.</p>
                                            </div>
                                            
                                            {/* Reward Badge */}
                                            <motion.div
                                                initial={{ scale: 0.8, y: 10 }}
                                                animate={{ scale: 1, y: 0 }}
                                                transition={{ delay: 0.2, type: "spring" }}
                                                className="p-4 rounded-xl bg-black/60 border border-yellow-500/30 inline-flex flex-col items-center gap-1 shadow-md shadow-yellow-500/5 mx-auto"
                                            >
                                                <div className="flex items-center gap-1.5 text-yellow-400 font-bold font-exo text-sm">
                                                    <Crown className="w-4 h-4" />
                                                    QUEST COMPLETE
                                                </div>
                                                <div className="text-white text-xs font-semibold">
                                                    <span className="text-fuchsia-400 font-bold">+25 XP</span> • <span className="text-indigo-400 font-bold">+5 Willpower</span>
                                                </div>
                                            </motion.div>

                                            <div>
                                                <Button
                                                    variant="ghost"
                                                    onClick={() => setShowFeatureSuccess(false)}
                                                    className="text-xs text-zinc-400 hover:text-white"
                                                >
                                                    Propose Another Upgrade
                                                </Button>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </CardContent>
                        </Card>
                    </motion.div>

                    {/* Community Proposals Board */}
                    <motion.div variants={itemVariants}>
                        <Card className="border-white/10 bg-black/40 backdrop-blur-xl relative overflow-hidden shadow-[0_4px_30px_rgba(0,0,0,0.4)]">
                            <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-pink-500 to-indigo-500 opacity-60" />
                            <CardHeader className="pb-3">
                                <CardTitle className="text-base font-bold flex items-center justify-between font-exo tracking-wide text-zinc-200">
                                    <span>COMMUNITY UPGRADES</span>
                                    <Badge variant="outline" className="text-[10px] font-bold border-white/10 text-zinc-400">
                                        LIVE BOARD
                                    </Badge>
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4 max-h-[380px] overflow-y-auto pr-1 scrollbar-hide">
                                <AnimatePresence initial={false}>
                                    {proposals.map((prop) => (
                                        <motion.div
                                            key={prop.id}
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, scale: 0.9 }}
                                            className="p-3.5 rounded-xl bg-white/5 border border-white/5 hover:border-zinc-500/20 transition-all flex items-start gap-3 justify-between"
                                        >
                                            <div className="flex-1 space-y-1.5 overflow-hidden">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <span className="text-xs font-bold text-white truncate max-w-[150px]">{prop.title}</span>
                                                    <span className="text-[8px] px-1.5 py-0.5 rounded-full font-bold uppercase bg-white/5 text-zinc-400">
                                                        {prop.category}
                                                    </span>
                                                    <span className={`text-[8px] px-1.5 py-0.5 rounded-full font-bold uppercase ${
                                                        prop.status === "Transmitting" ? "bg-fuchsia-500/20 text-fuchsia-400 animate-pulse border border-fuchsia-500/20" :
                                                        prop.status === "Approved" ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/20" :
                                                        prop.status === "In Development" ? "bg-violet-500/20 text-violet-400 border border-violet-500/20" :
                                                        "bg-yellow-500/20 text-yellow-400 border border-yellow-500/20"
                                                    }`}>
                                                        {prop.status}
                                                    </span>
                                                </div>
                                                <p className="text-[11px] text-zinc-400 leading-relaxed font-inter">{prop.description}</p>
                                                <div className="text-[9px] text-zinc-500 font-inter">
                                                    Proposed by: <span className="text-zinc-400 font-semibold">{prop.author}</span>
                                                </div>
                                            </div>

                                            {/* Vote button */}
                                            <button
                                                onClick={() => handleVote(prop.id)}
                                                className={`px-2.5 py-2.5 rounded-xl transition-all flex flex-col items-center justify-center gap-1 border border-transparent ${
                                                    prop.isVoted
                                                        ? "bg-fuchsia-500/20 text-fuchsia-400 border-fuchsia-500/30"
                                                        : "bg-white/5 text-zinc-500 hover:bg-white/10 hover:text-zinc-300"
                                                }`}
                                            >
                                                <ArrowUp className={`w-3.5 h-3.5 transition-transform duration-300 ${prop.isVoted ? "translate-y-[-2px] text-fuchsia-400" : ""}`} />
                                                <span className="text-[10px] font-bold font-exo">{prop.votes}</span>
                                            </button>
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                            </CardContent>
                        </Card>
                    </motion.div>
                </div>
            </motion.div>
        </div>
    );
}
