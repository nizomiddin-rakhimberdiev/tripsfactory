import type { MetadataRoute } from "next";
import { locales } from "@/i18n/routing";
import { getGuides, getPublishedCountries, getTours } from "@/lib/content";
import { flags } from "@/lib/flags";
import { SITE_URL } from "@/lib/seo";

function localized(path: string) {
  return locales.map((locale) => ({
    url: `${SITE_URL}/${locale}${path}`,
    alternates: {
      languages: Object.fromEntries(
        locales.map((l) => [l, `${SITE_URL}/${l}${path}`]),
      ),
    },
  }));
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [standard, premium, countryList, guideList] = await Promise.all([
    getTours(),
    getTours({ tier: "premium" }),
    getPublishedCountries(),
    getGuides(),
  ]);

  // Flag-gated routes are read from the same source the navigation uses, so a
  // page cannot end up linked in the menu but missing from the sitemap — which
  // is exactly what happened to /excursions.
  const staticPaths = [
    "",
    "/tours",
    "/destinations",
    "/guide",
    "/about",
    "/contact",
    ...(flags.premium ? ["/premium"] : []),
    ...(flags.excursions ? ["/excursions"] : []),
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
  ];
}
