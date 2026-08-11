import Image from "next/image";
import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import type { Masterclass } from "@/lib/content";
import { approxLocalPrice, formatUsd } from "@/lib/currency";
import type { Locale } from "@/i18n/routing";
import { IconClock, IconArrowRight } from "@/components/icons";

/**
 * The catalogue card for a master class.
 *
 * Same frame as the tour and excursion cards, with one addition that only this
 * product has: the date of the next run that is still open. That is the thing
 * a visitor decides on — a class with no date left is a class they cannot book.
 */
export async function MasterclassCard({
  masterclass,
  headingLevel = 3,
}: {
  masterclass: Masterclass;
  headingLevel?: 2 | 3;
}) {
  const Heading = `h${headingLevel}` as "h2" | "h3";
  const [t, tours, locale] = await Promise.all([
    getTranslations("masterclasses"),
    getTranslations("tours"),
    getLocale() as Promise<Locale>,
  ]);
  const approx = approxLocalPrice(masterclass.priceUsd, locale);
  const dateFmt = new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeZone: "UTC",
  });

  return (
    <Link
      href={`/masterclasses/${masterclass.slug}`}
      className="tf-card tf-card-interactive group flex flex-col overflow-hidden"
    >
      <div className="relative aspect-[3/2] overflow-hidden bg-surface-muted">
        {/* A class can be written before it is photographed, so the image is
            optional here; the panel keeps the grid even rather than leaving a
            collapsed cell. */}
        {masterclass.heroImage && (
          <Image
            src={masterclass.heroImage}
            alt={masterclass.title}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover transition-transform duration-[1200ms] ease-luxe group-hover:scale-[1.06]"
          />
        )}
        {masterclass.cityName && (
          <span className="tf-eyebrow tf-card-tag absolute left-2.5 top-2.5 rounded-full bg-white/85 px-2 py-1 text-foreground backdrop-blur-sm sm:left-4 sm:top-4 sm:px-3 sm:py-1.5">
            {masterclass.cityName}
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col p-4 sm:p-7">
        <div className="mb-2 flex items-center gap-1.5 text-muted">
          <IconClock className="text-sm" />
          <span className="tf-eyebrow tf-eyebrow-sm">
            {t("hours", { count: masterclass.durationHours })}
          </span>
        </div>
        <Heading className="tf-card-title mb-2">{masterclass.title}</Heading>
        {masterclass.nextSession && (
          <p className="mb-3 text-sm text-primary sm:mb-4">
            {t("nextOn", {
              date: dateFmt.format(new Date(masterclass.nextSession.date)),
            })}
          </p>
        )}

        <div className="mt-auto flex items-end justify-between border-t border-border pt-4">
          <div>
            <span className="block text-xs text-muted">
              {tours("perPerson")}
            </span>
            <span className="text-lg font-semibold text-primary sm:text-xl">
              {formatUsd(masterclass.priceUsd)}
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
