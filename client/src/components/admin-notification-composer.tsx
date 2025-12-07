import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import type { User } from "@shared/schema";

export function AdminNotificationComposer() {
    const { toast } = useToast();
    const [recipient, setRecipient] = useState<"single" | "all">("all");
    const [selectedUserId, setSelectedUserId] = useState<string>("");
    const [title, setTitle] = useState("");
    const [message, setMessage] = useState("");
    const [type, setType] = useState("admin");

    const { data: users } = useQuery<User[]>({
        queryKey: ["/api/admin/users"],
    });

    const sendNotification = useMutation({
        mutationFn: async () => {
            const adminPassword = sessionStorage.getItem("adminPassword");
            if (!adminPassword) {
                throw new Error("Not authenticated as admin");
            }

            let response;
            if (recipient === "single") {
                response = await fetch("/api/admin/notifications/send", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "x-admin-password": adminPassword,
                    },
                    body: JSON.stringify({
                        userId: selectedUserId,
                        title,
                        message,
                        type,
                    }),
                });
            } else {
                response = await fetch("/api/admin/notifications/broadcast", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "x-admin-password": adminPassword,
                    },
                    body: JSON.stringify({
                        title,
                        message,
                        type,
                    }),
                });
            }

            if (!response.ok) {
                const error = await response.text();
                throw new Error(error || "Failed to send notification");
            }

            return await response.json();
        },
        onSuccess: (data: any) => {
            toast({
                title: "Notification Sent",
                description: recipient === "all"
                    ? `Broadcast to ${data.count} users`
                    : "Notification sent successfully",
            });
            setTitle("");
            setMessage("");
        },
        onError: (error: any) => {
            toast({
                title: "Error",
                description: error?.message || "Failed to send notification. Make sure you're logged in as admin.",
                variant: "destructive",
            });
        },
    });

    const previewNotification = () => {
        if ("Notification" in window && Notification.permission === "granted") {
            new Notification(title, { body: message });
        } else {
            toast({
                title: title,
                description: message,
            });
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Send Custom Notification</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div>
                    <Label>Recipient</Label>
                    <Select value={recipient} onValueChange={(v: any) => setRecipient(v)}>
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Users (Broadcast)</SelectItem>
                            <SelectItem value="single">Single User</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {recipient === "single" && (
                    <div>
                        <Label>Select User</Label>
                        <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                            <SelectTrigger>
                                <SelectValue placeholder="Choose a user..." />
                            </SelectTrigger>
                            <SelectContent>
                                {users?.map((user) => (
                                    <SelectItem key={user.id} value={user.id}>
                                        {user.name} ({user.email})
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                )}

                <div>
                    <Label>Notification Type</Label>
                    <Select value={type} onValueChange={setType}>
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="admin">Admin Message</SelectItem>
                            <SelectItem value="announcement">Announcement</SelectItem>
                            <SelectItem value="update">System Update</SelectItem>
                            <SelectItem value="event">Event</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div>
                    <Label>Title</Label>
                    <Input
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Notification title..."
                        maxLength={100}
                    />
                </div>

                <div>
                    <Label>Message</Label>
                    <Textarea
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="Notification message..."
                        rows={4}
                        maxLength={500}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                        {message.length}/500 characters
                    </p>
                </div>

                <div className="flex gap-2">
                    <Button
                        onClick={previewNotification}
                        variant="outline"
                        disabled={!title || !message}
                    >
                        Preview
                    </Button>
                    <Button
                        onClick={() => sendNotification.mutate()}
                        disabled={
                            !title ||
                            !message ||
                            (recipient === "single" && !selectedUserId) ||
                            sendNotification.isPending
                        }
                        className="flex-1"
                    >
                        {sendNotification.isPending
                            ? "Sending..."
                            : recipient === "all"
                                ? "Broadcast to All Users"
                                : "Send to User"}
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
