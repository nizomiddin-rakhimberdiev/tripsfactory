/**
 * Content repository — the single read API for all page code.
 * Backed by Payload CMS (ADR-002 fulfilled): every entity below is fully
 * manageable from /admin. Docs are mapped to the domain types in ./types so
 * page code is independent of the CMS document shape.
 *
 * Localization is handled by Payload (8 locales, field-level fallback to EN).
 */
import { getPayload, type Payload, type Where } from "payload";
import config from "@payload-config";
import type {
  Country,
  City,
  Excursion,
  GuidePage,
  Masterclass,
  MasterclassSession,
  Region,
  Tour,
  TourTier,
  TourType,
} from "./types";
import type {
  City as CityDoc,
  Country as CountryDoc,
  Excursion as ExcursionDoc,
  Guide as GuideDoc,
  Masterclass as MasterclassDoc,
  Media,
  Region as RegionDoc,
  Tour as TourDoc,
} from "@/payload-types";

export type * from "./types";

const EN = "en";
type Loc = "en" | "uz" | "ru" | "ja" | "zh" | "es" | "it" | "de";

function db(): Promise<Payload> {
  return getPayload({ config });
}

function loc(locale: string): Loc {
  return locale as Loc;
}

function mediaUrl(m: number | Media | null | undefined): string {
  return typeof m === "object" && m?.url ? m.url : "";
}

function relSlug(rel: number | { slug: string } | null | undefined): string {
  return typeof rel === "object" && rel ? rel.slug : "";
}

function texts(rows: { text: string }[] | null | undefined): string[] {
  return (rows ?? []).map((r) => r.text);
}

function galleryUrls(g: unknown): string[] {
  return Array.isArray(g)
    ? (g as { url?: string }[])
        .map((x) => x?.url)
        .filter((u): u is string => Boolean(u))
    : [];
}

function mapRegion(doc: RegionDoc): Region {
  return { slug: doc.slug, name: doc.name };
}

function mapCountry(doc: CountryDoc): Country {
  return {
    slug: doc.slug,
    regionSlug: relSlug(doc.region),
    name: doc.name,
    intro: doc.intro,
    body: doc.body ?? null,
    heroImage: mediaUrl(doc.heroImage),
    gallery: galleryUrls(doc.gallery),
    published: Boolean(doc.published),
  };
}

function mapCity(doc: CityDoc): City {
  return {
    slug: doc.slug,
    countrySlug: relSlug(doc.country),
    name: doc.name,
    intro: doc.intro,
    recommendedNights: doc.recommendedNights,
    attractions: texts(doc.attractions),
    image: mediaUrl(doc.image),
    gallery: galleryUrls(doc.gallery),
    lat: doc.lat ?? null,
    lng: doc.lng ?? null,
  };
}

function mapTour(doc: TourDoc): Tour {
  return {
    slug: doc.slug,
    countrySlug: relSlug(doc.country),
    title: doc.title,
    summary: doc.summary,
    type: doc.type,
    tier: doc.tier,
    durationDays: doc.durationDays,
    citySlugs: (doc.cities ?? []).map((c) => relSlug(c)),
    priceFromUsd: doc.priceFromUsd ?? null,
    singleSupplementUsd: doc.singleSupplementUsd ?? null,
    departures: (doc.departures ?? []).map((d) => ({
      date: d.date.slice(0, 10),
      priceUsd: d.priceUsd,
      status: d.status,
    })),
    itinerary: (doc.itinerary ?? []).map((day, i) => ({
      day: i + 1,
      title: day.title,
      description: day.description,
    })),
    included: texts(doc.included),
    excluded: texts(doc.excluded),
    goodToKnow: texts(doc.goodToKnow),
    priceTiers: (doc.priceTiers ?? [])
      .map((r) => ({ pax: r.pax, priceUsd: r.priceUsd }))
      // Cheapest-per-person last is how every operator's rate card reads.
      .sort((a, b) => a.pax - b.pax),
    heroImage: mediaUrl(doc.heroImage),
    gallery: galleryUrls(doc.gallery),
    route: Array.isArray(doc.route) ? (doc.route as Tour["route"]) : [],
    featured: Boolean(doc.featured),
    published: Boolean(doc.published),
  };
}

function mapExcursion(doc: ExcursionDoc): Excursion {
  const city = doc.city;
  return {
    slug: doc.slug,
    citySlug: relSlug(city),
    // Read at depth 1, so the city document is already here; its name comes
    // back in the requested locale like any other localized field.
    cityName: typeof city === "object" && city ? city.name : "",
    title: doc.title,
    description: doc.description,
    durationHours: doc.durationHours,
    priceUsd: doc.priceUsd,
    included: texts(doc.included),
    heroImage: mediaUrl(doc.heroImage),
    gallery: galleryUrls(doc.gallery),
    published: Boolean(doc.published),
  };
}

/**
 * The video id out of whatever the editor pasted.
 *
 * Studio takes a link, not an id, because a link is what you get from the
 * share button. All three shapes YouTube hands out are accepted; anything else
 * yields "" and the page simply shows no player rather than an empty frame.
 */
function youtubeId(url: string | null | undefined): string {
  if (!url) return "";
  const match =
    /(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|live\/|shorts\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/.exec(
      url,
    );
  return match?.[1] ?? "";
}

/** Dates only, so a class running later today still counts as ahead. */
function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function mapMasterclass(doc: MasterclassDoc): Masterclass {
  const city = doc.city;
  const sessions: MasterclassSession[] = (doc.sessions ?? []).map((s) => {
    const capacity = s.capacity ?? 0;
    const booked = s.booked ?? 0;
    return {
      date: s.date.slice(0, 10),
      capacity,
      booked,
      seatsLeft: Math.max(0, capacity - booked),
    };
  });
  sessions.sort((a, b) => a.date.localeCompare(b.date));

  // What the page announces: the soonest run that has not happened yet and
  // still has a seat. A full run is skipped rather than shown sold out —
  // "the next one" is the useful answer, not "you are too late".
  const from = today();
  const nextSession =
    sessions.find((s) => s.date >= from && s.seatsLeft > 0) ?? null;

  return {
    slug: doc.slug,
    citySlug: relSlug(city),
    cityName: typeof city === "object" && city ? city.name : "",
    title: doc.title,
    tagline: doc.tagline ?? "",
    summary: doc.summary,
    description: doc.description,
    durationHours: doc.durationHours,
    priceUsd: doc.priceUsd,
    youtubeId: youtubeId(doc.youtubeUrl),
    included: texts(doc.included),
    reviews: (doc.reviews ?? []).map((r) => ({
      author: r.author,
      text: r.text,
    })),
    sessions,
    nextSession,
    heroImage: mediaUrl(doc.heroImage),
    gallery: galleryUrls(doc.gallery),
    published: Boolean(doc.published),
  };
}

function mapGuide(doc: GuideDoc): GuidePage {
  return {
    slug: doc.slug,
    countrySlug: relSlug(doc.country),
    title: doc.title,
    sections: (doc.sections ?? []).map((s) => ({
      heading: s.heading,
      body: s.body,
    })),
  };
}

export async function getRegions(locale: string = EN): Promise<Region[]> {
  const payload = await db();
  const res = await payload.find({
    collection: "regions",
    locale: loc(locale),
    fallbackLocale: EN,
    limit: 100,
    sort: "createdAt",
  });
  return res.docs.map(mapRegion);
}

export async function getPublishedCountries(
  locale: string = EN,
): Promise<Country[]> {
  const payload = await db();
  const res = await payload.find({
    collection: "countries",
    where: { published: { equals: true } },
    locale: loc(locale),
    fallbackLocale: EN,
    limit: 100,
    sort: "createdAt",
  });
  return res.docs.map(mapCountry);
}

export async function getCountry(
  slug: string,
  locale: string = EN,
): Promise<Country | undefined> {
  const payload = await db();
  const res = await payload.find({
    collection: "countries",
    where: {
      and: [{ slug: { equals: slug } }, { published: { equals: true } }],
    },
    locale: loc(locale),
    fallbackLocale: EN,
    limit: 1,
  });
  return res.docs[0] && mapCountry(res.docs[0]);
}

export async function getCitiesByCountry(
  countrySlug: string,
  locale: string = EN,
): Promise<City[]> {
  const payload = await db();
  const res = await payload.find({
    collection: "cities",
    where: { "country.slug": { equals: countrySlug } },
    locale: loc(locale),
    fallbackLocale: EN,
    limit: 100,
    sort: "createdAt",
  });
  return res.docs.map(mapCity);
}

export async function getCity(
  slug: string,
  locale: string = EN,
): Promise<City | undefined> {
  const payload = await db();
  const res = await payload.find({
    collection: "cities",
    where: { slug: { equals: slug } },
    locale: loc(locale),
    fallbackLocale: EN,
    limit: 1,
  });
  return res.docs[0] && mapCity(res.docs[0]);
}

export async function getTours(
  filter?: {
    countrySlug?: string;
    tier?: TourTier;
    type?: TourType;
    featuredOnly?: boolean;
  },
  locale: string = EN,
): Promise<Tour[]> {
  const payload = await db();
  const conditions: Where[] = [
    { published: { equals: true } },
    { tier: { equals: filter?.tier ?? "standard" } },
  ];
  if (filter?.countrySlug) {
    conditions.push({ "country.slug": { equals: filter.countrySlug } });
  }
  if (filter?.type) {
    conditions.push({ type: { equals: filter.type } });
  }
  if (filter?.featuredOnly) {
    conditions.push({ featured: { equals: true } });
  }
  const res = await payload.find({
    collection: "tours",
    where: { and: conditions },
    locale: loc(locale),
    fallbackLocale: EN,
    limit: 100,
    sort: "createdAt",
  });
  return res.docs.map(mapTour);
}

export async function getTour(
  countrySlug: string,
  slug: string,
  locale: string = EN,
): Promise<Tour | undefined> {
  const payload = await db();
  const res = await payload.find({
    collection: "tours",
    where: {
      and: [
        { slug: { equals: slug } },
        { "country.slug": { equals: countrySlug } },
        { published: { equals: true } },
      ],
    },
    locale: loc(locale),
    fallbackLocale: EN,
    limit: 1,
  });
  return res.docs[0] && mapTour(res.docs[0]);
}

export async function getExcursions(
  filter?: { citySlug?: string },
  locale: string = EN,
): Promise<Excursion[]> {
  const payload = await db();
  const conditions: Where[] = [{ published: { equals: true } }];
  if (filter?.citySlug) {
    conditions.push({ "city.slug": { equals: filter.citySlug } });
  }
  const res = await payload.find({
    collection: "excursions",
    where: { and: conditions },
    locale: loc(locale),
    fallbackLocale: EN,
    // depth 1 so the city name and the hero image URL arrive with the row
    // rather than as a query per card.
    depth: 1,
    limit: 100,
    sort: "createdAt",
  });
  return res.docs.map(mapExcursion);
}

export async function getExcursion(
  slug: string,
  locale: string = EN,
): Promise<Excursion | undefined> {
  const payload = await db();
  const res = await payload.find({
    collection: "excursions",
    where: {
      and: [{ slug: { equals: slug } }, { published: { equals: true } }],
    },
    locale: loc(locale),
    fallbackLocale: EN,
    depth: 1,
    limit: 1,
  });
  return res.docs[0] && mapExcursion(res.docs[0]);
}

export async function getMasterclasses(
  locale: string = EN,
): Promise<Masterclass[]> {
  const payload = await db();
  const res = await payload.find({
    collection: "masterclasses",
    where: { published: { equals: true } },
    locale: loc(locale),
    fallbackLocale: EN,
    depth: 1,
    limit: 100,
    sort: "createdAt",
  });
  return res.docs.map(mapMasterclass);
}

export async function getMasterclass(
  slug: string,
  locale: string = EN,
): Promise<Masterclass | undefined> {
  const payload = await db();
  const res = await payload.find({
    collection: "masterclasses",
    where: {
      and: [{ slug: { equals: slug } }, { published: { equals: true } }],
    },
    locale: loc(locale),
    fallbackLocale: EN,
    depth: 1,
    limit: 1,
  });
  return res.docs[0] && mapMasterclass(res.docs[0]);
}

export async function getGuides(
  countrySlug?: string,
  locale: string = EN,
): Promise<GuidePage[]> {
  const payload = await db();
  const res = await payload.find({
    collection: "guides",
    where: countrySlug
      ? { "country.slug": { equals: countrySlug } }
      : undefined,
    locale: loc(locale),
    fallbackLocale: EN,
    limit: 100,
    sort: "createdAt",
  });
  return res.docs.map(mapGuide);
}

export async function getGuide(
  slug: string,
  locale: string = EN,
): Promise<GuidePage | undefined> {
  const payload = await db();
  const res = await payload.find({
    collection: "guides",
    where: { slug: { equals: slug } },
    locale: loc(locale),
    fallbackLocale: EN,
    limit: 1,
  });
  return res.docs[0] && mapGuide(res.docs[0]);
}

export interface HeroContent {
  image: string;
  title: string;
  subtitle: string;
}

export async function getSiteContent(locale: string = EN): Promise<{
  hero: HeroContent;
  premiumHero: HeroContent;
}> {
  const payload = await db();
  const doc = await payload.findGlobal({
    slug: "site-content",
    locale: loc(locale),
    fallbackLocale: EN,
  });
  return {
    hero: {
      image: mediaUrl(doc.hero?.image),
      title: doc.hero?.title ?? "",
      subtitle: doc.hero?.subtitle ?? "",
    },
    premiumHero: {
      image: mediaUrl(doc.premiumHero?.image),
      title: doc.premiumHero?.title ?? "",
      subtitle: doc.premiumHero?.subtitle ?? "",
    },
  };
}

/**
 * The partner behind a referral code, or null.
 *
 * Read here rather than trusted from the request: the code arrives in a cookie
 * this server set, but the fallback path carries it in the request body where
 * anyone could put anything. Looking it up means an unknown or paused code
 * simply credits nobody.
 */
export async function findPartnerByCode(
  code: string | undefined | null,
): Promise<{ id: number; name: string } | null> {
  if (!code) return null;
  const payload = await db();
  const res = await payload
    .find({
      collection: "partners",
      where: {
        and: [
          { code: { equals: code.trim().toLowerCase() } },
          { active: { equals: true } },
        ],
      },
      limit: 1,
      depth: 0,
      overrideAccess: true,
    })
    .catch(() => null);
  const doc = res?.docs[0];
  return doc ? { id: doc.id, name: doc.name } : null;
}

/**
 * The two settings the booking emails need: where to pay, and where to come.
 *
 * Read straight from the global rather than through getSiteContent, which maps
 * heroes and would drag them into an API route that has no use for them.
 */
export async function getSiteBooking(): Promise<{
  paymentUrl: string | null;
  venue: string | null;
}> {
  const payload = await db();
  const doc = await payload
    .findGlobal({ slug: "site-content", depth: 0 })
    .catch(() => null);
  return {
    paymentUrl: doc?.booking?.paymentUrl ?? null,
    venue: doc?.booking?.venue ?? null,
  };
}

export async function createLead(data: {
  name: string;
  email: string;
  phone?: string;
  tourSlug?: string;
  /** Which catalogue `tourSlug` names. Defaults to a tour, as it always was. */
  kind?: "tour" | "excursion" | "masterclass";
  /** Partner id, resolved from the referral code before this is called. */
  partner?: number;
  date?: string;
  pax?: number;
  message?: string;
  locale?: string;
}): Promise<void> {
  const payload = await db();
  await payload.create({
    collection: "leads",
    data: { ...data, status: "new" },
    overrideAccess: true,
  });
}
