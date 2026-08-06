/**
 * Re-translate one tour on request.
 *
 * The import fills the other seven locales once. If an editor then changes the
 * English text, those translations keep the old wording and nothing says so —
 * so this exists to be pressed deliberately from the tour page, rather than
 * re-translating on every save and overwriting corrections nobody asked to lose.
 *
 * Admin-only: it spends money on an external API.
 */
import { NextResponse } from "next/server";
import { getPayload } from "payload";
import config from "@payload-config";
import { z } from "zod";
import type { TypedLocale } from "payload";
import { TARGET_LOCALES, translateInto, type Translatable } from "@/lib/import/translate";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const bodySchema = z.object({ id: z.number().int().positive() });

type LocalizedTour = {
  title?: Record<string, string>;
  summary?: Record<string, string>;
  itinerary?: Record<string, { title?: string; description?: string }[]>;
  included?: Record<string, { text?: string }[]>;
  excluded?: Record<string, { text?: string }[]>;
};

export async function POST(request: Request) {
  try {
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

    const doc = (await payload
      .findByID({
        collection: "tours",
        id: parsed.data.id,
        locale: "all",
        depth: 0,
      })
      .catch(() => null)) as LocalizedTour | null;

    if (!doc) {
      return NextResponse.json({ error: "Tur topilmadi." }, { status: 404 });
    }

    const itinerary = doc.itinerary?.en ?? [];
    const source: Translatable = {
      title: doc.title?.en ?? "",
      summary: doc.summary?.en ?? "",
    };
    itinerary.forEach((d, i) => {
      source[`day${i}_title`] = d.title ?? "";
      source[`day${i}_description`] = d.description ?? "";
    });
    const included = (doc.included?.en ?? []).map((x) => x.text ?? "");
    const excluded = (doc.excluded?.en ?? []).map((x) => x.text ?? "");
    if (included.length) source.included = included;
    if (excluded.length) source.excluded = excluded;

    if (!String(source.title).trim()) {
      return NextResponse.json(
        { error: "Inglizcha matn bo'sh — avval uni to'ldiring." },
        { status: 400 },
      );
    }

    const { done, failed } = await translateInto(source, TARGET_LOCALES);

    for (const [locale, out] of Object.entries(done)) {
      const data: Record<string, unknown> = {
        title: out.title,
        summary: out.summary,
      };
      if (itinerary.length) {
        data.itinerary = itinerary.map((d, i) => ({
          title: out[`day${i}_title`] ?? d.title,
          description: out[`day${i}_description`] ?? d.description,
        }));
      }
      if (Array.isArray(out.included)) {
        data.included = out.included.map((text) => ({ text }));
      }
      if (Array.isArray(out.excluded)) {
        data.excluded = out.excluded.map((text) => ({ text }));
      }
      await payload
        .update({
          collection: "tours",
          id: parsed.data.id,
          data,
          locale: locale as TypedLocale,
        })
        .catch(() => failed.push(locale));
    }

    return NextResponse.json({
      translated: Object.keys(done).filter((l) => !failed.includes(l)),
      failed,
    });
  } catch (err) {
    console.error("studio/translate", err);
    return NextResponse.json(
      { error: "Tarjima qilib bo'lmadi. Keyinroq urinib ko'ring." },
      { status: 500 },
    );
  }
}
