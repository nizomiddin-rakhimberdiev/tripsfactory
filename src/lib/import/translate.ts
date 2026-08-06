/**
 * Machine translation of tour copy, at write time.
 *
 * The site reads eight locales but the sheet only ever carries English, and
 * Payload falls back to English when a translation is missing — so a Japanese
 * visitor was reading English prose under a Japanese URL. Translating on read
 * would mean an API call on every page view; translating on write means one
 * call per tour, ever.
 *
 * Nothing here runs when a page is rendered. It runs during an import, and
 * when an editor asks for it explicitly.
 *
 * One request per locale, issued in parallel: a single request covering all
 * seven produces a long JSON body that is more likely to come back truncated,
 * and a locale that fails should not take the other six with it.
 */
import { locales as ALL_LOCALES } from "@/i18n/routing";

const BASE = "en";
const MODEL = process.env.GEMINI_MODEL ?? "gemini-2.5-flash";
const ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/models";

/** Locales that need filling — every configured locale except the source. */
export const TARGET_LOCALES = ALL_LOCALES.filter((l) => l !== BASE);

const LANGUAGE_NAMES: Record<string, string> = {
  uz: "Uzbek (Latin script)",
  ru: "Russian",
  ja: "Japanese",
  zh: "Simplified Chinese",
  es: "Spanish",
  it: "Italian",
  de: "German",
};

/**
 * The shape handed to the model and expected back.
 *
 * Values may be strings or arrays of strings; the caller flattens a tour's
 * localized fields into this and rebuilds them from the result. Keys are
 * opaque to the model, which is told to preserve them exactly.
 */
export type Translatable = Record<string, string | string[]>;

export class TranslationUnavailable extends Error {}

function prompt(target: string, payload: Translatable): string {
  return [
    `Translate the values of this JSON object from English into ${LANGUAGE_NAMES[target] ?? target}.`,
    "",
    "Rules:",
    "- Return ONLY a JSON object with exactly the same keys and the same structure. No prose, no code fence.",
    "- An array must come back as an array of the same length, in the same order.",
    "- This is marketing copy for a Silk Road tour operator. Translate it as a native travel writer would: natural, warm, specific. Do not translate word for word.",
    "- Keep place names, hotel names and proper nouns in the form a reader of the target language expects (e.g. Samarkand → サマルカンド in Japanese).",
    "- Keep numbers, dates and durations exactly as they are.",
    "- If a value is an empty string, return an empty string.",
    "",
    JSON.stringify(payload),
  ].join("\n");
}

async function callGemini(text: string, signal?: AbortSignal): Promise<string> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    throw new TranslationUnavailable(
      "GEMINI_API_KEY o'rnatilmagan — tarjimasiz davom etildi.",
    );
  }

  const res = await fetch(`${ENDPOINT}/${MODEL}:generateContent?key=${key}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    signal,
    body: JSON.stringify({
      contents: [{ parts: [{ text }] }],
      generationConfig: {
        temperature: 0.3,
        responseMimeType: "application/json",
      },
    }),
  });

  if (!res.ok) {
    throw new Error(`Gemini ${res.status}`);
  }
  const data = (await res.json()) as {
    candidates?: { content?: { parts?: { text?: string }[] } }[];
  };
  const out = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!out) throw new Error("Gemini bo'sh javob qaytardi");
  return out;
}

/** Same keys, same array lengths — anything else is a mistranslation, not a translation. */
function sameShape(source: Translatable, candidate: unknown): candidate is Translatable {
  if (!candidate || typeof candidate !== "object") return false;
  const c = candidate as Record<string, unknown>;
  for (const [k, v] of Object.entries(source)) {
    if (Array.isArray(v)) {
      if (!Array.isArray(c[k]) || (c[k] as unknown[]).length !== v.length) return false;
      if ((c[k] as unknown[]).some((x) => typeof x !== "string")) return false;
    } else if (typeof c[k] !== "string") {
      return false;
    }
  }
  return true;
}

/**
 * Translate one payload into the given locales.
 *
 * Returns only the locales that came back intact. A locale that failed or came
 * back malformed is simply absent, so the caller writes what worked and can
 * report the rest — a partial translation is worth keeping, and the missing
 * ones fall back to English exactly as they do today.
 */
export async function translateInto(
  source: Translatable,
  targets: readonly string[] = TARGET_LOCALES,
  opts: { timeoutMs?: number } = {},
): Promise<{ done: Record<string, Translatable>; failed: string[] }> {
  const meaningful = Object.values(source).some((v) =>
    Array.isArray(v) ? v.some((s) => s.trim()) : String(v).trim(),
  );
  if (!meaningful) return { done: {}, failed: [] };

  const results = await Promise.all(
    targets.map(async (target) => {
      const signal = AbortSignal.timeout(opts.timeoutMs ?? 45_000);
      try {
        const raw = await callGemini(prompt(target, source), signal);
        const parsed: unknown = JSON.parse(raw);
        if (!sameShape(source, parsed)) {
          return { target, value: null };
        }
        return { target, value: parsed };
      } catch (err) {
        if (err instanceof TranslationUnavailable) throw err;
        return { target, value: null };
      }
    }),
  );

  const done: Record<string, Translatable> = {};
  const failed: string[] = [];
  for (const r of results) {
    if (r.value) done[r.target] = r.value;
    else failed.push(r.target);
  }
  return { done, failed };
}
