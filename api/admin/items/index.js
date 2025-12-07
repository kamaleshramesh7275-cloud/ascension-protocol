import { neon } from "@neondatabase/serverless";

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, x-admin-password');

    if (req.method === 'OPTIONS') { res.status(200).end(); return; }

    const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin123";
    const adminPasswordHeader = req.headers["x-admin-password"];

    if (adminPasswordHeader !== ADMIN_PASSWORD) {
        return res.status(403).json({ error: "Unauthorized" });
    }

    const sql = neon(process.env.DATABASE_URL);

    try {
        if (req.method === 'GET') {
            const items = await sql`SELECT * FROM shop_items`;
            return res.status(200).json(items);
        }

        if (req.method === 'POST') {
            const { name, description, cost, type, rarity, value, image_url } = req.body;
            // Basic validation
            if (!name || !cost || !type) return res.status(400).json({ error: "Missing required fields" });

            const newItem = await sql`
                INSERT INTO shop_items (name, description, cost, type, rarity, value, image_url)
                VALUES (${name}, ${description || ''}, ${cost}, ${type}, ${rarity || 'common'}, ${value || ''}, ${image_url})
                RETURNING *
             `;
            return res.status(200).json(newItem[0]);
        }

        return res.status(405).json({ error: "Method not allowed" });
    } catch (error) {
        console.error("Admin Items Error:", error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
}
