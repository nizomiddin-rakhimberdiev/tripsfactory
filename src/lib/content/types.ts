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
  gallery?: string[];
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
  gallery?: string[];
  lat?: number | null;
  lng?: number | null;
}

export interface ItineraryDay {
  day: number;
  title: string;
  description: string;
}

/** One row of the per-person price table: this many travellers, this price each. */
export interface PriceTier {
  pax: number;
  priceUsd: number;
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
  /** "Good to know" — visas, weather, cash, what to pack. */
  goodToKnow: string[];
  /** Per-person prices by group size. Empty for tours sold at one price. */
  priceTiers: PriceTier[];
  heroImage: string;
  gallery: string[];
  route?: RoutePoint[];
  featured: boolean;
  published: boolean;
}

/**
 * A day trip — the "Events" section. Deliberately not a Tour: hours rather
 * than days, one price per person rather than a from-price with departures,
 * a city rather than a country.
 */
export interface Excursion {
  slug: string;
  citySlug: string;
  /** For the card and the detail page; the city record itself is not fetched. */
  cityName: string;
  title: string;
  description: string;
  durationHours: number;
  priceUsd: number;
  included: string[];
  heroImage: string;
  gallery: string[];
  published: boolean;
}

/** One announced run of a master class. */
export interface MasterclassSession {
  /** ISO yyyy-mm-dd. */
  date: string;
  capacity: number;
  booked: number;
  /** capacity − booked, never below zero. */
  seatsLeft: number;
}

export interface MasterclassReview {
  author: string;
  text: string;
}

/**
 * A cooking master class: a class that runs on announced dates with a fixed
 * number of seats, so what the page shows depends on which run is still open.
 */
export interface Masterclass {
  slug: string;
  citySlug: string;
  cityName: string;
  title: string;
  /** One line under the title. Optional — not every class has one. */
  tagline: string;
  summary: string;
  description: string;
  durationHours: number;
  priceUsd: number;
  /** Video id only; the page builds the embed URL. Empty when there is none. */
  youtubeId: string;
  included: string[];
  reviews: MasterclassReview[];
  /** Every announced run, in date order, past ones included. */
  sessions: MasterclassSession[];
  /** The earliest run that is still ahead and not yet full. */
  nextSession: MasterclassSession | null;
  heroImage: string;
  gallery: string[];
  published: boolean;
}

export interface GuidePage {
  slug: string;
  countrySlug: string;
  title: string;
  /** Simple section blocks; becomes rich blocks under CMS */
  sections: { heading: string; body: string }[];
}
