import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { User as BackendUser } from "@shared/schema";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/use-auth";
import { motion } from "framer-motion";
import { Loader2, Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const profileSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Invalid email address"),
    avatarUrl: z.string().url("Invalid URL").optional().or(z.literal("")),
    bio: z.string().max(500, "Bio must be less than 500 characters").optional(),
    currentPassword: z.string().optional(),
    newPassword: z.string().min(8, "Password must be at least 8 characters").optional().or(z.literal("")),
});

type ProfileFormData = z.infer<typeof profileSchema>;

interface EditProfileDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    user: BackendUser;
}

export function EditProfileDialog({ open, onOpenChange, user }: EditProfileDialogProps) {
    const { user: firebaseUser } = useAuth();
    const queryClient = useQueryClient();
    const { toast } = useToast();

    const form = useForm<ProfileFormData>({
        resolver: zodResolver(profileSchema),
        defaultValues: {
            name: user.name,
            email: user.email || "",
            avatarUrl: user.avatarUrl || "",
            bio: "",
        },
    });

    const mutation = useMutation({
        mutationFn: async (data: ProfileFormData) => {
            if (!firebaseUser) throw new Error("Not authenticated");

            // If updating password or username (name), use update-credentials
            if (data.newPassword || data.name !== user.name) {
                const res = await fetch("/api/auth/update-credentials", {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        userId: user.id,
                        newUsername: data.name,
                        newPassword: data.newPassword || undefined,
                        currentPassword: data.currentPassword
                    }),
                });
                if (!res.ok) {
                    const err = await res.json();
                    throw new Error(err.error || "Failed to update credentials");
                }

                // Update local storage if username changed
                if (data.name !== user.name) {
                    localStorage.setItem("username", data.name);
                }
            }

            const res = await fetch("/api/user", {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    "x-firebase-uid": firebaseUser.uid,
                },
                body: JSON.stringify({
                    email: data.email,
                    avatarUrl: data.avatarUrl,
                    bio: data.bio
                }),
            });

            if (!res.ok) throw new Error("Failed to update profile");
            return res.json();
        },
        onSuccess: (data) => {
            queryClient.setQueryData(["/api/user"], data);
            toast({
                title: "Profile Updated",
                description: "Your profile has been successfully updated.",
            });
            onOpenChange(false);
        },
        onError: (error) => {
            toast({
                title: "Update Failed",
                description: error instanceof Error ? error.message : "Failed to update profile",
                variant: "destructive",
            });
        },
    });

    const onSubmit = (data: ProfileFormData) => {
        mutation.mutate(data);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px] bg-black/95 border-emerald-500/20 backdrop-blur-xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-emerald-400 to-green-600 bg-clip-text text-transparent">
                        Edit Profile
                    </DialogTitle>
                    <DialogDescription>
                        Update your profile information and credentials.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 mt-4">
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="space-y-2"
                    >
                        <Label htmlFor="name">Name</Label>
                        <Input
                            id="name"
                            {...form.register("name")}
                            className="bg-white/5 border-white/10 focus:border-emerald-500/50"
                        />
                        {form.formState.errors.name && (
                            <p className="text-sm text-red-500">{form.formState.errors.name.message}</p>
                        )}
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="space-y-2"
                    >
                        <Label htmlFor="email">Email</Label>
                        <Input
                            id="email"
                            type="email"
                            {...form.register("email")}
                            className="bg-white/5 border-white/10 focus:border-emerald-500/50"
                        />
                        {form.formState.errors.email && (
                            <p className="text-sm text-red-500">{form.formState.errors.email.message}</p>
                        )}
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="space-y-2"
                    >
                        <Label htmlFor="avatarUrl">Avatar URL</Label>
                        <div className="flex gap-2">
                            <Input
                                id="avatarUrl"
                                {...form.register("avatarUrl")}
                                placeholder="https://example.com/avatar.jpg"
                                className="bg-white/5 border-white/10 focus:border-emerald-500/50"
                            />
                            <Button type="button" variant="outline" size="icon" className="shrink-0">
                                <Upload className="h-4 w-4" />
                            </Button>
                        </div>
                        {form.formState.errors.avatarUrl && (
                            <p className="text-sm text-red-500">{form.formState.errors.avatarUrl.message}</p>
                        )}
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        className="space-y-2"
                    >
                        <Label htmlFor="bio">Bio (Optional)</Label>
                        <Textarea
                            id="bio"
                            {...form.register("bio")}
                            placeholder="Tell us about yourself..."
                            className="bg-white/5 border-white/10 focus:border-emerald-500/50 min-h-[100px]"
                        />
                        {form.formState.errors.bio && (
                            <p className="text-sm text-red-500">{form.formState.errors.bio.message}</p>
                        )}
                    </motion.div>

                    <div className="border-t border-white/10 pt-4">
                        <h3 className="text-lg font-semibold mb-4">Security</h3>
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.5 }}
                            className="space-y-4"
                        >
                            <div className="space-y-2">
                                <Label htmlFor="currentPassword">Current Password (Required to change)</Label>
                                <Input
                                    id="currentPassword"
                                    type="password"
                                    {...form.register("currentPassword")}
                                    className="bg-white/5 border-white/10 focus:border-emerald-500/50"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="newPassword">New Password (Optional)</Label>
                                <Input
                                    id="newPassword"
                                    type="password"
                                    {...form.register("newPassword")}
                                    className="bg-white/5 border-white/10 focus:border-emerald-500/50"
                                />
                                {form.formState.errors.newPassword && (
                                    <p className="text-sm text-red-500">{form.formState.errors.newPassword.message}</p>
                                )}
                            </div>
                        </motion.div>
                    </div>

                    <div className="flex gap-3 pt-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            className="flex-1"
                            disabled={mutation.isPending}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            className="flex-1 bg-gradient-to-r from-emerald-500 to-green-600 hover:opacity-90"
                            disabled={mutation.isPending}
                        >
                            {mutation.isPending ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                "Save Changes"
                            )}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
