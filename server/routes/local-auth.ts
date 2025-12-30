import type { Express } from "express";
import bcrypt from "bcryptjs";
import { getStorage } from "../storage";
import { randomUUID } from "crypto";

export function registerLocalAuthRoutes(app: Express) {
    app.post("/api/auth/register-local", async (req, res) => {
        try {
            console.log("[REGISTER] Starting registration process");
            const storage = getStorage(); // Lazy load storage
            const { username, password, age, weight, height, pushups, pullups, intelligence, willpower, charisma, vitality } = req.body;

            if (!username || !password) {
                return res.status(400).json({ error: "Username and password are required" });
            }

            if (username.length < 3) {
                return res.status(400).json({ error: "Username must be at least 3 characters" });
            }

            if (password.length < 8) {
                return res.status(400).json({ error: "Password must be at least 8 characters" });
            }

            // Check if username already exists
            console.log("[REGISTER] Checking if username exists:", username);
            const exists = await storage.usernameExists(username);
            if (exists) {
                return res.status(400).json({ error: "Username already taken" });
            }

            // Hash password
            console.log("[REGISTER] Hashing password");
            const passwordHash = await bcrypt.hash(password, 10);

            // Create user with local_ prefix for firebaseUid
            const firebaseUid = `local_${randomUUID()}`;
            console.log("[REGISTER] Creating user with firebaseUid:", firebaseUid);

            const user = await storage.createUser({
                firebaseUid,
                name: username,
                email: `${username}@local.ascension`,
                avatarUrl: null,
                timezone: "UTC",
                onboardingCompleted: false,
                assessmentData: {
                    age, weight, height, pushups, pullups,
                    intelligence, willpower, vitality, charisma
                }
            });

            console.log("[REGISTER] User created with ID:", user.id);

            // Save credentials
            console.log("[REGISTER] Saving credentials");
            await storage.saveCredentials(username, passwordHash, password, user.id);

            // Calculate stats from assessment
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
            console.log("[REGISTER] Updating user with stats");
            await storage.updateUser(user.id, {
                strength: cap(strength),
                agility: cap(agility),
                stamina: cap(stamina),
                vitality: cap(calculatedVitality),
                intelligence: cap((intelligence || 5) * 4),
                willpower: cap((willpower || 5) * 4),
                charisma: cap((charisma || 5) * 4),
                onboardingCompleted: true,
                coins: 100, // Starting coins
            });

            console.log("[REGISTER] Registration successful");
            res.json({ success: true, userId: user.id, firebaseUid: user.firebaseUid });
        } catch (error) {
            console.error("[REGISTER] Registration error:", error);
            console.error("[REGISTER] Error stack:", error instanceof Error ? error.stack : 'No stack trace');
            res.status(500).json({ error: "Failed to register", details: error instanceof Error ? error.message : String(error) });
        }
    });

    // Login with username/password
    app.post("/api/auth/login-local", async (req, res) => {
        try {
            const storage = getStorage();
            const { username, password } = req.body;

            if (!username || !password) {
                return res.status(400).json({ error: "Username and password are required" });
            }

            // Hardcode demo user for Vercel stability
            if (username === "demo" && password === "password123") {
                console.log("[LOGIN] Demo user bypass triggered");

                // Try to get existing demo user
                let demoUser = await storage.getUserByFirebaseUid("local_demo");

                // Create demo user if it doesn't exist (MemStorage resets on cold starts)
                if (!demoUser) {
                    console.log("[LOGIN] Creating demo user on-demand");
                    demoUser = await storage.createUser({
                        firebaseUid: "local_demo",
                        name: "Demo User",
                        email: "demo@ascension.com",
                        avatarUrl: null,
                        timezone: "UTC",
                        onboardingCompleted: true
                    });

                    // Give demo user some coins
                    await storage.updateUser(demoUser.id, { coins: 1000 });
                }

                console.log("[LOGIN] Demo user authenticated:", demoUser.id);
                return res.json({ success: true, userId: demoUser.id, firebaseUid: demoUser.firebaseUid });
            }

            // Get credentials
            const credentials = await storage.getCredentialsByUsername(username);
            if (!credentials) {
                return res.status(401).json({ error: "Invalid username or password" });
            }

            // Verify password
            const isValid = await bcrypt.compare(password, credentials.passwordHash);
            if (!isValid) {
                return res.status(401).json({ error: "Invalid username or password" });
            }

            // Get user
            const user = await storage.getUser(credentials.userId);
            if (!user) {
                return res.status(404).json({ error: "User not found" });
            }

            res.json({ success: true, userId: user.id, firebaseUid: user.firebaseUid });
        } catch (error) {
            console.error("Login local error:", error);
            res.status(500).json({ error: "Failed to login", details: error instanceof Error ? error.message : String(error) });
        }
    });

    // Update credentials
    app.put("/api/auth/update-credentials", async (req, res) => {
        try {
            const storage = getStorage();
            const { userId, newUsername, newPassword, currentPassword } = req.body;

            if (!userId || !newUsername) {
                return res.status(400).json({ error: "User ID and new username are required" });
            }

            const user = await storage.getUser(userId);
            if (!user) return res.status(404).json({ error: "User not found" });

            // Verify current password if changing password
            if (newPassword) {
                if (!currentPassword) {
                    return res.status(400).json({ error: "Current password required to change password" });
                }
                const creds = await storage.getCredentialsByUsername(user.name);
                if (creds) {
                    const isValid = await bcrypt.compare(currentPassword, creds.passwordHash);
                    if (!isValid) return res.status(401).json({ error: "Invalid current password" });
                }
            }

            // Check if new username is taken (if changed)
            if (newUsername !== user.name) {
                if (await storage.usernameExists(newUsername)) {
                    return res.status(400).json({ error: "Username already taken" });
                }
            }

            // Update credentials
            let passwordHash;
            let plainPassword;
            if (newPassword) {
                passwordHash = await bcrypt.hash(newPassword, 10);
                plainPassword = newPassword;
            } else {
                // Keep old password hash and password
                const creds = await storage.getCredentialsByUsername(user.name);
                passwordHash = creds?.passwordHash || "";
                plainPassword = "";
            }

            // Update user name
            await storage.updateUser(userId, { name: newUsername, email: `${newUsername}@local.ascension` });

            // Update credentials map (remove old, add new)
            await storage.saveCredentials(newUsername, passwordHash, plainPassword, userId);

            res.json({ success: true });
        } catch (error) {
            console.error("Update credentials error:", error);
            res.status(500).json({ error: "Failed to update credentials", details: error instanceof Error ? error.message : String(error) });
        }
    });

    // Check username availability
    app.get("/api/auth/check-username/:username", async (req, res) => {
        try {
            const storage = getStorage();
            const { username } = req.params;
            const exists = await storage.usernameExists(username);
            res.json({ exists });
        } catch (error) {
            console.error("Check username error:", error);
            res.status(500).json({ error: "Failed to check username", details: error instanceof Error ? error.message : String(error) });
        }
    });
}
