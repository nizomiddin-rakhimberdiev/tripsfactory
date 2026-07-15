import Image from "next/image";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { getPublishedCountries, getTours } from "@/lib/content";
import { TourCard } from "@/components/tours/TourCard";

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("home");
  const [featured, countryList] = await Promise.all([
    getTours({ featuredOnly: true }, locale),
    getPublishedCountries(locale),
  ]);

  return (
    <>
      <section className="relative flex min-h-[70vh] items-center justify-center overflow-hidden">
        <Image
          src="https://images.unsplash.com/photo-1596306499317-8490232098fa?w=2000"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-black/40" />
        <div className="relative z-10 mx-auto max-w-3xl px-4 text-center text-white">
          <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
            {t("heroTitle")}
          </h1>
          <p className="mt-4 text-lg text-white/90">{t("heroSubtitle")}</p>
          <Link
            href="/tours"
            className="mt-8 inline-block rounded-full bg-primary px-8 py-3 font-medium text-primary-foreground transition-colors hover:bg-primary-hover"
          >
            {t("heroCta")}
          </Link>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16">
        <h2 className="mb-8 text-3xl font-bold">{t("featuredTours")}</h2>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {featured.map((tour) => (
            <TourCard key={tour.slug} tour={tour} />
          ))}
        </div>
      </section>

      <section className="bg-surface py-16">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="mb-8 text-3xl font-bold">{t("whyUs")}</h2>
          <div className="grid gap-8 md:grid-cols-3">
            {(["whyLocal", "whyGuaranteed", "whyTailored"] as const).map(
              (key) => (
                <div key={key}>
                  <h3 className="mb-2 text-lg font-semibold text-primary">
                    {t(key)}
                  </h3>
                  <p className="text-muted">{t(`${key}Text`)}</p>
                </div>
              ),
            )}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16">
        <h2 className="mb-8 text-3xl font-bold">{t("exploreDestinations")}</h2>
        <div className="grid gap-6 sm:grid-cols-2">
          {countryList.map((c) => (
            <Link
              key={c.slug}
              href={`/destinations/${c.regionSlug}/${c.slug}`}
              className="group relative aspect-[2/1] overflow-hidden rounded-xl"
            >
              <Image
                src={c.heroImage}
                alt={c.name}
                fill
                sizes="(max-width: 640px) 100vw, 50vw"
                className="object-cover transition-transform duration-300 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              <span className="absolute bottom-4 left-4 text-xl font-semibold text-white">
                {c.name}
              </span>
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}
