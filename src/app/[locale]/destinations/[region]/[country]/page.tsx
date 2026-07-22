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
      <section className="tf-hero-tall relative flex items-end justify-center overflow-hidden">
        <Image
          src={c.heroImage}
          alt={c.name}
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 tf-hero-scrim" />
        <div className="relative z-10 mb-20 px-4 text-center text-white">
          {regionName && (
            <p className="tf-eyebrow mb-5 text-xs tracking-[0.3em] text-white/85">
              {regionName}
            </p>
          )}
          <h1 className="tf-display tf-display-1">
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
      <article id="overview" className="tf-section tf-reveal scroll-mt-28 px-4 md:px-6">
        <header className="mx-auto mb-14 flex max-w-2xl flex-col items-center text-center">
          <p className="tf-eyebrow mb-5 text-xs text-primary">{t("overview")}</p>
          <div className="tf-rule" />
        </header>
        <div className="tf-measure mx-auto">
          <p className="tf-lead first-letter:float-left first-letter:mr-3 first-letter:mt-1 first-letter:font-[family-name:var(--font-cormorant)] first-letter:text-7xl first-letter:font-semibold first-letter:leading-[0.8] first-letter:text-primary">
            {c.intro}
          </p>
          {c.body && (
            <div className="tf-prose mt-10">
              <Markdown>{c.body}</Markdown>
            </div>
          )}
        </div>
      </article>

      {/* Full-bleed gallery — photography gets the whole width */}
      {c.gallery && c.gallery.length > 0 && (
        <Carousel
          images={c.gallery}
          alt={c.name}
          aspect="aspect-[4/3] sm:aspect-[16/9] lg:aspect-[21/9]"
          rounded={false}
        />
      )}

      {/* Tours */}
      {countryTours.length > 0 && (
        <section id="tours" className="tf-section tf-reveal scroll-mt-28 bg-surface">
          <div className="mx-auto max-w-6xl px-4 md:px-6">
            <p className="tf-eyebrow mb-3 text-xs text-primary">
              {t("curated")}
            </p>
            <h2 className="tf-display tf-display-2 mb-12">
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
          className="tf-section tf-reveal mx-auto max-w-6xl scroll-mt-28 px-4 md:px-6"
        >
          <h2 className="tf-display tf-display-2 mb-12">
            {t("citiesTitle")}
          </h2>
          <div className="grid gap-8 md:grid-cols-2">
            {cityList.map((city) => (
              <div key={city.slug} className="tf-card group overflow-hidden">
                <div className="relative aspect-[16/10] overflow-hidden">
                  <Image
                    src={city.image}
                    alt={city.name}
                    fill
                    sizes="(max-width: 768px) 100vw, 50vw"
                    className="object-cover transition-transform duration-[1200ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.04]"
                  />
                </div>
                <div className="p-7">
                  <div className="flex items-baseline justify-between gap-3">
                    <h3 className="tf-headline text-2xl">{city.name}</h3>
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
