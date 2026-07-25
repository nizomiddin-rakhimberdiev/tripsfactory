import Image from "next/image";
import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import type { Tour } from "@/lib/content";
import { approxLocalPrice, formatUsd } from "@/lib/currency";
import type { Locale } from "@/i18n/routing";
import { IconClock, IconArrowRight } from "@/components/icons";

/**
 * One restrained tag treatment: a white-glass pill that lets the photograph
 * lead. Colour is reserved for the one distinction that is real — premium is a
 * different product, so it speaks in gold. Tour *type* is already stated in the
 * label; colour-coding it only fragments the palette.
 */
function tagToneClass(tour: Tour): string {
  return tour.tier === "premium" ? "text-accent" : "text-foreground";
}

export async function TourCard({
  tour,
  headingLevel = 3,
}: {
  tour: Tour;
  /**
   * Where the card sits in the page outline: 3 under a section heading, as on
   * the homepage; 2 on a listing, where the cards are the page's own content
   * and follow the h1 directly. Listings were jumping h1 → h3.
   *
   * Purely semantic — the look comes from .tf-card-title either way.
   */
  headingLevel?: 2 | 3;
}) {
  const Heading = `h${headingLevel}` as "h2" | "h3";
  const [t, tp, locale] = await Promise.all([
    getTranslations("tours"),
    getTranslations("premium"),
    getLocale() as Promise<Locale>,
  ]);
  const approx =
    tour.priceFromUsd !== null
      ? approxLocalPrice(tour.priceFromUsd, locale)
      : null;

  return (
    <Link
      href={`/tours/${tour.countrySlug}/${tour.slug}`}
      className="tf-card tf-card-interactive group flex flex-col overflow-hidden"
    >
      <div className="relative aspect-[3/2] overflow-hidden">
        <Image
          src={tour.heroImage}
          alt={tour.title}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 50vw, 33vw"
          className="object-cover transition-transform duration-[1200ms] ease-luxe group-hover:scale-[1.06]"
        />
        <span
          className={`tf-eyebrow tf-card-tag absolute left-2.5 top-2.5 rounded-full bg-white/85 px-2 py-1 backdrop-blur-sm sm:left-4 sm:top-4 sm:px-3 sm:py-1.5 ${tagToneClass(tour)}`}
        >
          {t(`type_${tour.type}`)}
        </span>
      </div>

      <div className="flex flex-1 flex-col p-4 sm:p-7">
        <div className="mb-2 flex items-center gap-1.5 text-muted">
          <IconClock className="text-sm" />
          <span className="tf-eyebrow tf-eyebrow-sm">
            {t("days", { count: tour.durationDays })}
          </span>
        </div>
        <Heading className="tf-card-title mb-3 sm:mb-4">{tour.title}</Heading>

        <div className="mt-auto flex items-end justify-between border-t border-border pt-4">
          <div>
            {tour.priceFromUsd !== null ? (
              <>
                <span className="block text-xs text-muted">{t("from")}</span>
                <span className="text-lg font-semibold text-primary sm:text-xl">
                  {formatUsd(tour.priceFromUsd)}
                </span>
                {approx && (
                  <span className="ml-1 text-sm font-normal text-muted">
                    {approx}
                  </span>
                )}
              </>
            ) : (
              <span className="font-semibold text-accent">
                {tp("onRequest")}
              </span>
            )}
          </div>
          <span
            className="grid h-10 w-10 flex-shrink-0 place-items-center rounded-full border border-primary/40 text-primary transition-colors duration-300 group-hover:border-primary group-hover:bg-primary group-hover:text-primary-foreground"
            aria-hidden
          >
            <IconArrowRight className="text-base" />
          </span>
        </div>
      </div>
    </Link>
  );
}
