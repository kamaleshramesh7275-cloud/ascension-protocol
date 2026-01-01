import { useState } from "react";
import { motion } from "framer-motion";
import { Users, Search, Clock, Briefcase, MessageSquare, UserPlus, Zap, Loader2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";

export default function PartnersPage() {
    const { toast } = useToast();
    const { user } = useAuth();
    const [location, setLocation] = useLocation();
    const [subjectFilter, setSubjectFilter] = useState("All");
    const [availabilityFilter, setAvailabilityFilter] = useState("All");
    const [searchQuery, setSearchQuery] = useState("");

    // Fetch potential partners
    const { data: partners = [], isLoading } = useQuery({
        queryKey: ["partners", subjectFilter, availabilityFilter],
        queryFn: async () => {
            const params = new URLSearchParams();
            if (subjectFilter !== "All") params.append("subject", subjectFilter);
            if (availabilityFilter !== "All") params.append("availability", availabilityFilter);
            const res = await apiRequest("GET", `/api/partners/match?${params}`);
            return res.json();
        }
    });

    // Fetch active rivalries
    const { data: rivalries = [] } = useQuery({
        queryKey: ["rivalries"],
        queryFn: async () => {
            const res = await apiRequest("GET", "/api/rivalry");
            return res.json();
        }
    });

    // Fetch current connections
    const { data: connections = [] } = useQuery({
        queryKey: ["connections"],
        queryFn: async () => {
            const res = await apiRequest("GET", "/api/partners");
            return res.json();
        }
    });

    const connectMutation = useMutation({
        mutationFn: async (targetUserId: string) => {
            await apiRequest("POST", "/api/partners/request", { targetUserId });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["connections"] });
            toast({
                title: "Request Sent",
                description: "A connection request has been sent.",
            });
        },
        onError: (error: any) => {
            toast({
                title: "Failed to connect",
                description: error.message,
                variant: "destructive",
            });
        }
    });

    const respondMutation = useMutation({
        mutationFn: async ({ partnershipId, status }: { partnershipId: string, status: 'accepted' | 'rejected' }) => {
            await apiRequest("POST", "/api/partners/respond", { partnershipId, status });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["connections"] });
            toast({
                title: "Updated",
                description: "Connection request updated.",
            });
        },
    });

    const challengeMutation = useMutation({
        mutationFn: async (defenderId: string) => {
            await apiRequest("POST", "/api/rivalry/challenge", { defenderId });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["rivalries"] });
            toast({ title: "Challenge Sent!", description: "Your rival has been challenged to a duel." });
        },
        onError: () => {
            toast({ title: "Failed to Challenge", variant: "destructive" });
        }
    });

    const rivalryRespondMutation = useMutation({
        mutationFn: async ({ rivalryId, status }: { rivalryId: string, status: 'active' | 'rejected' }) => {
            await apiRequest("POST", "/api/rivalry/respond", { rivalryId, status });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["rivalries"] });
            toast({ title: "Rivalry Updated" });
        }
    });

    const filteredPartners = partners.filter((partner: any) => {
        const matchesSearch = partner.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (partner.studySubject || "").toLowerCase().includes(searchQuery.toLowerCase());
        return matchesSearch;
    });

    const getConnectionStatus = (partnerId: string) => {
        const connection = connections.find((c: any) =>
            connectionContainsUser(c, partnerId)
        );
        return connection ? connection.status : null;
    };

    const connectionContainsUser = (c: any, uid: string) => c.user1Id === uid || c.user2Id === uid;


    const handleConnect = (partnerId: string) => connectMutation.mutate(partnerId);
    const handleRespond = (partnershipId: string, status: 'accepted' | 'rejected') => respondMutation.mutate({ partnershipId, status });
    const handleChallenge = (defenderId: string) => challengeMutation.mutate(defenderId);



    const incomingRequests = connections.filter((c: any) =>
        c.status === 'pending' && c.user2Id === user?.id
    );

    const myConnections = connections.filter((c: any) =>
        c.status === 'accepted'
    );

    const activeRivalies = rivalries.filter((r: any) => r.status === 'active');
    const pendingRivalries = rivalries.filter((r: any) => r.status === 'pending' && r.defenderId === user?.id);

    return (
        <div className="space-y-8 p-8 min-h-screen text-white">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                        <Users className="w-8 h-8 text-cyan-500" />
                        Community Directory
                    </h1>
                    <p className="text-zinc-400 mt-1">Connect, collaborate, and compete.</p>
                </div>
            </div>

            {/* Rivalry Section */}
            {(activeRivalies.length > 0 || pendingRivalries.length > 0) && (
                <div className="space-y-4">
                    <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                        <Zap className="w-5 h-5 text-yellow-500" /> Active Rivalries
                    </h2>

                    {pendingRivalries.length > 0 && (
                        <div className="mb-4 space-y-2">
                            {pendingRivalries.map((r: any) => (
                                <Card key={r.id} className="bg-yellow-500/10 border-yellow-500/30">
                                    <CardContent className="p-4 flex justify-between items-center">
                                        <div className="flex items-center gap-2">
                                            <Badge className="bg-yellow-500 text-black">CHALLENGE</Badge>
                                            <span>
                                                <span className="font-bold">{r.opponent?.name}</span> challenged you to a duel!
                                            </span>
                                        </div>
                                        <div className="flex gap-2">
                                            <Button size="sm" className="bg-yellow-500 text-black hover:bg-yellow-400" onClick={() => rivalryRespondMutation.mutate({ rivalryId: r.id, status: 'active' })}>Accept</Button>
                                            <Button size="sm" variant="ghost" onClick={() => rivalryRespondMutation.mutate({ rivalryId: r.id, status: 'rejected' })}>Decline</Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {activeRivalies.map((r: any) => {
                            const isChallenger = r.challengerId === user?.id;
                            const myScore = isChallenger ? r.challengerScore : r.defenderScore;
                            const oppScore = isChallenger ? r.defenderScore : r.challengerScore;
                            const total = myScore + oppScore || 1;
                            const myPercent = (myScore / total) * 100;

                            return (
                                <Card key={r.id} className="bg-zinc-900 border-yellow-500/20 relative overflow-hidden">
                                    <div className="absolute inset-0 bg-gradient-to-r from-red-500/5 to-blue-500/5 pointer-events-none" />
                                    <CardContent className="p-6">
                                        <div className="flex justify-between items-center mb-4">
                                            <div className="flex items-center gap-2">
                                                <Avatar className="w-8 h-8 ring-2 ring-blue-500">
                                                    <AvatarFallback>U</AvatarFallback>
                                                </Avatar>
                                                <span className="font-bold text-blue-400">You</span>
                                            </div>
                                            <div className="text-yellow-500 font-display font-bold text-xl">VS</div>
                                            <div className="flex items-center gap-2">
                                                <span className="font-bold text-red-400">{r.opponent?.name}</span>
                                                <Avatar className="w-8 h-8 ring-2 ring-red-500">
                                                    <AvatarImage src={r.opponent?.avatarUrl} />
                                                    <AvatarFallback>{r.opponent?.name?.[0]}</AvatarFallback>
                                                </Avatar>
                                            </div>
                                        </div>

                                        <div className="flex justify-between text-sm mb-1 font-mono">
                                            <span className="text-blue-400">{myScore} XP</span>
                                            <span className="text-red-400">{oppScore} XP</span>
                                        </div>
                                        <div className="h-4 bg-zinc-800 rounded-full overflow-hidden flex relative">
                                            <div style={{ width: `${myPercent}%` }} className="bg-blue-600 h-full transition-all duration-500" />
                                            <div className="flex-1 bg-red-600 h-full transition-all duration-500" />

                                            {/* Center marker */}
                                            <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-white/50 -translate-x-1/2" />
                                        </div>

                                        <p className="text-xs text-center text-zinc-500 mt-2">
                                            Reward: <span className="text-yellow-500">{r.reward} XP</span> • Ends {new Date(r.endDate).toLocaleDateString()}
                                        </p>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Incoming Requests */}
            {incomingRequests.length > 0 && (
                <div className="space-y-4">
                    <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                        <UserPlus className="w-5 h-5 text-blue-400" />
                        Incoming Requests
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {incomingRequests.map((req: any) => (
                            <Card key={req.id} className="bg-zinc-900/50 border-blue-500/30">
                                <CardContent className="p-4 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <Avatar>
                                            <AvatarImage src={req.otherUser?.avatarUrl} />
                                            <AvatarFallback>{req.otherUser?.name?.[0]}</AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <p className="font-medium text-white">{req.otherUser?.name}</p>
                                            <p className="text-xs text-zinc-400">{req.otherUser?.studySubject}</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button size="sm" variant="default" className="bg-green-600 hover:bg-green-700"
                                            onClick={() => handleRespond(req.id, 'accepted')}>
                                            Accept
                                        </Button>
                                        <Button size="sm" variant="destructive"
                                            onClick={() => handleRespond(req.id, 'rejected')}>
                                            Decline
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            )}

            {/* Active Connections */}
            {myConnections.length > 0 && (
                <div className="space-y-4">
                    <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                        <Users className="w-5 h-5 text-green-400" />
                        Your Partners
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {myConnections.map((conn: any) => {
                            // Check if already in rivalry
                            const hasRivalry = rivalries.some((r: any) =>
                                (r.challengerId === conn.otherUser?.id || r.defenderId === conn.otherUser?.id) &&
                                (r.status === 'active' || r.status === 'pending')
                            );

                            return (
                                <Card key={conn.id} className="bg-zinc-900/50 border-green-500/30 cursor-pointer hover:bg-zinc-900/80 transition-colors"
                                    onClick={() => setLocation(`/session/${conn.otherUser?.id}`)}>
                                    <CardContent className="p-4">
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="flex items-center gap-3">
                                                <Avatar>
                                                    <AvatarImage src={conn.otherUser?.avatarUrl} />
                                                    <AvatarFallback>{conn.otherUser?.name?.[0]}</AvatarFallback>
                                                </Avatar>
                                                <div>
                                                    <p className="font-medium text-white">{conn.otherUser?.name}</p>
                                                    <p className="text-xs text-green-400">Connected</p>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <Button size="sm" variant="secondary" className="flex-1">
                                                Study Now
                                            </Button>
                                            {/* Rivalry Button */}
                                            {!hasRivalry && (
                                                <Button
                                                    size="sm"
                                                    className="bg-red-900/50 text-red-200 hover:bg-red-800 border border-red-500/30"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleChallenge(conn.otherUser?.id);
                                                    }}
                                                >
                                                    Challenge
                                                </Button>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                </div>
            )}

            <div className="space-y-6">
                <div className="space-y-6">
                    {/* Filters */}
                    <Card className="bg-zinc-900/50 border-zinc-800 backdrop-blur-xl">
                        <CardContent className="p-6">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                                    <Input
                                        placeholder="Search by name or profession..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="pl-10 bg-black border-zinc-700"
                                    />
                                </div>
                                <Select value={subjectFilter} onValueChange={setSubjectFilter}>
                                    <SelectTrigger className="bg-black border-zinc-700">
                                        <SelectValue placeholder="Profession / Subject" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
                                        <SelectItem value="All">All Professions</SelectItem>
                                        <SelectItem value="Mathematics">Mathematics</SelectItem>
                                        <SelectItem value="Physics">Physics</SelectItem>
                                        <SelectItem value="Computer Science">Computer Science</SelectItem>
                                        <SelectItem value="History">History</SelectItem>
                                    </SelectContent>
                                </Select>
                                <Select value={availabilityFilter} onValueChange={setAvailabilityFilter}>
                                    <SelectTrigger className="bg-black border-zinc-700">
                                        <SelectValue placeholder="Availability" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
                                        <SelectItem value="All">Any Availability</SelectItem>
                                        <SelectItem value="Mornings">Mornings</SelectItem>
                                        <SelectItem value="Evenings">Evenings</SelectItem>
                                        <SelectItem value="Weekends">Weekends</SelectItem>
                                        <SelectItem value="Anytime">Anytime</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Partners Grid */}
                    {isLoading ? (
                        <div className="flex justify-center py-12">
                            <Loader2 className="w-8 h-8 animate-spin text-cyan-500" />
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredPartners.map((partner: any, index: number) => {
                                const status = getConnectionStatus(partner.id);
                                return (
                                    <motion.div
                                        key={partner.id}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.1 }}
                                    >
                                        <Card className="bg-zinc-900/50 border-zinc-800 hover:border-cyan-500/50 transition-all duration-300 group h-full flex flex-col">
                                            <CardHeader className="flex flex-row items-center gap-4 pb-2">
                                                <Avatar className="h-14 w-14 border-2 border-zinc-800 group-hover:border-cyan-500/50 transition-colors">
                                                    <AvatarImage src={partner.avatarUrl || undefined} />
                                                    <AvatarFallback className="bg-zinc-800 text-zinc-400 font-bold text-lg">
                                                        {partner.name.charAt(0)}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div>
                                                    <CardTitle className="text-lg text-white group-hover:text-cyan-400 transition-colors">
                                                        {partner.name}
                                                    </CardTitle>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <Badge variant="secondary" className="bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20 border-0">
                                                            {partner.studySubject || "Member"}
                                                        </Badge>
                                                        <span className="text-xs text-zinc-500">Lvl {partner.level}</span>
                                                    </div>
                                                </div>
                                            </CardHeader>
                                            <CardContent className="space-y-4 flex-1 flex flex-col justify-end">
                                                <div className="space-y-2 text-sm text-zinc-300">
                                                    <div className="flex items-center gap-2">
                                                        <Briefcase className="w-4 h-4 text-zinc-500" />
                                                        <span>Profession: <span className="text-white">{partner.studySubject || "General"}</span></span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <Clock className="w-4 h-4 text-zinc-500" />
                                                        <span>Available: <span className="text-white">{partner.studyAvailability || "Flexible"}</span></span>
                                                    </div>
                                                </div>

                                                <div className="flex gap-2 pt-4 mt-auto">
                                                    {status === "pending" ? (
                                                        <Button disabled className="flex-1 bg-zinc-800 text-zinc-400">
                                                            <Clock className="w-4 h-4 mr-2" /> Pending
                                                        </Button>
                                                    ) : status === "accepted" ? (
                                                        <Button
                                                            className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                                                            onClick={() => setLocation(`/session/${partner.id}`)}
                                                        >
                                                            <MessageSquare className="w-4 h-4 mr-2" /> Study Now
                                                        </Button>
                                                    ) : (
                                                        <Button
                                                            className="flex-1 bg-cyan-600 hover:bg-cyan-700 text-white shadow-lg shadow-cyan-900/20"
                                                            onClick={() => handleConnect(partner.id)}
                                                            disabled={connectMutation.isPending}
                                                        >
                                                            {connectMutation.isPending ? (
                                                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                            ) : (
                                                                <UserPlus className="w-4 h-4 mr-2" />
                                                            )}
                                                            Connect
                                                        </Button>
                                                    )}
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </motion.div>
                                );
                            })}
                        </div>
                    )}

                    {filteredPartners.length === 0 && !isLoading && (
                        <div className="text-center py-12 text-zinc-500">
                            <Users className="w-12 h-12 mx-auto mb-4 opacity-20" />
                            <p>No members found matching your criteria.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
