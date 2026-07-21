import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { flags } from "@/lib/flags";
import { getPublishedCountries, getRegions } from "@/lib/content";
import { LocaleSwitcher } from "./LocaleSwitcher";
import { MainNav, type NavRegion } from "./MainNav";

export async function Header() {
  const locale = await getLocale();
  const [nav, toursT, regions, countries] = await Promise.all([
    getTranslations("nav"),
    getTranslations("tours"),
    getRegions(locale),
    getPublishedCountries(locale),
  ]);

  const navRegions: NavRegion[] = regions.map((r) => ({
    slug: r.slug,
    name: r.name,
    countries: countries
      .filter((c) => c.regionSlug === r.slug)
      .map((c) => ({ slug: c.slug, regionSlug: c.regionSlug, name: c.name })),
  }));

  const labels = {
    tours: nav("tours"),
    allTours: toursT("title"),
    group: toursT("type_group"),
    private: toursT("type_private"),
    destinations: nav("destinations"),
    guide: nav("guide"),
    about: nav("about"),
    contact: nav("contact"),
    premium: nav("premium"),
    menu: "Menu",
  };

  return (
    <header className="sticky top-0 z-50 border-b border-border/70 tf-glass">
      <div className="relative mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3.5 md:px-6">
        <Link
          href="/"
          className="tf-display text-xl font-bold tracking-tight text-foreground"
        >
          Trips<span className="text-primary">Factory</span>
        </Link>
        <MainNav
          labels={labels}
          regions={navRegions}
          premium={flags.premium}
          localeSwitcher={<LocaleSwitcher />}
        />
      </div>
    </header>
  );
}
