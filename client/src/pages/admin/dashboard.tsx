import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
    Trash2, Users, TrendingUp, Award, RefreshCw, Shield, ShoppingBag,
    Plus, Search, LogOut, LayoutDashboard, Settings, Activity, MessageSquare, Edit, Bell, Clock, Database, Download, Loader2, Map
} from "lucide-react";
import { useLocation } from "wouter";
import { AdminNotificationComposer } from "@/components/admin-notification-composer";
import { AdminNotificationHistory } from "@/components/admin-notification-history";
import { apiRequest } from "@/lib/queryClient";

// Types
interface User {
    id: string;
    name: string;
    email: string;
    level: number;
    xp: number;
    tier: string;
    streak: number;
    createdAt: string;
    onboardingCompleted: boolean;
    coins: number;
    isPremium: boolean;
    role: string;
    strength?: number;
    agility?: number;
    stamina?: number;
    vitality?: number;
    intelligence?: number;
    willpower?: number;
    charisma?: number;
}

interface PremiumRequest {
    id: string;
    userId: string;
    status: string;
    adminNotes: string | null;
    createdAt: string;
    resolvedAt: string | null;
    user: User;
}

interface Guild {
    id: string;
    name: string;
    description: string;
    memberCount: number;
    level: number;
}

interface ShopItem {
    id: string;
    name: string;
    type: string;
    cost: number;
    rarity: string;
}

export default function AdminDashboard() {
    const [, setLocation] = useLocation();
    const queryClient = useQueryClient();

    // Authentication state
    // Authentication state
    const [isAuthenticated, setIsAuthenticated] = useState(() => {
        return sessionStorage.getItem("adminAuth") === "true";
    });
    const [password, setPassword] = useState("");

    // UI state
    const [activeTab, setActiveTab] = useState("overview");
    const [searchTerm, setSearchTerm] = useState("");
    const [notification, setNotification] = useState<{ type: "success" | "error"; message: string } | null>(null);

    // New Item State
    const [newItem, setNewItem] = useState({ name: "", type: "avatar", cost: 100, rarity: "common", value: "", description: "" });

    // User Edit State
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [editUserDialogOpen, setEditUserDialogOpen] = useState(false);

    // Quest Management State
    const [newQuest, setNewQuest] = useState({
        guildId: "",
        title: "",
        description: "",
        type: "collective_xp",
        targetValue: 1000,
        rewardXP: 50,
        rewardCoins: 10,
        dueAt: ""
    });

    // Roadmap Editor State
    const [editingRoadmap, setEditingRoadmap] = useState<any>(null);
    const [roadmapDialogOpen, setRoadmapDialogOpen] = useState(false);
    const [roadmapDetails, setRoadmapDetails] = useState<{ weeks: any[] } | null>(null);

    // Persist login
    // Persist login - Removed useEffect as we use lazy init
    // useEffect(() => {
    //     const stored = sessionStorage.getItem("adminAuth");
    //     if (stored === "true") setIsAuthenticated(true);
    // }, []);

    const getAdminHeaders = () => {
        const pwd = sessionStorage.getItem("adminPassword");
        return { "x-admin-password": pwd || "" };
    };

    // Queries
    const { data: users = [], isLoading: isLoadingUsers } = useQuery<User[]>({
        queryKey: ["/api/admin/users"],
        enabled: isAuthenticated,
        queryFn: async () => {
            const res = await apiRequest("GET", "/api/admin/users", undefined, getAdminHeaders());
            return res.json();
        },
    });

    const { data: guilds = [] } = useQuery<Guild[]>({
        queryKey: ["/api/admin/guilds"],
        enabled: isAuthenticated && (activeTab === "guilds" || activeTab === "overview" || activeTab === "quests"),
        queryFn: async () => {
            const res = await apiRequest("GET", "/api/admin/guilds", undefined, getAdminHeaders());
            return res.json();
        },
    });

    const { data: items = [] } = useQuery<ShopItem[]>({
        queryKey: ["/api/admin/items"],
        enabled: isAuthenticated && activeTab === "shop",
        queryFn: async () => {
            const res = await apiRequest("GET", "/api/admin/items", undefined, getAdminHeaders());
            return res.json();
        },
    });

    const { data: credentials = [] } = useQuery<any[]>({
        queryKey: ["/api/admin/users-credentials"],
        enabled: isAuthenticated && activeTab === "users",
        queryFn: async () => {
            const res = await apiRequest("GET", "/api/admin/users-credentials", undefined, getAdminHeaders());
            return res.json();
        },
    });

    const { data: guildMessages = [] } = useQuery<any[]>({
        queryKey: ["/api/admin/guild-messages"],
        enabled: isAuthenticated && activeTab === "chat",
        queryFn: async () => {
            const res = await apiRequest("GET", "/api/admin/guild-messages", undefined, getAdminHeaders());
            return res.json();
        },
    });

    const { data: allQuests = [] } = useQuery<any[]>({
        queryKey: ["/api/admin/quests"],
        enabled: isAuthenticated && activeTab === "quests",
        queryFn: async () => {
            const res = await apiRequest("GET", "/api/admin/quests", undefined, getAdminHeaders());
            return res.json();
        },
    });

    const { data: studyLogs = [] } = useQuery<any[]>({
        queryKey: ["/api/admin/study-logs"],
        enabled: isAuthenticated && activeTab === "study-logs",
        queryFn: async () => {
            const res = await apiRequest("GET", "/api/admin/study-logs", undefined, getAdminHeaders());
            return res.json();
        },
    });

    const { data: partnerships = [] } = useQuery<any[]>({
        queryKey: ["/api/admin/partners"],
        enabled: isAuthenticated && activeTab === "partners",
        queryFn: async () => {
            const res = await apiRequest("GET", "/api/admin/partners", undefined, getAdminHeaders());
            return res.json();
        },
    });

    const { data: premiumRequests = [] } = useQuery<PremiumRequest[]>({
        queryKey: ["/api/subscription/admin/requests"],
        enabled: isAuthenticated && activeTab === "requests",
        queryFn: async () => {
            const res = await apiRequest("GET", "/api/subscription/admin/requests", undefined, getAdminHeaders());
            return res.json();
        },
    });

    const { data: allRoadmaps = [], isLoading: isLoadingRoadmaps } = useQuery<any[]>({
        queryKey: ["/api/roadmap/admin/roadmaps"],
        enabled: isAuthenticated && activeTab === "roadmaps",
        queryFn: async () => {
            const res = await apiRequest("GET", "/api/roadmap/admin/roadmaps", undefined, getAdminHeaders());
            return res.json();
        },
    });

    const updateRoadmapWeekMutation = useMutation({
        mutationFn: async ({ weekId, updates }: { weekId: string; updates: any }) => {
            const res = await apiRequest("PATCH", `/api/roadmap/admin/roadmap-weeks/${weekId}`, updates, getAdminHeaders());
            return res.json();
        },
        onSuccess: () => {
            if (editingRoadmap) fetchRoadmapDetails(editingRoadmap.id);
            showNotification("success", "Week updated successfully");
        },
    });

    const updateRoadmapTaskMutation = useMutation({
        mutationFn: async ({ taskId, updates }: { taskId: string; updates: any }) => {
            const res = await apiRequest("PATCH", `/api/roadmap/admin/roadmap-tasks/${taskId}`, updates, getAdminHeaders());
            return res.json();
        },
        onSuccess: () => {
            if (editingRoadmap) fetchRoadmapDetails(editingRoadmap.id);
            showNotification("success", "Task updated successfully");
        },
    });

    const fetchRoadmapDetails = async (roadmapId: string) => {
        try {
            const res = await apiRequest("GET", `/api/roadmap/admin/roadmaps/${roadmapId}`, undefined, getAdminHeaders());
            const data = await res.json();
            setRoadmapDetails(data);
        } catch (err) {
            console.error("Failed to fetch roadmap details:", err);
            showNotification("error", "Failed to load roadmap details");
        }
    };

    useEffect(() => {
        if (editingRoadmap) {
            fetchRoadmapDetails(editingRoadmap.id);
        } else {
            setRoadmapDetails(null);
        }
    }, [editingRoadmap]);

    // Mutations
    const deleteUserMutation = useMutation({
        mutationFn: async (id: string) => {
            await apiRequest("DELETE", `/api/admin/users/${id}`, undefined, getAdminHeaders());
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
            showNotification("success", "User deleted successfully");
        },
        onError: () => showNotification("error", "Failed to delete user"),
    });

    const deleteGuildMutation = useMutation({
        mutationFn: async (id: string) => {
            await apiRequest("DELETE", `/api/admin/guilds/${id}`, undefined, getAdminHeaders());
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/admin/guilds"] });
            showNotification("success", "Guild deleted successfully");
        },
    });

    const createItemMutation = useMutation({
        mutationFn: async (item: any) => {
            await apiRequest("POST", "/api/admin/items", item, getAdminHeaders());
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/admin/items"] });
            showNotification("success", "Item created successfully");
            setNewItem({ name: "", type: "avatar", cost: 100, rarity: "common", value: "", description: "" });
        },
    });

    const deleteItemMutation = useMutation({
        mutationFn: async (id: string) => {
            await apiRequest("DELETE", `/api/admin/items/${id}`, undefined, getAdminHeaders());
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/admin/items"] });
            showNotification("success", "Item deleted successfully");
        },
    });

    const updateUserMutation = useMutation({
        mutationFn: async ({ userId, updates }: { userId: string; updates: any }) => {
            const res = await apiRequest("PATCH", `/api/admin/users/${userId}`, updates, getAdminHeaders());
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
            showNotification("success", "User updated successfully");
            setEditUserDialogOpen(false);
        },
        onError: () => showNotification("error", "Failed to update user"),
    });

    const activatePremiumMutation = useMutation({
        mutationFn: async (userId: string) => {
            const res = await apiRequest("POST", "/api/subscription/admin/activate", { userId }, getAdminHeaders());
            return res.json();
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
            showNotification("success", data.message || "Premium activated for 30 days");
        },
        onError: () => showNotification("error", "Failed to activate premium"),
    });

    const createQuestMutation = useMutation({
        mutationFn: async (quest: any) => {
            const res = await apiRequest("POST", `/api/admin/guilds/${quest.guildId}/quests`, quest, getAdminHeaders());
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/admin/quests"] });
            showNotification("success", "Quest created successfully");
            setNewQuest({
                guildId: "",
                title: "",
                description: "",
                type: "collective_xp",
                targetValue: 1000,
                rewardXP: 50,
                rewardCoins: 10,
                dueAt: ""
            });
        },
        onError: () => showNotification("error", "Failed to create quest"),
    });

    const deleteQuestMutation = useMutation({
        mutationFn: async (questId: string) => {
            await apiRequest("DELETE", `/api/admin/quests/${questId}`, undefined, getAdminHeaders());
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/admin/quests"] });
            showNotification("success", "Quest deleted successfully");
        },
        onError: () => showNotification("error", "Failed to delete quest"),
    });

    const restoreBackupMutation = useMutation({
        mutationFn: async (file: File) => {
            const text = await file.text();
            const json = JSON.parse(text);
            const res = await apiRequest("POST", "/api/admin/backup/restore", json, getAdminHeaders());
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries();
            showNotification("success", "Data restored successfully");
        },
        onError: () => showNotification("error", "Failed to restore data"),
    });

    const createBackupMutation = useMutation({
        mutationFn: async () => {
            const res = await apiRequest("POST", "/api/admin/backup/create", undefined, getAdminHeaders());
            return res.json();
        },
        onSuccess: () => showNotification("success", "Backup created successfully"),
        onError: () => showNotification("error", "Failed to create backup"),
    });

    const resolveRequestMutation = useMutation({
        mutationFn: async ({ requestId, status, adminNotes }: { requestId: string; status: "approved" | "rejected"; adminNotes?: string }) => {
            const res = await apiRequest("POST", `/api/subscription/admin/requests/${requestId}/resolve`, { status, adminNotes }, getAdminHeaders());
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/subscription/admin/requests"] });
            queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
            showNotification("success", "Request resolved successfully");
        },
        onError: () => showNotification("error", "Failed to resolve request"),
    });

    // Helpers
    const showNotification = (type: "success" | "error", message: string) => {
        setNotification({ type, message });
        setTimeout(() => setNotification(null), 3000);
    };

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await apiRequest("POST", "/api/admin/login", { password });

            if (res.ok) {
                setIsAuthenticated(true);
                sessionStorage.setItem("adminAuth", "true");
                sessionStorage.setItem("adminPassword", password); // Store for headers
                showNotification("success", "Logged in successfully");
            } else {
                showNotification("error", "Invalid password");
            }
        } catch (err) {
            showNotification("error", "Login failed");
        }
    };

    const filteredUsers = users.filter(u =>
        (u.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (u.email || "").toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Stats
    const stats = {
        totalUsers: users.length,
        totalGuilds: guilds.length,
        totalXP: users.reduce((acc, u) => acc + u.xp, 0),
        activeUsers: users.filter(u => new Date(u.createdAt).getTime() > Date.now() - 7 * 24 * 60 * 60 * 1000).length // Mock active
    };

    if (isAuthenticated && isLoadingUsers) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
            </div>
        );
    }

    if (!isAuthenticated) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-black text-white relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2072&auto=format&fit=crop')] bg-cover opacity-20" />
                <Card className="w-full max-w-md bg-zinc-900/90 border-zinc-800 backdrop-blur-xl relative z-10">
                    <CardHeader>
                        <CardTitle className="text-3xl text-center font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-blue-500">
                            Admin Command
                        </CardTitle>
                        <CardDescription className="text-center text-zinc-400">Restricted Access Protocol</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleLogin} className="space-y-4">
                            <Input
                                type="password"
                                placeholder="Enter access code"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="bg-black/50 border-zinc-700 text-center text-lg tracking-widest"
                                autoFocus
                            />
                            <Button type="submit" className="w-full bg-purple-600 hover:bg-purple-700 transition-all duration-300">
                                Authenticate
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-black text-white flex">
            {/* Sidebar */}
            <div
                className="w-64 border-r border-zinc-800 bg-zinc-900/50 backdrop-blur-xl p-6 flex flex-col gap-6 fixed h-full z-20"
            >
                <div className="flex items-center gap-2 px-2">
                    <Shield className="w-8 h-8 text-purple-500" />
                    <span className="font-bold text-xl tracking-tight">Admin<span className="text-purple-500">OS</span></span>
                </div>

                <nav className="flex flex-col gap-2 flex-1">
                    {[
                        { id: "overview", icon: LayoutDashboard, label: "Overview" },
                        { id: "users", icon: Users, label: "User Management" },
                        { id: "quests", icon: Award, label: "Quest Management" },
                        { id: "guilds", icon: Activity, label: "Guilds" },
                        { id: "chat", icon: MessageSquare, label: "Guild Chat" },
                        { id: "shop", icon: ShoppingBag, label: "Shop Items" },
                        { id: "study-logs", icon: Clock, label: "Study Logs" },
                        { id: "partners", icon: Users, label: "Partner Matching" },
                        { id: "requests", icon: Clock, label: "Activation Requests" },
                        { id: "roadmaps", icon: Map, label: "Roadmaps" },
                        { id: "notifications", icon: Bell, label: "Notifications" },
                        { id: "data", icon: Database, label: "Data Management" },
                        { id: "system", icon: Settings, label: "System" },
                    ].map((item) => (
                        <button
                            key={item.id}
                            onClick={() => setActiveTab(item.id)}
                            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${activeTab === item.id
                                ? "bg-purple-500/20 text-purple-400 border border-purple-500/30"
                                : "text-zinc-400 hover:bg-zinc-800 hover:text-white"
                                }`}
                        >
                            <item.icon className="w-5 h-5" />
                            <span className="font-medium">{item.label}</span>
                        </button>
                    ))}
                </nav>

                <div className="mt-auto">
                    <Button
                        variant="ghost"
                        className="w-full justify-start text-red-400 hover:text-red-300 hover:bg-red-900/20"
                        onClick={() => {
                            sessionStorage.removeItem("adminAuth");
                            sessionStorage.removeItem("adminPassword");
                            setIsAuthenticated(false);
                        }}
                    >
                        <LogOut className="w-5 h-5 mr-3" /> Logout
                    </Button>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 ml-64 p-8 relative">
                {/* Background Gradients */}
                <div className="fixed top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-purple-900/20 via-black to-black pointer-events-none -z-10" />

                {/* Notification Toast */}
                {notification && (
                    <div
                        className={`fixed top-4 right-4 px-6 py-4 rounded-lg shadow-2xl z-50 flex items-center gap-3 border ${notification.type === "success"
                            ? "bg-green-900/90 border-green-700 text-green-200"
                            : "bg-red-900/90 border-red-700 text-red-200"
                            }`}
                    >
                        {notification.type === "success" ? <Award className="w-5 h-5" /> : <Shield className="w-5 h-5" />}
                        <span className="font-medium">{notification.message}</span>
                    </div>
                )}

                {/* Content Area */}
                <div className="max-w-6xl mx-auto">
                    <header className="mb-8 flex justify-between items-center">
                        <div>
                            <h1 className="text-3xl font-bold text-white mb-2 capitalize">{activeTab}</h1>
                            <p className="text-zinc-400">System Status: <span className="text-green-400">Operational</span></p>
                        </div>
                        <div className="flex gap-3">
                            <Button variant="outline" onClick={() => queryClient.invalidateQueries()} className="border-zinc-700 hover:bg-zinc-800">
                                <RefreshCw className="w-4 h-4 mr-2" /> Refresh Data
                            </Button>
                            <Button onClick={() => setLocation("/")}>
                                View Live Site
                            </Button>
                        </div>
                    </header>

                    {activeTab === "overview" && (
                        <div
                            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
                        >
                            {[
                                { label: "Total Users", value: stats.totalUsers, icon: Users, color: "text-blue-500" },
                                { label: "Total XP Generated", value: stats.totalXP.toLocaleString(), icon: Award, color: "text-yellow-500" },
                                { label: "Active Guilds", value: stats.totalGuilds, icon: Activity, color: "text-green-500" },
                                { label: "System Load", value: "Low", icon: TrendingUp, color: "text-purple-500" },
                            ].map((stat, idx) => (
                                <Card key={idx} className="bg-zinc-900/50 border-zinc-800 backdrop-blur-sm hover:bg-zinc-900 transition-colors">
                                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                                        <CardTitle className="text-sm font-medium text-zinc-400">{stat.label}</CardTitle>
                                        <stat.icon className={`w-4 h-4 ${stat.color}`} />
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-3xl font-bold text-white">{stat.value}</div>
                                    </CardContent>
                                </Card>
                            ))}

                            {/* Recent Activity Feed Placeholder */}
                            <Card className="col-span-full md:col-span-2 bg-zinc-900/50 border-zinc-800">
                                <CardHeader>
                                    <CardTitle>System Logs</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        {[1, 2, 3].map((i) => (
                                            <div key={i} className="flex items-center gap-4 text-sm text-zinc-400 border-b border-zinc-800 pb-2 last:border-0">
                                                <span className="text-xs font-mono text-zinc-600">{new Date().toLocaleTimeString()}</span>
                                                <span>System check completed successfully.</span>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    )}

                    {activeTab === "users" && (
                        <div
                            className="space-y-6"
                        >
                            <div className="flex gap-4">
                                <div className="relative flex-1">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                                    <Input
                                        placeholder="Search users..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="bg-zinc-900 border-zinc-800 pl-10"
                                    />
                                </div>
                            </div>

                            <Card className="bg-zinc-900/50 border-zinc-800">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="border-zinc-800 hover:bg-zinc-900">
                                            <TableHead>User</TableHead>
                                            <TableHead>Level</TableHead>
                                            <TableHead>Tier</TableHead>
                                            <TableHead>Coins</TableHead>
                                            <TableHead>Premium</TableHead>
                                            <TableHead>Password</TableHead>
                                            <TableHead className="text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filteredUsers.map((user) => {
                                            const cred = credentials.find((c: any) => c.userId === user.id);
                                            return (
                                                <TableRow key={user.id} className="border-zinc-800 hover:bg-zinc-800/50">
                                                    <TableCell>
                                                        <div>
                                                            <div className="font-medium text-white">{user.name}</div>
                                                            <div className="text-xs text-zinc-500">{user.email}</div>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge variant="outline" className="bg-blue-900/20 text-blue-400 border-blue-800">
                                                            Lv {user.level}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge variant="outline" className="bg-purple-900/20 text-purple-400 border-purple-800">
                                                            {user.tier}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="text-yellow-500 font-mono">{user.coins}</TableCell>
                                                    <TableCell>
                                                        {user.isPremium ? (
                                                            <Badge className="bg-gradient-to-r from-yellow-500 to-amber-600 text-black font-bold">
                                                                PREMIUM
                                                            </Badge>
                                                        ) : (
                                                            <Badge variant="outline" className="text-zinc-500 border-zinc-800">
                                                                Standard
                                                            </Badge>
                                                        )}
                                                    </TableCell>
                                                    <TableCell>
                                                        {cred ? (
                                                            <div className="font-mono text-sm bg-zinc-900 p-2 rounded border border-zinc-800">
                                                                <div className="text-purple-400 text-xs mb-1">Username: {cred.username}</div>
                                                                <div className="text-green-400">Password: {cred.password || 'N/A'}</div>
                                                            </div>
                                                        ) : (
                                                            <span className="text-zinc-600">N/A</span>
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <div className="flex gap-2 justify-end">
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => {
                                                                    setEditingUser(user);
                                                                    setEditUserDialogOpen(true);
                                                                }}
                                                                className="text-blue-400 hover:text-blue-300 hover:bg-blue-900/20"
                                                            >
                                                                <Edit className="w-4 h-4" />
                                                            </Button>
                                                            {!user.isPremium && (
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    onClick={() => activatePremiumMutation.mutate(user.id)}
                                                                    className="text-yellow-500 hover:text-yellow-400 hover:bg-yellow-900/20"
                                                                    title="Activate 30d Premium"
                                                                >
                                                                    <Award className="w-4 h-4" />
                                                                </Button>
                                                            )}
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => deleteUserMutation.mutate(user.id)}
                                                                className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </Button>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })}
                                    </TableBody>
                                </Table>
                            </Card>

                            {/* Edit User Dialog */}
                            <Dialog open={editUserDialogOpen} onOpenChange={setEditUserDialogOpen}>
                                <DialogContent className="bg-zinc-900 border-zinc-800 text-white max-w-2xl">
                                    <DialogHeader>
                                        <DialogTitle>Edit User: {editingUser?.name}</DialogTitle>
                                    </DialogHeader>
                                    {editingUser && (
                                        <div className="grid grid-cols-2 gap-4 mt-4">
                                            <div>
                                                <Label>Name</Label>
                                                <Input
                                                    value={editingUser.name}
                                                    onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })}
                                                    className="bg-black border-zinc-700"
                                                />
                                            </div>
                                            <div>
                                                <Label>Email</Label>
                                                <Input
                                                    value={editingUser.email}
                                                    onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                                                    className="bg-black border-zinc-700"
                                                />
                                            </div>
                                            <div>
                                                <Label>Level</Label>
                                                <Input
                                                    type="number"
                                                    value={editingUser.level}
                                                    onChange={(e) => setEditingUser({ ...editingUser, level: parseInt(e.target.value) })}
                                                    className="bg-black border-zinc-700"
                                                />
                                            </div>
                                            <div>
                                                <Label>XP</Label>
                                                <Input
                                                    type="number"
                                                    value={editingUser.xp}
                                                    onChange={(e) => setEditingUser({ ...editingUser, xp: parseInt(e.target.value) })}
                                                    className="bg-black border-zinc-700"
                                                />
                                            </div>
                                            <div>
                                                <Label>Tier</Label>
                                                <Select
                                                    value={editingUser.tier}
                                                    onValueChange={(v) => setEditingUser({ ...editingUser, tier: v })}
                                                >
                                                    <SelectTrigger className="bg-black border-zinc-700">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
                                                        {["D", "C", "B", "A", "S"].map(tier => (
                                                            <SelectItem key={tier} value={tier}>{tier}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div>
                                                <Label>Coins</Label>
                                                <Input
                                                    type="number"
                                                    value={editingUser.coins}
                                                    onChange={(e) => setEditingUser({ ...editingUser, coins: parseInt(e.target.value) })}
                                                    className="bg-black border-zinc-700"
                                                />
                                            </div>
                                            <div>
                                                <Label>Streak</Label>
                                                <Input
                                                    type="number"
                                                    value={editingUser.streak}
                                                    onChange={(e) => setEditingUser({ ...editingUser, streak: parseInt(e.target.value) })}
                                                    className="bg-black border-zinc-700"
                                                />
                                            </div>

                                            {/* Stats Section */}
                                            <div className="col-span-2">
                                                <h3 className="text-lg font-semibold mb-3 text-purple-400">Character Stats</h3>
                                                <div className="grid grid-cols-3 gap-4">
                                                    {[
                                                        { key: 'strength', label: 'Strength' },
                                                        { key: 'agility', label: 'Agility' },
                                                        { key: 'stamina', label: 'Stamina' },
                                                        { key: 'vitality', label: 'Vitality' },
                                                        { key: 'intelligence', label: 'Intelligence' },
                                                        { key: 'willpower', label: 'Willpower' },
                                                        { key: 'charisma', label: 'Charisma' },
                                                    ].map(({ key, label }) => (
                                                        <div key={key}>
                                                            <Label>{label}</Label>
                                                            <Input
                                                                type="number"
                                                                min="1"
                                                                max="100"
                                                                value={(editingUser as any)[key] || 10}
                                                                onChange={(e) => setEditingUser({ ...editingUser, [key]: parseInt(e.target.value) })}
                                                                className="bg-black border-zinc-700"
                                                            />
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            <div className="col-span-2 flex gap-3 mt-4">
                                                <Button
                                                    onClick={() => updateUserMutation.mutate({ userId: editingUser.id, updates: editingUser })}
                                                    className="flex-1 bg-purple-600 hover:bg-purple-700"
                                                >
                                                    Save Changes
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    onClick={() => setEditUserDialogOpen(false)}
                                                    className="flex-1 border-zinc-700"
                                                >
                                                    Cancel
                                                </Button>
                                            </div>
                                        </div>
                                    )}
                                </DialogContent>
                            </Dialog>
                        </div>
                    )}

                    {activeTab === "requests" && (
                        <div className="space-y-6">
                            <Card className="bg-zinc-900/50 border-zinc-800">
                                <CardHeader>
                                    <CardTitle>Activation Requests</CardTitle>
                                    <CardDescription>Review and manage all premium activation requests from users.</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <Table>
                                        <TableHeader>
                                            <TableRow className="border-zinc-800">
                                                <TableHead>User</TableHead>
                                                <TableHead>Date</TableHead>
                                                <TableHead>Status</TableHead>
                                                <TableHead className="text-right">Actions</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {premiumRequests.length === 0 ? (
                                                <TableRow>
                                                    <TableCell colSpan={4} className="text-center py-8 text-zinc-500">
                                                        No activation requests found.
                                                    </TableCell>
                                                </TableRow>
                                            ) : (
                                                premiumRequests.map((req) => (
                                                    <TableRow key={req.id} className="border-zinc-800 hover:bg-zinc-800/50">
                                                        <TableCell>
                                                            <div>
                                                                <div className="font-medium text-white">{req.user.name}</div>
                                                                <div className="text-xs text-zinc-500">{req.user.email}</div>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell className="text-zinc-400">
                                                            {new Date(req.createdAt).toLocaleDateString()}
                                                        </TableCell>
                                                        <TableCell>
                                                            <Badge
                                                                variant="outline"
                                                                className={
                                                                    req.status === 'approved' ? 'bg-green-900/20 text-green-400 border-green-800' :
                                                                        req.status === 'rejected' ? 'bg-red-900/20 text-red-400 border-red-800' :
                                                                            'bg-yellow-900/20 text-yellow-500 border-yellow-800'
                                                                }
                                                            >
                                                                {req.status}
                                                            </Badge>
                                                        </TableCell>
                                                        <TableCell className="text-right">
                                                            {req.status === 'pending' ? (
                                                                <div className="flex gap-2 justify-end">
                                                                    <Button
                                                                        size="sm"
                                                                        onClick={() => resolveRequestMutation.mutate({ requestId: req.id, status: "approved" })}
                                                                        disabled={resolveRequestMutation.isPending}
                                                                        className="bg-emerald-600 hover:bg-emerald-700 text-white"
                                                                    >
                                                                        Approve
                                                                    </Button>
                                                                    <Button
                                                                        size="sm"
                                                                        variant="destructive"
                                                                        onClick={() => {
                                                                            const notes = prompt("Enter rejection reason (optional):");
                                                                            resolveRequestMutation.mutate({ requestId: req.id, status: "rejected", adminNotes: notes || undefined });
                                                                        }}
                                                                        disabled={resolveRequestMutation.isPending}
                                                                    >
                                                                        Reject
                                                                    </Button>
                                                                </div>
                                                            ) : (
                                                                <span className="text-zinc-500 text-xs italic">
                                                                    Resolved {req.resolvedAt ? new Date(req.resolvedAt).toLocaleDateString() : ''}
                                                                </span>
                                                            )}
                                                        </TableCell>
                                                    </TableRow>
                                                ))
                                            )}
                                        </TableBody>
                                    </Table>
                                </CardContent>
                            </Card>
                        </div>
                    )}

                    {activeTab === "roadmaps" && (
                        <div className="space-y-6">
                            <Card className="bg-zinc-900/50 border-zinc-800">
                                <CardHeader>
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <CardTitle>User Roadmaps</CardTitle>
                                            <CardDescription>Manage daily protocol roadmaps for all premium users.</CardDescription>
                                        </div>
                                        <Button
                                            variant="outline"
                                            className="border-zinc-800 hover:bg-zinc-800"
                                            onClick={() => {
                                                showNotification("success", "Template editor coming soon! For now, edit user roadmaps individually.");
                                            }}
                                        >
                                            <Settings className="w-4 h-4 mr-2" /> Global Template
                                        </Button>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <Table>
                                        <TableHeader>
                                            <TableRow className="border-zinc-800 hover:bg-zinc-900">
                                                <TableHead>User</TableHead>
                                                <TableHead>Status</TableHead>
                                                <TableHead>Start Date</TableHead>
                                                <TableHead>Current Week</TableHead>
                                                <TableHead className="text-right">Actions</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {isLoadingRoadmaps ? (
                                                <TableRow>
                                                    <TableCell colSpan={5} className="text-center py-8">
                                                        <Loader2 className="w-6 h-6 animate-spin mx-auto text-purple-500" />
                                                    </TableCell>
                                                </TableRow>
                                            ) : allRoadmaps.length === 0 ? (
                                                <TableRow>
                                                    <TableCell colSpan={5} className="text-center text-zinc-500 py-8">No roadmaps found</TableCell>
                                                </TableRow>
                                            ) : (
                                                allRoadmaps.map((roadmap: any) => (
                                                    <TableRow key={roadmap.id} className="border-zinc-800 hover:bg-zinc-800/50">
                                                        <TableCell>
                                                            <div className="font-medium text-white">{roadmap.user?.name}</div>
                                                            <div className="text-xs text-zinc-500">{roadmap.user?.email}</div>
                                                        </TableCell>
                                                        <TableCell>
                                                            <Badge variant="outline" className={roadmap.status === 'active' ? 'bg-green-900/20 text-green-400 border-green-800' : 'bg-zinc-900/20 text-zinc-500 border-zinc-800'}>
                                                                {roadmap.status}
                                                            </Badge>
                                                        </TableCell>
                                                        <TableCell className="text-zinc-500">{new Date(roadmap.startDate).toLocaleDateString()}</TableCell>
                                                        <TableCell>
                                                            <Badge variant="outline">Week {roadmap.currentWeek}</Badge>
                                                        </TableCell>
                                                        <TableCell className="text-right">
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                className="border-zinc-700 hover:bg-zinc-800"
                                                                onClick={() => {
                                                                    setEditingRoadmap(roadmap);
                                                                    setRoadmapDialogOpen(true);
                                                                }}
                                                            >
                                                                <Edit className="w-4 h-4 mr-2" /> Edit Content
                                                            </Button>
                                                        </TableCell>
                                                    </TableRow>
                                                ))
                                            )}
                                        </TableBody>
                                    </Table>
                                </CardContent>
                            </Card>

                            <Dialog open={roadmapDialogOpen} onOpenChange={setRoadmapDialogOpen}>
                                <DialogContent className="bg-zinc-900 border-zinc-800 text-white max-w-4xl max-h-[90vh] overflow-y-auto">
                                    <DialogHeader>
                                        <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                                            <Map className="text-purple-500" />
                                            Roadmap Editor: {editingRoadmap?.user?.name}
                                        </DialogTitle>
                                        <CardDescription>Customize the 30-day protocol for this specific user.</CardDescription>
                                    </DialogHeader>

                                    {!roadmapDetails ? (
                                        <div className="py-20 flex justify-center">
                                            <Loader2 className="w-10 h-10 animate-spin text-purple-500" />
                                        </div>
                                    ) : (
                                        <div className="space-y-8 mt-6">
                                            {roadmapDetails.weeks.map((week: any) => (
                                                <Card key={week.id} className="bg-black/30 border-zinc-800 overflow-hidden">
                                                    <CardHeader className="bg-zinc-800/20 border-b border-zinc-800">
                                                        <div className="flex justify-between items-start">
                                                            <div className="space-y-3 flex-1 mr-4">
                                                                <div className="flex items-center gap-4">
                                                                    <Badge className="bg-purple-600">Week {week.weekNumber}</Badge>
                                                                    <Input
                                                                        value={week.phaseName}
                                                                        onChange={(e) => updateRoadmapWeekMutation.mutate({ weekId: week.id, updates: { phaseName: e.target.value } })}
                                                                        className="bg-transparent border-zinc-700 text-lg font-bold h-8 px-2 w-auto min-w-[200px]"
                                                                    />
                                                                </div>
                                                                <div>
                                                                    <Label className="text-xs text-zinc-500">Weekly Goal</Label>
                                                                    <Input
                                                                        value={week.goal}
                                                                        onChange={(e) => updateRoadmapWeekMutation.mutate({ weekId: week.id, updates: { goal: e.target.value } })}
                                                                        className="bg-transparent border-zinc-700 mt-1"
                                                                    />
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-xs text-zinc-500">Locked:</span>
                                                                <Select
                                                                    value={week.isLocked ? "true" : "false"}
                                                                    onValueChange={(v) => updateRoadmapWeekMutation.mutate({ weekId: week.id, updates: { isLocked: v === "true" } })}
                                                                >
                                                                    <SelectTrigger className="w-24 h-8 bg-zinc-900 border-zinc-700">
                                                                        <SelectValue />
                                                                    </SelectTrigger>
                                                                    <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
                                                                        <SelectItem value="true">Locked</SelectItem>
                                                                        <SelectItem value="false">Unlocked</SelectItem>
                                                                    </SelectContent>
                                                                </Select>
                                                            </div>
                                                        </div>
                                                    </CardHeader>
                                                    <CardContent className="p-4 bg-zinc-900/20">
                                                        <div className="space-y-4">
                                                            <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 flex items-center gap-2">
                                                                Daily Tasks <div className="h-px flex-1 bg-zinc-800" />
                                                            </h4>
                                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                                {week.tasks?.map((task: any) => (
                                                                    <div key={task.id} className="flex gap-2 items-center bg-black/40 p-3 rounded-lg border border-zinc-800 group transition-all hover:border-zinc-700">
                                                                        <div className="flex flex-col items-center justify-center min-w-[3rem] border-r border-zinc-800 pr-2">
                                                                            <span className="text-[10px] text-zinc-500 font-bold uppercase">Day</span>
                                                                            <span className="text-lg font-bold text-white">{task.dayNumber}</span>
                                                                        </div>
                                                                        <div className="flex-1 space-y-1">
                                                                            <Input
                                                                                value={task.text}
                                                                                onChange={(e) => updateRoadmapTaskMutation.mutate({ taskId: task.id, updates: { text: e.target.value } })}
                                                                                className="bg-transparent border-none p-0 h-auto focus-visible:ring-0 focus-visible:ring-offset-0 text-sm"
                                                                            />
                                                                            <div className="flex items-center gap-2">
                                                                                <button
                                                                                    onClick={() => updateRoadmapTaskMutation.mutate({ taskId: task.id, updates: { isBoss: !task.isBoss } })}
                                                                                    className={`text-[10px] px-2 py-0.5 rounded-full border transition-colors ${task.isBoss
                                                                                        ? "bg-red-500/20 text-red-400 border-red-500/50"
                                                                                        : "bg-zinc-800 text-zinc-500 border-zinc-700"
                                                                                        }`}
                                                                                >
                                                                                    Boss Battle
                                                                                </button>
                                                                                {task.completed && (
                                                                                    <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-[9px] h-4">Completed</Badge>
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    </CardContent>
                                                </Card>
                                            ))}
                                        </div>
                                    )}

                                    <div className="mt-8 flex justify-end">
                                        <Button onClick={() => setRoadmapDialogOpen(false)} className="bg-purple-600 hover:bg-purple-700 px-8">
                                            Close Editor
                                        </Button>
                                    </div>
                                </DialogContent>
                            </Dialog>
                        </div>
                    )}


                    {activeTab === "study-logs" && (
                        <div
                            className="space-y-6"
                        >
                            <Card className="bg-zinc-900/50 border-zinc-800">
                                <CardHeader>
                                    <CardTitle>Study Logs Overview</CardTitle>
                                    <CardDescription>Recent study sessions from all users</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <Table>
                                        <TableHeader>
                                            <TableRow className="border-zinc-800">
                                                <TableHead>User</TableHead>
                                                <TableHead>Activity</TableHead>
                                                <TableHead>Duration</TableHead>
                                                <TableHead>Time</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {studyLogs.length === 0 ? (
                                                <TableRow>
                                                    <TableCell colSpan={4} className="text-center text-zinc-500 py-4">No study logs found</TableCell>
                                                </TableRow>
                                            ) : (
                                                studyLogs.map((log: any) => (
                                                    <TableRow key={log.id} className="border-zinc-800 hover:bg-zinc-800/50">
                                                        <TableCell className="font-medium text-white">{log.user?.name || "Unknown User"}</TableCell>
                                                        <TableCell>{log.task || "Generic Session"}</TableCell>
                                                        <TableCell className="text-green-400">{log.duration}m</TableCell>
                                                        <TableCell className="text-zinc-500">{new Date(log.completedAt).toLocaleString()}</TableCell>
                                                    </TableRow>
                                                ))
                                            )}
                                        </TableBody>
                                    </Table>
                                </CardContent>
                            </Card>
                        </div>
                    )}

                    {activeTab === "partners" && (
                        <div
                            className="space-y-6"
                        >
                            <Card className="bg-zinc-900/50 border-zinc-800">
                                <CardHeader>
                                    <CardTitle>Partner Matching Data</CardTitle>
                                    <CardDescription>Active study partnerships and requests</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                                        <Card className="bg-black/40 border-zinc-800">
                                            <CardContent className="p-4 flex items-center justify-between">
                                                <div>
                                                    <p className="text-sm text-zinc-400">Active Pairs</p>
                                                    <p className="text-2xl font-bold text-white">
                                                        {partnerships.filter((p: any) => p.status === "accepted").length}
                                                    </p>
                                                </div>
                                                <Users className="w-8 h-8 text-cyan-500" />
                                            </CardContent>
                                        </Card>
                                        <Card className="bg-black/40 border-zinc-800">
                                            <CardContent className="p-4 flex items-center justify-between">
                                                <div>
                                                    <p className="text-sm text-zinc-400">Pending Requests</p>
                                                    <p className="text-2xl font-bold text-white">
                                                        {partnerships.filter((p: any) => p.status === "pending").length}
                                                    </p>
                                                </div>
                                                <MessageSquare className="w-8 h-8 text-yellow-500" />
                                            </CardContent>
                                        </Card>
                                        <Card className="bg-black/40 border-zinc-800">
                                            <CardContent className="p-4 flex items-center justify-between">
                                                <div>
                                                    <p className="text-sm text-zinc-400">Total Sessions</p>
                                                    <p className="text-2xl font-bold text-white">
                                                        {Math.floor(Math.random() * 100) + 50} {/* Mock for now until real logs linked */}
                                                    </p>
                                                </div>
                                                <Clock className="w-8 h-8 text-purple-500" />
                                            </CardContent>
                                        </Card>
                                    </div>

                                    <Table>
                                        <TableHeader>
                                            <TableRow className="border-zinc-800">
                                                <TableHead>User A</TableHead>
                                                <TableHead>User B</TableHead>
                                                <TableHead>Subject</TableHead>
                                                <TableHead>Status</TableHead>
                                                <TableHead>Started</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {partnerships.length === 0 ? (
                                                <TableRow>
                                                    <TableCell colSpan={5} className="text-center text-zinc-500 py-4">No partnerships found</TableCell>
                                                </TableRow>
                                            ) : (
                                                partnerships.map((p: any) => (
                                                    <TableRow key={p.id} className="border-zinc-800 hover:bg-zinc-800/50">
                                                        <TableCell className="font-medium text-white">{p.user1?.name || "User 1"}</TableCell>
                                                        <TableCell className="font-medium text-white">{p.user2?.name || "User 2"}</TableCell>
                                                        <TableCell>{p.user1?.studySubject || "General"}</TableCell>
                                                        <TableCell>
                                                            <Badge variant="outline" className={
                                                                p.status === 'accepted' ? 'bg-green-900/20 text-green-400 border-green-800' :
                                                                    p.status === 'pending' ? 'bg-yellow-900/20 text-yellow-400 border-yellow-800' :
                                                                        'bg-zinc-900/20 text-zinc-400 border-zinc-800'
                                                            }>
                                                                {p.status}
                                                            </Badge>
                                                        </TableCell>
                                                        <TableCell className="text-zinc-500">{new Date(p.createdAt).toLocaleDateString()}</TableCell>
                                                    </TableRow>
                                                ))
                                            )}
                                        </TableBody>

                                    </Table>
                                </CardContent>
                            </Card>
                        </div>
                    )}
                    {activeTab === "quests" && (
                        <div className="space-y-6">
                            <Card className="bg-zinc-900/50 border-zinc-800">
                                <CardHeader>
                                    <CardTitle>Create Guild Quest</CardTitle>
                                    <CardDescription>Assign a quest to a specific guild</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <Label>Guild</Label>
                                            <Select
                                                value={newQuest.guildId}
                                                onValueChange={(v) => setNewQuest({ ...newQuest, guildId: v })}
                                            >
                                                <SelectTrigger className="bg-black border-zinc-700">
                                                    <SelectValue placeholder="Select guild" />
                                                </SelectTrigger>
                                                <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
                                                    {guilds.map(guild => (
                                                        <SelectItem key={guild.id} value={guild.id}>{guild.name}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div>
                                            <Label>Quest Type</Label>
                                            <Select
                                                value={newQuest.type}
                                                onValueChange={(v) => setNewQuest({ ...newQuest, type: v })}
                                            >
                                                <SelectTrigger className="bg-black border-zinc-700">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
                                                    <SelectItem value="collective_xp">Collective XP</SelectItem>
                                                    <SelectItem value="collective_focus">Collective Focus</SelectItem>
                                                    <SelectItem value="member_participation">Member Participation</SelectItem>
                                                    <SelectItem value="raid_boss">Raid Boss</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="col-span-2">
                                            <Label>Title</Label>
                                            <Input
                                                value={newQuest.title}
                                                onChange={(e) => setNewQuest({ ...newQuest, title: e.target.value })}
                                                className="bg-black border-zinc-700"
                                                placeholder="Quest title"
                                            />
                                        </div>
                                        <div className="col-span-2">
                                            <Label>Description</Label>
                                            <Input
                                                value={newQuest.description}
                                                onChange={(e) => setNewQuest({ ...newQuest, description: e.target.value })}
                                                className="bg-black border-zinc-700"
                                                placeholder="Quest description"
                                            />
                                        </div>
                                        <div>
                                            <Label>Target Value</Label>
                                            <Input
                                                type="number"
                                                value={newQuest.targetValue}
                                                onChange={(e) => setNewQuest({ ...newQuest, targetValue: parseInt(e.target.value) })}
                                                className="bg-black border-zinc-700"
                                                placeholder="e.g. 1000"
                                            />
                                        </div>
                                        <div>
                                            <Label>Reward XP</Label>
                                            <Input
                                                type="number"
                                                value={newQuest.rewardXP}
                                                onChange={(e) => setNewQuest({ ...newQuest, rewardXP: parseInt(e.target.value) })}
                                                className="bg-black border-zinc-700"
                                            />
                                        </div>
                                        <div>
                                            <Label>Reward Coins</Label>
                                            <Input
                                                type="number"
                                                value={newQuest.rewardCoins}
                                                onChange={(e) => setNewQuest({ ...newQuest, rewardCoins: parseInt(e.target.value) })}
                                                className="bg-black border-zinc-700"
                                            />
                                        </div>
                                    </div>
                                    <Button
                                        className="w-full mt-4 bg-purple-600 hover:bg-purple-700"
                                        onClick={() => createQuestMutation.mutate(newQuest)}
                                        disabled={createQuestMutation.isPending || !newQuest.guildId || !newQuest.title}
                                    >
                                        {createQuestMutation.isPending ? "Creating..." : "Create Quest"}
                                    </Button>
                                </CardContent>
                            </Card>
                        </div>
                    )}

                    {
                        activeTab === "guilds" && (
                            <div
                                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                            >
                                {guilds.map((guild) => (
                                    <Card key={guild.id} className="bg-zinc-900/50 border-zinc-800 hover:border-purple-500/50 transition-all group">
                                        <CardHeader>
                                            <CardTitle className="flex justify-between items-center">
                                                {guild.name}
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300"
                                                    onClick={() => deleteGuildMutation.mutate(guild.id)}
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </CardTitle>
                                            <CardDescription>{guild.description}</CardDescription>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="flex justify-between text-sm text-zinc-400">
                                                <span>Members: {guild.memberCount}</span>
                                                <span>Level: {guild.level}</span>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        )
                    }

                    {
                        activeTab === "chat" && (
                            <div
                                className="space-y-6"
                            >
                                <Card className="bg-zinc-900/50 border-zinc-800">
                                    <Table>
                                        <TableHeader>
                                            <TableRow className="border-zinc-800 hover:bg-zinc-900">
                                                <TableHead>Time</TableHead>
                                                <TableHead>Guild</TableHead>
                                                <TableHead>User</TableHead>
                                                <TableHead>Message</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {guildMessages.map((msg: any) => (
                                                <TableRow key={msg.id} className="border-zinc-800 hover:bg-zinc-800/50">
                                                    <TableCell className="text-zinc-500 text-xs whitespace-nowrap">
                                                        {new Date(msg.createdAt).toLocaleString()}
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge variant="outline" className="bg-cyan-900/20 text-cyan-400 border-cyan-800">
                                                            {guilds.find(g => g.id === msg.guildId)?.name || msg.guildId}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex items-center gap-2">
                                                            {msg.userAvatar && <img src={msg.userAvatar} className="w-6 h-6 rounded-full" />}
                                                            <span className="text-sm font-medium">{msg.userName}</span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-zinc-300">
                                                        {msg.message || msg.content}
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                            {guildMessages.length === 0 && (
                                                <TableRow>
                                                    <TableCell colSpan={4} className="text-center py-8 text-zinc-500">
                                                        No messages found
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                        </TableBody>
                                    </Table>
                                </Card>
                            </div>
                        )
                    }

                    {
                        activeTab === "shop" && (
                            <div
                                className="space-y-6"
                            >
                                <div className="flex justify-end">
                                    <Dialog>
                                        <DialogTrigger asChild>
                                            <Button className="bg-purple-600 hover:bg-purple-700">
                                                <Plus className="w-4 h-4 mr-2" /> Add Item
                                            </Button>
                                        </DialogTrigger>
                                        <DialogContent className="bg-zinc-900 border-zinc-800 text-white">
                                            <DialogHeader>
                                                <DialogTitle>Create New Shop Item</DialogTitle>
                                            </DialogHeader>
                                            <div className="space-y-4 mt-4">
                                                <Input
                                                    placeholder="Item Name"
                                                    value={newItem.name}
                                                    onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                                                    className="bg-black border-zinc-700"
                                                />
                                                <Select
                                                    value={newItem.type}
                                                    onValueChange={(v) => setNewItem({ ...newItem, type: v })}
                                                >
                                                    <SelectTrigger className="bg-black border-zinc-700">
                                                        <SelectValue placeholder="Type" />
                                                    </SelectTrigger>
                                                    <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
                                                        <SelectItem value="avatar">Avatar</SelectItem>
                                                        <SelectItem value="badge">Badge</SelectItem>
                                                        <SelectItem value="theme">Theme</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                <Input
                                                    type="number"
                                                    placeholder="Cost"
                                                    value={newItem.cost}
                                                    onChange={(e) => setNewItem({ ...newItem, cost: parseInt(e.target.value) })}
                                                    className="bg-black border-zinc-700"
                                                />
                                                <Input
                                                    placeholder="Value (URL or ID)"
                                                    value={newItem.value}
                                                    onChange={(e) => setNewItem({ ...newItem, value: e.target.value })}
                                                    className="bg-black border-zinc-700"
                                                />
                                                <Input
                                                    placeholder="Description"
                                                    value={newItem.description}
                                                    onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                                                    className="bg-black border-zinc-700"
                                                />
                                                <Button
                                                    onClick={() => createItemMutation.mutate(newItem)}
                                                    className="w-full bg-purple-600 hover:bg-purple-700"
                                                >
                                                    Create Item
                                                </Button>
                                            </div>
                                        </DialogContent>
                                    </Dialog>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
                                    {items.map((item) => (
                                        <Card key={item.id} className="bg-zinc-900/50 border-zinc-800 relative group overflow-hidden">
                                            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Button
                                                    variant="destructive"
                                                    size="icon"
                                                    className="h-8 w-8"
                                                    onClick={() => deleteItemMutation.mutate(item.id)}
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </div>
                                            <CardHeader className="pb-2">
                                                <CardTitle className="text-lg">{item.name}</CardTitle>
                                                <Badge variant="outline" className="w-fit capitalize">{item.rarity}</Badge>
                                            </CardHeader>
                                            <CardContent>
                                                <div className="text-2xl font-bold text-yellow-500 flex items-center gap-1">
                                                    {item.cost} <span className="text-xs text-zinc-500 font-normal">Coins</span>
                                                </div>
                                                <p className="text-xs text-zinc-500 mt-2 capitalize">{item.type}</p>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            </div>
                        )
                    }

                    {
                        activeTab === "notifications" && (
                            <div
                                className="space-y-6"
                            >
                                <AdminNotificationComposer />
                                <AdminNotificationHistory />
                            </div>
                        )
                    }

                    {activeTab === "data" && (
                        <div
                            className="space-y-6"
                        >
                            <Card className="bg-zinc-900/50 border-zinc-800">
                                <CardHeader>
                                    <CardTitle>Data Persistence</CardTitle>
                                    <CardDescription>Manage server data backups and restoration</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div className="grid md:grid-cols-2 gap-6">
                                        <div className="space-y-4 p-4 rounded-lg border border-zinc-800 bg-black/20">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 rounded-full bg-blue-500/20 text-blue-400">
                                                    <RefreshCw className="w-6 h-6" />
                                                </div>
                                                <div>
                                                    <h3 className="font-medium text-white">Manual Backup</h3>
                                                    <p className="text-sm text-zinc-400">Trigger an immediate save of all data to disk</p>
                                                </div>
                                            </div>
                                            <Button
                                                onClick={() => createBackupMutation.mutate()}
                                                disabled={createBackupMutation.isPending}
                                                className="w-full bg-blue-600 hover:bg-blue-700"
                                            >
                                                {createBackupMutation.isPending ? "Saving..." : "Create Backup Now"}
                                            </Button>
                                        </div>

                                        <div className="space-y-4 p-4 rounded-lg border border-zinc-800 bg-black/20">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 rounded-full bg-green-500/20 text-green-400">
                                                    <Download className="w-6 h-6" />
                                                </div>
                                                <div>
                                                    <h3 className="font-medium text-white">Download Data</h3>
                                                    <p className="text-sm text-zinc-400">Download the current backup.json file</p>
                                                </div>
                                            </div>
                                            <Button
                                                variant="outline"
                                                onClick={() => {
                                                    const pwd = sessionStorage.getItem("adminPassword");
                                                    window.open(`/api/admin/backup/download?password=${pwd}`, '_blank');
                                                }}
                                                className="w-full border-zinc-700 hover:bg-zinc-800"
                                            >
                                                Download JSON
                                            </Button>
                                        </div>

                                        <div className="col-span-full space-y-4 p-4 rounded-lg border border-red-900/30 bg-red-900/10">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 rounded-full bg-red-500/20 text-red-400">
                                                    <Shield className="w-6 h-6" />
                                                </div>
                                                <div>
                                                    <h3 className="font-medium text-white">Restore Data</h3>
                                                    <p className="text-sm text-zinc-400">Upload a backup.json file to replace all current data. <span className="text-red-400 font-bold">WARNING: This will overwrite everything!</span></p>
                                                </div>
                                            </div>
                                            <div className="flex gap-4 items-center">
                                                <Input
                                                    type="file"
                                                    accept=".json"
                                                    onChange={(e) => {
                                                        const file = e.target.files?.[0];
                                                        if (file) {
                                                            if (confirm("Are you sure you want to overwrite all data? This cannot be undone.")) {
                                                                restoreBackupMutation.mutate(file);
                                                            }
                                                            e.target.value = ''; // Reset
                                                        }
                                                    }}
                                                    className="bg-black border-zinc-700"
                                                />
                                            </div>
                                            {restoreBackupMutation.isPending && <p className="text-sm text-yellow-500">Restoring data... please wait...</p>}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    )}

                    {
                        activeTab === "system" && (
                            <div
                                className="grid grid-cols-1 md:grid-cols-2 gap-6"
                            >
                                <Card className="bg-zinc-900/50 border-zinc-800">
                                    <CardHeader>
                                        <CardTitle>Global Broadcast</CardTitle>
                                        <CardDescription>Send resources to all users</CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="flex gap-4">
                                            <Button
                                                onClick={async () => {
                                                    await apiRequest("POST", "/api/admin/broadcast/coins", { amount: 100 }, getAdminHeaders());
                                                    showNotification("success", "Sent 100 coins to all users");
                                                    queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
                                                }}
                                                className="bg-yellow-600 hover:bg-yellow-700"
                                            >
                                                <Award className="w-4 h-4 mr-2" /> Give 100 Coins to All
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card className="bg-zinc-900/50 border-zinc-800">
                                    <CardHeader>
                                        <CardTitle>Maintenance</CardTitle>
                                        <CardDescription>System controls</CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <Button variant="destructive" disabled className="w-full opacity-50 cursor-not-allowed">
                                            Reset All Data (Disabled)
                                        </Button>
                                    </CardContent>
                                </Card>
                            </div>
                        )
                    }
                </div >
            </div >
        </div >
    );
}
