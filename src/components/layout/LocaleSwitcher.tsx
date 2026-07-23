"use client";

import { useLocale, useTranslations } from "next-intl";
import { locales, localeNames, type Locale } from "@/i18n/routing";
import { usePathname, useRouter } from "@/i18n/navigation";
import { SelectMenu } from "@/components/SelectMenu";

export function LocaleSwitcher() {
  const locale = useLocale();
  const t = useTranslations("common");
  const router = useRouter();
  const pathname = usePathname();

  // Was a native <select>, on the reasoning that the platform picker is the
  // most reliable one. That held until the site had a picker of its own — now
  // the native list is the only surface the brand cannot reach, and it opens in
  // grey OS chrome beside a warm ivory header. Consistency wins.
  return (
    <SelectMenu
      compact
      align="right"
      label={t("language")}
      value={locale}
      onChange={(next) => router.replace(pathname, { locale: next as Locale })}
      options={locales.map((l) => ({ value: l, label: localeNames[l] }))}
    />
  );
}
