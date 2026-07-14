/**
 * Feature flags — flipping a value here enables/disables whole site sections
 * (navigation entries, routes and sitemap inclusion).
 */
export const flags = {
  excursions: false, // built but hidden until the excursions catalog is ready
  premium: true,
  onlinePayments: false, // MVP: booking = enquiry; flips on when acquiring contract is signed
} as const;

export type FeatureFlag = keyof typeof flags;
