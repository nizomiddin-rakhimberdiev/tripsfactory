/**
 * Studio → Google Sheets import endpoint.
 *
 * `mode: "preview"` reads the workbook and reports what would happen; only
 * `mode: "commit"` writes. Both are admin-only: the whole point of this route
 * is to create published site content from an outside URL, so an unauthenticated
 * caller must never reach the fetch.
 */
import { NextResponse } from "next/server";
import { getPayload } from "payload";
import config from "@payload-config";
import { z } from "zod";
import { apply, plan } from "@/lib/import/apply";
import { parseSheets, TAB } from "@/lib/import/schema";
import { fetchTab, spreadsheetId } from "@/lib/import/sheet";
import type { SheetIssue } from "@/lib/import/schema";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// Downloading a dozen hero images from someone else's CDN is the slow part.
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

  // The tours tab must be readable; the three child tabs are allowed to be
  // absent so a client with no departures or no day-by-day plan can still import.
  const issues: SheetIssue[] = [];
  const toursTab = await fetchTab(id.id, TAB.tours);
  if (!toursTab.ok) {
    return NextResponse.json({ error: toursTab.message }, { status: 400 });
  }

  const optional = await Promise.all(
    [TAB.days, TAB.price, TAB.departures, TAB.images].map(async (tab) => {
      const res = await fetchTab(id.id, tab);
      if (res.ok) return res.rows;
      issues.push({
        tab,
        row: null,
        message:
          res.reason === "missing_tab"
            ? `«${tab}» varag'i topilmadi — bu bo'limsiz import qilinadi.`
            : res.message,
        level: "warning",
      });
      return [] as string[][];
    }),
  );

  const { tours, issues: parseIssues } = parseSheets({
    tours: toursTab.rows,
    days: optional[0],
    price: optional[1],
    departures: optional[2],
    images: optional[3],
  });
  issues.push(...parseIssues);

  if (!tours.length) {
    return NextResponse.json({
      report: {
        issues: [
          ...issues,
          {
            tab: TAB.tours,
            row: null,
            message:
              "«Turlar» varag'ida bironta ham to'ldirilgan qator topilmadi. " +
              "Namuna qatorlari « # » bilan boshlanadi va ataylab hisobga olinmaydi — " +
              "o'z turlaringizni yangi qatorlarga yozing.",
            level: "error" as const,
          },
        ],
        plans: [],
      },
    });
  }

  const report =
    parsed.data.mode === "commit"
      ? await apply(payload, tours, issues)
      : await plan(payload, tours, issues);

  return NextResponse.json({ report });
}
