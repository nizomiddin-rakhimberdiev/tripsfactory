import type { Locale } from "@/i18n/routing";
import type { City, Country, GuidePage, Region, Tour } from "./types";
import type { TranslationOverlay } from "./translations/schema";

/**
 * Content is authored in EN (ADR-003); per-locale overlays are merged on top
 * with field-level fallback to EN. Overlays are static imports so localized
 * pages stay fully static (SSG) — no runtime file IO.
 */
import uz from "./translations/uz.json";
import ru from "./translations/ru.json";
import ja from "./translations/ja.json";
import zh from "./translations/zh.json";
import es from "./translations/es.json";
import it from "./translations/it.json";
import de from "./translations/de.json";

const overlays: Partial<Record<Locale, TranslationOverlay>> = {
  uz: uz as TranslationOverlay,
  ru: ru as TranslationOverlay,
  ja: ja as TranslationOverlay,
  zh: zh as TranslationOverlay,
  es: es as TranslationOverlay,
  it: it as TranslationOverlay,
  de: de as TranslationOverlay,
};

function overlay(locale: string): TranslationOverlay {
  return overlays[locale as Locale] ?? {};
}

export function localizeRegion(r: Region, locale: string): Region {
  const t = overlay(locale).regions?.[r.slug];
  return t ? { ...r, name: t.name ?? r.name } : r;
}

export function localizeCountry(c: Country, locale: string): Country {
  const t = overlay(locale).countries?.[c.slug];
  return t ? { ...c, name: t.name ?? c.name, intro: t.intro ?? c.intro } : c;
}

export function localizeCity(c: City, locale: string): City {
  const t = overlay(locale).cities?.[c.slug];
  return t
    ? {
        ...c,
        intro: t.intro ?? c.intro,
        attractions: t.attractions ?? c.attractions,
      }
    : c;
}

export function localizeTour(tour: Tour, locale: string): Tour {
  const t = overlay(locale).tours?.[tour.slug];
  if (!t) return tour;
  return {
    ...tour,
    title: t.title ?? tour.title,
    summary: t.summary ?? tour.summary,
    included: t.included ?? tour.included,
    excluded: t.excluded ?? tour.excluded,
    itinerary: tour.itinerary.map((day, i) => ({
      ...day,
      title: t.itinerary?.[i]?.title ?? day.title,
      description: t.itinerary?.[i]?.description ?? day.description,
    })),
  };
}

export function localizeGuide(g: GuidePage, locale: string): GuidePage {
  const t = overlay(locale).guides?.[g.slug];
  if (!t) return g;
  return {
    ...g,
    title: t.title ?? g.title,
    sections: g.sections.map((s, i) => ({
      heading: t.sections?.[i]?.heading ?? s.heading,
      body: t.sections?.[i]?.body ?? s.body,
    })),
  };
}
