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

export async function TourCard({ tour }: { tour: Tour }) {
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
          sizes="(max-width: 768px) 100vw, 33vw"
          className="object-cover transition-transform duration-[1200ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.06]"
        />
        <span
          className={`tf-eyebrow absolute left-4 top-4 rounded-full bg-white/85 px-3 py-1.5 text-[10px] backdrop-blur-sm ${tagToneClass(tour)}`}
        >
          {t(`type_${tour.type}`)}
        </span>
      </div>

      <div className="flex flex-1 flex-col p-7">
        <div className="mb-2 flex items-center gap-1.5 text-muted">
          <IconClock className="text-sm" />
          <span className="tf-eyebrow text-[10px]">
            {t("days", { count: tour.durationDays })}
          </span>
        </div>
        <h3 className="tf-headline mb-4 text-lg">{tour.title}</h3>

        <div className="mt-auto flex items-end justify-between border-t border-border pt-4">
          <div>
            {tour.priceFromUsd !== null ? (
              <>
                <span className="block text-xs text-muted">{t("from")}</span>
                <span className="text-xl font-semibold text-primary">
                  {formatUsd(tour.priceFromUsd)}
                </span>
                {approx && (
                  <span className="ml-1 text-sm font-normal text-muted">
                    {approx}
                  </span>
                )}
              </>
            ) : (
              <span className="font-semibold text-accent">{tp("onRequest")}</span>
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
