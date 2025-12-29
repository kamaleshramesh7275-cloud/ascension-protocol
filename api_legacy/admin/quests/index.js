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
            // Fetch all quests with user names
            const quests = await sql`
                SELECT q.*, u.name as user_name 
                FROM quests q 
                LEFT JOIN users u ON q.user_id = u.id
                ORDER BY q.created_at DESC
            `;

            const mapped = quests.map(q => ({
                id: q.id,
                userId: q.user_id,
                userName: q.user_name,
                title: q.title,
                description: q.description,
                type: q.type,
                completed: q.completed,
                rewardXP: q.reward_xp,
                rewardCoins: q.reward_coins,
                dueAt: q.due_at,
                createdAt: q.created_at
            }));

            return res.status(200).json(mapped);
        }

        if (req.method === 'POST') {
            const { userId, title, description, type, rewardXP, rewardCoins, rewardStats, dueAt } = req.body;

            if (!userId || !title || !description) return res.status(400).json({ error: "Missing required fields" });

            const newQuest = await sql`
                INSERT INTO quests (user_id, title, description, type, reward_xp, reward_coins, reward_stats, due_at, completed)
                VALUES (
                    ${userId}, 
                    ${title}, 
                    ${description}, 
                    ${type || 'custom'}, 
                    ${rewardXP || 50}, 
                    ${rewardCoins || 0}, 
                    ${rewardStats ? JSON.stringify(rewardStats) : '{}'}, 
                    ${dueAt ? new Date(dueAt) : new Date(Date.now() + 7 * 86400000)},
                    false
                )
                RETURNING *
             `;

            return res.status(200).json(newQuest[0]);
        }

        return res.status(405).json({ error: "Method not allowed" });
    } catch (error) {
        console.error("Admin Quests Error:", error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
}
