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
  /** Partners are unique on `code`; everything else on `slug`. */
  field: string = "slug",
): Promise<boolean> {
  return fetch(
    `/api/${collection}?where[${field}][equals]=${encodeURIComponent(slug)}&limit=1&depth=0`,
    { credentials: "include" },
  )
    .then((r) => (r.ok ? (r.json() as Promise<{ totalDocs?: number }>) : null))
    .then((d) => (d?.totalDocs ?? 0) > 0)
    .catch(() => false);
}

/**
 * The first set of slugs nobody has taken yet.
 *
 * `slugTaken` on its own can only refuse, which is right for a city — two
 * places called Samarkand is a mistake worth stopping. It is wrong for a tour.
 * Tour titles repeat legitimately: the same itinerary runs again next season,
 * or sells as a group and a private version, and an operator with a hundred
 * Uzbek itineraries names them the way the itineraries are named. The slug is
 * invisible in the Studio, so refusing to create a tour because an unseen
 * field collides tells the operator only that the button no longer works —
 * which is exactly how it was reported: "after a hundred tours I cannot add
 * any more."
 *
 * `build` is asked for a whole set so a variant pair keeps one suffix between
 * them: `…-2-group` and `…-2-private`, never `…-group` and `…-2-private`.
 */
export async function freeSlugs(
  collection: string,
  build: (attempt: number) => Record<string, string>,
  max = 50,
): Promise<Record<string, string> | null> {
  for (let attempt = 1; attempt <= max; attempt += 1) {
    const candidates = build(attempt);
    const taken = await Promise.all(
      Object.values(candidates).map((slug) => slugTaken(collection, slug)),
    );
    if (!taken.some(Boolean)) return candidates;
  }
  return null;
}

/**
 * Field names as the editor sees them on screen.
 *
 * Payload reports the offending field by its schema name — "heroImage",
 * "durationHours" — which is the one name that appears nowhere in the Studio.
 * An editor who left the photograph out was told to fill in "heroImage".
 */
const FIELD_LABELS: Record<string, string> = {
  title: "Nomi",
  name: "Nomi",
  slug: "Manzil (slug)",
  summary: "Qisqa tavsif",
  description: "Tavsif",
  intro: "Tavsif",
  body: "Matn",
  country: "Davlat",
  city: "Shahar",
  cities: "Shaharlar",
  region: "Mintaqa",
  heroImage: "Asosiy rasm",
  image: "Rasm",
  durationDays: "Davomiyligi (kun)",
  durationHours: "Davomiyligi (soat)",
  priceUsd: "Narxi",
  priceFromUsd: "Narxi",
  recommendedNights: "Tavsiya etilgan kechalar",
  type: "Turi",
  tier: "Daraja",
  email: "Email",
  password: "Parol",
};

/** Payload names the offending fields; showing them beats "could not save". */
export async function fieldErrors(res: Response | null): Promise<string> {
  try {
    const data = (await res?.json()) as {
      errors?: { data?: { errors?: { path: string }[] } }[];
    };
    return (data?.errors?.[0]?.data?.errors ?? [])
      .map((e) => FIELD_LABELS[e.path] ?? e.path)
      .join(", ");
  } catch {
    return "";
  }
}
