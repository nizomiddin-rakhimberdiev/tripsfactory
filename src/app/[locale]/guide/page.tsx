import { setRequestLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { pageMeta } from "@/lib/seo";
import { getGuides } from "@/lib/content";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/EmptyState";
import { IconArrowRight } from "@/components/icons";

// ISR safety net only: every Studio save triggers on-demand revalidation
// (revalidateSite in payload.config.ts), so content is never this stale. The
// window exists for edits made outside a Next request — seed scripts, raw SQL.
export const revalidate = 86400;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "guide" });
  return pageMeta({
    locale,
    path: "/guide",
    title: t("title"),
  });
}

export default async function GuideIndexPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const [t, tours] = await Promise.all([
    getTranslations("guide"),
    getTranslations("tours"),
  ]);
  const guideList = await getGuides(undefined, locale);

  return (
    <div className="tf-section mx-auto max-w-4xl px-4 md:px-6">
      <PageHeader title={t("title")} />
      {guideList.length === 0 ? (
        <EmptyState
          message={t("empty")}
          actionHref="/tours"
          actionLabel={tours("title")}
        />
      ) : (
        <ul className="mt-12 space-y-4">
          {guideList.map((g) => (
            <li key={g.slug}>
              <Link
                href={`/guide/${g.slug}`}
                className="tf-card tf-card-interactive group flex items-center gap-5 p-7"
              >
                <div className="flex-1">
                  <h2 className="tf-headline text-2xl">{g.title}</h2>
                  <p className="mt-1 line-clamp-2 text-sm text-muted">
                    {g.sections[0]?.body}
                  </p>
                </div>
                <IconArrowRight className="shrink-0 text-xl text-primary transition-transform group-hover:translate-x-1" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
