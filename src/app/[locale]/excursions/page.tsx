import { notFound } from "next/navigation";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { flags } from "@/lib/flags";
import { pageMeta } from "@/lib/seo";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/EmptyState";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "nav" });
  return pageMeta({ locale, path: "/excursions", title: t("excursions") });
}

/**
 * Events (day trips and excursions) — routed and linked from the navigation.
 * The catalog itself is not built yet, so the page states that plainly and
 * offers a way forward rather than showing an empty grid.
 */
export default async function ExcursionsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  if (!flags.excursions) notFound();
  const { locale } = await params;
  setRequestLocale(locale);
  const [nav, tours] = await Promise.all([
    getTranslations("nav"),
    getTranslations("tours"),
  ]);

  return (
    <div className="tf-section mx-auto max-w-6xl px-4 md:px-6">
      <PageHeader title={nav("excursions")} />
      <EmptyState
        message={tours("empty")}
        actionHref="/contact"
        actionLabel={nav("contact")}
      />
    </div>
  );
}
