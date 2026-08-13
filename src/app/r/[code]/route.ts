/**
 * The QR code target: tripsfactory.com/r/<code>.
 *
 * Short because it is printed on a card at a hotel reception desk, and because
 * a guest sometimes types it rather than scanning it. Deliberately outside the
 * locale prefix for the same reason — /uz/r/hyatt is not something anybody
 * wants on a printed card.
 *
 * Three things happen here, in order of what breaks if they fail:
 *
 *   1. the redirect — always, even for an unknown or paused code. A guest
 *      standing at a reception desk with a phone in their hand must land on
 *      the catalogue whatever the state of our data.
 *   2. the cookie — how the booking that follows is credited. Set by the
 *      server, not by script: Safari caps script-written cookies at seven days
 *      and a guest often books the evening before they leave.
 *   3. the scan row — statistics. Written last and never allowed to block.
 */
import { NextResponse } from "next/server";
import { getPayload } from "payload";
import config from "@payload-config";
import { locales, type Locale } from "@/i18n/routing";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** How long a scan keeps crediting the partner. */
export const ATTRIBUTION_DAYS = 90;
export const REF_COOKIE = "tf_ref";

/**
 * Which language to open the catalogue in.
 *
 * The guest is a foreign tourist holding a phone set to their own language, so
 * the browser's own preference is the best signal available — better than the
 * hotel's language and better than a default. Falls back to English rather
 * than Uzbek: somebody who scanned a QR code in a hotel lobby is far more
 * likely to read English than Uzbek.
 */
function pickLocale(header: string | null): Locale {
  if (!header) return "en";
  for (const part of header.split(",")) {
    const tag = part.split(";")[0].trim().toLowerCase();
    const base = tag.split("-")[0];
    const match = locales.find((l) => l === tag || l === base);
    if (match) return match;
  }
  return "en";
}

/** Scans come from phone cameras. Anything announcing itself as a crawler is not a guest. */
function looksAutomated(userAgent: string | null): boolean {
  if (!userAgent) return true;
  return /bot|crawl|spider|slurp|preview|monitor|curl|wget|headless/i.test(
    userAgent,
  );
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ code: string }> },
) {
  const { code } = await params;
  const url = new URL(request.url);
  const locale = pickLocale(request.headers.get("accept-language"));
  const destination = new URL(`/${locale}/masterclasses`, url.origin);

  const normalized = code.trim().toLowerCase().slice(0, 60);
  const response = NextResponse.redirect(destination, 302);

  try {
    const payload = await getPayload({ config });
    const found = await payload.find({
      collection: "partners",
      where: { and: [{ code: { equals: normalized } }, { active: { equals: true } }] },
      limit: 1,
      depth: 0,
      overrideAccess: true,
    });
    const partner = found.docs[0];
    if (!partner) return response;

    response.cookies.set(REF_COOKIE, partner.code, {
      httpOnly: true,
      sameSite: "lax",
      secure: url.protocol === "https:",
      path: "/",
      maxAge: ATTRIBUTION_DAYS * 24 * 60 * 60,
    });

    // A guest who scans the code twice on the way past is one guest. Counting
    // only the first scan of a code keeps the conversion figure honest, which
    // matters because the cashback conversation starts from it.
    const already = request.headers
      .get("cookie")
      ?.match(/(?:^|;\s*)tf_ref=([^;]+)/)?.[1];
    if (already === partner.code) return response;

    if (!looksAutomated(request.headers.get("user-agent"))) {
      await payload.create({
        collection: "partner-visits",
        data: { partner: partner.id, locale },
        overrideAccess: true,
      });
    }
  } catch (err) {
    // Never at the guest's expense: they get the catalogue either way, and a
    // lost scan row is worth less than a lost visitor.
    console.error("partner redirect", normalized, err);
  }

  return response;
}
