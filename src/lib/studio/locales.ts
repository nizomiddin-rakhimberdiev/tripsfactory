export const STUDIO_LOCALES = [
  { code: "en", label: "EN" },
  { code: "uz", label: "UZ" },
  { code: "ru", label: "RU" },
  { code: "ja", label: "JA" },
  { code: "zh", label: "ZH" },
  { code: "es", label: "ES" },
  { code: "it", label: "IT" },
  { code: "de", label: "DE" },
] as const;

export type StudioLocale = (typeof STUDIO_LOCALES)[number]["code"];
export const LOCALE_CODES = STUDIO_LOCALES.map((l) => l.code);
