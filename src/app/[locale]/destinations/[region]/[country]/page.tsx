import Image from "next/image";
import { notFound } from "next/navigation";
import { setRequestLocale, getTranslations } from "next-intl/server";
import {
  getCitiesByCountry,
  getCountry,
  getPublishedCountries,
  getRegions,
  getTours,
} from "@/lib/content";
import { locales } from "@/i18n/routing";
import { TourCard } from "@/components/tours/TourCard";
import { CountryBar } from "@/components/layout/CountryBar";
import { Markdown } from "@/components/Markdown";
import { Carousel } from "@/components/Carousel";
import { IconMapPin } from "@/components/icons";

type Params = { locale: string; region: string; country: string };

// Content is editable in /admin — re-render periodically (ISR)
export const revalidate = 300;

export async function generateStaticParams() {
  const countryList = await getPublishedCountries();
  return locales.flatMap((locale) =>
    countryList.map((c) => ({
      locale,
      region: c.regionSlug,
      country: c.slug,
    })),
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}) {
  const { locale, country } = await params;
  const c = await getCountry(country, locale);
  if (!c) return {};
  return { title: c.name, description: c.intro };
}

export default async function CountryPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { locale, region, country } = await params;
  setRequestLocale(locale);
  const c = await getCountry(country, locale);
  if (!c || c.regionSlug !== region) notFound();

  const [t, nav, cityList, countryTours, allCountries, regionList] =
    await Promise.all([
      getTranslations("destinations"),
      getTranslations("nav"),
      getCitiesByCountry(c.slug, locale),
      getTours({ countrySlug: c.slug }, locale),
      getPublishedCountries(locale),
      getRegions(locale),
    ]);
  const siblings = allCountries
    .filter((s) => s.slug !== c.slug)
    .map((s) => ({ slug: s.slug, regionSlug: s.regionSlug, name: s.name }));
  const regionName = regionList.find((r) => r.slug === c.regionSlug)?.name;

  return (
    <div>
      {/* Cinematic hero */}
      <section className="relative flex min-h-[70vh] items-end justify-center overflow-hidden md:min-h-[80vh]">
        <Image
          src={c.heroImage}
          alt={c.name}
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 tf-hero-scrim" />
        <div className="relative z-10 mb-16 px-4 text-center text-white">
          {regionName && (
            <p className="tf-eyebrow mb-4 text-xs tracking-[0.3em] text-white/85">
              {regionName}
            </p>
          )}
          <h1 className="tf-display text-6xl sm:text-7xl md:text-8xl">
            {c.name}
          </h1>
        </div>
      </section>

      <CountryBar
        countryName={c.name}
        toursLabel={nav("tours")}
        citiesLabel={t("citiesTitle")}
        switchLabel={t("countries")}
        siblings={siblings}
      />

      {/* Editorial overview */}
      <article
        id="overview"
        className="mx-auto max-w-[760px] scroll-mt-28 px-4 py-16 md:py-24"
      >
        <header className="mb-12 text-center">
          <p className="tf-eyebrow mb-4 text-xs text-primary">
            {t("overview")}
          </p>
          <div className="mx-auto h-1 w-16 rounded-full bg-accent" />
        </header>
        <p className="text-lg leading-relaxed text-muted first-letter:float-left first-letter:mr-3 first-letter:font-[family-name:var(--font-playfair)] first-letter:text-6xl first-letter:font-bold first-letter:leading-none first-letter:text-primary">
          {c.intro}
        </p>
        {c.body && (
          <div className="tf-prose mt-8 max-w-none">
            <Markdown>{c.body}</Markdown>
          </div>
        )}
      </article>

      {c.gallery && c.gallery.length > 0 && (
        <div className="mx-auto max-w-6xl px-4 pb-4">
          <Carousel images={c.gallery} alt={c.name} aspect="aspect-[16/7]" />
        </div>
      )}

      {/* Tours */}
      {countryTours.length > 0 && (
        <section id="tours" className="scroll-mt-28 bg-surface py-16 md:py-20">
          <div className="mx-auto max-w-6xl px-4">
            <p className="tf-eyebrow mb-2 text-xs text-primary">
              {t("curated")}
            </p>
            <h2 className="tf-display mb-10 text-3xl sm:text-4xl">
              {t("toursIn", { country: c.name })}
            </h2>
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {countryTours.map((tour) => (
                <TourCard key={tour.slug} tour={tour} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Cities */}
      {cityList.length > 0 && (
        <section
          id="cities"
          className="mx-auto max-w-6xl scroll-mt-28 px-4 py-16 md:py-20"
        >
          <h2 className="tf-display mb-10 text-3xl sm:text-4xl">
            {t("citiesTitle")}
          </h2>
          <div className="grid gap-8 md:grid-cols-2">
            {cityList.map((city) => (
              <div key={city.slug} className="tf-card overflow-hidden">
                <div className="relative aspect-[2/1]">
                  <Image
                    src={city.image}
                    alt={city.name}
                    fill
                    sizes="(max-width: 768px) 100vw, 50vw"
                    className="object-cover"
                  />
                </div>
                <div className="p-6">
                  <div className="flex items-baseline justify-between gap-3">
                    <h3 className="tf-headline text-xl">{city.name}</h3>
                    <span className="tf-eyebrow shrink-0 rounded-full bg-surface-muted px-3 py-1 text-[10px] text-muted">
                      {t("nights", { count: city.recommendedNights })}
                    </span>
                  </div>
                  <p className="mt-3 text-sm leading-relaxed text-muted">
                    {city.intro}
                  </p>
                  {city.attractions.length > 0 && (
                    <>
                      <p className="tf-eyebrow mt-5 mb-2 text-[11px] text-primary">
                        {t("topAttractions")}
                      </p>
                      <ul className="space-y-1.5 text-sm text-muted">
                        {city.attractions.slice(0, 5).map((a) => (
                          <li key={a} className="flex items-start gap-2">
                            <IconMapPin className="mt-0.5 shrink-0 text-sm text-primary" />
                            {a}
                          </li>
                        ))}
                      </ul>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
