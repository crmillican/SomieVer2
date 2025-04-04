import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import path from "path";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Serve revenue projections files directly
app.get('/revenue-projections', (req, res) => {
  res.sendFile(path.join(process.cwd(), 'diagnostic.html'));
});

app.get('/projections', (req, res) => {
  res.sendFile(path.join(process.cwd(), 'projections.html'));
});

app.get('/revenue-projections-interactive', (req, res) => {
  res.sendFile(path.join(process.cwd(), 'revenue-projections-improved.html'));
});

// Enhanced CORS configuration for better cross-domain cookie handling
app.use((req, res, next) => {
  // Log request origins for debugging
  console.log("Request origin:", req.headers.origin);
  
  // Get origin from headers or default to development URL
  const origin = req.headers.origin || 'http://localhost:5000';
  
  // Set CORS headers to ensure cookies are handled correctly
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Origin', origin);
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS,PATCH');
  res.header('Access-Control-Allow-Headers', 'X-Requested-With, X-HTTP-Method-Override, Content-Type, Accept, Authorization, Cookie');
  res.header('Access-Control-Expose-Headers', 'X-Session-ID, X-Auth-User-ID, Set-Cookie');
  res.header('Vary', 'Origin'); // Important for proper caching with varying origins
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    console.log("Handling preflight request");
    return res.sendStatus(200);
  }
  
  next();
});

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on port 5000
  // this serves both the API and the client
  const PORT = 5000;
  server.listen(PORT, "0.0.0.0", () => {
    log(`serving on port ${PORT}`);
  });
})();
