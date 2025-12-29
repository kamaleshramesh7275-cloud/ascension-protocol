import { app } from "../server/app";
import { registerRoutes } from "../server/routes";

// Initialize routes (this promise will resolve once locally, 
// ensuring routes are registered before handling requests)
const initialized = registerRoutes(app);

export default async function handler(req: any, res: any) {
    // Ensure routes are registered
    await initialized;

    // Vercel's rewrite or dynamic route might strip '/api' or pass the sub-path.
    // Our Express app expects routes to start with '/api'.
    if (!req.url.startsWith('/api')) {
        req.url = `/api${req.url}`;
    }

    // Forward request to Express app
    app(req, res);
}
