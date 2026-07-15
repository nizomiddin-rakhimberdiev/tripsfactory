import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { getGuide, getGuides } from "@/lib/content";
import { locales } from "@/i18n/routing";

type Params = { locale: string; slug: string };

export async function generateStaticParams() {
  const guideList = await getGuides();
  return locales.flatMap((locale) =>
    guideList.map((g) => ({ locale, slug: g.slug })),
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}) {
  const { locale, slug } = await params;
  const guide = await getGuide(slug, locale);
  if (!guide) return {};
  return { title: guide.title, description: guide.sections[0]?.body };
}

export default async function GuidePage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const guide = await getGuide(slug, locale);
  if (!guide) notFound();

  return (
    <article className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="mb-8 text-4xl font-bold">{guide.title}</h1>
      {guide.sections.map((s) => (
        <section key={s.heading} className="mb-8">
          <h2 className="mb-2 text-2xl font-semibold">{s.heading}</h2>
          <p className="leading-relaxed text-muted">{s.body}</p>
        </section>
      ))}
    </article>
  );
}
