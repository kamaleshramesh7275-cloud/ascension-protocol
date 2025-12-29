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
        const guilds = await sql`SELECT * FROM guilds`;

        // Map snake_case to camelCase
        const mapped = guilds.map(g => ({
            id: g.id,
            name: g.name,
            description: g.description,
            memberCount: g.member_count,
            level: g.level,
            capacity: g.capacity,
            createdAt: g.created_at
        }));

        return res.status(200).json(mapped);
    } catch (error) {
        console.error("Admin Guilds Error:", error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
}
