/**
 * Timestamps for the Studio, formatted identically on the server and in the
 * browser.
 *
 * `Intl.DateTimeFormat("uz-UZ", { month: "short" })` cannot be used here: Node
 * and Chrome ship different ICU locale data for Uzbek and disagree on the
 * result. For the same instant and the same options, Node produces
 * "06-avg, 14:23" and Chrome produces "M08 06 14:23" — Chrome has no
 * abbreviated Uzbek month names and falls back to a numeric form. Rendering
 * that on a client component means the server HTML and the client render never
 * match, which is what React was reporting as a hydration failure on the leads
 * page, and no timeZone option fixes it because the difference is in the
 * locale data rather than the clock.
 *
 * So the month name comes from this file and only the digits come from Intl,
 * which both runtimes agree on. The zone is pinned to Tashkent because that is
 * where the people reading these timestamps are; without it the server, which
 * runs in UTC, stamped every lead five hours early.
 */
const UZ_MONTHS_SHORT = [
  "yan",
  "fev",
  "mar",
  "apr",
  "may",
  "iyn",
  "iyl",
  "avg",
  "sen",
  "okt",
  "noy",
  "dek",
];

const TASHKENT = "Asia/Tashkent";

/** Numeric parts in a fixed zone — identical in every runtime. */
function parts(iso: string, opts: Intl.DateTimeFormatOptions) {
  const found = new Intl.DateTimeFormat("en-GB", {
    timeZone: TASHKENT,
    hour12: false,
    ...opts,
  }).formatToParts(new Date(iso));
  return (type: Intl.DateTimeFormatPartTypes) =>
    found.find((p) => p.type === type)?.value ?? "";
}

/** "06-avg, 14:23" — Tashkent time, for a list of leads or edits. */
export function formatDateTime(iso?: string | null): string {
  if (!iso) return "—";
  const get = parts(iso, {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
  const month = UZ_MONTHS_SHORT[Number(get("month")) - 1] ?? get("month");
  return `${get("day")}-${month}, ${get("hour")}:${get("minute")}`;
}
