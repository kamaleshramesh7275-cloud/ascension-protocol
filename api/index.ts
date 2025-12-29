import { app } from "../server/app";
import { registerRoutes } from "../server/routes";

// Initialize routes (this promise will resolve once locally, 
// ensuring routes are registered before handling requests)
const initialized = registerRoutes(app);

export default async function handler(req: any, res: any) {
    // Ensure routes are registered
    await initialized;

    // Forward request to Express app
    app(req, res);
}
