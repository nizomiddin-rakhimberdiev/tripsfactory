import Image from "next/image";
import { notFound } from "next/navigation";
import { setRequestLocale, getTranslations } from "next-intl/server";
import {
  getCitiesByCountry,
  getCountry,
  getPublishedCountries,
  getTours,
} from "@/lib/content";
import { locales } from "@/i18n/routing";
import { TourCard } from "@/components/tours/TourCard";
import { CountryBar } from "@/components/layout/CountryBar";
import { Markdown } from "@/components/Markdown";

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

  const t = await getTranslations("destinations");
  const nav = await getTranslations("nav");
  const [cityList, countryTours, allCountries] = await Promise.all([
    getCitiesByCountry(c.slug, locale),
    getTours({ countrySlug: c.slug }, locale),
    getPublishedCountries(locale),
  ]);
  const siblings = allCountries
    .filter((s) => s.slug !== c.slug)
    .map((s) => ({ slug: s.slug, regionSlug: s.regionSlug, name: s.name }));

  return (
    <div>
      <section className="relative flex min-h-[40vh] items-end overflow-hidden">
        <Image
          src={c.heroImage}
          alt={c.name}
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <h1 className="relative z-10 mx-auto w-full max-w-6xl px-4 pb-8 text-5xl font-bold text-white">
          {c.name}
        </h1>
      </section>

      <CountryBar
        countryName={c.name}
        toursLabel={nav("tours")}
        citiesLabel={t("citiesTitle")}
        switchLabel={t("countries")}
        siblings={siblings}
      />

      <div className="mx-auto max-w-6xl px-4 py-12">
        <p className="max-w-3xl text-lg text-muted">{c.intro}</p>

        {c.body && (
          <div className="mt-8">
            <Markdown>{c.body}</Markdown>
          </div>
        )}

        {countryTours.length > 0 && (
          <section id="tours" className="mt-12 scroll-mt-28">
            <h2 className="mb-6 text-2xl font-bold">
              {t("toursIn", { country: c.name })}
            </h2>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {countryTours.map((tour) => (
                <TourCard key={tour.slug} tour={tour} />
              ))}
            </div>
          </section>
        )}

        {cityList.length > 0 && (
          <section id="cities" className="mt-12 scroll-mt-28">
            <h2 className="mb-6 text-2xl font-bold">{t("citiesTitle")}</h2>
            <div className="grid gap-6 md:grid-cols-2">
              {cityList.map((city) => (
                <div
                  key={city.slug}
                  className="overflow-hidden rounded-xl border border-border"
                >
                  <div className="relative aspect-[2/1]">
                    <Image
                      src={city.image}
                      alt={city.name}
                      fill
                      sizes="(max-width: 768px) 100vw, 50vw"
                      className="object-cover"
                    />
                  </div>
                  <div className="p-4">
                    <h3 className="text-lg font-semibold">{city.name}</h3>
                    <p className="text-xs text-muted">
                      {t("recommendedStay")}:{" "}
                      {t("nights", { count: city.recommendedNights })}
                    </p>
                    <p className="mt-2 text-sm text-muted">{city.intro}</p>
                    <p className="mt-3 text-sm font-medium">
                      {t("topAttractions")}
                    </p>
                    <ul className="mt-1 list-inside list-disc text-sm text-muted">
                      {city.attractions.slice(0, 5).map((a) => (
                        <li key={a}>{a}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
