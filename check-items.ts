import { db } from "./server/db";
import { shopItems } from "./shared/schema";

async function run() {
    const items = await db.select().from(shopItems);
    console.log("DB Items:", items.map(i => ({ id: i.id, name: i.name })));
    process.exit(0);
}

run().catch(console.error);
