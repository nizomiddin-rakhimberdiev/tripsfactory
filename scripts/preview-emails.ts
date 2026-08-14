/**
 * Renders both booking emails in every locale to a folder, so the copy can be
 * read before a guest reads it.
 *
 *   npx tsx scripts/preview-emails.ts ./email-preview
 *
 * Imports the same builder the app sends with, rather than a copy — a preview
 * that can drift from what is actually sent is worse than none. This is why
 * the builder carries no `server-only` marker: it composes strings and touches
 * no secret. `lib/email/send.ts`, which holds the API key, keeps it.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { requestEmail, confirmedEmail } from "../src/lib/email/booking";

const out = process.argv[2] ?? "./email-preview";
mkdirSync(out, { recursive: true });

const input = {
  name: "Anna Müller",
  titles: { ru: "Мастер-класс по мантам", en: "Manti Master Class" },
  date: "2026-09-05",
  guests: 2,
  priceUsd: 65,
  paymentUrl: "https://example.com/pay/abc",
  venue: "Toshkent, Amir Temur ko'chasi 15",
};

// One message per kind now, not one per locale: booking mail is Russian and
// English together — see EMAIL_LOCALES.
for (const [name, build] of [
  ["request", requestEmail],
  ["confirmed", confirmedEmail],
] as const) {
  const mail = build(input);
  writeFileSync(`${out}/${name}.html`, mail.html);
  console.log(`\n=== ${name} ===`);
  console.log(`Subject: ${mail.subject}`);
  console.log(mail.text);
}
console.log(`\nHTML written to ${out}`);
