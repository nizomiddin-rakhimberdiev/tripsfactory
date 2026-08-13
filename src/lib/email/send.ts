import "server-only";

/**
 * Transactional email, through Resend's REST API.
 *
 * A plain fetch rather than the SDK: the SDK carries a Node dependency tree
 * that has already cost this project two production outages on Workers
 * (undici's wasm HTTP parser, sharp's wasm fallback), and what it wraps is one
 * POST.
 *
 * These are the emails that carry money — a payment instruction and a booking
 * confirmation. They are never allowed to take down the request that triggered
 * them: a failure is logged loudly with the whole message, so the enquiry can
 * be answered by hand from the log, and the caller decides what to tell the
 * operator.
 */
const ENDPOINT = "https://api.resend.com/emails";

/**
 * Who the guest sees it from.
 *
 * Overridable because the sending domain has to be verified in Resend before
 * tripsfactory.com can be used, and until it is, Resend only accepts its own
 * test sender. One environment variable is the difference between a test run
 * and going live — no code change.
 */
const FROM =
  process.env.EMAIL_FROM ?? "TripsFactory <sales@tripsfactory.com>";

export type EmailResult =
  | { ok: true; id: string }
  | { ok: false; error: string };

export async function sendEmail({
  to,
  subject,
  html,
  text,
  replyTo,
}: {
  to: string;
  subject: string;
  html: string;
  /** Always sent alongside the HTML: some clients show it, spam filters read it. */
  text: string;
  replyTo?: string;
}): Promise<EmailResult> {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    console.error("EMAIL-LOST: RESEND_API_KEY is not set.", { to, subject });
    return { ok: false, error: "not_configured" };
  }

  try {
    const res = await fetch(ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      signal: AbortSignal.timeout(10_000),
      body: JSON.stringify({
        from: FROM,
        to: [to],
        subject,
        html,
        text,
        ...(replyTo ? { reply_to: replyTo } : {}),
      }),
    });

    const body = (await res.json().catch(() => ({}))) as {
      id?: string;
      message?: string;
    };

    if (!res.ok) {
      // The whole thing, not just the status: a booking confirmation that did
      // not arrive is a guest standing outside a door, and the operator needs
      // to be able to reconstruct what should have been sent.
      console.error("EMAIL-LOST:", res.status, body.message, { to, subject });
      return { ok: false, error: body.message ?? `HTTP ${res.status}` };
    }
    return { ok: true, id: body.id ?? "" };
  } catch (err) {
    console.error("EMAIL-LOST: Resend unreachable.", { to, subject }, err);
    return { ok: false, error: "unreachable" };
  }
}
