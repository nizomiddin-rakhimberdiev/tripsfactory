import { setRequestLocale, getTranslations } from "next-intl/server";
import { getTours } from "@/lib/content";
import { TourCard } from "@/components/tours/TourCard";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/EmptyState";

export const revalidate = 300;

export async function generateMetadata() {
  const t = await getTranslations("tours");
  return { title: t("type_private") };
}

export default async function PrivateToursPage({
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
  const tours = await getTours({ type: "private" }, locale);

  return (
    <div className="tf-section mx-auto max-w-6xl px-4 md:px-6">
      <PageHeader
        eyebrow={t("listEyebrow")}
        title={t("type_private")}
        subtitle={t("privateIntro")}
      />
      {tours.length === 0 ? (
        <EmptyState
          message={t("empty")}
          actionHref="/contact"
          actionLabel={nav("contact")}
        />
      ) : (
        <div className="mt-14 grid grid-cols-2 gap-4 sm:gap-8 lg:grid-cols-3">
          {tours.map((tour) => (
            <TourCard key={tour.slug} tour={tour} />
          ))}
        </div>
      )}
    </div>
  );
}
