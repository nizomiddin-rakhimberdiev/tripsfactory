import { NextResponse } from "next/server";
import { z } from "zod";
import { createLead } from "@/lib/content";

const leadSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email().max(200),
  phone: z.string().max(50).optional().or(z.literal("")),
  date: z.string().max(20).optional().or(z.literal("")),
  pax: z.coerce.number().int().min(1).max(50).optional(),
  message: z.string().max(2000).optional().or(z.literal("")),
  tourSlug: z.string().max(120).optional(),
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

  const lines = [
    "🧭 New lead — TripsFactory",
    `Name: ${lead.name}`,
    `Email: ${lead.email}`,
    lead.phone && `Phone: ${lead.phone}`,
    lead.tourSlug && `Tour: ${lead.tourSlug}`,
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
      date: lead.date || undefined,
      pax: lead.pax,
      message: lead.message || undefined,
      locale: lead.locale,
    });
    stored = true;
  } catch (err) {
    console.error("LEAD-ALERT: could not store lead in CMS.", err);
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
