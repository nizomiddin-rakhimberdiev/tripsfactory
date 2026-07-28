/**
 * Turns parsed spreadsheet rows into Tours documents.
 *
 * Two passes over one code path: `plan()` resolves every reference and reports
 * what *would* happen, `apply()` does it. The preview is not a courtesy — an
 * import that half-succeeds across sixty tours is far harder to clean up than
 * one that refused to start.
 *
 * Three rules keep the whole thing predictable:
 *
 * 1. **Everything arrives as a draft.** The sheet's status column is ignored on
 *    purpose. Tours land in Studio invisible to the public, and the operator
 *    publishes them one at a time once the photos are in.
 * 2. **A photo is optional.** Rows without one get a neutral placeholder, so a
 *    manager is never blocked on images they do not have yet. `heroImage` stays
 *    a required CMS field and every render path keeps working untouched.
 * 3. **Blank does not mean delete.** A column left empty on a re-import leaves
 *    whatever Studio already holds, so a partially filled sheet is safe to
 *    import repeatedly.
 */
import "server-only";
import { createHash } from "crypto";
import type { Payload, RequiredDataFromCollectionSlug } from "payload";
import type { Tour } from "@/payload-types";
import type { RoutePoint } from "@/lib/content/types";
import type { SheetIssue, TourDraft } from "./schema";

type TourWrite = Partial<
  Pick<
    Tour,
    | "slug" | "country" | "title" | "summary" | "type" | "tier" | "durationDays"
    | "priceFromUsd" | "singleSupplementUsd" | "cities" | "heroImage" | "gallery"
    | "route" | "featured" | "published" | "itinerary" | "included" | "excluded"
    | "departures"
  >
>;

export type TourPlan = {
  row: number;
  slug: string;
  title: string;
  action: "create" | "update" | "skip";
  errors: string[];
  warnings: string[];
  stats: { days: number; included: number; excluded: number; departures: number; cities: number; images: number };
};

export type ApplyOutcome = {
  slug: string;
  ok: boolean;
  action: "created" | "updated" | "failed";
  message?: string;
};

export type ImportReport = { issues: SheetIssue[]; plans: TourPlan[]; outcomes?: ApplyOutcome[] };

type Refs = {
  countries: Map<string, number>;
  cities: Map<string, { id: number; name: string; lat: number | null; lng: number | null }>;
  tours: Map<string, number>;
  mediaByName: Map<string, number>;
};

/** Names and slugs both resolve, so neither spelling is a support request. */
const key = (value: string) => value.trim().toLowerCase();

async function loadRefs(payload: Payload): Promise<Refs> {
  const [countries, cities, tours, media] = await Promise.all([
    payload.find({ collection: "countries", limit: 500, depth: 0, locale: "en" }),
    payload.find({ collection: "cities", limit: 1000, depth: 0, locale: "en" }),
    payload.find({ collection: "tours", limit: 2000, depth: 0, locale: "en" }),
    payload.find({ collection: "media", limit: 3000, depth: 0 }),
  ]);

  const countryMap = new Map<string, number>();
  for (const c of countries.docs) {
    countryMap.set(key(c.slug), c.id);
    if (c.name) countryMap.set(key(c.name), c.id);
  }

  const cityMap = new Map<string, { id: number; name: string; lat: number | null; lng: number | null }>();
  for (const c of cities.docs) {
    const entry = { id: c.id, name: c.name, lat: c.lat ?? null, lng: c.lng ?? null };
    cityMap.set(key(c.slug), entry);
    if (c.name) cityMap.set(key(c.name), entry);
  }

  return {
    countries: countryMap,
    cities: cityMap,
    tours: new Map(tours.docs.map((t) => [key(t.slug), t.id])),
    mediaByName: new Map(
      media.docs
        .filter((m): m is typeof m & { filename: string } => Boolean(m.filename))
        .map((m) => [m.filename.toLowerCase(), m.id]),
    ),
  };
}

/* ------------------------------------------------------------- placeholder */

const PLACEHOLDER_NAME = "rasm-qoshilmagan.png";

/**
 * A single shared "photo pending" image, created once and reused.
 *
 * This is what lets the sheet leave the photo column empty. The alternative —
 * making `heroImage` nullable — means a schema migration on two databases and a
 * null check in every card, hero and gallery on the site, all so a draft can
 * render nothing. One neutral image costs nothing and reads as an instruction:
 * whoever opens Studio sees immediately which tours still need a photo.
 */
async function placeholderId(payload: Payload, refs: Refs): Promise<number> {
  const cached = refs.mediaByName.get(PLACEHOLDER_NAME);
  if (cached) return cached;

  const { default: sharp } = await import("sharp");
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="1000">
    <rect width="1600" height="1000" fill="#f4ede1"/>
    <rect x="60" y="60" width="1480" height="880" fill="none" stroke="#ddd0bc" stroke-width="4" stroke-dasharray="18 14"/>
    <text x="800" y="500" text-anchor="middle" font-family="Helvetica,Arial,sans-serif"
      font-size="54" fill="#6f6459">Rasm qo'shilmagan</text>
    <text x="800" y="570" text-anchor="middle" font-family="Helvetica,Arial,sans-serif"
      font-size="30" fill="#9a8f82">Studio &#8594; Turlar &#8594; Asosiy rasm</text>
  </svg>`;
  const buffer = await sharp(Buffer.from(svg)).png().toBuffer();

  const doc = await payload.create({
    collection: "media",
    data: { alt: "Rasm hali qo'shilmagan" },
    file: { data: buffer, mimetype: "image/png", name: PLACEHOLDER_NAME, size: buffer.byteLength },
  });
  refs.mediaByName.set(PLACEHOLDER_NAME, doc.id);
  return doc.id;
}

/* ------------------------------------------------------------------- media */

const isHttp = (ref: string) => /^https?:\/\//i.test(ref);

/** Google Drive share links point at a viewer page, not the image. */
function directUrl(ref: string): string {
  const drive =
    ref.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/) ??
    ref.match(/drive\.google\.com\/(?:open|uc)\?(?:.*&)?id=([a-zA-Z0-9_-]+)/);
  return drive ? `https://drive.google.com/uc?export=download&id=${drive[1]}` : ref;
}

/**
 * The importer fetches URLs the sheet supplies, so it is an outbound request
 * with an operator-controlled target. Studio is admin-only, but pointing it at
 * the deployment's own metadata endpoints costs nothing to prevent.
 */
function blockedHost(url: string): boolean {
  let host: string;
  try {
    host = new URL(url).hostname.toLowerCase();
  } catch {
    return true;
  }
  return (
    host === "localhost" || host.endsWith(".local") || host.endsWith(".internal") ||
    host === "[::1]" || /^127\./.test(host) || /^10\./.test(host) ||
    /^192\.168\./.test(host) || /^169\.254\./.test(host) ||
    /^172\.(1[6-9]|2\d|3[01])\./.test(host) || /^0\./.test(host)
  );
}

const MEANINGLESS = new Set(["uc", "open", "download", "view", "file", "image", "img", "photo"]);

/**
 * Names the upload after its source URL.
 *
 * The name is the cache key for "have we downloaded this already?", so it has to
 * come from the whole URL. Drive links are all `.../uc?...id=<id>`: keying on
 * the basename alone made every Drive photo resolve to `uc.jpg`, and the second
 * tour silently reused the first tour's picture.
 */
function fileNameFor(url: string, fallback: string, mimetype: string): string {
  const ext = mimetype.split("/")[1]?.split("+")[0]?.replace("jpeg", "jpg") ?? "jpg";
  let base = "";
  try {
    base = decodeURIComponent(new URL(url).pathname.split("/").pop() ?? "");
  } catch {
    /* fall back to the slug */
  }
  base = base
    .replace(/\.[a-z0-9]+$/i, "")
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .toLowerCase()
    .replace(/^-+|-+$/g, "");
  if (!base || MEANINGLESS.has(base) || /^\d+$/.test(base)) base = fallback;
  return `${base.slice(0, 50) || "rasm"}-${createHash("sha1").update(url).digest("hex").slice(0, 8)}.${ext}`;
}

const MAX_IMAGE_BYTES = 12 * 1024 * 1024;

async function resolveImage(
  payload: Payload,
  refs: Refs,
  ref: string,
  alt: string,
  fallbackName: string,
): Promise<{ id: number } | { error: string }> {
  const value = ref.trim();
  if (!value) return { error: "havola bo'sh" };

  if (!isHttp(value)) {
    const found = refs.mediaByName.get(value.toLowerCase());
    if (found) return { id: found };
    return { error: `«${value}» kutubxonada topilmadi — to'liq havola yozing.` };
  }

  const url = directUrl(value);
  if (blockedHost(url)) return { error: `«${value}» tashqi manzil emas.` };

  let res: Response;
  try {
    res = await fetch(url, { redirect: "follow", signal: AbortSignal.timeout(30_000) });
  } catch {
    return { error: `Rasmni yuklab bo'lmadi: ${value}` };
  }
  if (!res.ok) return { error: `Rasm ${res.status} javob qaytardi: ${value}` };

  const mimetype = (res.headers.get("content-type") ?? "").split(";")[0].trim();
  if (!mimetype.startsWith("image/")) {
    return {
      error:
        `«${value}» rasm emas (${mimetype || "noma'lum tur"}). ` +
        "Drive havolasi bo'lsa, fayl «Anyone with the link» qilib ulashilganini tekshiring.",
    };
  }

  const buffer = Buffer.from(await res.arrayBuffer());
  if (buffer.byteLength > MAX_IMAGE_BYTES) {
    return { error: `Rasm juda katta (${Math.round(buffer.byteLength / 1024 / 1024)}MB).` };
  }

  const name = fileNameFor(url, fallbackName, mimetype);
  const cached = refs.mediaByName.get(name.toLowerCase());
  if (cached) return { id: cached };

  try {
    const doc = await payload.create({
      collection: "media",
      data: { alt },
      file: { data: buffer, mimetype, name, size: buffer.byteLength },
    });
    refs.mediaByName.set(name.toLowerCase(), doc.id);
    return { id: doc.id };
  } catch (err) {
    return { error: `Rasmni saqlab bo'lmadi: ${(err as Error).message}` };
  }
}

/* -------------------------------------------------------------------- plan */

function planOne(draft: TourDraft, refs: Refs): TourPlan {
  const errors = [...draft.errors];
  const warnings = [...draft.warnings];
  const exists = refs.tours.has(key(draft.slug));

  if (draft.country && !refs.countries.has(key(draft.country))) {
    errors.push(
      `«${draft.country}» davlati saytda yo'q. Avval Studio → Davlatlar bo'limida qo'shing.`,
    );
  }

  // An unknown city is not worth blocking a tour over: it only costs the map pin.
  const unknown = draft.cities.filter((c) => !refs.cities.has(key(c)));
  if (unknown.length) {
    warnings.push(
      `Saytda yo'q shaharlar e'tiborsiz qoldiriladi: ${unknown.slice(0, 6).join(", ")}` +
        `${unknown.length > 6 ? ` va yana ${unknown.length - 6} ta` : ""}.`,
    );
  }

  if (exists) warnings.push("Bu nomli tur allaqachon bor — ma'lumotlari yangilanadi.");

  return {
    row: draft.row,
    slug: draft.slug,
    title: draft.title,
    action: errors.length ? "skip" : exists ? "update" : "create",
    errors,
    warnings,
    stats: {
      days: draft.itinerary.length,
      included: draft.included.length,
      excluded: draft.excluded.length,
      departures: draft.departures.length,
      cities: draft.cities.length - unknown.length,
      images: (draft.heroImage ? 1 : 0) + draft.gallery.length,
    },
  };
}

export async function plan(
  payload: Payload,
  drafts: TourDraft[],
  issues: SheetIssue[],
): Promise<ImportReport> {
  const refs = await loadRefs(payload);
  return { issues, plans: drafts.map((d) => planOne(d, refs)) };
}

/* ------------------------------------------------------------------- apply */

function routeFromCities(draft: TourDraft, refs: Refs): RoutePoint[] {
  return draft.cities
    .map((name) => refs.cities.get(key(name)))
    .filter((c): c is NonNullable<typeof c> => Boolean(c))
    .filter((c) => typeof c.lat === "number" && typeof c.lng === "number")
    .map((c) => ({ name: c.name, lat: c.lat as number, lng: c.lng as number }));
}

export async function apply(
  payload: Payload,
  drafts: TourDraft[],
  issues: SheetIssue[],
): Promise<ImportReport> {
  const refs = await loadRefs(payload);
  const plans = drafts.map((d) => planOne(d, refs));
  const outcomes: ApplyOutcome[] = [];

  for (const draft of drafts) {
    const planned = plans.find((p) => p.row === draft.row)!;
    if (planned.action === "skip") {
      outcomes.push({ slug: draft.slug, ok: false, action: "failed", message: "Xatolar tufayli o'tkazib yuborildi." });
      continue;
    }

    const existingId = refs.tours.get(key(draft.slug));
    const isNew = existingId === undefined;

    let heroId: number | undefined;
    if (draft.heroImage) {
      const hero = await resolveImage(payload, refs, draft.heroImage, draft.title, draft.slug);
      if ("error" in hero) {
        planned.warnings.push(`Asosiy rasm olinmadi — vaqtinchalik rasm qo'yildi. ${hero.error}`);
      } else {
        heroId = hero.id;
      }
    }
    // Only a brand-new tour needs one; an update without a photo column keeps
    // whatever Studio already has, including a photo added there by hand.
    if (heroId === undefined && isNew) heroId = await placeholderId(payload, refs);

    const galleryItems: { id: number; url: string }[] = [];
    for (const [i, ref] of draft.gallery.entries()) {
      const img = await resolveImage(payload, refs, ref, draft.title, `${draft.slug}-${i + 1}`);
      if ("error" in img) {
        planned.warnings.push(`Galereya rasmi o'tkazib yuborildi — ${img.error}`);
        continue;
      }
      const doc = await payload.findByID({ collection: "media", id: img.id, depth: 0 });
      galleryItems.push({ id: img.id, url: doc.url ?? "" });
    }

    const data: TourWrite = {
      slug: draft.slug,
      country: refs.countries.get(key(draft.country))!,
      title: draft.title,
      summary: draft.summary,
      type: draft.type,
      tier: draft.tier,
      durationDays: draft.durationDays,
      priceFromUsd: draft.priceFromUsd,
      singleSupplementUsd: draft.singleSupplementUsd,
      featured: draft.featured,
    };

    // A new tour always arrives as a draft. An existing one keeps whatever it
    // has: re-importing a sheet must never pull a live tour off the site.
    if (isNew) data.published = false;

    if (heroId !== undefined) data.heroImage = heroId;

    const cityIds = draft.cities
      .map((c) => refs.cities.get(key(c))?.id)
      .filter((id): id is number => typeof id === "number");
    if (cityIds.length) data.cities = [...new Set(cityIds)];

    if (galleryItems.length) data.gallery = galleryItems;
    if (draft.itinerary.length) data.itinerary = draft.itinerary;
    if (draft.included.length) data.included = draft.included.map((text) => ({ text }));
    if (draft.excluded.length) data.excluded = draft.excluded.map((text) => ({ text }));
    if (draft.departures.length) {
      data.departures = draft.departures.map((d) => ({
        date: `${d.date}T00:00:00.000Z`,
        priceUsd: d.priceUsd,
        status: d.status,
      }));
    }

    // The map route is derived from the cities, but never over one placed by
    // hand in Studio.
    const route = routeFromCities(draft, refs);
    if (route.length > 1) {
      if (isNew) {
        data.route = route;
      } else {
        const current = await payload.findByID({ collection: "tours", id: existingId, depth: 0, locale: "en" });
        if (!Array.isArray(current.route) || current.route.length === 0) data.route = route;
      }
    }

    try {
      if (isNew) {
        const created = await payload.create({
          collection: "tours",
          // `TourWrite` is Partial by design; create wants the required fields
          // present, which planOne has already proven. Payload validates again.
          data: data as RequiredDataFromCollectionSlug<"tours">,
          locale: "en",
        });
        refs.tours.set(key(draft.slug), created.id);
        outcomes.push({ slug: draft.slug, ok: true, action: "created" });
      } else {
        await payload.update({ collection: "tours", id: existingId, data, locale: "en" });
        outcomes.push({ slug: draft.slug, ok: true, action: "updated" });
      }
    } catch (err) {
      const message = (err as Error).message || "noma'lum xato";
      planned.action = "skip";
      planned.errors.push(message);
      outcomes.push({ slug: draft.slug, ok: false, action: "failed", message });
    }
  }

  return { issues, plans, outcomes };
}
