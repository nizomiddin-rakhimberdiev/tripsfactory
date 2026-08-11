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

  // Uzbek is composed by hand for the same reason dates are: the Workers
  // runtime has no Uzbek locale data, so Intl fell back to the ISO code and
  // English grouping — "≈ UZS 10,080,000" on every Uzbek page, where the rest
  // of the site says "≈ 63 200 ₽" and "≈ ￥117,600". Grouping comes from a
  // locale both runtimes agree on, then the separator and the currency name
  // are set explicitly.
  if (locale === "uz") {
    const grouped = new Intl.NumberFormat("en-US", {
      maximumFractionDigits: 0,
    })
      .format(converted)
      .replace(/,/g, " ");
    return `≈ ${grouped} soʻm`;
  }

  const formatted = new Intl.NumberFormat(locale, {
    style: "currency",
    currency: code,
    maximumFractionDigits: 0,
  }).format(converted);
  return `≈ ${formatted}`;
}
