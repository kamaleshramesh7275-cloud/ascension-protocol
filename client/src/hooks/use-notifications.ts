import { useState, useEffect } from "react";
import { getToken, onMessage } from "firebase/messaging";
import { getFCMMessaging } from "@/lib/firebase";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "./use-auth";
import { useToast } from "./use-toast";

export function useNotifications() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      setPermission(Notification.permission);
    }
  }, []);

  const requestPermission = async () => {
    try {
      const p = await Notification.requestPermission();
      setPermission(p);

      if (p === "granted" && user) {
        const messaging = await getFCMMessaging();
        if (!messaging) {
          toast({
            title: "Notifications not supported",
            description: "Your browser does not support push notifications.",
            variant: "destructive"
          });
          return;
        }

        // Generate FCM token
        // You would typically pass a VAPID key here if configured in Firebase Project Settings
        const currentToken = await getToken(messaging, {
          // vapidKey: "YOUR_PUBLIC_VAPID_KEY_HERE"
        });

        if (currentToken) {
          setToken(currentToken);
          // Send to backend
          await apiRequest("POST", "/api/push/register", {
            token: currentToken
          });
          
          toast({
            title: "Notifications Enabled",
            description: "You will now receive alerts for quests and reminders.",
          });
        }
      } else if (p === "denied") {
        toast({
          title: "Notifications Blocked",
          description: "You have blocked notifications in your browser settings.",
          variant: "destructive"
        });
      }
    } catch (err: any) {
      console.error("Failed to request notification permission", err);
      toast({
        title: "Error enabling notifications",
        description: err.message,
        variant: "destructive"
      });
    }
  };

  return {
    permission,
    token,
    requestPermission,
  };
}
