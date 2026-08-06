/**
 * Image loader for Cloudflare Image Transformations.
 *
 * Vercel resized images with its own optimizer; Workers has no equivalent, and
 * Payload is not resizing on upload either — this project never configured
 * `imageSizes`, so `sharp` was only ever reading metadata. Resizing therefore
 * moves to delivery time, through Cloudflare's `/cdn-cgi/image/` endpoint.
 *
 * The endpoint only exists on a Cloudflare *zone* with Image Transformations
 * turned on. It is not there on `*.workers.dev`, and not in local development,
 * so the flag decides: unset, the original file is served untouched — larger,
 * but correct. That keeps the staging deploy testable before the domain moves.
 *
 * The flag is set by `npm run deploy:cf`, not in the dashboard, and that is
 * deliberate. NEXT_PUBLIC_ values are inlined into the client bundle when it is
 * compiled; a runtime secret on the Worker arrives too late. Setting it there
 * produced a deployment where the server rendered transformed URLs and the
 * client did not, so React's preload for every `priority` image asked for the
 * untouched original — the hero and the wordmark were each downloaded twice,
 * once optimised and once whole, 420KB of waste on the homepage.
 *
 * It is not set for `preview:cf` or local development: /cdn-cgi/image/ exists
 * only on a Cloudflare zone with Image Transformations enabled, so there the
 * loader stays a no-op and the original file is served untouched.
 */
type LoaderArgs = {
  src: string;
  width: number;
  quality?: number;
};

export default function cloudflareImageLoader({
  src,
  width,
  quality,
}: LoaderArgs): string {
  if (process.env.NEXT_PUBLIC_CF_IMAGES !== "1") return src;

  const options = [`width=${width}`, `quality=${quality ?? 75}`, "format=auto"];

  // Relative sources are already same-origin; absolute ones (R2) are passed
  // through whole, which is what the endpoint expects.
  return `/cdn-cgi/image/${options.join(",")}/${src}`;
}
