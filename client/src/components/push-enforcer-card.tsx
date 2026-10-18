import { useState } from "react";
import { usePushNotifications } from "@/hooks/use-push-notifications";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bell, BellOff, ShieldAlert, Zap, Radio, CheckCircle2, AlertTriangle, ArrowRight, Sun, Moon, Scale, Users } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface PushEnforcerCardProps {
  compact?: boolean;
}

export function PushEnforcerCard({ compact = false }: PushEnforcerCardProps) {
  const { isSupported, permission, isLoading, subscribe, unsubscribe } = usePushNotifications();
  const { toast } = useToast();
  const [testingTrigger, setTestingTrigger] = useState<string | null>(null);

  const handleTestBeacon = async (triggerType: string, label: string) => {
    setTestingTrigger(triggerType);
    try {
      const res = await apiRequest("POST", "/api/push/test", { triggerType });
      const data = await res.json();
      toast({
        title: `⚡ ${label} Dispatched`,
        description: data.message || "Push beacon emitted across registered devices.",
      });
    } catch (err: any) {
      toast({
        title: "Dispatch Failure",
        description: err.message || "Failed to trigger push notification.",
        variant: "destructive",
      });
    } finally {
      setTestingTrigger(null);
    }
  };

  const isGranted = permission === "granted";
  const isDenied = permission === "denied";

  if (!isSupported) {
    return (
      <Card className="border-white/10 bg-zinc-950/80 backdrop-blur-md">
        <CardContent className="p-4 flex items-center gap-3 text-xs text-muted-foreground">
          <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
          <span>Web Push notifications are not supported in this browser environment.</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-white/10 bg-zinc-950/80 backdrop-blur-md shadow-2xl relative overflow-hidden">
      <div className={`absolute top-0 left-0 right-0 h-[2px] ${isGranted ? "bg-gradient-to-r from-emerald-500 via-cyan-500 to-emerald-500" : "bg-gradient-to-r from-amber-500 via-rose-500 to-amber-500"}`} />
      
      <CardHeader className={compact ? "p-4 pb-2" : "p-5 pb-3"}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className={`p-2 rounded-lg border ${isGranted ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" : "bg-amber-500/10 border-amber-500/30 text-amber-400"}`}>
              {isGranted ? <Radio className="w-4 h-4 animate-pulse" /> : <BellOff className="w-4 h-4" />}
            </div>
            <div>
              <CardTitle className="text-sm font-black tracking-wider uppercase text-white flex items-center gap-2">
                Autonomous Directive Radar
                <Badge variant="outline" className={isGranted ? "border-emerald-500/40 text-emerald-400 bg-emerald-500/10 text-[10px]" : "border-amber-500/40 text-amber-400 bg-amber-500/10 text-[10px]"}>
                  {isGranted ? "RADAR ARMED" : isDenied ? "ACCESS BLOCKED" : "UNARMED"}
                </Badge>
              </CardTitle>
              <CardDescription className="text-xs text-zinc-400">
                {isGranted 
                  ? "Real-time enforcer crons (06:30, 13:00, 21:00, Sun 20:00) dispatching directly to this device."
                  : "Enable push notifications to receive non-negotiable mission mandates and drift intercepts."}
              </CardDescription>
            </div>
          </div>

          <div>
            {isGranted ? (
              <Button
                size="sm"
                variant="ghost"
                onClick={unsubscribe}
                className="text-[11px] h-7 text-zinc-500 hover:text-zinc-300"
              >
                Disable
              </Button>
            ) : (
              <Button
                size="sm"
                onClick={subscribe}
                disabled={isLoading}
                className="h-8 bg-gradient-to-r from-amber-600 to-rose-600 hover:from-amber-500 hover:to-rose-500 text-white font-bold text-xs uppercase tracking-wider"
              >
                {isLoading ? "Arming..." : "Arm Enforcer Push"}
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className={compact ? "p-4 pt-1" : "p-5 pt-2"}>
        {isDenied && (
          <div className="p-3 mb-3 rounded-lg border border-rose-500/20 bg-rose-500/5 text-xs text-rose-300 flex items-start gap-2.5">
            <ShieldAlert className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
            <div>
              <p className="font-semibold">Browser Push Blocked</p>
              <p className="text-[11px] text-zinc-400 mt-0.5">
                Notifications were denied in browser permissions. Click the lock/tune icon in your address bar to toggle notifications on for this origin.
              </p>
            </div>
          </div>
        )}

        {/* Test Beacons Grid */}
        <div className="space-y-2 mt-2">
          <div className="flex items-center justify-between text-[11px] text-zinc-400 font-mono uppercase tracking-wider">
            <span>Direct Enforcer Beacon Simulation</span>
            <span className="text-[10px] text-zinc-600">Simulate Real-Time Trigger</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            <Button
              size="sm"
              variant="outline"
              disabled={testingTrigger !== null}
              onClick={() => handleTestBeacon("morning", "06:30 Morning Directive")}
              className="h-8 border-white/10 hover:border-amber-500/50 hover:bg-amber-500/10 text-[11px] justify-start px-2 font-mono"
            >
              <Sun className="w-3 h-3 text-amber-400 mr-1.5 shrink-0" />
              06:30 Brief
            </Button>

            <Button
              size="sm"
              variant="outline"
              disabled={testingTrigger !== null}
              onClick={() => handleTestBeacon("pulse", "13:00 Tactical Pulse")}
              className="h-8 border-white/10 hover:border-cyan-500/50 hover:bg-cyan-500/10 text-[11px] justify-start px-2 font-mono"
            >
              <Zap className="w-3 h-3 text-cyan-400 mr-1.5 shrink-0" />
              13:00 Pulse
            </Button>

            <Button
              size="sm"
              variant="outline"
              disabled={testingTrigger !== null}
              onClick={() => handleTestBeacon("debrief", "21:00 Evening Debrief")}
              className="h-8 border-white/10 hover:border-purple-500/50 hover:bg-purple-500/10 text-[11px] justify-start px-2 font-mono"
            >
              <Moon className="w-3 h-3 text-purple-400 mr-1.5 shrink-0" />
              21:00 Debrief
            </Button>

            <Button
              size="sm"
              variant="outline"
              disabled={testingTrigger !== null}
              onClick={() => handleTestBeacon("court", "Sunday Performance Court")}
              className="h-8 border-white/10 hover:border-rose-500/50 hover:bg-rose-500/10 text-[11px] justify-start px-2 font-mono"
            >
              <Scale className="w-3 h-3 text-rose-400 mr-1.5 shrink-0" />
              Sun Court
            </Button>

            <Button
              size="sm"
              variant="outline"
              disabled={testingTrigger !== null}
              onClick={() => handleTestBeacon("squad", "Squad Defector Alert")}
              className="col-span-2 sm:col-span-1 h-8 border-white/10 hover:border-orange-500/50 hover:bg-orange-500/10 text-[11px] justify-start px-2 font-mono"
            >
              <Users className="w-3 h-3 text-orange-400 mr-1.5 shrink-0" />
              Defector
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
