/**
 * Whether to enumerate routes at build time.
 *
 * Prerendering reads the database, and on Workers there is no good way to do
 * that from a build machine. miniflare's local D1 returns "internal error" on
 * the larger queries this app makes, and pointing the build at the real D1
 * turns every one of 222 pages into a network round trip — pages started
 * failing Next's 60s per-page limit, which is not configurable.
 *
 * So the build stops enumerating routes and each page renders on its first
 * request instead, against the real database, and is then cached by ISR for
 * the 24h window. The cost is one slower request per page per day; the gain
 * is that the build stops depending on a database it cannot reach cleanly.
 *
 * Set by `deploy:cf`. Builds for anywhere else keep full prerendering.
 */
export const skipPrerender = process.env.SKIP_PRERENDER === "1";
