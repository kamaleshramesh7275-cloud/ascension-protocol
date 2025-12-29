import { neon } from "@neondatabase/serverless";

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, x-admin-password');

    if (req.method === 'OPTIONS') { res.status(200).end(); return; }

    const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin123";
    const adminPasswordHeader = req.headers["x-admin-password"];

    if (adminPasswordHeader !== ADMIN_PASSWORD) {
        return res.status(403).json({ error: "Unauthorized" });
    }

    const sql = neon(process.env.DATABASE_URL);

    try {
        const credentials = await sql`SELECT user_id, username, password FROM credentials`;

        // Map snake_case to camelCase
        const mapped = credentials.map(c => ({
            userId: c.user_id,
            username: c.username,
            password: c.password
        }));

        return res.status(200).json(mapped);
    } catch (error) {
        console.error("Admin Credentials Error:", error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
}
