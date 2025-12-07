// Standalone user endpoint - GET and PATCH user data
import { neon } from "@neondatabase/serverless";

export default async function handler(req: any, res: any) {
    const sql = neon(process.env.DATABASE_URL!);

    // Get firebaseUid from header
    const firebaseUid = req.headers["x-firebase-uid"];

    if (!firebaseUid) {
        return res.status(401).json({ error: "Unauthorized" });
    }

    try {
        if (req.method === "GET") {
            // Fetch user by firebaseUid
            const [user] = await sql`
                SELECT * FROM users WHERE firebase_uid = ${firebaseUid}
            `;

            if (!user) {
                return res.status(404).json({ error: "User not found" });
            }

            // TODO: Assign daily/weekly quests if needed
            // For now, just return user data

            return res.status(200).json(user);

        } else if (req.method === "PATCH") {
            // Update user profile
            const { name, email, avatarUrl, currentGoal, studySubject, studyAvailability } = req.body;

            // First get the user
            const [user] = await sql`
                SELECT * FROM users WHERE firebase_uid = ${firebaseUid}
            `;

            if (!user) {
                return res.status(404).json({ error: "User not found" });
            }

            // Update with new values, keeping existing values if not provided
            const [updatedUser] = await sql`
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

            return res.status(200).json(updatedUser);

        } else {
            return res.status(405).json({ error: "Method not allowed" });
        }

    } catch (error: any) {
        console.error("User endpoint error:", error);
        return res.status(500).json({
            error: "Internal server error",
            details: error.message
        });
    }
}
