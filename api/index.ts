// Debug version - log each step to find crash point
export default async function handler(req: any, res: any) {
    try {
        console.log("[1] Handler started");

        // Try importing app
        console.log("[2] Importing app...");
        const { app } = await import("../server/app");
        console.log("[3] App imported");

        // Try importing routes
        console.log("[4] Importing registerRoutes...");
        const { registerRoutes } = await import("../server/routes");
        console.log("[5] registerRoutes imported");

        return res.status(200).json({
            status: "debug success",
            step: "imports completed",
            url: req.url
        });
    } catch (error: any) {
        console.error("[ERROR] Handler crashed:", error);
        return res.status(500).json({
            error: "Debug handler failed",
            message: error.message,
            stack: error.stack?.split('\n').slice(0, 10)
        });
    }
}
