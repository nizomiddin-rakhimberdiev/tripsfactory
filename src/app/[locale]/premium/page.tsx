import Image from "next/image";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { getTours } from "@/lib/content";

export async function generateMetadata() {
  const t = await getTranslations("premium");
  return { title: t("navLabel"), description: t("heroSubtitle") };
}

export default async function PremiumPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("premium");
  const premiumTours = await getTours({ tier: "premium" });

  return (
    <div className="bg-background text-foreground">
      <section className="relative flex min-h-[85vh] items-center justify-center overflow-hidden">
        <Image
          src="https://images.unsplash.com/photo-1528164344705-47542687000d?w=2000"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover opacity-50"
        />
        <div className="relative z-10 mx-auto max-w-3xl px-4 text-center">
          <p className="mb-4 text-sm uppercase tracking-[0.3em] text-primary">
            TripsFactory {t("navLabel")}
          </p>
          <h1 className="font-[family-name:var(--font-playfair)] text-5xl font-medium leading-tight sm:text-7xl">
            {t("heroTitle")}
          </h1>
          <p className="mt-6 text-lg text-muted">{t("heroSubtitle")}</p>
          <a
            href="#enquire"
            className="mt-10 inline-block border border-primary px-10 py-4 text-sm uppercase tracking-widest text-primary transition-colors hover:bg-primary hover:text-primary-foreground"
          >
            {t("cta")}
          </a>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-24">
        <div className="grid gap-12 md:grid-cols-3">
          {(["concierge", "access", "stays"] as const).map((key) => (
            <div key={key} className="text-center">
              <h3 className="font-[family-name:var(--font-playfair)] text-2xl text-primary">
                {t(key)}
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-muted">
                {t(`${key}Text`)}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-24">
        <div className="grid gap-10 md:grid-cols-2">
          {premiumTours.map((tour) => (
            <Link
              key={tour.slug}
              href={`/tours/${tour.countrySlug}/${tour.slug}`}
              className="group"
            >
              <div className="relative aspect-[4/3] overflow-hidden">
                <Image
                  src={tour.heroImage}
                  alt={tour.title}
                  fill
                  sizes="(max-width: 768px) 100vw, 50vw"
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                />
              </div>
              <h3 className="mt-5 font-[family-name:var(--font-playfair)] text-2xl">
                {tour.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                {tour.summary}
              </p>
              <p className="mt-3 text-xs uppercase tracking-widest text-primary">
                {t("onRequest")}
              </p>
            </Link>
          ))}
        </div>
      </section>

      <section id="enquire" className="border-t border-border py-24 text-center">
        <h2 className="font-[family-name:var(--font-playfair)] text-3xl">
          {t("enquire")}
        </h2>
        <p className="mt-4 text-muted">premium@tripsfactory.uz</p>
      </section>
    </div>
  );
}
