import { setRequestLocale, getTranslations } from "next-intl/server";
import { LeadForm } from "@/components/forms/LeadForm";

export async function generateMetadata() {
  const t = await getTranslations("contact");
  return { title: t("title") };
}

export default async function ContactPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("contact");

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="mb-2 text-4xl font-bold">{t("title")}</h1>
      <p className="mb-8 text-muted">{t("subtitle")}</p>
      <div className="rounded-2xl bg-surface p-6 sm:p-8">
        <LeadForm />
      </div>
    </div>
  );
}
