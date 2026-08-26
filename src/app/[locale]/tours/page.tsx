import { setRequestLocale, getTranslations } from "next-intl/server";
import { getPublishedCountries, getTours } from "@/lib/content";
import { groupTours } from "@/lib/content/group-tours";
import { pageMeta } from "@/lib/seo";
import { GroupedTours } from "@/components/tours/GroupedTours";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/EmptyState";
import { TourSearch } from "@/components/tours/TourSearch";

// ISR safety net only: every Studio save triggers on-demand revalidation
// (revalidateSite in payload.config.ts), so content is never this stale. The
// window exists for edits made outside a Next request — seed scripts, raw SQL.
export const revalidate = 86400;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "tours" });
  return pageMeta({
    locale,
    path: "/tours",
    title: t("title"),
  });
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
              group: t("types_group"),
              private: t("types_private"),
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
        /* Destination, then type — the order the operator sells in, and the
           order a visitor already has in their head when they arrive. Every
           tour places itself from its own country and type fields, so a tour
           added in the Studio needs no change here. */
        <div className="mt-14">
          <GroupedTours
            groups={groupTours(
              allTours,
              new Map(countryList.map((c) => [c.slug, c.name])),
            )}
            typeLabels={{
              private: t("types_private"),
              group: t("types_group"),
              custom: t("types_custom"),
            }}
          />
        </div>
      )}
    </div>
  );
}
