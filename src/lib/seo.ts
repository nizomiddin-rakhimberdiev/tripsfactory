import type { Tour } from "@/lib/content";

export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://tripsfactory.uz";

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
