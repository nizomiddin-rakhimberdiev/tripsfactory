import { setRequestLocale, getTranslations } from "next-intl/server";
import { LeadForm } from "@/components/forms/LeadForm";
import { PageHeader } from "@/components/PageHeader";

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
    <div className="tf-section mx-auto max-w-3xl px-4 md:px-6">
      <PageHeader title={t("title")} subtitle={t("subtitle")} />
      <div className="tf-card mt-10 p-6 sm:p-9">
        <LeadForm />
      </div>
    </div>
  );
}
