import { setRequestLocale, getTranslations } from "next-intl/server";
import { getTours } from "@/lib/content";
import { TourCard } from "@/components/tours/TourCard";

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
  const t = await getTranslations("tours");
  const allTours = await getTours();

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <h1 className="mb-8 text-4xl font-bold">{t("title")}</h1>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {allTours.map((tour) => (
          <TourCard key={tour.slug} tour={tour} />
        ))}
      </div>
    </div>
  );
}
