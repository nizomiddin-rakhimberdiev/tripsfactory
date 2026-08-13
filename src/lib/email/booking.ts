import { createTranslator } from "next-intl";
import type { Locale } from "@/i18n/routing";
import { locales } from "@/i18n/routing";
import { formatDate } from "@/lib/dates";
import { formatUsd } from "@/lib/currency";
import { BRAND_NAME, EMAIL, PHONE, TELEGRAM } from "@/lib/business";

import en from "@/i18n/messages/en.json";
import uz from "@/i18n/messages/uz.json";
import ru from "@/i18n/messages/ru.json";
import ja from "@/i18n/messages/ja.json";
import zh from "@/i18n/messages/zh.json";
import es from "@/i18n/messages/es.json";
import it from "@/i18n/messages/it.json";
import de from "@/i18n/messages/de.json";

/**
 * The site's own strings, reused for its email.
 *
 * Imported rather than fetched through `getTranslations`: these are sent from
 * an API route and from a Studio action, neither of which has the request
 * locale context next-intl's server helpers read from. The guest's language is
 * whatever they were reading the site in when they wrote to us.
 */
type Messages = typeof en;

const MESSAGES: Record<Locale, Messages> = {
  en,
  uz: uz as Messages,
  ru: ru as Messages,
  ja: ja as Messages,
  zh: zh as Messages,
  es: es as Messages,
  it: it as Messages,
  de: de as Messages,
};

function translator(locale: string) {
  const safe = (locales as readonly string[]).includes(locale)
    ? (locale as Locale)
    : "en";
  return createTranslator({
    locale: safe,
    messages: MESSAGES[safe],
    namespace: "email",
  });
}

/** Email clients strip <style> blocks, so everything is inline and table-based. */
const BRAND = "#6e1218";
const INK = "#1c1917";
const MUTED = "#6b6560";
const LINE = "#e7e2da";

function escape(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function shell({
  preheader,
  body,
  footer,
}: {
  preheader: string;
  body: string;
  footer: string;
}): string {
  return `<!doctype html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light"></head>
<body style="margin:0;padding:0;background:#faf7f2;">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${escape(preheader)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#faf7f2;padding:24px 12px;">
<tr><td align="center">
<table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#ffffff;border:1px solid ${LINE};border-radius:14px;overflow:hidden;">
  <tr><td style="background:${BRAND};padding:22px 28px;">
    <span style="font:600 19px/1.2 Georgia,'Times New Roman',serif;color:#ffffff;letter-spacing:.02em;">TRIPS<span style="color:#e8c07a;">FACTORY</span></span>
  </td></tr>
  <tr><td style="padding:28px;font:400 15px/1.65 -apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:${INK};">
    ${body}
  </td></tr>
  <tr><td style="border-top:1px solid ${LINE};padding:18px 28px;font:400 12.5px/1.6 -apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:${MUTED};">
    ${footer}
  </td></tr>
</table>
</td></tr></table>
</body></html>`;
}

function row(label: string, value: string): string {
  return `<tr>
    <td style="padding:7px 0;color:${MUTED};font-size:14px;white-space:nowrap;vertical-align:top;">${escape(label)}</td>
    <td style="padding:7px 0 7px 18px;font-size:14px;font-weight:600;vertical-align:top;">${escape(value)}</td>
  </tr>`;
}

function button(href: string, label: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:20px 0;"><tr>
    <td style="background:${BRAND};border-radius:10px;">
      <a href="${escape(href)}" style="display:inline-block;padding:13px 26px;color:#ffffff;text-decoration:none;font-size:15px;font-weight:600;">${escape(label)}</a>
    </td></tr></table>`;
}

export type BookingEmailInput = {
  name: string;
  locale: string;
  /** The master class as the guest saw it named, in their language. */
  title: string;
  /** ISO yyyy-mm-dd of the session they asked about, if there was one. */
  date?: string | null;
  guests?: number | null;
  priceUsd?: number | null;
  /** Where to pay. Absent until the operator has one to give. */
  paymentUrl?: string | null;
  /** The venue, for the confirmation. */
  venue?: string | null;
};

const contactFooter = (questions: string, footer: string) =>
  `${escape(questions)}<br><br>
   <a href="mailto:${EMAIL}" style="color:${BRAND};text-decoration:none;">${EMAIL}</a> ·
   <a href="tel:${PHONE.href}" style="color:${BRAND};text-decoration:none;">${PHONE.display}</a> ·
   <a href="${TELEGRAM}" style="color:${BRAND};text-decoration:none;">Telegram</a><br>
   ${escape(footer)}`;

/** Sent the moment an enquiry arrives: we have it, and here is how to pay. */
export function requestEmail(input: BookingEmailInput) {
  const t = translator(input.locale);
  const loc = ((locales as readonly string[]).includes(input.locale)
    ? input.locale
    : "en") as Locale;

  const details = [
    row(t("labels.class"), input.title),
    input.date ? row(t("labels.date"), formatDate(input.date, loc)) : "",
    input.guests ? row(t("labels.guests"), String(input.guests)) : "",
    input.priceUsd
      ? row(
          t("labels.price"),
          `${formatUsd(input.priceUsd)} / ${t("labels.perPerson")}`,
        )
      : "",
  ].join("");

  const pay = input.paymentUrl
    ? `<h2 style="margin:26px 0 8px;font:600 16px/1.4 inherit;">${escape(t("request.payTitle"))}</h2>
       <p style="margin:0;color:${MUTED};">${escape(t("request.payText"))}</p>
       ${button(input.paymentUrl, t("request.payButton"))}`
    : `<p style="margin:26px 0 0;color:${MUTED};">${escape(t("request.noPayText"))}</p>`;

  const html = shell({
    preheader: t("request.intro"),
    body: `<p style="margin:0 0 14px;">${escape(t("hi", { name: input.name }))}</p>
      <p style="margin:0 0 22px;">${escape(t("request.intro"))}</p>
      <h2 style="margin:0 0 6px;font:600 16px/1.4 inherit;">${escape(t("request.detailsTitle"))}</h2>
      <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;border-top:1px solid ${LINE};margin-top:6px;">${details}</table>
      ${pay}`,
    footer: contactFooter(t("questions"), t("footer")),
  });

  const text = [
    t("hi", { name: input.name }),
    "",
    t("request.intro"),
    "",
    `${t("labels.class")}: ${input.title}`,
    input.date ? `${t("labels.date")}: ${formatDate(input.date, loc)}` : "",
    input.guests ? `${t("labels.guests")}: ${input.guests}` : "",
    input.priceUsd
      ? `${t("labels.price")}: ${formatUsd(input.priceUsd)} / ${t("labels.perPerson")}`
      : "",
    "",
    input.paymentUrl
      ? `${t("request.payTitle")}: ${t("request.payText")}\n${input.paymentUrl}`
      : t("request.noPayText"),
    "",
    t("questions"),
    `${EMAIL} · ${PHONE.display} · ${TELEGRAM}`,
    t("footer"),
  ]
    .filter((line) => line !== "")
    .join("\n");

  return {
    subject: t("request.subject", { title: input.title }),
    html,
    text,
  };
}

/** Sent when the operator confirms the money arrived. */
export function confirmedEmail(input: BookingEmailInput) {
  const t = translator(input.locale);
  const loc = ((locales as readonly string[]).includes(input.locale)
    ? input.locale
    : "en") as Locale;

  const details = [
    row(t("labels.class"), input.title),
    input.date
      ? row(t("confirmed.whenTitle"), formatDate(input.date, loc, "full"))
      : "",
    input.venue ? row(t("confirmed.whereTitle"), input.venue) : "",
    input.guests ? row(t("labels.guests"), String(input.guests)) : "",
  ].join("");

  const html = shell({
    preheader: t("confirmed.intro"),
    body: `<p style="margin:0 0 14px;">${escape(t("hi", { name: input.name }))}</p>
      <p style="margin:0 0 22px;">${escape(t("confirmed.intro"))}</p>
      <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;border-top:1px solid ${LINE};">${details}</table>
      <p style="margin:24px 0 0;color:${MUTED};">${escape(t("confirmed.changeText"))}</p>`,
    footer: contactFooter(t("questions"), t("footer")),
  });

  const text = [
    t("hi", { name: input.name }),
    "",
    t("confirmed.intro"),
    "",
    `${t("labels.class")}: ${input.title}`,
    input.date
      ? `${t("confirmed.whenTitle")}: ${formatDate(input.date, loc, "full")}`
      : "",
    input.venue ? `${t("confirmed.whereTitle")}: ${input.venue}` : "",
    "",
    t("confirmed.changeText"),
    "",
    t("questions"),
    `${EMAIL} · ${PHONE.display} · ${TELEGRAM}`,
    t("footer"),
  ]
    .filter((line) => line !== "")
    .join("\n");

  return {
    subject: t("confirmed.subject", { title: input.title }),
    html,
    text,
  };
}

export const BRAND_LABEL = BRAND_NAME;
