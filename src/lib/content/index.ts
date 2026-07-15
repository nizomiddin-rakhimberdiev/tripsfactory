/**
 * Content repository — the single read API for all page code.
 * Backed by local data today; will proxy Payload CMS queries later (ADR-002).
 * All functions are async so the CMS swap does not change call sites.
 *
 * Content is authored in EN; pass `locale` to get the translated overlay
 * merged in (field-level fallback to EN — see ./localize.ts).
 */
import type { Country, City, GuidePage, Region, Tour, TourTier } from "./types";
import { cities, countries, regions } from "./data/geography";
import { tours } from "./data/tours";
import { guides } from "./data/guides";
import {
  localizeCity,
  localizeCountry,
  localizeGuide,
  localizeRegion,
  localizeTour,
} from "./localize";

export type * from "./types";

const EN = "en";

export async function getRegions(locale: string = EN): Promise<Region[]> {
  return regions.map((r) => localizeRegion(r, locale));
}

export async function getPublishedCountries(
  locale: string = EN,
): Promise<Country[]> {
  return countries
    .filter((c) => c.published)
    .map((c) => localizeCountry(c, locale));
}

export async function getCountry(
  slug: string,
  locale: string = EN,
): Promise<Country | undefined> {
  const c = countries.find((c) => c.slug === slug && c.published);
  return c && localizeCountry(c, locale);
}

export async function getCitiesByCountry(
  countrySlug: string,
  locale: string = EN,
): Promise<City[]> {
  return cities
    .filter((c) => c.countrySlug === countrySlug)
    .map((c) => localizeCity(c, locale));
}

export async function getCity(
  slug: string,
  locale: string = EN,
): Promise<City | undefined> {
  const c = cities.find((c) => c.slug === slug);
  return c && localizeCity(c, locale);
}

export async function getTours(
  filter?: {
    countrySlug?: string;
    tier?: TourTier;
    featuredOnly?: boolean;
  },
  locale: string = EN,
): Promise<Tour[]> {
  return tours
    .filter(
      (t) =>
        t.published &&
        (filter?.countrySlug ? t.countrySlug === filter.countrySlug : true) &&
        (filter?.tier ? t.tier === filter.tier : t.tier === "standard") &&
        (filter?.featuredOnly ? t.featured : true),
    )
    .map((t) => localizeTour(t, locale));
}

export async function getTour(
  countrySlug: string,
  slug: string,
  locale: string = EN,
): Promise<Tour | undefined> {
  const t = tours.find(
    (t) => t.published && t.countrySlug === countrySlug && t.slug === slug,
  );
  return t && localizeTour(t, locale);
}

export async function getGuides(
  countrySlug?: string,
  locale: string = EN,
): Promise<GuidePage[]> {
  return (
    countrySlug ? guides.filter((g) => g.countrySlug === countrySlug) : guides
  ).map((g) => localizeGuide(g, locale));
}

export async function getGuide(
  slug: string,
  locale: string = EN,
): Promise<GuidePage | undefined> {
  const g = guides.find((g) => g.slug === slug);
  return g && localizeGuide(g, locale);
}
