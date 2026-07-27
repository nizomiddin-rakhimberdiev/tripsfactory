/**
 * Turns parsed spreadsheet rows into Tours documents.
 *
 * Two passes over the same code path: `plan()` resolves every reference and
 * reports what *would* happen, `apply()` does it. The preview is not a
 * courtesy — an import that half-succeeds across a dozen tours is far harder to
 * clean up than one that refused to start, and the operator gets to see the
 * client's typos before they reach the live site.
 *
 * Deliberately non-destructive on update: a column the client left blank means
 * "no new information", not "delete what is there". A tour whose itinerary was
 * polished in Studio keeps that itinerary when the sheet re-imports without one.
 */
import "server-only";
import { createHash } from "crypto";
import type { Payload, RequiredDataFromCollectionSlug } from "payload";
import type { Tour } from "@/payload-types";
import type { RoutePoint } from "@/lib/content/types";
import type { SheetIssue, TourDraft } from "./schema";

/**
 * Every field the importer is allowed to write. Building the payload against
 * the generated document type — rather than a bag of `unknown` — is what makes
 * a renamed CMS field a compile error here instead of a silently dropped column
 * on the client's next import.
 */
type TourWrite = Partial<
  Pick<
    Tour,
    | "slug"
    | "country"
    | "title"
    | "summary"
    | "type"
    | "tier"
    | "durationDays"
    | "priceFromUsd"
    | "singleSupplementUsd"
    | "cities"
    | "heroImage"
    | "gallery"
    | "route"
    | "featured"
    | "published"
    | "itinerary"
    | "included"
    | "excluded"
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
  stats: {
    days: number;
    included: number;
    excluded: number;
    departures: number;
    cities: number;
    images: number;
  };
};

export type ApplyOutcome = {
  slug: string;
  ok: boolean;
  action: "created" | "updated" | "failed";
  message?: string;
};

export type ImportReport = {
  issues: SheetIssue[];
  plans: TourPlan[];
  outcomes?: ApplyOutcome[];
};

type Refs = {
  countries: Map<string, number>;
  cities: Map<string, { id: number; name: string; lat: number | null; lng: number | null }>;
  tours: Map<string, number>;
  mediaByName: Map<string, number>;
};

/**
 * The template's dropdowns show display names ("Uzbekistan"), while an older
 * workbook — or a manager who typed instead of picking — carries slugs. Both
 * spellings are indexed so either resolves, and neither is a support request.
 */
const key = (value: string) => value.trim().toLowerCase();

async function loadRefs(payload: Payload): Promise<Refs> {
  const [countries, cities, tours, media] = await Promise.all([
    payload.find({ collection: "countries", limit: 500, depth: 0, locale: "en" }),
    payload.find({ collection: "cities", limit: 1000, depth: 0, locale: "en" }),
    payload.find({ collection: "tours", limit: 1000, depth: 0, locale: "en" }),
    payload.find({ collection: "media", limit: 2000, depth: 0 }),
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

/* ------------------------------------------------------------------- media */

const isHttp = (ref: string) => /^https?:\/\//i.test(ref);

/**
 * Google Drive share links point at a viewer page, not the image. This rewrites
 * them to the direct-download form, which is what people paste 9 times out of 10.
 */
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
    host === "localhost" ||
    host.endsWith(".local") ||
    host.endsWith(".internal") ||
    host === "[::1]" ||
    /^127\./.test(host) ||
    /^10\./.test(host) ||
    /^192\.168\./.test(host) ||
    /^169\.254\./.test(host) ||
    /^172\.(1[6-9]|2\d|3[01])\./.test(host) ||
    /^0\./.test(host)
  );
}

/** Basenames that identify the endpoint rather than the picture behind it. */
const MEANINGLESS_BASENAMES = new Set(["uc", "open", "download", "view", "file", "image", "img", "photo"]);

/**
 * Names the uploaded file after its source URL.
 *
 * The name is the cache key for "have we already downloaded this?", so it has
 * to be derived from the whole URL, not just its last path segment. Google
 * Drive links are all `.../uc?export=download&id=<different id>`: keying on the
 * basename alone made every Drive image in a sheet resolve to `uc.jpg`, and the
 * second tour would silently reuse the first tour's photo. The hash suffix
 * keeps distinct sources distinct while a repeat import of the same URL still
 * finds its existing upload.
 */
function fileNameFor(url: string, fallback: string, mimetype: string): string {
  const ext = mimetype.split("/")[1]?.split("+")[0]?.replace("jpeg", "jpg") ?? "jpg";

  let base = "";
  try {
    base = decodeURIComponent(new URL(url).pathname.split("/").pop() ?? "");
  } catch {
    /* fall through to the slug-based name */
  }
  base = base
    .replace(/\.[a-z0-9]+$/i, "")
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .toLowerCase()
    .replace(/^-+|-+$/g, "");

  if (!base || MEANINGLESS_BASENAMES.has(base) || /^\d+$/.test(base)) base = fallback;

  const digest = createHash("sha1").update(url).digest("hex").slice(0, 8);
  return `${base.slice(0, 50) || "rasm"}-${digest}.${ext}`;
}

const MAX_IMAGE_BYTES = 12 * 1024 * 1024;

/**
 * Resolves one image reference to a Media id, uploading it if it is a URL we
 * have not seen. Downloads are cached by resulting filename within and across
 * imports, so re-running the same sheet does not fill the library with copies.
 */
async function resolveImage(
  payload: Payload,
  refs: Refs,
  ref: string,
  alt: string,
  fallbackName: string,
): Promise<{ id: number } | { error: string }> {
  const value = ref.trim();
  if (!value) return { error: "rasm ko'rsatilmagan" };

  if (!isHttp(value)) {
    // Not a URL — treat it as the name of something already in the library.
    const found = refs.mediaByName.get(value.toLowerCase());
    if (found) return { id: found };
    const loose = [...refs.mediaByName.entries()].find(([name]) =>
      name.startsWith(value.toLowerCase().replace(/\.[a-z0-9]+$/i, "")),
    );
    if (loose) return { id: loose[1] };
    return {
      error: `«${value}» nomli rasm kutubxonada topilmadi. To'liq havola yozing yoki rasmni avval Studio → Rasmlar bo'limiga yuklang.`,
    };
  }

  const url = directUrl(value);
  if (blockedHost(url)) return { error: `«${value}» havolasi tashqi manzil emas.` };

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
        "Google Drive havolasi bo'lsa, faylni «Anyone with the link» qilib ulashganingizni tekshiring.",
    };
  }

  const buffer = Buffer.from(await res.arrayBuffer());
  if (buffer.byteLength > MAX_IMAGE_BYTES) {
    return { error: `Rasm juda katta (${Math.round(buffer.byteLength / 1024 / 1024)}MB): ${value}` };
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
    return { error: `Rasmni saqlab bo'lmadi (${name}): ${(err as Error).message}` };
  }
}

/* -------------------------------------------------------------------- plan */

function planOne(draft: TourDraft, refs: Refs): TourPlan {
  const errors = [...draft.errors];
  const warnings = [...draft.warnings];
  const exists = refs.tours.has(draft.slug);

  if (draft.country && !refs.countries.has(key(draft.country))) {
    errors.push(
      `«${draft.country}» davlati topilmadi. «Turlar» varag'idagi «Davlat» ustunida ro'yxatdan tanlang.`,
    );
  }

  const unknownCities = draft.cities.filter((c) => !refs.cities.has(key(c)));
  if (unknownCities.length) {
    errors.push(
      `Bu shaharlar topilmadi: ${unknownCities.join(", ")}. «Shahar» ustunlarida ro'yxatdan tanlang.`,
    );
  }

  if (!draft.heroImage && !exists) {
    errors.push(
      "Rasm qo'shilmagan — «Rasmlar» varag'ida bu turga kamida bitta rasm kerak.",
    );
  }
  // Local references are checkable now; URLs are only proven by fetching, which
  // the preview deliberately does not do.
  for (const ref of [draft.heroImage, ...draft.gallery].filter(Boolean)) {
    if (!isHttp(ref) && !refs.mediaByName.has(ref.toLowerCase())) {
      const stem = ref.toLowerCase().replace(/\.[a-z0-9]+$/i, "");
      const near = [...refs.mediaByName.keys()].some((n) => n.startsWith(stem));
      if (!near) {
        errors.push(
          `«${ref}» kutubxonada yo'q. To'liq havola (https://...) yozing yoki rasmni avval yuklang.`,
        );
      }
    }
  }

  if (draft.type === "group" && !draft.departures.length) {
    warnings.push("Guruh turi, lekin jo'nash sanalari kiritilmagan.");
  }
  if (draft.priceFromUsd === null && draft.tier !== "premium") {
    warnings.push("Narx bo'sh — saytda «so'rov bo'yicha» deb chiqadi.");
  }
  if (exists) {
    warnings.push("Bu slug bilan tur allaqachon bor — ma'lumotlari yangilanadi.");
  }

  return {
    row: draft.row,
    slug: draft.slug,
    title: draft.title || draft.slug,
    action: errors.length ? "skip" : exists ? "update" : "create",
    errors,
    warnings,
    stats: {
      days: draft.itinerary.length,
      included: draft.included.length,
      excluded: draft.excluded.length,
      departures: draft.departures.length,
      cities: draft.cities.length,
      images: (draft.heroImage ? 1 : 0) + draft.gallery.length,
    },
  };
}

/** Dry run: resolves everything except image downloads and writes nothing. */
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
    const planned = plans.find((p) => p.slug === draft.slug && p.row === draft.row)!;
    if (planned.action === "skip") {
      outcomes.push({
        slug: draft.slug,
        ok: false,
        action: "failed",
        message: "Xatolar tufayli o'tkazib yuborildi.",
      });
      continue;
    }

    const existingId = refs.tours.get(draft.slug);
    const isNew = existingId === undefined;

    // Images first: a failed download must not leave a half-written tour.
    let heroId: number | undefined;
    if (draft.heroImage) {
      const hero = await resolveImage(
        payload,
        refs,
        draft.heroImage,
        draft.heroCaption || draft.title || draft.slug,
        draft.slug,
      );
      if ("error" in hero) {
        planned.action = "skip";
        planned.errors.push(hero.error);
        outcomes.push({ slug: draft.slug, ok: false, action: "failed", message: hero.error });
        continue;
      }
      heroId = hero.id;
    }

    const galleryIds: { id: number; url: string }[] = [];
    for (const [i, ref] of draft.gallery.entries()) {
      const img = await resolveImage(
        payload,
        refs,
        ref,
        draft.title || draft.slug,
        `${draft.slug}-${i + 1}`,
      );
      if ("error" in img) {
        planned.warnings.push(`Galereya rasmi o'tkazib yuborildi — ${img.error}`);
        continue;
      }
      const doc = await payload.findByID({ collection: "media", id: img.id, depth: 0 });
      galleryIds.push({ id: img.id, url: doc.url ?? "" });
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
      published: draft.published,
    };

    if (heroId !== undefined) data.heroImage = heroId;
    if (draft.cities.length) {
      // Two spellings of one city (name in one slot, slug in another) must not
      // become two relationship rows.
      data.cities = [...new Set(draft.cities.map((c) => refs.cities.get(key(c))!.id))];
    }
    // Blank columns leave existing content alone — see the file header.
    if (galleryIds.length) data.gallery = galleryIds;
    if (draft.itinerary.length) {
      data.itinerary = draft.itinerary.map((d) => ({
        title: d.title,
        description: d.description,
      }));
    }
    if (draft.included.length) data.included = draft.included.map((text) => ({ text }));
    if (draft.excluded.length) data.excluded = draft.excluded.map((text) => ({ text }));
    if (draft.departures.length) {
      data.departures = draft.departures.map((d) => ({
        date: `${d.date}T00:00:00.000Z`,
        priceUsd: d.priceUsd,
        status: d.status,
      }));
    }

    // The map route is derived from the cities, but never over a route someone
    // placed by hand in Studio.
    const route = routeFromCities(draft, refs);
    if (route.length > 1) {
      if (isNew) {
        data.route = route;
      } else {
        const current = await payload.findByID({
          collection: "tours",
          id: existingId,
          depth: 0,
          locale: "en",
        });
        if (!Array.isArray(current.route) || current.route.length === 0) {
          data.route = route;
        }
      }
    }

    try {
      if (isNew) {
        const created = await payload.create({
          collection: "tours",
          // `TourWrite` is Partial by design (an update may touch three fields);
          // create wants the required ones present, which `planOne` has already
          // proven above. Payload validates again server-side regardless.
          data: data as RequiredDataFromCollectionSlug<"tours">,
          locale: "en",
        });
        refs.tours.set(draft.slug, created.id);
        outcomes.push({ slug: draft.slug, ok: true, action: "created" });
      } else {
        await payload.update({
          collection: "tours",
          id: existingId,
          data,
          locale: "en",
        });
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
