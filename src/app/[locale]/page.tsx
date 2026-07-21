import Image from "next/image";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import {
  getPublishedCountries,
  getSiteContent,
  getTours,
} from "@/lib/content";
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

  const destGridCols =
    countryList.length <= 2 ? "lg:grid-cols-2" : "lg:grid-cols-3";
  const ctaImage = site.premiumHero.image || site.hero.image;

  return (
    <>
      {/* Hero */}
      <section className="relative flex min-h-[88vh] items-center justify-center overflow-hidden">
        <Image
          src={site.hero.image}
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 tf-hero-scrim" />
        <div className="relative z-10 mx-auto w-full max-w-3xl px-4 text-center text-white">
          <p className="tf-eyebrow mb-5 text-xs text-white/85">
            {t("heroEyebrow")}
          </p>
          <h1 className="tf-display text-4xl sm:text-6xl">{site.hero.title}</h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-white/90">
            {site.hero.subtitle}
          </p>
          <div className="mt-9 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/tours"
              className="rounded-full bg-primary px-8 py-3.5 font-medium text-primary-foreground transition-all hover:bg-primary-hover active:scale-95"
            >
              {t("heroCta")}
            </Link>
            <Link
              href="/contact"
              className="rounded-full border border-white/80 px-8 py-3.5 font-medium text-white transition-all hover:bg-white/10 active:scale-95"
            >
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
      <section className="bg-surface py-20">
        <div className="mx-auto max-w-6xl px-4">
          <div className="grid gap-12 text-center md:grid-cols-3">
            {WHY.map(({ key, Icon }) => (
              <div key={key} className="flex flex-col items-center">
                <div className="mb-5 grid h-16 w-16 place-items-center rounded-full bg-primary/10 text-primary">
                  <Icon className="text-3xl" />
                </div>
                <h3 className="tf-headline mb-2 text-xl">{t(key)}</h3>
                <p className="max-w-xs text-muted">{t(`${key}Text`)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Tours */}
      {featured.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 py-20">
          <div className="mb-10 flex items-end justify-between gap-4">
            <div>
              <p className="tf-eyebrow mb-2 text-xs text-primary">
                {t("featuredEyebrow")}
              </p>
              <h2 className="tf-display text-3xl sm:text-4xl">
                {t("featuredTours")}
              </h2>
            </div>
            <Link
              href="/tours"
              className="tf-eyebrow hidden shrink-0 border-b border-primary pb-0.5 text-xs text-primary transition-opacity hover:opacity-70 sm:block"
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

      {/* Explore Destinations */}
      {countryList.length > 0 && (
        <section className="bg-surface py-20">
          <div className="mx-auto max-w-6xl px-4">
            <h2 className="tf-display mb-12 text-center text-3xl sm:text-4xl">
              {t("exploreDestinations")}
            </h2>
            <div
              className={`grid grid-cols-1 gap-4 sm:grid-cols-2 ${destGridCols}`}
            >
              {countryList.map((c) => (
                <Link
                  key={c.slug}
                  href={`/destinations/${c.regionSlug}/${c.slug}`}
                  className="group relative aspect-[4/5] overflow-hidden rounded-xl"
                >
                  <Image
                    src={c.heroImage}
                    alt={c.name}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                  <h3 className="tf-headline absolute inset-x-5 bottom-5 text-2xl text-white">
                    {c.name}
                  </h3>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Closing CTA — tailor-made */}
      <section className="mx-auto max-w-6xl px-4 py-20">
        <div className="relative flex min-h-[380px] items-center justify-center overflow-hidden rounded-3xl px-6 py-16 text-center">
          <Image
            src={ctaImage}
            alt=""
            fill
            sizes="(max-width: 1152px) 100vw, 1152px"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-primary/55" />
          <div className="relative z-10 max-w-2xl">
            <h2 className="tf-display text-3xl text-white sm:text-4xl">
              {t("tailorTitle")}
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-lg text-white/90">
              {t("tailorText")}
            </p>
            <Link
              href="/contact"
              className="mt-8 inline-block rounded-full bg-accent px-9 py-3.5 font-medium text-accent-foreground transition-all hover:opacity-90 active:scale-95"
            >
              {t("tailorCta")}
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
