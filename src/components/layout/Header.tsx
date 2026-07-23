import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { flags } from "@/lib/flags";
import { getPublishedCountries, getRegions } from "@/lib/content";
import { LocaleSwitcher } from "./LocaleSwitcher";
import { MainNav, type NavRegion } from "./MainNav";
import { Wordmark } from "./Wordmark";

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
    events: nav("excursions"),
    guide: nav("guide"),
    about: nav("about"),
    contact: nav("contact"),
    premium: nav("premium"),
    menu: nav("menu"),
  };

  return (
    <header className="sticky top-0 z-50 border-b border-border/70 tf-glass">
      {/*
        Three equal-flanked columns on desktop so the menu sits optically dead
        centre regardless of how wide the wordmark or the language name is.
        Below lg it collapses to wordmark + right cluster, with the menu behind
        the hamburger — seven items will not fit a tablet without crowding.
      */}
      <div className="relative mx-auto flex max-w-6xl items-center gap-4 px-4 py-3 md:px-6 lg:grid lg:grid-cols-[1fr_auto_1fr]">
        {/* No aria-label: the lockup's alt text already names the brand, and a
            label here would make screen readers announce it twice. */}
        <Link href="/" className="shrink-0 lg:justify-self-start">
          <Wordmark priority />
        </Link>
        <MainNav
          labels={labels}
          regions={navRegions}
          premium={flags.premium}
          events={flags.excursions}
          localeSwitcher={<LocaleSwitcher />}
        />
      </div>
    </header>
  );
}
