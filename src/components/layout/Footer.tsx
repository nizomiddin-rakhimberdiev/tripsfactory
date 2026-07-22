import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { getPublishedCountries } from "@/lib/content";

export async function Footer() {
  const t = await getTranslations();
  const locale = await getLocale();
  const countryList = await getPublishedCountries(locale);

  return (
    <footer className="mt-24 border-t border-border bg-surface">
      <div className="mx-auto grid max-w-6xl gap-12 px-4 py-20 sm:grid-cols-2 md:grid-cols-4 md:px-6">
        <div>
          <p className="leading-none">
            <span className="tf-display block text-2xl">Trips</span>
            <span className="tf-eyebrow block text-[10px] text-primary">
              Factory
            </span>
          </p>
          <div className="tf-rule mt-6" />
          <p className="mt-6 max-w-xs text-sm leading-relaxed text-muted">
            {t("footer.tagline")}
          </p>
        </div>
        <div>
          <p className="tf-eyebrow mb-4 text-xs text-primary">
            {t("footer.destinations")}
          </p>
          <ul className="space-y-3 text-sm text-muted">
            {countryList.map((c) => (
              <li key={c.slug}>
                <Link
                  href={`/destinations/${c.regionSlug}/${c.slug}`}
                  className="transition-colors hover:text-foreground"
                >
                  {c.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="tf-eyebrow mb-4 text-xs text-primary">
            {t("footer.company")}
          </p>
          <ul className="space-y-3 text-sm text-muted">
            <li>
              <Link
                href="/about"
                className="transition-colors hover:text-foreground"
              >
                {t("nav.about")}
              </Link>
            </li>
            <li>
              <Link
                href="/contact"
                className="transition-colors hover:text-foreground"
              >
                {t("nav.contact")}
              </Link>
            </li>
            <li>
              <Link
                href="/premium"
                className="transition-colors hover:text-foreground"
              >
                {t("nav.premium")}
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <p className="tf-eyebrow mb-4 text-xs text-primary">
            {t("footer.followUs")}
          </p>
          <ul className="space-y-3 text-sm text-muted">
            <li>Instagram</li>
            <li>Telegram</li>
            <li>YouTube</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-border py-5 text-center text-xs text-muted">
        © {new Date().getFullYear()} TripsFactory. {t("footer.rights")}
      </div>
    </footer>
  );
}
