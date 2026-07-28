import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { getPublishedCountries } from "@/lib/content";
import { EMAIL, LEGAL_NAME, PHONE, SOCIAL } from "@/lib/business";
import { Wordmark } from "./Wordmark";

export async function Footer() {
  const t = await getTranslations();
  const locale = await getLocale();
  const countryList = await getPublishedCountries(locale);

  return (
    <footer className="mt-24 border-t border-border bg-surface">
      <div className="mx-auto grid max-w-6xl gap-12 px-4 py-20 sm:grid-cols-2 md:grid-cols-4 md:px-6">
        <div>
          <Wordmark />
          <div className="tf-rule mt-6" />
          <p className="mt-6 max-w-xs text-sm leading-relaxed text-muted">
            {t("footer.tagline")}
          </p>
        </div>
        <div>
          <p className="tf-eyebrow mb-4 text-primary">
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
          <p className="tf-eyebrow mb-4 text-primary">
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
          <p className="tf-eyebrow mb-4 text-primary">
            {t("footer.followUs")}
          </p>
          {/* These were three <li> of plain text on every page of the site —
              a "Follow Us" column that could not be followed. */}
          <ul className="space-y-3 text-sm text-muted">
            {SOCIAL.map((s) => (
              <li key={s.url}>
                <a
                  href={s.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="transition-colors hover:text-foreground"
                >
                  {s.label}
                </a>
              </li>
            ))}
          </ul>
          <div className="tf-rule my-6" />
          <ul className="space-y-3 text-sm text-muted">
            <li>
              <a
                href={`tel:${PHONE.href}`}
                className="transition-colors hover:text-foreground"
              >
                {PHONE.display}
              </a>
            </li>
            <li>
              <a
                href={`mailto:${EMAIL}`}
                className="transition-colors hover:text-foreground"
              >
                {EMAIL}
              </a>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-border py-5 text-center text-xs text-muted">
        <p>
          © {new Date().getFullYear()} {LEGAL_NAME}. {t("footer.rights")}
        </p>
        <p className="mt-2 flex flex-wrap justify-center gap-x-4 gap-y-1">
          <Link
            href="/privacy"
            className="transition-colors hover:text-foreground"
          >
            {t("legal.privacyTitle")}
          </Link>
          <Link
            href="/terms"
            className="transition-colors hover:text-foreground"
          >
            {t("legal.termsTitle")}
          </Link>
        </p>
      </div>
    </footer>
  );
}
