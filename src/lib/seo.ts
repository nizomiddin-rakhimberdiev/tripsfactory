import type { Metadata } from "next";
import type { Tour } from "@/lib/content";
import { locales, type Locale } from "@/i18n/routing";
import {
  ADDRESS,
  BRAND_NAME,
  EMAIL,
  LEGAL_NAME,
  PHONE,
  SAME_AS,
} from "@/lib/business";

export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://tripsfactory.com";

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

/** Media paths come from the CMS as site-relative; schema.org needs absolute. */
function absolute(path: string): string {
  return path.startsWith("http") ? path : `${SITE_URL}${path}`;
}

/**
 * schema.org TouristTrip structured data for a tour page.
 *
 * `locale` is required because every URL in structured data must be the
 * absolute address of the page it describes, and this site prefixes every
 * route with a locale. Without it the `url` and `offers.url` would point at a
 * path that 404s.
 *
 * Nothing here is asserted that the CMS does not hold. In particular there is
 * no `aggregateRating` — the business has no collected reviews, and inventing
 * a rating is both false and a manual-action risk with Google.
 */
export function tourJsonLd(tour: Tour, locale: string) {
  const url = `${SITE_URL}/${locale}/tours/${tour.countrySlug}/${tour.slug}`;
  const images = [tour.heroImage, ...(tour.gallery ?? [])]
    .filter(Boolean)
    .map(absolute);

  return {
    "@context": "https://schema.org",
    "@type": "TouristTrip",
    "@id": url,
    url,
    name: tour.title,
    description: tour.summary,
    touristType: tour.type === "group" ? "Group" : "Private",
    // ISO 8601: an 8-day tour is P8D. Google reads this for trip rich results.
    ...(tour.durationDays ? { duration: `P${tour.durationDays}D` } : {}),
    ...(images.length ? { image: images } : {}),
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
        // Required by Google for an Offer to be eligible; it was missing, so
        // the offer block was ignored entirely.
        url,
        price: tour.priceFromUsd,
        priceCurrency: "USD",
        availability: "https://schema.org/InStock",
      },
    }),
    provider: { "@type": "TravelAgency", name: "TripsFactory", url: SITE_URL },
  };
}

/**
 * The operator itself, emitted once on the homepage.
 *
 * This is what an AI answer engine or a knowledge panel reads to learn who
 * runs the site — until now nothing on any page said so in machine-readable
 * form. Every claim here is a verified business detail held in lib/business,
 * so the structured data and the visible contact block cannot drift apart.
 *
 * Still omitted, deliberately: `aggregateRating`, because no reviews have been
 * collected, and `openingHoursSpecification`, because the business gave hours
 * but not which days they apply to — and Google shows opening hours to someone
 * deciding whether to call right now.
 */
export function travelAgencyJsonLd({
  locale,
  description,
  areaServed,
}: {
  locale: string;
  description: string;
  areaServed: string[];
}) {
  return {
    "@context": "https://schema.org",
    "@type": "TravelAgency",
    "@id": `${SITE_URL}/#organization`,
    name: BRAND_NAME,
    legalName: LEGAL_NAME,
    url: `${SITE_URL}/${locale}`,
    description,
    image: OG_IMAGE.url,
    telephone: PHONE.href,
    email: EMAIL,
    address: {
      "@type": "PostalAddress",
      streetAddress: ADDRESS.street,
      addressLocality: ADDRESS.city,
      addressRegion: ADDRESS.district,
      addressCountry: ADDRESS.countryCode,
    },
    sameAs: SAME_AS,
    ...(areaServed.length
      ? { areaServed: areaServed.map((name) => ({ "@type": "Country", name })) }
      : {}),
  };
}

/**
 * Breadcrumb trail, mirroring the one already rendered on the page.
 *
 * Google uses this to replace the bare URL in a result with a readable path,
 * which matters here because tours sit three levels deep.
 *
 * `items` must be in order and use paths without the locale prefix.
 */
export function breadcrumbJsonLd(
  locale: string,
  items: { name: string; path: string }[],
) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: `${SITE_URL}/${locale}${item.path}`,
    })),
  };
}
