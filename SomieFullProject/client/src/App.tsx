import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider, useAuth } from "./hooks/use-auth";
import { OnboardingProvider } from "./hooks/use-onboarding";
import { MascotProvider } from "./hooks/use-mascot";
import { DeviceSimulatorProvider } from "./hooks/use-device-simulator";
import { useEffect, useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { ErrorBoundary } from "@/components/error-boundary";
import { PlatformMascot } from "@/components/platform-mascot";
import { DeviceSimulator } from "@/components/ui/device-simulator";
import { MobileNav } from "@/components/ui/mobile-nav";
import { Loader2 } from "lucide-react";
import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/auth-page";
import BusinessDashboard from "@/pages/business-dashboard";
import InfluencerDashboard from "@/pages/influencer-dashboard";
import MetricsDetail from "@/pages/metrics-detail";
import OfferDetail from "@/pages/offer-detail";
import DealDetail from "@/pages/deal-detail";
import TestRegisterPage from "@/pages/test-register";
import Marketplace from "@/pages/marketplace";
import LandingPageNew from "@/pages/landing-new";
import WhySomiePage from "@/pages/why-somie";
import { ProtectedRoute } from "./lib/protected-route";

// Admin pages
import AdminDashboard from "@/pages/admin/dashboard";
import AdminUsers from "@/pages/admin/users";
import AdminOffers from "@/pages/admin/offers";
import AdminReports from "@/pages/admin/reports";
import AdminSettings from "@/pages/admin/settings";
import AdminLogs from "@/pages/admin/logs";
import AdminLogin from "@/pages/admin/login";
import { AdminEntry } from "@/components/admin/admin-entry";

// This improved DefaultRoute handles redirection to the appropriate dashboard
function DefaultRoute() {
  const { user, isLoading } = useAuth();
  const [_, navigate] = useLocation();
  const [redirected, setRedirected] = useState(false);

  // Handle fallback auth from localStorage if userInfo is missing
  useEffect(() => {
    if (!isLoading && !user && !redirected) {
      try {
        // Check for user data in localStorage
        const userId = localStorage.getItem('somie_user_id');
        const userType = localStorage.getItem('somie_user_type');
        
        if (userId && userType) {
          console.log(`[DefaultRoute] Found fallback user data in localStorage: ID ${userId}, type ${userType}`);
          
          // Redirect to appropriate dashboard based on localStorage
          const redirectPath = userType === "business" ? "/business-dashboard" : "/influencer-dashboard";
          console.log(`[DefaultRoute] Redirecting to ${redirectPath} using localStorage data`);
          navigate(redirectPath);
          setRedirected(true);
          return;
        }
      } catch (e) {
        console.error("[DefaultRoute] Error checking localStorage:", e);
      }
    }
  }, [isLoading, user, navigate, redirected]);

  // Use effect to handle navigation based on user state
  useEffect(() => {
    if (user && !redirected) {
      const redirectPath = user.userType === "business" ? "/business-dashboard" : "/influencer-dashboard";
      console.log(`[DefaultRoute] User authenticated, redirecting to ${redirectPath}`);
      navigate(redirectPath);
      setRedirected(true);
    }
  }, [user, navigate, redirected]);

  // If we're still loading, show a simple loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto mb-4" />
          <p className="text-gray-600">Loading your information...</p>
        </div>
      </div>
    );
  }

  // No authenticated user found, show the landing page
  return <LandingPageNew />;
}

function Router() {
  const { user, isLoading } = useAuth();
  const [location] = useLocation();
  
  // Debug routing issues
  useEffect(() => {
    console.log(`[Router] Current location: ${location}, user:`, user ? `logged in as ${user.username}` : 'not logged in');
  }, [location, user]);

  return (
    <Switch>
      <Route path="/auth-page" component={AuthPage} />
      <Route path="/test-register" component={TestRegisterPage} />
      <ProtectedRoute path="/business-dashboard" component={BusinessDashboard} />
      <ProtectedRoute path="/business" component={BusinessDashboard} /> {/* For backward compatibility */}
      <ProtectedRoute path="/influencer-dashboard" component={InfluencerDashboard} />
      <ProtectedRoute path="/influencer" component={InfluencerDashboard} /> {/* For backward compatibility */}
      <ProtectedRoute path="/metrics/:type" component={MetricsDetail} />
      <ProtectedRoute path="/offers/:id" component={OfferDetail} />
      <ProtectedRoute path="/deals/:id" component={DealDetail} />
      <Route path="/marketplace" component={Marketplace} />
      <Route path="/why-somie" component={WhySomiePage} />
      
      {/* Admin routes */}
      <Route path="/admin/login" component={AdminLogin} />
      <Route path="/admin/entry" component={AdminEntry} />
      <ProtectedRoute path="/admin/dashboard" component={AdminDashboard} adminOnly={true} />
      <ProtectedRoute path="/admin/users" component={AdminUsers} adminOnly={true} />
      <ProtectedRoute path="/admin/offers" component={AdminOffers} adminOnly={true} />
      <ProtectedRoute path="/admin/reports" component={AdminReports} adminOnly={true} />
      <ProtectedRoute path="/admin/settings" component={AdminSettings} superAdminOnly={true} />
      <ProtectedRoute path="/admin/logs" component={AdminLogs} adminOnly={true} />
      <Route path="/admin" component={AdminEntry} />
      
      <Route path="/" component={DefaultRoute} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <OnboardingProvider>
            <MascotProvider>
              <DeviceSimulatorProvider>
                <DeviceSimulator>
                  <div className="pb-16"> {/* Add padding at bottom for mobile nav */}
                    <Router />
                    <MobileNav />
                    <PlatformMascot />
                    <Toaster />
                  </div>
                </DeviceSimulator>
              </DeviceSimulatorProvider>
            </MascotProvider>
          </OnboardingProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;