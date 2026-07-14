"use client";

import { useLocale } from "next-intl";
import { locales, localeNames, type Locale } from "@/i18n/routing";
import { usePathname, useRouter } from "@/i18n/navigation";

export function LocaleSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  function onChange(next: string) {
    router.replace(pathname, { locale: next as Locale });
  }

  return (
    <select
      aria-label="Language"
      className="rounded-md border border-border bg-background px-2 py-1.5 text-sm text-foreground"
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
