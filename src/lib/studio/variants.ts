import { TOUR_TYPES, type TourPathType } from "./tour-path";

/**
 * The group and private versions of one itinerary.
 *
 * They stay two records. That is what they are on the site — two pages, two
 * prices, two sets of departure dates, listed separately under /tours/group
 * and /tours/private, which is how every operator in this market presents
 * them. Folding them into one record would mean one page quoting two prices
 * and a slug that has to serve both.
 *
 * What they genuinely share is the writing. So they are created together from
 * one form, tied by a key, and the editor can push the prose from one to the
 * other. Everything that differs — price, single supplement, departures,
 * whether it is published — is per record and never copied.
 */
export const TYPE_LABEL: Record<string, string> = {
  group: "Guruh",
  private: "Individual",
  custom: "Buyurtma",
};

export { TOUR_TYPES, type TourPathType };

/**
 * A slug per type, from the one title the operator typed.
 *
 * A single type keeps the plain slug — that is what every existing tour has
 * and changing it would break live URLs. A pair has to differ, so each takes
 * its type as a suffix.
 */
export function variantSlugs(
  base: string,
  types: string[],
): Record<string, string> {
  if (types.length === 1) return { [types[0]]: base };
  return Object.fromEntries(types.map((t) => [t, `${base}-${t}`]));
}

/**
 * The fields that describe the journey rather than the commercial terms.
 *
 * Copied between variants; everything absent from this list is not. Title is
 * deliberately absent: "Classic Uzbekistan Group Tour" and "…Private Tour" are
 * different names for a reason, and overwriting one with the other is the kind
 * of help nobody asked for.
 */
export const SHARED_LOCALIZED = [
  "summary",
  "itinerary",
  "included",
  "excluded",
] as const;

export const SHARED_PLAIN = [
  "country",
  "cities",
  "durationDays",
  "heroImage",
  "gallery",
  "route",
  "tier",
] as const;
