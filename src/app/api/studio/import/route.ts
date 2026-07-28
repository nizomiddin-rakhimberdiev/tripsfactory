/**
 * Studio → Google Sheets import.
 *
 * `mode: "preview"` reads the sheet and reports what would happen; only
 * `mode: "commit"` writes. Both are admin-only: this route creates site content
 * from an outside URL, so an unauthenticated caller must never reach the fetch.
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
// Downloading photos from someone else's CDN is the slow part.
export const maxDuration = 60;

const bodySchema = z.object({
  url: z.string().min(1).max(500),
  mode: z.enum(["preview", "commit"]),
});

export async function POST(request: Request) {
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
      report: {
        plans: [],
        issues: issues.length
          ? issues
          : [
              {
                row: null,
                level: "error" as const,
                message:
                  "Jadvalda bironta ham to'ldirilgan tur topilmadi. Ustun nomlari o'zgartirilmaganini " +
                  "va turlar 8-qatordan boshlab yozilganini tekshiring.",
              },
            ],
      },
    });
  }

  const report =
    parsed.data.mode === "commit"
      ? await apply(payload, tours, issues)
      : await plan(payload, tours, issues);

  return NextResponse.json({ report });
}
