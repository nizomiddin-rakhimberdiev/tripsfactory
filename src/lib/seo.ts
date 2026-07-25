import type { Metadata } from "next";
import type { Tour } from "@/lib/content";
import { locales, type Locale } from "@/i18n/routing";

export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://tripsfactory.uz";

/**
 * The share image. Points at the CMS hero rather than a separate asset, so the
 * picture social platforms show is the one the client already chose for the
 * homepage and can change from Studio without a deploy.
 */
export const OG_IMAGE = {
  url: `${SITE_URL}/api/media/file/b170809003-2.jpg`,
  width: 1920,
  height: 940,
};

/**
 * Canonical URL, hreflang alternates and share tags for one page.
 *
 * Canonical and hreflang both need the *current* path, which a layout cannot
 * know — so this is called per page rather than set once at the root. Getting
 * that wrong is worse than omitting it: a canonical inherited from the layout
 * would tell Google every page is a duplicate of the homepage.
 *
 * `path` is the route without the locale prefix: "" for the homepage,
 * "/tours" for the listing, "/tours/uzbekistan/classic" for a tour.
 */
export function pageMeta({
  locale,
  path,
  title,
  description,
}: {
  locale: string;
  path: string;
  title?: string;
  description?: string;
}): Metadata {
  const url = `${SITE_URL}/${locale}${path}`;

  // x-default points at the default locale so Google has somewhere to send
  // visitors whose language matches none of the eight.
  const languages: Record<string, string> = { "x-default": `${SITE_URL}/en${path}` };
  for (const l of locales) languages[l] = `${SITE_URL}/${l}${path}`;

  return {
    ...(title ? { title } : {}),
    ...(description ? { description } : {}),
    alternates: { canonical: url, languages },
    openGraph: {
      type: "website",
      url,
      siteName: "TripsFactory",
      locale,
      ...(title ? { title } : {}),
      ...(description ? { description } : {}),
      images: [OG_IMAGE],
    },
    twitter: {
      card: "summary_large_image",
      ...(title ? { title } : {}),
      ...(description ? { description } : {}),
      images: [OG_IMAGE.url],
    },
  };
}

export type { Locale };

/** schema.org TouristTrip structured data for a tour page. */
export function tourJsonLd(tour: Tour) {
  return {
    "@context": "https://schema.org",
    "@type": "TouristTrip",
    name: tour.title,
    description: tour.summary,
    touristType: tour.type === "group" ? "Group" : "Private",
    itinerary: {
      "@type": "ItemList",
      numberOfItems: tour.itinerary.length,
      itemListElement: tour.itinerary.map((d) => ({
        "@type": "ListItem",
        position: d.day,
        name: d.title,
      })),
    },
    ...(tour.priceFromUsd !== null && {
      offers: {
        "@type": "Offer",
        price: tour.priceFromUsd,
        priceCurrency: "USD",
        availability: "https://schema.org/InStock",
      },
    }),
    provider: {
      "@type": "TravelAgency",
      name: "TripsFactory",
      url: SITE_URL,
    },
  };
}
