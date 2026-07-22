import Image from "next/image";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { getPublishedCountries, getSiteContent, getTours } from "@/lib/content";
import { TourCard } from "@/components/tours/TourCard";
import { HeroSearch } from "@/components/home/HeroSearch";
import {
  IconLandmark,
  IconShieldCheck,
  IconSparkles,
} from "@/components/icons";

// Content is editable in /admin — re-render pages periodically (ISR)
export const revalidate = 300;

const WHY = [
  { key: "whyLocal", Icon: IconLandmark },
  { key: "whyGuaranteed", Icon: IconShieldCheck },
  { key: "whyTailored", Icon: IconSparkles },
] as const;

/**
 * Destination tiles alternate wide/narrow (2:1, then 1:2) so the grid reads as
 * an edited spread rather than a uniform template. Rows always fill: an odd
 * final tile runs full width instead of leaving a hole.
 *
 * Returns the matching `sizes` hint too — the tiles render at three different
 * widths, so a single hint would make narrow tiles fetch images twice the size
 * they display.
 */
function tile(index: number, total: number): { span: string; sizes: string } {
  const responsive = "(max-width: 640px) 100vw, (max-width: 1024px) 50vw,";
  if (index === total - 1 && total % 2 === 1) {
    return { span: "lg:col-span-3", sizes: `${responsive} 1152px` };
  }
  const isFirstOfPair = index % 2 === 0;
  const pairLeadsWide = Math.floor(index / 2) % 2 === 0;
  return isFirstOfPair === pairLeadsWide
    ? { span: "lg:col-span-2", sizes: `${responsive} 768px` }
    : { span: "lg:col-span-1", sizes: `${responsive} 384px` };
}

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const [t, tt] = await Promise.all([
    getTranslations("home"),
    getTranslations("tours"),
  ]);
  const [featured, countryList, site] = await Promise.all([
    getTours({ featuredOnly: true }, locale),
    getPublishedCountries(locale),
    getSiteContent(locale),
  ]);

  const searchLabels = {
    destination: t("searchDestination"),
    allDestinations: t("searchDestinationAll"),
    tourType: t("searchTourType"),
    allTours: t("searchTypeAll"),
    group: tt("type_group"),
    private: tt("type_private"),
    search: t("searchButton"),
  };

  const ctaImage = site.premiumHero.image || site.hero.image;

  return (
    <>
      {/* Hero */}
      <section className="tf-hero-full relative flex items-center justify-center overflow-hidden">
        <Image
          src={site.hero.image}
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 tf-hero-scrim" />
        <div className="relative z-10 mx-auto w-full max-w-4xl px-4 text-center text-white">
          <p className="tf-eyebrow mb-6 text-xs text-white/85">
            {t("heroEyebrow")}
          </p>
          <h1 className="tf-display tf-display-1">{site.hero.title}</h1>
          <p className="mx-auto mt-7 max-w-xl text-lg leading-relaxed text-white/90">
            {site.hero.subtitle}
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link href="/tours" className="tf-btn tf-btn-primary">
              {t("heroCta")}
            </Link>
            <Link href="/contact" className="tf-btn tf-btn-onimage">
              {t("heroCtaSecondary")}
            </Link>
          </div>
          <div className="mt-10">
            <HeroSearch
              countries={countryList.map((c) => ({
                slug: c.slug,
                regionSlug: c.regionSlug,
                name: c.name,
              }))}
              labels={searchLabels}
            />
          </div>
        </div>
      </section>

      {/* Why TripsFactory */}
      <section className="tf-section bg-surface">
        <div className="mx-auto max-w-6xl px-4 md:px-6">
          <div className="grid gap-14 text-center md:grid-cols-3">
            {WHY.map(({ key, Icon }) => (
              <div key={key} className="flex flex-col items-center">
                <div className="mb-6 grid h-16 w-16 place-items-center rounded-full bg-primary/10 text-primary">
                  <Icon className="text-3xl" />
                </div>
                <h3 className="tf-headline mb-3 text-2xl">{t(key)}</h3>
                <p className="max-w-xs leading-relaxed text-muted">
                  {t(`${key}Text`)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Tours */}
      {featured.length > 0 && (
        <section className="tf-section mx-auto max-w-6xl px-4 md:px-6">
          <div className="mb-12 flex items-end justify-between gap-6">
            <div>
              <p className="tf-eyebrow mb-3 text-xs text-primary">
                {t("featuredEyebrow")}
              </p>
              <h2 className="tf-display tf-display-2">{t("featuredTours")}</h2>
            </div>
            <Link
              href="/tours"
              className="tf-link hidden shrink-0 text-sm sm:block"
            >
              {t("viewAllTours")}
            </Link>
          </div>
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((tour) => (
              <TourCard key={tour.slug} tour={tour} />
            ))}
          </div>
        </section>
      )}

      {/* Explore Destinations — asymmetric editorial composition */}
      {countryList.length > 0 && (
        <section className="tf-section bg-surface">
          <div className="mx-auto max-w-6xl px-4 md:px-6">
            <p className="tf-eyebrow mb-3 text-xs text-primary">
              {t("destinationsEyebrow")}
            </p>
            <h2 className="tf-display tf-display-2 mb-12">
              {t("exploreDestinations")}
            </h2>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 lg:auto-rows-[26rem]">
              {countryList.map((c, i) => {
                const { span, sizes } = tile(i, countryList.length);
                return (
                  <Link
                    key={c.slug}
                    href={`/destinations/${c.regionSlug}/${c.slug}`}
                    className={`group relative h-72 overflow-hidden rounded-2xl sm:h-96 lg:h-full ${span}`}
                  >
                    <Image
                      src={c.heroImage}
                      alt={c.name}
                      fill
                      sizes={sizes}
                      className="object-cover transition-transform duration-[1200ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.05]"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                    <h3 className="tf-headline absolute inset-x-7 bottom-6 text-3xl text-white">
                      {c.name}
                    </h3>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Closing CTA — tailor-made */}
      <section className="tf-section mx-auto max-w-6xl px-4 md:px-6">
        <div className="relative flex min-h-[440px] items-center justify-center overflow-hidden rounded-3xl px-6 py-20 text-center">
          <Image
            src={ctaImage}
            alt=""
            fill
            sizes="(max-width: 1152px) 100vw, 1152px"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-primary/60" />
          <div className="relative z-10 max-w-2xl">
            <h2 className="tf-display tf-display-2 text-white">
              {t("tailorTitle")}
            </h2>
            <p className="mx-auto mt-5 max-w-xl text-lg leading-relaxed text-white/90">
              {t("tailorText")}
            </p>
            <Link
              href="/contact"
              className="tf-btn mt-8 bg-background text-primary hover:bg-white"
            >
              {t("tailorCta")}
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
