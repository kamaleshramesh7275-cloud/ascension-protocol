import { useRoute, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { ArrowLeft, Clock, Eye, Heart, Share2, Bookmark, Play, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Content {
    id: string;
    title: string;
    description: string;
    type: "article" | "video" | "guide";
    category: string;
    content?: string;
    videoUrl?: string;
    thumbnailUrl: string;
    duration?: number;
    isPremium: boolean;
    views: number;
    likes: number;
    createdAt: string;
}

export default function ContentDetailPage() {
    const [, params] = useRoute("/library/:id");
    const [, setLocation] = useLocation();
    const id = params?.id;

    const { data: content, isLoading } = useQuery<Content>({
        queryKey: [`/api/content/${id}`],
        enabled: !!id,
    });

    const getCategoryColor = (category: string) => {
        switch (category) {
            case "fitness": return "text-orange-500 bg-orange-500/10 border-orange-500/20";
            case "productivity": return "text-blue-500 bg-blue-500/10 border-blue-500/20";
            case "mindfulness": return "text-purple-500 bg-purple-500/10 border-purple-500/20";
            case "nutrition": return "text-green-500 bg-green-500/10 border-green-500/20";
            case "sleep": return "text-indigo-500 bg-indigo-500/10 border-indigo-500/20";
            default: return "text-gray-500 bg-gray-500/10 border-gray-500/20";
        }
    };

    // Simple Markdown Parser
    const renderContent = (text?: string) => {
        if (!text) return null;

        return text.split('\n').map((line, index) => {
            // Headers
            if (line.startsWith('# ')) {
                return <h1 key={index} className="text-3xl font-bold mt-8 mb-4 text-white">{line.replace('# ', '')}</h1>;
            }
            if (line.startsWith('## ')) {
                return <h2 key={index} className="text-2xl font-semibold mt-6 mb-3 text-purple-200">{line.replace('## ', '')}</h2>;
            }
            if (line.startsWith('### ')) {
                return <h3 key={index} className="text-xl font-semibold mt-4 mb-2 text-purple-100">{line.replace('### ', '')}</h3>;
            }

            // Lists
            if (line.startsWith('- ')) {
                return (
                    <li key={index} className="ml-4 list-disc text-muted-foreground mb-1">
                        {parseInline(line.replace('- ', ''))}
                    </li>
                );
            }

            // Empty lines
            if (line.trim() === '') {
                return <div key={index} className="h-4" />;
            }

            // Paragraphs
            return (
                <p key={index} className="text-muted-foreground leading-relaxed mb-2">
                    {parseInline(line)}
                </p>
            );
        });
    };

    // Helper for inline styles (bold)
    const parseInline = (text: string) => {
        const parts = text.split(/(\*\*.*?\*\*)/g);
        return parts.map((part, i) => {
            if (part.startsWith('**') && part.endsWith('**')) {
                return <strong key={i} className="text-white font-semibold">{part.slice(2, -2)}</strong>;
            }
            return part;
        });
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-background p-6">
                <div className="max-w-4xl mx-auto space-y-8">
                    <Skeleton className="h-8 w-32" />
                    <Skeleton className="h-[400px] w-full rounded-xl" />
                    <div className="space-y-4">
                        <Skeleton className="h-12 w-3/4" />
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-2/3" />
                    </div>
                </div>
            </div>
        );
    }

    if (!content) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <h2 className="text-2xl font-bold mb-2">Content Not Found</h2>
                    <Button onClick={() => setLocation("/library")}>Return to Library</Button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background relative overflow-hidden">
            {/* Background Gradient */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-purple-900/20 to-transparent" />
            </div>

            <ScrollArea className="h-screen">
                <div className="max-w-4xl mx-auto p-6 pb-20 relative z-10">
                    {/* Header Navigation */}
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-center justify-between mb-8"
                    >
                        <Button
                            variant="ghost"
                            className="gap-2 hover:bg-white/10"
                            onClick={() => setLocation("/library")}
                        >
                            <ArrowLeft className="h-4 w-4" />
                            Back to Library
                        </Button>

                        <div className="flex gap-2">
                            <Button variant="ghost" size="icon" className="hover:bg-white/10">
                                <Share2 className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="hover:bg-white/10">
                                <Bookmark className="h-4 w-4" />
                            </Button>
                        </div>
                    </motion.div>

                    {/* Main Content */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="space-y-8"
                    >
                        {/* Media Section */}
                        <div className="relative rounded-2xl overflow-hidden bg-black/40 border border-white/10 shadow-2xl aspect-video group">
                            {content.type === "video" && content.videoUrl ? (
                                <iframe
                                    src={content.videoUrl}
                                    title={content.title}
                                    className="w-full h-full"
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    allowFullScreen
                                />
                            ) : (
                                <>
                                    <img
                                        src={content.thumbnailUrl}
                                        alt={content.title}
                                        className="w-full h-full object-cover"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                                </>
                            )}

                            {content.isPremium && (
                                <div className="absolute top-4 right-4 px-3 py-1.5 rounded-full bg-yellow-500/90 backdrop-blur-md flex items-center gap-2 shadow-lg">
                                    <Lock className="h-4 w-4 text-black" />
                                    <span className="text-sm font-bold text-black">Premium Content</span>
                                </div>
                            )}
                        </div>

                        {/* Title & Meta */}
                        <div className="space-y-4">
                            <div className="flex flex-wrap gap-3">
                                <Badge variant="outline" className={getCategoryColor(content.category)}>
                                    {content.category}
                                </Badge>
                                <Badge variant="outline" className="bg-white/5 border-white/10">
                                    {content.type}
                                </Badge>
                                {content.duration && (
                                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground bg-white/5 px-3 py-1 rounded-full border border-white/10">
                                        <Clock className="h-3.5 w-3.5" />
                                        {content.duration} min
                                    </div>
                                )}
                            </div>

                            <h1 className="text-4xl md:text-5xl font-display font-bold leading-tight bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
                                {content.title}
                            </h1>

                            <div className="flex items-center gap-6 text-muted-foreground border-b border-white/10 pb-8">
                                <div className="flex items-center gap-2">
                                    <Eye className="h-4 w-4" />
                                    <span>{content.views} views</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Heart className="h-4 w-4 text-red-500/50" />
                                    <span>{content.likes} likes</span>
                                </div>
                                <div className="flex-1" />
                                <span className="text-sm">
                                    {new Date(content.createdAt).toLocaleDateString()}
                                </span>
                            </div>
                        </div>

                        {/* Article Content */}
                        {content.type !== "video" && (
                            <div className="prose prose-invert prose-lg max-w-none">
                                {renderContent(content.content)}
                            </div>
                        )}

                        {/* Video Description */}
                        {content.type === "video" && (
                            <div className="prose prose-invert prose-lg max-w-none">
                                <p className="text-lg text-muted-foreground leading-relaxed">
                                    {content.description}
                                </p>
                            </div>
                        )}
                    </motion.div>
                </div>
            </ScrollArea>
        </div>
    );
}
