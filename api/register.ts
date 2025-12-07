// Test endpoint to see what's being received
export default async function handler(req: any, res: any) {
    try {
        return res.status(200).json({
            method: req.method,
            hasBody: !!req.body,
            body: req.body,
            headers: req.headers,
            env: {
                hasDatabaseUrl: !!process.env.DATABASE_URL,
                databaseUrlLength: process.env.DATABASE_URL?.length || 0
            }
        });
    } catch (error: any) {
        return res.status(500).json({
            error: error.message,
            stack: error.stack
        });
    }
}
