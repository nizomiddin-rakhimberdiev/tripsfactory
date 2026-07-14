import { defineRouting } from "next-intl/routing";

export const locales = ["en", "uz", "ru", "ja", "zh", "es", "it", "de"] as const;
export type Locale = (typeof locales)[number];

export const localeNames: Record<Locale, string> = {
  en: "English",
  uz: "O'zbekcha",
  ru: "Русский",
  ja: "日本語",
  zh: "中文",
  es: "Español",
  it: "Italiano",
  de: "Deutsch",
};

export const routing = defineRouting({
  locales,
  defaultLocale: "en",
  localePrefix: "always",
});
