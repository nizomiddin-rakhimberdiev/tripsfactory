import { setRequestLocale, getTranslations } from "next-intl/server";
import { getPublishedCountries, getTours } from "@/lib/content";
import { TourCard } from "@/components/tours/TourCard";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/EmptyState";
import { TourSearch } from "@/components/tours/TourSearch";

// Content is editable in /admin — re-render periodically (ISR)
export const revalidate = 300;

export async function generateMetadata() {
  const t = await getTranslations("tours");
  return { title: t("title") };
}

export default async function ToursPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const [t, nav, home] = await Promise.all([
    getTranslations("tours"),
    getTranslations("nav"),
    getTranslations("home"),
  ]);
  const [allTours, countryList] = await Promise.all([
    getTours(undefined, locale),
    getPublishedCountries(locale),
  ]);

  return (
    <div className="tf-section mx-auto max-w-6xl px-4 md:px-6">
      <PageHeader
        eyebrow={t("listEyebrow")}
        title={t("title")}
        subtitle={t("listIntro")}
      />

      {/* Searching belongs on the index, not over the opening photograph. */}
      {allTours.length > 0 && (
        <div className="mt-10">
          <TourSearch
            countries={countryList.map((c) => ({
              slug: c.slug,
              regionSlug: c.regionSlug,
              name: c.name,
            }))}
            labels={{
              destination: home("searchDestination"),
              allDestinations: home("searchDestinationAll"),
              tourType: home("searchTourType"),
              allTours: home("searchTypeAll"),
              group: t("type_group"),
              private: t("type_private"),
              search: home("searchButton"),
            }}
          />
        </div>
      )}

      {allTours.length === 0 ? (
        <EmptyState
          message={t("empty")}
          actionHref="/contact"
          actionLabel={nav("contact")}
        />
      ) : (
        <div className="mt-14 grid grid-cols-2 gap-4 sm:gap-8 lg:grid-cols-3">
          {allTours.map((tour) => (
            <TourCard key={tour.slug} tour={tour} />
          ))}
        </div>
      )}
    </div>
  );
}
