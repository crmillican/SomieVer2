import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth, ensureAuthenticated, generateAuthToken, validateAuthToken, ensureAuthenticatedWithToken } from "./auth";
import { storage } from "./storage";
import { verificationService } from "./services/verification";
import { z } from "zod";
import {
  insertBusinessProfileSchema,
  insertInfluencerProfileSchema,
  insertOfferSchema,
  insertPostSubmissionSchema,
  type OfferClaim,
  type BusinessProfile,
  type Offer,
  type InfluencerProfile,
} from "@shared/schema";
import axios from "axios";
import { testInstagramToken, socialMetricsService } from "./services/social-metrics";
import { geolocationService } from "./services/geolocation";
import { rateCalculatorService } from "./services/rate-calculator";
import { randomBytes } from "crypto";
import { promisify } from "util";
import { offerCreationService } from "./services/offer-creation";
import { registerAdminRoutes } from "./routes/admin";
import path from "path";
import { setupWebSocketServer } from "./websocket";
import syncRoutes from "./routes/sync";
import { registerWebSocketRoute } from "./routes/websocket-route";

const randomBytesAsync = promisify(randomBytes);

export async function registerRoutes(app: Express): Promise<Server> {
  // Serve projections files
  app.get('/revenue-projections', (req, res) => {
    res.sendFile('diagnostic.html', { root: '.' });
  });
  
  app.get('/projections', (req, res) => {
    res.sendFile('projections.html', { root: '.' });
  });
  
  app.get('/revenue-projections-interactive', (req, res) => {
    res.sendFile('revenue-projections-improved.html', { root: '.' });
  });
  setupAuth(app);

  // Serve diagnostic HTML directly (without authentication)
  // Session info endpoint (for diagnostic tool)
  app.get('/api/session-info', (req, res) => {
    res.json({
      sessionID: req.sessionID,
      isAuthenticated: req.isAuthenticated(),
      hasUser: Boolean(req.user),
      hasAuthHeader: Boolean(req.headers.authorization),
    });
  });
  
  // Create a test user and return it with an auth token
  // This bypasses normal registration for testing purposes
  app.get('/api/create-test-user', async (req, res) => {
    console.log('Creating test user for diagnostics');
    try {
      // Check if test user already exists
      let testUser = await storage.getUserByUsername('testuser');
      
      if (!testUser) {
        // Create a new test user with a plain password
        // In a real app we'd use hashing, but for this test user we'll keep it simple
        testUser = await storage.createUser({
          username: 'testuser',
          password: 'password', // Using plain password for test user only
          userType: 'business',
          createdAt: new Date(),
          isTest: true,
        });
        console.log('Created new test user:', testUser.id);
      } else {
        console.log('Using existing test user:', testUser.id);
      }
      
      // Generate auth token for the test user
      const authToken = generateAuthToken(testUser.id);
      
      // Force login the test user
      if (req.login) {
        req.login(testUser, (err) => {
          if (err) {
            console.error('Error logging in test user:', err);
          } else {
            console.log('Test user logged in successfully');
          }
        });
      }
      
      // Return user info and token
      const { password, ...userWithoutPassword } = testUser;
      res.json({
        message: 'Test user created and logged in',
        user: userWithoutPassword,
        authToken,
      });
    } catch (error) {
      console.error('Error creating test user:', error);
      res.status(500).json({ message: 'Error creating test user' });
    }
  });

  app.get('/diagnostic', (req, res) => {
    // Create a simple HTML diagnostic page on the fly
    const diagnosticHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>SOMIE Authentication Diagnostic</title>
      <style>
        body { font-family: system-ui, sans-serif; line-height: 1.5; padding: 2rem; max-width: 800px; margin: 0 auto; }
        h1 { color: #2563eb; }
        .card { border: 1px solid #e5e7eb; border-radius: 0.5rem; padding: 1rem; margin-bottom: 1rem; }
        .success { background-color: #d1fae5; border-color: #34d399; }
        .error { background-color: #fee2e2; border-color: #f87171; }
        button { background-color: #2563eb; color: white; border: none; border-radius: 0.25rem; padding: 0.5rem 1rem; cursor: pointer; }
        button:hover { background-color: #1d4ed8; }
        pre { background-color: #f3f4f6; padding: 1rem; border-radius: 0.25rem; overflow: auto; }
      </style>
    </head>
    <body>
      <h1>SOMIE Diagnostic Tool</h1>
      <div class="card">
        <h2>Session Information</h2>
        <p>Session ID: <span id="sessionId">Checking...</span></p>
        <p>Authentication Status: <span id="authStatus">Checking...</span></p>
        <p>User ID: <span id="userId">Checking...</span></p>
        <p>User Type: <span id="userType">Checking...</span></p>
      </div>
      <div class="card">
        <h2>Local Storage</h2>
        <p>User ID in localStorage: <span id="localStorageUserId">Checking...</span></p>
        <p>Auth Token in localStorage: <span id="localStorageToken">Checking...</span></p>
      </div>
      <div class="card">
        <h2>Actions</h2>
        <button id="clearStorageBtn">Clear Local Storage</button>
        <button id="clearCookiesBtn">Clear Cookies</button>
        <button id="testLoginBtn">Test Login (user1/password)</button>
        <button id="createTestUserBtn">Create & Login Test User</button>
      </div>
      <div class="card">
        <h2>API Test Results</h2>
        <pre id="apiResults">Click a button to test...</pre>
      </div>
      
      <script>
        // Show localStorage data
        document.getElementById('localStorageUserId').textContent = localStorage.getItem('userId') || 'Not found';
        document.getElementById('localStorageToken').textContent = localStorage.getItem('authToken') ? 'Present (hidden)' : 'Not found';
        
        // Clear storage button
        document.getElementById('clearStorageBtn').addEventListener('click', () => {
          localStorage.clear();
          document.getElementById('localStorageUserId').textContent = 'Cleared';
          document.getElementById('localStorageToken').textContent = 'Cleared';
        });
        
        // Clear cookies button
        document.getElementById('clearCookiesBtn').addEventListener('click', () => {
          document.cookie.split(";").forEach(function(c) {
            document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
          });
          document.getElementById('apiResults').textContent = 'Cookies cleared. Refresh page to see effects.';
        });
        
        // Test login with test credentials
        document.getElementById('testLoginBtn').addEventListener('click', async () => {
          try {
            const response = await fetch('/api/auth/login', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ username: 'user1', password: 'password' }),
              credentials: 'include'
            });
            
            const result = await response.json();
            document.getElementById('apiResults').textContent = JSON.stringify(result, null, 2);
            
            if (response.ok) {
              localStorage.setItem('userId', result.id);
              localStorage.setItem('authToken', result.authToken);
              document.getElementById('localStorageUserId').textContent = result.id;
              document.getElementById('localStorageToken').textContent = 'Present (hidden)';
            }
          } catch (error) {
            document.getElementById('apiResults').textContent = 'Error: ' + error.message;
          }
        });
        
        // Check auth status
        async function checkAuth() {
          try {
            const response = await fetch('/api/user', {
              credentials: 'include',
              headers: {
                'Authorization': 'Bearer ' + localStorage.getItem('authToken')
              }
            });
            
            if (response.ok) {
              const userData = await response.json();
              document.getElementById('authStatus').textContent = 'Authenticated';
              document.getElementById('authStatus').className = 'success';
              document.getElementById('userId').textContent = userData.id;
              document.getElementById('userType').textContent = userData.userType;
            } else {
              document.getElementById('authStatus').textContent = 'Not authenticated';
              document.getElementById('authStatus').className = 'error';
              document.getElementById('userId').textContent = 'N/A';
              document.getElementById('userType').textContent = 'N/A';
            }
          } catch (error) {
            document.getElementById('authStatus').textContent = 'Error: ' + error.message;
            document.getElementById('authStatus').className = 'error';
          }
        }
        
        // Get session info
        fetch('/api/session-info', { credentials: 'include' })
          .then(response => response.json())
          .then(data => {
            document.getElementById('sessionId').textContent = data.sessionID || 'Not available';
          })
          .catch(error => {
            document.getElementById('sessionId').textContent = 'Error: ' + error.message;
          });
        
        // Create and login test user
        document.getElementById('createTestUserBtn').addEventListener('click', async () => {
          try {
            const response = await fetch('/api/create-test-user', {
              credentials: 'include'
            });
            
            const result = await response.json();
            document.getElementById('apiResults').textContent = JSON.stringify(result, null, 2);
            
            if (response.ok) {
              localStorage.setItem('userId', result.user.id);
              localStorage.setItem('authToken', result.authToken);
              document.getElementById('localStorageUserId').textContent = result.user.id;
              document.getElementById('localStorageToken').textContent = 'Present (hidden)';
              
              // Refresh auth status
              checkAuth();
            }
          } catch (error) {
            document.getElementById('apiResults').textContent = 'Error: ' + error.message;
          }
        });

        // Check auth status on load
        checkAuth();
      </script>
    </body>
    </html>
    `;
    
    res.send(diagnosticHtml);
  });

  // User authentication endpoint
  app.get("/api/user", async (req, res) => {
    // Check JWT token in header first, then fall back to session auth
    const authHeader = req.headers.authorization;
    console.log('GET /api/user called:', {
      sessionID: req.sessionID,
      isAuthenticated: req.isAuthenticated(),
      hasSessionUser: Boolean(req.user),
      hasAuthHeader: Boolean(authHeader),
      session: req.session
    });

    // Try to authenticate with token if there's an auth header
    if (!req.isAuthenticated() && authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      console.log('Found auth token in request, validating...');
      
      const userId = validateAuthToken(token);
      if (userId) {
        try {
          const user = await storage.getUser(userId);
          if (user) {
            console.log('User authenticated via token:', user.id);
            req.user = user;
            res.setHeader('X-Auth-Method', 'token');
          }
        } catch (error) {
          console.error('Error fetching user for token:', error);
        }
      }
    }

    // Check if user is authenticated (either by session or token)
    if (!req.user) {
      console.log('User not authenticated via any method');
      return res.status(401).json({ message: "Not authenticated" });
    }

    console.log('User authenticated, returning data for user:', req.user.id);
    const { password, ...userWithoutPassword } = req.user;
    
    // Generate a fresh auth token for the client to use
    const authToken = generateAuthToken(req.user.id);
    
    res.json({
      ...userWithoutPassword,
      authToken
    });
  });
  
  // Explicit endpoint to get an auth token for a logged-in user
  app.get("/api/auth/token", ensureAuthenticated, (req, res) => {
    console.log('Generating auth token for user:', req.user.id);
    const token = generateAuthToken(req.user.id);
    res.json({ token });
  });
  
  // Endpoint to get an auth token from a user ID (for localStorage fallback)
  // Create a simple rate limiter for token requests
  const tokenRateLimiter = {
    requests: new Map<number, {count: number, timestamp: number}>(),
    cleanupInterval: null as NodeJS.Timeout | null,
    
    init() {
      // Clean up old entries every 5 minutes
      this.cleanupInterval = setInterval(() => {
        const now = Date.now();
        for (const [userId, data] of this.requests.entries()) {
          if (now - data.timestamp > 5 * 60 * 1000) { // 5 minutes
            this.requests.delete(userId);
          }
        }
      }, 5 * 60 * 1000); // Run every 5 minutes
      
      return this;
    },
    
    // Check if a user is rate limited
    isLimited(userId: number): boolean {
      const now = Date.now();
      const data = this.requests.get(userId);
      
      // First request or old request (>10 seconds ago) - not limited
      if (!data || now - data.timestamp > 10000) {
        this.requests.set(userId, { count: 1, timestamp: now });
        return false;
      }
      
      // If more than 3 requests in the last 10 seconds, rate limit
      if (data.count >= 3) {
        // Update timestamp to extend the rate limiting period
        this.requests.set(userId, { count: data.count + 1, timestamp: now });
        return true;
      }
      
      // Increment the counter
      this.requests.set(userId, { count: data.count + 1, timestamp: data.timestamp });
      return false;
    }
  }.init();

  app.get("/api/auth/token-from-id", async (req, res) => {
    try {
      const userIdStr = req.query.userId as string;
      const cacheBuster = req.query.t || req.query.cacheBuster;
      
      if (!userIdStr) {
        console.log('Missing userId parameter in token-from-id request');
        return res.status(400).json({ message: "Missing userId parameter" });
      }
      
      const userId = parseInt(userIdStr, 10);
      if (isNaN(userId)) {
        console.log('Invalid userId format in token-from-id request:', userIdStr);
        return res.status(400).json({ message: "Invalid userId format" });
      }
      
      // Apply rate limiting
      if (tokenRateLimiter.isLimited(userId)) {
        console.log(`Rate limiting token requests for user ${userId} - too many requests`);
        return res.status(429).json({ 
          message: "Too many token requests, please try again later",
          retryAfter: 10 // Suggest retry after 10 seconds
        });
      }
      
      console.log(`Attempting to generate token from user ID: ${userId} (cache bust: ${cacheBuster || 'none'})`);
      
      // Verify the user exists in the database
      const user = await storage.getUser(userId);
      if (!user) {
        console.log(`User not found for ID: ${userId}`);
        return res.status(404).json({ message: "User not found" });
      }
      
      // Generate a token for the user with longer expiry (1 week) to reduce refresh needs
      const authToken = generateAuthToken(userId, '7d');
      console.log(`Generated token for user ${userId} with 7-day expiry`);
      
      // Also log the user in via session for dual auth (token + session)
      if (req.login) {
        req.login(user, (err) => {
          if (err) {
            console.error("Error logging in user via session during token generation:", err);
          } else {
            console.log(`User ${userId} logged in via session during token generation`);
          }
          
          // Set cache-control headers to prevent browser caching
          res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
          res.setHeader('Pragma', 'no-cache');
          res.setHeader('Expires', '0');
          
          // Return the token with its expiry info
          return res.json({ 
            authToken,
            userType: user.userType,
            expiresIn: 7 * 24 * 60 * 60 // 7 days in seconds
          });
        });
      } else {
        // If req.login is not available, just return the token
        console.log('req.login not available, returning token only');
        
        // Set cache-control headers to prevent browser caching
        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
        
        return res.json({ 
          authToken,
          userType: user.userType,
          expiresIn: 7 * 24 * 60 * 60 // 7 days in seconds
        });
      }
    } catch (error) {
      console.error("Error in token-from-id endpoint:", error);
      res.status(500).json({ message: "Server error generating token" });
    }
  });

  // Business profile routes with enhanced error handling and direct auth fallback
  app.post("/api/business-profile", async (req, res) => {
    console.log('Creating business profile:', {
      isAuthenticated: req.isAuthenticated(),
      user: req.user,
      session: req.session,
      sessionID: req.sessionID, 
      hasUserId: Boolean(req.session?.userId),
      sessionUserId: req.session?.userId,
      cookies: req.headers.cookie || 'no cookies',
      authorization: req.headers.authorization || 'no auth header',
      body: req.body
    });

    // Check for direct user ID in request body as a last resort fallback
    let userId = null;
    
    // Option 1: Get user from session (standard authentication)
    if (req.isAuthenticated() && req.user) {
      console.log('User authenticated via standard session');
      userId = req.user.id;
    } 
    // Option 2: Get user from session.userId
    else if (req.session && req.session.userId) {
      userId = req.session.userId;
      console.log('User identified via session.userId:', userId);
      
      try {
        const user = await storage.getUser(userId);
        if (user) {
          console.log('User found, temporarily restoring user for request:', user.id);
          req.user = user;
        } else {
          console.log('User not found for session userId:', userId);
          userId = null; // Reset userId since user wasn't found
        }
      } catch (err) {
        console.error('Error restoring session:', err);
        userId = null; // Reset userId due to error
      }
    }
    
    // Option 3: Get user from request body as direct fallback
    if (!userId && req.body && req.body.userId) {
      const requestUserId = parseInt(req.body.userId);
      console.log('Attempting to identify user via request body userId:', requestUserId);
      
      try {
        const user = await storage.getUser(requestUserId);
        if (user) {
          console.log('User found via request body userId, proceeding with request:', user.id);
          userId = user.id;
          req.user = user;
        } else {
          console.log('User not found for request body userId:', requestUserId);
        }
      } catch (err) {
        console.error('Error finding user from request body userId:', err);
      }
    }
    
    // If we still don't have a userId, return 401
    if (!userId) {
      console.log('No valid user ID found via any method, rejecting request');
      return res.status(401).json({ 
        message: "Not authenticated - please log in again", 
        code: "NO_VALID_USER" 
      });
    }

    // Schema validation
    const result = insertBusinessProfileSchema.safeParse(req.body);
    if (!result.success) {
      console.log('Validation failed:', result.error);
      return res.status(400).json(result.error);
    }

    try {
      // Make sure we use the user ID from the authenticated user, restored session or request body
      const userId = req.user?.id || result.data.userId;
      console.log(`Creating business profile for user ID: ${userId}`);
      
      // Set enhanced cookie headers to help maintain session
      res.setHeader('X-Auth-User-ID', userId.toString());
      res.setHeader('X-Session-ID', req.sessionID);
      
      // Create the profile
      const profile = await storage.createBusinessProfile({
        ...result.data,
        userId: userId,
        isTest: false
      });
      
      console.log('Profile created successfully:', profile);
      
      // Return the created profile
      res.status(201).json(profile);
    } catch (error) {
      console.error('Error creating profile:', error);
      res.status(500).json({ message: "Failed to create business profile", error: String(error) });
    }
  });

  app.get("/api/business-profile", ensureAuthenticatedWithToken, async (req: any, res: any) => {
    try {
      console.log('Fetching business profile for user:', req.user.id);
      const profile = await storage.getBusinessProfileByUserId(req.user.id);

      if (!profile) {
        console.log('Business profile not found for user:', req.user.id);
        return res.status(404).json({
          message: "Business profile not found",
          code: "PROFILE_NOT_FOUND"
        });
      }

      console.log('Found business profile:', profile);
      res.json(profile);
    } catch (error) {
      console.error('Error fetching business profile:', error);
      res.status(500).json({ message: "Failed to fetch business profile" });
    }
  });

  // Influencer profile routes
  app.post("/api/influencer-profile", async (req, res) => {
    console.log('Creating/Updating influencer profile:', {
      isAuthenticated: req.isAuthenticated(),
      user: req.user,
      body: req.body
    });

    // Check for a valid userId in the request body if not authenticated
    if (!req.isAuthenticated()) {
      console.log('User not authenticated via session, checking for userId in request body or headers');
      
      // Try to get user ID from X-User-ID header
      const userIdFromHeader = req.headers['x-user-id'] ? parseInt(req.headers['x-user-id'].toString()) : null;
      // Or from the request body
      const userIdFromBody = req.body.userId ? parseInt(req.body.userId) : null;
      
      const userId = userIdFromHeader || userIdFromBody;
      
      if (!userId) {
        console.log('No userId provided in request body or headers');
        return res.status(401).json({ message: "Authentication required. Please log in again." });
      }
      
      console.log('Attempting to verify user ID:', userId);
      
      // Verify the user exists
      try {
        const user = await storage.getUser(userId);
        if (!user) {
          console.log('Invalid userId provided:', userId);
          return res.status(401).json({ message: "Invalid user ID. Please log in again." });
        }
        
        console.log('User verified by ID:', user.id);
        // Set the authenticated user from the database for this request
        req.user = user;
      } catch (error) {
        console.error('Error verifying user:', error);
        return res.status(500).json({ message: "Error verifying user identity" });
      }
    }

    // Make sure socialHandle is at least set to empty string if not provided
    const formData = {
      ...req.body,
      socialHandle: req.body.socialHandle || '',
    };

    const result = insertInfluencerProfileSchema.safeParse(formData);
    if (!result.success) {
      console.log('Validation failed:', result.error);
      return res.status(400).json(result.error);
    }

    try {
      // Make sure we use the user ID from the authenticated user, restored session or request body
      const userId = req.user?.id || result.data.userId;
      console.log(`Using user ID for influencer profile creation/update: ${userId}`);
      
      // Check if profile already exists
      const existingProfile = await storage.getInfluencerProfileByUserId(userId);
      
      // Attempt to fetch social media metrics if not provided
      let followerCount = result.data.followerCount;
      let engagementRate = result.data.engagementRate;
      
      // If follower count or engagement rate is not provided (or is 0), try to fetch from social media
      if (!followerCount || !engagementRate || followerCount === 0 || engagementRate === 0) {
        // Try to get the URL from the appropriate platform field
        let socialUrl = null;
        if (result.data.platform === 'instagram' && result.data.instagramUrl) {
          socialUrl = result.data.instagramUrl;
        } else if (result.data.platform === 'tiktok' && result.data.tiktokUrl) {
          socialUrl = result.data.tiktokUrl;
        } else if (result.data.platform === 'youtube' && result.data.youtubeUrl) {
          socialUrl = result.data.youtubeUrl;
        }
        
        console.log('Fetching social media metrics for URL:', socialUrl);
        
        if (socialUrl) {
          try {
            const metrics = await socialMetricsService.getMetricsFromUrl(socialUrl);
            
            if (metrics) {
              console.log('Successfully fetched social media metrics:', metrics);
              // Only update metrics if they're not already provided manually
              followerCount = followerCount || metrics.followers;
              engagementRate = engagementRate || metrics.engagementRate;
              
              // If display name is empty, use the one from social media
              if (!result.data.displayName && metrics.displayName) {
                result.data.displayName = metrics.displayName;
              }
            } else {
              console.log('No metrics returned from social media service');
            }
          } catch (metricsError) {
            console.error('Error fetching social media metrics:', metricsError);
            // Continue with manual values if metrics fetch fails
          }
        }
      }

      // The schema transform has already set the appropriate URL fields
      const profileData = {
        ...result.data,
        userId: userId, // Use the resolved userId from above
        followerCount: followerCount || 0,
        engagementRate: engagementRate || 0,
        credibilityScore: 50,
        strikes: 0,
        isTest: false,
      };

      let profile;
      if (existingProfile) {
        profile = await storage.updateInfluencerProfile(existingProfile.id, profileData);
        console.log('Updated influencer profile with metrics:', profile);
      } else {
        profile = await storage.createInfluencerProfile(profileData);
        console.log('Created new influencer profile with metrics:', profile);
      }

      res.status(201).json(profile);
    } catch (error) {
      console.error('Error managing influencer profile:', error);
      res.status(500).json({ message: "Failed to manage influencer profile" });
    }
  });

  app.get("/api/influencer-profile", ensureAuthenticatedWithToken, async (req: any, res: any) => {
    console.log('Fetching influencer profile:', {
      user: req.user,
      authMethod: res.getHeader('X-Auth-Method') || 'session'
    });

    try {
      const profile = await storage.getInfluencerProfileByUserId(req.user.id);
      console.log('Found profile:', profile);

      if (!profile) {
        console.log('Profile not found for user:', req.user.id);
        return res.status(404).json({
          message: "Profile not found",
          code: "PROFILE_NOT_FOUND"
        });
      }

      res.json(profile);
    } catch (error) {
      console.error('Error fetching influencer profile:', error);
      res.status(500).json({ message: "Failed to fetch influencer profile" });
    }
  });

  // Get offers - handles both business and influencer users
  app.get("/api/offers", ensureAuthenticatedWithToken, async (req, res) => {
    console.log('Fetching offers:', {
      isAuthenticated: req.isAuthenticated(),
      user: req.user,
      userType: req.user?.userType,
      authMethod: res.getHeader('X-Auth-Method') || 'session'
    });

    try {
      // Handle differently based on user type
      if (req.user?.userType === 'business') {
        // For business users - return their own offers
        const businessProfile = await storage.getBusinessProfileByUserId(req.user.id);
        if (!businessProfile) {
          console.log('No business profile found for user:', req.user.id);
          return res.status(404).json({
            message: "Profile not found",
            code: "PROFILE_NOT_FOUND"
          });
        }

        console.log('Found business profile:', businessProfile);
        
        // Get offers for this business
        const offers = await storage.getOffersByBusinessId(businessProfile.id);
        const totalOffers = await storage.getOffersCount(businessProfile.id);
        
        console.log(`Found ${offers.length} offers for business ID ${businessProfile.id}`);
        
        return res.json({
          offers,
          pagination: {
            total: String(totalOffers),
            page: "1",
            pageSize: String(offers.length)
          }
        });
      } else {
        // For influencer users - return matching offers
        const influencerProfile = await storage.getInfluencerProfileByUserId(req.user!.id);
        if (!influencerProfile) {
          console.log('No influencer profile found for user:', req.user!.id);
          return res.status(404).json({
            message: "Profile not found",
            code: "PROFILE_NOT_FOUND"
          });
        }

        console.log('Found influencer profile:', influencerProfile);

        // Import the matching service directly to ensure consistency with the match scores
        const { matchingService } = await import('./services/matching');
        
        // Get offers with optimized ranking from storage
        const offers = await storage.getMatchingOffers(influencerProfile);
        console.log(`Found ${offers.length} matching offers with intelligent algorithm`);

        // Fetch business details for each offer and calculate match scores
        const offersWithBusinessAndScores = await Promise.all(
          offers.map(async (offer) => {
            try {
              const business = await storage.getBusinessProfileById(offer.businessId);
              
              // Calculate detailed match score for UI display
              const matchScore = matchingService.calculateMatchScore(influencerProfile, offer);
            
              return {
                ...offer,
                business: business ? {
                  id: business.id,
                  businessName: business.businessName,
                  industry: business.industry,
                  location: business.location,
                  description: business.description,
                  website: business.website,
                  instagramUrl: business.instagramUrl,
                  tiktokUrl: business.tiktokUrl,
                  youtubeUrl: business.youtubeUrl
                } : null,
                // Include match score details for the UI
                matchScore: matchScore.score,
                matchFactors: matchScore.matchFactors
              };
            } catch (error) {
              console.error('Error fetching business details for offer:', offer.id, error);
              return null;
            }
          })
        );

        // Filter out any null results from failed business lookups
        const validOffers = offersWithBusinessAndScores.filter(offer => offer !== null);

        console.log(`Returning ${validOffers.length} offers with match scores`);
        res.json(validOffers);
      }
    } catch (error) {
      console.error('Error fetching offers:', error);
      res.status(500).json({ message: "Failed to fetch offers" });
    }
  });

  app.get("/api/influencer-profile/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    const profile = await storage.getInfluencerProfileById(parseInt(req.params.id));
    if (!profile) return res.status(404).json({ message: "Influencer not found" });
    res.json(profile);
  });


  // Offer routes
  app.post("/api/offers", async (req, res) => {
    console.log('Creating offer:', {
      isAuthenticated: req.isAuthenticated(),
      user: req.user,
      body: req.body
    });

    if (!req.isAuthenticated()) {
      console.log('User not authenticated');
      return res.sendStatus(401);
    }

    const businessProfile = await storage.getBusinessProfileByUserId(req.user.id);
    if (!businessProfile) {
      console.log('Business profile not found for user:', req.user.id);
      return res.sendStatus(403);
    }

    // Handle floating point engagement rate by multiplying by 10 to store as integer
    // This allows for 1 decimal place precision (e.g., 4.2% becomes 42)
    const adjustedBody = {
      ...req.body,
      minEngagement: req.body.minEngagement ? Math.round(parseFloat(req.body.minEngagement) * 10) : req.body.minEngagement
    };
    
    const result = insertOfferSchema.safeParse({
      ...adjustedBody,
      createdAt: new Date(),
      status: "active",
      businessId: businessProfile.id
    });

    if (!result.success) {
      console.log('Offer validation failed:', result.error);
      return res.status(400).json(result.error);
    }

    try {
      // Create a properly typed offer object with all required fields
      const offerData = {
        ...result.data,
        businessId: businessProfile.id,
        status: "active",
        isTest: false,
        createdAt: new Date(),
        // Default values for nullable fields
        location: result.data.location || null,
        rewardAmount: result.data.rewardAmount || null,
        audienceRequirements: null,
        optimizationData: null
      };
      
      const offer = await storage.createOffer(offerData);
      console.log('Offer created successfully:', offer);
      res.status(201).json(offer);
    } catch (error) {
      console.error('Error creating offer:', error);
      res.status(500).json({ message: "Failed to create offer" });
    }
  });

  // AI-driven offer creation endpoints
  
  // Get industry-specific template for offer creation
  app.get("/api/offers/template", ensureAuthenticatedWithToken, async (req: any, res: any) => {
    try {
      console.log('Generating industry-specific offer template');
      
      const businessProfile = await storage.getBusinessProfileByUserId(req.user.id);
      if (!businessProfile) {
        console.log('Business profile not found for user:', req.user.id);
        return res.status(404).json({ message: "Business profile not found" });
      }
      
      const template = offerCreationService.getIndustryTemplate(businessProfile);
      console.log('Generated template based on industry:', businessProfile.industry);
      
      res.json(template);
    } catch (error) {
      console.error('Error generating offer template:', error);
      res.status(500).json({ message: "Failed to generate offer template" });
    }
  });
  
  // Calculate optimized budget recommendation
  app.get("/api/offers/budget-recommendation", ensureAuthenticatedWithToken, async (req: any, res: any) => {
    try {
      const budget = parseInt(req.query.budget as string) || 0;
      const targetReach = parseInt(req.query.targetReach as string) || 0;
      const contentType = req.query.contentType as string || 'image';
      
      console.log('Generating budget recommendation:', { budget, targetReach, contentType });
      
      // Get business profile for industry information
      const businessProfile = await storage.getBusinessProfileByUserId(req.user.id);
      if (!businessProfile) {
        console.log('Business profile not found for user:', req.user.id);
        return res.status(404).json({ message: "Business profile not found" });
      }
      
      const recommendation = offerCreationService.calculateBudgetRecommendation(
        budget,
        targetReach,
        businessProfile.industry,
        contentType
      );
      
      console.log('Generated budget recommendation:', recommendation);
      res.json(recommendation);
    } catch (error) {
      console.error('Error generating budget recommendation:', error);
      res.status(500).json({ message: "Failed to generate budget recommendation" });
    }
  });
  
  // Generate offer match preview
  app.post("/api/offers/match-preview", ensureAuthenticatedWithToken, async (req: any, res: any) => {
    try {
      console.log('Generating match preview for offer criteria:', req.body);
      
      const matchPreview = await offerCreationService.generateMatchPreview({
        minFollowers: req.body.minFollowers,
        minEngagement: req.body.minEngagement,
        category: req.body.category,
        contentType: req.body.contentType,
        location: req.body.location,
        tags: req.body.tags
      });
      
      console.log('Generated match preview with potential matches:', matchPreview.potentialMatches);
      res.json(matchPreview);
    } catch (error) {
      console.error('Error generating match preview:', error);
      res.status(500).json({ message: "Failed to generate match preview" });
    }
  });
  
  // Generate content brief suggestions
  app.get("/api/offers/content-brief", ensureAuthenticatedWithToken, async (req: any, res: any) => {
    try {
      const category = req.query.category as string || 'general';
      const contentType = req.query.contentType as string || 'image';
      const platform = req.query.platform as string || 'instagram';
      
      console.log('Generating content brief suggestions:', { category, contentType, platform });
      
      const contentBrief = offerCreationService.generateContentBriefSuggestions(
        category,
        contentType,
        platform
      );
      
      console.log('Generated content brief suggestions');
      res.json(contentBrief);
    } catch (error) {
      console.error('Error generating content brief:', error);
      res.status(500).json({ message: "Failed to generate content brief" });
    }
  });
  
  // Suggest campaign objectives
  app.get("/api/offers/campaign-objectives", ensureAuthenticatedWithToken, async (req: any, res: any) => {
    try {
      const marketingGoal = req.query.marketingGoal as string || 'awareness';
      
      console.log('Generating campaign objective suggestions for goal:', marketingGoal);
      
      // Get business profile for industry information
      const businessProfile = await storage.getBusinessProfileByUserId(req.user.id);
      if (!businessProfile) {
        console.log('Business profile not found for user:', req.user.id);
        return res.status(404).json({ message: "Business profile not found" });
      }
      
      const objectives = offerCreationService.suggestCampaignObjectives(
        businessProfile.industry,
        marketingGoal
      );
      
      console.log('Generated campaign objective suggestions');
      res.json(objectives);
    } catch (error) {
      console.error('Error generating campaign objectives:', error);
      res.status(500).json({ message: "Failed to generate campaign objectives" });
    }
  });

  // Offer claims routes
  app.post("/api/offers/:offerId/claims", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    const influencerProfile = await storage.getInfluencerProfileByUserId(req.user.id);
    if (!influencerProfile) return res.sendStatus(403);

    // Check if offer exists
    const offer = await storage.getOfferById(parseInt(req.params.offerId));
    if (!offer) return res.status(404).json({ message: "Offer not found" });

    // Check if already claimed
    const existingClaim = await storage.getOfferClaimByInfluencerAndOffer(
      influencerProfile.id,
      parseInt(req.params.offerId)
    );

    if (existingClaim) {
      return res.status(400).json({ message: "Offer already claimed" });
    }

    try {
      // Create the claim
      const claim = await storage.createOfferClaim({
        offerId: parseInt(req.params.offerId),
        influencerId: influencerProfile.id,
        status: "incomplete",
        completedAt: null,
      });

      // Create notification for business
      await storage.createNotification({
        businessId: offer.businessId,
        title: "New Offer Claim",
        message: `Your offer "${offer.title}" has been claimed by an influencer`,
        type: "offer_claimed",
        read: false,
        relatedOfferId: offer.id,
        relatedInfluencerId: influencerProfile.id,
        createdAt: new Date(),
      });

      res.status(201).json(claim);
    } catch (error) {
      console.error('Error creating claim:', error);
      res.status(500).json({ message: "Failed to claim offer" });
    }
  });

  // Post submission routes
  app.post("/api/offers/claims/:claimId/posts", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    const result = insertPostSubmissionSchema.safeParse({
      ...req.body,
      claimId: parseInt(req.params.claimId),
    });

    if (!result.success) {
      return res.status(400).json(result.error);
    }

    try {
      // Update the claim status to pending
      await storage.updateOfferClaimStatus(
        parseInt(req.params.claimId),
        "pending"
      );

      // Create the submission
      const submission = await storage.createPostSubmission({
        ...result.data,
        verificationStatus: "pending",
        verificationDetails: null,
        lastVerified: null,
      });

      // Trigger verification asynchronously
      verificationService.verifyPost(submission.id).catch(console.error);

      res.status(201).json(submission);
    } catch (error) {
      console.error('Error creating post submission:', error);
      res.status(500).json({ message: 'Failed to create post submission' });
    }
  });

  // Business notification routes
  app.get("/api/business/notifications", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    const businessProfile = await storage.getBusinessProfileByUserId(req.user.id);
    if (!businessProfile) return res.sendStatus(403);

    const notifications = await storage.getUnreadNotifications(businessProfile.id);
    res.json(notifications);
  });

  app.post("/api/business/notifications/:id/read", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    await storage.markNotificationAsRead(parseInt(req.params.id));
    res.sendStatus(200);
  });

  app.get("/api/business/offers", ensureAuthenticatedWithToken, async (req, res) => {
    console.log('Getting offers for business:', {
      user: req.user,
      authMethod: res.getHeader('X-Auth-Method') || 'session'
    });

    const businessProfile = await storage.getBusinessProfileByUserId(req.user.id);
    if (!businessProfile) {
      console.log('Business profile not found');
      return res.sendStatus(403);
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const offset = (page - 1) * limit;

    try {
      const [offers, total] = await Promise.all([
        storage.getOffersByBusinessId(businessProfile.id, limit, offset),
        storage.getOffersCount(businessProfile.id)
      ]);

      res.json({
        offers,
        pagination: {
          total,
          pages: Math.ceil(total / limit),
          current: page,
          limit
        }
      });
    } catch (error) {
      console.error('Error fetching offers:', error);
      res.status(500).json({ message: "Failed to fetch offers" });
    }
  });

  // Get claims for an offer (business view)
  app.get("/api/business/offers/:offerId/claims", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    const businessProfile = await storage.getBusinessProfileByUserId(req.user.id);
    if (!businessProfile) return res.sendStatus(403);

    const claims = await storage.getClaimsByOfferId(parseInt(req.params.offerId));

    // Fetch influencer details for each claim
    const claimsWithInfluencer = await Promise.all(
      claims.map(async (claim) => {
        const influencer = await storage.getInfluencerProfileById(claim.influencerId);
        return {
          ...claim,
          influencer,
        };
      })
    );

    res.json(claimsWithInfluencer);
  });
  app.patch("/api/offers/claims/:claimId", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    const result = z.object({
      status: z.enum(["approved", "rejected", "completed"]),
      submissionUrl: z.string().optional(),
      verificationStatus: z.enum(["pending", "verified", "failed"]).optional(),
      verificationDetails: z.string().optional(),
    }).safeParse(req.body);

    if (!result.success) {
      return res.status(400).json(result.error);
    }

    const claim = await storage.updateOfferClaimStatus(
      parseInt(req.params.claimId),
      result.data.status
    );

    if (!claim) return res.sendStatus(404);
    res.json(claim);
  });

  app.get("/api/offers/claims/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    try {
      const claimId = parseInt(req.params.id);
      if (isNaN(claimId)) {
        return res.status(400).json({ message: "Invalid claim ID" });
      }

      const claim = await storage.getOfferClaimById(claimId);
      if (!claim) {
        return res.status(404).json({ message: "Claim not found" });
      }

      // Get the offer details
      const offer = await storage.getOfferById(claim.offerId);
      if (!offer) {
        return res.status(404).json({ message: "Offer not found" });
      }

      // Get the business details
      const business = await storage.getBusinessProfileById(offer.businessId);
      if (!business) {
        return res.status(404).json({ message: "Business not found" });
      }

      // Calculate deadline based on offer timeframe
      const deadline = new Date();
      deadline.setDate(deadline.getDate() + offer.timeframe);

      // Combine all the data
      const response = {
        id: claim.id,
        status: claim.status,
        createdAt: claim.createdAt ? claim.createdAt.toISOString() : new Date().toISOString(),
        completedAt: claim.completedAt ? claim.completedAt.toISOString() : null,
        deadline: deadline.toISOString(),
        timeframe: offer.timeframe,
        offer: {
          ...offer,
          business: business,
        },
      };

      res.json(response);
    } catch (error) {
      console.error('Error fetching claim details:', error);
      res.status(500).json({ message: "Failed to fetch claim details" });
    }
  });

  app.get("/api/offers/claims/:claimId/posts", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    const submissions = await storage.getPostSubmissionsByClaim(
      parseInt(req.params.claimId)
    );
    res.json(submissions);
  });


  app.patch("/api/offers/claims/:claimId/verify", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    const businessProfile = await storage.getBusinessProfileByUserId(req.user.id);
    if (!businessProfile) return res.sendStatus(403);

    const result = z.object({
      status: z.enum(["completed", "needs_changes"]),
      feedback: z.string().optional(),
    }).safeParse(req.body);

    if (!result.success) {
      return res.status(400).json(result.error);
    }

    const claim = await storage.updateOfferClaimStatus(
      parseInt(req.params.claimId),
      result.data.status === "completed" ? "completed" : "changes_needed"
    );

    if (!claim) return res.sendStatus(404);
    res.json(claim);
  });

  // Get claims for an influencer (influencer view)
  app.get("/api/offers/claims/influencer", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    try {
      const influencerProfile = await storage.getInfluencerProfileByUserId(req.user.id);
      if (!influencerProfile) return res.sendStatus(403);

      const claims = await storage.getClaimsByInfluencerId(influencerProfile.id);

      // Fetch offer details for each claim
      const claimsWithOffers = await Promise.all(
        claims.map(async (claim) => {
          const offer = await storage.getOfferById(claim.offerId);
          if (!offer) return null;

          const business = await storage.getBusinessProfileById(offer.businessId);
          if (!business) return null;

          // Calculate deadline
          const deadline = new Date();
          deadline.setDate(deadline.getDate() + offer.timeframe);

          return {
            id: claim.id,
            status: claim.status,
            createdAt: claim.createdAt ? claim.createdAt.toISOString() : new Date().toISOString(),
            completedAt: claim.completedAt ? claim.completedAt.toISOString() : null,
            deadline: deadline.toISOString(),
            timeframe: offer.timeframe,
            offer: {
              ...offer,
              business,
            },
          };
        })
      );

      // Filter out any null values from failed lookups
      const validClaims = claimsWithOffers.filter(claim => claim !== null);

      res.json(validClaims);
    } catch (error) {
      console.error('Error fetching influencer claims:', error);
      res.status(500).json({ message: "Failed to fetch claims" });
    }
  });

  // Message routes
  app.post("/api/offers/claims/:claimId/messages", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    const result = z.object({
      content: z.string().min(1),
    }).safeParse(req.body);

    if (!result.success) {
      return res.status(400).json(result.error);
    }

    try {
      const message = await storage.createMessage({
        claimId: parseInt(req.params.claimId),
        senderId: req.user.id,
        content: result.data.content,
        timestamp: new Date(),
      });
      res.status(201).json(message);
    } catch (error) {
      console.error('Error creating message:', error);
      res.status(500).json({ message: "Failed to send message" });
    }
  });

  app.get("/api/offers/claims/:claimId/messages", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    try {
      const messages = await storage.getMessagesByClaimId(parseInt(req.params.claimId));
      res.json(messages);
    } catch (error) {
      console.error('Error fetching messages:', error);
      res.status(500).json({ message: "Failed to fetch messages" });
    }
  });

  // Deliverable routes
  app.get("/api/offers/claims/:claimId/deliverables", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    try {
      const deliverables = await storage.getDeliverablesByClaimId(parseInt(req.params.claimId));
      res.json(deliverables);
    } catch (error) {
      console.error('Error fetching deliverables:', error);
      res.status(500).json({ message: "Failed to fetch deliverables" });
    }
  });

  app.post("/api/offers/claims/:claimId/deliverables/:deliverableId", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    const result = z.object({
      submissionUrl: z.string().url(),
    }).safeParse(req.body);

    if (!result.success) {
      return res.status(400).json(result.error);
    }

    try {
      const deliverable = await storage.submitDeliverable(
        parseInt(req.params.deliverableId),
        result.data.submissionUrl
      );
      res.json(deliverable);
    } catch (error) {
      console.error('Error submitting deliverable:', error);
      res.status(500).json({ message: "Failed to submit deliverable" });
    }
  });

  app.patch("/api/offers/claims/:claimId/deliverables/:deliverableId", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    const result = z.object({
      status: z.enum(["approved", "rejected"]),
      feedback: z.string().optional(),
    }).safeParse(req.body);

    if (!result.success) {
      return res.status(400).json(result.error);
    }

    try {
      const deliverable = await storage.updateDeliverableStatus(
        parseInt(req.params.deliverableId),
        result.data.status,
        result.data.feedback
      );
      res.json(deliverable);
    } catch (error) {
      console.error('Error updating deliverable:', error);
      res.status(500).json({ message: "Failed to update deliverable" });
    }
  });

  // Instagram OAuth callback route
  app.get("/api/auth/callback/instagram", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const { code } = req.query;
    if (!code) {
      return res.status(400).json({ message: "No auth code provided" });
    }

    try {
      // Exchange code for access token
      const tokenResponse = await axios.get(
        "https://graph.facebook.com/v19.0/oauth/access_token",
        {
          params: {
            client_id: process.env.FACEBOOK_APP_ID,
            client_secret: process.env.FACEBOOK_APP_SECRET,
            redirect_uri: `${req.protocol}://${req.get("host")}/api/auth/callback/instagram`,
            code,
          },
        }
      );

      const { access_token } = tokenResponse.data;

      // Get Instagram business account ID
      const accountResponse = await axios.get(
        "https://graph.facebook.com/v19.0/me/accounts",
        {
          params: {
            access_token,
            fields: "instagram_business_account",
          },
        }
      );

      const instagramAccountId = accountResponse.data.data[0]?.instagram_business_account?.id;
      if (!instagramAccountId) {
        throw new Error("No Instagram business account found");
      }

      // Update user's influencer profile with Instagram connection
      await storage.updateInfluencerProfile(req.user.id, {
        instagramAccountId,
        instagramAccessToken: access_token,
      });

      // Return success to the client
      res.send(`
        <script>
          window.opener.postMessage(
            { type: "INSTAGRAM_AUTH_SUCCESS" },
            "${req.protocol}://${req.get("host")}"
          );
          window.close();
        </script>
      `);
    } catch (error) {
      console.error("Instagram auth error:", error);
      res.send(`
        <script>
          window.opener.postMessage(
            { type: "INSTAGRAM_AUTH_ERROR", error: "Failed to connect Instagram account" },
            "${req.protocol}://${req.get("host")}"
          );
          window.close();
        </script>
      `);
    }
  });

  // Test endpoint for Instagram connection
  app.get("/api/instagram/test-connection", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    try {
      const isConnected = await testInstagramToken();
      if (isConnected) {
        res.json({
          status: "success",
          message: "Successfully connected to Facebook Graph API"
        });
      } else {
        res.status(500).json({
          status: "error",
          message: "Failed to connect to Facebook Graph API"
        });
      }
    } catch (error: any) {
      console.error('Error testing Instagram connection:', error);
      res.status(500).json({
        status: "error",
        message: error.message || "Failed to test connection"
      });
    }
  });
  
  // Get social media metrics from a URL
  app.post("/api/social-metrics/url", async (req, res) => {
    console.log('Requesting social media metrics from URL:', req.body);
    
    const result = z.object({
      profileUrl: z.string().url()
    }).safeParse(req.body);
    
    if (!result.success) {
      return res.status(400).json({
        status: "error",
        message: "Invalid URL format",
        errors: result.error.format()
      });
    }
    
    try {
      const metrics = await socialMetricsService.getMetricsFromUrl(result.data.profileUrl);
      
      if (!metrics) {
        return res.status(404).json({
          status: "error",
          message: "Could not fetch metrics for this social media profile"
        });
      }
      
      console.log('Retrieved social media metrics:', metrics);
      res.json({
        status: "success",
        data: metrics
      });
    } catch (error: any) {
      console.error('Error fetching social media metrics:', error);
      res.status(500).json({
        status: "error",
        message: error.message || "Failed to fetch social media metrics"
      });
    }
  });
  
  // Scrape business data to suggest offer content
  app.post("/api/business/suggest-content", async (req, res) => {
    console.log('Requesting business content suggestions:', req.body);
    
    const result = z.object({
      url: z.string().url().optional(),
      businessName: z.string().optional(),
      industry: z.string().optional(),
      description: z.string().optional()
    }).safeParse(req.body);
    
    if (!result.success) {
      return res.status(400).json({
        status: "error",
        message: "Invalid input data",
        errors: result.error.format()
      });
    }
    
    try {
      // Extract content based on URL or business info
      let contentSuggestion = {
        title: "",
        description: "",
        niche: "",
        recommendedBudget: 0,
        recommendedInfluencerSize: "",
        recommendedFrequency: 0
      };
      
      // If URL is provided, try to scrape content
      if (result.data.url) {
        try {
          // Use axios to fetch the page content
          const response = await axios.get(result.data.url, {
            timeout: 5000,
            headers: {
              'User-Agent': 'Mozilla/5.0 (compatible; SOMIE/1.0; +https://somie.com)'
            }
          });
          
          // Extract data from the HTML content
          // This is a simplistic approach - in production, you'd use more robust techniques
          const htmlContent = response.data.toLowerCase();
          const metaTags = response.data.match(/<meta[^>]*>/g) || [];
          
          // Extract meta description
          const metaDescription = metaTags
            .find(tag => tag.includes('name="description"') || tag.includes('property="og:description"'));
          
          if (metaDescription) {
            const descriptionMatch = metaDescription.match(/content="([^"]*)"/);
            if (descriptionMatch && descriptionMatch[1]) {
              contentSuggestion.description = descriptionMatch[1].substring(0, 150);
            }
          }
          
          // Suggest title based on business name or URL
          contentSuggestion.title = result.data.businessName || 
            new URL(result.data.url).hostname.replace(/^www\./, '').split('.')[0];
          
          // Make title more appealing
          contentSuggestion.title = `Promote ${contentSuggestion.title} to your audience`;
          
          // Set recommended budget based on industry
          if (result.data.industry) {
            const industry = result.data.industry.toLowerCase();
            if (['fashion', 'beauty', 'lifestyle'].some(niche => industry.includes(niche))) {
              contentSuggestion.recommendedBudget = 500;
              contentSuggestion.niche = 'fashion';
            } else if (['food', 'restaurant', 'cuisine'].some(niche => industry.includes(niche))) {
              contentSuggestion.recommendedBudget = 400;
              contentSuggestion.niche = 'food';
            } else if (['tech', 'technology', 'digital'].some(niche => industry.includes(niche))) {
              contentSuggestion.recommendedBudget = 800;
              contentSuggestion.niche = 'tech';
            } else {
              contentSuggestion.recommendedBudget = 500;
              contentSuggestion.niche = 'other';
            }
          }
          
          // Set recommended influencer size and frequency
          contentSuggestion.recommendedInfluencerSize = 'micro';
          contentSuggestion.recommendedFrequency = 2;
        } catch (error) {
          console.error('Error scraping website:', error);
          // If scraping fails, fallback to basic suggestions
        }
      }
      
      // If we didn't get content from URL, use provided business info
      if (!contentSuggestion.description && result.data.description) {
        contentSuggestion.description = result.data.description;
      }
      
      if (!contentSuggestion.title && result.data.businessName) {
        contentSuggestion.title = `Promote ${result.data.businessName} to your audience`;
      }
      
      res.json({
        status: "success",
        data: contentSuggestion
      });
    } catch (error: any) {
      console.error('Error generating content suggestions:', error);
      res.status(500).json({
        status: "error",
        message: error.message || "Failed to generate content suggestions"
      });
    }
  });
  
  // Get social media metrics by platform and username
  app.post("/api/social-metrics/platform", async (req, res) => {
    console.log('Requesting social media metrics by platform and username:', req.body);
    
    const result = z.object({
      platform: z.enum(["instagram", "tiktok", "youtube"]),
      username: z.string().min(1)
    }).safeParse(req.body);
    
    if (!result.success) {
      return res.status(400).json({
        status: "error",
        message: "Invalid platform or username",
        errors: result.error.format()
      });
    }
    
    try {
      const metrics = await socialMetricsService.getMetrics(
        result.data.platform, 
        result.data.username
      );
      
      if (!metrics) {
        return res.status(404).json({
          status: "error",
          message: `Could not fetch metrics for ${result.data.platform} user: ${result.data.username}`
        });
      }
      
      console.log('Retrieved social media metrics:', metrics);
      res.json({
        status: "success",
        data: metrics
      });
    } catch (error: any) {
      console.error('Error fetching social media metrics:', error);
      res.status(500).json({
        status: "error",
        message: error.message || "Failed to fetch social media metrics"
      });
    }
  });

  // Add this to the registerRoutes function, before return httpServer
  app.post("/api/preview-link", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.sendStatus(401);
    }

    try {
      // Generate a random token for the preview link
      const buffer = await randomBytesAsync(32);
      const previewToken = buffer.toString('hex');

      // Store the preview token in the database
      await storage.createPreviewToken({
        token: previewToken,
        createdBy: req.user.id,
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
        isTest: true
      });

      const previewUrl = `${req.protocol}://${req.get('host')}?preview=${previewToken}`;
      res.json({ previewUrl });
    } catch (error) {
      console.error('Error creating preview link:', error);
      res.status(500).json({ message: "Failed to create preview link" });
    }
  });

  app.get("/api/preview/:token", async (req, res) => {
    try {
      const preview = await storage.getPreviewByToken(req.params.token);
      if (!preview || preview.expiresAt < new Date()) {
        return res.status(404).json({ message: "Preview link not found or expired" });
      }
      res.json(preview);
    } catch (error) {
      console.error('Error fetching preview:', error);
      res.status(500).json({ message: "Failed to fetch preview" });
    }
  });

  // Geolocation endpoint - doesn't require authentication
  app.get("/api/geolocation", async (req, res) => {
    try {
      // Get the client's IP address
      const ip = 
        req.headers['x-forwarded-for'] as string || 
        req.socket.remoteAddress || 
        '';
      
      console.log('Geolocation request from IP:', ip);
      
      // Clean the IP if it's in a comma-separated list (from proxies)
      const cleanIp = ip.includes(',') ? ip.split(',')[0].trim() : ip;
      
      // Get geolocation data from the IP
      const locationData = await geolocationService.getLocationFromIp(cleanIp);
      
      if (!locationData) {
        return res.status(404).json({ message: "Could not determine location" });
      }
      
      // Return relevant location data
      res.json({
        city: locationData.city || null,
        region: locationData.region || null,
        country: locationData.country || null,
        coordinates: geolocationService.getCoordinates(locationData),
        timezone: locationData.timezone || null
      });
    } catch (error) {
      console.error('Error fetching geolocation:', error);
      res.status(500).json({ message: "Failed to determine location" });
    }
  });

  // Social Platform management routes
  
  // Get all platforms for an influencer
  app.get("/api/social-platforms", ensureAuthenticated, async (req: any, res: any) => {
    try {
      const userId = req.session.userId;
      if (!userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      // Get the influencer profile for this user
      const influencerProfile = await storage.getInfluencerProfileByUserId(userId);
      if (!influencerProfile) {
        return res.status(404).json({ message: "Influencer profile not found" });
      }
      
      // Get all social platforms for this influencer
      const platforms = await storage.getSocialPlatformsByInfluencerId(influencerProfile.id);
      res.json(platforms);
    } catch (error) {
      console.error('Error fetching social platforms:', error);
      res.status(500).json({ message: "Error fetching social platforms" });
    }
  });
  
  // Add a new social platform
  app.post("/api/social-platforms", ensureAuthenticated, async (req: any, res: any) => {
    try {
      const userId = req.session.userId;
      if (!userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      // Get the influencer profile for this user
      const influencerProfile = await storage.getInfluencerProfileByUserId(userId);
      if (!influencerProfile) {
        return res.status(404).json({ message: "Influencer profile not found" });
      }
      
      // Validate the platform data
      const platformData = {
        ...req.body,
        influencerId: influencerProfile.id
      };
      
      // Create the new platform
      const newPlatform = await storage.createSocialPlatform(platformData);
      res.status(201).json(newPlatform);
    } catch (error) {
      console.error('Error creating social platform:', error);
      res.status(500).json({ message: "Error creating social platform" });
    }
  });
  
  // Update a social platform
  app.put("/api/social-platforms/:id", ensureAuthenticated, async (req: any, res: any) => {
    try {
      const userId = req.session.userId;
      const platformId = parseInt(req.params.id);
      
      if (!userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      // Get the influencer profile for this user
      const influencerProfile = await storage.getInfluencerProfileByUserId(userId);
      if (!influencerProfile) {
        return res.status(404).json({ message: "Influencer profile not found" });
      }
      
      // Get the platform to make sure it belongs to this influencer
      const platform = await storage.getSocialPlatformById(platformId);
      if (!platform || platform.influencerId !== influencerProfile.id) {
        return res.status(404).json({ message: "Social platform not found or unauthorized" });
      }
      
      // Update the platform
      const updatedPlatform = await storage.updateSocialPlatform(platformId, req.body);
      res.json(updatedPlatform);
    } catch (error) {
      console.error('Error updating social platform:', error);
      res.status(500).json({ message: "Error updating social platform" });
    }
  });
  
  // Delete a social platform
  app.delete("/api/social-platforms/:id", ensureAuthenticated, async (req: any, res: any) => {
    try {
      const userId = req.session.userId;
      const platformId = parseInt(req.params.id);
      
      if (!userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      // Get the influencer profile for this user
      const influencerProfile = await storage.getInfluencerProfileByUserId(userId);
      if (!influencerProfile) {
        return res.status(404).json({ message: "Influencer profile not found" });
      }
      
      // Get the platform to make sure it belongs to this influencer
      const platform = await storage.getSocialPlatformById(platformId);
      if (!platform || platform.influencerId !== influencerProfile.id) {
        return res.status(404).json({ message: "Social platform not found or unauthorized" });
      }
      
      // Delete the platform
      await storage.deleteSocialPlatform(platformId);
      res.status(204).send();
    } catch (error) {
      console.error('Error deleting social platform:', error);
      res.status(500).json({ message: "Error deleting social platform" });
    }
  });
  
  // Set a platform as primary
  app.post("/api/social-platforms/:id/primary", ensureAuthenticated, async (req: any, res: any) => {
    try {
      const userId = req.session.userId;
      const platformId = parseInt(req.params.id);
      
      if (!userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      // Get the influencer profile for this user
      const influencerProfile = await storage.getInfluencerProfileByUserId(userId);
      if (!influencerProfile) {
        return res.status(404).json({ message: "Influencer profile not found" });
      }
      
      // Get the platform to make sure it belongs to this influencer
      const platform = await storage.getSocialPlatformById(platformId);
      if (!platform || platform.influencerId !== influencerProfile.id) {
        return res.status(404).json({ message: "Social platform not found or unauthorized" });
      }
      
      // Set this platform as primary
      await storage.setPrimaryPlatform(platformId, influencerProfile.id);
      
      // Get all platforms after the update
      const platforms = await storage.getSocialPlatformsByInfluencerId(influencerProfile.id);
      res.json(platforms);
    } catch (error) {
      console.error('Error setting primary platform:', error);
      res.status(500).json({ message: "Error setting primary platform" });
    }
  });

  // Campaign parameter optimization route
  app.post("/api/optimization/campaign", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    console.log('Optimizing campaign parameters:', req.body);
    
    const result = z.object({
      budget: z.number().min(100),
      targetAudience: z.number().min(1000),
      industry: z.string(),
      marketingGoal: z.enum(["awareness", "engagement", "sales"]),
      campaignDuration: z.number().min(1).max(90),
      contentType: z.enum(["image", "video", "story", "multiple"]),
    }).safeParse(req.body);

    if (!result.success) {
      console.log('Invalid optimization parameters:', result.error);
      return res.status(400).json(result.error);
    }

    try {
      // Industry data for intelligent suggestions
      const industryData: Record<string, any> = {
        "fashion": {
          avgEngagementRate: 4.6,
          costPerThousand: 8.5,
          recommendedInfluencerSize: "micro",
          contentEffectiveness: { "image": 0.8, "video": 0.9, "story": 0.7, "multiple": 1.0 }
        },
        "beauty": {
          avgEngagementRate: 5.2,
          costPerThousand: 9.2,
          recommendedInfluencerSize: "micro",
          contentEffectiveness: { "image": 0.8, "video": 1.0, "story": 0.7, "multiple": 0.9 }
        },
        "fitness": {
          avgEngagementRate: 6.3,
          costPerThousand: 7.8,
          recommendedInfluencerSize: "micro",
          contentEffectiveness: { "image": 0.7, "video": 1.0, "story": 0.6, "multiple": 0.8 }
        },
        "food": {
          avgEngagementRate: 5.8,
          costPerThousand: 6.5,
          recommendedInfluencerSize: "micro",
          contentEffectiveness: { "image": 0.9, "video": 0.8, "story": 0.6, "multiple": 0.9 }
        },
        "travel": {
          avgEngagementRate: 5.0,
          costPerThousand: 10.2,
          recommendedInfluencerSize: "micro",
          contentEffectiveness: { "image": 0.9, "video": 1.0, "story": 0.7, "multiple": 0.8 }
        },
        "tech": {
          avgEngagementRate: 3.8,
          costPerThousand: 12.5,
          recommendedInfluencerSize: "mid",
          contentEffectiveness: { "image": 0.7, "video": 0.9, "story": 0.5, "multiple": 0.8 }
        },
        "gaming": {
          avgEngagementRate: 4.2,
          costPerThousand: 11.0,
          recommendedInfluencerSize: "mid",
          contentEffectiveness: { "image": 0.6, "video": 1.0, "story": 0.5, "multiple": 0.8 }
        },
        "other": {
          avgEngagementRate: 4.5,
          costPerThousand: 8.0,
          recommendedInfluencerSize: "micro",
          contentEffectiveness: { "image": 0.8, "video": 0.8, "story": 0.6, "multiple": 0.8 }
        }
      };

      // Marketing goal multipliers for smart optimization
      const goalMultipliers: Record<string, any> = {
        "awareness": { engagementWeight: 0.7, reachWeight: 1.0, costWeight: 0.8 },
        "engagement": { engagementWeight: 1.0, reachWeight: 0.7, costWeight: 0.8 },
        "sales": { engagementWeight: 0.9, reachWeight: 0.8, costWeight: 1.0 }
      };

      const inputs = result.data;
      const industry = industryData[inputs.industry] || industryData.other;
      const goalMultiplier = goalMultipliers[inputs.marketingGoal];
      const contentEffectiveness = industry.contentEffectiveness[inputs.contentType];
      
      // Smart calculations based on industry data and user inputs
      const budgetPerInfluencer = inputs.budget > 1000 ? inputs.budget * 0.2 : inputs.budget * 0.8;
      const campaignEfficiency = Math.min(1, inputs.campaignDuration / 30) * contentEffectiveness;
      
      // Calculate ideal follower range based on budget and industry CPM
      const idealFollowers = Math.round(budgetPerInfluencer / (industry.costPerThousand * 0.001));
      const minFollowers = Math.round(idealFollowers * 0.7);
      const maxFollowers = Math.round(idealFollowers * 1.5);
      
      // Calculate ideal engagement rate based on industry average and goal
      const idealEngagement = Math.round((industry.avgEngagementRate * goalMultiplier.engagementWeight * 10)) / 10;
      const minEngagement = Math.round((idealEngagement * 0.8) * 10) / 10;
      
      // Determine post requirements based on campaign duration and content type
      const postsRequired = Math.max(1, Math.round(inputs.campaignDuration / 7) + (inputs.contentType === "multiple" ? 1 : 0));
      
      // Calculate estimated results
      const estimatedReach = idealFollowers * postsRequired * campaignEfficiency;
      const reachPercentage = Math.min(100, Math.round((estimatedReach / inputs.targetAudience) * 100));
      
      // Calculate suggested reward based on follower count and industry standards
      const suggestedReward = idealFollowers < 5000 
        ? `$${Math.round(budgetPerInfluencer / postsRequired)}/post` 
        : `$${Math.round(budgetPerInfluencer)}`;
      
      // Calculate expected ROI
      const expectedROI = `${Math.round(100 + (reachPercentage * campaignEfficiency * goalMultiplier.reachWeight))}%`;
      
      // Calculate confidence score (0-100)
      const confidence = Math.min(95, Math.round(
        (campaignEfficiency * 100) * 
        (inputs.budget > 300 ? 1 : 0.8) * 
        (inputs.campaignDuration > 10 ? 1 : 0.7)
      ));
      
      const optimizedParams = {
        audienceSize: {
          min: minFollowers,
          ideal: idealFollowers,
          max: maxFollowers
        },
        engagementRate: {
          min: minEngagement,
          ideal: idealEngagement
        },
        postsRequired,
        timeframe: inputs.campaignDuration,
        suggestedReward,
        estimatedROI: expectedROI,
        audienceReach: estimatedReach,
        confidence,
        // Add original parameters for reference
        originalInputs: inputs
      };

      console.log('Returning optimized parameters:', optimizedParams);
      res.json(optimizedParams);
    } catch (error) {
      console.error('Error optimizing campaign parameters:', error);
      res.status(500).json({ message: "Failed to optimize campaign parameters" });
    }
  });

  // Rate Calculator API Endpoints
  app.get("/api/rate-calculator/platform/:platform", async (req, res) => {
    try {
      const { platform } = req.params;
      const followers = parseInt(req.query.followers as string) || 0;
      const engagementRate = parseFloat(req.query.engagementRate as string) || 0;
      const niche = req.query.niche as string;
      
      if (!platform || followers <= 0 || engagementRate <= 0) {
        return res.status(400).json({ 
          message: "Missing required parameters. Platform, followers and engagementRate are required." 
        });
      }
      
      console.log('Calculating rates for platform:', {
        platform,
        followers,
        engagementRate,
        niche
      });
      
      const rateRecommendation = rateCalculatorService.calculateRecommendedRate(
        platform,
        followers,
        engagementRate,
        niche
      );
      
      console.log('Rate calculation result:', rateRecommendation);
      res.json(rateRecommendation);
    } catch (error) {
      console.error('Error calculating recommended rates:', error);
      res.status(500).json({ message: "Failed to calculate recommended rates" });
    }
  });
  
  app.post("/api/rate-calculator/social-platforms", ensureAuthenticated, async (req: any, res: any) => {
    try {
      const userId = req.session.userId;
      if (!userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      // Get the influencer profile to get the niche
      const influencerProfile = await storage.getInfluencerProfileByUserId(userId);
      if (!influencerProfile) {
        return res.status(404).json({ message: "Influencer profile not found" });
      }
      
      // Get all platforms for this influencer
      const platforms = await storage.getSocialPlatformsByInfluencerId(influencerProfile.id);
      if (!platforms || platforms.length === 0) {
        return res.status(404).json({ message: "No social platforms found" });
      }
      
      console.log('Calculating rates for influencer platforms:', {
        influencerId: influencerProfile.id,
        platforms: platforms.length,
        niche: influencerProfile.niche
      });
      
      // Calculate rates for all platforms
      const rateRecommendations = Array.from(
        rateCalculatorService.calculateRatesForAllPlatforms(
          platforms, 
          influencerProfile.niche || undefined
        )
      );
      
      console.log('Rate calculations complete for all platforms');
      res.json(rateRecommendations);
    } catch (error) {
      console.error('Error calculating rates for platforms:', error);
      res.status(500).json({ message: "Failed to calculate rates for platforms" });
    }
  });

  // Register admin routes
  registerAdminRoutes(app, storage);

  const httpServer = createServer(app);

  // Set up WebSockets using the new approach
  registerWebSocketRoute(app, httpServer);
  
  // Set up legacy WebSockets for backward compatibility
  setupWebSocketServer(httpServer);
  
  // Register sync routes
  app.use('/api/sync', syncRoutes);

  return httpServer;
}