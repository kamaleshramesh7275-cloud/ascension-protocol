// Standalone registration endpoint - no complex imports
import { neon } from "@neondatabase/serverless";
import bcrypt from "bcryptjs";
import { randomUUID } from "crypto";

export default async function handler(req: any, res: any) {
    // Only allow POST
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { username, password, age, weight, height, pushups, pullups, intelligence, willpower, charisma, vitality } = req.body;

        // Validation
        if (!username || !password) {
            return res.status(400).json({ error: "Username and password are required" });
        }

        if (username.length < 3) {
            return res.status(400).json({ error: "Username must be at least 3 characters" });
        }

        if (password.length < 8) {
            return res.status(400).json({ error: "Password must be at least 8 characters" });
        }

        // Connect to database
        if (!process.env.DATABASE_URL) {
            return res.status(500).json({ error: "Database not configured" });
        }

        const sql = neon(process.env.DATABASE_URL);

        // Check if username exists
        const existingUser = await sql`
            SELECT id FROM credentials WHERE username = ${username}
        `;

        if (existingUser.length > 0) {
            return res.status(400).json({ error: "Username already taken" });
        }

        // Hash password
        const passwordHash = await bcrypt.hash(password, 10);

        // Create user
        const firebaseUid = `local_${randomUUID()}`;

        const [user] = await sql`
            INSERT INTO users (firebase_uid, name, email, avatar_url, timezone, onboarding_completed, assessment_data)
            VALUES (
                ${firebaseUid},
                ${username},
                ${`${username}@local.ascension`},
                NULL,
                'UTC',
                false,
                ${JSON.stringify({ age, weight, height, pushups, pullups, intelligence, willpower, vitality, charisma })}
            )
            RETURNING id, firebase_uid
        `;

        // Save credentials
        await sql`
            INSERT INTO credentials (user_id, username, password_hash)
            VALUES (${user.id}, ${username}, ${passwordHash})
        `;

        // Calculate stats
        let strength = 10;
        let agility = 10;
        let stamina = 10;
        let calculatedVitality = 10;

        if (pushups > 50) strength += 30;
        else if (pushups > 30) strength += 20;
        else if (pushups > 10) strength += 10;

        if (pullups > 10) strength += 10;

        if (pullups > 15) agility += 30;
        else if (pullups > 8) agility += 20;
        else if (pullups > 2) agility += 10;

        if (pushups > 60) stamina += 30;
        else if (pushups > 40) stamina += 20;
        else if (pushups > 20) stamina += 10;

        if (weight && height) {
            const heightInM = height / 100;
            const bmi = weight / (heightInM * heightInM);
            if (bmi >= 18.5 && bmi <= 25) calculatedVitality += 20;
            else if (bmi > 25 && bmi < 30) calculatedVitality += 10;
        }

        calculatedVitality += (vitality || 5);

        const cap = (val: number) => Math.min(100, Math.max(1, val));

        // Update user with stats
        await sql`
            UPDATE users SET
                strength = ${cap(strength)},
                agility = ${cap(agility)},
                stamina = ${cap(stamina)},
                vitality = ${cap(calculatedVitality)},
                intelligence = ${cap((intelligence || 5) * 4)},
                willpower = ${cap((willpower || 5) * 4)},
                charisma = ${cap((charisma || 5) * 4)},
                onboarding_completed = true,
                coins = 100
            WHERE id = ${user.id}
        `;

        return res.status(200).json({
            success: true,
            userId: user.id,
            firebaseUid: user.firebase_uid
        });

    } catch (error: any) {
        console.error("Registration error:", error);
        return res.status(500).json({
            error: "Failed to register",
            details: error.message
        });
    }
}
