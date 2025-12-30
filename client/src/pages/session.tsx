import { useState, useEffect, useRef } from "react";
import { useParams, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { Clock, MessageSquare, Users, Send, Loader2, Sparkles, Zap, Target, ArrowLeft, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { DirectMessage } from "@shared/schema";

export default function SessionPage() {
    const { id } = useParams(); // Partner ID
    const { user } = useAuth();
    const [, setLocation] = useLocation();
    const [timeLeft, setTimeLeft] = useState(25 * 60); // 25 minutes
    const [isActive, setIsActive] = useState(false);
    const [newMessage, setNewMessage] = useState("");
    const [isTyping, setIsTyping] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);
    const [particles, setParticles] = useState<Array<{ id: number; x: number; y: number }>>([]);

    // Fetch partner info
    const { data: partner } = useQuery({
        queryKey: ["user", id],
        queryFn: async () => {
            const partnersRes = await apiRequest("GET", "/api/partners");
            const partners = await partnersRes.json();
            const p = partners.find((p: any) => p.otherUser.id === id);
            return p ? p.otherUser : null;
        },
        enabled: !!id
    });

    // Fetch messages
    const { data: messages = [] } = useQuery({
        queryKey: ["messages", id],
        queryFn: async () => {
            const res = await apiRequest("GET", `/api/partners/${id}/messages`);
            return res.json();
        },
        refetchInterval: 10000, // Reduced from 3s to 10s for better performance
        staleTime: 5000,
        enabled: !!id
    });

    const sendMessageMutation = useMutation({
        mutationFn: async (content: string) => {
            await apiRequest("POST", `/api/partners/${id}/messages`, { content });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["messages", id] });
            setNewMessage("");
        }
    });

    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (isActive && timeLeft > 0) {
            interval = setInterval(() => {
                setTimeLeft((prev) => prev - 1);
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [isActive, timeLeft]);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    // Particle effect when timer is active
    useEffect(() => {
        if (isActive) {
            const interval = setInterval(() => {
                setParticles(prev => [
                    ...prev.slice(-15), // Reduced from 20 to 15 for better performance
                    { id: Date.now(), x: Math.random() * 100, y: Math.random() * 100 }
                ]);
            }, 2000);
            return () => clearInterval(interval);
        }
    }, [isActive]);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const handleSendMessage = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim()) return;
        sendMessageMutation.mutate(newMessage);
    };

    const getProgressPercentage = () => {
        return ((25 * 60 - timeLeft) / (25 * 60)) * 100;
    };

    if (!partner) {
        return (
            <div className="flex items-center justify-center h-screen bg-gradient-to-br from-zinc-950 via-purple-950/20 to-zinc-950">
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                >
                    <Loader2 className="w-12 h-12 text-purple-500" />
                </motion.div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-purple-950/20 to-zinc-950 relative overflow-hidden">
            {/* Animated Background */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <motion.div
                    className="absolute top-0 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"
                    animate={{
                        scale: [1, 1.2, 1],
                        opacity: [0.3, 0.5, 0.3],
                    }}
                    transition={{ duration: 8, repeat: Infinity }}
                />
                <motion.div
                    className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"
                    animate={{
                        scale: [1.2, 1, 1.2],
                        opacity: [0.5, 0.3, 0.5],
                    }}
                    transition={{ duration: 8, repeat: Infinity }}
                />
            </div>

            {/* Particles */}
            <AnimatePresence>
                {particles.map(particle => (
                    <motion.div
                        key={particle.id}
                        className="absolute w-2 h-2 bg-purple-400/30 rounded-full"
                        initial={{ x: `${particle.x}%`, y: `${particle.y}%`, opacity: 0, scale: 0 }}
                        animate={{ opacity: [0, 1, 0], scale: [0, 1, 0], y: `${particle.y - 20}%` }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 3 }}
                    />
                ))}
            </AnimatePresence>

            <div className="relative z-10 p-6 h-screen flex flex-col">
                {/* Header */}
                <motion.div
                    initial={{ y: -20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="flex items-center justify-between mb-6"
                >
                    <Button
                        variant="ghost"
                        className="text-zinc-400 hover:text-white"
                        onClick={() => setLocation("/partners")}
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to Partners
                    </Button>
                    <div className="flex items-center gap-3 bg-zinc-900/50 backdrop-blur-xl border border-zinc-800 rounded-full px-6 py-3">
                        <Sparkles className="w-5 h-5 text-purple-400" />
                        <span className="text-white font-semibold">Deep Focus Session</span>
                    </div>
                </motion.div>

                <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 overflow-hidden">
                    {/* Main Timer Area */}
                    <motion.div
                        initial={{ x: -50, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: 0.1 }}
                        className="lg:col-span-2 flex flex-col gap-6"
                    >
                        {/* Timer Card */}
                        <Card className="flex-1 bg-zinc-900/50 border-zinc-800 backdrop-blur-xl relative overflow-hidden">
                            {/* Animated gradient background */}
                            <motion.div
                                className="absolute inset-0 opacity-30"
                                animate={{
                                    background: [
                                        "radial-gradient(circle at 20% 50%, rgba(168, 85, 247, 0.4) 0%, transparent 50%)",
                                        "radial-gradient(circle at 80% 50%, rgba(59, 130, 246, 0.4) 0%, transparent 50%)",
                                        "radial-gradient(circle at 20% 50%, rgba(168, 85, 247, 0.4) 0%, transparent 50%)",
                                    ]
                                }}
                                transition={{ duration: 10, repeat: Infinity }}
                            />

                            <CardContent className="h-full flex flex-col items-center justify-center relative z-10 p-8">
                                {/* Progress Ring */}
                                <div className="relative mb-8">
                                    <svg className="w-80 h-80 transform -rotate-90">
                                        <circle
                                            cx="160"
                                            cy="160"
                                            r="140"
                                            stroke="rgba(255,255,255,0.1)"
                                            strokeWidth="12"
                                            fill="none"
                                        />
                                        <motion.circle
                                            cx="160"
                                            cy="160"
                                            r="140"
                                            stroke="url(#gradient)"
                                            strokeWidth="12"
                                            fill="none"
                                            strokeLinecap="round"
                                            initial={{ strokeDasharray: "880", strokeDashoffset: "880" }}
                                            animate={{ strokeDashoffset: 880 - (880 * getProgressPercentage()) / 100 }}
                                            transition={{ duration: 0.5 }}
                                        />
                                        <defs>
                                            <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                                <stop offset="0%" stopColor="#a855f7" />
                                                <stop offset="100%" stopColor="#3b82f6" />
                                            </linearGradient>
                                        </defs>
                                    </svg>

                                    {/* Timer Display */}
                                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                                        <motion.div
                                            className="text-8xl font-bold font-mono tracking-wider bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent"
                                            animate={isActive ? { scale: [1, 1.02, 1] } : {}}
                                            transition={{ duration: 1, repeat: Infinity }}
                                        >
                                            {formatTime(timeLeft)}
                                        </motion.div>
                                        <p className="text-zinc-400 mt-4 text-lg">
                                            {isActive ? "Stay Focused 🎯" : "Ready to Start?"}
                                        </p>
                                    </div>
                                </div>

                                {/* Controls */}
                                <div className="flex gap-4">
                                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                                        <Button
                                            size="lg"
                                            className={`px-8 py-6 text-lg font-semibold rounded-xl ${isActive
                                                ? 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700'
                                                : 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700'
                                                } shadow-lg`}
                                            onClick={() => setIsActive(!isActive)}
                                        >
                                            {isActive ? (
                                                <>
                                                    <Zap className="w-5 h-5 mr-2" />
                                                    Pause
                                                </>
                                            ) : (
                                                <>
                                                    <Target className="w-5 h-5 mr-2" />
                                                    Start Focus
                                                </>
                                            )}
                                        </Button>
                                    </motion.div>
                                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                                        <Button
                                            size="lg"
                                            variant="outline"
                                            className="px-8 py-6 text-lg border-zinc-700 hover:bg-zinc-800 rounded-xl"
                                            onClick={() => setTimeLeft(25 * 60)}
                                        >
                                            Reset
                                        </Button>
                                    </motion.div>
                                </div>

                                {/* Session Stats */}
                                <div className="grid grid-cols-3 gap-4 mt-8 w-full max-w-md">
                                    <div className="bg-zinc-800/50 rounded-lg p-4 text-center backdrop-blur-sm">
                                        <Clock className="w-5 h-5 text-purple-400 mx-auto mb-2" />
                                        <p className="text-2xl font-bold text-white">25m</p>
                                        <p className="text-xs text-zinc-400">Duration</p>
                                    </div>
                                    <div className="bg-zinc-800/50 rounded-lg p-4 text-center backdrop-blur-sm">
                                        <TrendingUp className="w-5 h-5 text-blue-400 mx-auto mb-2" />
                                        <p className="text-2xl font-bold text-white">{Math.floor(getProgressPercentage())}%</p>
                                        <p className="text-xs text-zinc-400">Progress</p>
                                    </div>
                                    <div className="bg-zinc-800/50 rounded-lg p-4 text-center backdrop-blur-sm">
                                        <Sparkles className="w-5 h-5 text-yellow-400 mx-auto mb-2" />
                                        <p className="text-2xl font-bold text-white">+50</p>
                                        <p className="text-xs text-zinc-400">XP Reward</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>

                    {/* Chat Sidebar */}
                    <motion.div
                        initial={{ x: 50, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className="flex flex-col gap-6 h-full"
                    >
                        {/* Participants */}
                        <Card className="bg-zinc-900/50 border-zinc-800 backdrop-blur-xl">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-sm font-medium text-zinc-400 flex items-center gap-2">
                                    <Users className="w-4 h-4" />
                                    Study Partners
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    <motion.div
                                        initial={{ x: -20, opacity: 0 }}
                                        animate={{ x: 0, opacity: 1 }}
                                        className="flex items-center gap-3 p-2 rounded-lg bg-zinc-800/50"
                                    >
                                        <div className="relative">
                                            <Avatar className="border-2 border-green-500/50">
                                                <AvatarFallback className="bg-purple-600">{user?.name?.[0] || 'U'}</AvatarFallback>
                                            </Avatar>
                                            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-zinc-900" />
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-sm font-semibold text-white">You</p>
                                            <p className="text-xs text-green-400 flex items-center gap-1">
                                                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                                                {isActive ? "Deep Focus" : "Ready"}
                                            </p>
                                        </div>
                                    </motion.div>
                                    <motion.div
                                        initial={{ x: -20, opacity: 0 }}
                                        animate={{ x: 0, opacity: 1 }}
                                        transition={{ delay: 0.1 }}
                                        className="flex items-center gap-3 p-2 rounded-lg bg-zinc-800/50"
                                    >
                                        <div className="relative">
                                            <Avatar className="border-2 border-blue-500/50">
                                                <AvatarImage src={partner.avatarUrl} />
                                                <AvatarFallback className="bg-blue-600">{partner.name?.[0]}</AvatarFallback>
                                            </Avatar>
                                            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-zinc-900" />
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-sm font-semibold text-white">{partner.name}</p>
                                            <p className="text-xs text-green-400 flex items-center gap-1">
                                                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                                                Online
                                            </p>
                                        </div>
                                    </motion.div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Chat */}
                        <Card className="flex-1 bg-zinc-900/50 border-zinc-800 backdrop-blur-xl flex flex-col overflow-hidden">
                            <CardHeader className="pb-3 border-b border-zinc-800">
                                <CardTitle className="text-sm font-medium text-zinc-400 flex items-center gap-2">
                                    <MessageSquare className="w-4 h-4" />
                                    Session Chat
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
                                <ScrollArea className="flex-1 p-4" ref={scrollRef}>
                                    <div className="space-y-4">
                                        <AnimatePresence>
                                            {messages.map((msg: DirectMessage, index: number) => (
                                                <motion.div
                                                    key={msg.id}
                                                    initial={{ y: 20, opacity: 0 }}
                                                    animate={{ y: 0, opacity: 1 }}
                                                    transition={{ delay: index * 0.05 }}
                                                    className={`flex flex-col ${msg.senderId === user?.id ? 'items-end' : 'items-start'}`}
                                                >
                                                    <motion.div
                                                        whileHover={{ scale: 1.02 }}
                                                        className={`px-4 py-3 rounded-2xl text-sm max-w-[85%] shadow-lg ${msg.senderId === user?.id
                                                            ? 'bg-gradient-to-r from-purple-600 to-purple-700 text-white'
                                                            : 'bg-zinc-800 text-zinc-100 border border-zinc-700'
                                                            }`}
                                                    >
                                                        {msg.content}
                                                    </motion.div>
                                                    <span className="text-[10px] text-zinc-500 mt-1 px-2">
                                                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                </motion.div>
                                            ))}
                                        </AnimatePresence>
                                        {isTyping && (
                                            <motion.div
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                className="flex items-start"
                                            >
                                                <div className="bg-zinc-800 border border-zinc-700 rounded-2xl px-4 py-3">
                                                    <div className="flex gap-1">
                                                        <motion.div
                                                            className="w-2 h-2 bg-zinc-500 rounded-full"
                                                            animate={{ y: [0, -5, 0] }}
                                                            transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
                                                        />
                                                        <motion.div
                                                            className="w-2 h-2 bg-zinc-500 rounded-full"
                                                            animate={{ y: [0, -5, 0] }}
                                                            transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }}
                                                        />
                                                        <motion.div
                                                            className="w-2 h-2 bg-zinc-500 rounded-full"
                                                            animate={{ y: [0, -5, 0] }}
                                                            transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }}
                                                        />
                                                    </div>
                                                </div>
                                            </motion.div>
                                        )}
                                    </div>
                                </ScrollArea>
                                <div className="p-4 border-t border-zinc-800 bg-zinc-900/50">
                                    <form onSubmit={handleSendMessage} className="flex gap-2">
                                        <Input
                                            value={newMessage}
                                            onChange={(e) => setNewMessage(e.target.value)}
                                            placeholder="Send a message..."
                                            className="bg-zinc-800/50 border-zinc-700 focus:border-purple-500 h-11 rounded-xl text-white placeholder:text-zinc-500"
                                        />
                                        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                                            <Button
                                                type="submit"
                                                size="icon"
                                                className="h-11 w-11 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 rounded-xl shadow-lg"
                                                disabled={sendMessageMutation.isPending}
                                            >
                                                {sendMessageMutation.isPending ? (
                                                    <Loader2 className="w-5 h-5 animate-spin" />
                                                ) : (
                                                    <Send className="w-5 h-5" />
                                                )}
                                            </Button>
                                        </motion.div>
                                    </form>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                </div>
            </div>
        </div>
    );
}
