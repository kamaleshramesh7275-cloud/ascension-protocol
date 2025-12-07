// Standalone check-username endpoint
import { neon } from "@neondatabase/serverless";

export default async function handler(req: any, res: any) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        // Extract username from URL path
        const username = req.url?.split('/').pop();

        if (!username) {
            return res.status(400).json({ error: "Username is required" });
        }

        const sql = neon(process.env.DATABASE_URL!);

        const [existing] = await sql`
            SELECT id FROM credentials WHERE username = ${username}
        `;

        return res.status(200).json({ exists: !!existing });

    } catch (error: any) {
        console.error("Check username error:", error);
        return res.status(500).json({
            error: "Failed to check username",
            details: error.message
        });
    }
}
