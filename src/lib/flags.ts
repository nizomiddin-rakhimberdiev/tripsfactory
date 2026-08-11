/**
 * Feature flags — flipping a value here enables/disables whole site sections
 * (navigation entries, routes and sitemap inclusion).
 */
export const flags = {
  excursions: true, // "Events" — day trips, managed in Studio → Ekskursiyalar
  masterclasses: true, // Cooking classes, managed in Studio → Masterklasslar
  premium: true,
  onlinePayments: false, // MVP: booking = enquiry; flips on when acquiring contract is signed
} as const;

export type FeatureFlag = keyof typeof flags;
