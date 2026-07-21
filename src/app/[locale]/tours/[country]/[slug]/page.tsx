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

  const [t, tp, nav, currentLocale, countryDoc] = await Promise.all([
    getTranslations("tours"),
    getTranslations("premium"),
    getTranslations("nav"),
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
      <nav aria-label="Breadcrumb" className="mx-auto max-w-6xl px-4 pt-6 md:px-6">
        <ol className="tf-eyebrow flex flex-wrap items-center gap-1.5 text-[11px] text-muted">
          <li>
            <Link href="/" className="transition-colors hover:text-primary">
              {nav("home")}
            </Link>
          </li>
          <li aria-hidden>/</li>
          <li>
            <Link href="/tours" className="transition-colors hover:text-primary">
              {nav("tours")}
            </Link>
          </li>
          {countryDoc && (
            <>
              <li aria-hidden>/</li>
              <li className="text-primary">{countryDoc.name}</li>
            </>
          )}
        </ol>
      </nav>

      {/* Cinematic hero gallery */}
      <section className="mx-auto max-w-6xl px-4 pt-4 md:px-6">
        <div className="relative overflow-hidden rounded-2xl">
          <Carousel
            images={heroImages}
            alt={tour.title}
            aspect="aspect-[4/3] sm:aspect-[16/9] lg:aspect-[16/7]"
          />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent p-6 pt-24 sm:p-10">
            <p className="tf-eyebrow mb-3 text-xs text-white/85">
              {t(`type_${tour.type}`)} · {t("days", { count: tour.durationDays })}
            </p>
            <h1 className="tf-display max-w-3xl text-3xl text-white sm:text-5xl">
              {tour.title}
            </h1>
          </div>
        </div>
      </section>

      {/* Content + sticky booking */}
      <section className="mx-auto grid max-w-6xl gap-10 px-4 py-12 md:px-6 lg:grid-cols-12 lg:gap-12">
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
            <p className="my-10 font-[family-name:var(--font-playfair)] text-2xl italic leading-relaxed text-muted">
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
                  <h3 className="tf-headline mb-5 flex items-center gap-2 text-lg">
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
                  <h3 className="tf-headline mb-5 flex items-center gap-2 text-lg">
                    <IconXCircle className="text-xl text-secondary" />
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
                      <th className="p-4 font-semibold">{t("date")}</th>
                      <th className="p-4 font-semibold">{t("status")}</th>
                      <th className="p-4 text-right font-semibold">
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
                        <td className="p-4 font-semibold">
                          {dateFmt.format(new Date(d.date))}
                        </td>
                        <td className="p-4">
                          <StatusPill status={d.status} label={statusLabel[d.status]} />
                        </td>
                        <td className="p-4 text-right text-lg font-semibold text-primary">
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
                <p className="mb-6 font-[family-name:var(--font-playfair)] text-3xl font-bold text-accent">
                  {tp("onRequest")}
                </p>
              )}
              <a
                href="#enquiry"
                className="block w-full rounded-full bg-primary py-4 text-center font-semibold text-primary-foreground transition-all hover:bg-primary-hover active:scale-[0.98]"
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
      <section id="enquiry" className="scroll-mt-24 bg-surface py-16">
        <div className="mx-auto max-w-3xl px-4 md:px-6">
          <div className="tf-card p-6 sm:p-9">
            <LeadForm tourSlug={tour.slug} />
          </div>
        </div>
      </section>

      {/* Related */}
      {related.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 py-16 md:px-6">
          <div className="mb-10 flex items-end justify-between gap-4">
            <h2 className="tf-display text-3xl sm:text-4xl">
              {t("relatedTours")}
            </h2>
            <Link
              href="/tours"
              className="tf-eyebrow hidden shrink-0 border-b border-primary pb-0.5 text-xs text-primary transition-opacity hover:opacity-70 sm:block"
            >
              {t("viewAll")}
            </Link>
          </div>
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {related.slice(0, 3).map((r) => (
              <TourCard key={r.slug} tour={r} />
            ))}
          </div>
        </section>
      )}
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
  soldout: "bg-red-100 text-red-700",
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
