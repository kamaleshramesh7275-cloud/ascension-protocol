import { neon } from "@neondatabase/serverless";

export default async function handler(req, res) {
    // CORS
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
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
            const users = await sql`SELECT * FROM users ORDER BY created_at DESC`;
            // Map db columns to frontend expectations if needed (drizzle handles this usually but here raw sql)
            // Schema has camelCase in typescript but snake_case in DB usually? 
            // Drizzle schema uses snake_case column names.
            // users table: firebase_uid, onboarding_completed, avatar_url, etc.
            // Frontend expects camelCase. We must map it.

            const strategies = {
                created_at: 'createdAt',
                firebase_uid: 'firebaseUid',
                avatar_url: 'avatarUrl',
                onboarding_completed: 'onboardingCompleted',
                active_title: 'activeTitle',
                active_badge_id: 'activeBadgeId',
                study_subject: 'studySubject',
                study_availability: 'studyAvailability',
                last_active: 'lastActive',
                current_goal: 'currentGoal'
            };

            const mappedUsers = users.map(u => {
                const newObj = { ...u };
                for (const [snake, camel] of Object.entries(strategies)) {
                    if (newObj[snake] !== undefined) {
                        newObj[camel] = newObj[snake];
                        delete newObj[snake];
                    }
                }
                return newObj;
            });

            return res.status(200).json(mappedUsers);
        }

        return res.status(405).json({ error: "Method not allowed" });
    } catch (error) {
        console.error("Admin Users Error:", error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
}
