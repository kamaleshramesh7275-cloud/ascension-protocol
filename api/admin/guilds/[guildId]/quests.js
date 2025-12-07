import { neon } from "@neondatabase/serverless";

export default async function handler(req, res) {
    const { guildId } = req.query;

    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, x-admin-password');

    if (req.method === 'OPTIONS') { res.status(200).end(); return; }

    const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin123";
    const adminPasswordHeader = req.headers["x-admin-password"];

    if (adminPasswordHeader !== ADMIN_PASSWORD) {
        return res.status(403).json({ error: "Unauthorized" });
    }

    const sql = neon(process.env.DATABASE_URL);

    try {
        if (req.method === 'POST') {
            const { title, description, type, targetValue, rewardXP, rewardCoins, dueAt } = req.body;

            // insertGuildQuestSchema fields
            // guildId is from params

            const newQuest = await sql`
                INSERT INTO guild_quests (guild_id, title, description, type, target_value, current_value, reward_xp, reward_coins, due_at, completed)
                VALUES (
                    ${guildId},
                    ${title},
                    ${description},
                    ${type || 'collective_xp'},
                    ${targetValue || 1000},
                    0,
                    ${rewardXP || 100},
                    ${rewardCoins || 10},
                    ${dueAt ? new Date(dueAt) : new Date(Date.now() + 7 * 86400000)},
                    false
                )
                RETURNING *
             `;

            return res.status(200).json(newQuest[0]);
        }

        return res.status(405).json({ error: "Method not allowed" });
    } catch (error) {
        console.error("Admin Guild Quest Error:", error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
}
