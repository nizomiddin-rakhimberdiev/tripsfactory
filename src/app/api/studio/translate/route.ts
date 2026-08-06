/**
 * Fill a record's other seven locales from its English text.
 *
 * Called after every save in the Studio, and by the "Tarjimalarni yangilash"
 * button on a tour. Editors write English; nobody is going to type an Uzbek,
 * Japanese and German version of the same itinerary by hand, and without this
 * Payload falls back to English — a Japanese visitor reading English prose
 * under a Japanese URL.
 *
 * Two modes:
 *
 * - default: only locales that hold no text of their own are filled, so a
 *   translation somebody has since corrected is never overwritten, and a save
 *   that changed a price does not spend anything.
 * - `force`: every locale is rewritten from the current English. That is the
 *   button, pressed deliberately after the English has changed.
 *
 * Admin-only, because it spends money on an external API.
 */
import { NextResponse } from "next/server";
import { getPayload } from "payload";
import config from "@payload-config";
import { z } from "zod";
import type { CollectionSlug, TypedLocale } from "payload";
import { TARGET_LOCALES, translateInto, type Translatable } from "@/lib/import/translate";
import {
  TITLE_FIELD,
  TRANSLATABLE,
  TRANSLATABLE_COLLECTIONS,
} from "@/lib/studio/translatable";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const bodySchema = z.object({
  collection: z.enum(TRANSLATABLE_COLLECTIONS as [string, ...string[]]),
  id: z.number().int().positive(),
  force: z.boolean().optional(),
});

/** Payload returns `{ en: "…", uz: "…" }` for a localized field read with locale:all. */
type Localized<T> = Record<string, T>;
type Row = Record<string, unknown>;
type Doc = Record<string, Localized<string> | Localized<Row[]> | unknown>;

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
    const { collection, id, force } = parsed.data;
    const spec = TRANSLATABLE[collection];

    const doc = (await payload
      .findByID({
        collection: collection as CollectionSlug,
        id,
        locale: "all",
        depth: 0,
      })
      .catch(() => null)) as Doc | null;

    if (!doc) {
      return NextResponse.json({ error: "Yozuv topilmadi." }, { status: 404 });
    }

    const titleField = TITLE_FIELD[collection];
    const englishTitle =
      (doc[titleField] as Localized<string> | undefined)?.en ?? "";
    if (!englishTitle.trim()) {
      return NextResponse.json(
        { error: "Inglizcha matn bo'sh — avval uni to'ldiring." },
        { status: 400 },
      );
    }

    /**
     * A locale needs filling when any translatable field of it is still
     * English — not just the title.
     *
     * Payload's fallback returns the English string for a locale nobody
     * filled, so equality with English is what separates "not translated"
     * from "translated". Checking only the title would skip a record whose
     * name was translated last month and whose newly written description is
     * still in English.
     */
    const needsLocale = (loc: string): boolean =>
      spec.text.some((field) => {
        const values = doc[field] as Localized<string> | undefined;
        const en = values?.en ?? "";
        if (!en.trim()) return false; // nothing to translate in this field
        const value = values?.[loc] ?? "";
        return !value.trim() || value === en;
      }) ||
      spec.arrays.some(({ name, keys }) => {
        const rows = doc[name] as Localized<Row[]> | undefined;
        const en = rows?.en ?? [];
        if (!en.length) return false;
        const other = rows?.[loc] ?? [];
        if (other.length !== en.length) return true;
        return en.some((row, i) =>
          keys.some((key) => {
            const source = String(row[key] ?? "");
            if (!source.trim()) return false;
            const target = String(other[i]?.[key] ?? "");
            return !target.trim() || target === source;
          }),
        );
      });

    const targets = force
      ? TARGET_LOCALES
      : TARGET_LOCALES.filter(needsLocale);

    if (!targets.length) {
      return NextResponse.json({ translated: [], failed: [], skipped: true });
    }

    // Flatten to one payload: plain fields by name, array rows by position, so
    // the reply can be rebuilt into the same shape it came from.
    const source: Translatable = {};
    for (const field of spec.text) {
      source[field] = (doc[field] as Localized<string> | undefined)?.en ?? "";
    }
    for (const { name, keys } of spec.arrays) {
      const rows = (doc[name] as Localized<Row[]> | undefined)?.en ?? [];
      rows.forEach((row, i) => {
        for (const key of keys) {
          source[`${name}.${i}.${key}`] = String(row[key] ?? "");
        }
      });
    }

    const { done, failed } = await translateInto(source, targets);

    for (const [locale, out] of Object.entries(done)) {
      const data: Record<string, unknown> = {};
      for (const field of spec.text) {
        if (typeof out[field] === "string") data[field] = out[field];
      }
      for (const { name, keys } of spec.arrays) {
        const rows = (doc[name] as Localized<Row[]> | undefined)?.en ?? [];
        if (!rows.length) continue;
        data[name] = rows.map((row, i) => {
          // `id` is dropped deliberately. A localized array row carries the
          // primary key of the *English* row, and sending it back while
          // writing another locale makes Payload insert that same key again —
          // "UNIQUE constraint failed: tours_itinerary.id". Payload assigns a
          // fresh key per locale when none is given.
          const { id: _rowId, ...rest } = row as Row & { id?: unknown };
          const next: Row = { ...rest };
          for (const key of keys) {
            const value = out[`${name}.${i}.${key}`];
            if (typeof value === "string") next[key] = value;
          }
          return next;
        });
      }
      try {
        await payload.update({
          collection: collection as CollectionSlug,
          id,
          data,
          locale: locale as TypedLocale,
        });
      } catch (err) {
        // Logged, not swallowed: a locale reported as failed that actually
        // landed sends the editor looking for a problem that is not there,
        // and one that genuinely failed needs a reason attached.
        console.error(`translate: writing ${collection}/${id} ${locale}`, err);
        failed.push(locale);
      }
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
