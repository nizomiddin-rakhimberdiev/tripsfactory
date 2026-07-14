import Image from "next/image";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { getPublishedCountries, getRegions } from "@/lib/content";

export async function generateMetadata() {
  const t = await getTranslations("destinations");
  return { title: t("title") };
}

export default async function DestinationsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("destinations");
  const [regionList, countryList] = await Promise.all([
    getRegions(),
    getPublishedCountries(),
  ]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <h1 className="mb-10 text-4xl font-bold">{t("title")}</h1>
      {regionList.map((region) => {
        const regionCountries = countryList.filter(
          (c) => c.regionSlug === region.slug,
        );
        if (regionCountries.length === 0) return null;
        return (
          <section key={region.slug} className="mb-12">
            <h2 className="mb-6 text-2xl font-semibold">{region.name}</h2>
            <div className="grid gap-6 sm:grid-cols-2">
              {regionCountries.map((c) => (
                <Link
                  key={c.slug}
                  href={`/destinations/${c.regionSlug}/${c.slug}`}
                  className="group overflow-hidden rounded-xl border border-border"
                >
                  <div className="relative aspect-[2/1]">
                    <Image
                      src={c.heroImage}
                      alt={c.name}
                      fill
                      sizes="(max-width: 640px) 100vw, 50vw"
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  </div>
                  <div className="p-4">
                    <h3 className="text-lg font-semibold">{c.name}</h3>
                    <p className="mt-1 line-clamp-2 text-sm text-muted">
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
  );
}
