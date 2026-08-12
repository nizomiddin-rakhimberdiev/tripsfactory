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
function canonicalRedirect(request: NextRequest): NextResponse | null {
  const host = request.headers.get("host")?.split(":")[0].toLowerCase();
  if (!host || host === CANONICAL_HOST) return null;

  const url = new URL(request.url);
  url.host = CANONICAL_HOST;
  url.port = "";
  url.protocol = "https:";
  return NextResponse.redirect(url, 301);
}

/**
 * Paths next-intl must not touch: the API, the Payload admin and the Studio
 * are not localized, and letting the locale middleware near them rewrites
 * their URLs into /en/admin and breaks both panels.
 *
 * They used to be excluded by the matcher instead. That stopped working once
 * the redirect above needed to see every request — a matcher that skips
 * /admin also skips it on the wrong domain, which left tripsfactory.uz/admin
 * serving the panel under the non-canonical host.
 */
const UNLOCALIZED = /^\/(api|admin|studio)(\/|$)/;

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
