import type { Locale } from "@/i18n/routing";

/**
 * Prices are stored in USD only (ADR-004). Other currencies are display-time
 * approximations. Static fallback rates below; phase 2 replaces them with a
 * daily-updated rate source behind the same API.
 */
const localeCurrency: Record<Locale, { code: string; rate: number }> = {
  en: { code: "USD", rate: 1 },
  uz: { code: "UZS", rate: 12600 },
  ru: { code: "RUB", rate: 79 },
  ja: { code: "JPY", rate: 147 },
  zh: { code: "CNY", rate: 7.2 },
  es: { code: "EUR", rate: 0.86 },
  it: { code: "EUR", rate: 0.86 },
  de: { code: "EUR", rate: 0.86 },
};

export function formatUsd(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(amount);
}

/** Returns a localized approximation like "≈ 1.196 €" or null for USD locales. */
export function approxLocalPrice(usd: number, locale: Locale): string | null {
  const { code, rate } = localeCurrency[locale];
  if (code === "USD") return null;
  const converted = usd * rate;
  const formatted = new Intl.NumberFormat(locale, {
    style: "currency",
    currency: code,
    maximumFractionDigits: 0,
  }).format(converted);
  return `≈ ${formatted}`;
}
