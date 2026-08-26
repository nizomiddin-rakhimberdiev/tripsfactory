import { setRequestLocale, getTranslations } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { flags } from "@/lib/flags";
import { getExcursions } from "@/lib/content";
import { pageMeta } from "@/lib/seo";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/EmptyState";
import { ExcursionCard } from "@/components/tours/ExcursionCard";

// ISR safety net only: every Studio save triggers on-demand revalidation
// (revalidateSite in payload.config.ts), so content is never this stale.
export const revalidate = 86400;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "excursions" });
  return pageMeta({
    locale,
    path: "/excursions",
    title: t("title"),
    description: t("listIntro"),
  });
}

/** Events — day trips, bought by the seat. */
export default async function ExcursionsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  // Hidden, not deleted. These URLs have been live — they sit in inboxes and
  // in search results — so a visitor following one is sent to the home page
  // rather than shown a 404 they did nothing to deserve. Localized, so a /ja/
  // link does not land on the English home page.
  if (!flags.excursions) redirect({ href: "/", locale });
  const [t, nav, excursions] = await Promise.all([
    getTranslations("excursions"),
    getTranslations("nav"),
    getExcursions(undefined, locale),
  ]);

  return (
    <div className="tf-section mx-auto max-w-6xl px-4 md:px-6">
      <PageHeader
        eyebrow={t("listEyebrow")}
        title={t("title")}
        subtitle={t("listIntro")}
      />

      {excursions.length === 0 ? (
        <EmptyState
          message={t("empty")}
          actionHref="/contact"
          actionLabel={nav("contact")}
        />
      ) : (
        <div className="mt-14 grid grid-cols-2 gap-4 sm:gap-8 lg:grid-cols-3">
          {excursions.map((x) => (
            <ExcursionCard key={x.slug} excursion={x} headingLevel={2} />
          ))}
        </div>
      )}
    </div>
  );
}
