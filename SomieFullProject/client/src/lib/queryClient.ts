import { QueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { tokenManager } from "./tokenManager";

/**
 * Enhanced error handling for API responses
 * Provides more useful error messages with context
 */
async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = await res.text();
    let errorMessage: string;
    let errorCode: string | undefined;
    let errorDetails: any = undefined;

    try {
      // Try to parse as JSON for structured error info
      const errorJson = JSON.parse(text);
      
      // Extract structured error information
      errorMessage = errorJson.message || errorJson.error || text;
      errorCode = errorJson.code;
      errorDetails = errorJson.details;
      
      // Combine code with message if available
      if (errorCode) {
        errorMessage = `[${errorCode}] ${errorMessage}`;
      }
      
      // Add details to error message if available
      if (errorDetails && typeof errorDetails === 'object') {
        const detailsStr = Object.entries(errorDetails)
          .map(([key, value]) => `${key}: ${value}`)
          .join(', ');
        errorMessage = `${errorMessage} (${detailsStr})`;
      }
    } catch {
      // Fallback for non-JSON responses
      errorMessage = text || res.statusText || 'Unknown error';
    }

    // Create a more informative error message with status code
    const error = new Error(`${res.status}: ${errorMessage}`);
    
    // Add additional properties to the error for easier handling
    (error as any).status = res.status;
    (error as any).code = errorCode;
    (error as any).details = errorDetails;
    
    throw error;
  }
}

// Token refresh configuration
let tokenRefreshInProgress = false;
const TOKEN_THROTTLE_KEY = 'somie_token_last_get';
const TOKEN_THROTTLE_INTERVAL = 2000; // 2 seconds
const DISABLE_TOKEN_API_REQUESTS = false; // Re-enabling token API requests for WebSocket authentication

export async function getAuthToken(): Promise<string | null> {
  try {
    // Prevent multiple simultaneous token requests
    if (tokenRefreshInProgress) {
      console.log("Token refresh already in progress, waiting for completion");
      // Wait for completion with a timeout of 5 seconds
      await new Promise<void>((resolve) => {
        let attempts = 0;
        const checkInterval = setInterval(() => {
          attempts++;
          if (!tokenRefreshInProgress || attempts > 50) { // 50 * 100ms = 5 seconds
            clearInterval(checkInterval);
            resolve();
          }
        }, 100);
      });
      
      // After waiting, check localStorage directly first
      const token = localStorage.getItem('somie_auth_token') || localStorage.getItem('authToken');
      const expiryStr = localStorage.getItem('somie_token_expiry');
      
      if (token && expiryStr) {
        const expiry = parseInt(expiryStr, 10);
        if (expiry > Date.now()) {
          console.log("Using cached token from localStorage after waiting for completion");
          return token;
        }
      }
    }
    
    // Check for throttling
    const lastGet = localStorage.getItem(TOKEN_THROTTLE_KEY);
    if (lastGet) {
      const lastTime = parseInt(lastGet, 10);
      const now = Date.now();
      if (now - lastTime < TOKEN_THROTTLE_INTERVAL) {
        console.log("Token requests being throttled, using direct localStorage check");
        // During throttle period, use direct localStorage access instead
        const token = localStorage.getItem('somie_auth_token') || localStorage.getItem('authToken');
        const expiryStr = localStorage.getItem('somie_token_expiry');
        
        if (token && expiryStr) {
          const expiry = parseInt(expiryStr, 10);
          if (expiry > Date.now()) {
            console.log("Using cached token from localStorage due to throttling");
            return token;
          }
        }
        
        // If we don't have a valid token, wait until throttle period ends
        const timeToWait = TOKEN_THROTTLE_INTERVAL - (now - lastTime);
        if (timeToWait > 0) {
          console.log(`Waiting ${timeToWait}ms for token throttle period to end`);
          await new Promise(resolve => setTimeout(resolve, timeToWait));
        }
      }
    }
    
    // Update throttle timestamp
    localStorage.setItem(TOKEN_THROTTLE_KEY, Date.now().toString());
    
    // Always check localStorage first for better performance
    const token = localStorage.getItem('somie_auth_token') || localStorage.getItem('authToken');
    const expiryStr = localStorage.getItem('somie_token_expiry');
    
    if (token && expiryStr) {
      const expiry = parseInt(expiryStr, 10);
      if (expiry > Date.now()) {
        console.log("Using valid cached token from localStorage");
        return token;
      }
    }
    
    // Check if token API requests are disabled
    if (DISABLE_TOKEN_API_REQUESTS) {
      console.log("Token API requests are disabled - returning null instead of making network request");
      return null;
    }
    
    // Only use tokenManager if direct localStorage check fails and API requests are enabled
    console.log("No valid token in localStorage, using tokenManager");
    tokenRefreshInProgress = true;
    try {
      const token = await tokenManager.getToken();
      return token;
    } catch (error) {
      console.error("Failed to get auth token:", error);
      return null;
    } finally {
      tokenRefreshInProgress = false;
    }
  } catch (error) {
    console.error("Error in getAuthToken:", error);
    return null;
  }
}

// Save auth token to localStorage and trigger tokenManager update
export function setAuthToken(token: string): void {
  // Get approximate expiry from token (24h if can't be determined)
  let expiry = Date.now() + (24 * 60 * 60 * 1000); // Default 24h
  
  try {
    // Try to extract expiration from token
    const parts = token.split('.');
    if (parts.length === 3) {
      const payload = JSON.parse(atob(parts[1]));
      if (payload.exp) {
        expiry = payload.exp * 1000; // Convert from seconds to milliseconds
      }
    }
  } catch (err) {
    console.warn('Could not extract expiry from token:', err);
  }
  
  // Save token in all formats for compatibility
  localStorage.setItem('somie_auth_token', token);
  localStorage.setItem('authToken', token);
  localStorage.setItem('somie_token_expiry', expiry.toString());
  
  console.log(`Auth token saved with expiry: ${new Date(expiry).toLocaleString()}`);
}

// Clear auth token
export function clearAuthToken(): void {
  tokenManager.clearToken();
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
  options: { signal?: AbortSignal } = {}
): Promise<Response> {
  console.log(`[API Request] ${method} ${url}`, { data });
  
  // Log cookies before request for debugging
  console.log("Document cookies before request:", document.cookie);
  
  // Add a small delay before fetch to ensure any previous session operations complete
  if (['POST', 'PUT', 'DELETE'].includes(method.toUpperCase())) {
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  // Prepare headers with caching disabled and cookie info
  const commonHeaders: Record<string, string> = {
    // Explicitly tell the browser not to use cached responses
    "Cache-Control": "no-cache, no-store, must-revalidate",
    "Pragma": "no-cache",
    "Expires": "0",
    // Add CORS headers for better cookie handling
    "X-Requested-With": "XMLHttpRequest"
  };
  
  // Add auth token if available - using the TokenManager
  try {
    const authToken = await getAuthToken();
    if (authToken) {
      commonHeaders["Authorization"] = `Bearer ${authToken}`;
    }
  } catch (error) {
    console.warn("Failed to get auth token for request:", error);
  }
  
  const contentHeaders = data ? {
    ...commonHeaders,
    "Content-Type": "application/json"
  } : commonHeaders;
  
  try {
    // Enhanced fetch options with strong cookie handling
    const res = await fetch(url, {
      method,
      headers: contentHeaders,
      body: data ? JSON.stringify(data) : undefined,
      credentials: "include", // Always include credentials for auth cookies
      signal: options.signal,
      cache: "no-store"
    });

    // Check for session-related headers to debug session issues
    const sessionId = res.headers.get('X-Session-ID');
    const userId = res.headers.get('X-Auth-User-ID');
    
    console.log(`[API Response] ${method} ${url} - Status: ${res.status}`, {
      sessionId: sessionId || 'none',
      userId: userId || 'none',
      hasCookies: Boolean(document.cookie),
      cookies: document.cookie ? document.cookie.substring(0, 50) + '...' : 'no cookies'
    });

    // Special case for profile endpoints to avoid treating 404 as an error
    if (res.status === 404 && (url.includes('business-profile') || url.includes('influencer-profile'))) {
      console.log('Profile 404 - expected for new users');
      return res; // Allow 404 for profile specifically, don't throw
    }
    
    // Handle redirect to login (which indicates auth issues)
    if (res.redirected && res.url.includes('/login')) {
      console.error('Request was redirected to login, authentication issue');
      throw new Error('Authentication required');
    }

    await throwIfResNotOk(res);
    return res;
  } catch (error) {
    console.error(`[API Error] ${method} ${url}`, error);
    if (error instanceof TypeError && error.message === 'Failed to fetch') {
      throw new Error('Network error: Please check your connection');
    }
    if (error instanceof DOMException && error.name === 'AbortError') {
      console.debug('Request aborted:', url);
      return Promise.reject(error); // Let React Query handle abort errors
    }
    throw error;
  }
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn =
  ({ on401: unauthorizedBehavior }: { on401: UnauthorizedBehavior }) =>
  async ({ queryKey, signal }: { queryKey: readonly unknown[], signal?: AbortSignal }) => {
    try {
      console.log(`[Query] GET ${queryKey[0]}`);
      console.log("Document cookies before query:", document.cookie);
      
      // Prepare headers with auth token
      const headers: Record<string, string> = {
        // Explicitly tell the browser not to use cached responses
        "Cache-Control": "no-cache, no-store, must-revalidate",
        "Pragma": "no-cache",
        "Expires": "0",
        // Add CORS headers for better cookie handling
        "X-Requested-With": "XMLHttpRequest"
      };
      
      // Add auth token if available - using TokenManager
      try {
        const authToken = await getAuthToken();
        if (authToken) {
          headers["Authorization"] = `Bearer ${authToken}`;
        }
      } catch (error) {
        console.warn("Failed to get auth token for query:", error);
      }
      
      // Enhanced fetch options with strong cookie handling
      const res = await fetch(queryKey[0] as string, {
        credentials: "include", // Always include credentials
        signal,
        headers,
        cache: "no-store"
      });
      
      // Check for session-related headers to debug session issues
      const sessionId = res.headers.get('X-Session-ID');
      const userId = res.headers.get('X-Auth-User-ID');
      
      console.log(`[Query Response] ${queryKey[0]} - Status: ${res.status}`, {
        sessionId: sessionId || 'none',
        userId: userId || 'none',
        hasCookies: Boolean(document.cookie),
        cookies: document.cookie ? document.cookie.substring(0, 50) + '...' : 'no cookies'
      });

      if (unauthorizedBehavior === "returnNull" && res.status === 401) {
        console.log(`[Query] Unauthorized access to ${queryKey[0]}, returning null as configured`);
        return null;
      }

      // Special case for 404 on profile endpoints
      if (res.status === 404 && typeof queryKey[0] === 'string' && 
         (queryKey[0].includes('business-profile') || queryKey[0].includes('influencer-profile'))) {
        console.log('[Query] Profile 404 - expected for new users');
        return null;
      }
      
      // Handle redirect to login (which indicates auth issues)
      if (res.redirected && res.url.includes('/login')) {
        console.error('Query was redirected to login, authentication issue');
        if (unauthorizedBehavior === "returnNull") {
          return null;
        }
        throw new Error('Authentication required');
      }

      await throwIfResNotOk(res);
      return await res.json();
    } catch (error) {
      console.error(`[Query Error] ${queryKey[0]}`, error);
      
      if (error instanceof DOMException && error.name === 'AbortError') {
        console.debug('Query aborted:', queryKey);
        return Promise.reject(error); // Let React Query handle abort errors
      }
      if (error instanceof TypeError && error.message === 'Failed to fetch') {
        throw new Error('Unable to connect to the server. Please check your internet connection.');
      }
      throw error;
    }
  };

// Cache time constants
const MINUTE = 1000 * 60;
const HOUR = MINUTE * 60;

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      staleTime: MINUTE * 5, // 5 minutes
      gcTime: HOUR, // 1 hour
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      refetchInterval: false,
      retry: (failureCount, error) => {
        if (error instanceof DOMException && error.name === 'AbortError') return false;
        if (error instanceof Error && error.message.startsWith('401:')) return false;
        if (error instanceof Error && error.message.startsWith('403:')) return false;
        return failureCount < 2;
      }
    },
    mutations: {
      retry: false,
      onError: (error: unknown) => {
        // Don't show toast for abort errors
        if (error instanceof DOMException && error.name === 'AbortError') {
          return;
        }
        const { toast } = useToast();
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : "An unexpected error occurred",
          variant: "destructive",
        });
      },
    },
  },
});

// Instead of using setInterval for GC, use the built-in garbage collection
queryClient.setDefaultOptions({
  queries: {
    gcTime: HOUR
  }
});

// Cleanup queries on window unload
if (typeof window !== 'undefined') {
  window.addEventListener('unload', () => {
    queryClient.removeQueries();
  });
}