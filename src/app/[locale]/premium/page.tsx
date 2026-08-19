import Image from "next/image";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { EMAIL } from "@/lib/business";
import { pageMeta } from "@/lib/seo";
import { getSiteContent, getTours } from "@/lib/content";

// ISR safety net only: every Studio save triggers on-demand revalidation
// (revalidateSite in payload.config.ts), so content is never this stale. The
// window exists for edits made outside a Next request — seed scripts, raw SQL.
export const revalidate = 86400;

const PILLARS = ["concierge", "access", "stays"] as const;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "premium" });
  return pageMeta({
    locale,
    path: "/premium",
    title: t("navLabel"),
    description: t("heroSubtitle"),
  });
}

export default async function PremiumPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const [t, tt, premiumTours, site] = await Promise.all([
    getTranslations("premium"),
    getTranslations("tours"),
    getTours({ tier: "premium" }, locale),
    getSiteContent(locale),
  ]);

  return (
    <div className="bg-background text-foreground">
      {/* Cinematic hero */}
      <section className="mx-auto max-w-6xl px-4 pt-6 md:px-6">
        <div className="tf-hero-full items-center justify-center relative flex overflow-hidden rounded-2xl shadow-[0_18px_50px_-28px_rgba(28,25,23,0.45)] ring-1 ring-inset ring-black/[0.06] sm:rounded-3xl">
          <Image
            src={site.premiumHero.image}
            alt=""
            fill
            priority
            sizes="(min-width: 1152px) 1104px, 100vw"
            className="object-cover opacity-45"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-transparent to-background" />
          <div className="relative z-10 mx-auto max-w-3xl px-4 text-center">
          <p className="tf-eyebrow mb-6 tracking-[0.3em] text-primary">
            {t("invitation")}
          </p>
          <h1 className="tf-display tf-display-1">{site.premiumHero.title}</h1>
          <p className="mx-auto mt-6 max-w-xl text-lg text-muted">
            {site.premiumHero.subtitle}
          </p>
            <a
              href="#journeys"
              className="tf-eyebrow mt-10 inline-block border border-primary px-10 py-4 tracking-[0.2em] text-primary transition-all duration-300 hover:bg-primary hover:text-primary-foreground"
            >
              {t("cta")}
            </a>
          </div>
        </div>
      </section>

      {/* Pillars */}
      <section className="tf-section mx-auto max-w-6xl px-4 md:px-6">
        <div className="grid gap-12 md:grid-cols-3">
          {PILLARS.map((key, i) => (
            <div key={key}>
              <div className="tf-rule mb-6" />
              <span className="tf-display text-2xl text-primary/60">
                0{i + 1}
              </span>
              {/* h2, not h3: these three sit directly under the page h1 with no
                  section heading between, so h3 skipped a level and made the
                  document outline lie to a screen reader. */}
              <h2 className="tf-headline mt-4 text-2xl">{t(key)}</h2>
              <p className="mt-3 leading-relaxed text-muted">
                {t(`${key}Text`)}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Extraordinary expeditions */}
      {premiumTours.length > 0 && (
        <section id="journeys" className="tf-section scroll-mt-24 px-4">
          <div className="mx-auto max-w-6xl">
            <div className="mb-14 text-center">
              <p className="tf-eyebrow mb-3 text-primary">
                {t("journeysEyebrow")}
              </p>
              <h2 className="tf-display tf-display-2">{t("journeys")}</h2>
            </div>
            <div className="grid gap-12 md:grid-cols-2">
              {premiumTours.map((tour) => (
                <Link
                  key={tour.slug}
                  href={`/tours/${tour.countrySlug}/${tour.slug}`}
                  className="group"
                >
                  <div className="relative aspect-[4/3] overflow-hidden rounded-2xl">
                    <Image
                      src={tour.heroImage}
                      alt={tour.title}
                      fill
                      sizes="(max-width: 768px) 100vw, 50vw"
                      className="object-cover transition-transform duration-[1200ms] ease-luxe group-hover:scale-[1.05]"
                    />
                  </div>
                  <p className="tf-eyebrow tf-eyebrow-sm mt-5 text-primary">
                    {tt("days", { count: tour.durationDays })}
                  </p>
                  <h3 className="tf-headline mt-2 text-2xl transition-colors group-hover:text-primary">
                    {tour.title}
                  </h3>
                  <p className="mt-2 leading-relaxed text-muted">
                    {tour.summary}
                  </p>
                  <div className="mt-5 flex items-center justify-between border-t border-primary/15 pt-5">
                    <span className="tf-eyebrow tf-eyebrow-sm text-foreground">
                      {t("onRequest")}
                    </span>
                    <span className="tf-eyebrow tf-eyebrow-sm text-primary">
                      {tt("viewDetails")}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Enquire privately */}
      <section id="enquire" className="tf-section px-4">
        <div className="mx-auto flex max-w-4xl flex-col items-center border border-primary/15 px-6 py-16 text-center md:py-24">
          <p className="tf-eyebrow mb-6 tracking-[0.3em] text-primary">
            {t("navLabel")}
          </p>
          <h2 className="tf-display tf-display-2 max-w-2xl">
            {t("closingTitle")}
          </h2>
          <a
            href={`mailto:${EMAIL}`}
            className="tf-eyebrow mt-10 inline-block bg-primary px-12 py-5 tracking-[0.2em] text-primary-foreground transition-colors duration-500 hover:opacity-90"
          >
            {t("enquire")}
          </a>
          <p className="mt-6 text-sm text-muted">{EMAIL}</p>
        </div>
      </section>
    </div>
  );
}
