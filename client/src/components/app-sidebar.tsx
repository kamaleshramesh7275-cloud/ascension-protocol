import { Activity, Award, BookOpen, Brain, Crosshair, Dumbbell, Eye, FileCheck, Flame, Gavel, Lock, LogOut, Map, MessageSquare, Scale, Shield, ShoppingBag, Swords, Trophy, User, Users } from "lucide-react";
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
import { motion } from "framer-motion";
import { audioEngine } from "@/lib/audio-engine";

export function AppSidebar() {
    const [location, setLocation] = useLocation();
    const { user: firebaseUser, signOut } = useAuth();

    const { data: user } = useQuery<BackendUser>({
        queryKey: ["/api/user"],
        enabled: !!firebaseUser,
    });

    const items = [
        {
            title: "Mission Command",
            url: "/mission-command",
            icon: Crosshair,
            tag: "CTRL.01",
        },
        {
            title: "Air-Gap Focus",
            url: "/air-gap-focus",
            icon: Lock,
            tag: "VOID.40",
        },
        {
            title: "Evening Debrief",
            url: "/evening-debrief",
            icon: FileCheck,
            tag: "AUDIT.02",
        },
        {
            title: "Performance Court",
            url: "/performance-court",
            icon: Gavel,
            tag: "JUD.01",
        },
        {
            title: "Commitment Contract",
            url: "/commitment-contract",
            icon: Scale,
            tag: "PACT.01",
        },
        {
            title: "Squad Pact",
            url: "/squad-pact",
            icon: Flame,
            tag: "ESCROW",
        },
        {
            title: "Public Wall",
            url: "/public-commitments",
            icon: Eye,
            tag: "RECORD",
        },
        {
            title: "Hall of Ascension",
            url: "/hall-of-ascension",
            icon: Trophy,
            tag: "LEDGER",
        },
        {
            title: "Achievements",
            url: "/achievements",
            icon: Award,
            tag: "TROPHY",
        },
        {
            title: "Quests",
            url: "/quests",
            icon: Swords,
            tag: "EXP",
        },
        {
            title: "Living Roadmap",
            url: "/roadmap",
            icon: Map,
            tag: "VECTOR",
            premiumOnly: true
        },
        {
            title: "Focus Sanctum",
            url: "/focus",
            icon: Brain,
            tag: "CHAMBER",
        },
        {
            title: "Physical Calibration",
            url: "/workout",
            icon: Dumbbell,
            tag: "KINETIC",
        },
        {
            title: "Tactical Supply",
            url: "/store",
            icon: ShoppingBag,
            tag: "DEPOT",
        },
        {
            title: "Telemetry Stats",
            url: "/stats",
            icon: Activity,
            tag: "METRICS",
        },
        {
            title: "Global Leaderboard",
            url: "/leaderboard",
            icon: Trophy,
            tag: "GLOBAL",
        },
        {
            title: "Operative Dossier",
            url: "/profile",
            icon: User,
            tag: "PROFILE",
        },
        {
            title: "Standard Library",
            url: "/library",
            icon: BookOpen,
            tag: "ARCHIVE",
        },
        {
            title: "Squadron Alliances",
            url: "/gangs",
            icon: Shield,
            tag: "ALLIED",
        },
        {
            title: "Bilateral Partners",
            url: "/partners",
            icon: Users,
            tag: "COVENANT",
        },
        {
            title: "Secure Frequency",
            url: "/global-chat",
            icon: MessageSquare,
            tag: "UPLINK",
        },
    ];

    const handleNavigate = (url: string) => {
        audioEngine.playTactileClick();
        setLocation(url);
    };

    return (
        <Sidebar className="border-r border-white/[0.08] bg-[#07080B] text-zinc-300 w-64 select-none">
            {/* Header: Precision Instrument Console */}
            <SidebarHeader className="p-4 border-b border-white/[0.06] bg-[#090C10]">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded bg-[#141922] border border-white/10 flex items-center justify-center">
                            <Crosshair className="w-4 h-4 text-cyan-400" />
                        </div>
                        <div>
                            <div className="text-xs font-black tracking-wider text-zinc-100 swiss-display uppercase">
                                ASCENSION
                            </div>
                            <div className="text-[9px] font-mono text-zinc-500 tracking-wider">
                                PROTOCOL // OS
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        <span className="text-[9px] font-mono font-semibold text-emerald-400 tracking-wider">
                            ACTIVE
                        </span>
                    </div>
                </div>
            </SidebarHeader>

            {/* Navigation List: Swiss Modular Hierarchy */}
            <SidebarContent className="px-2 py-3 scrollbar-hide">
                <SidebarGroup>
                    <div className="px-2 pb-2 text-[10px] font-mono uppercase tracking-widest text-zinc-500 flex items-center justify-between">
                        <span>// SECTORS</span>
                        <span className="text-[9px] text-zinc-600">{items.length} INSTRUMENTS</span>
                    </div>
                    <SidebarGroupContent>
                        <SidebarMenu className="space-y-0.5">
                            {items.map((item) => {
                                const isActive = location === item.url;
                                return (
                                    <SidebarMenuItem key={item.title}>
                                        <SidebarMenuButton
                                            isActive={isActive}
                                            onClick={() => handleNavigate(item.url)}
                                            className={`
                                                w-full justify-between px-2.5 py-2 rounded transition-all duration-150 group relative
                                                ${isActive
                                                    ? "bg-[#0E1218] text-zinc-100 border-l-2 border-cyan-400 font-medium shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]"
                                                    : "text-zinc-400 hover:text-zinc-200 hover:bg-[#0E1218]/50 border-l-2 border-transparent"
                                                }
                                            `}
                                        >
                                            <div className="flex items-center gap-2.5 min-w-0">
                                                <item.icon
                                                    className={`w-4 h-4 shrink-0 transition-colors ${
                                                        isActive ? "text-cyan-400" : "text-zinc-500 group-hover:text-zinc-300"
                                                    }`}
                                                />
                                                <span className="text-xs truncate tracking-tight">{item.title}</span>
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                {(item as any).premiumOnly && !user?.isPremium && (
                                                    <Lock className="w-2.5 h-2.5 text-zinc-600" />
                                                )}
                                                <span className={`text-[9px] font-mono tracking-wider ${
                                                    isActive ? "text-cyan-400/80" : "text-zinc-600 group-hover:text-zinc-500"
                                                }`}>
                                                    {item.tag}
                                                </span>
                                            </div>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                );
                            })}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>

            {/* Footer: Operator Telemetry Badge */}
            <SidebarFooter className="p-3 border-t border-white/[0.06] bg-[#090C10] space-y-2">
                <div
                    onClick={() => handleNavigate("/profile")}
                    className="p-2.5 rounded bg-[#0E1218] border border-white/[0.08] hover:border-white/20 transition-all cursor-pointer group"
                >
                    <div className="flex items-center gap-2.5 mb-2">
                        <Avatar className="h-8 w-8 rounded border border-white/10">
                            <AvatarImage src={user?.avatarUrl || undefined} />
                            <AvatarFallback className="bg-[#141922] text-zinc-300 font-mono text-xs rounded">
                                {user?.name?.charAt(0) || "O"}
                            </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col min-w-0">
                            <span className="text-xs font-semibold truncate text-zinc-200 group-hover:text-cyan-400 transition-colors">
                                {user?.name || "Operative"}
                            </span>
                            <span className="text-[10px] font-mono text-zinc-500 tracking-tight">
                                LVL {user?.level || 1} // {user?.xp || 0} XP
                            </span>
                        </div>
                    </div>
                    {/* Linear Cyan Telemetry Bar */}
                    <div className="h-1 w-full bg-zinc-800 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-cyan-400 rounded-full transition-all duration-500"
                            style={{ width: `${Math.min(100, Math.max(5, ((user?.xp || 0) % 1000) / 10))}%` }}
                        />
                    </div>
                </div>

                {/* Citadel Feedback & Uplink */}
                <button
                    onClick={() => handleNavigate("/contact")}
                    className="w-full px-2.5 py-1.5 rounded bg-[#0E1218]/60 hover:bg-[#0E1218] border border-white/[0.06] hover:border-white/15 text-zinc-400 hover:text-zinc-200 text-xs flex items-center justify-between transition-colors"
                >
                    <span className="text-[11px] font-mono tracking-tight flex items-center gap-1.5">
                        <MessageSquare className="w-3 h-3 text-cyan-400" />
                        CITADEL UPLINK
                    </span>
                    <span className="keycap text-[9px]">U</span>
                </button>

                <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start gap-2 h-7 px-2 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 text-xs transition-colors rounded"
                    onClick={() => signOut()}
                >
                    <LogOut className="w-3 h-3" />
                    <span className="font-mono text-[10px]">TERMINATE SESSION</span>
                </Button>
            </SidebarFooter>
        </Sidebar>
    );
}
