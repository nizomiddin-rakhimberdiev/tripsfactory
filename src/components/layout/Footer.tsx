import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { getPublishedCountries } from "@/lib/content";

export async function Footer() {
  const t = await getTranslations();
  const locale = await getLocale();
  const countryList = await getPublishedCountries(locale);

  return (
    <footer className="mt-16 border-t border-border bg-surface">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:grid-cols-2 md:grid-cols-4">
        <div>
          <p className="text-lg font-bold">
            Trips<span className="text-primary">Factory</span>
          </p>
          <p className="mt-2 text-sm text-muted">{t("footer.tagline")}</p>
        </div>
        <div>
          <p className="mb-3 text-sm font-semibold">
            {t("footer.destinations")}
          </p>
          <ul className="space-y-2 text-sm text-muted">
            {countryList.map((c) => (
              <li key={c.slug}>
                <Link
                  href={`/destinations/${c.regionSlug}/${c.slug}`}
                  className="hover:text-foreground"
                >
                  {c.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="mb-3 text-sm font-semibold">{t("footer.company")}</p>
          <ul className="space-y-2 text-sm text-muted">
            <li>
              <Link href="/about" className="hover:text-foreground">
                {t("nav.about")}
              </Link>
            </li>
            <li>
              <Link href="/contact" className="hover:text-foreground">
                {t("nav.contact")}
              </Link>
            </li>
            <li>
              <Link href="/premium" className="hover:text-foreground">
                {t("nav.premium")}
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <p className="mb-3 text-sm font-semibold">{t("footer.followUs")}</p>
          <ul className="space-y-2 text-sm text-muted">
            <li>Instagram</li>
            <li>Telegram</li>
            <li>YouTube</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-border py-4 text-center text-xs text-muted">
        © {new Date().getFullYear()} TripsFactory. {t("footer.rights")}
      </div>
    </footer>
  );
}
