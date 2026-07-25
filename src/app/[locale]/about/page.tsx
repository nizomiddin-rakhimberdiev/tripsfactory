import { setRequestLocale, getTranslations } from "next-intl/server";
import { PageHeader } from "@/components/PageHeader";
import { pageMeta } from "@/lib/seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "about" });
  return pageMeta({
    locale,
    path: "/about",
    title: t("title"),
  });
}

export default async function AboutPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("about");

  return (
    <div className="tf-section mx-auto max-w-3xl px-4 md:px-6">
      <PageHeader eyebrow={t("eyebrow")} title={t("title")} />
      <p className="mt-8 text-lg leading-relaxed text-muted">{t("text")}</p>
    </div>
  );
}
