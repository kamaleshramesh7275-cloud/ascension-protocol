import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Shield, Zap, Coins, Flame, Award, ArrowRight } from "lucide-react";

export interface ProfilePreview {
  id: string;
  name: string;
  level: number;
  xp: number;
  coins: number;
  tier: string;
  streak: number;
  isGuest?: boolean;
  email?: string;
}

interface AccountMergeModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentProfile: ProfilePreview | null;
  googleProfile: ProfilePreview | null;
  onSelectChoice: (choice: "current" | "google") => Promise<void>;
  isResolving: boolean;
}

export function AccountMergeModal({
  isOpen,
  onClose,
  currentProfile,
  googleProfile,
  onSelectChoice,
  isResolving,
}: AccountMergeModalProps) {
  if (!currentProfile || !googleProfile) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !isResolving && !open && onClose()}>
      <DialogContent className="max-w-2xl bg-zinc-950 border-zinc-800 text-white p-6 backdrop-blur-2xl">
        <DialogHeader className="text-center pb-2">
          <div className="mx-auto mb-3 w-12 h-12 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
            <Shield className="w-6 h-6" />
          </div>
          <DialogTitle className="text-2xl font-bold tracking-tight font-mono text-white">
            Account Collision Detected
          </DialogTitle>
          <DialogDescription className="text-zinc-400 text-xs sm:text-sm font-mono max-w-md mx-auto">
            This Google account is already linked to another hunter profile. Choose which profile you want to keep as your primary identity.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-4 font-mono">
          {/* Current Profile Card */}
          <Card className="bg-zinc-900/80 border-purple-500/40 relative overflow-hidden flex flex-col justify-between">
            <div className="absolute top-0 left-0 right-0 h-1 bg-purple-500" />
            <CardContent className="p-5 space-y-4">
              <div>
                <span className="text-[10px] tracking-widest uppercase text-purple-400 font-bold px-2 py-0.5 rounded bg-purple-500/10 border border-purple-500/20">
                  {currentProfile.isGuest ? "Active Guest Session" : "Current Local Profile"}
                </span>
                <h3 className="text-xl font-bold text-white mt-2 truncate">{currentProfile.name}</h3>
                <p className="text-xs text-zinc-500">Tier {currentProfile.tier || "D"} Operative</p>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                <div className="flex items-center gap-2 p-2 rounded bg-black/40 border border-zinc-800">
                  <Award className="w-4 h-4 text-purple-400" />
                  <div>
                    <span className="text-zinc-500 text-[10px] block">LEVEL</span>
                    <span className="font-bold text-white">{currentProfile.level}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 p-2 rounded bg-black/40 border border-zinc-800">
                  <Zap className="w-4 h-4 text-cyan-400" />
                  <div>
                    <span className="text-zinc-500 text-[10px] block">TOTAL XP</span>
                    <span className="font-bold text-white">{currentProfile.xp}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 p-2 rounded bg-black/40 border border-zinc-800">
                  <Coins className="w-4 h-4 text-amber-400" />
                  <div>
                    <span className="text-zinc-500 text-[10px] block">COINS</span>
                    <span className="font-bold text-white">{currentProfile.coins}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 p-2 rounded bg-black/40 border border-zinc-800">
                  <Flame className="w-4 h-4 text-red-400" />
                  <div>
                    <span className="text-zinc-500 text-[10px] block">STREAK</span>
                    <span className="font-bold text-white">{currentProfile.streak}d</span>
                  </div>
                </div>
              </div>

              <div className="text-[11px] text-purple-300/80 bg-purple-950/20 border border-purple-900/40 p-2.5 rounded-lg leading-relaxed">
                ✓ Preserves current quest progress, equips, and merges all coins together.
              </div>

              <Button
                type="button"
                onClick={() => onSelectChoice("current")}
                disabled={isResolving}
                className="w-full bg-purple-600 hover:bg-purple-500 text-white font-mono text-xs font-bold h-10 shadow-lg"
              >
                Keep Current Profile
                <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
              </Button>
            </CardContent>
          </Card>

          {/* Existing Google Profile Card */}
          <Card className="bg-zinc-900/80 border-blue-500/40 relative overflow-hidden flex flex-col justify-between">
            <div className="absolute top-0 left-0 right-0 h-1 bg-blue-500" />
            <CardContent className="p-5 space-y-4">
              <div>
                <span className="text-[10px] tracking-widest uppercase text-blue-400 font-bold px-2 py-0.5 rounded bg-blue-500/10 border border-blue-500/20">
                  Existing Google Account
                </span>
                <h3 className="text-xl font-bold text-white mt-2 truncate">{googleProfile.name}</h3>
                <p className="text-xs text-zinc-500 truncate">{googleProfile.email || `Tier ${googleProfile.tier || "D"}`}</p>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                <div className="flex items-center gap-2 p-2 rounded bg-black/40 border border-zinc-800">
                  <Award className="w-4 h-4 text-blue-400" />
                  <div>
                    <span className="text-zinc-500 text-[10px] block">LEVEL</span>
                    <span className="font-bold text-white">{googleProfile.level}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 p-2 rounded bg-black/40 border border-zinc-800">
                  <Zap className="w-4 h-4 text-cyan-400" />
                  <div>
                    <span className="text-zinc-500 text-[10px] block">TOTAL XP</span>
                    <span className="font-bold text-white">{googleProfile.xp}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 p-2 rounded bg-black/40 border border-zinc-800">
                  <Coins className="w-4 h-4 text-amber-400" />
                  <div>
                    <span className="text-zinc-500 text-[10px] block">COINS</span>
                    <span className="font-bold text-white">{googleProfile.coins}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 p-2 rounded bg-black/40 border border-zinc-800">
                  <Flame className="w-4 h-4 text-red-400" />
                  <div>
                    <span className="text-zinc-500 text-[10px] block">STREAK</span>
                    <span className="font-bold text-white">{googleProfile.streak}d</span>
                  </div>
                </div>
              </div>

              <div className="text-[11px] text-blue-300/80 bg-blue-950/20 border border-blue-900/40 p-2.5 rounded-lg leading-relaxed">
                ✓ Loads your pre-existing Google cloud save state, rank, and quest logs.
              </div>

              <Button
                type="button"
                variant="outline"
                onClick={() => onSelectChoice("google")}
                disabled={isResolving}
                className="w-full border-blue-500/50 hover:bg-blue-950/50 text-blue-300 font-mono text-xs font-bold h-10"
              >
                Switch to Google Profile
                <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="text-center pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isResolving}
            className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors font-mono"
          >
            Cancel and keep separate
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

