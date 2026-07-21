import { setRequestLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { getGuides } from "@/lib/content";
import { PageHeader } from "@/components/PageHeader";
import { IconArrowRight } from "@/components/icons";

// Content is editable in /admin — re-render periodically (ISR)
export const revalidate = 300;

export async function generateMetadata() {
  const t = await getTranslations("guide");
  return { title: t("title") };
}

export default async function GuideIndexPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("guide");
  const guideList = await getGuides(undefined, locale);

  return (
    <div className="mx-auto max-w-4xl px-4 py-16 md:px-6">
      <PageHeader title={t("title")} />
      <ul className="mt-12 space-y-4">
        {guideList.map((g) => (
          <li key={g.slug}>
            <Link
              href={`/guide/${g.slug}`}
              className="tf-card group flex items-center gap-5 p-6 transition-shadow hover:shadow-[0_12px_32px_rgb(0_0_0/0.08)]"
            >
              <div className="flex-1">
                <h2 className="tf-headline text-xl">{g.title}</h2>
                <p className="mt-1 line-clamp-2 text-sm text-muted">
                  {g.sections[0]?.body}
                </p>
              </div>
              <IconArrowRight className="shrink-0 text-xl text-primary transition-transform group-hover:translate-x-1" />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
