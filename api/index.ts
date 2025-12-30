// Universal API handler for all /api/* routes
// Using dynamic imports to prevent boot-time crashes and allow for better error reporting

let initializedPromise: Promise<any> | null = null;
let initError: any = null;
let expressApp: any = null;

export default async function handler(req: any, res: any) {
    console.log(`[API Handler] Request received: ${req.method} ${req.url} at ${new Date().toISOString()}`);

    try {
        // 1. Check for previous initialization errors
        if (initError) {
            console.error("[API Handler] Returning cached initialisation error");
            return res.status(500).json({
                error: "Server failed to initialize",
                details: initError.message || String(initError),
                stack: initError.stack
            });
        }

        // 2. Initialize if not already done
        if (!initializedPromise) {
            console.log("[API Handler] Starting lazy initialization...");
            initializedPromise = (async () => {
                try {
                    console.log("[API Handler] Importing dependencies...");
                    // Dynamic imports to catch errors during module loading
                    const { app } = await import("../server/app");
                    const { registerRoutes } = await import("../server/routes");

                    expressApp = app;
                    console.log("[API Handler] Registering routes...");
                    await registerRoutes(expressApp);
                    console.log("[API Handler] Initialization complete.");
                    return true;
                } catch (e: any) {
                    console.error("[API Handler] Critical error during lazy initialization:", e);
                    initError = e;
                    throw e;
                }
            })();
        }

        // 3. Wait for initialization
        await initializedPromise;

        // 4. Transform URL for Express (Vercel routes /api/foo to /foo)
        if (req.url && !req.url.startsWith('/api')) {
            const originalUrl = req.url;
            req.url = `/api${req.url}`;
            console.log(`[API Handler] Rewrote URL from ${originalUrl} to ${req.url}`);
        }

        // 5. Forward to Express
        console.log("[API Handler] Forwarding to Express app...");
        return expressApp(req, res);

    } catch (error: any) {
        console.error("[API Handler] Global error caught in handler:", error);

        if (!res.headersSent) {
            res.status(500).json({
                error: "Internal server error during request processing",
                details: error.message || String(error),
                stack: error.stack,
                phase: initializedPromise ? "runtime" : "boot"
            });
        }
    }
}
