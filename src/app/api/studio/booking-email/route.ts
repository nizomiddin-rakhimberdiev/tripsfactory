/**
 * The two emails a master class booking sends, and the state change that goes
 * with the second one.
 *
 * `request` is normally sent by the enquiry route the moment the form is
 * submitted; it is exposed here so an operator can send it again when a guest
 * says nothing arrived, or after the payment link has been filled in.
 *
 * `confirmed` is the button an operator presses when the money is actually in
 * the account. It is deliberately manual: nothing on this side of the system
 * can see a bank transfer land, and a confirmation sent on a guess is worse
 * than one sent an hour late.
 */
import { NextResponse } from "next/server";
import { getPayload } from "payload";
import config from "@payload-config";
import { z } from "zod";
import { sendEmail } from "@/lib/email/send";
import { confirmedEmail, requestEmail } from "@/lib/email/booking";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const bodySchema = z.object({
  leadId: z.number().int().positive(),
  type: z.enum(["request", "confirmed"]),
});

export async function POST(request: Request) {
  const payload = await getPayload({ config });
  const { user } = await payload.auth({ headers: request.headers });
  if (!user) {
    return NextResponse.json(
      { error: "Ruxsat yo'q. Qaytadan kiring." },
      { status: 401 },
    );
  }

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "So'rov noto'g'ri." }, { status: 400 });
  }
  const { leadId, type } = parsed.data;

  const lead = await payload
    .findByID({ collection: "leads", id: leadId, depth: 0 })
    .catch(() => null);
  if (!lead) {
    return NextResponse.json({ error: "So'rov topilmadi." }, { status: 404 });
  }

  const locale = lead.locale ?? "en";

  // The class named in each language the email is written in. Falls back to
  // the slug only if the record has since been deleted.
  const titles = { ru: lead.tourSlug ?? "", en: lead.tourSlug ?? "" };
  let priceUsd: number | null = null;
  if (lead.tourSlug && lead.kind === "masterclass") {
    for (const l of ["ru", "en"] as const) {
      const found = await payload
        .find({
          collection: "masterclasses",
          where: { slug: { equals: lead.tourSlug } },
          locale: l,
          fallbackLocale: "en",
          limit: 1,
          depth: 0,
        })
        .catch(() => null);
      const doc = found?.docs[0];
      if (doc) {
        titles[l] = doc.title;
        priceUsd = doc.priceUsd;
      }
    }
  }

  const site = await payload
    .findGlobal({ slug: "site-content", depth: 0 })
    .catch(() => null);

  const input = {
    name: lead.name,
    locale,
    titles,
    date: lead.date,
    guests: lead.pax,
    priceUsd,
    paymentUrl: site?.booking?.paymentUrl ?? null,
    venue: site?.booking?.venue ?? null,
  };

  const message = type === "request" ? requestEmail(input) : confirmedEmail(input);
  const sent = await sendEmail({
    to: lead.email,
    subject: message.subject,
    html: message.html,
    text: message.text,
  });

  if (!sent.ok) {
    return NextResponse.json(
      {
        error:
          sent.error === "not_configured"
            ? "Email xizmati ulanmagan."
            : `Xat yuborilmadi: ${sent.error}`,
      },
      { status: 502 },
    );
  }

  // Only after the guest has actually been told. A record marked paid whose
  // confirmation never left is the one state an operator cannot see from the
  // list.
  if (type === "confirmed") {
    await payload
      .update({
        collection: "leads",
        id: leadId,
        data: { status: "paid", paidAt: new Date().toISOString() },
      })
      .catch((err) => {
        console.error("booking-email: confirmed but status not saved", err);
      });
  }

  return NextResponse.json({ ok: true, sent: sent.id });
}
