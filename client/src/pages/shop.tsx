import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { ShoppingBag, Coins, Check, Lock, Star, Palette, User as UserIcon, Loader2, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { ShopItem, UserItem, User } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";

export default function ShopPage() {
    const { toast } = useToast();
    const [activeTab, setActiveTab] = useState("avatar");

    const { data: user } = useQuery<User>({
        queryKey: ["/api/user"],
    });

    const { data: items, isLoading: itemsLoading } = useQuery<ShopItem[]>({
        queryKey: ["/api/shop"],
    });

    const { data: inventory, isLoading: inventoryLoading } = useQuery<UserItem[]>({
        queryKey: ["/api/shop/inventory"],
    });

    const buyMutation = useMutation({
        mutationFn: async (itemId: string) => {
            const res = await apiRequest("POST", "/api/shop/buy", { itemId });
            return res.json();
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ["/api/user"] });
            queryClient.invalidateQueries({ queryKey: ["/api/shop/inventory"] });
            toast({
                title: "Purchase Successful!",
                description: `You spent ${data.item.cost} coins.`,
                variant: "default",
            });
        },
        onError: (error: Error) => {
            toast({
                title: "Purchase Failed",
                description: error.message,
                variant: "destructive",
            });
        },
    });

    const equipMutation = useMutation({
        mutationFn: async ({ itemId, type }: { itemId: string; type: string }) => {
            const res = await apiRequest("POST", "/api/shop/equip", { itemId, type });
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/user"] });
            queryClient.invalidateQueries({ queryKey: ["/api/shop/inventory"] });
            toast({
                title: "Equipped!",
                description: "Your profile has been updated.",
            });
        },
    });

    const isOwned = (itemId: string) => inventory?.some((i) => i.itemId === itemId);
    const isEquipped = (itemId: string) => inventory?.find((i) => i.itemId === itemId)?.equipped;

    const filteredItems = items?.filter((item) => item.type === activeTab) || [];

    const getRarityColor = (rarity: string) => {
        switch (rarity) {
            case "common": return "text-gray-400 border-gray-400/20 bg-gray-400/10";
            case "rare": return "text-blue-400 border-blue-400/20 bg-blue-400/10";
            case "epic": return "text-purple-400 border-purple-400/20 bg-purple-400/10";
            case "legendary": return "text-yellow-400 border-yellow-400/20 bg-yellow-400/10";
            default: return "text-gray-400";
        }
    };

    if (itemsLoading || inventoryLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background p-6 pb-20 md:pb-6">
            <div className="max-w-6xl mx-auto space-y-8">

                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight mb-2">Item Shop</h1>
                        <p className="text-muted-foreground">Customize your experience with premium items.</p>
                    </div>

                    <div className="flex items-center gap-3 bg-yellow-500/10 border border-yellow-500/20 px-4 py-2 rounded-xl">
                        <Coins className="h-5 w-5 text-yellow-500" />
                        <span className="text-xl font-bold text-yellow-500">{user?.coins || 0}</span>
                        <span className="text-sm text-yellow-500/70 font-medium">COINS</span>
                    </div>
                </div>

                {/* Tabs */}
                <Tabs defaultValue="avatar" value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="grid w-full grid-cols-4 max-w-xl mb-8">
                        <TabsTrigger value="avatar" className="gap-2">
                            <UserIcon className="h-4 w-4" /> Avatars
                        </TabsTrigger>
                        <TabsTrigger value="badge" className="gap-2">
                            <Star className="h-4 w-4" /> Badges
                        </TabsTrigger>
                        <TabsTrigger value="title" className="gap-2">
                            <Crown className="h-4 w-4" /> Titles
                        </TabsTrigger>
                        <TabsTrigger value="theme" className="gap-2">
                            <Palette className="h-4 w-4" /> Themes
                        </TabsTrigger>
                    </TabsList>

                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeTab}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.2 }}
                            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                        >
                            {filteredItems.map((item) => {
                                const owned = isOwned(item.id);
                                const equipped = isEquipped(item.id);
                                const canAfford = (user?.coins || 0) >= item.cost;

                                return (
                                    <div
                                        key={item.id}
                                        className={`
                      relative group overflow-hidden rounded-2xl border bg-card p-6 transition-all duration-300
                      ${equipped ? "border-primary ring-1 ring-primary" : "border-border hover:border-primary/50"}
                    `}
                                    >
                                        {/* Rarity Badge */}
                                        <div className={`absolute top-4 right-4 px-2 py-0.5 text-xs font-bold uppercase rounded-full border ${getRarityColor(item.rarity)}`}>
                                            {item.rarity}
                                        </div>

                                        {/* Content */}
                                        <div className="flex flex-col items-center text-center space-y-4 pt-4">
                                            <div className="relative w-24 h-24 rounded-full overflow-hidden bg-secondary/50 flex items-center justify-center mb-2">
                                                {item.type === "avatar" ? (
                                                    <img src={item.value} alt={item.name} className="w-full h-full object-cover" />
                                                ) : item.type === "badge" ? (
                                                    <img src={item.value} alt={item.name} className="w-16 h-16 object-contain" />
                                                ) : item.type === "title" ? (
                                                    <div className="flex flex-col items-center justify-center h-full w-full p-2 bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20">
                                                        <Crown className="h-8 w-8 text-yellow-500 mb-1" />
                                                        <span className="text-xs font-bold text-center leading-tight">{item.value}</span>
                                                    </div>
                                                ) : (
                                                    <div className={`w-full h-full bg-gradient-to-br ${item.value === 'midnight' ? 'from-slate-900 to-black' : 'from-orange-400 to-pink-500'}`} />
                                                )}
                                            </div>

                                            <div>
                                                <h3 className="font-bold text-lg">{item.name}</h3>
                                                <p className="text-sm text-muted-foreground line-clamp-2 h-10">{item.description}</p>
                                            </div>

                                            <div className="w-full pt-4 border-t border-border mt-auto">
                                                {owned ? (
                                                    <Button
                                                        variant={equipped ? "secondary" : "outline"}
                                                        className="w-full gap-2"
                                                        onClick={() => !equipped && equipMutation.mutate({ itemId: item.id, type: item.type })}
                                                        disabled={equipped || equipMutation.isPending}
                                                    >
                                                        {equipped ? (
                                                            <>
                                                                <Check className="h-4 w-4" /> Equipped
                                                            </>
                                                        ) : (
                                                            "Equip"
                                                        )}
                                                    </Button>
                                                ) : (
                                                    <Button
                                                        className="w-full gap-2"
                                                        onClick={() => buyMutation.mutate(item.id)}
                                                        disabled={!canAfford || buyMutation.isPending}
                                                        variant={canAfford ? "default" : "secondary"}
                                                    >
                                                        {buyMutation.isPending ? (
                                                            <Loader2 className="h-4 w-4 animate-spin" />
                                                        ) : (
                                                            <>
                                                                <Coins className="h-4 w-4" /> {item.cost}
                                                            </>
                                                        )}
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </motion.div>
                    </AnimatePresence>
                </Tabs>
            </div>
        </div>
    );
}
