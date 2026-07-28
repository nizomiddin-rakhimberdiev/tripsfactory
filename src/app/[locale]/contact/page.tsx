import { setRequestLocale, getTranslations } from "next-intl/server";
import { LeadForm } from "@/components/forms/LeadForm";
import { pageMeta } from "@/lib/seo";
import { PageHeader } from "@/components/PageHeader";
import { ADDRESS_LINE, EMAIL, HOURS, PHONE, TELEGRAM } from "@/lib/business";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "contact" });
  return pageMeta({
    locale,
    path: "/contact",
    title: t("title"),
  });
}

export default async function ContactPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("contact");

  const details = [
    {
      label: t("phone"),
      value: PHONE.display,
      href: `tel:${PHONE.href}`,
    },
    { label: t("email"), value: EMAIL, href: `mailto:${EMAIL}` },
    { label: "Telegram", value: "@tripsfactory_uzb", href: TELEGRAM },
    {
      // UTC offset rather than a city name: it needs no translation and is
      // what a visitor in Tokyo or Madrid actually has to do the arithmetic on.
      label: t("hours"),
      value: `${HOURS.from} – ${HOURS.to} (UTC+5)`,
      href: null,
    },
    { label: t("address"), value: ADDRESS_LINE, href: null },
  ];

  return (
    <div className="tf-section mx-auto max-w-3xl px-4 md:px-6">
      <PageHeader title={t("title")} subtitle={t("subtitle")} />

      {/* The page was a form and nothing else — no number, no address, no way
          to reach a person. For a operator selling multi-thousand-dollar
          journeys to strangers abroad, being reachable before you pay is the
          whole trust question. */}
      <dl className="mt-10 grid gap-x-10 gap-y-6 sm:grid-cols-2">
        {details.map((d) => (
          <div key={d.label}>
            <dt className="tf-eyebrow tf-eyebrow-sm mb-1.5 text-muted">
              {d.label}
            </dt>
            <dd className="text-[0.95rem] leading-relaxed">
              {d.href ? (
                <a
                  href={d.href}
                  {...(d.href.startsWith("http")
                    ? { target: "_blank", rel: "noopener noreferrer" }
                    : {})}
                  className="tf-link"
                >
                  {d.value}
                </a>
              ) : (
                d.value
              )}
            </dd>
          </div>
        ))}
      </dl>

      <div className="tf-card mt-10 p-6 sm:p-9">
        <LeadForm />
      </div>
    </div>
  );
}
