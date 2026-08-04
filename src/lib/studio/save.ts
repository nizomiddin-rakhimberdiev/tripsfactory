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

  // One at a time, not Promise.all.
  //
  // A per-locale PATCH is not as narrow as it looks: Payload rewrites the
  // document's *whole* locale table on every write — it deletes every row for
  // the document, then reinserts all of them. Eight of those in flight at once
  // race each other, and two that interleave leave a duplicate behind, which
  // the unique index on (_locale, _parent_id) rejects.
  //
  // Postgres hid this. Each request ran in its own transaction, so the losers
  // were serialised rather than failing. D1 has no transactions, so the race
  // became visible immediately: every locale came back 500 with
  // "UNIQUE constraint failed: tours_locales._locale, tours_locales._parent_id".
  //
  // Sequential costs a few hundred milliseconds on a save nobody times, and
  // removes a race the old backend was only papering over.
  const results: { loc: string; ok: boolean }[] = [];
  for (const [loc, body] of wanted) {
    const res = await fetch(`${endpoint}?locale=${loc}&depth=0`, {
      method,
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(body),
    }).catch(() => null);
    results.push({ loc, ok: Boolean(res?.ok) });
  }

  const failed = results.filter((r) => !r.ok).map((r) => r.loc);
  return { ok: failed.length === 0, failed };
}

/** A save that only half-worked should say which half. */
export function saveMessage(failed: string[], okSuffix = ""): string {
  if (!failed.length) return `Saqlandi${okSuffix}`;
  return `Saqlanmadi: ${failed.map((l) => l.toUpperCase()).join(", ")}`;
}
