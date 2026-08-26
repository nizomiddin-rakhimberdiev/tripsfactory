import { notFound } from "next/navigation";
import { setRequestLocale, getTranslations, getLocale } from "next-intl/server";
import { Link, redirect } from "@/i18n/navigation";
import { flags } from "@/lib/flags";
import { getExcursion, getExcursions } from "@/lib/content";
import { locales, type Locale } from "@/i18n/routing";
import { approxLocalPrice, formatUsd } from "@/lib/currency";
import { LeadForm } from "@/components/forms/LeadForm";
import { ExcursionCard } from "@/components/tours/ExcursionCard";
import { Carousel } from "@/components/Carousel";
import {
  IconClock,
  IconMapPin,
  IconCheckCircle,
  IconShieldCheck,
} from "@/components/icons";
import { excursionJsonLd, breadcrumbJsonLd, pageMeta } from "@/lib/seo";
import { skipPrerender } from "@/lib/prerender";
import { ChatLinks } from "@/components/ChatLinks";

type Params = { locale: string; slug: string };

export const revalidate = 86400;

export async function generateStaticParams() {
  if (skipPrerender) return [];
  const all = await getExcursions();
  return locales.flatMap((locale) =>
    all.map((x) => ({ locale, slug: x.slug })),
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}) {
  const { locale, slug } = await params;
  const excursion = await getExcursion(slug, locale);
  if (!excursion) return {};
  return pageMeta({
    locale,
    path: `/excursions/${slug}`,
    title: excursion.title,
    description: excursion.description,
  });
}

export default async function ExcursionPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  // Hidden, not deleted. These URLs have been live — they sit in inboxes and
  // in search results — so a visitor following one is sent to the home page
  // rather than shown a 404 they did nothing to deserve. Localized, so a /ja/
  // link does not land on the English home page.
  if (!flags.excursions) redirect({ href: "/", locale });
  const excursion = await getExcursion(slug, locale);
  if (!excursion) notFound();

  const [t, tours, nav, common, tForm, currentLocale] = await Promise.all([
    getTranslations("excursions"),
    getTranslations("tours"),
    getTranslations("nav"),
    getTranslations("common"),
    getTranslations("form"),
    getLocale() as Promise<Locale>,
  ]);

  // Same city first — someone reading about a Bukhara morning is choosing
  // between Bukhara afternoons, not between cities.
  const related = (
    await getExcursions({ citySlug: excursion.citySlug }, locale)
  ).filter((r) => r.slug !== excursion.slug);

  const images = [
    ...new Set([excursion.heroImage, ...(excursion.gallery ?? [])]),
  ].filter(Boolean);
  const approx = approxLocalPrice(excursion.priceUsd, currentLocale);

  return (
    <article>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(excursionJsonLd(excursion, locale)),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            breadcrumbJsonLd(locale, [
              { name: nav("home"), path: "" },
              { name: nav("excursions"), path: "/excursions" },
            ]),
          ),
        }}
      />

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
              href="/excursions"
              className="transition-colors hover:text-primary"
            >
              {nav("excursions")}
            </Link>
          </li>
          <li aria-hidden>/</li>
          <li aria-current="page" className="text-foreground">
            {excursion.title}
          </li>
        </ol>
      </nav>

      <section className="mx-auto mt-6 max-w-6xl px-4 md:px-6">
        <Carousel
          images={images}
          alt={excursion.title}
          aspect="aspect-[4/3] sm:aspect-[16/9] lg:aspect-[21/9]"
        />
      </section>

      <header className="mx-auto max-w-6xl px-4 pt-14 md:px-6">
        <p className="tf-eyebrow mb-4 text-primary">
          {t("listEyebrow")}
          {excursion.cityName ? ` · ${excursion.cityName}` : ""}
        </p>
        <h1 className="tf-display tf-display-2 max-w-4xl">{excursion.title}</h1>
      </header>

      <section className="mx-auto grid max-w-6xl gap-10 px-4 pb-24 pt-12 md:px-6 lg:grid-cols-12 lg:gap-14">
        <div className="lg:col-span-8">
          <div className="flex flex-wrap gap-x-10 gap-y-6 border-b border-border pb-8">
            <div className="flex items-center gap-3">
              <IconClock className="text-xl text-primary" />
              <div>
                <p className="tf-eyebrow tf-eyebrow-sm text-muted">
                  {tours("durationLabel")}
                </p>
                <p className="font-semibold">
                  {t("hours", { count: excursion.durationHours })}
                </p>
              </div>
            </div>
            {excursion.cityName && (
              <div className="flex items-center gap-3">
                <IconMapPin className="text-xl text-primary" />
                <div>
                  <p className="tf-eyebrow tf-eyebrow-sm text-muted">
                    {t("cityLabel")}
                  </p>
                  <p className="font-semibold">{excursion.cityName}</p>
                </div>
              </div>
            )}
          </div>

          {excursion.description && (
            <p className="my-12 whitespace-pre-line text-lg leading-relaxed text-muted">
              {excursion.description}
            </p>
          )}

          {excursion.included.length > 0 && (
            <div className="tf-card p-7">
              <h2 className="mb-5 flex items-center gap-2 text-lg font-semibold">
                <IconCheckCircle className="text-xl text-primary" />
                {tours("included")}
              </h2>
              <ul className="space-y-3 text-sm text-muted">
                {excursion.included.map((item) => (
                  <li key={item} className="flex gap-3">
                    <span className="text-primary">—</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <aside className="lg:col-span-4">
          <div className="sticky top-24 space-y-5">
            <div className="tf-card border border-border p-7">
              <div className="mb-6">
                <p className="tf-eyebrow tf-eyebrow-sm mb-1 text-muted">
                  {tours("perPerson")}
                </p>
                <div className="flex items-baseline gap-2">
                  <span className="tf-display text-4xl text-primary">
                    {formatUsd(excursion.priceUsd)}
                  </span>
                </div>
                {approx && (
                  <p className="mt-1 text-xs italic text-muted">{approx}</p>
                )}
              </div>
              <a
                href="#enquiry"
                className="tf-btn tf-btn-primary w-full py-4 text-base"
              >
                {tours("bookNow")}
              </a>
              <p className="mt-4 text-center text-xs text-muted">
                {tours("bookingNote")}
              </p>
            </div>
            <div className="flex items-center gap-4 rounded-2xl border border-primary/15 bg-primary/5 p-5">
              <IconShieldCheck className="shrink-0 text-3xl text-primary" />
              <div>
                <p className="font-semibold text-primary">
                  {tours("assuranceTitle")}
                </p>
                <p className="text-sm text-muted">{tours("assuranceText")}</p>
              </div>
            </div>
          </div>
        </aside>
      </section>

      <section id="enquiry" className="tf-section scroll-mt-24 bg-surface">
        <div className="mx-auto max-w-3xl px-4 md:px-6">
          <div className="tf-card p-6 sm:p-9">
            <LeadForm tourSlug={excursion.slug} />
            {/* The form is a one-way door; this is the other one. */}
            <ChatLinks
              variant="full"
              label={tForm("orChat")}
              className="mt-8 border-t border-border pt-6"
            />
          </div>
        </div>
      </section>

      {related.length > 0 && (
        <section className="tf-section tf-reveal mx-auto max-w-6xl px-4 md:px-6">
          <div className="mb-12 flex items-end justify-between gap-6">
            <h2 className="tf-display tf-display-2">{t("related")}</h2>
            <Link
              href="/excursions"
              className="tf-link hidden shrink-0 text-sm sm:block"
            >
              {t("viewAll")}
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:gap-8 lg:grid-cols-3">
            {related.slice(0, 3).map((r) => (
              <ExcursionCard key={r.slug} excursion={r} />
            ))}
          </div>
        </section>
      )}

      {/* Same reason as the tour page: on a phone the booking column stacks
          below everything, so the price would sit under the enquiry form. */}
      <div className="sticky bottom-0 z-40 border-t border-border tf-glass lg:hidden">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
          <div className="min-w-0">
            <span className="tf-eyebrow tf-eyebrow-sm block leading-none text-muted">
              {tours("perPerson")}
            </span>
            <span className="text-lg font-semibold text-primary">
              {formatUsd(excursion.priceUsd)}
            </span>
          </div>
          <a
            href="#enquiry"
            className="tf-btn tf-btn-primary shrink-0 px-6 py-3"
          >
            {tours("bookNow")}
          </a>
        </div>
      </div>
    </article>
  );
}
