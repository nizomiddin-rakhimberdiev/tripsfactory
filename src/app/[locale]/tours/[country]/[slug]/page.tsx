import Image from "next/image";
import { notFound } from "next/navigation";
import { setRequestLocale, getTranslations, getLocale } from "next-intl/server";
import { getTour, getTours, getCity } from "@/lib/content";
import { locales, type Locale } from "@/i18n/routing";
import { approxLocalPrice, formatUsd } from "@/lib/currency";
import { LeadForm } from "@/components/forms/LeadForm";
import { TourCard } from "@/components/tours/TourCard";
import { ItineraryAccordion } from "@/components/tours/ItineraryAccordion";
import { TourRouteMap } from "@/components/tours/TourRouteMap";
import { tourJsonLd } from "@/lib/seo";

type Params = { locale: string; country: string; slug: string };

// Content is editable in /admin — re-render periodically (ISR)
export const revalidate = 300;

export async function generateStaticParams() {
  const allTours = await getTours();
  const premiumTours = await getTours({ tier: "premium" });
  return locales.flatMap((locale) =>
    [...allTours, ...premiumTours].map((t) => ({
      locale,
      country: t.countrySlug,
      slug: t.slug,
    })),
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}) {
  const { locale, country, slug } = await params;
  const tour = await getTour(country, slug, locale);
  if (!tour) return {};
  return { title: tour.title, description: tour.summary };
}

export default async function TourPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { locale, country, slug } = await params;
  setRequestLocale(locale);
  const tour = await getTour(country, slug, locale);
  if (!tour) notFound();

  const t = await getTranslations("tours");
  const currentLocale = (await getLocale()) as Locale;
  const cityDocs = (
    await Promise.all(tour.citySlugs.map((s) => getCity(s, locale)))
  ).flatMap((c) => (c ? [c] : []));
  const cityNames = cityDocs.map((c) => c.name);
  const routePoints = (tour.route ?? []).length
    ? (tour.route ?? [])
    : cityDocs
        .filter((c) => c.lat != null && c.lng != null)
        .map((c) => ({
          name: c.name,
          lat: c.lat as number,
          lng: c.lng as number,
        }));
  const related = (
    await getTours({ countrySlug: tour.countrySlug }, locale)
  ).filter(
    (r) => r.slug !== tour.slug && r.tier === tour.tier,
  );

  const statusLabel = {
    available: t("available"),
    guaranteed: t("guaranteed"),
    soldout: t("soldout"),
  } as const;

  return (
    <article className="mx-auto max-w-4xl px-4 py-12">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(tourJsonLd(tour)) }}
      />
      <div className="relative mb-8 aspect-[5/2] overflow-hidden rounded-2xl">
        <Image
          src={tour.heroImage}
          alt={tour.title}
          fill
          priority
          sizes="(max-width: 896px) 100vw, 896px"
          className="object-cover"
        />
      </div>

      <p className="text-sm font-medium text-primary">
        {t(`type_${tour.type}`)} · {t("days", { count: tour.durationDays })}
      </p>
      <h1 className="mt-1 text-4xl font-bold">{tour.title}</h1>
      <p className="mt-2 text-sm text-muted">
        {t("cities")}: {cityNames.join(" · ")}
      </p>
      <p className="mt-4 text-lg text-muted">{tour.summary}</p>

      {tour.priceFromUsd !== null && (
        <p className="mt-4 text-xl">
          <span className="text-muted">{t("from")} </span>
          <span className="font-bold text-primary">
            {formatUsd(tour.priceFromUsd)}
          </span>
          {approxLocalPrice(tour.priceFromUsd, currentLocale) && (
            <span className="text-muted">
              {" "}
              {approxLocalPrice(tour.priceFromUsd, currentLocale)}
            </span>
          )}
          <span className="text-muted"> {t("perPerson")}</span>
        </p>
      )}

      {routePoints.length >= 1 && (
        <section className="mt-10">
          <h2 className="mb-4 text-2xl font-bold">{t("routeMap")}</h2>
          <TourRouteMap points={routePoints} />
        </section>
      )}

      <section className="mt-10">
        <h2 className="mb-4 text-2xl font-bold">{t("itinerary")}</h2>
        <ItineraryAccordion days={tour.itinerary} />
      </section>

      {tour.departures.length > 0 && (
        <section className="mt-10">
          <h2 className="mb-4 text-2xl font-bold">{t("departures")}</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-muted">
                  <th className="py-2 pr-4 font-medium">{t("date")}</th>
                  <th className="py-2 pr-4 font-medium">{t("price")}</th>
                  <th className="py-2 font-medium">{t("status")}</th>
                </tr>
              </thead>
              <tbody>
                {tour.departures.map((d) => (
                  <tr key={d.date} className="border-b border-border">
                    <td className="py-2 pr-4">
                      {new Intl.DateTimeFormat(currentLocale, {
                        dateStyle: "medium",
                      }).format(new Date(d.date))}
                    </td>
                    <td className="py-2 pr-4 font-medium">
                      {formatUsd(d.priceUsd)}
                    </td>
                    <td className="py-2">{statusLabel[d.status]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {tour.singleSupplementUsd !== null && (
            <p className="mt-2 text-sm text-muted">
              {t("singleSupplement")}: {formatUsd(tour.singleSupplementUsd)}
            </p>
          )}
          <p className="mt-1 text-xs text-muted">{t("billedInUsd")}</p>
        </section>
      )}

      <div className="mt-10 grid gap-8 md:grid-cols-2">
        <section>
          <h2 className="mb-3 text-xl font-bold">{t("included")}</h2>
          <ul className="space-y-2 text-sm text-muted">
            {tour.included.map((item) => (
              <li key={item} className="flex gap-2">
                <span className="text-primary">✓</span>
                {item}
              </li>
            ))}
          </ul>
        </section>
        <section>
          <h2 className="mb-3 text-xl font-bold">{t("excluded")}</h2>
          <ul className="space-y-2 text-sm text-muted">
            {tour.excluded.map((item) => (
              <li key={item} className="flex gap-2">
                <span className="text-accent">✕</span>
                {item}
              </li>
            ))}
          </ul>
        </section>
      </div>

      <section id="book" className="mt-12 rounded-2xl bg-surface p-6 sm:p-8">
        <LeadForm tourSlug={tour.slug} />
      </section>

      {related.length > 0 && (
        <section className="mt-12">
          <h2 className="mb-6 text-2xl font-bold">{t("relatedTours")}</h2>
          <div className="grid gap-6 sm:grid-cols-2">
            {related.slice(0, 2).map((r) => (
              <TourCard key={r.slug} tour={r} />
            ))}
          </div>
        </section>
      )}
    </article>
  );
}
