/**
 * Content domain model.
 * Currently backed by files in ./data; swaps to Payload CMS behind the same
 * repository API (see docs/DECISIONS.md ADR-002). Page code must only import
 * from lib/content, never from data files directly.
 */

export type TourType = "group" | "private" | "custom";
export type TourTier = "standard" | "premium";
export type DepartureStatus = "available" | "guaranteed" | "soldout";

export interface Region {
  slug: string;
  name: string; // EN base content; localized via translation pipeline (phase 2)
}

export interface Country {
  slug: string;
  regionSlug: string;
  name: string;
  intro: string;
  /** Optional long-form Markdown body rendered below the intro. */
  body?: string | null;
  heroImage: string;
  published: boolean;
}

export interface City {
  slug: string;
  countrySlug: string;
  name: string;
  intro: string;
  recommendedNights: number;
  attractions: string[];
  image: string;
  lat?: number | null;
  lng?: number | null;
}

export interface ItineraryDay {
  day: number;
  title: string;
  description: string;
}

export interface Departure {
  date: string; // ISO yyyy-mm-dd
  priceUsd: number;
  status: DepartureStatus;
}

export interface RoutePoint {
  name: string;
  lat: number;
  lng: number;
  note?: string;
}

export interface Tour {
  slug: string;
  countrySlug: string;
  title: string;
  summary: string;
  type: TourType;
  tier: TourTier;
  durationDays: number;
  citySlugs: string[];
  priceFromUsd: number | null; // null → "price on request" (premium)
  singleSupplementUsd: number | null;
  departures: Departure[];
  itinerary: ItineraryDay[];
  included: string[];
  excluded: string[];
  heroImage: string;
  gallery: string[];
  route?: RoutePoint[];
  featured: boolean;
  published: boolean;
}

export interface GuidePage {
  slug: string;
  countrySlug: string;
  title: string;
  /** Simple section blocks; becomes rich blocks under CMS */
  sections: { heading: string; body: string }[];
}
