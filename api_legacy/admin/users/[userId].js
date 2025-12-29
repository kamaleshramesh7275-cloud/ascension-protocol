import { neon } from "@neondatabase/serverless";

export default async function handler(req, res) {
    const { userId } = req.query; // Next.js dynamic route param

    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE');
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
            await sql`DELETE FROM users WHERE id = ${userId}`;
            // Also delete credentials, notifications, etc? Foreign keys usually CASCADE but let's be safe if not.
            // Assuming CASCADE is set up or we accept orphans for now. 
            // Credentials has CASCADE usually.

            return res.status(200).json({ success: true, message: "User deleted successfully" });
        }

        if (req.method === 'PATCH') {
            const updates = req.body;
            // Filter allowed fields
            const allowed = [
                'name', 'email', 'level', 'xp', 'tier', 'coins', 'streak',
                'strength', 'agility', 'stamina', 'vitality', 'intelligence', 'willpower', 'charisma'
            ];

            // Construct dynamic update query
            // With neon tagged template literals, we can't easily build dynamic sets without a helper or careful construction.
            // But we can do individual updates or one big CASE. for simplicity and since fields are many:
            // Actually, for a single row update, we can't easily use dynamic columns in `sql` tag.
            // We'll standard Drizzle approach would be better but we are using raw neon for serverless speed/compat.
            // Let's use a loop or direct listing.

            // Proper way with neon:
            // UPDATE users SET col1 = val1, col2 = val2 WHERE id = id

            // We can't interpolate column names directly. 
            // Since this is admin and low volume, we can run multiple queries or one big query if we hardcode all possible fields.

            const setClauses = [];
            const values = [];

            // Mapping for camelCase body to snake_case db
            const strategies = {
                createdAt: 'created_at',
                firebaseUid: 'firebase_uid',
                avatarUrl: 'avatar_url',
                onboardingCompleted: 'onboarding_completed',
                activeTitle: 'active_title',
                activeBadgeId: 'active_badge_id',
                studySubject: 'study_subject',
                studyAvailability: 'study_availability',
                lastActive: 'last_active',
                currentGoal: 'current_goal'
            };

            // Helper to get db col name
            const getDbCol = (k) => strategies[k] || k; // Fallback to same name (e.g. name, email, xp, level)

            // We must be careful about SQL injection with column names, but allowed fields whitelist handles that.

            // Actually, `neon` doesn't support dynamic column identifiers. 
            // We will just do a hard update of the common fields if present.

            // Let's fetch the current user first to merge? No, PATCH is partial.

            // Constructing a manual query string is risky but `allowed` whitelist makes it safe-ish if we verify keys.
            // But `neon` driver doesn't like raw strings mixed with params easily.

            // Plan B: Use a big COALESCE update for all fields:
            // UPDATE users SET name = COALESCE(${name}, name), xp = COALESCE(${xp}, xp) ... WHERE id = ${userId}
            // Pass null (or undefined) for missing fields.

            // We need to pass `undefined` or `null` for fields not in `updates`.
            const getVal = (k) => updates[k] === undefined ? null : updates[k];

            const updated = await sql`
                UPDATE users SET
                    name = COALESCE(${getVal('name')}, name),
                    email = COALESCE(${getVal('email')}, email),
                    level = COALESCE(${getVal('level')}, level),
                    xp = COALESCE(${getVal('xp')}, xp),
                    tier = COALESCE(${getVal('tier')}, tier),
                    coins = COALESCE(${getVal('coins')}, coins),
                    streak = COALESCE(${getVal('streak')}, streak),
                    strength = COALESCE(${getVal('strength')}, strength),
                    agility = COALESCE(${getVal('agility')}, agility),
                    stamina = COALESCE(${getVal('stamina')}, stamina),
                    vitality = COALESCE(${getVal('vitality')}, vitality),
                    intelligence = COALESCE(${getVal('intelligence')}, intelligence),
                    willpower = COALESCE(${getVal('willpower')}, willpower),
                    charisma = COALESCE(${getVal('charisma')}, charisma)
                WHERE id = ${userId}
                RETURNING *
            `;

            // Map back to camelCase
            const u = updated[0];
            const mappedUser = { ...u }; // (apply same mapping logic as GET users if needed, but admin might not care as much about response body for PATCH)

            return res.status(200).json(mappedUser);
        }

        return res.status(405).json({ error: "Method not allowed" });
    } catch (error) {
        console.error("Admin User Operation Error:", error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
}
