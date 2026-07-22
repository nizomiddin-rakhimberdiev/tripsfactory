"use client";

import { useLocale, useTranslations } from "next-intl";
import { locales, localeNames, type Locale } from "@/i18n/routing";
import { usePathname, useRouter } from "@/i18n/navigation";

export function LocaleSwitcher() {
  const locale = useLocale();
  const t = useTranslations("common");
  const router = useRouter();
  const pathname = usePathname();

  function onChange(next: string) {
    router.replace(pathname, { locale: next as Locale });
  }

  return (
    // Borderless by design: a boxed control was the one piece of raw browser
    // chrome left in an otherwise composed header. Native <select> is kept —
    // it is the most reliable picker on every platform, especially mobile.
    <select
      aria-label={t("language")}
      className="cursor-pointer rounded-lg bg-transparent py-1.5 pl-1 pr-0 text-sm text-muted transition-colors hover:text-foreground"
      value={locale}
      onChange={(e) => onChange(e.target.value)}
    >
      {locales.map((l) => (
        <option key={l} value={l}>
          {localeNames[l]}
        </option>
      ))}
    </select>
  );
}
