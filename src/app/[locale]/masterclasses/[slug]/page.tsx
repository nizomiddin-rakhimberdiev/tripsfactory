import { notFound } from "next/navigation";
import { setRequestLocale, getTranslations, getLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { flags } from "@/lib/flags";
import { getMasterclass, getMasterclasses } from "@/lib/content";
import { locales, type Locale } from "@/i18n/routing";
import { approxLocalPrice, formatUsd } from "@/lib/currency";
import { LeadForm } from "@/components/forms/LeadForm";
import { MasterclassCard } from "@/components/tours/MasterclassCard";
import { Carousel } from "@/components/Carousel";
import {
  IconClock,
  IconMapPin,
  IconCheckCircle,
  IconShieldCheck,
} from "@/components/icons";
import { masterclassJsonLd, breadcrumbJsonLd, pageMeta } from "@/lib/seo";
import { skipPrerender } from "@/lib/prerender";

type Params = { locale: string; slug: string };

export const revalidate = 86400;

export async function generateStaticParams() {
  if (skipPrerender) return [];
  const all = await getMasterclasses();
  return locales.flatMap((locale) => all.map((m) => ({ locale, slug: m.slug })));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}) {
  const { locale, slug } = await params;
  const m = await getMasterclass(slug, locale);
  if (!m) return {};
  return pageMeta({
    locale,
    path: `/masterclasses/${slug}`,
    title: m.title,
    description: m.summary,
  });
}

export default async function MasterclassPage({
  params,
}: {
  params: Promise<Params>;
}) {
  if (!flags.masterclasses) notFound();
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const m = await getMasterclass(slug, locale);
  if (!m) notFound();

  const [t, tours, nav, common, currentLocale] = await Promise.all([
    getTranslations("masterclasses"),
    getTranslations("tours"),
    getTranslations("nav"),
    getTranslations("common"),
    getLocale() as Promise<Locale>,
  ]);

  const others = (await getMasterclasses(locale)).filter(
    (r) => r.slug !== m.slug,
  );

  const images = [...new Set([m.heroImage, ...(m.gallery ?? [])])].filter(
    Boolean,
  );
  const approx = approxLocalPrice(m.priceUsd, currentLocale);
  // A session is a calendar date stored as midnight UTC; formatted in the
  // runtime's own zone it slips a day west of Greenwich. Same fix as the
  // departures table.
  const dateFmt = new Intl.DateTimeFormat(currentLocale, {
    dateStyle: "full",
    timeZone: "UTC",
  });
  const next = m.nextSession;

  return (
    <article>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(masterclassJsonLd(m, locale)),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            breadcrumbJsonLd(locale, [
              { name: nav("home"), path: "" },
              { name: nav("masterclasses"), path: "/masterclasses" },
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
              href="/masterclasses"
              className="transition-colors hover:text-primary"
            >
              {nav("masterclasses")}
            </Link>
          </li>
          <li aria-hidden>/</li>
          <li aria-current="page" className="text-foreground">
            {m.title}
          </li>
        </ol>
      </nav>

      {images.length > 0 && (
        <section className="mt-4">
          <Carousel
            images={images}
            alt={m.title}
            aspect="aspect-[4/3] sm:aspect-[16/9] lg:aspect-[21/9]"
            rounded={false}
          />
        </section>
      )}

      <header className="mx-auto max-w-6xl px-4 pt-14 md:px-6">
        <p className="tf-eyebrow mb-4 text-primary">
          {t("listEyebrow")}
          {m.cityName ? ` · ${m.cityName}` : ""}
        </p>
        <h1 className="tf-display tf-display-2 max-w-4xl">{m.title}</h1>
        {m.tagline && (
          <p className="mt-4 max-w-2xl text-lg text-muted">{m.tagline}</p>
        )}
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
                  {t("hours", { count: m.durationHours })}
                </p>
              </div>
            </div>
            {m.cityName && (
              <div className="flex items-center gap-3">
                <IconMapPin className="text-xl text-primary" />
                <div>
                  <p className="tf-eyebrow tf-eyebrow-sm text-muted">
                    {t("cityLabel")}
                  </p>
                  <p className="font-semibold">{m.cityName}</p>
                </div>
              </div>
            )}
          </div>

          {m.description && (
            <p className="my-12 whitespace-pre-line text-lg leading-relaxed text-muted">
              {m.description}
            </p>
          )}

          {m.youtubeId && (
            <div className="mb-12">
              <h2 className="tf-headline mb-6 text-2xl">{t("video")}</h2>
              {/* youtube-nocookie: no tracking cookie is set unless the visitor
                  actually presses play. */}
              <div className="tf-card aspect-video overflow-hidden">
                <iframe
                  src={`https://www.youtube-nocookie.com/embed/${m.youtubeId}`}
                  title={m.title}
                  loading="lazy"
                  allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  referrerPolicy="strict-origin-when-cross-origin"
                  allowFullScreen
                  className="h-full w-full border-0"
                />
              </div>
            </div>
          )}

          {m.included.length > 0 && (
            <div className="tf-card mb-12 p-7">
              <h2 className="mb-5 flex items-center gap-2 text-lg font-semibold">
                <IconCheckCircle className="text-xl text-primary" />
                {tours("included")}
              </h2>
              <ul className="space-y-3 text-sm text-muted">
                {m.included.map((item) => (
                  <li key={item} className="flex gap-3">
                    <span className="text-primary">—</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {m.reviews.length > 0 && (
            <div>
              <h2 className="tf-headline mb-6 text-2xl">{t("reviews")}</h2>
              <div className="grid gap-5 sm:grid-cols-2">
                {m.reviews.map((r, i) => (
                  <figure
                    key={`${r.author}-${i}`}
                    className="tf-card flex h-full flex-col p-6"
                  >
                    <blockquote className="flex-1 text-sm leading-relaxed text-muted">
                      {r.text}
                    </blockquote>
                    <figcaption className="mt-4 border-t border-border pt-4 text-sm font-semibold">
                      {r.author}
                    </figcaption>
                  </figure>
                ))}
              </div>
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
                    {formatUsd(m.priceUsd)}
                  </span>
                </div>
                {approx && (
                  <p className="mt-1 text-xs italic text-muted">{approx}</p>
                )}
              </div>

              {/* The announcement. A run that has filled is not shown at all —
                  the next open one takes its place, which is the whole point of
                  running these in batches. */}
              {next ? (
                <div className="mb-6 rounded-2xl border border-primary/20 bg-primary/5 p-5">
                  <p className="tf-eyebrow tf-eyebrow-sm mb-1 text-muted">
                    {t("nextSession")}
                  </p>
                  <p className="text-lg font-semibold text-primary">
                    {dateFmt.format(new Date(next.date))}
                  </p>
                  <p className="mt-1 text-sm text-muted">
                    {t("seatsLeft", {
                      left: next.seatsLeft,
                      total: next.capacity,
                    })}
                  </p>
                </div>
              ) : (
                <p className="mb-6 rounded-2xl border border-border bg-surface-muted p-5 text-sm text-muted">
                  {t("noSession")}
                </p>
              )}

              <a
                href="#book"
                className="tf-btn tf-btn-primary w-full py-4 text-base"
              >
                {t("bookNow")}
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

      <section id="book" className="tf-section scroll-mt-24 bg-surface">
        <div className="mx-auto max-w-3xl px-4 md:px-6">
          <div className="tf-card p-6 sm:p-9">
            <LeadForm
              tourSlug={m.slug}
              kind="masterclass"
              compact
              heading={t("bookTitle")}
              sessionDate={next?.date}
            />
          </div>
        </div>
      </section>

      {others.length > 0 && (
        <section className="tf-section tf-reveal mx-auto max-w-6xl px-4 md:px-6">
          <div className="mb-12 flex items-end justify-between gap-6">
            <h2 className="tf-display tf-display-2">{t("related")}</h2>
            <Link
              href="/masterclasses"
              className="tf-link hidden shrink-0 text-sm sm:block"
            >
              {t("viewAll")}
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:gap-8 lg:grid-cols-3">
            {others.slice(0, 3).map((r) => (
              <MasterclassCard key={r.slug} masterclass={r} />
            ))}
          </div>
        </section>
      )}

      <div className="sticky bottom-0 z-40 border-t border-border tf-glass lg:hidden">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
          <div className="min-w-0">
            <span className="tf-eyebrow tf-eyebrow-sm block leading-none text-muted">
              {tours("perPerson")}
            </span>
            <span className="text-lg font-semibold text-primary">
              {formatUsd(m.priceUsd)}
            </span>
          </div>
          <a href="#book" className="tf-btn tf-btn-primary shrink-0 px-6 py-3">
            {t("bookNow")}
          </a>
        </div>
      </div>
    </article>
  );
}
