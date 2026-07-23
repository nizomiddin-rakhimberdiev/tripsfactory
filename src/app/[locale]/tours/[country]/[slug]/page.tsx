import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import { setRequestLocale, getTranslations, getLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { getTour, getTours, getCity, getCountry } from "@/lib/content";
import { locales, type Locale } from "@/i18n/routing";
import type { DepartureStatus } from "@/lib/content";
import { approxLocalPrice, formatUsd } from "@/lib/currency";
import { LeadForm } from "@/components/forms/LeadForm";
import { TourCard } from "@/components/tours/TourCard";
import { ItineraryAccordion } from "@/components/tours/ItineraryAccordion";
import { TourRouteMap } from "@/components/tours/TourRouteMap";
import { Carousel } from "@/components/Carousel";
import {
  IconClock,
  IconCompass,
  IconMapPin,
  IconCheckCircle,
  IconXCircle,
  IconShieldCheck,
} from "@/components/icons";
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

  const [t, tp, nav, common, currentLocale, countryDoc] = await Promise.all([
    getTranslations("tours"),
    getTranslations("premium"),
    getTranslations("nav"),
    getTranslations("common"),
    getLocale() as Promise<Locale>,
    getCountry(tour.countrySlug, locale),
  ]);

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
  ).filter((r) => r.slug !== tour.slug && r.tier === tour.tier);

  const statusLabel: Record<DepartureStatus, string> = {
    available: t("available"),
    guaranteed: t("guaranteed"),
    soldout: t("soldout"),
  };

  const heroImages = [
    ...new Set([tour.heroImage, ...(tour.gallery ?? [])]),
  ].filter(Boolean);
  const approx =
    tour.priceFromUsd !== null
      ? approxLocalPrice(tour.priceFromUsd, currentLocale)
      : null;
  const dateFmt = new Intl.DateTimeFormat(currentLocale, {
    dateStyle: "medium",
  });

  return (
    <article>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(tourJsonLd(tour)) }}
      />

      {/* Breadcrumbs */}
      <nav
        aria-label={common("breadcrumb")}
        className="mx-auto max-w-6xl px-4 pt-6 md:px-6"
      >
        <ol className="flex flex-wrap items-center gap-1.5 text-sm text-muted">
          <li>
            <Link href="/" className="transition-colors hover:text-primary">
              {nav("home")}
            </Link>
          </li>
          <li aria-hidden>/</li>
          <li>
            <Link
              href="/tours"
              className="transition-colors hover:text-primary"
            >
              {nav("tours")}
            </Link>
          </li>
          {countryDoc && (
            <>
              <li aria-hidden>/</li>
              <li aria-current="page" className="text-foreground">
                {countryDoc.name}
              </li>
            </>
          )}
        </ol>
      </nav>

      {/* Full-bleed hero — the photograph carries the page, uninterrupted */}
      <section className="mt-4">
        <Carousel
          images={heroImages}
          alt={tour.title}
          aspect="aspect-[4/3] sm:aspect-[16/9] lg:aspect-[21/9]"
          rounded={false}
        />
      </section>

      {/* Feature-opener headline, set on the content grid */}
      <header className="mx-auto max-w-6xl px-4 pt-14 md:px-6">
        <p className="tf-eyebrow mb-4 text-xs text-primary">
          {t(`type_${tour.type}`)} · {t("days", { count: tour.durationDays })}
        </p>
        <h1 className="tf-display tf-display-2 max-w-4xl">{tour.title}</h1>
      </header>

      {/* Content + sticky booking */}
      <section className="mx-auto grid max-w-6xl gap-10 px-4 pb-24 pt-12 md:px-6 lg:grid-cols-12 lg:gap-14">
        <div className="lg:col-span-8">
          {/* Meta row */}
          <div className="flex flex-wrap gap-x-10 gap-y-6 border-b border-border pb-8">
            <MetaItem
              icon={<IconCompass className="text-xl text-primary" />}
              label={t("typeLabel")}
              value={t(`type_${tour.type}`)}
            />
            <MetaItem
              icon={<IconClock className="text-xl text-primary" />}
              label={t("durationLabel")}
              value={t("days", { count: tour.durationDays })}
            />
            {cityNames.length > 0 && (
              <MetaItem
                icon={<IconMapPin className="text-xl text-primary" />}
                label={t("cities")}
                value={cityNames.join(", ")}
              />
            )}
          </div>

          {/* Editorial summary */}
          {tour.summary && (
            <p className="tf-headline my-12 border-l-2 border-accent-soft pl-6 text-2xl font-medium italic leading-relaxed text-foreground sm:pl-8 sm:text-3xl">
              {tour.summary}
            </p>
          )}

          {/* Route map */}
          {routePoints.length >= 1 && (
            <div className="mb-12">
              <h2 className="tf-headline mb-6 text-2xl">{t("routeMap")}</h2>
              <TourRouteMap points={routePoints} />
            </div>
          )}

          {/* Itinerary */}
          {tour.itinerary.length > 0 && (
            <div className="mb-12">
              <h2 className="tf-headline mb-6 text-2xl">{t("itinerary")}</h2>
              <ItineraryAccordion days={tour.itinerary} />
            </div>
          )}

          {/* Included / Not included */}
          {(tour.included.length > 0 || tour.excluded.length > 0) && (
            <div className="mb-12 grid gap-6 md:grid-cols-2">
              {tour.included.length > 0 && (
                <div className="tf-card p-7">
                  <h3 className="mb-5 flex items-center gap-2 text-lg font-semibold">
                    <IconCheckCircle className="text-xl text-primary" />
                    {t("included")}
                  </h3>
                  <ul className="space-y-3 text-sm text-muted">
                    {tour.included.map((item) => (
                      <li key={item} className="flex gap-3">
                        <span className="text-primary">—</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {tour.excluded.length > 0 && (
                <div className="tf-card p-7">
                  <h3 className="mb-5 flex items-center gap-2 text-lg font-semibold">
                    <IconXCircle className="text-xl text-muted" />
                    {t("excluded")}
                  </h3>
                  <ul className="space-y-3 text-sm text-muted">
                    {tour.excluded.map((item) => (
                      <li key={item} className="flex gap-3">
                        <span className="text-muted">—</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Departures */}
          {tour.departures.length > 0 && (
            <div>
              <h2 className="tf-headline mb-6 text-2xl">{t("departures")}</h2>
              <div className="tf-card overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="tf-eyebrow bg-surface-muted text-[11px] text-muted">
                    <tr>
                      <th scope="col" className="p-3 font-semibold sm:p-4">{t("date")}</th>
                      <th scope="col" className="p-3 font-semibold sm:p-4">{t("status")}</th>
                      <th scope="col" className="p-3 text-right font-semibold sm:p-4">
                        {t("price")}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {tour.departures.map((d) => (
                      <tr
                        key={d.date}
                        className={`transition-colors hover:bg-surface-muted ${
                          d.status === "soldout" ? "opacity-55" : ""
                        }`}
                      >
                        <td className="p-3 font-semibold sm:p-4">
                          {dateFmt.format(new Date(d.date))}
                        </td>
                        <td className="p-3 sm:p-4">
                          <StatusPill
                            status={d.status}
                            label={statusLabel[d.status]}
                          />
                        </td>
                        <td className="whitespace-nowrap p-3 text-right text-lg font-semibold text-primary sm:p-4">
                          {formatUsd(d.priceUsd)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {tour.singleSupplementUsd !== null && (
                <p className="mt-3 text-sm text-muted">
                  {t("singleSupplement")}: {formatUsd(tour.singleSupplementUsd)}
                </p>
              )}
              <p className="mt-1 text-xs text-muted">{t("billedInUsd")}</p>
            </div>
          )}
        </div>

        {/* Sticky booking card */}
        <aside className="lg:col-span-4">
          <div className="sticky top-24 space-y-5">
            <div className="tf-card border border-border p-7">
              {tour.priceFromUsd !== null ? (
                <div className="mb-6">
                  <p className="tf-eyebrow mb-1 text-[11px] text-muted">
                    {t("startingFrom")}
                  </p>
                  <div className="flex items-baseline gap-2">
                    <span className="tf-display text-4xl text-primary">
                      {formatUsd(tour.priceFromUsd)}
                    </span>
                    <span className="text-sm text-muted">
                      / {t("perPerson")}
                    </span>
                  </div>
                  {approx && (
                    <p className="mt-1 text-xs italic text-muted">{approx}</p>
                  )}
                </div>
              ) : (
                <p className="tf-display mb-6 text-3xl text-accent">
                  {tp("onRequest")}
                </p>
              )}
              <a
                href="#enquiry"
                className="tf-btn tf-btn-primary w-full py-4 text-base"
              >
                {t("bookNow")}
              </a>
              <p className="mt-4 text-center text-xs text-muted">
                {t("bookingNote")}
              </p>
            </div>
            <div className="flex items-center gap-4 rounded-2xl border border-primary/15 bg-primary/5 p-5">
              <IconShieldCheck className="shrink-0 text-3xl text-primary" />
              <div>
                <p className="font-semibold text-primary">
                  {t("assuranceTitle")}
                </p>
                <p className="text-sm text-muted">{t("assuranceText")}</p>
              </div>
            </div>
          </div>
        </aside>
      </section>

      {/* Enquiry form */}
      <section id="enquiry" className="tf-section scroll-mt-24 bg-surface">
        <div className="mx-auto max-w-3xl px-4 md:px-6">
          <div className="tf-card p-6 sm:p-9">
            <LeadForm tourSlug={tour.slug} />
          </div>
        </div>
      </section>

      {/* Related */}
      {related.length > 0 && (
        <section className="tf-section tf-reveal mx-auto max-w-6xl px-4 md:px-6">
          <div className="mb-12 flex items-end justify-between gap-6">
            <h2 className="tf-display tf-display-2">{t("relatedTours")}</h2>
            <Link
              href="/tours"
              className="tf-link hidden shrink-0 text-sm sm:block"
            >
              {t("viewAll")}
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:gap-8 lg:grid-cols-3">
            {related.slice(0, 3).map((r) => (
              <TourCard key={r.slug} tour={r} />
            ))}
          </div>
        </section>
      )}

      {/*
        Mobile booking bar. On small screens the booking column stacks after the
        whole left column, which buried the price below the itinerary and the
        departures table. Sticky-bottom (not fixed) keeps it pinned while the
        tour is on screen, then releases so it never covers the footer.
      */}
      <div className="sticky bottom-0 z-40 border-t border-border tf-glass lg:hidden">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
          <div className="min-w-0">
            {tour.priceFromUsd !== null ? (
              <>
                <span className="tf-eyebrow block text-[10px] leading-none text-muted">
                  {t("startingFrom")}
                </span>
                <span className="text-lg font-semibold text-primary">
                  {formatUsd(tour.priceFromUsd)}
                </span>
                <span className="ml-1 text-xs text-muted">
                  / {t("perPerson")}
                </span>
              </>
            ) : (
              <span className="font-semibold text-accent">
                {tp("onRequest")}
              </span>
            )}
          </div>
          <a
            href="#enquiry"
            className="tf-btn tf-btn-primary shrink-0 px-6 py-3"
          >
            {t("bookNow")}
          </a>
        </div>
      </div>
    </article>
  );
}

function MetaItem({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3">
      {icon}
      <div>
        <p className="tf-eyebrow text-[11px] text-muted">{label}</p>
        <p className="font-semibold">{value}</p>
      </div>
    </div>
  );
}

const STATUS_PILL: Record<DepartureStatus, string> = {
  guaranteed: "bg-primary/10 text-primary",
  available: "bg-surface-muted text-muted",
  soldout: "bg-danger/10 text-danger",
};

function StatusPill({
  status,
  label,
}: {
  status: DepartureStatus;
  label: string;
}) {
  return (
    <span
      className={`tf-eyebrow inline-block rounded-full px-3 py-1 text-[10px] ${STATUS_PILL[status]}`}
    >
      {label}
    </span>
  );
}
