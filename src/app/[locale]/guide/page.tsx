import { setRequestLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { getGuides } from "@/lib/content";

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
    <div className="mx-auto max-w-4xl px-4 py-12">
      <h1 className="mb-8 text-4xl font-bold">{t("title")}</h1>
      <ul className="space-y-4">
        {guideList.map((g) => (
          <li key={g.slug}>
            <Link
              href={`/guide/${g.slug}`}
              className="block rounded-xl border border-border p-5 transition-shadow hover:shadow-md"
            >
              <h2 className="text-lg font-semibold">{g.title}</h2>
              <p className="mt-1 line-clamp-2 text-sm text-muted">
                {g.sections[0]?.body}
              </p>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
