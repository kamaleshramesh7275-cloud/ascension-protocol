import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { ShopItem, UserItem, User } from "@shared/schema";
import { Loader2, Coins, ShoppingBag, Check, Shield, Award, Palette } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { apiRequest } from "@/lib/queryClient";

export default function StorePage() {
    const { user } = useAuth();
    const { toast } = useToast();
    const queryClient = useQueryClient();

    const { data: items, isLoading: itemsLoading } = useQuery<ShopItem[]>({
        queryKey: ["/api/shop"],
    });

    const { data: inventory, isLoading: inventoryLoading } = useQuery<UserItem[]>({
        queryKey: ["/api/shop/inventory"],
    });

    const purchaseMutation = useMutation({
        mutationFn: async (itemId: string) => {
            const res = await apiRequest("POST", "/api/shop/buy", { itemId });
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/shop/inventory"] });
            queryClient.invalidateQueries({ queryKey: ["/api/user"] }); // Update coins
            toast({
                title: "Purchase Successful!",
                description: "Item added to your inventory.",
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
        mutationFn: async ({ itemId, type }: { itemId: string; type: 'title' | 'badge' | 'theme' }) => {
            const res = await apiRequest("POST", "/api/shop/equip", { itemId, type });
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/user"] });
            toast({
                title: "Equipped!",
                description: "Your profile has been updated.",
            });
        },
        onError: (error: Error) => {
            toast({
                title: "Equip Failed",
                description: error.message,
                variant: "destructive",
            });
        },
    });

    if (itemsLoading || inventoryLoading || !user) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    const ownedItemIds = new Set(inventory?.map((i) => i.itemId));

    const titles = items?.filter((i) => i.type === "title") || [];
    const badges = items?.filter((i) => i.type === "badge") || [];
    const themes = items?.filter((i) => i.type === "theme") || [];

    const ItemCard = ({ item }: { item: ShopItem }) => {
        const isOwned = ownedItemIds.has(item.id);
        let isEquipped = false;

        if (item.type === 'title') isEquipped = user.activeTitle === item.name;
        else if (item.type === 'badge') isEquipped = user.activeBadgeId === item.value;
        else if (item.type === 'theme') isEquipped = user.theme === item.value;

        const canAfford = (user.coins || 0) >= item.cost;

        return (
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ scale: 1.02 }}
                transition={{ duration: 0.2 }}
            >
                <Card className={`h-full flex flex-col ${isEquipped ? 'border-primary shadow-lg shadow-primary/20' : ''}`}>
                    <CardHeader>
                        <div className="flex justify-between items-start">
                            <div>
                                <CardTitle className="text-lg">{item.name}</CardTitle>
                                <CardDescription className="mt-1">{item.description}</CardDescription>
                            </div>
                            {item.type === 'badge' && (
                                <Award className={`h-8 w-8 ${item.rarity === 'common' ? 'text-orange-400' :
                                    item.rarity === 'rare' ? 'text-slate-400' :
                                        item.rarity === 'epic' ? 'text-yellow-400' : 'text-purple-400'
                                    }`} />
                            )}
                            {item.type === 'title' && (
                                <Shield className="h-8 w-8 text-blue-400" />
                            )}
                            {item.type === 'theme' && (
                                <Palette className="h-8 w-8 text-pink-400" />
                            )}
                        </div>
                    </CardHeader>
                    <CardContent className="flex-1">
                        <div className="flex items-center gap-2 mt-2">
                            <span className={`px-2 py-1 rounded text-xs font-medium uppercase ${item.rarity === 'common' ? 'bg-slate-500/10 text-slate-500' :
                                item.rarity === 'rare' ? 'bg-blue-500/10 text-blue-500' :
                                    item.rarity === 'epic' ? 'bg-purple-500/10 text-purple-500' :
                                        'bg-orange-500/10 text-orange-500'
                                }`}>
                                {item.rarity}
                            </span>
                        </div>
                    </CardContent>
                    <CardFooter>
                        {isOwned ? (
                            <Button
                                className="w-full"
                                variant={isEquipped ? "outline" : "default"}
                                disabled={isEquipped || equipMutation.isPending}
                                onClick={() => equipMutation.mutate({ itemId: item.id, type: item.type as 'title' | 'badge' | 'theme' })}
                            >
                                {isEquipped ? (
                                    <>
                                        <Check className="mr-2 h-4 w-4" /> Equipped
                                    </>
                                ) : (
                                    "Equip"
                                )}
                            </Button>
                        ) : (
                            <Button
                                className="w-full"
                                variant={canAfford ? "default" : "secondary"}
                                disabled={!canAfford || purchaseMutation.isPending}
                                onClick={() => purchaseMutation.mutate(item.id)}
                            >
                                <Coins className="mr-2 h-4 w-4 text-yellow-500" />
                                {item.cost} Coins
                            </Button>
                        )}
                    </CardFooter>
                </Card>
            </motion.div>
        );
    };

    return (
        <div className="space-y-8 p-8 max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Ascension Store</h1>
                    <p className="text-muted-foreground mt-1">
                        Spend your hard-earned coins on exclusive titles, badges, and themes.
                    </p>
                </div>
                <Card className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border-yellow-500/20">
                    <CardContent className="p-4 flex items-center gap-4">
                        <div className="p-3 bg-yellow-500/20 rounded-full">
                            <Coins className="h-6 w-6 text-yellow-500" />
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground font-medium">Your Balance</p>
                            <p className="text-2xl font-bold text-yellow-500">{user.coins || 0} Coins</p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Tabs defaultValue="themes" className="w-full">
                <TabsList className="grid w-full grid-cols-3 max-w-[600px]">
                    <TabsTrigger value="themes">Themes</TabsTrigger>
                    <TabsTrigger value="titles">Titles</TabsTrigger>
                    <TabsTrigger value="badges">Badges</TabsTrigger>
                </TabsList>

                <TabsContent value="titles" className="mt-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {titles.map((item) => (
                            <ItemCard key={item.id} item={item} />
                        ))}
                    </div>
                </TabsContent>

                <TabsContent value="badges" className="mt-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {badges.map((item) => (
                            <ItemCard key={item.id} item={item} />
                        ))}
                    </div>
                </TabsContent>

                <TabsContent value="themes" className="mt-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {themes.map((item) => (
                            <ItemCard key={item.id} item={item} />
                        ))}
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}
