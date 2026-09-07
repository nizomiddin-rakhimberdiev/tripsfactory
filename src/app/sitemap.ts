import type { MetadataRoute } from "next";
import { locales } from "@/i18n/routing";
import {
  getExcursions,
  getGuides,
  getMasterclasses,
  getPublishedCountries,
  getTours,
} from "@/lib/content";
import { flags } from "@/lib/flags";
import { SITE_URL } from "@/lib/seo";

function localized(path: string) {
  return locales.map((locale) => ({
    url: `${SITE_URL}/${locale}${path}`,
    alternates: {
      languages: {
        // The page metadata already declares x-default; the sitemap did not,
        // so the two disagreed about where to send a visitor whose language
        // matches none of the eight.
        "x-default": `${SITE_URL}/en${path}`,
        ...Object.fromEntries(
          locales.map((l) => [l, `${SITE_URL}/${l}${path}`]),
        ),
      },
    },
  }));
}

/**
 * Regenerated rather than cached for the life of the deployment.
 *
 * Without this the file is built once and never again: a tour unpublished in
 * the Studio stays listed, Google crawls it, and gets a 404. That is how a
 * third of this sitemap came to point at pages that no longer exist — Search
 * Console reported them as "not found", which is exactly what they were.
 *
 * The hour is the safety net. The real mechanism is `revalidateSite` in
 * payload.config.ts, which invalidates this route on every content change, so
 * publishing a tour puts it in the sitemap within seconds rather than an hour.
 */
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [
    standard,
    premium,
    countryList,
    guideList,
    excursionList,
    masterclassList,
  ] = await Promise.all([
    getTours(),
    getTours({ tier: "premium" }),
    getPublishedCountries(),
    flags.guide ? getGuides() : Promise.resolve([]),
    flags.excursions ? getExcursions() : Promise.resolve([]),
    flags.masterclasses ? getMasterclasses() : Promise.resolve([]),
  ]);

  // Flag-gated routes are read from the same source the navigation uses, so a
  // page cannot end up linked in the menu but missing from the sitemap — which
  // is exactly what happened to /excursions.
  const staticPaths = [
    "",
    "/tours",
    // Linked from the Tours menu and returning 200, but absent here — the same
    // omission the note above describes, one level deeper.
    "/tours/group",
    "/tours/private",
    "/destinations",
    "/about",
    "/contact",
    "/privacy",
    "/terms",
    ...(flags.premium ? ["/premium"] : []),
    ...(flags.excursions ? ["/excursions"] : []),
    ...(flags.guide ? ["/guide"] : []),
    ...(flags.masterclasses ? ["/masterclasses"] : []),
  ];

  return [
    ...staticPaths.flatMap(localized),
    ...[...standard, ...premium].flatMap((t) =>
      localized(`/tours/${t.countrySlug}/${t.slug}`),
    ),
    ...countryList.flatMap((c) =>
      localized(`/destinations/${c.regionSlug}/${c.slug}`),
    ),
    ...guideList.flatMap((g) => localized(`/guide/${g.slug}`)),
    ...excursionList.flatMap((x) => localized(`/excursions/${x.slug}`)),
    ...masterclassList.flatMap((m) => localized(`/masterclasses/${m.slug}`)),
  ];
}
