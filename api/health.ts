export default function handler(req: any, res: any) {
    return res.status(200).json({
        status: "ok",
        timestamp: new Date().toISOString(),
        env: {
            hasDatabaseUrl: !!process.env.DATABASE_URL,
            hasSessionSecret: !!process.env.SESSION_SECRET
        }
    });
}
