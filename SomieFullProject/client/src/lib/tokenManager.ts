/**
 * TokenManager handles authentication token management
 * Implements caching and efficient token refresh to reduce API calls
 */

import { apiRequest } from "./queryClient";

// Event system for handling token refresh
const tokenRefreshCallbacks: Array<() => void> = [];

// Global lock to prevent duplicate token requests
let TOKEN_REFRESH_LOCK = false;
let TOKEN_REFRESH_WAITERS: Array<{
  resolve: (token: string) => void;
  reject: (error: Error) => void;
}> = [];

// Throttling token requests to prevent rapid-fire requests
const TOKEN_THROTTLE_KEY = 'somie_token_last_request_time';
const TOKEN_THROTTLE_INTERVAL = 2000; // 2 seconds minimum between requests

interface TokenInfo {
  token: string;
  expiresAt: number; // Timestamp when token expires
}

class TokenManager {
  private token: string | null = null;
  private expiresAt: number | null = null;
  private refreshPromise: Promise<TokenInfo> | null = null;
  private refreshInProgress: boolean = false;
  private tokenValidityBuffer: number = 5 * 60 * 1000; // 5 minute buffer before expiration

  constructor() {
    // Try to get the token from localStorage on initialization
    // but do not trigger any network requests
    this.loadTokenFromStorage();
    console.log("TokenManager initialized - passive mode only");
  }

  /**
   * Get a valid token, refreshing if necessary
   */
  async getToken(): Promise<string> {
    // 1. First check if we already have a valid token in memory
    if (this.hasValidToken()) {
      return this.token!;
    }
    
    // 2. Check localStorage for a valid token (might have been set by another tab)
    this.loadTokenFromStorage();
    if (this.hasValidToken()) {
      return this.token!;
    }

    // 3. If a global refresh is already in progress, wait for it
    if (TOKEN_REFRESH_LOCK) {
      console.log("Token refresh already in progress globally, waiting for it to complete");
      return new Promise<string>((resolve, reject) => {
        TOKEN_REFRESH_WAITERS.push({ resolve, reject });
      });
    }

    // 4. If an instance refresh is in progress, wait for it
    if (this.refreshInProgress) {
      return this.waitForRefresh();
    }

    // 5. Start a new token refresh with global lock
    TOKEN_REFRESH_LOCK = true;
    console.log("Acquiring global token refresh lock");
    
    try {
      const token = await this.refreshToken();
      return token;
    } finally {
      // Release the global lock
      console.log("Releasing global token refresh lock");
      TOKEN_REFRESH_LOCK = false;
      
      // Notify waiters
      this.notifyWaiters();
    }
  }
  
  /**
   * Notify all waiting promises when a token refresh completes
   */
  private notifyWaiters() {
    if (TOKEN_REFRESH_WAITERS.length > 0) {
      console.log(`Notifying ${TOKEN_REFRESH_WAITERS.length} waiting token requests`);
      
      if (this.token) {
        // Resolve all waiters with the new token
        TOKEN_REFRESH_WAITERS.forEach(waiter => {
          waiter.resolve(this.token!);
        });
      } else {
        // Reject all waiters if no token is available
        const error = new Error("Token refresh failed");
        TOKEN_REFRESH_WAITERS.forEach(waiter => {
          waiter.reject(error);
        });
      }
      
      // Clear the waiters array
      TOKEN_REFRESH_WAITERS = [];
    }
  }

  /**
   * Check if current token is still valid
   */
  hasValidToken(): boolean {
    return (
      !!this.token &&
      !!this.expiresAt &&
      this.expiresAt > Date.now() + this.tokenValidityBuffer
    );
  }

  /**
   * Wait for an in-progress token refresh
   */
  private async waitForRefresh(): Promise<string> {
    if (!this.refreshPromise) {
      return this.refreshToken();
    }

    try {
      const tokenInfo = await this.refreshPromise;
      return tokenInfo.token;
    } catch (error) {
      // If waiting for refresh failed, try again
      this.refreshInProgress = false;
      return this.refreshToken();
    }
  }

  /**
   * Refresh the token through API request
   */
  private async refreshToken(): Promise<string> {
    console.log("Starting token refresh process");
    this.refreshInProgress = true;
    
    // Check throttle before initiating the request
    if (!this.canMakeTokenRequest()) {
      console.log("Token refresh is being throttled, applying delay");
      await this.delayForThrottle();
    }
    
    this.refreshPromise = this.requestNewToken();

    try {
      const tokenInfo = await this.refreshPromise;
      this.token = tokenInfo.token;
      this.expiresAt = tokenInfo.expiresAt;
      this.saveTokenToStorage(tokenInfo);
      
      console.log("Token refresh completed successfully");
      
      // Notify waiting calls that token is refreshed
      this.notifyTokenRefreshed();
      
      return tokenInfo.token;
    } catch (error) {
      console.error("Failed to refresh token:", error);
      throw error;
    } finally {
      this.refreshInProgress = false;
      this.refreshPromise = null;
    }
  }

  /**
   * Check if we should throttle token requests (prevent too many in a short time)
   */
  private canMakeTokenRequest(): boolean {
    try {
      const lastRequestTime = localStorage.getItem(TOKEN_THROTTLE_KEY);
      if (!lastRequestTime) return true;
      
      const lastTime = parseInt(lastRequestTime, 10);
      const now = Date.now();
      
      return now - lastTime > TOKEN_THROTTLE_INTERVAL;
    } catch (e) {
      return true; // If localStorage fails, don't throttle
    }
  }
  
  /**
   * Delay execution for throttling purposes
   */
  private async delayForThrottle(): Promise<void> {
    try {
      const lastRequestTime = localStorage.getItem(TOKEN_THROTTLE_KEY);
      if (!lastRequestTime) return;
      
      const lastTime = parseInt(lastRequestTime, 10);
      const now = Date.now();
      const timeToWait = Math.max(0, TOKEN_THROTTLE_INTERVAL - (now - lastTime));
      
      if (timeToWait > 0) {
        console.log(`Throttling token request, waiting ${timeToWait}ms`);
        await new Promise(resolve => setTimeout(resolve, timeToWait));
      }
    } catch (e) {
      // If there's an error, don't delay
    }
  }

  /**
   * Update the throttle timestamp
   */
  private updateThrottleTimestamp(): void {
    try {
      localStorage.setItem(TOKEN_THROTTLE_KEY, Date.now().toString());
    } catch (e) {
      // Ignore errors
    }
  }

  /**
   * Perform the actual token request
   * Uses two approaches:
   * 1. Ask for token using userId from localStorage (checking both naming conventions)
   * 2. Fall back to checking existing session
   */
  private async requestNewToken(): Promise<TokenInfo> {
    // Check throttle first
    if (!this.canMakeTokenRequest()) {
      console.log("Token requests are being throttled, applying delay");
      await this.delayForThrottle();
    }
    
    // Record this request time for throttling
    this.updateThrottleTimestamp();
    
    // First try to get token using the cached user ID (try both possible keys)
    const userId = localStorage.getItem('userId') || localStorage.getItem('somie_user_id');
    
    if (userId) {
      try {
        console.log(`Attempting to refresh token for user ID: ${userId}`);
        
        // Use enhanced fetch options with cache control
        const response = await fetch(`/api/auth/token-from-id?userId=${userId}&cacheBuster=${Date.now()}`, {
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache'
          },
          credentials: 'include'
        });
        
        if (response.ok) {
          const data = await response.json();
          
          // Store userId in both formats for compatibility
          localStorage.setItem('userId', userId);
          localStorage.setItem('somie_user_id', userId);
          
          // Parse token to get expiration
          const expiresAt = this.getExpiryFromToken(data.authToken);
          
          return {
            token: data.authToken,
            expiresAt
          };
        } else {
          console.warn(`Token refresh failed with status: ${response.status}`);
        }
      } catch (error) {
        console.warn("Failed to get token from userId, falling back to session check:", error);
      }
    }
    
    // Fall back to session-based auth
    try {
      console.log("Attempting to get token from session");
      // Use direct fetch for session-based auth since apiRequest doesn't support custom headers
      const response = await fetch('/api/auth/token?cacheBuster=' + Date.now(), {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        const expiresAt = this.getExpiryFromToken(data.authToken);
        
        return {
          token: data.authToken,
          expiresAt
        };
      } else {
        console.warn(`Session-based token refresh failed with status: ${response.status}`);
      }
    } catch (error) {
      console.error("All token refresh attempts failed:", error);
    }
    
    throw new Error("Failed to refresh authentication token");
  }

  /**
   * Clear the token (for logout)
   */
  clearToken() {
    this.token = null;
    this.expiresAt = null;
    
    // Clear all possible token & user ID storage keys
    localStorage.removeItem('somie_auth_token');
    localStorage.removeItem('somie_token_expiry');
    localStorage.removeItem('somie_user_id');
    localStorage.removeItem('userId');
    localStorage.removeItem('authToken');
    
    console.log('All token and user ID data cleared from storage');
  }

  /**
   * Parse JWT token to get expiration time
   */
  private getExpiryFromToken(token: string): number {
    try {
      // Get the payload part of the JWT
      const parts = token.split('.');
      if (parts.length !== 3) {
        throw new Error("Invalid token format");
      }
      
      // Decode the payload
      const payload = JSON.parse(atob(parts[1]));
      
      // Get expiration from payload
      if (payload.exp) {
        return payload.exp * 1000; // Convert to milliseconds
      }
      
      // Default expiration if not in token (24 hours)
      return Date.now() + (24 * 60 * 60 * 1000);
    } catch (error) {
      console.warn("Failed to parse token expiry:", error);
      // Default expiration (24 hours)
      return Date.now() + (24 * 60 * 60 * 1000);
    }
  }

  /**
   * Save token to localStorage for persistence
   * Ensures consistency across different naming conventions
   */
  private saveTokenToStorage(tokenInfo: TokenInfo) {
    try {
      // Save token in all formats for maximum compatibility
      localStorage.setItem('somie_auth_token', tokenInfo.token);
      localStorage.setItem('authToken', tokenInfo.token);
      
      // Save expiry
      localStorage.setItem('somie_token_expiry', tokenInfo.expiresAt.toString());
      
      console.log(`Saved token to storage, valid until ${new Date(tokenInfo.expiresAt).toLocaleString()}`);
    } catch (error) {
      console.warn("Failed to save token to storage:", error);
    }
  }

  /**
   * Load token from localStorage
   * Checks multiple storage keys for compatibility with different naming conventions
   */
  private loadTokenFromStorage() {
    try {
      // Check multiple token storage keys (in order of preference)
      const token = 
        localStorage.getItem('somie_auth_token') || 
        localStorage.getItem('authToken');
      
      // If we found a token directly, try to get its expiry
      if (token) {
        let expiry: number | null = null;
        
        // Try to get explicit expiry
        const expiryStr = localStorage.getItem('somie_token_expiry');
        if (expiryStr) {
          expiry = parseInt(expiryStr, 10);
        } else {
          // Try to extract expiry from the token itself
          expiry = this.getExpiryFromToken(token);
        }
        
        // Only set if we have a valid expiry and it's not expired
        if (expiry && expiry > Date.now()) {
          console.log(`Loaded cached token from storage, valid until ${new Date(expiry).toLocaleString()}`);
          this.token = token;
          this.expiresAt = expiry;
          
          // Make sure we have consistent storage values
          this.saveTokenToStorage({ token, expiresAt: expiry });
          return;
        }
      }
      
      console.log("No valid token found in storage or token has expired");
    } catch (error) {
      console.warn("Failed to load token from storage:", error);
    }
  }

  /**
   * Notify waiting processes that token is refreshed
   */
  private notifyTokenRefreshed() {
    tokenRefreshCallbacks.forEach(callback => callback());
  }

  /**
   * Register for token refresh notifications
   */
  onTokenRefresh(callback: () => void): () => void {
    tokenRefreshCallbacks.push(callback);
    
    // Return unsubscribe function
    return () => {
      const index = tokenRefreshCallbacks.indexOf(callback);
      if (index !== -1) {
        tokenRefreshCallbacks.splice(index, 1);
      }
    };
  }
}

// Export singleton instance
export const tokenManager = new TokenManager();

// Helper function to get auth header - checks multiple storage keys
export function getAuthHeader(): Record<string, string> {
  // Try multiple token storage keys for maximum compatibility
  const token = 
    localStorage.getItem('somie_auth_token') || 
    localStorage.getItem('authToken');
    
  return token ? { 'Authorization': `Bearer ${token}` } : {};
}