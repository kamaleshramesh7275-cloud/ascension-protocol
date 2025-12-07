import { app } from "../server/app";
import { registerRoutes } from "../server/routes";

// Initialize routes once
let initialized = false;

// Vercel Serverless Function Config
export const config = {
    api: {
        bodyParser: false,
    },
};

export default async function handler(req: any, res: any) {
    if (!initialized) {
        const server = await registerRoutes(app);
        initialized = true;
    }

    // Forward request to Express app
    return app(req, res);
}
