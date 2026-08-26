import type { Tour, TourType } from "./types";

/**
 * The order a catalogue of tours is read in: destination first, then type.
 *
 * The business asked for it on the Journeys page and on the home page, which
 * is why it lives here rather than in either — two copies of a sort order
 * drift, and the pages would eventually disagree about what comes first.
 *
 * Nothing is hard-coded per tour. A tour lands in a group from its own
 * `countrySlug` and `type`, so a tour added in the Studio tomorrow appears in
 * the right place without anyone touching this file.
 */

/** Uzbekistan leads wherever it has tours — the operator's home market. */
const LEAD_COUNTRY = "uzbekistan";

/**
 * Private before group, as specified. `custom` is last rather than dropped:
 * a bespoke tour is still inventory, and silently hiding a published record
 * is the kind of bug nobody reports because nobody sees it.
 */
const TYPE_ORDER: TourType[] = ["private", "group", "custom"];

export type TourTypeGroup = {
  type: TourType;
  tours: Tour[];
};

export type CountryGroup = {
  countrySlug: string;
  /** Localized, from the country list — absent if the country is unpublished. */
  countryName: string;
  types: TourTypeGroup[];
};

/**
 * @param tours Already filtered to what should be shown (published, tier).
 * @param countryNames slug → localized name.
 * @param perType Cap on tours shown per row. The home page shows a taste;
 *   the Journeys page passes nothing and shows everything.
 */
export function groupTours(
  tours: Tour[],
  countryNames: Map<string, string>,
  perType?: number,
): CountryGroup[] {
  const byCountry = new Map<string, Tour[]>();
  for (const tour of tours) {
    const list = byCountry.get(tour.countrySlug);
    if (list) list.push(tour);
    else byCountry.set(tour.countrySlug, [tour]);
  }

  const groups: CountryGroup[] = [];
  for (const [countrySlug, list] of byCountry) {
    const types: TourTypeGroup[] = [];
    for (const type of TYPE_ORDER) {
      const inType = list.filter((t) => t.type === type);
      if (!inType.length) continue;
      types.push({ type, tours: perType ? inType.slice(0, perType) : inType });
    }
    if (!types.length) continue;
    groups.push({
      countrySlug,
      // Falling back to the slug rather than skipping the group: a country
      // whose record is missing still has tours somebody paid to publish.
      countryName: countryNames.get(countrySlug) ?? countrySlug,
      types,
    });
  }

  /**
   * Uzbekistan first, then the country list's own order.
   *
   * Explicitly the country order, not the order the tours happened to arrive
   * in — tours are read newest-created-first, so leaving it implicit would
   * rank destinations by whichever one happened to get a tour entered first.
   * Alphabetical is not the answer either: it reorders itself between English
   * and Japanese, so the same page would list destinations differently by
   * language. The country list is set in the Studio, which makes this an order
   * the operator can actually change.
   */
  const countryRank = new Map(
    [...countryNames.keys()].map((slug, i) => [slug, i]),
  );
  const rank = (slug: string) =>
    slug === LEAD_COUNTRY ? -1 : (countryRank.get(slug) ?? Number.MAX_SAFE_INTEGER);
  groups.sort((a, b) => rank(a.countrySlug) - rank(b.countrySlug));

  return groups;
}
