// Standalone user endpoint - GET and PATCH user data
import { neon } from "@neondatabase/serverless";

export default async function handler(req, res) {
    const sql = neon(process.env.DATABASE_URL);

    // Get firebaseUid from header
    const firebaseUid = req.headers["x-firebase-uid"];

    console.log("[DEBUG] Method:", req.method);
    console.log("[DEBUG] firebaseUid:", firebaseUid);

    if (!firebaseUid) {
        return res.status(401).json({ error: "Unauthorized" });
    }

    try {
        if (req.method === "GET") {
            // Fetch user by firebaseUid
            const users = await sql`
                SELECT * FROM users WHERE firebase_uid = ${firebaseUid}
            `;

            if (users.length === 0) {
                return res.status(404).json({ error: "User not found" });
            }

            return res.status(200).json(users[0]);

        } else if (req.method === "PATCH") {
            // Update user profile
            const { name, email, avatarUrl, currentGoal, studySubject, studyAvailability } = req.body;

            // First get the user
            const users = await sql`
                SELECT * FROM users WHERE firebase_uid = ${firebaseUid}
            `;

            if (users.length === 0) {
                return res.status(404).json({ error: "User not found" });
            }

            const user = users[0];

            // Update with new values, keeping existing values if not provided
            const updatedUsers = await sql`
                UPDATE users 
                SET 
                    name = COALESCE(${name}, name),
                    email = COALESCE(${email}, email),
                    avatar_url = CASE WHEN ${avatarUrl !== undefined} THEN ${avatarUrl} ELSE avatar_url END,
                    current_goal = CASE WHEN ${currentGoal !== undefined} THEN ${currentGoal} ELSE current_goal END,
                    study_subject = CASE WHEN ${studySubject !== undefined} THEN ${studySubject} ELSE study_subject END,
                    study_availability = CASE WHEN ${studyAvailability !== undefined} THEN ${studyAvailability} ELSE study_availability END
                WHERE id = ${user.id}
                RETURNING *
            `;

            return res.status(200).json(updatedUsers[0]);

        } else {
            return res.status(405).json({ error: "Method not allowed" });
        }

    } catch (error) {
        console.error("User endpoint error:", error);
        return res.status(500).json({
            error: "Internal server error",
            details: error.message
        });
    }
}
