/**
 * Which fields carry text worth translating, per collection.
 *
 * The five editors each declare a LOCALIZED list for deciding whether a locale
 * is worth writing at all; this is the same idea one level down — it also has
 * to know which keys inside an array of rows hold prose, so an itinerary day
 * comes back with its title and description translated and its day number
 * untouched.
 *
 * Anything absent here is never sent to the model: prices, dates, slugs,
 * relationships and booleans are the same in every language.
 */
export type TranslatableSpec = {
  /** Plain localized strings. */
  text: string[];
  /** Localized arrays of rows, and which keys in a row are prose. */
  arrays: { name: string; keys: string[] }[];
};

export const TRANSLATABLE: Record<string, TranslatableSpec> = {
  tours: {
    text: ["title", "summary"],
    arrays: [
      { name: "itinerary", keys: ["title", "description"] },
      { name: "included", keys: ["text"] },
      { name: "excluded", keys: ["text"] },
    ],
  },
  countries: {
    text: ["name", "intro", "body"],
    arrays: [],
  },
  cities: {
    text: ["name", "intro"],
    arrays: [{ name: "attractions", keys: ["text"] }],
  },
  guides: {
    text: ["title"],
    arrays: [{ name: "sections", keys: ["heading", "body"] }],
  },
  regions: {
    text: ["name"],
    arrays: [],
  },
};

/** The field a "has this locale been written?" check looks at. */
export const TITLE_FIELD: Record<string, string> = {
  tours: "title",
  countries: "name",
  cities: "name",
  guides: "title",
  regions: "name",
};

export const TRANSLATABLE_COLLECTIONS = Object.keys(TRANSLATABLE);
