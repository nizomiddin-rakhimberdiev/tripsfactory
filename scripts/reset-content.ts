/**
 * Wipes all CONTENT collections (keeps users) — used to re-run a failed seed.
 * Usage: DATABASE_URL=... PAYLOAD_SECRET=... npm run reset-content
 */
import { getPayload } from "payload";
import config from "../src/payload.config";

const payload = await getPayload({ config });
const collections = [
  "tours",
  "guides",
  "cities",
  "countries",
  "regions",
  "media",
  "leads",
] as const;

for (const collection of collections) {
  const res = await payload.delete({
    collection,
    where: { id: { exists: true } },
  });
  console.log(`${collection}: ${res.docs.length} deleted`);
}
console.log("Content reset complete.");
process.exit(0);
