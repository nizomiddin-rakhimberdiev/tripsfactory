/**
 * Studio → Google Sheets import.
 *
 * `mode: "preview"` reads the sheet and reports what would happen; only
 * `mode: "commit"` writes. Both are admin-only: this route creates site content
 * from an outside URL, so an unauthenticated caller must never reach the fetch.
 *
 * A commit writes one batch and returns where to resume. Sixty-odd tours, each
 * inserting its own itinerary, inclusions and departures against a Postgres
 * instance across the network, does not reliably finish inside a serverless
 * function's time limit — and a run killed at the ceiling leaves a half-imported
 * catalogue with no way to tell how far it got. Batching turns that into a
 * sequence of short requests that can each fail harmlessly.
 */
import { NextResponse } from "next/server";
import { getPayload } from "payload";
import config from "@payload-config";
import { z } from "zod";
import { apply, plan } from "@/lib/import/apply";
import { parseSheet, SHEET_TAB } from "@/lib/import/schema";
import { fetchSheet, spreadsheetId } from "@/lib/import/sheet";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * The most a batch will attempt. It usually stops earlier — `apply` is given a
 * deadline and returns after whichever tour is in flight when it passes, so a
 * run that has to translate seven locales per tour shortens itself instead of
 * being killed at the ceiling.
 */
const BATCH = 8;

/** Leaves room inside maxDuration for the tour in flight to finish and reply. */
const BUDGET_MS = 40_000;

const bodySchema = z.object({
  url: z.string().min(1).max(500),
  mode: z.enum(["preview", "commit"]),
  offset: z.number().int().min(0).max(5000).optional(),
});

export async function POST(request: Request) {
  try {
    const payload = await getPayload({ config });
    const { user } = await payload.auth({ headers: request.headers });
    if (!user) {
      return NextResponse.json({ error: "Ruxsat yo'q. Qaytadan kiring." }, { status: 401 });
    }

    const parsed = bodySchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json({ error: "So'rov noto'g'ri." }, { status: 400 });
    }

    const id = spreadsheetId(parsed.data.url);
    if (!id.ok) return NextResponse.json({ error: id.message }, { status: 400 });

    const sheet = await fetchSheet(id.id, SHEET_TAB);
    if (!sheet.ok) return NextResponse.json({ error: sheet.message }, { status: 400 });

    const { tours, issues } = parseSheet(sheet.rows);

    if (!tours.length) {
      return NextResponse.json({
        total: 0,
        report: {
          plans: [],
          issues: issues.length
            ? issues
            : [
                {
                  row: null,
                  level: "error" as const,
                  message:
                    "Jadvalda bironta ham to'ldirilgan tur topilmadi. Ustun nomlari " +
                    "o'zgartirilmaganini va turlar 8-qatordan boshlab yozilganini tekshiring.",
                },
              ],
        },
      });
    }

    if (parsed.data.mode === "preview") {
      return NextResponse.json({
        total: tours.length,
        report: await plan(payload, tours, issues),
      });
    }

    const offset = parsed.data.offset ?? 0;
    const batch = tours.slice(offset, offset + BATCH);
    // Sheet-wide notes belong to the first batch only, or they repeat per batch.
    const report = await apply(
      payload,
      batch,
      offset === 0 ? issues : [],
      Date.now() + BUDGET_MS,
    );
    // However many it actually got through — not however many it was handed.
    const processed = report.outcomes?.length ?? batch.length;
    const nextOffset = offset + processed;

    return NextResponse.json({
      total: tours.length,
      done: nextOffset,
      nextOffset: nextOffset < tours.length ? nextOffset : null,
      report,
    });
  } catch (err) {
    // Without this the function returns Vercel's HTML error page, the client's
    // `res.json()` throws, and the operator is told "could not reach the server"
    // for a fault that has nothing to do with the network.
    const message = err instanceof Error ? err.message : "noma'lum xato";
    console.error("IMPORT-FAILED:", err);
    return NextResponse.json({ error: `Import xatosi: ${message}` }, { status: 500 });
  }
}
