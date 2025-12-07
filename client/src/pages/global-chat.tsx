import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { Send, Users, MessageSquare } from "lucide-react";
import { motion } from "framer-motion";

interface Message {
    id: number;
    user: string;
    avatar?: string;
    text: string;
    timestamp: Date;
    isMe: boolean;
}

import { useToast } from "@/hooks/use-toast";

export default function GlobalChatPage() {
    const { user } = useAuth();
    const { toast } = useToast();
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState("");
    const [isConnected, setIsConnected] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);
    const wsRef = useRef<WebSocket | null>(null);

    // Fetch initial messages
    useEffect(() => {
        const fetchMessages = async () => {
            try {
                const res = await fetch("/api/messages");
                if (res.ok) {
                    const data = await res.json();
                    const formattedMessages = data.map((msg: any) => ({
                        id: msg.id,
                        user: msg.user.name,
                        avatar: msg.user.avatarUrl,
                        text: msg.content,
                        timestamp: new Date(msg.createdAt),
                        isMe: user ? msg.userId === user.id : false,
                    }));
                    setMessages(formattedMessages);
                }
            } catch (error) {
                console.error("Failed to fetch messages:", error);
            }
        };

        fetchMessages();
    }, [user]);

    // Connect to WebSocket
    useEffect(() => {
        const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
        const wsUrl = `${protocol}//${window.location.host}/ws/chat`;
        console.log("Connecting to WebSocket:", wsUrl);
        const ws = new WebSocket(wsUrl);

        ws.onopen = () => {
            console.log("Connected to chat WebSocket");
            setIsConnected(true);
        };

        ws.onclose = () => {
            console.log("Disconnected from chat WebSocket");
            setIsConnected(false);
        };

        ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                if (data.type === "new_message") {
                    const msg = data.message;
                    const formattedMsg: Message = {
                        id: msg.id,
                        user: msg.user.name,
                        avatar: msg.user.avatarUrl,
                        text: msg.content,
                        timestamp: new Date(msg.createdAt),
                        isMe: user ? msg.userId === user.id : false,
                    };
                    setMessages((prev) => [...prev, formattedMsg]);
                } else if (data.type === "system_announcement") {
                    toast({
                        title: "System Announcement",
                        description: data.message,
                        variant: "default",
                        className: "bg-purple-600 text-white border-none"
                    });
                }
            } catch (error) {
                console.error("Failed to parse WebSocket message:", error);
            }
        };

        wsRef.current = ws;

        return () => {
            ws.close();
        };
    }, [user]);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [messages]);

    const handleSendMessage = (e?: React.FormEvent) => {
        e?.preventDefault();

        if (!user) {
            console.error("Cannot send message: User not logged in");
            return;
        }
        if (!user.id) {
            console.error("Cannot send message: User ID missing", user);
            // Attempt to use uid as fallback if id is missing (though backend expects UUID)
            // This is just for debugging
            alert("Error: User ID not found. Please refresh the page.");
            return;
        }
        if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
            console.error("Cannot send message: WebSocket not connected");
            return;
        }
        if (!newMessage.trim()) return;

        const messageData = {
            userId: user.id,
            content: newMessage,
        };

        console.log("Sending message:", messageData);
        wsRef.current.send(JSON.stringify(messageData));
        setNewMessage("");
    };

    return (
        <div className="h-[calc(100vh-2rem)] flex flex-col gap-4 p-4 max-w-6xl mx-auto">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                        <MessageSquare className="w-8 h-8 text-purple-500" />
                        Global Chat
                    </h1>
                    <p className="text-muted-foreground">Connect with fellow ascendants worldwide.</p>
                </div>
                <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-green-500/10 border border-green-500/20 text-green-400 text-sm">
                    <Users className="w-4 h-4" />
                    <span>{124} Online</span>
                    <span className={`w-2 h-2 rounded-full ${isConnected ? "bg-green-500" : "bg-red-500"}`} title={isConnected ? "Connected" : "Disconnected"} />
                </div>
            </div>

            <Card className="flex-1 bg-zinc-900/50 border-zinc-800/50 backdrop-blur-xl flex flex-col overflow-hidden">
                <ScrollArea className="flex-1 p-4">
                    <div className="space-y-4">
                        {messages.map((msg) => (
                            <motion.div
                                key={msg.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className={`flex gap-3 ${msg.isMe ? "flex-row-reverse" : ""}`}
                            >
                                <Avatar className="w-8 h-8 border border-white/10">
                                    <AvatarImage src={msg.avatar} />
                                    <AvatarFallback className={msg.isMe ? "bg-purple-600" : "bg-zinc-700"}>
                                        {msg.user[0]}
                                    </AvatarFallback>
                                </Avatar>
                                <div className={`flex flex-col ${msg.isMe ? "items-end" : "items-start"}`}>
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="text-xs font-medium text-zinc-400">{msg.user}</span>
                                        <span className="text-[10px] text-zinc-600">
                                            {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                    <div
                                        className={`px-4 py-2 rounded-2xl max-w-md text-sm ${msg.isMe
                                            ? "bg-purple-600 text-white rounded-tr-none"
                                            : "bg-zinc-800 text-zinc-200 rounded-tl-none"
                                            }`}
                                    >
                                        {msg.text}
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                        <div ref={scrollRef} />
                    </div>
                </ScrollArea>
                <div className="p-4 bg-black/20 border-t border-white/5">
                    <form onSubmit={handleSendMessage} className="flex gap-2">
                        <Input
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            placeholder={isConnected ? "Type a message..." : "Connecting..."}
                            disabled={!isConnected}
                            className="bg-black/50 border-zinc-700 focus-visible:ring-purple-500"
                        />
                        <Button type="submit" size="icon" disabled={!isConnected} className="bg-purple-600 hover:bg-purple-700">
                            <Send className="w-4 h-4" />
                        </Button>
                    </form>
                </div>
            </Card>
        </div>
    );
}
