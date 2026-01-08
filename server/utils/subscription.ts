
import { User } from "@shared/schema";

export function getSubscriptionStatus(user: User | null | undefined) {
    if (!user) {
        return {
            isPremium: false,
            isTrial: false,
            trialEndsAt: new Date(),
        };
    }

    // Trial duration: 48 hours
    const TRIAL_DURATION_MS = 48 * 60 * 60 * 1000;
    const createdAt = new Date(user.createdAt);
    const trialEndsAt = new Date(createdAt.getTime() + TRIAL_DURATION_MS);
    const now = new Date();

    const isTrial = now < trialEndsAt;

    // Effective premium status: Either explicitly premium OR currently in trial
    const isPremium = user.isPremium || isTrial;

    return {
        isPremium,
        isTrial,
        trialEndsAt,
    };
}
