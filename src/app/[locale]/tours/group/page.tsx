import { setRequestLocale, getTranslations } from "next-intl/server";
import { getTours } from "@/lib/content";
import { TourCard } from "@/components/tours/TourCard";
import { PageHeader } from "@/components/PageHeader";

export const revalidate = 300;

export async function generateMetadata() {
  const t = await getTranslations("tours");
  return { title: t("type_group") };
}

export default async function GroupToursPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("tours");
  const tours = await getTours({ type: "group" }, locale);

  return (
    <div className="mx-auto max-w-6xl px-4 py-16 md:px-6">
      <PageHeader
        eyebrow={t("listEyebrow")}
        title={t("type_group")}
        subtitle={t("groupIntro")}
      />
      {tours.length === 0 ? (
        <p className="mt-14 text-muted">{t("empty")}</p>
      ) : (
        <div className="mt-14 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {tours.map((tour) => (
            <TourCard key={tour.slug} tour={tour} />
          ))}
        </div>
      )}
    </div>
  );
}
