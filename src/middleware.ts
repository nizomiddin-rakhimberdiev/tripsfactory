import createMiddleware from "next-intl/middleware";
import { NextResponse, type NextRequest } from "next/server";
import { routing } from "./i18n/routing";

const intlMiddleware = createMiddleware(routing);

/** The one hostname the site is canonical on. Everything else redirects to it. */
const CANONICAL_HOST = "tripsfactory.com";

/**
 * `.uz` exists as a second registration, not a second site.
 *
 * Serving the same pages on both domains would split the ranking signals
 * between them and read as duplicate content, so tripsfactory.uz answers with
 * a permanent redirect that keeps the path and query intact —
 * tripsfactory.uz/en/tours lands on tripsfactory.com/en/tours.
 *
 * This lives here rather than in a dashboard Redirect Rule so it is versioned
 * with the code and cannot be silently lost: the rule configured by hand did
 * not fire, and requests fell through to the old host's "domain inactive" page
 * instead.
 *
 * www on the canonical domain folds in too, for the same reason.
 */
/**
 * Hosts that are not the public site and must be left alone: `next dev`,
 * `opennextjs-cloudflare preview`, and a phone on the office network testing
 * against a laptop.
 *
 * Without this the redirect below sends every local request to the live site —
 * silently, and with a 301 the browser then caches. A test that looks like it
 * passed locally has in fact been answered by production, which is the worst
 * version of this bug: it does not fail, it lies.
 */
function isLocalHost(host: string): boolean {
  return (
    host === "localhost" ||
    host === "127.0.0.1" ||
    host === "[::1]" ||
    host.endsWith(".localhost") ||
    host.endsWith(".local") ||
    /^(10|127)\./.test(host) ||
    /^192\.168\./.test(host) ||
    /^172\.(1[6-9]|2\d|3[01])\./.test(host)
  );
}

function canonicalRedirect(request: NextRequest): NextResponse | null {
  const host = request.headers.get("host")?.split(":")[0].toLowerCase();
  if (!host || host === CANONICAL_HOST || isLocalHost(host)) return null;

  const url = new URL(request.url);
  url.host = CANONICAL_HOST;
  url.port = "";
  url.protocol = "https:";
  return NextResponse.redirect(url, 301);
}

/**
 * Paths next-intl must not touch: the API, the Payload admin, the Studio and
 * the /r/<code> QR targets are not localized, and letting the locale
 * middleware near them rewrites their URLs into /en/admin and breaks both
 * panels. /r decides its own locale from the guest's browser and redirects.
 *
 * They used to be excluded by the matcher instead. That stopped working once
 * the redirect above needed to see every request — a matcher that skips
 * /admin also skips it on the wrong domain, which left tripsfactory.uz/admin
 * serving the panel under the non-canonical host.
 */
const UNLOCALIZED = /^\/(api|admin|studio|r)(\/|$)/;

export default function middleware(request: NextRequest) {
  const redirect = canonicalRedirect(request);
  if (redirect) return redirect;

  if (UNLOCALIZED.test(request.nextUrl.pathname)) return NextResponse.next();

  return intlMiddleware(request);
}

export const config = {
  // Everything except Next's internals and files with an extension. Broader
  // than it needs to be for locale handling, deliberately — see above.
  matcher: "/((?!_next|_vercel|.*\\..*).*)",
};
