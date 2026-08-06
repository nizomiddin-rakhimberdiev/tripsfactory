/**
 * URL slug from a title.
 *
 * Derived rather than asked for: the slug is a required, unique field that no
 * editor screen shows, and making someone invent one is a question with only a
 * wrong answer. It comes from the English title, which is the field every
 * record has to have anyway.
 */
export function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[’‘'`´ʻʼ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

/**
 * Whether a slug is already taken.
 *
 * Left to the database a collision comes back as a bare 500 — "Something went
 * wrong" — which tells an editor nothing about what to change. Asking first
 * turns it into a sentence naming the record that already holds the name.
 */
export async function slugTaken(
  collection: string,
  slug: string,
): Promise<boolean> {
  return fetch(
    `/api/${collection}?where[slug][equals]=${encodeURIComponent(slug)}&limit=1&depth=0`,
    { credentials: "include" },
  )
    .then((r) => (r.ok ? (r.json() as Promise<{ totalDocs?: number }>) : null))
    .then((d) => (d?.totalDocs ?? 0) > 0)
    .catch(() => false);
}

/** Payload names the offending fields; showing them beats "could not save". */
export async function fieldErrors(res: Response | null): Promise<string> {
  try {
    const data = (await res?.json()) as {
      errors?: { data?: { errors?: { path: string }[] } }[];
    };
    return (data?.errors?.[0]?.data?.errors ?? []).map((e) => e.path).join(", ");
  } catch {
    return "";
  }
}
