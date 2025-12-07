// Debug version of user endpoint
import { neon } from "@neondatabase/serverless";

export default async function handler(req: any, res: any) {
    try {
        const firebaseUid = req.headers["x-firebase-uid"];

        console.log("[DEBUG] Method:", req.method);
        console.log("[DEBUG] Headers:", req.headers);
        console.log("[DEBUG] firebaseUid:", firebaseUid);

        if (!firebaseUid) {
            return res.status(401).json({ error: "Unauthorized", debug: "No x-firebase-uid header" });
        }

        const sql = neon(process.env.DATABASE_URL!);

        if (req.method === "GET") {
            console.log("[DEBUG] Querying for user with firebaseUid:", firebaseUid);

            const users = await sql`
                SELECT * FROM users WHERE firebase_uid = ${firebaseUid}
            `;

            console.log("[DEBUG] Query result:", users);

            if (users.length === 0) {
                return res.status(404).json({
                    error: "User not found",
                    debug: {
                        firebaseUid,
                        queryReturned: users.length
                    }
                });
            }

            return res.status(200).json(users[0]);
        }

        return res.status(405).json({ error: "Method not allowed" });

    } catch (error: any) {
        console.error("[ERROR] User endpoint:", error);
        return res.status(500).json({
            error: "Internal server error",
            details: error.message,
            stack: error.stack?.split('\n').slice(0, 5)
        });
    }
}
