import Image from "next/image";
import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import type { Excursion } from "@/lib/content";
import { approxLocalPrice, formatUsd } from "@/lib/currency";
import type { Locale } from "@/i18n/routing";
import { IconClock, IconArrowRight } from "@/components/icons";

/**
 * The catalogue card for a day trip.
 *
 * Deliberately the same shape as TourCard so the two catalogues read as one
 * product family; what differs is what an excursion is actually chosen on —
 * the city it leaves from, and hours rather than days.
 */
export async function ExcursionCard({
  excursion,
  headingLevel = 3,
}: {
  excursion: Excursion;
  headingLevel?: 2 | 3;
}) {
  const Heading = `h${headingLevel}` as "h2" | "h3";
  const [t, tours, locale] = await Promise.all([
    getTranslations("excursions"),
    getTranslations("tours"),
    getLocale() as Promise<Locale>,
  ]);
  const approx = approxLocalPrice(excursion.priceUsd, locale);

  return (
    <Link
      href={`/excursions/${excursion.slug}`}
      className="tf-card tf-card-interactive group flex flex-col overflow-hidden"
    >
      <div className="relative aspect-[3/2] overflow-hidden">
        <Image
          src={excursion.heroImage}
          alt={excursion.title}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 50vw, 33vw"
          className="object-cover transition-transform duration-[1200ms] ease-luxe group-hover:scale-[1.06]"
        />
        {excursion.cityName && (
          <span className="tf-eyebrow tf-card-tag absolute left-2.5 top-2.5 rounded-full bg-white/85 px-2 py-1 text-foreground backdrop-blur-sm sm:left-4 sm:top-4 sm:px-3 sm:py-1.5">
            {excursion.cityName}
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col p-4 sm:p-7">
        <div className="mb-2 flex items-center gap-1.5 text-muted">
          <IconClock className="text-sm" />
          <span className="tf-eyebrow tf-eyebrow-sm">
            {t("hours", { count: excursion.durationHours })}
          </span>
        </div>
        <Heading className="tf-card-title mb-3 sm:mb-4">
          {excursion.title}
        </Heading>

        <div className="mt-auto flex items-end justify-between border-t border-border pt-4">
          <div>
            <span className="block text-xs text-muted">
              {tours("perPerson")}
            </span>
            <span className="text-lg font-semibold text-primary sm:text-xl">
              {formatUsd(excursion.priceUsd)}
            </span>
            {approx && (
              <span className="ml-1 text-sm font-normal text-muted">
                {approx}
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
