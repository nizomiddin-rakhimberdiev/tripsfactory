/**
 * Generates the tour template on demand, with the dropdowns filled from the
 * live CMS.
 *
 * A static file in public/ would go stale the day a country is added, and a
 * manager would be typing into a workbook that offers cities the site no longer
 * has. Building it per download costs a few hundred milliseconds and keeps the
 * "pick, never type" guarantee true.
 */
import { getPayload } from "payload";
import config from "@payload-config";
import { buildWorkbook } from "@/lib/import/template";
import { loadReference } from "@/lib/import/reference";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const FILENAME = "tripsfactory-turlar-shablon.xlsx";

export async function GET(request: Request) {
  const payload = await getPayload({ config });
  const { user } = await payload.auth({ headers: request.headers });
  if (!user) {
    return new Response("Ruxsat yo'q.", { status: 401 });
  }

  const buffer = await buildWorkbook(await loadReference(payload));

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${FILENAME}"`,
      "Content-Length": String(buffer.byteLength),
      "Cache-Control": "no-store",
    },
  });
}
