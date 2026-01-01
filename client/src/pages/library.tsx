import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { motion } from "framer-motion";
import { BookOpen, Video, FileText, Clock, Eye, Heart, Lock, Sparkles, Upload } from "lucide-react";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";

type ContentType = "all" | "article" | "video" | "guide";
type ContentCategory = "all" | "fitness" | "productivity" | "mindfulness" | "nutrition" | "sleep";

interface Content {
    id: string;
    title: string;
    description: string;
    type: string;
    category: string;
    thumbnailUrl: string;
    duration?: number;
    isPremium: boolean;
    views: number;
    likes: number;
}

export default function LibraryPage() {
    const { toast } = useToast();
    const [selectedType, setSelectedType] = useState<ContentType>("all");
    const [selectedCategory, setSelectedCategory] = useState<ContentCategory>("all");


    const { data: content, isLoading } = useQuery<Content[]>({
        queryKey: ["/api/content", selectedCategory, selectedType],
        queryFn: async () => {
            const params = new URLSearchParams();
            if (selectedCategory !== "all") params.append("category", selectedCategory);
            if (selectedType !== "all") params.append("type", selectedType);

            const res = await fetch(`/api/content?${params.toString()}`);
            if (!res.ok) throw new Error("Failed to fetch content");
            return res.json();
        },
    });

    const filteredContent = content || [];

    const getTypeIcon = (type: string) => {
        switch (type) {
            case "article": return BookOpen;
            case "video": return Video;
            case "guide": return FileText;
            default: return BookOpen;
        }
    };

    const getCategoryColor = (category: string) => {
        switch (category) {
            case "fitness": return "from-orange-500 to-red-600";
            case "productivity": return "from-blue-500 to-cyan-600";
            case "mindfulness": return "from-purple-500 to-pink-600";
            case "nutrition": return "from-green-500 to-emerald-600";
            case "sleep": return "from-indigo-500 to-violet-600";
            default: return "from-gray-500 to-gray-600";
        }
    };

    const container = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    const item = {
        hidden: { y: 20, opacity: 0 },
        show: { y: 0, opacity: 1 }
    };

    return (
        <div className="relative min-h-screen overflow-hidden">
            {/* Animated Background */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-background" />
                <motion.div
                    animate={{
                        scale: [1, 1.2, 1],
                        opacity: [0.15, 0.25, 0.15],
                        rotate: [0, 90, 0]
                    }}
                    transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
                    className="absolute -top-1/2 -left-1/2 w-full h-full bg-gradient-to-br from-purple-500/20 to-blue-600/20 rounded-full blur-[140px]"
                />
                <motion.div
                    animate={{
                        scale: [1, 1.3, 1],
                        opacity: [0.15, 0.25, 0.15],
                        rotate: [0, -90, 0]
                    }}
                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                    className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-gradient-to-tl from-pink-500/20 to-purple-600/20 rounded-full blur-[140px]"
                />
            </div>

            <div className="relative z-10 p-6 space-y-6">
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    <div className="flex items-center justify-between gap-3 mb-2">
                        <div className="flex items-center gap-3">
                            <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500 to-blue-600 shadow-lg shadow-purple-500/30">
                                <BookOpen className="h-6 w-6 text-white" />
                            </div>
                            <div>
                                <h1 className="text-4xl font-display font-bold bg-gradient-to-r from-purple-400 to-blue-600 bg-clip-text text-transparent">
                                    Content Library
                                </h1>
                                <p className="text-muted-foreground">
                                    Expand your knowledge with expert guides and resources
                                </p>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Category Filters */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                >
                    <Tabs value={selectedCategory} onValueChange={(v) => setSelectedCategory(v as ContentCategory)}>
                        <TabsList className="bg-black/40 backdrop-blur-xl border border-white/10">
                            <TabsTrigger value="all">All</TabsTrigger>
                            <TabsTrigger value="fitness">Fitness</TabsTrigger>
                            <TabsTrigger value="productivity">Productivity</TabsTrigger>
                            <TabsTrigger value="mindfulness">Mindfulness</TabsTrigger>
                            <TabsTrigger value="nutrition">Nutrition</TabsTrigger>
                            <TabsTrigger value="sleep">Sleep</TabsTrigger>
                        </TabsList>
                    </Tabs>
                </motion.div>

                {/* Type Filters */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="flex gap-2"
                >
                    {[
                        { value: "all", label: "All Content", icon: Sparkles },
                        { value: "article", label: "Articles", icon: BookOpen },
                        { value: "video", label: "Videos", icon: Video },
                        { value: "guide", label: "Guides", icon: FileText },
                    ].map((type) => (
                        <motion.button
                            key={type.value}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setSelectedType(type.value as ContentType)}
                            className={`px-4 py-2 rounded-lg border transition-all flex items-center gap-2 ${selectedType === type.value
                                ? "bg-primary text-primary-foreground border-primary"
                                : "bg-black/20 border-white/10 hover:bg-white/5"
                                }`}
                        >
                            <type.icon className="h-4 w-4" />
                            {type.label}
                        </motion.button>
                    ))}
                </motion.div>

                {/* Content Grid */}
                {isLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[1, 2, 3, 4, 5, 6].map((i) => (
                            <Card key={i} className="border-white/10 bg-black/40 backdrop-blur-xl animate-pulse">
                                <div className="h-4 bg-white/5 rounded-t-xl" />
                                <CardHeader>
                                    <div className="h-6 bg-white/5 rounded w-3/4 mb-2" />
                                    <div className="h-4 bg-white/5 rounded w-full" />
                                </CardHeader>
                            </Card>
                        ))}
                    </div>
                ) : (
                    <motion.div
                        variants={container}
                        initial="hidden"
                        animate="show"
                        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                    >
                        {filteredContent.map((contentItem) => {
                            const TypeIcon = getTypeIcon(contentItem.type);

                            return (
                                <motion.div key={contentItem.id} variants={item}>
                                    <Link href={`/library/${contentItem.id}`}>
                                        <Card className="border-white/10 bg-black/40 backdrop-blur-xl hover:border-purple-500/30 transition-all duration-300 cursor-pointer group overflow-hidden h-full">
                                            {/* Thumbnail */}
                                            <div className="relative h-48 overflow-hidden">
                                                <img
                                                    src={contentItem.thumbnailUrl}
                                                    alt={contentItem.title}
                                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                                />
                                                <div className={`absolute inset-0 bg-gradient-to-t ${getCategoryColor(contentItem.category)} opacity-20 group-hover:opacity-30 transition-opacity`} />

                                                {/* Premium Badge */}
                                                {contentItem.isPremium && (
                                                    <div className="absolute top-3 right-3 px-2 py-1 rounded-full bg-yellow-500/90 backdrop-blur-sm flex items-center gap-1">
                                                        <Lock className="h-3 w-3 text-black" />
                                                        <span className="text-xs font-bold text-black">Premium</span>
                                                    </div>
                                                )}

                                                {/* Type Badge */}
                                                <div className="absolute top-3 left-3 px-2 py-1 rounded-full bg-black/60 backdrop-blur-sm flex items-center gap-1">
                                                    <TypeIcon className="h-3 w-3" />
                                                    <span className="text-xs capitalize">{contentItem.type}</span>
                                                </div>

                                                {/* Duration for videos */}
                                                {contentItem.duration && (
                                                    <div className="absolute bottom-3 right-3 px-2 py-1 rounded-full bg-black/60 backdrop-blur-sm flex items-center gap-1">
                                                        <Clock className="h-3 w-3" />
                                                        <span className="text-xs">{contentItem.duration} min</span>
                                                    </div>
                                                )}
                                            </div>

                                            <CardHeader>
                                                <div className="flex items-start justify-between gap-2 mb-2">
                                                    <Badge variant="outline" className={`bg-gradient-to-r ${getCategoryColor(contentItem.category)} text-white border-0`}>
                                                        {contentItem.category}
                                                    </Badge>
                                                </div>
                                                <CardTitle className="group-hover:text-purple-400 transition-colors line-clamp-2">
                                                    {contentItem.title}
                                                </CardTitle>
                                                <CardDescription className="line-clamp-2">
                                                    {contentItem.description}
                                                </CardDescription>
                                            </CardHeader>

                                            <CardContent>
                                                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                                    <div className="flex items-center gap-1">
                                                        <Eye className="h-4 w-4" />
                                                        {contentItem.views}
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        <Heart className="h-4 w-4" />
                                                        {contentItem.likes}
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </Link>
                                </motion.div>
                            );
                        })}
                    </motion.div>
                )}

                {filteredContent.length === 0 && !isLoading && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="text-center py-12"
                    >
                        <BookOpen className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                        <h3 className="text-xl font-semibold mb-2">No content found</h3>
                        <p className="text-muted-foreground">
                            Try adjusting your filters to see more content
                        </p>
                    </motion.div>
                )}
            </div>
        </div>
    );
}
