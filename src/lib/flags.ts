/**
 * Feature flags — flipping a value here enables/disables whole site sections
 * (navigation entries, routes and sitemap inclusion).
 */
export const flags = {
  /**
   * Events and the travel guide are hidden while their content is being
   * rewritten — the business asked for the menu entries gone, not the pages
   * deleted, and both flip back to true with no other change.
   *
   * A hidden section redirects to the home page rather than 404ing: these URLs
   * have been live, so they sit in inboxes and search results, and a visitor
   * following one has done nothing wrong. See `hidden()` below.
   */
  excursions: false, // "Events" — day trips, managed in Studio → Ekskursiyalar
  guide: false, // "Travel Guide" — visa, seasons, food, managed in Studio → Qo'llanmalar
  masterclasses: true, // Cooking classes, managed in Studio → Masterklasslar
  premium: true,
  onlinePayments: false, // MVP: booking = enquiry; flips on when acquiring contract is signed
} as const;

export type FeatureFlag = keyof typeof flags;
