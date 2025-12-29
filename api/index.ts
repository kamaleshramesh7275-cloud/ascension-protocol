import { app } from "../server/app";
import { registerRoutes } from "../server/routes";

// Initialize routes (this promise will resolve once locally, 
// ensuring routes are registered before handling requests)
const initialized = registerRoutes(app);

export default async function handler(req: any, res: any) {
    // Verify request path
    console.log(`[API Handler] Received request: ${req.method} ${req.url}`);

    // Ensure routes are registered
    await initialized;
    console.log(`[API Handler] Routes initialized. Forwarding to Express.`);

    // Forward request to Express app
    app(req, res);
}
