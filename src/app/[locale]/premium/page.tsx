import Image from "next/image";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { getSiteContent, getTours } from "@/lib/content";

export const revalidate = 300;

const PILLARS = ["concierge", "access", "stays"] as const;

export async function generateMetadata() {
  const t = await getTranslations("premium");
  return { title: t("navLabel"), description: t("heroSubtitle") };
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
      <section className="tf-hero-full relative flex items-center justify-center overflow-hidden">
        <Image
          src={site.premiumHero.image}
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover opacity-45"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-transparent to-background" />
        <div className="relative z-10 mx-auto max-w-3xl px-4 text-center">
          <p className="tf-eyebrow mb-6 text-xs tracking-[0.3em] text-primary">
            {t("invitation")}
          </p>
          <h1 className="tf-display tf-display-1">
            {site.premiumHero.title}
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-lg text-muted">
            {site.premiumHero.subtitle}
          </p>
          <a
            href="#journeys"
            className="tf-eyebrow mt-10 inline-block border border-primary px-10 py-4 text-xs tracking-[0.2em] text-primary transition-all duration-300 hover:bg-primary hover:text-primary-foreground"
          >
            {t("cta")}
          </a>
        </div>
      </section>

      {/* Pillars */}
      <section className="mx-auto max-w-6xl px-4 py-24 md:px-6">
        <div className="grid gap-12 md:grid-cols-3">
          {PILLARS.map((key, i) => (
            <div key={key} className="border-t border-primary/25 pt-6">
              <span className="tf-display text-2xl text-primary/60">
                0{i + 1}
              </span>
              <h3 className="tf-headline mt-4 text-2xl">{t(key)}</h3>
              <p className="mt-3 leading-relaxed text-muted">
                {t(`${key}Text`)}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Extraordinary expeditions */}
      {premiumTours.length > 0 && (
        <section id="journeys" className="scroll-mt-24 px-4 py-24">
          <div className="mx-auto max-w-6xl">
            <div className="mb-14 text-center">
              <p className="tf-eyebrow mb-3 text-xs text-primary">
                {t("journeysEyebrow")}
              </p>
              <h2 className="tf-display tf-display-2">
                {t("journeys")}
              </h2>
            </div>
            <div className="grid gap-12 md:grid-cols-2">
              {premiumTours.map((tour) => (
                <Link
                  key={tour.slug}
                  href={`/tours/${tour.countrySlug}/${tour.slug}`}
                  className="group"
                >
                  <div className="relative aspect-[4/3] overflow-hidden rounded-xl">
                    <Image
                      src={tour.heroImage}
                      alt={tour.title}
                      fill
                      sizes="(max-width: 768px) 100vw, 50vw"
                      className="object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                  </div>
                  <p className="tf-eyebrow mt-5 text-[11px] text-primary">
                    {tt("days", { count: tour.durationDays })}
                  </p>
                  <h3 className="tf-headline mt-2 text-2xl transition-colors group-hover:text-primary">
                    {tour.title}
                  </h3>
                  <p className="mt-2 leading-relaxed text-muted">
                    {tour.summary}
                  </p>
                  <div className="mt-5 flex items-center justify-between border-t border-primary/15 pt-5">
                    <span className="tf-eyebrow text-[11px] text-foreground">
                      {t("onRequest")}
                    </span>
                    <span className="tf-eyebrow text-[11px] text-primary">
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
      <section id="enquire" className="px-4 py-24">
        <div className="mx-auto flex max-w-4xl flex-col items-center border border-primary/15 px-6 py-16 text-center md:py-24">
          <p className="tf-eyebrow mb-6 text-xs tracking-[0.3em] text-primary">
            {t("navLabel")}
          </p>
          <h2 className="tf-display tf-display-2 max-w-2xl">
            {t("closingTitle")}
          </h2>
          <a
            href="mailto:premium@tripsfactory.uz"
            className="tf-eyebrow mt-10 inline-block bg-primary px-12 py-5 text-xs tracking-[0.2em] text-primary-foreground transition-colors duration-500 hover:opacity-90"
          >
            {t("enquire")}
          </a>
          <p className="mt-6 text-sm text-muted">premium@tripsfactory.uz</p>
        </div>
      </section>
    </div>
  );
}
