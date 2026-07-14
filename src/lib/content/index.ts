/**
 * Content repository — the single read API for all page code.
 * Backed by local data today; will proxy Payload CMS queries later (ADR-002).
 * All functions are async so the CMS swap does not change call sites.
 */
import type { Country, City, GuidePage, Region, Tour, TourTier } from "./types";
import { cities, countries, regions } from "./data/geography";
import { tours } from "./data/tours";
import { guides } from "./data/guides";

export type * from "./types";

export async function getRegions(): Promise<Region[]> {
  return regions;
}

export async function getPublishedCountries(): Promise<Country[]> {
  return countries.filter((c) => c.published);
}

export async function getCountry(slug: string): Promise<Country | undefined> {
  return countries.find((c) => c.slug === slug && c.published);
}

export async function getCitiesByCountry(countrySlug: string): Promise<City[]> {
  return cities.filter((c) => c.countrySlug === countrySlug);
}

export async function getCity(slug: string): Promise<City | undefined> {
  return cities.find((c) => c.slug === slug);
}

export async function getTours(filter?: {
  countrySlug?: string;
  tier?: TourTier;
  featuredOnly?: boolean;
}): Promise<Tour[]> {
  return tours.filter(
    (t) =>
      t.published &&
      (filter?.countrySlug ? t.countrySlug === filter.countrySlug : true) &&
      (filter?.tier ? t.tier === filter.tier : t.tier === "standard") &&
      (filter?.featuredOnly ? t.featured : true),
  );
}

export async function getTour(
  countrySlug: string,
  slug: string,
): Promise<Tour | undefined> {
  return tours.find(
    (t) => t.published && t.countrySlug === countrySlug && t.slug === slug,
  );
}

export async function getGuides(countrySlug?: string): Promise<GuidePage[]> {
  return countrySlug
    ? guides.filter((g) => g.countrySlug === countrySlug)
    : guides;
}

export async function getGuide(slug: string): Promise<GuidePage | undefined> {
  return guides.find((g) => g.slug === slug);
}
