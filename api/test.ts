// Minimal test - no imports, no DB
export default async function handler(req: any, res: any) {
    try {
        console.log("Test endpoint hit");
        return res.status(200).json({
            message: "Minimal endpoint works",
            method: req.method,
            url: req.url
        });
    } catch (error: any) {
        console.error("Test endpoint error:", error);
        return res.status(500).json({ error: error.message });
    }
}
