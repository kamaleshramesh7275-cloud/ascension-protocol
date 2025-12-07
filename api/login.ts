// Standalone login endpoint
import { neon } from "@neondatabase/serverless";
import bcrypt from "bcryptjs";

export default async function handler(req: any, res: any) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ error: "Username and password are required" });
        }

        const sql = neon(process.env.DATABASE_URL!);

        // Get credentials
        const [credentials] = await sql`
            SELECT * FROM credentials WHERE username = ${username}
        `;

        if (!credentials) {
            return res.status(401).json({ error: "Invalid username or password" });
        }

        // Verify password
        const isValid = await bcrypt.compare(password, credentials.passwordHash);
        if (!isValid) {
            return res.status(401).json({ error: "Invalid username or password" });
        }

        // Get user
        const [user] = await sql`
            SELECT * FROM users WHERE id = ${credentials.userId}
        `;

        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        return res.status(200).json({
            success: true,
            userId: user.id,
            firebaseUid: user.firebase_uid
        });

    } catch (error: any) {
        console.error("Login error:", error);
        return res.status(500).json({
            error: "Failed to login",
            details: error.message
        });
    }
}
