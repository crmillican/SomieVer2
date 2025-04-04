import { useAuth } from "@/hooks/use-auth";
import { Loader2, AlertTriangle } from "lucide-react";
import { Route, useLocation } from "wouter";
import { useEffect, useState } from "react";
import { setAuthToken, queryClient } from "../lib/queryClient";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

interface ProtectedRouteProps {
  path: string;
  component: React.ComponentType;
  adminOnly?: boolean;
  superAdminOnly?: boolean;
}

export function ProtectedRoute({ 
  path, 
  component: Component, 
  adminOnly = false, 
  superAdminOnly = false 
}: ProtectedRouteProps) {
  const { user, isLoading } = useAuth();
  const [currentLocation, setLocation] = useLocation();
  const [shouldRedirect, setShouldRedirect] = useState(false);
  const [redirectAttempts, setRedirectAttempts] = useState(0);

  // Check if user has required admin role
  const hasRequiredRole = () => {
    if (!user) return false;
    if (superAdminOnly) return user.role === 'super_admin';
    if (adminOnly) return user.role === 'admin' || user.role === 'super_admin';
    return true;
  };

  // Handle auth check and redirection in an effect
  useEffect(() => {
    console.log(`[ProtectedRoute] Checking auth for path: ${path}`, { 
      user, 
      isLoading, 
      currentLocation,
      userId: user?.id,
      userType: user?.userType,
      userRole: user?.role,
      adminOnly,
      superAdminOnly
    });

    // Check for localStorage fallback auth if no user in state
    if (!isLoading && !user) {
      try {
        const userId = localStorage.getItem('somie_user_id');
        const userType = localStorage.getItem('somie_user_type');
        const userRole = localStorage.getItem('somie_user_role');
        
        if (userId && userType) {
          console.log(`[ProtectedRoute] Found fallback auth in localStorage: user ${userId}, type ${userType}, role ${userRole}`);
          
          // Attempt to restore auth state using the token-from-id endpoint
          if (redirectAttempts === 0) {
            console.log(`[ProtectedRoute] Attempting to restore auth state from user ID ${userId}`);
            
            // Make a direct API call to get a new token based on the stored user ID
            fetch(`/api/auth/token-from-id?userId=${userId}`, {
              method: "GET",
              credentials: "include",
              headers: {
                'Content-Type': 'application/json',
                'Cache-Control': 'no-cache, no-store',
                'Pragma': 'no-cache'
              }
            })
            .then(res => {
              if (res.ok) return res.json();
              throw new Error("Failed to get token from user ID");
            })
            .then(data => {
              if (data.authToken) {
                console.log(`[ProtectedRoute] Successfully restored auth token for user ${userId}`);
                // Use the imported setAuthToken function
                setAuthToken(data.authToken);
                
                // Invalidate queries to trigger a refresh
                queryClient.invalidateQueries({ queryKey: ["/api/user"] });
                
                // Don't redirect if we successfully restored auth
                setShouldRedirect(false);
                
                // Force a refetch after a small delay to ensure the user state is updated
                setTimeout(() => {
                  queryClient.refetchQueries({ queryKey: ["/api/user"] });
                }, 300);
              } else {
                console.error("[ProtectedRoute] No auth token received from server");
                setShouldRedirect(true);
              }
            })
            .catch(err => {
              console.error("[ProtectedRoute] Error restoring auth token:", err);
              setShouldRedirect(true);
              setRedirectAttempts(prev => prev + 1);
            });
            
            // While the above fetch is in progress, set a backup timer
            const timer = setTimeout(() => {
              if (!user) {
                console.log(`[ProtectedRoute] Auth state not restored in time, redirecting`);
                setShouldRedirect(true);
                setRedirectAttempts(prev => prev + 1);
              }
            }, 3000); // Longer timeout to give API call a chance
            
            return () => clearTimeout(timer);
          }
        } else {
          // No user in localStorage, redirect immediately
          console.log(`[ProtectedRoute] No user found in state or localStorage, redirecting to auth page from ${currentLocation}`);
          setShouldRedirect(true);
        }
      } catch (e) {
        console.error("Error checking localStorage auth:", e);
        setShouldRedirect(true);
      }
    }

    // Don't redirect while loading or if we have a user with the required permissions
    if (isLoading || (user && hasRequiredRole())) {
      setShouldRedirect(false);
      return;
    }
    
    // If user is authenticated but doesn't have required permissions, we don't redirect
    if (user && !hasRequiredRole()) {
      console.log(`[ProtectedRoute] User lacks required role for ${path}`);
      return;
    }
    
    // In all other cases, we should redirect to auth page
    if (!isLoading && !user) {
      setShouldRedirect(true);
    }
  }, [user, isLoading, currentLocation, path, redirectAttempts, adminOnly, superAdminOnly]);

  // Handle actual redirection in a separate effect
  useEffect(() => {
    if (shouldRedirect) {
      // Preserve the intended destination by adding a redirect parameter
      const redirectPath = encodeURIComponent(currentLocation);
      console.log(`[ProtectedRoute] Redirecting to auth page with redirect=${redirectPath}`);
      setLocation(`/auth-page?redirect=${redirectPath}`);
      
      // Reset redirect state to prevent infinite redirects
      setShouldRedirect(false);
    }
  }, [shouldRedirect, currentLocation, setLocation]);

  // Handle client-side navigation correctly
  return (
    <Route path={path}>
      {(params) => {
        // If we're loading auth state, show a loading indicator
        if (isLoading) {
          return (
            <div className="flex flex-col items-center justify-center min-h-screen">
              <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
              <p>Loading your information...</p>
            </div>
          );
        }

        // If we have no user but aren't redirecting yet (waiting for localStorage check)
        if (!user && !shouldRedirect && redirectAttempts === 0) {
          return (
            <div className="flex flex-col items-center justify-center min-h-screen">
              <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
              <p>Checking authentication...</p>
            </div>
          );
        }

        // If we're in the process of redirecting
        if (!user) {
          return (
            <div className="flex flex-col items-center justify-center min-h-screen">
              <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
              <p>Redirecting to login...</p>
            </div>
          );
        }

        // If user doesn't have the required role, show an error page
        if (user && !hasRequiredRole()) {
          return (
            <div className="flex flex-col items-center justify-center min-h-screen p-4">
              <AlertTriangle className="h-12 w-12 text-amber-500 mb-4" />
              <h1 className="text-2xl font-bold mb-4">Access Restricted</h1>
              <p className="text-center mb-6 max-w-md">
                {superAdminOnly 
                  ? "This page requires super admin privileges." 
                  : "You need administrative privileges to access this page."}
              </p>
              <Link href="/">
                <Button>Return to Home</Button>
              </Link>
            </div>
          );
        }

        // User is authenticated with the correct role, render the protected component
        console.log(`[ProtectedRoute] User authenticated with correct role, rendering component for ${path}`);
        return <Component {...params} />;
      }}
    </Route>
  );
}