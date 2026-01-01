import { LayoutDashboard, Trophy, User, Swords, Activity, LogOut, BookOpen, Shield, Brain, Users, MessageSquare, ShoppingBag, Map, Lock } from "lucide-react";
import { useLocation } from "wouter";
import {
    Sidebar,
    SidebarContent,
    SidebarGroup,
    SidebarGroupContent,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarHeader,
    SidebarFooter,
} from "@/components/ui/sidebar";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useQuery } from "@tanstack/react-query";
import { User as BackendUser } from "@shared/schema";
import { motion, useMotionTemplate, useMotionValue } from "framer-motion";

export function AppSidebar() {
    const [location, setLocation] = useLocation();
    const { user: firebaseUser, signOut } = useAuth();

    const { data: user } = useQuery<BackendUser>({
        queryKey: ["/api/user"],
        enabled: !!firebaseUser,
    });

    const items = [
        {
            title: "Dashboard",
            url: "/dashboard",
            icon: LayoutDashboard,
            color: "text-violet-500",
            activeBg: "bg-violet-500/10",
            activeBorder: "border-violet-500",
            gradient: "from-violet-500/20 to-transparent"
        },
        {
            title: "Quests",
            url: "/quests",
            icon: Swords,
            color: "text-orange-500",
            activeBg: "bg-orange-500/10",
            activeBorder: "border-orange-500",
            gradient: "from-orange-500/20 to-transparent"
        },
        {
            title: "Roadmap",
            url: "/roadmap",
            icon: Map,
            color: "text-red-500",
            activeBg: "bg-red-500/10",
            activeBorder: "border-red-500",
            gradient: "from-red-500/20 to-transparent",
            premiumOnly: true
        },
        {
            title: "Focus Sanctum",
            url: "/focus",
            icon: Brain,
            color: "text-blue-600",
            activeBg: "bg-blue-600/10",
            activeBorder: "border-blue-600",
            gradient: "from-blue-600/20 to-transparent"
        },
        {
            title: "Store",
            url: "/store",
            icon: ShoppingBag,
            color: "text-amber-500",
            activeBg: "bg-amber-500/10",
            activeBorder: "border-amber-500",
            gradient: "from-amber-500/20 to-transparent"
        },
        {
            title: "Stats",
            url: "/stats",
            icon: Activity,
            color: "text-sky-500",
            activeBg: "bg-sky-500/10",
            activeBorder: "border-sky-500",
            gradient: "from-sky-500/20 to-transparent"
        },
        {
            title: "Leaderboard",
            url: "/leaderboard",
            icon: Trophy,
            color: "text-yellow-500",
            activeBg: "bg-yellow-500/10",
            activeBorder: "border-yellow-500",
            gradient: "from-yellow-500/20 to-transparent"
        },
        {
            title: "Profile",
            url: "/profile",
            icon: User,
            color: "text-emerald-500",
            activeBg: "bg-emerald-500/10",
            activeBorder: "border-emerald-500",
            gradient: "from-emerald-500/20 to-transparent"
        },
        {
            title: "Library",
            url: "/library",
            icon: BookOpen,
            color: "text-purple-500",
            activeBg: "bg-purple-500/10",
            activeBorder: "border-purple-500",
            gradient: "from-purple-500/20 to-transparent"
        },
        // {
        //     title: "Guilds",
        //     url: "/guilds",
        //     icon: Shield,
        //     color: "text-cyan-500",
        //     activeBg: "bg-cyan-500/10",
        //     activeBorder: "border-cyan-500",
        //     gradient: "from-cyan-500/20 to-transparent"
        // },
        {
            title: "Partners",
            url: "/partners",
            icon: Users,
            color: "text-pink-500",
            activeBg: "bg-pink-500/10",
            activeBorder: "border-pink-500",
            gradient: "from-pink-500/20 to-transparent"
        },
        {
            title: "Global Chat",
            url: "/global-chat",
            icon: MessageSquare,
            color: "text-indigo-500",
            activeBg: "bg-indigo-500/10",
            activeBorder: "border-indigo-500",
            gradient: "from-indigo-500/20 to-transparent"
        },
    ];

    // Spotlight Effect
    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);

    function handleMouseMove({ currentTarget, clientX, clientY }: React.MouseEvent) {
        const { left, top } = currentTarget.getBoundingClientRect();
        mouseX.set(clientX - left);
        mouseY.set(clientY - top);
    }

    return (
        <Sidebar
            className="border-r border-white/10 bg-black/40 backdrop-blur-xl overflow-hidden group/sidebar"
            onMouseMove={handleMouseMove}
        >
            {/* Spotlight Gradient */}
            <motion.div
                className="pointer-events-none absolute -inset-px rounded-xl opacity-0 transition duration-300 group-hover/sidebar:opacity-100"
                style={{
                    background: useMotionTemplate`
            radial-gradient(
              650px circle at ${mouseX}px ${mouseY}px,
              rgba(255, 255, 255, 0.05),
              transparent 80%
            )
          `,
                }}
            />

            <SidebarHeader className="p-6 relative z-10">
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5 }}
                    className="flex items-center gap-2 px-2"
                >
                    <motion.div
                        whileHover={{ rotate: 180, scale: 1.1 }}
                        transition={{ duration: 0.3 }}
                        className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-600 flex items-center justify-center shadow-lg shadow-violet-500/20"
                    >
                        <Activity className="w-5 h-5 text-white" />
                    </motion.div>
                    <h1 className="text-xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
                        Ascension
                    </h1>
                </motion.div>
            </SidebarHeader>

            <SidebarContent className="px-4 relative z-10">
                <SidebarGroup>
                    <SidebarGroupContent>
                        <SidebarMenu className="space-y-2">
                            {items.map((item, index) => {
                                const isActive = location === item.url;
                                return (
                                    <SidebarMenuItem key={item.title}>
                                        <motion.div
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: 0.1 * index }}
                                        >
                                            <SidebarMenuButton
                                                isActive={isActive}
                                                onClick={() => setLocation(item.url)}
                                                className={`
                          w-full justify-start gap-3 px-4 py-6 rounded-xl transition-all duration-200 group relative overflow-hidden
                          ${isActive
                                                        ? `${item.color} font-semibold`
                                                        : "text-muted-foreground hover:bg-white/5 hover:text-white"
                                                    }
                        `}
                                            >
                                                {isActive && (
                                                    <motion.div
                                                        layoutId="activeTab"
                                                        className={`absolute inset-0 ${item.activeBg} border-l-4 ${item.activeBorder}`}
                                                        initial={{ opacity: 0 }}
                                                        animate={{ opacity: 1 }}
                                                        exit={{ opacity: 0 }}
                                                    >
                                                        <div className={`absolute inset-0 bg-gradient-to-r ${item.gradient} opacity-50`} />
                                                    </motion.div>
                                                )}
                                                <motion.div
                                                    className="relative z-10 flex items-center gap-3"
                                                    whileHover={{ x: 5 }}
                                                >
                                                    <item.icon
                                                        className={`w-5 h-5 transition-transform duration-300 ${isActive ? item.color : `group-hover:${item.color} group-hover:scale-110 group-hover:rotate-3`}`}
                                                    />
                                                    <span>{item.title}</span>
                                                    {(item as any).premiumOnly && !user?.isPremium && (
                                                        <Lock className="w-3 h-3 ml-auto text-zinc-500" />
                                                    )}
                                                </motion.div>
                                            </SidebarMenuButton>
                                        </motion.div>
                                    </SidebarMenuItem>
                                );
                            })}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>

            <SidebarFooter className="p-6 border-t border-white/5 relative z-10">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    whileHover={{ scale: 1.02 }}
                    className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm mb-4 hover:bg-white/10 transition-colors cursor-pointer group"
                >
                    <div className="flex items-center gap-3 mb-3">
                        <Avatar className="h-10 w-10 border border-white/10 ring-2 ring-transparent group-hover:ring-violet-500/50 transition-all">
                            <AvatarImage src={user?.avatarUrl || undefined} />
                            <AvatarFallback className="bg-violet-500/20 text-violet-500 font-bold">
                                {user?.name?.charAt(0) || "U"}
                            </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col overflow-hidden">
                            <span className="text-sm font-bold truncate text-white group-hover:text-violet-500 transition-colors">{user?.name || "Ascendant"}</span>
                            {user?.activeTitle && (
                                <span className="text-[10px] uppercase tracking-wider text-yellow-500 font-bold mb-0.5">{user.activeTitle}</span>
                            )}
                            <span className="text-xs text-violet-500 font-medium">Level {user?.level || 1}</span>
                        </div>
                    </div>
                    <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                        <motion.div
                            className="h-full bg-gradient-to-r from-violet-500 to-fuchsia-500 rounded-full"
                            initial={{ width: 0 }}
                            animate={{ width: `${((user?.xp || 0) % 1000) / 10}%` }}
                            transition={{ duration: 1, delay: 0.8 }}
                        />
                    </div>
                </motion.div>

                <Button
                    variant="ghost"
                    className="w-full justify-start gap-2 text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-colors"
                    onClick={() => signOut()}
                >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                </Button>
            </SidebarFooter>
        </Sidebar>
    );
}
