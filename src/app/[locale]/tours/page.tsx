import { setRequestLocale, getTranslations } from "next-intl/server";
import { getTours } from "@/lib/content";
import { TourCard } from "@/components/tours/TourCard";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/EmptyState";

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
  const [t, nav] = await Promise.all([
    getTranslations("tours"),
    getTranslations("nav"),
  ]);
  const allTours = await getTours(undefined, locale);

  return (
    <div className="tf-section mx-auto max-w-6xl px-4 md:px-6">
      <PageHeader
        eyebrow={t("listEyebrow")}
        title={t("title")}
        subtitle={t("listIntro")}
      />
      {allTours.length === 0 ? (
        <EmptyState
          message={t("empty")}
          actionHref="/contact"
          actionLabel={nav("contact")}
        />
      ) : (
        <div className="mt-14 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {allTours.map((tour) => (
            <TourCard key={tour.slug} tour={tour} />
          ))}
        </div>
      )}
    </div>
  );
}
