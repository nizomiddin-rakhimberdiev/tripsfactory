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
     * Which *fields* of a locale still need filling — not merely whether the
     * locale needs anything.
     *
     * Payload's fallback returns the English string for a locale nobody
     * filled, so "empty, or identical to English" is the only available signal
     * for "not translated". It is an imperfect one: "Wi-Fi", "Transfer" and a
     * proper noun come back from the model unchanged, which makes a fully
     * translated record look untranslated for ever.
     *
     * That mattered because the whole locale used to be rewritten whenever any
     * one field looked English. A record with a one-word list item was
     * re-translated on every save, and — worse — an editor's hand-corrected
     * paragraph in that locale was overwritten each time by a fresh machine
     * translation. Narrowing it to the fields that actually look untouched
     * costs nothing and makes a correction survive.
     */
    const needsText = (field: string, loc: string): boolean => {
      const values = doc[field] as Localized<string> | undefined;
      const en = values?.en ?? "";
      if (!en.trim()) return false; // nothing to translate in this field
      const value = values?.[loc] ?? "";
      return !value.trim() || value === en;
    };

    /** Row indexes and keys of one array field that are still English. */
    const needsRows = (
      name: string,
      keys: string[],
      loc: string,
    ): { i: number; key: string }[] => {
      const rows = doc[name] as Localized<Row[]> | undefined;
      const en = rows?.en ?? [];
      const other = rows?.[loc] ?? [];
      const out: { i: number; key: string }[] = [];
      en.forEach((row, i) => {
        for (const key of keys) {
          const source = String(row[key] ?? "");
          if (!source.trim()) continue;
          const target = String(other[i]?.[key] ?? "");
          if (!target.trim() || target === source) out.push({ i, key });
        }
      });
      return out;
    };

    /** The work for one locale: the field names and row cells to translate. */
    type Work = {
      locale: string;
      text: string[];
      arrays: { name: string; keys: string[]; cells: { i: number; key: string }[] }[];
    };

    const work: Work[] = TARGET_LOCALES.map((locale) => ({
      locale,
      text: spec.text.filter((f) =>
        force
          ? Boolean((doc[f] as Localized<string> | undefined)?.en?.trim())
          : needsText(f, locale),
      ),
      arrays: spec.arrays
        .map(({ name, keys }) => {
          const rows = (doc[name] as Localized<Row[]> | undefined)?.en ?? [];
          const cells = force
            ? rows.flatMap((row, i) =>
                keys
                  .filter((key) => String(row[key] ?? "").trim())
                  .map((key) => ({ i, key })),
              )
            : needsRows(name, keys, locale);
          return { name, keys, cells };
        })
        .filter((a) => a.cells.length),
    })).filter((w) => w.text.length || w.arrays.length);

    if (!work.length) {
      return NextResponse.json({ translated: [], failed: [], skipped: true });
    }

    const failed: string[] = [];
    const translated: string[] = [];

    // One request per locale, in parallel — each carrying only that locale's
    // gaps, so a record missing one German line does not re-translate seven
    // languages.
    const results = await Promise.all(
      work.map(async ({ locale, text, arrays }) => {
        // Flatten to one payload: plain fields by name, array cells by
        // position, so the reply can be rebuilt into the shape it came from.
        const source: Translatable = {};
        for (const field of text) {
          source[field] = (doc[field] as Localized<string> | undefined)?.en ?? "";
        }
        for (const { name, cells } of arrays) {
          const rows = (doc[name] as Localized<Row[]> | undefined)?.en ?? [];
          for (const { i, key } of cells) {
            source[`${name}.${i}.${key}`] = String(rows[i]?.[key] ?? "");
          }
        }
        const { done } = await translateInto(source, [locale]);
        return { locale, text, arrays, out: done[locale] ?? null };
      }),
    );

    for (const { locale, text, arrays, out } of results) {
      if (!out) {
        failed.push(locale);
        continue;
      }
      const data: Record<string, unknown> = {};
      for (const field of text) {
        if (typeof out[field] === "string") data[field] = out[field];
      }
      for (const { name, cells } of arrays) {
        const enRows = (doc[name] as Localized<Row[]> | undefined)?.en ?? [];
        const locRows = (doc[name] as Localized<Row[]> | undefined)?.[locale] ?? [];
        const wanted = new Set(cells.map((c) => `${c.i}.${c.key}`));
        data[name] = enRows.map((row, i) => {
          // `id` is dropped deliberately. A localized array row carries the
          // primary key of the *English* row, and sending it back while
          // writing another locale makes Payload insert that same key again —
          // "UNIQUE constraint failed: tours_itinerary.id". Payload assigns a
          // fresh key per locale when none is given.
          const { id: _rowId, ...rest } = row as Row & { id?: unknown };
          const next: Row = { ...rest };
          // Keep whatever this locale already had for cells nobody asked to
          // translate — that is where a manual correction lives.
          for (const [key, value] of Object.entries(locRows[i] ?? {})) {
            if (key !== "id" && typeof value === "string") next[key] = value;
          }
          for (const { key } of cells.filter((c) => c.i === i)) {
            const value = out[`${name}.${i}.${key}`];
            if (typeof value === "string" && wanted.has(`${i}.${key}`)) {
              next[key] = value;
            }
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
        translated.push(locale);
      } catch (err) {
        // Logged, not swallowed: a locale reported as failed that actually
        // landed sends the editor looking for a problem that is not there,
        // and one that genuinely failed needs a reason attached.
        console.error(`translate: writing ${collection}/${id} ${locale}`, err);
        failed.push(locale);
      }
    }

    return NextResponse.json({ translated, failed });
  } catch (err) {
    console.error("studio/translate", err);
    return NextResponse.json(
      { error: "Tarjima qilib bo'lmadi. Keyinroq urinib ko'ring." },
      { status: 500 },
    );
  }
}
