import { config } from "dotenv";
config({ path: ".env.local" });

import { db } from "./server/db";
import { shopItems } from "./shared/schema";
import { eq } from "drizzle-orm";

async function run() {
    console.log("DB URL:", process.env.DATABASE_URL?.substring(0, 20) + "...");
    const items = await db!.select().from(shopItems);
    console.log("DB Items length:", items.length);
    if (items.length > 0) {
        const firstId = items[0].id;
        console.log("First item id:", firstId);
        const item = await db!.query.shopItems.findFirst({ where: eq(shopItems.id, firstId) });
        console.log("Found item by id:", item ? item.id : "NOT FOUND");
    }
    process.exit(0);
}

run().catch(console.error);
