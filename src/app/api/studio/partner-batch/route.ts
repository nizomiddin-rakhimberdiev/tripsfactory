/**
 * Mints a batch of QR codes that belong to no hotel yet.
 *
 * Banners are ordered from a print shop thirty or forty at a time, and by then
 * only a handful of hotels have signed. Waiting for contracts means waiting to
 * print; printing a shared code means never knowing which hotel sent whom.
 *
 * So a code identifies the banner. It is minted here, printed, and works from
 * that moment — a guest who scans one before anybody has updated the Studio is
 * still counted against that banner. The hotel is attached when the contract
 * is signed, and the banner on the wall never changes.
 *
 * Numbering is done server-side in one pass so two people pressing the button
 * cannot mint the same code; the unique index is the backstop.
 */
import { NextResponse } from "next/server";
import { getPayload } from "payload";
import config from "@payload-config";
import { z } from "zod";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const bodySchema = z.object({
  count: z.number().int().min(1).max(100),
  /** Lowercase latin, so the printed URL stays typable. */
  prefix: z
    .string()
    .regex(/^[a-z][a-z0-9-]{0,10}$/)
    .optional(),
  commissionUsd: z.number().min(0).max(1000).optional(),
});

export async function POST(request: Request) {
  const payload = await getPayload({ config });
  const { user } = await payload.auth({ headers: request.headers });
  if (!user) {
    return NextResponse.json(
      { error: "Ruxsat yo'q. Qaytadan kiring." },
      { status: 401 },
    );
  }

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "So'rov noto'g'ri." }, { status: 400 });
  }
  const { count, prefix = "tf", commissionUsd = 15 } = parsed.data;

  const existing = await payload.find({
    collection: "partners",
    where: { code: { like: `${prefix}-` } },
    limit: 500,
    depth: 0,
  });

  // Continue the series rather than restarting it: codes already on a wall
  // must never be minted a second time.
  const highest = existing.docs.reduce((max, p) => {
    const n = Number(new RegExp(`^${prefix}-(\\d+)$`).exec(p.code)?.[1]);
    return Number.isFinite(n) && n > max ? n : max;
  }, 0);

  const created: { id: number; code: string; name: string }[] = [];
  const failed: string[] = [];

  for (let i = 1; i <= count; i++) {
    const number = highest + i;
    const code = `${prefix}-${String(number).padStart(3, "0")}`;
    try {
      const doc = await payload.create({
        collection: "partners",
        data: {
          // Named after the banner, because that is what it is until somebody
          // signs. The operator renames it to the hotel on assignment.
          name: `Banner ${code.toUpperCase()}`,
          code,
          type: "hotel",
          commissionUsd,
          active: true,
          assigned: false,
        },
      });
      created.push({ id: doc.id, code: doc.code, name: doc.name });
    } catch (err) {
      console.error("partner-batch: could not mint", code, err);
      failed.push(code);
    }
  }

  return NextResponse.json({ created, failed });
}
