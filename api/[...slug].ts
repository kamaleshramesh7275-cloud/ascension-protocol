import { app } from "../server/app";
import { registerRoutes } from "../server/routes";

// Catch-all API route handler for Vercel

// Initialize routes
const initialized = registerRoutes(app);

export default async function handler(req: any, res: any) {
    // Ensure routes are registered
    await initialized;

    // Vercel passes the full path including /api
    // Our Express app expects routes to start with '/api'
    if (!req.url.startsWith('/api')) {
        req.url = `/api${req.url}`;
    }

    // Forward request to Express app
    app(req, res);
}
