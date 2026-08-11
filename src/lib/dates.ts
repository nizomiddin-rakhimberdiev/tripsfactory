import type { Locale } from "@/i18n/routing";

/**
 * Dates for the public site.
 *
 * `Intl.DateTimeFormat("uz", …)` cannot be trusted here. The Workers runtime
 * carries the same trimmed ICU data as Chrome, and that build has no Uzbek
 * month names — so a departure on 1 September rendered as "2026 M09 1" on
 * every Uzbek page of the site, in the departures table and on the master
 * class pages. Node has the full data set, which is why it looked correct in
 * development and wrong in production.
 *
 * So Uzbek is composed from the names below and only the digits come from the
 * date itself. The other seven locales have complete data in both runtimes and
 * go through Intl unchanged.
 *
 * Dates here are calendar dates stored as midnight UTC. Read in the runtime's
 * own zone they slip a day west of Greenwich — the 1 September departure reads
 * "31 August" in New York — so every part is taken in UTC.
 */
const UZ_MONTHS = [
  "yanvar",
  "fevral",
  "mart",
  "aprel",
  "may",
  "iyun",
  "iyul",
  "avgust",
  "sentabr",
  "oktabr",
  "noyabr",
  "dekabr",
];

/** Indexed by getUTCDay(): 0 is Sunday. */
const UZ_WEEKDAYS = [
  "yakshanba",
  "dushanba",
  "seshanba",
  "chorshanba",
  "payshanba",
  "juma",
  "shanba",
];

/**
 * "1-sentabr, 2026", or with `full` "seshanba, 1-sentabr, 2026".
 *
 * The Uzbek shape follows the same order Intl uses for the locale where the
 * data exists, so the two runtimes now agree rather than merely differing less.
 */
export function formatDate(
  iso: string,
  locale: Locale,
  style: "medium" | "full" = "medium",
): string {
  const date = new Date(iso);
  if (locale === "uz") {
    const day = date.getUTCDate();
    const month = UZ_MONTHS[date.getUTCMonth()];
    const year = date.getUTCFullYear();
    const stamp = `${day}-${month}, ${year}`;
    return style === "full"
      ? `${UZ_WEEKDAYS[date.getUTCDay()]}, ${stamp}`
      : stamp;
  }
  return new Intl.DateTimeFormat(locale, {
    dateStyle: style,
    timeZone: "UTC",
  }).format(date);
}
