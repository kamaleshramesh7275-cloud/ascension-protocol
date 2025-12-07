import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface NotificationHistoryItem {
    id: string;
    title: string;
    message: string;
    type: string;
    createdAt: string;
    recipientCount: number;
}

export function AdminNotificationHistory() {
    const { data: history } = useQuery<NotificationHistoryItem[]>({
        queryKey: ["/api/admin/notifications/history"],
        refetchInterval: 30000,
    });

    return (
        <Card>
            <CardHeader>
                <CardTitle>Notification History</CardTitle>
            </CardHeader>
            <CardContent>
                {!history || history.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">No notifications sent yet</p>
                ) : (
                    <div className="space-y-2">
                        {history.map((notification) => (
                            <div
                                key={notification.id}
                                className="p-3 border rounded-lg space-y-1"
                            >
                                <div className="flex items-center justify-between">
                                    <p className="font-medium">{notification.title}</p>
                                    <span className="text-xs text-muted-foreground">
                                        {new Date(notification.createdAt).toLocaleString()}
                                    </span>
                                </div>
                                <p className="text-sm text-muted-foreground">
                                    {notification.message}
                                </p>
                                <div className="flex items-center gap-2 text-xs">
                                    <span className="px-2 py-0.5 bg-primary/10 rounded">
                                        {notification.type}
                                    </span>
                                    <span>
                                        Sent to: {notification.recipientCount || 1} user(s)
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
