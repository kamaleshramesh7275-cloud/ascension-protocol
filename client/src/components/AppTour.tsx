import Joyride, { Step, CallBackProps, STATUS } from 'react-joyride';
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { User } from '@shared/schema';
import { apiRequest } from '@/lib/queryClient';
import { useLocation } from 'wouter';
import { useSidebar } from '@/components/ui/sidebar';

const steps: (Step & { path?: string })[] = [
    {
        target: 'body',
        placement: 'center',
        title: 'Welcome to Ascension Protocol! 🚀',
        content: "I'll take you on a quick tour of your new base of operations. Let's explore the system together!",
        path: '/dashboard'
    },
    {
        target: '[data-tour="sidebar-dashboard"]',
        content: 'This is your Command Center. You can always come back here for a quick overview of your progress.',
        title: 'Your Command Center',
        path: '/dashboard'
    },
    {
        target: '[data-tour="streak-value"]',
        content: 'Keep your streak alive by logging in and completing tasks every day!',
        title: 'Daily Consistency',
        path: '/dashboard'
    },
    {
        target: '[data-tour="rank-badge"]',
        content: 'Earn XP to rank up from Iron to legendary tiers. Higher ranks unlock exclusive perks!',
        title: 'Your Rank',
        path: '/dashboard'
    },
    {
        target: '[data-tour="xp-progress"]',
        content: 'This bar shows your journey to the next level. Every bit of XP counts!',
        title: 'Experience Points',
        path: '/dashboard'
    },
    {
        target: '[data-tour="quests-page"]',
        content: 'The Quest Board contains your Daily Objectives. Completing these earns you XP and Coins to level up.',
        title: 'Quests & Rewards',
        placement: 'center',
        path: '/quests'
    },
    {
        target: '[data-tour="focus-pet"]',
        content: 'The Focus Sanctum is where you do deep work. Your pet grows stronger and evolves as you work!',
        title: 'Focus & Companions',
        placement: 'center',
        path: '/focus'
    },
    {
        target: '[data-tour="sidebar-roadmap"]',
        content: 'The 30-Day Protocol provides a structured path to mastery. Follow the roadmap to reach new heights.',
        title: 'Structured Mastery',
        path: '/roadmap'
    },
    {
        target: '[data-tour="partners-page"]',
        content: 'Connect with other ascendants for mutual accountability, rivalries, and study sessions.',
        title: 'The Community',
        placement: 'center',
        path: '/partners'
    },
    {
        target: '[data-tour="global-chat-page"]',
        content: 'Engage with the community in real-time. Share your progress and cheer others on!',
        title: 'Global Communications',
        placement: 'center',
        path: '/global-chat'
    },
    {
        target: '[data-tour="library-page"]',
        content: 'Access a wealth of knowledge in our curated library. Learn from expert guides and videos.',
        title: 'Knowledge Archives',
        placement: 'center',
        path: '/library'
    },
    {
        target: '[data-tour="stats-page"]',
        content: 'Monitor your growth across different attributes. Strength, Intelligence, and more—every action counts.',
        title: 'Attribute Analysis',
        placement: 'center',
        path: '/stats'
    },
    {
        target: '[data-tour="leaderboard-page"]',
        content: 'See how you stack up against the best. High-ranking members earn exclusive rewards!',
        title: 'Global Rankings',
        placement: 'center',
        path: '/leaderboard'
    },
    {
        target: '[data-tour="store-tabs"]',
        content: 'Spend your hard-earned coins on custom themes, titles, and gear in the Store.',
        title: 'The Armory',
        placement: 'center',
        path: '/store'
    },
    {
        target: '[data-tour="profile-page"]',
        content: 'This is your personal record. You can manage your settings and replay this tour anytime.',
        title: 'Your Legacy',
        placement: 'center',
        path: '/profile'
    },
    {
        target: 'body',
        placement: 'center',
        title: 'Ascension Commences! 🎖',
        content: "You're all set, Commander. Your journey to the top begins now. We'll see you in the rankings!",
        path: '/profile'
    }
];

export function AppTour() {
    const { user: authUser } = useAuth();
    const queryClient = useQueryClient();
    const [location, setLocation] = useLocation();
    const { setOpen, setOpenMobile, isMobile, open, openMobile } = useSidebar();
    const [run, setRun] = useState(false);
    const [stepIndex, setStepIndex] = useState(0);
    const [tourKey, setTourKey] = useState(0);
    const [isTransitioning, setIsTransitioning] = useState(false);

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
            setLocation('/dashboard');
            setStepIndex(0);
            setTourKey(prev => prev + 1);
            setRun(true);
            setIsTransitioning(false);
        };
        window.addEventListener('start-app-tour', handleStartTour);
        return () => window.removeEventListener('start-app-tour', handleStartTour);
    }, [user]);

    // Transition Stabilizer: Wait for path and then a bit more for component mounting
    useEffect(() => {
        if (!run || !isTransitioning) return;

        const nextStep = steps[stepIndex];
        if (nextStep && nextStep.path === location) {
            // Path matches, wait for React to mount the page content
            const timer = setTimeout(() => {
                setIsTransitioning(false);
            }, 800);
            return () => clearTimeout(timer);
        }
    }, [location, isTransitioning, run, stepIndex]);

    const handleJoyrideCallback = (data: CallBackProps) => {
        const { status, index, type, action } = data;
        const finishedStatuses: string[] = [STATUS.FINISHED, STATUS.SKIPPED];

        if (finishedStatuses.includes(status)) {
            setRun(false);
            if (!user?.hasSeenTutorial) {
                markSeenMutation.mutate();
            }
            return;
        }

        if (type === 'step:before') {
            const currentStep = steps[index];
            const target = typeof currentStep.target === 'string' ? currentStep.target : '';

            // Handle Sidebar Visibility
            if (target.includes('sidebar')) {
                if (isMobile) {
                    if (!openMobile) setOpenMobile(true);
                } else {
                    if (!open) setOpen(true);
                }
            }
        }

        if (type === 'step:after') {
            const nextIndex = index + (action === 'next' ? 1 : -1);
            if (nextIndex >= 0 && nextIndex < steps.length) {
                const nextStep = steps[nextIndex];

                if (nextStep.path && location !== nextStep.path) {
                    // Navigation needed
                    setIsTransitioning(true);
                    setStepIndex(nextIndex); // Move Joyride to the next index immediately
                    setLocation(nextStep.path);
                } else {
                    // Same page
                    setStepIndex(nextIndex);
                }
            }
        }

        if (type === 'error:target_not_found') {
            const currentStep = steps[index];
            if (currentStep && currentStep.path && location !== currentStep.path) {
                setLocation(currentStep.path);
                setIsTransitioning(true);
            } else if (run && !isTransitioning) {
                // Persistent retry if we are on the right page but element hasn't appeared
                setTimeout(() => {
                    if (run) setStepIndex(index);
                }, 500);
            }
        }
    };

    return (
        <Joyride
            key={tourKey}
            steps={steps}
            run={run && !isTransitioning} // Pause Joyride while transitioning
            stepIndex={stepIndex}
            continuous
            showProgress
            showSkipButton
            disableScrolling={false}
            scrollToFirstStep
            disableOverlayClose
            disableCloseOnEsc
            spotlightClicks={false}
            callback={handleJoyrideCallback}
            debug
            styles={{
                options: {
                    primaryColor: '#8b5cf6', // violet-500
                    backgroundColor: '#18181b', // zinc-900
                    textColor: '#ffffff',
                    arrowColor: '#18181b',
                    overlayColor: 'rgba(0, 0, 0, 0.75)',
                    zIndex: 1000,
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
    const triggerTour = async () => {
        window.dispatchEvent(new CustomEvent('start-app-tour'));
    };

    return { triggerTour };
}
