import { notFound } from "next/navigation";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { flags } from "@/lib/flags";

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
    <div className="mx-auto max-w-6xl px-4 py-12">
      <h1 className="text-4xl font-bold">{t("excursions")}</h1>
      {/* Day-trip catalog renders here once the excursions content collection lands */}
    </div>
  );
}
