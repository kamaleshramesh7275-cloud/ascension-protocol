import { neon } from "@neondatabase/serverless";

export default async function handler(req, res) {
    const { id } = req.query;

    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'OPTIONS,DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, x-admin-password');

    if (req.method === 'OPTIONS') { res.status(200).end(); return; }

    const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin123";
    const adminPasswordHeader = req.headers["x-admin-password"];

    if (adminPasswordHeader !== ADMIN_PASSWORD) {
        return res.status(403).json({ error: "Unauthorized" });
    }

    const sql = neon(process.env.DATABASE_URL);

    try {
        if (req.method === 'DELETE') {
            await sql`DELETE FROM shop_items WHERE id = ${id}`;
            return res.status(200).json({ success: true });
        }

        return res.status(405).json({ error: "Method not allowed" });
    } catch (error) {
        console.error("Admin Item Delete Error:", error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
}
