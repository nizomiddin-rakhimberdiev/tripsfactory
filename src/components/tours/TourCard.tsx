import Image from "next/image";
import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import type { Tour } from "@/lib/content";
import { approxLocalPrice, formatUsd } from "@/lib/currency";
import type { Locale } from "@/i18n/routing";

export async function TourCard({ tour }: { tour: Tour }) {
  const t = await getTranslations("tours");
  const locale = (await getLocale()) as Locale;
  const approx =
    tour.priceFromUsd !== null
      ? approxLocalPrice(tour.priceFromUsd, locale)
      : null;

  return (
    <Link
      href={`/tours/${tour.countrySlug}/${tour.slug}`}
      className="group overflow-hidden rounded-xl border border-border bg-background shadow-sm transition-shadow hover:shadow-md"
    >
      <div className="relative aspect-[3/2] overflow-hidden">
        <Image
          src={tour.heroImage}
          alt={tour.title}
          fill
          sizes="(max-width: 768px) 100vw, 33vw"
          className="object-cover transition-transform duration-300 group-hover:scale-105"
        />
        <span className="absolute left-3 top-3 rounded-full bg-background/90 px-3 py-1 text-xs font-medium">
          {t(`type_${tour.type}`)}
        </span>
      </div>
      <div className="space-y-2 p-4">
        <h3 className="font-semibold leading-snug">{tour.title}</h3>
        <p className="text-sm text-muted">
          {t("days", { count: tour.durationDays })}
        </p>
        <p className="text-sm">
          {tour.priceFromUsd !== null ? (
            <>
              <span className="text-muted">{t("from")} </span>
              <span className="font-semibold text-primary">
                {formatUsd(tour.priceFromUsd)}
              </span>
              {approx && <span className="text-muted"> {approx}</span>}
              <span className="text-muted"> · {t("perPerson")}</span>
            </>
          ) : (
            <span className="font-medium text-accent">
              {/* premium tours: price on request */}
            </span>
          )}
        </p>
      </div>
    </Link>
  );
}
