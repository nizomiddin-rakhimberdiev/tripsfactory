import { notFound } from "next/navigation";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { flags } from "@/lib/flags";
import { PageHeader } from "@/components/PageHeader";

/**
 * Excursions catalog — fully routed but gated behind flags.excursions.
 * Flipping the flag exposes the nav entry (Header) and this page.
 */
export default async function ExcursionsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  if (!flags.excursions) notFound();
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("nav");

  return (
    <div className="tf-section mx-auto max-w-6xl px-4 md:px-6">
      <PageHeader title={t("excursions")} />
      {/* Day-trip catalog renders here once the excursions content collection lands */}
    </div>
  );
}
