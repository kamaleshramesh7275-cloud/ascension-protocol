import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Bell, Send, Radio, Users, CheckCircle2, XCircle, Search, Loader2, Smartphone } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface User {
    id: string;
    name: string;
    email: string;
}

interface PushStat {
    id: string;
    name: string;
    email: string;
    tokenCount: number;
    hasTokens: boolean;
}

interface NotificationsTabProps {
    users: User[];
    getAdminHeaders: () => Record<string, string>;
    showNotification: (type: "success" | "error", message: string) => void;
}

export function NotificationsTab({ users, getAdminHeaders, showNotification }: NotificationsTabProps) {
    // Individual send state
    const [selectedUserId, setSelectedUserId] = useState("");
    const [userSearch, setUserSearch] = useState("");
    const [indivTitle, setIndivTitle] = useState("");
    const [indivBody, setIndivBody] = useState("");
    const [indivUrl, setIndivUrl] = useState("/dashboard");

    // Broadcast state
    const [broadTitle, setBroadTitle] = useState("");
    const [broadBody, setBroadBody] = useState("");
    const [broadUrl, setBroadUrl] = useState("/dashboard");

    // Fetch push stats
    const { data: pushStats, isLoading: statsLoading, refetch: refetchStats } = useQuery<{
        total: number;
        subscribed: number;
        users: PushStat[];
    }>({
        queryKey: ["/api/push/admin/stats"],
        queryFn: async () => {
            const res = await apiRequest("GET", "/api/push/admin/stats", undefined, getAdminHeaders());
            return res.json();
        },
    });

    // Send to individual
    const sendMutation = useMutation({
        mutationFn: async () => {
            const res = await apiRequest("POST", "/api/push/admin/send", {
                userId: selectedUserId,
                title: indivTitle,
                body: indivBody,
                url: indivUrl,
            }, getAdminHeaders());
            if (!res.ok) throw new Error("Failed");
            return res.json();
        },
        onSuccess: (data) => {
            showNotification("success", data.message || "Push sent!");
            setIndivTitle("");
            setIndivBody("");
            setIndivUrl("/dashboard");
            setSelectedUserId("");
            setUserSearch("");
        },
        onError: () => showNotification("error", "Failed to send push notification"),
    });

    // Broadcast to all
    const broadcastMutation = useMutation({
        mutationFn: async () => {
            const res = await apiRequest("POST", "/api/push/admin/broadcast", {
                title: broadTitle,
                body: broadBody,
                url: broadUrl,
            }, getAdminHeaders());
            if (!res.ok) throw new Error("Failed");
            return res.json();
        },
        onSuccess: (data) => {
            showNotification("success", data.message || "Broadcast sent!");
            setBroadTitle("");
            setBroadBody("");
            setBroadUrl("/dashboard");
        },
        onError: () => showNotification("error", "Failed to broadcast push notification"),
    });

    const filteredUsers = users.filter(u =>
        (u.name || "").toLowerCase().includes(userSearch.toLowerCase()) ||
        (u.email || "").toLowerCase().includes(userSearch.toLowerCase())
    );

    const selectedUser = users.find(u => u.id === selectedUserId);
    const selectedUserStat = pushStats?.users.find(s => s.id === selectedUserId);

    const subscribedPct = pushStats
        ? Math.round((pushStats.subscribed / Math.max(pushStats.total, 1)) * 100)
        : 0;

    return (
        <div className="space-y-8">
            {/* Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="bg-zinc-900/50 border-zinc-800">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm text-zinc-400 flex items-center gap-2">
                            <Users className="w-4 h-4" /> Total Users
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-white">{pushStats?.total ?? "—"}</div>
                    </CardContent>
                </Card>
                <Card className="bg-zinc-900/50 border-zinc-800">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm text-zinc-400 flex items-center gap-2">
                            <Bell className="w-4 h-4 text-green-400" /> Push Subscribers
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-green-400">{pushStats?.subscribed ?? "—"}</div>
                        <div className="text-xs text-zinc-500 mt-1">{subscribedPct}% opted in</div>
                    </CardContent>
                </Card>
                <Card className="bg-zinc-900/50 border-zinc-800">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm text-zinc-400 flex items-center gap-2">
                            <Smartphone className="w-4 h-4 text-blue-400" /> Not Subscribed
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-zinc-400">
                            {pushStats ? pushStats.total - pushStats.subscribed : "—"}
                        </div>
                        <div className="text-xs text-zinc-500 mt-1">No FCM token registered</div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* ── Individual Push Sender ── */}
                <Card className="bg-zinc-900/50 border-zinc-800">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Send className="w-5 h-5 text-purple-400" />
                            Send to Individual User
                        </CardTitle>
                        <CardDescription>
                            Target a specific user with a custom push notification
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {/* User Picker */}
                        <div className="space-y-2">
                            <Label className="text-zinc-300">Select User</Label>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                                <Input
                                    placeholder="Search by name or email..."
                                    value={userSearch}
                                    onChange={e => setUserSearch(e.target.value)}
                                    className="pl-9 bg-zinc-800/50 border-zinc-700 text-white"
                                />
                            </div>
                            {userSearch && (
                                <div className="mt-1 max-h-48 overflow-y-auto rounded-lg border border-zinc-700 bg-zinc-900 divide-y divide-zinc-800">
                                    {filteredUsers.slice(0, 8).map(u => {
                                        const stat = pushStats?.users.find(s => s.id === u.id);
                                        return (
                                            <button
                                                key={u.id}
                                                onClick={() => { setSelectedUserId(u.id); setUserSearch(""); }}
                                                className="w-full text-left px-4 py-3 hover:bg-zinc-800 transition-colors flex items-center justify-between"
                                            >
                                                <div>
                                                    <div className="font-medium text-white text-sm">{u.name}</div>
                                                    <div className="text-xs text-zinc-500">{u.email}</div>
                                                </div>
                                                {stat?.hasTokens ? (
                                                    <Badge className="bg-green-900/40 text-green-400 border-green-800 text-xs">
                                                        <CheckCircle2 className="w-3 h-3 mr-1" /> Subscribed
                                                    </Badge>
                                                ) : (
                                                    <Badge className="bg-red-900/20 text-red-400 border-red-800 text-xs">
                                                        <XCircle className="w-3 h-3 mr-1" /> No Token
                                                    </Badge>
                                                )}
                                            </button>
                                        );
                                    })}
                                    {filteredUsers.length === 0 && (
                                        <div className="px-4 py-3 text-zinc-500 text-sm">No users found</div>
                                    )}
                                </div>
                            )}
                            {selectedUser && (
                                <div className="flex items-center gap-3 p-3 rounded-lg bg-purple-900/20 border border-purple-800/50">
                                    <div className="w-8 h-8 rounded-full bg-purple-600/30 flex items-center justify-center text-purple-400 font-bold text-sm">
                                        {selectedUser.name?.[0]?.toUpperCase()}
                                    </div>
                                    <div className="flex-1">
                                        <div className="font-medium text-white text-sm">{selectedUser.name}</div>
                                        <div className="text-xs text-zinc-500">{selectedUser.email}</div>
                                    </div>
                                    {selectedUserStat?.hasTokens ? (
                                        <Badge className="bg-green-900/40 text-green-400 border-green-800 text-xs">
                                            <CheckCircle2 className="w-3 h-3 mr-1" />
                                            {selectedUserStat.tokenCount} device{selectedUserStat.tokenCount !== 1 ? "s" : ""}
                                        </Badge>
                                    ) : (
                                        <Badge className="bg-red-900/20 text-red-400 border-red-800 text-xs">
                                            <XCircle className="w-3 h-3 mr-1" /> No Token
                                        </Badge>
                                    )}
                                    <button
                                        onClick={() => setSelectedUserId("")}
                                        className="text-zinc-500 hover:text-white text-xs"
                                    >✕</button>
                                </div>
                            )}
                        </div>

                        {/* Message Fields */}
                        <div className="space-y-2">
                            <Label className="text-zinc-300">Notification Title</Label>
                            <Input
                                placeholder="e.g. 🔥 Special Announcement!"
                                value={indivTitle}
                                onChange={e => setIndivTitle(e.target.value)}
                                className="bg-zinc-800/50 border-zinc-700 text-white"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-zinc-300">Message Body</Label>
                            <Textarea
                                placeholder="Enter the notification message..."
                                value={indivBody}
                                onChange={e => setIndivBody(e.target.value)}
                                className="bg-zinc-800/50 border-zinc-700 text-white resize-none"
                                rows={3}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-zinc-300">Deep Link URL <span className="text-zinc-500 text-xs">(optional)</span></Label>
                            <Input
                                placeholder="/dashboard"
                                value={indivUrl}
                                onChange={e => setIndivUrl(e.target.value)}
                                className="bg-zinc-800/50 border-zinc-700 text-white"
                            />
                        </div>

                        <Button
                            onClick={() => sendMutation.mutate()}
                            disabled={!selectedUserId || !indivTitle || !indivBody || sendMutation.isPending}
                            className="w-full bg-purple-600 hover:bg-purple-700 disabled:opacity-50"
                        >
                            {sendMutation.isPending ? (
                                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Sending...</>
                            ) : (
                                <><Send className="w-4 h-4 mr-2" /> Send Push Notification</>
                            )}
                        </Button>
                        {!selectedUserStat?.hasTokens && selectedUserId && (
                            <p className="text-xs text-amber-400 flex items-center gap-1">
                                ⚠️ This user has no registered FCM token — the push will be silently skipped.
                            </p>
                        )}
                    </CardContent>
                </Card>

                {/* ── Broadcast to All ── */}
                <Card className="bg-zinc-900/50 border-zinc-800">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Radio className="w-5 h-5 text-orange-400" />
                            Broadcast to All Users
                        </CardTitle>
                        <CardDescription>
                            Send a push notification to all {pushStats?.subscribed ?? 0} subscribed users simultaneously
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="p-3 rounded-lg bg-orange-900/20 border border-orange-800/30 text-sm text-orange-300">
                            ⚠️ This will immediately push to <strong>{pushStats?.subscribed ?? 0} devices</strong>. Use sparingly — over-notifying reduces opt-in rates.
                        </div>

                        <div className="space-y-2">
                            <Label className="text-zinc-300">Notification Title</Label>
                            <Input
                                placeholder="e.g. 🎉 New Feature Alert!"
                                value={broadTitle}
                                onChange={e => setBroadTitle(e.target.value)}
                                className="bg-zinc-800/50 border-zinc-700 text-white"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-zinc-300">Message Body</Label>
                            <Textarea
                                placeholder="Enter the broadcast message..."
                                value={broadBody}
                                onChange={e => setBroadBody(e.target.value)}
                                className="bg-zinc-800/50 border-zinc-700 text-white resize-none"
                                rows={3}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-zinc-300">Deep Link URL <span className="text-zinc-500 text-xs">(optional)</span></Label>
                            <Input
                                placeholder="/dashboard"
                                value={broadUrl}
                                onChange={e => setBroadUrl(e.target.value)}
                                className="bg-zinc-800/50 border-zinc-700 text-white"
                            />
                        </div>

                        <Button
                            onClick={() => broadcastMutation.mutate()}
                            disabled={!broadTitle || !broadBody || broadcastMutation.isPending}
                            className="w-full bg-orange-600 hover:bg-orange-700 disabled:opacity-50"
                        >
                            {broadcastMutation.isPending ? (
                                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Broadcasting...</>
                            ) : (
                                <><Radio className="w-4 h-4 mr-2" /> Broadcast to All {pushStats?.subscribed ?? 0} Subscribers</>
                            )}
                        </Button>
                    </CardContent>
                </Card>
            </div>

            {/* Subscriber List */}
            <Card className="bg-zinc-900/50 border-zinc-800">
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle className="flex items-center gap-2">
                            <Bell className="w-5 h-5 text-zinc-400" />
                            Push Subscriber List
                        </CardTitle>
                        <CardDescription>Users who have enabled push notifications</CardDescription>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => refetchStats()} className="border-zinc-700">
                        Refresh
                    </Button>
                </CardHeader>
                <CardContent>
                    {statsLoading ? (
                        <div className="flex justify-center py-8">
                            <Loader2 className="w-6 h-6 animate-spin text-purple-500" />
                        </div>
                    ) : (
                        <div className="divide-y divide-zinc-800">
                            {pushStats?.users
                                .filter(u => u.hasTokens)
                                .map(u => (
                                    <div key={u.id} className="flex items-center justify-between py-3">
                                        <div>
                                            <div className="font-medium text-white text-sm">{u.name}</div>
                                            <div className="text-xs text-zinc-500">{u.email}</div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <Badge className="bg-green-900/30 text-green-400 border-green-800 text-xs">
                                                <Smartphone className="w-3 h-3 mr-1" />
                                                {u.tokenCount} device{u.tokenCount !== 1 ? "s" : ""}
                                            </Badge>
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                className="text-purple-400 hover:text-purple-300 hover:bg-purple-900/20 text-xs h-7"
                                                onClick={() => {
                                                    setSelectedUserId(u.id);
                                                    setActiveSection("individual");
                                                    window.scrollTo({ top: 0, behavior: "smooth" });
                                                }}
                                            >
                                                <Send className="w-3 h-3 mr-1" /> Send
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            {(pushStats?.users.filter(u => u.hasTokens).length ?? 0) === 0 && (
                                <div className="text-center text-zinc-500 py-8">
                                    No users have subscribed to push notifications yet.
                                </div>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

// dummy ref for scrolling
function setActiveSection(_: string) {}
