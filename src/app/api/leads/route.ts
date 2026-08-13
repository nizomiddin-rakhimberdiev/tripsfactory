import { NextResponse } from "next/server";
import { z } from "zod";
import { createLead, findPartnerByCode, getMasterclass, getSiteBooking } from "@/lib/content";
import { sendEmail } from "@/lib/email/send";
import { requestEmail } from "@/lib/email/booking";
import { REF_COOKIE } from "@/app/r/[code]/route";

const leadSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email().max(200),
  phone: z.string().max(50).optional().or(z.literal("")),
  date: z.string().max(20).optional().or(z.literal("")),
  pax: z.coerce.number().int().min(1).max(50).optional(),
  message: z.string().max(2000).optional().or(z.literal("")),
  tourSlug: z.string().max(120).optional(),
  kind: z.enum(["tour", "excursion", "masterclass"]).optional(),
  // Fallback for a browser that dropped the cookie. Never trusted as given —
  // it is looked up, and an unknown code credits nobody.
  ref: z.string().max(60).optional(),
  locale: z.string().max(5).optional(),
  // Honeypot. Deliberately permissive: `max(0)` rejected a filled field with a
  // 400 before the silent-drop below could run, which told the bot it had
  // failed and invited a retry without the field. Accept anything, then drop it
  // quietly further down — the trap only works if it looks like success.
  website: z.string().max(200).optional(),
});

/**
 * Naive in-memory rate limit. Still per-instance — on serverless each cold
 * start gets a fresh Map and parallel instances cannot see each other, so this
 * slows a single caller rather than stopping a distributed flood. A shared
 * store (Upstash) is the real fix and is out of scope here.
 *
 * Two things that were wrong are fixed: the key now comes from a header the
 * client cannot set, and the map is swept so it cannot grow without bound.
 */
const hits = new Map<string, { count: number; ts: number }>();
const WINDOW_MS = 60_000;
const LIMIT = 5;

/**
 * `x-forwarded-for` is attacker-controlled — anyone can rotate it and walk past
 * the limit. Vercel sets `x-vercel-forwarded-for` itself and strips any client
 * copy, so it is trustworthy where we actually deploy.
 */
function clientKey(request: Request): string {
  return (
    request.headers.get("x-vercel-forwarded-for") ??
    request.headers.get("x-real-ip") ??
    request.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    "unknown"
  );
}

function rateLimited(key: string): boolean {
  const now = Date.now();

  // Sweep expired entries so a long-lived instance does not leak memory.
  if (hits.size > 500) {
    for (const [k, v] of hits) if (now - v.ts > WINDOW_MS) hits.delete(k);
  }

  const entry = hits.get(key);
  if (!entry || now - entry.ts > WINDOW_MS) {
    hits.set(key, { count: 1, ts: now });
    return false;
  }
  entry.count += 1;
  return entry.count > LIMIT;
}

/**
 * Returns whether the operator was actually reached. Previously this was
 * unguarded: a hanging Telegram would hang the whole function, a network throw
 * would 500 *after* the lead was already stored (user retries, duplicate lead),
 * and a bad token returned 401 that nobody ever saw.
 */
async function notifyTelegram(text: string): Promise<boolean> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) {
    console.error("LEAD-ALERT: Telegram env vars missing. Lead:", text);
    return false;
  }
  try {
    const res = await fetch(
      `https://api.telegram.org/bot${token}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: chatId, text }),
        signal: AbortSignal.timeout(8000),
      },
    );
    if (!res.ok) {
      console.error(
        `LEAD-ALERT: Telegram rejected the message (${res.status}). Lead:`,
        text,
      );
      return false;
    }
    return true;
  } catch (err) {
    console.error("LEAD-ALERT: Telegram unreachable. Lead:", text, err);
    return false;
  }
}

/**
 * Sent after the enquiry is safely stored, not before: a guest told how to pay
 * for a booking we did not record is the one failure that costs money on both
 * sides.
 */
async function sendBookingEmail(lead: {
  name: string;
  email: string;
  tourSlug?: string;
  locale?: string;
  date?: string;
  pax?: number;
}): Promise<void> {
  const locale = lead.locale ?? "en";
  const [masterclass, booking] = await Promise.all([
    lead.tourSlug ? getMasterclass(lead.tourSlug, locale) : undefined,
    getSiteBooking(),
  ]);

  const message = requestEmail({
    name: lead.name,
    locale,
    title: masterclass?.title ?? lead.tourSlug ?? "",
    date: lead.date ?? null,
    guests: lead.pax ?? null,
    priceUsd: masterclass?.priceUsd ?? null,
    paymentUrl: booking.paymentUrl,
    venue: booking.venue,
  });

  await sendEmail({
    to: lead.email,
    subject: message.subject,
    html: message.html,
    text: message.text,
  });
}

export async function POST(request: Request) {
  if (rateLimited(clientKey(request))) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const parsed = leadSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_input" }, { status: 400 });
  }
  const lead = parsed.data;

  // Honeypot filled → pretend success, drop silently
  if (lead.website) return NextResponse.json({ ok: true });

  /**
   * Who sent this guest.
   *
   * The cookie was set by /r/<code> when they scanned the QR at a hotel
   * reception, and it is what the cashback at the end of the month is
   * calculated from. Last touch wins: a guest who passed two partners is
   * credited to the one whose code they scanned most recently, which is the
   * one who actually sent them through the door.
   */
  const refCookie = request.headers
    .get("cookie")
    ?.match(new RegExp(`(?:^|;\\s*)${REF_COOKIE}=([^;]+)`))?.[1];
  const partner = await findPartnerByCode(
    refCookie ? decodeURIComponent(refCookie) : lead.ref,
  );

  const subject: Record<string, string> = {
    tour: "Tour",
    excursion: "Excursion",
    masterclass: "Master class",
  };
  const lines = [
    "🧭 New lead — TripsFactory",
    `Name: ${lead.name}`,
    `Email: ${lead.email}`,
    lead.phone && `Phone: ${lead.phone}`,
    lead.tourSlug &&
      `${subject[lead.kind ?? "tour"] ?? "Tour"}: ${lead.tourSlug}`,
    partner && `Referred by: ${partner.name}`,
    lead.date && `Start date: ${lead.date}`,
    lead.pax && `Travelers: ${lead.pax}`,
    lead.locale && `Locale: ${lead.locale}`,
    lead.message && `Message: ${lead.message}`,
  ].filter(Boolean);

  // An enquiry is captured if it reaches EITHER the CMS or the operator's
  // Telegram. Both are attempted; the request only succeeds if at least one
  // landed.
  let stored = false;
  try {
    await createLead({
      name: lead.name,
      email: lead.email,
      phone: lead.phone || undefined,
      tourSlug: lead.tourSlug,
      kind: lead.kind,
      partner: partner?.id,
      date: lead.date || undefined,
      pax: lead.pax,
      message: lead.message || undefined,
      locale: lead.locale,
    });
    stored = true;
  } catch (err) {
    console.error("LEAD-ALERT: could not store lead in CMS.", err);
  }

  /**
   * The guest's own copy.
   *
   * Master classes only, for now: they are the product with a fixed price and
   * a seat that has to be paid for, so "here is how to pay" is a true and
   * useful thing to say the moment the form is submitted. A tour enquiry is
   * the start of a conversation about an itinerary, and an automatic payment
   * instruction would be wrong.
   *
   * Never allowed to fail the request. The enquiry is already stored and the
   * operator already alerted; a failed email is logged with everything needed
   * to send it by hand.
   */
  if (lead.kind === "masterclass" && stored) {
    void sendBookingEmail(lead).catch((err) =>
      console.error("EMAIL-LOST: booking email threw.", err),
    );
  }

  const notified = await notifyTelegram(lines.join("\n"));

  if (!stored && !notified) {
    // Nothing captured the enquiry. Saying "ok" here would show the visitor a
    // success screen for a message that reached nobody — the worst possible
    // outcome for the one form that carries the business. Fail loudly instead
    // so the form offers a retry and the customer knows to use another channel.
    console.error(
      "LEAD-LOST: neither the CMS nor Telegram accepted this enquiry.",
      lines.join(" | "),
    );
    return NextResponse.json({ error: "not_delivered" }, { status: 503 });
  }

  return NextResponse.json({ ok: true });
}
