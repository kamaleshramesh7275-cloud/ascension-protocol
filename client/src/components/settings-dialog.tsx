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
    Lock
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";

interface SettingsDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function SettingsDialog({ open, onOpenChange }: SettingsDialogProps) {
    const { signOut } = useAuth();
    const { toast } = useToast();

    // Settings state
    const [notifications, setNotifications] = useState(true);
    const [emailNotifications, setEmailNotifications] = useState(true);
    const [soundEffects, setSoundEffects] = useState(true);
    const [darkMode, setDarkMode] = useState(true);
    const [publicProfile, setPublicProfile] = useState(true);
    const [showActivity, setShowActivity] = useState(true);

    // Password Change State
    const [showPasswordChange, setShowPasswordChange] = useState(false);
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");

    const handleChangePassword = () => {
        if (!currentPassword || !newPassword) {
            toast({ title: "Error", description: "Please fill in all fields", variant: "destructive" });
            return;
        }
        // Mock password change
        toast({ title: "Password Updated", description: "Your password has been changed successfully." });
        setShowPasswordChange(false);
        setCurrentPassword("");
        setNewPassword("");
    };

    const handleLogout = async () => {
        try {
            await signOut();
            toast({
                title: "Logged Out",
                description: "You have been successfully logged out.",
            });
            onOpenChange(false);
        } catch (error) {
            toast({
                title: "Logout Failed",
                description: "Failed to log out. Please try again.",
                variant: "destructive",
            });
        }
    };

    const handleDeleteAccount = () => {
        if (confirm("Are you sure you want to delete your account? This action cannot be undone.")) {
            toast({
                title: "Account Deletion",
                description: "Account deletion feature coming soon.",
            });
        }
    };

    const settingsSections = [
        {
            title: "Notifications",
            icon: Bell,
            settings: [
                {
                    id: "push-notifications",
                    label: "Push Notifications",
                    description: "Receive notifications about your progress",
                    checked: notifications,
                    onChange: setNotifications,
                },
                {
                    id: "email-notifications",
                    label: "Email Notifications",
                    description: "Receive email updates and newsletters",
                    checked: emailNotifications,
                    onChange: setEmailNotifications,
                },
            ],
        },
        {
            title: "Preferences",
            icon: Globe,
            settings: [
                {
                    id: "sound-effects",
                    label: "Sound Effects",
                    description: "Play sounds for achievements and milestones",
                    checked: soundEffects,
                    onChange: setSoundEffects,
                },
                {
                    id: "dark-mode",
                    label: "Dark Mode",
                    description: "Use dark theme (currently active)",
                    checked: darkMode,
                    onChange: setDarkMode,
                },
            ],
        },
        {
            title: "Privacy",
            icon: Shield,
            settings: [
                {
                    id: "public-profile",
                    label: "Public Profile",
                    description: "Make your profile visible to other users",
                    checked: publicProfile,
                    onChange: setPublicProfile,
                },
                {
                    id: "show-activity",
                    label: "Show Activity",
                    description: "Display your recent activity on your profile",
                    checked: showActivity,
                    onChange: setShowActivity,
                },
            ],
        },
    ];

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px] bg-black/95 border-emerald-500/20 backdrop-blur-xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-emerald-400 to-green-600 bg-clip-text text-transparent">
                        Settings
                    </DialogTitle>
                    <DialogDescription>
                        Manage your account settings and preferences.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 mt-4">
                    {settingsSections.map((section, sectionIndex) => (
                        <motion.div
                            key={section.title}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: sectionIndex * 0.1 }}
                        >
                            <div className="flex items-center gap-2 mb-4">
                                <section.icon className="h-5 w-5 text-emerald-500" />
                                <h3 className="text-lg font-semibold">{section.title}</h3>
                            </div>

                            <div className="space-y-4 pl-7">
                                {section.settings.map((setting) => (
                                    <div
                                        key={setting.id}
                                        className="flex items-center justify-between p-4 rounded-lg bg-white/5 border border-white/10 hover:border-emerald-500/30 transition-colors"
                                    >
                                        <div className="space-y-0.5 flex-1">
                                            <Label htmlFor={setting.id} className="text-base cursor-pointer">
                                                {setting.label}
                                            </Label>
                                            <p className="text-sm text-muted-foreground">
                                                {setting.description}
                                            </p>
                                        </div>
                                        <Switch
                                            id={setting.id}
                                            checked={setting.checked}
                                            onCheckedChange={setting.onChange}
                                            className="data-[state=checked]:bg-emerald-500"
                                        />
                                    </div>
                                ))}
                            </div>

                            {sectionIndex < settingsSections.length - 1 && (
                                <Separator className="my-6 bg-white/10" />
                            )}
                        </motion.div>
                    ))}

                    <Separator className="my-6 bg-white/10" />

                    <Separator className="my-6 bg-white/10" />

                    {/* Security Section */}
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                    >
                        <div className="flex items-center gap-2 mb-4">
                            <Lock className="h-5 w-5 text-emerald-500" />
                            <h3 className="text-lg font-semibold">Security</h3>
                        </div>

                        <div className="space-y-4 pl-7">
                            {!showPasswordChange ? (
                                <Button
                                    variant="outline"
                                    className="w-full justify-start border-white/10 hover:bg-white/5"
                                    onClick={() => setShowPasswordChange(true)}
                                >
                                    Change Password
                                </Button>
                            ) : (
                                <div className="space-y-3 p-4 rounded-lg bg-white/5 border border-white/10">
                                    <div className="space-y-2">
                                        <Label>Current Password</Label>
                                        <Input
                                            type="password"
                                            value={currentPassword}
                                            onChange={(e) => setCurrentPassword(e.target.value)}
                                            className="bg-black/50 border-white/10"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>New Password</Label>
                                        <Input
                                            type="password"
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                            className="bg-black/50 border-white/10"
                                        />
                                    </div>
                                    <div className="flex gap-2 pt-2">
                                        <Button size="sm" onClick={handleChangePassword} className="bg-emerald-600 hover:bg-emerald-700">
                                            Update
                                        </Button>
                                        <Button size="sm" variant="ghost" onClick={() => setShowPasswordChange(false)}>
                                            Cancel
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </motion.div>

                    <Separator className="my-6 bg-white/10" />

                    {/* Danger Zone */}
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        className="space-y-4"
                    >
                        <div className="flex items-center gap-2 mb-4">
                            <Shield className="h-5 w-5 text-red-500" />
                            <h3 className="text-lg font-semibold text-red-500">Danger Zone</h3>
                        </div>

                        <div className="space-y-3 pl-7">
                            <Button
                                variant="outline"
                                className="w-full justify-start border-red-500/20 hover:bg-red-500/10 hover:text-red-500 hover:border-red-500/50"
                                onClick={handleLogout}
                            >
                                <LogOut className="mr-2 h-4 w-4" />
                                Log Out
                            </Button>

                            <Button
                                variant="outline"
                                className="w-full justify-start border-red-500/20 hover:bg-red-500/10 hover:text-red-500 hover:border-red-500/50"
                                onClick={handleDeleteAccount}
                            >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete Account
                            </Button>
                        </div>
                    </motion.div>
                </div>

                <div className="flex justify-end pt-4">
                    <Button
                        onClick={() => onOpenChange(false)}
                        className="bg-gradient-to-r from-emerald-500 to-green-600 hover:opacity-90"
                    >
                        Done
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
