import { Switch, Route, Redirect, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider, useQuery } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { ThemeToggle } from "@/components/theme-toggle";
import { FocusFloatingButton } from "@/components/focus-floating-button";
import { NotificationCenter } from "@/components/notification-center";
import { MobileBottomNav } from "@/components/mobile-bottom-nav";
import { AuthProvider, useAuth } from "@/hooks/use-auth";
import { ThemeProvider } from "@/hooks/use-theme";
import { useToast } from "@/hooks/use-toast";
import { User } from "@shared/schema";
import { AnimationProvider, useAnimations } from "@/context/animation-context";
import { useState, useEffect } from "react";

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
import GuildsPage from "@/pages/guilds";
import PartnersPage from "@/pages/partners";
import GlobalChatPage from "@/pages/global-chat";
import SessionPage from "@/pages/session";
import AdminDashboard from "@/pages/admin/dashboard";
import AccountSelection from "@/pages/account-selection";
import Register from "@/pages/register";
import Login from "@/pages/login";
import FocusSanctum from "@/pages/focus";
import StorePage from "@/pages/store";

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

  const { data: notifications = [] } = useQuery<any[]>({ // Changed this line
    queryKey: ["/api/notifications"],
    enabled: !!user,
    refetchInterval: 15000, // Poll every 15 seconds
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
  if (user.isAnonymous && onboardingCompleted === false && window.location.pathname !== "/onboarding") {
    return <Redirect to="/onboarding" />;
  }

  if (onboardingCompleted && window.location.pathname === "/onboarding") {
    return <Redirect to="/dashboard" />;
  }

  // If user is registered (not anonymous) and on onboarding page, redirect to dashboard
  if (!user.isAnonymous && window.location.pathname === "/onboarding") {
    return <Redirect to="/dashboard" />;
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
  if (false && user && userLoading) {
    return (
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-muted-foreground">Syncing ascension data...</p>
        </div >
      </div >
    );
  }

  // Authenticated Routes
  if (!authLoading && !userLoading && user) {
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

        <Route path="/account-selection" component={AccountSelection} />
        <Route path="/register" component={Register} />
        <Route path="/login" component={Login} />

        <Route path="/onboarding" component={() => <ProtectedRoute component={OnboardingPage} />} />
        <Route path="/dashboard" component={() => <ProtectedRoute component={Dashboard} />} />
        <Route path="/quests" component={() => <ProtectedRoute component={QuestsPage} />} />
        <Route path="/focus" component={() => <ProtectedRoute component={FocusSanctum} />} />
        <Route path="/stats" component={() => <ProtectedRoute component={StatsPage} />} />
        <Route path="/leaderboard" component={() => <ProtectedRoute component={LeaderboardPage} />} />
        <Route path="/profile/:id" component={() => <ProtectedRoute component={ProfilePage} />} />
        <Route path="/profile" component={() => <ProtectedRoute component={ProfilePage} />} />
        <Route path="/library" component={() => <ProtectedRoute component={LibraryPage} />} />
        <Route path="/library/:id" component={() => <ProtectedRoute component={ContentDetailPage} />} />
        <Route path="/guilds" component={() => <ProtectedRoute component={GuildsPage} />} />
        <Route path="/partners" component={() => <ProtectedRoute component={PartnersPage} />} />
        <Route path="/global-chat" component={() => <ProtectedRoute component={GlobalChatPage} />} />
        <Route path="/store" component={() => <ProtectedRoute component={StorePage} />} />
        <Route path="/session/:id" component={() => <ProtectedRoute component={SessionPage} />} />
        <Route path="/admin/dashboard" component={AdminDashboard} />
        <Route component={NotFound} />
      </Switch>
    );
  }

  // Unauthenticated Routes
  return (
    <Switch>
      <Route path="/" component={AuthPage} />
      <Route path="/account-selection" component={AccountSelection} />
      <Route path="/register" component={Register} />
      <Route path="/login" component={Login} />
      <Route path="/admin/dashboard" component={AdminDashboard} />

      {/* Catch-all: Redirect to home */}
      <Route component={() => <Redirect to="/" />} />
    </Switch>
  );
}

function AppContent() {
  const { user, loading } = useAuth();
  const [location, setLocation] = useLocation();

  const sidebarStyle = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "4rem",
  };

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

  // Show onboarding page without sidebar (full-screen dedicated experience)
  if (location === "/onboarding") {
    return <Router />;
  }

  // Show focus page without sidebar (immersive focus experience)
  if (location === "/focus") {
    return <Router />;
  }

  // Show app with sidebar for authenticated users on other pages
  return (
    <SidebarProvider defaultOpen={false} style={sidebarStyle as React.CSSProperties}>
      <div className="flex h-screen w-full flex-col md:flex-row">
        {/* Sidebar - hidden on mobile, visible on tablet/desktop */}
        <div className="hidden md:flex">
          <AppSidebar />
        </div>

        <div className="flex flex-col flex-1 overflow-hidden">
          {/* Header with responsive padding */}
          <header className="flex items-center justify-between p-3 md:p-4 border-b border-border bg-card/50 backdrop-blur-sm">
            <div className="flex items-center gap-2">
              <SidebarTrigger data-testid="button-sidebar-toggle" className="md:inline-flex" />
              <h1 className="text-lg md:text-xl font-bold md:hidden">Ascension</h1>
            </div>
            <div className="flex items-center gap-2">
              <NotificationCenter />
              <ThemeToggle />
            </div>
          </header>

          {/* Main content with responsive padding */}
          <main className="flex-1 overflow-y-auto p-4 md:p-6 pb-20 md:pb-6">
            <div className="max-w-7xl mx-auto">
              <Router />
            </div>
          </main>

          {/* Mobile bottom navigation - only visible on mobile */}
          <MobileBottomNav className="md:hidden fixed bottom-0 left-0 right-0 z-50" />
        </div>

        {/* Focus button - hidden on mobile to avoid overlap with bottom nav */}
        <div className="hidden md:block">
          <FocusFloatingButton />
        </div>
      </div>
    </SidebarProvider>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ThemeProvider>
          <TooltipProvider>
            <AnimationProvider>
              <TierWatcher />
              <NotificationWatcher />
              <AppContent />
              <Toaster />
            </AnimationProvider>
          </TooltipProvider>
        </ThemeProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
