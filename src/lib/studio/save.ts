/** The locale every document is guaranteed to have; it carries the shared fields. */
const BASE_LOCALE = "en";

type Body = Record<string, unknown>;

function isBlank(body: Body, keys: string[]): boolean {
  return keys.every((key) => {
    const value = body[key];
    if (Array.isArray(value)) return value.length === 0;
    if (typeof value === "string") return value.trim() === "";
    return value === null || value === undefined;
  });
}

/**
 * Writes one request per locale, because Payload stores localized fields per
 * locale and a single PATCH would only ever touch one of them.
 *
 * `localizedKeys` names the fields that actually differ between locales. A
 * locale with none of them filled in is skipped rather than sent: `title` and
 * `summary` are required, so PATCHing a Japanese translation nobody has written
 * yet means PATCHing `title: ""`, which Payload correctly rejects. That is what
 * every save on an imported tour was doing — seven 400s per save, one for each
 * language the sheet never provided, behind a bare "could not save" toast that
 * named none of them.
 *
 * The base locale is always written; it is the one carrying the non-localized
 * fields (price, dates, photo, published) that the other requests only repeat.
 *
 * Omit `localizedKeys` to send every locale unconditionally — right for globals,
 * where the document always exists in full.
 */
export async function sendPerLocale(
  method: "PATCH" | "POST",
  endpoint: string,
  bodies: Record<string, Body>,
  localizedKeys?: string[],
): Promise<{ ok: boolean; failed: string[] }> {
  const wanted = Object.entries(bodies).filter(
    ([loc, body]) =>
      loc === BASE_LOCALE || !localizedKeys?.length || !isBlank(body, localizedKeys),
  );

  const results = await Promise.all(
    wanted.map(async ([loc, body]) => {
      const res = await fetch(`${endpoint}?locale=${loc}&depth=0`, {
        method,
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      }).catch(() => null);
      return { loc, ok: Boolean(res?.ok) };
    }),
  );

  const failed = results.filter((r) => !r.ok).map((r) => r.loc);
  return { ok: failed.length === 0, failed };
}

/** A save that only half-worked should say which half. */
export function saveMessage(failed: string[], okSuffix = ""): string {
  if (!failed.length) return `Saqlandi${okSuffix}`;
  return `Saqlanmadi: ${failed.map((l) => l.toUpperCase()).join(", ")}`;
}
