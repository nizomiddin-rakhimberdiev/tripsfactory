import Image from "next/image";
import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import type { Tour } from "@/lib/content";
import { approxLocalPrice, formatUsd } from "@/lib/currency";
import type { Locale } from "@/i18n/routing";
import { IconClock, IconArrowRight } from "@/components/icons";

/** Category tag color — premium tier reads as gold, otherwise by tour type. */
function tagClass(tour: Tour): string {
  if (tour.tier === "premium") return "bg-accent";
  if (tour.type === "private") return "bg-secondary";
  if (tour.type === "custom") return "bg-accent";
  return "bg-primary";
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
          className="object-cover transition-transform duration-700 group-hover:scale-110"
        />
        <span
          className={`tf-eyebrow absolute left-4 top-4 rounded-full px-3 py-1 text-[10px] text-white ${tagClass(tour)}`}
        >
          {t(`type_${tour.type}`)}
        </span>
      </div>

      <div className="flex flex-1 flex-col p-6">
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
            className="grid h-10 w-10 flex-shrink-0 place-items-center rounded-full border border-primary text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground"
            aria-hidden
          >
            <IconArrowRight className="text-base" />
          </span>
        </div>
      </div>
    </Link>
  );
}
