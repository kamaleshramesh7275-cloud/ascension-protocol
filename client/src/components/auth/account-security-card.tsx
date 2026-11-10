import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { signInWithGoogle, formatFirebaseAuthError } from "@/lib/firebase";
import { Shield, Check, Lock, Key, ArrowRight, RefreshCw } from "lucide-react";
import { AccountMergeModal, ProfilePreview } from "./account-merge-modal";

export function AccountSecurityCard() {
  const { user, refreshUser } = useAuth();
  const { toast } = useToast();

  const [isLinkingGoogle, setIsLinkingGoogle] = useState(false);
  const [conflictModalOpen, setConflictModalOpen] = useState(false);
  const [currentProfileData, setCurrentProfileData] = useState<ProfilePreview | null>(null);
  const [googleProfileData, setGoogleProfileData] = useState<ProfilePreview | null>(null);
  const [pendingGoogleUid, setPendingGoogleUid] = useState<string | null>(null);
  const [pendingEmail, setPendingEmail] = useState<string | null>(null);
  const [isResolvingChoice, setIsResolvingChoice] = useState(false);

  // Set Password Form State
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [newUsername, setNewUsername] = useState(user?.displayName || "");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSavingPassword, setIsSavingPassword] = useState(false);

  const isGoogleLinked = user?.uid && !user.uid.startsWith("guest_") && !user.uid.startsWith("local_");
  const isGuest = user?.uid?.startsWith("guest_");

  const handleLinkGoogle = async () => {
    try {
      setIsLinkingGoogle(true);
      const authResult = await signInWithGoogle();
      if (!authResult) return; // redirect initiated

      const googleUser = authResult.user;
      setPendingGoogleUid(googleUser.uid);
      setPendingEmail(googleUser.email);

      const res = await fetch("/api/auth/link-google", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-firebase-uid": user?.uid || "",
        },
        body: JSON.stringify({
          googleFirebaseUid: googleUser.uid,
          email: googleUser.email,
          displayName: googleUser.displayName,
          photoUrl: googleUser.photoURL,
        }),
      });

      if (res.status === 409) {
        // Conflict detected!
        const conflictData = await res.json();
        setCurrentProfileData(conflictData.currentProfile);
        setGoogleProfileData(conflictData.googleProfile);
        setConflictModalOpen(true);
        return;
      }

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to link Google account");
      }

      toast({
        title: "Account Linked Successfully",
        description: `Your profile is now secured with Google (${googleUser.email}).`,
      });

      await refreshUser();
    } catch (error: any) {
      console.error("Link Google error:", error);
      const { title, description } = formatFirebaseAuthError(error);
      toast({ title, description, variant: "destructive" });
    } finally {
      setIsLinkingGoogle(false);
    }
  };

  const handleResolveConflictChoice = async (choice: "current" | "google") => {
    if (!pendingGoogleUid) return;

    try {
      setIsResolvingChoice(true);
      const res = await fetch("/api/auth/link-google", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-firebase-uid": user?.uid || "",
        },
        body: JSON.stringify({
          googleFirebaseUid: pendingGoogleUid,
          email: pendingEmail,
          resolveChoice: choice,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to resolve conflict");
      }

      const data = await res.json();
      toast({
        title: "Resolution Complete",
        description: data.message || "Account profile updated successfully.",
      });

      setConflictModalOpen(false);
      await refreshUser();
    } catch (error: any) {
      console.error("Conflict resolution error:", error);
      toast({
        title: "Merge Resolution Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsResolvingChoice(false);
    }
  };

  const handleSetPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newUsername || newUsername.length < 3) {
      toast({ title: "Username must be at least 3 characters", variant: "destructive" });
      return;
    }
    if (!newPassword || newPassword.length < 8) {
      toast({ title: "Password must be at least 8 characters", variant: "destructive" });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast({ title: "Passwords do not match", variant: "destructive" });
      return;
    }

    try {
      setIsSavingPassword(true);
      const res = await fetch("/api/auth/set-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-firebase-uid": user?.uid || "",
        },
        body: JSON.stringify({
          username: newUsername,
          password: newPassword,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to set password");
      }

      toast({
        title: "Credentials Created",
        description: `You can now sign in using username "${newUsername}" anywhere, including in-app browsers.`,
      });

      setShowPasswordForm(false);
      setNewPassword("");
      setConfirmPassword("");
      await refreshUser();
    } catch (error: any) {
      console.error("Set password error:", error);
      toast({
        title: "Failed to set credentials",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSavingPassword(false);
    }
  };

  return (
    <>
      <Card className="border-cyan-500/30 bg-gradient-to-br from-cyan-950/20 via-black to-slate-950 backdrop-blur-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
          <Shield className="h-32 w-32 text-cyan-400" />
        </div>

        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <CardTitle className="text-xl font-bold font-mono text-white">
                Account Security & Cloud Identity
              </CardTitle>
              <CardDescription className="text-xs text-zinc-400 font-mono">
                Manage your cross-device login vectors and cloud save syncing
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Identity Vector Row 1: Google SSO */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 rounded-xl bg-black/40 border border-zinc-800 gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-semibold text-sm text-white font-mono">Google Single Sign-On</h4>
                  {isGoogleLinked && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full font-mono">
                      <Check className="w-3 h-3" /> LINKED
                    </span>
                  )}
                  {isGuest && (
                    <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full font-mono">
                      GUEST MODE
                    </span>
                  )}
                </div>
                <p className="text-xs text-zinc-400 font-mono mt-0.5">
                  {isGoogleLinked
                    ? `Bound to ${user?.email || "Google Identity"}`
                    : "Link your Google account to secure your stats and cloud save."}
                </p>
              </div>
            </div>

            <Button
              type="button"
              variant={isGoogleLinked ? "outline" : "default"}
              size="sm"
              onClick={handleLinkGoogle}
              disabled={isLinkingGoogle}
              className={`font-mono text-xs font-bold ${
                isGoogleLinked
                  ? "border-zinc-700 hover:bg-zinc-800 text-zinc-300"
                  : "bg-cyan-500 hover:bg-cyan-400 text-black shadow-lg shadow-cyan-500/20"
              }`}
            >
              {isLinkingGoogle ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 mr-1.5 animate-spin" /> Linking...
                </>
              ) : isGoogleLinked ? (
                "Re-sync Google"
              ) : (
                <>
                  Link Google <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                </>
              )}
            </Button>
          </div>

          {/* Identity Vector Row 2: Local Username & Password */}
          <div className="p-4 rounded-xl bg-black/40 border border-zinc-800 space-y-3">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0">
                  <Key className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <h4 className="font-semibold text-sm text-white font-mono">
                    Fallback Username & Password
                  </h4>
                  <p className="text-xs text-zinc-400 font-mono mt-0.5">
                    Essential for in-app browsers (Instagram, Discord) or offline environments.
                  </p>
                </div>
              </div>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowPasswordForm(!showPasswordForm)}
                className="border-zinc-700 hover:bg-zinc-800 text-zinc-300 font-mono text-xs"
              >
                {showPasswordForm ? "Hide Form" : "Set Credentials"}
              </Button>
            </div>

            {showPasswordForm && (
              <form onSubmit={handleSetPassword} className="pt-3 border-t border-zinc-800/80 space-y-3 font-mono">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <Label className="text-xs text-zinc-400">Username</Label>
                    <Input
                      value={newUsername}
                      onChange={(e) => setNewUsername(e.target.value)}
                      className="bg-black/60 border-zinc-700 h-9 text-xs mt-1"
                      placeholder="Hunter username"
                      required
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-zinc-400">New Password</Label>
                    <Input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="bg-black/60 border-zinc-700 h-9 text-xs mt-1"
                      placeholder="Min 8 characters"
                      required
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-zinc-400">Confirm Password</Label>
                    <Input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="bg-black/60 border-zinc-700 h-9 text-xs mt-1"
                      placeholder="Repeat password"
                      required
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-1">
                  <Button
                    type="submit"
                    size="sm"
                    disabled={isSavingPassword}
                    className="bg-purple-600 hover:bg-purple-500 text-white font-mono text-xs font-bold h-8"
                  >
                    {isSavingPassword ? "Saving..." : "Save Credentials"}
                  </Button>
                </div>
              </form>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Account Merge Modal (Option 2: Prompt user with choice) */}
      <AccountMergeModal
        isOpen={conflictModalOpen}
        onClose={() => setConflictModalOpen(false)}
        currentProfile={currentProfileData}
        googleProfile={googleProfileData}
        onSelectChoice={handleResolveConflictChoice}
        isResolving={isResolvingChoice}
      />
    </>
  );
}
