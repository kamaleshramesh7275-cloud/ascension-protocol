import { useState } from "react";
import { motion } from "framer-motion";
import { UserPlus, LogIn, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useLocation } from "wouter";

export default function AccountSelection() {
    const [, setLocation] = useLocation();

    return (
        <div className="min-h-screen bg-gradient-to-br from-black via-purple-950/20 to-black flex items-center justify-center p-6">
            <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2072&auto=format&fit=crop')] bg-cover opacity-10" />

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative z-10 w-full max-w-4xl"
            >
                <div className="text-center mb-12">
                    <h1 className="text-5xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-blue-500">
                        Welcome, Ascendant
                    </h1>
                    <p className="text-xl text-zinc-400">Choose your path</p>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                    {/* New User Card */}
                    <motion.div
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                    >
                        <Card
                            className="h-full bg-gradient-to-br from-purple-900/20 to-black border-purple-500/30 hover:border-purple-500/60 transition-all cursor-pointer"
                            onClick={() => setLocation("/register")}
                        >
                            <CardHeader className="text-center pb-4">
                                <div className="mx-auto mb-4 w-20 h-20 rounded-full bg-purple-500/20 flex items-center justify-center">
                                    <UserPlus className="w-10 h-10 text-purple-400" />
                                </div>
                                <CardTitle className="text-2xl">New User</CardTitle>
                                <CardDescription className="text-base">Begin your ascension journey</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <ul className="space-y-3 text-sm text-zinc-300">
                                    <li className="flex items-start gap-2">
                                        <ArrowRight className="w-4 h-4 text-purple-400 mt-0.5 flex-shrink-0" />
                                        <span>Complete initial assessment</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <ArrowRight className="w-4 h-4 text-purple-400 mt-0.5 flex-shrink-0" />
                                        <span>Create your unique username</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <ArrowRight className="w-4 h-4 text-purple-400 mt-0.5 flex-shrink-0" />
                                        <span>Set a secure password</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <ArrowRight className="w-4 h-4 text-purple-400 mt-0.5 flex-shrink-0" />
                                        <span>Start earning XP and leveling up</span>
                                    </li>
                                </ul>
                                <Button className="w-full bg-purple-600 hover:bg-purple-700 mt-6">
                                    Start Your Journey
                                </Button>
                            </CardContent>
                        </Card>
                    </motion.div>

                    {/* Returning User Card */}
                    <motion.div
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                    >
                        <Card
                            className="h-full bg-gradient-to-br from-blue-900/20 to-black border-blue-500/30 hover:border-blue-500/60 transition-all cursor-pointer"
                            onClick={() => setLocation("/login")}
                        >
                            <CardHeader className="text-center pb-4">
                                <div className="mx-auto mb-4 w-20 h-20 rounded-full bg-blue-500/20 flex items-center justify-center">
                                    <LogIn className="w-10 h-10 text-blue-400" />
                                </div>
                                <CardTitle className="text-2xl">Returning User</CardTitle>
                                <CardDescription className="text-base">Continue your ascension</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <ul className="space-y-3 text-sm text-zinc-300">
                                    <li className="flex items-start gap-2">
                                        <ArrowRight className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
                                        <span>Access your existing account</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <ArrowRight className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
                                        <span>Continue your quests</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <ArrowRight className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
                                        <span>Check your guild progress</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <ArrowRight className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
                                        <span>Climb the leaderboard</span>
                                    </li>
                                </ul>
                                <Button className="w-full bg-blue-600 hover:bg-blue-700 mt-6">
                                    Login to Account
                                </Button>
                            </CardContent>
                        </Card>
                    </motion.div>
                </div>

                <div className="text-center mt-8">
                    <button
                        onClick={() => setLocation("/")}
                        className="text-sm text-zinc-500 hover:text-zinc-300 transition-colors"
                    >
                        ← Back to Home
                    </button>
                </div>
            </motion.div>
        </div>
    );
}
