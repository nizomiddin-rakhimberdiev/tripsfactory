import { defineCloudflareConfig } from "@opennextjs/cloudflare";
import r2IncrementalCache from "@opennextjs/cloudflare/overrides/incremental-cache/r2-incremental-cache";
import { withRegionalCache } from "@opennextjs/cloudflare/overrides/incremental-cache/regional-cache";
import d1NextTagCache from "@opennextjs/cloudflare/overrides/tag-cache/d1-next-tag-cache";

/**
 * Where the ISR output lives once this runs on Workers.
 *
 * Without an incremental cache configured OpenNext falls back to rendering
 * every request, which would throw away the whole point of `revalidate` — so
 * the rendered pages go in R2, in the same bucket as the media but under the
 * `incremental-cache` prefix the override uses by default.
 *
 * `withRegionalCache` puts a short-lived copy in the colo's own cache so a
 * page that is hot in Tokyo is not re-fetched from the European bucket on
 * every request.
 *
 * The tag cache is not optional here. `revalidateSite()` in payload.config.ts
 * calls `revalidatePath()` on every Studio save, and on Workers that only
 * takes effect if OpenNext has somewhere to record the invalidated tags — D1,
 * for a site this size. Drop it and saving in Studio stops updating the site
 * until the 24h ISR window rolls over.
 */
export default defineCloudflareConfig({
  incrementalCache: withRegionalCache(r2IncrementalCache, {
    mode: "long-lived",
  }),
  tagCache: d1NextTagCache,
});
