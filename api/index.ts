import { app } from "../server/app";
import { registerRoutes } from "../server/routes";

// Initialize routes (this promise will resolve once locally, 
// ensuring routes are registered before handling requests)
let initialized: Promise<any>;
let initError: Error | null = null;

try {
    initialized = registerRoutes(app);
    initialized.catch((err) => {
        console.error("[API Handler] Route initialization failed:", err);
        initError = err;
    });
} catch (err) {
    console.error("[API Handler] Failed to start route registration:", err);
    initError = err as Error;
    initialized = Promise.reject(err);
}

// Universal API handler for all /api/* routes
export default async function handler(req: any, res: any) {
    try {
        // DEPLOYMENT VERIFICATION: This log proves the latest code is deployed
        console.log(`[DEPLOYMENT CHECK] Code deployed at: 2025-12-29 22:48 IST`);

        // Verify request path
        console.log(`[API Handler] Received request: ${req.method} ${req.url}`);

        // Check if initialization failed
        if (initError) {
            console.error("[API Handler] Cannot process request - initialization failed");
            return res.status(500).json({
                error: "Server initialization failed",
                details: initError.message
            });
        }

        // Vercel's routing passes paths like /ping-direct for /api/ping-direct
        // Our Express app expects routes to start with '/api'
        if (req.url && !req.url.startsWith('/api')) {
            req.url = `/api${req.url}`;
            console.log(`[API Handler] Rewrote URL to: ${req.url}`);
        }

        // Ensure routes are registered
        await initialized;
        console.log(`[API Handler] Routes initialized. Forwarding to Express.`);

        // Forward request to Express app
        app(req, res);
    } catch (error) {
        console.error("[API Handler] Error processing request:", error);
        console.error("[API Handler] Error stack:", error instanceof Error ? error.stack : 'No stack');

        // Ensure we always return JSON
        if (!res.headersSent) {
            res.status(500).json({
                error: "Internal server error",
                details: error instanceof Error ? error.message : String(error)
            });
        }
    }
}
