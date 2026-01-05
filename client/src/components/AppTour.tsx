import Joyride, { Step, CallBackProps, STATUS } from 'react-joyride';
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { User } from '@shared/schema';
import { apiRequest } from '@/lib/queryClient';

const steps: Step[] = [
    {
        target: 'body',
        placement: 'center',
        title: 'Welcome to Ascension Protocol! 🚀',
        content: "I'll take you on a quick tour of your new base of operations. Let's get started!",
    },
    {
        target: '[data-tour="sidebar-dashboard"]',
        content: 'Your Dashboard is where you can see your overview, progress, and daily goals.',
        title: 'Command Center',
    },
    {
        target: '[data-tour="streak-value"]',
        content: 'Keep your streak alive by logging in and completing tasks every day!',
        title: 'Daily Consistency',
    },
    {
        target: '[data-tour="rank-badge"]',
        content: 'Earn XP to rank up from Iron to legendary tiers.',
        title: 'Your Rank',
    },
    {
        target: '[data-tour="active-quests"]',
        content: 'Complete these daily and weekly quests to earn XP and Coins.',
        title: 'Quests',
    },
    {
        target: '[data-tour="sidebar-focus-sanctum"]',
        content: 'Enter the Focus Sanctum for deep work sessions. Your Focus Pet will grow as you work!',
        title: 'Deep Work',
    },
    {
        target: '[data-tour="focus-pet"]',
        content: 'Hover over your pet to see stats. Click or use the tooltip button to feed it with coins!',
        title: 'Your Focus Companion',
    },
    {
        target: '[data-tour="sidebar-roadmap"]',
        content: 'The 30-Day Protocol is a structured path to mastery. Premium members get full access.',
        title: 'The Path to Ascension',
    },
    {
        target: '[data-tour="sidebar-partners"]',
        content: 'Find study partners and build your network for mutual accountability.',
        title: 'Allies',
    },
    {
        target: '[data-tour="sidebar-global-chat"]',
        content: 'Connect with the entire Ascension community in real-time.',
        title: 'Global Comms',
    },
    {
        target: '[data-tour="sidebar-store"]',
        content: 'Spend your hard-earned coins on titles, badges, and custom themes!',
        title: 'The Armory',
    },
    {
        target: '[data-tour="sidebar-profile"]',
        content: 'You can replay this tutorial anytime from your profile settings.',
        title: 'Finishing Up',
    }
];

import { useSidebar } from '@/components/ui/sidebar';

export function AppTour() {
    const { user: authUser } = useAuth();
    const queryClient = useQueryClient();
    const { setOpen, setOpenMobile, isMobile, open, openMobile } = useSidebar();
    const [run, setRun] = useState(false);
    const [stepIndex, setStepIndex] = useState(0);
    const [tourKey, setTourKey] = useState(0);

    const { data: user } = useQuery<User>({
        queryKey: ["/api/user"],
        enabled: !!authUser,
    });

    const markSeenMutation = useMutation({
        mutationFn: async () => {
            await apiRequest("PATCH", "/api/user/tutorial");
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/user"] });
        }
    });

    useEffect(() => {
        if (user && !user.hasSeenTutorial) {
            setRun(true);
        }

        const handleStartTour = () => {
            setStepIndex(0);
            setTourKey(prev => prev + 1);
            setRun(true);
        };
        window.addEventListener('start-app-tour', handleStartTour);
        return () => window.removeEventListener('start-app-tour', handleStartTour);
    }, [user]);

    const handleJoyrideCallback = (data: CallBackProps) => {
        const { status, index, type, action } = data;
        const finishedStatuses: string[] = [STATUS.FINISHED, STATUS.SKIPPED];

        if (type === 'step:before') {
            const currentStep = steps[index];
            if (currentStep && typeof currentStep.target === 'string' && currentStep.target.includes('sidebar')) {
                // Ensure sidebar is open for sidebar steps
                if (isMobile) {
                    if (!openMobile) setOpenMobile(true);
                } else {
                    if (!open) setOpen(true);
                }
            }
        }

        if (finishedStatuses.includes(status)) {
            setRun(false);
            if (!user?.hasSeenTutorial) {
                markSeenMutation.mutate();
            }
        } else if (type === 'step:after' || type === 'error:target_not_found') {
            setStepIndex(index + (action === 'next' ? 1 : -1));
        }
    };

    return (
        <Joyride
            key={tourKey}
            steps={steps}
            run={run}
            stepIndex={stepIndex}
            continuous
            showProgress
            showSkipButton
            disableScrolling={false}
            scrollToFirstStep
            callback={handleJoyrideCallback}
            styles={{
                options: {
                    primaryColor: '#8b5cf6', // violet-500
                    backgroundColor: '#18181b', // zinc-900
                    textColor: '#ffffff',
                    arrowColor: '#18181b',
                    overlayColor: 'rgba(0, 0, 0, 0.75)',
                },
                tooltipContainer: {
                    textAlign: 'left',
                },
                buttonNext: {
                    backgroundColor: '#8b5cf6',
                },
                buttonBack: {
                    marginRight: 10,
                    color: '#a1a1aa',
                },
                buttonSkip: {
                    color: '#a1a1aa',
                }
            }}
        />
    );
}

// Export a way to trigger it manually
export function useAppTour() {
    const queryClient = useQueryClient();

    const triggerTour = async () => {
        // We set hasSeenTutorial to false temporarily to trigger it if we want to "Replay"
        // But Joyride usually needs a local state. 
        // For "Replay", we can just force the 'run' state in the component.
        // Let's implement that by adding a custom event or a shared state.
        window.dispatchEvent(new CustomEvent('start-app-tour'));
    };

    return { triggerTour };
}
