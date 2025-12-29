import { app } from "../server/app";
import { registerRoutes } from "../server/routes";

// Initialize routes (this promise will resolve once locally, 
// ensuring routes are registered before handling requests)
const initialized = registerRoutes(app);

// Universal API handler for all /api/* routes
export default async function handler(req: any, res: any) {
    // DEPLOYMENT VERIFICATION: This log proves the latest code is deployed
    console.log(`[DEPLOYMENT CHECK] Code deployed at: 2025-12-29 20:51 IST`);

    // Verify request path
    console.log(`[API Handler] Received request: ${req.method} ${req.url}`);

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
}
