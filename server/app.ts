import { type Server } from "node:http";

import express, {
  type Express,
  type Request,
  Response,
  NextFunction,
} from "express";

import { registerRoutes } from "./routes";
import { extractFirebaseUid } from "./firebase-auth";

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

import compression from "compression";

export const app = express();

// Enable Gzip compression (saves ~70% network bandwidth)
app.use(compression());

// Security Hardening
import helmet from "helmet";
import rateLimit from "express-rate-limit";

// Trust proxy is required for rate limiting behind Vercel/proxies
app.set("trust proxy", 1);

// Set security headers (CSP disabled to allow Vite/React inline scripts; COOP disabled to allow Google/Firebase OAuth popups)
if (process.env.NODE_ENV === "production") {
  app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
    crossOriginOpenerPolicy: false,
  }));
} else {
  // In development, allow embedded webviews, in-IDE previews, and mobile simulators
  app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
    crossOriginOpenerPolicy: false,
    crossOriginResourcePolicy: false,
    frameguard: false,
    originAgentCluster: false,
  }));
}

// Global Rate Limiter: 60 requests per 1 minute per IP
const globalLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 60,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { error: "Too many requests, please try again later." }
});

// Auth Rate Limiter: 5 attempts per 1 minute per IP
const authLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 5,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { error: "Too many login attempts, please try again after 1 minute." }
});

// Focus Rate Limiter: 10 attempts per 1 minute per IP
const focusLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 10,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { error: "Too many focus requests, please slow down." }
});

if (process.env.NODE_ENV === "production" && process.env.ALLOW_TEST_AUTH !== "true") {
  app.use("/api/auth", authLimiter);
  app.use("/api/focus", focusLimiter);
  app.use("/api", globalLimiter);
}


// Radical Optimization: Edge Caching for Static Data
app.use((req, res, next) => {
  // Cache Shop and Campaigns on Edge for 1 hour
  if (req.url.startsWith('/api/shop') || req.url.startsWith('/api/campaigns')) {
    res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=600');
  }
  next();
});

declare module 'http' {
  interface IncomingMessage {
    rawBody: unknown
  }
}
app.use(express.json({
  limit: "50mb",
  verify: (req, _res, buf) => {
    req.rawBody = buf;
  }
}));
app.use(express.urlencoded({ extended: false }));

// Extract Firebase UID from requests
app.use(extractFirebaseUid);

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

import { globalErrorHandler } from "./middleware/error-handler";

export default async function runApp(
  setup: (app: Express, server: Server) => Promise<void>,
) {
  const server = await registerRoutes(app);

  // DEBUG: Catch-all 404 for API to show what path Express is seeing
  app.use("/api/*", (req, res) => {
    res.status(404).json({
      error: "Debugging 404",
      path: req.path,
      originalUrl: req.originalUrl,
      reqUrl: req.url,
      method: req.method,
      timestamp: new Date().toISOString()
    });
  });

  app.use(globalErrorHandler);

  // importantly run the final setup after setting up all the other routes so
  // the catch-all route doesn't interfere with the other routes
  await setup(app, server);

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || '5000', 10);
  server.listen({
    port,
    host: "0.0.0.0",
  }, () => {
    log(`serving on port ${port}`);
  });
}
