import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express, Request, Response, NextFunction } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User as SelectUser } from "@shared/schema";
import jwt from 'jsonwebtoken';

// Secret key for JWT tokens
const JWT_SECRET = process.env.JWT_SECRET || "somie-development-jwt-secret-key";

declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

// Extend the express-session module's SessionData interface
declare module "express-session" {
  interface SessionData {
    userId?: number;
  }
}

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
  // Check if stored password is a bcrypt hash (starts with $2a$, $2b$, or $2y$)
  if (stored.startsWith('$2a$') || stored.startsWith('$2b$') || stored.startsWith('$2y$')) {
    // Use bcrypt to compare
    try {
      // Dynamically import bcrypt since we're using it in a specific case
      const bcrypt = await import('bcrypt');
      return await bcrypt.compare(supplied, stored);
    } catch (err) {
      console.error("Error comparing bcrypt password:", err);
      throw new Error("Failed to compare bcrypt password");
    }
  } 
  // Otherwise, use scrypt (our default algorithm)
  else if (stored.includes('.')) {
    // scrypt format: hashedPassword.salt
    const [hashed, salt] = stored.split(".");
    const hashedBuf = Buffer.from(hashed, "hex");
    const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
    return timingSafeEqual(hashedBuf, suppliedBuf);
  } 
  else {
    throw new Error("Unknown password format");
  }
}

// Helper to ensure session is correctly established and cookies set before responding
function ensureSession(req: any, res: any, user: any, statusCode: number, callback: () => void) {
  console.log("Ensuring session is correctly established for user:", user.id);
  
  // First verify the session exists and contains the expected userId
  if (!req.session) {
    console.error("No session object available during ensureSession!");
    callback();
    return;
  }
  
  // Ensure userId is set in session
  if (req.session.userId !== user.id) {
    console.log("Correcting session userId mismatch:", { 
      sessionUserId: req.session.userId, 
      actualUserId: user.id 
    });
    req.session.userId = user.id;
  }
  
  // Add session cookie info to headers
  res.setHeader('X-Auth-User-ID', user.id.toString());
  res.setHeader('X-Session-ID', req.sessionID);
  
  // Enhanced cookie options with better compatibility for Replit environment
  const cookieOptions = {
    path: '/',
    httpOnly: true,
    secure: false, // Set to false for Replit environment which may not always be https
    // Changed to lax for better compatibility
    sameSite: 'lax' as const,
    maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
  };
  
  // Set both the session cookie and a secondary authentication cookie
  res.cookie('somie.sid', req.sessionID, cookieOptions);
  res.cookie('somie.auth', user.id.toString(), cookieOptions);
  
  // Set explicit Set-Cookie header with both cookies
  const sessionCookie = `somie.sid=${req.sessionID}; Path=/; HttpOnly; SameSite=Lax; Max-Age=2592000`;
  const authCookie = `somie.auth=${user.id}; Path=/; HttpOnly; SameSite=Lax; Max-Age=2592000`;
  res.setHeader('Set-Cookie', [sessionCookie, authCookie]);
  
  // Save session to ensure it's persisted before responding
  req.session.save((err: Error) => {
    if (err) {
      console.error("Failed to save session in ensureSession:", err);
    } else {
      console.log("Session successfully saved with userId:", user.id);
    }
    
    // Continue with the original callback regardless
    callback();
  });
}

// Authentication middleware - can be used on any route that requires auth
export const ensureAuthenticated = (req: any, res: any, next: any) => {
  // Log detailed session info for debugging
  console.log('Auth check for request to:', req.originalUrl, {
    sessionID: req.sessionID,
    hasSession: Boolean(req.session),
    isAuthenticated: req.isAuthenticated(),
    hasUser: Boolean(req.user),
    userId: req.user?.id,
    sessionUserId: req.session?.userId,
    cookies: req.headers.cookie || 'no cookies',
    origin: req.headers.origin || 'unknown'
  });
  
  // Extra logging for debugging cookie transmission
  if (req.headers.cookie) {
    const cookieSegments = req.headers.cookie.split(';').map((c: string) => c.trim());
    console.log('Parsed cookies:', cookieSegments);
    const sessionCookie = cookieSegments.find((c: string) => c.startsWith('somie.sid='));
    if (sessionCookie) {
      console.log('Found session cookie:', sessionCookie);
    } else {
      console.log('No session cookie found in request');
    }
  }
  
  // Check if user is authenticated via Passport.js
  if (req.isAuthenticated()) {
    console.log('Passport authentication successful, proceeding with request');
    return next(); // Continue if authenticated
  }
  
  // If not authenticated but we have a userId in session, try to restore the session
  if (req.session && req.session.userId) {
    const userId = req.session.userId;
    console.log('Session exists with userId but not authenticated, attempting to restore:', userId);
    
    // Attempt to restore the session by manually serializing the user into req.user
    storage.getUser(userId)
      .then(user => {
        if (user) {
          console.log('User found, restoring session manually:', user.id);
          req.user = user;
          
          // Prevent session regeneration during re-login
          const restoreRegeneration = preventSessionRegeneration(req);
          
          // Attempt to re-establish passport session
          req.login(user, (loginErr: Error) => {
            // Restore original regeneration method
            restoreRegeneration();
            
            if (loginErr) {
              console.error('Failed to re-establish passport session:', loginErr);
              // Continue anyway with our manual user assignment
            } else {
              console.log('Re-established passport session for user:', user.id);
              
              // Set session cookie explicitly to refresh it client-side
              res.setHeader('Set-Cookie', `somie.sid=${req.sessionID}; Path=/; HttpOnly; SameSite=Lax; Max-Age=2592000`);
              
              // Flag in headers that we recovered the session
              res.setHeader('X-Session-Recovered', 'true');
              res.setHeader('X-Auth-User-ID', user.id.toString());
            }
            next();
          });
        } else {
          console.log('User not found for session userId:', userId);
          
          // Clear invalid session data
          req.session.userId = undefined;
          req.session.save();
          
          res.status(401).json({ message: "Not authenticated" });
        }
      })
      .catch(err => {
        console.error('Error restoring session:', err);
        res.status(401).json({ message: "Authentication error" });
      });
    return;
  }
  
  // Extra check: Look for session ID cookie and try to load the session directly
  if (req.headers.cookie && req.headers.cookie.includes('somie.sid=')) {
    console.log('Found session cookie but no session data loaded, possible store issue');
    
    // Include cookie debugging info in response headers
    res.setHeader('X-Session-Debug', 'cookie-present-but-no-session-data');
    
    // We could attempt to get the session directly from the store here
    // But for now just report the issue
  }
  
  // No authentication and no session
  console.log('User not authenticated and no session found');
  res.status(401).json({ message: "Not authenticated" });
};

// Helper function to prevent session regeneration
function preventSessionRegeneration(req: any): () => void {
  const originalRegenerateMethod = req.session.regenerate;
  // @ts-ignore - Deliberately overriding for session flow control
  req.session.regenerate = function(callback: any) {
    console.log("Session regeneration prevented during login");
    if (callback) callback(null);
    return req.session;
  };
  
  // Return a function to restore the original method
  return () => {
    req.session.regenerate = originalRegenerateMethod;
  };
}

// Generate a JWT token for direct authentication without session
export function generateAuthToken(userId: number, expiresIn: string = '24h'): string {
  const secretKey = process.env.JWT_SECRET || process.env.SESSION_SECRET || 'somie-jwt-secret-key';
  return jwt.sign({ userId }, secretKey, { expiresIn });
}

// Validate a JWT token and return the userId if valid
export function validateAuthToken(token: string): number | null {
  try {
    const secretKey = process.env.JWT_SECRET || process.env.SESSION_SECRET || 'somie-jwt-secret-key';
    const decoded = jwt.verify(token, secretKey) as { userId: number };
    return decoded.userId;
  } catch (error) {
    console.error('Error validating auth token:', error);
    return null;
  }
}

// Alternative authentication middleware that also accepts JWT tokens
export const ensureAuthenticatedWithToken = async (req: any, res: any, next: any) => {
  console.log('Token auth check for request:', {
    path: req.originalUrl, 
    hasAuthHeader: Boolean(req.headers.authorization),
    isAuthenticated: req.isAuthenticated(),
    hasSessionUser: Boolean(req.user)
  });

  // First try standard session authentication
  if (req.isAuthenticated()) {
    console.log('User already authenticated via session:', req.user.id);
    return next();
  }
  
  // Check for token in Authorization header
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    console.log('Found auth token in Authorization header');
    
    const userId = validateAuthToken(token);
    if (userId) {
      console.log('Valid token found for user:', userId);
      try {
        // Get the user from storage
        const user = await storage.getUser(userId);
        if (user) {
          console.log('User found for token:', user.id);
          // Set the user on the request
          req.user = user;
          
          // Optionally establish a session for better compatibility
          req.session.userId = user.id;
          
          // Flag in headers that we authenticated via token
          res.setHeader('X-Auth-Method', 'token');
          
          return next();
        } else {
          console.log('No user found for token userId:', userId);
        }
      } catch (error) {
        console.error('Error fetching user for token:', error);
      }
    } else {
      console.log('Invalid or expired token in Authorization header');
    }
  }
  
  // Check for token in query params (fallback)
  const tokenParam = req.query.token;
  if (tokenParam) {
    console.log('Found token in query parameter');
    
    const userId = validateAuthToken(tokenParam);
    if (userId) {
      console.log('Valid token in query param for user:', userId);
      try {
        // Get the user from storage
        const user = await storage.getUser(userId);
        if (user) {
          console.log('User found for query param token:', user.id);
          // Set the user on the request
          req.user = user;
          
          // Optionally establish a session for better compatibility
          req.session.userId = user.id;
          
          // Flag in headers that we authenticated via token
          res.setHeader('X-Auth-Method', 'token_param');
          
          return next();
        } else {
          console.log('No user found for token query param userId:', userId);
        }
      } catch (error) {
        console.error('Error fetching user for token param:', error);
      }
    } else {
      console.log('Invalid or expired token in query parameter');
    }
  }
  
  // If we get here, neither session nor token auth succeeded
  console.log('No valid authentication method found');
  res.status(401).json({ message: "Not authenticated" });
};

export function setupAuth(app: Express) {
  // Configure session middleware with optimized settings for our PostgreSQL session store
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || 'dev-secret-key',
    // Set resave to true to ensure session is saved on every response
    resave: true,
    // Save uninitialized sessions to ensure cookie is set immediately
    saveUninitialized: true,
    // Use our PostgreSQL session store
    store: storage.sessionStore,
    // Custom cookie name for better identification
    name: "somie.sid",
    cookie: {
      // Consistently set secure to false for Replit environment
      secure: false,
      // Prevent client-side JS from accessing the cookie
      httpOnly: true,
      // Set sameSite to lax for better cookie handling in Replit environment
      sameSite: "lax",
      // 30 days session lifetime
      maxAge: 30 * 24 * 60 * 60 * 1000,
      // Make cookie available for all paths
      path: '/',
      // Domain setting - leave empty to use the default domain
      domain: undefined
    },
    // Rolling session - update expiration with each response
    rolling: true
  };
  
  // Log actual session configuration values
  console.log("Session configuration:", {
    mode: process.env.NODE_ENV || 'development',
    cookieSecure: false,  // Always false for Replit environment
    cookieSameSite: "lax", // Changed to lax for better compatibility
    sessionSecret: (process.env.SESSION_SECRET || 'dev-secret-key').substring(0, 3) + '***',
    maxAge: '30 days'
  });

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(async (username: string, password: string, done) => {
      try {
        const user = await storage.getUserByUsername(username);
        if (!user || !(await comparePasswords(password, user.password))) {
          return done(null, false, { message: "Invalid username or password" });
        }
        return done(null, user);
      } catch (error) {
        return done(error);
      }
    }),
  );

  passport.serializeUser((user, done) => {
    console.log("Serializing user to session:", user.id);
    done(null, user.id);
  });
  
  passport.deserializeUser(async (id: number, done) => {
    console.log("Deserializing user from session ID:", id);
    try {
      const user = await storage.getUser(id);
      if (!user) {
        console.log("User not found during deserialization:", id);
        return done(null, false);
      }
      console.log("Successfully deserialized user:", user.id);
      done(null, user);
    } catch (error) {
      console.error("Error during user deserialization:", error);
      done(error);
    }
  });

  app.post("/api/register", async (req, res, next) => {
    try {
      // Log important session information for debugging
      const originalSessionID = req.sessionID;
      console.log("Register endpoint called with:", {
        body: req.body,
        session: req.session,
        sessionID: originalSessionID,
        cookies: req.headers.cookie
      });
      
      const { username, password, userType } = req.body;

      if (!username || !password || !userType) {
        console.log("Registration failed: Missing required fields");
        return res.status(400).json({ 
          message: "Missing required fields. Please provide username, password, and userType." 
        });
      }

      if (!['business', 'influencer'].includes(userType)) {
        console.log("Registration failed: Invalid user type", userType);
        return res.status(400).json({ 
          message: "Invalid user type. Must be either 'business' or 'influencer'." 
        });
      }

      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        console.log("Registration failed: Username already exists", username);
        return res.status(400).json({ message: "Username already exists" });
      }

      console.log("Creating new user:", username);
      const user = await storage.createUser({
        username,
        password: await hashPassword(password),
        userType,
        createdAt: new Date(),
        isTest: false
      });

      console.log("User created, setting up session for user:", user.id);
      
      // Save user ID to session explicitly before login
      if (!req.session) {
        console.error("No session object available!");
      } else {
        req.session.userId = user.id;
        
        // Ensure the session is stored before proceeding
        await new Promise<void>((resolve, reject) => {
          req.session.save((err) => {
            if (err) {
              console.error("Failed to save session before login:", err);
              reject(err);
            } else {
              console.log("Session saved with userId before login");
              resolve();
            }
          });
        });
      }
      
      // Prevent session regeneration during passport login
      const restoreRegeneration = preventSessionRegeneration(req);
      
      // Then use Passport's login for proper authentication
      req.login(user, (err) => {
        // Restore the original regenerate method
        restoreRegeneration();
        
        if (err) {
          console.error("Login after registration failed:", err);
          return next(err);
        }
        
        console.log("Login successful, comparing session IDs:", {
          original: originalSessionID,
          current: req.sessionID
        });
        
        // Only send safe user data
        const { password: _, ...safeUser } = user;
        
        // Add session cookie info to headers
        res.setHeader('X-Auth-User-ID', user.id.toString());
        res.setHeader('X-Session-ID', req.sessionID);
        
        // Generate an auth token for the client to use
        const authToken = generateAuthToken(user.id);
        
        // Use helper function to ensure session is properly established
        ensureSession(req, res, user, 201, () => {
          console.log('Registration complete, sending response with session ID:', req.sessionID);
          res.status(201).json({
            ...safeUser,
            _sessionId: req.sessionID, // For debugging only
            authToken // Include the token for direct authentication
          });
        });
      });
    } catch (error) {
      console.error("Registration error:", error);
      next(error);
    }
  });

  app.post("/api/login", (req, res, next) => {
    // Log important session information for debugging
    const originalSessionID = req.sessionID;
    console.log("Login endpoint called with:", {
      body: req.body,
      session: req.session,
      sessionID: originalSessionID,
      cookies: req.headers.cookie
    });

    passport.authenticate("local", async (err: Error | null, user: Express.User | false, info: { message: string } | undefined) => {
      if (err) {
        console.error("Authentication error:", err);
        return next(err);
      }
      
      if (!user) {
        console.log("Authentication failed:", info?.message);
        return res.status(401).json({ message: info?.message || "Authentication failed" });
      }
      
      console.log("User authenticated, setting up session:", {
        userId: (user as any).id,
        sessionID: req.sessionID
      });
      
      // Save user ID to session explicitly before login
      if (!req.session) {
        console.error("No session object available during login!");
      } else {
        req.session.userId = (user as any).id;
        
        // Ensure the session is stored before proceeding
        try {
          await new Promise<void>((resolve, reject) => {
            req.session.save((err) => {
              if (err) {
                console.error("Failed to save session before login:", err);
                reject(err);
              } else {
                console.log("Session saved with userId before login");
                resolve();
              }
            });
          });
        } catch (saveError) {
          console.error("Error saving session:", saveError);
          // Continue anyway, as req.login may still work
        }
      }
      
      // Prevent session regeneration during passport login
      const restoreRegeneration = preventSessionRegeneration(req);
      
      req.login(user, (err) => {
        // Restore the original regenerate method
        restoreRegeneration();
        
        if (err) {
          console.error("Login session creation failed:", err);
          return next(err);
        }
        
        console.log("Login successful, comparing session IDs:", {
          original: originalSessionID,
          current: req.sessionID
        });
        
        // Only send safe user data
        const { password: _, ...safeUser } = user;
        
        // Add session cookie info to headers
        res.setHeader('X-Auth-User-ID', (user as any).id.toString());
        res.setHeader('X-Session-ID', req.sessionID);
        
        // Generate an auth token for the client to use
        const authToken = generateAuthToken((user as any).id);
        
        // Use helper function to ensure session is properly established
        ensureSession(req, res, user, 200, () => {
          console.log('Login complete, sending response with session ID:', req.sessionID);
          res.status(200).json({
            ...safeUser,
            _sessionId: req.sessionID, // For debugging only
            authToken // Include the token for direct authentication
          });
        });
      });
    })(req, res, next);
  });

  app.post("/api/logout", (req, res, next) => {
    console.log("Logout requested for session:", req.sessionID);
    
    if (!req.isAuthenticated()) {
      console.log("User not authenticated, nothing to logout");
      return res.sendStatus(200);
    }
    
    const userId = req.user?.id;
    console.log("Logging out user:", userId);
    
    // First call passport's logout
    req.logout((err) => {
      if (err) {
        console.error("Error during logout:", err);
        return next(err);
      }
      
      // Then destroy the session completely for a clean logout
      req.session.destroy((sessionErr) => {
        if (sessionErr) {
          console.error("Error destroying session:", sessionErr);
          // Continue anyway as we've already logged out from passport
        } else {
          console.log("Session successfully destroyed");
        }
        
        // Clear the cookie on the client side
        res.clearCookie("somie.sid");
        res.sendStatus(200);
      });
    });
  });

  app.get("/api/user", (req, res) => {
    console.log("GET /api/user called:", {
      sessionID: req.sessionID,
      isAuthenticated: req.isAuthenticated(),
      hasSessionUser: Boolean(req.user),
      session: req.session
    });
    
    if (!req.isAuthenticated()) {
      console.log("User not authenticated, no session found");
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    // Only send safe user data
    const { password: _, ...safeUser } = req.user as Express.User;
    console.log("User authenticated, returning data for user:", safeUser.id);
    res.json(safeUser);
  });
}
