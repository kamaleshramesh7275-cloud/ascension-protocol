// More detailed error logging
export default async function handler(req: any, res: any) {
    const logs: string[] = [];

    try {
        logs.push("Step 1: Handler started");

        logs.push("Step 2: Attempting to import app...");
        const appModule = await import("../server/app");
        logs.push(`Step 3: App module imported, keys: ${Object.keys(appModule).join(', ')}`);

        logs.push("Step 4: Attempting to import routes...");
        const routesModule = await import("../server/routes");
        logs.push(`Step 5: Routes module imported, keys: ${Object.keys(routesModule).join(', ')}`);

        return res.status(200).json({
            success: true,
            logs,
            message: "All imports successful"
        });
    } catch (error: any) {
        logs.push(`ERROR at current step: ${error.message}`);

        return res.status(500).json({
            success: false,
            logs,
            error: {
                message: error.message,
                name: error.name,
                stack: error.stack?.split('\n').slice(0, 15),
                cause: error.cause
            }
        });
    }
}
