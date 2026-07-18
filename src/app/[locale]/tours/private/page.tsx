import { setRequestLocale, getTranslations } from "next-intl/server";
import { getTours } from "@/lib/content";
import { TourCard } from "@/components/tours/TourCard";

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
  const t = await getTranslations("tours");
  const tours = await getTours({ type: "private" }, locale);

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <div className="mb-8 border-l-4 border-accent pl-4">
        <h1 className="text-4xl font-bold">{t("type_private")}</h1>
        <p className="mt-2 max-w-2xl text-muted">{t("privateIntro")}</p>
      </div>
      {tours.length === 0 ? (
        <p className="text-muted">{t("empty")}</p>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {tours.map((tour) => (
            <TourCard key={tour.slug} tour={tour} />
          ))}
        </div>
      )}
    </div>
  );
}
