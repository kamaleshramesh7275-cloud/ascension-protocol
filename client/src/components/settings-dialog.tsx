import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { motion } from "framer-motion";
import {
  Bell,
  Moon,
  Globe,
  Shield,
  Trash2,
  LogOut,
  Volume2,
  Eye,
  Lock,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useNotifications } from "@/hooks/use-notifications";
import { PushEnforcerCard } from "@/components/push-enforcer-card";
import { audioEngine } from "@/lib/audio-engine";

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SettingsDialog({ open, onOpenChange }: SettingsDialogProps) {
  const { signOut } = useAuth();
  const { toast } = useToast();
  const { permission, token, requestPermission } = useNotifications();

  // Settings state
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [soundEffects, setSoundEffects] = useState(true);
  const [lowStimulation, setLowStimulation] = useState(() => {
    return typeof window !== "undefined" && localStorage.getItem("ascension_low_stim") === "true";
  });
  const [darkMode, setDarkMode] = useState(true);
  const [publicProfile, setPublicProfile] = useState(true);
  const [showActivity, setShowActivity] = useState(true);

  // Password Change State
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const handleChangePassword = () => {
    audioEngine.playTactileClick();
    if (!currentPassword || !newPassword) {
      toast({ title: "Error", description: "Please fill in all fields", variant: "destructive" });
      return;
    }
    toast({ title: "Password Updated", description: "Your credentials have been securely updated." });
    setShowPasswordChange(false);
    setCurrentPassword("");
    setNewPassword("");
  };

  const handleLogout = async () => {
    audioEngine.playTactileClick();
    try {
      await signOut();
      toast({
        title: "Logged Out",
        description: "Session terminated successfully.",
      });
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Logout Failed",
        description: "Failed to terminate session. Please retry.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteAccount = () => {
    audioEngine.playTactileClick();
    if (confirm("Are you sure you want to delete your account? This action cannot be undone.")) {
      toast({
        title: "Account Deletion",
        description: "Irrevocable deletion request queued.",
      });
    }
  };

  const settingsSections = [
    {
      title: "TELEMETRY & ALERTS",
      icon: Bell,
      settings: [
        {
          id: "push-notifications",
          label: "Mission Alerts (Push)",
          description: "Real-time dispatch on directive status and audit deadlines",
          checked: permission === "granted" || token !== null,
          onChange: (checked: boolean) => {
            audioEngine.playTactileClick();
            if (checked && permission !== "granted") {
              requestPermission();
            } else if (!checked) {
              toast({ title: "Note", description: "To disable push notifications, calibrate browser site permissions.", variant: "default" });
            }
          },
        },
        {
          id: "email-notifications",
          label: "Weekly Intelligence Brief",
          description: "Audit digest and Performance Court decrees via email",
          checked: emailNotifications,
          onChange: (checked: boolean) => {
            audioEngine.playTactileClick();
            setEmailNotifications(checked);
          },
        },
      ],
    },
    {
      title: "OPERATOR PREFERENCES",
      icon: Globe,
      settings: [
        {
          id: "sound-effects",
          label: "Acoustic Haptics",
          description: "40Hz synthetic sub-sine clicks and resonance feedback",
          checked: soundEffects,
          onChange: (checked: boolean) => {
            audioEngine.playTactileClick();
            setSoundEffects(checked);
          },
        },
        {
          id: "low-stimulation",
          label: "Low-Stimulation Mode (Sensory Accommodation)",
          description: "Mutes emergency klaxons, suppresses particle storms, and disables vibration for sensory ease",
          checked: lowStimulation,
          onChange: (checked: boolean) => {
            audioEngine.playTactileClick();
            setLowStimulation(checked);
            localStorage.setItem("ascension_low_stim", String(checked));
            if (checked) {
              document.documentElement.classList.add("low-stim");
            } else {
              document.documentElement.classList.remove("low-stim");
            }
          },
        },
        {
          id: "dark-mode",
          label: "Obsidian Surface Ladder",
          description: "High-contrast APCA dark architecture (mandatory)",
          checked: darkMode,
          onChange: (checked: boolean) => {
            audioEngine.playTactileClick();
            setDarkMode(checked);
          },
        },
      ],
    },
    {
      title: "TRANSPARENCY & PRIVACY",
      icon: Shield,
      settings: [
        {
          id: "public-profile",
          label: "Public Veracity Record",
          description: "Expose verified discipline score to community witness network",
          checked: publicProfile,
          onChange: (checked: boolean) => {
            audioEngine.playTactileClick();
            setPublicProfile(checked);
          },
        },
        {
          id: "show-activity",
          label: "Telemetry Mesh Broadcast",
          description: "Stream live focus sessions into active operator mesh",
          checked: showActivity,
          onChange: (checked: boolean) => {
            audioEngine.playTactileClick();
            setShowActivity(checked);
          },
        },
      ],
    },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[560px] bg-[#0E1218] border border-white/10 text-white rounded-xl shadow-2xl backdrop-blur-2xl max-h-[85vh] overflow-y-auto font-sans p-6">
        <DialogHeader className="pb-3 border-b border-white/5">
          <DialogTitle className="text-base font-bold font-mono tracking-tight text-white uppercase flex items-center gap-2">
            <Shield className="w-4 h-4 text-cyan-400" />
            SYSTEM CALIBRATION // PREFERENCES
          </DialogTitle>
          <DialogDescription className="text-xs text-zinc-400 font-sans">
            Calibrate alert thresholds, acoustic feedback, and peer ledger visibility.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 mt-4">
          {settingsSections.map((section, sectionIndex) => (
            <motion.div
              key={section.title}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: sectionIndex * 0.08 }}
              className="space-y-3"
            >
              <div className="flex items-center gap-2">
                <section.icon className="h-3.5 w-3.5 text-cyan-400" />
                <h3 className="text-xs font-mono font-bold tracking-wider uppercase text-zinc-300">{section.title}</h3>
              </div>

              <div className="space-y-2">
                {section.settings.map((setting) => (
                  <div
                    key={setting.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-[#07080B] border border-white/5 hover:border-white/15 transition-all"
                  >
                    <div className="space-y-0.5 flex-1 pr-3">
                      <Label htmlFor={setting.id} className="text-xs font-semibold text-white cursor-pointer block">
                        {setting.label}
                      </Label>
                      <p className="text-[11px] text-zinc-400 font-normal">
                        {setting.description}
                      </p>
                    </div>
                    <Switch
                      id={setting.id}
                      checked={setting.checked}
                      onCheckedChange={setting.onChange}
                      className="data-[state=checked]:bg-cyan-500 shrink-0"
                    />
                  </div>
                ))}

                {section.title === "TELEMETRY & ALERTS" && (
                  <div className="pt-1">
                    <PushEnforcerCard compact={true} />
                  </div>
                )}
              </div>

              {sectionIndex < settingsSections.length - 1 && (
                <Separator className="my-4 bg-white/5" />
              )}
            </motion.div>
          ))}

          <Separator className="my-4 bg-white/5" />

          {/* Security Section */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Lock className="h-3.5 w-3.5 text-amber-400" />
              <h3 className="text-xs font-mono font-bold tracking-wider uppercase text-zinc-300">AUTHENTICATION</h3>
            </div>

            <div className="space-y-2">
              {!showPasswordChange ? (
                <Button
                  variant="outline"
                  className="w-full justify-start border-white/10 bg-[#07080B] hover:bg-[#141922] text-xs font-mono text-zinc-300 h-9 rounded"
                  onClick={() => {
                    audioEngine.playTactileClick();
                    setShowPasswordChange(true);
                  }}
                >
                  UPDATE CREDENTIALS
                </Button>
              ) : (
                <div className="space-y-2.5 p-3.5 rounded-lg bg-[#07080B] border border-white/10">
                  <div className="space-y-1">
                    <Label className="text-[11px] font-mono text-zinc-400 uppercase">CURRENT KEY</Label>
                    <Input
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="bg-[#0E1218] border-white/10 text-xs h-8 font-mono text-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[11px] font-mono text-zinc-400 uppercase">NEW KEY</Label>
                    <Input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="bg-[#0E1218] border-white/10 text-xs h-8 font-mono text-white"
                    />
                  </div>
                  <div className="flex gap-2 pt-1">
                    <Button
                      size="sm"
                      onClick={handleChangePassword}
                      className="bg-cyan-400 hover:bg-cyan-300 text-black font-mono font-bold text-xs uppercase tracking-wider h-7 px-3 rounded shadow-sm"
                    >
                      COMMIT
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        audioEngine.playTactileClick();
                        setShowPasswordChange(false);
                      }}
                      className="text-xs font-mono text-zinc-400 hover:text-white h-7 px-3"
                    >
                      CANCEL
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>

          <Separator className="my-4 bg-white/5" />

          {/* Danger Zone */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Shield className="h-3.5 w-3.5 text-red-500" />
              <h3 className="text-xs font-mono font-bold tracking-wider uppercase text-red-400">SESSION TERMINATION</h3>
            </div>

            <div className="space-y-2">
              <Button
                variant="outline"
                className="w-full justify-start border-red-500/20 bg-[#07080B] hover:bg-red-500/10 hover:text-red-400 text-zinc-300 font-mono text-xs h-9 rounded"
                onClick={handleLogout}
              >
                <LogOut className="mr-2 h-3.5 w-3.5" />
                TERMINATE CURRENT SESSION
              </Button>

              <Button
                variant="outline"
                className="w-full justify-start border-red-500/20 bg-[#07080B] hover:bg-red-500/10 hover:text-red-400 text-zinc-400 font-mono text-xs h-9 rounded"
                onClick={handleDeleteAccount}
              >
                <Trash2 className="mr-2 h-3.5 w-3.5" />
                PURGE OPERATOR PROFILE
              </Button>
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-4 border-t border-white/5 mt-4">
          <Button
            onClick={() => {
              audioEngine.playTactileClick();
              onOpenChange(false);
            }}
            className="bg-zinc-100 hover:bg-white text-black font-mono font-bold text-xs uppercase tracking-wider h-8 px-4 rounded shadow-sm"
          >
            DISMISS
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
