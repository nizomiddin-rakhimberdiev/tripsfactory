/**
 * The two operations that keep a group tour and its private twin in step.
 *
 * `create` makes the missing version: a second record with the same writing,
 * its own slug and no price. `sync` pushes the writing from this tour to its
 * siblings, in every language.
 *
 * Both run on the server because both touch several records in several
 * locales, and half of that done in a browser that navigates away is a pair
 * of tours that disagree with each other.
 */
import { NextResponse } from "next/server";
import { getPayload } from "payload";
import config from "@payload-config";
import { z } from "zod";
import { LOCALE_CODES } from "@/lib/studio/locales";
import { SHARED_LOCALIZED, SHARED_PLAIN } from "@/lib/studio/variants";
import { TOUR_TYPES } from "@/lib/studio/tour-path";
import type { TypedLocale } from "payload";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const bodySchema = z.object({
  tourId: z.number().int().positive(),
  action: z.enum(["create", "sync"]),
  type: z.enum(TOUR_TYPES).optional(),
});

type Row = Record<string, unknown>;

/** Array rows carry the primary key of the locale they were read from. */
const stripIds = (value: unknown) =>
  Array.isArray(value)
    ? value.map((row) => {
        if (!row || typeof row !== "object") return row;
        const { id: _drop, ...rest } = row as Row & { id?: unknown };
        return rest;
      })
    : value;

const relId = (value: unknown): unknown =>
  Array.isArray(value)
    ? value.map(relId)
    : value && typeof value === "object" && "id" in value
      ? (value as { id: unknown }).id
      : value;

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
  const { tourId, action, type } = parsed.data;

  const source = (await payload
    .findByID({ collection: "tours", id: tourId, locale: "all", depth: 0 })
    .catch(() => null)) as Row | null;
  if (!source) {
    return NextResponse.json({ error: "Tur topilmadi." }, { status: 404 });
  }

  /** The English slug is the family name; a tour without one starts a family. */
  const key =
    (source.variantKey as string | null) ??
    (source.slug as string).replace(/-(group|private|custom)$/, "");

  if (action === "create") {
    if (!type) {
      return NextResponse.json({ error: "Turi ko'rsatilmagan." }, { status: 400 });
    }

    const slug = `${key}-${type}`;
    const clash = await payload.count({
      collection: "tours",
      where: { slug: { equals: slug } },
    });
    if (clash.totalDocs > 0) {
      return NextResponse.json(
        { error: `«${slug}» manzili allaqachon band.` },
        { status: 400 },
      );
    }

    // The new record carries the journey and none of the commercial terms:
    // a price copied from the group version onto a private one is a wrong
    // number that looks deliberate.
    const base: Row = { slug, type, variantKey: key, published: false };
    for (const field of SHARED_PLAIN) base[field] = relId(source[field]);
    for (const field of SHARED_LOCALIZED) {
      base[field] = stripIds((source[field] as Row)?.en);
    }
    base.title = `${(source.title as Row)?.en ?? key}`;

    const created = await payload.create({
      collection: "tours",
      data: base as never,
      locale: "en",
    });

    // Every other language of the shared text, written the same way the
    // Studio writes it — one request per locale.
    for (const locale of LOCALE_CODES.filter((l) => l !== "en")) {
      const data: Row = {};
      for (const field of SHARED_LOCALIZED) {
        const value = (source[field] as Row)?.[locale];
        if (value !== undefined) data[field] = stripIds(value);
      }
      const title = (source.title as Row)?.[locale];
      if (title) data.title = title;
      if (!Object.keys(data).length) continue;
      await payload
        .update({
          collection: "tours",
          id: created.id,
          data: data as never,
          locale: locale as TypedLocale,
        })
        .catch((err) =>
          console.error("tour-variants: locale write failed", locale, err),
        );
    }

    // The source joins the family too, so the panel finds it from either side.
    if (!source.variantKey) {
      await payload.update({
        collection: "tours",
        id: tourId,
        data: { variantKey: key } as never,
        locale: "en",
      });
    }

    return NextResponse.json({ created: { id: created.id, type } });
  }

  // sync
  const family = await payload.find({
    collection: "tours",
    where: {
      and: [{ variantKey: { equals: key } }, { id: { not_equals: tourId } }],
    },
    limit: 10,
    depth: 0,
    locale: "en",
  });
  if (!family.docs.length) {
    return NextResponse.json({ updated: 0 });
  }

  let updated = 0;
  for (const sibling of family.docs) {
    try {
      const plain: Row = {};
      for (const field of SHARED_PLAIN) plain[field] = relId(source[field]);
      await payload.update({
        collection: "tours",
        id: sibling.id,
        data: plain as never,
        locale: "en",
      });

      for (const locale of LOCALE_CODES) {
        const data: Row = {};
        for (const field of SHARED_LOCALIZED) {
          const value = (source[field] as Row)?.[locale];
          if (value !== undefined) data[field] = stripIds(value);
        }
        if (!Object.keys(data).length) continue;
        await payload.update({
          collection: "tours",
          id: sibling.id,
          data: data as never,
          locale: locale as TypedLocale,
        });
      }
      updated++;
    } catch (err) {
      console.error("tour-variants: sync failed for", sibling.id, err);
    }
  }

  return NextResponse.json({ updated });
}
