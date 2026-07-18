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
  GuidePage,
  Region,
  Tour,
  TourTier,
  TourType,
} from "./types";
import type {
  City as CityDoc,
  Country as CountryDoc,
  Guide as GuideDoc,
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
    heroImage: mediaUrl(doc.heroImage),
    gallery: [],
    featured: Boolean(doc.featured),
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

export async function createLead(data: {
  name: string;
  email: string;
  phone?: string;
  tourSlug?: string;
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
