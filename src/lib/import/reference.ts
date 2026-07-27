/**
 * The live lists the template's dropdowns are built from.
 *
 * Generating the workbook against real countries and cities is what turns
 * "type the country slug and hope" into "pick from a list" — a manager cannot
 * enter a country the CMS has never heard of, which removes the single most
 * common broken-relation error before it is typed.
 *
 * No `server-only` here on purpose: the CLI template generator imports it too.
 */
import type { Payload } from "payload";
import type { ReferenceData } from "./template";

export async function loadReference(payload: Payload): Promise<ReferenceData> {
  const [countries, cities] = await Promise.all([
    payload.find({ collection: "countries", limit: 300, depth: 0, locale: "en", sort: "name" }),
    payload.find({ collection: "cities", limit: 1000, depth: 1, locale: "en", sort: "name" }),
  ]);

  return {
    countries: countries.docs.map((c) => ({ name: c.name, slug: c.slug })),
    cities: cities.docs.map((c) => ({
      name: c.name,
      slug: c.slug,
      country: typeof c.country === "object" && c.country ? c.country.name : "",
    })),
  };
}
