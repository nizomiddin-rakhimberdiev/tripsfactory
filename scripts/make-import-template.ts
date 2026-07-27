/**
 * Writes the .xlsx tour template to public/ as an offline fallback.
 *
 * Usage:
 *   npm run template          # generic country/city lists, no database needed
 *   npm run template -- --live  # real dropdowns pulled from the CMS
 *
 * The copy managers should actually use is the one Studio generates on demand
 * (Studio → Sheets import → «Shablonni yuklab olish»), because that one always
 * carries the current countries and cities. This file exists so the template
 * can still be produced when the database is unreachable, and so the workbook
 * can be inspected without booting the app.
 */
import path from "path";
import { writeFile } from "fs/promises";
import { fileURLToPath } from "url";
import { buildWorkbook, PLACEHOLDER_REFERENCE, type ReferenceData } from "../src/lib/import/template";

const dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.resolve(dirname, "../public/tripsfactory-turlar-shablon.xlsx");

async function reference(): Promise<ReferenceData> {
  if (!process.argv.includes("--live")) return PLACEHOLDER_REFERENCE;

  const [{ getPayload }, { default: config }, { loadReference }] = await Promise.all([
    import("payload"),
    import("../src/payload.config"),
    import("../src/lib/import/reference"),
  ]);
  const payload = await getPayload({ config });
  const ref = await loadReference(payload);
  console.log(`Jonli ma'lumot: ${ref.countries.length} davlat, ${ref.cities.length} shahar.`);
  return ref;
}

async function main() {
  const buffer = await buildWorkbook(await reference());
  await writeFile(OUT, buffer);
  console.log(`Shablon yozildi: ${path.relative(process.cwd(), OUT)}`);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
