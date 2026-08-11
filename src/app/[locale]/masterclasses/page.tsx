import { notFound } from "next/navigation";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { flags } from "@/lib/flags";
import { getMasterclasses } from "@/lib/content";
import { pageMeta } from "@/lib/seo";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/EmptyState";
import { MasterclassCard } from "@/components/tours/MasterclassCard";

// ISR safety net only: every Studio save triggers on-demand revalidation
// (revalidateSite in payload.config.ts), so content is never this stale.
export const revalidate = 86400;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "masterclasses" });
  return pageMeta({
    locale,
    path: "/masterclasses",
    title: t("title"),
    description: t("listIntro"),
  });
}

export default async function MasterclassesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  if (!flags.masterclasses) notFound();
  const { locale } = await params;
  setRequestLocale(locale);
  const [t, nav, classes] = await Promise.all([
    getTranslations("masterclasses"),
    getTranslations("nav"),
    getMasterclasses(locale),
  ]);

  return (
    <div className="tf-section mx-auto max-w-6xl px-4 md:px-6">
      <PageHeader
        eyebrow={t("listEyebrow")}
        title={t("title")}
        subtitle={t("listIntro")}
      />

      {classes.length === 0 ? (
        <EmptyState
          message={t("empty")}
          actionHref="/contact"
          actionLabel={nav("contact")}
        />
      ) : (
        <div className="mt-14 grid grid-cols-2 gap-4 sm:gap-8 lg:grid-cols-3">
          {classes.map((m) => (
            <MasterclassCard key={m.slug} masterclass={m} headingLevel={2} />
          ))}
        </div>
      )}
    </div>
  );
}
