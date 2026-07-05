import { Switch, Route, Redirect, useLocation } from "wouter";
import { queryClient, persisterOptions } from "./lib/queryClient";
import { useQuery } from "@tanstack/react-query";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeToggle } from "@/components/theme-toggle";
import { Activity } from "lucide-react";
import { FocusFloatingButton } from "@/components/focus-floating-button";
import { NotificationCenter } from "@/components/notification-center";
import { MobileBottomNav } from "@/components/mobile-bottom-nav";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AuthProvider, useAuth } from "@/hooks/use-auth";
import { ThemeProvider } from "@/hooks/use-theme";
import { useToast } from "@/hooks/use-toast";
import { AppTour } from "@/components/AppTour";
import { User } from "@shared/schema";
import { AnimationProvider, useAnimations } from "@/context/animation-context";
import { useState, useEffect } from "react";
import { TelemetryTracker } from "@/components/telemetry-tracker";
import { Seo } from "@/components/seo";
import { WorkoutProvider } from "@/context/workout-context";

const withSeo = (Component: React.ComponentType<any>, seoProps: { title: string; description?: string; url?: string }) => {
  return (props: any) => (
    <>
      <Seo {...seoProps} />
      <Component {...props} />
    </>
  );
};

import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/auth";
import OnboardingPage from "@/pages/onboarding";
import Dashboard from "@/pages/dashboard";
import QuestsPage from "@/pages/quests";
import StatsPage from "@/pages/stats";
import LeaderboardPage from "@/pages/leaderboard";
import ProfilePage from "@/pages/profile";
import LibraryPage from "@/pages/library";
import ContentDetailPage from "@/pages/content-detail";
// import GuildsPage from "@/pages/guilds";
import PartnersPage from "@/pages/partners";
import GlobalChatPage from "@/pages/global-chat";
import SessionPage from "@/pages/session";
import AdminDashboard from "@/pages/admin/dashboard";
import AccountSelection from "@/pages/account-selection";
import Register from "@/pages/register";
import Login from "@/pages/login";
import FocusSanctum from "@/pages/focus";
import StorePage from "@/pages/store";
import RoadmapPage from "@/pages/roadmap";
import PaymentRedirect from "@/pages/pay-redirect";
import { FeatureLockOverlay } from "@/components/premium/feature-lock-overlay";
import ReferralRedirect from "@/pages/referral-redirect";
import ContactPage from "@/pages/contact";
import WorkoutPage from "@/pages/workout";

function TierWatcher() {
  const { user } = useAuth();
  const { data: backendUser } = useQuery<User>({
    queryKey: ["/api/user"],
    enabled: !!user
  });
  const { showTierUpgrade } = useAnimations();
  const [prevTier, setPrevTier] = useState<string | null>(null);

  useEffect(() => {
    if (backendUser?.tier) {
      if (prevTier && prevTier !== backendUser.tier) {
        showTierUpgrade(backendUser.tier);
      }
      setPrevTier(backendUser.tier);
    }
  }, [backendUser?.tier, prevTier, showTierUpgrade]);

  return null;
}

function NotificationWatcher() {
  const { user } = useAuth();
  const [lastNotificationId, setLastNotificationId] = useState<string | null>(null);
  const { toast } = useToast(); // Changed this line

  const { data: notifications = [] } = useQuery<any[]>({
    queryKey: ["/api/notifications"],
    enabled: !!user,
    refetchInterval: 300000, // Increased to 5m for ultra-aggressive conservation
    staleTime: 300000,
  });

  useEffect(() => {
    if (!notifications || notifications.length === 0) return;

    // Get unread notifications
    const unreadNotifications = notifications.filter((n: any) => !n.read);
    if (unreadNotifications.length === 0) return;

    // Get the most recent notification
    const latestNotification = unreadNotifications[0];

    // Only show toast if this is a new notification we haven't seen before
    if (lastNotificationId && latestNotification.id === lastNotificationId) return;

    // Update last seen notification
    setLastNotificationId(latestNotification.id);

    // Don't show toast on initial load (when lastNotificationId is null)
    if (lastNotificationId === null) return;

    // Show toast for new notification
    const isPartnerRequest = latestNotification.type === "partner_request";
    toast({
      title: latestNotification.title,
      description: latestNotification.message,
      variant: isPartnerRequest ? "default" : "default",
      duration: 5000,
    });
  }, [notifications, lastNotificationId, toast]);

  return null;
}
function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  const { user, loading: authLoading } = useAuth();
  const { data: backendUser, isLoading: userLoading } = useQuery<User>({
    queryKey: ["/api/user"],
    enabled: !!user
  });

  // We rely on authLoading for the initial session check.
  // userLoading (background fetch) should NOT block the UI, as we have the user from useAuth.
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Redirect to="/" />;
  }

  // Check onboarding status
  const onboardingCompleted = backendUser?.onboardingCompleted;

  // Only enforce onboarding for guests. Registered users should have completed it.
  // If a registered user has onboardingCompleted=false, it's likely a data glitch, so we let them through.
  const isOnboardingPath = window.location.pathname === "/onboarding";
  const needsOnboarding = user.isAnonymous && onboardingCompleted === false;

  if (needsOnboarding && !isOnboardingPath) {
    return <Redirect to="/onboarding" />;
  }

  if (!needsOnboarding && isOnboardingPath) {
    return <Redirect to="/dashboard" />;
  }

  // Check for expired trial (Nuclear Option)
  const isExpired = user && !user.isPremium && !user.isTrial;
  const isNewRegistration = sessionStorage.getItem("isNewRegistration") === "true";
  const hasSeenOverlay = sessionStorage.getItem("hasSeenPaywallOverlay") === "true";

  if (isExpired) {
    if (window.location.pathname === "/pay-redirect") {
      return <Component />;
    }

    // Only show overlay if: user is not new AND hasn't seen it yet this session
    if (!isNewRegistration && !hasSeenOverlay) {
      return (
        <div className="relative w-full h-full">
          <Component />
          <FeatureLockOverlay />
        </div>
      );
    }
  }

  return <Component />;
}

function Router() {
  const { user, loading: authLoading } = useAuth();
  const { data: backendUser, isLoading: userLoading } = useQuery<User>({
    queryKey: ["/api/user"],
    enabled: !!user
  });

  // Remove blocking check for userLoading


  // Authenticated Routes
  console.log("[Debug] Router state:", { authLoading, userLoading, user: !!user, pathname: window.location.pathname });

  if (!authLoading && user) {
    const onboardingCompleted = backendUser?.onboardingCompleted;

    return (
      <Switch>
        <Route path="/" >
          {() => {
            // If user is a guest (anonymous), redirect to onboarding if not completed
            if (user.isAnonymous) {
              if (backendUser?.onboardingCompleted === false) {
                return <Redirect to="/onboarding" />;
              }
              return <Redirect to="/dashboard" />;
            }
            return <Redirect to="/dashboard" />;
          }}
        </Route>

        <Route path="/account-selection" component={withSeo(AccountSelection, { title: "Choose Account Type", url: "/account-selection" })} />
        <Route path="/register" component={withSeo(Register, { title: "Register", url: "/register" })} />
        <Route path="/login" component={withSeo(Login, { title: "Login", url: "/login" })} />

        <Route path="/onboarding" component={() => <ProtectedRoute component={withSeo(OnboardingPage, { title: "Onboarding" })} />} />
        <Route path="/dashboard" component={() => <ProtectedRoute component={withSeo(Dashboard, { title: "Dashboard" })} />} />
        <Route path="/quests" component={() => <ProtectedRoute component={withSeo(QuestsPage, { title: "Quests" })} />} />
        <Route path="/roadmap" component={() => <ProtectedRoute component={withSeo(RoadmapPage, { title: "Roadmap" })} />} />
        <Route path="/workout" component={() => <ProtectedRoute component={withSeo(WorkoutPage, { title: "Workout Tracker" })} />} />
        <Route path="/focus" component={() => <ProtectedRoute component={withSeo(FocusSanctum, { title: "Focus Sanctum" })} />} />
        <Route path="/stats" component={() => <ProtectedRoute component={withSeo(StatsPage, { title: "Stats" })} />} />
        <Route path="/leaderboard" component={() => <ProtectedRoute component={withSeo(LeaderboardPage, { title: "Leaderboard" })} />} />
        <Route path="/profile/:id" component={() => <ProtectedRoute component={withSeo(ProfilePage, { title: "Profile" })} />} />
        <Route path="/profile" component={() => <ProtectedRoute component={withSeo(ProfilePage, { title: "Profile" })} />} />
        <Route path="/library" component={() => <ProtectedRoute component={withSeo(LibraryPage, { title: "Library" })} />} />
        <Route path="/library/:id" component={() => <ProtectedRoute component={withSeo(ContentDetailPage, { title: "Library Content" })} />} />
        <Route path="/partners" component={() => <ProtectedRoute component={withSeo(PartnersPage, { title: "Partners", url: "/partners" })} />} />
        <Route path="/global-chat" component={() => <ProtectedRoute component={withSeo(GlobalChatPage, { title: "Global Chat" })} />} />
        <Route path="/store" component={() => <ProtectedRoute component={withSeo(StorePage, { title: "Store" })} />} />
        <Route path="/contact" component={() => <ProtectedRoute component={withSeo(ContactPage, { title: "Contact", url: "/contact" })} />} />
        <Route path="/pay-redirect" component={PaymentRedirect} />
        <Route path="/ref/:code" component={ReferralRedirect} />
        <Route path="/session/:id" component={() => <ProtectedRoute component={withSeo(SessionPage, { title: "Session" })} />} />
        <Route path="/admin/dashboard" component={withSeo(AdminDashboard, { title: "Admin Control" })} />
        <Route component={withSeo(NotFound, { title: "404 Not Found" })} />
      </Switch>
    );
  }

  // Unauthenticated Routes
  return (
    <Switch>
      <Route path="/" component={withSeo(AuthPage, { title: "Level Up Your Life", url: "/" })} />
      <Route path="/account-selection" component={withSeo(AccountSelection, { title: "Choose Account Type", url: "/account-selection" })} />
      <Route path="/register" component={withSeo(Register, { title: "Register", url: "/register" })} />
      <Route path="/login" component={withSeo(Login, { title: "Login", url: "/login" })} />
      <Route path="/ref/:code" component={ReferralRedirect} />
      <Route path="/admin/dashboard" component={withSeo(AdminDashboard, { title: "Admin Control" })} />

      {/* Catch-all: Redirect to home */}
      <Route component={() => <Redirect to="/" />} />
    </Switch>
  );
}

function AppContent() {
  const { user, loading } = useAuth();
  const [location, setLocation] = useLocation();



  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Show auth page without sidebar
  if (!user) {
    return <Router />;
  }

  // Wraps authenticated app content with necessary providers
  return (
    <>
      <AppTour />
      {location === "/onboarding" ? (
        <Router />
      ) : (
        <SidebarProvider>
          <div className="flex min-h-screen w-full">
            {/* Desktop Sidebar */}
            <AppSidebar />

            {/* Main Content Area */}
            <main className="flex-1 flex flex-col min-h-screen w-full relative">
              {/* Top Header Bar */}
              <header className="sticky top-0 z-50 flex items-center justify-between px-3 py-2 bg-card/80 backdrop-blur-md border-b border-border">
                {/* Desktop: sidebar trigger | Mobile: app branding */}
                <div className="flex items-center gap-2">
                  <SidebarTrigger className="hidden md:flex mr-2" />
                  {/* Mobile-only branding */}
                  <div className="flex md:hidden items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-600 flex items-center justify-center shadow-md shadow-violet-500/30">
                      <Activity className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-base font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent tracking-tight">
                      Ascension
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <NotificationCenter />
                  <ThemeToggle />
                </div>
              </header>

              {/* Page Content */}
              <div className="flex-1 overflow-y-auto pb-20 md:pb-4 scrollbar-hide" style={{ paddingBottom: 'max(5rem, calc(5rem + env(safe-area-inset-bottom, 0px)))' }} >
                <Router />
              </div>

              {/* Floating Focus Button (Desktop) */}
              <div className="fixed bottom-4 right-4 z-50 hidden md:block">
                <FocusFloatingButton />
              </div>

              {/* Mobile Bottom Nav */}
              <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden">
                <MobileBottomNav />
              </div>
            </main>
          </div>
        </SidebarProvider>
      )}
    </>
  );
}


function App() {
  return (
    <PersistQueryClientProvider client={queryClient} persistOptions={persisterOptions}>
      <AuthProvider>
        <ThemeProvider>
          <TooltipProvider>
            <AnimationProvider>
              <WorkoutProvider>
                <TelemetryTracker />
                <TierWatcher />
                <NotificationWatcher />
                <AppContent />
                <Toaster />
              </WorkoutProvider>
            </AnimationProvider>
          </TooltipProvider>
        </ThemeProvider>
      </AuthProvider>
    </PersistQueryClientProvider>
  );
}

export default App;
