import { app } from "../server/app";
import { registerRoutes } from "../server/routes";

// Initialize routes (this promise will resolve once locally, 
// ensuring routes are registered before handling requests)
const initialized = registerRoutes(app);

export default async function handler(req: any, res: any) {
    // Verify request path
    console.log(`[API Handler] Received request: ${req.method} ${req.url}`);

    // Vercel's rewrite might strip '/api' or pass the sub-path.
    // Our Express app expects routes to start with '/api'.
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
