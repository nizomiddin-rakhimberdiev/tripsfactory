import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { getGuide, getGuides } from "@/lib/content";
import { locales } from "@/i18n/routing";

type Params = { locale: string; slug: string };

// Content is editable in /admin — re-render periodically (ISR)
export const revalidate = 300;

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
    <article className="mx-auto max-w-3xl px-4 py-16 md:px-6">
      <h1 className="tf-display mb-10 text-4xl sm:text-5xl">{guide.title}</h1>
      {guide.sections.map((s) => (
        <section key={s.heading} className="mb-10">
          <h2 className="tf-headline mb-3 text-2xl">{s.heading}</h2>
          <p className="leading-relaxed text-muted">{s.body}</p>
        </section>
      ))}
    </article>
  );
}
