import Image from "next/image";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { pageMeta } from "@/lib/seo";
import { getPublishedCountries, getRegions } from "@/lib/content";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/EmptyState";

// Content is editable in /admin — re-render periodically (ISR)
export const revalidate = 300;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "destinations" });
  return pageMeta({
    locale,
    path: "/destinations",
    title: t("title"),
  });
}

export default async function DestinationsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const [t, tours] = await Promise.all([
    getTranslations("destinations"),
    getTranslations("tours"),
  ]);
  const [regionList, countryList] = await Promise.all([
    getRegions(locale),
    getPublishedCountries(locale),
  ]);

  return (
    <div className="tf-section mx-auto max-w-6xl px-4 md:px-6">
      <PageHeader
        eyebrow={t("curated")}
        title={t("title")}
        subtitle={t("indexIntro")}
      />
      {countryList.length === 0 ? (
        <EmptyState
          message={t("empty")}
          actionHref="/tours"
          actionLabel={tours("title")}
        />
      ) : (
        <div className="mt-14 space-y-16">
          {regionList.map((region) => {
            const regionCountries = countryList.filter(
              (c) => c.regionSlug === region.slug,
            );
            if (regionCountries.length === 0) return null;
            return (
              <section key={region.slug}>
                <h2 className="tf-headline mb-6 text-2xl">{region.name}</h2>
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {regionCountries.map((c) => (
                    <Link
                      key={c.slug}
                      href={`/destinations/${c.regionSlug}/${c.slug}`}
                      className="group relative aspect-[3/4] overflow-hidden rounded-xl"
                    >
                      <Image
                        src={c.heroImage}
                        alt={c.name}
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        className="object-cover transition-transform duration-[1200ms] ease-luxe group-hover:scale-[1.06]"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/15 to-transparent" />
                      <div className="absolute inset-x-5 bottom-5">
                        <h3 className="tf-headline text-2xl text-white">
                          {c.name}
                        </h3>
                        <p className="mt-1 line-clamp-2 text-sm text-white/80">
                          {c.intro}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
