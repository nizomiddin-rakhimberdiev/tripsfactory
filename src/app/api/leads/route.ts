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
  website: z.string().max(0).optional().or(z.literal("")), // honeypot
});

/** Naive in-memory rate limit — swap for Upstash in production (multi-instance). */
const hits = new Map<string, { count: number; ts: number }>();
const WINDOW_MS = 60_000;
const LIMIT = 5;

function rateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = hits.get(ip);
  if (!entry || now - entry.ts > WINDOW_MS) {
    hits.set(ip, { count: 1, ts: now });
    return false;
  }
  entry.count += 1;
  return entry.count > LIMIT;
}

async function notifyTelegram(text: string): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) {
    console.warn("Telegram env vars missing — lead logged only:", text);
    return;
  }
  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text }),
  });
}

export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0] ?? "unknown";
  if (rateLimited(ip)) {
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

  // Persist to the CMS (admin sees leads under /admin) + notify Telegram
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
  } catch (err) {
    console.error("Failed to store lead in CMS:", err);
  }
  await notifyTelegram(lines.join("\n"));

  return NextResponse.json({ ok: true });
}
