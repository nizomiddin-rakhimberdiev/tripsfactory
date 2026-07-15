/**
 * AI content-translation pipeline (ADR-003).
 *
 * Reads the EN base content, finds entries missing from each locale's
 * overlay file (src/lib/content/translations/{locale}.json) and fills them
 * via the Claude API. Existing entries are NEVER overwritten — a hand-edited
 * (reviewed) translation always survives re-runs. To force a re-translation,
 * delete the entry from the JSON file and re-run.
 *
 * Usage:
 *   ANTHROPIC_API_KEY=... npm run translate            # all locales
 *   ANTHROPIC_API_KEY=... npm run translate -- ja zh   # specific locales
 */
import fs from "node:fs";
import path from "node:path";
import Anthropic from "@anthropic-ai/sdk";
import { regions, countries, cities } from "../src/lib/content/data/geography";
import { tours } from "../src/lib/content/data/tours";
import { guides } from "../src/lib/content/data/guides";
import type { TranslationOverlay } from "../src/lib/content/translations/schema";

const ALL_LOCALES = ["uz", "ru", "ja", "zh", "es", "it", "de"] as const;
const LANGUAGE_NAMES: Record<string, string> = {
  uz: "Uzbek (Latin script)",
  ru: "Russian",
  ja: "Japanese",
  zh: "Simplified Chinese",
  es: "Spanish",
  it: "Italian",
  de: "German",
};

const GLOSSARY = `
Glossary / translation rules:
- "TripsFactory" is a brand name — never translate or transliterate it.
- Proper nouns (Registan, Itchan Kala, Shah-i-Zinda, Poi-Kalyan, Afrosiyob,
  Gur-e-Amir, Bibi-Khanym, Lyabi-Hauz, Kyzylkum, Amu Darya) keep their
  established local spelling for the target language where one exists,
  otherwise keep the English transliteration.
- "Silk Road" uses the standard term in the target language.
- Keep the warm, professional tone of a boutique travel operator.
- Never translate slugs, URLs, or ISO dates.
`;

// Run from the repo root (npm run translate)
const TRANSLATIONS_DIR = path.join(
  process.cwd(),
  "src/lib/content/translations",
);

const client = new Anthropic();

async function translateJson<T>(
  payload: T,
  language: string,
  context: string,
): Promise<T> {
  const stream = client.messages.stream({
    model: "claude-opus-4-8",
    max_tokens: 32000,
    system: `You are a professional travel-content translator. Translate the string values of the JSON the user provides from English into ${language}. Preserve the JSON structure and keys exactly. ${GLOSSARY}`,
    messages: [
      {
        role: "user",
        content: `Context: ${context}\n\nTranslate this JSON's values into ${language}. Respond with ONLY the translated JSON, no commentary:\n\n${JSON.stringify(payload, null, 2)}`,
      },
    ],
  });
  const message = await stream.finalMessage();
  if (message.stop_reason === "refusal") {
    throw new Error("Translation request was refused");
  }
  const text = message.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("");
  const jsonText = text.slice(text.indexOf("{"), text.lastIndexOf("}") + 1);
  return JSON.parse(jsonText) as T;
}

function loadOverlay(locale: string): TranslationOverlay {
  const file = path.join(TRANSLATIONS_DIR, `${locale}.json`);
  return fs.existsSync(file)
    ? (JSON.parse(fs.readFileSync(file, "utf8")) as TranslationOverlay)
    : {};
}

function saveOverlay(locale: string, overlay: TranslationOverlay): void {
  const file = path.join(TRANSLATIONS_DIR, `${locale}.json`);
  fs.writeFileSync(file, JSON.stringify(overlay, null, 2) + "\n");
}

async function translateLocale(locale: string): Promise<void> {
  const language = LANGUAGE_NAMES[locale];
  const overlay = loadOverlay(locale);
  overlay.regions ??= {};
  overlay.countries ??= {};
  overlay.cities ??= {};
  overlay.tours ??= {};
  overlay.guides ??= {};
  let translated = 0;

  for (const r of regions) {
    if (overlay.regions[r.slug]) continue;
    overlay.regions[r.slug] = await translateJson(
      { name: r.name },
      language,
      "Geographic region name for a travel site",
    );
    translated++;
  }

  for (const c of countries.filter((c) => c.published)) {
    if (overlay.countries[c.slug]) continue;
    overlay.countries[c.slug] = await translateJson(
      { name: c.name, intro: c.intro },
      language,
      "Country destination page intro",
    );
    translated++;
  }

  for (const c of cities) {
    if (overlay.cities[c.slug]) continue;
    overlay.cities[c.slug] = await translateJson(
      { intro: c.intro, attractions: c.attractions },
      language,
      `City guide for ${c.name}`,
    );
    translated++;
  }

  for (const t of tours.filter((t) => t.published)) {
    if (overlay.tours[t.slug]) continue;
    overlay.tours[t.slug] = await translateJson(
      {
        title: t.title,
        summary: t.summary,
        itinerary: t.itinerary.map(({ title, description }) => ({
          title,
          description,
        })),
        included: t.included,
        excluded: t.excluded,
      },
      language,
      `Tour page for "${t.title}"`,
    );
    translated++;
  }

  for (const g of guides) {
    if (overlay.guides[g.slug]) continue;
    overlay.guides[g.slug] = await translateJson(
      { title: g.title, sections: g.sections },
      language,
      "Practical travel guide article",
    );
    translated++;
  }

  saveOverlay(locale, overlay);
  console.log(`${locale}: ${translated} entries translated`);
}

async function main() {
  const requested = process.argv.slice(2);
  const locales = requested.length
    ? requested.filter((l) => (ALL_LOCALES as readonly string[]).includes(l))
    : [...ALL_LOCALES];

  for (const locale of locales) {
    await translateLocale(locale);
  }
  console.log(
    "Done. Register any new overlay files in src/lib/content/localize.ts.",
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
