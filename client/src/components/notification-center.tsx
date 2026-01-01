import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Bell, Shield, Megaphone, Info, Calendar, Target, CheckCircle, Flame, Award, Heart, UserPlus, LucideIcon } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Notification } from "@shared/schema";
import { Badge } from "@/components/ui/badge";
import { useLocation } from "wouter";

// Notification type to icon mapping
const notificationIcons: Record<string, LucideIcon> = {
    admin: Shield,
    announcement: Megaphone,
    update: Info,
    event: Calendar,
    quest: Target,
    habit: CheckCircle,
    streak: Flame,
    achievement: Award,
    motivational: Heart,
    partner_request: UserPlus,
};

// Notification type to color mapping
const notificationColors: Record<string, string> = {
    admin: "text-purple-500",
    announcement: "text-blue-500",
    update: "text-cyan-500",
    event: "text-green-500",
    quest: "text-orange-500",
    habit: "text-teal-500",
    streak: "text-red-500",
    achievement: "text-yellow-500",
    motivational: "text-pink-500",
    partner_request: "text-indigo-500",
};

export function NotificationCenter() {
    const { data: notifications } = useQuery<Notification[]>({
        queryKey: ["/api/notifications"],
        refetchInterval: 60000, // Refresh every minute
    });
    const [, setLocation] = useLocation();

    const markAsRead = useMutation({
        mutationFn: (id: string) =>
            apiRequest("PATCH", `/api/notifications/${id}/read`, {}),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
        },
    });

    const markAllAsRead = useMutation({
        mutationFn: async () => {
            const unreadNotifications = notifications?.filter(n => !n.read) || [];
            await Promise.all(
                unreadNotifications.map(n =>
                    apiRequest("PATCH", `/api/notifications/${n.id}/read`, {})
                )
            );
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
        },
    });

    const unreadCount = notifications?.filter(n => !n.read).length || 0;

    const getNotificationIcon = (type: string) => {
        const Icon = notificationIcons[type] || Bell;
        const colorClass = notificationColors[type] || "text-gray-500";
        return <Icon className={`h-5 w-5 ${colorClass}`} />;
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center font-bold">
                            {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                    )}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-96 max-h-[32rem] overflow-hidden flex flex-col">
                <div className="p-4 border-b">
                    <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-lg">Notifications</h3>
                        {unreadCount > 0 && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => markAllAsRead.mutate()}
                                disabled={markAllAsRead.isPending}
                                className="text-xs"
                            >
                                Mark all read
                            </Button>
                        )}
                    </div>
                </div>
                <div className="overflow-y-auto flex-1">
                    {!notifications || notifications.length === 0 ? (
                        <div className="p-8 text-center">
                            <Bell className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
                            <p className="text-sm text-muted-foreground font-medium">No notifications yet</p>
                            <p className="text-xs text-muted-foreground mt-1">You'll see updates and announcements here</p>
                        </div>
                    ) : (
                        <div className="p-2">
                            {notifications.map((notification, index) => (
                                <div key={notification.id}>
                                    <div
                                        className={`p-3 rounded-lg cursor-pointer transition-all hover:scale-[1.02] ${notification.read
                                            ? "bg-muted/30 hover:bg-muted/50"
                                            : "bg-primary/10 hover:bg-primary/15 border border-primary/20 shadow-sm"
                                            }`}
                                        onClick={() => {
                                            if (!notification.read) markAsRead.mutate(notification.id);
                                            if (notification.title === "Premium Activated" || notification.title === "Premium Activation Approved!") {
                                                setLocation("/profile?premium_activated=true");
                                            }
                                        }}
                                    >
                                        <div className="flex items-start gap-3">
                                            <div className="flex-shrink-0 mt-0.5">
                                                {getNotificationIcon(notification.type)}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-start justify-between gap-2 mb-1">
                                                    <p className="font-semibold text-sm">{notification.title}</p>
                                                    {!notification.read && (
                                                        <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-1.5" />
                                                    )}
                                                </div>
                                                <p className="text-xs text-muted-foreground leading-relaxed mb-2">
                                                    {notification.message}
                                                </p>
                                                <div className="flex items-center gap-2">
                                                    <Badge variant="secondary" className="text-xs capitalize">
                                                        {notification.type.replace('_', ' ')}
                                                    </Badge>
                                                    <span className="text-xs text-muted-foreground">
                                                        {new Date(notification.createdAt).toLocaleDateString()} at{' '}
                                                        {new Date(notification.createdAt).toLocaleTimeString([], {
                                                            hour: '2-digit',
                                                            minute: '2-digit'
                                                        })}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    {index < notifications.length - 1 && (
                                        <DropdownMenuSeparator className="my-2" />
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
