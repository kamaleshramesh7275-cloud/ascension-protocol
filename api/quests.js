import { neon } from "@neondatabase/serverless";

export default async function handler(req, res) {
    const sql = neon(process.env.DATABASE_URL);
    const firebaseUid = req.headers["x-firebase-uid"];

    if (!firebaseUid) {
        return res.status(401).json({ error: "Unauthorized" });
    }

    try {
        if (req.method === 'GET') {
            // Get user id first
            const users = await sql`SELECT id FROM users WHERE firebase_uid = ${firebaseUid}`;
            if (users.length === 0) return res.status(404).json({ error: "User not found" });
            const userId = users[0].id;

            // Fetch quests
            const quests = await sql`SELECT * FROM quests WHERE user_id = ${userId}`;
            return res.status(200).json(quests);
        }

        return res.status(405).json({ error: "Method not allowed" });
    } catch (error) {
        console.error("Quests error:", error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
}
