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

            // First get the user to get their ID
            const [user] = await sql`
                SELECT id FROM users WHERE firebase_uid = ${firebaseUid}
            `;

            if (!user) {
                return res.status(404).json({ error: "User not found" });
            }

            // Build update query dynamically
            const updates: string[] = [];
            const values: any[] = [];
            let paramIndex = 1;

            if (name !== undefined) {
                updates.push(`name = $${paramIndex++}`);
                values.push(name);
            }
            if (email !== undefined) {
                updates.push(`email = $${paramIndex++}`);
                values.push(email);
            }
            if (avatarUrl !== undefined) {
                updates.push(`avatar_url = $${paramIndex++}`);
                values.push(avatarUrl);
            }
            if (currentGoal !== undefined) {
                updates.push(`current_goal = $${paramIndex++}`);
                values.push(currentGoal);
            }
            if (studySubject !== undefined) {
                updates.push(`study_subject = $${paramIndex++}`);
                values.push(studySubject);
            }
            if (studyAvailability !== undefined) {
                updates.push(`study_availability = $${paramIndex++}`);
                values.push(studyAvailability);
            }

            if (updates.length === 0) {
                return res.status(400).json({ error: "No fields to update" });
            }

            // Execute update using neon's tagged template
            const [updatedUser] = await sql`
                UPDATE users 
                SET ${sql(updates.join(', '))}
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
